use crate::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tracing::info;

#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeElement {
    pub id: String,
    pub name: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub opacity: f32,
    pub rotation: f32,
    pub r#type: String,
    pub content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeSounds {
    pub navigation: String,
    pub select: String,
    pub back: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FadeConfig {
    pub enabled: bool,
    pub duration_ms: u64,
    pub background_image: String,
    pub loading_text: String,
    pub show_logo: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BezelConfig {
    pub enabled: bool,
    pub opacity: f32,
    pub auto_hide: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeConfig {
    pub background: String,
    pub elements: Vec<ThemeElement>,
    pub sounds: ThemeSounds,
    pub fade: FadeConfig,
    pub bezel: BezelConfig,
}

#[tauri::command]
pub async fn save_theme_config(config: ThemeConfig) -> Result<()> {
    let path = PathBuf::from("config/themes/current_theme.json");
    
    // Ensure directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let json = serde_json::to_string_pretty(&config)?;
    fs::write(&path, json)?;
    
    info!("Theme configuration saved to {:?}", path);
    Ok(())
}

#[tauri::command]
pub async fn get_theme_config() -> Result<ThemeConfig> {
    let path = PathBuf::from("config/themes/current_theme.json");
    
    if path.exists() {
        let content = fs::read_to_string(path)?;
        let config: ThemeConfig = serde_json::from_str(&content)?;
        Ok(config)
    } else {
        // Return default config
        Ok(ThemeConfig {
            background: "".to_string(),
            elements: vec![
                ThemeElement { 
                    id: "video_box".to_string(), 
                    name: "Video Preview".to_string(), 
                    x: 10.0, y: 10.0, width: 40.0, height: 40.0, 
                    opacity: 1.0, rotation: 0.0, r#type: "video".to_string(), 
                    content: None 
                },
                ThemeElement { 
                    id: "wheel_box".to_string(), 
                    name: "Game Wheel".to_string(), 
                    x: 60.0, y: 0.0, width: 40.0, height: 100.0, 
                    opacity: 1.0, rotation: 0.0, r#type: "wheel".to_string(), 
                    content: None 
                },
            ],
            sounds: ThemeSounds {
                navigation: "nav.wav".to_string(),
                select: "select.wav".to_string(),
                back: "back.wav".to_string(),
            },
            fade: FadeConfig {
                enabled: true,
                duration_ms: 2000,
                background_image: "fade_bg.png".to_string(),
                loading_text: "Cargando...".to_string(),
                show_logo: true,
            },
            bezel: BezelConfig {
                enabled: true,
                opacity: 1.0,
                auto_hide: true,
            }
        })
    }
}
