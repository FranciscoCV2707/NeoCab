# 🎮 ARCADECORE - PARTE 4: CÓDIGO DETALLADO + DEPLOYMENT

---

# CÓDIGO DETALLADO DE MÓDULOS CLAVE

## 1. Game Library - Scanner Paralelizado

**src-tauri/src/core/game_library.rs:**

```rust
use crate::models::{Game, System};
use crate::error::Result;
use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::Semaphore;
use walkdir::WalkDir;
use crc32fast::Hasher as Crc32;
use std::io::Read;
use tracing::{info, warn, debug};

pub struct GameLibrary {
    pool: SqlitePool,
}

impl GameLibrary {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Escanea un sistema completo en paralelo
    pub async fn scan_system(&self, system: &System) -> Result<Vec<Game>> {
        info!("Scanning system: {} at {}", system.display_name, system.rom_path);

        let extensions: Vec<String> = serde_json::from_str(&system.extensions_json)
            .unwrap_or_default();

        // Lista todos los archivos válidos
        let files = self.collect_files(Path::new(&system.rom_path), &extensions)?;
        info!("Found {} files for {}", files.len(), system.display_name);

        // Procesar en paralelo (max 8 simultáneos)
        let semaphore = Arc::new(Semaphore::new(8));
        let system_id = system.id.clone();

        let mut handles = Vec::new();
        for file in files {
            let permit = semaphore.clone().acquire_owned().await.unwrap();
            let sys_id = system_id.clone();

            let handle = tokio::spawn(async move {
                let _permit = permit; // RAII
                Self::process_file(file, sys_id).await
            });

            handles.push(handle);
        }

        // Esperar resultados
        let mut games = Vec::new();
        for handle in handles {
            if let Ok(Ok(game)) = handle.await {
                games.push(game);
            }
        }

        info!("Successfully scanned {} games", games.len());
        Ok(games)
    }

    /// Lista archivos recursivamente filtrando por extensión
    fn collect_files(&self, root: &Path, extensions: &[String]) -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();

        for entry in WalkDir::new(root)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if extensions.iter().any(|e| e.to_lowercase() == ext_str) {
                        files.push(entry.path().to_path_buf());
                    }
                }
            }
        }

        Ok(files)
    }

    /// Procesa un archivo individual (calcula CRC, crea Game)
    async fn process_file(path: PathBuf, system_id: String) -> Result<Game> {
        let filename = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let title = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string();

        let metadata = std::fs::metadata(&path)?;

        // CRC32 (solo para archivos pequeños)
        let crc32 = if metadata.len() < 100_000_000 {
            calculate_crc32(&path).ok()
        } else {
            None
        };

        let mut game = Game::new(
            title,
            filename,
            path.to_string_lossy().to_string(),
            system_id,
        );

        game.file_size = Some(metadata.len() as i64);
        game.crc32 = crc32;

        Ok(game)
    }

    /// Inserta juegos en BD en batch (transacción)
    pub async fn save_games(&self, games: &[Game]) -> Result<usize> {
        let mut tx = self.pool.begin().await?;
        let mut inserted = 0;

        for game in games {
            let result = sqlx::query(
                r#"
                INSERT OR REPLACE INTO games (
                    id, title, filename, rom_path, system_id,
                    file_size, crc32, enabled, discovered_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(&game.id)
            .bind(&game.title)
            .bind(&game.filename)
            .bind(&game.rom_path)
            .bind(&game.system_id)
            .bind(game.file_size)
            .bind(&game.crc32)
            .bind(game.enabled)
            .bind(game.discovered_at)
            .bind(game.updated_at)
            .execute(&mut *tx)
            .await;

            if result.is_ok() {
                inserted += 1;
            }
        }

        tx.commit().await?;
        info!("Saved {} games to database", inserted);
        Ok(inserted)
    }

    /// Obtiene juegos de un sistema
    pub async fn get_games_by_system(&self, system_id: &str) -> Result<Vec<Game>> {
        let games = sqlx::query_as::<_, Game>(
            "SELECT * FROM games WHERE system_id = ? AND enabled = 1 ORDER BY title"
        )
        .bind(system_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(games)
    }

    /// Búsqueda de juegos
    pub async fn search(&self, query: &str, limit: i32) -> Result<Vec<Game>> {
        let pattern = format!("%{}%", query);
        let games = sqlx::query_as::<_, Game>(
            "SELECT * FROM games WHERE title LIKE ? AND enabled = 1 LIMIT ?"
        )
        .bind(&pattern)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(games)
    }

    /// Toggle favorito
    pub async fn toggle_favorite(&self, game_id: &str) -> Result<bool> {
        let result = sqlx::query(
            "UPDATE games SET is_favorite = NOT is_favorite WHERE id = ? RETURNING is_favorite"
        )
        .bind(game_id)
        .fetch_one(&self.pool)
        .await?;

        let is_favorite: bool = result.try_get(0)?;
        Ok(is_favorite)
    }
}

fn calculate_crc32(path: &Path) -> Result<String> {
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Crc32::new();
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 { break; }
        hasher.update(&buffer[..bytes_read]);
    }

    Ok(format!("{:08x}", hasher.finalize()))
}
```

