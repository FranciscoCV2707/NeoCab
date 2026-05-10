# 🎮 ARCADECORE v3 - PARTE 5: CRONOGRAMA EXHAUSTIVO SEMANAS 3-16

> **Continuación del plan maestro.** Este documento desarrolla DÍA POR DÍA cada semana del cronograma. Las semanas 1-2 están en el archivo 03_PLAN_MAESTRO_PARTE_3.md.

---

# SEMANA 3: CONFIG MANAGER + HOT-RELOAD

**Objetivo**: Sistema de configuración YAML con recarga en caliente (sin reiniciar la app).

## Día 1 (Lunes): Estructura del ConfigManager

### Tarea 1.1 - Crear archivos base
```bash
cd src-tauri/src/core
touch config_manager.rs
```

**src-tauri/src/core/config_manager.rs:**
```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::error::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub kiosk: KioskConfig,
    pub pricing: PricingConfig,
    pub display: DisplayConfig,
    pub operator: OperatorConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KioskConfig {
    pub enabled: bool,
    pub autoboot: bool,
    pub fullscreen: bool,
    pub disable_alt_tab: bool,
    pub disable_windows_key: bool,
    pub idle_return_seconds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingConfig {
    pub currency: String,
    pub coin_value: f64,
    pub minutes_per_coin: u32,
    pub max_session_minutes: u32,
    pub allow_add_time_mid_game: bool,
    pub warning_seconds: u32,
    pub timeout_action: String, // "close" | "pause" | "screenshot"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayConfig {
    pub theme: String,
    pub resolution: String,
    pub orientation: String,
    pub refresh_rate: u32,
    pub vsync: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatorConfig {
    pub pin_hash: String,
    pub access_key: String,  // "Ctrl+Alt+O"
    pub auto_logout_seconds: u32,
}

pub struct ConfigManager {
    config: Arc<RwLock<AppConfig>>,
    config_dir: PathBuf,
}

impl ConfigManager {
    pub async fn new(config_dir: PathBuf) -> Result<Self> {
        let config = Self::load_or_default(&config_dir).await?;
        Ok(Self {
            config: Arc::new(RwLock::new(config)),
            config_dir,
        })
    }
    
    async fn load_or_default(dir: &PathBuf) -> Result<AppConfig> {
        let config_file = dir.join("kiosk.yaml");
        
        if !config_file.exists() {
            // Crear config por defecto
            let default = Self::default_config();
            let yaml = serde_yaml::to_string(&default)?;
            std::fs::create_dir_all(dir)?;
            std::fs::write(&config_file, yaml)?;
            return Ok(default);
        }
        
        let content = tokio::fs::read_to_string(&config_file).await?;
        let config: AppConfig = serde_yaml::from_str(&content)?;
        Ok(config)
    }
    
    fn default_config() -> AppConfig {
        AppConfig {
            kiosk: KioskConfig {
                enabled: true,
                autoboot: false,
                fullscreen: true,
                disable_alt_tab: true,
                disable_windows_key: true,
                idle_return_seconds: 300,
            },
            pricing: PricingConfig {
                currency: "MXN".to_string(),
                coin_value: 5.0,
                minutes_per_coin: 10,
                max_session_minutes: 60,
                allow_add_time_mid_game: true,
                warning_seconds: 60,
                timeout_action: "close".to_string(),
            },
            display: DisplayConfig {
                theme: "classic-arcade".to_string(),
                resolution: "1920x1080".to_string(),
                orientation: "horizontal".to_string(),
                refresh_rate: 60,
                vsync: true,
            },
            operator: OperatorConfig {
                pin_hash: bcrypt::hash("1234", 10).unwrap(),
                access_key: "Ctrl+Alt+O".to_string(),
                auto_logout_seconds: 300,
            },
        }
    }
    
    pub async fn get(&self) -> AppConfig {
        self.config.read().await.clone()
    }
    
    pub async fn update<F>(&self, updater: F) -> Result<()>
    where F: FnOnce(&mut AppConfig)
    {
        let mut config = self.config.write().await;
        updater(&mut config);
        self.save(&config).await?;
        Ok(())
    }
    
    async fn save(&self, config: &AppConfig) -> Result<()> {
        let yaml = serde_yaml::to_string(config)?;
        let file = self.config_dir.join("kiosk.yaml");
        tokio::fs::write(&file, yaml).await?;
        Ok(())
    }
}
```

### Tarea 1.2 - Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_config_create_default() {
        let temp = TempDir::new().unwrap();
        let mgr = ConfigManager::new(temp.path().to_path_buf()).await.unwrap();
        let config = mgr.get().await;
        assert_eq!(config.pricing.minutes_per_coin, 10);
    }
    
    #[tokio::test]
    async fn test_config_update_persists() {
        let temp = TempDir::new().unwrap();
        let mgr = ConfigManager::new(temp.path().to_path_buf()).await.unwrap();
        mgr.update(|c| c.pricing.coin_value = 10.0).await.unwrap();
        
        // Recargar
        let mgr2 = ConfigManager::new(temp.path().to_path_buf()).await.unwrap();
        assert_eq!(mgr2.get().await.pricing.coin_value, 10.0);
    }
}
```

## Día 2 (Martes): Hot-reload con `notify`

### Tarea 2.1 - File watcher
```rust
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc::channel;

impl ConfigManager {
    pub fn start_watcher(self: Arc<Self>) -> Result<()> {
        let (tx, rx) = channel();
        let mut watcher = RecommendedWatcher::new(tx, Config::default())?;
        watcher.watch(&self.config_dir, RecursiveMode::NonRecursive)?;
        
        let mgr = self.clone();
        std::thread::spawn(move || {
            for event in rx {
                if let Ok(Event { kind: notify::EventKind::Modify(_), paths, .. }) = event {
                    for path in paths {
                        if path.extension().map_or(false, |e| e == "yaml") {
                            tracing::info!("Config file changed: {:?}, reloading", path);
                            tokio::runtime::Handle::current().block_on(async {
                                let _ = mgr.reload().await;
                            });
                        }
                    }
                }
            }
        });
        
        // Hold watcher alive
        std::mem::forget(watcher);
        Ok(())
    }
    
