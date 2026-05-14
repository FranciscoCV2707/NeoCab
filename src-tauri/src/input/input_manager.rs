use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use tracing::info;
use crate::error::Result;
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum InputButton {
    Up,
    Down,
    Left,
    Right,
    A,
    B,
    X,
    Y,
    L1,
    L2,
    R1,
    R2,
    Start,
    Select,
    LeftStick,
    RightStick,
    Guide,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AxisInput {
    LeftStickX(f32),
    LeftStickY(f32),
    RightStickX(f32),
    RightStickY(f32),
    TriggerL(f32),
    TriggerR(f32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputEvent {
    pub device_id: u32,
    pub input: InputEventType,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InputEventType {
    ButtonPressed(InputButton),
    ButtonReleased(InputButton),
    AxisMoved(AxisInput),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputDevice {
    pub id: u32,
    pub name: String,
    pub device_type: String,
    pub vendor_id: Option<u16>,
    pub product_id: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputMapping {
    pub device_id: u32,
    pub button: InputButton,
    pub mapped_to: String, // Action name like "coin", "start_game", etc
}

pub struct InputManager {
    devices: Arc<RwLock<HashMap<u32, InputDevice>>>,
    mappings: Arc<RwLock<Vec<InputMapping>>>,
    enabled: Arc<RwLock<bool>>,
    deadzone: Arc<RwLock<f32>>,
    pub joy_mapper: Arc<RwLock<crate::input::joy_mapper::JoyMapper>>,
    injector: Arc<Box<dyn crate::input::joy_mapper::KeyInjector>>,
}

impl InputManager {
    pub fn new() -> Self {
        #[cfg(target_os = "windows")]
        let injector: Box<dyn crate::input::joy_mapper::KeyInjector> = Box::new(crate::input::joy_mapper::WindowsInjector);
        
        #[cfg(target_os = "linux")]
        let injector: Box<dyn crate::input::joy_mapper::KeyInjector> = match crate::input::joy_mapper::LinuxInjector::new() {
            Ok(i) => Box::new(i),
            Err(_) => Box::new(crate::input::joy_mapper::LinuxInjectorStub), // Fallback if uinput fails
        };

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        let injector: Box<dyn crate::input::joy_mapper::KeyInjector> = Box::new(crate::input::joy_mapper::StubInjector);

        Self {
            devices: Arc::new(RwLock::new(HashMap::new())),
            mappings: Arc::new(RwLock::new(Vec::new())),
            enabled: Arc::new(RwLock::new(true)),
            deadzone: Arc::new(RwLock::new(0.1)),
            joy_mapper: Arc::new(RwLock::new(crate::input::joy_mapper::JoyMapper::new())),
            injector: Arc::new(injector),
        }
    }

    pub async fn register_device(&self, device: InputDevice) -> Result<()> {
        let mut devices = self.devices.write().await;
        devices.insert(device.id, device.clone());
        info!("Input device registered: {:?}", device);
        Ok(())
    }

    pub async fn unregister_device(&self, device_id: u32) -> Result<()> {
        let mut devices = self.devices.write().await;
        devices.remove(&device_id);

        // Remove mappings for this device
        let mut mappings = self.mappings.write().await;
        mappings.retain(|m| m.device_id != device_id);

        info!("Input device unregistered: {}", device_id);
        Ok(())
    }

    pub async fn get_devices(&self) -> Result<Vec<InputDevice>> {
        let devices = self.devices.read().await;
        Ok(devices.values().cloned().collect())
    }

    pub async fn add_mapping(&self, mapping: InputMapping) -> Result<()> {
        let mut mappings = self.mappings.write().await;
        mappings.push(mapping.clone());
        info!(
            "Input mapping added: device {} -> {} maps to {}",
            mapping.device_id, mapping.button as u32, mapping.mapped_to
        );
        Ok(())
    }

    pub async fn get_mappings(&self, device_id: u32) -> Result<Vec<InputMapping>> {
        let mappings = self.mappings.read().await;
        Ok(mappings
            .iter()
            .filter(|m| m.device_id == device_id)
            .cloned()
            .collect())
    }

    pub async fn clear_mappings(&self, device_id: u32) -> Result<()> {
        let mut mappings = self.mappings.write().await;
        mappings.retain(|m| m.device_id != device_id);
        info!("Mappings cleared for device: {}", device_id);
        Ok(())
    }

    pub async fn set_deadzone(&self, deadzone: f32) -> Result<()> {
        if deadzone < 0.0 || deadzone > 1.0 {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Deadzone must be between 0.0 and 1.0".to_string(),
            ));
        }
        let mut dz = self.deadzone.write().await;
        *dz = deadzone;
        info!("Input deadzone set to: {}", deadzone);
        Ok(())
    }

    pub async fn load_profile_for_system(&self, system: &str) -> Result<()> {
        let mut mapper = self.joy_mapper.write().await;
        let profile_path = std::path::PathBuf::from(format!("config/joy_profiles/{}.yml", system));
        
        if profile_path.exists() {
            mapper.load_profile_from_file(&profile_path)
                .map_err(|e| crate::error::NeoCabError::Config(e))?;
            
            info!("Auto-loaded JoyMapper profile for system: {}", system);
        } else {
            info!("No specific JoyMapper profile found for system: {}. Using default.", system);
        }
        Ok(())
    }

    pub async fn get_deadzone(&self) -> f32 {
        *self.deadzone.read().await
    }

    pub async fn set_enabled(&self, enabled: bool) -> Result<()> {
        let mut e = self.enabled.write().await;
        *e = enabled;
        info!("Input system enabled: {}", enabled);
        Ok(())
    }

    pub async fn is_enabled(&self) -> bool {
        *self.enabled.read().await
    }

    pub fn apply_deadzone(&self, value: f32, deadzone: f32) -> f32 {
        if value.abs() < deadzone {
            0.0
        } else {
            // Linear deadzone scaling
            let scaled = (value.abs() - deadzone) / (1.0 - deadzone);
            if value >= 0.0 {
                scaled
            } else {
                -scaled
            }
        }
    }

    pub async fn handle_event(&self, event: InputEvent) -> Result<Option<String>> {
        if !self.is_enabled().await {
            return Ok(None);
        }

        let mut mapper = self.joy_mapper.write().await;
        let mut actions = Vec::new();

        // Pass to JoyMapper
        match event.input {
            InputEventType::ButtonPressed(button) => {
                // Convert InputButton to raw index or mapping
                let btn_idx = self.button_to_index(button);
                actions.extend(mapper.handle_button(btn_idx, true));
            }
            InputEventType::ButtonReleased(button) => {
                let btn_idx = self.button_to_index(button);
                actions.extend(mapper.handle_button(btn_idx, false));
            }
            InputEventType::AxisMoved(axis) => {
                match axis {
                    AxisInput::LeftStickX(x) => actions.extend(mapper.handle_axis(0, x)),
                    AxisInput::LeftStickY(y) => actions.extend(mapper.handle_axis(1, y)),
                    _ => {}
                }
            }
        }

        // Execute mapped actions (Key injection)
        self.execute_actions(actions).await;

        // Update virtual Xbox controller if active
        // Fallback to original NeoCab internal mapping logic
        match event.input {
            InputEventType::ButtonPressed(button) => {
                let mappings = self.mappings.read().await;
                let mapping = mappings.iter().find(|m| {
                    m.device_id == event.device_id && m.button == button
                });

                if let Some(m) = mapping {
                    info!("Input action triggered: {}", m.mapped_to);
                    Ok(Some(m.mapped_to.clone()))
                } else {
                    Ok(None)
                }
            }
            InputEventType::AxisMoved(axis) => {
                // Handle analog inputs (sticks, triggers)
                let deadzone = self.get_deadzone().await;
                match axis {
                    AxisInput::LeftStickX(x) => {
                        let adjusted = self.apply_deadzone(x, deadzone);
                        if adjusted.abs() > 0.5 {
                            let action = if adjusted > 0.0 { "right" } else { "left" };
                            Ok(Some(action.to_string()))
                        } else {
                            Ok(None)
                        }
                    }
                    AxisInput::LeftStickY(y) => {
                        let adjusted = self.apply_deadzone(y, deadzone);
                        if adjusted.abs() > 0.5 {
                            let action = if adjusted > 0.0 { "down" } else { "up" };
                            Ok(Some(action.to_string()))
                        } else {
                            Ok(None)
                        }
                    }
                    _ => Ok(None),
                }
            }
            _ => Ok(None),
        }
    }

    fn button_to_index(&self, button: InputButton) -> u8 {
        match button {
            InputButton::A => 0, InputButton::B => 1, InputButton::X => 2, InputButton::Y => 3,
            InputButton::L1 => 4, InputButton::R1 => 5, InputButton::Select => 6, InputButton::Start => 7,
            _ => 99,
        }
    }

    async fn execute_actions(&self, actions: Vec<crate::input::joy_mapper::MappedAction>) {
        for action in actions {
            self.execute_single_action(action).await;
        }
    }

    #[async_recursion::async_recursion]
    async fn execute_single_action(&self, action: crate::input::joy_mapper::MappedAction) {
        match action {
            crate::input::joy_mapper::MappedAction::Key(k) => {
                self.injector.type_key(&k);
                info!("Injected key: {}", k);
            }
            crate::input::joy_mapper::MappedAction::Keys(keys) => {
                for k in &keys { self.injector.press_key(k); }
                for k in keys.iter().rev() { self.injector.release_key(k); }
                info!("Injected combo: {:?}", keys);
            }
            crate::input::joy_mapper::MappedAction::Macro(steps) => {
                info!("Executing macro with {} steps", steps.len());
                for step in steps {
                    self.execute_single_action(step.action).await;
                    if step.delay_ms > 0 {
                        tokio::time::sleep(tokio::time::Duration::from_millis(step.delay_ms)).await;
                    }
                }
            }
            crate::input::joy_mapper::MappedAction::ArcadeAction(arcade_action) => {
                info!("Triggered Arcade Action: {:?}", arcade_action);
                // Implementation for internal actions...
            }
            crate::input::joy_mapper::MappedAction::MouseButton(btn) => {
                // Future mouse implementation
            }
            _ => {}
        }
    }
}

impl Default for InputManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_input_manager_creation() {
        let im = InputManager::new();
        assert!(im.is_enabled().await);
        assert_eq!(im.get_deadzone().await, 0.1);
    }

    #[tokio::test]
    async fn test_register_device() {
        let im = InputManager::new();
        let device = InputDevice {
            id: 1,
            name: "Controller 1".to_string(),
            device_type: "gamepad".to_string(),
            vendor_id: None,
            product_id: None,
        };

        im.register_device(device).await.unwrap();
        let devices = im.get_devices().await.unwrap();
        assert_eq!(devices.len(), 1);
    }

    #[test]
    fn test_deadzone_calculation() {
        let im = InputManager::new();
        assert_eq!(im.apply_deadzone(0.05, 0.1), 0.0);
        assert_eq!(im.apply_deadzone(0.5, 0.1).round(), 0.4);
    }
}
