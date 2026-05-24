use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::Arc;
use tauri::State;
use quick_xml::events::Event;
use quick_xml::Reader;
use sqlx::Row;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatVerificationReport {
    pub total_verified: usize,
    pub matched_roms: Vec<MatchedRomInfo>,
    pub mismatched_names: Vec<MismatchedNameInfo>,
    pub missing_roms: Vec<MissingRomInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchedRomInfo {
    pub game_title: String,
    pub rom_filename: String,
    pub local_path: String,
    pub crc32: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MismatchedNameInfo {
    pub game_title: String,
    pub expected_filename: String,
    pub actual_filename: String,
    pub local_path: String,
    pub crc32: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissingRomInfo {
    pub game_title: String,
    pub expected_filename: String,
    pub crc32: String,
}

struct DatRomEntry {
    dat_name: String,
    game_title: String,
    rom_filename: String,
    crc32: String,
    sha1: Option<String>,
    md5: Option<String>,
}

struct LocalGameInfo {
    title: String,
    filename: Option<String>,
    crc32: Option<String>,
    rom_path: String,
}

struct DatMetadataDb {
    dat_name: Option<String>,
    game_title: Option<String>,
    rom_filename: Option<String>,
    crc32: Option<String>,
}

#[tauri::command]
pub async fn import_dat_file(
    dat_path: String,
    db: State<'_, Arc<Database>>,
) -> Result<usize, String> {
    let path = Path::new(&dat_path);
    if !path.exists() {
        return Err(format!("DAT file not found: {}", dat_path));
    }

    let file = File::open(path).map_err(|e| format!("Failed to open DAT file: {}", e))?;
    let buf_reader = BufReader::new(file);
    let mut reader = Reader::from_reader(buf_reader);
    reader.trim_text(true);

    let mut buf = Vec::new();
    let mut dat_name = String::new();
    let mut current_game_title = String::new();
    let mut in_header = false;
    let mut in_name = false;

    let mut entries = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                match e.name().as_ref() {
                    b"header" => in_header = true,
                    b"name" if in_header => in_name = true,
                    b"game" | b"machine" => {
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"name" {
                                if let Ok(val) = attr.unescape_value() {
                                    current_game_title = val.into_owned();
                                }
                            }
                        }
                    }
                    b"rom" => {
                        let mut rom_name = String::new();
                        let mut crc = String::new();
                        let mut sha1 = None;
                        let mut md5 = None;

                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"name" => {
                                    if let Ok(val) = attr.unescape_value() {
                                        rom_name = val.into_owned();
                                    }
                                }
                                b"crc" => {
                                    if let Ok(val) = attr.unescape_value() {
                                        crc = val.into_owned().to_lowercase();
                                    }
                                }
                                b"sha1" => {
                                    if let Ok(val) = attr.unescape_value() {
                                        sha1 = Some(val.into_owned().to_lowercase());
                                    }
                                }
                                b"md5" => {
                                    if let Ok(val) = attr.unescape_value() {
                                        md5 = Some(val.into_owned().to_lowercase());
                                    }
                                }
                                _ => {}
                            }
                        }

                        if !crc.is_empty() {
                            entries.push(DatRomEntry {
                                dat_name: dat_name.clone(),
                                game_title: current_game_title.clone(),
                                rom_filename: rom_name,
                                crc32: crc,
                                sha1,
                                md5,
                            });
                        }
                    }
                    _ => {}
                }
            }
            Ok(Event::Empty(ref e)) => {
                if e.name().as_ref() == b"rom" {
                    let mut rom_name = String::new();
                    let mut crc = String::new();
                    let mut sha1 = None;
                    let mut md5 = None;

                    for attr in e.attributes().flatten() {
                        match attr.key.as_ref() {
                            b"name" => {
                                if let Ok(val) = attr.unescape_value() {
                                    rom_name = val.into_owned();
                                }
                            }
                            b"crc" => {
                                if let Ok(val) = attr.unescape_value() {
                                    crc = val.into_owned().to_lowercase();
                                }
                            }
                            b"sha1" => {
                                if let Ok(val) = attr.unescape_value() {
                                    sha1 = Some(val.into_owned().to_lowercase());
                                }
                            }
                            b"md5" => {
                                if let Ok(val) = attr.unescape_value() {
                                    md5 = Some(val.into_owned().to_lowercase());
                                }
                            }
                            _ => {}
                        }
                    }

                    if !crc.is_empty() {
                        entries.push(DatRomEntry {
                            dat_name: dat_name.clone(),
                            game_title: current_game_title.clone(),
                            rom_filename: rom_name,
                            crc32: crc,
                            sha1,
                            md5,
                        });
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                match e.name().as_ref() {
                    b"header" => in_header = false,
                    b"name" if in_header => in_name = false,
                    b"game" | b"machine" => {
                        current_game_title.clear();
                    }
                    _ => {}
                }
            }
            Ok(Event::Text(ref e)) => {
                if in_name && in_header {
                    if let Ok(val) = e.unescape() {
                        dat_name = val.into_owned();
                    }
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("XML Parse Error: {}", e)),
            _ => {}
        }
        buf.clear();
    }

    if dat_name.is_empty() {
        dat_name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown DAT")
            .to_string();
        for entry in &mut entries {
            entry.dat_name = dat_name.clone();
        }
    }

    let mut tx = db
        .pool()
        .begin()
        .await
        .map_err(|e| format!("Database Transaction Start Error: {}", e))?;

    let mut count = 0;
    for entry in &entries {
        sqlx::query(
            "INSERT INTO dat_metadata (dat_name, game_title, rom_filename, crc32, sha1, md5)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(crc32) DO UPDATE SET
                dat_name = excluded.dat_name,
                game_title = excluded.game_title,
                rom_filename = excluded.rom_filename,
                sha1 = excluded.sha1,
                md5 = excluded.md5",
        )
        .bind(&entry.dat_name)
        .bind(&entry.game_title)
        .bind(&entry.rom_filename)
        .bind(&entry.crc32)
        .bind(&entry.sha1)
        .bind(&entry.md5)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to insert DAT entry: {}", e))?;
        count += 1;
    }

    tx.commit()
        .await
        .map_err(|e| format!("Database Transaction Commit Error: {}", e))?;

    Ok(count)
}

