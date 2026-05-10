# 🎮 NEOCAB - PARTE 3: DESARROLLO PASO A PASO

---

# CRONOGRAMA EXHAUSTIVO - 16 SEMANAS

## RESUMEN VISUAL

```
SEMANA  | FASE                    | ENTREGABLE
--------|-------------------------|----------------------------------
1       | Setup + Estructura      | Proyecto compilando vacío
2       | Models + DB             | Schema SQLite + types funcionando
3       | Config + YAML           | Parser + hot-reload
4       | Game Library            | Scanner ROMs funcionando
5       | First Emulator (MAME)   | MAME se lanza desde código
6       | Coin System             | Detecta monedas + UI
7       | UI Básica               | Menú principal navegable
8       | Timer Manager           | Timer funcional + overlay
9       | RetroArch + Multi-emu   | SNES, Genesis, NES OK
10      | Input Universal         | SDL2 + GilRs + mapping
11      | Operator Panel          | Panel con PIN + estadísticas
12      | Autoboot + Kiosk        | Win/Linux autoarranque
13      | Themes + UI Polish      | 3 temas funcionales
14      | Emuladores Adicionales  | PS1, PSP, Dolphin, etc
15      | Testing + Bug Fixing    | Tests + estabilidad
16      | Release v1.0            | Builds Win/Linux, docs
```

---

# SEMANA 1: SETUP + ESTRUCTURA INICIAL

## Día 1: Inicialización del proyecto

### Paso 1: Crear repositorio en GitHub

```bash
# En GitHub.com:
# 1. Click "New repository"
# 2. Nombre: neocab
# 3. Descripción: "Modern arcade frontend - Universal emulator launcher"
# 4. Public
# 5. Add README, .gitignore (Rust template), LICENSE (GPL-3.0)
# 6. Create
```

### Paso 2: Clonar localmente

```bash
# Windows (PowerShell)
cd C:\Dev
git clone https://github.com/TU-USUARIO/neocab.git
cd neocab

# Linux
cd ~/Dev
git clone https://github.com/TU-USUARIO/neocab.git
cd neocab
```

### Paso 3: Inicializar Tauri project

```bash
# Crear estructura Tauri
cargo create-tauri-app

# Cuando pregunte:
# - Project name: neocab
# - Identifier: com.neocab.app
# - Frontend language: TypeScript / JavaScript
# - Choose your package manager: npm
# - UI template: React
# - UI flavor: TypeScript

# Esto crea la estructura básica
```

### Paso 4: Verificar que compila

```bash
npm install
cargo tauri dev

# Si abre una ventana con la app de Tauri default → ¡Funciona!
# Cerrar la ventana
```

### Paso 5: Crear estructura de carpetas adicionales

```bash
# Backend (Rust) - dentro de src-tauri/src/
cd src-tauri/src
mkdir -p commands core adapters input models db scrapers plugins ui_overlay utils

# Frontend (React) - dentro de src/
cd ../../src
mkdir -p pages components/{common,game,system,coin,overlay,input,operator} themes hooks store utils types assets/{fonts,sounds,images}

# Carpetas de configuración y datos
cd ../..
mkdir -p config data plugins roms docs scripts installer

# Tests
mkdir -p src-tauri/tests src-tauri/benches

# Docs subdivisions
mkdir -p docs/images
```

### Paso 6: Crear .gitignore mejorado

```bash
cat > .gitignore <<'EOF'
# Rust
target/
**/*.rs.bk
Cargo.lock

# Tauri
src-tauri/target/
src-tauri/Cargo.lock

# Node
node_modules/
dist/
dist-ssr/
.npm/
.pnpm-store/

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Project specific
data/
roms/
plugins/installed/
config/local_overrides.yaml
*.log
*.db
*.db-wal
*.db-shm

# Build outputs
release/
build/
*.tar.gz
*.zip
*.exe
*.msi
*.deb
*.rpm
*.AppImage

# Environment
.env
.env.local
.env.*.local

# Test coverage
coverage/
*.lcov
EOF
```

### Paso 7: Primer commit