---

## 2. Emulator Manager (Adaptador Universal)

**src-tauri/src/adapters/trait_adapter.rs:**

```rust
use crate::error::Result;
use crate::models::{Game, Emulator};
use async_trait::async_trait;

#[async_trait]
pub trait EmulatorAdapter: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    
    /// Construye los argumentos CLI para lanzar el juego
    fn build_args(&self, game: &Game, emulator: &Emulator) -> Result<Vec<String>>;
    
    /// Verifica si el emulador está instalado
    async fn is_installed(&self, emulator: &Emulator) -> bool;
    
    /// Verifica BIOS si requiere
    fn requires_bios(&self) -> bool { false }
    
    /// Verifica BIOS instalado
    async fn check_bios(&self, _path: &str) -> bool { true }
}
```

**src-tauri/src/adapters/mame.rs:**

```rust
use super::trait_adapter::EmulatorAdapter;
use crate::error::Result;
use crate::models::{Game, Emulator};
use async_trait::async_trait;
use std::path::Path;

pub struct MameAdapter;

#[async_trait]
impl EmulatorAdapter for MameAdapter {
    fn id(&self) -> &str { "mame" }
    fn name(&self) -> &str { "MAME" }

    fn build_args(&self, game: &Game, _emulator: &Emulator) -> Result<Vec<String>> {
        // MAME usa el nombre sin extensión
        let rom_name = Path::new(&game.filename)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&game.title);

        Ok(vec![
            rom_name.to_string(),
            "-fullscreen".to_string(),
            "-nowindow".to_string(),
            "-skip_gameinfo".to_string(),
        ])
    }

    async fn is_installed(&self, emulator: &Emulator) -> bool {
        let exe = if cfg!(target_os = "windows") {
            emulator.executable_win.as_ref()
        } else {
            emulator.executable_linux.as_ref()
        };

        match exe {
            Some(path) => Path::new(path).exists(),
            None => false,
        }
    }
}
```

**src-tauri/src/adapters/retroarch.rs:**

```rust
use super::trait_adapter::EmulatorAdapter;
use crate::error::Result;
use crate::models::{Game, Emulator};
use async_trait::async_trait;

pub struct RetroArchAdapter;

#[async_trait]
impl EmulatorAdapter for RetroArchAdapter {
    fn id(&self) -> &str { "retroarch" }
    fn name(&self) -> &str { "RetroArch" }

    fn build_args(&self, game: &Game, emulator: &Emulator) -> Result<Vec<String>> {
        let core = if cfg!(target_os = "windows") {
            emulator.core_path_win.as_ref()
        } else {
            emulator.core_path_linux.as_ref()
        };

        let core_path = core.ok_or_else(|| {
            crate::error::ArcadeError::Emulator("RetroArch core not specified".to_string())
        })?;

        Ok(vec![
            "-L".to_string(),
            core_path.to_string(),
            game.rom_path.clone(),
            "-f".to_string(),  // fullscreen
        ])
    }

    async fn is_installed(&self, emulator: &Emulator) -> bool {
        // Similar a MAME
        let exe = if cfg!(target_os = "windows") {
            emulator.executable_win.as_ref()
        } else {
            emulator.executable_linux.as_ref()
        };

        match exe {
            Some(path) => std::path::Path::new(path).exists(),
            None => false,
        }
    }
}
```

