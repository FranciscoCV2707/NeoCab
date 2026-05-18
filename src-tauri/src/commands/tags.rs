use crate::core::tag_manager::{GameTag, Tag};
use crate::db::Database;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn list_tags(db: State<'_, Arc<Database>>) -> Result<Vec<Tag>, String> {
    let mgr = super::get_tag_manager(db.inner().clone());
    mgr.list_tags().await
}

#[tauri::command]
pub async fn create_tag(
    name: String,
    color: Option<String>,
    db: State<'_, Arc<Database>>,
) -> Result<Tag, String> {
    let mgr = super::get_tag_manager(db.inner().clone());
    mgr.create_tag(&name, &color.unwrap_or_else(|| "#888888".to_string()))
        .await
}

#[tauri::command]
pub async fn delete_tag(tag_id: i64, db: State<'_, Arc<Database>>) -> Result<(), String> {
    let mgr = super::get_tag_manager(db.inner().clone());
    mgr.delete_tag(tag_id).await
}

#[tauri::command]
pub async fn add_game_tag(
    game_id: i64,
    tag_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    let mgr = super::get_tag_manager(db.inner().clone());
    mgr.add_game_tag(game_id, tag_id).await
}

#[tauri::command]
pub async fn remove_game_tag(
    game_id: i64,
    tag_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    let mgr = super::get_tag_manager(db.inner().clone());
    mgr.remove_game_tag(game_id, tag_id).await
}

#[tauri::command]
pub async fn get_game_tags(
    game_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<GameTag>, String> {
    let mgr = super::get_tag_manager(db.inner().clone());
    mgr.get_game_tags(game_id).await
}
