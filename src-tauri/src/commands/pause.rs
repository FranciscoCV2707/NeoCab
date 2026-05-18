use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn toggle_pause_menu(app_handle: AppHandle) -> Result<(), String> {
    app_handle
        .emit("toggle_pause_menu", ())
        .map_err(|e| e.to_string())?;
    Ok(())
}
