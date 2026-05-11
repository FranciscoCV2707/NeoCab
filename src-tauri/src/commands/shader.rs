use tauri::State;
use serde_json::json;
use crate::core::ShaderManager;

#[tauri::command]
pub async fn list_shaders(shader_manager: State<'_, ShaderManager>) -> Result<String, String> {
    match shader_manager.list_shaders().await {
        Ok(shaders) => {
            let shader_info: Vec<_> = shaders
                .iter()
                .map(|s| {
                    json!({
                        "name": s.name,
                        "description": s.description,
                        "type": format!("{:?}", s.shader_type),
                        "parameters_count": s.parameters.len(),
                    })
                })
                .collect();

            let result = json!({
                "success": true,
                "shaders": shader_info,
                "count": shaders.len()
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
pub async fn list_shader_presets(
    shader_manager: State<'_, ShaderManager>,
) -> Result<String, String> {
    let presets = shader_manager.list_presets();

    let preset_info: Vec<_> = presets
        .iter()
        .map(|p| json!({ "name": p }))
        .collect();

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
