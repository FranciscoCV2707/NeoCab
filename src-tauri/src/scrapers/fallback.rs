use async_trait::async_trait;
use super::{RomInfo, Scraper};
use crate::error::Result;
use crate::core::scraper::ScrapedGameInfo;

pub struct FallbackScraper;

impl FallbackScraper {
    pub fn new() -> Self {
        Self
    }
}

impl Default for FallbackScraper {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Scraper for FallbackScraper {
    fn name(&self) -> &str { "Fallback" }
    fn priority(&self) -> u8 { 100 }

    async fn scrape(&self, rom: &RomInfo) -> Result<ScrapedGameInfo> {
        let clean_name = rom.name
            .replace(".zip", "")
            .replace(".7z", "")
            .replace(".bin", "")
            .replace(".rom", "")
            .replace("_", " ")
            .replace("-", " ");

        let title = clean_name
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(c) => c.to_uppercase().to_string() + &chars.as_str().to_lowercase(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ");

        Ok(ScrapedGameInfo {
            title,
            description: None,
            year: None,
            developer: None,
            publisher: None,
            genre: None,
            players: None,
            rating: None,
            region: None,
            box_art_url: None,
            screenshot_url: None,
            wheel_url: None,
            marquee_url: None,
            video_url: None,
        })
    }
}