#[cfg(feature = "legacy-ui")]
use sdl2::video::Window;
#[cfg(feature = "legacy-ui")]
use sdl2::{pixels::Color, render::Canvas, Sdl};

use super::{DisplayConfig, FrameBuffer, UIRenderer, WheelRenderer};
use crate::Result;

/// SDL2-based graphics renderer for Windows XP legacy mode
#[cfg(feature = "legacy-ui")]
pub struct Renderer {
    canvas: Canvas<Window>,
    frame_buffer: FrameBuffer,
    wheel_renderer: WheelRenderer,
    ui_renderer: UIRenderer,
    config: DisplayConfig,
    sdl_context: Sdl,
}

/// Dummy renderer for modern mode (SDL2 disabled)
#[cfg(not(feature = "legacy-ui"))]
pub struct Renderer;

#[cfg(feature = "legacy-ui")]
impl Renderer {
    pub fn new() -> Result<Self> {
        tracing::info!("Initializing SDL2 Renderer");

        let sdl_context = sdl2::init()
            .map_err(|e| crate::error::NeoCabError::Legacy(format!("SDL2 init failed: {}", e)))?;

        let video_subsystem = sdl_context.video().map_err(|e| {
            crate::error::NeoCabError::Legacy(format!("Video subsystem failed: {}", e))
        })?;

        let config = DisplayConfig::default();

        let window = video_subsystem
            .window(
                "NeoCab - Windows XP Legacy Mode",
                config.width,
                config.height,
            )
            .fullscreen_desktop()
            .build()
            .map_err(|e| {
                crate::error::NeoCabError::Legacy(format!("Window creation failed: {}", e))
            })?;

        let mut canvas = window.into_canvas().build().map_err(|e| {
            crate::error::NeoCabError::Legacy(format!("Canvas creation failed: {}", e))
        })?;

        canvas.set_draw_color(Color::BLACK);
        canvas.clear();
        canvas.present();

        let frame_buffer = FrameBuffer::new(config.width, config.height);
        let wheel_renderer = WheelRenderer::new(config.width, config.height);
        let ui_renderer = UIRenderer::new();

        tracing::info!(
            "SDL2 Renderer initialized: {}x{} @ {}Hz",
            config.width,
            config.height,
            config.refresh_rate
        );

        Ok(Self {
            canvas,
            frame_buffer,
            wheel_renderer,
            ui_renderer,
            config,
            sdl_context,
        })
    }

    pub fn present(&mut self) {
        self.canvas.present();
    }

    pub fn clear(&mut self) {
        self.canvas.set_draw_color(Color::BLACK);
        self.canvas.clear();
    }

    pub fn render_frame(&mut self) -> Result<()> {
        self.clear();

        // Render wheel
        self.wheel_renderer.render(&mut self.canvas)?;

        // Render UI overlay
        self.ui_renderer.render(&mut self.canvas)?;

        self.present();

        Ok(())
    }

    pub fn get_size(&self) -> (u32, u32) {
        (self.config.width, self.config.height)
    }

    pub fn get_sdl_context(&self) -> &Sdl {
        &self.sdl_context
    }

    pub fn set_fullscreen(&mut self, fullscreen: bool) -> Result<()> {
        let _result = if fullscreen {
            self.canvas
                .window_mut()
                .set_fullscreen(sdl2::video::FullscreenType::Desktop)
        } else {
            self.canvas
                .window_mut()
                .set_fullscreen(sdl2::video::FullscreenType::Off)
        };

        self.config.fullscreen = fullscreen;
        Ok(())
    }
}

#[cfg(not(feature = "legacy-ui"))]
impl Renderer {
    pub fn new() -> Result<Self> {
        tracing::warn!("Renderer requested but legacy-ui feature not enabled");
        Ok(Renderer)
    }

    pub fn present(&mut self) {}

    pub fn clear(&mut self) {}

    pub fn render_frame(&mut self) -> Result<()> {
        Ok(())
    }

    pub fn get_size(&self) -> (u32, u32) {
        (1024, 768)
    }

    pub fn set_fullscreen(&mut self, _fullscreen: bool) -> Result<()> {
        Ok(())
    }
}
