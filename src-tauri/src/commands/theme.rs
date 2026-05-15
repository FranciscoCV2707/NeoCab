use tauri::State;
use serde_json::json;
use crate::core::{ThemeManager, Theme};
use crate::db::Database;
use std::sync::Arc;

#[tauri::command]
pub async fn set_theme(
    theme_name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.load_theme(&theme_name).await {
        Ok(theme) => {
            match theme_manager.set_theme(theme).await {
                Ok(_) => {
                    let result = json!({
                        "success": true,
                        "message": format!("Theme changed to {}", theme_name),
                        "theme": theme_name
                    });
                    Ok(result.to_string())
                }
                Err(e) => {
                    let error = json!({
                        "success": false,
                        "error": e.to_string()
                    });
                    Err(error.to_string())
                }
            }
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": format!("Failed to load theme: {}", e)
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_current_theme(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let theme = theme_manager.get_current_theme().await;

    let result = json!({
        "success": true,
        "name": theme.name,
        "author": theme.author,
        "version": theme.version,
        "description": theme.description,
        "colors": {
            "primary": theme.colors.primary,
            "secondary": theme.colors.secondary,
            "accent": theme.colors.accent,
            "text": theme.colors.text,
            "background": theme.colors.background,
            "surface": theme.colors.surface,
            "border": theme.colors.border,
            "highlight": theme.colors.highlight,
            "success": theme.colors.success,
            "warning": theme.colors.warning,
            "error": theme.colors.error,
        },
        "fonts": {
            "ui": theme.fonts.ui,
            "title": theme.fonts.title,
            "subtitle": theme.fonts.subtitle,
            "mono": theme.fonts.mono,
        },
        "layout": {
            "system_view": theme.layout.system_view,
            "game_view": theme.layout.game_view,
            "wheel_style": theme.layout.wheel_style,
            "transition": theme.layout.transition,
            "animation_speed": theme.layout.animation_speed,
            "easing": theme.layout.easing,
        },
        "media": {
            "video_enabled": theme.media.video_enabled,
            "video_loop": theme.media.video_loop,
            "snap_type": theme.media.snap_type,
            "marquee_enabled": theme.media.marquee_enabled,
            "wheel_enabled": theme.media.wheel_enabled,
            "box_art_enabled": theme.media.box_art_enabled,
        },
        "sounds": {
            "navigate": theme.sounds.navigate,
            "select": theme.sounds.select,
            "back": theme.sounds.back,
            "coin": theme.sounds.coin,
            "start": theme.sounds.start,
        },
        "effects": {
            "scanlines": theme.effects.scanlines,
            "crt_curve": theme.effects.crt_curve,
            "glow_intensity": theme.effects.glow_intensity,
            "shadow_enabled": theme.effects.shadow_enabled,
        },
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_theme_css(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let theme = theme_manager.get_current_theme().await;

    let css = format!(
        ":root {{\n  --primary: {};\n  --secondary: {};\n  --accent: {};\n  --text: {};\n  --background: {};\n  --surface: {};\n  --border: {};\n  --highlight: {};\n  --success: {};\n  --warning: {};\n  --error: {};\n  --font-ui: {};\n  --font-title: {};\n  --font-subtitle: {};\n  --font-mono: {};\n  --glow-intensity: {};\n  --animation-speed: {}ms;\n  --transition-easing: {};\n}}",
        theme.colors.primary,
        theme.colors.secondary,
        theme.colors.accent,
        theme.colors.text,
        theme.colors.background,
        theme.colors.surface,
        theme.colors.border,
        theme.colors.highlight,
        theme.colors.success,
        theme.colors.warning,
        theme.colors.error,
        theme.fonts.ui,
        theme.fonts.title,
        theme.fonts.subtitle,
        theme.fonts.mono,
        theme.effects.glow_intensity,
        theme.layout.animation_speed,
        theme.layout.easing,
    );

    let result = json!({
        "success": true,
        "css": css
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn list_available_themes(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.list_themes().await {
        Ok(themes) => {
            let result = json!({
                "success": true,
                "themes": themes
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn set_system_theme(
    system: String,
    theme: serde_json::Value,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    let theme_name = theme.get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("default")
        .to_string();

    match db.set_system_theme(&system, &theme_name).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": format!("Theme assigned to {}", system),
                "system": system,
                "theme": theme_name
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn remove_system_theme(
    system: String,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.remove_system_theme(&system).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": format!("Theme assignment removed for {}", system),
                "system": system
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn list_system_themes(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.list_system_themes().await {
        Ok(themes) => {
            let theme_vec: Vec<Vec<String>> = themes.into_iter()
                .map(|(system, theme)| vec![system, theme])
                .collect();

            let result = json!({
                "success": true,
                "themes": theme_vec
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn load_theme(
    name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.load_theme(&name).await {
        Ok(theme) => {
            let result = json!({
                "success": true,
                "theme": theme
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn save_custom_theme(
    theme: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let theme_obj: Theme = match serde_json::from_str(&theme) {
        Ok(t) => t,
        Err(e) => {
            let error = json!({
                "success": false,
                "error": format!("Invalid theme JSON: {}", e)
            });
            return Err(error.to_string());
        }
    };

    match theme_manager.save_custom_theme(theme_obj).await {
        Ok(name) => {
            let result = json!({
                "success": true,
                "theme_name": name
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn export_theme(
    name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.export_theme(&name).await {
        Ok(path) => {
            let result = json!({
                "success": true,
                "export_path": path
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn import_theme(
    path: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.import_theme(&path).await {
        Ok(name) => {
            let result = json!({
                "success": true,
                "theme_name": name
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn apply_theme(
    name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.load_theme(&name).await {
        Ok(theme) => {
            match theme_manager.set_theme(theme).await {
                Ok(_) => {
                    let result = json!({
                        "success": true,
                        "message": format!("Theme applied: {}", name)
                    });
                    Ok(result.to_string())
                }
                Err(e) => {
                    let error = json!({
                        "success": false,
                        "error": e.to_string()
                    });
                    Err(error.to_string())
                }
            }
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": format!("Failed to load theme: {}", e)
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn list_themes(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.list_themes().await {
        Ok(themes) => {
            let result = json!({
                "success": true,
                "themes": themes
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

// Game-level theme assignment commands

#[tauri::command]
pub async fn set_game_theme(
    game_id: i64,
    theme_name: String,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.set_game_theme(game_id, &theme_name).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": format!("Theme '{}' assigned to game {}", theme_name, game_id)
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_game_theme(
    game_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.get_game_theme(game_id).await {
        Ok(theme) => {
            let result = json!({
                "success": true,
                "theme_name": theme
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn remove_game_theme(
    game_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.remove_game_theme(game_id).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": format!("Theme assignment removed for game {}", game_id)
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_all_game_themes(
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.get_all_game_themes().await {
        Ok(themes) => {
            let theme_vec: Vec<serde_json::Value> = themes.into_iter()
                .map(|(game_id, theme)| json!({ "game_id": game_id, "theme": theme }))
                .collect();

            let result = json!({
                "success": true,
                "themes": theme_vec
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn resolve_game_theme(
    game_id: i64,
    system_name: String,
    db: State<'_, Arc<Database>>,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    if let Ok(Some(theme_name)) = db.get_game_theme(game_id).await {
        return Ok(json!({ "success": true, "theme": theme_name, "source": "game" }).to_string());
    }
    if let Ok(Some(theme_name)) = db.get_system_theme(&system_name).await {
        return Ok(json!({ "success": true, "theme": theme_name, "source": "system" }).to_string());
    }
    let global = theme_manager.get_current_theme().await;
    Ok(json!({ "success": true, "theme": global.name, "source": "global" }).to_string())
}
