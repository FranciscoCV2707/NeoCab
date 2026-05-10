use std::path::Path;
use std::sync::Arc;
use walkdir::WalkDir;
use crc32fast::hash;
use tracing::{info, warn};
use crate::db::Database;
use crate::error::Result;
use crate::models::Game;

pub struct GameLibrary {
    db: Arc<Database>,
}

impl GameLibrary {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn scan_roms(&self, roms_dir: &Path) -> Result<usize> {
        info!("Starting ROM scan in {:?}", roms_dir);

        if !roms_dir.exists() {
            warn!("ROMs directory does not exist: {:?}", roms_dir);
            return Ok(0);
        }

        let systems = self.db.get_systems().await?;
        let supported_extensions: std::collections::HashSet<String> = systems
            .iter()
            .flat_map(|s| {
                s.extensions
                    .split(',')
                    .map(|e| e.trim().to_lowercase())
                    .collect::<Vec<_>>()
            })
            .collect();

        info!("Supported extensions: {:?}", supported_extensions);

        let mut games_found = 0;

        for entry in WalkDir::new(roms_dir)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let path = entry.path();

            let extension = path
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| e.to_lowercase());

            if let Some(ext) = extension {
                if !supported_extensions.contains(&ext) {
                    continue;
                }

                match self.index_game(path).await {
                    Ok(is_new) => {
                        if is_new {
                            games_found += 1;
                        }
                    }
                    Err(e) => {
                        warn!("Failed to index {:?}: {}", path, e);
                    }
                }
            }
        }

        info!("ROM scan complete. Found {} new games", games_found);
        Ok(games_found)
    }

    async fn index_game(&self, path: &Path) -> Result<bool> {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        let content = std::fs::read(path)?;
        let crc32 = Self::calculate_crc32(&content);

        // Check if game already exists by CRC32
        if self.db.get_game_by_crc32(&crc32).await?.is_some() {
            return Ok(false);
        }

        let system_id = self.detect_system(path).await?;
        let file_size = std::fs::metadata(path).map(|m| m.len() as i64).ok();

        let game = Game {
            id: 0,
            title: file_name.to_string(),
            sort_title: Some(file_name.to_lowercase()),
            system_id,
            emulator_id: None,
            rom_path: path.to_string_lossy().to_string(),
            filename: Some(file_name.to_string()),
            file_size,
            crc32: Some(crc32),
            sha1: None,
            md5: None,
            description: None,
            year: None,
            developer: None,
            publisher: None,
            genre: None,
            players: None,
            rating: 0.0,
            rating_count: 0,
            play_count: 0,
            total_play_time: 0,
            last_played: None,
            is_favorite: 0,
            is_hidden: 0,
            has_save_state: 0,
            image_path: None,
            marquee_path: None,
            video_path: None,
            external_id: None,
            region: Some("World".to_string()),
            language: Some("en".to_string()),
            created_at: None,
            updated_at: None,
        };

        self.db.insert_game(&game).await?;
        info!("Indexed new game: {}", file_name);
        Ok(true)
    }

    fn calculate_crc32(data: &[u8]) -> String {
        format!("{:08x}", hash(data))
    }

    async fn detect_system(&self, path: &Path) -> Result<i64> {
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .unwrap_or_default();

        let systems = self.db.get_systems().await?;

        for system in &systems {
            if system
                .extensions
                .split(',')
                .map(|e| e.trim().to_lowercase())
                .any(|e| e == extension)
            {
                return Ok(system.id);
            }
        }

        // Default to first system if no exact match found
        systems.first().map(|s| s.id).ok_or_else(|| {
            sqlx::Error::RowNotFound.into()
        })
    }
}
