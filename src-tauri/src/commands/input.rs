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
    use crate::input::joy_mapper::{MappedAction, ArcadeAction};

    let action = match action_type.as_str() {
        "Key" => MappedAction::Key(action_value),
        "ArcadeAction" => match action_value.as_str() {
            "InsertCoin" => MappedAction::ArcadeAction(ArcadeAction::InsertCoin),
            "StartGame" => MappedAction::ArcadeAction(ArcadeAction::StartGame),
            "PauseMenu" => MappedAction::ArcadeAction(ArcadeAction::PauseMenu),
            "QuickSave" => MappedAction::ArcadeAction(ArcadeAction::QuickSave),
            "QuickLoad" => MappedAction::ArcadeAction(ArcadeAction::QuickLoad),
            "ToggleMenu" => MappedAction::ArcadeAction(ArcadeAction::ToggleMenu),
            "Screenshot" => MappedAction::ArcadeAction(ArcadeAction::Screenshot),
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
        deadzone: crate::input::joy_mapper::DeadzoneConfig::default(),
        left_stick_deadzone: None,
        right_stick_deadzone: None,
        trigger_deadzone: None,
        response_curve: crate::input::joy_mapper::ResponseCurve::Linear,
        left_stick_curve: None,
        right_stick_curve: None,
        trigger_range: None,
        stick_delay: None,
        mappings,
        sets: Vec::new(),
    };

    let yaml = serde_yaml::to_string(&profile).map_err(|e| e.to_string())?;
    let path = std::path::PathBuf::from(format!("config/joy_profiles/{}.yml", profile_name));
    std::fs::write(&path, yaml).map_err(|e| e.to_string())?;

    let mut mapper = input_manager.joy_mapper.write().await;
    mapper.set_profile(profile);

    Ok(())
}

#[tauri::command]
pub async fn get_connected_devices(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.get_connected_devices().await {
        Ok(devices) => {
            let result = json!({
                "success": true,
                "devices": devices,
                "count": devices.len()
            });
            Ok(result.to_string())
        }
        Err(e) => Err(json!({"success": false, "error": e.to_string()}).to_string())
    }
}

