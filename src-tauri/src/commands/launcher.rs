use tauri::State;
use std::sync::Arc;
use crate::core::EmulatorManager;

#[tauri::command]
pub async fn launch_game_with_monitoring(
    game_id: i64,
    emulator_name: String,
    _emulator_mgr: State<'_, Arc<EmulatorManager>>,
) -> Result<String, String> {
    Ok(format!(
        "Game {} launching with {} monitoring",
        game_id, emulator_name
    ))
}

#[tauri::command]
pub async fn stop_game_with_monitoring(
    _emulator_mgr: State<'_, Arc<EmulatorManager>>,
) -> Result<String, String> {
    Ok("Game monitoring stopped".to_string())
}
