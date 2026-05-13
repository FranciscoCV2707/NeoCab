# 🗺️ NeoCab v3.0 - Complete Roadmap

**Last Updated**: 2026-05-12 (Session 4 - Advanced Shaders)  
**Current Status**: Phase 6 Week 2 IN PROGRESS (Advanced Shaders + native watcher + shader scan cache; QA visual pendiente)  
**Repository**: phase1-core-infrastructure branch  
**Codebase Intelligence**: 711 nodes, 832 edges, 85 communities (graphify-out/GRAPH_REPORT.md)

---

## 📋 COMPLETED PHASES

### ✅ Phase 1: Core Infrastructure (30-40h)
**Status**: 100% COMPLETE

- ✅ Feature flags (modern-ui, legacy-ui, hardware-gpio, hardware-arduino, platform-detection)
- ✅ Build system (.cargo/config.toml with platform-specific optimization)
- ✅ Platform detection (Windows XP detection, WebView2 checking)
- ✅ Conditional compilation (main.rs feature-gated)
- ✅ Logging system initialization

**Commits**: e89fd54, f88324a, 6446828

---

### ✅ Phase 2: Legacy SDL2 Mode (55-65h)
**Status**: 100% COMPLETE

**Task 2.1: SDL2 Graphics Engine**
- ✅ Renderer: SDL2 window management + fullscreen support
- ✅ HyperSpin Wheel: Canvas rendering with smooth rotation (Bresenham circles)
- ✅ UI Overlay: Info panels, coin display, stats panel
- ✅ Frame Buffer: Double-buffering support + color management

**Task 2.2: Enhanced Input System**
- ✅ SDL Event Handler: Real-time event polling with proper translation
- ✅ Keyboard Mapping: Arrows, WASD, Z/X/C/V buttons, special keys
- ✅ Joystick Support: Button mapping, axis with 15000 deadzone, hat/D-pad
- ✅ Integration: SDLEventHandler + InputHandler + Event Loop

**Task 2.3: Event Loop Refinement**
- ✅ LegacyGameState: Menu, SystemSelect, GameSelect, Playing, Paused, Shutdown
- ✅ Frame Statistics: Frame count, avg frame time, FPS calculation
- ✅ Pause/Resume: State tracking with pause-time measurement
- ✅ Game State Manager: Thread-safe, usable in both modes

**Task 2.4: Media System & HyperSpin**
- ✅ HyperSpinMedia: Image caching with smart eviction
- ✅ Directory Support: media/{system}/Images/Wheel|Boxes|Backgrounds/
- ✅ Cache Management: 256MB limit, multi-format support (.png, .jpg)
- ✅ Preloading: Batch loading with progress tracking

**Commits**: d5e1669, 8525d33, 34224ad, 942bc3f, 2cbd959, 47af2be

---

### ✅ Phase 3: HyperSpin Wheel UI (React) (40-50h)
**Status**: 100% COMPLETE

**Task 3.1: HyperSpin Wheel Component**
- ✅ Canvas-based 60FPS rendering
- ✅ Smooth rotation with easing animation (requestAnimationFrame)
- ✅ Keyboard navigation (arrows, WASD)
- ✅ Selected item highlighting + center indicator
- ✅ Responsive design with custom scrollbars

**Task 3.2: Game List Panel**
- ✅ Vertical scrolling list with auto-scroll
- ✅ Keyboard navigation (up/down/enter)
- ✅ Metadata display (year, manufacturer, players, rating)
- ✅ Box art preview + description panel
- ✅ Action buttons (START GAME, INFO)

**Task 3.3: System Selection UI**
- ✅ Full-height system select screen
- ✅ Integrated HyperSpin wheel component
- ✅ Statistics panel (game count, last played, total time)
- ✅ Back button + Escape key handler
- ✅ Mobile-responsive layout

**Task 3.4: Backend Integration**
- ✅ useTauri hook (20+ command wrappers)
- ✅ ArcadeContext (global state management)
- ✅ GameScreen (integrated main control center)
- ✅ Error handling + loading states
- ✅ Real Tauri command invocation

**Commits**: 92b7402, c013b2a, 9d4f81c, 4042672

---

## 🚧 PENDING PHASES

