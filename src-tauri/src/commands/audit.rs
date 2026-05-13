use serde_json::json;
use tauri::State;
use std::sync::Arc;
use std::path::Path;
use crate::db::Database;

#[tauri::command]
pub async fn audit_roms(
    system: Option<String>,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    let mut missing = Vec::new();
    let mut total_systems = 0;
    
    let systems = db.get_systems().await.map_err(|e| e.to_string())?;
    for sys in systems {
        if let Some(ref sys_target) = system {
            if sys.name != *sys_target && sys.display_name != *sys_target {
                continue;
            }
        }
        total_systems += 1;
        let games = db.get_games_by_system(sys.id, None, None, false).await.map_err(|e| e.to_string())?;
        for game in games {
            if !Path::new(&game.rom_path).exists() {
                missing.push(json!({
                    "game_id": game.id,
                    "title": game.title,
                    "system": sys.name.clone(),
                    "path": game.rom_path,
                }));
            }
        }
    }
    
    let result = json!({
        "success": true,
        "results": missing,
        "total_systems": total_systems,
        "total_missing": missing.len(),
        "message": format!("Found {} missing ROMs", missing.len())
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn audit_media(
    system: Option<String>,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    let mut missing_images = 0;
    let mut missing_videos = 0;
    let mut game_count = 0;
    
    let systems = db.get_systems().await.map_err(|e| e.to_string())?;
    for sys in systems {
        if let Some(ref sys_target) = system {
            if sys.name != *sys_target && sys.display_name != *sys_target {
                continue;
            }
        }
        let games = db.get_games_by_system(sys.id, None, None, false).await.map_err(|e| e.to_string())?;
        game_count += games.len();
        for game in games {
            let img_missing = match game.image_path.as_deref() {
                Some(p) => !Path::new(p).exists(),
                None => true,
            };
            if img_missing {
                missing_images += 1;
            }

            let vid_missing = match game.video_path.as_deref() {
                Some(p) => !Path::new(p).exists(),
                None => true,
            };
            if vid_missing {
                missing_videos += 1;
            }
        }
    }
    
    let result = json!({
        "success": true,
        "total_games": game_count,
        "missing_images": missing_images,
        "missing_videos": missing_videos,
        "message": format!("Audited {} games: {} missing images, {} missing videos", game_count, missing_images, missing_videos)
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn audit_full(
    system: Option<String>,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    // For now, just run audit_roms
    audit_roms(system, db).await
}
