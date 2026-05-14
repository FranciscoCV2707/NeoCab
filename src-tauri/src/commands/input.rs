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
#[tauri::command]
pub async fn start_recording_input(
    action_type: String,
    action_value: String,
    input_manager: State<'_, InputManager>,
) -> Result<(), String> {
    use crate::input::joy_mapper::MappedAction;
    
    let action = match action_type.as_str() {
        "Key" => MappedAction::Key(action_value),
        "ArcadeAction" => match action_value.as_str() {
            "InsertCoin" => MappedAction::ArcadeAction(crate::input::joy_mapper::ArcadeAction::InsertCoin),
            "StartGame" => MappedAction::ArcadeAction(crate::input::joy_mapper::ArcadeAction::StartGame),
            _ => return Err("Invalid arcade action".to_string()),
        },
        _ => return Err("Invalid action type".to_string()),
    };

    let mut mapper = input_manager.joy_mapper.write().await;
    mapper.start_recording(action);
    Ok(())
}

#[tauri::command]
pub async fn get_recorded_input(
    input_manager: State<'_, InputManager>,
) -> Result<Option<crate::input::joy_mapper::JoyTrigger>, String> {
    let mapper = input_manager.joy_mapper.read().await;
    Ok(mapper.get_recorded_trigger())
}

#[tauri::command]
pub async fn save_recorded_profile(
    profile_name: String,
    mappings: Vec<crate::input::joy_mapper::JoyMapping>,
    input_manager: State<'_, InputManager>,
) -> Result<(), String> {
    use crate::input::joy_mapper::JoyProfile;
    
    let profile = JoyProfile {
        name: profile_name.clone(),
        deadzone: 0.15,
        anti_deadzone: 0.0,
        curve: crate::input::joy_mapper::ResponseCurve::Linear,
        mappings,
    };

    let yaml = serde_yaml::to_string(&profile).map_err(|e| e.to_string())?;
    let path = std::path::PathBuf::from(format!("config/joy_profiles/{}.yml", profile_name));
    std::fs::write(path, yaml).map_err(|e| e.to_string())?;
    
    // Load it immediately
    let mut mapper = input_manager.joy_mapper.write().await;
    mapper.set_profile(profile);
    
    Ok(())
}
