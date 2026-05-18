use super::strategy::{LaunchContext, LaunchResult, LaunchStrategy};
use crate::error::Result;
use async_trait::async_trait;
use std::process::Command;

pub struct StoreLaunchStrategy;

#[async_trait]
impl LaunchStrategy for StoreLaunchStrategy {
    fn name(&self) -> &str {
        "store_launcher"
    }

    fn priority(&self) -> u32 {
        15
    }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        let path_str = ctx.rom_path.to_string_lossy().to_lowercase();
        path_str.contains("epic://") ||
        path_str.contains("com.epicgames.launcher://") ||
        path_str.contains("gog://") ||
        path_str.contains("origin://") ||
        path_str.contains("ubisoft://") ||
        path_str.contains("battlenet://") ||
        path_str.contains("amazon://")
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let path_str = ctx.rom_path.to_string_lossy();

        #[cfg(windows)]
        {
            Command::new("cmd")
                .args(["/C", "start", "", &path_str])
                .spawn()
                .map_err(|e| crate::error::NeoCabError::InvalidInput(format!("Store launch failed: {}", e)))?;
        }

        #[cfg(not(windows))]
        {
            Command::new("xdg-open")
                .arg(&path_str)
                .spawn()
                .map_err(|e| crate::error::NeoCabError::InvalidInput(format!("Store launch failed: {}", e)))?;
        }

        let method = if path_str.contains("epic") || path_str.contains("gog") {
            "store".to_string()
        } else if path_str.contains("origin") {
            "origin".to_string()
        } else if path_str.contains("ubisoft") {
            "ubisoft".to_string()
        } else if path_str.contains("battlenet") {
            "battlenet".to_string()
        } else {
            "store".to_string()
        };

        Ok(LaunchResult {
            process_id: None,
            resolved_path: Some(ctx.rom_path.clone()),
            method,
        })
    }
}