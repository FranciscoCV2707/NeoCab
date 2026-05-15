use async_trait::async_trait;
use super::strategy::{LaunchStrategy, LaunchContext, LaunchResult};
use crate::error::Result;

pub struct ChdToCueStrategy;

#[async_trait]
impl LaunchStrategy for ChdToCueStrategy {
    fn name(&self) -> &str { "chd_to_cue" }
    fn priority(&self) -> u32 { 15 }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        ctx.rom_path.extension().and_then(|e| e.to_str()) == Some("chd")
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let temp_dir = std::env::temp_dir().join("neocab-chd-cue");
        std::fs::create_dir_all(&temp_dir).ok();

        let cue_path = temp_dir.join("game.cue");
        let input = ctx.rom_path.to_string_lossy();
        let output = cue_path.to_string_lossy();

        std::process::Command::new("chdman")
            .args(["extractcd", "-i", &input, "-o", &output])
            .output()
            .map_err(|_| crate::error::NeoCabError::InvalidInput(
                "chdman not found in PATH".into()
            ))?;

        let emu = ctx.emulator_path
            .as_ref()
            .ok_or_else(|| crate::error::NeoCabError::InvalidInput("No emulator".into()))?;

        let child = std::process::Command::new(emu)
            .arg(&*output)
            .spawn()
            .map_err(|e| crate::error::NeoCabError::InvalidInput(
                format!("Launch failed: {}", e)
            ))?;

        Ok(LaunchResult {
            process_id: Some(child.id()),
            resolved_path: Some(cue_path),
            method: "chd_to_cue".to_string(),
        })
    }
}
