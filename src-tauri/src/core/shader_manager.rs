use crate::error::{NeoCabError, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shader {
    pub name: String,
    pub description: String,
    pub path: PathBuf,
    pub shader_type: ShaderType,
    pub parameters: Vec<ShaderParameter>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ShaderType {
    CRT,
    Scanlines,
    Blur,
    Phosphor,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderParameter {
    pub name: String,
    pub display_name: String,
    pub param_type: String,
    pub min_value: f32,
    pub max_value: f32,
    pub default_value: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderPreset {
    pub name: String,
    pub shader: String,
    pub parameters: std::collections::HashMap<String, f32>,
}

pub struct ShaderManager {
    shaders_path: PathBuf,
}

impl ShaderManager {
    pub fn new(shaders_path: PathBuf) -> Self {
        Self { shaders_path }
    }

    /// Get default CRT shader
    pub fn get_default_crt_shader(&self) -> Shader {
        Shader {
            name: "CRT - Geom".to_string(),
            description: "Realistic CRT monitor with geometry distortion".to_string(),
            path: self.shaders_path.join("crt-geom.glsl"),
            shader_type: ShaderType::CRT,
            parameters: vec![
                ShaderParameter {
                    name: "CRTgamma".to_string(),
                    display_name: "CRT Gamma".to_string(),
                    param_type: "float".to_string(),
                    min_value: 1.0,
                    max_value: 3.0,
                    default_value: 2.2,
                },
                ShaderParameter {
                    name: "monitorgamma".to_string(),
                    display_name: "Monitor Gamma".to_string(),
                    param_type: "float".to_string(),
                    min_value: 1.0,
                    max_value: 3.0,
                    default_value: 2.2,
                },
                ShaderParameter {
                    name: "d".to_string(),
                    display_name: "Distance".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.0,
                    max_value: 3.0,
                    default_value: 1.5,
                },
            ],
        }
    }

    /// Get scanlines shader
    pub fn get_scanlines_shader(&self) -> Shader {
        Shader {
            name: "Scanlines".to_string(),
            description: "Classic horizontal scanlines effect".to_string(),
            path: self.shaders_path.join("scanlines.glsl"),
            shader_type: ShaderType::Scanlines,
            parameters: vec![
                ShaderParameter {
                    name: "scanline_strength".to_string(),
                    display_name: "Scanline Strength".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.0,
                    max_value: 1.0,
                    default_value: 0.75,
                },
                ShaderParameter {
                    name: "scanline_thickness".to_string(),
                    display_name: "Scanline Thickness".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.5,
                    max_value: 2.0,
                    default_value: 1.0,
                },
            ],
        }
    }

    /// Get phosphor shader
    pub fn get_phosphor_shader(&self) -> Shader {
        Shader {
            name: "Phosphor".to_string(),
            description: "Phosphor dot matrix effect (shadow mask)".to_string(),
            path: self.shaders_path.join("phosphor.glsl"),
            shader_type: ShaderType::Phosphor,
            parameters: vec![
                ShaderParameter {
                    name: "phosphor_strength".to_string(),
                    display_name: "Phosphor Strength".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.0,
                    max_value: 1.0,
                    default_value: 0.5,
                },
            ],
        }
    }

    /// List all available shaders
    pub async fn list_shaders(&self) -> Result<Vec<Shader>> {
        let mut shaders = vec![
            self.get_default_crt_shader(),
            self.get_scanlines_shader(),
            self.get_phosphor_shader(),
        ];

        // Scan for custom shaders
        if self.shaders_path.exists() {
            let mut entries = fs::read_dir(&self.shaders_path)
                .await?;

            while let Some(entry) = entries
                .next_entry()
                .await?
            {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "glsl") {
                    if let Some(name) = path.file_stem().and_then(|n| n.to_str()) {
                        let shader = Shader {
                            name: name.to_string(),
                            description: format!("Custom shader: {}", name),
                            path: path.clone(),
                            shader_type: ShaderType::Custom,
                            parameters: Vec::new(),
                        };
                        shaders.push(shader);
                    }
                }
            }
        }

        Ok(shaders)
    }

    /// Get shader by name
    pub async fn get_shader(&self, name: &str) -> Result<Option<Shader>> {
        let shaders = self.list_shaders().await?;
        Ok(shaders.into_iter().find(|s| s.name == name))
    }

    /// Get shader preset
    pub async fn get_preset(&self, preset_name: &str) -> Result<ShaderPreset> {
        let preset = match preset_name {
            "arcade" => ShaderPreset {
                name: "Arcade".to_string(),
                shader: "CRT - Geom".to_string(),
                parameters: vec![
                    ("CRTgamma".to_string(), 2.2),
                    ("monitorgamma".to_string(), 2.2),
                    ("d".to_string(), 1.5),
                ]
                .into_iter()
                .collect(),
            },
            "light" => ShaderPreset {
                name: "Light CRT".to_string(),
                shader: "Scanlines".to_string(),
                parameters: vec![
                    ("scanline_strength".to_string(), 0.4),
                    ("scanline_thickness".to_string(), 0.8),
                ]
                .into_iter()
                .collect(),
            },
            "heavy" => ShaderPreset {
                name: "Heavy CRT".to_string(),
                shader: "CRT - Geom".to_string(),
                parameters: vec![
                    ("CRTgamma".to_string(), 2.4),
                    ("monitorgamma".to_string(), 2.4),
                    ("d".to_string(), 2.0),
                ]
                .into_iter()
                .collect(),
            },
            _ => {
                return Err(NeoCabError::InvalidInput(format!(
                    "Unknown preset: {}",
                    preset_name
                )))
            }
        };

        Ok(preset)
    }

    /// Get all available presets
    pub fn list_presets(&self) -> Vec<&'static str> {
        vec!["arcade", "light", "heavy"]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_crt_shader() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let shader = manager.get_default_crt_shader();

        assert_eq!(shader.name, "CRT - Geom");
        assert_eq!(shader.shader_type, ShaderType::CRT);
        assert!(!shader.parameters.is_empty());
    }

    #[test]
    fn test_scanlines_shader() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let shader = manager.get_scanlines_shader();

        assert_eq!(shader.name, "Scanlines");
        assert_eq!(shader.shader_type, ShaderType::Scanlines);
    }

    #[test]
    fn test_list_presets() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let presets = manager.list_presets();

        assert!(presets.contains(&"arcade"));
        assert!(presets.contains(&"light"));
        assert!(presets.contains(&"heavy"));
    }

    #[tokio::test]
    async fn test_get_preset() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let preset = manager.get_preset("arcade").await.unwrap();

        assert_eq!(preset.name, "Arcade");
        assert_eq!(preset.shader, "CRT - Geom");
    }
}
