use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InputDevice {
    pub id: i64,
    pub guid: String,
    pub name: String,
    pub vendor_id: Option<i64>,
    pub product_id: Option<i64>,
    pub device_type: Option<String>,
    pub profile_name: Option<String>,
    pub created_at: Option<String>,
}