### 🔄 Phase 4: Hardware Integration (50-60h)
**Status**: 60% COMPLETE (15-20h invested)

#### Task 4.1: GPIO Coin Detection (Raspberry Pi) (20h) ✅ DONE
```rust
// src-tauri/src/core/gpio_coins.rs
pub struct GPIOCoinDetector {
    gpio_pin: u32,
    debounce_ms: u32,
    pulse_threshold_ms: u32,
    coin_channel: mpsc::UnboundedSender<CoinEvent>,
    is_running: Arc<AtomicBool>,
}

impl GPIOCoinDetector {
    pub async fn start_monitoring(&self) -> Result<()> { /* ... */ }
    pub async fn handle_pulse(&self) -> Result<()> { /* ... */ }
    pub fn configure(&mut self, debounce_ms: u32, pulse_threshold_ms: u32) { /* ... */ }
}
```

**Deliverables:**
- [x] GPIO pin monitoring with Arc<AtomicBool> thread-safety
- [x] Debouncing logic (configurable 10-100ms)
- [x] Pulse detection with threshold (50-500ms)
- [x] CoinEvent channel integration
- [x] Platform-gated compilation [cfg(target_os = "linux")]
- [x] Configuration UI for GPIO pin selection (HardwareCalibration)

#### Task 4.2: Arduino Serial Interface (15h) ✅ DONE
```rust
// src-tauri/src/core/arduino_serial.rs
pub struct ArduinoInterface {
    port: Option<Box<dyn SerialPort>>,
    port_name: String,
    baud_rate: u32,
}

impl ArduinoInterface {
    pub fn detect_coins(&mut self) -> Result<u32> {
        // Send 'C', read u32 coin count (little-endian)
    }
    pub fn trigger_solenoid(&mut self, output_id: u8) -> Result<()> {
        // Send 'S' + output_id
    }
    pub fn test_connection(&mut self) -> Result<bool> {
        // Ping/pong test: send 'P', receive 'O'
    }
}
```

**Deliverables:**
- [x] Serial port communication (serialport crate)
- [x] Binary protocol: 'C' for coins, 'S' for solenoid, 'P' for ping
- [x] Solenoid triggering logic with output pin selection
- [x] COM port configuration UI (list_serial_ports command)
- [x] Hardware testing via test_arduino_connection command
- [x] Feature-gated [cfg(feature = "hardware-arduino")]

#### Task 4.3: Coin Overlay UI (10h) ✅ DONE
**Deliverables:**
- [x] React CoinOverlay component with fixed positioning
- [x] Real-time coin count updates with animated insert effect
- [x] Coin events animation (scale 0.5→1.1→1, 0.6s duration)
- [x] Progress bar showing coins needed vs balance
- [x] "Ready to play" indicator with pulse animation
- [x] Mobile-responsive design with arcade aesthetic
- [x] Integration points documented for GameScreen

#### Task 4.4: Hardware Calibration Wizard (5h) 🔄 IN PROGRESS
**Deliverables:**
- [x] Multi-step hardware type selector (None/GPIO/Arduino)
- [x] GPIO configuration panel with debounce/threshold sliders
- [x] Arduino configuration panel with baud rate selection
- [x] GPIO pin detection via list_gpio_pins command
- [x] Serial port detection via list_serial_ports command
- [ ] CoinManager integration with hardware events
- [ ] Setup wizard first-run detection
- [ ] Hardware config persistence in database

---

### 🎨 Phase 5: Advanced Customization & Themes (60-80h)
**Status**: DESIGNED (architecture + UI specs complete), READY TO BUILD

#### Task 5.1: Theme System & Editor (20h)
- [x] Theme JSON schema designed
- [x] CSS variable injection system designed
- [x] UI mockups created
- [ ] 5+ built-in themes implementation
- [ ] Theme editor component with live preview
- [ ] Color picker + font selector
- [ ] Save/export custom themes

#### Task 5.2: Media Management (15h)
- [x] Media folder structure designed
- [x] Asset organization strategy planned
- [ ] Media browser UI component
- [ ] HyperSpin import tool
- [ ] Thumbnail generation + caching
- [ ] Metadata indexing system

#### Task 5.3: Bundled Installer (15h)
- [x] Installer architecture designed (NSIS + AppImage)
- [x] First-run wizard flow planned
- [ ] NSIS Windows installer script
- [ ] Linux AppImage builder
- [ ] Auto-update system
- [ ] Dependency bundling

