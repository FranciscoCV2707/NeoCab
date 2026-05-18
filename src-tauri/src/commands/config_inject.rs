use crate::adapters::config_injectors::{self, EmulatorSettings};
use serde_json::json;

#[derive(serde::Serialize)]
pub struct InjectorInfo {
    pub name: String,
    pub display_name: String,
}

#[tauri::command]
pub async fn list_config_injectors() -> Result<Vec<InjectorInfo>, String> {
    let injectors = config_injectors::list_injectors();
    Ok(injectors
        .into_iter()
        .map(|(name, display_name)| InjectorInfo { name, display_name })
        .collect())
}

#[tauri::command]
pub async fn detect_config_injector(emulator_path: String) -> Result<String, String> {
    match config_injectors::find_injector(&emulator_path) {
        Some(inj) => {
            let config_dir = inj.get_config_dir(&emulator_path);
            let result = json!({
                "found": true,
                "name": inj.name(),
                "display_name": inj.display_name(),
                "config_dir": config_dir,
            });
            Ok(result.to_string())
        }
        None => {
            let result = json!({"found": false});
            Ok(result.to_string())
        }
    }
}

#[tauri::command]
pub async fn read_emulator_config(
    emulator_path: String,
    config_dir: Option<String>,
) -> Result<String, String> {
    let inj = config_injectors::find_injector(&emulator_path)
        .ok_or_else(|| format!("No config injector found for {}", emulator_path))?;

    let cfg_dir = match config_dir {
        Some(dir) => dir,
        None => inj.get_config_dir(&emulator_path),
    };

    let settings = inj.read_current(&cfg_dir).await?;
    serde_json::to_string(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn inject_emulator_config(
    emulator_path: String,
    config_dir: Option<String>,
    settings_json: String,
) -> Result<String, String> {
    let inj = config_injectors::find_injector(&emulator_path)
        .ok_or_else(|| format!("No config injector found for {}", emulator_path))?;

    let cfg_dir = match config_dir {
        Some(dir) => dir,
        None => inj.get_config_dir(&emulator_path),
    };

    let settings: EmulatorSettings = serde_json::from_str(&settings_json)
        .map_err(|e| format!("Invalid settings JSON: {}", e))?;

    inj.inject(&cfg_dir, &settings).await?;

    let result = json!({"success": true, "config_dir": cfg_dir});
    Ok(result.to_string())
}
