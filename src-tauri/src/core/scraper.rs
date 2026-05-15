use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use tracing::{info, warn, error, debug};
use crate::error::Result;
use tokio::time::{sleep, Duration};
use tauri::Emitter;

// ─── Scraped Result ───

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapedGameInfo {
    pub title: String,
    pub description: Option<String>,
    pub year: Option<i32>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    pub genre: Option<String>,
    pub players: Option<i32>,
    pub rating: Option<f64>,
    pub region: Option<String>,
    pub box_art_url: Option<String>,
    pub screenshot_url: Option<String>,
    pub wheel_url: Option<String>,
    pub marquee_url: Option<String>,
    pub video_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapeProgress {
    pub current: usize,
    pub total: usize,
    pub game_name: String,
    pub status: String,
}

// ─── ScreenScraper API Structures ───

#[derive(Debug, Deserialize)]
struct SSResponse {
    response: Option<SSGameResponse>,
}

#[derive(Debug, Deserialize)]
struct SSGameResponse {
    jeu: Option<SSGame>,
}

#[derive(Debug, Deserialize)]
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

#[derive(Debug, Deserialize)]
struct SSText {
    region: Option<String>,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SSTextSingle {
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SSDate {
    region: Option<String>,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SSGenre {
    noms: Option<Vec<SSText>>,
}

#[derive(Debug, Deserialize)]
struct SSRating {
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SSMedia {
    #[serde(rename = "type")]
    media_type: Option<String>,
    url: Option<String>,
    region: Option<String>,
    format: Option<String>,
}

// ─── TheGamesDB API Structures ───

#[derive(Debug, Deserialize)]
struct TGDBSearchResponse {
    data: Option<TGDBData>,
}

#[derive(Debug, Deserialize)]
struct TGDBData {
    count: Option<u32>,
    games: Option<Vec<TGDBGame>>,
}

#[derive(Debug, Deserialize)]
struct TGDBGame {
    id: Option<u32>,
    game_title: Option<String>,
    overview: Option<String>,
    release_date: Option<String>,
    developers: Option<Vec<u32>>,
    publishers: Option<Vec<u32>>,
    genres: Option<Vec<u32>>,
    players: Option<u32>,
    rating: Option<String>,
}

// ─── System ID Mapping ───

fn get_screenscraper_system_id(system_name: &str) -> Option<u32> {
    let map: HashMap<&str, u32> = HashMap::from([
        ("mame", 75),
        ("arcade", 75),
        ("nes", 3),
        ("famicom", 3),
        ("snes", 4),
        ("super_famicom", 4),
        ("n64", 14),
        ("gamecube", 13),
        ("wii", 16),
        ("gb", 9),
        ("gbc", 10),
        ("gba", 12),
        ("nds", 15),
        ("genesis", 1),
        ("megadrive", 1),
        ("mastersystem", 2),
        ("saturn", 22),
        ("dreamcast", 23),
        ("gamegear", 21),
        ("sg1000", 109),
        ("psx", 57),
        ("ps2", 58),
        ("psp", 61),
        ("atari2600", 26),
        ("atari5200", 40),
        ("atari7800", 41),
        ("lynx", 28),
        ("jaguar", 27),
        ("colecovision", 48),
        ("intellivision", 115),
        ("neogeo", 142),
        ("neogeocd", 70),
        ("pcengine", 31),
        ("turbografx16", 31),
        ("supergrafx", 105),
        ("3do", 29),
        ("vectrex", 102),
        ("msx", 113),
        ("msx2", 116),
        ("amiga", 64),
        ("c64", 66),
        ("zxspectrum", 76),
        ("amstradcpc", 65),
        ("scummvm", 123),
        ("fba", 75),
        ("fbneo", 75),
        ("cps1", 6),
        ("cps2", 7),
        ("cps3", 8),
        ("naomi", 56),
        ("atomiswave", 53),
        ("model2", 54),
        ("model3", 55),
    ]);
    
    map.get(system_name.to_lowercase().as_str()).copied()
}

// ─── Main Scraper ───

pub struct GameScraper {
    client: Client,
    media_dir: PathBuf,
    // ScreenScraper credentials (free tier)
    ss_dev_id: String,
    ss_dev_password: String,
    ss_user: String,
    ss_password: String,
    // Rate limiting
    last_request: std::sync::Mutex<std::time::Instant>,
}

impl GameScraper {
    pub fn new(media_dir: PathBuf) -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .user_agent("NeoCab/1.0")
                .build()
                .unwrap_or_else(|_| Client::new()),
            media_dir,
            ss_dev_id: String::new(),
            ss_dev_password: String::new(),
            ss_user: String::new(),
            ss_password: String::new(),
            last_request: std::sync::Mutex::new(std::time::Instant::now()),
        }
    }

    /// Configure ScreenScraper credentials
    pub fn set_screenscraper_credentials(
        &mut self,
        dev_id: &str,
        dev_password: &str,
        user: &str,
        password: &str,
    ) {
        self.ss_dev_id = dev_id.to_string();
        self.ss_dev_password = dev_password.to_string();
        self.ss_user = user.to_string();
        self.ss_password = password.to_string();
    }

    /// Rate limiter — max 1 request per second for ScreenScraper
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

    /// Scrape a single game using ScreenScraper API
    pub async fn scrape_screenscraper(
        &self,
        rom_name: &str,
        system_name: &str,
        crc32: Option<&str>,
    ) -> Result<ScrapedGameInfo> {
        self.rate_limit().await;

        let system_id = get_screenscraper_system_id(system_name)
            .unwrap_or(75); // Default to MAME/Arcade

        let mut url = format!(
            "https://api.screenscraper.fr/api2/jeuInfos.php?devid={}&devpassword={}&softname=NeoCab&output=json&systemeid={}",
            self.ss_dev_id, self.ss_dev_password, system_id
        );

        // Add user credentials if available
        if !self.ss_user.is_empty() {
            url.push_str(&format!("&ssid={}&sspassword={}", self.ss_user, self.ss_password));
        }

        // Try CRC32 first (most accurate), then ROM name
        if let Some(crc) = crc32 {
            url.push_str(&format!("&crc={}", crc));
        } else {
            let clean_name = rom_name
                .replace(".zip", "")
                .replace(".7z", "")
                .replace(".bin", "")
                .replace(".rom", "");
            url.push_str(&format!("&romnom={}", clean_name));
        }

        info!("Scraping via ScreenScraper: {} (system {})", rom_name, system_id);

        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            warn!("ScreenScraper returned status {}", response.status());
            return self.scrape_fallback(rom_name, system_name).await;
        }

        let body = response.text().await?;
        
        match serde_json::from_str::<SSResponse>(&body) {
            Ok(ss_response) => {
                if let Some(game_resp) = ss_response.response {
                    if let Some(game) = game_resp.jeu {
                        return Ok(self.parse_screenscraper_game(&game));
                    }
                }
                warn!("No game data in ScreenScraper response for {}", rom_name);
                self.scrape_fallback(rom_name, system_name).await
            }
            Err(e) => {
                warn!("Failed to parse ScreenScraper response: {}", e);
                self.scrape_fallback(rom_name, system_name).await
            }
        }
    }

    /// Parse ScreenScraper game data into our format
    fn parse_screenscraper_game(&self, game: &SSGame) -> ScrapedGameInfo {
        // Get title (prefer English/World region)
        let title = game.noms.as_ref()
            .and_then(|noms| {
                noms.iter()
                    .find(|n| n.region.as_deref() == Some("wor") || n.region.as_deref() == Some("us"))
                    .or_else(|| noms.first())
                    .and_then(|n| n.text.clone())
            })
            .unwrap_or_default();

        // Get description (prefer English)
        let description = game.synopsis.as_ref()
            .and_then(|syns| {
                syns.iter()
                    .find(|s| s.region.as_deref() == Some("en") || s.region.as_deref() == Some("us"))
                    .or_else(|| syns.iter().find(|s| s.region.as_deref() == Some("wor")))
                    .or_else(|| syns.first())
                    .and_then(|s| s.text.clone())
            });

        // Get year from dates
        let year = game.dates.as_ref()
            .and_then(|dates| {
                dates.first()
                    .and_then(|d| d.text.as_ref())
                    .and_then(|t| t.get(0..4))
                    .and_then(|y| y.parse::<i32>().ok())
            });

        // Get genre
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

        // Get rating (normalize to 0-5 scale)
        let rating = game.note.as_ref()
            .and_then(|n| n.text.as_ref())
            .and_then(|t| t.parse::<f64>().ok())
            .map(|r| r / 4.0); // SS uses 0-20, normalize to 0-5

        // Get media URLs
        let (box_art_url, screenshot_url, wheel_url, marquee_url, video_url) = 
            self.extract_media_urls(game);

        // Get players
        let players = game.joueurs.as_ref()
            .and_then(|j| j.text.as_ref())
            .and_then(|t| t.chars().next())
            .and_then(|c| c.to_digit(10))
            .map(|p| p as i32);

        ScrapedGameInfo {
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
        }
    }

    /// Extract media URLs from ScreenScraper game data
    fn extract_media_urls(&self, game: &SSGame) -> (Option<String>, Option<String>, Option<String>, Option<String>, Option<String>) {
        let medias = match &game.medias {
            Some(m) => m,
            None => return (None, None, None, None, None),
        };

        let mut box_art = None;
        let mut screenshot = None;
        let mut wheel = None;
        let mut marquee = None;
        let mut video = None;

        for media in medias {
            let media_type = media.media_type.as_deref().unwrap_or("");
            let url = media.url.as_deref().unwrap_or("");
            
            if url.is_empty() { continue; }

            match media_type {
                "box-2D" | "box-2D-front" => {
                    if box_art.is_none() { box_art = Some(url.to_string()); }
                }
                "ss" | "sstitle" => {
                    if screenshot.is_none() { screenshot = Some(url.to_string()); }
                }
                "wheel" | "wheel-hd" | "wheel-carbon" | "wheel-steel" => {
                    if wheel.is_none() { wheel = Some(url.to_string()); }
                }
                "screenmarquee" | "marquee" => {
                    if marquee.is_none() { marquee = Some(url.to_string()); }
                }
                "video" | "video-normalized" => {
                    if video.is_none() { video = Some(url.to_string()); }
                }
                _ => {}
            }
        }

        (box_art, screenshot, wheel, marquee, video)
    }

    /// Fallback scraper using cleaned ROM name matching
    async fn scrape_fallback(&self, rom_name: &str, _system_name: &str) -> Result<ScrapedGameInfo> {
        let clean_name = rom_name
            .replace(".zip", "")
            .replace(".7z", "")
            .replace("_", " ")
            .replace("-", " ");
        
        // Title case the cleaned name
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

        info!("Using fallback scraper for: {}", title);

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

    /// Download an image from URL to local file
    pub async fn download_media(&self, url: &str, dest: &Path) -> Result<()> {
        if url.is_empty() {
            return Ok(());
        }

        // Create parent dirs
        if let Some(parent) = dest.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        info!("Downloading media: {} -> {:?}", url, dest);

        let resp = self.client.get(url).send().await?;
        
        if !resp.status().is_success() {
            warn!("Failed to download {}: status {}", url, resp.status());
            return Ok(());
        }

        let bytes = resp.bytes().await?;
        tokio::fs::write(dest, bytes).await?;
        
        debug!("Downloaded {} bytes to {:?}", dest.metadata().map(|m| m.len()).unwrap_or(0), dest);
        Ok(())
    }

    /// Scrape and download all media for a game
    pub async fn scrape_and_download(
        &self,
        rom_name: &str,
        system_name: &str,
        crc32: Option<&str>,
    ) -> Result<ScrapedGameInfo> {
        let info = self.scrape_screenscraper(rom_name, system_name, crc32).await?;
        
        let game_media_dir = self.media_dir.join(system_name);
        let clean_name = rom_name.replace(".zip", "").replace(".7z", "");

        // Download box art
        if let Some(url) = &info.box_art_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir.join("Boxes").join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download screenshot
        if let Some(url) = &info.screenshot_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir.join("Screenshots").join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download wheel art
        if let Some(url) = &info.wheel_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir.join("Wheels").join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download marquee
        if let Some(url) = &info.marquee_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir.join("Marquees").join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download video
        if let Some(url) = &info.video_url {
            let ext = url.rsplit('.').next().unwrap_or("mp4");
            let dest = game_media_dir.join("Videos").join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        Ok(info)
    }

    /// Batch scrape all games without metadata.
    /// Returns count of successfully scraped games.
    pub async fn scrape_all(
        &self,
        games: &[crate::models::Game],
        system_name: &str,
        cancel: std::sync::Arc<std::sync::atomic::AtomicBool>,
        app_handle: Option<tauri::AppHandle>,
    ) -> (usize, usize) {
        let total = games.len();
        let mut scraped = 0usize;
        let mut errors = 0usize;

        info!("Batch scraping {} games for system {}", total, system_name);

        for (i, game) in games.iter().enumerate() {
            if cancel.load(std::sync::atomic::Ordering::Relaxed) {
                info!("Batch scraping cancelled at game {}/{}", i, total);
                break;
            }

            let rom_name = game.filename.as_deref().unwrap_or(&game.title);

            if let Some(handle) = &app_handle {
                let _ = handle.emit("scrape_progress", serde_json::json!({
                    "current": i + 1,
                    "total": total,
                    "game_name": game.title,
                    "status": "scraping",
                }));
            }

            match self
                .scrape_and_download(rom_name, system_name, game.crc32.as_deref())
                .await
            {
                Ok(info) => {
                    // Update DB with scraped metadata
                    let year_i64 = info.year.map(|y| y as i64);
                    let players_i64 = info.players.map(|p| p as i64);
                    // Note: DB update would need db ref; returned info for caller to handle
                    scraped += 1;
                    if let Some(handle) = &app_handle {
                        let _ = handle.emit("scrape_progress", serde_json::json!({
                            "current": i + 1,
                            "total": total,
                            "game_name": game.title,
                            "status": "done",
                        }));
                    }
                }
                Err(e) => {
                    warn!("Failed to scrape {}: {}", game.title, e);
                    errors += 1;
                    if let Some(handle) = &app_handle {
                        let _ = handle.emit("scrape_progress", serde_json::json!({
                            "current": i + 1,
                            "total": total,
                            "game_name": game.title,
                            "status": "error",
                            "error": e.to_string(),
                        }));
                    }
                }
            }
        }

        info!("Batch scraping complete: {} scraped, {} errors", scraped, errors);
        (scraped, errors)
    }
}
