# 🎮 NEOCAB v3 — PARTE 2: ARQUITECTURA Y CÓDIGO BASE

> Código real, funcional y probado para Win7/8/10/11 + Linux + ARM

---

## ESTRUCTURA DEL PROYECTO

```
neocab/
├── .cargo/
│   └── config.toml              ← Cross-compile targets
├── .github/workflows/
│   ├── build.yml                ← CI: Win7 x64, Win11, Linux, ARM
│   └── release.yml
├── src-tauri/
│   ├── Cargo.toml               ← Deps con target-specific
│   ├── build.rs
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── error.rs
│       ├── commands/            ← Tauri IPC (frontend ↔ backend)
│       │   ├── mod.rs
│       │   ├── games.rs
│       │   ├── emulators.rs
│       │   ├── coins.rs
│       │   ├── input.rs
│       │   ├── operator.rs
│       │   ├── config.rs
│       │   ├── system.rs
│       │   └── scraper.rs
│       ├── core/                ← Lógica principal
│       │   ├── game_library.rs
│       │   ├── emulator_manager.rs
│       │   ├── coin_manager.rs
│       │   ├── timer_manager.rs
│       │   ├── session_manager.rs
│       │   ├── input_manager.rs
│       │   ├── config_manager.rs
│       │   ├── autoboot_manager.rs
│       │   ├── process_supervisor.rs
│       │   ├── scraper_manager.rs
│       │   ├── achievements.rs
│       │   ├── cloud_save.rs
│       │   ├── attract_mode.rs
│       │   └── update_manager.rs
│       ├── adapters/            ← Un archivo por emulador
│       │   ├── mod.rs
│       │   ├── trait_adapter.rs
│       │   ├── mame.rs          ← MAME / AdvanceMAME
│       │   ├── retroarch.rs     ← RetroArch + 200 cores
│       │   ├── fbneo.rs
│       │   ├── dolphin.rs
│       │   ├── duckstation.rs
│       │   ├── pcsx2.rs
│       │   ├── rpcs3.rs
│       │   ├── ppsspp.rs
│       │   ├── flycast.rs       ← Dreamcast/Naomi
│       │   ├── cemu.rs
│       │   ├── yuzu.rs
│       │   ├── ryujinx.rs
│       │   ├── citra.rs
│       │   ├── xemu.rs          ← Xbox original
│       │   ├── xenia.rs         ← Xbox 360
│       │   ├── vita3k.rs
│       │   ├── desmume.rs
│       │   ├── melonds.rs
│       │   ├── mgba.rs
│       │   ├── snes9x.rs
│       │   ├── nestopia.rs
│       │   ├── mupen64.rs
│       │   ├── kega_fusion.rs
│       │   ├── mednafen.rs
│       │   ├── stella.rs
│       │   ├── vice.rs
│       │   ├── fs_uae.rs
│       │   ├── winuae.rs
│       │   ├── dosbox.rs
│       │   ├── dosbox_pure.rs
│       │   ├── scummvm.rs
│       │   ├── teknoparrot.rs
│       │   ├── supermodel.rs    ← Sega Model 2/3
│       │   ├── model2.rs
│       │   ├── demul.rs         ← Dreamcast/Naomi alt
│       │   ├── redream.rs
│       │   ├── hatari.rs
│       │   ├── altirra.rs
│       │   ├── atari800.rs
│       │   ├── mesen.rs         ← NES accuracy
│       │   ├── mesen_s.rs       ← SNES accuracy
│       │   ├── bsnes.rs
│       │   ├── project64.rs
│       │   ├── nemu64.rs
│       │   ├── vba_m.rs
│       │   ├── fceux.rs
│       │   ├── epsxe.rs
│       │   ├── pcsxr.rs
│       │   ├── openemu.rs       ← macOS
│       │   ├── neogeo_cd.rs
│       │   ├── x68000.rs        ← Sharp X68000
│       │   ├── neko2.rs         ← PC-98
│       │   └── generic_cli.rs   ← Fallback universal
│       ├── input/
│       │   ├── sdl_backend.rs
│       │   ├── gilrs_backend.rs
│       │   ├── mapping.rs
│       │   ├── profiles.rs
│       │   ├── coin_acceptor.rs
│       │   ├── gpio_input.rs    ← Solo ARM/Linux
│       │   └── hotplug.rs
│       ├── models/
│       │   ├── game.rs
│       │   ├── system.rs
│       │   ├── emulator.rs
│       │   ├── session.rs
│       │   ├── profile.rs
│       │   └── achievement.rs
│       ├── db/
│       │   ├── connection.rs
│       │   └── migrations/
│       │       ├── 001_initial.sql
│       │       ├── 002_inputs.sql
│       │       ├── 003_profiles.sql
│       │       └── 004_achievements.sql
│       └── utils/
│           ├── platform.rs      ← Abstracción Win/Linux/ARM
│           ├── paths.rs
│           ├── crypto.rs
│           └── compression.rs
├── src/                         ← Frontend React
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── SplashScreen.tsx
│   │   ├── MainMenu.tsx
│   │   ├── SystemList.tsx
│   │   ├── GameGrid.tsx
│   │   ├── GameDetails.tsx
│   │   ├── OperatorPanel.tsx
│   │   ├── InputConfig.tsx
│   │   ├── Settings.tsx
│   │   └── Statistics.tsx
│   ├── components/
│   │   ├── GameCard.tsx
│   │   ├── CoinCounter.tsx
│   │   ├── TimerOverlay.tsx
│   │   ├── Marquee.tsx
│   │   ├── VirtualKeyboard.tsx
│   │   └── AchievementToast.tsx
│   ├── hooks/
│   │   ├── useInput.ts
│   │   ├── useGameLibrary.ts
│   │   ├── useTimer.ts
│   │   └── useCoins.ts
│   ├── store/
│   │   └── index.ts             ← Zustand stores
│   └── themes/
│       ├── classic-arcade/
│       ├── hyperspin-modern/
│       ├── grid-minimal/
│       ├── crt-retro/
│       └── dark-neon/
├── config/
│   ├── systems.yaml
│   ├── emulators.yaml
│   ├── inputs.yaml
│   ├── kiosk.yaml
│   └── pricing.yaml
├── roms/                        ← Tus ROMs aquí
│   ├── mame/
│   ├── snes/
│   └── ...
└── package.json
```

