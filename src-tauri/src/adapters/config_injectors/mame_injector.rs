use async_trait::async_trait;
use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings, VideoSettings, AudioSettings};
use std::path::PathBuf;
use std::fs;

pub struct MameInjector;

#[async_trait]
impl EmulatorConfigInjector for MameInjector {
    fn name(&self) -> &str { "mame" }
    fn display_name(&self) -> &str { "MAME" }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("mame") || lower.ends_with("mame.exe") || lower.ends_with("mame")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let ini_path = PathBuf::from(config_dir).join("mame.ini");
        let content = fs::read_to_string(&ini_path)
            .map_err(|e| format!("Cannot read mame.ini: {}", e))?;

        let lines: Vec<&str> = content.lines().collect();
        let mut settings = EmulatorSettings::default();

        for line in &lines {
            let trimmed = line.trim();
            if trimmed.starts_with('#') || trimmed.is_empty() { continue; }

            let parts: Vec<&str> = trimmed.splitn(2, char::is_whitespace).collect();
            if parts.len() < 2 { continue; }

            let key = parts[0].trim();
            let val = parts[1].trim();

            match key {
                "video" => settings.video.renderer = Some(val.to_string()),
                "keepaspect" => settings.video.aspect_ratio = Some(if val == "1" { "4:3".into() } else { "stretch".into() }),
                "waitvsync" => settings.video.vsync = Some(val == "1"),
                "window" => settings.video.fullscreen = Some(val == "0"),
                "brightness" => settings.video.brightness = val.parse::<f32>().ok(),
                "contrast" => settings.video.contrast = val.parse::<f32>().ok(),
                "gamma" => settings.video.gamma = val.parse::<f32>().ok(),
                "sound" => settings.audio.backend = Some(if val == "1" { "enabled".into() } else { "disabled".into() }),
                "samplerate" => settings.audio.samplerate = val.parse::<u32>().ok(),
                "volume" => settings.audio.volume = val.parse::<f32>().ok().map(|v| v / 100.0),
                _ => { settings.advanced.insert(key.to_string(), val.to_string()); }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let ini_path = PathBuf::from(config_dir).join("mame.ini");

        let mut content = if ini_path.exists() {
            fs::read_to_string(&ini_path).unwrap_or_default()
        } else {
            String::new()
        };

        // Apply video settings
        if let Some(renderer) = &settings.video.renderer {
            content = set_ini_value(&content, "video", renderer);
        }
        if let Some(vsync) = settings.video.vsync {
            content = set_ini_value(&content, "waitvsync", if vsync { "1" } else { "0" });
        }
        if let Some(fs) = settings.video.fullscreen {
            content = set_ini_value(&content, "window", if fs { "0" } else { "1" });
        }
        if let Some(b) = settings.video.brightness {
            content = set_ini_value(&content, "brightness", &format!("{:.1}", b));
        }
        if let Some(c) = settings.video.contrast {
            content = set_ini_value(&content, "contrast", &format!("{:.1}", c));
        }
        if let Some(g) = settings.video.gamma {
            content = set_ini_value(&content, "gamma", &format!("{:.1}", g));
        }

        // Apply audio settings
        if let Some(sr) = settings.audio.samplerate {
            content = set_ini_value(&content, "samplerate", &sr.to_string());
        }
        if let Some(v) = settings.audio.volume {
            content = set_ini_value(&content, "volume", &format!("{:.0}", v * 100.0));
        }

        // Apply advanced
        for (key, val) in &settings.advanced {
            content = set_ini_value(&content, key, val);
        }

        fs::write(&ini_path, content)
            .map_err(|e| format!("Cannot write mame.ini: {}", e))?;

        Ok(())
    }
}

fn set_ini_value(content: &str, key: &str, value: &str) -> String {
    let mut found = false;
    let result: Vec<String> = content.lines().map(|line| {
        let trimmed = line.trim();
        if trimmed.starts_with('#') || trimmed.is_empty() {
            return line.to_string();
        }
        let parts: Vec<&str> = trimmed.splitn(2, char::is_whitespace).collect();
        if parts.len() >= 2 && parts[0].trim() == key {
            found = true;
            format!("{} {}", key, value)
        } else {
            line.to_string()
        }
    }).collect();
    let mut output = result.join("\n");
    if !found {
        output.push_str(&format!("\n{} {}", key, value));
    }
    output
}
