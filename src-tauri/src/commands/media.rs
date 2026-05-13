use tauri::State;
use serde_json::json;
use crate::core::MediaManager;
use std::path::PathBuf;

#[tauri::command]
pub async fn scan_media(media_manager: State<'_, MediaManager>) -> Result<String, String> {
    match media_manager.scan_media().await {
        Ok(library) => {
            let result = json!({
                "success": true,
                "library": {
                    "wheels": library.wheels.len(),
                    "box_art": library.box_art.len(),
                    "backgrounds": library.backgrounds.len(),
                    "screenshots": library.screenshots.len(),
                    "total_size": library.total_size,
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
pub async fn get_media_stats(media_manager: State<'_, MediaManager>) -> Result<String, String> {
    match media_manager.get_stats().await {
        Ok(stats) => {
            let result = json!({
                "success": true,
                "stats": {
                    "total_files": stats.total_files,
                    "total_size": stats.total_size,
                    "wheels_count": stats.wheels_count,
                    "box_art_count": stats.box_art_count,
                    "backgrounds_count": stats.backgrounds_count,
                    "screenshots_count": stats.screenshots_count,
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
pub async fn get_system_media(
    system: String,
    media_manager: State<'_, MediaManager>,
) -> Result<String, String> {
    match media_manager.get_system_media(&system).await {
        Ok(library) => {
            let result = json!({
                "success": true,
                "system": system,
                "media": {
                    "wheels": library.wheels.get(&system).map(|v| v.len()).unwrap_or(0),
                    "box_art": library.box_art.get(&system).map(|v| v.len()).unwrap_or(0),
                    "backgrounds": library.backgrounds.get(&system).map(|v| v.len()).unwrap_or(0),
                    "screenshots": library.screenshots.get(&system).map(|v| v.len()).unwrap_or(0),
                    "total_size": library.total_size,
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
pub async fn organize_media(
    source_dir: String,
    media_manager: State<'_, MediaManager>,
) -> Result<String, String> {
    match media_manager.organize_media(&source_dir).await {
        Ok(files_organized) => {
            let result = json!({
                "success": true,
                "files_organized": files_organized,
                "message": format!("Organized {} media files", files_organized)
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
pub async fn get_media(
    system: String,
    game_name: String,
    media_type: String,
    media_manager: State<'_, MediaManager>,
) -> Result<String, String> {
    let mtype = match media_type.as_str() {
        "wheel" => crate::core::MediaType::Wheel,
        "box_art" => crate::core::MediaType::BoxArt,
        "background" => crate::core::MediaType::Background,
        "screenshot" => crate::core::MediaType::Screenshot,
        _ => crate::core::MediaType::Custom,
    };

    match media_manager.get_media(&system, &game_name, mtype).await {
        Ok(Some(path)) => {
            let result = json!({
                "success": true,
                "path": path.to_string_lossy().to_string(),
                "exists": true
            });
            Ok(result.to_string())
        }
        Ok(None) => {
            let result = json!({
                "success": true,
                "exists": false,
                "message": format!("No {} found for {} / {}", media_type, system, game_name)
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
pub async fn import_media(
    source_path: String,
    media_manager: State<'_, MediaManager>,
) -> Result<String, String> {
    // For now, this calls organize_media
    // In future, could support importing from ZIP or direct file copy
    match media_manager.organize_media(&source_path).await {
        Ok(files_imported) => {
            let result = json!({
                "success": true,
                "files_imported": files_imported,
                "message": format!("Imported {} media files", files_imported)
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
pub async fn trigger_media_rescan(
    media_manager: State<'_, MediaManager>,
) -> Result<String, String> {
    match media_manager.invalidate_and_rescan().await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "Media library rescanned successfully"
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
