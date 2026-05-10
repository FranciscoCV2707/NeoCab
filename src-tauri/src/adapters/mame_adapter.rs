use async_trait::async_trait;
use std::process::{Command, Child};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, warn, error};
use crate::error::{Result, NeoCabError};
use super::trait_adapter::EmulatorAdapter;

pub struct MameAdapter {
    executable: String,
    version: String,
    process: Arc<Mutex<Option<Child>>>,
}

impl MameAdapter {
    pub fn new(executable: String, version: String) -> Self {
        Self {
            executable,
            version,
            process: Arc::new(Mutex::new(None)),
        }
    }

    fn build_command(&self, rom_path: &str) -> Command {
        let mut cmd = Command::new(&self.executable);

        #[cfg(target_os = "windows")]
        {
            cmd.arg("-window");
            cmd.arg("-nomaximize");
        }

        #[cfg(not(target_os = "windows"))]
        {
            cmd.arg("-window");
        }

        cmd.arg("-skip_gameinfo");
        cmd.arg("-speed").arg("1.0");
        cmd.arg(rom_path);

        info!("MAME command: {:?}", cmd.get_program());
        cmd
    }

    pub async fn is_running(&self) -> bool {
        let process = self.process.lock().await;
        process.is_some()
    }
}

#[async_trait]
impl EmulatorAdapter for MameAdapter {
    fn name(&self) -> &str {
        "mame"
    }

    fn version(&self) -> &str {
        &self.version
    }

    async fn launch(&self, rom_path: &str) -> Result<()> {
        info!("Launching MAME with ROM: {}", rom_path);

        // Check if already running
        if self.is_running().await {
            warn!("MAME already running");
            return Err(NeoCabError::System(
                "MAME emulator already running".to_string(),
            ));
        }

        let mut cmd = self.build_command(rom_path);

        match cmd.spawn() {
            Ok(child) => {
                let mut process = self.process.lock().await;
                *process = Some(child);
                info!("MAME process started successfully");
                Ok(())
            }
            Err(e) => {
                error!("Failed to start MAME: {}", e);
                Err(NeoCabError::System(format!(
                    "Failed to launch MAME: {}",
                    e
                )))
            }
        }
    }

    async fn stop(&self) -> Result<()> {
        info!("Stopping MAME emulator");

        let mut process = self.process.lock().await;

        if let Some(mut child) = process.take() {
            match child.kill() {
                Ok(_) => {
                    info!("MAME process killed successfully");
                    Ok(())
                }
                Err(e) => {
                    warn!("Failed to kill MAME process: {}", e);
                    Err(NeoCabError::System(format!(
                        "Failed to stop MAME: {}",
                        e
                    )))
                }
            }
        } else {
            warn!("No MAME process running");
            Err(NeoCabError::System("No MAME process running".to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mame_adapter_creation() {
        let mame = MameAdapter::new(
            "mame".to_string(),
            "0.262".to_string(),
        );

        assert_eq!(mame.name(), "mame");
        assert_eq!(mame.version(), "0.262");
    }

    #[tokio::test]
    async fn test_mame_not_running_initially() {
        let mame = MameAdapter::new(
            "mame".to_string(),
            "0.262".to_string(),
        );

        assert!(!mame.is_running().await);
    }
}
