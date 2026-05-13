#[cfg(feature = "legacy-ui")]
use sdl2::joystick::Joystick;

use crate::Result;
use super::InputEvent;

/// Joystick input handler for legacy mode
pub struct JoystickInput {
    device_count: usize,
    deadzone: i16,
    prev_state: [bool; 8],
}

impl JoystickInput {
    pub fn new() -> Result<Self> {
        #[cfg(feature = "legacy-ui")]
        {
            let sdl_context = sdl2::init()
                .map_err(|e| crate::error::NeoCabError::Legacy(format!("SDL2 init failed: {}", e)))?;

            let _joystick_subsystem = sdl_context.joystick()
                .map_err(|e| crate::error::NeoCabError::Legacy(format!("Joystick subsystem failed: {}", e)))?;

            let device_count = Joystick::count()
                .map_err(|e| crate::error::NeoCabError::Legacy(format!("Joystick count failed: {}", e)))?;

            tracing::info!("Found {} joystick devices", device_count);

            Ok(Self {
                device_count,
                deadzone: 8000,
                prev_state: [false; 8],
            })
        }

        #[cfg(not(feature = "legacy-ui"))]
        {
            Ok(Self {
                device_count: 0,
                deadzone: 8000,
                prev_state: [false; 8],
            })
        }
    }

    pub fn poll(&mut self) -> Vec<InputEvent> {
        let mut events = Vec::new();

        // Joystick polling would be done here via SDL2 event system
        // For now, return empty vector as polling happens in event loop

        events
    }

    pub fn get_device_count(&self) -> usize {
        self.device_count
    }

    pub fn set_deadzone(&mut self, zone: i16) {
        self.deadzone = zone;
        tracing::info!("Joystick deadzone set to {}", zone);
    }

    pub fn is_any_pressed(&self) -> bool {
        self.prev_state.iter().any(|&b| b)
    }
}

impl Default for JoystickInput {
    fn default() -> Self {
        Self::new().unwrap_or_else(|_| Self {
            device_count: 0,
            deadzone: 8000,
            prev_state: [false; 8],
        })
    }
}
