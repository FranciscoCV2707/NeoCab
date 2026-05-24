use crate::core::{ArcadeConfig, SessionConfig, SessionManager, SessionMode, TimedConfig};
use serde_json::json;
use std::sync::Arc;
use std::path::PathBuf;
use tauri::{Emitter, State, Manager};

#[tauri::command]
pub async fn session_insert_coin(
    session_manager: State<'_, Arc<SessionManager>>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    match session_manager.insert_coin().await {
        Ok(state) => {
            let event_name = match &state {
                crate::core::SessionState::CreditAdded { .. } => "coin_inserted",
                crate::core::SessionState::TimeAdded { .. } => "time_added",
                _ => "session_update",
            };
            let _ = app.emit(event_name, serde_json::to_value(&state).unwrap_or_default());
            Ok(json!({ "success": true, "state": state }).to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_start(
    system_name: String,
    session_manager: State<'_, Arc<SessionManager>>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    match session_manager.start_session(&system_name).await {
        Ok(state) => {
            // Trigger Lua plugin hook OnSessionStart
            if let Some(plugin_state) = app.try_state::<crate::core::plugin_engine::PluginState>() {
                if let Ok(engine) = plugin_state.0.lock() {
                    let base_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./data"));
                    let ctx = crate::core::plugin_engine::PluginContext::new(base_dir)
                        .with_game("", &system_name);
                    let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnSessionStart, ctx);
                }
            }

            let _ = app.emit(
                "session_started",
                serde_json::to_value(&state).unwrap_or_default(),
            );
            Ok(json!({ "success": true, "state": state }).to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_check(
    session_manager: State<'_, Arc<SessionManager>>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    match session_manager.check_session().await {
        Ok(state) => {
            if let crate::core::SessionState::Warning { remaining_seconds } = &state {
                let _ = app.emit(
                    "timer_warning",
                    json!({ "remaining_seconds": remaining_seconds }),
                );

                // Trigger Lua plugin hook OnTimerWarning
                if let Some(plugin_state) = app.try_state::<crate::core::plugin_engine::PluginState>() {
                    if let Ok(engine) = plugin_state.0.lock() {
                        let base_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./data"));
                        let ctx = crate::core::plugin_engine::PluginContext::new(base_dir)
                            .with_session(*remaining_seconds as i64, 0);
                        let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnTimerWarning, ctx);
                    }
                }
            } else if let crate::core::SessionState::SessionExpired = &state {
                let _ = app.emit("time_expired", json!({}));

                // Trigger Lua plugin hook OnTimeExpired
                if let Some(plugin_state) = app.try_state::<crate::core::plugin_engine::PluginState>() {
                    if let Ok(engine) = plugin_state.0.lock() {
                        let base_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./data"));
                        let ctx = crate::core::plugin_engine::PluginContext::new(base_dir);
                        let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnTimeExpired, ctx);
                    }
                }
            }
            Ok(json!({ "success": true, "state": state }).to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_pause(
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    match session_manager.pause_session().await {
        Ok(state) => Ok(json!({ "success": true, "state": state }).to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_resume(
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    match session_manager.resume_session().await {
        Ok(state) => Ok(json!({ "success": true, "state": state }).to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_end(
    session_manager: State<'_, Arc<SessionManager>>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    match session_manager.end_session().await {
        Ok(state) => {
            // Trigger Lua plugin hook OnSessionEnd
            if let Some(plugin_state) = app.try_state::<crate::core::plugin_engine::PluginState>() {
                if let Ok(engine) = plugin_state.0.lock() {
                    let base_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("./data"));
                    let ctx = crate::core::plugin_engine::PluginContext::new(base_dir);
                    let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnSessionEnd, ctx);
                }
            }

            Ok(json!({ "success": true, "state": state }).to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_add_time(
    minutes: u32,
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    match session_manager.add_time(minutes).await {
        Ok(state) => Ok(json!({ "success": true, "state": state }).to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_get_status(
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    match session_manager.get_status().await {
        Ok(status) => Ok(json!({ "success": true, "status": status }).to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_get_config(
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    let config = session_manager.get_config().await;
    Ok(json!({ "success": true, "config": config }).to_string())
}

#[tauri::command]
pub async fn session_set_config(
    config: String,
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    let session_config: SessionConfig = match serde_json::from_str(&config) {
        Ok(c) => c,
        Err(e) => return Err(format!("Invalid config JSON: {}", e)),
    };
    session_manager.set_config(session_config.clone()).await;
    Ok(json!({ "success": true, "config": session_config }).to_string())
}

#[tauri::command]
pub async fn session_set_system_mode(
    system_name: String,
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    match session_manager.set_system_mode(&system_name).await {
        Ok(config) => Ok(json!({ "success": true, "config": config }).to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn session_update_system_config(
    _system_name: String,
    mode: String,
    arcade_config: Option<String>,
    timed_config: Option<String>,
    session_manager: State<'_, Arc<SessionManager>>,
) -> Result<String, String> {
    let session_mode = match mode.as_str() {
        "arcade" => SessionMode::Arcade,
        "timed" => SessionMode::Timed,
        "unlimited" => SessionMode::Unlimited,
        "token" => SessionMode::Token,
        _ => return Err(format!("Unknown mode: {}", mode)),
    };

    let mut config = session_manager.get_config().await;
    config.mode = session_mode;

    if let Some(arcade_json) = arcade_config {
        if let Ok(ac) = serde_json::from_str::<ArcadeConfig>(&arcade_json) {
            config.arcade = ac;
        }
    }

    if let Some(timed_json) = timed_config {
        if let Ok(tc) = serde_json::from_str::<TimedConfig>(&timed_json) {
            config.timed = tc;
        }
    }

    session_manager.set_config(config.clone()).await;
    Ok(json!({ "success": true, "config": config }).to_string())
}
