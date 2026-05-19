// Generic adapter for emulators that follow the standard pattern:
//   executable [args_before] <rom_path> [args_after]
//
// Examples registered in emulator_manager.rs:
//   PCSX2   -> pcsx2-qt.exe --fullscreen --nogui <iso>
//   Dolphin -> Dolphin.exe --exec <rom> --batch --confirm=false
//   Xenia   -> xenia.exe <iso>
//   PPSSPP  -> PPSSPPWindows64.exe <iso>
//   DuckStation -> duckstation-qt.exe -fullscreen -batch <iso>

use super::trait_adapter::EmulatorAdapter;
use crate::error::{NeoCabError, Result};
use async_trait::async_trait;
use std::process::{Child, Command};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, warn};

pub struct GenericAdapter {
    id: String,
    executable: String,
    version: String,
    args_before_rom: Vec<String>,
    args_after_rom: Vec<String>,
    process: Arc<Mutex<Option<Child>>>,
}

impl GenericAdapter {
    pub fn new(
        id: impl Into<String>,
        executable: impl Into<String>,
        version: impl Into<String>,
        args_before_rom: Vec<String>,
        args_after_rom: Vec<String>,
    ) -> Self {
        Self {
            id: id.into(),
            executable: executable.into(),
            version: version.into(),
            args_before_rom,
            args_after_rom,
            process: Arc::new(Mutex::new(None)),
        }
    }

    fn build_command(&self, rom_path: &str) -> Command {
        let mut cmd = Command::new(&self.executable);
        for arg in &self.args_before_rom {
            cmd.arg(arg);
        }
        cmd.arg(rom_path);
        for arg in &self.args_after_rom {
            cmd.arg(arg);
        }
        info!("{} command: {:?}", self.id, cmd.get_program());
        cmd
    }
}

#[async_trait]
impl EmulatorAdapter for GenericAdapter {
    fn name(&self) -> &str {
        &self.id
    }

    fn version(&self) -> &str {
        &self.version
    }

    async fn is_running(&self) -> bool {
        let mut process = self.process.lock().await;
        if let Some(child) = process.as_mut() {
            match child.try_wait() {
                Ok(None) => true,
                _ => { *process = None; false }
            }
        } else {
            false
        }
    }

    async fn launch(&self, rom_path: &str) -> Result<()> {
        info!("Launching {} with: {}", self.id, rom_path);

        if self.is_running().await {
            warn!("{} already running", self.id);
            return Err(NeoCabError::System(format!("{} already running", self.id)));
        }

        let mut cmd = self.build_command(rom_path);

        match cmd.spawn() {
            Ok(child) => {
                *self.process.lock().await = Some(child);
                info!("{} started", self.id);
                Ok(())
            }
            Err(e) => {
                error!("Failed to start {}: {}", self.id, e);
                Err(NeoCabError::System(format!("Failed to launch {}: {}", self.id, e)))
            }
        }
    }

    async fn stop(&self) -> Result<()> {
        info!("Stopping {}", self.id);
        let mut process = self.process.lock().await;
        if let Some(mut child) = process.take() {
            child.kill().map_err(|e| NeoCabError::System(format!("Failed to stop {}: {}", self.id, e)))?;
            info!("{} stopped", self.id);
        }
        Ok(())
    }
}
