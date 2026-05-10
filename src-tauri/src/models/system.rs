use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct System {
    pub id: i64,
    pub name: String,
    pub display_name: String,
    pub category: String,
    pub manufacturer: Option<String>,
    pub year_start: Option<i64>,
    pub year_end: Option<i64>,
    pub extensions: String,
    pub bios_path: Option<String>,
    pub roms_path: Option<String>,
    pub enabled: i64,
    pub sort_order: i64,
    pub created_at: Option<String>,
}