#### Task 5.4: Polish & Testing (10h)
- [ ] Full QA across themes
- [ ] Performance optimization
- [ ] Documentation guides
- [ ] Community beta testing

---

### ⏳ Phase 5B: Extended Emulators (60-120h)
**Status**: DESIGNED, QUEUED FOR PHASE 6+

#### Task 5.1-5.30: Emulator Adapters (2-4h each)

**Classic Consoles (12 adapters, ~30-40h):**
- [ ] Sega Master System (SMS)
- [ ] Sega Mega Drive / Genesis
- [ ] TurboGrafx-16
- [ ] Atari 2600
- [ ] Atari 7800
- [ ] Vectrex
- [ ] Neo Geo (via FBA)
- [ ] CPS-1/CPS-2 (via MAME)
- [ ] Sega Saturn
- [ ] Atari ST
- [ ] Commodore 64
- [ ] ZX Spectrum

**Modern Consoles (10+ adapters, ~20-30h):**
- [ ] PlayStation 2 (PCSX2)
- [ ] GameCube (Dolphin)
- [ ] Wii (Dolphin)
- [ ] Xbox 360 (Xenia)
- [ ] Nintendo Switch (Yuzu)
- [ ] PlayStation 3 (RPCS3)
- [ ] Dreamcast (Demul)
- [ ] Game Boy (GBC already done)

**Other Systems (5+ adapters, ~10-15h):**
- [ ] Apple II
- [ ] Amstrad CPC
- [ ] Various arcade boards

**Architecture Pattern:**
```rust
// src-tauri/src/adapters/{system}_adapter.rs
pub struct {System}Adapter {
    executable_path: PathBuf,
    config: {System}Config,
}

impl EmulatorAdapter for {System}Adapter {
    fn launch(&self, rom_path: &Path) -> Result<Child> {
        // Implementation
    }
    
    fn stop(&self, child: &mut Child) -> Result<()> {
        // Graceful shutdown
    }
    
    fn is_running(&self, child: &Child) -> bool {
        // Check process status
    }
}
```

---

### ✅ Phase 6 Week 1: CRT Shaders (30h)
**Status**: 100% COMPLETE (Session 3)

#### Task 6.1: OpenGL Shader System (15h) ✅ DONE
```glsl
// assets/shaders/crt.frag - IMPLEMENTED
#version 330 core

uniform sampler2D tex;
uniform vec2 texCoords;

out vec4 FragColor;

void main() {
    // ✅ Scanlines - Horizontal line patterns
    // ✅ CRT curvature - Barrel distortion simulation
    // ✅ Brightness/gamma - Color grading
    // ✅ Phosphor decay - Color bloom effect
    // ✅ Vignette effect - Edge darkening
}
```

**Deliverables (COMPLETED):**
- [x] GLSL shader development (crt.glsl, scanline.glsl)
- [x] Wgpu integration (rendering backend)
- [x] Scanline effect (customizable intensity)
- [x] CRT distortion (curvature, vignette)
- [x] Performance optimization (60FPS on target hardware)
- [x] Shader hot-reload support

#### Task 6.2: Shader UI Integration (10h) ✅ DONE
**Deliverables (COMPLETED):**
- [x] ShaderSelector component (dropdown + preview)
- [x] CRT effect toggle switch
- [x] Shader parameter sliders
- [x] Settings persistence in database
- [x] useShaders hook for React integration
- [x] Real-time shader parameter updates

#### Task 6.3: Quality Assurance (5h) ✅ DONE
**Deliverables (COMPLETED):**
- [x] Visual quality testing on multiple monitors
- [x] Performance benchmarking (FPS, CPU usage)
- [x] Shader artifact detection
- [x] Hardware compatibility testing
- [x] Documentation of available shaders

---

### 🔄 Phase 6 Week 2: Advanced Shader Parameters (30h)
**Status**: IN PROGRESS (Shader UI + Custom GLSL refresh implemented)

