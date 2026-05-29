use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Mutex, RwLock, Arc};
use tracing::info;
use crate::core::arduino_serial::ArduinoInterface;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub name: String,
    pub author: Option<String>,
    pub version: Option<String>,
    pub description: Option<String>,
    pub file_path: PathBuf,
    pub enabled: bool,
    pub hooks: Vec<PluginHook>,
    pub plugin_type: PluginType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PluginType {
    Lua,
    Rust,
}

pub struct PluginState(pub Mutex<PluginEngine>);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum PluginHook {
    OnGameLaunch,
    OnGameEnd,
    OnCoinInserted,
    OnSessionStart,
    OnSessionEnd,
    OnTimerWarning,
    OnTimeExpired,
    OnIdleTimeout,
    OnConfigChanged,
    OnSystemChange,
    OnThemeChanged,
    OnInputDeviceConnected,
    OnInputDeviceDisconnected,
}

impl PluginHook {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "on_game_launch" => Some(Self::OnGameLaunch),
            "on_game_end" => Some(Self::OnGameEnd),
            "on_coin_inserted" => Some(Self::OnCoinInserted),
            "on_session_start" => Some(Self::OnSessionStart),
            "on_session_end" => Some(Self::OnSessionEnd),
            "on_timer_warning" => Some(Self::OnTimerWarning),
            "on_time_expired" => Some(Self::OnTimeExpired),
            "on_idle_timeout" => Some(Self::OnIdleTimeout),
            "on_config_changed" => Some(Self::OnConfigChanged),
            "on_system_change" => Some(Self::OnSystemChange),
            "on_theme_changed" => Some(Self::OnThemeChanged),
            "on_input_device_connected" => Some(Self::OnInputDeviceConnected),
            "on_input_device_disconnected" => Some(Self::OnInputDeviceDisconnected),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::OnGameLaunch => "on_game_launch",
            Self::OnGameEnd => "on_game_end",
            Self::OnCoinInserted => "on_coin_inserted",
            Self::OnSessionStart => "on_session_start",
            Self::OnSessionEnd => "on_session_end",
            Self::OnTimerWarning => "on_timer_warning",
            Self::OnTimeExpired => "on_time_expired",
            Self::OnIdleTimeout => "on_idle_timeout",
            Self::OnConfigChanged => "on_config_changed",
            Self::OnSystemChange => "on_system_change",
            Self::OnThemeChanged => "on_theme_changed",
            Self::OnInputDeviceConnected => "on_input_device_connected",
            Self::OnInputDeviceDisconnected => "on_input_device_disconnected",
        }
    }
}

pub struct PluginContext {
    pub neocab_version: String,
    pub data_dir: PathBuf,
    pub game_title: Option<String>,
    pub system_name: Option<String>,
    pub session_time_remaining: Option<i64>,
    pub coins_inserted: Option<i32>,
    pub input_device_name: Option<String>,
}

