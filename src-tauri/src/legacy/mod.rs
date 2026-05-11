pub mod graphics;
pub mod input;
pub mod media;
pub mod event_loop;

pub use graphics::Renderer;
pub use input::InputHandler;
pub use event_loop::EventLoop;

use crate::Result;
use std::sync::Arc;

/// Legacy SDL2 Application State
pub struct LegacyApp {
    pub renderer: Renderer,
    pub input_handler: InputHandler,
    pub event_loop: EventLoop,
}

impl LegacyApp {
    /// Initialize legacy SDL2 application for Windows XP
    pub async fn new() -> Result<Self> {
        tracing::info!("Initializing Legacy SDL2 Application");

        let renderer = Renderer::new()?;
        let input_handler = InputHandler::new()?;
        let event_loop = EventLoop::new();

        tracing::info!("Legacy application initialized successfully");

        Ok(Self {
            renderer,
            input_handler,
            event_loop,
        })
    }

    /// Run legacy event loop
    pub async fn run(&mut self) -> Result<()> {
        tracing::info!("Starting legacy event loop");
        self.event_loop.run(&mut self.renderer, &mut self.input_handler).await
    }
}
