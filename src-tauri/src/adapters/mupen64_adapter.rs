use crate::error::Result;
use std::process::{Child, Command};
use tracing::info;

pub struct Mupen64Adapter {
    process: Option<Child>,
}

impl Mupen64Adapter {
    pub fn new() -> Self {
        Self { process: None }
    }

    pub async fn launch(&mut self, rom_path: &str) -> Result<()> {
        let args = vec!["--fullscreen", rom_path];
        let child = Command::new("mupen64plus").args(&args).spawn()?;

        self.process = Some(child);
        info!("Mupen64Plus launched for: {}", rom_path);
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<()> {
        if let Some(mut process) = self.process.take() {
            let _ = process.kill();
        }
        info!("Mupen64Plus stopped");
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

impl Default for Mupen64Adapter {
    fn default() -> Self {
        Self::new()
    }
}
