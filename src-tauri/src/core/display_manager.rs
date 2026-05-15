use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayConfig {
    pub id: String,
    pub monitor: u32,
    pub width: u32,
    pub height: u32,
    pub rotation: u32,
    pub mirror: bool,
    pub layout: Option<String>,
}

impl Default for DisplayConfig {
    fn default() -> Self {
        Self {
            id: "main".to_string(),
            monitor: 0,
            width: 1920,
            height: 1080,
            rotation: 0,
            mirror: false,
            layout: None,
        }
    }
}

pub struct DisplayManager {
    displays: Vec<DisplayConfig>,
}

impl DisplayManager {
    pub fn new() -> Self {
        Self {
            displays: vec![
                DisplayConfig {
                    id: "main".to_string(),
                    monitor: 0,
                    width: 1920, height: 1080,
                    rotation: 0, mirror: false,
                    layout: Some("arcade-classic".to_string()),
                },
                DisplayConfig {
                    id: "marquee".to_string(),
                    monitor: 1,
                    width: 1920, height: 480,
                    rotation: 0, mirror: false,
                    layout: Some("marquee-default".to_string()),
                },
            ],
        }
    }

    pub fn displays(&self) -> &[DisplayConfig] { &self.displays }
    pub fn get(&self, id: &str) -> Option<&DisplayConfig> {
        self.displays.iter().find(|d| d.id == id)
    }

    pub fn set_rotation(&mut self, display_id: &str, rotation: u32) {
        if let Some(d) = self.displays.iter_mut().find(|d| d.id == display_id) {
            d.rotation = rotation % 360;
        }
    }

    pub fn set_mirror(&mut self, display_id: &str, mirror: bool) {
        if let Some(d) = self.displays.iter_mut().find(|d| d.id == display_id) {
            d.mirror = mirror;
        }
    }
}
