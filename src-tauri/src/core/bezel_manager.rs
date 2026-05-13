use std::path::{Path, PathBuf};
use crate::Result;
use tracing::info;

pub struct BezelManager {
    base_path: PathBuf,
}

impl BezelManager {
    pub fn new() -> Self {
        Self {
            base_path: PathBuf::from("data/media/bezels"),
        }
    }

    /// Finds the best bezel for a game. 
    /// Priority:
    /// 1. Game-specific bezel (game_id.png)
    /// 2. System-specific bezel (system_id.png)
    /// 3. Default bezel (default.png)
    pub fn get_bezel_for_game(&self, game_id: &str, system_id: &str) -> Option<PathBuf> {
        // 1. Try game-specific
        let game_bezel = self.base_path.join(format!("{}.png", game_id));
        if game_bezel.exists() {
            return Some(game_bezel);
        }

        // 2. Try system-specific
        let system_bezel = self.base_path.join(format!("{}.png", system_id));
        if system_bezel.exists() {
            return Some(system_bezel);
        }

        // 3. Try default
        let default_bezel = self.base_path.join("default.png");
        if default_bezel.exists() {
            return Some(default_bezel);
        }

        None
    }

    /// On Windows, we can use a "Transparent Always-on-top Window" strategy 
    /// or just prepare the emulator config.
    /// For v1.0, we will provide the path so the UI or the Emulator Adapter can use it.
    pub fn get_bezel_info(&self, game_id: &str, system_id: &str) -> serde_json::Value {
        let path = self.get_bezel_for_game(game_id, system_id);
        
        serde_json::json!({
            "has_bezel": path.is_some(),
            "path": path.map(|p| p.to_string_lossy().to_string()),
            "aspect_ratio": "4:3", // Target game ratio
            "screen_ratio": "16:9" // Cabinet ratio
        })
    }
}
