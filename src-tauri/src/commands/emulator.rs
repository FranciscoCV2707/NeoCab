use tauri::State;
use serde_json::json;
use crate::core::{EmulatorManager, TimerManager};

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
    emulator_manager: State<'_, EmulatorManager>,
) -> Result<String, String> {
    // Determine which emulator to use
    let emu = if let Some(e) = emulator {
        e
    } else if let Some(sys) = system {
        emulator_manager
            .get_recommended_emulator(&sys)
            .unwrap_or_else(|| "mame".to_string())
    } else {
        "mame".to_string()
    };

    let result = json!({
        "success": true,
        "game_id": game_id,
        "emulator": emu,
        "message": format!("Game launched with {}", emu)
    });

    Ok(result.to_string())
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
    timer_manager: State<'_, TimerManager>,
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
