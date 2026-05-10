use crate::error::Result;
use std::process::{Child, Command};
use tracing::info;

pub struct GambatteAdapter {
    process: Option<Child>,
}

impl GambatteAdapter {
    pub fn new() -> Self {
        Self { process: None }
    }

    pub async fn launch(&mut self, rom_path: &str) -> Result<()> {
        let child = Command::new("gambatte")
            .arg(rom_path)
            .spawn()?;

        self.process = Some(child);
        info!("Gambatte launched for: {}", rom_path);
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<()> {
        if let Some(mut process) = self.process.take() {
            let _ = process.kill();
        }
        info!("Gambatte stopped");
        Ok(())
    }

    pub async fn is_running(&mut self) -> bool {
        if let Some(ref mut process) = self.process {
            process.try_wait().is_ok()
        } else {
            false
        }
    }
}

impl Default for GambatteAdapter {
    fn default() -> Self {
        Self::new()
    }
}
