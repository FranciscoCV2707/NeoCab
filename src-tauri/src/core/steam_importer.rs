use crate::error::Result;
use std::fs;
use std::path::{Path, PathBuf};
use tracing::{info, warn};

pub struct SteamImporter;

#[derive(Debug, Clone)]
pub struct SteamGame {
    pub app_id: String,
    pub name: String,
    pub install_dir: String,
}

impl SteamImporter {
    pub fn get_default_steam_path() -> Option<PathBuf> {
        #[cfg(target_os = "windows")]
        {
            let p32 = PathBuf::from("C:\\Program Files (x86)\\Steam");
            if p32.exists() {
                return Some(p32);
            }
            let p64 = PathBuf::from("C:\\Program Files\\Steam");
            if p64.exists() {
                return Some(p64);
            }
        }

        #[cfg(target_os = "linux")]
        {
            if let Ok(home) = std::env::var("HOME") {
                let p = PathBuf::from(home).join(".local/share/Steam");
                if p.exists() {
                    return Some(p);
                }
            }
        }
        None
    }

    pub fn scan_steam_games() -> Result<Vec<SteamGame>> {
        let mut games = Vec::new();

        let steam_dir = match Self::get_default_steam_path() {
            Some(p) => p,
            None => {
                warn!("Steam installation not found");
                return Ok(games);
            }
        };

        // Standard apps dir
        let apps_dir = steam_dir.join("steamapps");
        Self::scan_acf_files(&apps_dir, &mut games);

        // Advanced: read libraryfolders.vdf for extra drives
        let lib_vdf = apps_dir.join("libraryfolders.vdf");
        if lib_vdf.exists() {
            if let Ok(content) = fs::read_to_string(lib_vdf) {
                // Extremely naive parsing of VDF for paths
                for line in content.lines() {
                    if line.contains("\"path\"") {
                        let parts: Vec<&str> = line.split('"').collect();
                        if parts.len() >= 5 {
                            let extra_path = parts[3].replace("\\\\", "\\");
                            let extra_apps = Path::new(&extra_path).join("steamapps");
                            if extra_apps.exists() && extra_apps != apps_dir {
                                Self::scan_acf_files(&extra_apps, &mut games);
                            }
                        }
                    }
                }
            }
        }

        info!("Found {} Steam games", games.len());
        Ok(games)
    }

    fn scan_acf_files(apps_dir: &Path, games: &mut Vec<SteamGame>) {
        if !apps_dir.exists() {
            return;
        }

        if let Ok(entries) = fs::read_dir(apps_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("acf") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Some(game) = Self::parse_acf(&content) {
                            games.push(game);
                        }
                    }
                }
            }
        }
    }

    fn parse_acf(content: &str) -> Option<SteamGame> {
        let mut app_id = String::new();
        let mut name = String::new();
        let mut install_dir = String::new();

        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("\"appid\"") {
                if let Some(val) = Self::extract_vdf_value(line) {
                    app_id = val;
                }
            } else if line.starts_with("\"name\"") {
                if let Some(val) = Self::extract_vdf_value(line) {
                    name = val;
                }
            } else if line.starts_with("\"installdir\"") {
                if let Some(val) = Self::extract_vdf_value(line) {
                    install_dir = val;
                }
            }
        }

        if !app_id.is_empty() && !name.is_empty() && !name.contains("Steamworks") {
            Some(SteamGame {
                app_id,
                name,
                install_dir,
            })
        } else {
            None
        }
    }

    fn extract_vdf_value(line: &str) -> Option<String> {
        let parts: Vec<&str> = line.split('"').collect();
        if parts.len() >= 5 {
            Some(parts[3].to_string())
        } else {
            None
        }
    }
}
