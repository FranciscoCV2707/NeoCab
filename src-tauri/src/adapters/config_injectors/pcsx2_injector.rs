use async_trait::async_trait;
use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use std::path::PathBuf;
use std::fs;

pub struct Pcsx2Injector;

#[async_trait]
impl EmulatorConfigInjector for Pcsx2Injector {
    fn name(&self) -> &str { "pcsx2" }
    fn display_name(&self) -> &str { "PCSX2" }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("pcsx2")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        PathBuf::from(emulator_path).parent()
            .map(|p| p.join("inis").to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let ini_path = PathBuf::from(config_dir).join("PCSX2.ini");
        let content = fs::read_to_string(&ini_path)
            .map_err(|e| format!("Cannot read PCSX2.ini: {}", e))?;

        let mut settings = EmulatorSettings::default();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('[') || trimmed.starts_with('#') || trimmed.is_empty() { continue; }
            if let Some((key, val)) = trimmed.split_once('=') {
                let k = key.trim();
                let v = val.trim().trim_matches('"');
                match k {
                    "Renderer" => settings.video.renderer = Some(v.to_string()),
                    "UpscaleMultiplier" => settings.video.resolution_scale = v.parse::<u32>().ok(),
                    "VSyncEnable" => settings.video.vsync = Some(v == "1"),
                    "AspectRatio" => {
                        settings.video.aspect_ratio = Some(match v {
                            "0" => "stretch", "1" => "4:3", "2" => "16:9", "3" => "16:10",
                            _ => "auto"
                        }.to_string());
                    }
                    "OutputVolume" => settings.audio.volume = v.parse::<f32>().ok().map(|v| v / 100.0),
                    "SynchronizeMode" => settings.audio.latency = Some(if v == "0" { 30 } else { 100 }),
                    _ => { settings.advanced.insert(k.to_string(), v.to_string()); }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let config_path = PathBuf::from(config_dir);
        fs::create_dir_all(&config_path).map_err(|e| format!("Cannot create config dir: {}", e))?;

        let ini_path = config_path.join("PCSX2.ini");
        let content = if ini_path.exists() {
            fs::read_to_string(&ini_path).unwrap_or_default()
        } else {
            String::new()
        };

        let scale_str = settings.video.resolution_scale.map(|s| s.to_string());
        let vsync_str = settings.video.vsync.map(|v| if v { "1" } else { "0" });
        let content = apply_pcsx2_ini(&content, "GS", &[
            settings.video.renderer.as_deref().map(|r| ("Renderer", r)),
            scale_str.as_deref().map(|s| ("UpscaleMultiplier", s)),
            vsync_str.map(|v| ("VSyncEnable", v)),
        ]);

        let vol_str = settings.audio.volume.map(|v| format!("{:.0}", v * 100.0));
        let content = apply_pcsx2_ini(&content, "Sound", &[
            vol_str.as_deref().map(|v| ("OutputVolume", v)),
        ]);

        fs::write(&ini_path, &content)
            .map_err(|e| format!("Cannot write PCSX2.ini: {}", e))?;

        Ok(())
    }
}

fn apply_pcsx2_ini(content: &str, section: &str, pairs: &[Option<(&str, &str)>]) -> String {
    let valid: Vec<_> = pairs.iter().filter_map(|p| *p).collect();
    if valid.is_empty() { return content.to_string(); }

    let section_header = format!("[{}]", section);
    let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();

    let section_idx = lines.iter().position(|l| l.trim() == section_header);
    let insert_idx = section_idx.unwrap_or(lines.len());

    if section_idx.is_none() {
        lines.insert(insert_idx, section_header.clone());
    }

    for (key, val) in &valid {
        let mut replaced = false;
        let start = section_idx.map(|i| i + 1).unwrap_or(insert_idx + 1);
        for i in start..lines.len() {
            let trimmed = lines[i].trim();
            if trimmed.starts_with('[') { break; }
            if let Some((k, _)) = trimmed.split_once('=') {
                if k.trim() == *key {
                    lines[i] = format!("{} = {}", key, val);
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
