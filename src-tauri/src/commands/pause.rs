use tauri::AppHandle;
use tauri::Emitter;
use crate::Result;

#[tauri::command]
pub async fn toggle_pause_menu(app_handle: AppHandle) -> Result<()> {
    app_handle.emit("toggle_pause_menu", ())?;
    Ok(())
}
