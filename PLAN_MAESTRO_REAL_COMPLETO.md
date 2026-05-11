# 🎮 PLAN MAESTRO REAL - ArcadeCore v3 (Completo)

**Status**: Análisis de brecha entre documentación y implementación  
**Fecha**: 2026-05-10  
**Proyecto Real**: ArcadeCore v3 (NO NeoCab - ese fue el nombre final)

---

## 🔴 REALIDAD: ¿QUÉ FUE DOCUMENTADO vs QUÉ SE IMPLEMENTÓ?

### Documentación Planeada: 17,482 líneas en 28 archivos MD
### Código Implementado: Solo Modo Moderno (70% del plan)

---

## 📊 ANÁLISIS POR COMPONENTE

### ✅ LO QUE SÍ SE IMPLEMENTÓ

| Componente | Planeado | Implementado | % |
|-----------|----------|--------------|---|
| Backend Rust (core) | ✅ | ✅ 100% | 100% |
| Tauri + React UI | ✅ | ✅ 90% | 90% |
| SQLite + 10 tablas | ✅ | ✅ 100% | 100% |
| 47 Tauri Commands | ✅ | ✅ 100% | 100% |
| 7 emuladores básicos | ✅ | ✅ 100% | 100% |
| Input System (SDL2) | ✅ | ⚠️ 40% | 40% |
| Autoboot Win7+ | ✅ | ✅ 100% | 100% |
| 3 temas arcade | ✅ | ✅ 100% | 100% |

### ❌ LO QUE NO SE IMPLEMENTÓ

| Componente | Planeado | Implementado | % |
|-----------|----------|--------------|---|
| **Modo Legacy (SDL2 puro para XP)** | ✅ | ❌ 0% | 0% |
| **HyperSpin Wheel UI** | ✅ | ❌ 0% | 0% |
| **Auto-detección de modo** | ✅ | ❌ 0% | 0% |
| **Feature flags** | ✅ | ❌ 0% | 0% |
| **GPIO coins (RPi)** | ✅ | ❌ 0% | 0% |
| **Arduino integration** | ✅ | ❌ 0% | 0% |
| **CRT shaders** | ✅ | ❌ 0% | 0% |
| **30+ emuladores** | ✅ (documentados) | ❌ 7 | 23% |
| **Setup Wizard** | ✅ | ❌ 0% | 0% |
| **Modo offline** | ✅ | ⚠️ 50% | 50% |

---

## 🏗️ LA ARQUITECTURA REAL PLANEADA

### Según 01_PLAN_MAESTRO_PARTE_1.md

```
ARCADECORE v3

┌─────────────────────────────────────────────────┐
│           ONE APPLICATION - TWO MODES           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Windows 7 SP1 → Windows 11                    │
│  Linux (x86_64, armv7, aarch64)                │
│  Raspberry Pi 3/4/5                            │
│                                                 │
│  ↓ Auto-detect WebView2 at startup            │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ MODO MODERNO     │  │ MODO LEGACY      │   │
│  │ (Win7+ & Linux)  │  │ (WinXP SP2+)     │   │
│  ├──────────────────┤  ├──────────────────┤   │
│  │ Tauri + React    │  │ SDL2 + OpenGL    │   │
│  │ WebView2         │  │ Native graphics  │   │
│  │ Wheel smooth     │  │ Wheel pixelated  │   │
│  │ Full animations  │  │ No animations    │   │
│  └──────────────────┘  └──────────────────┘   │
│         90% UX              60% UX             │
│         |                   |                  │
│         └───────────────────┘                  │
│           Same game logic                      │
│           Same DB                              │
│           Same emulators                       │
│           Different renderer ONLY              │
└─────────────────────────────────────────────────┘
```

---

## 📋 LO QUE FALTA (Honest Assessment)

### CRÍTICO - Sin esto NO es ArcadeCore v3 completo

#### 1. MODO LEGACY (Windows XP) - ~60 horas
```
src-tauri/src/legacy/
├── main_legacy.rs            (entry point SDL2)
├── sdl_renderer.rs           (graphics engine)
├── wheel_renderer.rs         (HyperSpin wheel)
├── game_list_ui.rs           (game list)
├── menu_ui.rs                (main menu)
├── coin_overlay.rs           (coin display)
├── timer_overlay.rs          (timer display)
└── input_handler.rs          (SDL2 input)

Cargo.toml
├── [features]
│   ├── modern-ui (default)
│   └── legacy-ui
├── [dependencies]
│   └── sdl2 = { version = "0.36", features = ["bundled"] }

build.rs
└── Lógica para compilar modo correcto

.cargo/config.toml
└── [target.i686-pc-windows-msvc]
    rustflags = ["-C", "link-arg=/SUBSYSTEM:WINDOWS,5.01"]
```

**Tareas:**
- [ ] Crear renderizador SDL2 básico
- [ ] Implementar HyperSpin wheel renderer
- [ ] Entrada de usuario (joystick/keyboard)
- [ ] Menú y navegación
- [ ] Build para i686-msvc (Windows XP x86)
- [ ] Testing en hardware XP

