use super::strategy::{LaunchContext, LaunchResult, LaunchStrategy};
use crate::error::Result;
use async_trait::async_trait;
use std::process::Command;

pub struct SteamLaunchStrategy;

#[async_trait]
impl LaunchStrategy for SteamLaunchStrategy {
    fn name(&self) -> &str {
        "steam"
    }

    fn priority(&self) -> u32 {
        10
    }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        let ext = ctx.rom_path.extension().and_then(|e| e.to_str());
        ext == Some("lnk") || ext == Some("url") || ext == Some("steam")
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let path_str = ctx.rom_path.to_string_lossy();
        let ext = ctx.rom_path.extension().and_then(|e| e.to_str());

        match ext {
            Some("steam") => {
                let app_id = std::fs::read_to_string(&ctx.rom_path)
                    .map_err(|_| crate::error::NeoCabError::InvalidInput("Cannot read steam appid".into()))?;
                let child = Command::new("steam")
                    .args(["-applaunch", app_id.trim()])
                    .spawn()
                    .map_err(|e| crate::error::NeoCabError::InvalidInput(format!("Steam launch failed: {}", e)))?;
                Ok(LaunchResult {
                    process_id: Some(child.id()),
                    resolved_path: Some(ctx.rom_path.clone()),
                    method: "steam_appid".to_string(),
                })
            }
            Some("url") => {
                let url = std::fs::read_to_string(&ctx.rom_path)
                    .map_err(|_| crate::error::NeoCabError::InvalidInput("Cannot read URL file".into()))?;
                let url = url.trim();
                #[cfg(windows)]
                {
                    Command::new("cmd")
                        .args(["/C", "start", "", url])
                        .spawn()
                        .map_err(|e| crate::error::NeoCabError::InvalidInput(format!("URL launch failed: {}", e)))?;
                }
                Ok(LaunchResult {
                    process_id: None,
                    resolved_path: Some(ctx.rom_path.clone()),
                    method: "url".to_string(),
                })
            }
            _ => {
                if path_str.contains("steam://") || path_str.contains("com.epicgames.launcher://") {
                    #[cfg(windows)]
                    {
                        Command::new("cmd")
                            .args(["/C", "start", "", &path_str])
                            .spawn()
                            .ok();
                    }
                    Ok(LaunchResult {
                        process_id: None,
                        resolved_path: Some(ctx.rom_path.clone()),
                        method: "store_url".to_string(),
                    })
                } else {
                    Err(crate::error::NeoCabError::InvalidInput("Not a steam URL".into()))
                }
            }
        }
    }
}