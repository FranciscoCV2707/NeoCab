use tauri::State;
use serde_json::json;
use crate::core::CoinManager;
use std::sync::Arc;

#[tauri::command]
pub async fn add_coins(
    amount: i64,
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.add_coins(amount).await {
        Ok(state) => {
            let result = json!({
                "success": true,
                "balance": state.total_balance,
                "coins_inserted": state.coins_inserted,
                "message": format!("Added {} coins", amount)
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
pub async fn get_coin_balance(
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    let state = coin_manager.get_balance().await;

    let result = json!({
        "balance": state.total_balance,
        "coins_inserted": state.coins_inserted,
        "coins_used": state.coins_used,
        "game_cost": state.game_cost,
        "coins_needed": state.coins_needed,
        "is_game_running": state.is_game_running,
        "last_event": state.last_event
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn start_game(
    game_cost: i64,
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.start_game(game_cost).await {
        Ok(state) => {
            let result = json!({
                "success": true,
                "balance": state.total_balance,
                "coins_used": state.coins_used,
                "message": format!("Game started. Used {} coins", game_cost)
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
pub async fn end_game(
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.end_game().await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "Game ended"
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
pub async fn return_coins(
    amount: i64,
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.return_coins(amount).await {
        Ok(state) => {
            let result = json!({
                "success": true,
                "balance": state.total_balance,
                "message": format!("Returned {} coins", amount)
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
pub async fn get_earnings(
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.get_earnings().await {
        Ok(total) => {
            let result = json!({
                "success": true,
                "total_earnings": total
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
pub async fn add_coins_via_key(
    amount: i64,
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.add_coins(amount).await {
        Ok(state) => {
            let result = json!({
                "success": true,
                "balance": state.total_balance,
                "coins_inserted": state.coins_inserted,
                "message": format!("Added {} coins via keyboard", amount)
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
