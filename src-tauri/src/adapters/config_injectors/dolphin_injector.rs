use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;

pub struct DolphinInjector;

#[async_trait]
impl EmulatorConfigInjector for DolphinInjector {
    fn name(&self) -> &str {
        "dolphin"
    }
    fn display_name(&self) -> &str {
        "Dolphin"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("dolphin")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        PathBuf::from(emulator_path)
            .parent()
            .map(|p| p.join("User").to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let ini_path = PathBuf::from(config_dir).join("Config").join("Dolphin.ini");
        let content =
            fs::read_to_string(&ini_path).map_err(|e| format!("Cannot read Dolphin.ini: {}", e))?;

        let mut settings = EmulatorSettings::default();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('[') || trimmed.starts_with('#') || trimmed.is_empty() {
                continue;
            }
            if let Some((key, val)) = trimmed.split_once('=') {
                let k = key.trim();
                let v = val.trim();
                match k {
                    "GFXBackend" => settings.video.renderer = Some(v.to_string()),
                    "VSync" => settings.video.vsync = Some(v == "True"),
                    "InternalResolution" => {
                        let scale = v.parse::<u32>().ok();
                        settings.video.resolution_scale = scale;
                    }
                    "FullscreenDisplay" => settings.video.fullscreen = Some(!v.is_empty()),
                    "AspectRatio" => {
                        settings.video.aspect_ratio = Some(
                            match v {
                                "0" => "auto",
                                "1" => "4:3",
                                "2" => "16:9",
                                "3" => "16:10",
                                _ => "auto",
                            }
                            .to_string(),
                        );
                    }
                    "Volume" => settings.audio.volume = v.parse::<f32>().ok().map(|v| v / 100.0),
                    "Backend" => settings.audio.backend = Some(v.to_string()),
                    "Latency" => settings.audio.latency = v.parse::<u32>().ok(),
                    _ => {
                        settings.advanced.insert(k.to_string(), v.to_string());
                    }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let config_path = PathBuf::from(config_dir).join("Config");
        fs::create_dir_all(&config_path).map_err(|e| format!("Cannot create config dir: {}", e))?;

        let ini_path = config_path.join("Dolphin.ini");
        let content = if ini_path.exists() {
            fs::read_to_string(&ini_path).unwrap_or_default()
        } else {
            String::new()
        };

        let vsync_val = settings
            .video
            .vsync
            .map(|v| if v { "True" } else { "False" });
        let content = apply_ini_section(&content, "Core", &[vsync_val.map(|v| ("VSync", v))]);

        let scale_str = settings.video.resolution_scale.map(|s| s.to_string());
        let content = apply_ini_section(
            &content,
            "Graphics",
            &[
                settings
                    .video
                    .renderer
                    .as_deref()
                    .map(|r| ("GFXBackend", r)),
                scale_str.as_deref().map(|s| ("InternalResolution", s)),
            ],
        );

        let vol_str = settings.audio.volume.map(|v| format!("{:.0}", v * 100.0));
        let content = apply_ini_section(
            &content,
            "DSP",
            &[
                settings.audio.backend.as_deref().map(|b| ("Backend", b)),
                vol_str.as_deref().map(|v| ("Volume", v)),
            ],
        );

        fs::write(&ini_path, &content).map_err(|e| format!("Cannot write Dolphin.ini: {}", e))?;

        Ok(())
    }
}

fn apply_ini_section(content: &str, section: &str, pairs: &[Option<(&str, &str)>]) -> String {
    let valid: Vec<_> = pairs.iter().filter_map(|p| *p).collect();
    if valid.is_empty() {
        return content.to_string();
    }

    let section_header = format!("[{}]", section);
    let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();

    // Find section or add at end
    let section_idx = lines.iter().position(|l| l.trim() == section_header);
    let insert_idx = section_idx.unwrap_or(lines.len());

    if section_idx.is_none() {
        lines.insert(insert_idx, section_header);
    }

    // Insert after section header (or replace existing keys)
    for (key, val) in &valid {
        let mut replaced = false;
        let start = section_idx.map(|i| i + 1).unwrap_or(insert_idx + 1);
        for line in lines.iter_mut().skip(start) {
            if line.trim().starts_with('[') {
                break;
            }
            if let Some((k, _)) = line.trim().split_once('=') {
                if k.trim() == *key {
                    *line = format!("{} = {}", key, val);
                    replaced = true;
                    break;
                }
            }
        }
        if !replaced {
            lines.insert(insert_idx + 1, format!("{} = {}", key, val));
        }
    }

    lines.join("\n")
}
