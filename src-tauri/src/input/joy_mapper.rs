use std::collections::HashMap;
use std::time::Instant;
use std::path::Path;
use serde::{Deserialize, Serialize};
use tracing::{info, debug};

/// Represents an action to be triggered by an input event
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum MappedAction {
    Key(String),                  // Single key: "Space", "Enter", "A"
    Keys(Vec<String>),            // Multi-key combo: ["Ctrl", "Alt", "Delete"]
    Macro(Vec<MacroStep>),        // Sequence with delays
    MouseButton(u8),              // 0=Left, 1=Right, 2=Middle
    MouseMove { dx: i32, dy: i32 },
    ArcadeAction(ArcadeAction),   // Internal NeoCab actions
    Nothing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroStep {
    pub action: MappedAction,
    pub delay_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum AxisDirection {
    Positive,
    Negative,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum JoyTrigger {
    Button { button: u8 },
    Axis { axis: u8, direction: AxisDirection },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResponseCurve {
    Linear,
    Exponential { factor: f32 },
    Digital { threshold: f32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArcadeAction {
    CoinInsert,
    InsertCoin,
    StartGame,
    PauseMenu,
    ExitGame,
    NavigateUp,
    NavigateDown,
    NavigateLeft,
    NavigateRight,
    Confirm,
    Back,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoyMapping {
    pub trigger: JoyTrigger,
    pub action: MappedAction,
    pub hold_ms: Option<u64>,
    pub repeat_ms: Option<u64>,
}

/// A complete profile for a specific system or game
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoyProfile {
    pub name: String,
    pub deadzone: f32,
    pub anti_deadzone: f32,
    pub curve: ResponseCurve,
    pub mappings: Vec<JoyMapping>,
}

#[derive(Debug, Clone)]
pub struct RecordingState {
    pub target_action: MappedAction,
    pub detected_trigger: Option<JoyTrigger>,
}

/// The core engine that translates raw joystick events into actions
pub struct JoyMapper {
    active_profile: Option<JoyProfile>,
    button_states: HashMap<u8, bool>,
    axis_states: HashMap<u8, f32>,
    press_times: HashMap<JoyTrigger, Instant>,
    last_repeat: HashMap<JoyTrigger, Instant>,
    pub recording: Option<RecordingState>,
}

impl JoyMapper {
    pub fn new() -> Self {
        Self {
            active_profile: None,
            button_states: HashMap::new(),
            axis_states: HashMap::new(),
            press_times: HashMap::new(),
            last_repeat: HashMap::new(),
            recording: None,
        }
    }

    pub fn set_profile(&mut self, profile: JoyProfile) {
        info!("Loading JoyMapper profile: {}", profile.name);
        self.active_profile = Some(profile);
        self.press_times.clear();
        self.last_repeat.clear();
    }

    pub fn get_active_profile(&self) -> Option<&JoyProfile> {
        self.active_profile.as_ref()
    }

    pub fn load_profile_from_file(&mut self, path: &Path) -> Result<(), String> {
        let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        let profile: JoyProfile = serde_yaml::from_str(&content).map_err(|e| e.to_string())?;
        self.set_profile(profile);
        Ok(())
    }

    pub fn start_recording(&mut self, action: MappedAction) {
        info!("JoyMapper recording started for action: {:?}", action);
        self.recording = Some(RecordingState {
            target_action: action,
            detected_trigger: None,
        });
    }

    pub fn get_recorded_trigger(&self) -> Option<JoyTrigger> {
        self.recording.as_ref().and_then(|r| r.detected_trigger.clone())
    }

    /// Process a button event and return potential actions to execute
    pub fn handle_button(&mut self, button: u8, pressed: bool) -> Vec<MappedAction> {
        self.button_states.insert(button, pressed);
        let trigger = JoyTrigger::Button { button };
        
        if pressed {
            if let Some(recording) = &mut self.recording {
                info!("Recorded trigger: {:?}", trigger);
                recording.detected_trigger = Some(trigger.clone());
                return Vec::new(); // Don't execute action while recording
            }
        }

        self.process_trigger(trigger, pressed)
    }

    /// Process an axis event
    pub fn handle_axis(&mut self, axis: u8, value: f32) -> Vec<MappedAction> {
        let (deadzone, anti_deadzone, curve) = match &self.active_profile {
            Some(p) => (p.deadzone, p.anti_deadzone, p.curve.clone()),
            None => (0.15, 0.0, ResponseCurve::Linear),
        };

        let mut actions = Vec::new();
        let old_val = self.axis_states.get(&axis).cloned().unwrap_or(0.0);
        
        // Apply deadzone and curve
        let processed_value = self.apply_axis_transform(value, deadzone, anti_deadzone, &curve);
        self.axis_states.insert(axis, processed_value);

        // Threshold for triggering digital actions (like keys)
        let digital_threshold = 0.5;

        // Check positive direction
        let pos_trigger = JoyTrigger::Axis { axis, direction: AxisDirection::Positive };
        if processed_value > digital_threshold && old_val <= digital_threshold {
            if let Some(recording) = &mut self.recording {
                recording.detected_trigger = Some(pos_trigger.clone());
                return Vec::new();
            }
            actions.extend(self.process_trigger(pos_trigger, true));
        } else if processed_value <= digital_threshold && old_val > digital_threshold {
            actions.extend(self.process_trigger(pos_trigger, false));
        }

        // Check negative direction
        let neg_trigger = JoyTrigger::Axis { axis, direction: AxisDirection::Negative };
        if processed_value < -digital_threshold && old_val >= -digital_threshold {
            if let Some(recording) = &mut self.recording {
                recording.detected_trigger = Some(neg_trigger.clone());
                return Vec::new();
            }
            actions.extend(self.process_trigger(neg_trigger, true));
        } else if processed_value >= -digital_threshold && old_val < -digital_threshold {
            actions.extend(self.process_trigger(neg_trigger, false));
        }

        actions
    }

    fn apply_axis_transform(&self, value: f32, dz: f32, adz: f32, curve: &ResponseCurve) -> f32 {
        let abs_val = value.abs();
        
        // 1. Deadzone
        if abs_val < dz {
            return 0.0;
        }

        // 2. Normalize after deadzone
        let mut norm = (abs_val - dz) / (1.0 - dz);

        // 3. Apply Curve
        match curve {
            ResponseCurve::Exponential { factor } => {
                norm = norm.powf(*factor);
            }
            ResponseCurve::Digital { threshold } => {
                norm = if norm >= *threshold { 1.0 } else { 0.0 };
            }
            _ => {} // Linear
        }

        // 4. Anti-deadzone (jump the game's initial deadzone)
        if norm > 0.0 {
            norm = adz + (norm * (1.0 - adz));
        }

        if value >= 0.0 { norm } else { -norm }
    }

    fn process_trigger(&mut self, trigger: JoyTrigger, pressed: bool) -> Vec<MappedAction> {
        let mut actions = Vec::new();
        let now = Instant::now();

        if pressed {
            self.press_times.insert(trigger.clone(), now);
        } else {
            self.press_times.remove(&trigger);
            self.last_repeat.remove(&trigger);
        }

        if let Some(profile) = &self.active_profile {
            for mapping in &profile.mappings {
                if mapping.trigger == trigger {
                    if pressed {
                        if mapping.hold_ms.is_none() {
                            actions.push(mapping.action.clone());
                        }
                    } else {
                        // On release, we don't usually fire unless we implement "on release" actions
                    }
                }
            }
        }

        actions
    }

    /// Update loop to handle hold/repeat logic
    pub fn update(&mut self) -> Vec<MappedAction> {
        let mut actions = Vec::new();
        let now = Instant::now();

        if let Some(profile) = &self.active_profile {
            for mapping in &profile.mappings {
                if let Some(press_time) = self.press_times.get(&mapping.trigger) {
                    let elapsed = now.duration_since(*press_time).as_millis() as u64;

                    // Handle Hold
                    if let Some(hold_ms) = mapping.hold_ms {
                        let already_fired = self.last_repeat.contains_key(&mapping.trigger);
                        if elapsed >= hold_ms && !already_fired {
                            actions.push(mapping.action.clone());
                            self.last_repeat.insert(mapping.trigger.clone(), now);
                        }
                    }

                    // Handle Repeat
                    if let Some(repeat_ms) = mapping.repeat_ms {
                        let last = self.last_repeat.get(&mapping.trigger).cloned().unwrap_or(*press_time);
                        if now.duration_since(last).as_millis() as u64 >= repeat_ms {
                            actions.push(mapping.action.clone());
                            self.last_repeat.insert(mapping.trigger.clone(), now);
                        }
                    }
                }
            }
        }

        actions
    }
}

/// Trait for platform-specific key injection
pub trait KeyInjector: Send + Sync {
    fn press_key(&self, key: &str);
    fn release_key(&self, key: &str);
    fn type_key(&self, key: &str) {
        self.press_key(key);
        self.release_key(key);
    }
}

/// Windows implementation using SendInput (Works on XP through 11)
#[cfg(target_os = "windows")]
pub struct WindowsInjector;

#[cfg(target_os = "windows")]
impl KeyInjector for WindowsInjector {
    fn press_key(&self, key: &str) {
        use winapi::um::winuser::{SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_SCANCODE};
        let vk = self.str_to_vk(key);
        unsafe {
            let mut input = INPUT {
                type_: INPUT_KEYBOARD,
                u: std::mem::zeroed(),
            };
            *input.u.ki_mut() = KEYBDINPUT {
                wVk: vk,
                wScan: 0,
                dwFlags: 0,
                time: 0,
                dwExtraInfo: 0,
            };
            SendInput(1, &mut input, std::mem::size_of::<INPUT>() as i32);
        }
    }

    fn release_key(&self, key: &str) {
        use winapi::um::winuser::{SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP};
        let vk = self.str_to_vk(key);
        unsafe {
            let mut input = INPUT {
                type_: INPUT_KEYBOARD,
                u: std::mem::zeroed(),
            };
            *input.u.ki_mut() = KEYBDINPUT {
                wVk: vk,
                wScan: 0,
                dwFlags: KEYEVENTF_KEYUP,
                time: 0,
                dwExtraInfo: 0,
            };
            SendInput(1, &mut input, std::mem::size_of::<INPUT>() as i32);
        }
    }
}

#[cfg(target_os = "windows")]
impl WindowsInjector {
    fn str_to_vk(&self, key: &str) -> u16 {
        use winapi::um::winuser::*;
        match key.to_uppercase().as_str() {
            "A" => 0x41, "B" => 0x42, "C" => 0x43, "D" => 0x44, "E" => 0x45,
            "F" => 0x46, "G" => 0x47, "H" => 0x48, "I" => 0x49, "J" => 0x4A,
            "K" => 0x4B, "L" => 0x4C, "M" => 0x4D, "N" => 0x4E, "O" => 0x4F,
            "P" => 0x50, "Q" => 0x51, "R" => 0x52, "S" => 0x53, "T" => 0x54,
            "U" => 0x55, "V" => 0x56, "W" => 0x57, "X" => 0x58, "Y" => 0x59,
            "Z" => 0x5A,
            "SPACE" => VK_SPACE as u16,
            "ENTER" | "RETURN" => VK_RETURN as u16,
            "ESCAPE" | "ESC" => VK_ESCAPE as u16,
            "UP" => VK_UP as u16,
            "DOWN" => VK_DOWN as u16,
            "LEFT" => VK_LEFT as u16,
            "RIGHT" => VK_RIGHT as u16,
            "LCTRL" | "CTRL" => VK_LCONTROL as u16,
            "RCTRL" => VK_RCONTROL as u16,
            "LALT" | "ALT" => VK_LMENU as u16,
            "RALT" => VK_RMENU as u16,
            "LSHIFT" | "SHIFT" => VK_LSHIFT as u16,
            "RSHIFT" => VK_RSHIFT as u16,
            "TAB" => VK_TAB as u16,
            "F1" => VK_F1 as u16, "F2" => VK_F2 as u16, "F3" => VK_F3 as u16,
            "F4" => VK_F4 as u16, "F5" => VK_F5 as u16, "F6" => VK_F6 as u16,
            "F7" => VK_F7 as u16, "F8" => VK_F8 as u16, "F9" => VK_F9 as u16,
            "F10" => VK_F10 as u16, "F11" => VK_F11 as u16, "F12" => VK_F12 as u16,
            _ => 0,
        }
    }
}

/// Linux implementation using uinput
#[cfg(target_os = "linux")]
pub struct LinuxInjector {
    uinput: std::fs::File,
}

#[cfg(target_os = "linux")]
impl LinuxInjector {
    pub fn new() -> std::io::Result<Self> {
        use std::fs::OpenOptions;
        let file = OpenOptions::new().write(true).open("/dev/uinput")?;
        Ok(Self { uinput: file })
    }
}

#[cfg(target_os = "linux")]
impl KeyInjector for LinuxInjector {
    fn press_key(&self, key: &str) {
        // Implementation for uinput write events (EV_KEY, code, 1)
        debug!("Linux Injector: Pressing {}", key);
    }

    fn release_key(&self, key: &str) {
        // Implementation for uinput write events (EV_KEY, code, 0)
        debug!("Linux Injector: Releasing {}", key);
    }
}

/// Fallback injector for Linux when /dev/uinput is not accessible
#[cfg(target_os = "linux")]
pub struct LinuxInjectorStub;

#[cfg(target_os = "linux")]
impl KeyInjector for LinuxInjectorStub {
    fn press_key(&self, key: &str) { debug!("Linux Stub: Pressing {}", key); }
    fn release_key(&self, key: &str) { debug!("Linux Stub: Releasing {}", key); }
}

/// Fallback injector for unsupported platforms
pub struct StubInjector;

impl KeyInjector for StubInjector {
    fn press_key(&self, key: &str) { debug!("Stub Injector: Pressing {}", key); }
    fn release_key(&self, key: &str) { debug!("Stub Injector: Releasing {}", key); }
}