#[tauri::command]
pub async fn verify_library_against_dat(
    dat_name: Option<String>,
    db: State<'_, Arc<Database>>,
) -> Result<DatVerificationReport, String> {
    let rows = sqlx::query("SELECT title, filename, crc32, rom_path FROM games WHERE crc32 IS NOT NULL")
        .fetch_all(db.pool())
        .await
        .map_err(|e| format!("Failed to query local games: {}", e))?;

    let mut local_games = Vec::new();
    for row in rows {
        local_games.push(LocalGameInfo {
            title: row.try_get("title").unwrap_or_default(),
            filename: row.try_get("filename").ok(),
            crc32: row.try_get("crc32").ok(),
            rom_path: row.try_get("rom_path").unwrap_or_default(),
        });
    }

    let dat_rows = if let Some(ref d_name) = dat_name {
        sqlx::query("SELECT dat_name, game_title, rom_filename, crc32 FROM dat_metadata WHERE dat_name = ?")
            .bind(d_name)
            .fetch_all(db.pool())
            .await
    } else {
        sqlx::query("SELECT dat_name, game_title, rom_filename, crc32 FROM dat_metadata")
            .fetch_all(db.pool())
            .await
    }
    .map_err(|e| format!("Failed to query DAT metadata: {}", e))?;

    let mut dat_entries = Vec::new();
    for row in dat_rows {
        dat_entries.push(DatMetadataDb {
            dat_name: row.try_get("dat_name").ok(),
            game_title: row.try_get("game_title").ok(),
            rom_filename: row.try_get("rom_filename").ok(),
            crc32: row.try_get("crc32").ok(),
        });
    }

    use std::collections::{HashMap, HashSet};

    let mut dat_map = HashMap::new();
    for entry in &dat_entries {
        if let Some(ref crc) = entry.crc32 {
            dat_map.insert(crc.to_lowercase(), entry);
        }
    }

    let mut matched_roms = Vec::new();
    let mut mismatched_names = Vec::new();
    let mut seen_crcs = HashSet::new();

    for lg in &local_games {
        if let Some(ref crc) = lg.crc32 {
            let crc_lower = crc.to_lowercase();
            if let Some(dat_entry) = dat_map.get(&crc_lower) {
                seen_crcs.insert(crc_lower.clone());

                let expected_filename = dat_entry.rom_filename.clone().unwrap_or_default();
                let actual_filename = lg.filename.clone().unwrap_or_default();

                if expected_filename == actual_filename {
                    matched_roms.push(MatchedRomInfo {
                        game_title: dat_entry.game_title.clone().unwrap_or_default(),
                        rom_filename: expected_filename,
                        local_path: lg.rom_path.clone(),
                        crc32: crc.clone(),
                    });
                } else {
                    mismatched_names.push(MismatchedNameInfo {
                        game_title: dat_entry.game_title.clone().unwrap_or_default(),
                        expected_filename,
                        actual_filename,
                        local_path: lg.rom_path.clone(),
                        crc32: crc.clone(),
                    });
                }
            }
        }
    }

    let mut missing_roms = Vec::new();
    for entry in &dat_entries {
        if let Some(ref crc) = entry.crc32 {
            let crc_lower = crc.to_lowercase();
            if !seen_crcs.contains(&crc_lower) {
                missing_roms.push(MissingRomInfo {
                    game_title: entry.game_title.clone().unwrap_or_default(),
                    expected_filename: entry.rom_filename.clone().unwrap_or_default(),
                    crc32: crc.clone(),
                });
            }
        }
    }

    let total_verified = matched_roms.len() + mismatched_names.len();

    Ok(DatVerificationReport {
        total_verified,
        matched_roms,
        mismatched_names,
        missing_roms,
    })
}

#[tauri::command]
pub async fn get_imported_dats(db: State<'_, Arc<Database>>) -> Result<Vec<String>, String> {
    let rows = sqlx::query("SELECT DISTINCT dat_name FROM dat_metadata ORDER BY dat_name")
        .fetch_all(db.pool())
        .await
        .map_err(|e| format!("Failed to fetch DAT names: {}", e))?;

    let mut names = Vec::new();
    for row in rows {
        if let Ok(name) = row.try_get::<String, _>("dat_name") {
            if !name.is_empty() {
                names.push(name);
            }
        }
    }
    Ok(names)
}
