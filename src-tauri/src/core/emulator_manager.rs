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

        // MAME (arcade)
        let mame = Arc::new(MameAdapter::new(
            "mame".to_string(),
            "0.262".to_string(),
        ));
        self.register_adapter("mame".to_string(), mame);

        // RetroArch with cores
        let retroarch_snes = Arc::new(crate::adapters::RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            crate::adapters::RetroArchCore::Snes9x,
        ));
        self.register_adapter("retroarch-snes".to_string(), retroarch_snes);

        let retroarch_nes = Arc::new(crate::adapters::RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            crate::adapters::RetroArchCore::Nestopia,
        ));
        self.register_adapter("retroarch-nes".to_string(), retroarch_nes);

        let retroarch_genesis = Arc::new(crate::adapters::RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            crate::adapters::RetroArchCore::Genesis,
        ));
        self.register_adapter("retroarch-genesis".to_string(), retroarch_genesis);

        let retroarch_gb = Arc::new(crate::adapters::RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            crate::adapters::RetroArchCore::Gambatte,
        ));
        self.register_adapter("retroarch-gb".to_string(), retroarch_gb);

        let retroarch_psx = Arc::new(crate::adapters::RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            crate::adapters::RetroArchCore::Pcsx,
        ));
        self.register_adapter("retroarch-psx".to_string(), retroarch_psx);

        let retroarch_n64 = Arc::new(crate::adapters::RetroArchAdapter::new(
            "retroarch".to_string(),
            "1.15.0".to_string(),
            crate::adapters::RetroArchCore::Mupen64plus,
        ));
        self.register_adapter("retroarch-n64".to_string(), retroarch_n64);

        info!("Default emulators initialized (MAME + RetroArch cores)");
        Ok(())
    }

    pub fn get_recommended_emulator(&self, system_name: &str) -> Option<String> {
        // Map systems to recommended emulator
        match system_name {
            "nes" => Some("retroarch-nes".to_string()),
            "snes" => Some("retroarch-snes".to_string()),
            "genesis" => Some("retroarch-genesis".to_string()),
            "gb" => Some("retroarch-gb".to_string()),
            "psx" => Some("retroarch-psx".to_string()),
            "n64" => Some("retroarch-n64".to_string()),
            "mame" => Some("mame".to_string()),
            _ => self.adapters.keys().next().cloned(),
        }
    }
}
