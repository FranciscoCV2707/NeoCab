use async_trait::async_trait;
use super::strategy::{LaunchStrategy, LaunchContext, LaunchResult};
use std::process::Command;
use crate::error::Result;

pub struct BatchFileStrategy;

#[async_trait]
impl LaunchStrategy for BatchFileStrategy {
    fn name(&self) -> &str { "batch_file" }
    fn priority(&self) -> u32 { 30 }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        ctx.rom_path.extension().map(|e| e == "bat").unwrap_or(false)
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let rom_str = ctx.rom_path.to_string_lossy();
        let child = Command::new("cmd")
            .args(["/c", &rom_str])
            .spawn()
            .map_err(|e| crate::error::NeoCabError::InvalidInput(
                format!("Batch launch failed: {}", e)
            ))?;

        Ok(LaunchResult {
            process_id: Some(child.id()),
            resolved_path: Some(ctx.rom_path.clone()),
            method: "batch".to_string(),
        })
    }
}
