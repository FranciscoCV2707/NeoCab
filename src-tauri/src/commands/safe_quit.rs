use crate::core::safe_quit::{SafeQuitManager, SafeQuitRule};
use crate::db::Database;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct SafeQuitStatus {
    pub active: bool,
    pub action: String,
    pub elapsed_seconds: u64,
}

#[derive(Default)]
pub struct SafeQuitState(pub Mutex<Vec<SafeQuitRule>>);

#[tauri::command]
pub async fn safe_quit_check(
    emulator: String,
    elapsed_seconds: u64,
    _db: State<'_, Arc<Database>>,
) -> Result<SafeQuitStatus, String> {
    let rules = vec![SafeQuitRule::default_for(&emulator)];
    let active = SafeQuitManager::should_activate_attract(elapsed_seconds, &rules, &emulator);
    let action = SafeQuitManager::get_action(&rules, &emulator);

    Ok(SafeQuitStatus {
        active,
        action,
        elapsed_seconds,
    })
}

#[tauri::command]
pub async fn safe_quit_get_rules(
    _emulator: String,
    state: State<'_, SafeQuitState>,
) -> Result<Vec<SafeQuitRule>, String> {
    let rules = state.0.lock().map_err(|e| e.to_string())?.to_vec();
    if rules.is_empty() {
        Ok(vec![SafeQuitRule::default_for("mame")])
    } else {
        Ok(rules)
    }
}

#[tauri::command]
pub async fn safe_quit_save_rule(
    rule: SafeQuitRule,
    state: State<'_, SafeQuitState>,
) -> Result<(), String> {
    let mut rules = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(idx) = rules.iter().position(|r| r.id == rule.id) {
        rules[idx] = rule;
    } else {
        rules.push(rule);
    }
    Ok(())
}

#[tauri::command]
pub async fn safe_quit_delete_rule(id: i64, state: State<'_, SafeQuitState>) -> Result<(), String> {
    let mut rules = state.0.lock().map_err(|e| e.to_string())?;
    rules.retain(|r| r.id != id);
    Ok(())
}

#[tauri::command]
pub async fn safe_quit_get_all_rules(
    state: State<'_, SafeQuitState>,
) -> Result<Vec<SafeQuitRule>, String> {
    state.0.lock().map(|r| r.clone()).map_err(|e| e.to_string())
}
