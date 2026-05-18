use std::collections::HashMap;
use std::process::Command;
use tracing::info;

#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub enum ScriptEvent {
    Quit,
    Reboot,
    Shutdown,
    GameLaunchStart,
    GameLaunchEnd,
    ConfigChanged,
    CoinInserted,
    IdleTimeout,
    Error,
}

impl ScriptEvent {
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "quit" => Some(Self::Quit),
            "reboot" => Some(Self::Reboot),
            "shutdown" => Some(Self::Shutdown),
            "game_launch_start" => Some(Self::GameLaunchStart),
            "game_launch_end" => Some(Self::GameLaunchEnd),
            "config_changed" => Some(Self::ConfigChanged),
            "coin_inserted" => Some(Self::CoinInserted),
            "idle_timeout" => Some(Self::IdleTimeout),
            "error" => Some(Self::Error),
            _ => None,
        }
    }
}

pub struct ScriptHookManager {
    scripts: HashMap<ScriptEvent, String>,
}

impl Default for ScriptHookManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ScriptHookManager {
    pub fn new() -> Self {
        Self {
            scripts: HashMap::new(),
        }
    }

    pub fn register(&mut self, event: ScriptEvent, script_path: String) {
        info!("Registered script hook: {:?} -> {}", event, script_path);
        self.scripts.insert(event, script_path);
    }

    pub fn run(&self, event: ScriptEvent, game_title: Option<&str>) {
        let script = match self.scripts.get(&event) {
            Some(s) => s,
            None => return,
        };

        let mut cmd = if cfg!(windows) {
            let mut c = Command::new("cmd");
            c.arg("/c");
            c
        } else {
            let mut c = Command::new("bash");
            c.arg("-c");
            c
        };

        cmd.env("NEOCAB_EVENT", format!("{:?}", event));
        if let Some(title) = game_title {
            cmd.env("NEOCAB_GAME_TITLE", title);
        }

        if cfg!(target_os = "windows") {
            let result = std::process::Command::new("cmd")
                .args(["/c", script])
                .env("NEOCAB_EVENT", format!("{:?}", event))
                .env("NEOCAB_GAME_TITLE", game_title.unwrap_or(""))
                .spawn();
            match result {
                Ok(mut child) => {
                    let _ = child.wait();
                }
                Err(e) => tracing::warn!("Script hook failed: {}", e),
            }
        } else {
            let result = std::process::Command::new("bash")
                .args(["-c", script])
                .env("NEOCAB_EVENT", format!("{:?}", event))
                .env("NEOCAB_GAME_TITLE", game_title.unwrap_or(""))
                .spawn();
            match result {
                Ok(mut child) => {
                    let _ = child.wait();
                }
                Err(e) => tracing::warn!("Script hook failed: {}", e),
            }
        }
    }
}
