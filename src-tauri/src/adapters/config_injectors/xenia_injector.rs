use async_trait::async_trait;
use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use std::path::PathBuf;
use std::fs;

pub struct XeniaInjector;

#[async_trait]
impl EmulatorConfigInjector for XeniaInjector {
    fn name(&self) -> &str { "xenia" }
    fn display_name(&self) -> &str { "Xenia" }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("xenia")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        // Xenia uses a config file next to the executable, or in a `config` subdir
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        // Xenia uses a TOML config: xenia-canary.config.toml or xenia.config.toml
        let candidates = ["xenia-canary.config.toml", "xenia.config.toml"];
        let mut config_path = None;
        for name in &candidates {
            let p = PathBuf::from(config_dir).join(name);
            if p.exists() {
                config_path = Some(p);
                break;
            }
        }

        let config_path = config_path.ok_or_else(|| "No Xenia config file found".to_string())?;
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Cannot read {}: {}", config_path.display(), e))?;

        let mut settings = EmulatorSettings::default();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('#') || trimmed.is_empty() || trimmed.starts_with('[') { continue; }
            if let Some((key, val)) = trimmed.split_once('=') {
                let k = key.trim();
                let v = val.trim().trim_matches('"');
                match k {
                    "gpu" => settings.video.renderer = Some(v.to_string()),
                    "draw_resolution_scale_x" => settings.video.resolution_scale = v.parse::<u32>().ok(),
                    "vsync" => settings.video.vsync = Some(v == "true"),
                    "fullscreen" => settings.video.fullscreen = Some(v == "true"),
                    "aspect_ratio" => settings.video.aspect_ratio = Some(v.to_string()),
                    "volume" => settings.audio.volume = v.parse::<f32>().ok().map(|v| v / 100.0),
                    _ => { settings.advanced.insert(k.to_string(), v.to_string()); }
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let candidates = ["xenia-canary.config.toml", "xenia.config.toml"];
        let config_path = candidates.iter()
            .find_map(|name| {
                let p = PathBuf::from(config_dir).join(name);
                if p.exists() { Some(p) } else { None }
            })
            .unwrap_or_else(|| PathBuf::from(config_dir).join("xenia.config.toml"));

        let content = if config_path.exists() {
            fs::read_to_string(&config_path).unwrap_or_default()
        } else {
            String::new()
        };

        let mut new_content = String::new();
        let mut keys_found: std::collections::HashSet<String> = std::collections::HashSet::new();

        // Update existing keys
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('#') || trimmed.is_empty() || trimmed.starts_with('[') {
                new_content.push_str(line);
                new_content.push('\n');
                continue;
            }
            if let Some((key, _)) = trimmed.split_once('=') {
                let k = key.trim();
                keys_found.insert(k.to_string());

                let new_val: Option<String> = match k {
                    "gpu" => settings.video.renderer.clone(),
                    "draw_resolution_scale_x" => settings.video.resolution_scale.map(|s| s.to_string()),
                    "vsync" => settings.video.vsync.map(|v| if v { "true".to_string() } else { "false".to_string() }),
                    "fullscreen" => settings.video.fullscreen.map(|f| if f { "true".to_string() } else { "false".to_string() }),
                    _ => settings.advanced.get(k).cloned(),
                };

                match new_val {
                    Some(val) => new_content.push_str(&format!("{} = \"{}\"\n", k, val)),
                    None => { new_content.push_str(line); new_content.push('\n'); }
                }
            } else {
                new_content.push_str(line);
                new_content.push('\n');
            }
        }

        // Add new keys that weren't found
        if let Some(renderer) = &settings.video.renderer {
            if !keys_found.contains("gpu") {
                new_content.push_str(&format!("gpu = \"{}\"\n", renderer));
            }
        }
        if let Some(vsync) = settings.video.vsync {
            if !keys_found.contains("vsync") {
                new_content.push_str(&format!("vsync = {}\n", if vsync { "true" } else { "false" }));
            }
        }

        fs::write(&config_path, &new_content)
            .map_err(|e| format!("Cannot write {}: {}", config_path.display(), e))?;

        Ok(())
    }
}
