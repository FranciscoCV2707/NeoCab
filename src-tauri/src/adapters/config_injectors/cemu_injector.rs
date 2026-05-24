use super::injector_trait::{EmulatorConfigInjector, EmulatorSettings};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;

pub struct CemuInjector;

#[async_trait]
impl EmulatorConfigInjector for CemuInjector {
    fn name(&self) -> &str {
        "cemu"
    }

    fn display_name(&self) -> &str {
        "Cemu"
    }

    fn can_handle(&self, emulator_path: &str) -> bool {
        let lower = emulator_path.to_lowercase();
        lower.contains("cemu")
    }

    fn get_config_dir(&self, emulator_path: &str) -> String {
        let path = PathBuf::from(emulator_path);
        path.parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    }

    async fn read_current(&self, config_dir: &str) -> Result<EmulatorSettings, String> {
        let settings_path = PathBuf::from(config_dir).join("settings.xml");
        if !settings_path.exists() {
            return Ok(EmulatorSettings::default());
        }

        let content = fs::read_to_string(&settings_path)
            .map_err(|e| format!("Cannot read cemu settings.xml: {}", e))?;

        let mut settings = EmulatorSettings::default();

        // Simple stateful parser for XML tags
        let mut in_graphic = false;
        let mut in_audio = false;

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.contains("<Graphic>") {
                in_graphic = true;
                continue;
            }
            if trimmed.contains("</Graphic>") {
                in_graphic = false;
                continue;
            }
            if trimmed.contains("<Audio>") {
                in_audio = true;
                continue;
            }
            if trimmed.contains("</Audio>") {
                in_audio = false;
                continue;
            }

            if in_graphic {
                if let Some(val) = extract_xml_tag(trimmed, "api") {
                    settings.video.renderer = Some(match val.as_str() {
                        "1" => "vulkan".to_string(),
                        "0" => "opengl".to_string(),
                        _ => val,
                    });
                }
                if let Some(val) = extract_xml_tag(trimmed, "VSync") {
                    settings.video.vsync = Some(val == "1");
                }
                if let Some(val) = extract_xml_tag(trimmed, "AsyncCompile") {
                    settings.advanced.insert("AsyncCompile".to_string(), val);
                }
            } else if in_audio {
                if let Some(val) = extract_xml_tag(trimmed, "TVVolume") {
                    if let Ok(v) = val.parse::<f32>() {
                        settings.audio.volume = Some(v / 100.0);
                    }
                }
            } else {
                // Root tags
                if let Some(val) = extract_xml_tag(trimmed, "fullscreen") {
                    settings.video.fullscreen = Some(val == "true");
                }
                if let Some(val) = extract_xml_tag(trimmed, "use_discord_presence") {
                    settings.advanced.insert("DiscordPresence".to_string(), val);
                }
                if let Some(val) = extract_xml_tag(trimmed, "console_language") {
                    settings.advanced.insert("ConsoleLanguage".to_string(), val);
                }
            }
        }

        Ok(settings)
    }

    async fn inject(&self, config_dir: &str, settings: &EmulatorSettings) -> Result<(), String> {
        let settings_path = PathBuf::from(config_dir).join("settings.xml");
        let content = if settings_path.exists() {
            fs::read_to_string(&settings_path)
                .map_err(|e| format!("Cannot read cemu settings.xml: {}", e))?
        } else {
            // Default template if file doesn't exist
            r#"<?xml version="1.0" encoding="UTF-8"?>
<content>
    <fullscreen>false</fullscreen>
    <use_discord_presence>true</use_discord_presence>
    <console_language>1</console_language>
    <Graphic>
        <api>1</api>
        <VSync>0</VSync>
        <AsyncCompile>false</AsyncCompile>
    </Graphic>
    <Audio>
        <TVVolume>50</TVVolume>
    </Audio>
</content>
"#.to_string()
        };

        let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();

        // Inject Root tags
        if let Some(fs_val) = settings.video.fullscreen {
            set_or_insert_root_tag(&mut lines, "fullscreen", &fs_val.to_string());
        }
        if let Some(dp_val) = settings.advanced.get("DiscordPresence") {
            set_or_insert_root_tag(&mut lines, "use_discord_presence", dp_val);
        }
        if let Some(lang_val) = settings.advanced.get("ConsoleLanguage") {
            set_or_insert_root_tag(&mut lines, "console_language", lang_val);
        }

        // Inject Graphic section tags
        let mut graphic_updates = Vec::new();
        if let Some(renderer) = &settings.video.renderer {
            let api_val = match renderer.to_lowercase().as_str() {
                "vulkan" => "1",
                "opengl" => "0",
                _ => "1",
            };
            graphic_updates.push(("api", api_val.to_string()));
        }
        if let Some(vsync) = settings.video.vsync {
            graphic_updates.push(("VSync", if vsync { "1".to_string() } else { "0".to_string() }));
        }
        if let Some(async_compile) = settings.advanced.get("AsyncCompile") {
            graphic_updates.push(("AsyncCompile", async_compile.clone()));
        }
        if !graphic_updates.is_empty() {
            set_or_insert_section_tags(&mut lines, "Graphic", &graphic_updates);
        }

        // Inject Audio section tags
        if let Some(vol) = settings.audio.volume {
            let vol_val = format!("{:.0}", vol * 100.0);
            set_or_insert_section_tags(&mut lines, "Audio", &[("TVVolume", vol_val)]);
        }

        let new_content = lines.join("\n") + "\n";
        fs::write(&settings_path, new_content)
            .map_err(|e| format!("Cannot write cemu settings.xml: {}", e))?;

        Ok(())
    }
}

