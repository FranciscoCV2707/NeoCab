use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tracing::{debug, info, warn};

use crate::error::Result;

// ─── Common Types ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryGame {
    pub title: String,
    pub install_path: Option<String>,
    pub executable: Option<String>,
    pub source: LibrarySource,
    /// External game ID from the source platform.
    pub external_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LibrarySource {
    Folder,
    Steam,
    Gog,
    Epic,
    Manual,
}

// ─── Trait ─────────────────────────────────────────────────────────────────────

pub trait LibraryParser: Send + Sync {
    fn name(&self) -> &str;
    fn scan(&self) -> Result<Vec<LibraryGame>>;
}

// ─── Folder Parser ─────────────────────────────────────────────────────────────

pub struct FolderParser {
    pub root: PathBuf,
    pub extensions: Vec<String>,
}

impl FolderParser {
    pub fn new(root: impl Into<PathBuf>, extensions: Vec<String>) -> Self {
        Self { root: root.into(), extensions }
    }
}

impl LibraryParser for FolderParser {
    fn name(&self) -> &str { "Folder" }

    fn scan(&self) -> Result<Vec<LibraryGame>> {
        let mut games = Vec::new();
        scan_dir(&self.root, &self.extensions, &mut games);
        info!("FolderParser: found {} ROMs in {:?}", games.len(), self.root);
        Ok(games)
    }
}

fn scan_dir(dir: &Path, extensions: &[String], out: &mut Vec<LibraryGame>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_dir(&path, extensions, out);
            continue;
        }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if extensions.iter().any(|e| e.trim_start_matches('.').eq_ignore_ascii_case(ext)) {
            let title = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .replace('_', " ")
                .replace('-', " ");
            out.push(LibraryGame {
                title,
                install_path: Some(path.to_string_lossy().into_owned()),
                executable: None,
                source: LibrarySource::Folder,
                external_id: None,
            });
        }
    }
}

// ─── Steam Parser ──────────────────────────────────────────────────────────────

pub struct SteamParser;

impl SteamParser {
    pub fn new() -> Self { Self }

    fn find_steam_root() -> Option<PathBuf> {
        #[cfg(target_os = "windows")]
        {
            // Default Steam install locations on Windows
            let candidates = [
                r"C:\Program Files (x86)\Steam",
                r"C:\Program Files\Steam",
            ];
            for c in &candidates {
                if Path::new(c).exists() {
                    return Some(PathBuf::from(c));
                }
            }
            // Also check registry: HKCU\Software\Valve\Steam\SteamPath
            if let Ok(output) = std::process::Command::new("reg")
                .args(["query", r"HKCU\Software\Valve\Steam", "/v", "SteamPath"])
                .output()
            {
                let text = String::from_utf8_lossy(&output.stdout);
                for line in text.lines() {
                    if line.contains("SteamPath") {
                        if let Some(path) = line.split_whitespace().last() {
                            let p = PathBuf::from(path);
                            if p.exists() { return Some(p); }
                        }
                    }
                }
            }
            None
        }
        #[cfg(target_os = "linux")]
        {
            let home = std::env::var("HOME").ok()?;
            let candidates = [
                format!("{}/.steam/steam", home),
                format!("{}/.local/share/Steam", home),
            ];
            candidates.into_iter().map(PathBuf::from).find(|p| p.exists())
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        { None }
    }

    fn parse_vdf_library_folders(vdf_path: &Path) -> Vec<PathBuf> {
        let Ok(text) = std::fs::read_to_string(vdf_path) else { return vec![] };
        let mut paths = Vec::new();
        for line in text.lines() {
            let trimmed = line.trim();
            // Lines like: "path"  "D:\\SteamLibrary"
            if trimmed.starts_with('"') {
                let parts: Vec<&str> = trimmed.trim_matches('"').splitn(2, '"').collect();
                if parts.len() == 2 {
                    let key = parts[0].trim().trim_matches('"');
                    let val = parts[1].trim().trim_matches('"');
                    if key == "path" {
                        let p = PathBuf::from(val.replace("\\\\", "\\"));
                        if p.exists() { paths.push(p); }
                    }
                }
            }
        }
        paths
    }

    fn parse_acf(acf_path: &Path) -> Option<LibraryGame> {
        let text = std::fs::read_to_string(acf_path).ok()?;
        let mut name = String::new();
        let mut app_id = String::new();
        let mut install_dir = String::new();

        for line in text.lines() {
            let t = line.trim();
            if t.starts_with("\"name\"") {
                name = extract_vdf_value(t);
            } else if t.starts_with("\"appid\"") {
                app_id = extract_vdf_value(t);
            } else if t.starts_with("\"installdir\"") {
                install_dir = extract_vdf_value(t);
            }
        }

        if name.is_empty() { return None; }

        Some(LibraryGame {
            title: name,
            install_path: if install_dir.is_empty() { None } else { Some(install_dir) },
            executable: None,
            source: LibrarySource::Steam,
            external_id: if app_id.is_empty() { None } else { Some(app_id) },
        })
    }
}

impl Default for SteamParser {
    fn default() -> Self { Self::new() }
}

impl LibraryParser for SteamParser {
    fn name(&self) -> &str { "Steam" }