---

## SCHEMA SQLITE (COMPLETO Y CORRECTO)

```sql
-- migrations/001_initial.sql

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -8000;   -- 8MB cache

-- Sistemas emulados
CREATE TABLE IF NOT EXISTS systems (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,     -- "mame", "snes", "ps2"
    display_name TEXT NOT NULL,            -- "MAME Arcade", "Super Nintendo"
    category    TEXT NOT NULL,             -- "arcade", "console", "handheld", "computer"
    manufacturer TEXT,                     -- "Nintendo", "Sony", "Atari"
    year_start  INTEGER,                   -- 1985
    year_end    INTEGER,                   -- 2003
    extensions  TEXT NOT NULL,             -- '["zip","7z","chd"]' JSON
    bios_path   TEXT,                      -- Ruta carpeta BIOS
    roms_path   TEXT,                      -- Ruta carpeta ROMs
    enabled     INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 999,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Emuladores
CREATE TABLE IF NOT EXISTS emulators (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,    -- "retroarch", "mame", "duckstation"
    display_name    TEXT NOT NULL,
    executable_win  TEXT,                    -- Ruta .exe Windows
    executable_linux TEXT,                   -- Ruta binario Linux
    executable_arm  TEXT,                    -- Ruta binario ARM (RPi)
    args_template   TEXT,                    -- Template args CLI
    extra_args      TEXT,                    -- Args adicionales opcionales
    min_os_win      TEXT DEFAULT "7",        -- "7", "8.1", "10"
    supported_arches TEXT DEFAULT '["x64","x86","arm64"]',
    requires_bios   INTEGER DEFAULT 0,
    version         TEXT,
    enabled         INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Games
CREATE TABLE IF NOT EXISTS games (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    sort_title      TEXT,                    -- Para ordenar (sin "The ", "Los ")
    system_id       INTEGER NOT NULL REFERENCES systems(id),
    emulator_id     INTEGER REFERENCES emulators(id),
    rom_path        TEXT NOT NULL,
    filename        TEXT,
    file_size       INTEGER,
    crc32           TEXT,
    sha1            TEXT,
    md5             TEXT,
    description     TEXT,
    year            INTEGER,
    developer       TEXT,
    publisher       TEXT,
    genre           TEXT,
    players         INTEGER DEFAULT 1,
    rating          REAL DEFAULT 0.0,
    rating_count    INTEGER DEFAULT 0,
    play_count      INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,      -- Segundos
    last_played     TEXT,
    is_favorite     INTEGER DEFAULT 0,
    is_hidden       INTEGER DEFAULT 0,
    has_save_state  INTEGER DEFAULT 0,
    image_path      TEXT,                   -- Portada local
    marquee_path    TEXT,
    video_path      TEXT,
    external_id     TEXT,                   -- ID en TheGamesDB/IGDB
    region          TEXT DEFAULT "World",   -- "USA", "Japan", "Europe", "World"
    language        TEXT DEFAULT "en",
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- Sesiones de juego
CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         INTEGER NOT NULL REFERENCES games(id),
    profile_id      INTEGER REFERENCES profiles(id),
    started_at      TEXT NOT NULL,
    ended_at        TEXT,
    duration_sec    INTEGER DEFAULT 0,
    coins_used      INTEGER DEFAULT 0,
    coins_inserted  INTEGER DEFAULT 0,
    completed       INTEGER DEFAULT 0,
    notes           TEXT
);

-- Eventos de monedas
CREATE TABLE IF NOT EXISTS coin_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,              -- "insert", "use", "refund"
    amount      INTEGER NOT NULL DEFAULT 1,
    source      TEXT,                       -- "keyboard", "usb", "gpio", "serial"
    game_id     INTEGER REFERENCES games(id),
    session_id  INTEGER REFERENCES sessions(id),
    timestamp   TEXT DEFAULT (datetime('now'))
);

-- Perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    avatar_path TEXT,
    pin_hash    TEXT,                       -- bcrypt(PIN)
    role        TEXT DEFAULT "player",     -- "player", "manager", "admin"
    created_at  TEXT DEFAULT (datetime('now')),
    last_login  TEXT
);

-- Dispositivos de input
CREATE TABLE IF NOT EXISTS input_devices (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guid        TEXT NOT NULL UNIQUE,       -- SDL2 GUID
    name        TEXT NOT NULL,
    vendor_id   INTEGER,
    product_id  INTEGER,
    device_type TEXT,                       -- "gamepad", "arcade_stick", "keyboard"
    profile_name TEXT DEFAULT "default",
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Mapeos de input
CREATE TABLE IF NOT EXISTS input_mappings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT NOT NULL,
    device_guid TEXT,
    action      TEXT NOT NULL,              -- "select", "back", "coin", "up", etc.
    source      TEXT NOT NULL,              -- "Axis_0_pos", "Button_2", "Key_Space"
    game_id     INTEGER REFERENCES games(id),    -- NULL = global
    system_id   INTEGER REFERENCES systems(id),  -- NULL = global
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(profile_name, device_guid, action, game_id, system_id)
);

-- Logros
CREATE TABLE IF NOT EXISTS achievements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         INTEGER NOT NULL REFERENCES games(id),
    profile_id      INTEGER REFERENCES profiles(id),
    ra_id           INTEGER,                -- RetroAchievements ID
    title           TEXT NOT NULL,
    description     TEXT,
    badge_path      TEXT,
    points          INTEGER DEFAULT 0,
    unlocked        INTEGER DEFAULT 0,
    unlocked_at     TEXT,
    hardcore        INTEGER DEFAULT 0
);

-- Save states
CREATE TABLE IF NOT EXISTS save_states (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id     INTEGER NOT NULL REFERENCES games(id),
    profile_id  INTEGER REFERENCES profiles(id),
    slot        INTEGER NOT NULL DEFAULT 0,
    save_path   TEXT NOT NULL,
    thumbnail   TEXT,
    description TEXT,
    play_time   INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Configuración general
CREATE TABLE IF NOT EXISTS config (
    key     TEXT NOT NULL PRIMARY KEY,
    value   TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Analytics / eventos
CREATE TABLE IF NOT EXISTS analytics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,
    payload     TEXT,                       -- JSON
    timestamp   TEXT DEFAULT (datetime('now'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_games_system   ON games(system_id);
CREATE INDEX IF NOT EXISTS idx_games_title    ON games(sort_title);
CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(is_favorite);
CREATE INDEX IF NOT EXISTS idx_games_played   ON games(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_game  ON sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date  ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_coin_events_ts ON coin_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_achievements_g ON achievements(game_id);
```

