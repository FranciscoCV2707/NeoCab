pub mod error;
pub mod models;
pub mod commands;
pub mod core;
pub mod db;
pub mod input;
pub mod adapters;
pub mod utils;

pub use error::{NeoCabError, Result};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let rt = tokio::runtime::Handle::current();

            let result = rt.block_on(async {
                initialize_app().await
            });

            match result {
                Ok(game_library) => {
                    app.manage(game_library);
                    Ok(())
                }
                Err(e) => {
                    eprintln!("Failed to initialize app: {}", e);
                    Err(Box::new(e) as Box<dyn std::error::Error>)
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::list_games,
            commands::scan_roms,
            commands::list_emulators,
            commands::get_config,
            commands::set_config,
            commands::reload_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn initialize_app() -> Result<core::GameLibrary> {
    let db = std::sync::Arc::new(db::Database::new("./data/neocab.db").await?);
    db.init_default_systems().await?;
    let game_library = core::GameLibrary::new(db);

    Ok(game_library)
}
