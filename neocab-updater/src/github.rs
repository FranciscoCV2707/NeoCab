use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseInfo {
    pub version: String,
    pub download_url: String,
    pub checksum: String,
    pub changelog: String,
    pub published_at: String,
}

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    body: Option<String>,
    published_at: Option<String>,
    assets: Vec<GitHubAsset>,
}

#[derive(Debug, Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
    size: Option<i64>,
}

pub fn check_for_updates() -> Result<ReleaseInfo, String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent("neocab-updater/1.0")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let resp = client
        .get("https://api.github.com/repos/neocab/neocab/releases/latest")
        .send()
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("GitHub API returned {}", resp.status()));
    }

    let release: GitHubRelease = resp
        .json()
        .map_err(|e| format!("Failed to parse GitHub response: {}", e))?;

    let version = release.tag_name.trim_start_matches('v').to_string();
    let changelog = release.body.unwrap_or_default();
    let published_at = release.published_at.unwrap_or_default();

    // Find the appropriate asset
    let target_asset = find_matching_asset(&release.assets)?;

    Ok(ReleaseInfo {
        version,
        download_url: target_asset.browser_download_url.clone(),
        checksum: String::new(),
        changelog,
        published_at,
    })
}

fn find_matching_asset(assets: &[GitHubAsset]) -> Result<&GitHubAsset, String> {
    #[cfg(target_arch = "x86_64")]
    let arch = "x86_64";
    #[cfg(target_arch = "aarch64")]
    let arch = "aarch64";
    #[cfg(target_os = "windows")]
    let os = "windows";
    #[cfg(target_os = "linux")]
    let os = "linux";
    #[cfg(target_os = "macos")]
    let os = "macos";

    let pattern = format!("neocab-{}-{}", os, arch);

    for asset in assets {
        if asset.name.contains(&pattern) || asset.name.contains("portable") {
            return Ok(asset);
        }
    }

    // Fallback: return the first zip/msi asset
    for asset in assets {
        let lower = asset.name.to_lowercase();
        if lower.ends_with(".zip") || lower.ends_with(".msi") {
            return Ok(asset);
        }
    }

    Err("No matching release asset found".to_string())
}