#[tauri::command]
pub async fn set_input_context(
    system: String,
    game: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    input_manager.set_context(&system, &game).await;
    let result = json!({
        "success": true,
        "system": system,
        "game": game,
        "message": "Input context updated"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_input_context(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let (system, game) = input_manager.get_context().await;
    let result = json!({
        "success": true,
        "system": system,
        "game": game
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn add_profile_assignment(
    scope: String,
    identifier: String,
    profile_name: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let assignment = crate::input::ProfileAssignment {
        scope,
        identifier,
        profile_name,
    };
    match input_manager.add_profile_assignment(assignment).await {
        Ok(_) => Ok(json!({"success": true, "message": "Profile assignment added"}).to_string()),
        Err(e) => Err(json!({"success": false, "error": e.to_string()}).to_string())
    }
}

#[tauri::command]
pub async fn get_profile_assignments(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.get_profile_assignments().await {
        Ok(assignments) => {
            let result = json!({
                "success": true,
                "assignments": assignments,
                "count": assignments.len()
            });
            Ok(result.to_string())
        }
        Err(e) => Err(json!({"success": false, "error": e.to_string()}).to_string())
    }
}

#[tauri::command]
pub async fn remove_profile_assignment(
    scope: String,
    identifier: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    match input_manager.remove_profile_assignment(&scope, &identifier).await {
        Ok(_) => Ok(json!({"success": true, "message": "Profile assignment removed"}).to_string()),
        Err(e) => Err(json!({"success": false, "error": e.to_string()}).to_string())
    }
}

#[tauri::command]
pub async fn load_input_profile(
    profile_name: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let path = std::path::PathBuf::from(format!("config/joy_profiles/{}.yml", profile_name));
    if !path.exists() {
        return Err(json!({"success": false, "error": "Profile not found"}).to_string());
    }
    let mut mapper = input_manager.joy_mapper.write().await;
    match mapper.load_profile_from_file(&path) {
        Ok(_) => Ok(json!({"success": true, "message": format!("Profile loaded: {}", profile_name)}).to_string()),
        Err(e) => Err(json!({"success": false, "error": e}).to_string())
    }
}

#[tauri::command]
pub async fn get_active_profile(
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let mapper = input_manager.joy_mapper.read().await;
    if let Some(profile) = mapper.get_active_profile() {
        let result = json!({
            "success": true,
            "profile": profile,
            "set": mapper.get_active_set_name()
        });
        Ok(result.to_string())
    } else {
        Ok(json!({"success": true, "profile": null, "message": "No active profile"}).to_string())
    }
}

#[tauri::command]
pub async fn switch_input_set(
    set_name: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let mut mapper = input_manager.joy_mapper.write().await;
    mapper.switch_to_set(&set_name);
    Ok(json!({"success": true, "active_set": mapper.get_active_set_name()}).to_string())
}

#[tauri::command]
pub async fn get_input_state(
    device_id: Option<u32>,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    let mapper = input_manager.joy_mapper.read().await;
    let buttons = mapper.get_all_button_states().clone();
    let axes = mapper.get_all_axis_states().clone();
    drop(mapper);

    let result = json!({
        "success": true,
        "device_id": device_id,
        "buttons": buttons,
        "axes": axes
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn create_profile_from_template(
    profile_name: String,
    template: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    use crate::input::joy_mapper::JoyMapper;

    let profile = JoyMapper::create_default_profile(&profile_name, &template);
    let yaml = serde_yaml::to_string(&profile).map_err(|e| e.to_string())?;
    let path = std::path::PathBuf::from(format!("config/joy_profiles/{}.yml", profile_name));

    if let Err(e) = std::fs::write(&path, yaml) {
        return Err(json!({"success": false, "error": e.to_string()}).to_string());
    }

    let mut mapper = input_manager.joy_mapper.write().await;
    mapper.set_profile(profile);

    Ok(json!({
        "success": true,
        "message": format!("Profile created from template: {}", template),
        "path": path.to_string_lossy()
    }).to_string())
}

#[tauri::command]
pub async fn list_input_templates() -> Result<String, String> {
    let templates = vec![
        json!({"id": "arcade_stick", "name": "Arcade Stick", "description": "8-way joystick + 6 buttons, radial deadzone"}),
        json!({"id": "snes_pad", "name": "SNES Pad", "description": "D-pad + 4 buttons, digital response"}),
        json!({"id": "xbox_controller", "name": "Xbox Controller", "description": "Full controller with shift layers"}),
        json!({"id": "playstation_controller", "name": "PlayStation Controller", "description": "DualShock/DualSense layout"}),
        json!({"id": "flight_stick", "name": "Flight Stick", "description": "Stick + throttle, exponential curve"}),
        json!({"id": "racing_wheel", "name": "Racing Wheel", "description": "Wheel + pedals, anti-deadzone"}),
    ];
    Ok(json!({"success": true, "templates": templates}).to_string())
}

#[tauri::command]
pub async fn import_antimicrox_profile(
    profile_name: String,
    xml_content: String,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    use crate::input::joy_mapper::JoyMapper;

    match JoyMapper::import_antimicrox_profile(&xml_content) {
        Ok(mut profile) => {
            profile.name = profile_name.clone();
            let yaml = serde_yaml::to_string(&profile).map_err(|e| e.to_string())?;
            let path = std::path::PathBuf::from(format!("config/joy_profiles/{}.yml", profile_name));

            if let Err(e) = std::fs::write(&path, yaml) {
                return Err(json!({"success": false, "error": e.to_string()}).to_string());
            }

            let mut mapper = input_manager.joy_mapper.write().await;
            mapper.set_profile(profile);

            Ok(json!({
                "success": true,
                "message": "AntiMicroX profile imported",
                "path": path.to_string_lossy()
            }).to_string())
        }
        Err(e) => Err(json!({"success": false, "error": e}).to_string())
    }
}

#[tauri::command]
pub async fn set_device_deadzone(
    _device_id: u32,
    deadzone_type: String,
    value: f32,
    anti_deadzone: Option<f32>,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    use crate::input::joy_mapper::DeadzoneConfig;

    let dz_type = match deadzone_type.as_str() {
        "radial" => crate::input::joy_mapper::DeadzoneType::Radial,
        _ => crate::input::joy_mapper::DeadzoneType::Linear,
    };

    let config = DeadzoneConfig {
        r#type: dz_type,
        value,
        anti_deadzone: anti_deadzone.unwrap_or(0.0),
    };

    let mut mapper = input_manager.joy_mapper.write().await;
    if let Some(profile) = mapper.get_active_profile() {
        let mut profile = profile.clone();
        profile.deadzone = config;
        mapper.set_profile(profile);
        Ok(json!({"success": true, "message": "Device deadzone updated"}).to_string())
    } else {
        Err(json!({"success": false, "error": "No active profile"}).to_string())
    }
}

#[tauri::command]
pub async fn set_response_curve(
    curve_type: String,
    factor: Option<f32>,
    control_points: Option<Vec<(f32, f32)>>,
    input_manager: State<'_, InputManager>,
) -> Result<String, String> {
    use crate::input::joy_mapper::ResponseCurve;

    let curve = match curve_type.as_str() {
        "linear" => ResponseCurve::Linear,
        "exponential" => ResponseCurve::Exponential { factor: factor.unwrap_or(2.0) },
        "digital" => ResponseCurve::Digital { threshold: factor.unwrap_or(0.7) },
        "spline" => ResponseCurve::Spline {
            control_points: control_points.unwrap_or_else(|| vec![(0.0, 0.0), (0.5, 0.3), (1.0, 1.0)]),
        },
        _ => return Err(json!({"success": false, "error": "Invalid curve type"}).to_string()),
    };

    let mut mapper = input_manager.joy_mapper.write().await;
    if let Some(profile) = mapper.get_active_profile() {
        let mut profile = profile.clone();
        profile.response_curve = curve;
        mapper.set_profile(profile);
        Ok(json!({"success": true, "message": "Response curve updated"}).to_string())
    } else {
        Err(json!({"success": false, "error": "No active profile"}).to_string())
    }
}
