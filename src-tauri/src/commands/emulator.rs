use crate::core::{ConfigManager, EmulatorManager, TimerManager};
use crate::db::Database;
use serde_json::json;
use std::sync::Arc;
use std::path::PathBuf;
use tauri::{Emitter, State, Manager};

// Static catalog — display info that doesn't change at runtime
fn emulator_catalog() -> Vec<serde_json::Value> {
    let entries: &[(&str, &str, &str, &[&str])] = &[
        ("mame",        "MAME",        "mame.exe",               &["Arcade", "MAME"]),
        ("retroarch",   "RetroArch",   "retroarch.exe",          &["NES", "SNES", "Genesis", "GB", "GBC", "GBA", "PS1", "N64"]),
        ("teknoparrot", "TeknoParrot", "ParrotLoader64.exe",      &["Arcade PC", "Namco", "Sega", "Taito"]),
        ("pcsx2",       "PCSX2",       "pcsx2-qt.exe",           &["PlayStation 2"]),
        ("dolphin",     "Dolphin",     "Dolphin.exe",            &["GameCube", "Wii"]),
        ("duckstation", "DuckStation", "duckstation-qt.exe",     &["PlayStation 1"]),
        ("ppsspp",      "PPSSPP",      "PPSSPPWindows64.exe",    &["PSP"]),
        ("xenia",       "Xenia",       "xenia.exe",              &["Xbox 360"]),
        ("rpcs3",       "RPCS3",       "rpcs3.exe",              &["PlayStation 3"]),
        ("cemu",        "Cemu",        "Cemu.exe",               &["Wii U"]),
        ("yuzu",        "Yuzu",        "yuzu.exe",               &["Nintendo Switch"]),
        ("ryujinx",     "Ryujinx",     "Ryujinx.exe",            &["Nintendo Switch"]),
        ("mgba",        "mGBA",        "mgba.exe",               &["GBA", "GB", "GBC"]),
        ("flycast",     "Flycast",     "flycast.exe",            &["Dreamcast", "Naomi", "Atomiswave"]),
    ];
    entries
        .iter()
        .map(|(id, name, default_exe, systems)| {
            json!({
                "id": id,
                "name": name,
                "default_exe": default_exe,
                "systems": systems,
            })
        })
        .collect()
}

#[tauri::command]
pub async fn get_emulator_info_list(
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<serde_json::Value, String> {
    let config = config_manager.get_config().await;
    let paths = &config.emulators.paths;

    let emulators: Vec<serde_json::Value> = emulator_catalog()
        .into_iter()
        .map(|mut entry| {
            let id = entry["id"].as_str().unwrap_or("").to_string();
            let configured_path = paths.get(&id).cloned().unwrap_or_default();
            let exists = !configured_path.is_empty()
                && std::path::Path::new(&configured_path).exists();
            entry["configured_path"] = json!(configured_path);
            entry["path_exists"] = json!(exists);
            entry
        })
        .collect();

    Ok(json!({ "emulators": emulators }))
}

#[tauri::command]
pub async fn set_emulator_path(
    id: String,
    path: String,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<(), String> {
    config_manager
        .set_emulator_path(id, path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn detect_emulator_path(id: String) -> Result<String, String> {
    let catalog = emulator_catalog();
    let default_exe = catalog
        .iter()
        .find(|e| e["id"] == id)
        .and_then(|e| e["default_exe"].as_str())
        .unwrap_or("")
        .to_string();

    if default_exe.is_empty() {
        return Ok(String::new());
    }

    // Common install directories to search
    let search_dirs = [
        format!("C:\\Program Files\\{}", id),
        format!("C:\\Program Files (x86)\\{}", id),
        format!("C:\\emulators\\{}", id),
        "C:\\emulators".to_string(),
        ".".to_string(),
    ];

    for dir in &search_dirs {
        let candidate = std::path::Path::new(dir).join(&default_exe);
        if candidate.exists() {
            return Ok(candidate.to_string_lossy().to_string());
        }
    }

    // Also check PATH
    if let Ok(output) = std::process::Command::new("where").arg(&default_exe).output() {
        if output.status.success() {
            let found = String::from_utf8_lossy(&output.stdout)
                .lines()
                .next()
                .unwrap_or("")
                .trim()
                .to_string();
            if !found.is_empty() {
                return Ok(found);
            }
        }
    }

    Ok(String::new())
}

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

    // Trigger Lua plugin hook OnGameLaunch
    if let Some(plugin_state) = app_handle.try_state::<crate::core::plugin_engine::PluginState>() {
        if let Ok(engine) = plugin_state.0.lock() {
            let base_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./data"));
            let ctx = crate::core::plugin_engine::PluginContext::new(base_dir)
                .with_game(&game.title, &emu);
            let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnGameLaunch, ctx);
        }
    }

    // Trigger HardwareScriptEngine GameLaunched
    if let Some(hw_script_state) = app_handle.try_state::<Arc<tokio::sync::Mutex<crate::core::HardwareScriptEngine>>>() {
        let hw_clone = hw_script_state.inner().clone();
        tokio::spawn(async move {
            let lock = hw_clone.lock().await;
            let _ = lock.trigger_event(crate::core::HardwareEvent::GameLaunched).await;
        });
    }

    // 5. Launch the game via EmulatorManager
    match emulator_manager.launch_game(&game, &emu).await {
        Ok(_) => {
            // Hide main and marquee windows to suspend rendering & free RAM/GPU memory
            if let Some(main_window) = app_handle.get_webview_window("main") {
                let _ = main_window.hide();
            }
            if let Some(marquee_window) = app_handle.get_webview_window("marquee") {
                let _ = marquee_window.hide();
            }

            // Start monitoring process
            let app_clone = app_handle.clone();
            if let Some(adapter) = emulator_manager.get_adapter(&emu) {
                // Raise emulator priority and lower frontend priority
                if let Some(pid) = adapter.get_pid().await {
                    crate::utils::raise_process_priority(pid);
                }

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

                    // Process finished: restore windows
                    if let Some(main_window) = app_clone.get_webview_window("main") {
                        let _ = main_window.show();
                        let _ = main_window.set_focus();
                    }
                    if let Some(marquee_window) = app_clone.get_webview_window("marquee") {
                        let _ = marquee_window.show();
                    }

                    // Restore own process priority
                    crate::utils::restore_own_priority();

                    // Process finished
                    let elapsed = start_time.elapsed().as_secs() as i64;
                    if elapsed > 10 {
                        // Only count if played for more than 10 seconds
                        let _ = db_clone.update_play_stats(game_id, elapsed).await;
                    }

                    // Trigger Lua plugin hook OnGameEnd
                    if let Some(plugin_state) = app_clone.try_state::<crate::core::plugin_engine::PluginState>() {
                        if let Ok(engine) = plugin_state.0.lock() {
                            let base_dir = app_clone.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./data"));
                            let ctx = crate::core::plugin_engine::PluginContext::new(base_dir);
                            let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnGameEnd, ctx);
                        }
                    }

                    // Trigger HardwareScriptEngine GameStopped
                    if let Some(hw_script_state) = app_clone.try_state::<Arc<tokio::sync::Mutex<crate::core::HardwareScriptEngine>>>() {
                        let hw_clone = hw_script_state.inner().clone();
                        tokio::spawn(async move {
                            let lock = hw_clone.lock().await;
                            let _ = lock.trigger_event(crate::core::HardwareEvent::GameStopped).await;
                        });
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