    async fn reload(&self) -> Result<()> {
        let new_config = Self::load_or_default(&self.config_dir).await?;
        *self.config.write().await = new_config;
        tracing::info!("Config reloaded successfully");
        Ok(())
    }
}
```

## Día 3 (Miércoles): Comandos Tauri

```rust
// commands/config.rs
#[tauri::command]
pub async fn get_config(state: tauri::State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.get().await)
}

#[tauri::command]
pub async fn update_pricing(
    state: tauri::State<'_, AppState>,
    coin_value: f64,
    minutes_per_coin: u32,
) -> Result<(), String> {
    state.config.update(|c| {
        c.pricing.coin_value = coin_value;
        c.pricing.minutes_per_coin = minutes_per_coin;
    }).await.map_err(|e| e.to_string())
}
```

## Día 4 (Jueves): UI de configuración (React)

```tsx
// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  
  useEffect(() => {
    invoke<AppConfig>('get_config').then(setConfig);
  }, []);
  
  const updatePricing = async (coinValue: number, minutes: number) => {
    await invoke('update_pricing', {
      coinValue,
      minutesPerCoin: minutes,
    });
  };
  
  if (!config) return <div>Loading...</div>;
  
  return (
    <div className="settings">
      <h2>💰 Pricing</h2>
      <input
        type="number"
        value={config.pricing.coin_value}
        onChange={e => updatePricing(parseFloat(e.target.value), config.pricing.minutes_per_coin)}
      />
      <input
        type="number"
        value={config.pricing.minutes_per_coin}
        onChange={e => updatePricing(config.pricing.coin_value, parseInt(e.target.value))}
      />
    </div>
  );
}
```

## Día 5 (Viernes): Validación y commit

- ✅ Verificar que cambiar YAML manualmente recarga la UI
- ✅ Tests pasan
- ✅ Commit: `git commit -m "Week 3: Config Manager with hot-reload"`

---

# SEMANA 4: GAME LIBRARY + SCANNER PARALELIZADO

## Día 1: Estructura del scanner

Ver código completo en **04_PLAN_MAESTRO_PARTE_4.md**, sección "Game Library Scanner".

**Pasos del día:**
1. Crear `src-tauri/src/core/game_library.rs`
2. Implementar `collect_files()` con `walkdir`
3. Implementar filtro por extensiones
4. Test básico de listado

## Día 2: CRC32 paralelo con tokio

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

pub async fn scan_parallel(&self, paths: Vec<PathBuf>) -> Vec<Game> {
    let semaphore = Arc::new(Semaphore::new(8));  // Max 8 concurrentes
    let mut handles = vec![];
    
    for path in paths {
        let sem = semaphore.clone();
        let handle = tokio::spawn(async move {
            let _permit = sem.acquire().await.unwrap();
            Self::process_file(path).await
        });
        handles.push(handle);
    }
    
    let mut games = vec![];
    for h in handles {
        if let Ok(Ok(game)) = h.await {
            games.push(game);
        }
    }
    games
}
```

## Día 3: Inserción batch en SQLite

```rust
pub async fn save_games(&self, games: &[Game]) -> Result<usize> {
    let mut tx = self.pool.begin().await?;
    let mut count = 0;
    
    for g in games {
        sqlx::query(r#"
            INSERT OR REPLACE INTO games (id, title, filename, rom_path, system_id, ...)
            VALUES (?, ?, ?, ?, ?, ...)
        "#)
        .bind(&g.id)
        .bind(&g.title)
        // ...
        .execute(&mut *tx)
        .await?;
        count += 1;
    }
    
    tx.commit().await?;
    Ok(count)
}
```

## Día 4: UI de progreso del scan

```tsx
// src/components/ScanProgress.tsx
import { listen } from '@tauri-apps/api/event';

export function ScanProgress() {
  const [progress, setProgress] = useState({ current: 0, total: 0, file: '' });
  
  useEffect(() => {
    const unlisten = listen<typeof progress>('scan-progress', e => {
      setProgress(e.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);
  
  return (
    <div className="scan-progress">
      <div className="bar" style={{ width: `${(progress.current/progress.total)*100}%` }} />
      <p>{progress.current} / {progress.total} - {progress.file}</p>
    </div>
  );
}
```

## Día 5: Tests + commit

- Test con 1000+ ROMs simulados
- Verificar tiempo de scan (debe ser <30s para 5000 ROMs)
- Commit: `git commit -m "Week 4: Game Library Scanner with parallel CRC32"`

---

# SEMANA 5: PRIMER EMULADOR (MAME)

## Día 1: Trait EmulatorAdapter

**src-tauri/src/adapters/trait_adapter.rs:**
```rust
use async_trait::async_trait;

#[async_trait]
pub trait EmulatorAdapter: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn build_args(&self, game: &Game, emu: &Emulator) -> Result<Vec<String>>;
    async fn is_installed(&self, emu: &Emulator) -> bool;
    fn requires_bios(&self) -> bool { false }
}
```

## Día 2: MameAdapter

**src-tauri/src/adapters/mame.rs:**
```rust
pub struct MameAdapter;

#[async_trait]
impl EmulatorAdapter for MameAdapter {
    fn id(&self) -> &str { "mame" }
    fn name(&self) -> &str { "MAME" }
    
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        let rom_name = Path::new(&game.filename)
            .file_stem().unwrap()
            .to_string_lossy().to_string();
        
        Ok(vec![
            rom_name,
            "-fullscreen".to_string(),
            "-skip_gameinfo".to_string(),
            "-rompath".to_string(),
            game.rom_path.clone(),
        ])
    }
    
    async fn is_installed(&self, emu: &Emulator) -> bool {
        let exe = if cfg!(windows) { &emu.executable_win } else { &emu.executable_linux };
        match exe {
            Some(p) => Path::new(p).exists(),
            None => Self::auto_detect().await,
        }
    }
}

impl MameAdapter {
    async fn auto_detect() -> bool {
        // Buscar en PATH
        which::which("mame").is_ok()
    }
}
```

