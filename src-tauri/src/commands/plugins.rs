use crate::core::plugin_engine::{PluginEngine, PluginHook, PluginState};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

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
    let plugins = engine.list();
    serde_json::to_string(&plugins).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn plugin_get(plugin_state: State<'_, PluginState>, name: String) -> Result<String, String> {
    let engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    match engine.get(&name) {
        Some(info) => serde_json::to_string(&info).map_err(|e| e.to_string()),
        None => Err(format!("Plugin not found: {}", name)),
    }
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
pub fn plugin_reload(name: String, plugin_state: State<'_, PluginState>) -> Result<(), String> {
    let mut engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    engine.reload(&name)
}

#[tauri::command]
pub fn plugin_delete(name: String, plugin_state: State<'_, PluginState>) -> Result<(), String> {
    let engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    let plugins = engine.list();
    if plugins.iter().any(|p| p.name == name) {
        std::fs::remove_file(format!("./data/plugins/{}.lua", name)).ok();
        std::fs::remove_file(format!("./data/plugins/{}.rplug", name)).ok();
        Ok(())
    } else {
        Err(format!("Plugin not found: {}", name))
    }
}

#[tauri::command]
pub fn plugin_list_by_hook(
    hook: String,
    plugin_state: State<'_, PluginState>,
) -> Result<String, String> {
    let engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    if let Some(h) = PluginHook::from_str(&hook) {
        let plugins = engine.list_by_hook(h);
        serde_json::to_string(&plugins).map_err(|e| e.to_string())
    } else {
        Err(format!("Invalid hook: {}", hook))
    }
}

#[tauri::command]
pub fn plugin_stats(plugin_state: State<'_, PluginState>) -> Result<String, String> {
    let engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    #[derive(serde::Serialize)]
    struct PluginStats {
        total: usize,
        enabled: usize,
        hooks_available: Vec<String>,
    }
    let stats = PluginStats {
        total: engine.count(),
        enabled: engine.count_enabled(),
        hooks_available: vec![
            "on_game_launch".to_string(),
            "on_game_end".to_string(),
            "on_coin_inserted".to_string(),
            "on_session_start".to_string(),
            "on_session_end".to_string(),
            "on_timer_warning".to_string(),
            "on_time_expired".to_string(),
            "on_idle_timeout".to_string(),
            "on_config_changed".to_string(),
            "on_system_change".to_string(),
            "on_theme_changed".to_string(),
            "on_input_device_connected".to_string(),
            "on_input_device_disconnected".to_string(),
        ],
    };
    serde_json::to_string(&stats).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn plugin_create_template(
    name: String,
    plugin_type: String,
    hooks: Vec<String>,
    plugin_state: State<'_, PluginState>,
) -> Result<String, String> {
    let engine = plugin_state.0.lock().map_err(|e| e.to_string())?;
    let template_dir = engine.get_plugin_dir().clone();

    let (extension, content) = match plugin_type.as_str() {
        "lua" => {
            let lua_hooks: Vec<String> = hooks.iter().map(|h| format!("-- @hook {}", h)).collect();
            let lua_hooks_str = lua_hooks.join("\n");
            let lua_content = format!(
                r#"-- @author NeoCab User
-- @version 1.0.0
-- @description Template plugin for {name}
{lua_hooks_str}

local plugin = {{}}

function plugin.on_game_launch(ctx)
    -- ctx.game_title, ctx.system_name
    neocab.log("info", "Plugin {name} launching game: " .. (ctx.game_title or "unknown"))
    return true
end

return plugin
"#,
                name = name,
                lua_hooks_str = lua_hooks_str
            );
            (".lua".to_string(), lua_content)
        }
        "rust" => {
            let rust_content = format!(
                r#"// @author NeoCab User
// @version 1.0.0
// @description Template plugin for {name}
// @hook on_game_launch

// NOTE: Rust plugins require recompilation of NeoCab
// This is a template placeholder for future native plugin support

pub struct {name}Plugin {{
    name: String,
}}

impl Default for {name}Plugin {{
    fn default() -> Self {{
        Self {{
            name: "{name}".to_string(),
        }}
    }}
}}

// Rust plugins will implement neocab's Plugin trait here
// For now, use Lua plugins for dynamic behavior
"#,
                name = name
            );
            (".rplug".to_string(), rust_content)
        }
        _ => return Err(format!("Invalid plugin type: {}", plugin_type)),
    };

    let file_path = template_dir.join(format!("{}{}", name, extension));
    std::fs::write(&file_path, content).map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}
