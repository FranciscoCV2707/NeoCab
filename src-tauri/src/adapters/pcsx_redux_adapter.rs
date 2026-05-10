use crate::error::Result;
use std::process::{Child, Command};
use tracing::info;

pub struct PcsxReduxAdapter {
    process: Option<Child>,
}

impl PcsxReduxAdapter {
    pub fn new() -> Self {
        Self { process: None }
    }

    pub async fn launch(&mut self, rom_path: &str) -> Result<()> {
        let args = vec![rom_path];
        let child = Command::new("pcsx-redux")
            .args(&args)
            .spawn()?;

        self.process = Some(child);
        info!("PCSX-Redux launched for: {}", rom_path);
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<()> {
        if let Some(mut process) = self.process.take() {
            let _ = process.kill();
        }
        info!("PCSX-Redux stopped");
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

impl Default for PcsxReduxAdapter {
    fn default() -> Self {
        Self::new()
    }
}
