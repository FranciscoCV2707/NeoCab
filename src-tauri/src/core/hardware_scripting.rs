use crate::core::arduino_serial::ArduinoInterface;
use crate::error::{NeoCabError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tracing::{info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HardwareEvent {
    GameLaunched,
    GameStopped,
    CoinInserted,
    MenuNavigated,
    SystemSelected,
    AttractModeStarted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HardwareAction {
    TriggerSolenoid {
        output_id: u8,
        duration_ms: u32,
    },
    SetLED {
        pin: u8,
        color_hex: Option<String>,
        state: bool,
    },
    PlaySound {
        sound_id: u8,
    },
    BlinkLED {
        pin: u8,
        times: u32,
        interval_ms: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareScript {
    pub name: String,
    pub description: Option<String>,
    pub bindings: HashMap<String, Vec<HardwareAction>>,
}

pub struct HardwareScriptEngine {
    script: Option<HardwareScript>,
    arduino: Option<std::sync::Arc<tokio::sync::Mutex<ArduinoInterface>>>,
}

impl Default for HardwareScriptEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl HardwareScriptEngine {
    pub fn new() -> Self {
        Self {
            script: None,
            arduino: None,
        }
    }

    pub fn set_arduino(&mut self, arduino: std::sync::Arc<tokio::sync::Mutex<ArduinoInterface>>) {
        self.arduino = Some(arduino);
    }

    pub fn load_script(&mut self, path: &Path) -> Result<()> {
        if !path.exists() {
            return Err(NeoCabError::Config(format!("Script not found: {:?}", path)));
        }

        let content = fs::read_to_string(path)?;
        let script: HardwareScript = serde_json::from_str(&content)
            .map_err(|e| NeoCabError::Config(format!("Invalid script format: {}", e)))?;

        info!("Loaded hardware script: {}", script.name);
        self.script = Some(script);
        Ok(())
    }

    pub async fn trigger_event(&self, event: HardwareEvent) -> Result<()> {
        let script = match &self.script {
            Some(s) => s,
            None => return Ok(()),
        };

        let event_key = match event {
            HardwareEvent::GameLaunched => "on_game_launch",
            HardwareEvent::GameStopped => "on_game_stop",
            HardwareEvent::CoinInserted => "on_coin_insert",
            HardwareEvent::MenuNavigated => "on_menu_navigate",
            HardwareEvent::SystemSelected => "on_system_select",
            HardwareEvent::AttractModeStarted => "on_attract_mode",
        };

        if let Some(actions) = script.bindings.get(event_key) {
            for action in actions {
                self.execute_action(action).await?;
            }
        }

        Ok(())
    }

    async fn execute_action(&self, action: &HardwareAction) -> Result<()> {
        let arduino = match &self.arduino {
            Some(a) => a,
            None => {
                warn!("Cannot execute hardware action - Arduino not connected");
                return Ok(());
            }
        };

        let mut lock = arduino.lock().await;

        match action {
            HardwareAction::TriggerSolenoid {
                output_id,
                duration_ms: _,
            } => {
                info!("Executing TriggerSolenoid on ID {}", output_id);
                let _ = lock.trigger_solenoid(*output_id);
            }
            HardwareAction::SetLED {
                pin,
                color_hex,
                state,
            } => {
                info!("Executing SetLED on pin {} to state {}", pin, state);
                let _ = lock.set_led(*pin, color_hex.as_deref(), *state);
            }
            HardwareAction::BlinkLED {
                pin,
                times,
                interval_ms,
            } => {
                info!("Executing BlinkLED on pin {} {} times", pin, times);
                let _ = lock.blink_led(*pin, *times, *interval_ms);
            }
            HardwareAction::PlaySound { sound_id } => {
                info!("Executing Hardware PlaySound {}", sound_id);
                let _ = lock.play_sound(*sound_id);
            }
        }

        Ok(())
    }
}
