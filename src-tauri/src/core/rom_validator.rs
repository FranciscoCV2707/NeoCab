use crate::db::Database;
use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ScanLevel {
    HeaderOnly,
    DeepChanged,
    FullValidation,
}

impl ScanLevel {
    pub fn as_u8(&self) -> u8 {
        match self {
            Self::HeaderOnly => 1,
            Self::DeepChanged => 2,
            Self::FullValidation => 3,
        }
    }

    pub fn from_u8(v: u8) -> Self {
        match v {
            1 => Self::HeaderOnly,
            2 => Self::DeepChanged,
            _ => Self::FullValidation,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatEntry {
    pub name: String,
    pub description: Option<String>,
    pub rom_name: String,
    pub size: u64,
    pub crc: Option<u32>,
    pub md5: Option<String>,
    pub sha1: Option<String>,
    pub region: Option<String>,
    pub rom_type: RomType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RomType {
    Disc,
    Rom,
    Sample,
    Bios,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatFile {
    pub name: String,
    pub version: Option<String>,
    pub entries: Vec<DatEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub rom_path: PathBuf,
    pub status: RomStatus,
    pub expected_hash: Option<String>,
    pub actual_hash: Option<String>,
    pub matches_dat: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RomStatus {
    Valid,
    MissingFromDat,
    ExtraRom,
    HashMismatch,
    HeaderValid,
}

pub struct RomValidator {
    db: std::sync::Arc<Database>,
    dat_cache: RwLock<HashMap<PathBuf, DatFile>>,
    scan_level: ScanLevel,
}

impl RomValidator {
    pub fn new(db: std::sync::Arc<Database>) -> Self {
        Self {
            db,
            dat_cache: RwLock::new(HashMap::new()),
            scan_level: ScanLevel::HeaderOnly,
        }
    }

    pub fn set_scan_level(&mut self, level: ScanLevel) {
        self.scan_level = level;
    }

    pub fn get_scan_level(&self) -> ScanLevel {
        self.scan_level
    }

    pub async fn load_dat(&self, dat_path: &Path) -> Result<DatFile> {
        if let Some(cached) = self.dat_cache.read().await.get(dat_path) {
            return Ok(cached.clone());
        }

        let content = std::fs::read_to_string(dat_path)?;
        let dat = self.parse_dat(&content)?;

        let mut cache = self.dat_cache.write().await;
        cache.insert(dat_path.to_path_buf(), dat.clone());

        Ok(dat)
    }

    fn parse_dat(&self, content: &str) -> Result<DatFile> {
        let mut entries = Vec::new();

        if content.contains("<softwarelist") || content.contains("<datafile") {
            return self.parse_clrmame_dat(content);
        }

        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            if line.starts_with("game (") || line.starts_with("machine (") {
                if let Some(entry) = self.parse_mame_xml_entry(content) {
                    entries.push(entry);
                }
                break;
            }

            if line.starts_with("game ") {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 2 {
                    let name = parts[1].trim().to_string();
                    entries.push(DatEntry {
                        name: name.clone(),
                        description: None,
                        rom_name: name,
                        size: 0,
                        crc: None,
                        md5: None,
                        sha1: None,
                        region: None,
                        rom_type: RomType::Rom,
                    });
                }
            }
        }

        Ok(DatFile {
            name: "Unknown".to_string(),
            version: None,
            entries,
        })
    }

    fn parse_clrmame_dat(&self, content: &str) -> Result<DatFile> {
        let mut entries = Vec::new();
        let mut name = String::new();
        let mut version = None;

        for line in content.lines() {
            let line = line.trim();

            if line.starts_with("<header") {
                if let Some(start) = line.find("name=\"") {
                    let rest = &line[start + 6..];
                    if let Some(end) = rest.find('"') {
                        name = rest[..end].to_string();
                    }
                }
                if let Some(start) = line.find("version=\"") {
                    let rest = &line[start + 9..];
                    if let Some(end) = rest.find('"') {
                        version = Some(rest[..end].to_string());
                    }
                }
            }

            if line.starts_with("<game ") || line.starts_with("<machine ") {
                let mut entry = DatEntry {
                    name: String::new(),
                    description: None,
                    rom_name: String::new(),
                    size: 0,
                    crc: None,
                    md5: None,
                    sha1: None,
                    region: None,
                    rom_type: RomType::Rom,
                };

                if let Some(start) = line.find("name=\"") {
                    let rest = &line[start + 6..];
                    if let Some(end) = rest.find('"') {
                        entry.name = rest[..end].to_string();
                        entry.rom_name = entry.name.clone();
                    }
                }

                if line.contains("isdisk=") || line.contains("type=\"disc\"") {
                    entry.rom_type = RomType::Disc;
                }

                entries.push(entry);
            }

            if line.starts_with("<rom ") && !entries.is_empty() {
                let entry = entries.last_mut().unwrap();

                if let Some(start) = line.find("size=\"") {
                    let rest = &line[start + 6..];
                    if let Some(end) = rest.find('"') {
                        if let Ok(size) = rest[..end].parse::<u64>() {
                            entry.size = size;
                        }
                    }
                }

                if let Some(start) = line.find("crc=\"") {
                    let rest = &line[start + 5..];
                    if let Some(end) = rest.find('"') {
                        let crc_str = &rest[..end];
                        if let Ok(crc) = u32::from_str_radix(crc_str, 16) {
                            entry.crc = Some(crc);
                        }
                    }
                }

                if let Some(start) = line.find("md5=\"") {
                    let rest = &line[start + 5..];
                    if let Some(end) = rest.find('"') {
                        entry.md5 = Some(rest[..end].to_lowercase());
                    }
                }

                if let Some(start) = line.find("sha1=\"") {
                    let rest = &line[start + 6..];
                    if let Some(end) = rest.find('"') {
                        entry.sha1 = Some(rest[..end].to_lowercase());
                    }
                }
            }
        }

        Ok(DatFile {
            name,
            version,
            entries,
        })
    }

    fn parse_mame_xml_entry(&self, _content: &str) -> Option<DatEntry> {
        None
    }

    pub async fn scan_rom(&self, rom_path: &Path, dat: &DatFile) -> Result<ScanResult> {
        let file_name = rom_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        let dat_entry = dat.entries.iter().find(|e| e.rom_name == file_name);

        let status = match dat_entry {
            None => RomStatus::ExtraRom,
            Some(entry) => {
                if entry.crc.is_none() && entry.sha1.is_none() {
                    RomStatus::HeaderValid
                } else {
                    let hash_result = self.calculate_hash(rom_path).await?;
                    let actual_hash = hash_result.0;
                    let expected = entry.sha1.clone().or(entry.md5.clone().map(|m| m));

                    if let Some(expected) = expected {
                        if expected == actual_hash {
                            RomStatus::Valid
                        } else {
                            RomStatus::HashMismatch
                        }
                    } else {
                        RomStatus::HeaderValid
                    }
                }
            }
        };

        Ok(ScanResult {
            rom_path: rom_path.to_path_buf(),
            status,
            expected_hash: dat_entry.and_then(|e| e.sha1.clone().or(e.md5.clone().map(|m| m))),
            actual_hash: None,
            matches_dat: matches!(status, RomStatus::Valid),
        })
    }

    pub async fn scan_directory(&self, dir: &Path, dat: &DatFile) -> Result<Vec<ScanResult>> {
        let mut results = Vec::new();

        if !dir.exists() {
            return Ok(results);
        }

        for entry in walkdir::WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let known_exts = [
                        "zip", "7z", "rar", "chd", "rvz", "iso", "bin", "cue", "gcm",
                        "nes", "snes", "smc", "sfc", "n64", "z64", "gba", "gbc", "gb",
                        "md", "gen", "bin", "pce", "iso",
                    ];

                    if known_exts.contains(&ext.to_lowercase().as_str()) {
                        if let Ok(result) = self.scan_rom(path, dat).await {
                            results.push(result);
                        }
                    }
                }
            }
        }

        Ok(results)
    }

    pub async fn calculate_hash(&self, rom_path: &Path) -> Result<(String, u64)> {
        use sha2::Digest;

        let mut file = std::fs::File::open(rom_path)?;
        let metadata = file.metadata()?;
        let file_size = metadata.len();

        let mut hasher = sha2::Sha256::new();
        let mut buffer = vec![0u8; 8192];

        match self.scan_level {
            ScanLevel::HeaderOnly => {
                file.seek(SeekFrom::Start(0))?;
                let mut header = vec![0u8; 512];
                file.read_exact(&mut header)?;
                hasher.update(&header);
            }
            ScanLevel::DeepChanged => {
                file.seek(SeekFrom::Start(0))?;
                let remaining = file_size;
                let to_read = std::cmp::min(1024 * 1024, remaining);
                let mut buffer = vec![0u8; to_read as usize];
                file.read_exact(&mut buffer)?;
                hasher.update(&buffer);

                if remaining > 1024 * 1024 {
                    file.seek(SeekFrom::Start(remaining - 1024 * 1024))?;
                    let mut buffer = vec![0u8; 1024 * 1024];
                    file.read_exact(&mut buffer)?;
                    hasher.update(&buffer);
                }
            }
            ScanLevel::FullValidation => {
                file.seek(SeekFrom::Start(0))?;
                std::io::copy(&mut file, &mut hasher)?;
            }
        }

        let hash = format!("{:x}", hasher.finalize());
        Ok((hash, file_size))
    }

    pub async fn calculate_crc(&self, rom_path: &Path) -> Result<(u32, u64)> {
        use std::io::Read;

        let mut file = std::fs::File::open(rom_path)?;
        let metadata = file.metadata()?;
        let file_size = metadata.len();

        let mut crc_hasher = crc32fast::Hasher::new();

        match self.scan_level {
            ScanLevel::HeaderOnly => {
                file.seek(SeekFrom::Start(0))?;
                let mut header = vec![0u8; 512];
                file.read_exact(&mut header)?;
                crc_hasher.update(&header);
            }
            ScanLevel::DeepChanged => {
                file.seek(SeekFrom::Start(0))?;
                let mut buffer = vec![0u8; 8192];
                let mut read = 0;
                while read < 1024 * 1024 {
                    let n = file.read(&mut buffer)?;
                    if n == 0 {
                        break;
                    }
                    crc_hasher.update(&buffer[..n]);
                    read += n as u64;
                }

                if file_size > 1024 * 1024 {
                    file.seek(SeekFrom::Start(file_size - 1024 * 1024))?;
                    let mut buffer = vec![0u8; 1024 * 1024];
                    loop {
                        let n = file.read(&mut buffer)?;
                        if n == 0 {
                            break;
                        }
                        crc_hasher.update(&buffer[..n]);
                    }
                }
            }
            ScanLevel::FullValidation => {
                let mut buffer = vec![0u8; 8192];
                loop {
                    let n = file.read(&mut buffer)?;
                    if n == 0 {
                        break;
                    }
                    crc_hasher.update(&buffer[..n]);
                }
            }
        }

        Ok((crc_hasher.finalize(), file_size))
    }

    pub fn find_missing_roms<'a>(&self, dat: &'a DatFile, scanned: &'a [ScanResult]) -> Vec<&'a DatEntry> {
        let scanned_names: std::collections::HashSet<_> = scanned
            .iter()
            .filter_map(|r| r.rom_path.file_name().and_then(|n| n.to_str()))
            .collect();

        dat.entries
            .iter()
            .filter(|e| !scanned_names.contains(e.rom_name.as_str()))
            .collect()
    }

    pub fn find_extra_roms(&self, _dat: &DatFile, scanned: &[ScanResult]) -> Vec<PathBuf> {
        scanned
            .iter()
            .filter(|r| matches!(r.status, RomStatus::ExtraRom))
            .map(|r| r.rom_path.clone())
            .collect()
    }

    pub fn summarize_scan(&self, results: &[ScanResult]) -> ScanSummary {
        let total = results.len();
        let valid = results.iter().filter(|r| matches!(r.status, RomStatus::Valid)).count();
        let header_valid = results
            .iter()
            .filter(|r| matches!(r.status, RomStatus::HeaderValid))
            .count();
        let mismatches = results
            .iter()
            .filter(|r| matches!(r.status, RomStatus::HashMismatch))
            .count();
        let extras = results
            .iter()
            .filter(|r| matches!(r.status, RomStatus::ExtraRom))
            .count();

        ScanSummary {
            total_roms: total,
            valid_roms: valid,
            header_valid_roms: header_valid,
            hash_mismatches: mismatches,
            extra_roms: extras,
            scan_level: self.scan_level,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanSummary {
    pub total_roms: usize,
    pub valid_roms: usize,
    pub header_valid_roms: usize,
    pub hash_mismatches: usize,
    pub extra_roms: usize,
    pub scan_level: ScanLevel,
}

impl std::fmt::Display for ScanSummary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Scan Summary ({}): {} total, {} valid, {} header-only, {} mismatches, {} extras",
            match self.scan_level {
                ScanLevel::HeaderOnly => "Header",
                ScanLevel::DeepChanged => "Deep",
                ScanLevel::FullValidation => "Full",
            },
            self.total_roms,
            self.valid_roms,
            self.header_valid_roms,
            self.hash_mismatches,
            self.extra_roms
        )
    }
}