use crate::Result;
use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::EventPump;
use sdl2::Sdl;
use std::collections::VecDeque;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputEvent {
    MoveUp,
    MoveDown,
    MoveLeft,
    MoveRight,
    Select,
    Back,
    Menu,
    Button1,
    Button2,
    Button3,
    Button4,
    Pause,
    Coin,
    Quit,
}

/// SDL2-based input handler for legacy Windows XP mode
pub struct InputHandler {
    event_pump: Option<EventPump>,
    event_queue: VecDeque<InputEvent>,
    joy_mapper: Option<crate::input::joy_mapper::JoyMapper>,
    injector: Option<Box<dyn crate::input::joy_mapper::KeyInjector>>,
}

impl InputHandler {
    /// Create new input handler (not yet initialized)
    pub fn new() -> Result<Self> {
        Ok(Self {
            event_pump: None,
            event_queue: VecDeque::with_capacity(10),
            joy_mapper: Some(crate::input::joy_mapper::JoyMapper::new()),
            #[cfg(target_os = "windows")]
            injector: Some(Box::new(crate::input::joy_mapper::WindowsInjector)),
            #[cfg(not(target_os = "windows"))]
            injector: None,
        })
    }

    /// Initialize with SDL2 context (must be called before polling events)
    pub fn initialize_sdl(&mut self, sdl_context: &Sdl) -> Result<()> {
        let event_subsystem = sdl_context.event().map_err(|e| {
            crate::error::NeoCabError::Custom(format!("SDL2 event init failed: {}", e))
        })?;

        self.event_pump = Some(event_subsystem.event_pump().map_err(|e| {
            crate::error::NeoCabError::Custom(format!("Event pump creation failed: {}", e))
        })?);

        tracing::info!("SDL2 Input Handler initialized with JoyMapper (XP Ready)");
        Ok(())
    }

    /// Poll for new input events
    pub fn poll_events(&mut self) -> Vec<InputEvent> {
        let mut events = Vec::new();

        if let Some(ref mut event_pump) = self.event_pump {
            for event in event_pump.poll_iter() {
                // Pass to JoyMapper for key injection
                if let Some(mapper) = &mut self.joy_mapper {
                    let actions = match event {
                        Event::JoyButtonDown { button, .. } => mapper.handle_button(button, true),
                        Event::JoyButtonUp { button, .. } => mapper.handle_button(button, false),
                        Event::JoyAxisMotion { axis, value, .. } => {
                            mapper.handle_axis(axis, value as f32 / 32768.0)
                        }
                        _ => Vec::new(),
                    };

                    // Execute injected keys
                    if let Some(injector) = &self.injector {
                        for action in actions {
                            if let crate::input::joy_mapper::MappedAction::Key(k) = action {
                                injector.type_key(&k);
                            }
                        }
                    }
                }

                if let Some(input_event) = self.map_sdl_event(event) {
                    events.push(input_event);
                }
            }
        }

        events
    }

    /// Map SDL2 events to NeoCab input events
    fn map_sdl_event(&self, event: Event) -> Option<InputEvent> {
        match event {
            Event::Quit { .. } => Some(InputEvent::Quit),

            Event::KeyDown {
                keycode: Some(code),
                ..
            } => match code {
                // Arrow keys / WASD for navigation
                Keycode::Up | Keycode::W => Some(InputEvent::MoveUp),
                Keycode::Down | Keycode::S => Some(InputEvent::MoveDown),
                Keycode::Left | Keycode::A => Some(InputEvent::MoveLeft),
                Keycode::Right | Keycode::D => Some(InputEvent::MoveRight),

                // Select / Back
                Keycode::Return | Keycode::Space => Some(InputEvent::Select),
                Keycode::Backspace | Keycode::Escape => Some(InputEvent::Back),

                // Menu / Pause
                Keycode::M => Some(InputEvent::Menu),
                Keycode::P => Some(InputEvent::Pause),

                // Button mapping (configurable arcade buttons)
                Keycode::Z => Some(InputEvent::Button1),
                Keycode::X => Some(InputEvent::Button2),
                Keycode::C => Some(InputEvent::Button3),
                Keycode::V => Some(InputEvent::Button4),

                // Coin input (configurable, default: 5 key)
                Keycode::Num5 => Some(InputEvent::Coin),

                _ => None,
            },

            Event::JoyButtonDown { button, .. } => match button {
                0 => Some(InputEvent::Select),
                1 => Some(InputEvent::Back),
                2 => Some(InputEvent::Button1),
                3 => Some(InputEvent::Button2),
                4 => Some(InputEvent::Button3),
                5 => Some(InputEvent::Button4),
                6 => Some(InputEvent::Menu),
                7 => Some(InputEvent::Pause),
                _ => None,
            },

            Event::JoyHatMotion { hat_state, .. } => match hat_state {
                sdl2::joystick::HatState::Up => Some(InputEvent::MoveUp),
                sdl2::joystick::HatState::Down => Some(InputEvent::MoveDown),
                sdl2::joystick::HatState::Left => Some(InputEvent::MoveLeft),
                sdl2::joystick::HatState::Right => Some(InputEvent::MoveRight),
                _ => None,
            },

            Event::JoyAxisMotion { value, axis, .. } => {
                // Joystick analog sticks / D-pad
                const DEADZONE: i16 = 10000;

                match axis {
                    0 => {
                        // X-axis
                        if value < -DEADZONE {
                            Some(InputEvent::MoveLeft)
                        } else if value > DEADZONE {
                            Some(InputEvent::MoveRight)
                        } else {
                            None
                        }
                    }
                    1 => {
                        // Y-axis
                        if value < -DEADZONE {
                            Some(InputEvent::MoveUp)
                        } else if value > DEADZONE {
                            Some(InputEvent::MoveDown)
                        } else {
                            None
                        }
                    }
                    _ => None,
                }
            }

            _ => None,
        }
    }
}

impl Default for InputHandler {
    fn default() -> Self {
        Self::new().unwrap_or(Self {
            event_pump: None,
            event_queue: VecDeque::with_capacity(10),
        })
    }
}
