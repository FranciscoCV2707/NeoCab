use crate::core::retroachievements::{self, Achievement, UserSummary};
use serde::Serialize;

#[derive(Serialize)]
pub struct AuthStatus {
    pub configured: bool,
    pub username: String,
}

#[tauri::command]
pub async fn ra_login(username: String, api_key: String) -> Result<AuthStatus, String> {
    let service = retroachievements::RetroAchievementsService::new(username.clone(), api_key);
    let success = service.login().await?;
    if success {
        Ok(AuthStatus {
            configured: true,
            username,
        })
    } else {
        Err("Invalid RetroAchievements credentials".to_string())
    }
}

#[tauri::command]
pub async fn ra_get_game_achievements(
    username: String,
    api_key: String,
    game_hash: String,
) -> Result<Vec<Achievement>, String> {
    let service = retroachievements::RetroAchievementsService::new(username, api_key);
    service.get_game_achievements(&game_hash).await
}

#[tauri::command]
pub async fn ra_get_user_summary(username: String, api_key: String) -> Result<UserSummary, String> {
    let service = retroachievements::RetroAchievementsService::new(username, api_key);
    service.get_user_summary().await
}

#[tauri::command]
pub async fn ra_inject_retroarch(
    username: String,
    api_key: String,
    config_dir: String,
) -> Result<(), String> {
    let service = retroachievements::RetroAchievementsService::new(username, api_key);
    service.inject_retroarch_creds(&config_dir)
}
