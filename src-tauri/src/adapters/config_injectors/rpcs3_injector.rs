use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use serde_yaml::Value;
use std::fs;
use std::path::PathBuf;

pub struct Rpcs3Injector;

#[async_trait]
impl EmulatorConfigInjector for Rpcs3Injector {
    fn name(&self) -> &str {
        "rpcs3"
    }

    fn display_name(&self) -> &str {
        "RPCS3"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("rpcs3")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let yml_path = PathBuf::from(config_dir).join("config.yml");
        if !yml_path.exists() {
            return Ok(EmulatorSettings::default());
        }

        let content = fs::read_to_string(&yml_path)
            .map_err(|e| format!("Cannot read rpcs3 config.yml: {}", e))?;

        let root: Value = serde_yaml::from_str(&content)
            .map_err(|e| format!("Cannot parse RPCS3 config.yml as YAML: {}", e))?;

        let mut settings = EmulatorSettings::default();

        if let Some(video) = root.get("Video") {
            if let Some(val) = video.get("Renderer").and_then(|v| v.as_str()) {
                settings.video.renderer = Some(val.to_string());
            }
            if let Some(val) = video.get("VSync").and_then(|v| v.as_bool()) {
                settings.video.vsync = Some(val);
            }
            if let Some(val) = video.get("Resolution Scale").and_then(|v| v.as_u64()) {
                settings.video.resolution_scale = Some(val as u32);
            }
        }

        if let Some(audio) = root.get("Audio") {
            if let Some(val) = audio.get("Master Volume").and_then(|v| v.as_u64()) {
                settings.audio.volume = Some((val as f32) / 100.0);
            }
        }

        if let Some(misc) = root.get("Miscellaneous") {
            if let Some(val) = misc.get("Start games in fullscreen mode").and_then(|v| v.as_bool()) {
                settings.video.fullscreen = Some(val);
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let yml_path = PathBuf::from(config_dir).join("config.yml");
        let content = if yml_path.exists() {
            fs::read_to_string(&yml_path)
                .map_err(|e| format!("Cannot read rpcs3 config.yml: {}", e))?
        } else {
            "{}".to_string()
        };

        let mut root: Value = serde_yaml::from_str(&content)
            .unwrap_or_else(|_| Value::Mapping(serde_yaml::Mapping::new()));

        if let Some(renderer) = &settings.video.renderer {
            set_yaml_value(&mut root, &["Video", "Renderer"], Value::String(renderer.clone()));
        }

        if let Some(vsync) = settings.video.vsync {
            set_yaml_value(&mut root, &["Video", "VSync"], Value::Bool(vsync));
        }

        if let Some(scale) = settings.video.resolution_scale {
            set_yaml_value(&mut root, &["Video", "Resolution Scale"], Value::Number(scale.into()));
        }

        if let Some(vol) = settings.audio.volume {
            let vol_val = (vol * 100.0).round() as u64;
            set_yaml_value(&mut root, &["Audio", "Master Volume"], Value::Number(vol_val.into()));
        }

        if let Some(fs_val) = settings.video.fullscreen {
            set_yaml_value(&mut root, &["Miscellaneous", "Start games in fullscreen mode"], Value::Bool(fs_val));
        }

        let new_content = serde_yaml::to_string(&root)
            .map_err(|e| format!("Cannot serialize RPCS3 YAML: {}", e))?;

        fs::write(&yml_path, new_content)
            .map_err(|e| format!("Cannot write rpcs3 config.yml: {}", e))?;

        Ok(())
    }
}

fn set_yaml_value(root: &mut Value, path: &[&str], val: Value) {
    if !root.is_mapping() {
        *root = Value::Mapping(serde_yaml::Mapping::new());
    }

    let mut current = root;
    for (i, &key) in path.iter().enumerate() {
        let key_val = Value::String(key.to_string());
        if i == path.len() - 1 {
            if let Some(map) = current.as_mapping_mut() {
                map.insert(key_val, val);
            }
            break;
        }

        let exists = current.as_mapping().map(|m| m.contains_key(&key_val)).unwrap_or(false);
        if !exists {
            if let Some(map) = current.as_mapping_mut() {
                map.insert(key_val.clone(), Value::Mapping(serde_yaml::Mapping::new()));
            }
        }
        current = current.get_mut(key).unwrap();
    }
}
