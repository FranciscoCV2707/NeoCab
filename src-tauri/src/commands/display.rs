/// Screen rotation & multi-display commands
use serde::Serialize;

#[derive(Serialize)]
pub struct DisplayConfig {
    pub rotation: u32,
    pub fullscreen: bool,
}

#[tauri::command]
pub async fn get_display_config() -> Result<DisplayConfig, String> {
    Ok(DisplayConfig {
        rotation: 0,
        fullscreen: true,
    })
}

#[tauri::command]
pub async fn set_display_rotation(rotation: u32) -> Result<(), String> {
    // Apply rotation via Tauri window
    #[cfg(windows)]
    {
        // Use Display Switch utility or registry
        std::process::Command::new("DisplaySwitch.exe")
            .arg("/rotate")
            .arg(rotation.to_string())
            .output()
            .ok();
    }
    Ok(())
}
