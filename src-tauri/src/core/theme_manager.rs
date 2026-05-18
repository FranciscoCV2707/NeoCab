use std::path::PathBuf;
use std::fs;
use std::sync::Arc;
use std::collections::HashMap;
use std::io::Write;
use tokio::sync::RwLock;
use serde_json::json;
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
    pub layout: ThemeLayout,
    pub media: MediaSettings,
    pub sounds: ThemeSounds,
    pub effects: ThemeEffects,
    #[serde(default)]
    pub wheel: Option<WheelSettings>,
    #[serde(default)]
    pub overlay: Option<OverlaySettings>,
    #[serde(default)]
    pub transitions: Option<TransitionSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeColors {
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub text: String,
    pub background: String,
    pub surface: String,
    pub border: String,
    pub highlight: String,
    pub success: String,
    pub warning: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeFonts {
    pub ui: String,
    pub title: String,
    pub subtitle: String,
    pub mono: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeLayout {
    pub system_view: String,
    pub game_view: String,
    pub wheel_style: String,
    pub transition: String,
    pub animation_speed: u32,
    pub easing: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSounds {
    pub navigate: String,
    pub select: String,
    pub back: String,
    pub coin: String,
    pub start: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeEffects {
    pub scanlines: bool,
    pub crt_curve: f32,
    pub glow_intensity: f32,
    pub shadow_enabled: bool,
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
    pub video_enabled: bool,
    pub video_loop: bool,
    pub snap_type: String,
    pub marquee_enabled: bool,
    pub wheel_enabled: bool,
    pub box_art_enabled: bool,
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
                accent: "#00ffcc".to_string(),
                text: "#ffffff".to_string(),
                background: "#0a0a0a".to_string(),
                surface: "#1a1a1a".to_string(),
                border: "#ff6b00".to_string(),
                highlight: "#ff8c00".to_string(),
                success: "#00c853".to_string(),
                warning: "#ffcc00".to_string(),
                error: "#ff1744".to_string(),
            },
            fonts: ThemeFonts {
                ui: "Arial".to_string(),
                title: "Impact".to_string(),
                subtitle: "Arial".to_string(),
                mono: "Consolas".to_string(),
            },
            layout: ThemeLayout {
                system_view: "carousel".to_string(),
                game_view: "split".to_string(),
                wheel_style: "3d".to_string(),
                transition: "slide".to_string(),
                animation_speed: 300,
                easing: "easeOutCubic".to_string(),
            },
            media: MediaSettings {
                video_enabled: true,
                video_loop: true,
                snap_type: "video".to_string(),
                marquee_enabled: true,
                wheel_enabled: true,
                box_art_enabled: true,
            },
            sounds: ThemeSounds {
                navigate: "nav.wav".to_string(),
                select: "select.wav".to_string(),
                back: "back.wav".to_string(),
                coin: "coin.wav".to_string(),
                start: "start.wav".to_string(),
            },
            effects: ThemeEffects {
                scanlines: false,
                crt_curve: 0.0,
                glow_intensity: 0.7,
                shadow_enabled: true,
            },
            wheel: Some(WheelSettings {
                item_size: 120,
                item_spacing: 15,
                animation_duration: 300,
                selected_color: "#ff6b00".to_string(),
                unselected_color: "#666666".to_string(),
            }),
            overlay: Some(OverlaySettings {
                coin_position: "top-right".to_string(),
                timer_position: "bottom-right".to_string(),
                stats_opacity: 0.8,
                animation_style: "smooth".to_string(),
            }),
            transitions: Some(TransitionSettings {
                wheel_rotation: "easeOutCubic".to_string(),
                page_change: "fadeInOut".to_string(),
                duration: 300,
            }),
        }
    }
}

/// Theme manager for loading, saving, and managing themes
pub struct ThemeManager {
    themes_dir: PathBuf,
    current_theme: Arc<RwLock<Theme>>,
    system_themes: Arc<RwLock<HashMap<String, Theme>>>,
}

impl ThemeManager {
    pub fn new(themes_dir: PathBuf) -> Self {
        Self {
            themes_dir,
            current_theme: Arc::new(RwLock::new(Theme::default())),
            system_themes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Install bundled themes from src-tauri/bundled-themes/ if they don't exist
    pub fn install_bundled_themes(&self) -> Result<()> {
        if !self.themes_dir.exists() {
            fs::create_dir_all(&self.themes_dir).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to create themes dir: {}", e))
            })?;
        }

        let bundled_themes = [
            ("arcade-classic", include_str!("../../bundled-themes/arcade-classic/theme.json"), include_str!("../../bundled-themes/arcade-classic/layout.json")),
            ("neon-future", include_str!("../../bundled-themes/neon-future/theme.json"), include_str!("../../bundled-themes/neon-future/layout.json")),
            ("minimal-clean", include_str!("../../bundled-themes/minimal-clean/theme.json"), include_str!("../../bundled-themes/minimal-clean/layout.json")),
            ("retro-crt", include_str!("../../bundled-themes/retro-crt/theme.json"), include_str!("../../bundled-themes/retro-crt/layout.json")),
            ("cyberpunk", include_str!("../../bundled-themes/cyberpunk/theme.json"), include_str!("../../bundled-themes/cyberpunk/layout.json")),
        ];

        let mut installed = 0;
        for (name, theme_json, layout_json) in bundled_themes {
            let theme_dir = self.themes_dir.join(name);
            if !theme_dir.exists() {
                fs::create_dir_all(&theme_dir).map_err(|e| {
                    crate::error::NeoCabError::System(format!("Failed to create theme dir: {}", e))
                })?;

                fs::write(theme_dir.join("theme.json"), theme_json).map_err(|e| {
                    crate::error::NeoCabError::System(format!("Failed to write theme: {}", e))
                })?;

                fs::write(theme_dir.join("layout.json"), layout_json).map_err(|e| {
                    crate::error::NeoCabError::System(format!("Failed to write layout: {}", e))
                })?;

                installed += 1;
                info!("Installed bundled theme: {}", name);
            }
        }

        if installed > 0 {
            info!("Installed {} bundled themes", installed);
        }

        Ok(())
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

    /// Export theme as .neotheme ZIP file
    pub async fn export_theme(&self, name: &str) -> Result<String> {
        let theme_dir = self.themes_dir.join(name);

        if !theme_dir.exists() {
            return Err(crate::error::NeoCabError::System(
                format!("Theme '{}' not found", name),
            ));
        }

        let export_path = self.themes_dir.join(format!("{}.neotheme", name));

        // Create ZIP file with theme contents
        let file = fs::File::create(&export_path).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to create ZIP: {}", e))
        })?;

        let mut zip = zip::ZipWriter::new(file);

        // Add theme.json
        let theme_json_path = theme_dir.join("theme.json");
        if theme_json_path.exists() {
            let content = fs::read_to_string(&theme_json_path).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to read theme.json: {}", e))
            })?;

            zip.start_file("theme.json", Default::default()).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to add to ZIP: {}", e))
            })?;
            zip.write_all(content.as_bytes()).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to write ZIP: {}", e))
            })?;
        }

        // Add preview.png if exists
        let preview_path = theme_dir.join("preview.png");
        if preview_path.exists() {
            let preview_data = fs::read(&preview_path).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to read preview: {}", e))
            })?;

            zip.start_file("preview.png", Default::default()).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to add preview to ZIP: {}", e))
            })?;
            zip.write_all(&preview_data).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to write preview ZIP: {}", e))
            })?;
        }

        zip.finish().map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to finalize ZIP: {}", e))
        })?;

        let export_str = export_path.to_str().unwrap_or("").to_string();
        info!("Exported theme to: {}", export_str);
        Ok(export_str)
    }

    /// Import theme from .neotheme ZIP file
    pub async fn import_theme(&self, source_path: &str) -> Result<String> {
        let source = PathBuf::from(source_path);

        if !source.exists() {
            return Err(crate::error::NeoCabError::System(
                "Import file not found".to_string(),
            ));
        }

        // Extract theme name from ZIP filename
        let theme_name = source
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("imported_theme")
            .to_string();

        let theme_dir = self.themes_dir.join(&theme_name);
        fs::create_dir_all(&theme_dir).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to create theme dir: {}", e))
        })?;

        // Extract ZIP contents
        let file = fs::File::open(&source).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to open ZIP: {}", e))
        })?;

        let mut archive = zip::ZipArchive::new(file).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to read ZIP: {}", e))
        })?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| {
                crate::error::NeoCabError::System(format!("Failed to extract file: {}", e))
            })?;

            let outpath = theme_dir.join(file.name());

            if file.is_dir() {
                fs::create_dir_all(&outpath).ok();
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent).ok();
                }

                let mut outfile = fs::File::create(&outpath).map_err(|e| {
                    crate::error::NeoCabError::System(format!("Failed to create file: {}", e))
                })?;

                std::io::copy(&mut file, &mut outfile).map_err(|e| {
                    crate::error::NeoCabError::System(format!("Failed to extract: {}", e))
                })?;
            }
        }

        info!("Imported theme from ZIP: {}", theme_name);
        Ok(theme_name)
    }

    /// Set theme for a specific system
    pub async fn set_system_theme(&self, system: &str, theme: Theme) -> Result<()> {
        let mut system_themes = self.system_themes.write().await;
        system_themes.insert(system.to_string(), theme.clone());
        info!("Set theme '{}' for system '{}'", theme.name, system);
        Ok(())
    }

    /// Get theme for a specific system (falls back to global theme)
    pub async fn get_system_theme(&self, system: &str) -> Theme {
        let system_themes = self.system_themes.read().await;
        if let Some(theme) = system_themes.get(system) {
            theme.clone()
        } else {
            self.current_theme.read().await.clone()
        }
    }

    /// List all system-specific theme assignments
    pub async fn list_system_themes(&self) -> Result<Vec<(String, String)>> {
        let system_themes = self.system_themes.read().await;
        let assignments: Vec<(String, String)> = system_themes
            .iter()
            .map(|(system, theme)| (system.clone(), theme.name.clone()))
            .collect();
        Ok(assignments)
    }

    /// Remove theme assignment for a system (will use global theme)
    pub async fn remove_system_theme(&self, system: &str) -> Result<()> {
        let mut system_themes = self.system_themes.write().await;
        system_themes.remove(system);
        info!("Removed theme assignment for system '{}'", system);
        Ok(())
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
