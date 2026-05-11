pub mod joystick;
pub mod keyboard;

pub use joystick::JoystickInput;
pub use keyboard::KeyboardInput;

use crate::Result;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputEvent {
    /// Navigation events
    MoveUp,
    MoveDown,
    MoveLeft,
    MoveRight,

    /// Selection
    Select,
    Back,
    Menu,

    /// Game controls
    Button1,
    Button2,
    Button3,
    Button4,

    /// System
    Pause,
    Quit,
}

/// Input handler for SDL2 in legacy mode
pub struct InputHandler {
    joystick_input: JoystickInput,
    keyboard_input: KeyboardInput,
}

impl InputHandler {
    pub fn new() -> Result<Self> {
        tracing::info!("Initializing Legacy Input Handler");

        let joystick_input = JoystickInput::new()?;
        let keyboard_input = KeyboardInput::new()?;

        tracing::info!("Input handler ready: {} joysticks detected",
            joystick_input.get_device_count());

        Ok(Self {
            joystick_input,
            keyboard_input,
        })
    }

    pub fn poll_events(&mut self) -> Vec<InputEvent> {
        let mut events = Vec::new();

        // Poll joystick events
        events.extend(self.joystick_input.poll());

        // Poll keyboard events
        events.extend(self.keyboard_input.poll());

        events
    }

    pub fn get_joystick_count(&self) -> usize {
        self.joystick_input.get_device_count()
    }

    pub fn is_any_button_pressed(&self) -> bool {
        self.joystick_input.is_any_pressed() || self.keyboard_input.is_any_pressed()
    }
}

impl Default for InputHandler {
    fn default() -> Self {
        Self::new().unwrap_or_else(|e| {
            tracing::error!("Failed to initialize input: {}", e);
            panic!("Input initialization failed");
        })
    }
}
