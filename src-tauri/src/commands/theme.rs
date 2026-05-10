use tauri::State;
use serde_json::json;
use crate::core::{ThemeManager, Theme};

#[tauri::command]
pub async fn set_theme(
    theme_name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match Theme::from_str(&theme_name) {
        Some(theme) => {
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
        None => {
            let error = json!({
                "success": false,
                "error": format!("Unknown theme: {}", theme_name)
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_current_theme(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let theme_name = theme_manager.get_theme_name().await;
    let theme_config = theme_manager.get_current_theme().await;

    let result = json!({
        "success": true,
        "theme": theme_name,
        "config": {
            "primary_color": theme_config.primary_color,
            "secondary_color": theme_config.secondary_color,
            "accent_color": theme_config.accent_color,
            "background_color": theme_config.background_color,
            "text_color": theme_config.text_color,
            "font_family": theme_config.font_family,
        }
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_theme_css(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let css = theme_manager.get_css_variables().await;
    let result = json!({
        "success": true,
        "css": css
    });
    Ok(result.to_string())
}

#[tauri::command]
pub fn list_available_themes() -> Result<String, String> {
    let result = json!({
        "success": true,
        "themes": ["classic", "neon", "cyberpunk"]
    });
    Ok(result.to_string())
}