## Día 3: ProcessSupervisor

```rust
use tokio::process::{Command, Child};
use std::collections::HashMap;
use uuid::Uuid;

pub struct ProcessSupervisor {
    processes: Arc<Mutex<HashMap<String, Child>>>,
}

impl ProcessSupervisor {
    pub async fn spawn(&self, exe: &str, args: &[String]) -> Result<String> {
        let id = Uuid::new_v4().to_string();
        let child = Command::new(exe)
            .args(args)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()?;
        
        self.processes.lock().await.insert(id.clone(), child);
        Ok(id)
    }
    
    pub async fn wait(&self, id: &str) -> Result<i32> {
        let mut procs = self.processes.lock().await;
        if let Some(mut child) = procs.remove(id) {
            let status = child.wait().await?;
            Ok(status.code().unwrap_or(-1))
        } else {
            Err("Process not found".into())
        }
    }
    
    pub async fn kill(&self, id: &str) -> Result<()> {
        let mut procs = self.processes.lock().await;
        if let Some(mut child) = procs.remove(id) {
            child.kill().await?;
        }
        Ok(())
    }
}
```

## Día 4: Comando launch_game (Tauri)

```rust
#[tauri::command]
pub async fn launch_game(
    state: State<'_, AppState>,
    game_id: String,
) -> Result<String, String> {
    let game = state.db.get_game(&game_id).await?;
    let system = state.db.get_system(&game.system_id).await?;
    let emulator = state.db.get_emulator(&system.emulator_id).await?;
    
    // Resolver adapter
    let adapter = state.adapters.get(&emulator.backend)
        .ok_or("No adapter for emulator")?;
    
    // Construir args
    let args = adapter.build_args(&game, &emulator)?;
    let exe = if cfg!(windows) { 
        emulator.executable_win.clone() 
    } else { 
        emulator.executable_linux.clone() 
    }.ok_or("No executable configured")?;
    
    // Lanzar
    let pid = state.supervisor.spawn(&exe, &args).await?;
    
    // Crear sesión en BD
    let session = Session::new(&game_id, &system.id);
    state.db.create_session(&session).await?;
    
    Ok(pid)
}
```

## Día 5: Test E2E con MAME real

- Instalar MAME en sistema
- Configurar `emulators.yaml`
- Probar lanzar Pac-Man
- Commit: `git commit -m "Week 5: MAME adapter + first emulator launch"`

---

# SEMANA 6: COIN MANAGER + UI DE CRÉDITOS

## Día 1: CoinManager core

Ver código en **04_PLAN_MAESTRO_PARTE_4.md**, sección "Coin Manager".

```rust
pub struct CoinManager {
    coins: Arc<AtomicU32>,
    sender: broadcast::Sender<CoinEvent>,
}

impl CoinManager {
    pub fn insert_coin(&self) -> u32 {
        let new = self.coins.fetch_add(1, Ordering::SeqCst) + 1;
        let _ = self.sender.send(CoinEvent::Inserted { count: 1, total: new });
        new
    }
}
```

## Día 2: Listener de teclado para monedero

```rust
// input/coin_acceptor.rs
pub async fn listen_keyboard_coin(
    coin_manager: Arc<CoinManager>,
    trigger_key: String,
    debounce_ms: u64,
) {
    let mut input_rx = state.input_manager.subscribe();
    let mut last_press = std::time::Instant::now() - std::time::Duration::from_secs(10);
    
    while let Ok(event) = input_rx.recv().await {
        if let InputEvent::KeyPressed { key } = event {
            if key == trigger_key {
                let now = std::time::Instant::now();
                if now.duration_since(last_press).as_millis() > debounce_ms as u128 {
                    coin_manager.insert_coin();
                    
                    // Log en BD
                    sqlx::query("INSERT INTO coin_events (timestamp, coin_count, source) VALUES (?, 1, 'physical')")
                        .bind(chrono::Utc::now())
                        .execute(&pool).await.ok();
                    
                    last_press = now;
                }
            }
        }
    }
}
```

## Día 3: Listener serial (Arduino)

```rust
// input/coin_acceptor.rs
use serialport::SerialPort;

pub async fn listen_serial_coin(
    port: String,
    baud: u32,
    coin_manager: Arc<CoinManager>,
) -> Result<()> {
    let mut port = serialport::new(&port, baud)
        .timeout(std::time::Duration::from_millis(100))
        .open()?;
    
    let mut buffer = [0u8; 64];
    loop {
        match port.read(&mut buffer) {
            Ok(n) if n > 0 => {
                let data = String::from_utf8_lossy(&buffer[..n]);
                if data.contains("COIN") {
                    coin_manager.insert_coin();
                }
            }
            _ => {}
        }
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
}
```

## Día 4: GPIO Linux (Raspberry Pi)

```rust
#[cfg(target_os = "linux")]
pub async fn listen_gpio_coin(
    pin: u8,
    coin_manager: Arc<CoinManager>,
) -> Result<()> {
    use rppal::gpio::{Gpio, Trigger};
    
    let gpio = Gpio::new()?;
    let mut input_pin = gpio.get(pin)?.into_input_pullup();
    
    input_pin.set_async_interrupt(Trigger::FallingEdge, move |_| {
        coin_manager.insert_coin();
    })?;
    
    // Mantener vivo
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;
    }
}
```

## Día 5: UI Credit Display

```tsx
// src/components/CreditDisplay.tsx
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export function CreditDisplay() {
  const [credits, setCredits] = useState(0);
  const [animating, setAnimating] = useState(false);
  
  useEffect(() => {
    invoke<number>('get_coins').then(setCredits);
    
    const unlisten = listen<{ total: number }>('coin-inserted', e => {
      setCredits(e.payload.total);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
      
      // Sonido de moneda
      const audio = new Audio('/sounds/coin_insert.mp3');
      audio.play();
    });
    
    return () => { unlisten.then(fn => fn()); };
  }, []);
  
  return (
    <div className={`credit-display ${animating ? 'pulse' : ''}`}>
      <span className="icon">🪙</span>
      <span className="count">{credits}</span>
      <span className="label">CREDITS</span>
    </div>
  );
}
```

