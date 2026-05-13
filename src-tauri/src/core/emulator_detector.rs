use std::path::{Path, PathBuf};
use tracing::{info, debug};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmulatorInfo {
    pub name: String,
    pub command: String,
    pub installed: bool,
    pub path: Option<PathBuf>,
    pub download_url: String,
}

pub struct EmulatorDetector;

impl EmulatorDetector {
    /// Detect all known emulators on the system
    pub fn detect_all() -> Vec<EmulatorInfo> {
        let mut found = Vec::new();

        // MAME
        found.push(Self::detect_mame());

        // RetroArch
        found.push(Self::detect_retroarch());

        // Dolphin (GameCube/Wii)
        found.push(Self::detect_dolphin());

        // PCSX2 (PS2)
        found.push(Self::detect_pcsx2());

        // Citra (Nintendo 3DS)
        found.push(Self::detect_citra());

        // Yuzu (Nintendo Switch)
        found.push(Self::detect_yuzu());

        info!("Detected emulators: {}/6 installed", found.iter().filter(|e| e.installed).count());
        found
    }

    fn detect_mame() -> EmulatorInfo {
        let name = "MAME";
        let command = if cfg!(windows) { "mame.exe" } else { "mame" };
        let path = Self::find_in_path(command);

        let installed = path.is_some();
        debug!("MAME: {} ({})", if installed { "found" } else { "not found" }, command);

        EmulatorInfo {
            name: name.to_string(),
            command: command.to_string(),
            installed,
            path,
            download_url: "https://www.mamedev.org/".to_string(),
        }
    }

    fn detect_retroarch() -> EmulatorInfo {
        let name = "RetroArch";
        let command = if cfg!(windows) { "retroarch.exe" } else { "retroarch" };
        let path = Self::find_in_path(command);

        let installed = path.is_some();
        debug!("RetroArch: {} ({})", if installed { "found" } else { "not found" }, command);

        EmulatorInfo {
            name: name.to_string(),
            command: command.to_string(),
            installed,
            path,
            download_url: "https://www.retroarch.com/".to_string(),
        }
    }

    fn detect_dolphin() -> EmulatorInfo {
        let name = "Dolphin";
        let command = if cfg!(windows) { "Dolphin.exe" } else { "dolphin-emu" };
        let path = Self::find_in_path(command);

        let installed = path.is_some();
        debug!("Dolphin: {} ({})", if installed { "found" } else { "not found" }, command);

        EmulatorInfo {
            name: name.to_string(),
            command: command.to_string(),
            installed,
            path,
            download_url: "https://dolphin-emu.org/".to_string(),
        }
    }

    fn detect_pcsx2() -> EmulatorInfo {
        let name = "PCSX2";
        let command = if cfg!(windows) { "pcsx2.exe" } else { "pcsx2" };
        let path = Self::find_in_path(command);

        let installed = path.is_some();
        debug!("PCSX2: {} ({})", if installed { "found" } else { "not found" }, command);

        EmulatorInfo {
            name: name.to_string(),
            command: command.to_string(),
            installed,
            path,
            download_url: "https://pcsx2.net/".to_string(),
        }
    }

    fn detect_citra() -> EmulatorInfo {
        let name = "Citra";
        let command = if cfg!(windows) { "citra.exe" } else { "citra" };
        let path = Self::find_in_path(command);

        let installed = path.is_some();
        debug!("Citra: {} ({})", if installed { "found" } else { "not found" }, command);

        EmulatorInfo {
            name: name.to_string(),
            command: command.to_string(),
            installed,
            path,
            download_url: "https://citra-emu.org/".to_string(),
        }
    }

    fn detect_yuzu() -> EmulatorInfo {
        let name = "Yuzu";
        let command = if cfg!(windows) { "yuzu.exe" } else { "yuzu" };
        let path = Self::find_in_path(command);

        let installed = path.is_some();
        debug!("Yuzu: {} ({})", if installed { "found" } else { "not found" }, command);

        EmulatorInfo {
            name: name.to_string(),
            command: command.to_string(),
            installed,
            path,
            download_url: "https://yuzu-emu.org/".to_string(),
        }
    }

    /// Search for executable in system PATH
    fn find_in_path(command: &str) -> Option<PathBuf> {
        if let Ok(path_env) = std::env::var("PATH") {
            for path_dir in path_env.split(if cfg!(windows) { ";" } else { ":" }) {
                let full_path = Path::new(path_dir).join(command);
                if full_path.exists() {
                    return Some(full_path);
                }
            }
        }

        // Check common install locations on Windows
        #[cfg(windows)]
        {
            let program_files = std::env::var("ProgramFiles").ok();
            let program_files_x86 = std::env::var("ProgramFiles(x86)").ok();

            let common_paths = vec![
                program_files.map(|p| PathBuf::from(p).join("MAME")),
                program_files_x86.map(|p| PathBuf::from(p).join("RetroArch")),
                program_files.map(|p| PathBuf::from(p).join("Dolphin")),
            ];

            for maybe_path in common_paths.into_iter().flatten() {
                if maybe_path.exists() {
                    return Some(maybe_path);
                }
            }
        }

        None
    }
}
