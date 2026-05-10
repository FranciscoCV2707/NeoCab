use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};
use crate::error::Result;
use crate::db::Database;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub app: AppSettings,
    pub arcade: ArcadeSettings,
    pub display: DisplaySettings,
    pub input: InputSettings,
    pub emulators: EmulatorsSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub name: String,
    pub version: String,
    pub data_dir: String,
    pub roms_dir: String,
    pub bios_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArcadeSettings {
    pub coin_per_game: i32,
    pub time_per_coin: i32,
    pub attract_mode_enabled: bool,
    pub attract_mode_timeout: i32,
    pub kiosk_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplaySettings {
    pub width: u32,
    pub height: u32,
    pub fullscreen: bool,
    pub theme: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputSettings {
    pub auto_detect_devices: bool,
    pub deadzone: f32,
    pub profile: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmulatorsSettings {
    pub default: String,
    pub auto_select: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app: AppSettings {
                name: "NeoCab".to_string(),
                version: "0.1.0".to_string(),
                data_dir: "./data".to_string(),
                roms_dir: "./roms".to_string(),
                bios_dir: "./bios".to_string(),
            },
            arcade: ArcadeSettings {
                coin_per_game: 1,
                time_per_coin: 180,
                attract_mode_enabled: true,
                attract_mode_timeout: 300,
                kiosk_mode: false,
            },
            display: DisplaySettings {
                width: 1920,
                height: 1080,
                fullscreen: false,
                theme: "classic-arcade".to_string(),
                language: "en".to_string(),
            },
            input: InputSettings {
                auto_detect_devices: true,
                deadzone: 0.1,
                profile: "default".to_string(),
            },
            emulators: EmulatorsSettings {
                default: "retroarch".to_string(),
                auto_select: true,
            },
        }
    }
}

pub struct ConfigManager {
    config: Arc<RwLock<AppConfig>>,
    config_path: PathBuf,
    db: Arc<Database>,
}

impl ConfigManager {
    pub async fn new(config_path: impl AsRef<Path>, db: Arc<Database>) -> Result<Self> {
        let config_path = config_path.as_ref().to_path_buf();

        // Try to load from file, fall back to default
        let config = if config_path.exists() {
            Self::load_from_file(&config_path)?
        } else {
            info!("Config file not found, using defaults");
            AppConfig::default()
        };

        // Load any overrides from database
        let config = Self::apply_db_overrides(config, &db).await?;

        Ok(Self {
            config: Arc::new(RwLock::new(config)),
            config_path,
            db,
        })
    }

    fn load_from_file(path: &Path) -> Result<AppConfig> {
        let content = std::fs::read_to_string(path)?;
        let config = serde_yaml::from_str(&content)
            .map_err(|e| crate::error::NeoCabError::Config(format!("YAML parse error: {}", e)))?;
        info!("Loaded config from {:?}", path);
        Ok(config)
    }

    async fn apply_db_overrides(
        config: AppConfig,
        _db: &Database,
    ) -> Result<AppConfig> {
        // Load any database overrides (Semana 2 config table)
        // For now, just return the config as-is
        // In production, query config table and override values
        Ok(config)
    }

    pub async fn get_config(&self) -> AppConfig {
        self.config.read().await.clone()
    }

    pub async fn reload(&self) -> Result<()> {
        let new_config = Self::load_from_file(&self.config_path)?;
        let new_config = Self::apply_db_overrides(new_config, &self.db).await.ok()
            .unwrap_or_default();

        let mut config = self.config.write().await;
        *config = new_config;

        info!("Config reloaded successfully");
        Ok(())
    }

    pub async fn set_app_setting(&self, key: &str, value: String) -> Result<()> {
        let mut config = self.config.write().await;

        match key {
            "theme" => config.display.theme = value.clone(),
            "language" => config.display.language = value.clone(),
            "kiosk_mode" => {
                config.arcade.kiosk_mode = value.parse()
                    .map_err(|_| crate::error::NeoCabError::Config("Invalid boolean".to_string()))?;
            }
            _ => return Err(crate::error::NeoCabError::Config(format!("Unknown setting: {}", key))),
        }

        // Persist to database
        self.db.set_config(key, &value).await?;

        info!("Setting {} updated to {}", key, value);
        Ok(())
    }

    pub async fn save_to_file(&self) -> Result<()> {
        let config = self.config.read().await;
        let yaml = serde_yaml::to_string(&*config)
            .map_err(|e| crate::error::NeoCabError::Config(format!("YAML serialize error: {}", e)))?;

        std::fs::write(&self.config_path, yaml)?;
        info!("Config saved to {:?}", self.config_path);
        Ok(())
    }
}
