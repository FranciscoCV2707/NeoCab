use serde_json::json;

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
