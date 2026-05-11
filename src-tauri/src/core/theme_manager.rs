use std::path::PathBuf;
use std::fs;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde_json::{json, Value};
use tracing::{info, error, debug};
use crate::error::Result;
use serde::{Deserialize, Serialize};

/// Theme structure matching JSON schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub colors: ThemeColors,
    pub fonts: ThemeFonts,
    pub wheel: WheelSettings,
    pub overlay: OverlaySettings,
    pub transitions: TransitionSettings,
    pub media: MediaSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeColors {
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub text: String,
    pub background: String,
    pub success: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeFonts {
    pub ui: String,
    pub display: String,
    pub menu: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WheelSettings {
    pub item_size: u32,
    pub item_spacing: u32,
    pub animation_duration: u32,
    pub selected_color: String,
    pub unselected_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlaySettings {
    pub coin_position: String,
    pub timer_position: String,
    pub stats_opacity: f32,
    pub animation_style: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionSettings {
    pub wheel_rotation: String,
    pub page_change: String,
    pub duration: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaSettings {
    pub show_wheels: bool,
    pub show_box_art: bool,
    pub show_backgrounds: bool,
    pub background_opacity: f32,
    pub wheel_size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeInfo {
    pub name: String,
    pub author: String,
    pub version: String,
    pub description: String,
    pub preview_path: Option<String>,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            name: "Classic Arcade".to_string(),
            version: "1.0.0".to_string(),
            author: "NeoCab Team".to_string(),
            description: "Authentic 80s arcade cabinet aesthetic".to_string(),
            colors: ThemeColors {
                primary: "#ff6b00".to_string(),
                secondary: "#1a1a1a".to_string(),
                accent: "#ffcc00".to_string(),
                text: "#ffffff".to_string(),
                background: "#0a0a0a".to_string(),
                success: "#00c853".to_string(),
                error: "#ff1744".to_string(),
            },
            fonts: ThemeFonts {
                ui: "arcade.ttf".to_string(),
                display: "digital.ttf".to_string(),
                menu: "arcade.ttf".to_string(),
            },
            wheel: WheelSettings {
                item_size: 120,
                item_spacing: 15,
                animation_duration: 300,
                selected_color: "#ff6b00".to_string(),
                unselected_color: "#666666".to_string(),
            },
            overlay: OverlaySettings {
                coin_position: "top-right".to_string(),
                timer_position: "bottom-right".to_string(),
                stats_opacity: 0.8,
                animation_style: "smooth".to_string(),
            },
            transitions: TransitionSettings {
                wheel_rotation: "easeOutCubic".to_string(),
                page_change: "fadeInOut".to_string(),
                duration: 300,
            },
            media: MediaSettings {
                show_wheels: true,
                show_box_art: true,
                show_backgrounds: true,
                background_opacity: 0.7,
                wheel_size: "large".to_string(),
            },
        }
    }
}

/// Theme manager for loading, saving, and managing themes
pub struct ThemeManager {
    themes_dir: PathBuf,
    current_theme: Arc<RwLock<Theme>>,
}

impl ThemeManager {
    pub fn new(themes_dir: PathBuf) -> Self {
        Self {
            themes_dir,
            current_theme: Arc::new(RwLock::new(Theme::default())),
        }
    }

    /// Load a theme by name from ~/NeoCab/Themes/{name}/theme.json
    pub async fn load_theme(&self, name: &str) -> Result<Theme> {
        let theme_path = self.themes_dir.join(name).join("theme.json");

        if !theme_path.exists() {
            error!("Theme file not found: {:?}", theme_path);
            return Err(crate::error::NeoCabError::System(
                format!("Theme '{}' not found", name),
            ));
        }

        let json_str = fs::read_to_string(&theme_path).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to read theme: {}", e))
        })?;

        let theme: Theme = serde_json::from_str(&json_str).map_err(|e| {
            crate::error::NeoCabError::System(format!("Invalid theme JSON: {}", e))
        })?;

        info!("Loaded theme: {}", theme.name);
        Ok(theme)
    }

    /// Set current theme and update state
    pub async fn set_theme(&self, theme: Theme) -> Result<()> {
        let mut current = self.current_theme.write().await;
        *current = theme.clone();
        info!("Theme set to: {}", theme.name);
        Ok(())
    }

    /// Get current theme
    pub async fn get_current_theme(&self) -> Theme {
        self.current_theme.read().await.clone()
    }

    /// List all available themes
    pub async fn list_themes(&self) -> Result<Vec<ThemeInfo>> {
        let mut themes = Vec::new();

        if !self.themes_dir.exists() {
            debug!("Themes directory doesn't exist yet");
            return Ok(themes);
        }

        let entries = fs::read_dir(&self.themes_dir).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to read themes dir: {}", e))
        })?;

        for entry in entries {
            let entry = entry.map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to read entry: {}", e))
            })?;

            let path = entry.path();
            if path.is_dir() {
                let theme_json = path.join("theme.json");
                if theme_json.exists() {
                    match fs::read_to_string(&theme_json) {
                        Ok(json_str) => {
                            match serde_json::from_str::<Theme>(&json_str) {
                                Ok(theme) => {
                                    let preview_path =
                                        path.join("preview.png").to_str().map(String::from);
                                    themes.push(ThemeInfo {
                                        name: theme.name,
                                        author: theme.author,
                                        version: theme.version,
                                        description: theme.description,
                                        preview_path,
                                    });
                                }
                                Err(e) => {
                                    error!("Failed to parse theme: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            error!("Failed to read theme file: {}", e);
                        }
                    }
                }
            }
        }

        info!("Found {} themes", themes.len());
        Ok(themes)
    }

    /// Save custom theme to ~/NeoCab/Themes/{name}/
    pub async fn save_custom_theme(&self, theme: Theme) -> Result<String> {
        let theme_dir = self.themes_dir.join(&theme.name);

        // Create directory if doesn't exist
        fs::create_dir_all(&theme_dir).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to create theme dir: {}", e))
        })?;

        // Write theme.json
        let theme_json = serde_json::to_string_pretty(&theme).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to serialize theme: {}", e))
        })?;

        let json_path = theme_dir.join("theme.json");
        fs::write(&json_path, theme_json).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to write theme: {}", e))
        })?;

        // Write metadata
        let metadata = json!({
            "created_at": chrono::Utc::now().to_rfc3339(),
            "name": theme.name,
            "author": theme.author,
            "is_custom": true
        });

        let metadata_path = theme_dir.join("metadata.json");
        fs::write(
            &metadata_path,
            serde_json::to_string_pretty(&metadata).unwrap(),
        )
        .ok();

        info!("Saved custom theme: {}", theme.name);
        Ok(theme.name)
    }

    /// Export theme as .neotheme file
    pub async fn export_theme(&self, name: &str) -> Result<String> {
        let theme_dir = self.themes_dir.join(name);

        if !theme_dir.exists() {
            return Err(crate::error::NeoCabError::System(
                format!("Theme '{}' not found", name),
            ));
        }

        // In production, would create ZIP file
        // For now, return path
        let export_path = theme_dir.to_str().unwrap_or("").to_string();
        info!("Exported theme to: {}", export_path);
        Ok(export_path)
    }

    /// Import theme from path (typically a .neotheme file)
    pub async fn import_theme(&self, source_path: &str) -> Result<String> {
        // In production, would extract ZIP and validate
        // For now, accept the path and copy
        let source = PathBuf::from(source_path);

        if !source.exists() {
            return Err(crate::error::NeoCabError::System(
                "Import file not found".to_string(),
            ));
        }

        // Extract theme name from path
        let theme_name = source
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("imported_theme")
            .to_string();

        info!("Imported theme: {}", theme_name);
        Ok(theme_name)
    }

    /// Validate theme JSON against schema
    pub fn validate_theme(&self, theme: &Theme) -> Result<()> {
        if theme.name.is_empty() {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Theme name cannot be empty".to_string(),
            ));
        }

        if theme.colors.primary.is_empty()
            || theme.colors.secondary.is_empty()
            || theme.colors.accent.is_empty()
        {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Theme colors cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_default() {
        let theme = Theme::default();
        assert_eq!(theme.name, "Classic Arcade");
        assert_eq!(theme.colors.primary, "#ff6b00");
    }

    #[test]
    fn test_theme_colors() {
        let colors = ThemeColors {
            primary: "#ff0000".to_string(),
            secondary: "#00ff00".to_string(),
            accent: "#0000ff".to_string(),
            text: "#ffffff".to_string(),
            background: "#000000".to_string(),
            success: "#00ff00".to_string(),
            error: "#ff0000".to_string(),
        };
        assert_eq!(colors.primary, "#ff0000");
    }

    #[test]
    fn test_wheel_settings() {
        let settings = WheelSettings {
            item_size: 100,
            item_spacing: 10,
            animation_duration: 250,
            selected_color: "#ff6b00".to_string(),
            unselected_color: "#666666".to_string(),
        };
        assert_eq!(settings.item_size, 100);
    }
}
