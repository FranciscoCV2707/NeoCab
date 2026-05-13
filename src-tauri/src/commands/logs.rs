use std::fs;
use std::path::PathBuf;
use serde_json::json;
use crate::error::Result;

fn get_logs_dir() -> PathBuf {
    PathBuf::from("./data/logs")
}

#[tauri::command]
pub async fn read_log_file(
    filename: Option<String>,
) -> Result<String> {
    let logs_dir = get_logs_dir();

    let log_file = if let Some(name) = filename {
        logs_dir.join(&name)
    } else {
        // Find the most recent log file
        let entries = fs::read_dir(&logs_dir)
            .map_err(|e| crate::error::NeoCabError::System(format!("Failed to read logs directory: {}", e)))?;

        let mut log_files: Vec<_> = entries
            .filter_map(|entry| {
                entry.ok().and_then(|e| {
                    let path = e.path();
                    if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                        Some(path)
                    } else {
                        None
                    }
                })
            })
            .collect();

        if log_files.is_empty() {
            return Err(crate::error::NeoCabError::System(
                "No log files found".to_string(),
            ));
        }

        // Sort by modified time, newest first
        log_files.sort_by_key(|path| {
            fs::metadata(path)
                .and_then(|meta| meta.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        });
        log_files.pop().unwrap() // Get the most recent
    };

    // Read the file
    let content = fs::read_to_string(&log_file)
        .map_err(|e| crate::error::NeoCabError::System(format!("Failed to read log file: {}", e)))?;

    Ok(content)
}

#[tauri::command]
pub async fn list_log_files() -> Result<String> {
    let logs_dir = get_logs_dir();

    if !logs_dir.exists() {
        let empty_list = json!({
            "success": true,
            "files": [],
            "total": 0
        });
        return Ok(empty_list.to_string());
    }

    let entries = fs::read_dir(&logs_dir)
        .map_err(|e| crate::error::NeoCabError::System(format!("Failed to read logs directory: {}", e)))?;

    let mut files = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                if let Ok(metadata) = fs::metadata(&path) {
                    let filename = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string();

                    let size = metadata.len();
                    let modified = metadata
                        .modified()
                        .ok()
                        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|duration| duration.as_secs())
                        .unwrap_or(0);

                    files.push(json!({
                        "filename": filename,
                        "size": size,
                        "modified_timestamp": modified,
                    }));
                }
            }
        }
    }

    // Sort by modified time, newest first
    files.sort_by(|a, b| {
        let a_time = a["modified_timestamp"].as_u64().unwrap_or(0);
        let b_time = b["modified_timestamp"].as_u64().unwrap_or(0);
        b_time.cmp(&a_time)
    });

    let result = json!({
        "success": true,
        "files": files,
        "total": files.len()
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn clear_logs() -> Result<String> {
    let logs_dir = get_logs_dir();

    if !logs_dir.exists() {
        let result = json!({
            "success": true,
            "message": "Logs directory does not exist"
        });
        return Ok(result.to_string());
    }

    let entries = fs::read_dir(&logs_dir)
        .map_err(|e| crate::error::NeoCabError::System(format!("Failed to read logs directory: {}", e)))?;

    let mut deleted_count = 0;
    let mut errors = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                match fs::remove_file(&path) {
                    Ok(_) => deleted_count += 1,
                    Err(e) => errors.push(format!("Failed to delete {:?}: {}", path, e)),
                }
            }
        }
    }

    let result = json!({
        "success": errors.is_empty(),
        "deleted": deleted_count,
        "errors": errors
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_log_tail(
    lines: Option<usize>,
    filename: Option<String>,
) -> Result<String> {
    let logs_dir = get_logs_dir();
    let line_count = lines.unwrap_or(100).min(1000); // Max 1000 lines

    let log_file = if let Some(name) = filename {
        logs_dir.join(&name)
    } else {
        // Find the most recent log file
        let entries = fs::read_dir(&logs_dir)
            .map_err(|e| crate::error::NeoCabError::System(format!("Failed to read logs directory: {}", e)))?;

        let mut log_files: Vec<_> = entries
            .filter_map(|entry| {
                entry.ok().and_then(|e| {
                    let path = e.path();
                    if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                        Some(path)
                    } else {
                        None
                    }
                })
            })
            .collect();

        if log_files.is_empty() {
            return Err(crate::error::NeoCabError::System(
                "No log files found".to_string(),
            ));
        }

        log_files.sort_by_key(|path| {
            fs::metadata(path)
                .and_then(|meta| meta.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        });
        log_files.pop().unwrap()
    };

    let content = fs::read_to_string(&log_file)
        .map_err(|e| crate::error::NeoCabError::System(format!("Failed to read log file: {}", e)))?;

    // Get last N lines
    let lines_vec: Vec<&str> = content.lines().collect();
    let start = if lines_vec.len() > line_count {
        lines_vec.len() - line_count
    } else {
        0
    };

    let tail = lines_vec[start..].join("\n");

    Ok(tail)
}
