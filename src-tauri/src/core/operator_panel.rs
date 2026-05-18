use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuthLevel {
    Guest,
    Operator,
    Admin,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStats {
    pub total_sessions: i64,
    pub total_playtime: i64,
    pub average_playtime: i64,
    pub top_game: String,
    pub top_game_plays: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatorStats {
    pub total_revenue: f64,
    pub coins_inserted: i64,
    pub coins_returned: i64,
    pub net_coins: i64,
    pub current_balance: f64,
    pub avg_transaction: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemHealth {
    pub total_roms: i64,
    pub total_systems: i64,
    pub database_status: String,
}

pub struct OperatorPanel {
    pin: Arc<RwLock<String>>,
    auth_level: Arc<RwLock<AuthLevel>>,
    max_attempts: u32,
    failed_attempts: Arc<RwLock<u32>>,
}

impl OperatorPanel {
    pub fn new(pin: String) -> Self {
        Self {
            pin: Arc::new(RwLock::new(pin)),
            auth_level: Arc::new(RwLock::new(AuthLevel::Guest)),
            max_attempts: 3,
            failed_attempts: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn authenticate(&self, entered_pin: &str) -> Result<bool> {
        let mut failed = self.failed_attempts.write().await;

        if *failed >= self.max_attempts {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Maximum authentication attempts exceeded".to_string(),
            ));
        }

        let stored_pin = self.pin.read().await;
        let is_valid = entered_pin == stored_pin.as_str();

        if is_valid {
            *failed = 0;
            let mut auth = self.auth_level.write().await;
            *auth = AuthLevel::Operator;
            info!("Operator authenticated successfully");
            Ok(true)
        } else {
            *failed += 1;
            Err(crate::error::NeoCabError::InvalidInput(format!(
                "Invalid PIN. {} attempts remaining",
                self.max_attempts - *failed
            )))
        }
    }

    pub async fn logout(&self) {
        let mut auth = self.auth_level.write().await;
        *auth = AuthLevel::Guest;
        let mut failed = self.failed_attempts.write().await;
        *failed = 0;
        info!("Operator logged out");
    }

    pub async fn is_authenticated(&self) -> bool {
        let auth = self.auth_level.read().await;
        *auth != AuthLevel::Guest
    }

    pub async fn change_pin(&self, old_pin: &str, new_pin: &str) -> Result<()> {
        let auth = self.auth_level.read().await;
        if *auth != AuthLevel::Operator {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Not authenticated".to_string(),
            ));
        }
        drop(auth);

        let stored_pin = self.pin.read().await;
        if old_pin != stored_pin.as_str() {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Incorrect current PIN".to_string(),
            ));
        }
        drop(stored_pin);

        let mut pin = self.pin.write().await;
        *pin = new_pin.to_string();
        info!("PIN changed successfully");
        Ok(())
    }

    pub async fn get_auth_level(&self) -> AuthLevel {
        *self.auth_level.read().await
    }
}

impl Default for OperatorPanel {
    fn default() -> Self {
        Self::new("0000".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_operator_authentication() {
        let panel = OperatorPanel::new("1234".to_string());
        assert!(!panel.is_authenticated().await);

        let result = panel.authenticate("1234").await;
        assert!(result.is_ok());
        assert!(panel.is_authenticated().await);
    }

    #[tokio::test]
    async fn test_invalid_pin() {
        let panel = OperatorPanel::new("1234".to_string());
        let result = panel.authenticate("9999").await;
        assert!(result.is_err());
        assert!(!panel.is_authenticated().await);
    }

    #[tokio::test]
    async fn test_max_attempts() {
        let panel = OperatorPanel::new("1234".to_string());

        let _ = panel.authenticate("0000").await;
        let _ = panel.authenticate("0000").await;
        let _ = panel.authenticate("0000").await;

        let result = panel.authenticate("1234").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_logout() {
        let panel = OperatorPanel::new("1234".to_string());
        let _ = panel.authenticate("1234").await;
        assert!(panel.is_authenticated().await);

        panel.logout().await;
        assert!(!panel.is_authenticated().await);
    }
}