---

# SEMANA 7: UI PRINCIPAL NAVEGABLE

## Día 1: Layout y router

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/systems" element={<SystemSelection />} />
        <Route path="/games/:systemId" element={<GameList />} />
        <Route path="/game/:gameId" element={<GameDetails />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/operator" element={<OperatorMode />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Día 2: MainMenu con navegación por teclado/joystick

```tsx
// src/pages/MainMenu.tsx
import { useNavigate } from 'react-router-dom';
import { useInput } from '../hooks/useInput';

export function MainMenu() {
  const nav = useNavigate();
  const [selected, setSelected] = useState(0);
  const items = ['Play', 'Settings', 'Operator'];
  
  useInput({
    onUp: () => setSelected(i => Math.max(0, i - 1)),
    onDown: () => setSelected(i => Math.min(items.length - 1, i + 1)),
    onSelect: () => {
      if (items[selected] === 'Play') nav('/systems');
      if (items[selected] === 'Settings') nav('/settings');
      if (items[selected] === 'Operator') nav('/operator');
    },
  });
  
  return (
    <div className="main-menu">
      <h1>🎮 ArcadeCore</h1>
      <CreditDisplay />
      <ul>
        {items.map((item, i) => (
          <li key={item} className={i === selected ? 'selected' : ''}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Día 3: Hook useInput universal

```tsx
// src/hooks/useInput.ts
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface InputHandlers {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onSelect?: () => void;
  onBack?: () => void;
  onMenu?: () => void;
}

export function useInput(handlers: InputHandlers) {
  useEffect(() => {
    const unlisten = listen<{ action: string }>('navigation', e => {
      switch (e.payload.action) {
        case 'up': handlers.onUp?.(); break;
        case 'down': handlers.onDown?.(); break;
        case 'left': handlers.onLeft?.(); break;
        case 'right': handlers.onRight?.(); break;
        case 'select': handlers.onSelect?.(); break;
        case 'back': handlers.onBack?.(); break;
        case 'menu': handlers.onMenu?.(); break;
      }
    });
    
    // Backup teclado
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') handlers.onUp?.();
      if (e.key === 'ArrowDown') handlers.onDown?.();
      if (e.key === 'Enter') handlers.onSelect?.();
      if (e.key === 'Escape') handlers.onBack?.();
    };
    window.addEventListener('keydown', onKey);
    
    return () => {
      unlisten.then(fn => fn());
      window.removeEventListener('keydown', onKey);
    };
  }, [handlers]);
}
```

## Día 4: GameGrid con virtual scroll

```tsx
// src/components/GameGrid.tsx
import { FixedSizeGrid } from 'react-window';