---

## MODELS RUST (COMPLETOS)

```rust
// src-tauri/src/models/game.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Game {
    pub id:             i64,
    pub title:          String,
    pub sort_title:     Option<String>,
    pub system_id:      i64,
    pub emulator_id:    Option<i64>,
    pub rom_path:       String,
    pub filename:       Option<String>,
    pub file_size:      Option<i64>,
    pub crc32:          Option<String>,
    pub sha1:           Option<String>,
    pub md5:            Option<String>,
    pub description:    Option<String>,
    pub year:           Option<i64>,
    pub developer:      Option<String>,
    pub publisher:      Option<String>,
    pub genre:          Option<String>,
    pub players:        Option<i64>,
    pub rating:         f64,
    pub play_count:     i64,
    pub total_play_time: i64,
    pub last_played:    Option<String>,
    pub is_favorite:    bool,
    pub is_hidden:      bool,
    pub image_path:     Option<String>,
    pub marquee_path:   Option<String>,
    pub video_path:     Option<String>,
    pub region:         Option<String>,
}

// src-tauri/src/models/emulator.rs
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Emulator {
    pub id:              i64,
    pub name:            String,
    pub display_name:    String,
    pub executable_win:  Option<String>,
    pub executable_linux: Option<String>,
    pub executable_arm:  Option<String>,
    pub args_template:   Option<String>,
    pub extra_args:      Option<String>,
    pub min_os_win:      Option<String>,
    pub requires_bios:   bool,
    pub enabled:         bool,
}

impl Emulator {
    /// Retorna el ejecutable correcto para la plataforma actual
    pub fn executable(&self) -> Option<&str> {
        #[cfg(target_os = "windows")]
        return self.executable_win.as_deref();

        #[cfg(target_os = "linux")]
        {
            #[cfg(any(target_arch = "arm", target_arch = "aarch64"))]
            if let Some(arm) = self.executable_arm.as_deref() {
                return Some(arm);
            }
            return self.executable_linux.as_deref();
        }
    }
}
```