**src-tauri/src/core/emulator_manager.rs:**

```rust
use crate::adapters::*;
use crate::adapters::trait_adapter::EmulatorAdapter;
use crate::models::{Game, Emulator};
use crate::error::{Result, ArcadeError};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::process::{Command, Child};
use tracing::{info, error};

pub struct EmulatorManager {
    adapters: HashMap<String, Box<dyn EmulatorAdapter>>,
    running: Arc<tokio::sync::Mutex<HashMap<String, Child>>>,
}

impl EmulatorManager {
    pub fn new() -> Self {
        let mut adapters: HashMap<String, Box<dyn EmulatorAdapter>> = HashMap::new();
        
        // Registrar todos los adaptadores
        adapters.insert("mame".to_string(), Box::new(MameAdapter));
        adapters.insert("advancemame".to_string(), Box::new(AdvanceMameAdapter));
        adapters.insert("retroarch".to_string(), Box::new(RetroArchAdapter));
        adapters.insert("dolphin".to_string(), Box::new(DolphinAdapter));
        adapters.insert("duckstation".to_string(), Box::new(DuckStationAdapter));
        adapters.insert("pcsx2".to_string(), Box::new(Pcsx2Adapter));
        adapters.insert("ppsspp".to_string(), Box::new(PpssppAdapter));
        adapters.insert("flycast".to_string(), Box::new(FlycastAdapter));
        // ... más adaptadores
        adapters.insert("generic".to_string(), Box::new(GenericCliAdapter));

        Self {
            adapters,
            running: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        }
    }

    pub async fn launch_game(&self, game: &Game, emulator: &Emulator) -> Result<String> {
        // Obtener adapter correcto
        let adapter = self.adapters.get(&emulator.backend)
            .ok_or_else(|| ArcadeError::Emulator(
                format!("No adapter for emulator: {}", emulator.backend)
            ))?;

        // Verificar instalación
        if !adapter.is_installed(emulator).await {
            return Err(ArcadeError::Emulator(
                format!("{} is not installed", emulator.name)
            ));
        }

        // Construir argumentos
        let args = adapter.build_args(game, emulator)?;

        // Resolver ejecutable
        let exe = if cfg!(target_os = "windows") {
            emulator.executable_win.clone()
        } else {
            emulator.executable_linux.clone()
        };

        let exe_path = exe.ok_or_else(|| 
            ArcadeError::Emulator("Executable not configured".to_string())
        )?;

        info!("Launching: {} {:?}", exe_path, args);

        // Spawn proceso
        let child = Command::new(&exe_path)
            .args(&args)
            .spawn()
            .map_err(|e| ArcadeError::Emulator(format!("Failed to spawn: {}", e)))?;

        let process_id = uuid::Uuid::new_v4().to_string();
        
        // Guardar proceso para supervisión
        let mut running = self.running.lock().await;
        running.insert(process_id.clone(), child);

        Ok(process_id)
    }

    pub async fn wait_for_exit(&self, process_id: &str) -> Result<i32> {
        let mut running = self.running.lock().await;
        if let Some(mut child) = running.remove(process_id) {
            let status = child.wait().await?;
            Ok(status.code().unwrap_or(-1))
        } else {
            Err(ArcadeError::Emulator("Process not found".to_string()))
        }
    }

    pub async fn force_close(&self, process_id: &str) -> Result<()> {
        let mut running = self.running.lock().await;
        if let Some(mut child) = running.remove(process_id) {
            child.kill().await?;
            info!("Force closed process: {}", process_id);
        }
        Ok(())
    }
}
```

