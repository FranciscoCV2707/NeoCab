use tauri::State;
use serde_json::json;
use crate::core::GameLibrary;
use std::path::PathBuf;

use crate::db::Database;
use std::sync::Arc;
use std::path::Path;
use crate::core::network_manager::NetworkManager;

#[tauri::command]
pub async fn list_games(
    system: String,
    search: Option<String>,
    genre: Option<String>,
    only_favorites: Option<bool>,
    game_library: State<'_, GameLibrary>,
) -> Result<Vec<crate::models::Game>, String> {
    game_library
        .get_games(
            &system,
            search.as_deref(),
            genre.as_deref(),
            only_favorites.unwrap_or(false),
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_systems(
    db: State<'_, Arc<Database>>,
) -> Result<Vec<crate::models::System>, String> {
    db.get_systems().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_favorite(
    game_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<bool, String> {
    db.toggle_game_favorite(game_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_game_metadata(
    game_id: i64,
    title: String,
    description: Option<String>,
    year: Option<i64>,
    players: Option<i64>,
    rating: Option<f64>,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.update_game_metadata(
        game_id,
        &title,
        description.as_deref(),
        year,
        players,
        rating,
    )
    .await
    .map_err(|e| e.to_string())
}

#[derive(Clone, serde::Serialize)]
struct ScanProgress {
    current: usize,
    total: usize,
    filename: String,
}

#[tauri::command]
pub async fn import_external_library(
    xml_path: String,
    system_id: i64,
    format: String,
    db: State<'_, Arc<Database>>,
) -> Result<usize, String> {
    let importer = crate::core::UniversalImporter::new(db.inner().clone());
    let path = Path::new(&xml_path);
    
    match format.as_str() {
        "emulationstation" => importer.import_es2_xml(path, system_id).await,
        "hyperspin" => importer.import_hyperspin_xml(path, system_id).await,
        "launchbox" => importer.import_launchbox_xml(path, system_id).await,
        _ => Err(crate::error::NeoCabError::Config("Unsupported format".to_string())),
    }
    }
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_steam_games(
    db: State<'_, Arc<Database>>,
) -> Result<usize, String> {
    use crate::core::steam_importer::SteamImporter;
    use crate::models::Game;

    // Ensure Steam system exists or create it
    let system_id = match db.get_system_by_name("steam").await.map_err(|e| e.to_string())? {
        Some(s) => s.id,
        None => {
            // Need to insert a new system for steam. For simplicity we assume it might exist or we just use a generic PC system.
            return Err("Steam system not found in DB. Please add a system named 'steam' first.".into());
        }
    };

    let steam_games = SteamImporter::scan_steam_games().map_err(|e| e.to_string())?;
    let mut imported = 0;

    for sg in steam_games {
        let game = Game {
            id: 0,
            title: sg.name.clone(),
            sort_title: sg.name.to_lowercase(),
            system_id,
            emulator_id: None, // Steam handles its own launching
            rom_path: format!("steam://rungameid/{}", sg.app_id),
            filename: Some(sg.app_id.clone()),
            file_size: None,
            crc32: None,
            sha1: None,
            md5: None,
            description: Some("Steam Game".to_string()),
            year: None,
            developer: None,
            publisher: None,
            genre: None,
            region: None,
            language: None,
            is_favorite: 0,
            play_count: 0,
            total_play_time: 0,
            last_played: None,
            rating: None,
        };

        if let Ok(_) = db.insert_game(&game).await {
            imported += 1;
        }
    }

    Ok(imported)
}

#[tauri::command]
pub async fn get_save_states(
    game_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<crate::models::SaveState>, String> {
    db.get_save_states(game_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_high_scores(
    game_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<serde_json::Value>, String> {
    db.get_high_scores(game_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_roms(
    app_handle: tauri::AppHandle,
    roms_dir: Option<String>,
    game_library: State<'_, GameLibrary>,
) -> Result<String, String> {
    let dir = roms_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("./roms"));

    use tauri::Emitter;

    let result = game_library.scan_roms(&dir, |current, total, filename| {
        let _ = app_handle.emit("scan_progress", ScanProgress {
            current,
            total,
            filename: filename.to_string(),
        });
    }).await;

    match result {
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

/// Scrape metadata and artwork for a single game
#[tauri::command]
pub async fn scrape_game(
    game_id: i64,
    system_name: String,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    use crate::core::scraper::GameScraper;
    
    let game = db.get_game_by_id(game_id).await.map_err(|e| e.to_string())?;
    
    let game = match game {
        Some(g) => g,
        None => return Err("Game not found".to_string()),
    };

    let media_dir = PathBuf::from("./media");
    let scraper = GameScraper::new(media_dir);
    
    let rom_name = game.filename.as_deref()
        .unwrap_or(&game.title);
    
    let info = scraper.scrape_and_download(
        rom_name,
        &system_name,
        game.crc32.as_deref(),
    ).await.map_err(|e| e.to_string())?;

    // Update the game in the database with scraped metadata
    let year_i64 = info.year.map(|y| y as i64);
    let players_i64 = info.players.map(|p| p as i64);
    
    db.update_game_metadata(
        game_id,
        &info.title,
        info.description.as_deref(),
        year_i64,
        players_i64,
        info.rating,
    ).await.map_err(|e| e.to_string())?;

    let result = json!({
        "success": true,
        "title": info.title,
        "description": info.description,
        "year": info.year,
        "developer": info.developer,
        "genre": info.genre,
        "has_box_art": info.box_art_url.is_some(),
        "has_screenshot": info.screenshot_url.is_some(),
        "has_wheel": info.wheel_url.is_some(),
        "has_video": info.video_url.is_some(),
    });
    Ok(result.to_string())
}

/// Update play statistics after a game session
#[tauri::command]
pub async fn update_play_stats(
    game_id: i64,
    play_time_seconds: i64,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.update_play_stats(game_id, play_time_seconds)
        .await
        .map_err(|e| e.to_string())
}

