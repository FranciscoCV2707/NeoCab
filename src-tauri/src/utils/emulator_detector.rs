use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EmulatorInfo {
    pub name: String,
    pub id: String,
    pub installed: bool,
    pub path: Option<PathBuf>,
    pub version: Option<String>,
    pub cores: Vec<String>,
    pub download_url: Option<&'static str>,
}

#[derive(Debug, Clone)]
pub struct EmulatorSpec {
    pub id: &'static str,
    pub name: &'static str,
    pub binaries: &'static [&'static str],
    pub version_flag: &'static str,
    pub version_regex: Option<&'static str>,
    pub registry_paths: &'static [&'static str],
    pub download_url: Option<&'static str>,
    pub search_subdirs: &'static [&'static str],
}

pub struct EmulatorDetector;

impl EmulatorDetector {
    const EMULATORS: &'static [EmulatorSpec] = &[
        EmulatorSpec {
            id: "mame",
            name: "MAME",
            binaries: &["mame.exe", "mame64.exe", "mame", "mame64"],
            version_flag: "-version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://www.mamedev.org/"),
            search_subdirs: &["mame", "MAME"],
        },
        EmulatorSpec {
            id: "retroarch",
            name: "RetroArch",
            binaries: &["retroarch.exe", "retroarch"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://www.retroarch.com/"),
            search_subdirs: &["RetroArch", "retroarch"],
        },
        EmulatorSpec {
            id: "dolphin",
            name: "Dolphin",
            binaries: &["Dolphin.exe", "Dolphin", "dolphin-emu"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://dolphin-emu.org/"),
            search_subdirs: &["Dolphin", "dolphin-emu"],
        },
        EmulatorSpec {
            id: "pcsx2",
            name: "PCSX2",
            binaries: &["pcsx2.exe", "pcsx2", "pcsx2-qt"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://pcsx2.net/"),
            search_subdirs: &["PCSX2", "pcsx2"],
        },
        EmulatorSpec {
            id: "duckstation",
            name: "DuckStation",
            binaries: &["duckstation.exe", "duckstation-qt", "duckstation"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://duckstation.org/"),
            search_subdirs: &["DuckStation", "duckstation"],
        },
        EmulatorSpec {
            id: "xenia",
            name: "Xenia",
            binaries: &["xenia.exe", "xenia_canary.exe", "xenia"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://xenia.jp/"),
            search_subdirs: &["Xenia", "xenia"],
        },
        EmulatorSpec {
            id: "rpcs3",
            name: "RPCS3",
            binaries: &["rpcs3.exe", "rpcs3"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://rpcs3.net/"),
            search_subdirs: &["RPCS3", "rpcs3"],
        },
        EmulatorSpec {
            id: "cemu",
            name: "Cemu",
            binaries: &["Cemu.exe", "cemu"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://cemu.info/"),
            search_subdirs: &["Cemu", "cemu"],
        },
        EmulatorSpec {
            id: "ppsspp",
            name: "PPSSPP",
            binaries: &["PPSSPPWindows64.exe", "PPSSPP.exe", "ppsspp"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://www.ppsspp.org/"),
            search_subdirs: &["PPSSPP", "ppsspp"],
        },
        EmulatorSpec {
            id: "flycast",
            name: "Flycast",
            binaries: &["flycast.exe", "flycast"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://flycast.do/"),
            search_subdirs: &["Flycast", "flycast"],
        },
        EmulatorSpec {
            id: "melonds",
            name: "melonDS",
            binaries: &["melonDS.exe", "melonds"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://melonds.kuribo64.net/"),
            search_subdirs: &["melonDS", "melonds"],
        },
        EmulatorSpec {
            id: "citra",
            name: "Citra",
            binaries: &["citra-qt.exe", "citra.exe", "citra"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://citra-emu.org/"),
            search_subdirs: &["Citra", "citra"],
        },
        EmulatorSpec {
            id: "yuzu",
            name: "Yuzu",
            binaries: &["yuzu.exe", "yuzu"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: None,
            search_subdirs: &["Yuzu", "yuzu"],
        },
        EmulatorSpec {
            id: "ryujinx",
            name: "Ryujinx",
            binaries: &["Ryujinx.exe", "ryujinx"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://ryujinx.org/"),
            search_subdirs: &["Ryujinx", "ryujinx"],
        },
        EmulatorSpec {
            id: "scummvm",
            name: "ScummVM",
            binaries: &["scummvm.exe", "scummvm"],
            version_flag: "--version",
            version_regex: None,
            registry_paths: &[],
            download_url: Some("https://www.scummvm.org/"),
            search_subdirs: &["ScummVM", "scummvm"],
        },
    ];

    pub fn detect_all() -> Vec<EmulatorInfo> {
        let mut results = Vec::new();
        for spec in Self::EMULATORS {
            results.push(Self::detect_one(spec));
        }
        results
    }

    pub fn detect_one(spec: &EmulatorSpec) -> EmulatorInfo {
        let (path, version, cores) = if let Some(p) = Self::find_emulator(spec) {
            let ver = Self::detect_version(&p, spec);
            let cores = Self::detect_cores(spec, &p);
            (Some(p), ver, cores)
        } else {
            (None, None, Vec::new())
        };

        EmulatorInfo {
            name: spec.name.to_string(),
            id: spec.id.to_string(),
            installed: path.is_some(),
            path,
            version,
            cores,
            download_url: spec.download_url,
        }
    }

    fn find_emulator(spec: &EmulatorSpec) -> Option<PathBuf> {
        // 1. Check PATH
        for binary in spec.binaries {
            if let Ok(path) = which(binary) {
                return Some(path);
            }
        }

        // 2. Windows Registry (if on Windows)
        #[cfg(windows)]
        for reg_path in spec.registry_paths {
            if let Some(path) = Self::find_in_registry(reg_path) {
                return Some(path);
            }
        }

        // 3. Common installation directories
        let search_roots = Self::get_search_roots();
        for root in &search_roots {
            // Direct binary in root
            for binary in spec.binaries {
                let p = root.join(binary);
                if p.exists() {
                    return Some(p);
                }
            }
            // In subdirectories
            for subdir in spec.search_subdirs {
                let dir = root.join(subdir);
                if dir.is_dir() {
                    for binary in spec.binaries {
                        let p = dir.join(binary);
                        if p.exists() {
                            return Some(p);
                        }
                    }
                    // Recursive one level deeper
                    if let Ok(entries) = std::fs::read_dir(&dir) {
                        for entry in entries.filter_map(|e| e.ok()) {
                            let sub = entry.path();
                            if sub.is_dir() {
                                for binary in spec.binaries {
                                    let p = sub.join(binary);
                                    if p.exists() {
                                        return Some(p);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. Flatpak (Linux)
        #[cfg(target_os = "linux")]
        for binary in spec.binaries {
            let flatpak_path = PathBuf::from(format!("/var/lib/flatpak/exports/bin/{}", binary));
            if flatpak_path.exists() {
                return Some(flatpak_path);
            }
        }

        // 5. Snap (Linux)
        #[cfg(target_os = "linux")]
        for binary in spec.binaries {
            let snap_path = PathBuf::from(format!("/snap/bin/{}", binary));
            if snap_path.exists() {
                return Some(snap_path);
            }
        }

        None
    }

    fn get_search_roots() -> Vec<PathBuf> {
        let mut roots = Vec::new();

        // App installation directory
        if let Some(dir) = Self::installation_dir() {
            roots.push(dir);
        }

        // Windows common paths
        #[cfg(windows)]
        {
            roots.push(PathBuf::from("C:\\Program Files"));
            roots.push(PathBuf::from("C:\\Program Files (x86)"));
            if let Ok(local) = env::var("LOCALAPPDATA") {
                roots.push(PathBuf::from(local));
            }
        }

        // Linux paths
        #[cfg(target_os = "linux")]
        {
            roots.push(PathBuf::from("/usr/bin"));
            roots.push(PathBuf::from("/usr/local/bin"));
            roots.push(PathBuf::from("/opt"));
            if let Ok(home) = env::var("HOME") {
                roots.push(PathBuf::from(&home).join(".local/bin"));
            }
        }

        roots
    }

    fn detect_version(path: &Path, spec: &EmulatorSpec) -> Option<String> {
        let output = Command::new(path).arg(spec.version_flag).output().ok()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let combined = format!("{} {}", stdout, stderr);
        let combined = combined.trim();
        if combined.is_empty() {
            None
        } else {
            Some(combined.to_string())
        }
    }

    fn detect_cores(spec: &EmulatorSpec, path: &Path) -> Vec<String> {
        if spec.id != "retroarch" {
            return vec![];
        }

        // Try to find RetroArch cores directory
        let cores_dirs = vec![
            path.parent().map(|p| p.join("cores")),
            #[cfg(windows)]
            env::var("APPDATA")
                .ok()
                .map(|a| PathBuf::from(a).join("RetroArch").join("cores")),
            #[cfg(not(windows))]
            env::var("HOME")
                .ok()
                .map(|h| PathBuf::from(h).join(".config/retroarch/cores")),
        ];

        let mut cores = Vec::new();
        for dir in cores_dirs.into_iter().flatten() {
            if dir.is_dir() {
                if let Ok(entries) = std::fs::read_dir(&dir) {
                    for entry in entries.flatten() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        if name.ends_with("_libretro.dll") || name.ends_with("_libretro.so") {
                            let core_name = name
                                .replace("_libretro.dll", "")
                                .replace("_libretro.so", "");
                            cores.push(core_name);
                        }
                    }
                }
            }
        }
        cores.sort();
        cores
    }

    fn installation_dir() -> Option<PathBuf> {
        env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
    }

    #[cfg(windows)]
    fn find_in_registry(_reg_path: &str) -> Option<PathBuf> {
        // Simplified: would need winreg crate for full registry scanning
        None
    }
}

fn which(binary: &str) -> Result<PathBuf, ()> {
    if let Ok(paths) = env::var("PATH") {
        for dir in env::split_paths(&paths) {
            let p = dir.join(binary);
            if p.exists() {
                return Ok(p);
            }
        }
    }
    Err(())
}
