use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;

pub struct FlycastInjector;

#[async_trait]
impl EmulatorConfigInjector for FlycastInjector {
    fn name(&self) -> &str {
        "flycast"
    }

    fn display_name(&self) -> &str {
        "Flycast"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("flycast")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let cfg_path = PathBuf::from(config_dir).join("emu.cfg");
        if !cfg_path.exists() {
            return Ok(EmulatorSettings::default());
        }

        let content = fs::read_to_string(&cfg_path)
            .map_err(|e| format!("Cannot read flycast emu.cfg: {}", e))?;

        let mut settings = EmulatorSettings::default();
        let mut in_window_section = false;

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('[') {
                in_window_section = trimmed == "[window]";
                continue;
            }

            if in_window_section {
                if let Some((key, val)) = trimmed.split_once('=') {
                    let k = key.trim();
                    let v = val.trim();
                    match k {
                        "fullscreen" => settings.video.fullscreen = Some(v == "yes"),
                        "width" => {
                            if let Ok(w) = v.parse::<u32>() {
                                settings.advanced.insert("width".to_string(), w.to_string());
                            }
                        }
                        "height" => {
                            if let Ok(h) = v.parse::<u32>() {
                                settings.advanced.insert("height".to_string(), h.to_string());
                            }
                        }
                        _ => {
                            settings.advanced.insert(k.to_string(), v.to_string());
                        }
                    }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let cfg_path = PathBuf::from(config_dir).join("emu.cfg");
        let content = if cfg_path.exists() {
            fs::read_to_string(&cfg_path)
                .map_err(|e| format!("Cannot read flycast emu.cfg: {}", e))?
        } else {
            String::new()
        };

        let fs_val = settings
            .video
            .fullscreen
            .map(|v| if v { "yes" } else { "no" });
        
        let maximized_val = settings
            .video
            .fullscreen
            .map(|v| if v { "yes" } else { "no" });

        let content = apply_ini_section(
            &content,
            "window",
            &[
                fs_val.map(|v| ("fullscreen", v)),
                maximized_val.map(|v| ("maximized", v)),
            ],
        );

        fs::write(&cfg_path, content)
            .map_err(|e| format!("Cannot write flycast emu.cfg: {}", e))?;

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

    let section_idx = lines.iter().position(|l| l.trim() == section_header);
    let insert_idx = section_idx.unwrap_or(lines.len());

    if section_idx.is_none() {
        lines.insert(insert_idx, section_header);
    }

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
