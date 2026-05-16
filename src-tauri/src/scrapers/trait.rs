use async_trait::async_trait;
use std::path::PathBuf;
use crate::error::Result;
use crate::core::scraper::ScrapedGameInfo;

#[derive(Debug, Clone)]
pub struct RomInfo {
    pub name: String,
    pub path: PathBuf,
    pub crc32: Option<String>,
    pub system: String,
}

#[async_trait]
pub trait Scraper: Send + Sync {
    fn name(&self) -> &str;
    fn priority(&self) -> u8;

    async fn scrape(&self, rom: &RomInfo) -> Result<ScrapedGameInfo>;
    async fn can_scrape(&self, _rom: &RomInfo) -> bool {
        true
    }
}

pub struct ScraperRegistry {
    scrapers: Vec<Box<dyn Scraper>>,
}

impl ScraperRegistry {
    pub fn new() -> Self {
        Self { scrapers: Vec::new() }
    }

    pub fn register<S: Scraper + 'static>(&mut self, scraper: S) {
        self.scrapers.push(Box::new(scraper));
        self.scrapers.sort_by_key(|s| s.priority());
    }

    pub async fn scrape(&self, rom: &RomInfo) -> Result<ScrapedGameInfo> {
        let mut errors = Vec::new();

        for scraper in &self.scrapers {
            match scraper.scrape(rom).await {
                Ok(game) => return Ok(game),
                Err(e) => {
                    tracing::warn!("{} failed: {}", scraper.name(), e);
                    errors.push(e);
                }
            }
        }

        Err(crate::error::NeoCabError::ScraperAllFailed(errors.len()).into())
    }

    pub async fn scrape_with_fallback(&self, rom: &RomInfo) -> ScrapedGameInfo {
        match self.scrape(rom).await {
            Ok(game) => game,
            Err(_) => ScrapedGameInfo {
                title: clean_title(&rom.name),
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
            },
        }
    }

    pub fn list(&self) -> Vec<(&'static str, u8)> {
        self.scrapers.iter().map(|s| (s.name(), s.priority())).collect()
    }
}

impl Default for ScraperRegistry {
    fn default() -> Self {
        Self::new()
    }
}

fn clean_title(name: &str) -> String {
    name.replace(".zip", "")
        .replace(".7z", "")
        .replace(".bin", "")
        .replace(".rom", "")
        .replace("_", " ")
        .replace("-", " ")
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(c) => c.to_uppercase().to_string() + &chars.as_str().to_lowercase(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}