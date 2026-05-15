use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub badge_name: String,
    pub points: u32,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub username: String,
    pub total_points: u32,
    pub total_achievements: u32,
    pub games_completed: u32,
    pub member_since: String,
    pub motto: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
struct RAAuthResponse {
    Success: bool,
    User: Option<String>,
    Token: Option<String>,
    Score: Option<u32>,
    NumUnreadMessages: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct RAGameResponse {
    GameID: Option<u32>,
    Title: Option<String>,
    Achievements: Option<HashMap<String, RAAchievement>>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct RAAchievement {
    ID: Option<String>,
    Title: Option<String>,
    Description: Option<String>,
    BadgeName: Option<String>,
    Points: Option<String>,
    DateEarned: Option<String>,
    DateEarnedHardcore: Option<String>,
    AchievementType: Option<String>,
}

pub struct RetroAchievementsService {
    username: String,
    api_key: String,
    client: Client,
}

impl RetroAchievementsService {
    const BASE_URL: &'static str = "https://retroachievements.org/API";

    pub fn new(username: String, api_key: String) -> Self {
        Self {
            username,
            api_key,
            client: Client::builder()
                .user_agent("NeoCab/1.0")
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .unwrap_or_default(),
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.username.is_empty() && !self.api_key.is_empty()
    }

    pub async fn login(&self) -> Result<bool, String> {
        let url = format!("{}/API_Login.php?u={}&p={}",
            Self::BASE_URL, self.username, self.api_key);

        let resp = self.client.get(&url).send().await
            .map_err(|e| format!("Network error: {}", e))?;

        let auth: RAAuthResponse = resp.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        Ok(auth.Success)
    }

    pub async fn get_game_achievements(&self, game_hash: &str) -> Result<Vec<Achievement>, String> {
        let url = format!("{}/API_GetGameExtended.php?z={}&y={}&g={}",
            Self::BASE_URL, self.username, self.api_key, game_hash);

        let resp = self.client.get(&url).send().await
            .map_err(|e| format!("Network error: {}", e))?;

        let game_data: RAGameResponse = resp.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        let achievements = game_data.Achievements.unwrap_or_default();
        let result: Vec<Achievement> = achievements.iter().map(|(_, ach)| {
            Achievement {
                id: ach.ID.as_ref().and_then(|s| s.parse().ok()).unwrap_or(0),
                title: ach.Title.clone().unwrap_or_default(),
                description: ach.Description.clone().unwrap_or_default(),
                badge_name: ach.BadgeName.clone().unwrap_or_default(),
                points: ach.Points.as_ref().and_then(|s| s.parse().ok()).unwrap_or(0),
                unlocked: ach.DateEarned.is_some() || ach.DateEarnedHardcore.is_some(),
                unlocked_at: ach.DateEarned.clone().or(ach.DateEarnedHardcore.clone()),
                category: ach.AchievementType.clone().unwrap_or_else(|| "achievement".to_string()),
            }
        }).collect();

        Ok(result)
    }

    pub async fn get_user_summary(&self) -> Result<UserSummary, String> {
        let url = format!("{}/API_GetUserSummary.php?z={}&y={}&u={}",
            Self::BASE_URL, self.username, self.api_key, self.username);

        let resp = self.client.get(&url).send().await
            .map_err(|e| format!("Network error: {}", e))?;

        #[derive(Deserialize)]
        struct RASummary {
            RecentlyPlayedCount: Option<u32>,
            MemberSince: Option<String>,
            Motto: Option<String>,
            TotalPoints: Option<String>,
            TotalTruePoints: Option<String>,
            UserWallActive: Option<bool>,
        }

        let summary: RASummary = resp.json().await
            .map_err(|e| format!("Parse error: {}", e))?;

        Ok(UserSummary {
            username: self.username.clone(),
            total_points: 0,
            total_achievements: 0,
            games_completed: 0,
            member_since: summary.MemberSince.unwrap_or_default(),
            motto: summary.Motto,
        })
    }

    pub fn inject_retroarch_creds(&self, config_dir: &str) -> Result<(), String> {
        let cfg_path = std::path::PathBuf::from(config_dir).join("retroarch.cfg");
        if !cfg_path.exists() {
            return Err("retroarch.cfg not found".to_string());
        }

        let content = std::fs::read_to_string(&cfg_path)
            .map_err(|e| format!("Cannot read: {}", e))?;

        let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();
        let replacements = [
            ("cheevos_enable", format!("\"true\"")),
            ("cheevos_username", format!("\"{}\"", self.username)),
            ("cheevos_password", format!("\"{}\"", self.api_key)),
            ("cheevos_badge_visible", format!("\"true\"")),
            ("cheevos_leaderboards_enable", format!("\"true\"")),
        ];

        for (key, val) in &replacements {
            let mut found = false;
            for line in lines.iter_mut() {
                let trimmed = line.trim();
                if trimmed.starts_with('#') { continue; }
                if let Some((k, _)) = trimmed.split_once('=') {
                    if k.trim() == *key {
                        *line = format!("{} = {}", key, val);
                        found = true;
                        break;
                    }
                }
            }
            if !found {
                lines.push(format!("{} = {}", key, val));
            }
        }

        std::fs::write(&cfg_path, lines.join("\n"))
            .map_err(|e| format!("Cannot write: {}", e))?;

        info!("RetroAchievements credentials injected into retroarch.cfg");
        Ok(())
    }
}
