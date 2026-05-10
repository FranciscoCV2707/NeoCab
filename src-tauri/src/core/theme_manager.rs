use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use tracing::info;
use crate::error::Result;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Theme {
    Classic,
    Neon,
    Cyberpunk,
}

impl Theme {
    pub fn as_str(&self) -> &'static str {
        match self {
            Theme::Classic => "classic",
            Theme::Neon => "neon",
            Theme::Cyberpunk => "cyberpunk",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "classic" => Some(Theme::Classic),
            "neon" => Some(Theme::Neon),
            "cyberpunk" => Some(Theme::Cyberpunk),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeConfig {
    pub name: Theme,
    pub primary_color: String,
    pub secondary_color: String,
    pub accent_color: String,
    pub background_color: String,
    pub text_color: String,
    pub font_family: String,
}

impl ThemeConfig {
    pub fn classic() -> Self {
        Self {
            name: Theme::Classic,
            primary_color: "#ff6b00".to_string(),
            secondary_color: "#1a1a1a".to_string(),
            accent_color: "#ffaa00".to_string(),
            background_color: "#000000".to_string(),
            text_color: "#ffffff".to_string(),
            font_family: "Arial, sans-serif".to_string(),
        }
    }

    pub fn neon() -> Self {
        Self {
            name: Theme::Neon,
            primary_color: "#00ff00".to_string(),
            secondary_color: "#00ffff".to_string(),
            accent_color: "#ff00ff".to_string(),
            background_color: "#0a0a0a".to_string(),
            text_color: "#00ff00".to_string(),
            font_family: "'Courier New', monospace".to_string(),
        }
    }

    pub fn cyberpunk() -> Self {
        Self {
            name: Theme::Cyberpunk,
            primary_color: "#ff006e".to_string(),
            secondary_color: "#00f5ff".to_string(),
            accent_color: "#ffbe0b".to_string(),
            background_color: "#0d1117".to_string(),
            text_color: "#e0e6fc".to_string(),
            font_family: "'IBM Plex Mono', monospace".to_string(),
        }
    }

    pub fn for_theme(theme: Theme) -> Self {
        match theme {
            Theme::Classic => Self::classic(),
            Theme::Neon => Self::neon(),
            Theme::Cyberpunk => Self::cyberpunk(),
        }
    }
}

pub struct ThemeManager {
    current_theme: Arc<RwLock<ThemeConfig>>,
}

impl ThemeManager {
    pub fn new(theme: Theme) -> Self {
        let config = ThemeConfig::for_theme(theme);
        Self {
            current_theme: Arc::new(RwLock::new(config)),
        }
    }

    pub async fn set_theme(&self, theme: Theme) -> Result<()> {
        let config = ThemeConfig::for_theme(theme);
        let mut current = self.current_theme.write().await;
        *current = config;
        info!("Theme changed to: {}", theme.as_str());
        Ok(())
    }

    pub async fn get_current_theme(&self) -> ThemeConfig {
        self.current_theme.read().await.clone()
    }

    pub async fn get_theme_name(&self) -> String {
        let current = self.current_theme.read().await;
        current.name.as_str().to_string()
    }

    pub async fn get_css_variables(&self) -> String {
        let current = self.current_theme.read().await;
        format!(
            ":root {{\n  \
            --primary-color: {};\n  \
            --secondary-color: {};\n  \
            --accent-color: {};\n  \
            --background-color: {};\n  \
            --text-color: {};\n  \
            --font-family: {};\n\
            }}",
            current.primary_color,
            current.secondary_color,
            current.accent_color,
            current.background_color,
            current.text_color,
            current.font_family,
        )
    }
}

impl Default for ThemeManager {
    fn default() -> Self {
        Self::new(Theme::Classic)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_theme_creation() {
        let manager = ThemeManager::new(Theme::Classic);
        let theme = manager.get_current_theme().await;
        assert_eq!(theme.name, Theme::Classic);
    }

    #[tokio::test]
    async fn test_theme_switching() {
        let manager = ThemeManager::new(Theme::Classic);

        let _ = manager.set_theme(Theme::Neon).await;
        let theme = manager.get_current_theme().await;
        assert_eq!(theme.name, Theme::Neon);
    }

    #[tokio::test]
    async fn test_css_variables() {
        let manager = ThemeManager::new(Theme::Classic);
        let css = manager.get_css_variables().await;
        assert!(css.contains("--primary-color"));
        assert!(css.contains("#ff6b00"));
    }

    #[test]
    fn test_theme_configs() {
        let classic = ThemeConfig::classic();
        assert_eq!(classic.name, Theme::Classic);
        assert_eq!(classic.primary_color, "#ff6b00");

        let neon = ThemeConfig::neon();
        assert_eq!(neon.name, Theme::Neon);
        assert_eq!(neon.primary_color, "#00ff00");

        let cyberpunk = ThemeConfig::cyberpunk();
        assert_eq!(cyberpunk.name, Theme::Cyberpunk);
        assert_eq!(cyberpunk.primary_color, "#ff006e");
    }
}
