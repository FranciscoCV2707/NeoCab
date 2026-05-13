pub mod adapters;
pub mod commands;
pub mod core;
pub mod db;
pub mod error;
pub mod input;
pub mod models;
pub mod utils;

#[cfg(feature = "legacy-ui")]
pub mod legacy;

pub use error::{NeoCabError, Result};
use tauri::Manager;
use std::path::PathBuf;
use utils::RuntimeMode;

fn determine_shader_path() -> PathBuf {
    use std::path::Path;

    // Priority order for shader discovery:
    // 1. Bundled installation paths (Windows/Linux post-install)
    // 2. Development paths

    #[cfg(target_os = "windows")]
    {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(parent) = exe_path.parent() {
                let bundled = parent.join("config").join("shaders");
                if bundled.exists() {
                    tracing::info!("Using bundled shaders from: {}", bundled.display());
                    return bundled;
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let paths = vec![
            "/usr/local/share/neocab/config/shaders".into(),
            "/usr/share/neocab/config/shaders".into(),
        ];
        for path in paths {
            if Path::new(&path).exists() {
                tracing::info!("Using bundled shaders from: {}", path);
                return path;
            }
        }
    }

    // Fallback to development paths
    let dev_paths = vec![
        PathBuf::from("./config/shaders"),
        PathBuf::from("./public/shaders"),
    ];

    for path in dev_paths {
        if path.exists() {
            tracing::info!("Using development shaders from: {}", path.display());
            return path;
        }
    }

    tracing::warn!("No shader directory found, using default: ./config/shaders");
    PathBuf::from("./config/shaders")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    init_logging();

    // Initialize application directories and default configs
    if let Err(e) = tauri::async_runtime::block_on(utils::initialize_app_directories()) {
        eprintln!("Warning: Failed to initialize directories: {}", e);
        tracing::warn!("Failed to initialize directories: {}", e);
    }

    // Detect runtime mode (Modern or Legacy)
    let runtime_mode = utils::detect_mode();
    let system_info = utils::get_system_info();

    use std::sync::Arc;
    use tauri::Manager;
    use tracing::info;

    tracing::info!("================================================");
    tracing::info!("NeoCab v1.0 Starting");
    tracing::info!("Runtime Mode: {}", runtime_mode);
    tracing::info!("Platform: {} ({})", system_info.os, system_info.arch);
    tracing::info!("Family: {}", system_info.family);
    tracing::info!("================================================");

    #[cfg(feature = "modern-ui")]
    tracing::info!("Feature: modern-ui enabled (Tauri+React)");

    #[cfg(feature = "legacy-ui")]
    tracing::info!("Feature: legacy-ui enabled (SDL2)");

    #[cfg(feature = "hardware-gpio")]
    tracing::info!("Feature: hardware-gpio enabled (RPi GPIO)");

    #[cfg(feature = "hardware-arduino")]
    tracing::info!("Feature: hardware-arduino enabled (Arduino serial)");

    // Execute legacy mode if detected and compiled with legacy-ui feature
    #[cfg(feature = "legacy-ui")]
    {
        if matches!(runtime_mode, RuntimeMode::Legacy) {
            tracing::info!("Legacy mode activated - running SDL2 application");
            run_legacy_app();
            return;
        }
    }

    // Otherwise, run modern Tauri app
    run_modern_app();
}

/// Run legacy SDL2 application (Windows XP compatible)
#[cfg(feature = "legacy-ui")]
fn run_legacy_app() {
    use tauri::async_runtime;

    let result = async_runtime::block_on(async {
        match legacy::LegacyApp::new().await {
            Ok(mut app) => {
                tracing::info!("Legacy application created successfully");
                match app.run().await {
                    Ok(_) => {
                        tracing::info!("Legacy application exited normally");
                        Ok(())
                    }
                    Err(e) => {
                        tracing::error!("Legacy application error: {}", e);
                        Err(e)
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to create legacy application: {}", e);
                Err(e)
            }
        }
    });

    match result {
        Ok(_) => {
            tracing::info!("NeoCab legacy mode shutdown complete");
            std::process::exit(0);
        }
        Err(e) => {
            eprintln!("NeoCab legacy mode failed: {}", e);
            std::process::exit(1);
        }
    }
}

#[cfg(not(feature = "legacy-ui"))]
fn run_legacy_app() {
    eprintln!("Legacy mode requested but legacy-ui feature not enabled");
    eprintln!("Rebuild with: cargo build --features legacy-ui");
    std::process::exit(1);
}

/// Run modern Tauri application
fn run_modern_app() {
    let _ = tauri::Builder::default()
        .setup(|app| {
            let result = tauri::async_runtime::block_on(initialize_app());

            match result {
                Ok((
                    db,
                    game_library,
                    emulator_manager,
                    coin_manager,
                    timer_manager,
                    input_manager,
                    operator_panel,
                    autoboot_manager,
                    theme_manager,
                    media_manager,
                    shader_manager,
                    config_manager,
                    network_manager,
                )) => {
                    app.manage(db);
                    app.manage(game_library);
                    app.manage(emulator_manager);
                    app.manage(coin_manager);
                    app.manage(timer_manager);
                    app.manage(input_manager);
                    app.manage(operator_panel);
                    app.manage(autoboot_manager);
                    app.manage(theme_manager);
                    app.manage(media_manager);
                    app.manage(shader_manager);
                    app.manage(config_manager);
                    app.manage(network_manager);

                    // Show marquee window on start if it exists
                    if let Some(marquee) = app.get_webview_window("marquee") {
                        let _ = marquee.show();
                    }

                    Ok(())
                }
                Err(e) => {
                    tracing::error!("Application initialization failed: {}", e);
                    Err(Box::new(e))
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Setup wizard
            commands::needs_setup,
            commands::get_available_emulators,
            commands::validate_rom_path,
            commands::get_default_paths,
            commands::save_setup_config,
            commands::mark_setup_complete,
            commands::get_default_operator_pin,
            // System commands
            commands::get_system_info,
            commands::list_systems,
            commands::list_games,
            commands::toggle_favorite,
            commands::update_game_metadata,
            commands::import_external_library,
            commands::import_steam_games,
            commands::get_save_states,
            commands::get_high_scores,
            commands::scan_roms,
            commands::list_emulators,
            commands::launch_game,
            commands::stop_game,
            commands::get_recommended_emulator,
            commands::add_coins,
            commands::add_coins_via_key,
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
            // Shader commands
            commands::list_shaders,
            commands::get_shader_params,
            commands::set_shader_param,
            commands::list_shader_presets,
            commands::get_shader_preset,
            commands::add_timer_time,
            commands::is_time_up,
            commands::get_input_devices,
            commands::get_input_mappings,
            commands::set_deadzone,
            commands::get_deadzone,
            commands::set_input_enabled,
            commands::is_input_enabled,
            commands::get_config,
            commands::set_config,
            commands::reload_config,
            commands::save_system_config,
            commands::load_system_config,
            commands::get_all_system_configs,
            commands::authenticate_operator,
            commands::logout_operator,
            commands::is_operator_authenticated,
            commands::change_operator_pin,
            commands::get_operator_stats,
            commands::get_session_stats,
            commands::get_system_health,
            commands::enable_autoboot,
            commands::disable_autoboot,
            commands::is_autoboot_enabled,
            // Audit commands
            commands::audit_roms,
            commands::audit_media,
            commands::audit_full,
            commands::get_logs,
            commands::enable_kiosk_mode,
            commands::disable_kiosk_mode,
            commands::is_kiosk_mode_enabled,
            commands::set_theme,
            commands::get_current_theme,
            commands::get_theme_css,
            commands::list_available_themes,
            commands::set_system_theme,
            commands::remove_system_theme,
            commands::list_system_themes,
            commands::list_gpio_pins,
            commands::list_serial_ports,
            commands::test_gpio_pin,
            commands::test_arduino_connection,
            commands::calibrate_coin_detection,
            commands::get_hardware_status,
            commands::start_hardware_monitoring,
            commands::stop_hardware_monitoring,
            commands::scan_media,
            commands::get_media_stats,
            commands::get_system_media,
            commands::organize_media,
            commands::get_media,
            commands::import_media,
            commands::trigger_media_rescan,
            commands::get_all_game_media,
            commands::get_network_info,
            commands::list_shaders,
            commands::rescan_shaders,
            commands::get_shader,
            commands::validate_shader,
            commands::list_shader_presets,
            commands::get_shader_preset,
            commands::get_default_shader,
            commands::get_shader_params,
            commands::set_shader_param,
            commands::start_shader_watcher,
            commands::stop_shader_watcher,
            commands::is_shader_watcher_running,
            commands::list_discovered_cabinets,
            commands::get_network_role,
            commands::set_network_role,
            commands::start_network_discovery,
            commands::start_network_advertising,
            commands::start_revenue_sync,
            commands::sync_revenue_now,
            commands::set_master_ip,
            commands::get_master_ip,
            commands::check_timer_timeout,
            commands::read_log_file,
            commands::list_log_files,
            commands::clear_logs,
            commands::get_log_tail,
            commands::audit_roms,
            commands::audit_media,
            commands::audit_full,
            commands::detect_emulators,
            // Scraping and play stats
            commands::scrape_game,
            commands::update_play_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_logging() {
    use tracing_subscriber;
    use std::path::PathBuf;

    // Create logs directory if it doesn't exist
    let logs_dir = PathBuf::from("./data/logs");
    let _ = std::fs::create_dir_all(&logs_dir);

    // Set up file appender
    let file_appender = tracing_appender::rolling::daily(&logs_dir, "neocab.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("neocab=debug".parse().unwrap()),
        )
        .with_writer(non_blocking)
        .try_init();

    // Keep the guard alive for the lifetime of the program
    std::mem::forget(_guard);
}

async fn initialize_app() -> Result<(
    std::sync::Arc<db::Database>,
    core::GameLibrary,
    core::EmulatorManager,
    core::CoinManager,
    core::TimerManager,
    input::InputManager,
    core::OperatorPanel,
    core::AutobootManager,
    core::ThemeManager,
    core::MediaManager,
    core::ShaderManager,
    core::ConfigManager,
    core::NetworkManager,
)> {
    let db = std::sync::Arc::new(db::Database::new("./data/neocab.db").await?);
    db.init_default_systems().await?;

    let game_library = core::GameLibrary::new(db.clone());

    let mut emulator_manager = core::EmulatorManager::new(db.clone());
    emulator_manager.initialize_default_emulators().await?;

    let coin_manager = core::CoinManager::new(db.clone());
    let timer_manager = core::TimerManager::new();
    let input_manager = input::InputManager::new();
    let operator_panel = core::OperatorPanel::new("0000".to_string());
    let autoboot_manager = core::AutobootManager::default();
    let theme_manager = core::ThemeManager::new("./data/themes".into());
    let media_manager = core::MediaManager::new("./data".into(), 256 * 1024 * 1024);

    // Start media folder watching for automatic rescans
    if let Err(e) = media_manager.start_auto_watch().await {
        tracing::warn!("Failed to start media folder watching: {}", e);
    } else {
        tracing::info!("Media folder watching started - rescans will trigger on media changes");
    }

    // Determine shader path: bundled first, then fallback to development paths
    let shader_path = determine_shader_path();
    let shader_manager = core::ShaderManager::with_custom_path(
        shader_path.clone(),
        shader_path.clone(),
    );
    let config_manager = core::ConfigManager::new("./data/config.yml", db.clone()).await?;

    // Phase 7: Network Manager
    let cabinet_id = uuid::Uuid::new_v4().to_string(); // In a real app, this should be persistent
    let network_manager = core::NetworkManager::new(
        cabinet_id,
        "NeoCab-Gabinete".to_string(),
        8080,
        db.clone()
    )?;
    
    // Auto-start discovery, advertising and API server
    let _ = network_manager.start_server();
    let _ = network_manager.start_advertising();
    let _ = network_manager.start_discovery();

    Ok((
        db,
        game_library,
        emulator_manager,
        coin_manager,
        timer_manager,
        input_manager,
        operator_panel,
        autoboot_manager,
        theme_manager,
        media_manager,
        shader_manager,
        config_manager,
        network_manager,
    ))
}
