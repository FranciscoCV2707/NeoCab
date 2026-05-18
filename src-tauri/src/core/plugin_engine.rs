use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tracing::info;

/// Plugin written in Lua. Uses a safe sandbox with limited API.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub name: String,
    pub author: Option<String>,
    pub version: Option<String>,
    pub description: Option<String>,
    pub file_path: PathBuf,
    pub enabled: bool,
    pub hooks: Vec<String>,
}

pub struct PluginEngine {
    plugins: Vec<Plugin>,
    plugin_dir: PathBuf,
}

impl PluginEngine {
    pub fn new(plugin_dir: PathBuf) -> Self {
        Self {
            plugins: Vec::new(),
            plugin_dir,
        }
    }

    pub fn discover(&mut self) -> Vec<String> {
        let mut discovered = Vec::new();

        if !self.plugin_dir.exists() {
            std::fs::create_dir_all(&self.plugin_dir).ok();
            return discovered;
        }

        if let Ok(entries) = std::fs::read_dir(&self.plugin_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("lua") {
                    let name = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("unknown")
                        .to_string();

                    // Don't re-add existing plugins
                    if !self.plugins.iter().any(|p| p.name == name) {
                        let plugin = Plugin {
                            name: name.clone(),
                            author: None,
                            version: None,
                            description: None,
                            file_path: path,
                            enabled: true,
                            hooks: Vec::new(),
                        };
                        info!("Discovered plugin: {}", name);
                        self.plugins.push(plugin);
                        discovered.push(name);
                    }
                }
            }
        }

        discovered
    }

    pub fn list(&self) -> &[Plugin] {
        &self.plugins
    }
    pub fn list_mut(&mut self) -> &mut Vec<Plugin> {
        &mut self.plugins
    }

    pub fn get(&self, name: &str) -> Option<&Plugin> {
        self.plugins.iter().find(|p| p.name == name)
    }

    pub fn enable(&mut self, name: &str) -> bool {
        if let Some(p) = self.plugins.iter_mut().find(|p| p.name == name) {
            p.enabled = true;
            true
        } else {
            false
        }
    }

    pub fn disable(&mut self, name: &str) -> bool {
        if let Some(p) = self.plugins.iter_mut().find(|p| p.name == name) {
            p.enabled = false;
            true
        } else {
            false
        }
    }
}
