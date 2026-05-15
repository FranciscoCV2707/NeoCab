use crate::db::Database;
use std::sync::Arc;
use tauri::State;
use serde::Serialize;

#[derive(Serialize)]
pub struct JukeboxTrack {
    pub id: i64,
    pub title: String,
    pub file_path: String,
    pub artist: Option<String>,
    pub duration_sec: i64,
}

#[tauri::command]
pub async fn jukebox_list_tracks(music_dir: String) -> Result<Vec<JukeboxTrack>, String> {
    let dir = std::path::Path::new(&music_dir);
    if !dir.exists() { return Ok(vec![]); }

    let mut tracks = Vec::new();
    let mut id = 1i64;
    for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
        if let Ok(entry) = entry {
            let path = entry.path();
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if matches!(ext, "mp3" | "ogg" | "flac" | "wav" | "m4a") {
                let title = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string();
                tracks.push(JukeboxTrack {
                    id,
                    title,
                    file_path: path.to_string_lossy().to_string(),
                    artist: None,
                    duration_sec: 0,
                });
                id += 1;
            }
        }
    }
    Ok(tracks)
}
