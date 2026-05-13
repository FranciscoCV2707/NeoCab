use tauri::State;
use serde_json::json;
use crate::core::{ThemeManager, Theme, ThemeInfo};

#[tauri::command]
pub async fn list_themes(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.list_themes().await {
        Ok(themes) => {
            let result = json!({
                "success": true,
                "themes": themes,
                "count": themes.len()
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
pub async fn get_current_theme(
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    let theme = theme_manager.get_current_theme().await;
    let result = json!(theme);
    Ok(result.to_string())
}

#[tauri::command]
pub async fn load_theme(
    name: String,
    theme_manager: State<'_, ThemeManager>,
) -> Result<String, String> {
    match theme_manager.load_theme(&name).await {
        Ok(theme) => {
            match theme_manager.set_theme(theme.clone()).await {
                Ok(_) => {
                    let result = json!({
                        "success": true,
                        "theme": theme,
                        "message": format!("Loaded theme: {}", name)
                    });
                    Ok(result.to_string())
                }
                Err(e) => Err(json!({"error": e.to_string()}).to_string()),
            }
        }
        Err(e) => Err(json!({"error": e.to_string()}).to_string()),
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
            return Err(json!({"error": format!("Invalid theme JSON: {}", e)}).to_string())
        }
    };

    if let Err(e) = theme_manager.validate_theme(&theme_obj) {
        return Err(json!({"error": e.to_string()}).to_string());
    }

    match theme_manager.save_custom_theme(theme_obj).await {
        Ok(theme_name) => {
            let result = json!({
                "success": true,
                "theme_name": theme_name,
                "message": "Theme saved successfully"
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
                "export_path": path,
                "message": format!("Theme '{}' exported", name)
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
        Ok(theme_name) => {
            let result = json!({
                "success": true,
                "theme_name": theme_name,
                "message": format!("Theme imported: {}", theme_name)
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
            if let Err(e) = theme_manager.set_theme(theme).await {
                return Err(json!({"error": e.to_string()}).to_string());
            }

            let result = json!({
                "success": true,
                "message": format!("Theme '{}' applied", name)
            });
            Ok(result.to_string())
        }
        Err(e) => Err(json!({"error": e.to_string()}).to_string()),
    }
}
