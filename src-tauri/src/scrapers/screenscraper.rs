use std::collections::HashMap;
use async_trait::async_trait;
use reqwest::Client;
use tokio::time::{sleep, Duration};
use tracing::{info, warn};

use super::{RomInfo, Scraper};
use crate::error::{Result, NeoCabError};
use crate::core::scraper::ScrapedGameInfo;

pub struct ScreenScraperScraper {
    client: Client,
    dev_id: String,
    dev_password: String,
    user: String,
    password: String,
    system_map: HashMap<String, u32>,
    last_request: std::sync::Mutex<std::time::Instant>,
}

impl ScreenScraperScraper {
    pub fn new(dev_id: String, dev_password: String, user: String, password: String) -> Self {
        let mut system_map = HashMap::new();
        system_map.insert("mame".into(), 75);
        system_map.insert("arcade".into(), 75);
        system_map.insert("nes".into(), 3);
        system_map.insert("famicom".into(), 3);
        system_map.insert("snes".into(), 4);
        system_map.insert("super_famicom".into(), 4);
        system_map.insert("n64".into(), 14);
        system_map.insert("gamecube".into(), 13);
        system_map.insert("wii".into(), 16);
        system_map.insert("gb".into(), 9);
        system_map.insert("gbc".into(), 10);
        system_map.insert("gba".into(), 12);
        system_map.insert("nds".into(), 15);
        system_map.insert("genesis".into(), 1);
        system_map.insert("megadrive".into(), 1);
        system_map.insert("mastersystem".into(), 2);
        system_map.insert("saturn".into(), 22);
        system_map.insert("dreamcast".into(), 23);
        system_map.insert("gamegear".into(), 21);
        system_map.insert("sg1000".into(), 109);
        system_map.insert("psx".into(), 57);
        system_map.insert("ps2".into(), 58);
        system_map.insert("psp".into(), 61);
        system_map.insert("atari2600".into(), 26);
        system_map.insert("atari5200".into(), 40);
        system_map.insert("atari7800".into(), 41);
        system_map.insert("lynx".into(), 28);
        system_map.insert("jaguar".into(), 27);
        system_map.insert("colecovision".into(), 48);
        system_map.insert("intellivision".into(), 115);
        system_map.insert("neogeo".into(), 142);
        system_map.insert("neogeocd".into(), 70);
        system_map.insert("pcengine".into(), 31);
        system_map.insert("turbografx16".into(), 31);
        system_map.insert("supergrafx".into(), 105);
        system_map.insert("3do".into(), 29);
        system_map.insert("vectrex".into(), 102);
        system_map.insert("msx".into(), 113);
        system_map.insert("msx2".into(), 116);
        system_map.insert("amiga".into(), 64);
        system_map.insert("c64".into(), 66);
        system_map.insert("zxspectrum".into(), 76);
        system_map.insert("amstradcpc".into(), 65);
        system_map.insert("scummvm".into(), 123);
        system_map.insert("fba".into(), 75);
        system_map.insert("fbneo".into(), 75);
        system_map.insert("cps1".into(), 6);
        system_map.insert("cps2".into(), 7);
        system_map.insert("cps3".into(), 8);
        system_map.insert("naomi".into(), 56);
        system_map.insert("atomiswave".into(), 53);
        system_map.insert("model2".into(), 54);
        system_map.insert("model3".into(), 55);

        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .user_agent("NeoCab/1.0")
                .build()
                .unwrap_or_else(|_| Client::new()),
            dev_id,
            dev_password,
            user,
            password,
            system_map,
            last_request: std::sync::Mutex::new(std::time::Instant::now()),
        }
    }

    fn get_system_id(&self, system: &str) -> Option<u32> {
        self.system_map.get(&system.to_lowercase()).copied()
    }

    async fn rate_limit(&self) {
        let elapsed = {
            let last = self.last_request.lock().unwrap();
            last.elapsed()
        };
        if elapsed < Duration::from_millis(1200) {
            sleep(Duration::from_millis(1200) - elapsed).await;
        }
        {
            let mut last = self.last_request.lock().unwrap();
            *last = std::time::Instant::now();
        }
    }
}

#[async_trait]
impl Scraper for ScreenScraperScraper {
    fn name(&self) -> &str { "ScreenScraper" }
    fn priority(&self) -> u8 { 10 }

    async fn scrape(&self, rom: &RomInfo) -> Result<ScrapedGameInfo> {
        if self.dev_id.is_empty() {
            return Err(NeoCabError::Config("ScreenScraper dev_id not configured".into()).into());
        }

        self.rate_limit().await;

        let system_id = self.get_system_id(&rom.system).unwrap_or(75);

        let mut url = format!(
            "https://api.screenscraper.fr/api2/jeuInfos.php?devid={}&devpassword={}&softname=NeoCab&output=json&systemeid={}",
            self.dev_id, self.dev_password, system_id
        );

        if !self.user.is_empty() {
            url.push_str(&format!("&ssid={}&sspassword={}", self.user, self.password));
        }

        if let Some(crc) = &rom.crc32 {
            url.push_str(&format!("&crc={}", crc));
        } else {
            let clean_name = rom.name
                .replace(".zip", "")
                .replace(".7z", "")
                .replace(".bin", "")
                .replace(".rom", "");
            url.push_str(&format!("&romnom={}", clean_name));
        }

        info!("ScreenScraper scraping: {} (system {})", rom.name, system_id);

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            warn!("ScreenScraper HTTP error: {}", response.status());
            return Err(NeoCabError::Http(response.status().into()).into());
        }