---

## 3. Coin Manager

**src-tauri/src/core/coin_manager.rs:**

```rust
use crate::error::Result;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::info;

#[derive(Debug, Clone)]
pub enum CoinEvent {
    Inserted { count: u32, total: u32 },
    Used { amount: u32, remaining: u32 },
    Reset,
}

pub struct CoinManager {
    coins: Arc<AtomicU32>,
    sender: broadcast::Sender<CoinEvent>,
    coin_value: f64,
    currency: String,
}

impl CoinManager {
    pub fn new(coin_value: f64, currency: String) -> Self {
        let (sender, _) = broadcast::channel(100);
        Self {
            coins: Arc::new(AtomicU32::new(0)),
            sender,
            coin_value,
            currency,
        }
    }

    pub fn insert_coin(&self) -> u32 {
        let new_total = self.coins.fetch_add(1, Ordering::SeqCst) + 1;
        info!("Coin inserted! Total: {}", new_total);

        let _ = self.sender.send(CoinEvent::Inserted {
            count: 1,
            total: new_total,
        });

        new_total
    }

    pub fn use_coins(&self, amount: u32) -> Result<u32> {
        let current = self.coins.load(Ordering::SeqCst);

        if current < amount {
            return Err(crate::error::ArcadeError::Generic(
                anyhow::anyhow!("Insufficient coins: have {}, need {}", current, amount)
            ));
        }

        let new_total = self.coins.fetch_sub(amount, Ordering::SeqCst) - amount;

        let _ = self.sender.send(CoinEvent::Used {
            amount,
            remaining: new_total,
        });

        Ok(new_total)
    }

    pub fn get_coins(&self) -> u32 {
        self.coins.load(Ordering::SeqCst)
    }

    pub fn reset(&self) {
        self.coins.store(0, Ordering::SeqCst);
        let _ = self.sender.send(CoinEvent::Reset);
        info!("Coins reset");
    }

    pub fn subscribe(&self) -> broadcast::Receiver<CoinEvent> {
        self.sender.subscribe()
    }
}
```

---

## 4. Timer Manager

**src-tauri/src/core/timer_manager.rs:**

```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicI64, Ordering};
use tokio::sync::broadcast;
use tokio::time::{interval, Duration};
use tracing::{info, warn};

#[derive(Debug, Clone)]
pub enum TimerEvent {
    Started { seconds: i64 },
    Tick { remaining: i64 },
    Warning { remaining: i64 },
    Expired,
    Paused,
    Resumed,
    Extended { new_remaining: i64 },
}

pub struct TimerManager {
    remaining_seconds: Arc<AtomicI64>,
    sender: broadcast::Sender<TimerEvent>,
    is_paused: Arc<std::sync::atomic::AtomicBool>,
    warning_threshold: i64,
}

impl TimerManager {
    pub fn new(warning_threshold_seconds: i64) -> Self {
        let (sender, _) = broadcast::channel(100);
        Self {
            remaining_seconds: Arc::new(AtomicI64::new(0)),
            sender,
            is_paused: Arc::new(std::sync::atomic::AtomicBool::new(false)),
            warning_threshold: warning_threshold_seconds,
        }
    }

    pub fn start(&self, minutes: u32) {
        let seconds = (minutes * 60) as i64;
        self.remaining_seconds.store(seconds, Ordering::SeqCst);

        let _ = self.sender.send(TimerEvent::Started { seconds });

        let remaining = self.remaining_seconds.clone();
        let is_paused = self.is_paused.clone();
        let sender = self.sender.clone();
        let warning = self.warning_threshold;

        tokio::spawn(async move {
            let mut tick = interval(Duration::from_secs(1));
            let mut warning_sent = false;

            loop {
                tick.tick().await;

                // Skip if paused
                if is_paused.load(Ordering::SeqCst) {
                    continue;
                }

                let new_remaining = remaining.fetch_sub(1, Ordering::SeqCst) - 1;

                if new_remaining <= 0 {
                    let _ = sender.send(TimerEvent::Expired);
                    break;
                }

                if new_remaining <= warning && !warning_sent {
                    let _ = sender.send(TimerEvent::Warning { remaining: new_remaining });
                    warning_sent = true;
                }

                let _ = sender.send(TimerEvent::Tick { remaining: new_remaining });
            }
        });

        info!("Timer started: {} minutes", minutes);
    }

    pub fn add_time(&self, minutes: u32) {
        let seconds = (minutes * 60) as i64;
        let new_total = self.remaining_seconds.fetch_add(seconds, Ordering::SeqCst) + seconds;
        let _ = self.sender.send(TimerEvent::Extended { new_remaining: new_total });
        info!("Added {} minutes. New total: {}s", minutes, new_total);
    }

    pub fn pause(&self) {
        self.is_paused.store(true, Ordering::SeqCst);
        let _ = self.sender.send(TimerEvent::Paused);
    }

    pub fn resume(&self) {
        self.is_paused.store(false, Ordering::SeqCst);
        let _ = self.sender.send(TimerEvent::Resumed);
    }

    pub fn get_remaining(&self) -> i64 {
        self.remaining_seconds.load(Ordering::SeqCst)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<TimerEvent> {
        self.sender.subscribe()
    }
}
```

