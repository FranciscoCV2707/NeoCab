use async_trait::async_trait;
use super::strategy::{LaunchStrategy, LaunchContext, LaunchResult};
use std::process::Command;
use crate::error::Result;

pub struct DefaultRomStrategy;

#[async_trait]
impl LaunchStrategy for DefaultRomStrategy {
    fn name(&self) -> &str { "default_rom" }
    fn priority(&self) -> u32 { 999 }

    async fn can_handle(&self, _ctx: &LaunchContext) -> bool { true }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let emu_path = ctx.emulator_path
            .as_ref()
            .ok_or_else(|| crate::error::NeoCabError::InvalidInput("No emulator path".into()))?;

        let rom_str = ctx.rom_path.to_string_lossy();
        let args_str = ctx.emulator_args
            .as_deref()
            .unwrap_or("%rom%")
            .replace("%rom%", &rom_str)
            .replace("%name%", &ctx.game_title)
            .replace("%system%", &ctx.system_name);

        let child = Command::new(emu_path)
            .args(args_str.split_whitespace())
            .spawn()
            .map_err(|e| crate::error::NeoCabError::InvalidInput(
                format!("Launch failed: {}", e)
            ))?;

        Ok(LaunchResult {
            process_id: Some(child.id()),
            resolved_path: Some(ctx.rom_path.clone()),
            method: "direct".to_string(),
        })
    }
}
