#[cfg(feature = "legacy-ui")]
use sdl2::render::Canvas;
#[cfg(feature = "legacy-ui")]
use sdl2::video::Window;

use crate::Result;

/// UI overlay renderer for game info, stats, etc.
pub struct UIRenderer {
    show_info_panel: bool,
    show_stats: bool,
    selected_game: String,
    coin_balance: u32,
}

impl UIRenderer {
    pub fn new() -> Self {
        Self {
            show_info_panel: true,
            show_stats: false,
            selected_game: String::from("No game selected"),
            coin_balance: 0,
        }
    }

    pub fn set_selected_game(&mut self, game: String) {
        self.selected_game = game;
    }

    pub fn set_coin_balance(&mut self, balance: u32) {
        self.coin_balance = balance;
    }

    pub fn toggle_info_panel(&mut self) {
        self.show_info_panel = !self.show_info_panel;
    }

    pub fn toggle_stats(&mut self) {
        self.show_stats = !self.show_stats;
    }

    #[cfg(feature = "legacy-ui")]
    pub fn render(&self, canvas: &mut Canvas<Window>) -> Result<()> {
        use sdl2::pixels::Color;
        use sdl2::rect::Rect;

        // Draw game info panel (right side)
        if self.show_info_panel {
            self.draw_info_panel(canvas)?;
        }

        // Draw coin balance (top right)
        self.draw_coin_display(canvas)?;

        // Draw stats if enabled
        if self.show_stats {
            self.draw_stats_panel(canvas)?;
        }

        Ok(())
    }

    #[cfg(not(feature = "legacy-ui"))]
    pub fn render(&self, _canvas: &mut Canvas<Window>) -> Result<()> {
        Ok(())
    }

    #[cfg(feature = "legacy-ui")]
    fn draw_info_panel(&self, canvas: &mut Canvas<Window>) -> Result<()> {
        use sdl2::pixels::Color;
        use sdl2::rect::Rect;

        let panel_x = 700;
        let panel_y = 100;
        let panel_w = 300;
        let panel_h = 500;

        // Semi-transparent dark background
        canvas.set_draw_color(Color::RGB(0, 0, 0));
        let _ = canvas.fill_rect(Rect::new(panel_x, panel_y, panel_w, panel_h));

        // Border
        canvas.set_draw_color(Color::RGB(255, 100, 0));
        let _ = canvas.draw_rect(Rect::new(panel_x, panel_y, panel_w, panel_h));

        // Title text would go here (requires font rendering)
        tracing::trace!("Game info panel rendered: {}", self.selected_game);

        Ok(())
    }

    #[cfg(feature = "legacy-ui")]
    fn draw_coin_display(&self, canvas: &mut Canvas<Window>) -> Result<()> {
        use sdl2::pixels::Color;
        use sdl2::rect::Rect;

        let display_x = 900;
        let display_y = 20;
        let display_w = 100;
        let display_h = 50;

        // Background
        canvas.set_draw_color(Color::RGB(40, 40, 40));
        let _ = canvas.fill_rect(Rect::new(display_x, display_y, display_w, display_h));

        // Border (bright yellow for arcade aesthetic)
        canvas.set_draw_color(Color::RGB(255, 255, 0));
        let _ = canvas.draw_rect(Rect::new(display_x, display_y, display_w, display_h));

        tracing::trace!("Coin balance displayed: {}", self.coin_balance);

        Ok(())
    }

    #[cfg(feature = "legacy-ui")]
    fn draw_stats_panel(&self, canvas: &mut Canvas<Window>) -> Result<()> {
        use sdl2::pixels::Color;
        use sdl2::rect::Rect;

        let panel_x = 50;
        let panel_y = 600;
        let panel_w = 900;
        let panel_h = 150;

        // Stats panel at bottom
        canvas.set_draw_color(Color::RGB(40, 40, 40));
        let _ = canvas.fill_rect(Rect::new(panel_x, panel_y, panel_w, panel_h));

        canvas.set_draw_color(Color::RGB(100, 200, 100));
        let _ = canvas.draw_rect(Rect::new(panel_x, panel_y, panel_w, panel_h));

        tracing::trace!("Stats panel rendered");

        Ok(())
    }
}

impl Default for UIRenderer {
    fn default() -> Self {
        Self::new()
    }
}
