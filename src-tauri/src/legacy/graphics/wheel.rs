#[cfg(feature = "legacy-ui")]
use sdl2::render::Canvas;
#[cfg(feature = "legacy-ui")]
use sdl2::video::Window;

use crate::Result;

/// HyperSpin-style wheel renderer for system selection
pub struct WheelRenderer {
    screen_width: u32,
    screen_height: u32,
    wheel_x: i32,
    wheel_y: i32,
    wheel_radius: u32,
    rotation_angle: f32,
    items_count: usize,
    selected_index: usize,
}

impl WheelRenderer {
    pub fn new(screen_width: u32, screen_height: u32) -> Self {
        let wheel_x = (screen_width / 2) as i32;
        let wheel_y = (screen_height / 2) as i32;
        let wheel_radius = 150;

        Self {
            screen_width,
            screen_height,
            wheel_x,
            wheel_y,
            wheel_radius,
            rotation_angle: 0.0,
            items_count: 0,
            selected_index: 0,
        }
    }

    pub fn set_items(&mut self, count: usize) {
        self.items_count = count;
        tracing::debug!("Wheel renderer: {} items", count);
    }

    pub fn rotate(&mut self, angle: f32) {
        self.rotation_angle = (self.rotation_angle + angle) % 360.0;
        if self.rotation_angle < 0.0 {
            self.rotation_angle += 360.0;
        }
    }

    pub fn select_next(&mut self) {
        self.selected_index = (self.selected_index + 1) % self.items_count.max(1);
        self.rotate(360.0 / self.items_count.max(1) as f32);
    }

    pub fn select_prev(&mut self) {
        if self.selected_index == 0 {
            self.selected_index = self.items_count.saturating_sub(1);
        } else {
            self.selected_index -= 1;
        }
        self.rotate(-360.0 / self.items_count.max(1) as f32);
    }

    #[cfg(feature = "legacy-ui")]
    pub fn render(&self, canvas: &mut Canvas<Window>) -> Result<()> {
        use sdl2::pixels::Color;
        use std::f32::consts::PI;

        // Draw wheel circle
        canvas.set_draw_color(Color::RGB(40, 40, 40)); // Cabinet gray
        self.draw_circle(canvas, self.wheel_x, self.wheel_y, self.wheel_radius);

        // Draw wheel items
        if self.items_count > 0 {
            let item_angle = 360.0 / self.items_count as f32;

            for i in 0..self.items_count {
                let angle = (i as f32 * item_angle + self.rotation_angle) * PI / 180.0;
                let item_x = self.wheel_x + (self.wheel_radius as f32 * angle.cos()) as i32;
                let item_y = self.wheel_y + (self.wheel_radius as f32 * angle.sin()) as i32;

                // Selected item: bright color
                if i == self.selected_index {
                    canvas.set_draw_color(Color::RGB(255, 100, 0)); // Arcade orange
                    self.draw_circle(canvas, item_x, item_y, 30);
                } else {
                    canvas.set_draw_color(Color::RGB(100, 100, 100));
                    self.draw_circle(canvas, item_x, item_y, 25);
                }
            }
        }

        // Draw center indicator
        canvas.set_draw_color(Color::RGB(255, 255, 0)); // Arcade yellow
        self.draw_circle(canvas, self.wheel_x, self.wheel_y, 10);

        Ok(())
    }

    #[cfg(not(feature = "legacy-ui"))]
    pub fn render(&self, _canvas: &mut Canvas<Window>) -> Result<()> {
        Ok(())
    }

    /// Simple circle drawing using Bresenham algorithm approximation
    #[cfg(feature = "legacy-ui")]
    fn draw_circle(&self, canvas: &mut Canvas<Window>, center_x: i32, center_y: i32, radius: u32) {
        use sdl2::rect::Point;

        let radius = radius as i32;
        let mut x = radius;
        let mut y = 0;
        let mut p = 1 - radius;

        while x >= y {
            // Draw octants
            canvas
                .draw_line(
                    Point::new(center_x + x, center_y + y),
                    Point::new(center_x + x, center_y + y),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x - x, center_y + y),
                    Point::new(center_x - x, center_y + y),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x + x, center_y - y),
                    Point::new(center_x + x, center_y - y),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x - x, center_y - y),
                    Point::new(center_x - x, center_y - y),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x + y, center_y + x),
                    Point::new(center_x + y, center_y + x),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x - y, center_y + x),
                    Point::new(center_x - y, center_y + x),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x + y, center_y - x),
                    Point::new(center_x + y, center_y - x),
                )
                .ok();
            canvas
                .draw_line(
                    Point::new(center_x - y, center_y - x),
                    Point::new(center_x - y, center_y - x),
                )
                .ok();

            if p < 0 {
                p += 2 * y + 1;
            } else {
                p += 2 * (y - x) + 1;
                x -= 1;
            }
            y += 1;
        }
    }

    pub fn get_selected_index(&self) -> usize {
        self.selected_index
    }
}
