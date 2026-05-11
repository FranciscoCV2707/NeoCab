#[cfg(feature = "legacy-ui")]
use sdl2::event::Event;
#[cfg(feature = "legacy-ui")]
use sdl2::keyboard::Keycode;
#[cfg(feature = "legacy-ui")]
use sdl2::EventPump;

use crate::Result;
use super::InputEvent;

/// SDL2 event handler for polling and translating events
#[cfg(feature = "legacy-ui")]
pub struct SDLEventHandler {
    event_pump: EventPump,
}

#[cfg(feature = "legacy-ui")]
impl SDLEventHandler {
    pub fn new(sdl_context: &sdl2::Sdl) -> Result<Self> {
        let event_pump = sdl_context.event_pump()
            .map_err(|e| crate::error::NeoCabError::Legacy(format!("Event pump creation failed: {}", e)))?;

        Ok(Self { event_pump })
    }

    pub fn poll_events(&mut self) -> (Vec<InputEvent>, bool) {
        let mut events = Vec::new();
        let mut should_quit = false;

        for event in self.event_pump.poll_iter() {
            match event {
                Event::Quit { .. } => {
                    should_quit = true;
                    events.push(InputEvent::Quit);
                }

                Event::KeyDown { keycode: Some(key), .. } => {
                    if let Some(input_event) = self.translate_key(key) {
                        events.push(input_event);
                    }
                }

                Event::JoyButtonDown { button, .. } => {
                    if let Some(input_event) = self.translate_joy_button(button) {
                        events.push(input_event);
                    }
                }

                Event::JoyAxisMotion { axis, value, .. } => {
                    if let Some(input_event) = self.translate_joy_axis(axis, value) {
                        events.push(input_event);
                    }
                }

                Event::JoyHatMotion { hat_state, .. } => {
                    for input_event in self.translate_joy_hat(hat_state) {
                        events.push(input_event);
                    }
                }

                _ => {}
            }
        }

        (events, should_quit)
    }

    fn translate_key(&self, key: Keycode) -> Option<InputEvent> {
        match key {
            Keycode::Up | Keycode::W => Some(InputEvent::MoveUp),
            Keycode::Down | Keycode::S => Some(InputEvent::MoveDown),
            Keycode::Left | Keycode::A => Some(InputEvent::MoveLeft),
            Keycode::Right | Keycode::D => Some(InputEvent::MoveRight),

            Keycode::Return | Keycode::Space => Some(InputEvent::Select),
            Keycode::Escape => Some(InputEvent::Back),
            Keycode::Lalt | Keycode::Ralt => Some(InputEvent::Menu),

            Keycode::Z => Some(InputEvent::Button1),
            Keycode::X => Some(InputEvent::Button2),
            Keycode::C => Some(InputEvent::Button3),
            Keycode::V => Some(InputEvent::Button4),

            Keycode::P => Some(InputEvent::Pause),
            Keycode::Q => Some(InputEvent::Quit),

            _ => None,
        }
    }

    fn translate_joy_button(&self, button: u8) -> Option<InputEvent> {
        match button {
            0 | 1 => Some(InputEvent::Button1),
            2 | 3 => Some(InputEvent::Button2),
            4 | 5 => Some(InputEvent::Button3),
            6 | 7 => Some(InputEvent::Button4),
            8 => Some(InputEvent::Menu),
            9 => Some(InputEvent::Pause),
            _ => None,
        }
    }

    fn translate_joy_axis(&self, axis: u8, value: i16) -> Option<InputEvent> {
        const DEADZONE: i16 = 15000;

        match axis {
            0 => {
                if value < -DEADZONE {
                    Some(InputEvent::MoveLeft)
                } else if value > DEADZONE {
                    Some(InputEvent::MoveRight)
                } else {
                    None
                }
            }
            1 => {
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

    fn translate_joy_hat(&self, hat_state: sdl2::joystick::HatState) -> Vec<InputEvent> {
        use sdl2::joystick::HatState;

        match hat_state {
            HatState::Up => vec![InputEvent::MoveUp],
            HatState::Down => vec![InputEvent::MoveDown],
            HatState::Left => vec![InputEvent::MoveLeft],
            HatState::Right => vec![InputEvent::MoveRight],
            HatState::UpLeft => vec![InputEvent::MoveUp, InputEvent::MoveLeft],
            HatState::UpRight => vec![InputEvent::MoveUp, InputEvent::MoveRight],
            HatState::DownLeft => vec![InputEvent::MoveDown, InputEvent::MoveLeft],
            HatState::DownRight => vec![InputEvent::MoveDown, InputEvent::MoveRight],
            HatState::Centered => vec![],
        }
    }
}

/// Dummy implementation for modern mode
#[cfg(not(feature = "legacy-ui"))]
pub struct SDLEventHandler;

#[cfg(not(feature = "legacy-ui"))]
impl SDLEventHandler {
    pub fn poll_events(&mut self) -> (Vec<InputEvent>, bool) {
        (Vec::new(), false)
    }
}