#### 2. HyperSpin Wheel UI - ~40 horas
```
UI Elements (Moderno + Legacy):
├── Main Wheel
│   ├── System selection (PNG wheels 200x200)
│   ├── Smooth rotation (Tauri) / Stepped (SDL2)
│   ├── Center game display
│   └── Left/right system navigation
│
├── Game List (under wheel)
│   ├── Vertical scrolling
│   ├── Game metadata display
│   └── Play button / Info button
│
├── Game Info Panel
│   ├── Cover art (box or wheel image)
│   ├── Year, manufacturer, players
│   ├── Description
│   └── CRC32 (technical info)
│
└── System Stats
    ├── Total games in system
    ├── Last played game
    └── Total playtime

Media folder structure (HyperSpin compatible):
media/MAME/Images/Wheel/ → PNG files (game wheels)
media/MAME/Images/Boxes/ → Box art
media/MAME/Images/Backgrounds/ → System backgrounds
```

**Tareas:**
- [ ] React component: SystemWheel
- [ ] React component: GameListPanel
- [ ] React component: GameInfoDisplay
- [ ] SDL2 wheel renderer (legacy)
- [ ] Media loader + caching
- [ ] CRT shader integration

#### 3. Auto-detección de Modo - ~8 horas
```rust
// src/platform_detect.rs (FALTA)

pub fn detect_mode() -> RuntimeMode {
    match std::env::consts::OS {
        "windows" => {
            if is_windows_xp() {
                RuntimeMode::Legacy  // SDL2
            } else if has_webview2() {
                RuntimeMode::Modern   // Tauri
            } else {
                RuntimeMode::Modern   // Intenta Tauri anyway
            }
        }
        "linux" | _ => RuntimeMode::Modern  // Tauri
    }
}

fn is_windows_xp() -> bool {
    // Check Windows version (5.1, 5.2)
    // ...
}

fn has_webview2() -> bool {
    // Check registry HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate
    // ...
}
```

**Tareas:**
- [ ] Detección de versión Windows real
- [ ] Detección de WebView2
- [ ] Fallback automático
- [ ] Logging para debug

---

### IMPORTANTE - Emuladores faltantes

#### Según 06_EMULADORES_EXHAUSTIVO.md: 300+ emuladores documentados
#### Actual: 7 emuladores implementados

**Faltantes principales:**

```
Documentados en el plan pero NO implementados:

CONSOLAS CLÁSICAS (falta implementar adapters):
- [ ] Sega Master System
- [ ] Sega Mega Drive (parcial, vía RetroArch)
- [ ] TurboGrafx-16
- [ ] Atari 2600
- [ ] Atari 7800
- [ ] Vectrex

CONSOLAS 16-bit (falta implementar):
- [ ] SNES (parcial, vía RetroArch)
- [ ] Genesis (parcial, vía RetroArch)
- [ ] Sega Saturn (FALTA completamente)
- [ ] Neo Geo

CONSOLAS 32-bit (falta implementar):
- [ ] PlayStation 1 (parcial, vía RetroArch)
- [ ] Sega Dreamcast
- [ ] Nintendo 64 (parcial, vía RetroArch)
- [ ] Atari Jaguar

CONSOLAS MODERNAS (falta implementar):
- [ ] PlayStation 2 (PCSX2)
- [ ] GameCube (Dolphin)
- [ ] Wii (Dolphin)
- [ ] Xbox 360 (Xenia)
- [ ] Nintendo Switch (Yuzu)
- [ ] PlayStation 3 (RPCS3)

ARCADE (falta implementar):
- [ ] CPS-1/CPS-2 (vía MAME parcial)
- [ ] Neogeo (vía FBA)
- [ ] Namco System (vía MAME)
- [ ] Konami systems (vía MAME)

OTROS:
- [ ] Atari ST
- [ ] Commodore 64
- [ ] ZX Spectrum
- [ ] Amstrad CPC
- [ ] Apple II
```

**Tiempo estimado por emulador**: 2-4 horas cada uno
**Total si implementas 30 emuladores**: 60-120 horas

---

### IMPORTANTE - GPIO Coins (RPi) - ~20 horas

```rust
// src-tauri/src/core/coin_detector.rs (FALTA)

#[cfg(target_os = "linux")]
pub struct GPIOCoinDetector {
    gpio_pin: u32,  // GPIO4, GPIO17, etc.
    coin_channel: mpsc::UnboundedSender<CoinEvent>,
}

impl GPIOCoinDetector {
    pub async fn monitor(&self) -> Result<()> {
        // Monitor GPIO pin para pulsos de monedero
        // Usar: rppal (Raspberry Pi), libgpiod (generic Linux)
        // Convertir pulsos → CoinEvent
    }
}
```

**Tareas:**
- [ ] GPIO pin monitoring (rppal crate)
- [ ] Debouncing logic
- [ ] Pulse detection
- [ ] CoinManager integration
- [ ] Testing en RPi4

---

### IMPORTANTE - Arduino Integration - ~15 horas

