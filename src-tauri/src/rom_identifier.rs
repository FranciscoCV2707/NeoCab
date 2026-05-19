use crc32fast::Hasher as Crc32Hasher;
use sha2::{Digest, Sha256};
use std::path::Path;
use tracing::{debug, warn};

use crate::error::Result;

/// Hashes and parsed metadata for a ROM file.
#[derive(Debug, Clone)]
pub struct RomIdentity {
    pub path: String,
    pub file_name: String,
    pub crc32: String,
    pub sha256: String,
    pub size_bytes: u64,
    /// Parsed from filename using No-Intro naming convention.
    pub parsed: RomNameParts,
}

/// Structured fields extracted from a No-Intro ROM filename.
///
/// Example: `"The Legend of Zelda (USA) (Rev 1).nes"`
/// → `{ title: "The Legend of Zelda", regions: ["USA"], revision: Some("1"), ... }`
#[derive(Debug, Clone, Default)]
pub struct RomNameParts {
    pub title: String,
    pub regions: Vec<String>,
    pub languages: Vec<String>,
    pub revision: Option<String>,
    pub version: Option<String>,
    pub flags: Vec<RomFlag>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RomFlag {
    Beta,
    Proto,
    Demo,
    Sample,
    Pirate,
    Unlicensed,
    Hack,
    VirtualConsole,
    GameCube,
    Translation,
}

/// Identify a ROM by computing its hashes and parsing its filename.
/// Skips known ROM headers before hashing (e.g. iNES 16-byte header for NES).
pub async fn identify_rom(path: &Path) -> Result<RomIdentity> {
    let data = tokio::fs::read(path).await?;
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let hashed_data = strip_header(&file_name, &data);
    let size_bytes = data.len() as u64;

    let crc32 = compute_crc32(hashed_data);
    let sha256 = compute_sha256(hashed_data);

    debug!(
        "Identified ROM: {} | CRC32={} SHA256={}...",
        file_name,
        crc32,
        &sha256[..8]
    );

    let parsed = parse_rom_name(&file_name);

    Ok(RomIdentity {
        path: path.to_string_lossy().into_owned(),
        file_name,
        crc32,
        sha256,
        size_bytes,
        parsed,
    })
}

/// Strip known ROM headers before hashing (improves matching against DAT databases).
fn strip_header<'a>(file_name: &str, data: &'a [u8]) -> &'a [u8] {
    let ext = file_name.rsplit('.').next().unwrap_or("").to_lowercase();
    match ext.as_str() {
        "nes" if data.len() > 16 && &data[0..4] == b"NES\x1a" => {
            // iNES header: 16 bytes
            debug!("Stripping 16-byte iNES header from {}", file_name);
            &data[16..]
        }
        "fds" if data.len() > 16 && &data[0..4] == b"FDS\x1a" => {
            // FDS header: 16 bytes
            &data[16..]
        }
        "smc" | "fig" if data.len() > 512 && data.len() % 1024 == 512 => {
            // SNES copier header: 512 bytes
            debug!("Stripping 512-byte SNES copier header from {}", file_name);
            &data[512..]
        }
        _ => data,
    }
}

fn compute_crc32(data: &[u8]) -> String {
    let mut hasher = Crc32Hasher::new();
    hasher.update(data);
    format!("{:08X}", hasher.finalize())
}

fn compute_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// Parse a ROM filename following the No-Intro naming convention.
pub fn parse_rom_name(filename: &str) -> RomNameParts {
    // Strip extension
    let stem = filename
        .rsplit_once('.')
        .map(|(s, _)| s)
        .unwrap_or(filename);

    let mut parts = RomNameParts::default();
    let mut regions = Vec::new();
    let mut languages = Vec::new();
    let mut flags = Vec::new();
    let mut revision = None;
    let mut version = None;

    // Split title from parenthetical tags
    // Title ends at the first `(`
    let title_end = stem.find('(').unwrap_or(stem.len());
    let raw_title = stem[..title_end].trim();

    // Remove leading "The " article for cleaner display but keep original
    let title = if let Some(t) = raw_title.strip_prefix("The ") {
        format!("{}, The", t.trim_end())
    } else {
        raw_title.to_string()
    };

    // Extract all parenthetical groups
    let mut remainder = &stem[title_end..];
    while let Some(open) = remainder.find('(') {
        let close = match remainder[open..].find(')') {
            Some(c) => open + c,
            None => break,
        };
        let tag = &remainder[open + 1..close];
        remainder = &remainder[close + 1..];

        parse_tag(tag, &mut regions, &mut languages, &mut revision, &mut version, &mut flags);
    }

    parts.title = title;
    parts.regions = regions;
    parts.languages = languages;
    parts.revision = revision;
    parts.version = version;
    parts.flags = flags;
    parts
}

