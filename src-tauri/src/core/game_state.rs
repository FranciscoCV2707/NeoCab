use crate::Result;
use std::sync::{Arc, RwLock};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppState {
    /// Main menu / cabinet idle
    Menu,
    /// System (arcade, console) selection
    SystemSelect,
    /// Game selection within system
    GameSelect,
    /// Game is running
    Playing,
    /// Game paused
    Paused,
    /// Cabinet shutting down
    Shutdown,
}

/// Shared game state manager for both modern and legacy modes
pub struct GameStateManager {
    state: Arc<RwLock<AppState>>,
    paused_at: Arc<RwLock<Option<std::time::Instant>>>,
}

impl GameStateManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(AppState::Menu)),
            paused_at: Arc::new(RwLock::new(None)),
        }
    }

    pub fn current_state(&self) -> Result<AppState> {
        Ok(*self.state.read().map_err(|_| {
            crate::error::NeoCabError::System("Failed to read game state".to_string())
        })?)
    }

    pub fn set_state(&self, new_state: AppState) -> Result<()> {
        let mut state = self.state.write().map_err(|_| {
            crate::error::NeoCabError::System("Failed to write game state".to_string())
        })?;

        let old_state = *state;
        *state = new_state;

        if old_state != new_state {
            tracing::info!("State transition: {:?} -> {:?}", old_state, new_state);
        }

        Ok(())
    }

    pub fn pause(&self) -> Result<()> {
        let state = self.current_state()?;
        if matches!(state, AppState::Playing) {
            self.set_state(AppState::Paused)?;
            let mut paused = self.paused_at.write().map_err(|_| {
                crate::error::NeoCabError::System("Failed to write pause time".to_string())
            })?;
            *paused = Some(std::time::Instant::now());
            tracing::info!("Game paused");
        }
        Ok(())
    }

    pub fn resume(&self) -> Result<()> {
        let state = self.current_state()?;
        if matches!(state, AppState::Paused) {
            self.set_state(AppState::Playing)?;
            let mut paused = self.paused_at.write().map_err(|_| {
                crate::error::NeoCabError::System("Failed to clear pause time".to_string())
            })?;
            if let Some(paused_time) = *paused {
                let pause_duration = paused_time.elapsed();
                tracing::info!("Game resumed (paused for {:.2}s)", pause_duration.as_secs_f32());
            }
            *paused = None;
        }
        Ok(())
    }

    pub fn is_paused(&self) -> Result<bool> {
        Ok(matches!(self.current_state()?, AppState::Paused))
    }

    pub fn is_playing(&self) -> Result<bool> {
        Ok(matches!(self.current_state()?, AppState::Playing))
    }

    pub fn should_shutdown(&self) -> Result<bool> {
        Ok(matches!(self.current_state()?, AppState::Shutdown))
    }
}

impl Clone for GameStateManager {
    fn clone(&self) -> Self {
        Self {
            state: Arc::clone(&self.state),
            paused_at: Arc::clone(&self.paused_at),
        }
    }
}

impl Default for GameStateManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_transitions() {
        let manager = GameStateManager::new();
        assert_eq!(manager.current_state().unwrap(), AppState::Menu);

        manager.set_state(AppState::SystemSelect).unwrap();
        assert_eq!(manager.current_state().unwrap(), AppState::SystemSelect);

        manager.set_state(AppState::Playing).unwrap();
        assert!(manager.is_playing().unwrap());
        assert!(!manager.is_paused().unwrap());
    }

    #[test]
    fn test_pause_resume() {
        let manager = GameStateManager::new();
        manager.set_state(AppState::Playing).unwrap();

        manager.pause().unwrap();
        assert!(manager.is_paused().unwrap());

        manager.resume().unwrap();
        assert!(manager.is_playing().unwrap());
    }

    #[test]
    fn test_shutdown() {
        let manager = GameStateManager::new();
        manager.set_state(AppState::Shutdown).unwrap();
        assert!(manager.should_shutdown().unwrap());
    }
}