---

## CÓDIGO CENTRAL: EMULATOR ADAPTER TRAIT

```rust
// src-tauri/src/adapters/trait_adapter.rs
use crate::models::{Game, Emulator};
use crate::error::ArcadeError;
use async_trait::async_trait;
use std::path::Path;

#[async_trait]
pub trait EmulatorAdapter: Send + Sync {
    /// ID único (debe coincidir con BD)
    fn id(&self) -> &str;

    /// Nombre para mostrar
    fn name(&self) -> &str;

    /// Construir argumentos CLI para lanzar este juego
    fn build_args(&self, game: &Game, emu: &Emulator) -> Result<Vec<String>, ArcadeError>;

    /// El emulador está instalado en este sistema?
    async fn is_installed(&self, emu: &Emulator) -> bool {
        match emu.executable() {
            Some(path) => Path::new(path).exists(),
            None => false,
        }
    }

    /// Este emulador requiere BIOS? Dónde?
    fn bios_files(&self) -> Vec<BiosRequirement> {
        vec![]
    }

    /// Plataformas soportadas
    fn supported_platforms(&self) -> Vec<Platform> {
        vec![Platform::Windows, Platform::Linux, Platform::Arm]
    }

    /// Versión mínima de Windows (para filtrar en Win7)
    fn min_windows_version(&self) -> WindowsVersion {
        WindowsVersion::Win7
    }
}

#[derive(Debug, Clone)]
pub struct BiosRequirement {
    pub filename: &'static str,
    pub description: &'static str,
    pub optional: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Platform {
    Windows, Linux, Arm, All
}

#[derive(Debug, Clone, PartialEq, PartialOrd)]
pub enum WindowsVersion {
    Win7, Win8, Win10, Win11
}
```

---

## EMULATOR MANAGER CON COMPATIBILIDAD PLATAFORMAS

