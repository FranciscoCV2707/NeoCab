use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub download_url: Option<String>,
    pub changelog: Option<String>,
}

fn get_updater_path() -> PathBuf {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."));

    let updater_name = if cfg!(target_os = "windows") {
        "neocab-updater.exe"
    } else {
        "neocab-updater"
    };

    exe_dir.join(updater_name)
}

#[tauri::command]
pub async fn check_for_updates() -> Result<UpdateInfo, String> {
    let updater_path = get_updater_path();

    if !updater_path.exists() {
        return Ok(UpdateInfo {
            available: false,
            version: None,
            download_url: None,
            changelog: None,
        });
    }

    let output = Command::new(&updater_path)
        .arg("--check")
        .output()
        .map_err(|e| format!("Failed to run updater: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Updater check failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let release: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse updater output: {}", e))?;

    Ok(UpdateInfo {
        available: true,
        version: release["version"].as_str().map(|s| s.to_string()),
        download_url: release["download_url"].as_str().map(|s| s.to_string()),
        changelog: release["changelog"].as_str().map(|s| s.to_string()),
    })
}

#[tauri::command]
pub async fn download_update(url: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    let temp_dir = std::env::temp_dir().join("neocab-update");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Cannot create temp dir: {}", e))?;

    let zip_path = temp_dir.join("neocab-update.zip");

    let client = reqwest::blocking::Client::builder()
        .user_agent("neocab-updater/1.0")
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("HTTP client: {}", e))?;

    // Run blocking download in a spawn blocking task
    let zip_path_clone = zip_path.clone();
    let url_clone = url.clone();

    let result = tokio::task::spawn_blocking(move || -> Result<String, String> {
        let resp = client
            .get(&url_clone)
            .send()
            .map_err(|e| format!("Download failed: {}", e))?;

        let total_size = resp.content_length().unwrap_or(0);
        let mut downloaded: u64 = 0;
        let mut file = std::fs::File::create(&zip_path_clone)
            .map_err(|e| format!("Cannot create file: {}", e))?;

        let mut reader = std::io::BufReader::new(resp);
        let mut buffer = [0u8; 65536];

        loop {
            let n = reader.read(&mut buffer)
                .map_err(|e| format!("Read error: {}", e))?;
            if n == 0 {
                break;
            }
            file.write_all(&buffer[..n])
                .map_err(|e| format!("Write error: {}", e))?;
            downloaded += n as u64;
        }

        let path_str = zip_path_clone.to_string_lossy().to_string();
        Ok(path_str)
    }).await.map_err(|e| format!("Task failed: {}", e))?;

    result
}

#[tauri::command]
pub async fn apply_update(zip_path: String) -> Result<(), String> {
    let updater_path = get_updater_path();
    let current_exe = std::env::current_exe()
        .map_err(|e| format!("Cannot get exe path: {}", e))?;
    let current_pid = std::process::id();

    if !updater_path.exists() {
        return Err("Updater not found".to_string());
    }

    Command::new(&updater_path)
        .arg("--apply")
        .arg(&zip_path)
        .arg(current_exe.to_string_lossy().as_ref())
        .arg(current_pid.to_string())
        .spawn()
        .map_err(|e| format!("Failed to launch updater: {}", e))?;

    std::process::exit(0);
}