---

## 5. Input Manager Universal

**src-tauri/src/input/mod.rs:**

```rust
pub mod sdl_backend;
pub mod gilrs_backend;
pub mod mapping;
pub mod profiles;

use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::info;

#[derive(Debug, Clone)]
pub enum InputEvent {
    KeyPressed { key: String },
    KeyReleased { key: String },
    ButtonPressed { device_id: String, button: String, player: u32 },
    ButtonReleased { device_id: String, button: String, player: u32 },
    AxisMoved { device_id: String, axis: String, value: f32, player: u32 },
    DeviceConnected { device_id: String, name: String, device_type: String },
    DeviceDisconnected { device_id: String },
    CoinInserted,
}

#[derive(Debug, Clone)]
pub enum NavigationAction {
    Up, Down, Left, Right,
    Select, Back, Menu,
    Player1Start, Player2Start,
    InsertCoin,
}

pub struct InputManager {
    sender: broadcast::Sender<InputEvent>,
    sdl_backend: Arc<tokio::sync::Mutex<Option<sdl_backend::SdlBackend>>>,
}

impl InputManager {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(1000);
        Self {
            sender,
            sdl_backend: Arc::new(tokio::sync::Mutex::new(None)),
        }
    }

    pub async fn initialize(&self) -> anyhow::Result<()> {
        info!("Initializing input system");

        // Iniciar SDL2 backend en thread separado
        let sender = self.sender.clone();
        std::thread::spawn(move || {
            if let Err(e) = sdl_backend::run_sdl_loop(sender) {
                tracing::error!("SDL backend error: {}", e);
            }
        });

        Ok(())
    }

    pub fn subscribe(&self) -> broadcast::Receiver<InputEvent> {
        self.sender.subscribe()
    }
}
```

**src-tauri/src/input/sdl_backend.rs:**