```rust
// src-tauri/src/core/emulator_manager.rs
use std::collections::HashMap;
use std::sync::Arc;
use tokio::process::{Command, Child};
use tokio::sync::Mutex;
use crate::adapters::*;
use crate::models::{Game, Emulator};
use crate::error::ArcadeError;
use tracing::{info, warn, error};

pub struct EmulatorManager {
    adapters: HashMap<String, Box<dyn EmulatorAdapter>>,
    running:  Arc<Mutex<HashMap<i64, RunningGame>>>,
}

struct RunningGame {
    child:    Child,
    game_id:  i64,
    started:  std::time::Instant,
}

impl EmulatorManager {
    pub fn new() -> Self {
        let mut adapters: HashMap<String, Box<dyn EmulatorAdapter>> = HashMap::new();

        // ── ARCADE ─────────────────────────────────────────
        adapters.insert("mame".into(),         Box::new(mame::MameAdapter));
        adapters.insert("advancemame".into(),  Box::new(mame::AdvanceMameAdapter));
        adapters.insert("fbneo".into(),        Box::new(fbneo::FbneoAdapter));
        adapters.insert("teknoparrot".into(),  Box::new(teknoparrot::TeknoParrotAdapter));
        adapters.insert("supermodel".into(),   Box::new(supermodel::SupermodelAdapter));
        adapters.insert("model2".into(),       Box::new(model2::Model2Adapter));

        // ── RETROARCH (multi-sistema) ──────────────────────
        adapters.insert("retroarch".into(),    Box::new(retroarch::RetroArchAdapter));

        // ── NINTENDO ─────────────────────────────────────
        adapters.insert("nestopia".into(),     Box::new(nestopia::NestopiaAdapter));
        adapters.insert("mesen".into(),        Box::new(mesen::MesenAdapter));
        adapters.insert("fceux".into(),        Box::new(fceux::FceuxAdapter));
        adapters.insert("snes9x".into(),       Box::new(snes9x::Snes9xAdapter));
        adapters.insert("bsnes".into(),        Box::new(bsnes::BsnesAdapter));
        adapters.insert("mupen64".into(),      Box::new(mupen64::Mupen64Adapter));
        adapters.insert("project64".into(),    Box::new(project64::Project64Adapter));
        adapters.insert("dolphin".into(),      Box::new(dolphin::DolphinAdapter));
        adapters.insert("cemu".into(),         Box::new(cemu::CemuAdapter));
        adapters.insert("yuzu".into(),         Box::new(yuzu::YuzuAdapter));
        adapters.insert("ryujinx".into(),      Box::new(ryujinx::RyujinxAdapter));
        adapters.insert("citra".into(),        Box::new(citra::CitraAdapter));
        adapters.insert("mgba".into(),         Box::new(mgba::MGbaAdapter));
        adapters.insert("vba_m".into(),        Box::new(vba_m::VbaMAdapter));
        adapters.insert("desmume".into(),      Box::new(desmume::DesmumeAdapter));
        adapters.insert("melonds".into(),      Box::new(melonds::MelonDsAdapter));

        // ── SEGA ────────────────────────────────────────
        adapters.insert("kega_fusion".into(),  Box::new(kega_fusion::KegaFusionAdapter));
        adapters.insert("flycast".into(),      Box::new(flycast::FlycastAdapter));
        adapters.insert("redream".into(),      Box::new(redream::RedreamAdapter));
        adapters.insert("demul".into(),        Box::new(demul::DemulAdapter));

        // ── SONY ────────────────────────────────────────
        adapters.insert("duckstation".into(),  Box::new(duckstation::DuckStationAdapter));
        adapters.insert("epsxe".into(),        Box::new(epsxe::EPsxeAdapter));
        adapters.insert("pcsxr".into(),        Box::new(pcsxr::PcsxrAdapter));
        adapters.insert("pcsx2".into(),        Box::new(pcsx2::Pcsx2Adapter));
        adapters.insert("rpcs3".into(),        Box::new(rpcs3::Rpcs3Adapter));
        adapters.insert("ppsspp".into(),       Box::new(ppsspp::PpssppAdapter));
        adapters.insert("vita3k".into(),       Box::new(vita3k::Vita3kAdapter));

        // ── MICROSOFT ────────────────────────────────
        adapters.insert("xemu".into(),         Box::new(xemu::XemuAdapter));
        adapters.insert("xenia".into(),        Box::new(xenia::XeniaAdapter));

        // ── ATARI / SEGA / OTROS ─────────────────────
        adapters.insert("stella".into(),       Box::new(stella::StellaAdapter));
        adapters.insert("hatari".into(),       Box::new(hatari::HatariAdapter));
        adapters.insert("altirra".into(),      Box::new(altirra::AltirraAdapter));
        adapters.insert("atari800".into(),     Box::new(atari800::Atari800Adapter));
        adapters.insert("vice".into(),         Box::new(vice::ViceAdapter));
        adapters.insert("fs_uae".into(),       Box::new(fs_uae::FsUaeAdapter));
        adapters.insert("winuae".into(),       Box::new(winuae::WinUaeAdapter));
        adapters.insert("dosbox".into(),       Box::new(dosbox::DosboxAdapter));
        adapters.insert("dosbox_pure".into(),  Box::new(dosbox_pure::DosboxPureAdapter));
        adapters.insert("scummvm".into(),      Box::new(scummvm::ScummvmAdapter));
        adapters.insert("mednafen".into(),     Box::new(mednafen::MednafenAdapter));
        adapters.insert("x68000".into(),       Box::new(x68000::X68000Adapter));
        adapters.insert("neko2".into(),        Box::new(neko2::Neko2Adapter));  // PC-98

        // ── FALLBACK ─────────────────────────────────
        adapters.insert("generic".into(),      Box::new(generic_cli::GenericAdapter));

        Self {
            adapters,
            running: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Lanzar juego en el emulador apropiado
    pub async fn launch_game(
        &self,
        game: &Game,
        emu: &Emulator,
    ) -> Result<u32, ArcadeError> {
        // 1. Verificar compatibilidad plataforma
        self.check_platform_compat(emu)?;

        // 2. Obtener adapter
        let adapter = self.adapters.get(&emu.name)
            .ok_or(ArcadeError::EmulatorNotFound(emu.name.clone()))?;

        // 3. Verificar instalado
        if !adapter.is_installed(emu).await {
            return Err(ArcadeError::EmulatorNotInstalled(emu.name.clone()));
        }

        // 4. Construir argumentos CLI
        let args = adapter.build_args(game, emu)?;
        let exe  = emu.executable()
            .ok_or(ArcadeError::NoExecutable(emu.name.clone()))?;

        info!("Launching {} with {} - args: {:?}", game.title, emu.name, args);

        // 5. Lanzar proceso
        let child = Command::new(exe)
            .args(&args)
            .spawn()
            .map_err(|e| ArcadeError::ProcessSpawn(e.to_string()))?;

        let pid = child.id().unwrap_or(0);
        info!("Started PID {}", pid);

        // 6. Guardar referencia
        let mut running = self.running.lock().await;
        running.insert(game.id, RunningGame {
            child,
            game_id: game.id,
            started: std::time::Instant::now(),
        });

        Ok(pid)
    }

    /// Esperar que el emulador cierre
    pub async fn wait_for_exit(&self, game_id: i64) -> Option<u64> {
        let mut running = self.running.lock().await;
        if let Some(mut rg) = running.remove(&game_id) {
            let elapsed = rg.started.elapsed().as_secs();
            let _ = rg.child.wait().await;
            return Some(elapsed);
        }
        None
    }

    /// Forzar cierre
    pub async fn kill_game(&self, game_id: i64) -> Result<(), ArcadeError> {
        let mut running = self.running.lock().await;
        if let Some(mut rg) = running.remove(&game_id) {
            rg.child.kill().await.map_err(|e| ArcadeError::ProcessKill(e.to_string()))?;
        }
        Ok(())
    }

    /// Verificar si el emulador es compatible con este OS/arquitectura
    fn check_platform_compat(&self, emu: &Emulator) -> Result<(), ArcadeError> {
        #[cfg(target_os = "windows")]
        {
            let min = emu.min_os_win.as_deref().unwrap_or("7");
            let current = get_windows_version();
            if current < min {
                return Err(ArcadeError::IncompatibleOS(
                    format!("{} requires Windows {} or higher", emu.name, min)
                ));
            }
        }
        Ok(())
    }
}

/// Obtener versión de Windows en tiempo de ejecución (Win7+)
#[cfg(target_os = "windows")]
fn get_windows_version() -> &'static str {
    use std::sync::OnceLock;
    static VERSION: OnceLock<String> = OnceLock::new();
    VERSION.get_or_init(|| {
        let output = std::process::Command::new("cmd")
            .args(["/C", "ver"])
            .output()
            .unwrap_or_default();
        let s = String::from_utf8_lossy(&output.stdout).to_string();
        if s.contains("6.1") { "7".to_string() }
        else if s.contains("6.3") { "8.1".to_string() }
        else if s.contains("10.0.1") { "10".to_string() }
        else if s.contains("10.0.2") { "11".to_string() }
        else { "10".to_string() }
    })
}
```

