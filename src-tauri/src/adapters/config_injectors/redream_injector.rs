use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;

pub struct RedreamInjector;

#[async_trait]
impl EmulatorConfigInjector for RedreamInjector {
    fn name(&self) -> &str {
        "redream"
    }

    fn display_name(&self) -> &str {
        "Redream"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("redream")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let cfg_path = PathBuf::from(config_dir).join("redream.cfg");
        if !cfg_path.exists() {
            return Ok(EmulatorSettings::default());
        }

        let content = fs::read_to_string(&cfg_path)
            .map_err(|e| format!("Cannot read redream.cfg: {}", e))?;

        let mut settings = EmulatorSettings::default();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with('[') {
                continue;
            }

            if let Some((key, val)) = trimmed.split_once('=') {
                let k = key.trim();
                let v = val.trim();
                match k {
                    "fullscreen" => settings.video.fullscreen = Some(v == "1" || v == "true"),
                    "vsync" => settings.video.vsync = Some(v == "1" || v == "true"),
                    "volume" => {
                        if let Ok(vol) = v.parse::<f32>() {
                            settings.audio.volume = Some(vol / 100.0);
                        }
                    }
                    _ => {}
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let cfg_path = PathBuf::from(config_dir).join("redream.cfg");
        let content = if cfg_path.exists() {
            fs::read_to_string(&cfg_path)
                .map_err(|e| format!("Cannot read redream.cfg: {}", e))?
        } else {
            String::new()
        };

        let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();

        let mut fs_replaced = false;
        let mut vsync_replaced = false;
        let mut vol_replaced = false;

        for line in lines.iter_mut() {
            let trimmed = line.trim();
            if let Some((key, _)) = trimmed.split_once('=') {
                let k = key.trim();
                match k {
                    "fullscreen" => {
                        if let Some(fs_val) = settings.video.fullscreen {
                            *line = format!("fullscreen={}", if fs_val { "1" } else { "0" });
                            fs_replaced = true;
                        }
                    }
                    "vsync" => {
                        if let Some(vs) = settings.video.vsync {
                            *line = format!("vsync={}", if vs { "1" } else { "0" });
                            vsync_replaced = true;
                        }
                    }
                    "volume" => {
                        if let Some(vol) = settings.audio.volume {
                            *line = format!("volume={}", (vol * 100.0).round() as i32);
                            vol_replaced = true;
                        }
                    }
                    _ => {}
                }
            }
        }

        if !fs_replaced && settings.video.fullscreen.is_some() {
            lines.push(format!("fullscreen={}", if settings.video.fullscreen.unwrap() { "1" } else { "0" }));
        }
        if !vsync_replaced && settings.video.vsync.is_some() {
            lines.push(format!("vsync={}", if settings.video.vsync.unwrap() { "1" } else { "0" }));
        }
        if !vol_replaced && settings.audio.volume.is_some() {
            lines.push(format!("volume={}", (settings.audio.volume.unwrap() * 100.0).round() as i32));
        }

        fs::write(&cfg_path, lines.join("\n"))
            .map_err(|e| format!("Cannot write redream.cfg: {}", e))?;

        Ok(())
    }
}
