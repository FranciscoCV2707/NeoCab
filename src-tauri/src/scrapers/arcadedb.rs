use async_trait::async_trait;
use reqwest::Client;
use tokio::time::Duration;
use tracing::{info, warn};

use super::{RomInfo, Scraper};
use crate::core::scraper::ScrapedGameInfo;
use crate::error::{NeoCabError, Result};

/// ArcadeDB scraper — free MAME-focused API, no auth required.
/// API: https://www.arcadeitalia.net/api/game.php
pub struct ArcadeDBScraper {
    client: Client,
}

impl ArcadeDBScraper {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .user_agent("NeoCab/2.0")
                .build()
                .unwrap_or_else(|_| Client::new()),
        }
    }
}

impl Default for ArcadeDBScraper {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Scraper for ArcadeDBScraper {
    fn name(&self) -> &str {
        "ArcadeDB"
    }

    fn priority(&self) -> u8 {
        5
    }

    async fn can_scrape(&self, rom: &RomInfo) -> bool {
        matches!(
            rom.system.to_lowercase().as_str(),
            "mame"
                | "arcade"
                | "fba"
                | "fbneo"
                | "cps1"
                | "cps2"
                | "cps3"
                | "neogeo"
                | "neogeocd"
                | "naomi"
                | "atomiswave"
                | "model2"
                | "model3"
        )
    }

    async fn scrape(&self, rom: &RomInfo) -> Result<ScrapedGameInfo> {
        let rom_id = rom
            .name
            .trim_end_matches(".zip")
            .trim_end_matches(".7z")
            .to_lowercase();

        let url = format!(
            "https://www.arcadeitalia.net/api/game.php?game_name={}&lang=en",
            rom_id
        );

        info!("ArcadeDB scraping: {}", rom.name);

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            warn!("ArcadeDB HTTP {}: {}", response.status(), rom.name);
            return Err(NeoCabError::Network(format!(
                "ArcadeDB status {}",
                response.status()
            )));
        }

        #[derive(serde::Deserialize)]
        struct ADBResponse {
            result: Option<Vec<ADBGame>>,
        }

        #[derive(serde::Deserialize)]
        struct ADBGame {
            title: Option<String>,
            history: Option<String>,
            year: Option<String>,
            manufacturer: Option<String>,
            genre: Option<String>,
            players: Option<u32>,
            #[serde(rename = "url_image_ingame")]
            screenshot_url: Option<String>,
            #[serde(rename = "url_image_title")]
            title_screen_url: Option<String>,
            #[serde(rename = "url_image_marquee")]
            marquee_url: Option<String>,
            #[serde(rename = "url_image_cabinet")]
            cabinet_url: Option<String>,
            #[serde(rename = "url_video_shortplay")]
            video_url: Option<String>,
        }

        let body = response.text().await?;
        let adb: ADBResponse =
            serde_json::from_str(&body).map_err(|e| NeoCabError::Serialization(e))?;

        let game = adb
            .result
            .and_then(|r| r.into_iter().next())
            .ok_or_else(|| {
                NeoCabError::Other(format!("ArcadeDB: no result for '{}'", rom.name))
            })?;

        let screenshot = game.screenshot_url.or(game.title_screen_url);

        Ok(ScrapedGameInfo {
            title: game.title.unwrap_or_else(|| rom.name.clone()),
            description: game.history,
            year: game.year.as_deref().and_then(|y| y.parse().ok()),
            developer: game.manufacturer.clone(),
            publisher: game.manufacturer,
            genre: game.genre,
            players: game.players.map(|p| p as i32),
            rating: None,
            region: None,
            box_art_url: game.cabinet_url,
            screenshot_url: screenshot,
            wheel_url: None,
            marquee_url: game.marquee_url,
            video_url: game.video_url,
            bezel_url: None,
            fanart_url: None,
            box3d_url: None,
            cartridge_url: None,
            manual_url: None,
            source: Some("ArcadeDB".to_string()),
        })
    }
}
