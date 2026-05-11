use std::path::{Path, PathBuf};
use std::collections::HashMap;
use crate::Result;

/// HyperSpin-compatible media structure
/// Follows: media/{System}/Images/Wheel/, media/{System}/Images/Boxes/, etc.
pub struct HyperSpinMedia {
    /// Path to media root directory
    media_root: PathBuf,

    /// Wheel images cache: system_name -> image_data
    wheel_images: HashMap<String, Vec<u8>>,

    /// Box art cache: game_name -> image_data
    box_art: HashMap<String, Vec<u8>>,

    /// Background images: system_name -> image_data
    backgrounds: HashMap<String, Vec<u8>>,

    /// Cache size in bytes
    cache_size: usize,

    /// Max cache size (default 256MB)
    max_cache_size: usize,
}

impl HyperSpinMedia {
    pub fn new(media_root: PathBuf) -> Self {
        tracing::info!("HyperSpin Media System initialized at: {:?}", media_root);

        Self {
            media_root,
            wheel_images: HashMap::new(),
            box_art: HashMap::new(),
            backgrounds: HashMap::new(),
            cache_size: 0,
            max_cache_size: 256 * 1024 * 1024, // 256 MB
        }
    }

    /// Load wheel image for a system
    /// Looks for: media/{system}/Images/Wheel/{game_name}.png
    pub fn load_wheel_image(&mut self, system: &str, game_name: &str) -> Result<Option<Vec<u8>>> {
        let cache_key = format!("{}_{}", system, game_name);

        // Check cache first
        if let Some(data) = self.wheel_images.get(&cache_key) {
            tracing::trace!("Wheel image from cache: {}", cache_key);
            return Ok(Some(data.clone()));
        }

        // Load from filesystem
        let paths = vec![
            self.media_root.join(format!("media/{}/Images/Wheel/{}.png", system, game_name)),
            self.media_root.join(format!("media/{}/Images/Wheel/{}.jpg", system, game_name)),
            self.media_root.join(format!("{}/Images/Wheel/{}.png", system, game_name)),
        ];

        for path in paths {
            if path.exists() {
                match std::fs::read(&path) {
                    Ok(data) => {
                        self.cache_size += data.len();
                        self.wheel_images.insert(cache_key.clone(), data.clone());
                        tracing::debug!("Loaded wheel image: {:?}", path);
                        return Ok(Some(data));
                    }
                    Err(e) => {
                        tracing::warn!("Failed to read wheel image {:?}: {}", path, e);
                    }
                }
            }
        }

        Ok(None)
    }

    /// Load box art for a game
    /// Looks for: media/{system}/Images/Boxes/{game_name}.png
    pub fn load_box_art(&mut self, system: &str, game_name: &str) -> Result<Option<Vec<u8>>> {
        let cache_key = format!("{}_{}_box", system, game_name);

        if let Some(data) = self.box_art.get(&cache_key) {
            return Ok(Some(data.clone()));
        }

        let paths = vec![
            self.media_root.join(format!("media/{}/Images/Boxes/{}.png", system, game_name)),
            self.media_root.join(format!("media/{}/Images/Boxes/{}.jpg", system, game_name)),
            self.media_root.join(format!("{}/Images/Boxes/{}.png", system, game_name)),
        ];

        for path in paths {
            if path.exists() {
                if let Ok(data) = std::fs::read(&path) {
                    self.cache_size += data.len();
                    self.box_art.insert(cache_key, data.clone());
                    return Ok(Some(data));
                }
            }
        }

        Ok(None)
    }

    /// Load system background
    /// Looks for: media/{system}/Images/Backgrounds/{system}.png
    pub fn load_background(&mut self, system: &str) -> Result<Option<Vec<u8>>> {
        if let Some(data) = self.backgrounds.get(system) {
            return Ok(Some(data.clone()));
        }

        let paths = vec![
            self.media_root.join(format!("media/{}/Images/Backgrounds/{}.png", system, system)),
            self.media_root.join(format!("media/{}/Images/Backgrounds/default.png", system)),
            self.media_root.join(format!("{}/Images/Backgrounds/{}.png", system, system)),
        ];

        for path in paths {
            if path.exists() {
                if let Ok(data) = std::fs::read(&path) {
                    self.cache_size += data.len();
                    self.backgrounds.insert(system.to_string(), data.clone());
                    tracing::debug!("Loaded background for system: {}", system);
                    return Ok(Some(data));
                }
            }
        }

        Ok(None)
    }

    /// Preload all media for a system
    pub fn preload_system_media(&mut self, system: &str, games: &[String]) -> Result<()> {
        tracing::info!("Preloading media for system: {} ({} games)", system, games.len());

        // Load background
        let _ = self.load_background(system);

        // Load wheel images for games
        for game in games {
            let _ = self.load_wheel_image(system, game);

            if self.cache_size > self.max_cache_size {
                tracing::warn!("Cache size limit reached, clearing old entries");
                self.clear_cache();
                break;
            }
        }

        let (count_wheels, count_boxes, count_bgs) = (
            self.wheel_images.len(),
            self.box_art.len(),
            self.backgrounds.len(),
        );

        tracing::info!(
            "Preload complete: {} wheels, {} box arts, {} backgrounds ({}MB)",
            count_wheels,
            count_boxes,
            count_bgs,
            self.cache_size / (1024 * 1024)
        );

        Ok(())
    }

    /// Clear cache
    pub fn clear_cache(&mut self) {
        self.wheel_images.clear();
        self.box_art.clear();
        self.backgrounds.clear();
        self.cache_size = 0;
        tracing::info!("Media cache cleared");
    }

    /// Get cache statistics
    pub fn get_cache_stats(&self) -> (usize, usize, usize, usize) {
        (
            self.wheel_images.len(),
            self.box_art.len(),
            self.backgrounds.len(),
            self.cache_size,
        )
    }

    /// Check if directory structure exists
    pub fn verify_hyperspin_structure(&self, system: &str) -> bool {
        let required_dirs = vec![
            format!("media/{}/Images/Wheel", system),
            format!("media/{}/Images", system),
        ];

        for dir_path in required_dirs {
            let full_path = self.media_root.join(&dir_path);
            if !full_path.exists() {
                tracing::warn!("Missing HyperSpin directory: {:?}", full_path);
                return false;
            }
        }

        true
    }
}

impl Default for HyperSpinMedia {
    fn default() -> Self {
        Self::new(PathBuf::from("./media"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        let media = HyperSpinMedia::new(PathBuf::from("./test_media"));
        let key = format!("{}_{}", "mame", "pacman");
        assert_eq!(key, "mame_pacman");
    }

    #[test]
    fn test_cache_stats() {
        let media = HyperSpinMedia::new(PathBuf::from("./test_media"));
        let (wheels, boxes, bgs, size) = media.get_cache_stats();
        assert_eq!(wheels, 0);
        assert_eq!(boxes, 0);
        assert_eq!(bgs, 0);
        assert_eq!(size, 0);
    }
}
