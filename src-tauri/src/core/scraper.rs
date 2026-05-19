use crate::error::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tokio::time::{sleep, Duration};
use tracing::{debug, info, warn};

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
    // Media URLs
    pub box_art_url: Option<String>,
    pub screenshot_url: Option<String>,
    pub wheel_url: Option<String>,
    pub marquee_url: Option<String>,
    pub video_url: Option<String>,
    /// Decorative bezel/frame image for the emulator window.
    pub bezel_url: Option<String>,
    /// Fan art / background image for the game detail view.
    pub fanart_url: Option<String>,
    /// Rendered 3-D box artwork.
    pub box3d_url: Option<String>,
    /// Cartridge/disc image.
    pub cartridge_url: Option<String>,
    /// PDF or image link to the game manual.
    pub manual_url: Option<String>,
    /// Which scraper provided this data.
    pub source: Option<String>,
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
#[allow(dead_code)]
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
#[allow(dead_code)]
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
#[allow(dead_code)]
struct TGDBData {
    count: Option<u32>,
    games: Option<Vec<TGDBGame>>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
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

fn get_tgdb_platform_id(system_name: &str) -> Option<u32> {
    let map: HashMap<&str, u32> = HashMap::from([
        ("mame", 23),
        ("arcade", 23),
        ("nes", 7),
        ("snes", 6),
        ("n64", 3),
        ("gamecube", 2),
        ("wii", 9),
        ("gb", 4),
        ("gbc", 5),
        ("gba", 18),
        ("nds", 20),
        ("genesis", 15),
        ("megadrive", 15),
        ("mastersystem", 16),
        ("saturn", 17),
        ("dreamcast", 14),
        ("gamegear", 24),
        ("psx", 10),
        ("ps2", 11),
        ("psp", 13),
        ("atari2600", 22),
        ("neogeo", 24),
    ]);
    map.get(system_name.to_lowercase().as_str()).copied()
}

// ─── Helpers ───

fn is_arcade_system(system_name: &str) -> bool {
    matches!(
        system_name.to_lowercase().as_str(),
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

// ─── Main Scraper ───

pub struct GameScraper {
    client: Client,
    media_dir: PathBuf,
    // ScreenScraper credentials
    ss_dev_id: String,
    ss_dev_password: String,
    ss_user: String,
    ss_password: String,
    // TheGamesDB
    tgdb_api_key: String,
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
            tgdb_api_key: String::new(),
            last_request: std::sync::Mutex::new(std::time::Instant::now()),
        }
    }

    /// Configure API credentials
    pub fn set_credentials(
        &mut self,
        ss_dev_id: &str,
        ss_dev_password: &str,
        ss_user: &str,
        ss_password: &str,
        tgdb_api_key: &str,
    ) {
        self.ss_dev_id = ss_dev_id.to_string();
        self.ss_dev_password = ss_dev_password.to_string();
        self.ss_user = ss_user.to_string();
        self.ss_password = ss_password.to_string();
        self.tgdb_api_key = tgdb_api_key.to_string();
    }

    /// Rate limiter — max 1 request per second for ScreenScraper
    async fn rate_limit(&self) {
        let elapsed = {
            let last = self.last_request.lock().ok();
            last.map(|l| l.elapsed()).unwrap_or(Duration::ZERO)
        };
        if elapsed < Duration::from_millis(1200) {
            sleep(Duration::from_millis(1200) - elapsed).await;
        }
        {
            let mut last = self.last_request.lock().ok();
            if let Some(l) = last.as_mut() {
                **l = std::time::Instant::now();
            }
        }
    }

    /// Scrape a single game using the best available source
    pub async fn scrape(
        &self,
        rom_name: &str,
        system_name: &str,
        crc32: Option<&str>,
    ) -> Result<ScrapedGameInfo> {
        // Try ScreenScraper first (highest quality)
        if !self.ss_dev_id.is_empty() {
            match self
                .scrape_screenscraper(rom_name, system_name, crc32)
                .await
            {
                Ok(info) if !info.title.is_empty() && info.description.is_some() => {
                    return Ok(info)
                }
                _ => {
                    info!(
                        "ScreenScraper failed or returned low quality for {}, trying TheGamesDB...",
                        rom_name
                    );
                }
            }
        }

        // Try ArcadeDB for arcade systems (free, no auth needed)
        if is_arcade_system(system_name) {
            match self.scrape_arcadedb(rom_name).await {
                Ok(info) if !info.title.is_empty() => {
                    info!("ArcadeDB matched: {}", info.title);
                    return Ok(info);
                }
                _ => info!("ArcadeDB: no match for {}, trying TheGamesDB...", rom_name),
            }
        }

        // Try TheGamesDB as secondary
        if !self.tgdb_api_key.is_empty() {
            match self.scrape_thegamesdb(rom_name, system_name).await {
                Ok(info) if !info.title.is_empty() => return Ok(info),
                _ => {
                    info!(
                        "TheGamesDB failed or returned empty for {}, using fallback...",
                        rom_name
                    );
                }
            }
        }

        // Ultimate fallback (cleaned filename)
        self.scrape_fallback(rom_name, system_name).await
    }

    /// Scrape a single game using TheGamesDB API
    pub async fn scrape_thegamesdb(
        &self,
        rom_name: &str,
        system_name: &str,
    ) -> Result<ScrapedGameInfo> {
        if self.tgdb_api_key.is_empty() {
            return Err(crate::error::NeoCabError::Config(
                "TheGamesDB API key not configured".to_string(),
            ));
        }

        let platform_id = get_tgdb_platform_id(system_name).unwrap_or(23); // Default Arcade
        let clean_name = rom_name
            .replace(".zip", "")
            .replace(".7z", "")
            .replace(".bin", "")
            .replace(".rom", "");

        let url = format!(
            "https://api.thegamesdb.net/v1/Games/ByGameName?apikey={}&name={}&platform={}",
            self.tgdb_api_key,
            urlencoding::encode(&clean_name),
            platform_id
        );

        info!(
            "Scraping via TheGamesDB: {} (platform {})",
            rom_name, platform_id
        );

        let response = self.client.get(&url).send().await?;
        if !response.status().is_success() {
            return Err(crate::error::NeoCabError::Network(format!(
                "TGDB status {}",
                response.status()
            )));
        }

        let resp_data: TGDBSearchResponse = response.json().await?;

        if let Some(data) = resp_data.data {
            if let Some(games) = data.games {
                if let Some(game) = games.first() {
                    return Ok(ScrapedGameInfo {
                        title: game.game_title.clone().unwrap_or_default(),
                        description: game.overview.clone(),
                        year: game
                            .release_date
                            .as_ref()
                            .and_then(|d| d.get(0..4))
                            .and_then(|y| y.parse().ok()),
                        developer: None,
                        publisher: None,
                        genre: None,
                        players: game.players.map(|p| p as i32),
                        rating: game.rating.as_ref().and_then(|r| r.parse().ok()),
                        region: None,
                        box_art_url: None,
                        screenshot_url: None,
                        wheel_url: None,
                        marquee_url: None,
                        video_url: None,
                        bezel_url: None,
                        fanart_url: None,
                        box3d_url: None,
                        cartridge_url: None,
                        manual_url: None,
                        source: Some("TheGamesDB".to_string()),
                    });
                }
            }
        }

        Err(crate::error::NeoCabError::Other(
            "No data found in TheGamesDB".to_string(),
        ))
    }

    /// Scrape a single game using ScreenScraper API
    pub async fn scrape_screenscraper(
        &self,
        rom_name: &str,
        system_name: &str,
        crc32: Option<&str>,
    ) -> Result<ScrapedGameInfo> {
        self.rate_limit().await;

        let system_id = get_screenscraper_system_id(system_name).unwrap_or(75); // Default to MAME/Arcade

        let mut url = format!(
            "https://api.screenscraper.fr/api2/jeuInfos.php?devid={}&devpassword={}&softname=NeoCab&output=json&systemeid={}",
            self.ss_dev_id, self.ss_dev_password, system_id
        );

        // Add user credentials if available
        if !self.ss_user.is_empty() {
            url.push_str(&format!(
                "&ssid={}&sspassword={}",
                self.ss_user, self.ss_password
            ));
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

        info!(
            "Scraping via ScreenScraper: {} (system {})",
            rom_name, system_id
        );

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
        let title = game
            .noms
            .as_ref()
            .and_then(|noms| {
                noms.iter()
                    .find(|n| {
                        n.region.as_deref() == Some("wor") || n.region.as_deref() == Some("us")
                    })
                    .or_else(|| noms.first())
                    .and_then(|n| n.text.clone())
            })
            .unwrap_or_default();

        // Get description (prefer English)
        let description = game.synopsis.as_ref().and_then(|syns| {
            syns.iter()
                .find(|s| s.region.as_deref() == Some("en") || s.region.as_deref() == Some("us"))
                .or_else(|| syns.iter().find(|s| s.region.as_deref() == Some("wor")))
                .or_else(|| syns.first())
                .and_then(|s| s.text.clone())
        });

        // Get year from dates
        let year = game.dates.as_ref().and_then(|dates| {
            dates
                .first()
                .and_then(|d| d.text.as_ref())
                .and_then(|t| t.get(0..4))
                .and_then(|y| y.parse::<i32>().ok())
        });

        // Get genre
        let genre = game.genres.as_ref().and_then(|genres| {
            genres
                .first()
                .and_then(|g| g.noms.as_ref())
                .and_then(|noms| {
                    noms.iter()
                        .find(|n| n.region.as_deref() == Some("en"))
                        .or_else(|| noms.first())
                        .and_then(|n| n.text.clone())
                })
        });

        // Get rating (normalize to 0-5 scale)
        let rating = game
            .note
            .as_ref()
            .and_then(|n| n.text.as_ref())
            .and_then(|t| t.parse::<f64>().ok())
            .map(|r| r / 4.0); // SS uses 0-20, normalize to 0-5

        // Get media URLs
        let (box_art_url, screenshot_url, wheel_url, marquee_url, video_url) =
            self.extract_media_urls(game);

        // Get players
        let players = game
            .joueurs
            .as_ref()
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
            bezel_url: None,
            fanart_url: None,
            box3d_url: None,
            cartridge_url: None,
            manual_url: None,
            source: Some("ScreenScraper".to_string()),
        }
    }

    /// Extract media URLs from ScreenScraper game data
    #[allow(clippy::type_complexity)]
    fn extract_media_urls(
        &self,
        game: &SSGame,
    ) -> (
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    ) {
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

            if url.is_empty() {
                continue;
            }

            match media_type {
                "box-2D" | "box-2D-front" if box_art.is_none() => {
                    box_art = Some(url.to_string());
                }
                "ss" | "sstitle" if screenshot.is_none() => {
                    screenshot = Some(url.to_string());
                }
                "wheel" | "wheel-hd" | "wheel-carbon" | "wheel-steel" if wheel.is_none() => {
                    wheel = Some(url.to_string());
                }
                "screenmarquee" | "marquee" if marquee.is_none() => {
                    marquee = Some(url.to_string());
                }
                "video" | "video-normalized" if video.is_none() => {
                    video = Some(url.to_string());
                }
                _ => {}
            }
        }

        (box_art, screenshot, wheel, marquee, video)
    }

