use std::collections::HashMap;
use std::env;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EmulatorInfo {
    pub name: String,
    pub id: String,
    pub installed: bool,
    pub path: Option<PathBuf>,
    pub version: Option<String>,
}

pub struct EmulatorDetector;

impl EmulatorDetector {
    /// Detect available emulators on the system
    pub fn detect_all() -> HashMap<String, EmulatorInfo> {
        let mut emulators = HashMap::new();

        // Common emulator detection
        let emulator_specs = vec![
            ("mame", "MAME", &["mame.exe", "mame64.exe", "mame", "mame64"][..]),
            ("retroarch", "RetroArch", &["retroarch.exe", "retroarch"][..]),
            ("pcsx2", "PCSX2", &["pcsx2.exe", "pcsx2"][..]),
            ("dolphin", "Dolphin", &["Dolphin.exe", "dolphin-emu"][..]),
            ("cemu", "Cemu", &["Cemu.exe"][..]),
            ("rpcs3", "RPCS3", &["rpcs3.exe"][..]),
        ];

        for (id, name, binaries) in emulator_specs {
            if let Some(path) = Self::find_emulator(binaries) {
                emulators.insert(
                    id.to_string(),
                    EmulatorInfo {
                        name: name.to_string(),
                        id: id.to_string(),
                        installed: true,
                        path: Some(path),
                        version: None,
                    },
                );
            } else {
                emulators.insert(
                    id.to_string(),
                    EmulatorInfo {
                        name: name.to_string(),
                        id: id.to_string(),
                        installed: false,
                        path: None,
                        version: None,
                    },
                );
            }
        }

        emulators
    }

    /// Find emulator in common paths
    fn find_emulator(binaries: &[&str]) -> Option<PathBuf> {
        // Build list of search paths
        let mut search_paths = Vec::new();

        // Installation directory
        if let Some(path) = Self::installation_dir() {
            search_paths.push(path);
        }

        // Windows Program Files
        search_paths.push(PathBuf::from("C:\\Program Files"));
        search_paths.push(PathBuf::from("C:\\Program Files (x86)"));

        // PATH environment variable
        if let Some(paths) = Self::path_env_dirs() {
            search_paths.extend(paths);
        }

        // User home
        if let Some(home) = Self::home_dir() {
            search_paths.push(home.join(".local").join("bin"));
        }

        // Common Linux paths
        search_paths.push(PathBuf::from("/usr/bin"));
        search_paths.push(PathBuf::from("/usr/local/bin"));
        search_paths.push(PathBuf::from("/opt"));

        for search_path in search_paths {
            for binary in binaries {
                let full_path = search_path.join(binary);
                if full_path.exists() {
                    return Some(full_path);
                }

                // Also check in subdirectories (e.g., Program Files/RetroArch)
                if search_path.is_dir() {
                    if let Ok(entries) = std::fs::read_dir(&search_path) {
                        for entry in entries.flatten() {
                            let subdir = entry.path().join(binary);
                            if subdir.exists() {
                                return Some(subdir);
                            }
                        }
                    }
                }
            }
        }

        None
    }

    /// Get installation directory (where the app was installed)
    fn installation_dir() -> Option<PathBuf> {
        // Try to get the executable's directory
        if let Ok(exe_path) = env::current_exe() {
            if let Some(dir) = exe_path.parent() {
                return Some(dir.to_path_buf());
            }
        }
        None
    }

    /// Get directories from PATH environment variable
    fn path_env_dirs() -> Option<Vec<PathBuf>> {
        env::var_os("PATH").map(|paths| {
            env::split_paths(&paths).collect()
        })
    }

    /// Get user home directory
    fn home_dir() -> Option<PathBuf> {
        dirs::home_dir()
    }

    /// Get download URLs for missing emulators (for user convenience)
    pub fn get_download_url(emulator_id: &str) -> Option<&'static str> {
        match emulator_id {
            "mame" => Some("https://www.mamedev.org/"),
            "retroarch" => Some("https://www.retroarch.com/"),
            "pcsx2" => Some("https://pcsx2.net/"),
            "dolphin" => Some("https://dolphin-emu.org/"),
            "cemu" => Some("https://cemu.info/"),
            "rpcs3" => Some("https://rpcs3.net/"),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_all_returns_hashmap() {
        let emulators = EmulatorDetector::detect_all();
        assert!(!emulators.is_empty());
        assert!(emulators.contains_key("mame"));
        assert!(emulators.contains_key("retroarch"));
    }

    #[test]
    fn test_download_urls_exist() {
        assert!(EmulatorDetector::get_download_url("mame").is_some());
        assert!(EmulatorDetector::get_download_url("retroarch").is_some());
        assert!(EmulatorDetector::get_download_url("invalid").is_none());
    }
}
