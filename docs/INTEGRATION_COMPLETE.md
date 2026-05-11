# NeoCab Complete Integration Plan

**Objetivo:** Integrar Phase 4 (Hardware) con sistema de themes avanzado y crear un producto profesional completo.

---

## 1. ARQUITECTURA INTEGRAL

### 1.1 Stack Tecnológico Completo
```
┌─────────────────────────────────────────────────────────┐
│                    NeoCab v3.0 Stack                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FRONTEND LAYER (src/)                                   │
│  ├─ React 19.1.0 (UI framework)                         │
│  ├─ TypeScript 5.8.3 (type safety)                      │
│  ├─ Vite 7.0.4 (bundler, HMR)                           │
│  ├─ CSS Grid/Flexbox (responsive layout)                │
│  ├─ Canvas API (60FPS wheel rendering)                  │
│  └─ Tauri IPC (command invocation)                       │
│                                                          │
│  BACKEND LAYER (src-tauri/src/)                          │
│  ├─ Tauri 2.x (app framework)                           │
│  ├─ Tokio (async runtime)                               │
│  ├─ SQLx + SQLite (database)                            │
│  ├─ Serialport (Arduino communication)                  │
│  ├─ Rppal (RPi GPIO)                                    │
│  ├─ SDL2 (legacy graphics)                              │
│  ├─ GilRs (input devices)                               │
│  └─ Tracing (logging)                                   │
│                                                          │
│  DEPLOYMENT                                              │
│  ├─ Windows: NSIS installer (.exe, 300MB)               │
│  ├─ Linux: AppImage (.AppImage, 250MB)                  │
│  └─ macOS: DMG (future)                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Directory Structure (Final)
```
neocab/
├── .cargo/
│   └── config.toml              ← Platform-specific rustflags
├── .vscode/
│   ├── settings.json
│   ├── launch.json
│   └── tasks.json
├── config/
│   ├── app.yaml                 ← App configuration
│   ├── arcade.yaml              ← Arcade settings
│   ├── controls.yaml            ← Input mappings
│   └── personalization.yaml     ← Theme/UI preferences
├── data/
│   └── neocab.db                ← SQLite database
├── docs/
│   ├── INDEX_MAESTRO.md         ← Documentation index
│   ├── PHASE4_HARDWARE.md       ← Hardware integration
│   ├── PHASE5_PLUS_ADVANCED_CUSTOMIZATION.md
│   ├── INTEGRATION_COMPLETE.md  ← This file
│   └── ... (15+ guides)
├── installer/
│   ├── windows/
│   │   ├── setup.nsi            ← NSIS script
│   │   ├── logo.ico
│   │   └── banner.bmp
│   ├── linux/
│   │   ├── AppRun
│   │   └── neocab.desktop
│   └── macos/
│       └── Info.plist
├── public/
│   ├── assets/
│   │   ├── themes/
│   │   │   ├── classic/
│   │   │   │   ├── theme.json
│   │   │   │   ├── styles.css
│   │   │   │   └── preview.png
│   │   │   ├── neon/
│   │   │   └── cyberpunk/
│   │   ├── fonts/
│   │   │   ├── arcade.ttf
│   │   │   ├── digital-7.ttf
│   │   │   └── neon.ttf
│   │   ├── media/
│   │   │   ├── system-logos/
│   │   │   ├── button-icons/
│   │   │   └── default-wheels/
│   │   └── transitions/
│   └── favicon.ico
├── roms/                        ← Game storage (user)
│   ├── MAME/
│   ├── SNES/
│   ├── Genesis/
│   └── ...
├── src/                         ← React Frontend
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameScreen.tsx
│   │   │   └── GameScreen.css
│   │   ├── wheel/
│   │   │   ├── HyperSpinWheel.tsx
│   │   │   └── HyperSpinWheel.css
│   │   ├── hardware/
│   │   │   ├── CoinOverlay.tsx
│   │   │   ├── HardwareCalibration.tsx
│   │   │   └── HardwareCalibration.css
│   │   ├── customization/
│   │   │   ├── ThemeEditor.tsx
│   │   │   ├── MediaManager.tsx
│   │   │   ├── ThemePreview.tsx
│   │   │   └── Customization.css
│   │   └── operator/
│   │       ├── OperatorPanel.tsx
│   │       └── OperatorPanel.css
│   ├── context/
│   │   ├── ArcadeContext.tsx    ← Global state
│   │   ├── ThemeContext.tsx     ← Theme state
│   │   └── HardwareContext.tsx  ← Hardware state
│   ├── hooks/
│   │   ├── useArcade.ts
│   │   ├── useTauri.ts
│   │   ├── useHardware.ts
│   │   ├── useTheme.ts
│   │   └── useMedia.ts
│   ├── pages/
│   │   ├── MainScreen.tsx
│   │   ├── SetupWizard.tsx
│   │   └── ErrorScreen.tsx
│   ├── types/
│   │   ├── arcade.ts
│   │   ├── theme.ts
│   │   └── hardware.ts
│   ├── utils/
│   │   ├── theme.ts
│   │   ├── media.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── src-tauri/                   ← Rust Backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── system.rs
│   │   │   ├── games.rs
│   │   │   ├── emulator.rs
│   │   │   ├── coin.rs
│   │   │   ├── timer.rs
│   │   │   ├── hardware.rs     ← NEW
│   │   │   ├── theme.rs        ← NEW
│   │   │   ├── media.rs        ← NEW
│   │   │   └── config.rs
│   │   ├── core/
│   │   │   ├── mod.rs
│   │   │   ├── emulator_manager.rs
│   │   │   ├── game_library.rs
│   │   │   ├── coin_manager.rs
│   │   │   ├── timer_manager.rs
│   │   │   ├── gpio_coins.rs           ✅
│   │   │   ├── arduino_serial.rs       ✅
│   │   │   ├── theme_manager.rs        ← NEW
│   │   │   ├── media_manager.rs        ← NEW
│   │   │   ├── operator_panel.rs
│   │   │   └── autoboot.rs
│   │   ├── adapters/
│   │   │   ├── mame_adapter.rs
│   │   │   ├── retroarch_adapter.rs
│   │   │   └── ... (14+ emulators)
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs
│   │   │   └── migrations/
│   │   ├── input/
│   │   │   ├── mod.rs
│   │   │   ├── input_manager.rs
│   │   │   └── ...
│   │   ├── models/
│   │   │   ├── game.rs
│   │   │   ├── system.rs
│   │   │   ├── session.rs
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── platform_detect.rs
│   │   │   └── ...
│   │   ├── error.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   └── capabilities/
├── .gitignore
├── CLAUDE.md
├── README.md
├── ROADMAP.md
├── STATUS.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── NEOCAB_COMPLETE.md           ← This integration guide
```

---

## 2. FEATURE INTEGRATION MATRIX

### 2.1 Hardware + Theme Integration
```
┌──────────────────┬──────────────────┬──────────────────┐
│     Hardware     │    Component     │    Theme Use     │
├──────────────────┼──────────────────┼──────────────────┤
│ Coin Detection   │ CoinOverlay      │ Position, Color  │
│                  │                  │ Animation Style  │
├──────────────────┼──────────────────┼──────────────────┤
│ GPIO/Arduino     │ HardwareCalib    │ Button Colors    │
│                  │                  │ Font, Background │
├──────────────────┼──────────────────┼──────────────────┤
│ Game Timer       │ TimerDisplay     │ Font, Position   │
│                  │                  │ Color Scheme     │
├──────────────────┼──────────────────┼──────────────────┤
│ Joystick Input   │ ControlHints     │ Button Icons     │
│                  │                  │ Highlight Color  │
├──────────────────┼──────────────────┼──────────────────┤
│ Media (Wheels)   │ HyperSpinWheel   │ Size, Spacing    │
│                  │                  │ Animation Speed  │
└──────────────────┴──────────────────┴──────────────────┘
```

### 2.2 Component Dependency Graph
```
App (Root)
├── ThemeProvider (theme context + CSS variables)
│   ├── HardwareProvider (coin/input state)
│   │   ├── GameScreen
│   │   │   ├── HyperSpinWheel (theme-aware)
│   │   │   ├── GameListPanel (theme-aware)
│   │   │   ├── CoinOverlay (theme-aware)
│   │   │   └── TimerDisplay (theme-aware)
│   │   ├── OperatorPanel
│   │   │   ├── ThemeEditor (live preview)
│   │   │   ├── MediaManager (asset browser)
│   │   │   └── HardwareCalibration ✅
│   │   └── SetupWizard (first-run)
│   │       ├── Welcome
│   │       ├── ROMSelection
│   │       ├── HardwareSetup ✅
│   │       ├── ThemeSelection
│   │       ├── ControlCalibration
│   │       └── Finish
│   └── ErrorBoundary
│       └── ErrorScreen
```

---

## 3. DATA FLOW ARCHITECTURE

### 3.1 Theme Data Flow
```
User selects theme
        ↓
