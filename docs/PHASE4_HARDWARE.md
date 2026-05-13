# Phase 4: Hardware Integration - NeoCab v3.0

**Status:** 30% Complete (Task 4.1 & 4.3 done, 4.2 in progress, 4.4 planned)  
**Hours invested:** 15-20h / 50-60h total for phase  
**Target completion:** Next session (Task 4.2 completion + 4.4 implementation)

---

## Task 4.1: GPIO Coin Detection ✅ DONE

### Implementation: `src-tauri/src/core/gpio_coins.rs`

**Structure:**
```rust
pub struct GPIOCoinDetector {
    gpio_pin: u32,
    debounce_ms: u32,
    pulse_threshold_ms: u32,
    coin_channel: mpsc::UnboundedSender<CoinEvent>,
    is_running: Arc<AtomicBool>,
}

pub struct GPIOConfig {
    enabled: bool,
    gpio_pin: u32,
    debounce_ms: u32,
    pulse_threshold_ms: u32,
}
```

**Methods:**
- `new()` - Create detector with default debounce (20ms), pulse threshold (100ms)
- `start_monitoring()` - Async GPIO monitoring loop
- `stop_monitoring()` - Stop monitoring and cleanup
- `handle_pulse()` - Send CoinEvent to channel
- `configure()` - Update debounce/threshold with bounds (10-100ms, 50-500ms)
- `test_gpio()` - GPIO pin accessibility test
- `is_active()` - Check if monitoring is running

**Features:**
- Platform-gated with `[cfg(target_os = "linux")]`
- Mock implementations for non-Linux platforms
- Proper error handling with `Result<T>`
- Logging via `tracing` crate
- Arc<AtomicBool> for thread-safe state management
- Default config: GPIO 4 (BCM), debounce 20ms, pulse 100ms

---

## Task 4.2: Arduino Serial Interface ✅ DONE

### Implementation: `src-tauri/src/core/arduino_serial.rs`

**Structure:**
```rust
pub struct ArduinoInterface {
    port: Option<Box<dyn SerialPort>>,
    port_name: String,
    baud_rate: u32,
    is_connected: bool,
}

pub struct ArduinoConfig {
    enabled: bool,
    port_name: String,
    baud_rate: u32,
    coin_multiplier: u32,
    solenoid_pins: Vec<u8>,
}
```

**Methods:**
- `new()` - Create interface with port name & baud rate
- `connect()` - Open serial port with 10s timeout
- `disconnect()` - Close port and reset state
- `detect_coins()` - Send 'C' command, read u32 coin count (little-endian)
- `trigger_solenoid(output_id)` - Send 'S' + output_id to solenoid
- `test_connection()` - Ping/pong test ('P' send, 'O' receive)
- `list_ports()` - Enumerate available serial ports

**Features:**
- Feature-gated with `[cfg(feature = "hardware-arduino")]`
- Mock implementations when feature disabled
- Serial communication: 10-byte timeout on connect
- Binary protocol (single-byte commands)
- Platform-specific port defaults (COM3 Windows, /dev/ttyUSB0 Linux, /dev/tty.usbserial Mac)
- Default baud rate: 9600
- Solenoid pins: [2, 3, 4, 5] (Arduino digital pins)

**Arduino Protocol:**
```
Coin Detection:
  Send: 'C' (1 byte)
  Receive: 4 bytes (u32 little-endian)

Solenoid Trigger:
  Send: 'S' + output_id (2 bytes)
  No response

Connection Test:
  Send: 'P' (1 byte)
  Receive: 'O' (1 byte)
```

---

## Task 4.3: Coin Overlay UI ✅ DONE

### Implementation: React Components

#### CoinOverlay.tsx
**Props:**
```typescript
visible: boolean
balance: number
coinsNeeded: number
isGameRunning: boolean
animateCoin?: boolean
```

**Features:**
- Fixed position overlay (top-right)
- Animated coin insert effect (scale + fade)
- Coin count display with arcade font (Courier New)
- Progress bar showing coins vs. needed
- "Ready to play" indicator when sufficient coins
- Responsive design (mobile-friendly)
- Arcade orange/yellow color scheme

