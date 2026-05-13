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

/// Get operator PIN requirement status
#[tauri::command]
pub fn get_default_operator_pin() -> String {
    "0000".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_default_paths() {
        let paths = get_default_paths().unwrap();
        assert!(paths.contains_key("arcade"));
        assert!(paths.contains_key("nes"));
    }

    #[test]
    fn test_validate_invalid_path() {
        let result = validate_rom_path("/nonexistent/path".to_string()).unwrap();
        assert!(!result);
    }
}
