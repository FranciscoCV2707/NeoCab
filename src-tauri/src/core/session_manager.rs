use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use tracing::info;
use crate::error::Result;
use crate::core::coin_manager::CoinManager;
use crate::core::timer_manager::TimerManager;
use crate::core::config_manager::{ConfigManager, GameMode, SystemGameConfig};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SessionMode {
    Arcade,
    Timed,
    Unlimited,
    Token,
}

impl SessionMode {
    pub fn from_game_mode(mode: GameMode) -> Self {
        match mode {
            GameMode::Arcade => SessionMode::Arcade,
            GameMode::Console | GameMode::TimedFree => SessionMode::Timed,
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            SessionMode::Arcade => "arcade",
            SessionMode::Timed => "timed",
            SessionMode::Unlimited => "unlimited",
            SessionMode::Token => "token",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArcadeConfig {
    pub coins_per_credit: i64,
    pub time_per_credit_minutes: u32,
    pub max_credits: i64,
    pub free_play: bool,
    pub continue_cost: i64,
    pub max_continues: i64,
}

impl Default for ArcadeConfig {
    fn default() -> Self {
        Self {
            coins_per_credit: 1,
            time_per_credit_minutes: 3,
            max_credits: 99,
            free_play: false,
            continue_cost: 1,
            max_continues: 5,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimedConfig {
    pub minutes_per_credit: u32,
    pub max_time_minutes: u32,
    pub warning_at_minutes: u32,
    pub pause_allowed: bool,
    pub pause_limit_minutes: u32,
    pub pause_max_count: i64,
}

impl Default for TimedConfig {
    fn default() -> Self {
        Self {
            minutes_per_credit: 5,
            max_time_minutes: 60,
            warning_at_minutes: 2,
            pause_allowed: true,
            pause_limit_minutes: 5,
            pause_max_count: 3,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionConfig {
    pub mode: SessionMode,
    pub arcade: ArcadeConfig,
    pub timed: TimedConfig,
}

impl Default for SessionConfig {
    fn default() -> Self {
        Self {
            mode: SessionMode::Timed,
            arcade: ArcadeConfig::default(),
            timed: TimedConfig::default(),
        }
    }
}

impl SessionConfig {
    pub fn from_system_config(sys_config: &SystemGameConfig) -> Self {
        match sys_config.mode {
            GameMode::Arcade => Self {
                mode: SessionMode::Arcade,
                arcade: ArcadeConfig {
                    time_per_credit_minutes: sys_config.coins_per_time / 60,
                    ..Default::default()
                },
                timed: TimedConfig::default(),
            },
            GameMode::Console => Self {
                mode: SessionMode::Timed,
                arcade: ArcadeConfig::default(),
                timed: TimedConfig {
                    minutes_per_credit: sys_config.coins_per_time / 60,
                    max_time_minutes: sys_config.max_time / 60,
                    warning_at_minutes: sys_config.warn_before / 60,
                    ..Default::default()
                },
            },
            GameMode::TimedFree => Self {
                mode: SessionMode::Unlimited,
                arcade: ArcadeConfig::default(),
                timed: TimedConfig::default(),
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SessionState {
    Idle,
    CreditAdded { credits: i64 },
    TimeAdded { seconds: u32 },
    NoCredits,
    NoTime,
    SessionStarted { total_seconds: u32 },
    SessionExpired,
    Warning { remaining_seconds: u32 },
    Active { remaining_seconds: u32 },
    NoRestriction,
    Paused { remaining_seconds: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStatus {
    pub state: String,
    pub mode: String,
    pub credits: i64,
    pub remaining_seconds: u32,
    pub total_seconds: u32,
    pub elapsed_seconds: u32,
    pub pause_count: i64,
}

pub struct SessionManager {
    coin_manager: Arc<CoinManager>,
    timer_manager: Arc<TimerManager>,
    config_manager: Arc<ConfigManager>,
    session_config: Arc<RwLock<SessionConfig>>,
    pause_count: Arc<RwLock<i64>>,
}

impl SessionManager {
    pub fn new(
        coin_manager: Arc<CoinManager>,
        timer_manager: Arc<TimerManager>,
        config_manager: Arc<ConfigManager>,
    ) -> Self {
        Self {
            coin_manager,
            timer_manager,
            config_manager,
            session_config: Arc::new(RwLock::new(SessionConfig::default())),
            pause_count: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn set_system_mode(&self, system_name: &str) -> Result<SessionConfig> {
        let sys_config = self.config_manager.load_system_config(system_name).await?;
        let session_config = SessionConfig::from_system_config(&sys_config);
        let mut config = self.session_config.write().await;
        *config = session_config.clone();
        info!("Session mode set to {:?} for system {}", session_config.mode, system_name);
        Ok(session_config)
    }

    pub async fn insert_coin(&self) -> Result<SessionState> {
        let config = self.session_config.read().await;

        match config.mode {
            SessionMode::Arcade => {
                if config.arcade.free_play {
                    return Ok(SessionState::NoRestriction);
                }
                let state = self.coin_manager.add_coins(config.arcade.coins_per_credit).await?;
                Ok(SessionState::CreditAdded { credits: state.total_balance })
            }
            SessionMode::Timed => {
                let seconds = config.timed.minutes_per_credit * 60;
                self.timer_manager.add_time(seconds as i64).await?;
                Ok(SessionState::TimeAdded { seconds })
            }
            SessionMode::Unlimited => Ok(SessionState::NoRestriction),
            SessionMode::Token => {
                let state = self.coin_manager.add_coins(1).await?;
                Ok(SessionState::CreditAdded { credits: state.total_balance })
            }
        }
    }

    pub async fn start_session(&self, _system_name: &str) -> Result<SessionState> {
        let config = self.session_config.read().await;

        match config.mode {
            SessionMode::Arcade => {
                if config.arcade.free_play {
                    let seconds = config.arcade.time_per_credit_minutes * 60;
                    self.timer_manager.start(seconds as i64).await?;
                    return Ok(SessionState::SessionStarted { total_seconds: seconds });
                }
                let balance = self.coin_manager.get_balance().await;
                if balance.total_balance < config.arcade.coins_per_credit {
                    return Ok(SessionState::NoCredits);
                }
                self.coin_manager.use_coins(config.arcade.coins_per_credit).await?;
                let seconds = config.arcade.time_per_credit_minutes * 60;
                self.timer_manager.start(seconds as i64).await?;
                Ok(SessionState::SessionStarted { total_seconds: seconds })
            }
            SessionMode::Timed => {
                let remaining = self.timer_manager.get_remaining_seconds().await;
                if remaining <= 0 {
                    return Ok(SessionState::NoTime);
                }
                self.timer_manager.start(remaining).await?;
                Ok(SessionState::SessionStarted { total_seconds: remaining as u32 })
            }
            SessionMode::Unlimited => {
                Ok(SessionState::NoRestriction)
            }
            SessionMode::Token => {
                let balance = self.coin_manager.get_balance().await;
                if balance.total_balance < 1 {
                    return Ok(SessionState::NoCredits);
                }
                self.coin_manager.use_coins(1).await?;
                let seconds = config.timed.minutes_per_credit * 60;
                self.timer_manager.start(seconds as i64).await?;
                Ok(SessionState::SessionStarted { total_seconds: seconds })
            }
        }
    }

    pub async fn check_session(&self) -> Result<SessionState> {
        let config = self.session_config.read().await;

        match config.mode {
            SessionMode::Unlimited => Ok(SessionState::NoRestriction),
            _ => {
                let status = self.timer_manager.get_status().await?;
                if status.remaining_seconds <= 0 {
                    return Ok(SessionState::SessionExpired);
                }
                let warning_secs = config.timed.warning_at_minutes * 60;
                if status.remaining_seconds <= warning_secs as i64 {
                    return Ok(SessionState::Warning {
                        remaining_seconds: status.remaining_seconds as u32,
                    });
                }
                Ok(SessionState::Active {
                    remaining_seconds: status.remaining_seconds as u32,
                })
            }
        }
    }

    pub async fn pause_session(&self) -> Result<SessionState> {
        let config = self.session_config.read().await;
        if !config.timed.pause_allowed {
            return Err(crate::error::NeoCabError::System("Pause not allowed".to_string()));
        }

        let mut pause_count = self.pause_count.write().await;
        if *pause_count >= config.timed.pause_max_count {
            return Err(crate::error::NeoCabError::System("Max pauses reached".to_string()));
        }

        self.timer_manager.pause().await?;
        *pause_count += 1;
        let remaining = self.timer_manager.get_remaining_seconds().await;
        Ok(SessionState::Paused { remaining_seconds: remaining as u32 })
    }

    pub async fn resume_session(&self) -> Result<SessionState> {
        self.timer_manager.resume().await?;
        let remaining = self.timer_manager.get_remaining_seconds().await;
        Ok(SessionState::Active { remaining_seconds: remaining as u32 })
    }

    pub async fn end_session(&self) -> Result<SessionState> {
        self.timer_manager.stop().await?;
        let mut pause_count = self.pause_count.write().await;
        *pause_count = 0;
        Ok(SessionState::Idle)
    }

    pub async fn add_time(&self, minutes: u32) -> Result<SessionState> {
        let seconds = (minutes * 60) as i64;
        self.timer_manager.add_time(seconds).await?;
        Ok(SessionState::TimeAdded { seconds: minutes * 60 })
    }

    pub async fn get_status(&self) -> Result<SessionStatus> {
        let config = self.session_config.read().await;
        let coin_state = self.coin_manager.get_balance().await;
        let timer_status = self.timer_manager.get_status().await?;
        let pause_count = self.pause_count.read().await;

        Ok(SessionStatus {
            state: timer_status.state.clone(),
            mode: config.mode.as_str().to_string(),
            credits: coin_state.total_balance,
            remaining_seconds: timer_status.remaining_seconds as u32,
            total_seconds: timer_status.total_seconds as u32,
            elapsed_seconds: timer_status.elapsed_seconds as u32,
            pause_count: *pause_count,
        })
    }

    pub async fn get_config(&self) -> SessionConfig {
        self.session_config.read().await.clone()
    }

    pub async fn set_config(&self, config: SessionConfig) {
        let mut current = self.session_config.write().await;
        *current = config;
    }
}