ThemeContext.setTheme(themeName)
        ↓
Fetch ~/NeoCab/Themes/{themeName}/theme.json
        ↓
Load CSS variables + apply to <root>
        ↓
All components re-render with new theme
        ↓
Save to database: config.current_theme
```

### 3.2 Hardware Data Flow
```
GPIO/Arduino → CoinEvent
        ↓
CoinManager.handle_coin_event()
        ↓
Update: state.total_balance
        ↓
Emit: ArcadeContext.setCoinBalance()
        ↓
CoinOverlay.re-render + animate
        ↓
Log to database: coin_events table
```

### 3.3 Media Data Flow
```
User imports HyperSpin folder
        ↓
MediaManager.import_from_hyperspin(path)
        ↓
Scan: ~/HyperSpin/Media/{system}/Wheel/
        ↓
Copy & organize to ~/NeoCab/Media/Systems/{system}/Wheel/
        ↓
Generate thumbnails + cache
        ↓
Database: media_cache table
        ↓
HyperSpinWheel loads from cache
```

---

## 4. TAURI COMMAND EXPANSION

### 4.1 New Commands (Phase 5)
```rust
// Theme Commands
#[tauri::command]
async fn list_themes() -> Result<Vec<ThemeInfo>, String>

#[tauri::command]
async fn get_current_theme() -> Result<Theme, String>

