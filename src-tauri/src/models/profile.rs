use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Profile {
    pub id: i64,
    pub name: String,
    pub avatar_path: Option<String>,
    pub pin_hash: Option<String>,
    pub role: Option<String>,
    pub created_at: Option<String>,
    pub last_login: Option<String>,
}
