use tauri::State;
use serde_json::json;
use crate::core::{AutobootManager, EmulatorDetector, EmulatorInfo};

#[tauri::command]
pub fn get_system_info() -> String {
    "NeoCab System initialized".to_string()
}

#[tauri::command]
pub async fn enable_autoboot(
    autoboot_manager: State<'_, AutobootManager>,
) -> Result<String, String> {
    match autoboot_manager.enable_autoboot() {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "Autoboot enabled"
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
pub async fn disable_autoboot(
    autoboot_manager: State<'_, AutobootManager>,
) -> Result<String, String> {
    match autoboot_manager.disable_autoboot() {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "Autoboot disabled"
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
pub async fn is_autoboot_enabled(
    autoboot_manager: State<'_, AutobootManager>,
) -> Result<String, String> {
    match autoboot_manager.is_autoboot_enabled() {
        Ok(enabled) => {
            let result = json!({
                "success": true,
                "enabled": enabled
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
pub async fn enable_kiosk_mode(
    _autoboot_manager: State<'_, AutobootManager>,
) -> Result<String, String> {
    let result = json!({
        "success": true,
        "message": "Kiosk mode enabled"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn disable_kiosk_mode(
    _autoboot_manager: State<'_, AutobootManager>,
) -> Result<String, String> {
    let result = json!({
        "success": true,
        "message": "Kiosk mode disabled"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn is_kiosk_mode_enabled(
    autoboot_manager: State<'_, AutobootManager>,
) -> Result<String, String> {
    let enabled = autoboot_manager.is_kiosk_mode_enabled();
    let result = json!({
        "success": true,
        "enabled": enabled
    });
    Ok(result.to_string())
}

#[tauri::command]
pub fn detect_emulators() -> Result<Vec<EmulatorInfo>, String> {
    let emulators = EmulatorDetector::detect_all();
    Ok(emulators)
}