#[tauri::command]
async fn set_theme(name: String) -> Result<(), String>

#[tauri::command]
async fn save_custom_theme(theme: Theme) -> Result<String, String>

#[tauri::command]
async fn export_theme(name: String, path: String) -> Result<(), String>

#[tauri::command]
async fn import_theme(path: String) -> Result<String, String>

// Media Commands
#[tauri::command]
async fn list_media_folders(system: String) -> Result<Vec<String>, String>

#[tauri::command]
async fn scan_media() -> Result<MediaScanReport, String>

#[tauri::command]
async fn import_hyperspin(hyperspin_path: String) -> Result<(), String>

#[tauri::command]
async fn get_wheel_image(system: String, game_id: String) -> Result<String, String>

// Customization Commands
#[tauri::command]
async fn preview_theme_change(changes: HashMap<String, Value>) -> Result<(), String>

#[tauri::command]
async fn get_customization_presets() -> Result<Vec<Preset>, String>
```

### 4.2 Total Command Count
```
Core Commands:        6  (system, games info, etc)
Game Commands:        8  (launch, scan, etc)
Emulator Commands:    4  (list, launch, stop, etc)
Coin Commands:        6  (add, get, use, return, etc)
Timer Commands:       6  (start, pause, resume, etc)
Input Commands:       6  (devices, mappings, deadzone)
Config Commands:      3  (get, set, reload)
Operator Commands:    8  (auth, stats, PIN, etc)
Autoboot Commands:    3  (enable, disable, check)
Theme Commands:       6  (list, get, set, save, export, import)
Hardware Commands:    6  (list, test, calibrate, status) ✅
Media Commands:       5  (list, scan, import, get, organize)
Customization:        2  (preview, presets)
────────────────────────
TOTAL:               69 Tauri Commands
```

---

## 5. DATABASE SCHEMA EXPANSION

### 5.1 New Tables (Phase 5)
```sql
-- Theme Storage
CREATE TABLE themes (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    json_config TEXT NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author TEXT
);

-- Media Metadata
CREATE TABLE media_cache (
    id INTEGER PRIMARY KEY,
    system TEXT NOT NULL,
    folder TEXT NOT NULL,  -- Wheel, Box, Background, etc
    game_id TEXT,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    size_bytes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system, folder, game_id)
);

-- Customization Presets
CREATE TABLE customization_presets (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    colors_json TEXT,
    fonts_json TEXT,
    wheel_settings_json TEXT,
    media_settings_json TEXT,
    created_at TIMESTAMP,
    is_favorite BOOLEAN DEFAULT 0
);