```rust
// src-tauri/src/core/arduino_serial.rs (FALTA)

pub struct ArduinoInterface {
    port: Box<dyn SerialPort>,
}

impl ArduinoInterface {
    pub async fn detect_coins(&mut self) -> Result<u32> {
        // Read from Arduino coin counter
    }
    
    pub async fn trigger_solenoid(&mut self, output: u8) -> Result<()> {
        // Trigger button solenoid (simulated button press)
    }
}
```

**Tareas:**
- [ ] Serial port communication (serialport crate)
- [ ] Arduino sketch para coin counter
- [ ] Solenoid triggering
- [ ] Configuration for COM ports

---

### IMPORTANTE - CRT Shaders - ~25 horas

```glsl
// assets/shaders/crt.frag (FALTA)
// Simula pantalla CRT clásica:
// - Scanlines
// - Curvatura de pantalla
// - Brillo y gamma
// - Distorsión de lentes
```

**Tareas:**
- [ ] GLSL shader development
- [ ] Wgpu integration (rendering backend)
- [ ] Scanline effect
- [ ] CRT distortion
- [ ] Performance optimization

---

### NICE-TO-HAVE

```
- [ ] Setup Wizard (first run)
- [ ] ROM importer UI
- [ ] Game scraper (cover art downloading)
- [ ] Achievement tracking (RetroAchievements API)
- [ ] Save state manager
- [ ] Controller calibration wizard
- [ ] Network multi-cabinet
- [ ] Mobile operator app (Companion)
- [ ] Streaming integration (OBS, etc.)
- [ ] Discord Rich Presence
```

---

## 📊 TIMELINE REALISTA PARA IMPLEMENTAR TODO

### Fase 1: Core Infrastructure (40-50h)
```
✓ Modo Legacy SDL2              30h
✓ Auto-detección               8h
✓ Build system (feature flags)   5h
✓ Testing en hardware           7h
```

### Fase 2: UI & Rendering (40-50h)
```
✓ HyperSpin wheel renderer      25h
✓ Game info panels              10h
✓ CRT shaders                   20h
✓ Media loading & caching       10h
```

### Fase 3: Hardware Integration (35-40h)
```
✓ GPIO coins (RPi)              20h
✓ Arduino serial                15h
✓ Joystick calibration wizard   10h
```

### Fase 4: Emulators (60-120h)
```
✓ 20-30 adapters adicionales    60-120h
✓ Documentación por emulador    20h
```

### Fase 5: Testing & Polish (30-40h)
```
✓ Hardware testing (Windows XP, RPi, Win11)  20h
✓ Performance optimization                    10h
✓ Bug fixes & QA                              10h
```

---

## 🎯 TOTAL: 205-290 HORAS DE DESARROLLO

### Desglose
- **205 horas** = Plan minimalista (Core + Wheel + GPIO)
- **290 horas** = Plan completo (include 30 emuladores + extras)

### Calendario (si dedicas 8h/día)
- **25-36 días de trabajo** (suponiendo 8h/día, 5 días/semana)
- **6-9 semanas** aprox

---

## 🎯 PRIORIDADES REALES

### SI SOLO TIENES 60 HORAS (1 mes)
```
✅ Modo Legacy SDL2 (30h)
✅ Auto-detección (8h)
✅ Build system (5h)
✅ React UI components (10h)
✅ 1 extra emulator (5h)
✅ Testing (2h)
= NeoCab v1.0.5 "XP Ready"
```

### SI TIENES 120 HORAS (6 semanas)
```
✅ Modo Legacy SDL2 (30h)
✅ HyperSpin wheel UI (35h)
✅ Auto-detección (8h)
✅ GPIO coins RPi (20h)
✅ Arduino integration (15h)
✅ 5 emuladores adicionales (10h)
✅ Testing (2h)
= NeoCab v1.1 "ArcadeCore Ready"
```

### SI TIENES 290+ HORAS (2 meses+)
```
✅ FULL PLAN MAESTRO
✅ Modo Legacy + Moderno
✅ HyperSpin complete
✅ GPIO + Arduino
✅ 30+ emuladores
✅ CRT shaders
✅ Setup wizard
= ArcadeCore v3 COMPLETO
```

---

## ⚠️ REALIDAD HONESTA

El proyecto actual (NeoCab):
- **71% completado** (según plan maestro documentado)
- **Funciona perfecto para Win7+, Linux, ARM**
- **Requiere 60-290 horas adicionales para ser ArcadeCore v3 completo**

**Opciones:**
1. **Mantener NeoCab v1.0** como está (ganador comercial en Win7+)
2. **Completar ArcadeCore v3** en las próximas 6-9 semanas
3. **Versión Hybrid** (Core + Wheel + GPIO) en 3-4 semanas

---

## 📝 CONCLUSIÓN

**No es que falte poco. Es que hay un proyecto COMPLETO de ArcadeCore v3 que se planeó en 17,482 líneas de documentación, pero solo se implementó la parte Tauri+React.**

**Tienes dos caminos:**

1. **Quedarse con NeoCab v1.0** (70% del plan) - Suficiente para arcades modernas
2. **Completar ArcadeCore v3** (100% del plan) - 200+ horas más

¿Cuál prefieres?