**Styling:**
- Gradient background (#ff6b00 to #ff8c00)
- Yellow border (#ffcc00)
- Box-shadow glow effect
- Pulse animation on ready state
- Scales responsively on mobile

---

## Task 4.4: Hardware Calibration Wizard 🔄 IN PROGRESS

### Implementation: React Components

#### HardwareCalibration.tsx
**Props:**
```typescript
onConfigChange: (config: HardwareConfig) => void
initialConfig?: HardwareConfig
```

**Features:**
- Hardware type selector (None / GPIO / Arduino)
- GPIO configuration:
  - Pin selection dropdown (populated from `list_gpio_pins`)
  - Debounce slider (10-100ms)
  - Pulse threshold slider (50-500ms)
  - Test GPIO button
- Arduino configuration:
  - Serial port selector (from `list_serial_ports`)
  - Baud rate dropdown (9600-115200)
  - Test Arduino button
- Hardware status detection (feature + platform check)
- Test results display (success/error messages)

**Tauri Commands (New):**
- `list_gpio_pins()` - Returns available GPIO pins for RPi
- `list_serial_ports()` - Returns available serial ports (Arduino)
- `test_gpio_pin(gpio_pin)` - Test GPIO accessibility
- `test_arduino_connection(port_name, baud_rate)` - Test Arduino connection
- `calibrate_coin_detection(debounce_ms, pulse_threshold_ms)` - Validate calibration
- `get_hardware_status()` - Check Arduino/GPIO feature status

---

## Integration Points

### 1. CoinManager Integration (Pending)
Need to integrate GPIO/Arduino with existing CoinManager:
```rust
pub async fn start_hardware_monitoring(&mut self) -> Result<()> {
    match self.config.hardware_type {
        HardwareType::GPIO => {
            let detector = GPIOCoinDetector::new(
                config.gpio_pin,
                self.coin_channel.clone()
            );
            detector.start_monitoring().await?;
        }
        HardwareType::Arduino => {
            let mut interface = ArduinoInterface::new(
                config.port_name,
                config.baud_rate
            );
            interface.connect()?;
            // Polling loop for coin detection
        }
    }
    Ok(())
}
```

### 2. GameScreen Integration (Pending)
Add CoinOverlay to GameScreen.tsx:
```tsx
<CoinOverlay
  visible={true}
  balance={coinBalance}
  coinsNeeded={gameCost}
  isGameRunning={isGameRunning}
  animateCoin={coinJustAdded}
/>
```

### 3. Operator Panel Integration (Pending)
Add HardwareCalibration to operator panel:
```tsx
<HardwareCalibration
  onConfigChange={handleHardwareConfigChange}
  initialConfig={currentHardwareConfig}
/>
```

---

## Compilation Status

**Current Build:** Ready to compile
```bash
cd src-tauri
cargo build --features hardware-arduino
cargo build --target aarch64-unknown-linux-gnu  # RPi
```

**Feature Flags:**
- `hardware-arduino` - Enables SerialPort communication
- `hardware-gpio` - Enables RPi GPIO (Linux-only)
- Default: Both features optional (mocks used when disabled)

---

## Testing Plan

### Unit Tests
- [x] ArduinoConfig default values
- [x] ArduinoInterface creation
- [x] GPIOConfig default values
- [x] GPIOCoinDetector creation
- [ ] Serial communication mocking
- [ ] GPIO pin detection

### Integration Tests
- [ ] Hardware detection flow
- [ ] Calibration parameter validation
- [ ] CoinManager + Hardware integration
- [ ] UI state synchronization

### Hardware Tests (Physical)
- [ ] Arduino: Coin detection (C command)
- [ ] Arduino: Solenoid trigger (S command)
- [ ] Arduino: Connection test (P/O ping)
- [ ] RPi GPIO: Pin monitoring
- [ ] RPi GPIO: Pulse detection
- [ ] Full coin workflow: Insert → Detect → Balance

---

## Files Created/Modified

### New Files
- `src-tauri/src/core/gpio_coins.rs` (150 lines)
- `src-tauri/src/core/arduino_serial.rs` (250 lines)
- `src-tauri/src/commands/hardware.rs` (140 lines)
- `src/components/hardware/CoinOverlay.tsx` (70 lines)
- `src/components/hardware/CoinOverlay.css` (140 lines)
- `src/components/hardware/HardwareCalibration.tsx` (330 lines)
- `src/components/hardware/HardwareCalibration.css` (250 lines)
- `src/components/hardware/index.ts` (6 lines)

### Modified Files
- `src-tauri/src/commands/mod.rs` - Added hardware module export
- `src-tauri/src/core/mod.rs` - (Pending: export GPIO/Arduino)
- `src/components/game/GameScreen.tsx` - (Pending: add CoinOverlay)

---

## Next Steps (Task 4.4 Completion)

1. **Complete CoinManager Integration**
   - Add hardware_channel to CoinManager
   - Implement start_hardware_monitoring()
   - Handle CoinEvent from GPIO/Arduino

2. **Create Setup Wizard First-Step**
   - Integrate HardwareCalibration into operator panel
   - Save hardware config to database
   - Load config on app startup

3. **Add CoinOverlay to GameScreen**
   - Pass coin balance from ArcadeContext
   - Show overlay during game selection
   - Hide during game play

4. **Testing**
   - Unit test hardware commands
   - Integration test calibration flow
   - Physical testing on RPi4/Arduino

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Hardware Layer                   │
├─────────────────────────────────────────┤
│                                         │
│  GPIO (RPi)          Arduino            │
│  ├─ Pin monitoring   ├─ Serial port     │
│  ├─ Debouncing       ├─ Coin counting   │
│  └─ Event emitting   └─ Solenoid ctrl   │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │   CoinManager        │
         │   ├─ add_coins()     │
         │   ├─ balance track   │
         │   └─ DB logging      │
         └──────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │   React Frontend     │
         │   ├─ CoinOverlay     │
         │   ├─ GameScreen      │
         │   └─ Calibration UI  │
         └──────────────────────┘
```

---

## Estimated Hours Invested

- Task 4.1: GPIO Detector + Tests = 4h ✅
- Task 4.2: Arduino Interface + Tests = 5h ✅
- Task 4.3: CoinOverlay UI = 3h ✅
- Task 4.4: Calibration Wizard = 3h (in progress)
- Integration & Testing = 5-10h (remaining)

**Total Phase 4: ~15-20h completed, 10-15h remaining for full integration**

---

## Related Documentation

- ROADMAP.md - Overall v3.0 plan (8 phases)
- README.md - Feature overview
- CLAUDE.md - Development guidelines
- 06_EMULADORES_EXHAUSTIVO.md - Emulator configuration
- 10_HARDWARE_FISICO.md - Physical cabinet hardware