    fn scan(&self) -> Result<Vec<LibraryGame>> {
        let Some(steam_root) = Self::find_steam_root() else {
            debug!("SteamParser: Steam installation not found");
            return Ok(vec![]);
        };

        info!("SteamParser: found Steam at {:?}", steam_root);

        let mut library_roots = vec![steam_root.clone()];

        // Parse libraryfolders.vdf for additional library paths
        let vdf = steam_root.join("steamapps").join("libraryfolders.vdf");
        if vdf.exists() {
            library_roots.extend(Self::parse_vdf_library_folders(&vdf));
        }

        let mut games = Vec::new();
        for root in &library_roots {
            let steamapps = root.join("steamapps");
            let Ok(entries) = std::fs::read_dir(&steamapps) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("acf") {
                    if let Some(game) = Self::parse_acf(&path) {
                        games.push(game);
                    }
                }
            }
        }

        info!("SteamParser: found {} games", games.len());
        Ok(games)
    }
}

// ─── GOG Parser ────────────────────────────────────────────────────────────────

pub struct GogParser;

impl GogParser {
    pub fn new() -> Self { Self }
}

impl Default for GogParser {
    fn default() -> Self { Self::new() }
}

impl LibraryParser for GogParser {
    fn name(&self) -> &str { "GOG" }

    fn scan(&self) -> Result<Vec<LibraryGame>> {
        #[cfg(target_os = "windows")]
        {
            self.scan_windows()
        }
        #[cfg(not(target_os = "windows"))]
        {
            debug!("GogParser: only supported on Windows");
            Ok(vec![])
        }
    }
}

impl GogParser {
    #[cfg(target_os = "windows")]
    fn scan_windows(&self) -> Result<Vec<LibraryGame>> {
        // GOG Galaxy stores installed games in the Windows registry under:
        // HKLM\SOFTWARE\WOW6432Node\GOG.com\Games\<ID>
        let output = match std::process::Command::new("reg")
            .args(["query", r"HKLM\SOFTWARE\WOW6432Node\GOG.com\Games"])
            .output()
        {
            Ok(o) => o,
            Err(e) => {
                warn!("GogParser: reg query failed: {}", e);
                return Ok(vec![]);
            }
        };

        let text = String::from_utf8_lossy(&output.stdout);
        let mut games = Vec::new();

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with(r"HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\GOG.com\Games\") {
                let game_key = trimmed.to_string();
                if let Some(game) = self.read_gog_game_key(&game_key) {
                    games.push(game);
                }
            }
        }

        info!("GogParser: found {} games", games.len());
        Ok(games)
    }

    #[cfg(target_os = "windows")]
    fn read_gog_game_key(&self, key: &str) -> Option<LibraryGame> {
        let output = std::process::Command::new("reg")
            .args(["query", key])
            .output()
            .ok()?;

        let text = String::from_utf8_lossy(&output.stdout);
        let mut title = String::new();
        let mut path = String::new();
        let mut exe = String::new();
        let mut game_id = String::new();

        for line in text.lines() {
            let t = line.trim();
            if let Some(v) = reg_value(t, "gameName") { title = v; }
            else if let Some(v) = reg_value(t, "path") { path = v; }
            else if let Some(v) = reg_value(t, "exe") { exe = v; }
            else if let Some(v) = reg_value(t, "gameID") { game_id = v; }
        }

        if title.is_empty() { return None; }

        Some(LibraryGame {
            title,
            install_path: if path.is_empty() { None } else { Some(path) },
            executable: if exe.is_empty() { None } else { Some(exe) },
            source: LibrarySource::Gog,
            external_id: if game_id.is_empty() { None } else { Some(game_id) },
        })
    }
}

// ─── Epic Games Parser ─────────────────────────────────────────────────────────

pub struct EpicParser;

impl EpicParser {
    pub fn new() -> Self { Self }

