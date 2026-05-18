use crate::core::{EmulatorManager, TimerManager};
use crate::db::Database;
use serde_json::json;
use std::sync::Arc;
use tauri::{Emitter, State};

#[tauri::command]
pub async fn list_emulators(
    emulator_manager: State<'_, EmulatorManager>,
) -> Result<String, String> {
    let adapters = emulator_manager.list_adapters();

    let result = json!({
        "emulators": adapters,
        "count": adapters.len()
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn launch_game(
    game_id: i64,
    emulator: Option<String>,
    system: Option<String>,
    app_handle: tauri::AppHandle,
    emulator_manager: State<'_, EmulatorManager>,
    input_manager: State<'_, crate::input::InputManager>,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    // 1. Get game from DB
    let game = match db.get_game_by_id(game_id).await {
        Ok(Some(g)) => g,
        Ok(None) => return Err("Game not found".to_string()),
        Err(e) => return Err(e.to_string()),
    };

    // 2. Determine which emulator to use
    let emu = if let Some(e) = emulator {
        e
    } else if let Some(sys) = system {
        emulator_manager
            .get_recommended_emulator(&sys)
            .unwrap_or_else(|| "mame".to_string())
    } else {
        "mame".to_string()
    };

    // 3. Emit start event for Fade Overlay
    let _ = app_handle.emit(
        "game_launch_start",
        json!({
            "game": game.title,
            "system": game.system_id
        }),
    );

    // 4. Load JoyMapper profile automatically
    let _ = input_manager.load_profile_for_system(&emu).await;

    // 5. Launch the game via EmulatorManager
    match emulator_manager.launch_game(&game, &emu).await {
        Ok(_) => {
            // Start monitoring process
            let app_clone = app_handle.clone();
            if let Some(adapter) = emulator_manager.get_adapter(&emu) {
                let db_clone = db.inner().clone();
                tokio::spawn(async move {
                    // Let frontend know we're ready
                    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                    let _ = app_clone.emit("game_launch_ready", ());

                    let start_time = std::time::Instant::now();

                    // Poll until the process finishes
                    loop {
                        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                        if !adapter.is_running().await {
                            break;
                        }
                    }

                    // Process finished
                    let elapsed = start_time.elapsed().as_secs() as i64;
                    if elapsed > 10 {
                        // Only count if played for more than 10 seconds
                        let _ = db_clone.update_play_stats(game_id, elapsed).await;
                    }
                    let _ = app_clone.emit("game_launch_finished", ());
                });
            }

            let result = json!({
                "success": true,
                "game_id": game_id,
                "emulator": emu,
                "message": format!("Game launched with {}", emu)
            });
            Ok(result.to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_recommended_emulator(
    system: String,
    emulator_manager: State<'_, EmulatorManager>,
) -> Result<String, String> {
    let recommended = emulator_manager
        .get_recommended_emulator(&system)
        .unwrap_or_else(|| "mame".to_string());

    let result = json!({
        "success": true,
        "system": system,
        "recommended_emulator": recommended
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn stop_game(
    emulator: String,
    emulator_manager: State<'_, EmulatorManager>,
) -> Result<String, String> {
    match emulator_manager.stop_game(&emulator).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "emulator": emulator,
                "message": format!("Game stopped on {}", emulator)
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn check_timer_timeout(
    emulator: String,
    auto_exit: bool,
    emulator_manager: State<'_, EmulatorManager>,
    timer_manager: State<'_, Arc<TimerManager>>,
) -> Result<serde_json::Value, String> {
    let is_time_up = timer_manager.is_time_up().await;
    let remaining = timer_manager.get_remaining_seconds().await;

    let result = json!({
        "time_up": is_time_up,
        "remaining_seconds": remaining,
        "stopped": false
    });

    // Auto-stop game if time is up and auto_exit is enabled
    if is_time_up && auto_exit {
        match emulator_manager.stop_game(&emulator).await {
            Ok(_) => {
                return Ok(json!({
                    "time_up": true,
                    "remaining_seconds": remaining,
                    "stopped": true,
                    "message": "Game stopped due to timeout"
                }));
            }
            Err(e) => {
                return Err(format!("Failed to stop game: {}", e));
            }
        }
    }

    Ok(result)
}
