use async_trait::async_trait;
use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use std::path::PathBuf;
use std::fs;

pub struct DuckStationInjector;

#[async_trait]
impl EmulatorConfigInjector for DuckStationInjector {
    fn name(&self) -> &str { "duckstation" }
    fn display_name(&self) -> &str { "DuckStation" }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("duckstation")
    }

    fn get_config_dir(&self, _emulator_path: &str) -> String {
        #[cfg(windows)]
        {
            let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(local_app_data).join("DuckStation").to_string_lossy().to_string()
        }
        #[cfg(not(windows))]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home).join(".local/share/duckstation").to_string_lossy().to_string()
        }
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let ini_path = PathBuf::from(config_dir).join("settings.ini");
        let content = fs::read_to_string(&ini_path)
            .map_err(|e| format!("Cannot read DuckStation settings.ini: {}", e))?;

        let mut settings = EmulatorSettings::default();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('[') || trimmed.starts_with('#') || trimmed.is_empty() { continue; }
            if let Some((key, val)) = trimmed.split_once('=') {
                let k = key.trim();
                let v = val.trim().trim_matches('"');
                match k {
                    "Renderer" => settings.video.renderer = Some(v.to_string()),
                    "ResolutionScale" => settings.video.resolution_scale = v.parse::<u32>().ok(),
                    "VSync" => settings.video.vsync = Some(v == "true" || v == "1"),
                    "DisplayAspectRatio" => {
                        settings.video.aspect_ratio = Some(match v {
                            "Auto" | "auto" => "auto",
                            "4:3" | "4/3" => "4:3",
                            "16:9" | "16/9" => "16:9",
                            _ => "auto"
                        }.to_string());
                    }
                    "AudioBackend" => settings.audio.backend = Some(v.to_string()),
                    "OutputVolume" => settings.audio.volume = v.parse::<f32>().ok().map(|v| v / 100.0),
                    "AudioLatency" => settings.audio.latency = v.parse::<u32>().ok(),
                    _ => { settings.advanced.insert(k.to_string(), v.to_string()); }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let config_path = PathBuf::from(config_dir);
        fs::create_dir_all(&config_path).map_err(|e| format!("Cannot create config dir: {}", e))?;

        let ini_path = config_path.join("settings.ini");
        let content = if ini_path.exists() {
            fs::read_to_string(&ini_path).unwrap_or_default()
        } else {
            String::new()
        };

        let content = set_ini_key(&content, "GPU", "Renderer", settings.video.renderer.as_deref());
        let content = set_ini_key(&content, "GPU", "ResolutionScale", settings.video.resolution_scale.map(|s| s.to_string()).as_deref());
        let content = set_ini_key(&content, "GPU", "VSync", settings.video.vsync.map(|v| if v { "true" } else { "false" }));
        let content = set_ini_key(&content, "Audio", "AudioBackend", settings.audio.backend.as_deref());
        let content = set_ini_key(&content, "Audio", "OutputVolume", settings.audio.volume.map(|v| format!("{:.0}", v * 100.0)).as_deref());
        let content = set_ini_key(&content, "Audio", "AudioLatencyMs", settings.audio.latency.map(|l| l.to_string()).as_deref());

        fs::write(&ini_path, &content)
            .map_err(|e| format!("Cannot write settings.ini: {}", e))?;

        Ok(())
    }
}

fn set_ini_key(content: &str, section: &str, key: &str, value: Option<&str>) -> String {
    let value = match value {
        Some(v) => v,
        None => return content.to_string(),
    };

    let section_header = format!("[{}]", section);
    let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();

    let section_idx = lines.iter().position(|l| l.trim() == section_header);
    let insert_idx = section_idx.unwrap_or(lines.len());

    if section_idx.is_none() {
        lines.insert(insert_idx, section_header);
    }

    let mut replaced = false;
    let start = section_idx.map(|i| i + 1).unwrap_or(insert_idx + 1);
    for i in start..lines.len() {
        let trimmed = lines[i].trim();
        if trimmed.starts_with('[') { break; }
        if let Some((k, _)) = trimmed.split_once('=') {
            if k.trim() == key {
                lines[i] = format!("{} = {}", key, value);
                replaced = true;
                break;
            }
        }
    }
    if !replaced {
        lines.insert(insert_idx + 1, format!("{} = {}", key, value));
    }

    lines.join("\n")
}