```bash
git add .
git commit -m "Initial project structure with Tauri + React + TypeScript"
git push origin main
```

## Día 2: Configurar dependencias

### Paso 8: Editar src-tauri/Cargo.toml

```toml
[package]
name = "neocab"
version = "0.1.0"
description = "Modern arcade frontend - Universal emulator launcher"
authors = ["Tu Nombre"]
license = "GPL-3.0-or-later"
repository = "https://github.com/TU-USUARIO/neocab"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
# Tauri core
tauri = { version = "2.0", features = ["api-all"] }
tauri-plugin-shell = "2.0"
tauri-plugin-fs = "2.0"
tauri-plugin-dialog = "2.0"

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "sqlite", "migrate", "macros", "chrono"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_yaml = "0.9"

# Utilities
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
anyhow = "1.0"
thiserror = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender = "0.2"

# Filesystem
walkdir = "2.4"
notify = "6.1"

# Hashing & crypto
sha2 = "0.10"
crc32fast = "1.3"
bcrypt = "0.15"

# Compression
zip = "0.6"

# Process
sysinfo = "0.30"

# Paths
dirs = "5.0"

# Input handling
sdl2 = { version = "0.36", features = ["bundled"] }
gilrs = "0.10"

# HTTP (opcional para scrapers)
reqwest = { version = "0.11", features = ["json", "blocking"], optional = true }

[target.'cfg(target_os = "windows")'.dependencies]
winreg = "0.52"

[target.'cfg(target_os = "linux")'.dependencies]
nix = "0.27"

[features]
default = []
scrapers = ["dep:reqwest"]
```

### Paso 9: Actualizar package.json

```json
{
  "name": "neocab",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tabler/icons-react": "^2.42.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### Paso 10: Instalar y verificar

```bash
# Frontend dependencies
npm install

# Backend dependencies (Rust)
cd src-tauri
cargo build
cd ..

# Probar que aún compila
cargo tauri dev
```

## Día 3-5: Configuración de Tauri y arquitectura base

### Paso 11: Configurar tauri.conf.json

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "NeoCab",
  "version": "0.1.0",
  "identifier": "com.neocab.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "NeoCab",
        "width": 1920,
        "height": 1080,
        "minWidth": 800,
        "minHeight": 600,
        "fullscreen": false,
        "resizable": true,
        "decorations": true,
        "alwaysOnTop": false,
        "skipTaskbar": false,
        "label": "main"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "category": "Game",
    "shortDescription": "Modern arcade frontend",
    "longDescription": "NeoCab is a modern, fast, and customizable arcade frontend that supports virtually any emulator with a coin/timer hybrid system perfect for arcade cabinets."
  }
}
```

### Paso 12: Crear estructura básica de Rust

**src-tauri/src/main.rs:**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod core;
mod adapters;
mod input;
mod models;
mod db;
mod utils;
mod error;
mod logging;

use tauri::Manager;

