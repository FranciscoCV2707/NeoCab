use tauri::State;
use serde_json::json;
use crate::core::OperatorPanel;
use crate::db::Database;

#[tauri::command]
pub async fn authenticate_operator(
    pin: String,
    operator_panel: State<'_, OperatorPanel>,
) -> Result<String, String> {
    match operator_panel.authenticate(&pin).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "Authentication successful",
                "auth_level": "operator"
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
pub async fn logout_operator(
    operator_panel: State<'_, OperatorPanel>,
) -> Result<String, String> {
    operator_panel.logout().await;
    let result = json!({
        "success": true,
        "message": "Logged out successfully"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn is_operator_authenticated(
    operator_panel: State<'_, OperatorPanel>,
) -> Result<String, String> {
    let is_auth = operator_panel.is_authenticated().await;
    let result = json!({
        "success": true,
        "authenticated": is_auth
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn change_operator_pin(
    old_pin: String,
    new_pin: String,
    operator_panel: State<'_, OperatorPanel>,
) -> Result<String, String> {
    match operator_panel.change_pin(&old_pin, &new_pin).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "PIN changed successfully"
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
pub async fn get_operator_stats(
    operator_panel: State<'_, OperatorPanel>,
    db: State<'_, std::sync::Arc<Database>>,
) -> Result<String, String> {
    if !operator_panel.is_authenticated().await {
        return Err(json!({
            "success": false,
            "error": "Not authenticated"
        }).to_string());
    }

    match db.get_total_coin_earnings().await {
        Ok(earnings) => {
            let result = json!({
                "success": true,
                "total_revenue": earnings,
                "coins_inserted": 0,
                "coins_returned": 0,
                "net_coins": 0,
                "current_balance": earnings,
                "avg_transaction": 0.0
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
pub async fn get_session_stats(
    operator_panel: State<'_, OperatorPanel>,
    db: State<'_, std::sync::Arc<Database>>,
) -> Result<String, String> {
    if !operator_panel.is_authenticated().await {
        return Err(json!({
            "success": false,
            "error": "Not authenticated"
        }).to_string());
    }

    match db.get_total_sessions().await {
        Ok(total) => {
            let result = json!({
                "success": true,
                "total_sessions": total,
                "total_playtime": 0,
                "average_playtime": 0,
                "top_game": "N/A",
                "top_game_plays": 0
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
pub async fn get_system_health(
    operator_panel: State<'_, OperatorPanel>,
    db: State<'_, std::sync::Arc<Database>>,
) -> Result<String, String> {
    if !operator_panel.is_authenticated().await {
        return Err(json!({
            "success": false,
            "error": "Not authenticated"
        }).to_string());
    }

    match db.get_total_games().await {
        Ok(total_games) => {
            let result = json!({
                "success": true,
                "total_roms": total_games,
                "total_systems": 7,
                "database_status": "healthy"
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