```rust
use super::InputEvent;
use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::controller::{Button as ControllerButton, Axis as ControllerAxis};
use std::collections::HashMap;
use tokio::sync::broadcast;
use tracing::{info, debug, warn};

pub fn run_sdl_loop(sender: broadcast::Sender<InputEvent>) -> Result<(), String> {
    // Inicializar SDL
    sdl2::hint::set("SDL_JOYSTICK_THREAD", "1");
    
    let sdl_context = sdl2::init()?;
    let game_controller_subsystem = sdl_context.game_controller()?;
    let mut event_pump = sdl_context.event_pump()?;

    let mut controllers: HashMap<u32, sdl2::controller::GameController> = HashMap::new();

    info!("SDL backend started");

    loop {
        for event in event_pump.poll_iter() {
            match event {
                Event::Quit { .. } => return Ok(()),

                // ============= KEYBOARD =============
                Event::KeyDown { keycode: Some(keycode), .. } => {
                    let key_name = format!("{:?}", keycode);
                    let _ = sender.send(InputEvent::KeyPressed { key: key_name });
                }
                Event::KeyUp { keycode: Some(keycode), .. } => {
                    let key_name = format!("{:?}", keycode);
                    let _ = sender.send(InputEvent::KeyReleased { key: key_name });
                }

                // ============= CONTROLLER CONNECTED =============
                Event::ControllerDeviceAdded { which, .. } => {
                    if game_controller_subsystem.is_game_controller(which) {
                        match game_controller_subsystem.open(which) {
                            Ok(controller) => {
                                let name = controller.name();
                                info!("Controller connected: {} ({})", name, which);
                                
                                let _ = sender.send(InputEvent::DeviceConnected {
                                    device_id: format!("controller_{}", which),
                                    name: name.clone(),
                                    device_type: "gamepad".to_string(),
                                });

                                controllers.insert(which, controller);
                            }
                            Err(e) => warn!("Failed to open controller: {}", e),
                        }
                    }
                }

                Event::ControllerDeviceRemoved { which, .. } => {
                    info!("Controller disconnected: {}", which);
                    controllers.remove(&which);
                    let _ = sender.send(InputEvent::DeviceDisconnected {
                        device_id: format!("controller_{}", which),
                    });
                }

                // ============= CONTROLLER BUTTONS =============
                Event::ControllerButtonDown { which, button, .. } => {
                    let button_name = format!("{:?}", button);
                    let _ = sender.send(InputEvent::ButtonPressed {
                        device_id: format!("controller_{}", which),
                        button: button_name,
                        player: which,
                    });
                }

                Event::ControllerButtonUp { which, button, .. } => {
                    let button_name = format!("{:?}", button);
                    let _ = sender.send(InputEvent::ButtonReleased {
                        device_id: format!("controller_{}", which),
                        button: button_name,
                        player: which,
                    });
                }

                // ============= CONTROLLER AXES =============
                Event::ControllerAxisMotion { which, axis, value, .. } => {
                    let axis_name = format!("{:?}", axis);
                    let normalized = value as f32 / 32768.0;

                    // Solo emitir si está fuera del deadzone
                    if normalized.abs() > 0.15 {
                        let _ = sender.send(InputEvent::AxisMoved {
                            device_id: format!("controller_{}", which),
                            axis: axis_name,
                            value: normalized,
                            player: which,
                        });
                    }
                }

                _ => {}
            }
        }

        // Sleep mínimo para no quemar CPU
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
}
```

---

## 6. Autoboot Manager

**src-tauri/src/core/autoboot_manager.rs:**

