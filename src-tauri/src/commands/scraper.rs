use crate::core::scraper::GameScraper;
use crate::db::Database;
use serde_json::json;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

/// Search for game metadata by name. Returns up to 1 result per available scraper source.
#[tauri::command]
pub async fn scraper_search(
    query: String,
    system: Option<String>,
) -> Result<String, String> {
    let system_name = system.as_deref().unwrap_or("arcade");
    let media_dir = PathBuf::from("./media");
    let scraper = GameScraper::new(media_dir);

    let info = scraper
        .scrape(&query, system_name, None)
        .await
        .unwrap_or_else(|_| crate::core::scraper::ScrapedGameInfo {
            title: query.clone(),
            description: None,
            year: None,
            developer: None,
            publisher: None,
            genre: None,
            players: None,
            rating: None,
            region: None,
            box_art_url: None,
            screenshot_url: None,
            wheel_url: None,
            marquee_url: None,
            video_url: None,
            bezel_url: None,
            fanart_url: None,
            box3d_url: None,
            cartridge_url: None,
            manual_url: None,
            source: Some("Fallback".to_string()),
        });

    let provider = info.source.as_deref().unwrap_or("local").to_lowercase();
    let provider = match provider.as_str() {
        s if s.contains("screenscraper") => "screenscraper",
        s if s.contains("arcadedb") || s.contains("arcade") => "local",
        s if s.contains("thegamesdb") || s.contains("tgdb") => "thegamesdb",
        _ => "local",
    };

    let result = json!({
        "results": [{
            "provider": provider,
            "gameId": query,
            "title": info.title,
            "year": info.year,
            "system": system_name,
            "description": info.description,
            "image": info.box_art_url,
            "score": 1.0
        }]
    });

    Ok(result.to_string())
}

/// Get full metadata for a game by ROM name (gameId from search result).
#[tauri::command]
pub async fn scraper_get_metadata(
    game_id: String,
    provider: Option<String>,
    system: Option<String>,
) -> Result<String, String> {
    let _ = provider;
    let system_name = system.as_deref().unwrap_or("arcade");
    let media_dir = PathBuf::from("./media");
    let scraper = GameScraper::new(media_dir);

    let info = scraper
        .scrape(&game_id, system_name, None)
        .await
        .map_err(|e| e.to_string())?;

    let result = json!({
        "id": game_id,
        "provider": info.source.as_deref().unwrap_or("local"),
        "title": info.title,
        "year": info.year,
        "genres": info.genre.map(|g| vec![g]).unwrap_or_default(),
        "developer": info.developer,
        "publisher": info.publisher,
        "description": info.description,
        "players": info.players,
        "rating": info.rating,
        "images": {
            "boxFront": info.box_art_url,
            "screenshot": info.screenshot_url,
            "wheel": info.wheel_url,
            "marquee": info.marquee_url,
            "fanart": info.fanart_url,
        },
        "videos": info.video_url.map(|v| vec![v]).unwrap_or_default(),
    });

    Ok(result.to_string())
}

/// Batch scrape games by DB ID. Downloads media and updates the database.
#[tauri::command]
pub async fn scraper_batch_scrape(
    game_ids: Vec<i64>,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    let media_dir = PathBuf::from("./media");
    let scraper = GameScraper::new(media_dir);

    // Build system id → name map once
    let systems = db.get_systems().await.map_err(|e| e.to_string())?;
    let system_map: std::collections::HashMap<i64, String> = systems
        .into_iter()
        .map(|s| (s.id, s.name))
        .collect();

    let mut results = Vec::new();

    for game_id in &game_ids {
        let game = match db.get_game_by_id(*game_id).await.map_err(|e| e.to_string())? {
            Some(g) => g,
            None => {
                results.push(json!({
                    "gameId": game_id,
                    "success": false,
                    "images": {},
                    "error": "Game not found"
                }));
                continue;
            }
        };

        let system_name = system_map
            .get(&game.system_id)
            .map(|s| s.as_str())
            .unwrap_or("arcade");

        let rom_name = game.filename.as_deref().unwrap_or(&game.title);

        match scraper
            .scrape_and_download(rom_name, system_name, game.crc32.as_deref())
            .await
        {
            Ok(info) => {
                let _ = db
                    .update_game_metadata(
                        *game_id,
                        &info.title,
                        info.description.as_deref(),
                        info.year.map(|y| y as i64),
                        info.players.map(|p| p as i64),
                        info.rating,
                    )
                    .await;

                results.push(json!({
                    "gameId": game_id,
                    "success": true,
                    "images": {
                        "boxFront": info.box_art_url,
                        "screenshot": info.screenshot_url,
                        "wheel": info.wheel_url,
                        "marquee": info.marquee_url,
                        "fanart": info.fanart_url,
                    },
                }));
            }
            Err(e) => {
                results.push(json!({
                    "gameId": game_id,
                    "success": false,
                    "images": {},
                    "error": e.to_string()
                }));
            }
        }
    }

    Ok(json!({ "results": results }).to_string())
}
