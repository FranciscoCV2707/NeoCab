use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

pub fn download_file(url: &str, dest: &Path) -> Result<(), String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent("neocab-updater/1.0")
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    println!("Downloading {}...", url);

    let resp = client
        .get(url)
        .send()
        .map_err(|e| format!("Download failed: {}", e))?;

    let total_size = resp
        .content_length()
        .unwrap_or(0);

    let mut downloaded: u64 = 0;
    let mut file = File::create(dest)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut stream = resp;
    let mut buffer = [0u8; 8192];

    loop {
        let n = stream
            .read(&mut buffer)
            .map_err(|e| format!("Read error: {}", e))?;
        if n == 0 {
            break;
        }
        file.write_all(&buffer[..n])
            .map_err(|e| format!("Write error: {}", e))?;
        downloaded += n as u64;

        if total_size > 0 {
            let pct = (downloaded as f64 / total_size as f64) * 100.0;
            print!("\rProgress: {:.1}% ({}/{} MB)", pct, downloaded / 1048576, total_size / 1048576);
        } else {
            print!("\rDownloaded: {} KB", downloaded / 1024);
        }
    }

    println!();
    Ok(())
}
