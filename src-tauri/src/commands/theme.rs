use tauri::State;
use serde_json::json;
use crate::core::{ThemeManager, Theme};

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
        "colors": {
            "primary": theme.colors.primary,
            "secondary": theme.colors.secondary,
            "accent": theme.colors.accent,
            "text": theme.colors.text,
            "background": theme.colors.background,
        },
        "fonts": {
            "ui": theme.fonts.ui,
            "display": theme.fonts.display,
            "menu": theme.fonts.menu,
        }
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_theme_css(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let theme = theme_manager.get_current_theme().await;

    // Generate CSS variables from theme
    let css = format!(
        ":root {{\n  --primary: {};\n  --secondary: {};\n  --accent: {};\n  --text: {};\n  --background: {};\n}}",
        theme.colors.primary,
        theme.colors.secondary,
        theme.colors.accent,
        theme.colors.text,
        theme.colors.background
    );

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
