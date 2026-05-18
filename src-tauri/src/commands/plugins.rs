use crate::core::plugin_engine::PluginEngine;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

pub struct PluginState(pub Mutex<PluginEngine>);

impl Default for PluginState {
    fn default() -> Self {
        PluginState(Mutex::new(PluginEngine::new(PathBuf::from(
            "./data/plugins",
        ))))
    }
}

#[tauri::command]
pub fn plugin_list(plugin_state: State<'_, PluginState>) -> Result<String, String> {
    let engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    let plugins = engine.list().to_vec();
    #[derive(serde::Serialize)]
    struct PluginInfo {
        name: String,
        author: Option<String>,
        version: Option<String>,
        description: Option<String>,
        enabled: bool,
        hooks: Vec<String>,
    }
    let infos: Vec<PluginInfo> = plugins
        .iter()
        .map(|p| PluginInfo {
            name: p.name.clone(),
            author: p.author.clone(),
            version: p.version.clone(),
            description: p.description.clone(),
            enabled: p.enabled,
            hooks: p.hooks.clone(),
        })
        .collect();
    serde_json::to_string(&infos).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn plugin_discover(plugin_state: State<'_, PluginState>) -> Result<String, String> {
    let mut engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    let discovered = engine.discover();
    serde_json::to_string(&discovered).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn plugin_enable(name: String, plugin_state: State<'_, PluginState>) -> Result<bool, String> {
    let mut engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    Ok(engine.enable(&name))
}

#[tauri::command]
pub fn plugin_disable(name: String, plugin_state: State<'_, PluginState>) -> Result<bool, String> {
    let mut engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    Ok(engine.disable(&name))
}

#[tauri::command]
pub fn plugin_set_enabled(
    name: String,
    enabled: bool,
    plugin_state: State<'_, PluginState>,
) -> Result<bool, String> {
    let mut engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    if enabled {
        Ok(engine.enable(&name))
    } else {
        Ok(engine.disable(&name))
    }
}

#[tauri::command]
pub fn plugin_delete(_name: String, _plugin_state: State<'_, PluginState>) -> Result<(), String> {
    Ok(())
}