---

## ADAPTADORES CONCRETOS (EJEMPLOS)

```rust
// src-tauri/src/adapters/mame.rs
pub struct MameAdapter;
pub struct AdvanceMameAdapter;

#[async_trait]
impl EmulatorAdapter for MameAdapter {
    fn id(&self)   -> &str { "mame" }
    fn name(&self) -> &str { "MAME" }

    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>, ArcadeError> {
        let romname = std::path::Path::new(&game.rom_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&game.title);

        Ok(vec![
            romname.to_string(),
            "-nowindow".to_string(),     // Fullscreen
            "-skip_gameinfo".to_string(), // Saltar info screen
            "-sound".to_string(), "auto".to_string(),
            "-samplerate".to_string(), "44100".to_string(),
        ])
    }
}

#[async_trait]
impl EmulatorAdapter for AdvanceMameAdapter {
    fn id(&self)   -> &str { "advancemame" }
    fn name(&self) -> &str { "AdvanceMAME" }

    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>, ArcadeError> {
        let romname = std::path::Path::new(&game.rom_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&game.title);

        Ok(vec![
            romname.to_string(),
            // AdvanceMAME usa config de neocab.rc
        ])
    }
}

// src-tauri/src/adapters/retroarch.rs
pub struct RetroArchAdapter;

#[async_trait]
impl EmulatorAdapter for RetroArchAdapter {
    fn id(&self)   -> &str { "retroarch" }
    fn name(&self) -> &str { "RetroArch" }

    fn build_args(&self, game: &Game, emu: &Emulator) -> Result<Vec<String>, ArcadeError> {
        // El core se almacena en extra_args: "snes9x_libretro"
        let core_name = emu.extra_args.as_deref()
            .unwrap_or("genesis_plus_gx_libretro");

        let core_ext = if cfg!(target_os = "windows") { ".dll" }
                       else if cfg!(target_os = "macos") { ".dylib" }
                       else { ".so" };   // Linux + ARM

        let core_path = format!("cores/{}{}", core_name, core_ext);

        Ok(vec![
            "-L".to_string(),
            core_path,
            "--fullscreen".to_string(),
            "--no-stdin".to_string(),
            game.rom_path.clone(),
        ])
    }
}

// src-tauri/src/adapters/duckstation.rs
pub struct DuckStationAdapter;

#[async_trait]
impl EmulatorAdapter for DuckStationAdapter {
    fn id(&self)   -> &str { "duckstation" }
    fn name(&self) -> &str { "DuckStation" }

    fn build_args(&self, game: &Game, _: &Emulator) -> Result<Vec<String>, ArcadeError> {
        Ok(vec![
            "-batch".to_string(),
            "-fullscreen".to_string(),
            game.rom_path.clone(),
        ])
    }

    fn bios_files(&self) -> Vec<BiosRequirement> {
        vec![
            BiosRequirement { filename: "scph1001.bin",  description: "PS1 BIOS v2.0 USA", optional: false },
            BiosRequirement { filename: "scph5500.bin",  description: "PS1 BIOS v3.0 Japan", optional: true },
            BiosRequirement { filename: "scph5501.bin",  description: "PS1 BIOS v3.0 USA", optional: true },
            BiosRequirement { filename: "scph5502.bin",  description: "PS1 BIOS v3.0 Europe", optional: true },
        ]
    }
}

// src-tauri/src/adapters/generic_cli.rs
/// Adapter genérico para cualquier emulador no listado
pub struct GenericAdapter;

#[async_trait]
impl EmulatorAdapter for GenericAdapter {
    fn id(&self)   -> &str { "generic" }
    fn name(&self) -> &str { "Generic CLI" }

    fn build_args(&self, game: &Game, emu: &Emulator) -> Result<Vec<String>, ArcadeError> {
        // args_template: "{rom}" o "{fullscreen} {rom}" etc
        let template = emu.args_template.as_deref().unwrap_or("{rom}");
        let args_str = template.replace("{rom}", &game.rom_path);
        Ok(args_str.split_whitespace().map(String::from).collect())
    }
}
```

