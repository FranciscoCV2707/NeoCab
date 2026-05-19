// Comandos Tauri para scraping de metadatos de juegos.
//
// Flujo típico desde el frontend:
//
//   1. scraper_search(query, system)
//      → Busca por nombre de ROM. Devuelve ScraperSearchResult[].
//        Usa el pipeline completo: SS → ArcadeDB → TGDB → Fallback.
//
//   2. scraper_get_metadata(game_id, provider, system)
//      → Obtiene metadata completa para un resultado de búsqueda.
//        game_id = nombre del ROM (viene del campo gameId en scraper_search).
//        NO descarga archivos de media.
//
//   3. scraper_batch_scrape(game_ids, db, config_manager)
//      → Scrape + descarga media para una lista de IDs de juegos en la BD.
//        Actualiza title/description/year/players en la BD.
//        Descarga imágenes a ./media/<sistema>/<tipo>/<nombre>.
//
// Para scraping rápido de un juego individual (desde el Operator Panel):
//   → Usa scrape_game(game_id, system_name) en commands/games.rs
//
// Para scrape masivo de todo un sistema:
//   → Usa scrape_all(system_name) en commands/games.rs

use crate::core::{config_manager::ConfigManager, scraper::GameScraper};
use crate::db::Database;
use serde_json::json;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

fn media_dir() -> PathBuf {
    PathBuf::from("./media")
}

async fn build_scraper(config_manager: &ConfigManager) -> GameScraper {
    let cfg = config_manager.get_config().await;
    GameScraper::with_config(media_dir(), &cfg.scraper)
}

/// Devuelve la configuración actual de credenciales del scraper.
/// Las contraseñas se enmascaran — no se envían al frontend.
#[tauri::command]
pub async fn get_scraper_config(
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<serde_json::Value, String> {
    let cfg = config_manager.get_config().await;
    Ok(json!({
        "ss_dev_id":       cfg.scraper.ss_dev_id,
        "ss_dev_password": if cfg.scraper.ss_dev_password.is_empty() { "" } else { "••••••••" },
        "ss_user":         cfg.scraper.ss_user,
        "ss_password":     if cfg.scraper.ss_password.is_empty() { "" } else { "••••••••" },
        "tgdb_api_key":    cfg.scraper.tgdb_api_key,
        "ss_configured":   !cfg.scraper.ss_dev_id.is_empty(),
        "tgdb_configured": !cfg.scraper.tgdb_api_key.is_empty(),
    }))
}

/// Guarda las credenciales del scraper en config.yml.
/// Los campos vacíos desactivan ese scraper. Los campos con "••••••••"
/// (placeholder del frontend) no sobreescriben el valor actual.
#[tauri::command]
pub async fn save_scraper_config(
    ss_dev_id: String,
    ss_dev_password: String,
    ss_user: String,
    ss_password: String,
    tgdb_api_key: String,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<(), String> {
    let placeholder = "••••••••";
    let mut cfg = config_manager.get_config().await;
    cfg.scraper.ss_dev_id    = ss_dev_id;
    cfg.scraper.ss_user      = ss_user;
    cfg.scraper.tgdb_api_key = tgdb_api_key;
    if ss_dev_password != placeholder { cfg.scraper.ss_dev_password = ss_dev_password; }
    if ss_password     != placeholder { cfg.scraper.ss_password     = ss_password; }

    config_manager
        .set_scraper_config(cfg.scraper)
        .await
        .map_err(|e| e.to_string())
}

/// Busca metadatos por nombre de ROM. Devuelve el mejor resultado disponible.
/// El frontend recibe { results: ScraperSearchResult[] }.
/// gameId en el resultado es el nombre del ROM — úsalo para llamar scraper_get_metadata.
#[tauri::command]
pub async fn scraper_search(
    query: String,
    system: Option<String>,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<String, String> {
    let system_name = system.as_deref().unwrap_or("arcade").to_string();
    let scraper = build_scraper(&config_manager).await;

    let info = scraper
        .scrape(&query, &system_name, None)
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

    let provider = match info.source.as_deref().unwrap_or("").to_lowercase().as_str() {
        s if s.contains("screenscraper") => "screenscraper",
        s if s.contains("arcadedb") => "local",
        s if s.contains("thegamesdb") => "thegamesdb",
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

/// Obtiene metadata completa para un ROM sin descargar archivos.
/// game_id = nombre del ROM (el gameId que devolvió scraper_search).
/// provider se ignora por ahora — siempre usa el pipeline completo.
/// system = nombre del sistema (ej: "mame", "snes") para mejorar la búsqueda.
#[tauri::command]
pub async fn scraper_get_metadata(
    game_id: String,
    provider: Option<String>,
    system: Option<String>,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<String, String> {
    let _ = provider;
    let system_name = system.as_deref().unwrap_or("arcade");
    let scraper = build_scraper(&config_manager).await;

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

/// Scrape + descarga media para una lista de juegos por ID de la BD.
/// El frontend llama esto con 1 ID a la vez desde useScraperStore.batchScrape().
/// Actualiza title/description/year/players en la BD al terminar cada juego.
/// Los archivos de imagen se guardan en ./media/<sistema>/<tipo>/<nombre>.
#[tauri::command]
pub async fn scraper_batch_scrape(
    game_ids: Vec<i64>,
    db: State<'_, Arc<Database>>,
    config_manager: State<'_, Arc<ConfigManager>>,
) -> Result<String, String> {
    let scraper = build_scraper(&config_manager).await;

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
