use tauri::State;
use serde_json::json;
use crate::input::InputManager;

#[tauri::command]
pub async fn get_input_devices(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.get_devices().await {
        Ok(devices) => {
            let result = json!({
                "success": true,
                "devices": devices,
                "count": devices.len()
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
pub async fn get_input_mappings(
    device_id: u32,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.get_mappings(device_id).await {
        Ok(mappings) => {
            let result = json!({
                "success": true,
                "device_id": device_id,
                "mappings": mappings,
                "count": mappings.len()
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
pub async fn set_deadzone(
    deadzone: f32,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.set_deadzone(deadzone).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "deadzone": deadzone,
                "message": format!("Deadzone set to {}", deadzone)
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
pub async fn get_deadzone(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let deadzone = input_manager.get_deadzone().await;

    let result = json!({
        "success": true,
        "deadzone": deadzone
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn set_input_enabled(
    enabled: bool,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.set_enabled(enabled).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "enabled": enabled,
                "message": if enabled { "Input system enabled" } else { "Input system disabled" }
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
pub async fn is_input_enabled(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let enabled = input_manager.is_enabled().await;

    let result = json!({
        "success": true,
        "enabled": enabled
    });

    Ok(result.to_string())
}