```rust
use crate::error::Result;
use tracing::info;

pub struct AutobootManager;

impl AutobootManager {
    pub fn enable() -> Result<()> {
        #[cfg(target_os = "windows")]
        return Self::enable_windows();

        #[cfg(target_os = "linux")]
        return Self::enable_linux();

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        Err(crate::error::ArcadeError::Generic(
            anyhow::anyhow!("Autoboot not supported on this OS")
        ))
    }

    pub fn disable() -> Result<()> {
        #[cfg(target_os = "windows")]
        return Self::disable_windows();

        #[cfg(target_os = "linux")]
        return Self::disable_linux();

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        Ok(())
    }

    pub fn is_enabled() -> bool {
        #[cfg(target_os = "windows")]
        return Self::is_enabled_windows();

        #[cfg(target_os = "linux")]
        return Self::is_enabled_linux();

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        false
    }

    // ============= WINDOWS =============
    #[cfg(target_os = "windows")]
    fn enable_windows() -> Result<()> {
        use winreg::RegKey;
        use winreg::enums::*;

        let exe_path = std::env::current_exe()?;
        let path_str = exe_path.to_string_lossy().to_string();

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu.create_subkey(
            "Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        )?;

        key.set_value("ArcadeCore", &path_str)?;
        info!("Windows autoboot enabled: {}", path_str);

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn disable_windows() -> Result<()> {
        use winreg::RegKey;
        use winreg::enums::*;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let key = hkcu.open_subkey_with_flags(
            "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            KEY_WRITE,
        )?;

        let _ = key.delete_value("ArcadeCore");
        info!("Windows autoboot disabled");

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn is_enabled_windows() -> bool {
        use winreg::RegKey;
        use winreg::enums::*;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        match hkcu.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Run") {
            Ok(key) => key.get_value::<String, _>("ArcadeCore").is_ok(),
            Err(_) => false,
        }
    }

    // ============= LINUX =============
    #[cfg(target_os = "linux")]
    fn enable_linux() -> Result<()> {
        let exe_path = std::env::current_exe()?;
        let exe_str = exe_path.to_string_lossy().to_string();

        // Crear .desktop file
        let autostart_dir = dirs::config_dir()
            .ok_or_else(|| crate::error::ArcadeError::Generic(
                anyhow::anyhow!("Cannot find config directory")
            ))?
            .join("autostart");

        std::fs::create_dir_all(&autostart_dir)?;

        let desktop_entry = format!(
            r#"[Desktop Entry]
Type=Application
Name=ArcadeCore
GenericName=Arcade Frontend
Exec={}
Icon=arcadecore
Terminal=false
Categories=Game;
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
"#,
            exe_str
        );

        let desktop_file = autostart_dir.join("arcadecore.desktop");
        std::fs::write(&desktop_file, desktop_entry)?;

        info!("Linux autoboot enabled: {:?}", desktop_file);
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn disable_linux() -> Result<()> {
        let desktop_file = dirs::config_dir()
            .map(|d| d.join("autostart").join("arcadecore.desktop"));

        if let Some(file) = desktop_file {
            if file.exists() {
                std::fs::remove_file(&file)?;
                info!("Linux autoboot disabled");
            }
        }

        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn is_enabled_linux() -> bool {
        dirs::config_dir()
            .map(|d| d.join("autostart").join("arcadecore.desktop").exists())
            .unwrap_or(false)
    }
}
```

---

# DEPLOYMENT Y RELEASE

## Build para Producción

### Windows

```bash
# Build con todas las optimizaciones
cargo tauri build

# Output:
# src-tauri/target/release/bundle/
#   ├── nsis/
#   │   └── ArcadeCore_0.1.0_x64-setup.exe    # Installer NSIS
#   ├── msi/
#   │   └── ArcadeCore_0.1.0_x64_en-US.msi    # Installer MSI
#   └── release/
#       └── arcadecore.exe                     # Portable
```

### Linux

```bash
# Build
cargo tauri build

# Output:
# src-tauri/target/release/bundle/
#   ├── deb/
#   │   └── arcadecore_0.1.0_amd64.deb        # Debian/Ubuntu
#   ├── appimage/
#   │   └── arcadecore_0.1.0_amd64.AppImage   # Universal Linux
#   └── release/
#       └── arcadecore                         # Binario directo
```

## CI/CD GitHub Actions

**.github/workflows/build.yml:**

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-22.04, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt update
          sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libsdl2-dev
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'ArcadeCore v__VERSION__'
          releaseBody: 'See CHANGELOG.md'
          releaseDraft: true
          prerelease: false
