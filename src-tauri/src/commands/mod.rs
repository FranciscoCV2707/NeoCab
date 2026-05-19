pub mod achievements;
pub mod audit;
pub mod coin;
pub mod config;
pub mod config_inject;
pub mod display;
pub mod emulator;
pub mod games;
pub mod hardware;
pub mod input;
pub mod jukebox;
pub mod kiosk;
pub mod launcher;
pub mod logs;
pub mod media;
pub mod network;
pub mod operator;
pub mod pause;
pub mod plugins;
pub mod safe_quit;
pub mod sessions;
pub mod setup;
pub mod shader;
pub mod studio;
pub mod system;
pub mod tags;
pub mod theme;
pub mod timer;
pub mod types;
pub mod scraper;
pub mod updater;

pub use types::*;

pub use achievements::*;
pub use config_inject::*;
pub use display::*;
pub use jukebox::*;
pub use kiosk::*;
pub use plugins::*;
pub use safe_quit::*;
pub use system::*;
pub use tags::*;
pub use updater::*;

pub fn get_tag_manager(
    db: std::sync::Arc<crate::db::Database>,
) -> crate::core::tag_manager::TagManager {
    crate::core::tag_manager::TagManager::new(db)
}
pub use audit::*;
pub use coin::*;
pub use config::*;
pub use emulator::*;
pub use games::*;
pub use hardware::*;
pub use input::*;
pub use launcher::*;
pub use logs::*;
pub use media::*;
pub use network::*;
pub use operator::*;
pub use pause::*;
pub use sessions::*;
pub use setup::*;
pub use shader::*;
pub use studio::*;
pub use theme::*;
pub use timer::*;
