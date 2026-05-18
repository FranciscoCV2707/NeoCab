use serde::{Deserialize, Serialize};
use tauri::{State, Emitter, AppHandle};
use std::sync::Arc;

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
    pub struct GameLaunchContext {
        pub game_id: i64,
        pub game_title: String,
        pub system_name: String,
        pub emulator_id: Option<String>,
        pub rom_path: String,
        pub media_path: Option<String>,
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
pub struct CommandResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResponse<T> {
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

    let result = session_manager.insert_coin().await.to_result()?;

    let coin_result = CoinInsertResult {
        success: true,
        credits: result.credits(),
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

    let state = session_manager.check_session().await.to_result()?;

    let status = SessionStatus {
        session_id: None,
        system_name: None,
        state: match state {
            crate::core::SessionState::Idle => SessionState::Idle,
            crate::core::SessionState::CreditAdded { .. } => SessionState::WaitingForGame,
            crate::core::SessionState::Playing { .. } => SessionState::Playing,
            crate::core::SessionState::Paused => SessionState::Paused,
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

    let result = session_manager.start_session(&system_name).await.to_result()?;

    let status = SessionStatus {
        session_id: Some(uuid::Uuid::new_v4().to_string()),
        system_name: Some(system_name),
        state: SessionState::Playing,
        mode: SessionMode::FreePlay,
        credits: result.credits(),
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

    let devices = input_manager.get_connected_devices().await.to_result()?;

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

#[tauri::command]
pub async fn game_launch_v2(
    game_id: i64,
    db: State<'_, Arc<crate::db::Database>>,
    launcher: State<'_, Arc<crate::core::Launcher>>,
    app: AppHandle,
) -> Result<String, String> {
    use crate::commands::types::ToCommandResult;

    let game = db.get_game_by_id(game_id).await.to_result()?
        .ok_or_else(|| "Game not found".to_string())?;

    let ctx = GameLaunchContext {
        game_id: game.id,
        game_title: game.title.clone(),
        system_name: game.system_name.clone(),
        emulator_id: None,
        rom_path: game.rom_path.clone(),
        media_path: game.media_path.clone(),
    };

    let result = launcher.launch_game(&ctx).await.to_result()?;

    let launch_result = LaunchResult {
        success: result.is_ok(),
        process_id: result.ok().flatten(),
        error_message: result.err(),
    };

    if launch_result.success {
        let _ = app.emit("game_launched", &ctx);
    }

    CommandResponse::ok(launch_result).to_json_string()
}

pub fn register_v2_commands() -> impl Fn(tauri::Builder) -> tauri::Builder {
    |app| {
        app.invoke_handler(tauri::generate_handler![
            session_insert_coin_v2,
            session_get_status_v2,
            session_start_v2,
            input_get_devices_v2,
            game_launch_v2,
        ])
    }
}