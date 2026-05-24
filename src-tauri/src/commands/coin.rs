use crate::core::CoinManager;
use serde_json::json;
use std::sync::Arc;
use tauri::{State, Manager};

#[tauri::command]
pub async fn add_coins(
    amount: i64,
    app_handle: tauri::AppHandle,
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.add_coins(amount).await {
        Ok(state) => {
            // Trigger Lua plugin hook OnCoinInserted
            if let Some(plugin_state) = app_handle.try_state::<crate::core::plugin_engine::PluginState>() {
                if let Ok(engine) = plugin_state.0.lock() {
                    let base_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("./data"));
                    let ctx = crate::core::plugin_engine::PluginContext::new(base_dir)
                        .with_session(0, state.total_balance as i32);
                    let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnCoinInserted, ctx);
                }
            }

            // Trigger HardwareScriptEngine CoinInserted
            if let Some(hw_script_state) = app_handle.try_state::<Arc<tokio::sync::Mutex<crate::core::HardwareScriptEngine>>>() {
                let hw_clone = hw_script_state.inner().clone();
                tokio::spawn(async move {
                    let lock = hw_clone.lock().await;
                    let _ = lock.trigger_event(crate::core::HardwareEvent::CoinInserted).await;
                });
            }

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
pub async fn get_coin_balance(coin_manager: State<'_, Arc<CoinManager>>) -> Result<String, String> {
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
pub async fn end_game(coin_manager: State<'_, Arc<CoinManager>>) -> Result<String, String> {
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
                "coins_returned": amount,
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
pub async fn get_earnings(coin_manager: State<'_, Arc<CoinManager>>) -> Result<String, String> {
    match coin_manager.get_earnings().await {
        Ok(earnings) => {
            let result = json!({
                "success": true,
                "earnings": earnings
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
    app_handle: tauri::AppHandle,
    coin_manager: State<'_, Arc<CoinManager>>,
) -> Result<String, String> {
    match coin_manager.add_coins(amount).await {
        Ok(state) => {
            // Trigger Lua plugin hook OnCoinInserted
            if let Some(plugin_state) = app_handle.try_state::<crate::core::plugin_engine::PluginState>() {
                if let Ok(engine) = plugin_state.0.lock() {
                    let base_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("./data"));
                    let ctx = crate::core::plugin_engine::PluginContext::new(base_dir)
                        .with_session(0, state.total_balance as i32);
                    let _ = engine.execute_hook(crate::core::plugin_engine::PluginHook::OnCoinInserted, ctx);
                }
            }

            // Trigger HardwareScriptEngine CoinInserted
            if let Some(hw_script_state) = app_handle.try_state::<Arc<tokio::sync::Mutex<crate::core::HardwareScriptEngine>>>() {
                let hw_clone = hw_script_state.inner().clone();
                tokio::spawn(async move {
                    let lock = hw_clone.lock().await;
                    let _ = lock.trigger_event(crate::core::HardwareEvent::CoinInserted).await;
                });
            }

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
