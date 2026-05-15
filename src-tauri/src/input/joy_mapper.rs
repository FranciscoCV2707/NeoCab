use std::collections::HashMap;
use std::time::Instant;
use std::path::Path;
use serde::{Deserialize, Serialize};
use tracing::{info, debug};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum MappedAction {
    Key(String),
    Keys(Vec<String>),
    Macro(Vec<MacroStep>),
    MouseButton(u8),
    MouseMove { dx: i32, dy: i32 },
    ArcadeAction(ArcadeAction),
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
    Combo { buttons: Vec<u8> },
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ResponseCurve {
    #[default]
    Linear,
    Exponential { factor: f32 },
    Digital { threshold: f32 },
    Spline { control_points: Vec<(f32, f32)> },
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
    QuickSave,
    QuickLoad,
    ToggleMenu,
    Screenshot,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoyMapping {
    pub trigger: JoyTrigger,
    pub action: MappedAction,
    pub hold_ms: Option<u64>,
    pub repeat_ms: Option<u64>,
    pub hold_action: Option<MappedAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum DeadzoneType {
    #[default]
    Linear,
    Radial,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeadzoneConfig {
    #[serde(default)]
    pub r#type: DeadzoneType,
    #[serde(default = "default_deadzone")]
    pub value: f32,
    #[serde(default)]
    pub anti_deadzone: f32,
}

fn default_deadzone() -> f32 { 0.15 }

impl Default for DeadzoneConfig {
    fn default() -> Self {
        Self {
            r#type: DeadzoneType::Linear,
            value: 0.15,
            anti_deadzone: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerRange {
    #[serde(default)]
    pub min: f32,
    #[serde(default = "default_trigger_max")]
    pub max: f32,
}

fn default_trigger_max() -> f32 { 1.0 }

impl Default for TriggerRange {
    fn default() -> Self {
        Self { min: 0.0, max: 1.0 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StickDelayConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default = "default_stick_delay_ms")]
    pub delay_ms: u64,
}

fn default_stick_delay_ms() -> u64 { 50 }

impl Default for StickDelayConfig {
    fn default() -> Self {
        Self { enabled: false, delay_ms: 50 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MappingSet {
    pub name: String,
    pub toggle_button: Option<u8>,
    pub mappings: Vec<JoyMapping>,
}

impl Default for MappingSet {
    fn default() -> Self {
        Self {
            name: "default".to_string(),
            toggle_button: None,
            mappings: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoyProfile {
    pub name: String,
    #[serde(default)]
    pub deadzone: DeadzoneConfig,
    #[serde(default)]
    pub left_stick_deadzone: Option<DeadzoneConfig>,
    #[serde(default)]
    pub right_stick_deadzone: Option<DeadzoneConfig>,
    #[serde(default)]
    pub trigger_deadzone: Option<DeadzoneConfig>,
    #[serde(default)]
    pub response_curve: ResponseCurve,
    #[serde(default)]
    pub left_stick_curve: Option<ResponseCurve>,
    #[serde(default)]
    pub right_stick_curve: Option<ResponseCurve>,
    #[serde(default)]
    pub trigger_range: Option<TriggerRange>,
    #[serde(default)]
    pub stick_delay: Option<StickDelayConfig>,
    #[serde(default)]
    pub mappings: Vec<JoyMapping>,
    #[serde(default)]
    pub sets: Vec<MappingSet>,
}

#[derive(Debug, Clone)]
pub struct RecordingState {
    pub target_action: MappedAction,
    pub detected_trigger: Option<JoyTrigger>,
}

#[derive(Clone)]
struct StickDelayState {
    last_direction_change: Instant,
    last_axis_value: f32,
    blocked: bool,
}

pub struct JoyMapper {
    active_profile: Option<JoyProfile>,
    button_states: HashMap<u8, bool>,
    axis_states: HashMap<u8, f32>,
    press_times: HashMap<JoyTrigger, Instant>,
    last_repeat: HashMap<JoyTrigger, Instant>,
    hold_fired: HashMap<JoyTrigger, bool>,
    pub recording: Option<RecordingState>,
    active_set_index: usize,
    combo_buffer: HashMap<u8, Instant>,
    stick_delay_states: HashMap<u8, StickDelayState>,
}

impl Clone for JoyMapper {
    fn clone(&self) -> Self {
        Self {
            active_profile: self.active_profile.clone(),
            button_states: self.button_states.clone(),
            axis_states: self.axis_states.clone(),
            press_times: self.press_times.clone(),
            last_repeat: self.last_repeat.clone(),
            hold_fired: self.hold_fired.clone(),
            recording: None,
            active_set_index: self.active_set_index,
            combo_buffer: self.combo_buffer.clone(),
            stick_delay_states: self.stick_delay_states.clone(),
        }
    }
}

impl JoyMapper {
    pub fn new() -> Self {
        Self {
            active_profile: None,
            button_states: HashMap::new(),
            axis_states: HashMap::new(),
            press_times: HashMap::new(),
            last_repeat: HashMap::new(),
            hold_fired: HashMap::new(),
            recording: None,
            active_set_index: 0,
            combo_buffer: HashMap::new(),
            stick_delay_states: HashMap::new(),
        }
    }

    pub fn set_profile(&mut self, profile: JoyProfile) {
        info!("Loading JoyMapper profile: {}", profile.name);
        self.active_profile = Some(profile);
        self.press_times.clear();
        self.last_repeat.clear();
        self.hold_fired.clear();
        self.active_set_index = 0;
        self.combo_buffer.clear();
        self.stick_delay_states.clear();
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

    pub fn get_active_set_name(&self) -> &str {
        let profile = match &self.active_profile {
            Some(p) => p,
            None => return "default",
        };
        if profile.sets.is_empty() {
            return "default";
        }
        &profile.sets[self.active_set_index.min(profile.sets.len() - 1)].name
    }

    pub fn switch_to_set(&mut self, set_name: &str) {
        let profile = match &mut self.active_profile {
            Some(p) => p,
            None => return,
        };
        if let Some(idx) = profile.sets.iter().position(|s| s.name == set_name) {
            self.active_set_index = idx;
            info!("Switched to mapping set: {}", set_name);
        }
    }

    pub fn cycle_set(&mut self) {
        let profile = match &mut self.active_profile {
            Some(p) => p,
            None => return,
        };
        if profile.sets.len() > 1 {
            self.active_set_index = (self.active_set_index + 1) % profile.sets.len();
            info!("Cycled to set: {}", profile.sets[self.active_set_index].name);
        }
    }

    fn get_active_mappings(&self) -> Vec<&JoyMapping> {
        let profile = match &self.active_profile {
            Some(p) => p,
            None => return Vec::new(),
        };

        if !profile.sets.is_empty() {
            let idx = self.active_set_index.min(profile.sets.len() - 1);
            profile.sets[idx].mappings.iter().collect()
        } else {
            profile.mappings.iter().collect()
        }
    }

    pub fn handle_button(&mut self, button: u8, pressed: bool) -> Vec<MappedAction> {
        let now = Instant::now();
        self.button_states.insert(button, pressed);

        if pressed {
            self.combo_buffer.insert(button, now);
            self.combo_buffer.retain(|_, t| now.duration_since(*t).as_millis() < 300);
        }

        let trigger = JoyTrigger::Button { button };

        if pressed {
            if let Some(recording) = &mut self.recording {
                info!("Recorded trigger: {:?}", trigger);
                recording.detected_trigger = Some(trigger.clone());
                return Vec::new();
            }

            if let Some(profile) = &self.active_profile {
                if !profile.sets.is_empty() {
                    for set in &profile.sets {
                        if let Some(toggle_btn) = set.toggle_button {
                            if toggle_btn == button {
                                self.cycle_set();
                                return Vec::new();
                            }
                        }
                    }
                }
            }
        }

        let mut actions = Vec::new();

        let combo_buttons: Vec<u8> = self.combo_buffer.keys().cloned().collect();
        if combo_buttons.len() > 1 && pressed {
            let mut sorted = combo_buttons.clone();
            sorted.sort();
            let combo_trigger = JoyTrigger::Combo { buttons: sorted };
            actions.extend(self.process_trigger(&combo_trigger, pressed));
        }

        actions.extend(self.process_trigger(&trigger, pressed));
        actions
    }

    pub fn handle_axis(&mut self, axis: u8, value: f32) -> Vec<MappedAction> {
        let profile = match &self.active_profile {
            Some(p) => p,
            None => {
                self.axis_states.insert(axis, value);
                return Vec::new();
            }
        };

        let is_trigger_axis = match axis {
            4 | 5 => true,
            _ => false,
        };

        let (dz_config, curve) = if is_trigger_axis {
            (
                profile.trigger_deadzone.clone().unwrap_or_else(|| DeadzoneConfig {
                    r#type: DeadzoneType::Linear,
                    value: 0.1,
                    anti_deadzone: 0.0,
                }),
                profile.response_curve.clone(),
            )
        } else if axis < 2 {
            (
                profile.left_stick_deadzone.clone().unwrap_or(profile.deadzone.clone()),
                profile.left_stick_curve.clone().unwrap_or(profile.response_curve.clone()),
            )
        } else {
            (
                profile.right_stick_deadzone.clone().unwrap_or(profile.deadzone.clone()),
                profile.right_stick_curve.clone().unwrap_or(profile.response_curve.clone()),
            )
        };

        let mut processed = value;

        if is_trigger_axis {
            if let Some(range) = &profile.trigger_range {
                processed = ((processed - range.min) / (range.max - range.min)).clamp(0.0, 1.0);
            }
        }

        let old_val = self.axis_states.get(&axis).cloned().unwrap_or(0.0);

        if let Some(stick_cfg) = &profile.stick_delay {
            if stick_cfg.enabled && !is_trigger_axis {
                let state = self.stick_delay_states.entry(axis).or_insert_with(|| StickDelayState {
                    last_direction_change: Instant::now(),
                    last_axis_value: old_val,
                    blocked: false,
                });

                let crossed_zero = (old_val > 0.0 && processed < 0.0) || (old_val < 0.0 && processed > 0.0);
                if crossed_zero {
                    state.last_direction_change = Instant::now();
                    state.blocked = true;
                }

                if state.blocked {
                    let elapsed = state.last_direction_change.elapsed().as_millis() as u64;
                    if elapsed < stick_cfg.delay_ms {
                        self.axis_states.insert(axis, processed);
                        return Vec::new();
                    }
                    state.blocked = false;
                }
                state.last_axis_value = processed;
            }
        }

        let processed_value = self.apply_axis_transform(processed, &dz_config, &curve);
        self.axis_states.insert(axis, processed_value);

        let mut actions = Vec::new();
        let digital_threshold = 0.5;

        let pos_trigger = JoyTrigger::Axis { axis, direction: AxisDirection::Positive };
        if processed_value > digital_threshold && old_val <= digital_threshold {
            if let Some(recording) = &mut self.recording {
                recording.detected_trigger = Some(pos_trigger.clone());
                return Vec::new();
            }
            actions.extend(self.process_trigger(&pos_trigger, true));
        } else if processed_value <= digital_threshold && old_val > digital_threshold {
            actions.extend(self.process_trigger(&pos_trigger, false));
        }

        let neg_trigger = JoyTrigger::Axis { axis, direction: AxisDirection::Negative };
        if processed_value < -digital_threshold && old_val >= -digital_threshold {
            if let Some(recording) = &mut self.recording {
                recording.detected_trigger = Some(neg_trigger.clone());
                return Vec::new();
            }
            actions.extend(self.process_trigger(&neg_trigger, true));
        } else if processed_value >= -digital_threshold && old_val < -digital_threshold {
            actions.extend(self.process_trigger(&neg_trigger, false));
        }

        actions
    }

    pub fn handle_radial_stick(&mut self, axis_x: u8, axis_y: u8, x: f32, y: f32) -> Vec<MappedAction> {
        let profile = match &self.active_profile {
            Some(p) => p,
            None => {
                self.axis_states.insert(axis_x, x);
                self.axis_states.insert(axis_y, y);
                return Vec::new();
            }
        };

        let dz_config = profile.left_stick_deadzone.clone().unwrap_or(profile.deadzone.clone());
        let curve = profile.left_stick_curve.clone().unwrap_or(profile.response_curve.clone());

        let magnitude = (x * x + y * y).sqrt();

        let processed_magnitude = if matches!(dz_config.r#type, DeadzoneType::Radial) {
            if magnitude < dz_config.value {
                self.axis_states.insert(axis_x, 0.0);
                self.axis_states.insert(axis_y, 0.0);
                return Vec::new();
            }
            let norm = (magnitude - dz_config.value) / (1.0 - dz_config.value);
            self.apply_curve(norm, &curve)
        } else {
            let processed_x = self.apply_axis_transform(x, &dz_config, &curve);
            let processed_y = self.apply_axis_transform(y, &dz_config, &curve);
            self.axis_states.insert(axis_x, processed_x);
            self.axis_states.insert(axis_y, processed_y);
            return self.handle_axis(axis_x, x).into_iter()
                .chain(self.handle_axis(axis_y, y))
                .collect();
        };

        let processed_magnitude = if dz_config.anti_deadzone > 0.0 {
            dz_config.anti_deadzone + (processed_magnitude * (1.0 - dz_config.anti_deadzone))
        } else {
            processed_magnitude
        };

        let angle = y.atan2(x);
        let new_x = angle.cos() * processed_magnitude;
        let new_y = angle.sin() * processed_magnitude;

        self.axis_states.insert(axis_x, new_x);
        self.axis_states.insert(axis_y, new_y);

        let mut actions = Vec::new();
        let digital_threshold = 0.5;

        if new_x.abs() > digital_threshold {
            let dir = if new_x > 0.0 { AxisDirection::Positive } else { AxisDirection::Negative };
            let trigger = JoyTrigger::Axis { axis: axis_x, direction: dir };
            actions.extend(self.process_trigger(&trigger, true));
        }
        if new_y.abs() > digital_threshold {
            let dir = if new_y > 0.0 { AxisDirection::Positive } else { AxisDirection::Negative };
            let trigger = JoyTrigger::Axis { axis: axis_y, direction: dir };
            actions.extend(self.process_trigger(&trigger, true));
        }

        actions
    }

    fn apply_axis_transform(&self, value: f32, dz: &DeadzoneConfig, curve: &ResponseCurve) -> f32 {
        let abs_val = value.abs();

        let processed = match dz.r#type {
            DeadzoneType::Radial => {
                if abs_val < dz.value {
                    return 0.0;
                }
                (abs_val - dz.value) / (1.0 - dz.value)
            }
            DeadzoneType::Linear => {
                if abs_val < dz.value {
                    return 0.0;
                }
                (abs_val - dz.value) / (1.0 - dz.value)
            }
        };

        let norm = self.apply_curve(processed, curve);

        let final_val = if dz.anti_deadzone > 0.0 && norm > 0.0 {
            dz.anti_deadzone + (norm * (1.0 - dz.anti_deadzone))
        } else {
            norm
        };

        if value >= 0.0 { final_val } else { -final_val }
    }

    fn apply_curve(&self, value: f32, curve: &ResponseCurve) -> f32 {
        match curve {
            ResponseCurve::Linear => value,
            ResponseCurve::Exponential { factor } => value.powf(*factor),
            ResponseCurve::Digital { threshold } => {
                if value >= *threshold { 1.0 } else { 0.0 }
            }
            ResponseCurve::Spline { control_points } => {
                if control_points.len() < 2 {
                    return value;
                }
                self.interpolate_spline(value, control_points)
            }
        }
    }

    fn interpolate_spline(&self, x: f32, points: &[(f32, f32)]) -> f32 {
        if x <= points[0].0 { return points[0].1; }
        if x >= points.last().unwrap().0 { return points.last().unwrap().1; }

        for i in 0..points.len() - 1 {
            if x >= points[i].0 && x <= points[i + 1].0 {
                let t = (x - points[i].0) / (points[i + 1].0 - points[i].0);
                return points[i].1 + t * (points[i + 1].1 - points[i].1);
            }
        }
        x
    }

    fn process_trigger(&mut self, trigger: &JoyTrigger, pressed: bool) -> Vec<MappedAction> {
        let mut actions = Vec::new();
        let now = Instant::now();

        if pressed {
            self.press_times.insert(trigger.clone(), now);
            self.hold_fired.insert(trigger.clone(), false);
        } else {
            let had_fired_hold = self.hold_fired.remove(trigger);

            if let Some(press_time) = self.press_times.remove(trigger) {
                let elapsed = now.duration_since(press_time).as_millis() as u64;

                if !had_fired_hold.unwrap_or(false) {
                    let mappings = self.get_active_mappings();
                    for mapping in mappings {
                        if mapping.trigger == *trigger {
                            if mapping.hold_ms.is_none() || elapsed < mapping.hold_ms.unwrap() {
                                actions.push(mapping.action.clone());
                            }
                            break;
                        }
                    }
                }
            }
            self.last_repeat.remove(trigger);
        }

        if pressed {
            let mappings = self.get_active_mappings();
            for mapping in &mappings {
                if mapping.trigger == *trigger {
                    if mapping.hold_ms.is_none() {
                        actions.push(mapping.action.clone());
                    }
                    break;
                }
            }
        }

        actions
    }

    pub fn update(&mut self) -> Vec<MappedAction> {
        let mut actions = Vec::new();
        let now = Instant::now();

        let triggers_to_check: Vec<(JoyTrigger, Option<u64>, Option<u64>, Option<MappedAction>)> = self.get_active_mappings()
            .iter()
            .filter_map(|m| {
                if self.press_times.contains_key(&m.trigger) {
                    Some((m.trigger.clone(), m.hold_ms, m.repeat_ms, m.hold_action.clone()))
                } else {
                    None
                }
            })
            .collect();

        for (trigger, hold_ms, repeat_ms, hold_action) in triggers_to_check {
            if let Some(press_time) = self.press_times.get(&trigger) {
                let elapsed = now.duration_since(*press_time).as_millis() as u64;

                if let Some(hold) = hold_ms {
                    let already_fired = self.hold_fired.get(&trigger).cloned().unwrap_or(false);
                    if elapsed >= hold && !already_fired {
                        if let Some(ref ha) = hold_action {
                            actions.push(ha.clone());
                        } else if let Some(mapping) = self.get_active_mappings().iter().find(|m| m.trigger == trigger) {
                            actions.push(mapping.action.clone());
                        }
                        self.hold_fired.insert(trigger.clone(), true);
                    }
                }

                if let Some(repeat) = repeat_ms {
                    let already_fired = self.hold_fired.get(&trigger).cloned().unwrap_or(false);
                    if already_fired {
                        let last = self.last_repeat.get(&trigger).cloned().unwrap_or(*press_time);
                        if now.duration_since(last).as_millis() as u64 >= repeat {
                            if let Some(mapping) = self.get_active_mappings().iter().find(|m| m.trigger == trigger) {
                                actions.push(mapping.action.clone());
                            }
                            self.last_repeat.insert(trigger.clone(), now);
                        }
                    }
                }
            }
        }

        actions
    }

    pub fn get_axis_state(&self, axis: u8) -> f32 {
        self.axis_states.get(&axis).cloned().unwrap_or(0.0)
    }

    pub fn is_button_pressed(&self, button: u8) -> bool {
        self.button_states.get(&button).cloned().unwrap_or(false)
    }

    pub fn get_all_button_states(&self) -> &HashMap<u8, bool> {
        &self.button_states
    }

    pub fn get_all_axis_states(&self) -> &HashMap<u8, f32> {
        &self.axis_states
    }

    pub fn create_default_profile(name: &str, template: &str) -> JoyProfile {
        match template {
            "arcade_stick" => Self::arcade_stick_profile(name),
            "snes_pad" => Self::snes_pad_profile(name),
            "xbox_controller" => Self::xbox_controller_profile(name),
            "playstation_controller" => Self::playstation_controller_profile(name),
            "flight_stick" => Self::flight_stick_profile(name),
            "racing_wheel" => Self::racing_wheel_profile(name),
            _ => Self::generic_profile(name),
        }
    }

    fn generic_profile(name: &str) -> JoyProfile {
        JoyProfile {
            name: name.to_string(),
            deadzone: DeadzoneConfig::default(),
            left_stick_deadzone: None,
            right_stick_deadzone: None,
            trigger_deadzone: None,
            response_curve: ResponseCurve::Linear,
            left_stick_curve: None,
            right_stick_curve: None,
            trigger_range: None,
            stick_delay: None,
            mappings: vec![
                JoyMapping { trigger: JoyTrigger::Button { button: 0 }, action: MappedAction::Key("Enter".to_string()), hold_ms: None, repeat_ms: None, hold_action: None },
                JoyMapping { trigger: JoyTrigger::Button { button: 1 }, action: MappedAction::Key("Escape".to_string()), hold_ms: None, repeat_ms: None, hold_action: None },
                JoyMapping { trigger: JoyTrigger::Button { button: 7 }, action: MappedAction::ArcadeAction(ArcadeAction::StartGame), hold_ms: None, repeat_ms: None, hold_action: None },
                JoyMapping { trigger: JoyTrigger::Button { button: 6 }, action: MappedAction::ArcadeAction(ArcadeAction::InsertCoin), hold_ms: None, repeat_ms: None, hold_action: None },
            ],
            sets: Vec::new(),
        }
    }

    fn arcade_stick_profile(name: &str) -> JoyProfile {
        let mut profile = Self::generic_profile(name);
        profile.deadzone = DeadzoneConfig { r#type: DeadzoneType::Radial, value: 0.1, anti_deadzone: 0.0 };
        profile.response_curve = ResponseCurve::Digital { threshold: 0.7 };
        profile
    }

    fn snes_pad_profile(name: &str) -> JoyProfile {
        let mut profile = Self::generic_profile(name);
        profile.deadzone = DeadzoneConfig { r#type: DeadzoneType::Linear, value: 0.2, anti_deadzone: 0.0 };
        profile.response_curve = ResponseCurve::Digital { threshold: 0.6 };
        profile
    }

    fn xbox_controller_profile(name: &str) -> JoyProfile {
        let mut profile = Self::generic_profile(name);
        profile.left_stick_deadzone = Some(DeadzoneConfig { r#type: DeadzoneType::Radial, value: 0.15, anti_deadzone: 0.0 });
        profile.right_stick_deadzone = Some(DeadzoneConfig { r#type: DeadzoneType::Radial, value: 0.15, anti_deadzone: 0.0 });
        profile.trigger_deadzone = Some(DeadzoneConfig { r#type: DeadzoneType::Linear, value: 0.1, anti_deadzone: 0.0 });
        profile.left_stick_curve = Some(ResponseCurve::Exponential { factor: 2.0 });
        profile.right_stick_curve = Some(ResponseCurve::Exponential { factor: 2.0 });
        profile.trigger_range = Some(TriggerRange { min: 0.05, max: 1.0 });

        let shift_set = MappingSet {
            name: "shift".to_string(),
            toggle_button: Some(5),
            mappings: vec![
                JoyMapping { trigger: JoyTrigger::Button { button: 0 }, action: MappedAction::ArcadeAction(ArcadeAction::QuickSave), hold_ms: None, repeat_ms: None, hold_action: None },
                JoyMapping { trigger: JoyTrigger::Button { button: 1 }, action: MappedAction::ArcadeAction(ArcadeAction::QuickLoad), hold_ms: None, repeat_ms: None, hold_action: None },
            ],
        };
        profile.sets.push(shift_set);
        profile
    }

    fn playstation_controller_profile(name: &str) -> JoyProfile {
        let mut profile = Self::xbox_controller_profile(name);
        profile.name = name.to_string();
        profile
    }

    fn flight_stick_profile(name: &str) -> JoyProfile {
        JoyProfile {
            name: name.to_string(),
            deadzone: DeadzoneConfig { r#type: DeadzoneType::Radial, value: 0.1, anti_deadzone: 0.05 },
            left_stick_deadzone: None,
            right_stick_deadzone: None,
            trigger_deadzone: Some(DeadzoneConfig { r#type: DeadzoneType::Linear, value: 0.05, anti_deadzone: 0.0 }),
            response_curve: ResponseCurve::Exponential { factor: 1.5 },
            left_stick_curve: None,
            right_stick_curve: None,
            trigger_range: Some(TriggerRange { min: 0.0, max: 1.0 }),
            stick_delay: Some(StickDelayConfig { enabled: true, delay_ms: 30 }),
            mappings: vec![
                JoyMapping { trigger: JoyTrigger::Button { button: 0 }, action: MappedAction::Key("Space".to_string()), hold_ms: None, repeat_ms: None, hold_action: None },
                JoyMapping { trigger: JoyTrigger::Button { button: 1 }, action: MappedAction::Key("LShift".to_string()), hold_ms: None, repeat_ms: None, hold_action: None },
            ],
            sets: Vec::new(),
        }
    }

    fn racing_wheel_profile(name: &str) -> JoyProfile {
        JoyProfile {
            name: name.to_string(),
            deadzone: DeadzoneConfig { r#type: DeadzoneType::Radial, value: 0.05, anti_deadzone: 0.1 },
            left_stick_deadzone: None,
            right_stick_deadzone: None,
            trigger_deadzone: Some(DeadzoneConfig { r#type: DeadzoneType::Linear, value: 0.05, anti_deadzone: 0.0 }),
            response_curve: ResponseCurve::Linear,
            left_stick_curve: None,
            right_stick_curve: None,
            trigger_range: Some(TriggerRange { min: 0.0, max: 1.0 }),
            stick_delay: Some(StickDelayConfig { enabled: false, delay_ms: 0 }),
            mappings: vec![
                JoyMapping { trigger: JoyTrigger::Button { button: 0 }, action: MappedAction::Key("Enter".to_string()), hold_ms: None, repeat_ms: None, hold_action: None },
                JoyMapping { trigger: JoyTrigger::Button { button: 1 }, action: MappedAction::Key("Escape".to_string()), hold_ms: None, repeat_ms: None, hold_action: None },
            ],
            sets: Vec::new(),
        }
    }

    pub fn import_antimicrox_profile(xml_content: &str) -> Result<JoyProfile, String> {
        let mut profile = JoyProfile {
            name: "Imported AntiMicroX".to_string(),
            deadzone: DeadzoneConfig::default(),
            left_stick_deadzone: None,
            right_stick_deadzone: None,
            trigger_deadzone: None,
            response_curve: ResponseCurve::Linear,
            left_stick_curve: None,
            right_stick_curve: None,
            trigger_range: None,
            stick_delay: None,
            mappings: Vec::new(),
            sets: Vec::new(),
        };

        let mut current_button: Option<u8> = None;

        for line in xml_content.lines() {
            let trimmed = line.trim();

            if trimmed.starts_with("<button") {
                for part in trimmed.split_whitespace() {
                    if part.starts_with("index=\"") {
                        if let Some(val) = part.split('"').nth(1) {
                            if let Ok(idx) = val.parse::<u8>() {
                                current_button = Some(idx);
                            }
                        }
                    }
                }
            } else if trimmed.starts_with("<action>") && trimmed.ends_with("</action>") {
                if let Some(action) = trimmed.strip_prefix("<action>").and_then(|s| s.strip_suffix("</action>")) {
                    if let Some(btn) = current_button {
                        profile.mappings.push(JoyMapping {
                            trigger: JoyTrigger::Button { button: btn },
                            action: MappedAction::Key(action.to_string()),
                            hold_ms: None,
                            repeat_ms: None,
                            hold_action: None,
                        });
                    }
                    current_button = None;
                }
            } else if trimmed.starts_with("<deadZone>") && trimmed.ends_with("</deadZone>") {
                if let Some(val) = trimmed.strip_prefix("<deadZone>").and_then(|s| s.strip_suffix("</deadZone>")) {
                    if let Ok(dz) = val.parse::<f32>() {
                        profile.deadzone.value = dz / 100.0;
                    }
                }
            } else if trimmed.starts_with("</button>") {
                current_button = None;
            }
        }

        info!("Imported AntiMicroX profile with {} mappings", profile.mappings.len());
        Ok(profile)
    }
}

pub trait KeyInjector: Send + Sync {
    fn press_key(&self, key: &str);
    fn release_key(&self, key: &str);
    fn type_key(&self, key: &str) {
        self.press_key(key);
        self.release_key(key);
    }
}

#[cfg(target_os = "windows")]
pub struct WindowsInjector;

#[cfg(target_os = "windows")]
impl KeyInjector for WindowsInjector {
    fn press_key(&self, key: &str) {
        use winapi::um::winuser::{SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT};
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
    fn press_key(&self, key: &str) { debug!("Linux Injector: Pressing {}", key); }
    fn release_key(&self, key: &str) { debug!("Linux Injector: Releasing {}", key); }
}

#[cfg(target_os = "linux")]
pub struct LinuxInjectorStub;

#[cfg(target_os = "linux")]
impl KeyInjector for LinuxInjectorStub {
    fn press_key(&self, key: &str) { debug!("Linux Stub: Pressing {}", key); }
    fn release_key(&self, key: &str) { debug!("Linux Stub: Releasing {}", key); }
}

pub struct StubInjector;

impl KeyInjector for StubInjector {
    fn press_key(&self, key: &str) { debug!("Stub Injector: Pressing {}", key); }
    fn release_key(&self, key: &str) { debug!("Stub Injector: Releasing {}", key); }
}
