pub mod renderer;
pub mod wheel;
pub mod ui;

pub use renderer::Renderer;
pub use wheel::WheelRenderer;
pub use ui::UIRenderer;

use crate::Result;

#[derive(Debug, Clone)]
pub struct DisplayConfig {
    pub width: u32,
    pub height: u32,
    pub refresh_rate: u32,
    pub fullscreen: bool,
}

impl Default for DisplayConfig {
    fn default() -> Self {
        Self {
            width: 1024,
            height: 768,
            refresh_rate: 60,
            fullscreen: true,
        }
    }
}

/// Color definitions for arcade aesthetic
pub mod colors {
    pub const BLACK: (u8, u8, u8) = (0, 0, 0);
    pub const WHITE: (u8, u8, u8) = (255, 255, 255);
    pub const ARCADE_RED: (u8, u8, u8) = (255, 0, 0);
    pub const ARCADE_BLUE: (u8, u8, u8) = (0, 100, 255);
    pub const ARCADE_YELLOW: (u8, u8, u8) = (255, 255, 0);
    pub const ARCADE_GREEN: (u8, u8, u8) = (0, 255, 100);
    pub const CABINET_GRAY: (u8, u8, u8) = (40, 40, 40);
}

/// Frame buffer management for SDL2 rendering
pub struct FrameBuffer {
    pub width: u32,
    pub height: u32,
    pub pixels: Vec<u32>,
}

impl FrameBuffer {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            width,
            height,
            pixels: vec![0; (width * height) as usize],
        }
    }

    pub fn clear(&mut self, color: u32) {
        self.pixels.fill(color);
    }

    pub fn set_pixel(&mut self, x: u32, y: u32, color: u32) {
        if x < self.width && y < self.height {
            let idx = (y * self.width + x) as usize;
            if idx < self.pixels.len() {
                self.pixels[idx] = color;
            }
        }
    }

    pub fn draw_rect(&mut self, x: u32, y: u32, w: u32, h: u32, color: u32) {
        for dy in 0..h {
            for dx in 0..w {
                self.set_pixel(x + dx, y + dy, color);
            }
        }
    }
}
