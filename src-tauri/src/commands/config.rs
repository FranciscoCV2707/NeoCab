use crate::core::config_manager::SystemGameConfig;
use crate::core::ConfigManager;
use crate::utils::EmulatorDetector;
use serde_json::json;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub fn get_config() -> String {
    json!({
        "app": {
            "name": "NeoCab",
            "version": "0.1.0"
        },
        "arcade": {
            "coin_per_game": 1,
            "kiosk_mode": false
        },
        "display": {
            "width": 1920,
            "height": 1080,
            "theme": "classic-arcade"
        }
    })
    .to_string()
}

#[tauri::command]
pub fn set_config(key: String, value: String) -> String {
    format!("Setting {} updated to {}", key, value)
}

#[tauri::command]
pub fn reload_config() -> String {
    "Config reloaded".to_string()
}

#[tauri::command]
pub async fn save_system_config(
    system: String,
    config: SystemGameConfig,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<String, String> {
    config_manager
        .save_system_config(config)
        .await
        .map_err(|e| e.to_string())?;

    Ok(format!("System config saved for: {}", system))
}

#[tauri::command]
pub async fn load_system_config(
    system: String,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<SystemGameConfig, String> {
    config_manager
        .load_system_config(&system)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_system_configs(
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<Vec<SystemGameConfig>, String> {
    config_manager
        .get_all_system_configs()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn detect_emulators() -> Result<String, String> {
    let emulators = EmulatorDetector::detect_all();
    serde_json::to_string(&emulators)
        .map_err(|e| format!("Failed to serialize emulator detection: {}", e))
}
