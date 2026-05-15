use async_trait::async_trait;
use super::strategy::{LaunchStrategy, LaunchContext, LaunchResult};
use std::process::Command;
use crate::error::Result;

pub struct ChdMountStrategy;

#[async_trait]
impl LaunchStrategy for ChdMountStrategy {
    fn name(&self) -> &str { "chd_mount" }
    fn priority(&self) -> u32 { 10 }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        let ext = ctx.rom_path.extension().and_then(|e| e.to_str());
        ext == Some("chd")
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        // Extract CHD to temporary .cue/.bin using chdman
        let temp_dir = std::env::temp_dir().join("neocab-chd");
        std::fs::create_dir_all(&temp_dir)
            .map_err(|e| crate::error::NeoCabError::InvalidInput(
                format!("Cannot create temp dir: {}", e)
            ))?;

        let output_path = temp_dir.join("game.cue");
        let input_str = ctx.rom_path.to_string_lossy();
        let output_str = output_path.to_string_lossy();

        let extract = Command::new("chdman")
            .args(["extractcd", "-i", &input_str, "-o", &output_str])
            .output();

        match extract {
            Ok(status) if status.status.success() => {
                // Launch with extracted .cue
                let rom_str = output_path.to_string_lossy();
                let emu_path = ctx.emulator_path
                    .as_ref()
                    .ok_or_else(|| crate::error::NeoCabError::InvalidInput("No emulator path".into()))?;

                let child = Command::new(emu_path)
                    .arg(&*rom_str)
                    .spawn()
                    .map_err(|e| crate::error::NeoCabError::InvalidInput(
                        format!("Launch failed: {}", e)
                    ))?;

                Ok(LaunchResult {
                    process_id: Some(child.id()),
                    resolved_path: Some(output_path),
                    method: "chd_mount".to_string(),
                })
            }
            _ => Err(crate::error::NeoCabError::InvalidInput(
                "chdman extraction failed. Make sure chdman is in PATH.".into()
            )),
        }
    }
}