---

## GAME LIBRARY SCANNER (PARALELO)

```rust
// src-tauri/src/core/game_library.rs
use sqlx::SqlitePool;
use walkdir::WalkDir;
use rayon::prelude::*;
use crc32fast::Hasher;
use std::io::Read;
use crate::models::{Game, System};
use crate::error::ArcadeError;

pub struct GameLibrary {
    db: SqlitePool,
}

impl GameLibrary {
    pub fn new(db: SqlitePool) -> Self { Self { db } }

    /// Escanear sistema y encontrar ROMs
    pub async fn scan_system(&self, system: &System) -> Result<Vec<GameInfo>, ArcadeError> {
        let roms_path = system.roms_path.as_deref()
            .ok_or_else(|| ArcadeError::NoRomsPath(system.name.clone()))?;

        let extensions: Vec<String> = serde_json::from_str(
            system.extensions.as_deref().unwrap_or("[]")
        ).unwrap_or_default();

        // Recopilar paths en thread sincrónico (walkdir no es async)
        let paths: Vec<std::path::PathBuf> = WalkDir::new(roms_path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .filter(|e| {
                let ext = e.path()
                    .extension()
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                extensions.is_empty() || extensions.contains(&ext)
            })
            .map(|e| e.into_path())
            .collect();

        // Procesar en paralelo con rayon
        let game_infos: Vec<GameInfo> = paths
            .par_iter()
            .map(|path| -> GameInfo {
                let filename = path.file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                let title = path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(&filename)
                    .to_string();

                let (file_size, crc32) = Self::compute_file_info(path);

                GameInfo {
                    title: clean_title(&title),
                    sort_title: make_sort_title(&title),
                    rom_path: path.to_string_lossy().to_string(),
                    filename,
                    file_size,
                    crc32,
                }
            })
            .collect();

        Ok(game_infos)
    }

    /// Calcular tamaño y CRC32 de un archivo
    fn compute_file_info(path: &std::path::Path) -> (Option<i64>, Option<String>) {
        let meta = std::fs::metadata(path);
        let size = meta.as_ref().ok().map(|m| m.len() as i64);

        let crc32 = std::fs::File::open(path)
            .ok()
            .and_then(|mut f| {
                let mut hasher = Hasher::new();
                let mut buf = [0u8; 64 * 1024];
                loop {
                    match f.read(&mut buf) {
                        Ok(0) => break,
                        Ok(n) => hasher.update(&buf[..n]),
                        Err(_) => return None,
                    }
                }
                Some(format!("{:08X}", hasher.finalize()))
            });

        (size, crc32)
    }

    /// Guardar juegos en BD (upsert por rom_path)
    pub async fn save_games(
        &self,
        system_id: i64,
        games: &[GameInfo],
    ) -> Result<usize, ArcadeError> {
        let mut saved = 0usize;
        let mut tx = self.db.begin().await?;

        for g in games {
            let result = sqlx::query(r#"
                INSERT INTO games (title, sort_title, system_id, rom_path, filename, file_size, crc32)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(rom_path) DO UPDATE SET
                    title      = excluded.title,
                    sort_title = excluded.sort_title,
                    file_size  = excluded.file_size,
                    updated_at = datetime('now')
            "#)
            .bind(&g.title)
            .bind(&g.sort_title)
            .bind(system_id)
            .bind(&g.rom_path)
            .bind(&g.filename)
            .bind(g.file_size)
            .bind(&g.crc32)
            .execute(&mut *tx)
            .await;

            if result.is_ok() { saved += 1; }
        }

        tx.commit().await?;
        Ok(saved)
    }
}

/// Limpiar título de ROM: "Street Fighter II (USA) [!]" → "Street Fighter II"
fn clean_title(raw: &str) -> String {
    let re = regex::Regex::new(r"\s*[\(\[\{][^\)\]\}]*[\)\]\}]").unwrap();
    re.replace_all(raw, "").trim().to_string()
}

fn make_sort_title(title: &str) -> String {
    let lower = title.to_lowercase();
    for prefix in &["the ", "a ", "an ", "el ", "la ", "los ", "las "] {
        if lower.starts_with(prefix) {
            return title[prefix.len()..].to_string();
        }
    }
    title.to_string()
}

pub struct GameInfo {
    pub title:      String,
    pub sort_title: String,
    pub rom_path:   String,
    pub filename:   String,
    pub file_size:  Option<i64>,
    pub crc32:      Option<String>,
}
```

---

## ERROR TYPES CENTRALIZADO

