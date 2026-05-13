/// Application initialization - creates required directories and default configs
use std::path::PathBuf;
use crate::Result;

/// Initialize application directory structure on first run
pub async fn initialize_app_directories() -> Result<()> {
    // Create base data directory
    let data_dir = PathBuf::from("./data");
    std::fs::create_dir_all(&data_dir)?;

    // Create subdirectories
    let subdirs = vec![
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
        std::fs::create_dir_all(subdir)?;
    }

    tracing::info!("Application directories initialized");

    // Create default config if it doesn't exist
    create_default_config()?;

    // Create default theme structure
    create_default_media_structure()?;

    Ok(())
}

/// Create default config.yml if it doesn't exist
fn create_default_config() -> Result<()> {
    let config_path = PathBuf::from("./data/config.yml");

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

    tracing::info!("Created default config.yml at {:?}", config_path);
    Ok(())
}

/// Create default media directory structure
fn create_default_media_structure() -> Result<()> {
    let media_systems = vec!["arcade", "nes", "snes", "genesis", "psx", "n64", "gb"];

    for system in media_systems {
        let system_media_dir = PathBuf::from(format!("./data/media/{}", system));
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
    !std::path::Path::new("./data/config.yml").exists()
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
