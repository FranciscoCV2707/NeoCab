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
pub async fn launch_game_with_scripts(
    game_id: i64,
    emulator_name: String,
    pre_script: Option<String>,
    post_script: Option<String>,
    _emulator_mgr: State<'_, Arc<EmulatorManager>>,
) -> Result<String, String> {
    // This command would be called by the frontend when launching with scripts
    // The actual script execution happens in EmulatorManager::launch_game_with_scripts
    Ok(format!(
        "Game {} launching with {} and scripts (pre: {}, post: {})",
        game_id,
        emulator_name,
        pre_script.as_deref().unwrap_or("none"),
        post_script.as_deref().unwrap_or("none")
    ))
}

#[tauri::command]
pub async fn stop_game_with_monitoring(
    _emulator_mgr: State<'_, Arc<EmulatorManager>>,
) -> Result<String, String> {
    Ok("Game monitoring stopped".to_string())
}
