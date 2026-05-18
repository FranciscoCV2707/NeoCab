pub mod achievements;
pub mod audit;
pub mod coin;
pub mod config_inject;
pub mod config;
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
pub mod updater;

pub use types::*;

pub use system::*;
pub use updater::*;
pub use config_inject::*;
pub use kiosk::*;
pub use achievements::*;
pub use tags::*;
pub use jukebox::*;
pub use safe_quit::*;
pub use display::*;

pub fn get_tag_manager(db: std::sync::Arc<crate::db::Database>) -> crate::core::tag_manager::TagManager {
    crate::core::tag_manager::TagManager::new(db)
}
pub use games::*;
pub use emulator::*;
pub use config::*;
pub use coin::*;
pub use timer::*;
pub use input::*;
pub use operator::*;
pub use theme::*;
pub use hardware::*;
pub use media::*;
pub use shader::*;
pub use network::*;
pub use logs::*;
pub use audit::*;
pub use sessions::*;
pub use launcher::*;
pub use studio::*;
pub use pause::*;
pub use setup::*;
