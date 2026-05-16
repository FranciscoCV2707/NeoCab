use std::collections::HashMap;
use async_trait::async_trait;
use reqwest::Client;
use tracing::{info, warn};
use urlencoding::encode;

use super::{RomInfo, Scraper};
use crate::error::Result;
use crate::core::scraper::ScrapedGameInfo;

pub struct TGDBScraper {
    client: Client,
    api_key: String,
}

impl TGDBScraper {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .user_agent("NeoCab/1.0")
                .build()
                .unwrap_or_else(|_| Client::new()),
            api_key,
        }
    }
}

#[async_trait]
impl Scraper for TGDBScraper {
    fn name(&self) -> &str { "TheGamesDB" }
    fn priority(&self) -> u8 { 20 }

    async fn scrape(&self, rom: &RomInfo) -> Result<ScrapedGameInfo> {
        if self.api_key.is_empty() {
            return Err(crate::error::NeoCabError::Config("TGDB API key not configured".into()).into());
        }

        let search_url = format!(
            "https://api.thegamesdb.net/v1/Games/ByGameName?apikey={}&name={}&fields=players,genres,overview,last_updated",
            self.api_key,
            encode(&rom.name)
        );

        info!("TGDB searching: {}", rom.name);

        let response = self.client.get(&search_url).send().await?;

        if !response.status().is_success() {
            warn!("TGDB HTTP error: {}", response.status());
            return Err(crate::error::NeoCabError::Http(response.status().into()).into());
        }

        let body = response.text().await?;

        #[derive(serde::Deserialize)]
        struct TGDBResponse {
            data: Option<TGDBData>,
        }
        #[derive(serde::Deserialize)]
        struct TGDBData {
            games: Option<Vec<TGDBGame>>,
        }
        #[derive(serde::Deserialize)]
        struct TGDBGame {
            id: Option<u32>,
            game_title: Option<String>,
            overview: Option<String>,
            release_date: Option<String>,
            players: Option<u32>,
            popularity: Option<u32>,
            #[serde(rename = "boxart")]
            boxart: Option<HashMap<String, String>>,
        }

        let tgdb_resp: TGDBResponse = serde_json::from_str(&body)
            .map_err(|e| crate::error::NeoCabError::Serialization(e))?;

        let game = tgdb_resp.data
            .and_then(|d| d.games)
            .and_then(|g| g.into_iter().max_by_key(|g| g.popularity.unwrap_or(0)))
            .ok_or_else(|| crate::error::NeoCabError::Config("No TGDB results".into()))?;

        let title = game.game_title.unwrap_or_else(|| rom.name.clone());
        let description = game.overview;

        let year = game.release_date.as_ref()
            .and_then(|d| d.get(0..4))
            .and_then(|y| y.parse::<i32>().ok());

        let players = game.players.map(|p| p as i32);

        let box_art_url = game.boxart
            .and_then(|b| b.get("front").cloned())
            .or_else(|| game.boxart.and_then(|b| b.values().next().cloned()));

        Ok(ScrapedGameInfo {
            title,
            description,
            year,
            developer: None,
            publisher: None,
            genre: None,
            players,
            rating: None,
            region: None,
            box_art_url,
            screenshot_url: None,
            wheel_url: None,
            marquee_url: None,
            video_url: None,
        })
    }
}