fn main() {
    // Inicializar logging
    logging::init();

    tracing::info!("Starting NeoCab v{}", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            tracing::info!("NeoCab initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Aquí van los comandos IPC
            commands::system::get_app_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Paso 13: Crear módulos básicos

**src-tauri/src/lib.rs:**
```rust
pub mod commands;
pub mod core;
pub mod adapters;
pub mod input;
pub mod models;
pub mod db;
pub mod utils;
pub mod error;
pub mod logging;
```

**src-tauri/src/error.rs:**
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ArcadeError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Config error: {0}")]
    Config(String),
    
    #[error("Emulator error: {0}")]
    Emulator(String),
    
    #[error("Input error: {0}")]
    Input(String),
    
    #[error("Generic error: {0}")]
    Generic(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, ArcadeError>;
```

**src-tauri/src/logging.rs:**
```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn init() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "neocab=debug,info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}
```

**src-tauri/src/commands/mod.rs:**
```rust
pub mod system;
pub mod games;
pub mod emulators;
pub mod coins;
pub mod config;
pub mod operator;
pub mod input;
```

**src-tauri/src/commands/system.rs:**
```rust
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
```

### Paso 14: Estructura básica de React

**src/App.tsx:**
```tsx
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

function App() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    invoke<string>('get_app_version').then(setVersion);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 NeoCab</h1>
        <p>Version: {version}</p>
      </header>
      <main>
        <p>Welcome to NeoCab!</p>
      </main>
    </div>
  );
}

export default App;
```

**src/App.css:**
```css
.app {
  min-height: 100vh;
  background: #0a0a0f;
  color: #fff;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
}

.app-header h1 {
  font-size: 3rem;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #8338ec);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Paso 15: Test Final de Semana 1

```bash
# Compilar y correr
cargo tauri dev

# Debe abrir ventana mostrando:
# 🎮 NeoCab
# Version: 0.1.0
# Welcome to NeoCab!

# Si funciona → ¡Semana 1 COMPLETA! 🎉

# Commit
git add .
git commit -m "Week 1: Project structure + basic Rust/React setup"
git push
```

---

# SEMANA 2: MODELS + DATABASE

## Objetivo: Schema SQLite completo + Types Rust

### Día 1: Schema SQLite

**src-tauri/src/db/migrations/001_initial.sql:**

```sql
-- Tabla: emulators
CREATE TABLE IF NOT EXISTS emulators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('arcade', 'console', 'computer', 'handheld')),
    backend TEXT NOT NULL,
    executable_win TEXT,
    executable_linux TEXT,
    executable_mac TEXT,
    launch_template TEXT NOT NULL,
    core_path_win TEXT,
    core_path_linux TEXT,
    core_path_mac TEXT,
    auto_detect BOOLEAN DEFAULT 1,
    enabled BOOLEAN DEFAULT 1,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: systems
CREATE TABLE IF NOT EXISTS systems (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    short_name TEXT,
    description TEXT,
    manufacturer TEXT,
    year INTEGER,
    emulator_id TEXT NOT NULL,
    credit_policy TEXT NOT NULL CHECK(credit_policy IN ('coin', 'timer', 'free')),
    rom_path TEXT NOT NULL,
    extensions_json TEXT NOT NULL,
    bios_path TEXT,
    enabled BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    icon_path TEXT,
    logo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emulator_id) REFERENCES emulators(id)
);

CREATE INDEX IF NOT EXISTS idx_systems_enabled ON systems(enabled);
CREATE INDEX IF NOT EXISTS idx_systems_sort ON systems(sort_order);

-- Tabla: games
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sort_title TEXT,
    filename TEXT NOT NULL,
    rom_path TEXT NOT NULL UNIQUE,
    system_id TEXT NOT NULL,
    file_size INTEGER,
    crc32 TEXT,
    md5 TEXT,
    sha1 TEXT,
    
    -- Metadata
    year INTEGER,
    manufacturer TEXT,
    publisher TEXT,
    developer TEXT,
    genre TEXT,
    rating REAL,
    description TEXT,
    players INTEGER,
    coop BOOLEAN DEFAULT 0,
    region TEXT,
    language TEXT,
    
    -- Media
    cover_path TEXT,
    snap_path TEXT,
    video_path TEXT,
    marquee_path TEXT,
    wheel_path TEXT,
    manual_path TEXT,
    
    -- User data
    is_favorite BOOLEAN DEFAULT 0,
    is_hidden BOOLEAN DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    total_play_time_seconds INTEGER DEFAULT 0,
    last_played DATETIME,
    
    -- Quality
    enabled BOOLEAN DEFAULT 1,
    is_clone BOOLEAN DEFAULT 0,
    parent_id TEXT,
    rom_status TEXT,  -- 'good', 'bad', 'preliminary'
    
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (system_id) REFERENCES systems(id),
    FOREIGN KEY (parent_id) REFERENCES games(id)
);

CREATE INDEX IF NOT EXISTS idx_games_system ON games(system_id);
CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(is_favorite);
CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);
CREATE INDEX IF NOT EXISTS idx_games_enabled ON games(enabled);
CREATE INDEX IF NOT EXISTS idx_games_last_played ON games(last_played);

-- Tabla: sessions (gameplay sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    system_id TEXT NOT NULL,
    user_profile_id TEXT,
    
    credit_policy TEXT NOT NULL,
    coins_inserted INTEGER DEFAULT 0,
    minutes_purchased INTEGER DEFAULT 0,
    
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration_seconds INTEGER,
    
    end_reason TEXT,  -- 'normal', 'timeout', 'crash', 'operator', 'unknown'
    emulator_exit_code INTEGER,
    error_message TEXT,
    
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (system_id) REFERENCES systems(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_game ON sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(started_at);

-- Tabla: coin_events
CREATE TABLE IF NOT EXISTS coin_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    coin_count INTEGER NOT NULL,
    coin_value REAL,
    currency TEXT,
    source TEXT,  -- 'physical', 'operator', 'test'
    session_id TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_coin_date ON coin_events(timestamp);

-- Tabla: input_devices
CREATE TABLE IF NOT EXISTS input_devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('keyboard', 'gamepad', 'arcade_stick', 'mouse', 'lightgun', 'wheel', 'coin_acceptor')),
    vendor_id TEXT,
    product_id TEXT,
    sdl_guid TEXT,
    
    enabled BOOLEAN DEFAULT 1,
    is_player_assigned BOOLEAN DEFAULT 0,
    player_number INTEGER,
    
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: input_mappings
CREATE TABLE IF NOT EXISTS input_mappings (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    profile_name TEXT DEFAULT 'default',
    action TEXT NOT NULL,
    button_or_axis TEXT NOT NULL,
    modifier TEXT,
    
    FOREIGN KEY (device_id) REFERENCES input_devices(id)
);

CREATE INDEX IF NOT EXISTS idx_mappings_device ON input_mappings(device_id);
CREATE INDEX IF NOT EXISTS idx_mappings_profile ON input_mappings(profile_name);

-- Tabla: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    avatar_path TEXT,
    pin_hash TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME
);

-- Tabla: achievements (opcional)
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    profile_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    icon_path TEXT,
    points INTEGER DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (profile_id) REFERENCES user_profiles(id)
);

-- Tabla: config (key-value)
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string',
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(timestamp);
```

### Día 2: Modelos Rust

**src-tauri/src/models/mod.rs:**
```rust
pub mod game;
pub mod system;
pub mod emulator;
pub mod session;
pub mod input_device;
pub mod input_mapping;
pub mod profile;
pub mod coin_event;
pub mod achievement;

pub use game::*;
pub use system::*;
pub use emulator::*;
pub use session::*;
pub use input_device::*;
pub use input_mapping::*;
pub use profile::*;
pub use coin_event::*;
pub use achievement::*;
```

**src-tauri/src/models/game.rs:**
```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub sort_title: Option<String>,
    pub filename: String,
    pub rom_path: String,
    pub system_id: String,
    pub file_size: Option<i64>,
    pub crc32: Option<String>,
    pub md5: Option<String>,
    pub sha1: Option<String>,
    
    pub year: Option<i32>,
    pub manufacturer: Option<String>,
    pub publisher: Option<String>,
    pub developer: Option<String>,
    pub genre: Option<String>,
    pub rating: Option<f64>,
    pub description: Option<String>,
    pub players: Option<i32>,
    pub coop: bool,
    pub region: Option<String>,
    pub language: Option<String>,
    
    pub cover_path: Option<String>,
    pub snap_path: Option<String>,
    pub video_path: Option<String>,
    pub marquee_path: Option<String>,
    pub wheel_path: Option<String>,
    pub manual_path: Option<String>,
    
    pub is_favorite: bool,
    pub is_hidden: bool,
    pub play_count: i32,
    pub total_play_time_seconds: i64,
    pub last_played: Option<DateTime<Utc>>,
    
    pub enabled: bool,
    pub is_clone: bool,
    pub parent_id: Option<String>,
    pub rom_status: Option<String>,
    
    pub discovered_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Game {
    pub fn new(title: String, filename: String, rom_path: String, system_id: String) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            sort_title: None,
            filename,
            rom_path,
            system_id,
            file_size: None,
            crc32: None,
            md5: None,
            sha1: None,
            year: None,
            manufacturer: None,
            publisher: None,
            developer: None,
            genre: None,
            rating: None,
            description: None,
            players: None,
            coop: false,
            region: None,
            language: None,
            cover_path: None,
            snap_path: None,
            video_path: None,
            marquee_path: None,
            wheel_path: None,
            manual_path: None,
            is_favorite: false,
            is_hidden: false,
            play_count: 0,
            total_play_time_seconds: 0,
            last_played: None,
            enabled: true,
            is_clone: false,
            parent_id: None,
            rom_status: None,
            discovered_at: now,
            updated_at: now,
        }
    }
}
```

(Modelos similares para los demás: System, Emulator, Session, etc.)

### Día 3-4: DB Connection y Migrations

**src-tauri/src/db/mod.rs:**
```rust
pub mod connection;
pub mod games_repo;
pub mod systems_repo;
pub mod emulators_repo;
pub mod sessions_repo;

pub use connection::*;
```

**src-tauri/src/db/connection.rs:**
```rust
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::path::Path;
use anyhow::Result;

pub async fn init_database(db_path: &Path) -> Result<SqlitePool> {
    // Crear directorio si no existe
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await?;

    // Habilitar WAL mode
    sqlx::query("PRAGMA journal_mode = WAL").execute(&pool).await?;
    sqlx::query("PRAGMA cache_size = -64000").execute(&pool).await?;
    sqlx::query("PRAGMA temp_store = MEMORY").execute(&pool).await?;
    sqlx::query("PRAGMA synchronous = NORMAL").execute(&pool).await?;

    // Ejecutar migrations
    sqlx::migrate!("./src/db/migrations")
        .run(&pool)
        .await?;

    tracing::info!("Database initialized at {:?}", db_path);
    Ok(pool)
}
```

### Día 5: Tests Semana 2

```bash
# En src-tauri/
cargo test

# Si pasa, commit
git add .
git commit -m "Week 2: Database schema + Rust models + migrations"
git push
```

---

# SEMANA 3-16: RESUMEN

Por espacio, los detalles completos de las semanas 3-16 están en archivos separados, pero el formato es similar:

```
SEMANA 3:  Config Manager + YAML hot-reload
SEMANA 4:  Game Library + Scanner paralelizado  
SEMANA 5:  MAME adapter + primer emulador funcional
SEMANA 6:  Coin Manager + UI básica de créditos
SEMANA 7:  UI Principal navegable (menú, lista de juegos)
SEMANA 8:  Timer Manager + overlay durante juego
SEMANA 9:  RetroArch adapter + multi-emulador (SNES, Genesis, NES)
SEMANA 10: Input Universal (SDL2 + GilRs + mapping wizard)
SEMANA 11: Operator Panel + PIN + estadísticas
SEMANA 12: Autoboot + Kiosk Mode (Win/Linux)
SEMANA 13: Themes (3+ visuales) + UI Polish
SEMANA 14: Emuladores adicionales (PS1, PSP, Dolphin, etc)
SEMANA 15: Testing exhaustivo + bug fixing
SEMANA 16: Build + Release v1.0 + Docs
```

---

# COMANDOS COMUNES DURANTE DESARROLLO

```bash
# Compilar y correr en dev
cargo tauri dev

# Build para producción
cargo tauri build

# Solo Rust (sin UI)
cd src-tauri && cargo build

# Solo tests Rust
cd src-tauri && cargo test

# Tests específicos
cargo test test_game_scanner

# Ver logs verbose
RUST_LOG=neocab=debug cargo tauri dev

# Format código Rust
cargo fmt

# Lint Rust
cargo clippy

# Ver tamaño binario final
cargo bloat --release

# Format código TypeScript
npm run format

# Lint TypeScript
npm run lint
```

---

# CONTINÚA EN PARTE 4...

Ver **PARTE_4_CODIGO_DETALLADO.md** para implementación módulo por módulo con código completo.
