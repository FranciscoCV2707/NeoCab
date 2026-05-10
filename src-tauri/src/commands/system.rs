#[tauri::command]
pub fn get_system_info() -> String {
    "NeoCab System initialized".to_string()
}
