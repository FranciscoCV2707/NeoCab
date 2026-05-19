use crate::db::Database;
use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GameMode {
    Arcade,
    Console,
    TimedFree,
}

impl GameMode {
    pub fn default_time(&self) -> u32 {
        match self {
            GameMode::Arcade => 180,    // 3 minutos
            GameMode::Console => 300,   // 5 minutos
            GameMode::TimedFree => 600, // 10 minutos
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemGameConfig {
    pub system: String,
    pub mode: GameMode,
    pub coins_per_time: u32,
    pub max_time: u32,
    pub show_overlay: bool,
    pub warn_before: u32,
    pub auto_exit: bool,
    #[serde(default)]
    pub rom_path: Option<PathBuf>,
    #[serde(default)]
    pub bios_path: Option<PathBuf>,
    #[serde(default)]
    pub pre_launch_script: Option<String>,
    #[serde(default)]
    pub post_launch_script: Option<String>,
}

impl SystemGameConfig {
    pub fn new(system: String, mode: GameMode) -> Self {
        let coins_per_time = mode.default_time();
        Self {
            system,
            mode,
            coins_per_time,
            max_time: coins_per_time * 3,
            show_overlay: true,
            warn_before: 30,
            auto_exit: true,
            rom_path: None,
            bios_path: None,
            pre_launch_script: None,
            post_launch_script: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub app: AppSettings,
    pub arcade: ArcadeSettings,
    pub display: DisplaySettings,
    pub input: InputSettings,
    pub emulators: EmulatorsSettings,
    #[serde(default)]
    pub scraper: ScraperSettings,
    #[serde(default)]
    pub systems: HashMap<String, SystemGameConfig>,
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

// Credenciales para los scrapers externos. Se leen desde config.yml al iniciar.
//
// Ejemplo de config.yml:
//
//   scraper:
//     ss_dev_id: "MiApp"                  # ID de desarrollador en screenscraper.fr
//     ss_dev_password: "dev_pass_aqui"    # Contraseña de desarrollador
//     ss_user: "mi_usuario"               # Tu cuenta personal screenscraper.fr
//     ss_password: "mi_pass"              # Tu contraseña personal
//     tgdb_api_key: "abc123..."           # API key de thegamesdb.net (gratuita)
//
// Si algún campo está vacío, ese scraper se omite y se pasa al siguiente.
// ArcadeDB siempre funciona sin credenciales (solo juegos MAME/arcade).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScraperSettings {
    #[serde(default)]
    pub ss_dev_id: String,
    #[serde(default)]
    pub ss_dev_password: String,
    #[serde(default)]
    pub ss_user: String,
    #[serde(default)]
    pub ss_password: String,
    #[serde(default)]
    pub tgdb_api_key: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        let mut systems = HashMap::new();
        systems.insert(
            "mame".to_string(),
            SystemGameConfig::new("mame".to_string(), GameMode::Arcade),
        );
        systems.insert(
            "nes".to_string(),
            SystemGameConfig::new("nes".to_string(), GameMode::Console),
        );
        systems.insert(
            "snes".to_string(),
            SystemGameConfig::new("snes".to_string(), GameMode::Console),
        );
        systems.insert(
            "genesis".to_string(),
            SystemGameConfig::new("genesis".to_string(), GameMode::Console),
        );
        systems.insert(
            "gbc".to_string(),
            SystemGameConfig::new("gbc".to_string(), GameMode::Console),
        );
        systems.insert(
            "ps1".to_string(),
            SystemGameConfig::new("ps1".to_string(), GameMode::Console),
        );
        systems.insert(
            "n64".to_string(),
            SystemGameConfig::new("n64".to_string(), GameMode::Console),
        );

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
            scraper: ScraperSettings::default(),
            systems,
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
            Self::load_from_file(&config_path)
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

    fn load_from_file(path: &Path) -> AppConfig {
        match std::fs::read_to_string(path) {
            Ok(content) => match serde_yaml::from_str::<AppConfig>(&content) {
                Ok(config) => {
                    info!("Loaded config from {:?}", path);
                    config
                }
                Err(e) => {
                    tracing::warn!("Config parse failed, using defaults: {}", e);
                    AppConfig::default()
                }
            },
            Err(e) => {
                tracing::warn!("Config read failed, using defaults: {}", e);
                AppConfig::default()
            }
        }
    }

    async fn apply_db_overrides(config: AppConfig, _db: &Database) -> Result<AppConfig> {
        // Load any database overrides (Semana 2 config table)
        // For now, just return the config as-is
        // In production, query config table and override values
        Ok(config)
    }

    pub async fn get_config(&self) -> AppConfig {
        self.config.read().await.clone()
    }

    pub async fn reload(&self) -> Result<()> {
        let new_config = Self::load_from_file(&self.config_path);
        let new_config = Self::apply_db_overrides(new_config, &self.db)
            .await
            .ok()
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
                config.arcade.kiosk_mode = value.parse().map_err(|_| {
                    crate::error::NeoCabError::Config("Invalid boolean".to_string())
                })?;
            }
            _ => {
                return Err(crate::error::NeoCabError::Config(format!(
                    "Unknown setting: {}",
                    key
                )))
            }
        }

        // Persist to database
        self.db.set_config(key, &value).await?;

        info!("Setting {} updated to {}", key, value);
        Ok(())
    }

    pub async fn save_to_file(&self) -> Result<()> {
        let config = self.config.read().await;
        let yaml = serde_yaml::to_string(&*config).map_err(|e| {
            crate::error::NeoCabError::Config(format!("YAML serialize error: {}", e))
        })?;

        std::fs::write(&self.config_path, yaml)?;
        info!("Config saved to {:?}", self.config_path);
        Ok(())
    }

    pub async fn save_system_config(&self, config: SystemGameConfig) -> Result<()> {
        let mut app_config = self.config.write().await;
        app_config
            .systems
            .insert(config.system.clone(), config.clone());

        self.db
            .set_config(
                &format!("system_{}", config.system),
                &serde_json::to_string(&config)?,
            )
            .await?;

        info!("System config saved for: {}", config.system);
        Ok(())
    }

    pub async fn load_system_config(&self, system: &str) -> Result<SystemGameConfig> {
        let config = self.config.read().await;

        if let Some(sys_config) = config.systems.get(system) {
            Ok(sys_config.clone())
        } else {
            let default = SystemGameConfig::new(system.to_string(), GameMode::Console);
            Ok(default)
        }
    }

    pub async fn get_all_system_configs(&self) -> Result<Vec<SystemGameConfig>> {
        let config = self.config.read().await;
        let mut systems: Vec<SystemGameConfig> = config.systems.values().cloned().collect();
        systems.sort_by(|a, b| a.system.cmp(&b.system));
        Ok(systems)
    }

    pub async fn get_string(&self, key: &str) -> Result<String> {
        let config = self.config.read().await;
        match key {
            "operator_pin" => Ok("0000".to_string()),
            "default_roms_path" | "roms_dir" => Ok(config.app.roms_dir.clone()),
            "default_bios_path" | "bios_dir" => Ok(config.app.bios_dir.clone()),
            "theme" => Ok(config.display.theme.clone()),
            "language" => Ok(config.display.language.clone()),
            "kiosk_mode" => Ok(if config.arcade.kiosk_mode {
                "true".to_string()
            } else {
                "false".to_string()
            }),
            _ => Err(crate::error::NeoCabError::Config(format!(
                "Unknown config key: {}",
                key
            ))),
        }
    }
}
