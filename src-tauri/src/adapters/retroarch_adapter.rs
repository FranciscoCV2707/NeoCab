use async_trait::async_trait;
use std::process::{Command, Child};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, warn, error};
use crate::error::{Result, NeoCabError};
use super::trait_adapter::EmulatorAdapter;

#[derive(Debug, Clone)]
pub enum RetroArchCore {
    Snes9x,
    Genesis,
    Nestopia,
    Gambatte,
    Pcsx,
    Mupen64plus,
    Custom(String),
}

impl RetroArchCore {
    pub fn as_str(&self) -> &str {
        match self {
            RetroArchCore::Snes9x => "snes9x",
            RetroArchCore::Genesis => "genesis_plus_gx",
            RetroArchCore::Nestopia => "nestopia",
            RetroArchCore::Gambatte => "gambatte",
            RetroArchCore::Pcsx => "pcsx_rearmed",
            RetroArchCore::Mupen64plus => "mupen64plus_next",
            RetroArchCore::Custom(name) => name,
        }
    }
}

pub struct RetroArchAdapter {
    executable: String,
    version: String,
    core: RetroArchCore,
    process: Arc<Mutex<Option<Child>>>,
}

impl RetroArchAdapter {
    pub fn new(executable: String, version: String, core: RetroArchCore) -> Self {
        Self {
            executable,
            version,
            core,
            process: Arc::new(Mutex::new(None)),
        }
    }

    fn build_command(&self, rom_path: &str) -> Command {
        let mut cmd = Command::new(&self.executable);

        #[cfg(target_os = "windows")]
        {
            cmd.arg("-w");
            cmd.arg("1920");
            cmd.arg("-h");
            cmd.arg("1080");
        }

        #[cfg(not(target_os = "windows"))]
        {
            cmd.arg("-w");
            cmd.arg("1920");
            cmd.arg("-h");
            cmd.arg("1080");
        }

        cmd.arg("-L");
        cmd.arg(self.core.as_str());
        cmd.arg(rom_path);

        info!(
            "RetroArch command: {:?} (core: {})",
            cmd.get_program(),
            self.core.as_str()
        );
        cmd
    }

    pub fn get_core(&self) -> &RetroArchCore {
        &self.core
    }
}

#[async_trait]
impl EmulatorAdapter for RetroArchAdapter {
    fn name(&self) -> &str {
        "retroarch"
    }

    fn version(&self) -> &str {
        &self.version
    }

    async fn is_running(&self) -> bool {
        let mut process = self.process.lock().await;
        if let Some(child) = process.as_mut() {
            match child.try_wait() {
                Ok(None) => true,
                _ => {
                    *process = None;
                    false
                }
            }
        } else {
            false
        }
    }

    async fn launch(&self, rom_path: &str) -> Result<()> {
        info!(
            "Launching RetroArch with core: {} and ROM: {}",
            self.core.as_str(),
            rom_path
        );

        // Check if already running
        if self.is_running().await {
            warn!("RetroArch already running");
            return Err(NeoCabError::System(
                "RetroArch emulator already running".to_string(),
            ));
        }

        let mut cmd = self.build_command(rom_path);

        match cmd.spawn() {
            Ok(child) => {
                let mut process = self.process.lock().await;
                *process = Some(child);
                info!("RetroArch process started successfully");
                Ok(())
            }
            Err(e) => {
                error!("Failed to start RetroArch: {}", e);
                Err(NeoCabError::System(format!(
                    "Failed to launch RetroArch: {}",
                    e
                )))
            }
        }
    }

    async fn stop(&self) -> Result<()> {
        info!("Stopping RetroArch emulator");

        let mut process = self.process.lock().await;

        if let Some(mut child) = process.take() {
            match child.kill() {
                Ok(_) => {
                    info!("RetroArch process killed successfully");
                    Ok(())
                }
                Err(e) => {
                    warn!("Failed to kill RetroArch process: {}", e);
                    Err(NeoCabError::System(format!(
                        "Failed to stop RetroArch: {}",
                        e
                    )))
                }
            }
        } else {
            warn!("No RetroArch process running");
            Err(NeoCabError::System("No RetroArch process running".to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_retroarch_adapter_creation() {
        let ra = RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            RetroArchCore::Snes9x,
        );

        assert_eq!(ra.name(), "retroarch");
        assert_eq!(ra.version(), "1.15.0");
    }

    #[test]
    fn test_retroarch_cores() {
        assert_eq!(RetroArchCore::Snes9x.as_str(), "snes9x");
        assert_eq!(RetroArchCore::Genesis.as_str(), "genesis_plus_gx");
        assert_eq!(RetroArchCore::Nestopia.as_str(), "nestopia");
        assert_eq!(RetroArchCore::Gambatte.as_str(), "gambatte");
    }

    #[tokio::test]
    async fn test_retroarch_not_running_initially() {
        let ra = RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            RetroArchCore::Snes9x,
        );

        assert!(!ra.is_running().await);
    }
}