fn extract_xml_tag(line: &str, tag: &str) -> Option<String> {
    let start_tag = format!("<{}>", tag);
    let end_tag = format!("</{}>", tag);
    if let (Some(start_idx), Some(end_idx)) = (line.find(&start_tag), line.find(&end_tag)) {
        if start_idx < end_idx {
            let val = &line[start_idx + start_tag.len()..end_idx];
            return Some(val.trim().to_string());
        }
    }
    None
}

fn set_or_insert_root_tag(lines: &mut Vec<String>, tag: &str, value: &str) {
    let start_tag = format!("<{}>", tag);
    let mut found = false;

    // Search root tags outside blocks
    let mut in_block = false;
    for line in lines.iter_mut() {
        let trimmed = line.trim();
        if trimmed.starts_with("<Graphic>") || trimmed.starts_with("<Audio>") || trimmed.starts_with("<RecentLaunchFiles>") || trimmed.starts_with("<GameCache>") {
            in_block = true;
            continue;
        }
        if trimmed.starts_with("</Graphic>") || trimmed.starts_with("</Audio>") || trimmed.starts_with("</RecentLaunchFiles>") || trimmed.starts_with("</GameCache>") {
            in_block = false;
            continue;
        }

        if !in_block && trimmed.contains(&start_tag) {
            if let Some(start_idx) = line.find(&start_tag) {
                let leading_whitespace = &line[..start_idx];
                *line = format!("{}<{}>{}</{}>", leading_whitespace, tag, value, tag);
                found = true;
                break;
            }
        }
    }

    if !found {
        // Insert before </content>
        if let Some(pos) = lines.iter().position(|l| l.trim() == "</content>") {
            lines.insert(pos, format!("    <{}>{}</{}>", tag, value, tag));
        } else {
            lines.push(format!("<{}>{}</{}>", tag, value, tag));
        }
    }
}

fn set_or_insert_section_tags(lines: &mut Vec<String>, section: &str, tags: &[(&str, String)]) {
    let start_section = format!("<{}>", section);
    let end_section = format!("</{}>", section);

    let start_pos = lines.iter().position(|l| l.trim() == start_section);

    if let Some(s_pos) = start_pos {
        let e_pos = lines.iter().skip(s_pos).position(|l| l.trim() == end_section).map(|idx| s_pos + idx);
        if let Some(e_pos) = e_pos {
            // Find existing tags and update, or insert new ones before end_section
            for &(tag, ref val) in tags {
                let start_tag = format!("<{}>", tag);
                let mut tag_found = false;
                for line in lines.iter_mut().take(e_pos).skip(s_pos + 1) {
                    if line.trim().contains(&start_tag) {
                        if let Some(start_idx) = line.find(&start_tag) {
                            let leading_whitespace = &line[..start_idx];
                            *line = format!("{}<{}>{}</{}>", leading_whitespace, tag, val, tag);
                            tag_found = true;
                            break;
                        }
                    }
                }
                if !tag_found {
                    lines.insert(e_pos, format!("        <{}>{}</{}>", tag, val, tag));
                }
            }
        }
    } else {
        // Section not found, append section to the end (before </content>)
        let mut new_lines = Vec::new();
        new_lines.push(format!("    <{}>", section));
        for &(tag, ref val) in tags {
            new_lines.push(format!("        <{}>{}</{}>", tag, val, tag));
        }
        new_lines.push(format!("    </{}>", section));

        if let Some(pos) = lines.iter().position(|l| l.trim() == "</content>") {
            for (offset, line) in new_lines.into_iter().enumerate() {
                lines.insert(pos + offset, line);
            }
        } else {
            lines.extend(new_lines);
        }
    }
}
