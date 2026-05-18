use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;

pub struct RetroArchInjector;

#[async_trait]
impl EmulatorConfigInjector for RetroArchInjector {
    fn name(&self) -> &str {
        "retroarch"
    }
    fn display_name(&self) -> &str {
        "RetroArch"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("retroarch")
    }

    fn get_config_dir(&self, _emulator_path: &str) -> String {
        #[cfg(windows)]
        {
            let local_app_data = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(local_app_data)
                .join("RetroArch")
                .to_string_lossy()
                .to_string()
        }
        #[cfg(not(windows))]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home)
                .join(".config/retroarch")
                .to_string_lossy()
                .to_string()
        }
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let cfg_path = PathBuf::from(config_dir).join("retroarch.cfg");
        let content = fs::read_to_string(&cfg_path)
            .map_err(|e| format!("Cannot read retroarch.cfg: {}", e))?;

        let mut settings = EmulatorSettings::default();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('#') || trimmed.is_empty() {
                continue;
            }

            if let Some((key, val)) = trimmed.split_once('=') {
                let k = key.trim();
                let v = val.trim().trim_matches('"');
                match k {
                    "video_driver" => settings.video.renderer = Some(v.to_string()),
                    "video_fullscreen" => settings.video.fullscreen = Some(v == "true"),
                    "video_vsync" => settings.video.vsync = Some(v == "true"),
                    "video_scale" => settings.video.resolution_scale = v.parse::<u32>().ok(),
                    "video_rotation" => settings.video.rotation = v.parse::<u32>().ok(),
                    "aspect_ratio_index" => {
                        settings.video.aspect_ratio = Some(
                            match v {
                                "0" => "4:3",
                                "1" => "16:9",
                                "2" => "16:10",
                                "3" => "8:7",
                                "4" => "3:2",
                                "5" => "custom",
                                _ => "4:3",
                            }
                            .to_string(),
                        );
                    }
                    "audio_driver" => settings.audio.backend = Some(v.to_string()),
                    "audio_device" => settings.audio.device = Some(v.to_string()),
                    "audio_volume" => {
                        let vol = v.trim_start_matches('-').parse::<f32>().ok();
                        settings.audio.volume = vol.map(|v| v / 100.0);
                    }
                    "audio_latency" => settings.audio.latency = v.parse::<u32>().ok(),
                    "input_joypad_driver" => settings.input.device = Some(v.to_string()),
                    _ => {
                        settings.advanced.insert(k.to_string(), v.to_string());
                    }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let cfg_path = PathBuf::from(config_dir).join("retroarch.cfg");
        let mut content = if cfg_path.exists() {
            fs::read_to_string(&cfg_path).unwrap_or_default()
        } else {
            String::new()
        };

        if let Some(renderer) = &settings.video.renderer {
            content = set_cfg_value(&content, "video_driver", &format!("\"{}\"", renderer));
        }
        if let Some(fs) = settings.video.fullscreen {
            content = set_cfg_value(
                &content,
                "video_fullscreen",
                if fs { "true" } else { "false" },
            );
        }
        if let Some(vsync) = settings.video.vsync {
            content = set_cfg_value(
                &content,
                "video_vsync",
                if vsync { "true" } else { "false" },
            );
        }
        if let Some(scale) = settings.video.resolution_scale {
            content = set_cfg_value(&content, "video_scale", &scale.to_string());
        }
        if let Some(vol) = settings.audio.volume {
            let retro_vol = ((vol * 100.0) - 100.0) as i32;
            content = set_cfg_value(&content, "audio_volume", &format!("{}", retro_vol));
        }
        if let Some(latency) = settings.audio.latency {
            content = set_cfg_value(&content, "audio_latency", &latency.to_string());
        }

        for (key, val) in &settings.advanced {
            content = set_cfg_value(&content, key, &format!("\"{}\"", val));
        }

        fs::write(&cfg_path, &content).map_err(|e| format!("Cannot write retroarch.cfg: {}", e))?;

        Ok(())
    }
}

fn set_cfg_value(content: &str, key: &str, value: &str) -> String {
    let mut found = false;
    let result: Vec<String> = content
        .lines()
        .map(|line| {
            let trimmed = line.trim();
            if trimmed.starts_with('#') {
                return line.to_string();
            }
            if let Some((k, _)) = trimmed.split_once('=') {
                if k.trim() == key {
                    found = true;
                    return format!("{} = {}", key, value);
                }
            }
            line.to_string()
        })
        .collect();
    let mut output = result.join("\n");
    if !found {
        output.push_str(&format!("\n{} = {}", key, value));
    }
    output
}
