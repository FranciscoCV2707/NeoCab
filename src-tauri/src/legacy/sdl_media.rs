use crate::Result;
use std::path::{Path, PathBuf};

/// Media loader for legacy Windows XP mode (no image rendering, just paths)
pub struct MediaLoader {
    theme_path: PathBuf,
    media_path: PathBuf,
}

impl MediaLoader {
    /// Initialize media loader with theme and media paths
    pub fn new(theme_path: impl AsRef<Path>, media_path: impl AsRef<Path>) -> Result<Self> {
        let theme_path = theme_path.as_ref().to_path_buf();
        let media_path = media_path.as_ref().to_path_buf();

        tracing::info!("Legacy MediaLoader initialized");
        tracing::info!("  Theme path: {}", theme_path.display());
        tracing::info!("  Media path: {}", media_path.display());

        Ok(Self {
            theme_path,
            media_path,
        })
    }

    /// Get theme folder path
    pub fn get_theme_path(&self) -> &Path {
        &self.theme_path
    }

    /// Get media folder path
    pub fn get_media_path(&self) -> &Path {
        &self.media_path
    }

    /// Check if a specific system has media available
    pub fn has_system_media(&self, system: &str) -> bool {
        let system_media = self.media_path.join(system);
        system_media.exists() && system_media.is_dir()
    }

    /// List available systems with media
    pub fn list_available_systems(&self) -> Result<Vec<String>> {
        let mut systems = Vec::new();

        if !self.media_path.exists() {
            tracing::warn!("Media path does not exist: {}", self.media_path.display());
            return Ok(systems);
        }

        if let Ok(entries) = std::fs::read_dir(&self.media_path) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if entry.path().is_dir() {
                        systems.push(name.to_string());
                    }
                }
            }
        }

        systems.sort();
        Ok(systems)
    }

    /// Get wheel image path for a system (if exists)
    pub fn get_wheel_image(&self, system: &str) -> Option<PathBuf> {
        let wheel_path = self.media_path.join(system).join("wheel.png");
        if wheel_path.exists() {
            return Some(wheel_path);
        }

        let wheel_path = self.media_path.join(system).join("wheel.jpg");
        if wheel_path.exists() {
            return Some(wheel_path);
        }

        None
    }

    /// Get game list image for a system (if exists)
    pub fn get_gamelist_background(&self, system: &str) -> Option<PathBuf> {
        let bg_path = self.media_path.join(system).join("gamelist_bg.png");
        if bg_path.exists() {
            return Some(bg_path);
        }

        let bg_path = self.media_path.join(system).join("gamelist_bg.jpg");
        if bg_path.exists() {
            return Some(bg_path);
        }

        None
    }

    /// Get theme colors (fallback arcade colors if theme not available)
    pub fn get_theme_colors(&self) -> ThemeColors {
        ThemeColors {
            primary: (255, 107, 53),         // Arcade orange
            secondary: (33, 150, 243),       // Blue
            text_primary: (224, 224, 224),   // Light gray
            text_secondary: (153, 153, 153), // Medium gray
            background: (15, 15, 15),        // Nearly black
        }
    }
}

#[derive(Debug, Clone)]
pub struct ThemeColors {
    pub primary: (u8, u8, u8),
    pub secondary: (u8, u8, u8),
    pub text_primary: (u8, u8, u8),
    pub text_secondary: (u8, u8, u8),
    pub background: (u8, u8, u8),
}

impl Default for MediaLoader {
    fn default() -> Self {
        Self {
            theme_path: PathBuf::from("./config/themes"),
            media_path: PathBuf::from("./config/media"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_media_loader_creation() {
        let loader = MediaLoader::new("./config/themes", "./config/media").unwrap();
        assert_eq!(loader.get_theme_path(), Path::new("./config/themes"));
        assert_eq!(loader.get_media_path(), Path::new("./config/media"));
    }

    #[test]
    fn test_theme_colors() {
        let loader = MediaLoader::default();
        let colors = loader.get_theme_colors();
        assert_eq!(colors.primary, (255, 107, 53));
    }
}
