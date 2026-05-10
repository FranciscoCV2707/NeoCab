#[tauri::command]
pub fn list_emulators() -> String {
    "No emulators configured. MAME coming in Week 5.".to_string()
}
