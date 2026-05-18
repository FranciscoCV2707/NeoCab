use crate::error::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use tracing::info;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TimerState {
    Idle,
    Running,
    Paused,
}

impl TimerState {
    pub fn as_str(&self) -> &str {
        match self {
            TimerState::Idle => "idle",
            TimerState::Running => "running",
            TimerState::Paused => "paused",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerStatus {
    pub state: String,
    pub elapsed_seconds: i64,
    pub remaining_seconds: i64,
    pub total_seconds: i64,
    pub percentage: f32,
    pub is_overtime: bool,
    pub started_at: Option<DateTime<Utc>>,
}

pub struct TimerManager {
    state: Arc<Mutex<TimerState>>,
    elapsed: Arc<Mutex<Duration>>,
    total_duration: Arc<Mutex<Duration>>,
    start_time: Arc<Mutex<Option<Instant>>>,
    pause_time: Arc<Mutex<Option<Duration>>>,
    game_started_at: Arc<Mutex<Option<DateTime<Utc>>>>,
}

impl TimerManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(TimerState::Idle)),
            elapsed: Arc::new(Mutex::new(Duration::ZERO)),
            total_duration: Arc::new(Mutex::new(Duration::from_secs(180))),
            start_time: Arc::new(Mutex::new(None)),
            pause_time: Arc::new(Mutex::new(None)),
            game_started_at: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn start(&self, duration_seconds: i64) -> Result<TimerStatus> {
        let mut state = self.state.lock().await;
        let mut total = self.total_duration.lock().await;
        let mut start_time = self.start_time.lock().await;
        let mut game_started = self.game_started_at.lock().await;

        if duration_seconds <= 0 {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Duration must be positive".to_string(),
            ));
        }

        *state = TimerState::Running;
        *total = Duration::from_secs(duration_seconds as u64);
        *start_time = Some(Instant::now());
        *game_started = Some(Utc::now());

        info!("Timer started: {} seconds", duration_seconds);

        self.get_status().await
    }

    pub async fn pause(&self) -> Result<TimerStatus> {
        let mut state = self.state.lock().await;

        if *state != TimerState::Running {
            return Err(crate::error::NeoCabError::System(
                "Timer is not running".to_string(),
            ));
        }

        let elapsed = self.calculate_elapsed().await;
        let mut pause_time = self.pause_time.lock().await;
        *pause_time = Some(elapsed);

        *state = TimerState::Paused;
        info!("Timer paused at {} seconds", elapsed.as_secs());

        self.get_status().await
    }

    pub async fn resume(&self) -> Result<TimerStatus> {
        let mut state = self.state.lock().await;

        if *state != TimerState::Paused {
            return Err(crate::error::NeoCabError::System(
                "Timer is not paused".to_string(),
            ));
        }

        *state = TimerState::Running;
        let mut start_time = self.start_time.lock().await;
        let pause_duration = self.pause_time.lock().await;

        if let Some(paused_at) = *pause_duration {
            *start_time = Some(Instant::now() - paused_at);
        }

        info!("Timer resumed");

        self.get_status().await
    }

    pub async fn stop(&self) -> Result<TimerStatus> {
        let mut state = self.state.lock().await;
        let mut start_time = self.start_time.lock().await;
        let mut pause_time = self.pause_time.lock().await;
        let mut elapsed = self.elapsed.lock().await;

        *state = TimerState::Idle;
        *start_time = None;
        *pause_time = None;
        *elapsed = Duration::ZERO;

        info!("Timer stopped and reset");

        self.get_status().await
    }

    pub async fn set_duration(&self, seconds: i64) -> Result<()> {
        if seconds <= 0 {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Duration must be positive".to_string(),
            ));
        }

        let mut total = self.total_duration.lock().await;
        *total = Duration::from_secs(seconds as u64);

        info!("Timer duration set to {} seconds", seconds);
        Ok(())
    }

    pub async fn add_time(&self, seconds: i64) -> Result<TimerStatus> {
        if seconds == 0 {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Must add a non-zero amount".to_string(),
            ));
        }

        let mut total = self.total_duration.lock().await;

        if seconds > 0 {
            *total += Duration::from_secs(seconds as u64);
            info!("Added {} seconds to timer", seconds);
        } else {
            let remove_duration = Duration::from_secs((-seconds) as u64);
            if remove_duration <= *total {
                *total -= remove_duration;
                info!("Removed {} seconds from timer", -seconds);
            } else {
                return Err(crate::error::NeoCabError::System(
                    "Cannot remove more time than remaining".to_string(),
                ));
            }
        }

        self.get_status().await
    }

    pub async fn get_status(&self) -> Result<TimerStatus> {
        let state = self.state.lock().await;
        let total = self.total_duration.lock().await;
        let elapsed = self.calculate_elapsed().await;
        let game_started = self.game_started_at.lock().await;

        let elapsed_secs = elapsed.as_secs() as i64;
        let total_secs = total.as_secs() as i64;
        let remaining = std::cmp::max(0, total_secs - elapsed_secs);
        let is_overtime = elapsed_secs > total_secs;
        let percentage = if total_secs > 0 {
            (elapsed_secs as f32 / total_secs as f32) * 100.0
        } else {
            0.0
        };

        Ok(TimerStatus {
            state: state.as_str().to_string(),
            elapsed_seconds: elapsed_secs,
            remaining_seconds: remaining,
            total_seconds: total_secs,
            percentage: percentage.min(100.0),
            is_overtime,
            started_at: *game_started,
        })
    }

    async fn calculate_elapsed(&self) -> Duration {
        let state = self.state.lock().await;
        let start_time = self.start_time.lock().await;
        let pause_time = self.pause_time.lock().await;

        match *state {
            TimerState::Running => {
                if let Some(start) = *start_time {
                    start.elapsed()
                } else {
                    Duration::ZERO
                }
            }
            TimerState::Paused => {
                if let Some(paused) = *pause_time {
                    paused
                } else {
                    Duration::ZERO
                }
            }
            TimerState::Idle => Duration::ZERO,
        }
    }

    pub async fn is_time_up(&self) -> bool {
        if let Ok(status) = self.get_status().await {
            status.remaining_seconds <= 0
        } else {
            false
        }
    }

    pub async fn should_warn(&self, warn_before_secs: i64) -> bool {
        if let Ok(status) = self.get_status().await {
            status.remaining_seconds <= warn_before_secs && status.remaining_seconds > 0
        } else {
            false
        }
    }

    pub async fn get_remaining_seconds(&self) -> i64 {
        if let Ok(status) = self.get_status().await {
            status.remaining_seconds
        } else {
            0
        }
    }
}

impl Default for TimerManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_timer_creation() {
        let timer = TimerManager::new();
        let status = timer.get_status().await.unwrap();

        assert_eq!(status.state, "idle");
        assert_eq!(status.elapsed_seconds, 0);
    }

    #[tokio::test]
    async fn test_timer_start() {
        let timer = TimerManager::new();
        let status = timer.start(10).await.unwrap();

        assert_eq!(status.state, "running");
        assert_eq!(status.total_seconds, 10);
    }
}
