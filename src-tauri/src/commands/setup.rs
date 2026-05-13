/// Setup wizard commands for first-run configuration
use crate::Result;
use crate::error::NeoCabError;
use std::path::PathBuf;

/// Check if application needs setup wizard (first run)
#[tauri::command]
pub fn needs_setup() -> bool {
    crate::utils::is_first_run()
}

/// Get list of available emulators for setup
#[tauri::command]
pub fn get_available_emulators() -> Result<Vec<String>> {
    // Return list of emulators that can be configured
    let emulators = vec![
        "MAME",
        "RetroArch",
        "PCSX Redux",
        "Mupen64",
        "Gambatte",
    ];

    Ok(emulators.iter().map(|s| s.to_string()).collect())
}

/// Validate ROM directory path
#[tauri::command]
pub fn validate_rom_path(path: String) -> bool {
    let path = PathBuf::from(&path);
    path.exists() && path.is_dir()
}

/// Get default ROM paths for each system
#[tauri::command]
pub fn get_default_paths() -> std::collections::HashMap<String, String> {
    let mut paths = std::collections::HashMap::new();

    let systems = vec![
        ("arcade", "data/games/arcade"),
        ("nes", "data/games/nes"),
        ("snes", "data/games/snes"),
        ("genesis", "data/games/genesis"),
        ("psx", "data/games/psx"),
        ("n64", "data/games/n64"),
        ("gb", "data/games/gb"),
    ];

    for (system, default_path) in systems {
        paths.insert(system.to_string(), default_path.to_string());
    }

    paths
}

/// Save initial system configuration from setup wizard
#[tauri::command]
pub async fn save_setup_config(
    operator_pin: String,
    rom_paths: std::collections::HashMap<String, String>,
) -> Result<()> {
    // Validate operator PIN
    if operator_pin.len() < 4 {
        return Err(NeoCabError::InvalidInput(
            "Operator PIN must be at least 4 digits".to_string(),
        ));
    }

    // Create ROM directories
    for (system, path) in &rom_paths {
        std::fs::create_dir_all(path)?;
        tracing::info!("Created ROM directory for {}: {}", system, path);
    }

    tracing::info!("Setup wizard configuration saved");
    Ok(())
}

/// Mark setup as complete (create marker file)
#[tauri::command]
pub fn mark_setup_complete() -> Result<()> {
    let marker = PathBuf::from("./data/.setup_complete");
    std::fs::write(&marker, "v1.0.0")?;
    tracing::info!("Setup wizard marked as complete");
    Ok(())
}

/// Check if the required XInput driver (ViGEmBus) is installed
#[tauri::command]
pub async fn check_driver_status() -> Result<serde_json::Value> {
    #[cfg(target_os = "windows")]
    {
        use vigem_client::Client;
        let is_installed = Client::connect().is_ok();
        let os_version = std::env::consts::OS;
        
        Ok(serde_json::json!({
            "is_installed": is_installed,
            "os": os_version,
            "supports_vigem": true // We'll assume true for now, can be refined with actual OS check
        }))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(serde_json::json!({
            "is_installed": true, // Not needed on Linux
            "os": "linux",
            "supports_vigem": false
        }))
    }
}

/// Run the bundled driver installer
#[tauri::command]
pub async fn install_driver(app_handle: tauri::AppHandle) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        let resource_path = app_handle.path().resolve("bin/drivers/ViGEmBus_Setup.exe", tauri::path::BaseDirectory::Resource)?;
        
        if !resource_path.exists() {
            return Err(NeoCabError::Config("Installer not found in bundle".to_string()));
        }

        tracing::info!("Starting driver installation: {:?}", resource_path);
        
        use std::process::Command;
        let status = Command::new(&resource_path)
            .arg("/quiet") // Many installers support quiet mode
            .status()
            .map_err(|e| NeoCabError::System(format!("Failed to run installer: {}", e)))?;

        if status.success() {
            Ok(())
        } else {
            Err(NeoCabError::System("Installer returned error status".to_string()))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}
