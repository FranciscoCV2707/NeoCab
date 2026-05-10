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
                Ok((game_library, emulator_manager, coin_manager, timer_manager)) => {
                    app.manage(game_library);
                    app.manage(emulator_manager);
                    app.manage(coin_manager);
                    app.manage(timer_manager);
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
            commands::launch_game,
            commands::stop_game,
            commands::get_recommended_emulator,
            commands::add_coins,
            commands::get_coin_balance,
            commands::start_game,
            commands::end_game,
            commands::return_coins,
            commands::get_earnings,
            commands::start_timer,
            commands::pause_timer,
            commands::resume_timer,
            commands::stop_timer,
            commands::get_timer_status,
            commands::add_timer_time,
            commands::is_time_up,
            commands::get_config,
            commands::set_config,
            commands::reload_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn initialize_app() -> Result<(core::GameLibrary, core::EmulatorManager, core::CoinManager, core::TimerManager)> {
    let db = std::sync::Arc::new(db::Database::new("./data/neocab.db").await?);
    db.init_default_systems().await?;

    let game_library = core::GameLibrary::new(db.clone());

    let mut emulator_manager = core::EmulatorManager::new(db.clone());
    emulator_manager.initialize_default_emulators().await?;

    let coin_manager = core::CoinManager::new(db);
    let timer_manager = core::TimerManager::new();

    Ok((game_library, emulator_manager, coin_manager, timer_manager))
}
