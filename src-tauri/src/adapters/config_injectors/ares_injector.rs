use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;

pub struct AresInjector;

#[async_trait]
impl EmulatorConfigInjector for AresInjector {
    fn name(&self) -> &str {
        "ares"
    }

    fn display_name(&self) -> &str {
        "Ares"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("ares")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let bml_path = PathBuf::from(config_dir).join("settings.bml");
        if !bml_path.exists() {
            return Ok(EmulatorSettings::default());
        }

        let content = fs::read_to_string(&bml_path)
            .map_err(|e| format!("Cannot read Ares settings.bml: {}", e))?;

        let mut settings = EmulatorSettings::default();
        let mut in_video = false;
        let mut in_audio = false;

        for line in content.lines() {
            let indent = line.len() - line.trim_start().len();
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            if indent == 0 {
                in_video = trimmed == "Video";
                in_audio = trimmed == "Audio" || trimmed == "System";
                continue;
            }

            if let Some((key, val)) = trimmed.split_once(':') {
                let k = key.trim();
                let v = val.trim();
                if in_video {
                    match k {
                        "Driver" => settings.video.renderer = Some(v.to_string()),
                        "VSync" => settings.video.vsync = Some(v == "true"),
                        "Fullscreen" => settings.video.fullscreen = Some(v == "true"),
                        _ => {}
                    }
                } else if in_audio {
                    match k {
                        "Volume" => {
                            if let Ok(vol) = v.parse::<f32>() {
                                settings.audio.volume = Some(vol);
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let bml_path = PathBuf::from(config_dir).join("settings.bml");
        let content = if bml_path.exists() {
            fs::read_to_string(&bml_path)
                .map_err(|e| format!("Cannot read Ares settings.bml: {}", e))?
        } else {
            "Video\n  Driver: Vulkan\n  VSync: false\n  Fullscreen: false\nAudio\n  Volume: 1.0".to_string()
        };

        let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
        let mut in_video = false;
        let mut in_audio = false;

        let mut driver_replaced = false;
        let mut vsync_replaced = false;
        let mut fs_replaced = false;
        let mut vol_replaced = false;

        for line in lines.iter_mut() {
            let indent = line.len() - line.trim_start().len();
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            if indent == 0 {
                in_video = trimmed == "Video";
                in_audio = trimmed == "Audio" || trimmed == "System";
                continue;
            }

            if let Some((key, _)) = trimmed.split_once(':') {
                let k = key.trim();
                if in_video {
                    match k {
                        "Driver" => {
                            if let Some(r) = &settings.video.renderer {
                                *line = format!("  Driver: {}", r);
                                driver_replaced = true;
                            }
                        }
                        "VSync" => {
                            if let Some(vs) = settings.video.vsync {
                                *line = format!("  VSync: {}", vs);
                                vsync_replaced = true;
                            }
                        }
                        "Fullscreen" => {
                            if let Some(fs_val) = settings.video.fullscreen {
                                *line = format!("  Fullscreen: {}", fs_val);
                                fs_replaced = true;
                            }
                        }
                        _ => {}
                    }
                } else if in_audio {
                    match k {
                        "Volume" => {
                            if let Some(vol) = settings.audio.volume {
                                *line = format!("  Volume: {:.2}", vol);
                                vol_replaced = true;
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        // If not replaced, we can append them
        if !driver_replaced && settings.video.renderer.is_some() {
            if let Some(pos) = lines.iter().position(|l| l.trim() == "Video") {
                lines.insert(pos + 1, format!("  Driver: {}", settings.video.renderer.as_ref().unwrap()));
            }
        }
        if !vsync_replaced && settings.video.vsync.is_some() {
            if let Some(pos) = lines.iter().position(|l| l.trim() == "Video") {
                lines.insert(pos + 1, format!("  VSync: {}", settings.video.vsync.unwrap()));
            }
        }
        if !fs_replaced && settings.video.fullscreen.is_some() {
            if let Some(pos) = lines.iter().position(|l| l.trim() == "Video") {
                lines.insert(pos + 1, format!("  Fullscreen: {}", settings.video.fullscreen.unwrap()));
            }
        }
        if !vol_replaced && settings.audio.volume.is_some() {
            if let Some(pos) = lines.iter().position(|l| l.trim() == "Audio" || l.trim() == "System") {
                lines.insert(pos + 1, format!("  Volume: {:.2}", settings.audio.volume.unwrap()));
            }
        }

        fs::write(&bml_path, lines.join("\n"))
            .map_err(|e| format!("Cannot write Ares settings.bml: {}", e))?;

        Ok(())
    }
}
