use std::sync::Arc;
use std::collections::HashMap;
use tracing::{info, warn};
use crate::error::{Result, NeoCabError};
use crate::adapters::{EmulatorAdapter, MameAdapter};
use crate::db::Database;
use crate::models::Game;

pub struct EmulatorManager {
    adapters: HashMap<String, Arc<dyn EmulatorAdapter>>,
    _db: Arc<Database>,
}

impl EmulatorManager {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            adapters: HashMap::new(),
            _db: db,
        }
    }

    pub fn register_adapter(&mut self, name: String, adapter: Arc<dyn EmulatorAdapter>) {
        info!("Registering emulator adapter: {}", name);
        self.adapters.insert(name, adapter);
    }

    pub fn get_adapter(&self, name: &str) -> Option<Arc<dyn EmulatorAdapter>> {
        self.adapters.get(name).cloned()
    }

    pub fn list_adapters(&self) -> Vec<String> {
        self.adapters.keys().cloned().collect()
    }

    pub async fn launch_game(
        &self,
        game: &Game,
        emulator_name: &str,
    ) -> Result<()> {
        info!("Launching game: {} with emulator: {}", game.title, emulator_name);

        // Get emulator adapter
        let adapter = self.get_adapter(emulator_name)
            .ok_or_else(|| {
                warn!("Emulator not found: {}", emulator_name);
                NeoCabError::EmulatorNotFound(emulator_name.to_string())
            })?;

        // Launch the game
        adapter.launch(&game.rom_path).await?;

        info!("Game {} launched successfully", game.title);
        Ok(())
    }

    pub async fn stop_game(&self, emulator_name: &str) -> Result<()> {
        info!("Stopping game on emulator: {}", emulator_name);

        let adapter = self.get_adapter(emulator_name)
            .ok_or_else(|| {
                warn!("Emulator not found: {}", emulator_name);
                NeoCabError::EmulatorNotFound(emulator_name.to_string())
            })?;

        adapter.stop().await?;
        Ok(())
    }

    pub async fn initialize_default_emulators(&mut self) -> Result<()> {
        info!("Initializing default emulators");

        // MAME (most common arcade emulator)
        let mame = Arc::new(MameAdapter::new(
            "mame".to_string(),
            "0.262".to_string(),
        ));
        self.register_adapter("mame".to_string(), mame);

        info!("Default emulators initialized");
        Ok(())
    }
}