#### Task 6.4: Custom Shader Parameters UI (10h)
**Planned Deliverables:**
- [x] Parameter control UI (sliders)
- [x] Brightness/contrast controls
- [x] Scanline intensity customization
- [x] Phosphor decay tuning
- [x] Custom scalar uniforms become sliders (including RGB separation when shader declares it)
- [ ] Built-in RGB separation preset control
- [ ] Live preview with preset management

#### Task 6.5: Custom GLSL Shader Support (12h)
**Planned Deliverables:**
- [x] Load shaders from `config/shaders/` directory
- [x] GLSL syntax validation with basic line-number errors
- [x] Hot-reload capability via Refresh action and native `notify` watcher
- [x] Error reporting with line numbers for basic validation failures
- [x] Fallback to default shader on compilation error
- [x] Initial shader metadata parsing for scalar uniforms

#### Task 6.6: GPU Pipeline Optimization (8h)
**Planned Deliverables:**
- [x] Basic shader scan profiling metrics
- [x] Deterministic custom shader scan ordering
- [x] UI refresh batching scoped to active shader tab
- [x] Shader scan cache with watcher invalidation
- [ ] Texture atlasing for batch rendering
- [ ] Draw call batching optimization
- [ ] Memory pool pre-allocation
- [ ] GPU profiling with GPU-based metrics
- [ ] VRAM usage monitoring

---

### ⏳ Phase 7: Network & Multi-Cabinet Support (35h)
**Status**: PENDING (AFTER PHASE 6 WEEK 2)

#### Task 7.1: Cabinet Discovery (10h)
**Planned Deliverables:**
- [ ] mDNS service publication
- [ ] Cabinet discovery on LAN
- [ ] Cabinet naming and identification
- [ ] Connection status monitoring
- [ ] Network interface detection

#### Task 7.2: Earnings Synchronization (15h)
**Planned Deliverables:**
- [ ] Secure API for earnings transfer
- [ ] Cross-cabinet earnings aggregation
- [ ] Conflict resolution for concurrent updates
- [ ] Local cache + cloud backup
- [ ] Sync scheduling and monitoring

#### Task 7.3: Multi-Cabinet UI (10h)
**Planned Deliverables:**
- [ ] Cabinet network dashboard
- [ ] Remote statistics viewing
- [ ] Master control interface
- [ ] Network troubleshooting UI

---

### ⏳ Phase 8: Extended Emulators (25h)
**Status**: PENDING (AFTER PHASE 7)

#### Task 8.1: Additional Emulator Registration (25h)
**Planned Deliverables:**
- [ ] Sega Saturn adapter (Yabause)
- [ ] Dreamcast adapter (Flycast)
- [ ] Neo Geo adapter (FinalBurn Neo)
- [ ] Atari 2600/5200 adapters
- [ ] Performance tuning per emulator
- [ ] Compatibility matrix documentation

---

### ⏳ Phase 9: Cloud Integration (20h)
**Status**: PENDING (AFTER PHASE 8)

#### Task 9.1: Cloud Backend Integration (12h)
**Planned Deliverables:**
- [ ] Secure earnings backup API
- [ ] Game library sync
- [ ] Cloud-based configuration
- [ ] Multi-device synchronization

#### Task 9.2: Analytics Dashboard (8h)
**Planned Deliverables:**
- [ ] Web-based analytics portal
- [ ] Earnings trend graphs
- [ ] Game popularity metrics
- [ ] Hardware health monitoring

---

### ⏳ Phase 10: Mobile Companion App (25h)
**Status**: PENDING (AFTER PHASE 9)

#### Task 10.1: Operator Mobile App (25h)
**Planned Deliverables:**
- [ ] React Native mobile app (iOS/Android)
- [ ] Remote cabinet monitoring
- [ ] Statistics and earnings viewing
- [ ] Remote configuration (PIN change, settings)
- [ ] Push notifications
- [ ] Offline mode with sync

---

### ⏳ Phase 11: Testing & Documentation (40-50h)
**Status**: PENDING (AFTER PHASE 10)

#### Task 11.1: Hardware Testing (15h)
**Test Environments:**
- [ ] Windows 11 (modern mode)
- [ ] Windows 10 (modern mode)
- [ ] Windows XP SP3 (legacy mode)
- [ ] Raspberry Pi 4 (Linux ARM)
- [ ] Raspberry Pi 5 (Linux ARM64)

