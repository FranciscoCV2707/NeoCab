use crate::error::{NeoCabError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFile {
    pub path: PathBuf,
    pub media_type: MediaType,
    pub system: String,
    pub game_name: String,
    pub file_size: u64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum MediaType {
    Wheel,
    BoxArt,
    Background,
    Screenshot,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaLibrary {
    pub wheels: HashMap<String, Vec<MediaFile>>,
    pub box_art: HashMap<String, Vec<MediaFile>>,
    pub backgrounds: HashMap<String, Vec<MediaFile>>,
    pub screenshots: HashMap<String, Vec<MediaFile>>,
    pub total_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaStats {
    pub total_files: u64,
    pub total_size: u64,
    pub wheels_count: u64,
    pub box_art_count: u64,
    pub backgrounds_count: u64,
    pub screenshots_count: u64,
}

pub struct MediaManager {
    media_path: PathBuf,
    cache_max_size: u64,
}

impl MediaManager {
    pub fn new(media_path: PathBuf, cache_max_size: u64) -> Self {
        Self {
            media_path,
            cache_max_size,
        }
    }

    /// Scan media directory and build media library
    pub async fn scan_media(&self) -> Result<MediaLibrary> {
        let mut library = MediaLibrary {
            wheels: HashMap::new(),
            box_art: HashMap::new(),
            backgrounds: HashMap::new(),
            screenshots: HashMap::new(),
            total_size: 0,
        };

        // HyperSpin structure: media/{system}/Images/{Wheels,Boxes,Backgrounds}
        let systems_path = self.media_path.join("media");

        if !systems_path.exists() {
            fs::create_dir_all(&systems_path)
                .await
                ?;
            return Ok(library);
        }

        let mut entries = fs::read_dir(&systems_path)
            .await
            ?;

        while let Some(system_entry) = entries
            .next_entry()
            .await
            ?
        {
            let system_path = system_entry.path();

            if system_path.is_dir() {
                let system_name = system_path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                self.scan_system_media(&system_path, &system_name, &mut library)
                    .await?;
            }
        }

        Ok(library)
    }

    async fn scan_system_media(
        &self,
        system_path: &Path,
        system_name: &str,
        library: &mut MediaLibrary,
    ) -> Result<()> {
        let images_path = system_path.join("Images");

        if !images_path.exists() {
            return Ok(());
        }

        // Scan Wheels
        let wheels_path = images_path.join("Wheel");
        if wheels_path.exists() {
            self.scan_directory(&wheels_path, MediaType::Wheel, system_name, library)
                .await?;
        }

        // Scan Box Art
        let boxes_path = images_path.join("Boxes");
        if boxes_path.exists() {
            self.scan_directory(&boxes_path, MediaType::BoxArt, system_name, library)
                .await?;
        }

        // Scan Backgrounds
        let backgrounds_path = images_path.join("Backgrounds");
        if backgrounds_path.exists() {
            self.scan_directory(
                &backgrounds_path,
                MediaType::Background,
                system_name,
                library,
            )
            .await?;
        }

        Ok(())
    }

    async fn scan_directory(
        &self,
        dir_path: &Path,
        media_type: MediaType,
        system_name: &str,
        library: &mut MediaLibrary,
    ) -> Result<()> {
        let mut entries = fs::read_dir(dir_path)
            .await
            ?;

        while let Some(entry) = entries
            .next_entry()
            .await
            ?
        {
            let path = entry.path();

            if self.is_supported_image(&path) {
                if let Ok(metadata) = fs::metadata(&path).await {
                    let file_size = metadata.len();
                    library.total_size += file_size;

                    let game_name = path
                        .file_stem()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string();

                    let media_file = MediaFile {
                        path: path.clone(),
                        media_type,
                        system: system_name.to_string(),
                        game_name,
                        file_size,
                    };

                    match media_type {
                        MediaType::Wheel => library
                            .wheels
                            .entry(system_name.to_string())
                            .or_insert_with(Vec::new)
                            .push(media_file),
                        MediaType::BoxArt => library
                            .box_art
                            .entry(system_name.to_string())
                            .or_insert_with(Vec::new)
                            .push(media_file),
                        MediaType::Background => library
                            .backgrounds
                            .entry(system_name.to_string())
                            .or_insert_with(Vec::new)
                            .push(media_file),
                        MediaType::Screenshot => library
                            .screenshots
                            .entry(system_name.to_string())
                            .or_insert_with(Vec::new)
                            .push(media_file),
                        MediaType::Custom => {}
                    }
                }
            }
        }

        Ok(())
    }

    /// Get media file for specific game
    pub async fn get_media(&self, system: &str, game_name: &str, media_type: MediaType) -> Result<Option<PathBuf>> {
        let library = self.scan_media().await?;

        let map = match media_type {
            MediaType::Wheel => &library.wheels,
            MediaType::BoxArt => &library.box_art,
            MediaType::Background => &library.backgrounds,
            MediaType::Screenshot => &library.screenshots,
            MediaType::Custom => return Ok(None),
        };

        if let Some(files) = map.get(system) {
            for file in files {
                if file.game_name.to_lowercase() == game_name.to_lowercase() {
                    return Ok(Some(file.path.clone()));
                }
            }
        }

        Ok(None)
    }

    /// Get media statistics
    pub async fn get_stats(&self) -> Result<MediaStats> {
        let library = self.scan_media().await?;

        let wheels_count = library.wheels.values().map(|v| v.len()).sum::<usize>() as u64;
        let box_art_count = library.box_art.values().map(|v| v.len()).sum::<usize>() as u64;
        let backgrounds_count = library.backgrounds.values().map(|v| v.len()).sum::<usize>() as u64;
        let screenshots_count = library.screenshots.values().map(|v| v.len()).sum::<usize>() as u64;

        let total_files = wheels_count + box_art_count + backgrounds_count + screenshots_count;

        Ok(MediaStats {
            total_files,
            total_size: library.total_size,
            wheels_count,
            box_art_count,
            backgrounds_count,
            screenshots_count,
        })
    }

    /// Organize media from source directory to HyperSpin structure
    pub async fn organize_media(&self, source_dir: &str) -> Result<u64> {
        let source_path = PathBuf::from(source_dir);

        if !source_path.exists() {
            return Err(NeoCabError::InvalidInput(
                "Source directory does not exist".to_string(),
            ));
        }

        let mut files_organized = 0u64;
        let mut entries = fs::read_dir(&source_path)
            .await
            ?;

        while let Some(entry) = entries
            .next_entry()
            .await
            ?
        {
            let path = entry.path();

            if self.is_supported_image(&path) {
                // Simple naming convention: {system}_{game}.{ext}
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    let parts: Vec<&str> = file_name.split('_').collect();

                    if parts.len() >= 2 {
                        let system = parts[0];
                        let media_type = self.infer_media_type(file_name);

                        let dest_dir = self.media_path.join("media").join(system).join("Images");

                        let type_dir = match media_type {
                            MediaType::Wheel => "Wheel",
                            MediaType::BoxArt => "Boxes",
                            MediaType::Background => "Backgrounds",
                            MediaType::Screenshot => "Screenshots",
                            MediaType::Custom => "Custom",
                        };

                        let dest = dest_dir.join(type_dir);
                        fs::create_dir_all(&dest)
                            .await
                            ?;

                        let target_file = dest.join(file_name);
                        fs::copy(&path, &target_file)
                            .await
                            ?;

                        files_organized += 1;
                    }
                }
            }
        }

        Ok(files_organized)
    }

    /// Infer media type from filename
    fn infer_media_type(&self, filename: &str) -> MediaType {
        let lower = filename.to_lowercase();

        if lower.contains("wheel") || lower.contains("logo") {
            MediaType::Wheel
        } else if lower.contains("box") || lower.contains("art") {
            MediaType::BoxArt
        } else if lower.contains("back") || lower.contains("bg") {
            MediaType::Background
        } else if lower.contains("screen") || lower.contains("shot") {
            MediaType::Screenshot
        } else {
            MediaType::Custom
        }
    }

    /// Check if file is a supported image format
    fn is_supported_image(&self, path: &Path) -> bool {
        match path.extension().and_then(|e| e.to_str()) {
            Some("png") | Some("jpg") | Some("jpeg") | Some("gif") | Some("webp") => true,
            _ => false,
        }
    }

    /// Get media library for a specific system
    pub async fn get_system_media(&self, system: &str) -> Result<MediaLibrary> {
        let library = self.scan_media().await?;

        let mut filtered = MediaLibrary {
            wheels: Default::default(),
            box_art: Default::default(),
            backgrounds: Default::default(),
            screenshots: Default::default(),
            total_size: 0,
        };

        if let Some(wheels) = library.wheels.get(system) {
            filtered
                .wheels
                .insert(system.to_string(), wheels.clone());
            filtered.total_size += wheels.iter().map(|f| f.file_size).sum::<u64>();
        }

        if let Some(boxes) = library.box_art.get(system) {
            filtered
                .box_art
                .insert(system.to_string(), boxes.clone());
            filtered.total_size += boxes.iter().map(|f| f.file_size).sum::<u64>();
        }

        if let Some(backgrounds) = library.backgrounds.get(system) {
            filtered.backgrounds.insert(system.to_string(), backgrounds.clone());
            filtered.total_size += backgrounds.iter().map(|f| f.file_size).sum::<u64>();
        }

        if let Some(screenshots) = library.screenshots.get(system) {
            filtered
                .screenshots
                .insert(system.to_string(), screenshots.clone());
            filtered.total_size += screenshots.iter().map(|f| f.file_size).sum::<u64>();
        }

        Ok(filtered)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_infer_media_type() {
        let manager = MediaManager::new(PathBuf::from("/tmp"), 1024 * 1024 * 256);

        assert_eq!(manager.infer_media_type("mame_pacman_wheel.png"), MediaType::Wheel);
        assert_eq!(manager.infer_media_type("nes_mario_box.jpg"), MediaType::BoxArt);
        assert_eq!(manager.infer_media_type("snes_zelda_background.png"), MediaType::Background);
        assert_eq!(manager.infer_media_type("ps1_ff7_screenshot.jpg"), MediaType::Screenshot);
    }

    #[test]
    fn test_is_supported_image() {
        let manager = MediaManager::new(PathBuf::from("/tmp"), 1024 * 1024 * 256);

        assert!(manager.is_supported_image(&PathBuf::from("image.png")));
        assert!(manager.is_supported_image(&PathBuf::from("image.jpg")));
        assert!(manager.is_supported_image(&PathBuf::from("image.webp")));
        assert!(!manager.is_supported_image(&PathBuf::from("image.txt")));
        assert!(!manager.is_supported_image(&PathBuf::from("image.zip")));
    }
}