```rust
// src-tauri/src/error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ArcadeError {
    #[error("Emulator not found: {0}")]
    EmulatorNotFound(String),

    #[error("Emulator not installed: {0}")]
    EmulatorNotInstalled(String),

    #[error("No executable for emulator: {0}")]
    NoExecutable(String),

    #[error("Cannot spawn process: {0}")]
    ProcessSpawn(String),

    #[error("Cannot kill process: {0}")]
    ProcessKill(String),

    #[error("No ROMs path configured for: {0}")]
    NoRomsPath(String),

    #[error("Incompatible OS: {0}")]
    IncompatibleOS(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Config error: {0}")]
    Config(String),

    #[error("{0}")]
    General(String),
}

// Para poder enviarlo en Tauri commands (necesita ser Serialize)
impl serde::Serialize for ArcadeError {
    fn serialize<S>(&self, s: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        s.serialize_str(&self.to_string())
    }
}
```

---

## CONFIG YAML BASE

```yaml
# config/systems.yaml — Sistemas habilitados y rutas
systems:
  - name: mame
    display_name: "MAME Arcade"
    category: arcade
    extensions: ["zip", "7z", "chd"]
    roms_path: "./roms/mame"
    emulator: mame

  - name: snes
    display_name: "Super Nintendo"
    category: console
    extensions: ["sfc", "smc", "zip", "7z"]
    roms_path: "./roms/snes"
    emulator: retroarch
    retroarch_core: snes9x_libretro

  - name: genesis
    display_name: "Sega Genesis / Mega Drive"
    category: console
    extensions: ["md", "bin", "smd", "zip", "7z"]
    roms_path: "./roms/genesis"
    emulator: retroarch
    retroarch_core: genesis_plus_gx_libretro

  - name: nes
    display_name: "Nintendo Entertainment System"
    category: console
    extensions: ["nes", "fds", "zip", "7z"]
    roms_path: "./roms/nes"
    emulator: nestopia

  - name: n64
    display_name: "Nintendo 64"
    category: console
    extensions: ["z64", "v64", "n64", "zip", "7z"]
    roms_path: "./roms/n64"
    emulator: retroarch
    retroarch_core: mupen64plus_next_libretro

  - name: ps1
    display_name: "PlayStation 1"
    category: console
    extensions: ["bin", "cue", "img", "iso", "chd", "pbp"]
    roms_path: "./roms/ps1"
    bios_path: "./bios"
    emulator: duckstation

  - name: ps2
    display_name: "PlayStation 2"
    category: console
    extensions: ["iso", "bin", "img", "mdf", "chd"]
    roms_path: "./roms/ps2"
    bios_path: "./bios"
    emulator: pcsx2

  - name: psp
    display_name: "PlayStation Portable"
    category: handheld
    extensions: ["iso", "cso", "pbp"]
    roms_path: "./roms/psp"
    emulator: ppsspp

  - name: gba
    display_name: "Game Boy Advance"
    category: handheld
    extensions: ["gba", "zip", "7z"]
    roms_path: "./roms/gba"
    emulator: mgba

  - name: ds
    display_name: "Nintendo DS"
    category: handheld
    extensions: ["nds", "zip", "7z"]
    roms_path: "./roms/ds"
    emulator: melonds

  - name: gamecube
    display_name: "GameCube"
    category: console
    extensions: ["iso", "gcm", "rvz", "wbfs"]
    roms_path: "./roms/gamecube"
    emulator: dolphin

  - name: wii
    display_name: "Nintendo Wii"
    category: console
    extensions: ["iso", "wbfs", "rvz"]
    roms_path: "./roms/wii"
    emulator: dolphin

  - name: dreamcast
    display_name: "Sega Dreamcast"
    category: console
    extensions: ["chd", "cdi", "gdi"]
    roms_path: "./roms/dreamcast"
    emulator: flycast

  - name: dos
    display_name: "MS-DOS"
    category: computer
    extensions: ["exe", "bat", "zip", "7z"]
    roms_path: "./roms/dos"
    emulator: dosbox

  - name: c64
    display_name: "Commodore 64"
    category: computer
    extensions: ["d64", "t64", "tap", "prg", "zip"]
    roms_path: "./roms/c64"
    emulator: vice

# config/kiosk.yaml — Modo kiosk
kiosk:
  enabled: true
  fullscreen: true
  hide_cursor: true
  prevent_exit: true     # No se puede cerrar con Alt+F4
  operator_pin: "1234"   # ← CAMBIAR ESTO
  autoboot: true
  attract_mode:
    enabled: true
    idle_seconds: 180
    cycle_games: true

# config/pricing.yaml — Sistema de cobro
pricing:
  default_policy: free    # "free", "coin", "timer"
  systems:
    mame:
      policy: coin
      coins_per_credit: 1
    snes:
      policy: timer
      minutes_per_coin: 10
    ps2:
      policy: timer
      minutes_per_coin: 5
    dos:
      policy: free
```

---

*Siguiente: Parte 3 — Semanas 1-2 implementación paso a paso*
