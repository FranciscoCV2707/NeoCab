pub mod trait;
pub mod screenscraper;
pub mod tgdb;
pub mod fallback;

pub use trait::{Scraper, ScraperRegistry, RomInfo};
pub use screenscraper::ScreenScraperScraper;
pub use tgdb::TGDBScraper;
pub use fallback::FallbackScraper;