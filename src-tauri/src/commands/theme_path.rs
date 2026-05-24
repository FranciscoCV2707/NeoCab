use crate::core::ThemeManager;
use std::fs;
use tauri::State;

#[tauri::command]
pub fn get_theme_path(
    theme_name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let path = theme_manager.get_themes_dir().join(&theme_name);
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_theme_folder(
    theme_name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<(), String> {
    let path = theme_manager.get_themes_dir().join(&theme_name);
    if !path.exists() {
        return Err(format!("Theme folder not found: {}", theme_name));
    }
    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&path_str)
        .spawn()
        .map_err(|e| format!("Failed to open explorer: {}", e))?;

    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&path_str)
        .spawn()
        .map_err(|e| format!("Failed to open finder: {}", e))?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(&path_str)
        .spawn()
        .map_err(|e| format!("Failed to open file manager: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn create_theme_from_template(
    name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let slug = name.to_lowercase().replace(' ', "-");
    let theme_dir = theme_manager.get_themes_dir().join(&slug);

    if theme_dir.exists() {
        return Err(format!("Theme '{}' already exists", slug));
    }

    fs::create_dir_all(&theme_dir)
        .map_err(|e| format!("Failed to create theme dir: {}", e))?;

    // theme.json with defaults
    let theme_json = serde_json::json!({
        "name": name,
        "version": "1.0.0",
        "author": "Custom",
        "style": "custom",
        "description": "Mi tema personalizado",
        "colors": {
            "primary": "#ff6b00",
            "secondary": "#1a1a1a",
            "accent": "#00ffcc",
            "text": "#ffffff",
            "background": "#0a0a0a",
            "surface": "#1a1a1a",
            "border": "#ff6b00",
            "highlight": "#ff8c00",
            "success": "#00c853",
            "warning": "#ffcc00",
            "error": "#ff1744"
        },
        "fonts": { "ui": "Arial", "title": "Impact", "subtitle": "Arial", "mono": "Consolas", "google_font": "" },
        "background": { "type": "color", "color": "#0a0a0a", "gradient": null, "image": null, "video": null, "opacity": 1.0, "blur": 0, "overlay_color": null },
        "layout": { "system_view": "carousel", "game_view": "split", "wheel_style": "3d", "transition": "slide", "animation_speed": 300, "easing": "easeOutCubic" },
        "wheel": { "item_size": 120, "item_spacing": 15, "animation_duration": 300, "selected_color": "#ff6b00", "unselected_color": "#444444", "selected_scale": 1.15, "glow_selected": true },
        "effects": { "scanlines": false, "crt_curve": 0, "glow_intensity": 0.5, "shadow_enabled": true, "vignette": 0.0, "noise": 0.0, "blur_unselected": 0 },
        "overlay": { "coin_position": "top-right", "timer_position": "bottom-right", "stats_opacity": 0.8, "animation_style": "smooth" },
        "media": { "video_enabled": true, "video_loop": true, "snap_type": "video", "marquee_enabled": true, "wheel_enabled": true, "box_art_enabled": true },
        "sounds": { "navigate": "nav.wav", "select": "select.wav", "back": "back.wav", "coin": "coin.wav", "start": "start.wav" },
        "screens": {
            "systems": {
                "widgets": [
                    { "id": "bg",      "type": "background",   "x": 0,  "y": 0,  "w": 100, "h": 100, "z": 0, "visible": true, "config": {} },
                    { "id": "wheel",   "type": "system-wheel",  "x": 10, "y": 5,  "w": 80,  "h": 60,  "z": 1, "visible": true, "config": { "style": "carousel" } },
                    { "id": "logo",    "type": "system-logo",   "x": 35, "y": 70, "w": 30,  "h": 20,  "z": 2, "visible": true, "config": { "use_png": false, "fallback": "initial" } },
                    { "id": "clock",   "type": "clock",          "x": 82, "y": 2,  "w": 16,  "h": 7,   "z": 3, "visible": true, "config": {} },
                    { "id": "credits", "type": "credits",        "x": 2,  "y": 2,  "w": 16,  "h": 7,   "z": 3, "visible": true, "config": {} }
                ]
            }
        }
    });
    fs::write(theme_dir.join("theme.json"), theme_json.to_string())
        .map_err(|e| format!("Failed to write theme.json: {}", e))?;

    // metadata.json
    fs::write(theme_dir.join("metadata.json"), r#"{"is_custom":true}"#)
        .map_err(|e| format!("Failed to write metadata.json: {}", e))?;

    // Copy template CSS from arcade-classic
    let template_css = include_str!("../../bundled-themes/arcade-classic/theme.css");
    fs::write(theme_dir.join("theme.css"), template_css)
        .map_err(|e| format!("Failed to write theme.css: {}", e))?;

    // Copy template JS from arcade-classic
    let template_js = include_str!("../../bundled-themes/arcade-classic/theme.js");
    fs::write(theme_dir.join("theme.js"), template_js)
        .map_err(|e| format!("Failed to write theme.js: {}", e))?;

    Ok(theme_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn import_theme_folder(folder_path: String, theme_manager: State<'_, ThemeManager>) -> Result<String, String> {
    let src = std::path::PathBuf::from(&folder_path);
    if !src.exists() || !src.is_dir() {
        return Err(format!("Not a valid folder: {}", folder_path));
    }

    // Check that it contains theme.json
    if !src.join("theme.json").exists() {
        return Err("Folder must contain a theme.json file".to_string());
    }

    let folder_name = src
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid folder name")?
        .to_string();

    let dest = theme_manager.get_themes_dir().join(&folder_name);
    fs::create_dir_all(&dest)
        .map_err(|e| format!("Failed to create dest dir: {}", e))?;

    // Copy all files (non-recursive — themes are flat)
    for entry in fs::read_dir(&src).map_err(|e| format!("Failed to read folder: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();
        if entry_path.is_file() {
            let file_name = entry_path.file_name().unwrap();
            fs::copy(&entry_path, dest.join(file_name))
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }

    // Ensure metadata.json marks it as custom
    fs::write(dest.join("metadata.json"), r#"{"is_custom":true}"#)
        .map_err(|e| format!("Failed to write metadata.json: {}", e))?;

    Ok(folder_name)
}
