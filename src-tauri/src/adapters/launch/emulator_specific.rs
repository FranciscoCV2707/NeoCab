use super::strategy::{LaunchContext, LaunchResult, LaunchStrategy};
use crate::error::Result;
use async_trait::async_trait;
use std::process::Command;

pub struct EmulatorSpecificStrategy;

fn launch_disc_image_internal(ctx: &LaunchContext) -> Result<LaunchResult> {
    let path_str = ctx.rom_path.to_string_lossy();
    let path_lower = path_str.to_lowercase();
    let path_owned = path_str.to_string();

    if path_lower.ends_with("chd") {
        let emu_path = ctx.emulator_path.as_ref();
        if let Some(emu) = emu_path {
            let child = Command::new(emu)
                .arg(&path_owned)
                .spawn()
                .map_err(|e| crate::error::NeoCabError::InvalidInput(format!("CHD launch failed: {}", e)))?;
            return Ok(LaunchResult {
                process_id: Some(child.id()),
                resolved_path: Some(ctx.rom_path.clone()),
                method: "chd".to_string(),
            });
        }
    }

    let ext = ctx.rom_path.extension().and_then(|e| e.to_str()).unwrap_or("");
    Err(crate::error::NeoCabError::InvalidInput(format!(
        "Cannot handle disc image: .{}",
        ext
    )))
}

fn launch_playlist_internal(ctx: &LaunchContext) -> Result<LaunchResult> {
    let content = std::fs::read_to_string(&ctx.rom_path)
        .map_err(|_| crate::error::NeoCabError::InvalidInput("Cannot read playlist".into()))?;

    let first_line = content.lines().next().unwrap_or("").trim();
    if first_line.is_empty() {
        return Err(crate::error::NeoCabError::InvalidInput("Empty playlist".into()));
    }

    let rom_path = ctx.rom_path.parent().unwrap().join(first_line);
    if !rom_path.exists() {
        return Err(crate::error::NeoCabError::InvalidInput(format!(
            "ROM not found in playlist: {}",
            first_line
        )));
    }

    let emu_path = ctx.emulator_path.as_ref();
    if let Some(emu) = emu_path {
        let child = Command::new(emu)
            .arg(&rom_path)
            .spawn()
            .map_err(|e| crate::error::NeoCabError::InvalidInput(format!("Playlist launch failed: {}", e)))?;
        return Ok(LaunchResult {
            process_id: Some(child.id()),
            resolved_path: Some(rom_path),
            method: "playlist".to_string(),
        });
    }

    Err(crate::error::NeoCabError::InvalidInput("No emulator configured".into()))
}

#[async_trait]
impl LaunchStrategy for EmulatorSpecificStrategy {
    fn name(&self) -> &str {
        "emulator_specific"
    }

    fn priority(&self) -> u32 {
        5
    }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        let ext = ctx.rom_path.extension().and_then(|e| e.to_str());

        let emulator_specific_extensions = [
            "m3u", "m3u8", "ccd", "chd", "rvz", "pcsx2", "yuzu", "citra", "cemu", "rpcs3",
            "xenia",
        ];

        emulator_specific_extensions.iter().any(|e| {
            ctx.rom_path
                .to_string_lossy()
                .to_lowercase()
                .contains(&e.to_lowercase())
        }) || ext == Some("m3u")
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        let path_str = ctx.rom_path.to_string_lossy();
        let path_lower = path_str.to_lowercase();
        let path_owned = path_str.to_string();

        let args: Vec<&str>;
        let emulator: &str;

        if path_lower.contains("dolphin") || path_lower.contains("wad") {
            emulator = "dolphin";
            args = vec!["--eval", &path_owned];
        } else if path_lower.contains("pcsx2") || path_lower.contains("ccd") {
            emulator = "pcsx2";
            args = vec![&path_owned];
        } else if path_lower.contains("yuzu") {
            emulator = "yuzu";
            args = vec![&path_owned];
        } else if path_lower.contains("citra") {
            emulator = "citra";
            args = vec![&path_owned];
        } else if path_lower.contains("cemu") {
            emulator = "cemu";
            args = vec!["-g", &path_owned];
        } else if path_lower.contains("rpcs3") || path_lower.contains("ps3") {
            emulator = "rpcs3";
            args = vec![&path_owned];
        } else if path_lower.contains("xenia") || path_lower.contains("xbox360") {
            emulator = "xenia";
            args = vec![&path_owned];
        } else if path_lower.contains("chd") || path_lower.contains("rvz") {
            return launch_disc_image_internal(ctx);
        } else if path_lower.ends_with("m3u") || path_lower.ends_with("m3u8") {
            return launch_playlist_internal(ctx);
        } else {
            return Err(crate::error::NeoCabError::InvalidInput(
                "No specific emulator found".into(),
            ));
        };

        let child = Command::new(emulator).args(&args).spawn().map_err(|e| {
            crate::error::NeoCabError::InvalidInput(format!("Launch failed: {}", e))
        })?;

        Ok(LaunchResult {
            process_id: Some(child.id()),
            resolved_path: Some(ctx.rom_path.clone()),
            method: format!("emulator_{}", emulator),
        })
    }
}