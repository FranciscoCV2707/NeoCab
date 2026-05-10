use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Utc};
use tracing::{info, warn};
use crate::db::Database;
use crate::error::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CoinEvent {
    Inserted,
    Used,
    Returned,
    Error,
}

impl CoinEvent {
    fn as_str(&self) -> &str {
        match self {
            CoinEvent::Inserted => "inserted",
            CoinEvent::Used => "used",
            CoinEvent::Returned => "returned",
            CoinEvent::Error => "error",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoinState {
    pub total_balance: i64,
    pub coins_inserted: i64,
    pub coins_used: i64,
    pub game_cost: i64,
    pub coins_needed: i64,
    pub is_game_running: bool,
    pub last_event: Option<DateTime<Utc>>,
}

impl Default for CoinState {
    fn default() -> Self {
        Self {
            total_balance: 0,
            coins_inserted: 0,
            coins_used: 0,
            game_cost: 1,
            coins_needed: 1,
            is_game_running: false,
            last_event: None,
        }
    }
}

pub struct CoinManager {
    db: Arc<Database>,
    state: Arc<Mutex<CoinState>>,
}

impl CoinManager {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            state: Arc::new(Mutex::new(CoinState::default())),
        }
    }

    pub async fn add_coins(&self, amount: i64) -> Result<CoinState> {
        if amount <= 0 {
            warn!("Invalid coin amount: {}", amount);
            return Err(crate::error::NeoCabError::InvalidInput(
                "Coin amount must be positive".to_string(),
            ));
        }

        let mut state = self.state.lock().await;
        state.total_balance += amount;
        state.coins_inserted += amount;
        state.last_event = Some(Utc::now());

        info!("Added {} coins. New balance: {}", amount, state.total_balance);

        // Log coin event to database
        self.db.log_coin_event(
            CoinEvent::Inserted.as_str(),
            amount,
            "coin_slot",
            None,
        ).await.ok();

        Ok(state.clone())
    }

    pub async fn use_coins(&self, amount: i64) -> Result<CoinState> {
        let mut state = self.state.lock().await;

        if state.total_balance < amount {
            warn!("Insufficient coins. Have: {}, Need: {}", state.total_balance, amount);
            return Err(crate::error::NeoCabError::System(
                "Insufficient coins for this game".to_string(),
            ));
        }

        state.total_balance -= amount;
        state.coins_used += amount;
        state.last_event = Some(Utc::now());

        info!("Used {} coins. New balance: {}", amount, state.total_balance);

        // Log coin event to database
        self.db.log_coin_event(
            CoinEvent::Used.as_str(),
            amount,
            "game_start",
            None,
        ).await.ok();

        Ok(state.clone())
    }

    pub async fn return_coins(&self, amount: i64) -> Result<CoinState> {
        let mut state = self.state.lock().await;

        if state.total_balance < amount {
            warn!("Cannot return more coins than balance");
            return Err(crate::error::NeoCabError::System(
                "Insufficient balance to return".to_string(),
            ));
        }

        state.total_balance -= amount;
        state.last_event = Some(Utc::now());

        info!("Returned {} coins. New balance: {}", amount, state.total_balance);

        // Log coin event to database
        self.db.log_coin_event(
            CoinEvent::Returned.as_str(),
            amount,
            "coin_return",
            None,
        ).await.ok();

        Ok(state.clone())
    }

    pub async fn get_balance(&self) -> CoinState {
        self.state.lock().await.clone()
    }

    pub async fn start_game(&self, game_cost: i64) -> Result<CoinState> {
        let mut state = self.state.lock().await;

        if state.total_balance < game_cost {
            warn!("Cannot start game. Cost: {}, Balance: {}", game_cost, state.total_balance);
            return Err(crate::error::NeoCabError::System(
                format!("Need {} more coins", game_cost - state.total_balance),
            ));
        }

        state.total_balance -= game_cost;
        state.coins_used += game_cost;
        state.is_game_running = true;
        state.last_event = Some(Utc::now());

        info!("Game started. Cost: {}. New balance: {}", game_cost, state.total_balance);

        // Log coin event
        self.db.log_coin_event(
            CoinEvent::Used.as_str(),
            game_cost,
            "game_start",
            None,
        ).await.ok();

        Ok(state.clone())
    }

    pub async fn end_game(&self) -> Result<CoinState> {
        let mut state = self.state.lock().await;
        state.is_game_running = false;
        state.last_event = Some(Utc::now());

        info!("Game ended");

        Ok(state.clone())
    }

    pub async fn set_game_cost(&self, cost: i64) -> Result<CoinState> {
        if cost <= 0 {
            return Err(crate::error::NeoCabError::InvalidInput(
                "Game cost must be positive".to_string(),
            ));
        }

        let mut state = self.state.lock().await;
        state.game_cost = cost;
        state.coins_needed = cost;

        info!("Game cost set to: {}", cost);

        Ok(state.clone())
    }

    pub async fn reset(&self) -> Result<CoinState> {
        let mut state = self.state.lock().await;
        *state = CoinState::default();

        info!("Coin system reset");

        Ok(state.clone())
    }

    pub async fn get_earnings(&self) -> Result<i64> {
        let result = self.db.get_total_coin_earnings().await?;
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_coin_manager_creation() {
        // Mock database would be needed for full test
        // For now, just test the structure
        let state = CoinState::default();
        assert_eq!(state.total_balance, 0);
        assert_eq!(state.game_cost, 1);
    }

    #[test]
    fn test_coin_event_as_str() {
        assert_eq!(CoinEvent::Inserted.as_str(), "inserted");
        assert_eq!(CoinEvent::Used.as_str(), "used");
        assert_eq!(CoinEvent::Returned.as_str(), "returned");
    }
}
