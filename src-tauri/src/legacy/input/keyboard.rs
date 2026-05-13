use crate::Result;
use super::InputEvent;

/// Keyboard input handler for legacy mode
pub struct KeyboardInput {
    prev_state: [bool; 256],
}

impl KeyboardInput {
    pub fn new() -> Result<Self> {
        Ok(Self {
            prev_state: [false; 256],
        })
    }

    pub fn poll(&mut self) -> Vec<InputEvent> {
        let mut events = Vec::new();

        // Keyboard polling would be done here via SDL2 event system
        // For now, return empty vector as polling happens in event loop

        events
    }

    pub fn is_any_pressed(&self) -> bool {
        self.prev_state.iter().any(|&b| b)
    }

    /// Map SDL2 keycodes to arcade input events
    pub fn map_key_to_event(keycode: u32) -> Option<InputEvent> {
        match keycode {
            // Arrow keys / WASD for navigation
            1073741906 | 119 => Some(InputEvent::MoveUp),      // Up or W
            1073741905 | 115 => Some(InputEvent::MoveDown),    // Down or S
            1073741904 | 97  => Some(InputEvent::MoveLeft),    // Left or A
            1073741903 | 100 => Some(InputEvent::MoveRight),   // Right or D

            // Selection keys
            13 | 32 => Some(InputEvent::Select),               // Enter or Space
            27     => Some(InputEvent::Back),                  // Escape
            1073742048 => Some(InputEvent::Menu),              // Alt

            // Game buttons
            122 => Some(InputEvent::Button1),                  // Z
            120 => Some(InputEvent::Button2),                  // X
            99  => Some(InputEvent::Button3),                  // C
            118 => Some(InputEvent::Button4),                  // V

            // System
            112 => Some(InputEvent::Pause),                    // P
            113 => Some(InputEvent::Quit),                     // Q

            _ => None,
        }
    }
}

impl Default for KeyboardInput {
    fn default() -> Self {
        Self::new().unwrap_or_else(|_| Self {
            prev_state: [false; 256],
        })
    }
}