export function GameGrid({ games }: { games: Game[] }) {
  const [selected, setSelected] = useState(0);
  const cols = 4;
  const rows = Math.ceil(games.length / cols);
  
  useInput({
    onLeft: () => setSelected(i => Math.max(0, i - 1)),
    onRight: () => setSelected(i => Math.min(games.length - 1, i + 1)),
    onUp: () => setSelected(i => Math.max(0, i - cols)),
    onDown: () => setSelected(i => Math.min(games.length - 1, i + cols)),
  });
  
  return (
    <FixedSizeGrid
      columnCount={cols}
      rowCount={rows}
      columnWidth={280}
      rowHeight={360}
      width={1200}
      height={800}
    >
      {({ columnIndex, rowIndex, style }) => {
        const idx = rowIndex * cols + columnIndex;
        const game = games[idx];
        if (!game) return null;
        return (
          <div style={style} className={idx === selected ? 'selected' : ''}>
            <img src={game.cover_path || '/no-cover.png'} alt={game.title} />
            <h3>{game.title}</h3>
          </div>
        );
      }}
    </FixedSizeGrid>
  );
}
```

## Día 5: Polish + commit

---

# SEMANA 8: TIMER MANAGER + OVERLAY

## Día 1: TimerManager core
Ver código en PARTE 4.

## Día 2: Pause cuando emulador minimiza (opcional)

```rust
// Detectar focus del emulador
#[cfg(target_os = "windows")]
pub fn is_emulator_focused(pid: u32) -> bool {
    use windows::Win32::UI::WindowsAndMessaging::*;
    unsafe {
        let hwnd = GetForegroundWindow();
        let mut window_pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut window_pid));
        window_pid == pid
    }
}
```

## Día 3: Overlay HTML transparente sobre emulador

```rust
// Crear segunda ventana Tauri encima del emulador
let overlay = tauri::WindowBuilder::new(
    &app, "timer-overlay", 
    tauri::WindowUrl::App("overlay.html".into())
)
.transparent(true)
.always_on_top(true)
.decorations(false)
.skip_taskbar(true)
.inner_size(300.0, 100.0)
.position(20.0, 20.0)
.build()?;
```

## Día 4: UI overlay con cuenta regresiva

```tsx
// src/pages/TimerOverlay.tsx
export function TimerOverlay() {
  const [seconds, setSeconds] = useState(600);
  const [warning, setWarning] = useState(false);
  
  useEffect(() => {
    const unlisten = listen<{ remaining: number }>('timer-tick', e => {
      setSeconds(e.payload.remaining);
      if (e.payload.remaining <= 60) setWarning(true);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);
  
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  
  return (
    <div className={`overlay ${warning ? 'warning' : ''}`}>
      <span className="time">
        {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </span>
    </div>
  );
}
```

## Día 5: Acción al timeout (kill emulator)

```rust
async fn handle_timer_expired(state: AppState, pid: String) {
    // Avisar 10 segundos antes
    tokio::time::sleep(std::time::Duration::from_secs(10)).await;
    
    // Cerrar emulador
    state.supervisor.kill(&pid).await.ok();
    
    // Volver al menú principal
    state.window.show().ok();
    state.window.set_focus().ok();
}
```

---

# SEMANA 9: RETROARCH + MULTI-EMULADOR

## Día 1: RetroArch adapter
Ver código en PARTE 4.

## Día 2: Auto-detección de cores

```rust
impl RetroArchAdapter {
    pub async fn detect_installed_cores(retroarch_path: &Path) -> Vec<String> {
        let cores_dir = retroarch_path.parent().unwrap().join("cores");
        let mut cores = vec![];
        
        if let Ok(entries) = std::fs::read_dir(&cores_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.ends_with("_libretro.dll") || name.ends_with("_libretro.so") {
                    cores.push(name);
                }
            }
        }
        cores
    }
    
    pub fn core_for_system(system: &str) -> &str {
        match system {
            "snes" => "snes9x_libretro",
            "genesis" => "genesis_plus_gx_libretro",
            "nes" => "fceumm_libretro",
            "gb" | "gbc" => "gambatte_libretro",
            "gba" => "mgba_libretro",
            "n64" => "mupen64plus_next_libretro",
            "ps1" => "mednafen_psx_hw_libretro",
            "saturn" => "mednafen_saturn_libretro",
            "pce" => "mednafen_pce_fast_libretro",
            "atari2600" => "stella_libretro",
            "lynx" => "handy_libretro",
            "ngp" | "ngpc" => "mednafen_ngp_libretro",
            "wonderswan" => "mednafen_wswan_libretro",
            "vb" => "mednafen_vb_libretro",
            _ => "",
        }
    }
}
```

## Día 3: Configurar 5 sistemas (SNES, Genesis, NES, GBA, PS1)

**config/systems.yaml:**
```yaml
systems:
  snes:
    display_name: "Super Nintendo"
    emulator: "retroarch"
    core_override: "snes9x_libretro"
    credit_policy: "timer"
    rom_path: "roms/snes"
    extensions: [smc, sfc, zip]
    
  genesis:
    display_name: "Sega Genesis"
    emulator: "retroarch"
    core_override: "genesis_plus_gx_libretro"
    credit_policy: "timer"
    rom_path: "roms/genesis"
    extensions: [bin, gen, md, smd, zip]
    
  nes:
    display_name: "Nintendo NES"
    emulator: "retroarch"
    core_override: "fceumm_libretro"
    credit_policy: "timer"
    rom_path: "roms/nes"
    extensions: [nes, zip]
    
  gba:
    display_name: "Game Boy Advance"
    emulator: "retroarch"
    core_override: "mgba_libretro"
    credit_policy: "timer"
    rom_path: "roms/gba"
    extensions: [gba, zip]
    
  ps1:
    display_name: "PlayStation 1"
    emulator: "retroarch"
    core_override: "mednafen_psx_hw_libretro"
    credit_policy: "timer"
    rom_path: "roms/ps1"
    extensions: [iso, cue, bin, chd, pbp]
```

## Día 4: Prueba de cada sistema individualmente

## Día 5: Commit semana 9

---

# SEMANA 10: INPUT UNIVERSAL (SDL2)

## Día 1: SDL2 backend completo

Ver código en PARTE 4, sección "Input Manager".

## Día 2: Hot-plug detection

Ya cubierto en SDL2. Solo asegurarse que `ControllerDeviceAdded` y `Removed` actualicen UI:

```rust
async fn handle_device_event(event: InputEvent, state: AppState) {
    match event {
        InputEvent::DeviceConnected { device_id, name, .. } => {
            // Guardar en BD
            sqlx::query("INSERT OR REPLACE INTO input_devices (id, name, last_seen) VALUES (?, ?, ?)")
                .bind(&device_id).bind(&name).bind(chrono::Utc::now())
                .execute(&state.db).await.ok();
            
            // Emitir a UI
            state.app.emit("device-connected", json!({
                "id": device_id,
                "name": name,
            })).ok();
        }
        _ => {}
    }
}
```

## Día 3: Wizard de configuración

```tsx
// src/pages/InputConfig.tsx
export function InputConfig() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [step, setStep] = useState<'select' | 'mapping'>('select');
  const [waiting, setWaiting] = useState<string | null>(null);
  
  const actions = [
    { id: 'up', label: '⬆️ UP' },
    { id: 'down', label: '⬇️ DOWN' },
    { id: 'left', label: '⬅️ LEFT' },
    { id: 'right', label: '➡️ RIGHT' },
    { id: 'select', label: '✅ SELECT (A)' },
    { id: 'back', label: '🔙 BACK (B)' },
    { id: 'menu', label: '📱 MENU' },
  ];
  
  const startMapping = (deviceId: string) => {
    setStep('mapping');
    // Listen for next button press
    listen<{ button: string }>('button-pressed', e => {
      if (waiting) {
        invoke('save_mapping', { deviceId, action: waiting, button: e.payload.button });
        setWaiting(null);
      }
    });
  };
  
  return (
    <div className="input-wizard">
      {step === 'select' && (
        <div>
          <h2>Select your controller</h2>
          {devices.map(d => (
            <button key={d.id} onClick={() => startMapping(d.id)}>
              {d.name} ({d.type})
            </button>
          ))}
        </div>
      )}
      
      {step === 'mapping' && (
        <div>
          <h2>Press the button for each action</h2>
          {actions.map(a => (
            <div key={a.id} className={waiting === a.id ? 'waiting' : ''}>
              <span>{a.label}</span>
              <button onClick={() => setWaiting(a.id)}>
                {waiting === a.id ? 'Press button...' : 'Configure'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Día 4: Mapping per-game

```rust
// Aplicar mapping específico cuando se lanza un juego
pub async fn apply_game_mapping(&self, game_id: &str) -> Result<()> {
    // Buscar profile del juego
    let mappings = sqlx::query_as::<_, InputMapping>(
        "SELECT * FROM input_mappings WHERE profile_name = ? OR profile_name = 'default'"
    )
    .bind(format!("game_{}", game_id))
    .fetch_all(&self.pool).await?;
    
    self.active_mappings = mappings;
    Ok(())
}
```

## Día 5: Tests de cada tipo de control

- Xbox One controller ✓
- PS4 DualShock ✓
- Switch Pro ✓
- 8BitDo SN30 ✓
- Arcade stick (Sanwa) ✓
- USB encoder (I-PAC) ✓
- Keyboard ✓

---

# SEMANA 11: OPERATOR PANEL + PIN

## Día 1: Login con PIN

```tsx
// src/pages/OperatorLogin.tsx
export function OperatorLogin() {
  const [pin, setPin] = useState('');
  const nav = useNavigate();
  
  const submit = async () => {
    const valid = await invoke<boolean>('verify_operator_pin', { pin });
    if (valid) {
      nav('/operator/dashboard');
    } else {
      alert('PIN incorrecto');
      setPin('');
    }
  };
  
  return (
    <div className="pin-pad">
      <h2>🔐 Operator Mode</h2>
      <div className="pin-display">
        {Array(4).fill(0).map((_, i) => (
          <span key={i} className={pin.length > i ? 'filled' : ''}>
            {pin.length > i ? '•' : '_'}
          </span>
        ))}
      </div>
      <div className="numpad">
        {['1','2','3','4','5','6','7','8','9','0'].map(n => (
          <button key={n} onClick={() => setPin(p => p + n)}>{n}</button>
        ))}
        <button onClick={() => setPin('')}>Clear</button>
        <button onClick={submit}>OK</button>
      </div>
    </div>
  );
}
```

```rust
#[tauri::command]
pub async fn verify_operator_pin(
    state: State<'_, AppState>,
    pin: String,
) -> Result<bool, String> {
    let config = state.config.get().await;
    Ok(bcrypt::verify(&pin, &config.operator.pin_hash).unwrap_or(false))
}
```

## Día 2: Dashboard con estadísticas

```rust
#[tauri::command]
pub async fn get_operator_stats(
    state: State<'_, AppState>,
) -> Result<OperatorStats, String> {
    let pool = &state.db;
    
    let today_coins: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(coin_count), 0) FROM coin_events WHERE date(timestamp) = date('now')"
    ).fetch_one(pool).await?;
    
    let today_sessions: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sessions WHERE date(started_at) = date('now')"
    ).fetch_one(pool).await?;
    
    let top_games = sqlx::query_as::<_, (String, i64)>(
        "SELECT g.title, COUNT(*) as plays FROM sessions s 
         JOIN games g ON g.id = s.game_id 
         WHERE date(s.started_at) >= date('now', '-7 days')
         GROUP BY g.id ORDER BY plays DESC LIMIT 5"
    ).fetch_all(pool).await?;
    
    Ok(OperatorStats {
        today_coins,
        today_sessions,
        today_revenue: today_coins as f64 * state.config.get().await.pricing.coin_value,
        top_games,
    })
}
```

## Día 3: Logs viewer

```tsx
export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'session' | 'coin'>('all');
  
  useEffect(() => {
    invoke<LogEntry[]>('get_logs', { filter, limit: 100 }).then(setLogs);
  }, [filter]);
  
  return (
    <div>
      <select onChange={e => setFilter(e.target.value as any)}>
        <option value="all">All</option>
        <option value="error">Errors</option>
        <option value="session">Sessions</option>
        <option value="coin">Coins</option>
      </select>
      <table>
        <thead><tr><th>Time</th><th>Type</th><th>Message</th></tr></thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id}>
              <td>{l.timestamp}</td>
              <td>{l.type}</td>
              <td>{l.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Día 4: Pruebas (test monedero, test controles)

```tsx
export function HardwareTest() {
  return (
    <div>
      <h2>🔧 Hardware Test</h2>
      
      <CoinAcceptorTest />
      <ControllerTest />
      <EmulatorTest />
      <DisplayTest />
      <AudioTest />
    </div>
  );
}

function CoinAcceptorTest() {
  const [coinsDetected, setCoinsDetected] = useState(0);
  
  useEffect(() => {
    const u = listen('coin-inserted', () => {
      setCoinsDetected(c => c + 1);
    });
    return () => { u.then(f => f()); };
  }, []);
  
  return (
    <div className="test-panel">
      <h3>💰 Coin Acceptor</h3>
      <p>Insert a coin to test...</p>
      <p>Detected: {coinsDetected}</p>
      <button onClick={() => setCoinsDetected(0)}>Reset</button>
    </div>
  );
}
```

## Día 5: Cambiar configuración runtime

UI para cambiar precio, minutos, etc, desde el panel sin tocar YAML.

---

# SEMANA 12: AUTOBOOT + KIOSK MODE

## Día 1: Autoboot manager
Ver código en PARTE 4.

## Día 2: Kiosk Windows

```rust
#[cfg(target_os = "windows")]
pub fn enable_kiosk_windows(window: &tauri::Window) -> Result<()> {
    use windows::Win32::UI::WindowsAndMessaging::*;
    
    // Fullscreen sin bordes
    window.set_fullscreen(true)?;
    window.set_decorations(false)?;
    window.set_always_on_top(true)?;
    
    // Deshabilitar Alt+Tab (requiere admin)
    unsafe {
        // Block Win key
        SystemParametersInfoW(
            SPI_SETSCREENSAVEACTIVE,
            0,
            None,
            SPIF_SENDCHANGE,
        );
    }
    
    // Hide taskbar
    unsafe {
        let taskbar = FindWindowW(w!("Shell_TrayWnd"), PCWSTR::null());
        if !taskbar.is_invalid() {
            ShowWindow(taskbar, SW_HIDE);
        }
    }
    
    Ok(())
}
```

## Día 3: Kiosk Linux

```rust
#[cfg(target_os = "linux")]
pub fn enable_kiosk_linux(window: &tauri::Window) -> Result<()> {
    window.set_fullscreen(true)?;
    window.set_decorations(false)?;
    window.set_always_on_top(true)?;
    
    // En Linux, usar wmctrl si está disponible
    std::process::Command::new("wmctrl")
        .args(&["-r", "ArcadeCore", "-b", "add,fullscreen,above"])
        .spawn()
        .ok();
    
    Ok(())
}
```

## Día 4: Idle timeout (volver al menú)

```rust
pub struct IdleTimer {
    last_activity: Arc<Mutex<Instant>>,
    timeout: Duration,
}

impl IdleTimer {
    pub fn start(self: Arc<Self>) {
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(10)).await;
                let last = *self.last_activity.lock().await;
                if last.elapsed() > self.timeout {
                    // Trigger return-to-menu
                    tracing::info!("Idle timeout, returning to menu");
                    // Send event
                }
            }
        });
    }
    
    pub async fn record_activity(&self) {
        *self.last_activity.lock().await = Instant::now();
    }
}
```

## Día 5: Test completo de autoboot

- Reiniciar máquina
- Verificar que ArcadeCore arranca solo
- Verificar fullscreen
- Verificar que no se puede salir con Alt+F4

---

# SEMANA 13: TEMAS + UI POLISH

## Día 1-2: Tema "Classic Arcade"

```css
/* src/themes/classic-arcade/theme.css */
:root[data-theme="classic-arcade"] {
  --color-bg: #000;
  --color-primary: #ff006e;
  --color-secondary: #ffbe0b;
  --color-accent: #00f5ff;
  --font-display: 'Press Start 2P', monospace;
  --animation-glow: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 10px var(--color-primary); }
  50% { text-shadow: 0 0 30px var(--color-primary), 0 0 60px var(--color-primary); }
}
```

## Día 3: Tema "HyperSpin Modern" (carrusel)

```tsx
// src/components/GameWheel.tsx
import { motion } from 'framer-motion';

export function GameWheel({ games, selectedIdx }: Props) {
  return (
    <div className="wheel-container">
      {games.map((game, i) => {
        const offset = i - selectedIdx;
        const isVisible = Math.abs(offset) <= 4;
        
        return (
          <motion.div
            key={game.id}
            className="wheel-item"
            animate={{
              x: offset * 200,
              scale: 1 - Math.abs(offset) * 0.15,
              opacity: isVisible ? 1 - Math.abs(offset) * 0.2 : 0,
              zIndex: 100 - Math.abs(offset),
            }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <img src={game.wheel_path || game.cover_path} alt={game.title} />
          </motion.div>
        );
      })}
    </div>
  );
}
```

## Día 4: Tema "Grid Windows"

Layout de cuadrícula tipo Windows 11 / Steam.

## Día 5: Theme switcher en operator panel

```tsx
const themes = [
  { id: 'classic-arcade', name: 'Classic Arcade', preview: '/themes/classic.png' },
  { id: 'hyperspin-modern', name: 'HyperSpin Modern', preview: '/themes/hyperspin.png' },
  { id: 'grid-windows', name: 'Grid Windows', preview: '/themes/grid.png' },
  { id: 'crt-retro', name: 'CRT Retro', preview: '/themes/crt.png' },
  { id: 'minimal-clean', name: 'Minimal Clean', preview: '/themes/minimal.png' },
];

export function ThemeSelector() {
  return (
    <div className="theme-grid">
      {themes.map(t => (
        <div key={t.id} onClick={() => invoke('set_theme', { theme: t.id })}>
          <img src={t.preview} />
          <h3>{t.name}</h3>
        </div>
      ))}
    </div>
  );
}
```

---

# SEMANA 14: EMULADORES ADICIONALES

## Día 1: DuckStation (PS1 standalone, mejor que core)

```rust
// adapters/duckstation.rs
pub struct DuckStationAdapter;

#[async_trait]
impl EmulatorAdapter for DuckStationAdapter {
    fn id(&self) -> &str { "duckstation" }
    fn name(&self) -> &str { "DuckStation" }
    
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            "-batch".to_string(),
            "-fullscreen".to_string(),
            game.rom_path.clone(),
        ])
    }
    
    async fn is_installed(&self, emu: &Emulator) -> bool {
        let exe = if cfg!(windows) { &emu.executable_win } else { &emu.executable_linux };
        exe.as_ref().map_or(false, |p| Path::new(p).exists())
    }
    
    fn requires_bios(&self) -> bool { true }
}
```

## Día 2: PCSX2 (PS2)

```rust
pub struct Pcsx2Adapter;

#[async_trait]
impl EmulatorAdapter for Pcsx2Adapter {
    fn id(&self) -> &str { "pcsx2" }
    fn name(&self) -> &str { "PCSX2" }
    
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            "-batch".to_string(),
            "-fullscreen".to_string(),
            "-nogui".to_string(),
            game.rom_path.clone(),
        ])
    }
    
    fn requires_bios(&self) -> bool { true }
}
```

## Día 3: PPSSPP (PSP), Dolphin (GC/Wii)

```rust
pub struct PpssppAdapter;