    /// Scrape a single game from ArcadeDB (free, MAME-focused, no credentials).
    pub async fn scrape_arcadedb(&self, rom_name: &str) -> Result<ScrapedGameInfo> {
        let rom_id = rom_name
            .trim_end_matches(".zip")
            .trim_end_matches(".7z")
            .to_lowercase();

        let url = format!(
            "https://www.arcadeitalia.net/api/game.php?game_name={}&lang=en",
            rom_id
        );

        info!("ArcadeDB scraping: {}", rom_name);

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            return Err(crate::error::NeoCabError::Network(format!(
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
        let adb: ADBResponse = serde_json::from_str(&body)
            .map_err(|e| crate::error::NeoCabError::Serialization(e))?;

        let game = adb
            .result
            .and_then(|r| r.into_iter().next())
            .ok_or_else(|| crate::error::NeoCabError::Other(format!("ArcadeDB: no result for '{}'", rom_name)))?;

        let screenshot = game.screenshot_url.or(game.title_screen_url);
        Ok(ScrapedGameInfo {
            title: game.title.unwrap_or_else(|| rom_name.to_string()),
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

    /// Scrape with exponential backoff retry on 429 / 5xx errors.
    pub async fn scrape_with_retry(
        &self,
        rom_name: &str,
        system_name: &str,
        crc32: Option<&str>,
        max_retries: u32,
    ) -> Result<ScrapedGameInfo> {
        let mut delay = Duration::from_millis(500);
        for attempt in 0..=max_retries {
            match self.scrape(rom_name, system_name, crc32).await {
                Ok(info) => return Ok(info),
                Err(e) if attempt < max_retries => {
                    warn!(
                        "Scrape attempt {}/{} failed for {}: {}. Retrying in {:?}...",
                        attempt + 1, max_retries + 1, rom_name, e, delay
                    );
                    sleep(delay).await;
                    delay = std::cmp::min(delay * 2, Duration::from_secs(30));
                }
                Err(e) => return Err(e),
            }
        }
        unreachable!()
    }

    /// Batch scrape with configurable concurrency via tokio Semaphore.
    /// Use `max_concurrent = 1` to scrape sequentially (default behavior).
    pub async fn scrape_all_concurrent(
        scraper: std::sync::Arc<Self>,
        games: Vec<crate::models::Game>,
        system_name: String,
        max_concurrent: usize,
        cancel: std::sync::Arc<std::sync::atomic::AtomicBool>,
        app_handle: Option<tauri::AppHandle>,
    ) -> (usize, usize) {
        use std::sync::atomic::Ordering;
        use std::sync::Arc;
        use tokio::sync::Semaphore;
        use tokio::task::JoinSet;

        let sem = Arc::new(Semaphore::new(max_concurrent.max(1)));
        let scraped = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let errors = Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let total = games.len();
        let mut set = JoinSet::new();

        for (i, game) in games.into_iter().enumerate() {
            if cancel.load(Ordering::Relaxed) {
                break;
            }

            let permit = match sem.clone().acquire_owned().await {
                Ok(p) => p,
                Err(_) => break,
            };

            let s = scraper.clone();
            let sys = system_name.clone();
            let scraped_ref = scraped.clone();
            let errors_ref = errors.clone();
            let cancel_ref = cancel.clone();
            let handle_opt = app_handle.clone();

            set.spawn(async move {
                let _permit = permit;

                if cancel_ref.load(Ordering::Relaxed) {
                    return;
                }

                let rom_name = game.filename.as_deref().unwrap_or(&game.title).to_string();

                if let Some(h) = &handle_opt {
                    let _ = h.emit(
                        "scrape_progress",
                        serde_json::json!({
                            "current": i + 1,
                            "total": total,
                            "game_name": &game.title,
                            "status": "scraping",
                        }),
                    );
                }

                match s.scrape_with_retry(&rom_name, &sys, game.crc32.as_deref(), 2).await {
                    Ok(_) => {
                        scraped_ref.fetch_add(1, Ordering::Relaxed);
                        if let Some(h) = &handle_opt {
                            let _ = h.emit(
                                "scrape_progress",
                                serde_json::json!({
                                    "current": i + 1,
                                    "total": total,
                                    "game_name": &game.title,
                                    "status": "done",
                                }),
                            );
                        }
                    }
                    Err(e) => {
                        errors_ref.fetch_add(1, Ordering::Relaxed);
                        warn!("Failed to scrape {}: {}", game.title, e);
                        if let Some(h) = &handle_opt {
                            let _ = h.emit(
                                "scrape_progress",
                                serde_json::json!({
                                    "current": i + 1,
                                    "total": total,
                                    "game_name": &game.title,
                                    "status": "error",
                                    "error": e.to_string(),
                                }),
                            );
                        }
                    }
                }
            });
        }

        while let Some(_) = set.join_next().await {}

        let s = scraped.load(Ordering::Relaxed);
        let e = errors.load(Ordering::Relaxed);
        info!("Concurrent scrape complete: {} scraped, {} errors", s, e);
        (s, e)
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
            bezel_url: None,
            fanart_url: None,
            box3d_url: None,
            cartridge_url: None,
            manual_url: None,
            source: Some("Fallback".to_string()),
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

        debug!(
            "Downloaded {} bytes to {:?}",
            dest.metadata().map(|m| m.len()).unwrap_or(0),
            dest
        );
        Ok(())
    }

    /// Scrape and download all media for a game
    pub async fn scrape_and_download(
        &self,
        rom_name: &str,
        system_name: &str,
        crc32: Option<&str>,
    ) -> Result<ScrapedGameInfo> {
        let info = self.scrape(rom_name, system_name, crc32).await?;

        let game_media_dir = self.media_dir.join(system_name);
        let clean_name = rom_name.replace(".zip", "").replace(".7z", "");

        // Download box art
        if let Some(url) = &info.box_art_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("Boxes")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download screenshot
        if let Some(url) = &info.screenshot_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("Screenshots")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download wheel art
        if let Some(url) = &info.wheel_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("Wheels")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download marquee
        if let Some(url) = &info.marquee_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("Marquees")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download video
        if let Some(url) = &info.video_url {
            let ext = url.rsplit('.').next().unwrap_or("mp4");
            let dest = game_media_dir
                .join("Videos")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download bezel
        if let Some(url) = &info.bezel_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("Bezels")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download fanart
        if let Some(url) = &info.fanart_url {
            let ext = url.rsplit('.').next().unwrap_or("jpg");
            let dest = game_media_dir
                .join("Fanart")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download 3D box
        if let Some(url) = &info.box3d_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("3DBoxes")
                .join(format!("{}.{}", clean_name, ext));
            self.download_media(url, &dest).await.ok();
        }

        // Download cartridge
        if let Some(url) = &info.cartridge_url {
            let ext = url.rsplit('.').next().unwrap_or("png");
            let dest = game_media_dir
                .join("Cartridges")
                .join(format!("{}.{}", clean_name, ext));
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
                let _ = handle.emit(
                    "scrape_progress",
                    serde_json::json!({
                        "current": i + 1,
                        "total": total,
                        "game_name": game.title,
                        "status": "scraping",
                    }),
                );
            }

            match self
                .scrape_and_download(rom_name, system_name, game.crc32.as_deref())
                .await
            {
                Ok(info) => {
                    // Update DB with scraped metadata
                    let _year_i64 = info.year.map(|y| y as i64);
                    let _players_i64 = info.players.map(|p| p as i64);
                    // Note: DB update would need db ref; returned info for caller to handle
                    scraped += 1;
                    if let Some(handle) = &app_handle {
                        let _ = handle.emit(
                            "scrape_progress",
                            serde_json::json!({
                                "current": i + 1,
                                "total": total,
                                "game_name": game.title,
                                "status": "done",
                            }),
                        );
                    }
                }
                Err(e) => {
                    warn!("Failed to scrape {}: {}", game.title, e);
                    errors += 1;
                    if let Some(handle) = &app_handle {
                        let _ = handle.emit(
                            "scrape_progress",
                            serde_json::json!({
                                "current": i + 1,
                                "total": total,
                                "game_name": game.title,
                                "status": "error",
                                "error": e.to_string(),
                            }),
                        );
                    }
                }
            }
        }

        info!(
            "Batch scraping complete: {} scraped, {} errors",
            scraped, errors
        );
        (scraped, errors)
    }
}