```

---

# CHECKLIST FINAL ANTES DE EMPEZAR

## Pre-requisitos

- [ ] Tienes hardware suficiente (16GB RAM mínimo)
- [ ] Tienes 30GB libres en disco
- [ ] Tienes cuenta de GitHub
- [ ] Has instalado Git
- [ ] Has instalado Rust (rustc --version funciona)
- [ ] Has instalado Node.js 20+
- [ ] Has instalado VS Code
- [ ] Has instalado SDL2
- [ ] Has instalado Tauri CLI (cargo tauri --version funciona)
- [ ] Has creado un proyecto Tauri de prueba que funciona

## Conocimientos Mínimos

- [ ] Sabes usar Git básico
- [ ] Sabes usar terminal/CMD
- [ ] Has programado antes (cualquier lenguaje)
- [ ] Estás dispuesto a aprender Rust progresivamente
- [ ] Tienes 4-6 horas semanales mínimo para dedicar

## Setup del Proyecto

- [ ] Has clonado/creado el repositorio
- [ ] Estructura de carpetas creada
- [ ] Cargo.toml configurado con dependencias
- [ ] package.json configurado
- [ ] Primer commit hecho
- [ ] Probaste `cargo tauri dev` y funciona

## Recursos Para Aprender

### Rust
- Libro oficial: https://doc.rust-lang.org/book/
- Rustlings (ejercicios): https://github.com/rust-lang/rustlings
- Rust by Example: https://doc.rust-lang.org/rust-by-example/

### Tauri
- Documentación: https://tauri.app/v1/guides/
- Discord oficial: https://discord.com/invite/tauri

### React + TypeScript
- Documentación React: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/

### SQLite
- SQLite tutorial: https://www.sqlitetutorial.net/
- sqlx docs: https://docs.rs/sqlx/

### SDL2 (input)
- Documentación: https://wiki.libsdl.org/
- rust-sdl2: https://github.com/Rust-SDL2/rust-sdl2

---

# RECURSOS ADICIONALES IMPORTANTES

## Bases de Datos de ROMs (DAT files)

```
No-Intro: https://www.no-intro.org/
  - Roms validas y limpias
  - Para todas las consolas
  
Redump: http://redump.org/
  - Discos (CD/DVD) verificados
  
TOSEC: https://www.tosecdev.org/
  - Vintage software preservation
  
MAME XML: 
  - mame -listxml
  - Detallado de cada game
```

## Scrapers de Metadata

```
TheGamesDB: https://thegamesdb.net/
  - API gratuita
  - Cover art, videos, descripciones

ScreenScraper: https://www.screenscraper.fr/
  - Más completo
  - Requiere registro

IGDB: https://www.igdb.com/
  - API moderna
  - Token necesario
  
LaunchBox DB: https://gamesdb.launchbox-app.com/
  - Excelente quality
  - Comunidad
```

## Themes / Artwork Sources

```
HyperSpin Themes: https://hyperspinfe.com/
EmuMovies: https://emumovies.com/
  - Videos de gameplay
  - Snaps y wheels
ArcadeItalia: https://www.progettoarcade.com/
LaunchBox Forums: https://forums.launchbox-app.com/
```

## Comunidad

```
RetroArch Discord
RetroPie Discord
ArcadePunks Forum
BYOAC (Build Your Own Arcade Cabinet)
```

---

# CONCLUSIÓN

**Tienes en tus manos el plan más completo y detallado para construir ArcadeCore.**

Es un proyecto ambicioso pero perfectamente factible siguiendo el cronograma de 16 semanas.

## Próximos pasos AHORA:

1. **Lee** este documento + las partes 1, 2 y 3 completas
2. **Instala** todas las herramientas (Semana 1, Día 1)
3. **Crea** el repositorio
4. **Sigue** el cronograma semana por semana

## ¿Necesitas ayuda en alguna parte?

Vuelve a preguntar y te ayudo con:
- Detalles de implementación específica
- Bugs que encuentres
- Diseño de algún módulo
- Configuración de algún emulador específico
- UI design de algún tema
- Cualquier duda

---

**ArcadeCore - Cuando termine, será EL frontend arcade definitivo.**

*Mejor que Hyperspin (open + moderno)*  
*Mejor que Attract Mode (más rápido + mejor UI)*  
*Mejor que AdvanceMAME (multi-emulador)*  
*Único en el mundo (coins + timer + autoboot + universal input)*

🎮 **¡A codear!** 🎮