#[async_trait]
impl EmulatorAdapter for PpssppAdapter {
    fn id(&self) -> &str { "ppsspp" }
    fn name(&self) -> &str { "PPSSPP" }
    
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            "--fullscreen".to_string(),
            game.rom_path.clone(),
        ])
    }
}

pub struct DolphinAdapter;

#[async_trait]
impl EmulatorAdapter for DolphinAdapter {
    fn id(&self) -> &str { "dolphin" }
    fn name(&self) -> &str { "Dolphin" }
    
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            "-e".to_string(),
            game.rom_path.clone(),
            "-b".to_string(),  // batch mode
        ])
    }
}
```

## Día 4: Cemu (Wii U), Yuzu/Ryujinx (Switch), RPCS3 (PS3)

```rust
pub struct CemuAdapter;
pub struct YuzuAdapter;
pub struct RyujinxAdapter;
pub struct Rpcs3Adapter;

// Patrón similar a los anteriores
```

## Día 5: Adaptadores especiales

### TeknoParrot (arcade modernos)
```rust
pub struct TeknoParrotAdapter;

#[async_trait]
impl EmulatorAdapter for TeknoParrotAdapter {
    fn id(&self) -> &str { "teknoparrot" }
    
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        // TeknoParrot usa profiles
        Ok(vec![
            format!("--profile={}", game.title),
        ])
    }
}
```

### Supermodel (Sega Model 3)
```rust
pub struct SupermodelAdapter;