fn parse_tag(
    tag: &str,
    regions: &mut Vec<String>,
    languages: &mut Vec<String>,
    revision: &mut Option<String>,
    version: &mut Option<String>,
    flags: &mut Vec<RomFlag>,
) {
    // Regions: USA, Europe, Japan, World, etc.
    let known_regions = [
        "USA", "Europe", "Japan", "World", "Spain", "France", "Germany",
        "Italy", "Korea", "Brazil", "Australia", "China", "Sweden",
        "Netherlands", "Canada", "Mexico", "Latin America",
    ];
    if known_regions.contains(&tag) {
        regions.push(tag.to_string());
        return;
    }

    // Multi-region: "USA, Europe" or "USA, Europe, Japan"
    let parts: Vec<&str> = tag.split(',').map(str::trim).collect();
    if parts.len() > 1 && parts.iter().all(|p| known_regions.contains(p)) {
        regions.extend(parts.iter().map(|s| s.to_string()));
        return;
    }

    // Revision: "Rev 1", "Rev A", "Rev 2.0"
    if let Some(rev) = tag.strip_prefix("Rev ") {
        *revision = Some(rev.to_string());
        return;
    }

    // Version: "v1.0", "v2.1.3"
    if tag.starts_with('v') && tag.len() > 1 && tag.chars().nth(1).map_or(false, |c| c.is_ascii_digit()) {
        *version = Some(tag.to_string());
        return;
    }

    // Languages: "En", "Es", "Fr", "En,Es,Fr"
    let lang_parts: Vec<&str> = tag.split(',').map(str::trim).collect();
    let known_langs = ["En", "Es", "Fr", "De", "It", "Pt", "Ja", "Ko", "Zh", "Nl", "Sv", "Ru", "Pl"];
    if lang_parts.iter().all(|p| known_langs.contains(p)) {
        languages.extend(lang_parts.iter().map(|s| s.to_string()));
        return;
    }

    // Special flags
    match tag {
        "Beta" | "Beta 1" | "Beta 2" => flags.push(RomFlag::Beta),
        "Proto" | "Prototype" => flags.push(RomFlag::Proto),
        "Demo" => flags.push(RomFlag::Demo),
        "Sample" => flags.push(RomFlag::Sample),
        "Pirate" => flags.push(RomFlag::Pirate),
        "Unlicensed" => flags.push(RomFlag::Unlicensed),
        "Hack" => flags.push(RomFlag::Hack),
        "Virtual Console" => flags.push(RomFlag::VirtualConsole),
        "GameCube Edition" | "GameCube" => flags.push(RomFlag::GameCube),
        "Translation" => flags.push(RomFlag::Translation),
        other => {
            // Log unrecognized tags at debug level so we can improve coverage over time
            warn!("ROM name parser: unrecognized tag '{}'", other);
        }
    }
}

/// Return the best-effort display title (clean, no articles moved).
pub fn display_title(parts: &RomNameParts) -> &str {
    &parts.title
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_zelda() {
        let p = parse_rom_name("The Legend of Zelda (USA) (Rev 1).nes");
        assert_eq!(p.title, "Legend of Zelda, The");
        assert_eq!(p.regions, vec!["USA"]);
        assert_eq!(p.revision, Some("1".to_string()));
        assert!(p.flags.is_empty());
    }

    #[test]
    fn test_parse_multi_region() {
        let p = parse_rom_name("Sonic the Hedgehog (USA, Europe).md");
        assert_eq!(p.regions, vec!["USA", "Europe"]);
    }

    #[test]
    fn test_parse_beta_flag() {
        let p = parse_rom_name("Super Mario World (USA) (Beta).sfc");
        assert!(p.flags.contains(&RomFlag::Beta));
    }

    #[test]
    fn test_parse_version() {
        let p = parse_rom_name("Doom (USA) (v1.2).wad");
        assert_eq!(p.version, Some("v1.2".to_string()));
    }

    #[test]
    fn test_crc32() {
        let crc = compute_crc32(b"hello");
        assert!(!crc.is_empty());
        assert_eq!(crc.len(), 8);
    }

    #[test]
    fn test_strip_ines_header() {
        let mut data = vec![0u8; 1024];
        data[0] = b'N';
        data[1] = b'E';
        data[2] = b'S';
        data[3] = 0x1a;
        let stripped = strip_header("game.nes", &data);
        assert_eq!(stripped.len(), 1008); // 1024 - 16
    }
}
