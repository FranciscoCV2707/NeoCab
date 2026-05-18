use crate::db::Database;
use crate::error::{NeoCabError, Result};
use crate::models::Game;
use quick_xml::de::from_str;
use serde::Deserialize;
use std::fs;
use std::path::Path;
use std::sync::Arc;

#[derive(Debug, Deserialize)]
struct Gamelist {
    #[serde(rename = "game", default)]
    games: Vec<EsGame>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct EsGame {
    path: String,
    name: String,
    desc: Option<String>,
    image: Option<String>,
    video: Option<String>,
    marquee: Option<String>,
    thumbnail: Option<String>,
    rating: Option<f32>,
    releasedate: Option<String>,
    developer: Option<String>,
    publisher: Option<String>,
    genre: Option<String>,
    players: Option<String>,
}

#[derive(Debug, Deserialize)]
struct HyperspinMenu {
    #[serde(rename = "game", default)]
    games: Vec<HsGame>,
}

#[derive(Debug, Deserialize)]
struct HsGame {
    #[serde(rename = "@name")]
    name: String,
    description: Option<String>,
    manufacturer: Option<String>,
    year: Option<String>,
    genre: Option<String>,
    rating: Option<f32>,
}

#[derive(Debug, Deserialize)]
struct LaunchBoxData {
    #[serde(rename = "Game", default)]
    games: Vec<LbGame>,
}

#[derive(Debug, Deserialize)]
struct LbGame {
    #[serde(rename = "Title")]
    title: String,
    #[serde(rename = "ApplicationPath")]
    application_path: String,
    #[serde(rename = "Notes")]
    notes: Option<String>,
    #[serde(rename = "ReleaseYear")]
    release_year: Option<i64>,
    #[serde(rename = "Developer")]
    developer: Option<String>,
    #[serde(rename = "Publisher")]
    publisher: Option<String>,
    #[serde(rename = "Genre")]
    genre: Option<String>,
    #[serde(rename = "PlayCount")]
    play_count: Option<i64>,
    #[serde(rename = "StarRating")]
    star_rating: Option<f32>,
}

pub struct UniversalImporter {
    db: Arc<Database>,
}

impl UniversalImporter {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn import_es2_xml(&self, xml_path: &Path, system_id: i64) -> Result<usize> {
        let content = fs::read_to_string(xml_path)?;
        let gamelist: Gamelist = from_str(&content)
            .map_err(|e| NeoCabError::Config(format!("XML Parse Error: {}", e)))?;

        let mut count = 0;
        for es_game in gamelist.games {
            // Convert EsGame to NeoCab Game model
            let filename = Path::new(&es_game.path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(&es_game.path)
                .to_string();

            let game = Game {
                id: 0,
                title: es_game.name,
                sort_title: Some(filename.clone()),
                system_id,
                emulator_id: Some(1),
                rom_path: es_game.path.clone(),
                filename: Some(filename),
                file_size: Some(0),
                crc32: None,
                sha1: None,
                md5: None,
                description: es_game.desc,
                year: es_game
                    .releasedate
                    .as_ref()
                    .and_then(|d| d.get(0..4))
                    .and_then(|s| s.parse().ok()),
                developer: es_game.developer,
                publisher: es_game.publisher,
                genre: es_game.genre,
                players: es_game.players.as_ref().and_then(|p| p.parse().ok()),
                rating: es_game.rating.unwrap_or(0.0) as f64,
                rating_count: 0,
                is_favorite: 0,
                is_hidden: 0,
                has_save_state: 0,
                play_count: 0,
                total_play_time: 0,
                last_played: None,
                image_path: None,
                marquee_path: None,
                video_path: None,
                external_id: None,
                region: None,
                language: None,
                created_at: Some("".to_string()),
                updated_at: Some("".to_string()),
            };

            self.db.insert_game(&game).await?;
            count += 1;
        }

        Ok(count)
    }

    pub async fn import_hyperspin_xml(&self, xml_path: &Path, system_id: i64) -> Result<usize> {
        let content = fs::read_to_string(xml_path)?;
        let menu: HyperspinMenu = from_str(&content)
            .map_err(|e| NeoCabError::Config(format!("XML Parse Error: {}", e)))?;

        let mut count = 0;
        for hs_game in menu.games {
            let filename = format!("{}.zip", hs_game.name);
            let rom_path = format!("./roms/{}", filename);

            let game = Game {
                id: 0,
                title: hs_game.description.clone().unwrap_or(hs_game.name.clone()),
                sort_title: Some(filename.clone()),
                system_id,
                emulator_id: Some(1),
                rom_path,
                filename: Some(filename),
                file_size: Some(0),
                crc32: None,
                sha1: None,
                md5: None,
                description: hs_game.description,
                year: hs_game.year.as_ref().and_then(|s| s.parse().ok()),
                developer: hs_game.manufacturer.clone(),
                publisher: hs_game.manufacturer,
                genre: hs_game.genre,
                players: None,
                rating: hs_game.rating.unwrap_or(0.0) as f64,
                rating_count: 0,
                is_favorite: 0,
                is_hidden: 0,
                has_save_state: 0,
                play_count: 0,
                total_play_time: 0,
                last_played: None,
                image_path: None,
                marquee_path: None,
                video_path: None,
                external_id: None,
                region: None,
                language: None,
                created_at: Some("".to_string()),
                updated_at: Some("".to_string()),
            };

            self.db.insert_game(&game).await?;
            count += 1;
        }

        Ok(count)
    }

    pub async fn import_launchbox_xml(&self, xml_path: &Path, system_id: i64) -> Result<usize> {
        let content = fs::read_to_string(xml_path)?;
        let lb_data: LaunchBoxData = from_str(&content)
            .map_err(|e| NeoCabError::Config(format!("XML Parse Error: {}", e)))?;

        let mut count = 0;
        for lb_game in lb_data.games {
            let filename = Path::new(&lb_game.application_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(&lb_game.application_path)
                .to_string();

            let game = Game {
                id: 0,
                title: lb_game.title,
                sort_title: Some(filename.clone()),
                system_id,
                emulator_id: Some(1),
                rom_path: lb_game.application_path.clone(),
                filename: Some(filename),
                file_size: Some(0),
                crc32: None,
                sha1: None,
                md5: None,
                description: lb_game.notes,
                year: lb_game.release_year,
                developer: lb_game.developer,
                publisher: lb_game.publisher,
                genre: lb_game.genre,
                players: None,
                rating: lb_game.star_rating.unwrap_or(0.0) as f64,
                rating_count: 0,
                is_favorite: 0,
                is_hidden: 0,
                has_save_state: 0,
                play_count: lb_game.play_count.unwrap_or(0),
                total_play_time: 0,
                last_played: None,
                image_path: None,
                marquee_path: None,
                video_path: None,
                external_id: None,
                region: None,
                language: None,
                created_at: Some("".to_string()),
                updated_at: Some("".to_string()),
            };

            self.db.insert_game(&game).await?;
            count += 1;
        }

        Ok(count)
    }
}