#[async_trait]
impl EmulatorAdapter for SupermodelAdapter {
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            game.rom_path.clone(),
            "-fullscreen".to_string(),
            "-vsync".to_string(),
        ])
    }
}
```

### Vita3K (PS Vita)
```rust
pub struct Vita3kAdapter;

#[async_trait]
impl EmulatorAdapter for Vita3kAdapter {
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            "-r".to_string(),
            game.rom_path.clone(),
        ])
    }
}
```

### Xemu (Xbox)
```rust
pub struct XemuAdapter;

#[async_trait]
impl EmulatorAdapter for XemuAdapter {
    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>> {
        Ok(vec![
            "-dvd_path".to_string(),
            game.rom_path.clone(),
            "-full-screen".to_string(),
        ])
    }
}
```

### Xenia (Xbox 360)
```rust
pub struct XeniaAdapter;
```

### MiSTer (FPGA)
```rust
pub struct MisterAdapter;
// Comunicación SSH al MiSTer
```

---

# SEMANA 15: TESTING + BUG FIXING

## Día 1: Tests unitarios completos
```bash
cd src-tauri
cargo test --all
cargo tarpaulin --out Html  # Coverage
```

## Día 2: Tests de integración

```rust
#[tokio::test]
async fn test_full_game_launch_flow() {
    let app = setup_test_app().await;
    
    // 1. Insert coin
    app.coin_manager.insert_coin();
    assert_eq!(app.coin_manager.get_coins(), 1);
    
    // 2. Use coin (timer mode)
    app.timer_manager.start(10);
    
    // 3. Verify timer running
    tokio::time::sleep(Duration::from_secs(2)).await;
    assert!(app.timer_manager.get_remaining() < 600);
    
    // 4. Force expire
    // ...
}
```

## Día 3: Tests E2E con Playwright

```typescript
// tests/e2e/main_flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete user flow', async ({ page }) => {
  await page.goto('http://localhost:1420');
  
  // Insert coin
  await page.keyboard.press('5');
  await expect(page.locator('.credit-display')).toContainText('1');
  
  // Navigate to systems
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/systems/);
  
  // Select MAME
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/games/);
});
```

## Día 4: Pruebas en hardware real

- PC con Windows 7 (mínimos)
- PC con Linux Ubuntu
- Raspberry Pi 4
- Gabinete arcade real (si tienes acceso)

## Día 5: Documentación de bugs encontrados y fixes

Crear `KNOWN_ISSUES.md` y resolverlos.

---

# SEMANA 16: RELEASE v1.0

## Día 1: Build final Windows

```bash
# Limpiar
cargo clean

