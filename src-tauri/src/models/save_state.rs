use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveState {
    pub id: i64,
    pub game_id: i64,
    pub profile_id: Option<i64>,
    pub slot: i64,
    pub save_path: String,
    pub thumbnail: Option<String>,
    pub description: Option<String>,
    pub play_time: i64,
    pub created_at: Option<String>,
}