        let body = response.text().await?;

        #[derive(serde::Deserialize)]
        struct SSResponse {
            response: Option<SSGameResponse>,
        }
        #[derive(serde::Deserialize)]
        struct SSGameResponse {
            jeu: Option<SSGame>,
        }
        #[derive(serde::Deserialize)]
        struct SSGame {
            noms: Option<Vec<SSText>>,
            synopsis: Option<Vec<SSText>>,
            #[serde(rename = "developpeur")]
            developer: Option<SSTextSingle>,
            editeur: Option<SSTextSingle>,
            joueurs: Option<SSTextSingle>,
            #[serde(rename = "dates")]
            dates: Option<Vec<SSDate>>,
            genres: Option<Vec<SSGenre>>,
            note: Option<SSRating>,
            medias: Option<Vec<SSMedia>>,
        }
        #[derive(serde::Deserialize)]
        struct SSText {
            region: Option<String>,
            text: Option<String>,
        }
        #[derive(serde::Deserialize)]
        struct SSTextSingle {
            text: Option<String>,
        }
        #[derive(serde::Deserialize)]
        struct SSDate {
            region: Option<String>,
            text: Option<String>,
        }
        #[derive(serde::Deserialize)]
        struct SSGenre {
            noms: Option<Vec<SSText>>,
        }
        #[derive(serde::Deserialize)]
        struct SSRating {
            text: Option<String>,
        }
        #[derive(serde::Deserialize)]
        struct SSMedia {
            #[serde(rename = "type")]
            media_type: Option<String>,
            url: Option<String>,
        }

        let ss_response: SSResponse = serde_json::from_str(&body)
            .map_err(|e| NeoCabError::Serialization(e))?;

        let game = ss_response.response
            .ok_or_else(|| NeoCabError::Config("Empty ScreenScraper response".into()))?
            .jeu
            .ok_or_else(|| NeoCabError::Config("No game data in ScreenScraper response".into()))?;

        let title = game.noms.as_ref()
            .and_then(|noms| {
                noms.iter()
                    .find(|n| n.region.as_deref() == Some("wor") || n.region.as_deref() == Some("us"))
                    .or_else(|| noms.first())
                    .and_then(|n| n.text.clone())
            })
            .unwrap_or_else(|| rom.name.clone());

        let description = game.synopsis.as_ref()
            .and_then(|syns| {
                syns.iter()
                    .find(|s| s.region.as_deref() == Some("en") || s.region.as_deref() == Some("us"))
                    .or_else(|| syns.iter().find(|s| s.region.as_deref() == Some("wor")))
                    .or_else(|| syns.first())
                    .and_then(|s| s.text.clone())
            });

        let year = game.dates.as_ref()
            .and_then(|dates| {
                dates.first()
                    .and_then(|d| d.text.as_ref())
                    .and_then(|t| t.get(0..4))
                    .and_then(|y| y.parse::<i32>().ok())
            });

        let genre = game.genres.as_ref()
            .and_then(|genres| {
                genres.first()
                    .and_then(|g| g.noms.as_ref())
                    .and_then(|noms| {
                        noms.iter()
                            .find(|n| n.region.as_deref() == Some("en"))
                            .or_else(|| noms.first())
                            .and_then(|n| n.text.clone())
                    })
            });

        let rating = game.note.as_ref()
            .and_then(|n| n.text.as_ref())
            .and_then(|t| t.parse::<f64>().ok())
            .map(|r| r / 4.0);

        let players = game.joueurs.as_ref()
            .and_then(|j| j.text.as_ref())
            .and_then(|t| t.chars().next())
            .and_then(|c| c.to_digit(10))
            .map(|p| p as i32);

        let mut box_art_url = None;
        let mut screenshot_url = None;
        let mut wheel_url = None;
        let mut marquee_url = None;
        let mut video_url = None;

        if let Some(medias) = &game.medias {
            for media in medias {
                let media_type = media.media_type.as_deref().unwrap_or("");
                let url = media.url.as_deref().unwrap_or("");
                if url.is_empty() { continue; }

                match media_type {
                    "box-2D" | "box-2D-front" if box_art_url.is_none() => box_art_url = Some(url.to_string()),
                    "ss" | "sstitle" if screenshot_url.is_none() => screenshot_url = Some(url.to_string()),
                    "wheel" | "wheel-hd" | "wheel-carbon" | "wheel-steel" if wheel_url.is_none() => wheel_url = Some(url.to_string()),
                    "screenmarquee" | "marquee" if marquee_url.is_none() => marquee_url = Some(url.to_string()),
                    "video" | "video-normalized" if video_url.is_none() => video_url = Some(url.to_string()),
                    _ => {}
                }
            }
        }

        Ok(ScrapedGameInfo {
            title,
            description,
            year,
            developer: game.developer.as_ref().and_then(|d| d.text.clone()),
            publisher: game.editeur.as_ref().and_then(|e| e.text.clone()),
            genre,
            players,
            rating,
            region: Some("World".to_string()),
            box_art_url,
            screenshot_url,
            wheel_url,
            marquee_url,
            video_url,
        })
    }
}