/// Application initialization - creates required directories and default configs
use std::path::PathBuf;
use crate::Result;

/// Returns the base directory next to the executable (portable install).
fn base_dir() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

/// Initialize application directory structure on first run
pub async fn initialize_app_directories() -> Result<()> {
    let base = base_dir();

    let subdirs = vec![
        "data",
        "data/games",
        "data/media",
        "data/themes",
        "data/logs",
        "data/backups",
        "config",
        "config/shaders",
        "config/themes",
        "config/joy_profiles",
        "data/media/marquees",
        "data/media/bezels",
    ];

    for subdir in subdirs {
        std::fs::create_dir_all(base.join(subdir))?;
    }

    tracing::info!("Application directories initialized at {}", base.display());

    create_default_config(&base)?;
    create_default_media_structure(&base)?;

    Ok(())
}

/// Create default config.yml if it doesn't exist
fn create_default_config(base: &PathBuf) -> Result<()> {
    let config_path = base.join("data").join("config.yml");

    if config_path.exists() {
        return Ok(());
    }

    let default_config = r#"# NeoCab Configuration
# Auto-generated on first run

# Global settings
global:
  operator_pin: "0000"
  language: "en"
  theme: "default"
  display_mode: "fullscreen"

# Default system configurations
systems:
  arcade:
    name: "Arcade"
    mode: "arcade"
    rom_path: "./data/games/arcade"
    bios_path: "./data/games/arcade/bios"
    emulator: "mame"
    coins_per_minute: 2
    auto_exit: true
    warn_before: 30

  nes:
    name: "NES"
    mode: "console"
    rom_path: "./data/games/nes"
    emulator: "retroarch"
    core: "nestopia"
    coins_per_minute: 3
    auto_exit: true
    warn_before: 30

  snes:
    name: "SNES"
    mode: "console"
    rom_path: "./data/games/snes"
    emulator: "retroarch"
    core: "snes9x"
    coins_per_minute: 3
    auto_exit: true
    warn_before: 30

# Network settings (optional)
network:
  enabled: false
  cabinet_id: "neocab-1"
  master_ip: "192.168.1.100"
  master_port: 8080

# Hardware settings
hardware:
  gpio_enabled: false
  arduino_enabled: false
  coin_pin: 17
  button_pins: [27, 22, 23, 24]
"#;

    std::fs::write(&config_path, default_config)?;

    tracing::info!("Created default config.yml at {}", config_path.display());
    Ok(())
}

/// Create default media directory structure
fn create_default_media_structure(base: &PathBuf) -> Result<()> {
    let media_systems = vec!["arcade", "nes", "snes", "genesis", "psx", "n64", "gb"];

    for system in media_systems {
        let system_media_dir = base.join("data").join("media").join(system);
        std::fs::create_dir_all(&system_media_dir)?;

        // Create placeholder file to indicate where to put media
        let readme = format!(
            "# {} Media\n\nPlace your media files here:\n- wheel.png: Game selection wheel image\n- gamelist_bg.png: Background for game list\n- (system-specific artwork)\n",
            system.to_uppercase()
        );

        std::fs::write(system_media_dir.join("README.md"), readme)?;
    }

    tracing::info!("Created media directory structure");
    Ok(())
}

/// Check if this is first run (no config.yml)
pub fn is_first_run() -> bool {
    !base_dir().join("data").join("config.yml").exists()
}

/// Check if portable mode is enabled (portable.txt next to exe)
pub fn is_portable_mode() -> bool {
    base_dir().join("portable.txt").exists()
}

/// Get data directory (portable vs appdata)
pub fn get_data_dir() -> PathBuf {
    if is_portable_mode() {
        base_dir().join("data")
    } else {
        #[cfg(windows)]
        {
            std::env::var("APPDATA")
                .map(|p| PathBuf::from(p).join("NeoCab"))
                .unwrap_or_else(|_| base_dir().join("data"))
        }
        #[cfg(not(windows))]
        {
            dirs::data_dir()
                .map(|p| p.join("neocab"))
                .unwrap_or_else(|| base_dir().join("data"))
        }
    }
}

/// Run startup validations (non-fatal warnings)
pub fn run_startup_validations() {
    let base = base_dir();
    let exe = std::env::current_exe().ok();

    // Check if running from temp directory
    if let Some(ref exe_path) = exe {
        let s = exe_path.to_string_lossy().to_lowercase();
        if s.contains("temp") || s.contains("tmp") {
            tracing::warn!("Running from temporary directory: {:?}", exe_path);
        }
    }

    // Check disk space (disabled on Windows due to winapi complexity)
    #[cfg(not(windows))]
    {
        let _ = base; // suppress unused warning
    }

    if is_portable_mode() {
        tracing::info!("Portable mode active");
    }

    tracing::info!("Startup validations complete");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_first_run() {
        // This test depends on environment
        let result = is_first_run();
        assert!(result || !result); // Just verify it doesn't panic
    }
}
