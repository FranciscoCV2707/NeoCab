use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type CommandResult<T> = Result<T, CommandError>;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
        }
    }

    pub fn from_string(s: String) -> Self {
        Self {
            code: "UNKNOWN".to_string(),
            message: s,
        }
    }
}

impl From<String> for CommandError {
    fn from(s: String) -> Self {
        Self::from_string(s)
    }
}

impl From<&str> for CommandError {
    fn from(s: &str) -> Self {
        Self::from_string(s.to_string())
    }
}

pub trait ToCommandResult<T> {
    fn to_result(self) -> CommandResult<T>;
}

impl<T, E: std::fmt::Display> ToCommandResult<T> for Result<T, E> {
    fn to_result(self) -> CommandResult<T> {
        self.map_err(|e| CommandError::from_string(e.to_string()))
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionStatusResponse {
    pub state: String,
    pub mode: String,
    pub credits: f64,
    pub remaining_seconds: i64,
    pub total_seconds: i64,
    pub elapsed_seconds: i64,
    pub pause_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoinInsertResponse {
    pub success: bool,
    pub credits: i64,
    pub coins_inserted: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimerStatusResponse {
    pub state: String,
    pub elapsed_seconds: i64,
    pub remaining_seconds: i64,
    pub total_seconds: i64,
    pub percentage: f64,
    pub is_overtime: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: u32,
    pub name: String,
    pub guid: String,
    pub device_type: String,
    pub is_connected: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InputStateResponse {
    pub device_id: u32,
    pub buttons: HashMap<String, bool>,
    pub axes: HashMap<String, f32>,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JoyProfileInfo {
    pub name: String,
    pub deadzone: f32,
    pub active_set: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameListResponse {
    pub games: Vec<GameInfo>,
    pub total: usize,
    pub page: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameInfo {
    pub id: i64,
    pub title: String,
    pub system_id: i64,
    pub system_name: String,
    pub is_favorite: bool,
    pub play_count: i64,
    pub last_played: Option<String>,
    pub rating: f64,
    pub media: GameMedia,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameMedia {
    pub image_path: Option<String>,
    pub marquee_path: Option<String>,
    pub video_path: Option<String>,
    pub wheel_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeListResponse {
    pub themes: Vec<ThemeInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeInfo {
    pub name: String,
    pub author: String,
    pub version: String,
    pub description: String,
    pub preview_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkStatusResponse {
    pub connected: bool,
    pub ethernet: bool,
    pub wifi: bool,
    pub ssid: Option<String>,
    pub ip_address: Option<String>,
    pub signal_strength: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfoResponse {
    pub os: String,
    pub version: String,
    pub hostname: String,
    pub uptime_seconds: i64,
    pub memory_total: i64,
    pub memory_used: i64,
    pub memory_free: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmulatorInfo {
    pub id: String,
    pub name: String,
    pub system: String,
    pub executable_path: String,
    pub is_configured: bool,
    pub is_running: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigValue {
    pub key: String,
    pub value: serde_json::Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditStats {
    pub total_games: i64,
    pub favorite_games: i64,
    pub total_play_time: i64,
    pub total_sessions: i64,
    pub today_sessions: i64,
    pub today_earnings: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaScrapeResponse {
    pub success: bool,
    pub images_found: i32,
    pub videos_found: i32,
    pub marquees_found: i32,
    pub wheels_found: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> CommandResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn failure(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

pub mod macros {
    #[macro_export]
    macro_rules! command_ok {
        ($data:expr) => {
            Ok(serde_json::to_string(&$data).map_err(|e| e.to_string())?)
        };
    }

    #[macro_export]
    macro_rules! command_err {
        ($msg:expr) => {
            Err($msg.to_string())
        };
    }
}