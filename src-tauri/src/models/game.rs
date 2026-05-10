use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: i64,
    pub title: String,
    pub system_id: i64,
    pub rom_path: String,
    pub year: Option<i32>,
}
