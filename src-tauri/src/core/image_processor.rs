use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum EffectKind {
    Identity,
    Blur(f32),
    Brightness(f32),
    Contrast(f32),
    Saturation(f32),
    Hue(i32),
    Rotation(f32),
    Frame(FrameConfig),
    RoundedCorners(f32),
    Shadow(ShadowConfig),
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct FrameConfig {
    pub color: [u8; 4],
    pub width: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ShadowConfig {
    pub blur: f32,
    pub offset_x: f32,
    pub offset_y: f32,
    pub color: [u8; 4],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageEffect {
    pub kind: EffectKind,
    pub enabled: bool,
}

impl Default for ImageEffect {
    fn default() -> Self {
        Self {
            kind: EffectKind::Identity,
            enabled: true,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EffectPreset {
    None,
    Thumbnail,
    Wheel,
    BoxArt,
    Screenshot,
    FanArt,
    Marquee,
    BlurBackground,
}

impl Default for EffectPreset {
    fn default() -> Self {
        Self::None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageProcessingConfig {
    pub effects: Vec<ImageEffect>,
    pub preset: EffectPreset,
    pub quality: u8,
    pub max_width: Option<u32>,
    pub max_height: Option<u32>,
}

impl Default for ImageProcessingConfig {
    fn default() -> Self {
        Self {
            effects: Vec::new(),
            preset: EffectPreset::None,
            quality: 85,
            max_width: None,
            max_height: None,
        }
    }
}

impl ImageProcessingConfig {
    pub fn from_preset(preset: EffectPreset) -> Self {
        match preset {
            EffectPreset::Thumbnail => Self {
                effects: vec![
                    ImageEffect {
                        kind: EffectKind::Brightness(1.1),
                        enabled: true,
                    },
                    ImageEffect {
                        kind: EffectKind::Contrast(1.2),
                        enabled: true,
                    },
                ],
                preset,
                quality: 80,
                max_width: Some(300),
                max_height: Some(300),
            },
            EffectPreset::Wheel => Self {
                effects: vec![
                    ImageEffect {
                        kind: EffectKind::RoundedCorners(0.1),
                        enabled: true,
                    },
                    ImageEffect {
                        kind: EffectKind::Frame(FrameConfig {
                            color: [255, 255, 255, 255],
                            width: 2,
                        }),
                        enabled: true,
                    },
                ],
                preset,
                quality: 90,
                max_width: Some(512),
                max_height: Some(512),
            },
            EffectPreset::BoxArt => Self {
                effects: vec![
                    ImageEffect {
                        kind: EffectKind::RoundedCorners(0.05),
                        enabled: true,
                    },
                ],
                preset,
                quality: 90,
                max_width: Some(600),
                max_height: Some(800),
            },
            EffectPreset::Screenshot => Self {
                effects: vec![
                    ImageEffect {
                        kind: EffectKind::Contrast(1.1),
                        enabled: true,
                    },
                ],
                preset,
                quality: 85,
                max_width: Some(1920),
                max_height: Some(1080),
            },
            EffectPreset::FanArt => Self {
                effects: vec![
                    ImageEffect {
                        kind: EffectKind::Blur(2.0),
                        enabled: true,
                    },
                    ImageEffect {
                        kind: EffectKind::Brightness(0.9),
                        enabled: true,
                    },
                ],
                preset,
                quality: 80,
                max_width: Some(1920),
                max_height: Some(1080),
            },
            EffectPreset::Marquee => Self {
                effects: vec![
                    ImageEffect {
                        kind: EffectKind::Contrast(1.15),
                        enabled: true,
                    },
                ],
                preset,
                quality: 90,
                max_width: Some(1920),
                max_height: Some(160),
            },
            EffectPreset::BlurBackground => Self {
                effects: vec![ImageEffect {
                    kind: EffectKind::Blur(5.0),
                    enabled: true,
                }],
                preset,
                quality: 70,
                max_width: Some(1920),
                max_height: Some(1080),
            },
            EffectPreset::None => Self::default(),
        }
    }
}

pub struct ImageProcessor {
    config: ImageProcessingConfig,
}

impl ImageProcessor {
    pub fn new(config: ImageProcessingConfig) -> Self {
        Self { config }
    }

    pub fn with_preset(preset: EffectPreset) -> Self {
        Self {
            config: ImageProcessingConfig::from_preset(preset),
        }
    }

    pub fn get_config(&self) -> &ImageProcessingConfig {
        &self.config
    }

    pub fn set_config(&mut self, config: ImageProcessingConfig) {
        self.config = config;
    }

    pub fn process_path(&self, input_path: &PathBuf) -> Result<PathBuf, String> {
        if !input_path.exists() {
            return Err(format!("Input file not found: {:?}", input_path));
        }

        let ext = input_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("png");

        let output_ext = match ext.to_lowercase().as_str() {
            "jpg" | "jpeg" => "jpg",
            _ => "png",
        };

        let stem = input_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");

        let output_path = input_path
            .parent()
            .unwrap_or(&PathBuf::from("."))
            .join(format!(
                "{}_processed.{}",
                stem,
                output_ext
            ));

        Ok(output_path)
    }

    pub fn get_effect_description(effect: &EffectKind) -> &'static str {
        match effect {
            EffectKind::Identity => "No effect",
            EffectKind::Blur(_) => "Applies Gaussian blur",
            EffectKind::Brightness(_) => "Adjusts brightness",
            EffectKind::Contrast(_) => "Adjusts contrast",
            EffectKind::Saturation(_) => "Adjusts color saturation",
            EffectKind::Hue(_) => "Shifts hue rotation",
            EffectKind::Rotation(_) => "Rotates the image",
            EffectKind::Frame(_) => "Adds a border frame",
            EffectKind::RoundedCorners(_) => "Rounds the corners",
            EffectKind::Shadow(_) => "Adds shadow effect",
        }
    }

    pub fn list_preset_effects(preset: EffectPreset) -> Vec<String> {
        let config = ImageProcessingConfig::from_preset(preset);
        config
            .effects
            .iter()
            .filter(|e| e.enabled)
            .map(|e| format!("{:?}", e.kind))
            .collect()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedImage {
    pub original_path: PathBuf,
    pub output_path: PathBuf,
    pub effects_applied: Vec<String>,
    pub final_width: Option<u32>,
    pub final_height: Option<u32>,
    pub file_size: Option<u64>,
}

impl Default for ProcessedImage {
    fn default() -> Self {
        Self {
            original_path: PathBuf::new(),
            output_path: PathBuf::new(),
            effects_applied: Vec::new(),
            final_width: None,
            final_height: None,
            file_size: None,
        }
    }
}

pub mod effects {
    pub fn apply_blur(_factor: f32) -> String {
        "blur".to_string()
    }

    pub fn apply_brightness(_factor: f32) -> String {
        "brightness".to_string()
    }

    pub fn apply_contrast(_factor: f32) -> String {
        "contrast".to_string()
    }

    pub fn apply_saturation(_factor: f32) -> String {
        "saturation".to_string()
    }

    pub fn apply_hue(_shift: i32) -> String {
        "hue".to_string()
    }

    pub fn apply_rotation(_degrees: f32) -> String {
        "rotate".to_string()
    }

    pub fn apply_rounded_corners(_radius: f32) -> String {
        "round".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preset_thumbnail() {
        let config = ImageProcessingConfig::from_preset(EffectPreset::Thumbnail);
        assert!(config.max_width.is_some());
        assert!(config.max_height.is_some());
        assert_eq!(config.quality, 80);
    }

    #[test]
    fn test_preset_wheel() {
        let config = ImageProcessingConfig::from_preset(EffectPreset::Wheel);
        assert!(config.effects.len() >= 2);
    }

    #[test]
    fn test_effect_descriptions() {
        assert!(!ImageProcessor::get_effect_description(&EffectKind::Blur(1.0)).is_empty());
        assert!(!ImageProcessor::get_effect_description(&EffectKind::Brightness(1.0)).is_empty());
    }
}