# Build optimizado
cargo tauri build --release

# Verificar tamaño
ls -lh src-tauri/target/release/bundle/

# Esperado:
# nsis/ArcadeCore_1.0.0_x64-setup.exe (~50MB)
# msi/ArcadeCore_1.0.0_x64_en-US.msi (~50MB)
```

## Día 2: Build final Linux

```bash
cargo tauri build --release

# Outputs:
# deb/arcadecore_1.0.0_amd64.deb
# appimage/arcade-core_1.0.0_amd64.AppImage
# rpm/arcadecore-1.0.0-1.x86_64.rpm
```

## Día 3: GitHub release

```bash
# Crear tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Action toma desde aquí
# Crea release con binarios automáticamente
```

## Día 4: Documentación final

- `docs/INSTALL.md` - Cómo instalar en Windows/Linux
- `docs/CONFIG.md` - Cómo configurar
- `docs/EMULATORS.md` - Lista emuladores soportados
- `docs/INPUT.md` - Configurar controles
- `docs/OPERATOR.md` - Manual de operador
- `docs/TROUBLESHOOTING.md` - Problemas comunes
- `docs/CONTRIBUTING.md` - Cómo contribuir

## Día 5: ¡CELEBRACIÓN! 🎉

```
ArcadeCore v1.0 oficialmente lanzado:

✅ 300+ emuladores soportados
✅ Universal input (cualquier control)
✅ Coins + Timer híbrido
✅ Operator Panel
✅ Autoboot Win/Linux
✅ Hot-reload config
✅ 5+ temas visuales
✅ Plugin system
✅ Open source GPL-3.0
✅ Cross-platform
✅ <50MB binario
✅ <1s startup
✅ 512MB RAM mínimo

🎮 ¡Disfruta tu sistema arcade!
```

---

# RESUMEN COMPLETO POR SEMANA

| Sem | Foco | Entregable Verificable |
|-----|------|------------------------|
| 1 | Setup | App Tauri compila y abre ventana |
| 2 | DB + Models | SQLite tables creadas, models en Rust |
| 3 | Config | YAML editado en vivo refleja en UI |
| 4 | Scanner | 1000+ ROMs escaneados en <30s |
| 5 | MAME | Pac-Man se lanza con 1 click |
| 6 | Coins | Tecla "5" suma crédito + sonido |
| 7 | UI | Navegable con teclado o joystick |
| 8 | Timer | Countdown visible, cierra al timeout |
| 9 | RetroArch | SNES/Genesis/NES/GBA/PS1 funcionan |
| 10 | Input | Cualquier gamepad funciona |
| 11 | Operator | PIN protege panel, stats visibles |
| 12 | Autoboot | Reinicia PC, ArcadeCore arranca solo |
| 13 | Themes | 3+ temas seleccionables |
| 14 | Más emus | DuckStation, PCSX2, PPSSPP, Dolphin, etc |
| 15 | Testing | Coverage >80%, sin crashes en 1h |
| 16 | Release | Binarios Win/Linux subidos a GitHub |

---

**¡Plan completo de 16 semanas, día por día, listo para ejecutar! 🚀**
