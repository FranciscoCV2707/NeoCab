use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: i64,
    pub game_id: i64,
    pub profile_id: Option<i64>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_sec: i64,
    pub coins_used: i64,
    pub coins_inserted: i64,
    pub completed: i64,
    pub notes: Option<String>,
}
