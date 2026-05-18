pub mod joystick;
pub mod keyboard;
pub mod sdl_event_handler;

pub use joystick::JoystickInput;
pub use keyboard::KeyboardInput;
pub use sdl_event_handler::SDLEventHandler;

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
    #[cfg(feature = "legacy-ui")]
    sdl_handler: Option<SDLEventHandler>,
    joystick_input: JoystickInput,
    keyboard_input: KeyboardInput,
}

impl InputHandler {
    pub fn new() -> Result<Self> {
        tracing::info!("Initializing Legacy Input Handler");

        let joystick_input = JoystickInput::new()?;
        let keyboard_input = KeyboardInput::new()?;

        #[cfg(feature = "legacy-ui")]
        let sdl_handler = None; // Will be initialized with SDL context

        tracing::info!("Input handler ready: {} joysticks detected",
            joystick_input.get_device_count());

        Ok(Self {
            #[cfg(feature = "legacy-ui")]
            sdl_handler,
            joystick_input,
            keyboard_input,
        })
    }

    #[cfg(feature = "legacy-ui")]
    pub fn initialize_sdl(&mut self, sdl_context: &sdl2::Sdl) -> Result<()> {
        self.sdl_handler = Some(SDLEventHandler::new(sdl_context)?);
        Ok(())
    }

    pub fn poll_events(&mut self) -> Vec<InputEvent> {
        #[cfg(feature = "legacy-ui")]
        if let Some(handler) = &mut self.sdl_handler {
            let (events, _) = handler.poll_events();
            return events;
        }

        let mut events = Vec::new();
        // Fallback to manual polling
        events.extend(self.joystick_input.poll());
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
            tracing::error!("Failed to initialize input: {}, using no-op handler", e);
            Self {
                #[cfg(feature = "legacy-ui")]
                sdl_handler: None,
                joystick_input: JoystickInput::new().unwrap_or_else(|_| JoystickInput {
                    axis_states: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
                }),
                keyboard_input: KeyboardInput::new().unwrap_or_else(|_| KeyboardInput {
                    pressed_keys: std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
                }),
            }
        })
    }
}
