use tauri::State;
use serde_json::json;
use crate::core::TimerManager;

#[tauri::command]
pub async fn start_timer(
    duration_seconds: i64,
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    match timer_manager.start(duration_seconds).await {
        Ok(status) => {
            let result = json!({
                "success": true,
                "state": status.state,
                "total_seconds": status.total_seconds,
                "message": format!("Timer started: {} seconds", duration_seconds)
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
pub async fn pause_timer(
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    match timer_manager.pause().await {
        Ok(status) => {
            let result = json!({
                "success": true,
                "state": status.state,
                "elapsed_seconds": status.elapsed_seconds,
                "message": "Timer paused"
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
pub async fn resume_timer(
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    match timer_manager.resume().await {
        Ok(status) => {
            let result = json!({
                "success": true,
                "state": status.state,
                "message": "Timer resumed"
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
pub async fn stop_timer(
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    match timer_manager.stop().await {
        Ok(_) => {
            let result = json!({
                "success": true,
                "message": "Timer stopped"
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
pub async fn get_timer_status(
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    match timer_manager.get_status().await {
        Ok(status) => {
            let result = json!({
                "success": true,
                "state": status.state,
                "elapsed_seconds": status.elapsed_seconds,
                "remaining_seconds": status.remaining_seconds,
                "total_seconds": status.total_seconds,
                "percentage": status.percentage,
                "is_overtime": status.is_overtime,
                "started_at": status.started_at
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
pub async fn add_timer_time(
    seconds: i64,
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    match timer_manager.add_time(seconds).await {
        Ok(status) => {
            let action = if seconds > 0 { "added" } else { "removed" };
            let result = json!({
                "success": true,
                "state": status.state,
                "remaining_seconds": status.remaining_seconds,
                "message": format!("{} {} seconds", action, seconds.abs())
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
pub async fn is_time_up(
    timer_manager: State<'_, TimerManager>,
) -> Result<String, String> {
    let time_up = timer_manager.is_time_up().await;

    let result = json!({
        "success": true,
        "time_up": time_up
    });

    Ok(result.to_string())
}
