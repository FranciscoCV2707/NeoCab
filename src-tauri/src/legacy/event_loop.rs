use crate::Result;
use super::{Renderer, InputHandler};
use std::time::{Duration, Instant};
use std::collections::VecDeque;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LegacyGameState {
    Menu,
    SystemSelect,
    GameSelect,
    Playing,
    Paused,
    Shutdown,
}

#[derive(Debug)]
pub struct FrameStats {
    frame_count: u64,
    avg_frame_time_ms: f32,
    current_fps: f32,
    frame_times: VecDeque<Duration>,
}

impl FrameStats {
    pub fn new() -> Self {
        Self {
            frame_count: 0,
            avg_frame_time_ms: 0.0,
            current_fps: 0.0,
            frame_times: VecDeque::with_capacity(60),
        }
    }

    pub fn record_frame(&mut self, elapsed: Duration) {
        self.frame_count += 1;
        self.frame_times.push_back(elapsed);

        if self.frame_times.len() > 60 {
            self.frame_times.pop_front();
        }

        if !self.frame_times.is_empty() {
            let total: Duration = self.frame_times.iter().sum();
            self.avg_frame_time_ms = total.as_secs_f32() * 1000.0 / self.frame_times.len() as f32;
            self.current_fps = 1000.0 / self.avg_frame_time_ms;
        }
    }

    pub fn get_stats(&self) -> (u64, f32, f32) {
        (self.frame_count, self.avg_frame_time_ms, self.current_fps)
    }
}

/// Legacy SDL2 event loop (Windows XP)
pub struct EventLoop {
    running: bool,
    paused: bool,
    current_state: LegacyGameState,
    fps: u32,
    frame_time: Duration,
    last_frame: Instant,
    stats: FrameStats,
}

impl EventLoop {
    pub fn new() -> Self {
        Self {
            running: true,
            paused: false,
            current_state: LegacyGameState::Menu,
            fps: 60,
            frame_time: Duration::from_millis(1000 / 60),
            last_frame: Instant::now(),
            stats: FrameStats::new(),
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

            tracing::info!("Event loop: Starting game state = {:?}", self.current_state);

            let mut last_stats_report = Instant::now();

            while self.running {
                let frame_start = Instant::now();

                // Poll input events
                let events = input_handler.poll_events();
                for event in events {
                    self.handle_input_event(event);
                }

                // Render frame (skip if paused but still render for visual feedback)
                if !self.paused {
                    renderer.render_frame()?;
                } else {
                    renderer.clear();
                    renderer.present();
                }

                // Record frame timing
                let frame_elapsed = frame_start.elapsed();
                self.stats.record_frame(frame_elapsed);

                // Frame rate limiting
                if frame_elapsed < self.frame_time {
                    std::thread::sleep(self.frame_time - frame_elapsed);
                }

                self.last_frame = frame_start;

                // Log performance stats every 5 seconds
                if last_stats_report.elapsed() > Duration::from_secs(5) {
                    let (frames, avg_ms, fps) = self.stats.get_stats();
                    tracing::debug!("Event loop stats: {} frames, {:.2}ms/frame, {:.1} FPS",
                        frames, avg_ms, fps);
                    last_stats_report = Instant::now();
                }
            }

            self.shutdown().await?;
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
                tracing::trace!("Input: Move Up (state: {:?})", self.current_state);
            }
            InputEvent::MoveDown => {
                tracing::trace!("Input: Move Down (state: {:?})", self.current_state);
            }
            InputEvent::MoveLeft => {
                tracing::trace!("Input: Move Left (state: {:?})", self.current_state);
            }
            InputEvent::MoveRight => {
                tracing::trace!("Input: Move Right (state: {:?})", self.current_state);
            }
            InputEvent::Select => {
                tracing::info!("Input: Select (state: {:?})", self.current_state);
                match self.current_state {
                    LegacyGameState::Playing => self.change_state(LegacyGameState::Playing),
                    LegacyGameState::SystemSelect => self.change_state(LegacyGameState::GameSelect),
                    LegacyGameState::GameSelect => self.change_state(LegacyGameState::Playing),
                    _ => {}
                }
            }
            InputEvent::Back => {
                tracing::info!("Input: Back (state: {:?})", self.current_state);
                match self.current_state {
                    LegacyGameState::Playing => self.change_state(LegacyGameState::GameSelect),
                    LegacyGameState::GameSelect => self.change_state(LegacyGameState::SystemSelect),
                    LegacyGameState::SystemSelect => self.change_state(LegacyGameState::Menu),
                    LegacyGameState::Paused => self.change_state(LegacyGameState::Playing),
                    _ => {}
                }
            }
            InputEvent::Menu => {
                tracing::info!("Input: Menu pressed (state: {:?})", self.current_state);
                self.change_state(LegacyGameState::Menu);
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
                tracing::info!("Input: Pause toggled (currently: {})", if self.paused { "paused" } else { "playing" });
                match self.current_state {
                    LegacyGameState::Playing => {
                        self.paused = !self.paused;
                        let new_state = if self.paused { LegacyGameState::Paused } else { LegacyGameState::Playing };
                        self.change_state(new_state);
                    }
                    _ => {}
                }
            }
            InputEvent::Quit => {
                tracing::info!("Input: Quit requested");
                self.change_state(LegacyGameState::Shutdown);
                self.running = false;
            }
        }
    }

    fn change_state(&mut self, new_state: LegacyGameState) {
        if std::mem::discriminant(&self.current_state) != std::mem::discriminant(&new_state) {
            tracing::info!("State transition: {:?} -> {:?}", self.current_state, new_state);
            self.current_state = new_state;
        }
    }

    pub fn set_fps(&mut self, fps: u32) {
        self.fps = fps.max(1).min(240);
        self.frame_time = Duration::from_millis(1000 / self.fps as u64);
        tracing::info!("Event loop FPS set to {}", self.fps);
    }

    pub fn pause(&mut self) {
        if matches!(self.current_state, LegacyGameState::Playing) {
            self.paused = true;
            self.change_state(LegacyGameState::Paused);
        }
    }

    pub fn resume(&mut self) {
        if matches!(self.current_state, LegacyGameState::Paused) {
            self.paused = false;
            self.change_state(LegacyGameState::Playing);
        }
    }

    pub fn get_state(&self) -> LegacyGameState {
        self.current_state
    }

    pub fn get_stats(&self) -> (u64, f32, f32) {
        self.stats.get_stats()
    }

    pub fn stop(&mut self) {
        self.running = false;
    }

    async fn shutdown(&mut self) -> Result<()> {
        tracing::info!("Event loop shutting down...");
        let (frames, avg_ms, fps) = self.stats.get_stats();
        tracing::info!("Final stats: {} frames, {:.2}ms/frame, {:.1} FPS",
            frames, avg_ms, fps);
        tracing::info!("Legacy application shutdown complete");
        Ok(())
    }
}

impl Default for EventLoop {
    fn default() -> Self {
        Self::new()
    }
}
