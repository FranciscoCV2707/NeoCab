use crate::adapters::launch::{self, LaunchContext, LaunchResult, LaunchStrategy};
use crate::adapters::{EmulatorAdapter, GenericAdapter, MameAdapter};
use crate::db::Database;
use crate::error::{NeoCabError, Result};
use crate::models::Game;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use tracing::{info, warn};

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

    pub async fn launch_game(&self, game: &Game, emulator_name: &str) -> Result<()> {
        info!(
            "Launching game: {} with emulator: {}",
            game.title, emulator_name
        );

        // Get emulator adapter
        let adapter = self.get_adapter(emulator_name).ok_or_else(|| {
            warn!("Emulator not found: {}", emulator_name);
            NeoCabError::EmulatorNotFound(emulator_name.to_string())
        })?;

        // Launch the game
        adapter.launch(&game.rom_path).await?;

        info!("Game {} launched successfully", game.title);
        Ok(())
    }

    pub async fn launch_game_with_scripts(
        &self,
        game: &Game,
        emulator_name: &str,
        pre_script: Option<&str>,
        post_script: Option<&str>,
    ) -> Result<()> {
        info!("Launching game with scripts: {}", game.title);

        // Execute pre-launch script if provided
        if let Some(script) = pre_script {
            info!("Executing pre-launch script");
            self.execute_script(script, &game.rom_path)?;
        }

        // Launch the game
        self.launch_game(game, emulator_name).await?;

        // Execute post-launch script if provided (background task)
        if let Some(script) = post_script {
            let script = script.to_string();
            let rom_path = game.rom_path.clone();
            let self_clone = Arc::new(self.clone_adapters());

            tokio::spawn(async move {
                info!("Executing post-launch script");
                if let Err(e) = self_clone.execute_script(&script, &rom_path) {
                    warn!("Post-launch script failed: {}", e);
                }
            });
        }

        Ok(())
    }

    fn clone_adapters(&self) -> Self {
        Self {
            adapters: self.adapters.clone(),
            _db: self._db.clone(),
        }
    }

    pub fn execute_script(&self, script: &str, rom_path: &str) -> Result<()> {
        if script.trim().is_empty() {
            return Ok(());
        }

        info!("Executing script: {}", script);

        #[cfg(target_os = "windows")]
        {
            let status = Command::new("cmd")
                .args(["/C", script])
                .env("ROM_PATH", rom_path)
                .status()
                .map_err(|e| NeoCabError::System(format!("Failed to execute script: {}", e)))?;

            if !status.success() {
                warn!("Script failed with status: {:?}", status.code());
            }
        }

        #[cfg(target_os = "linux")]
        {
            let status = Command::new("bash")
                .args(&["-c", script])
                .env("ROM_PATH", rom_path)
                .status()
                .map_err(|e| NeoCabError::System(format!("Failed to execute script: {}", e)))?;

            if !status.success() {
                warn!("Script failed with status: {:?}", status.code());
            }
        }

        Ok(())
    }

    /// Launch using the strategy pipeline
    pub async fn launch_with_pipeline(
        &self,
        game: &Game,
        emulator_name: &str,
    ) -> Result<LaunchResult> {
        let emulator_path = self
            .get_adapter_path(emulator_name)
            .ok_or_else(|| NeoCabError::EmulatorNotFound(emulator_name.to_string()))?;

        let strategies: Vec<Box<dyn LaunchStrategy>> = vec![
            Box::new(launch::EmulatorSpecificStrategy),
            Box::new(launch::SteamLaunchStrategy),
            Box::new(launch::StoreLaunchStrategy),
            Box::new(launch::ChdMountStrategy),
            Box::new(launch::ChdToCueStrategy),
            Box::new(launch::ZipExtractStrategy),
            Box::new(launch::BatchFileStrategy),
            Box::new(launch::ShortcutStrategy),
            Box::new(launch::DefaultRomStrategy),
        ];

        let ctx = LaunchContext {
            rom_path: PathBuf::from(&game.rom_path),
            emulator_path: Some(PathBuf::from(&emulator_path)),
            emulator_args: None,
            system_name: String::new(),
            game_title: game.title.clone(),
            pre_script: None,
            post_script: None,
        };

        launch::execute_launch(&strategies, ctx).await
    }

    /// Get the path for an emulator adapter
    fn get_adapter_path(&self, name: &str) -> Option<String> {
        // Try to find configured path - for now construct from adapter name
        let _adapter = self.adapters.get(name)?;
        // Adapters don't expose their path directly; use name as fallback
        Some(name.to_string())
    }

    pub async fn stop_game(&self, emulator_name: &str) -> Result<()> {
        info!("Stopping game on emulator: {}", emulator_name);

        let adapter = self.get_adapter(emulator_name).ok_or_else(|| {
            warn!("Emulator not found: {}", emulator_name);
            NeoCabError::EmulatorNotFound(emulator_name.to_string())
        })?;

        adapter.stop().await?;
        Ok(())
    }

    pub async fn initialize_default_emulators(&mut self) -> Result<()> {
        self.initialize_default_emulators_with_paths(&HashMap::new()).await
    }

    pub async fn initialize_default_emulators_with_paths(
        &mut self,
        paths: &HashMap<String, String>,
    ) -> Result<()> {
        info!("Initializing default emulators");

        // Helper: use configured path if present, otherwise fall back to default exe name
        let exe = |id: &str, default: &str| -> String {
            paths.get(id).filter(|p| !p.is_empty()).cloned().unwrap_or_else(|| default.to_string())
        };

        // MAME (arcade)
        let mame = Arc::new(MameAdapter::new("mame".to_string(), "0.262".to_string()));
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

        // Standalone emulators via GenericAdapter
        let specs: &[(&str, &str, &[&str], &[&str])] = &[
            ("teknoparrot", "ParrotLoader64.exe", &["--profile"], &[]),
            ("pcsx2",       "pcsx2-qt.exe",        &["--fullscreen", "--nogui"], &[]),
            ("dolphin",     "Dolphin.exe",          &["--exec"], &["--batch", "--confirm=false"]),
            ("duckstation", "duckstation-qt.exe",   &["-fullscreen", "-batch"], &[]),
            ("ppsspp",      "PPSSPPWindows64.exe",  &[], &[]),
            ("xenia",       "xenia.exe",            &[], &[]),
            ("rpcs3",       "rpcs3.exe",            &["--no-gui"], &[]),
            ("cemu",        "Cemu.exe",             &["-g"], &[]),
            ("yuzu",        "yuzu.exe",             &[], &[]),
            ("ryujinx",     "Ryujinx.exe",          &[], &[]),
            ("mgba",        "mgba.exe",             &[], &[]),
            ("flycast",     "flycast.exe",          &[], &[]),
        ];

        for (id, default_exe, before, after) in specs {
            let adapter = Arc::new(GenericAdapter::new(
                *id,
                exe(id, default_exe),
                "latest",
                before.iter().map(|s| s.to_string()).collect(),
                after.iter().map(|s| s.to_string()).collect(),
            ));
            self.register_adapter(id.to_string(), adapter);
        }

        info!("Default emulators initialized ({} adapters)", self.adapters.len());
        Ok(())
    }

    pub fn get_recommended_emulator(&self, system_name: &str) -> Option<String> {
        let recommendation = match system_name {
            "nes" | "famicom"               => "retroarch-nes",
            "snes" | "superfamicom"         => "retroarch-snes",
            "genesis" | "megadrive"         => "retroarch-genesis",
            "gb" | "gbc" | "gameboy"        => "retroarch-gb",
            "psx" | "ps1" | "playstation"   => "duckstation",
            "ps2"                           => "pcsx2",
            "ps3"                           => "rpcs3",
            "psp"                           => "ppsspp",
            "n64"                           => "retroarch-n64",
            "gamecube" | "wii"              => "dolphin",
            "wiiu"                          => "cemu",
            "switch"                        => "yuzu",
            "xbox360"                       => "xenia",
            "arcade_pc" | "teknoparrot"     => "teknoparrot",
            "dreamcast" | "naomi"           => "flycast",
            "gba"                           => "mgba",
            "mame" | "arcade"               => "mame",
            _ => return self.adapters.keys().next().cloned(),
        };
        // Only return if the adapter is actually registered
        if self.adapters.contains_key(recommendation) {
            Some(recommendation.to_string())
        } else {
            self.adapters.keys().next().cloned()
        }
    }
}