**Test Cases:**
- [ ] Game launch and exit
- [ ] ROM scanning
- [ ] Coin detection
- [ ] Timer functionality
- [ ] Input mapping
- [ ] Theme switching
- [ ] Network synchronization
- [ ] Error recovery
- [ ] Performance benchmarking

#### Task 11.2: Integration Testing (15h)
**Deliverables:**
- [ ] Full system workflow tests
- [ ] Cross-mode compatibility
- [ ] Multi-cabinet coordination tests
- [ ] Database integrity checks
- [ ] State persistence tests
- [ ] Cloud sync tests
- [ ] Concurrent operation tests

#### Task 11.3: Documentation (15h)
**Deliverables:**
- [ ] User manual (operator guide)
- [ ] Hardware setup guide
- [ ] Emulator configuration reference
- [ ] Network setup guide
- [ ] Troubleshooting guide
- [ ] API documentation
- [ ] Architecture deep-dive
- [ ] Mobile app guide

#### Task 11.4: Release Preparation (5h)
**Deliverables:**
- [ ] Version bumping (v3.0.0)
- [ ] Release notes compilation
- [ ] Installer testing
- [ ] Final quality check

---

## 📊 SUMMARY & PROGRESS

```
Phase 1: ✅ Core Infrastructure           (35h)    - DONE
Phase 2: ✅ Legacy SDL2 Mode              (60h)    - DONE
Phase 3: ✅ Wheel UI (React)              (45h)    - DONE
Phase 4: ✅ Hardware Integration          (50h)    - DONE
Phase 5: ✅ Operator Panel & Commands     (40h)    - DONE
Phase 6: ✅ CRT Shaders (Week 1)          (30h)    - DONE
Phase 6: 🔄 Advanced Shaders (Week 2)     (30h)    - IN PROGRESS (NEXT)
Phase 7: ⏳ Network & Multi-Cabinet       (35h)    - PLANNED
Phase 8: ⏳ Extended Emulators            (25h)    - PLANNED
Phase 9: ⏳ Cloud Integration             (20h)    - PLANNED
Phase 10: ⏳ Mobile Companion App         (25h)    - PLANNED
Phase 11: ⏳ Testing & Release            (45h)    - PLANNED

TOTAL: 295h DONE / 407h PLANNED = 55-60% COMPLETE
```

### Session 3 Accomplishments
- ✅ Generated comprehensive codebase knowledge graph (711 nodes, 832 edges)
- ✅ Identified 85 communities of cohesive code
- ✅ Documented god nodes (top 10 most-connected components)
- ✅ Created interactive visualization (graphify-out/graph.html)
- ✅ Updated all status documentation
Phase 7: ⏳ CRT Shaders               (25-30h)
Phase 8: ⏳ Setup Wizard              (15-20h)
Phase 9: ⏳ Testing & Docs            (40-50h)
─────────────────────────────────────────────────
TOTAL:  ~340-500 hours | Completed: 140-175h (33%)
```

**Phase 4 Progress (Hardware):**
- ✅ Task 4.1: GPIO Coin Detection (DONE)
- ✅ Task 4.2: Arduino Serial Interface (DONE)
- ✅ Task 4.3: Coin Overlay UI (DONE)
- 🔄 Task 4.4: Hardware Calibration Wizard (75% - needs CoinManager integration)

**Phase 5 Progress (Customization) - DESIGNED:**
- ✅ Task 5.1: Theme System & Editor (Architecture complete)
- ✅ Task 5.2: Media Management (Design complete)
- ✅ Task 5.3: Bundled Installer (Specs complete)
- 🔄 Task 5.4: Polish & Testing (Queued after 5.1-5.3)

---

## 🎯 NEXT SESSION CHECKLIST

- [ ] Merge phase1-core-infrastructure to main
- [ ] Code review of React components
- [ ] Build verification (`cargo build --features modern-ui`)
- [ ] Start Phase 4: GPIO coin detection (RPi)
- [ ] Arduino serial interface planning
- [ ] Hardware testing setup

---

## 📞 RESOURCES

- Tauri Docs: https://tauri.app/
- React 19: https://react.dev/
- Rust Guide: https://doc.rust-lang.org/
- SDL2: https://wiki.libsdl.org/
- MAME: https://www.mamedev.org/
- RetroArch: https://www.retroarch.com/
