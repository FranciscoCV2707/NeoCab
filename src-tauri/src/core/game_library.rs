use std::path::Path;
use std::sync::Arc;
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

    pub async fn get_games(
        &self,
        system_name: &str,
        search: Option<&str>,
        genre: Option<&str>,
        only_favorites: bool,
    ) -> Result<Vec<crate::models::Game>> {
        match system_name {
            "virtual-all" => {
                return self.db.get_games_by_system(0, search, genre, only_favorites).await;
            }
            "virtual-favorites" => {
                return self.db.get_games_by_system(0, search, genre, true).await;
            }
            "virtual-recent" => {
                return self.db.get_games_by_system(0, search, genre, only_favorites).await;
            }
            _ => {}
        }

        let system = self.db.get_system_by_name(system_name).await?;
        if let Some(sys) = system {
            self.db.get_games_by_system(sys.id, search, genre, only_favorites).await
        } else {
            Ok(vec![])
        }
    }

    pub async fn scan_roms<F>(&self, roms_dir: &Path, on_progress: F) -> Result<usize>
    where
        F: Fn(usize, usize, &str) + Send + Sync + 'static
    {
        info!("Starting async ROM scan in {:?}", roms_dir);

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

        let supported = supported_extensions;
        let roms_dir_buf = roms_dir.to_path_buf();

        let files: Vec<_> = tokio::task::spawn_blocking(move || {
            walkdir::WalkDir::new(roms_dir_buf)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
                .filter(|e| {
                    let ext = e.path().extension()
                        .and_then(|e| e.to_str())
                        .map(|e| e.to_lowercase());
                    ext.map(|e| supported.contains(&e)).unwrap_or(false)
                })
                .collect()
        })
        .await
        .map_err(|e| crate::error::NeoCabError::Other(e.to_string()))?;

        let total_files = files.len();
        let mut games_found = 0;

        for (i, entry) in files.iter().enumerate() {
            let path = entry.path();
            let file_name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");

            on_progress(i + 1, total_files, file_name);

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

        info!("ROM scan complete. Found {} new games", games_found);
        Ok(games_found)
    }

    async fn index_game(&self, path: &Path) -> Result<bool> {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        // Use streaming CRC32 to avoid OOM for large files
        use tokio::io::AsyncReadExt;
        let mut file = tokio::fs::File::open(path).await?;
        let mut hasher = crc32fast::Hasher::new();
        let mut buffer = [0u8; 8192];
        
        loop {
            let n = file.read(&mut buffer).await?;
            if n == 0 { break; }
            hasher.update(&buffer[..n]);
        }
        
        let crc32 = format!("{:08x}", hasher.finalize());

        if self.db.get_game_by_crc32(&crc32).await?.is_some() {
            return Ok(false);
        }

        let system_id = self.detect_system(path).await?;
        let file_size = tokio::fs::metadata(path).await.map(|m| m.len() as i64).ok();

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

        systems.first().map(|s| s.id).ok_or_else(|| {
            sqlx::Error::RowNotFound.into()
        })
    }
}