-- Hardware Configuration
CREATE TABLE hardware_config (
    id INTEGER PRIMARY KEY,
    hardware_type TEXT,  -- 'none', 'gpio', 'arduino'
    gpio_pin INTEGER,
    serial_port TEXT,
    baud_rate INTEGER DEFAULT 9600,
    debounce_ms INTEGER DEFAULT 20,
    pulse_threshold_ms INTEGER DEFAULT 100,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    current_theme TEXT NOT NULL,
    show_wheels BOOLEAN DEFAULT 1,
    show_box_art BOOLEAN DEFAULT 1,
    show_backgrounds BOOLEAN DEFAULT 1,
    background_opacity REAL DEFAULT 0.7,
    animation_speed TEXT DEFAULT 'normal',  -- slow, normal, fast
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Total Table Count
```
Core:           3  (systems, games, emulators)
Sessions:       3  (sessions, profiles, achievements)
Management:     4  (coin_events, config, input_devices, save_states)
New (Phase 4):  1  (hardware_config) ✅
New (Phase 5):  5  (themes, media_cache, customization_presets, user_preferences, etc)
────────────────────
TOTAL:         16  Tables
```

---

## 6. INSTALLATION & DEPLOYMENT

### 6.1 Windows Installer Package
```
NeoCab-3.0-Setup.exe (300MB)
├── Tauri app bundle (~100MB)
├── WebView2 runtime (~80MB, if not installed)
├── All assets (themes, fonts, logos) (~50MB)
├── SQLite database template
├── ROM folders template
└── Uninstaller
```

**Installation:**
- C:\Program Files\NeoCab\
- Create: C:\Games\ (ROM storage)
- Create: C:\NeoCab\ (Config, themes, media)
- Register file associations
- Start Menu shortcuts
- Desktop shortcut (optional)

### 6.2 Linux AppImage Package
```
neocab-3.0-amd64.AppImage (250MB, single file)
├── Full Tauri runtime
├── All dependencies bundled
├── Assets, themes, fonts
└── No system packages required
```

**Installation:**
- chmod +x neocab-3.0-amd64.AppImage
- ./neocab-3.0-amd64.AppImage (auto-extracts to /tmp)
- ~/.local/share/applications/ (desktop integration)
- ~/Games/ (ROM storage)
- ~/.config/neocab/ (config, themes, media)

### 6.3 First-Run Wizard Flow
```
1. Language Selection
   ↓
2. License Agreement
   ↓
3. Select ROM Folders
   ↓
4. Scan for ROMs
   ↓
5. Select Theme
   ↓
6. Hardware Setup (GPIO/Arduino) ✅
   ↓
7. Control Calibration
   ↓
8. Set Operator PIN
   ↓
9. Create First Session
   ↓
10. Launch Main UI
```

---

## 7. RELEASE CHECKLIST

### Phase 4 (Current)
- [x] GPIO Coin Detection
- [x] Arduino Serial Interface
- [x] Coin Overlay UI
- [x] Hardware Calibration (75%)
- [ ] CoinManager Hardware Integration
- [ ] Full build test

### Phase 5.1: Advanced Themes
- [ ] Theme JSON schema
- [ ] CSS variable system
- [ ] 5+ built-in themes
- [ ] Theme editor UI
- [ ] Live preview system

### Phase 5.2: Media Management
- [ ] Media folder structure
- [ ] Media browser UI
- [ ] HyperSpin import
- [ ] Thumbnail generation

### Phase 5.3: Installer
- [ ] NSIS Windows installer
- [ ] Linux AppImage builder
- [ ] First-run wizard
- [ ] Auto-update system

### Phase 5.4: Quality
- [ ] Full QA testing
- [ ] Performance optimization
- [ ] Complete documentation
- [ ] Community review

---

## 8. SUCCESS CRITERIA

✅ **Professional Product**
- Comparable to HyperSpin + Maximus Arcade
- Fully customizable appearance
- Easy to deploy and use

✅ **Complete Hardware Support**
- GPIO coin detection (RPi)
- Arduino coin/solenoid control
- Joystick/gamepad universal support
- Timer with display

✅ **Rich Media Support**
- Wheel artwork (customizable size/position)
- Box art display
- Background images
- System logos + button icons

✅ **User-Friendly**
- First-run setup wizard
- Theme editor with live preview
- Media manager/browser
- One-click theme export/import

✅ **Production Ready**
- Standalone installers (no dependencies)
- Cross-platform (Windows, Linux, macOS future)
- Stable, tested codebase
- Comprehensive documentation

---

## 9. ESTIMATED TIMELINE

```
Current:  Phase 4 (60% done)              - 1 week finish
Next:     Phase 5.1-5.4 (Themes + Install)- 3-4 weeks
Later:    Phase 5 Emulators + CRT        - 4-6 weeks
Final:    Phase 7-8 Setup Wizard + Test  - 3-4 weeks
──────────────────────────────────────────────────
TOTAL:    v3.0 Complete                   - 10-12 weeks
```

---

**This is the roadmap to create a professional, complete, standalone arcade cabinet operating system.**
