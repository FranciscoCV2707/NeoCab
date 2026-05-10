use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Emulator {
    pub id: i64,
    pub name: String,
    pub display_name: String,
    pub executable: String,
}
