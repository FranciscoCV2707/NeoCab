# 🗺️ NeoCab v3.0 - Complete Roadmap

**Last Updated**: 2026-05-10  
**Current Status**: Phase 3/8 Complete (29% progress - 125-155 / 340-470 hours)  
**Repository**: phase1-core-infrastructure branch

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

### ⏳ Phase 4: Hardware Integration (50-60h)
**Status**: NOT STARTED

#### Task 4.1: GPIO Coin Detection (Raspberry Pi) (20h)
```rust
// src-tauri/src/core/gpio_coins.rs
pub struct GPIOCoinDetector {
    gpio_pin: u32,
    coin_channel: mpsc::UnboundedSender<CoinEvent>,
}

impl GPIOCoinDetector {
    pub async fn monitor(&self) -> Result<()> {
        // Monitor GPIO pin for coin pulses
        // Use: rppal crate for RPi, libgpiod for generic Linux
        // Convert pulses → CoinEvent → CoinManager
    }
}
```

**Deliverables:**
- [ ] GPIO pin monitoring (rppal crate for RPi4/5)
- [ ] Debouncing logic (20ms + 100ms hold)
- [ ] Pulse detection and counting
- [ ] CoinManager integration
- [ ] Testing on physical RPi4
- [ ] Configuration UI for GPIO pin selection

#### Task 4.2: Arduino Serial Interface (15h)
```rust
// src-tauri/src/core/arduino_serial.rs
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

**Deliverables:**
- [ ] Serial port communication (serialport crate)
- [ ] Arduino sketch for coin counter (C++)
- [ ] Solenoid triggering logic
- [ ] COM port configuration UI
- [ ] Hardware testing and calibration

#### Task 4.3: Coin Overlay UI (10h)
**Deliverables:**
- [ ] React coin display component
- [ ] Real-time coin count updates
- [ ] Coin events animation
- [ ] Integration with GameScreen

#### Task 4.4: Hardware Calibration Wizard (5h)
**Deliverables:**
- [ ] Multi-step calibration UI
- [ ] GPIO pin detection and testing
- [ ] Arduino COM port detection
- [ ] Coin pulse verification

---

### ⏳ Phase 5: Extended Emulators (60-120h)
**Status**: NOT STARTED

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

### ⏳ Phase 6: CRT Shaders (25-30h)
**Status**: NOT STARTED

#### Task 6.1: OpenGL Shader System (15h)
```glsl
// assets/shaders/crt.frag
#version 330 core

uniform sampler2D tex;
uniform vec2 texCoords;

out vec4 FragColor;

void main() {
    // Scanlines
    // CRT curvature
    // Brightness/gamma
    // Lens distortion
    // Vignette effect
}
```

**Deliverables:**
- [ ] GLSL shader development
- [ ] Wgpu integration (rendering backend)
- [ ] Scanline effect (customizable intensity)
- [ ] CRT distortion (curvature, vignette)
- [ ] Performance optimization

#### Task 6.2: Shader UI Integration (10h)
**Deliverables:**
- [ ] Shader selection dropdown
- [ ] CRT effect toggle
- [ ] Shader parameter sliders
- [ ] Settings persistence

---

### ⏳ Phase 7: Setup Wizard (15-20h)
**Status**: NOT STARTED

#### Task 7.1: Multi-Step Wizard Component (15h)
```tsx
// src/components/wizard/SetupWizard.tsx
const steps = [
    { id: 1, title: "Welcome", component: WelcomeStep },
    { id: 2, title: "ROM Paths", component: RomPathsStep },
    { id: 3, title: "Emulators", component: EmulatorsStep },
    { id: 4, title: "Hardware", component: HardwareStep },
    { id: 5, title: "Controls", component: ControlsStep },
    { id: 6, title: "Coins", component: CoinSetupStep },
    { id: 7, title: "Scan ROMs", component: ScanStep },
    { id: 8, title: "Finish", component: FinishStep },
];
```

**Deliverables:**
- [ ] Welcome step
- [ ] ROM directory selection
- [ ] Emulator enable/disable
- [ ] Hardware configuration (GPIO/Arduino)
- [ ] Input calibration
- [ ] Coin system setup
- [ ] ROM scanning and indexing
- [ ] Configuration summary

#### Task 7.2: First-Run Detection (5h)
**Deliverables:**
- [ ] First-run flag in database
- [ ] Auto-trigger wizard on first launch
- [ ] Skip option for existing installations

---

### ⏳ Phase 8: Testing & Documentation (40-50h)
**Status**: NOT STARTED

#### Task 8.1: Hardware Testing (15h)
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
- [ ] Error recovery
- [ ] Performance benchmarking

#### Task 8.2: Integration Testing (15h)
**Deliverables:**
- [ ] Full system workflow tests
- [ ] Cross-mode compatibility
- [ ] Database integrity checks
- [ ] State persistence tests
- [ ] Concurrent operation tests

#### Task 8.3: Documentation (15h)
**Deliverables:**
- [ ] User manual (operator guide)
- [ ] Hardware setup guide
- [ ] Emulator configuration reference
- [ ] Troubleshooting guide
- [ ] API documentation
- [ ] Architecture deep-dive

#### Task 8.4: Performance Optimization (5h)
**Deliverables:**
- [ ] Profile rendering (React + Canvas)
- [ ] Optimize database queries
- [ ] Memory leak detection
- [ ] Reduce startup time

---

## 📊 SUMMARY

```
Phase 1: ✅ Core Infrastructure     (30-40h)  - DONE
Phase 2: ✅ Legacy SDL2 Mode       (55-65h)  - DONE
Phase 3: ✅ Wheel UI (React)       (40-50h)  - DONE
Phase 4: ⏳ Hardware Integration    (50-60h)  - NEXT
Phase 5: ⏳ Extended Emulators      (60-120h)
Phase 6: ⏳ CRT Shaders             (25-30h)
Phase 7: ⏳ Setup Wizard            (15-20h)
Phase 8: ⏳ Testing & Docs          (40-50h)
─────────────────────────────────────────────────
TOTAL:  ~340-470 hours | Completed: 125-155h (29%)
```

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
