use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Default, Clone)]
pub struct CatVerData {
    pub category: Option<String>,
    pub orientation: Option<String>,
}

#[derive(Debug, Default, Clone)]
pub struct ControlsData {
    pub buttons: Option<i64>,
    pub control_type: Option<String>,
    pub joystick_direction: Option<String>,
}

/// Parses a CatVer.ini file to map MAME ROM names to categories and orientations
pub fn parse_catver<P: AsRef<Path>>(path: P) -> Result<HashMap<String, CatVerData>, String> {
    let content_bytes = fs::read(path).map_err(|e| format!("Failed to read CatVer file: {}", e))?;
    let content = String::from_utf8_lossy(&content_bytes);

    let mut map: HashMap<String, CatVerData> = HashMap::new();
    let mut current_section = String::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with(';') || trimmed.starts_with('#') {
            continue;
        }

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            current_section = trimmed[1..trimmed.len() - 1].to_string();
            continue;
        }

        if let Some(idx) = trimmed.find('=') {
            let rom = trimmed[..idx].trim().to_string();
            let val = trimmed[idx + 1..].trim().to_string();

            if current_section.eq_ignore_ascii_case("Category") {
                let entry = map.entry(rom).or_insert_with(|| CatVerData { category: None, orientation: None });
                entry.category = Some(val);
            } else if current_section.eq_ignore_ascii_case("Orientation") {
                let entry = map.entry(rom).or_insert_with(|| CatVerData { category: None, orientation: None });
                entry.orientation = Some(val);
            }
        }
    }

    Ok(map)
}

/// Parses a controls.dat file to map MAME ROM names to their control and button layouts
pub fn parse_controls_dat<P: AsRef<Path>>(path: P) -> Result<HashMap<String, ControlsData>, String> {
    let content_bytes = fs::read(path).map_err(|e| format!("Failed to read controls.dat file: {}", e))?;
    let content = String::from_utf8_lossy(&content_bytes);

    let mut map: HashMap<String, ControlsData> = HashMap::new();
    let mut current_section_name = String::new();
    let mut current_properties: HashMap<String, String> = HashMap::new();

    let mut parse_section = |section_name: &str, props: &HashMap<String, String>| {
        if section_name.is_empty() || section_name.eq_ignore_ascii_case("info") || section_name.eq_ignore_ascii_case("credentials") {
            return;
        }

        // Determine ROM name: check "romname" property, fallback to section name
        let rom = if let Some(r) = props.get("romname") {
            r.clone()
        } else {
            section_name.to_string()
        };

        let buttons = props.get("buttons").and_then(|s| s.parse::<i64>().ok());
        let control_type = props.get("control").cloned();
        let joystick_direction = props.get("direction").cloned();

        map.insert(rom, ControlsData {
            buttons,
            control_type,
            joystick_direction,
        });
    };

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with(';') || trimmed.starts_with('#') {
            continue;
        }

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            parse_section(&current_section_name, &current_properties);
            current_properties.clear();
            current_section_name = trimmed[1..trimmed.len() - 1].to_string();
        } else {
            if let Some(idx) = trimmed.find('=') {
                let k = trimmed[..idx].trim().to_string();
                let v = trimmed[idx + 1..].trim().to_string();
                current_properties.insert(k, v);
            }
        }
    }
    // Process the final section in the file
    parse_section(&current_section_name, &current_properties);

    Ok(map)
}
