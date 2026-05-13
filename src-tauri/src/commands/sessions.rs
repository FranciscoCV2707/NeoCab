use tauri::State;
use serde_json::json;
use std::sync::Arc;
use crate::db::Database;

#[tauri::command]
pub async fn create_game_session(
    game_id: i64,
    coins_used: i64,
    db: State<'_, Arc<Database>>,
) -> Result<i64, String> {
    match db.create_game_session(game_id, coins_used).await {
        Ok(session_id) => Ok(session_id),
        Err(e) => Err(format!("Failed to create session: {}", e)),
    }
}

#[tauri::command]
pub async fn end_game_session(
    session_id: i64,
    duration_sec: i64,
    completed: bool,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.end_game_session(session_id, duration_sec, completed).await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": format!("Session {} ended", session_id),
                "duration_sec": duration_sec,
                "completed": completed
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": format!("Failed to end session: {}", e)
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_recent_sessions(
    limit: i64,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    match db.get_recent_sessions(limit).await {
        Ok(sessions) => {
            let result = json!({
                "success": true,
                "sessions": sessions,
                "count": sessions.as_array().map(|a| a.len()).unwrap_or(0)
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": format!("Failed to fetch sessions: {}", e)
            });
            Err(error.to_string())
        }
    }
}
