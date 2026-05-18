use super::strategy::{LaunchContext, LaunchResult, LaunchStrategy};
use crate::error::Result;
use async_trait::async_trait;

pub struct ZipExtractStrategy;

#[async_trait]
impl LaunchStrategy for ZipExtractStrategy {
    fn name(&self) -> &str {
        "zip_extract"
    }
    fn priority(&self) -> u32 {
        20
    }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        let ext = ctx.rom_path.extension().and_then(|e| e.to_str());
        matches!(ext, Some("zip" | "7z" | "rar"))
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let temp_dir = std::env::temp_dir().join("neocab-extract");
        std::fs::create_dir_all(&temp_dir).map_err(|e| {
            crate::error::NeoCabError::InvalidInput(format!("Cannot create temp dir: {}", e))
        })?;

        let rom_str = ctx.rom_path.to_string_lossy();

        #[cfg(windows)]
        {
            // Use PowerShell to extract
            let ps_script = format!(
                "Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
                rom_str,
                temp_dir.to_string_lossy()
            );
            std::process::Command::new("powershell")
                .args(["-Command", &ps_script])
                .output()
                .ok();
        }

        #[cfg(not(windows))]
        {
            std::process::Command::new("unzip")
                .arg("-o")
                .arg(&rom_str)
                .arg("-d")
                .arg(&temp_dir)
                .output()
                .ok();
        }

        // Find the first ROM file in extracted dir
        let first_rom = find_first_rom(&temp_dir);

        match first_rom {
            Some(rom) => {
                let child = ctx
                    .emulator_path
                    .as_ref()
                    .map(|emu| std::process::Command::new(emu).arg(&rom).spawn());

                match child {
                    Some(Ok(c)) => Ok(LaunchResult {
                        process_id: Some(c.id()),
                        resolved_path: Some(rom),
                        method: "zip_extract".to_string(),
                    }),
                    _ => Err(crate::error::NeoCabError::InvalidInput(
                        "No emulator configured".into(),
                    )),
                }
            }
            None => Err(crate::error::NeoCabError::InvalidInput(
                "No ROMs found in archive".into(),
            )),
        }
    }
}

fn find_first_rom(dir: &std::path::Path) -> Option<std::path::PathBuf> {
    let rom_exts = [
        "nes", "snes", "smc", "fig", "gen", "bin", "iso", "cue", "gba", "gb", "n64", "z64",
    ];
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if rom_exts.contains(&ext.to_lowercase().as_str()) {
                    return Some(path);
                }
            }
        }
    }
    None
}
