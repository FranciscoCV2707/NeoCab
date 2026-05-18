use super::strategy::{LaunchContext, LaunchResult, LaunchStrategy};
use crate::error::Result;
use async_trait::async_trait;

pub struct ShortcutStrategy;

#[async_trait]
impl LaunchStrategy for ShortcutStrategy {
    fn name(&self) -> &str {
        "shortcut"
    }
    fn priority(&self) -> u32 {
        40
    }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        let ext = ctx.rom_path.extension().and_then(|e| e.to_str());
        matches!(ext, Some("lnk" | "url"))
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let rom_str = ctx.rom_path.to_string_lossy();

        #[cfg(windows)]
        {
            // ShellExecute via cmd
            let child = std::process::Command::new("cmd")
                .args(["/c", "start", "", &rom_str])
                .spawn()
                .map_err(|e| {
                    crate::error::NeoCabError::InvalidInput(format!(
                        "Shortcut launch failed: {}",
                        e
                    ))
                })?;

            return Ok(LaunchResult {
                process_id: Some(child.id()),
                resolved_path: None,
                method: "shortcut".to_string(),
            });
        }

        #[cfg(not(windows))]
        {
            let child = std::process::Command::new("xdg-open")
                .arg(&rom_str)
                .spawn()
                .map_err(|e| {
                    crate::error::NeoCabError::InvalidInput(format!(
                        "Shortcut launch failed: {}",
                        e
                    ))
                })?;

            Ok(LaunchResult {
                process_id: Some(child.id()),
                resolved_path: None,
                method: "shortcut".to_string(),
            })
        }
    }
}
