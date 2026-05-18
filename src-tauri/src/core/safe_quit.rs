use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafeQuitRule {
    pub id: i64,
    pub emulator: String,
    pub game_pattern: Option<String>,
    pub monitor_type: String,
    pub timeout_seconds: i64,
    pub action: String,
    pub enabled: bool,
}

impl SafeQuitRule {
    pub fn default_for(emulator: &str) -> Self {
        Self {
            id: 0,
            emulator: emulator.to_string(),
            game_pattern: None,
            monitor_type: "timeout".to_string(),
            timeout_seconds: 180,
            action: "ShowAttract".to_string(),
            enabled: true,
        }
    }
}

pub struct SafeQuitManager;

impl SafeQuitManager {
    pub fn should_activate_attract(
        game_active_seconds: u64,
        rules: &[SafeQuitRule],
        emulator: &str,
    ) -> bool {
        let relevant: Vec<&SafeQuitRule> = rules
            .iter()
            .filter(|r| r.enabled && r.emulator == emulator && r.monitor_type == "timeout")
            .collect();

        for rule in &relevant {
            if game_active_seconds >= rule.timeout_seconds as u64 {
                info!(
                    "SafeQuit: {} seconds exceeded for {}, showing attract",
                    rule.timeout_seconds, emulator
                );
                return true;
            }
        }
        false
    }

    pub fn get_action(rules: &[SafeQuitRule], emulator: &str) -> String {
        rules
            .iter()
            .find(|r| r.enabled && r.emulator == emulator)
            .map(|r| r.action.clone())
            .unwrap_or_else(|| "ShowAttract".to_string())
    }
}
