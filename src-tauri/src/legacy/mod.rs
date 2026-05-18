pub mod graphics;
pub mod sdl_event_loop;
pub mod sdl_input;
pub mod sdl_media;
pub mod sdl_renderer;

pub use graphics::{colors, DisplayConfig, FrameBuffer, Renderer, UIRenderer, WheelRenderer};
pub use sdl_event_loop::{EventLoop, LegacyGameState};
pub use sdl_input::{InputEvent, InputHandler};
pub use sdl_media::MediaLoader;
pub use sdl_renderer::Renderer as SdlRenderer;

use crate::Result;
use std::sync::Arc;

/// Legacy SDL2 Application State
pub struct LegacyApp {
    pub renderer: Renderer,
    pub input_handler: InputHandler,
    pub event_loop: EventLoop,
    pub media: MediaLoader,
}

impl LegacyApp {
    /// Initialize legacy SDL2 application for Windows XP
    pub async fn new() -> Result<Self> {
        tracing::info!("Initializing Legacy SDL2 Application");

        let renderer = Renderer::new()?;
        let input_handler = InputHandler::new()?;
        let event_loop = EventLoop::new();

        // Load media (themes and artwork)
        let config_path = std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::path::PathBuf::from("."));

        let theme_path = config_path.join("config").join("themes");
        let media_path = config_path.join("config").join("media");

        let media =
            MediaLoader::new(&theme_path, &media_path).unwrap_or_else(|_| MediaLoader::default());

        tracing::info!("Legacy application initialized successfully");

        Ok(Self {
            renderer,
            input_handler,
            event_loop,
            media,
        })
    }

    /// Run legacy event loop
    pub async fn run(&mut self) -> Result<()> {
        tracing::info!("Starting legacy event loop");
        self.event_loop
            .run(&mut self.renderer, &mut self.input_handler)
            .await
    }
}
