use serde::{Serialize, Deserialize};
use crate::core::safe_quit::{SafeQuitRule, SafeQuitManager};
use crate::db::Database;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct SafeQuitStatus {
    pub active: bool,
    pub action: String,
    pub elapsed_seconds: u64,
}

#[tauri::command]
pub async fn safe_quit_check(
    emulator: String,
    elapsed_seconds: u64,
    db: State<'_, Arc<Database>>,
) -> Result<SafeQuitStatus, String> {
    let rules = vec![SafeQuitRule::default_for(&emulator)];
    let active = SafeQuitManager::should_activate_attract(elapsed_seconds, &rules, &emulator);
    let action = SafeQuitManager::get_action(&rules, &emulator);

    Ok(SafeQuitStatus { active, action, elapsed_seconds })
}

#[tauri::command]
pub async fn safe_quit_get_rules(emulator: String) -> Result<Vec<SafeQuitRule>, String> {
    Ok(vec![SafeQuitRule::default_for(&emulator)])
}
