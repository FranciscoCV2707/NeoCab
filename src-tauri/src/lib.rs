pub mod adapters;
pub mod commands;
pub mod commands_v2;
pub mod core;
pub mod library_parsers;
pub mod rom_identifier;
pub mod db;
pub mod error;
pub mod input;
pub mod models;
pub mod utils;

#[cfg(feature = "legacy-ui")]
pub mod legacy;

pub use error::{NeoCabError, Result};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;

fn determine_shader_path() -> PathBuf {
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
    run_with_config(core::kiosk_config::KioskConfig::default())
}

pub fn run_with_config(kiosk_config: core::kiosk_config::KioskConfig) {
    // Initialize logging
    init_logging();

    // Initialize application directories and default configs
    if let Err(e) = tauri::async_runtime::block_on(utils::initialize_app_directories()) {
        eprintln!("Warning: Failed to initialize directories: {}", e);
        tracing::warn!("Failed to initialize directories: {}", e);
    }
    utils::run_startup_validations();

    // Detect runtime mode (Modern or Legacy)
    let runtime_mode = utils::detect_mode();
    let system_info = utils::get_system_info();

    tracing::info!("================================================");
    tracing::info!("NeoCab v2.0.1 Starting");
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
    run_modern_app(kiosk_config);
}

/// Parse CLI arguments into KioskConfig
pub fn parse_cli_args(args: &[String]) -> core::kiosk_config::KioskConfig {
    core::kiosk_config::parse_cli_args(args)
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
#[allow(dead_code)]
fn run_legacy_app() {
    eprintln!("Legacy mode requested but legacy-ui feature not enabled");
    eprintln!("Rebuild with: cargo build --features legacy-ui");
    std::process::exit(1);
}

/// Run modern Tauri application
fn run_modern_app(kiosk_config: core::kiosk_config::KioskConfig) {
    tauri::Builder::default()
        .setup(|app| {
            let result = tauri::async_runtime::block_on(initialize_app());

            match result {
                Ok((
                    db,
                    game_library,
                    emulator_manager,
                    coin_manager_arc,
                    timer_manager_arc,
                    session_manager_arc,
                    input_manager,
                    operator_panel,
                    autoboot_manager,
                    theme_manager,
                    media_manager,
                    shader_manager,
                    config_manager_arc,
                    network_manager,
                )) => {
                    app.manage(db);
                    app.manage(game_library);
                    app.manage(emulator_manager);
                    app.manage(coin_manager_arc);
                    app.manage(timer_manager_arc);
                    app.manage(session_manager_arc);
                    app.manage(input_manager);
                    app.manage(operator_panel);
                    app.manage(autoboot_manager);
                    app.manage(kiosk_config);
                    app.manage(theme_manager);
                    app.manage(media_manager);
                    app.manage(shader_manager);
                    app.manage(config_manager_arc);
                    app.manage(network_manager);
                    app.manage(commands::SafeQuitState::default());
                    app.manage(core::plugin_engine::PluginState::default());

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
            commands::check_driver_status,
            commands::install_driver,
            // Game library
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
            commands::detect_emulators,
            commands::auto_detect_emulators,
            commands::scrape_game,
            commands::scrape_all,
            commands::cancel_scraping,
            commands::update_play_stats,
            // Emulator
            commands::list_emulators,
            commands::launch_game,
            commands::stop_game,
            commands::get_recommended_emulator,
            commands::check_timer_timeout,
            // Coin system
            commands::add_coins,
            commands::add_coins_via_key,
            commands::get_coin_balance,
            commands::start_game,
            commands::end_game,
            commands::return_coins,
            commands::get_earnings,
            // Timer
            commands::start_timer,
            commands::pause_timer,
            commands::resume_timer,
            commands::stop_timer,
            commands::get_timer_status,
            commands::add_timer_time,
            commands::is_time_up,
            // Input
            commands::get_input_devices,
            commands::get_input_mappings,
            commands::set_deadzone,
            commands::get_deadzone,
            commands::set_input_enabled,
            commands::is_input_enabled,
            commands::start_recording_input,
            commands::get_recorded_input,
            commands::save_recorded_profile,
            commands::get_connected_devices,
            commands::set_input_context,
            commands::get_input_context,
            commands::add_profile_assignment,
            commands::get_profile_assignments,
            commands::remove_profile_assignment,
            commands::load_input_profile,
            commands::get_active_profile,
            commands::switch_input_set,
            commands::get_input_state,
            commands::create_profile_from_template,
            commands::list_input_templates,
            commands::import_antimicrox_profile,
            commands::set_device_deadzone,
            commands::set_response_curve,
            // Config
            commands::get_config,
            commands::set_config,
            commands::reload_config,
            commands::load_system_config,
            commands::save_system_config,
            commands::get_all_system_configs,
            // Theme
            commands::save_theme_config,
            commands::get_theme_config,
            commands::set_theme,
            commands::get_current_theme,
            commands::get_theme_css,
            commands::list_available_themes,
            commands::set_system_theme,
            commands::remove_system_theme,
            commands::list_system_themes,
            commands::load_theme,
            commands::save_custom_theme,
            commands::export_theme,
            commands::import_theme,
            commands::apply_theme,
            commands::list_themes,
            commands::set_game_theme,
            commands::get_game_theme,
            commands::remove_game_theme,
            commands::get_all_game_themes,
            commands::resolve_game_theme,
            // Session (coins + time unified)
            commands::session_insert_coin,
            commands::session_start,
            commands::session_check,
            commands::session_pause,
            commands::session_resume,
            commands::session_end,
            commands::session_add_time,
            commands::session_get_status,
            commands::session_get_config,
            commands::session_set_config,
            commands::session_set_system_mode,
            commands::session_update_system_config,
            // Operator
            commands::authenticate_operator,
            commands::logout_operator,
            commands::is_operator_authenticated,
            commands::change_operator_pin,
            commands::get_operator_stats,
            commands::get_session_stats,
            commands::get_system_health,
            // Autoboot / kiosk
            commands::enable_autoboot,
            commands::disable_autoboot,
            commands::is_autoboot_enabled,
            commands::enable_kiosk_mode,
            commands::disable_kiosk_mode,
            commands::is_kiosk_mode_enabled,
            // Audit
            commands::audit_roms,
            commands::audit_media,
            commands::audit_full,
            // Hardware
            commands::list_gpio_pins,
            commands::list_serial_ports,
            commands::test_gpio_pin,
            commands::test_arduino_connection,
            commands::calibrate_coin_detection,
            commands::get_hardware_status,
            commands::start_hardware_monitoring,
            commands::stop_hardware_monitoring,
            // Media
            commands::scan_media,
            commands::get_media_stats,
            commands::get_system_media,
            commands::organize_media,
            commands::get_media,
            commands::import_media,
            commands::trigger_media_rescan,
            commands::get_all_game_media,
            commands::get_batch_media,
            commands::find_cover_art,
            // Shaders
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
            // Network
            commands::get_network_info,
            commands::list_discovered_cabinets,
            commands::get_network_role,
            commands::set_network_role,
            commands::start_network_discovery,
            commands::start_network_advertising,
            commands::start_revenue_sync,
            commands::sync_revenue_now,
            commands::set_master_ip,
            commands::get_master_ip,
            // Logs
            commands::read_log_file,
            commands::list_log_files,
            commands::clear_logs,
            commands::get_log_tail,
            // Kiosk
            commands::get_kiosk_config,
            commands::get_available_systems,
            // Tags
            commands::list_tags,
            commands::create_tag,
            commands::delete_tag,
            commands::add_game_tag,
            commands::remove_game_tag,
            commands::get_game_tags,
            // Jukebox
            commands::jukebox_list_tracks,
            // SafeQuit
            commands::safe_quit_check,
            commands::safe_quit_get_rules,
            // Display
            commands::get_display_config,
            commands::set_display_rotation,
            // RetroAchievements
            commands::ra_login,
            commands::ra_get_game_achievements,
            commands::ra_get_user_summary,
            commands::ra_inject_retroarch,
            // Config injection
            commands::list_config_injectors,
            commands::detect_config_injector,
            commands::read_emulator_config,
            commands::inject_emulator_config,
            // Pause menu
            commands::toggle_pause_menu,
            // Updater
            commands::check_for_updates,
            commands::download_update,
            commands::apply_update,
            // v2 commands (typed CommandResponse<T> wrapper)
            commands_v2::session_insert_coin_v2,
            commands_v2::session_get_status_v2,
            commands_v2::session_start_v2,
            commands_v2::input_get_devices_v2,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_logging() {
    use tracing_subscriber;

    let logs_dir = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("data")
        .join("logs");
    let _ = std::fs::create_dir_all(&logs_dir);

    // Rolling file appender with max retention (30 days)
    let file_appender = tracing_appender::rolling::daily(&logs_dir, "neocab.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("neocab=debug".parse().unwrap()),
        )
        .with_writer(non_blocking)
        .try_init();

    std::mem::forget(_guard);

    // Cleanup old logs (keep last 30 days)
    cleanup_old_logs(&logs_dir, 30);
}

fn cleanup_old_logs(logs_dir: &std::path::Path, max_days: u64) {
    let Ok(entries) = std::fs::read_dir(logs_dir) else {
        return;
    };
    let now = std::time::SystemTime::now();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("log") {
            continue;
        }
        if let Ok(metadata) = std::fs::metadata(&path) {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = now.duration_since(modified) {
                    if duration.as_secs() > max_days * 86400 {
                        // Compress old logs
                        let gz_path = path.with_extension("log.gz");
                        if !gz_path.exists() {
                            if let Ok(content) = std::fs::read_to_string(&path) {
                                use std::io::Write;
                                let mut encoder = flate2::write::GzEncoder::new(
                                    Vec::new(),
                                    flate2::Compression::default(),
                                );
                                if encoder.write_all(content.as_bytes()).is_ok() {
                                    if let Ok(compressed) = encoder.finish() {
                                        let _ = std::fs::write(&gz_path, compressed);
                                    }
                                }
                            }
                        }
                        // Remove logs older than 2*max_days
                        if duration.as_secs() > max_days * 86400 * 2 {
                            let _ = std::fs::remove_file(&path);
                            let _ = std::fs::remove_file(&gz_path);
                        }
                    }
                }
            }
        }
    }
}

/// Returns the base directory for all app data (next to the exe, portable).
fn get_base_dir() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

async fn initialize_app() -> Result<(
    std::sync::Arc<db::Database>,
    core::GameLibrary,
    core::EmulatorManager,
    std::sync::Arc<core::CoinManager>,
    std::sync::Arc<core::TimerManager>,
    std::sync::Arc<core::SessionManager>,
    input::InputManager,
    core::OperatorPanel,
    core::AutobootManager,
    core::ThemeManager,
    core::MediaManager,
    core::ShaderManager,
    std::sync::Arc<core::ConfigManager>,
    core::NetworkManager,
)> {
    let base = get_base_dir();
    let data_dir = base.join("data");
    let _config_dir = base.join("config");

    tracing::info!("Base directory: {}", base.display());

    let db = std::sync::Arc::new(
        db::Database::new(
            data_dir
                .join("neocab.db")
                .to_str()
                .unwrap_or("./data/neocab.db"),
        )
        .await?,
    );
    db.init_default_systems().await?;

    let game_library = core::GameLibrary::new(db.clone());

    let mut emulator_manager = core::EmulatorManager::new(db.clone());
    emulator_manager.initialize_default_emulators().await?;

    let coin_manager = core::CoinManager::new(db.clone());
    let coin_manager_arc = Arc::new(coin_manager);
    let timer_manager = core::TimerManager::new();
    let timer_manager_arc = Arc::new(timer_manager);
    let config_manager = core::ConfigManager::new(data_dir.join("config.yml"), db.clone()).await?;
    let config_manager_arc = Arc::new(config_manager);
    let session_manager = core::SessionManager::new(
        coin_manager_arc.clone(),
        timer_manager_arc.clone(),
        config_manager_arc.clone(),
    );
    let session_manager_arc = Arc::new(session_manager);
    let input_manager = input::InputManager::new();

    let operator_pin = config_manager_arc
        .get_string("operator_pin")
        .await
        .unwrap_or_else(|_| "0000".to_string());
    let operator_panel = core::OperatorPanel::new(operator_pin);

    let autoboot_manager = core::AutobootManager::default();
    let theme_manager = core::ThemeManager::new(data_dir.join("themes"));
    theme_manager
        .install_bundled_themes()
        .map_err(|e| {
            tracing::warn!("Failed to install bundled themes: {}", e);
            e
        })
        .ok();
    let media_manager = core::MediaManager::new(data_dir.clone(), 256 * 1024 * 1024);

    // Start media folder watching for automatic rescans
    if let Err(e) = media_manager.start_auto_watch().await {
        tracing::warn!("Failed to start media folder watching: {}", e);
    } else {
        tracing::info!("Media folder watching started - rescans will trigger on media changes");
    }

    // Determine shader path: bundled first, then fallback to development paths
    let shader_path = determine_shader_path();
    let shader_manager =
        core::ShaderManager::with_custom_path(shader_path.clone(), shader_path.clone());

    // Phase 7: Network Manager
    let cabinet_id = uuid::Uuid::new_v4().to_string(); // In a real app, this should be persistent
    let network_manager =
        core::NetworkManager::new(cabinet_id, "NeoCab-Gabinete".to_string(), 8080, db.clone())?;

    // Auto-start discovery, advertising and API server
    let _ = network_manager.start_server();
    let _ = network_manager.start_advertising();
    let _ = network_manager.start_discovery();

    Ok((
        db,
        game_library,
        emulator_manager,
        coin_manager_arc,
        timer_manager_arc,
        session_manager_arc,
        input_manager,
        operator_panel,
        autoboot_manager,
        theme_manager,
        media_manager,
        shader_manager,
        config_manager_arc,
        network_manager,
    ))
}
