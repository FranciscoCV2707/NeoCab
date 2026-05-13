use crate::Result;
use sdl2::Sdl;
use sdl2::video::Window;
use sdl2::render::Canvas;
use sdl2::pixels::Color;

/// SDL2-based renderer for legacy Windows XP mode
pub struct Renderer {
    sdl_context: Sdl,
    canvas: Canvas<Window>,
    width: u32,
    height: u32,
}

impl Renderer {
    /// Initialize SDL2 renderer with basic window setup
    pub fn new() -> Result<Self> {
        let width = 1024u32;
        let height = 768u32;

        tracing::info!("Initializing SDL2 Renderer ({}x{})", width, height);

        let sdl_context = sdl2::init()
            .map_err(|e| crate::error::NeoCabError::Custom(format!("SDL2 init failed: {}", e)))?;

        let video_subsystem = sdl_context.video()
            .map_err(|e| crate::error::NeoCabError::Custom(format!("SDL2 video init failed: {}", e)))?;

        let window = video_subsystem
            .window("NeoCab - Legacy Mode (Windows XP)", width, height)
            .position_centered()
            .build()
            .map_err(|e| crate::error::NeoCabError::Custom(format!("Window creation failed: {}", e)))?;

        let canvas = window
            .into_canvas()
            .build()
            .map_err(|e| crate::error::NeoCabError::Custom(format!("Canvas creation failed: {}", e)))?;

        tracing::info!("SDL2 Renderer initialized successfully");

        Ok(Self {
            sdl_context,
            canvas,
            width,
            height,
        })
    }

    /// Get reference to SDL context for event handling
    pub fn get_sdl_context(&self) -> &Sdl {
        &self.sdl_context
    }

    /// Clear the canvas
    pub fn clear(&mut self) {
        self.canvas.set_draw_color(Color::RGB(0, 0, 0));
        self.canvas.clear();
    }

    /// Present the current frame
    pub fn present(&mut self) {
        self.canvas.present();
    }

    /// Render current frame (placeholder - draws arcade-themed UI)
    pub fn render_frame(&mut self) -> Result<()> {
        self.clear();

        // Draw basic arcade-themed background
        self.canvas.set_draw_color(Color::RGB(15, 15, 15));
        self.canvas.fill_rect(sdl2::rect::Rect::new(0, 0, self.width, self.height))
            .map_err(|e| crate::error::NeoCabError::Custom(format!("Render error: {}", e)))?;

        // Draw arcade orange accent border (top)
        self.canvas.set_draw_color(Color::RGB(255, 107, 53));
        self.canvas.fill_rect(sdl2::rect::Rect::new(0, 0, self.width, 4))
            .map_err(|e| crate::error::NeoCabError::Custom(format!("Render error: {}", e)))?;

        // Draw arcade orange accent border (bottom)
        self.canvas.fill_rect(sdl2::rect::Rect::new(0, (self.height - 4) as i32, self.width, 4))
            .map_err(|e| crate::error::NeoCabError::Custom(format!("Render error: {}", e)))?;

        // TODO: Add text rendering using SDL2_ttf when available
        // For now, just clear and present a black screen

        self.present();
        Ok(())
    }

    /// Get canvas dimensions
    pub fn get_dimensions(&self) -> (u32, u32) {
        (self.width, self.height)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_renderer_dimensions() {
        // SDL2 needs display, skip in CI
        if std::env::var("CI").is_ok() {
            return;
        }
        // Note: Renderer::new() will fail in headless environments
    }
}