    fn launcher_installed_path() -> Option<PathBuf> {
        #[cfg(target_os = "windows")]
        {
            let program_data = std::env::var("PROGRAMDATA").ok()?;
            let p = PathBuf::from(program_data)
                .join("Epic")
                .join("UnrealEngineLauncher")
                .join("LauncherInstalled.dat");
            if p.exists() { Some(p) } else { None }
        }
        #[cfg(target_os = "linux")]
        {
            let home = std::env::var("HOME").ok()?;
            let p = PathBuf::from(home)
                .join(".config")
                .join("Epic")
                .join("UnrealEngineLauncher")
                .join("LauncherInstalled.dat");
            if p.exists() { Some(p) } else { None }
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        { None }
    }
}

impl Default for EpicParser {
    fn default() -> Self { Self::new() }
}

impl LibraryParser for EpicParser {
    fn name(&self) -> &str { "Epic" }

    fn scan(&self) -> Result<Vec<LibraryGame>> {
        let Some(path) = Self::launcher_installed_path() else {
            debug!("EpicParser: LauncherInstalled.dat not found");
            return Ok(vec![]);
        };

        let text = std::fs::read_to_string(&path)
            .map_err(|e| crate::error::NeoCabError::Other(e.to_string()))?;

        #[derive(Deserialize)]
        #[serde(rename_all = "PascalCase")]
        struct EpicInstalled {
            installation_list: Vec<EpicGame>,
        }

        #[derive(Deserialize)]
        #[serde(rename_all = "PascalCase")]
        struct EpicGame {
            app_name: Option<String>,
            display_name: Option<String>,
            install_location: Option<String>,
            executable: Option<String>,
        }

        let installed: EpicInstalled = serde_json::from_str(&text)
            .map_err(|e| crate::error::NeoCabError::Serialization(e))?;

        let games = installed
            .installation_list
            .into_iter()
            .filter_map(|g| {
                let title = g.display_name.or_else(|| g.app_name.clone())?;
                Some(LibraryGame {
                    title,
                    install_path: g.install_location,
                    executable: g.executable,
                    source: LibrarySource::Epic,
                    external_id: g.app_name,
                })
            })
            .collect::<Vec<_>>();

        info!("EpicParser: found {} games", games.len());
        Ok(games)
    }
}

// ─── MAME Parser ───────────────────────────────────────────────────────────────

/// Reads MAME's XML game list (output of `mame -listxml`) to enumerate ROMs.
pub struct MameParser {
    pub mame_executable: PathBuf,
}

impl MameParser {
    pub fn new(mame_executable: impl Into<PathBuf>) -> Self {
        Self { mame_executable: mame_executable.into() }
    }
}

impl LibraryParser for MameParser {
    fn name(&self) -> &str { "MAME" }

    fn scan(&self) -> Result<Vec<LibraryGame>> {
        if !self.mame_executable.exists() {
            debug!("MameParser: executable not found at {:?}", self.mame_executable);
            return Ok(vec![]);
        }

        info!("MameParser: running mame -listxml (this may take a while)...");

        let output = std::process::Command::new(&self.mame_executable)
            .arg("-listxml")
            .output()
            .map_err(|e| crate::error::NeoCabError::Other(e.to_string()))?;

        let xml = String::from_utf8_lossy(&output.stdout);
        let mut games = Vec::new();

        // Lightweight XML line-by-line parser (avoids pulling in quick-xml for now).
        // Each MAME game entry looks like: <machine name="pacman" ...><description>Pac-Man</description>
        let mut current_name = String::new();
        for line in xml.lines() {
            let t = line.trim();
            if t.starts_with("<machine ") {
                current_name = extract_xml_attr(t, "name").unwrap_or_default();
            } else if t.starts_with("<description>") && !current_name.is_empty() {
                let title = t
                    .trim_start_matches("<description>")
                    .trim_end_matches("</description>")
                    .to_string();
                games.push(LibraryGame {
                    title,
                    install_path: None,
                    executable: None,
                    source: LibrarySource::Folder,
                    external_id: Some(current_name.clone()),
                });
                current_name.clear();
            }
        }

        info!("MameParser: found {} machines", games.len());
        Ok(games)
    }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

fn extract_vdf_value(line: &str) -> String {
    let parts: Vec<&str> = line.splitn(3, '"').collect();
    if parts.len() >= 3 {
        parts[2].trim().trim_matches('"').to_string()
    } else {
        String::new()
    }
}

#[cfg(target_os = "windows")]
fn reg_value(line: &str, key: &str) -> Option<String> {
    // Registry output format: "    <KeyName>    REG_SZ    <value>"
    if line.contains(key) {
        let parts: Vec<&str> = line.splitn(4, "    ").collect();
        parts.last().map(|v| v.trim().to_string())
    } else {
        None
    }
}

fn extract_xml_attr(tag: &str, attr: &str) -> Option<String> {
    let search = format!("{}=\"", attr);
    let start = tag.find(&search)? + search.len();
    let end = tag[start..].find('"')? + start;
    Some(tag[start..end].to_string())
}
