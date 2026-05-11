use crate::Result;
use super::{Renderer, InputHandler};
use std::time::{Duration, Instant};

/// Legacy SDL2 event loop (Windows XP)
pub struct EventLoop {
    running: bool,
    fps: u32,
    frame_time: Duration,
    last_frame: Instant,
}

impl EventLoop {
    pub fn new() -> Self {
        Self {
            running: true,
            fps: 60,
            frame_time: Duration::from_millis(1000 / 60),
            last_frame: Instant::now(),
        }
    }

    pub async fn run(
        &mut self,
        renderer: &mut Renderer,
        input_handler: &mut InputHandler,
    ) -> Result<()> {
        tracing::info!("Starting legacy event loop at {} FPS", self.fps);

        self.running = true;

        #[cfg(feature = "legacy-ui")]
        {
            // Initialize SDL input handler
            let sdl_ctx = renderer.get_sdl_context();
            input_handler.initialize_sdl(sdl_ctx)?;

            while self.running {
                let frame_start = Instant::now();

                // Poll input events
                let events = input_handler.poll_events();
                for event in events {
                    self.handle_input_event(event);
                }

                // Render frame
                renderer.render_frame()?;

                // Frame rate limiting
                let elapsed = frame_start.elapsed();
                if elapsed < self.frame_time {
                    std::thread::sleep(self.frame_time - elapsed);
                }

                self.last_frame = frame_start;
            }
        }

        #[cfg(not(feature = "legacy-ui"))]
        {
            tracing::warn!("Event loop requested but legacy-ui feature not enabled");
        }

        tracing::info!("Legacy event loop terminated");
        Ok(())
    }

    fn handle_input_event(&mut self, event: super::input::InputEvent) {
        use super::input::InputEvent;

        match event {
            InputEvent::MoveUp => {
                tracing::trace!("Input: Move Up");
            }
            InputEvent::MoveDown => {
                tracing::trace!("Input: Move Down");
            }
            InputEvent::MoveLeft => {
                tracing::trace!("Input: Move Left");
            }
            InputEvent::MoveRight => {
                tracing::trace!("Input: Move Right");
            }
            InputEvent::Select => {
                tracing::info!("Input: Select");
            }
            InputEvent::Back => {
                tracing::info!("Input: Back");
            }
            InputEvent::Menu => {
                tracing::info!("Input: Menu");
            }
            InputEvent::Button1 => {
                tracing::trace!("Input: Button 1");
            }
            InputEvent::Button2 => {
                tracing::trace!("Input: Button 2");
            }
            InputEvent::Button3 => {
                tracing::trace!("Input: Button 3");
            }
            InputEvent::Button4 => {
                tracing::trace!("Input: Button 4");
            }
            InputEvent::Pause => {
                tracing::info!("Input: Pause");
            }
            InputEvent::Quit => {
                tracing::info!("Input: Quit requested");
                self.running = false;
            }
        }
    }

    pub fn set_fps(&mut self, fps: u32) {
        self.fps = fps.max(1).min(240);
        self.frame_time = Duration::from_millis(1000 / self.fps as u64);
        tracing::info!("Event loop FPS set to {}", self.fps);
    }

    pub fn stop(&mut self) {
        self.running = false;
    }
}

impl Default for EventLoop {
    fn default() -> Self {
        Self::new()
    }
}
