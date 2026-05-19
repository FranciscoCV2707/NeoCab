use serde::{Deserialize, Serialize};
use tauri::{State, Emitter, AppHandle};
use std::sync::Arc;
use std::collections::HashMap;

pub mod types {
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct SessionStatus {
        pub session_id: Option<String>,
        pub system_name: Option<String>,
        pub state: SessionState,
        pub mode: SessionMode,
        pub credits: f64,
        pub remaining_seconds: i64,
        pub elapsed_seconds: i64,
        pub is_paused: bool,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(tag = "type")]
    pub enum SessionState {
        Idle,
        Playing,
        Paused,
        WaitingForGame,
        SessionExpired,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum SessionMode {
        FreePlay,
        Timed { duration_seconds: i64 },
        CreditBased { cost_per_play: i64 },
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct CoinInsertResult {
        pub success: bool,
        pub credits: i64,
        pub coins_inserted: i64,
        pub message: String,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct LaunchResult {
        pub success: bool,
        pub process_id: Option<u32>,
        pub error_message: Option<String>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct InputDeviceState {
        pub device_id: u32,
        pub device_name: String,
        pub device_type: InputDeviceType,
        pub buttons: HashMap<String, bool>,
        pub axes: HashMap<String, f32>,
        pub is_connected: bool,
        pub battery_level: Option<i32>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum InputDeviceType {
        Keyboard,
        Gamepad,
        Trackball,
        Lightgun,
        Spinner,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct ScraperSearchResult {
        pub provider: String,
        pub game_id: String,
        pub title: String,
        pub year: Option<i32>,
        pub system: Option<String>,
        pub description: Option<String>,
        pub genres: Vec<String>,
        pub players: Option<i32>,
        pub rating: Option<f64>,
        pub images: GameImages,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct GameImages {
        pub box_front: Option<String>,
        pub box_back: Option<String>,
        pub screenshot: Option<String>,
        pub marquee: Option<String>,
        pub wheel: Option<String>,
        pub title_screen: Option<String>,
        pub video: Option<String>,
    }
}

use types::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> CommandResponse<T> {
    pub fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }

    pub fn err(message: &str) -> Self {
        Self { success: false, data: None, error: Some(message.to_string()) }
    }

    pub fn to_json_string(&self) -> Result<String, String> {
        serde_json::to_string(self).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn session_insert_coin_v2(
    session_manager: State<'_, Arc<crate::core::SessionManager>>,
    app: AppHandle,
) -> Result<String, String> {
    use crate::commands::types::ToCommandResult;

    let result = session_manager.insert_coin().await.to_result().map_err(|e| e.message)?;

    let credits = match result {
        crate::core::SessionState::CreditAdded { credits } => credits,
        _ => 0,
    };

    let coin_result = CoinInsertResult {
        success: true,
        credits,
        coins_inserted: 1,
        message: "Coin inserted".to_string(),
    };

    let _ = app.emit("coin_inserted", &coin_result);

    CommandResponse::ok(coin_result).to_json_string()
}

#[tauri::command]
pub async fn session_get_status_v2(
    session_manager: State<'_, Arc<crate::core::SessionManager>>,
) -> Result<String, String> {
    use crate::commands::types::ToCommandResult;

    let state = session_manager.check_session().await.to_result().map_err(|e| e.message)?;

    let status = SessionStatus {
        session_id: None,
        system_name: None,
        state: match state {
            crate::core::SessionState::Idle => SessionState::Idle,
            crate::core::SessionState::CreditAdded { .. } => SessionState::WaitingForGame,
            crate::core::SessionState::Active { .. } => SessionState::Playing,
            crate::core::SessionState::Paused { .. } => SessionState::Paused,
            crate::core::SessionState::Warning { .. } => SessionState::Playing,
            crate::core::SessionState::SessionExpired => SessionState::SessionExpired,
            _ => SessionState::Idle,
        },
        mode: SessionMode::FreePlay,
        credits: 1.0,
        remaining_seconds: 0,
        elapsed_seconds: 0,
        is_paused: false,
    };

    CommandResponse::ok(status).to_json_string()
}

#[tauri::command]
pub async fn session_start_v2(
    system_name: String,
    session_manager: State<'_, Arc<crate::core::SessionManager>>,
    app: AppHandle,
) -> Result<String, String> {
    use crate::commands::types::ToCommandResult;

    session_manager.start_session(&system_name).await.to_result().map_err(|e| e.message)?;

    let status = SessionStatus {
        session_id: Some(uuid::Uuid::new_v4().to_string()),
        system_name: Some(system_name),
        state: SessionState::Playing,
        mode: SessionMode::FreePlay,
        credits: 0.0,
        remaining_seconds: 0,
        elapsed_seconds: 0,
        is_paused: false,
    };

    let _ = app.emit("session_started", &status);

    CommandResponse::ok(status).to_json_string()
}

#[tauri::command]
pub async fn input_get_devices_v2(
    input_manager: State<'_, Arc<crate::input::InputManager>>,
) -> Result<String, String> {
    use crate::commands::types::ToCommandResult;

    let devices = input_manager.get_connected_devices().await.to_result().map_err(|e| e.message)?;

    let device_states: Vec<InputDeviceState> = devices
        .into_iter()
        .map(|d| InputDeviceState {
            device_id: d.id,
            device_name: d.name,
            device_type: InputDeviceType::Gamepad,
            buttons: HashMap::new(),
            axes: HashMap::new(),
            is_connected: true,
            battery_level: None,
        })
        .collect();

    CommandResponse::ok(device_states).to_json_string()
}
