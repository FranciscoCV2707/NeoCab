use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Settings that can be injected into any emulator's config files
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EmulatorSettings {
    pub video: VideoSettings,
    pub audio: AudioSettings,
    pub input: InputSettings,
    pub advanced: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VideoSettings {
    pub renderer: Option<String>,       // "opengl", "vulkan", "direct3d", "software"
    pub resolution_scale: Option<u32>,  // 1x, 2x, 3x, 4x
    pub vsync: Option<bool>,
    pub fullscreen: Option<bool>,
    pub aspect_ratio: Option<String>,   // "4:3", "16:9", "16:10"
    pub rotation: Option<u32>,          // 0, 90, 180, 270
    pub brightness: Option<f32>,
    pub contrast: Option<f32>,
    pub gamma: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AudioSettings {
    pub backend: Option<String>,        // "alsa", "pulse", "wasapi", "xaudio2"
    pub device: Option<String>,
    pub volume: Option<f32>,            // 0.0 - 1.0
    pub samplerate: Option<u32>,        // 44100, 48000, 96000
    pub latency: Option<u32>,           // ms
    pub normalize: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct InputSettings {
    pub device: Option<String>,
    pub bindings: HashMap<String, String>,
    pub deadzone: Option<f32>,
    pub analog_sensitivity: Option<f32>,
    pub rumble_enabled: Option<bool>,
}

#[async_trait]
pub trait EmulatorConfigInjector: Send + Sync {
    /// Unique identifier for this injector (e.g. "mame", "retroarch")
    fn name(&self) -> &str;

    /// Human-readable display name
    fn display_name(&self) -> &str;

    /// Whether this injector can handle the given emulator executable path
    fn can_handle(&self, emulator_path: &str) -> bool;

    /// Read current settings from emulator config files
    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String>;

    /// Inject settings into emulator config files before launch
    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String>;

    /// Get the config directory for this emulator given its executable path
    fn get_config_dir(&self, emulator_path: &str) -> String;
}
