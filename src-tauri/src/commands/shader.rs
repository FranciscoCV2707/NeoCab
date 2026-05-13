use crate::core::ShaderManager;
use serde_json::json;
use tauri::{AppHandle, Emitter, State};

fn shader_list_json(shaders: &[crate::core::Shader]) -> Vec<serde_json::Value> {
    shaders
        .iter()
        .map(|s| {
            json!({
                "name": s.name,
                "description": s.description,
                "type": format!("{:?}", s.shader_type),
                "parameters_count": s.parameters.len(),
                "is_valid": s.is_valid,
                "validation_errors": s.validation_errors,
            })
        })
        .collect()
}

#[tauri::command]
pub async fn list_shaders(shader_manager: State<'_, ShaderManager>) -> Result<String, String> {
    match shader_manager.rescan_shaders().await {
        Ok((shaders, stats)) => {
            let result = json!({
                "success": true,
                "shaders": shader_list_json(&shaders),
                "count": shaders.len(),
                "scan_stats": stats
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
pub async fn rescan_shaders(shader_manager: State<'_, ShaderManager>) -> Result<String, String> {
    match shader_manager.rescan_shaders().await {
        Ok((shaders, stats)) => {
            let result = json!({
                "success": true,
                "shaders": shader_list_json(&shaders),
                "count": shaders.len(),
                "scan_stats": stats
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
pub async fn get_shader(
    name: String,
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    match shader_manager.get_shader(&name).await {
        Ok(Some(shader)) => {
            let result = json!({
                "success": true,
                "shader": {
                    "name": shader.name,
                    "description": shader.description,
                    "type": format!("{:?}", shader.shader_type),
                    "is_valid": shader.is_valid,
                    "validation_errors": shader.validation_errors,
                    "parameters": shader.parameters.iter().map(|p| json!({
                        "name": p.name,
                        "display_name": p.display_name,
                        "type": p.param_type,
                        "min": p.min_value,
                        "max": p.max_value,
                        "default": p.default_value,
                    })).collect::<Vec<_>>(),
                }
            });
            Ok(result.to_string())
        }
        Ok(None) => {
            let error = json!({
                "success": false,
                "error": format!("Shader not found: {}", name)
            });
            Err(error.to_string())
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
pub async fn validate_shader(
    name: String,
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    match shader_manager.validate_shader(&name).await {
        Ok(validation) => {
            let result = json!({
                "success": true,
                "valid": validation.valid,
                "errors": validation.errors,
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
pub async fn list_shader_presets(
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    let presets = shader_manager.list_presets();

    let preset_info: Vec<_> = presets.iter().map(|p| json!({ "name": p })).collect();

    let result = json!({
        "success": true,
        "presets": preset_info,
        "count": presets.len()
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_shader_preset(
    preset_name: String,
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    match shader_manager.get_preset(&preset_name).await {
        Ok(preset) => {
            let result = json!({
                "success": true,
                "preset": {
                    "name": preset.name,
                    "shader": preset.shader,
                    "parameters": preset.parameters,
                }
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
pub fn get_default_shader() -> Result<String, String> {
    let result = json!({
        "success": true,
        "shader": "CRT - Geom",
        "preset": "arcade"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub fn get_shader_params(shader_manager: State<'_, ShaderManager>) -> Result<String, String> {
    match shader_manager.get_shader_params() {
        Ok(parameters) => {
            let result = json!({
                "success": true,
                "parameters": parameters,
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
pub fn set_shader_param(
    param_name: String,
    value: f32,
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    match shader_manager.set_shader_param(&param_name, value) {
        Ok(parameters) => {
            let result = json!({
                "success": true,
                "parameters": parameters,
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
pub fn start_shader_watcher(
    app_handle: AppHandle,
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    let emitter = app_handle.clone();
    match shader_manager.start_shader_watcher(move || {
        let payload = json!({
            "source": "native-watcher",
            "path": "config/shaders"
        });
        if let Err(error) = emitter.emit("shader://changed", payload) {
            tracing::warn!("Failed to emit shader change event: {}", error);
        }
    }) {
        Ok(started) => {
            let result = json!({
                "success": true,
                "started": started,
                "running": true,
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
pub fn stop_shader_watcher(shader_manager: State<'_, ShaderManager>) -> Result<String, String> {
    match shader_manager.stop_shader_watcher() {
        Ok(stopped) => {
            let result = json!({
                "success": true,
                "stopped": stopped,
                "running": false,
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
pub fn is_shader_watcher_running(
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    match shader_manager.is_shader_watcher_running() {
        Ok(running) => {
            let result = json!({
                "success": true,
                "running": running,
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