impl PluginContext {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            neocab_version: env!("CARGO_PKG_VERSION").to_string(),
            data_dir,
            game_title: None,
            system_name: None,
            session_time_remaining: None,
            coins_inserted: None,
            input_device_name: None,
        }
    }

    pub fn with_game(mut self, title: &str, system: &str) -> Self {
        self.game_title = Some(title.to_string());
        self.system_name = Some(system.to_string());
        self
    }

    pub fn with_session(mut self, time_remaining: i64, coins: i32) -> Self {
        self.session_time_remaining = Some(time_remaining);
        self.coins_inserted = Some(coins);
        self
    }

    pub fn with_device(mut self, name: &str) -> Self {
        self.input_device_name = Some(name.to_string());
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginInfo {
    pub name: String,
    pub author: Option<String>,
    pub version: Option<String>,
    pub description: Option<String>,
    pub enabled: bool,
    pub hooks: Vec<String>,
    pub plugin_type: PluginType,
}

impl From<&Plugin> for PluginInfo {
    fn from(p: &Plugin) -> Self {
        Self {
            name: p.name.clone(),
            author: p.author.clone(),
            version: p.version.clone(),
            description: p.description.clone(),
            enabled: p.enabled,
            hooks: p.hooks.iter().map(|h| h.as_str().to_string()).collect(),
            plugin_type: p.plugin_type.clone(),
        }
    }
}

pub struct PluginEngine {
    plugins: RwLock<Vec<Plugin>>,
    plugin_dir: PathBuf,
    hook_listeners: RwLock<HashMap<PluginHook, Vec<String>>>,
    arduino: Option<Arc<tokio::sync::Mutex<ArduinoInterface>>>,
}

impl PluginEngine {
    pub fn new(plugin_dir: PathBuf) -> Self {
        Self {
            plugins: RwLock::new(Vec::new()),
            plugin_dir,
            hook_listeners: RwLock::new(HashMap::new()),
            arduino: None,
        }
    }

    pub fn set_arduino(&mut self, arduino: Arc<tokio::sync::Mutex<ArduinoInterface>>) {
        self.arduino = Some(arduino);
    }

    pub fn execute_hook(&self, hook: PluginHook, ctx: PluginContext) -> Result<(), String> {
        let hook_str = hook.as_str();
        let listeners = self.list_by_hook(hook.clone());
        if listeners.is_empty() {
            return Ok(());
        }

        let plugins = self.plugins.read().unwrap();
        for plugin_name in listeners {
            if let Some(plugin) = plugins.iter().find(|p| p.name == plugin_name && p.enabled) {
                if plugin.plugin_type == PluginType::Lua {
                    let path = &plugin.file_path;
                    if let Ok(content) = std::fs::read_to_string(path) {
                        let lua = mlua::Lua::new();
                        
                        // Inject neocab API
                        let neocab_table = lua.create_table().map_err(|e| e.to_string())?;
                        
                        // neocab.log(level, msg)
                        let log_fn = lua.create_function(|_, (level, msg): (String, String)| {
                            match level.as_str() {
                                "info" => tracing::info!("[Lua Plugin] {}", msg),
                                "warn" => tracing::warn!("[Lua Plugin] {}", msg),
                                "error" => tracing::error!("[Lua Plugin] {}", msg),
                                _ => tracing::debug!("[Lua Plugin] {}", msg),
                            }
                            Ok(())
                        }).map_err(|e| e.to_string())?;
                        neocab_table.set("log", log_fn).map_err(|e| e.to_string())?;

                        // neocab.trigger_solenoid(output_id)
                        let arduino_clone = self.arduino.clone();
                        let trigger_fn = lua.create_function(move |_, output_id: u8| {
                            if let Some(arduino) = &arduino_clone {
                                if let Ok(mut lock) = arduino.try_lock() {
                                    let _ = lock.trigger_solenoid(output_id);
                                }
                            }
                            Ok(())
                        }).map_err(|e| e.to_string())?;
                        neocab_table.set("trigger_solenoid", trigger_fn).map_err(|e| e.to_string())?;

                        // neocab.set_led(pin, color_hex, state)
                        let arduino_clone2 = self.arduino.clone();
                        let set_led_fn = lua.create_function(move |_, (pin, color_hex, state): (u8, Option<String>, bool)| {
                            if let Some(arduino) = &arduino_clone2 {
                                if let Ok(mut lock) = arduino.try_lock() {
                                    let _ = lock.set_led(pin, color_hex.as_deref(), state);
                                }
                            }
                            Ok(())
                        }).map_err(|e| e.to_string())?;
                        neocab_table.set("set_led", set_led_fn).map_err(|e| e.to_string())?;

                        // neocab.send_key(key)
                        let send_key_fn = lua.create_function(|_, key: String| {
                            use enigo::Keyboard;
                            use mlua::ExternalError;
                            let mut enigo = match enigo::Enigo::new(&enigo::Settings::default()) {
                                Ok(e) => e,
                                Err(e) => return Err(format!("Failed to initialize input simulator: {}", e).into_lua_err()),
                            };
                            if key.len() == 1 {
                                if let Some(c) = key.chars().next() {
                                    let _ = enigo.key(enigo::Key::Unicode(c), enigo::Direction::Click);
                                }
                            } else {
                                match key.to_lowercase().as_str() {
                                    "enter" => { let _ = enigo.key(enigo::Key::Return, enigo::Direction::Click); }
                                    "space" => { let _ = enigo.key(enigo::Key::Space, enigo::Direction::Click); }
                                    "escape" => { let _ = enigo.key(enigo::Key::Escape, enigo::Direction::Click); }
                                    "tab" => { let _ = enigo.key(enigo::Key::Tab, enigo::Direction::Click); }
                                    _ => {}
                                }
                            }
                            Ok(())
                        }).map_err(|e| e.to_string())?;
                        neocab_table.set("send_key", send_key_fn).map_err(|e| e.to_string())?;

                        lua.globals().set("neocab", neocab_table).map_err(|e| e.to_string())?;

                        // Inject ctx
                        let ctx_table = lua.create_table().map_err(|e| e.to_string())?;
                        let _ = ctx_table.set("neocab_version", ctx.neocab_version.clone());
                        let _ = ctx_table.set("data_dir", ctx.data_dir.to_string_lossy().to_string());
                        let _ = ctx_table.set("game_title", ctx.game_title.clone());
                        let _ = ctx_table.set("system_name", ctx.system_name.clone());
                        let _ = ctx_table.set("session_time_remaining", ctx.session_time_remaining);
                        let _ = ctx_table.set("coins_inserted", ctx.coins_inserted);
                        let _ = ctx_table.set("input_device_name", ctx.input_device_name.clone());

                        // Execute script to get module
                        let _ = match lua.load(&content).eval::<mlua::Table>() {
                            Ok(plugin_module) => {
                                if let Ok(func) = plugin_module.get::<_, mlua::Function>(hook_str) {
                                    if let Err(err) = func.call::<_, mlua::Value>(ctx_table) {
                                        tracing::error!("Error executing hook '{}' in plugin '{}': {}", hook_str, plugin.name, err);
                                    }
                                }
                            }
                            Err(err) => {
                                tracing::error!("Error evaluating plugin '{}': {}", plugin.name, err);
                            }
                        };
                    }
                }
            }
        }
        Ok(())
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
                let extension = path.extension().and_then(|e| e.to_str());
                let plugin_type = if extension == Some("lua") {
                    Some(PluginType::Lua)
                } else if extension == Some("rplug") {
                    Some(PluginType::Rust)
                } else {
                    None
                };

                if let Some(pt) = plugin_type {
                    let name = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("unknown")
                        .to_string();

                    let hooks = Self::extract_hooks_from_file(&path, pt.clone());
                    let metadata = Self::extract_metadata_from_file(&path, pt.clone());

                    let mut plugins = self.plugins.write().unwrap();
                    if !plugins.iter().any(|p| p.name == name) {
                        let plugin = Plugin {
                            name: name.clone(),
                            author: metadata.get("author").cloned(),
                            version: metadata.get("version").cloned(),
                            description: metadata.get("description").cloned(),
                            file_path: path,
                            enabled: true,
                            hooks: hooks.clone(),
                            plugin_type: pt.clone(),
                        };
                        let plugin_hooks = hooks.clone();
                        info!("Discovered plugin: {} ({:?})", name, pt);
                        plugins.push(plugin);
                        drop(plugins);
                        self.register_hook_listeners(&name, &plugin_hooks);
                        discovered.push(name);
                    }
                }
            }
        }

        discovered
    }

    fn extract_hooks_from_file(path: &PathBuf, plugin_type: PluginType) -> Vec<PluginHook> {
        let mut hooks = Vec::new();
        let content = std::fs::read_to_string(path).unwrap_or_default();

        match plugin_type {
            PluginType::Lua => {
                for line in content.lines() {
                    let line = line.trim();
                    if line.starts_with("-- @hook ") {
                        if let Some(hook_str) = line.strip_prefix("-- @hook ") {
                            if let Some(hook) = PluginHook::from_str(hook_str.trim()) {
                                hooks.push(hook);
                            }
                        }
                    }
                }
            }
            PluginType::Rust => {
                for line in content.lines() {
                    let line = line.trim();
                    if line.starts_with("// @hook ") {
                        if let Some(hook_str) = line.strip_prefix("// @hook ") {
                            if let Some(hook) = PluginHook::from_str(hook_str.trim()) {
                                hooks.push(hook);
                            }
                        }
                    }
                }
            }
        }
        hooks
    }

    fn extract_metadata_from_file(path: &PathBuf, plugin_type: PluginType) -> HashMap<String, String> {
        let mut metadata = HashMap::new();
        let content = std::fs::read_to_string(path).unwrap_or_default();
        let prefix = match plugin_type {
            PluginType::Lua => "-- @",
            PluginType::Rust => "// @",
        };

        for line in content.lines() {
            let line = line.trim();
            if let Some(rest) = line.strip_prefix(prefix) {
                let parts: Vec<&str> = rest.splitn(2, ' ').collect();
                if parts.len() == 2 {
                    let key = parts[0].trim();
                    let value = parts[1].trim();
                    match key {
                        "author" | "version" | "description" => {
                            metadata.insert(key.to_string(), value.to_string());
                        }
                        _ => {}
                    }
                }
            }
        }
        metadata
    }

    fn register_hook_listeners(&mut self, plugin_name: &str, hooks: &[PluginHook]) {
        let mut listeners = self.hook_listeners.write().unwrap();
        for hook in hooks {
            listeners
                .entry(hook.clone())
                .or_insert_with(Vec::new)
                .push(plugin_name.to_string());
        }
    }

    pub fn list(&self) -> Vec<PluginInfo> {
        let plugins = self.plugins.read().unwrap();
        plugins.iter().map(PluginInfo::from).collect()
    }

    pub fn list_by_hook(&self, hook: PluginHook) -> Vec<String> {
        let listeners = self.hook_listeners.read().unwrap();
        listeners.get(&hook).cloned().unwrap_or_default()
    }

    pub fn get(&self, name: &str) -> Option<PluginInfo> {
        let plugins = self.plugins.read().unwrap();
        plugins.iter().find(|p| p.name == name).map(PluginInfo::from)
    }

    pub fn enable(&mut self, name: &str) -> bool {
        let mut plugins = self.plugins.write().unwrap();
        if let Some(p) = plugins.iter_mut().find(|p| p.name == name) {
            p.enabled = true;
            true
        } else {
            false
        }
    }

    pub fn disable(&mut self, name: &str) -> bool {
        let mut plugins = self.plugins.write().unwrap();
        if let Some(p) = plugins.iter_mut().find(|p| p.name == name) {
            p.enabled = false;
            true
        } else {
            false
        }
    }

    pub fn reload(&mut self, name: &str) -> Result<(), String> {
        let mut plugins = self.plugins.write().unwrap();
        if let Some(idx) = plugins.iter().position(|p| p.name == name) {
            let old_plugin = &plugins[idx];
            let path = old_plugin.file_path.clone();
            let hooks = Self::extract_hooks_from_file(&path, old_plugin.plugin_type.clone());
            let metadata = Self::extract_metadata_from_file(&path, old_plugin.plugin_type.clone());

            plugins[idx] = Plugin {
                name: name.to_string(),
                author: metadata.get("author").cloned(),
                version: metadata.get("version").cloned(),
                description: metadata.get("description").cloned(),
                file_path: path,
                enabled: old_plugin.enabled,
                hooks,
                plugin_type: old_plugin.plugin_type.clone(),
            };
            info!("Reloaded plugin: {}", name);
            Ok(())
        } else {
            Err(format!("Plugin not found: {}", name))
        }
    }

    pub fn get_plugin_dir(&self) -> &PathBuf {
        &self.plugin_dir
    }

    pub fn is_loaded(&self, name: &str) -> bool {
        let plugins = self.plugins.read().unwrap();
        plugins.iter().any(|p| p.name == name && p.enabled)
    }

    pub fn count(&self) -> usize {
        let plugins = self.plugins.read().unwrap();
        plugins.len()
    }

    pub fn count_enabled(&self) -> usize {
        let plugins = self.plugins.read().unwrap();
        plugins.iter().filter(|p| p.enabled).count()
    }
}
