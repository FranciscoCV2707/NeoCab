use crate::core::kiosk_config::KioskConfig;
use serde::Serialize;

#[derive(Serialize)]
pub struct KioskInfo {
    pub kiosk: bool,
    pub autoboot_system: Option<String>,
    pub autoboot_delay: u64,
    pub disable_settings: bool,
    pub disable_shutdown: bool,
    pub disable_reboot: bool,
    pub disable_appclose: bool,
    pub disable_suspend: bool,
}

#[tauri::command]
pub async fn get_kiosk_config(
    kiosk_config: tauri::State<'_, KioskConfig>,
) -> Result<KioskInfo, String> {
    Ok(KioskInfo {
        kiosk: kiosk_config.kiosk,
        autoboot_system: kiosk_config.autoboot_system.clone(),
        autoboot_delay: kiosk_config.autoboot_delay,
        disable_settings: kiosk_config.disable_settings,
        disable_shutdown: kiosk_config.disable_shutdown,
        disable_reboot: kiosk_config.disable_reboot,
        disable_appclose: kiosk_config.disable_appclose,
        disable_suspend: kiosk_config.disable_suspend,
    })
}

#[tauri::command]
pub async fn get_available_systems() -> Result<Vec<String>, String> {
    Ok(vec![
        "mame".to_string(),
        "nes".to_string(),
        "snes".to_string(),
        "genesis".to_string(),
        "psx".to_string(),
        "n64".to_string(),
        "gba".to_string(),
    ])
}
