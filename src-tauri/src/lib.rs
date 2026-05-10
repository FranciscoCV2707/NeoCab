pub mod error;
pub mod models;
pub mod commands;
pub mod core;
pub mod db;
pub mod input;
pub mod adapters;
pub mod utils;

pub use error::{NeoCabError, Result};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::list_games,
            commands::list_emulators,
            commands::get_config,
            commands::set_config,
            commands::reload_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
