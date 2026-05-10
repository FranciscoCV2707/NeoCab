use tauri::State;
use serde_json::json;
use crate::core::GameLibrary;
use std::path::PathBuf;

#[tauri::command]
pub async fn list_games(_game_library: State<'_, GameLibrary>) -> Result<String, String> {
    // TODO: Implement game listing from database
    Ok("Games list coming next week".to_string())
}

#[tauri::command]
pub async fn scan_roms(
    roms_dir: Option<String>,
    game_library: State<'_, GameLibrary>,
) -> Result<String, String> {
    let dir = roms_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("./roms"));

    match game_library.scan_roms(&dir).await {
        Ok(count) => {
            let result = json!({
                "success": true,
                "games_found": count,
                "message": format!("Found {} new games", count)
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
