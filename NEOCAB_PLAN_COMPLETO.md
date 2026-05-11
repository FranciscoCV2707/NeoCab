# 🎮 NeoCab - PLAN MAESTRO COMPLETO v1.0 → v3.0

**Proyecto**: NeoCab (Arcade Cabinet OS)  
**Objetivo**: Implementar COMPLETAMENTE según documentación  
**Estado Actual**: 70% hecho (Tauri + React mode)  
**Falta**: 30% (Legacy SDL2 mode + extras)  
**Tiempo Total**: 290-350 horas de desarrollo  
**Duración**: 6-9 semanas (8h/día, 5 días/semana)

---

## 📊 ESTADO ACTUAL vs FINAL

| Aspecto | Ahora | Final |
|---------|-------|-------|
| Plataformas | Win7+, Linux, ARM | Win XP → Win11, Linux, ARM |
| Emuladores | 7 | 30+ |
| UI | React/Tauri | Tauri + SDL2 wheel |
| Líneas código | ~7,000 | ~15,000 |
| Renderización | WebView2 | WebView2 + OpenGL |
| GPIO coins | ❌ | ✅ RPi |
| Arduino | ❌ | ✅ |
| CRT Shaders | ❌ | ✅ |

---

## 🏗️ FASES DE DESARROLLO

### **FASE 1: Core Infrastructure (50-60 horas) - Semana 1-2**

#### Tarea 1.1: Feature Flags & Build System (8h)
```bash
Crear: Cargo.toml actualizado
├── [features]
│   ├── default = ["modern-ui"]
│   ├── modern-ui = ["tauri", "webview2"]
│   └── legacy-ui = ["sdl2-ui", "opengl"]
│
├── [target.'cfg(target_os = "windows")'.dependencies]
│   ├── winapi (para Windows XP detection)
│   └── winreg (para registry access)

Crear: .cargo/config.toml
├── [target.i686-pc-windows-msvc]
│   ├── rustflags = ["-C", "target-feature=+crt-static"]
│   └── rustflags = ["-C", "link-arg=/SUBSYSTEM:WINDOWS,5.01"]
│
├── [target.x86_64-pc-windows-msvc]
│   └── rustflags = ["-C", "link-arg=/SUBSYSTEM:WINDOWS,5.02"]

Crear: build.rs
├── Lógica para detectar feature activado
├── Definir constantes en compile time
└── Copy SDL2.dll si legacy-ui

Actualizar: Cargo.toml dependencias
├── sdl2 = { version = "0.36", features = ["bundled", "static-link"], optional = true }
├── sdl2-sys = { version = "0.36", optional = true }
├── gl = { version = "0.14", optional = true }
├── serialport = "4.3"  (Arduino)
├── rppal = "0.14"  (RPi GPIO - solo si target_os = "linux")
```

**Archivos a crear/modificar:**
- ✅ Cargo.toml (actualizar)
- ✅ build.rs (nuevo)
- ✅ .cargo/config.toml (nuevo)

---

#### Tarea 1.2: Platform Detection System (8h)
```rust
Crear: src-tauri/src/utils/platform_detect.rs

pub enum RuntimeMode {
    Modern,  // Tauri + WebView2
    Legacy,  // SDL2 + OpenGL
}

pub struct PlatformInfo {
    pub os: String,              // "windows", "linux"
    pub os_version: String,      // "5.1", "7", "10", "11"
    pub arch: String,            // "x86", "x64", "arm", "aarch64"
    pub mode: RuntimeMode,       // Modo de ejecución
    pub has_webview2: bool,      // ¿WebView2 disponible?
    pub is_raspberry_pi: bool,   // ¿Es RPi?
    pub gpio_available: bool,    // ¿GPIO disponible?
}

Implementar:
├── get_os_version() → String
│   ├── Windows: RtlGetVersion + version mapping
│   └── Linux: /etc/os-release parsing
│
├── detect_runtime_mode() → RuntimeMode
│   ├── Si Windows XP: Legacy
│   ├── Si has_webview2: Modern
│   └── Default: Modern
│
├── has_webview2() → bool
│   └── Check registry HKEY_LOCAL_MACHINE registry path
│
├── is_raspberry_pi() -> bool
│   └── Check /proc/device-tree/model (RPi specific)
│
└── get_platform_info() -> PlatformInfo
    └── Combinar todo arriba

Crear: src-tauri/src/main.rs (actualizado)
├── #[cfg(feature = "modern-ui")]
│   pub mod tauri_app;
│
├── #[cfg(feature = "legacy-ui")]
│   pub mod legacy;
│
└── fn main() {
    let platform = detect_platform();
    match platform.mode {
        RuntimeMode::Modern => tauri_app::run(),
        RuntimeMode::Legacy => legacy::run(),
    }
}
```

**Archivos a crear:**
- ✅ src-tauri/src/utils/platform_detect.rs (nuevo)
- ✅ src-tauri/src/main.rs (actualizar)

---

#### Tarea 1.3: Logging & Debug System (4h)
```rust
Actualizar: src-tauri/src/lib.rs

Agregar:
├── #[cfg(debug_assertions)]
│   → File-based logging en data/logs/
│
├── #[cfg(not(debug_assertions))]
│   → Console logging solo errores críticos
│
└── Platform info logging al inicio
    ├── Log: Versión Windows detectada
    ├── Log: WebView2 status
    ├── Log: Modo runtime seleccionado
    └── Log: Características disponibles

Crear: data/logs/ (directory)
├── neocab_YYYY_MM_DD.log
├── neocab_errors.log
└── neocab_debug.log (solo debug build)
```

**Archivos:**
- ✅ src-tauri/src/lib.rs (actualizar logging)

---

#### Tarea 1.4: Testing Infrastructure (4h)
```rust
Crear: src-tauri/tests/platform_tests.rs

#[test]
fn test_windows_version_detection() { }

#[test]
fn test_webview2_detection() { }

#[test]
fn test_runtime_mode_selection() { }

#[test]
fn test_raspberry_pi_detection() { }

#[cfg(target_os = "windows")]
#[test]
fn test_xp_mode_legacy() { }
```

**Archivos:**
- ✅ src-tauri/tests/platform_tests.rs (nuevo)

---

### **FASE 2: Legacy SDL2 Mode (60-80 horas) - Semana 2-3**

#### Tarea 2.1: SDL2 Rendering Engine (25h)
```rust
Crear: src-tauri/src/legacy/mod.rs

pub mod graphics;
pub mod input;
pub mod window;
pub mod event_loop;

Crear: src-tauri/src/legacy/graphics/mod.rs

pub struct SDLRenderer {
    sdl_context: sdl2::Sdl,
    canvas: Canvas<Window>,
    texture_creator: TextureCreator<WindowContext>,
}

impl SDLRenderer {
    pub fn new() -> Result<Self> {
        // Inicializar SDL2
        // Crear ventana 1920x1080 fullscreen
        // Inicializar OpenGL context (o software renderer si no hay GPU)
    }
    
    pub fn render_frame(&mut self) -> Result<()> {
        // Clear screen
        // Draw wheel
        // Draw game list
        // Draw overlays
        // Present
    }
    
    pub fn load_texture(&mut self, path: &str) -> Result<TextureId> {
        // Cargar PNG/BMP desde disco
        // Cache en memoria
    }
}

Crear: src-tauri/src/legacy/graphics/wheel.rs

pub struct WheelRenderer {
    system_wheels: HashMap<String, Texture>,  // PNG wheels precargados
    angle: f32,  // Ángulo actual
}

impl WheelRenderer {
    pub fn rotate(&mut self, delta: f32) {
        // Rotar wheel suavemente (o paso a paso en HW viejo)
    }
    
    pub fn draw(&self, canvas: &mut Canvas<Window>) -> Result<()> {
        // Dibujar wheel en centro de pantalla
        // Mostrar sistema seleccionado
    }
}

Crear: src-tauri/src/legacy/graphics/ui.rs

pub struct UIRenderer;

impl UIRenderer {
    pub fn draw_game_list(
        canvas: &mut Canvas<Window>,
        games: &[Game],
        selected: usize,
    ) -> Result<()> {
        // Dibujar lista de juegos debajo del wheel
        // Highlight seleccionado
    }
    
    pub fn draw_coin_display(canvas: &mut Canvas<Window>, balance: i32) -> Result<()> {
        // Mostrar balance de monedas arriba
    }
    
    pub fn draw_timer_overlay(canvas: &mut Canvas<Window>, remaining: u32) -> Result<()> {
        // Mostrar timer de juego arriba a la derecha
    }
    
    pub fn draw_info_panel(
        canvas: &mut Canvas<Window>,
        game: &Game,
    ) -> Result<()> {
        // Panel con info del juego abajo
    }
}
```

**Archivos a crear:**
- ✅ src-tauri/src/legacy/mod.rs
- ✅ src-tauri/src/legacy/graphics/mod.rs
- ✅ src-tauri/src/legacy/graphics/wheel.rs
- ✅ src-tauri/src/legacy/graphics/ui.rs

---

#### Tarea 2.2: Input Handler (10h)
```rust
Crear: src-tauri/src/legacy/input/mod.rs

pub struct SDLInputHandler {
    event_pump: EventPump,
}

impl SDLInputHandler {
    pub fn handle_events(&mut self) -> Result<InputEvent> {
        // Leer eventos SDL2
        // Convertir a InputEvent
        // Mapear controles (joystick ↔ buttons)
    }
    
    pub fn handle_joystick(&mut self, axis: u8, value: i16) {
        // Detectar movimiento de stick
        // Generar Up/Down/Left/Right en base a threshold
        // Respetar deadzone settings
    }
    
    pub fn handle_keyboard(&mut self, keycode: Keycode) {
        // Permitir teclado como fallback
    }
}

Crear: src-tauri/src/legacy/input/joystick.rs

pub struct JoystickMapper {
    deadzone: f32,
    mappings: HashMap<Button, String>,  // Button → Action
}

impl JoystickMapper {
    pub fn apply_deadzone(&self, value: i16) -> Option<Direction> {
        // Si value < deadzone: ignore
        // Si value > threshold: Up/Down/Left/Right
    }
}
```

**Archivos a crear:**
- ✅ src-tauri/src/legacy/input/mod.rs
- ✅ src-tauri/src/legacy/input/joystick.rs

---

#### Tarea 2.3: Event Loop & Main (15h)
```rust
Crear: src-tauri/src/legacy/event_loop.rs

pub struct LegacyApp {
    renderer: SDLRenderer,
    input: SDLInputHandler,
    db: Arc<Database>,
    game_library: GameLibrary,
    emulator_mgr: EmulatorManager,
    coin_mgr: CoinManager,
    timer_mgr: TimerManager,
}

impl LegacyApp {
    pub fn run(&mut self) -> Result<()> {
        'main: loop {
            // Handle events
            let input = self.input.handle_events()?;
            
            match input {
                InputEvent::Left => self.prev_system(),
                InputEvent::Right => self.next_system(),
                InputEvent::Up => self.prev_game(),
                InputEvent::Down => self.next_game(),
                InputEvent::A => self.launch_game()?,
                InputEvent::Start => self.show_menu()?,
                InputEvent::Quit => break 'main,
                _ => {}
            }
            
            // Render frame
            self.renderer.render_frame()?;
            
            // Cap FPS at 60
            std::thread::sleep(Duration::from_millis(16));
        }
        Ok(())
    }
}

Crear: src-tauri/src/legacy/main_legacy.rs

#[cfg(feature = "legacy-ui")]
pub fn run() -> Result<()> {
    let db = Database::new("./data/neocab.db")?;
    let mut app = LegacyApp::new(db)?;
    app.run()
}
```

**Archivos a crear:**
- ✅ src-tauri/src/legacy/event_loop.rs
- ✅ src-tauri/src/legacy/main_legacy.rs

---

#### Tarea 2.4: Media Loading & Caching (10h)
```rust
Crear: src-tauri/src/legacy/media/mod.rs

pub struct MediaCache {
    wheels: HashMap<String, Texture>,  // system name → wheel image
    backgrounds: HashMap<String, Texture>,
    game_boxes: HashMap<String, Texture>,
}

impl MediaCache {
    pub fn load_wheel(&mut self, system: &str) -> Result<TextureId> {
        // Load media/SYSTEM/Images/Wheel/system_wheel.png
        // Cache en memoria
        // Return TextureId
    }
    
    pub fn load_game_box(&mut self, game_id: i64) -> Result<TextureId> {
        // Load media/SYSTEM/Images/Boxes/game_id.png
    }
    
    pub fn preload_all(&mut self) -> Result<()> {
        // En background, cargar todas las imágenes de media/
    }
}
```

**Archivos a crear:**
- ✅ src-tauri/src/legacy/media/mod.rs

---

### **FASE 3: HyperSpin Wheel UI (40-50 horas) - Semana 3-4**

#### Tarea 3.1: HyperSpin Wheel Renderer (Modern + Legacy) (25h)

**Para Modo Moderno (React):**
```tsx
Crear: src/components/HyperSpinWheel.tsx

interface WheelProps {
    systems: System[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onLaunch: () => void;
}

export function HyperSpinWheel({
    systems,
    selectedIndex,
    onSelect,
    onLaunch,
}: WheelProps) {
    const [angle, setAngle] = useState(0);
    
    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            setAngle(angle + 45); // Cada sistema es 45°
            onSelect((selectedIndex + 1) % systems.length);
        } else if (e.key === "ArrowRight") {
            setAngle(angle - 45);
            onSelect((selectedIndex - 1 + systems.length) % systems.length);
        } else if (e.key === "Enter") {
            onLaunch();
        }
    };
    
    return (
        <div className="wheel-container">
            <div
                className="wheel"
                style={{
                    transform: `rotate(${angle}deg)`,
                    transition: "transform 0.3s ease-out",
                }}
            >
                {systems.map((sys, i) => (
                    <div
                        key={sys.id}
                        className="wheel-item"
                        style={{
                            transform: `rotate(${i * 45}deg) translateY(-150px)`,
                        }}
                    >
                        <img src={`/wheels/${sys.name}.png`} alt={sys.name} />
                    </div>
                ))}
            </div>
            
            <div className="center-display">
                <img src={`/wheels/${systems[selectedIndex].name}.png`} alt="" />
                <h2>{systems[selectedIndex].name}</h2>
            </div>
            
            <div className="game-list">
                {/* Game list aquí */}
            </div>
        </div>
    );
}

Crear: src/styles/wheel.css

.wheel-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.wheel {
    position: relative;
    width: 400px;
    height: 400px;
    /* CSS circular wheel layout */
}

.wheel-item {
    position: absolute;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.center-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    text-align: center;
    background: rgba(0, 0, 0, 0.8);
    padding: 20px;
    border-radius: 10px;
}
```

**Para Modo Legacy (SDL2):**
```rust
Ya cubierto en Tarea 2.1 (wheel.rs)
```

**Archivos a crear:**
- ✅ src/components/HyperSpinWheel.tsx
- ✅ src/styles/wheel.css

---

#### Tarea 3.2: Game List Panel (10h)
```tsx
Crear: src/components/GameListPanel.tsx

interface GameListProps {
    games: Game[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onPlay: () => void;
}

export function GameListPanel({
    games,
    selectedIndex,
    onSelect,
    onPlay,
}: GameListProps) {
    return (
        <div className="game-list-panel">
            <div className="games-scroll">
                {games.map((game, i) => (
                    <div
                        key={game.id}
                        className={`game-item ${i === selectedIndex ? "selected" : ""}`}
                        onClick={() => onSelect(i)}
                    >
                        <span>{game.title}</span>
                        <span className="year">({game.year})</span>
                    </div>
                ))}
            </div>
            
            <div className="game-info">
                <GameInfoPanel game={games[selectedIndex]} />
            </div>
        </div>
    );
}
```

**Archivos a crear:**
- ✅ src/components/GameListPanel.tsx
- ✅ src/styles/game-list.css

---

#### Tarea 3.3: Game Info Display (10h)
```tsx
Crear: src/components/GameInfoPanel.tsx

export function GameInfoPanel({ game }: { game: Game }) {
    return (
        <div className="game-info-panel">
            <img src={`/boxes/${game.id}.png`} alt={game.title} className="box-art" />
            
            <div className="info">
                <h3>{game.title}</h3>
                <p><strong>Year:</strong> {game.year}</p>
                <p><strong>Manufacturer:</strong> {game.manufacturer}</p>
                <p><strong>Players:</strong> {game.players}</p>
                <p><strong>Description:</strong> {game.description}</p>
                <p className="technical">CRC32: {game.crc32}</p>
            </div>
            
            <div className="play-button">
                <button onClick={() => invoke("launch_game", { game_id: game.id })}>
                    PLAY (A Button)
                </button>
            </div>
        </div>
    );
}
```

**Archivos a crear:**
- ✅ src/components/GameInfoPanel.tsx

---

### **FASE 4: Hardware Integration (50-60 horas) - Semana 4-5**

#### Tarea 4.1: GPIO Coin Detection (Raspberry Pi) (20h)
```rust
Crear: src-tauri/src/core/gpio_coins.rs

#[cfg(target_os = "linux")]
pub struct GPIOCoinDetector {
    gpio_pin: u32,  // GPIO4 (Pin 7), GPIO17 (Pin 11), etc.
    coin_value: i32,
    listener: std::thread::JoinHandle<()>,
}

#[cfg(target_os = "linux")]
impl GPIOCoinDetector {
    pub fn new(pin: u32, coin_value: i32) -> Result<Self> {
        use rppal::gpio::Gpio;
        
        let gpio = Gpio::new()?;
        let mut input = gpio.get(pin)?.into_input();
        
        // Detectar flanco descendente
        input.set_interrupt(rppal::gpio::Trigger::FallingEdge)?;
        
        Ok(Self {
            gpio_pin: pin,
            coin_value,
            listener: std::thread::spawn(move || {
                // Thread loop para detectar pulsos
            }),
        })
    }
    
    pub fn listen<F>(&self, callback: F) -> Result<()>
    where
        F: Fn(i32) + Send + 'static,
    {
        // Ejecutar callback cuando hay pulso (debounced)
    }
}

#[cfg(not(target_os = "linux"))]
pub struct GPIOCoinDetector;

#[cfg(not(target_os = "linux"))]
impl GPIOCoinDetector {
    pub fn new(_pin: u32, _value: i32) -> Result<Self> {
        Err("GPIO solo disponible en Linux".into())
    }
}

Crear: src-tauri/src/core/coin_detector.rs (actualizar)

pub enum CoinSource {
    GPIO(GPIOCoinDetector),
    Arduino(ArduinoInterface),
    Manual,  // Inserción manual (debug)
}

pub struct CoinManager {
    source: CoinSource,
    balance: Arc<RwLock<i32>>,
}
```

**Archivos a crear/actualizar:**
- ✅ src-tauri/src/core/gpio_coins.rs
- ✅ src-tauri/src/core/coin_detector.rs (actualizar)
- ✅ Cargo.toml (agregar rppal dependency para RPi)

---

#### Tarea 4.2: Arduino Integration (15h)
```rust
Crear: src-tauri/src/core/arduino_serial.rs

pub struct ArduinoInterface {
    port: Box<dyn SerialPort>,
    coin_channel: mpsc::UnboundedSender<CoinEvent>,
}

impl ArduinoInterface {
    pub fn new(port_name: &str, baud_rate: u32) -> Result<Self> {
        use serialport::open;
        
        let port = open(port_name)?;
        
        Ok(Self {
            port: Box::new(port),
            coin_channel: mpsc::unbounded_channel().0,
        })
    }
    
    pub fn listen(&mut self) -> Result<()> {
        // Thread loop: leer datos del puerto serial
        // Formato esperado: "COIN:1\n" o "BUTTON:START\n"
        loop {
            let mut buffer = [0; 32];
            match self.port.read(&mut buffer) {
                Ok(n) => {
                    let msg = String::from_utf8_lossy(&buffer[..n]);
                    if msg.starts_with("COIN:") {
                        let amount = msg.trim_start_matches("COIN:").parse::<i32>()?;
                        self.coin_channel.send(CoinEvent::Inserted(amount))?;
                    }
                }
                Err(_) => std::thread::sleep(Duration::from_millis(10)),
            }
        }
    }
    
    pub fn trigger_solenoid(&mut self, output: u8) -> Result<()> {
        // Enviar comando: "SOLENOID:1\n"
        // Arduino activa pin para simular button press
        self.port.write_all(format!("SOLENOID:{}\n", output).as_bytes())?;
        Ok(())
    }
}

Crear: arduino/neocab_controller.ino (Arduino sketch)

#define COIN_PIN 2
#define SOLENOID_1 3
#define SOLENOID_2 4
#define SOLENOID_3 5

volatile int coin_count = 0;
unsigned long last_coin_time = 0;

void setup() {
    Serial.begin(9600);
    pinMode(COIN_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(COIN_PIN), coin_interrupt, FALLING);
}

void coin_interrupt() {
    // Debounce: ignore si < 50ms desde último pulso
    if (millis() - last_coin_time > 50) {
        coin_count++;
        last_coin_time = millis();
    }
}

void loop() {
    // Enviar conteo de monedas si hay cambio
    if (coin_count > 0) {
        Serial.print("COIN:");
        Serial.println(coin_count);
        coin_count = 0;
    }
    
    // Escuchar comandos del PC
    if (Serial.available() > 0) {
        String cmd = Serial.readStringUntil('\n');
        if (cmd.startsWith("SOLENOID:")) {
            int pin = cmd.substring(9).toInt();
            trigger_solenoid(pin);
        }
    }
    
    delay(100);
}

void trigger_solenoid(int pin) {
    digitalWrite(pin, HIGH);
    delay(100);  // 100ms pulse
    digitalWrite(pin, LOW);
}
```

**Archivos a crear:**
- ✅ src-tauri/src/core/arduino_serial.rs
- ✅ arduino/neocab_controller.ino
- ✅ Cargo.toml (agregar serialport dependency)

---

#### Tarea 4.3: Configuration & Calibration (15h)
```rust
Crear: src-tauri/src/core/hardware_config.rs

#[derive(Serialize, Deserialize)]
pub struct HardwareConfig {
    pub coin_gpio_pin: Option<u32>,      // RPi GPIO pin para monedas
    pub coin_gpio_value: i32,            // Valor por pulso
    pub arduino_port: Option<String>,    // COM3, /dev/ttyUSB0, etc.
    pub arduino_baud: u32,               // 9600, 115200, etc.
    pub joystick_deadzone: f32,
    pub button_mappings: HashMap<String, String>,
}

Crear: src-tauri/src/commands/hardware.rs

#[tauri::command]
pub async fn configure_gpio(
    pin: u32,
    value: i32,
    config_mgr: State<'_, ConfigManager>,
) -> Result<String, String> {
    // Guardar config
    // Validar pin (debe estar disponible)
    // Reintentar inicializar GPIOCoinDetector
}

#[tauri::command]
pub async fn configure_arduino(
    port: String,
    baud: u32,
    config_mgr: State<'_, ConfigManager>,
) -> Result<String, String> {
    // Guardar config
    // Intentar conectar para validar puerto
}

#[tauri::command]
pub async fn calibrate_joystick(
    device_id: u32,
    input_mgr: State<'_, InputManager>,
) -> Result<String, String> {
    // Wizard: mover stick en 8 direcciones
    // Guardar min/max values
}

#[tauri::command]
pub async fn test_solenoid(
    output: u8,
    arduino: State<'_, ArduinoInterface>,
) -> Result<String, String> {
    // Activar solenoid de prueba
}
```

**Archivos a crear:**
- ✅ src-tauri/src/core/hardware_config.rs
- ✅ src-tauri/src/commands/hardware.rs

---

### **FASE 5: Extended Emulators (60-120 horas) - Semana 5-8**

#### Tarea 5.1-5.30: Add 20+ Emulator Adapters

**Cada emulador toma 2-4 horas:**

```
Tarea 5.1: Sega Master System (2h)
├── Crear: src-tauri/src/adapters/sms_adapter.rs
├── Usar: retroarch-nestopia core como base
└── Registrar en EmulatorManager

Tarea 5.2: TurboGrafx-16 (2h)
├── Crear: src-tauri/src/adapters/turbografx_adapter.rs
├── Emulador: Mednafen vía RetroArch
└── Registrar

Tarea 5.3: Atari 2600 (2h)
├── Crear: src-tauri/src/adapters/atari2600_adapter.rs
├── Emulador: Stella (o RetroArch)
└── Registrar

Tarea 5.4: Sega Saturn (3h)
├── Crear: src-tauri/src/adapters/saturn_adapter.rs
├── Emulador: Yabause o RetroArch SSF core
├── Registrar
└── Test ROM

Tarea 5.5: Dreamcast (3h)
├── Crear: src-tauri/src/adapters/dreamcast_adapter.rs
├── Emulador: Flycast
└── Registrar

Tarea 5.6: PlayStation 2 (4h)
├── Crear: src-tauri/src/adapters/ps2_adapter.rs
├── Emulador: PCSX2
├── Registrar
└── Incluir ISO loader

Tarea 5.7: GameCube (4h)
├── Crear: src-tauri/src/adapters/gamecube_adapter.rs
├── Emulador: Dolphin
└── Registrar

... (Continuar con 23 emuladores más)

Tarea 5.30: Game Boy Advance (2h)
├── Crear: src-tauri/src/adapters/gba_adapter.rs
├── Emulador: mGBA vía RetroArch
└── Registrar
```

**Tiempo total**: 60-120h (2-4h cada uno x 20-30 emuladores)

**Template para cada adapter:**
```rust
// src-tauri/src/adapters/SYSTEM_adapter.rs

use crate::error::Result;
use std::process::{Child, Command};
use tracing::info;

pub struct SystemAdapter {
    process: Option<Child>,
}

impl SystemAdapter {
    pub fn new() -> Self {
        Self { process: None }
    }

    pub async fn launch(&mut self, rom_path: &str) -> Result<()> {
        let mut cmd = Command::new("emulator_exe");
        cmd.arg(rom_path);
        // Agregar flags específicos del emulador
        
        self.process = Some(cmd.spawn()?);
        info!("System launched: {}", rom_path);
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<()> {
        if let Some(mut p) = self.process.take() {
            let _ = p.kill();
        }
        Ok(())
    }
}
```

---

### **FASE 6: CRT Shaders (25-30 horas) - Semana 8-9**

#### Tarea 6.1: OpenGL Shader System (15h)
```glsl
Crear: assets/shaders/crt.frag

#version 330 core

in vec2 TexCoord;
out vec4 FragColor;

uniform sampler2D texture0;
uniform float time;
uniform float scanline_intensity;
uniform float curvature;

void main() {
    vec2 uv = TexCoord;
    
    // Curvatura CRT
    uv = uv * 2.0 - 1.0;
    uv *= 1.0 + curvature * (uv.x * uv.x + uv.y * uv.y);
    uv = uv * 0.5 + 0.5;
    
    // Scanlines
    float scanline = sin(uv.y * 1920.0 * 3.14159) * 0.5;
    scanline = mix(1.0, scanline, scanline_intensity);
    
    // Muestreo de textura
    vec4 color = texture(texture0, uv);
    
    // Aplicar scanlines
    color *= scanline;
    
    // Vignette (oscuridad en bordes)
    vec2 vignette = uv - 0.5;
    float dist = length(vignette);
    color *= (1.0 - dist * dist * 0.5);
    
    FragColor = color;
}

Crear: assets/shaders/crt.vert

#version 330 core
layout(location = 0) in vec2 position;
layout(location = 1) in vec2 texCoord;

out vec2 TexCoord;

uniform mat4 projection;

void main() {
    gl_Position = projection * vec4(position, 0.0, 1.0);
    TexCoord = texCoord;
}
```

**Archivos a crear:**
- ✅ assets/shaders/crt.frag
- ✅ assets/shaders/crt.vert
- ✅ src-tauri/src/graphics/shader.rs (nuevo)
- ✅ src-tauri/src/graphics/crt_effect.rs (nuevo)

---

### **FASE 7: Setup Wizard (15-20 horas) - Semana 9**

#### Tarea 7.1: React Wizard Component (10h)
```tsx
Crear: src/components/SetupWizard.tsx

interface SetupStep {
    id: string;
    title: string;
    component: React.FC<StepProps>;
}

const steps: SetupStep[] = [
    { id: "welcome", title: "Welcome", component: WelcomeStep },
    { id: "rom-paths", title: "ROM Folders", component: ROMPathsStep },
    { id: "emulators", title: "Emulators", component: EmulatorsStep },
    { id: "hardware", title: "Hardware", component: HardwareStep },
    { id: "controls", title: "Controls", component: ControlsStep },
    { id: "coin-setup", title: "Coin System", component: CoinSetupStep },
    { id: "scan", title: "Scan ROMs", component: ScanStep },
    { id: "finish", title: "Done!", component: FinishStep },
];

export function SetupWizard() {
    const [step, setStep] = useState(0);
    
    return (
        <div className="setup-wizard">
            <div className="step-indicator">
                {steps.map((s, i) => (
                    <div key={s.id} className={`dot ${i <= step ? "active" : ""}`} />
                ))}
            </div>
            
            <div className="content">
                {steps[step].component && <steps[step].component />}
            </div>
            
            <div className="buttons">
                <button onClick={() => setStep(step - 1)} disabled={step === 0}>
                    Back
                </button>
                <button onClick={() => setStep(step + 1)} disabled={step === steps.length - 1}>
                    Next
                </button>
                {step === steps.length - 1 && (
                    <button onClick={() => invoke("finish_setup")}>Finish</button>
                )}
            </div>
        </div>
    );
}
```

**Archivos a crear:**
- ✅ src/components/SetupWizard.tsx
- ✅ src/components/setup/ (folder con step components)

---

### **FASE 8: Testing & Documentation (40-50 horas) - Semana 9-10**

#### Tarea 8.1: Hardware Testing (20h)
```bash
Test Plan:
├── Windows XP SP2 (x86)
│   ├── Boot & launch
│   ├── Wheel navigation
│   ├── Game launch
│   └── Manual coin input
│
├── Windows 10/11 (x64)
│   ├── Full feature set
│   ├── WebView2 detection
│   ├── Wheel smooth rotation
│   └── All emulators
│
├── Raspberry Pi 4 (ARM)
│   ├── GPIO coin detection
│   ├── Performance (no CRT shaders?)
│   └── Thermal testing
│
└── Arduino integration
    ├── Serial communication
    ├── Coin detection
    └── Solenoid triggering
```

#### Tarea 8.2: Documentation (20h)
```
Actualizar:
├── README.md
│   ├── Installation (Win XP through Win11)
│   ├── Hardware setup guide
│   └── Emulator list
│
├── docs/
│   ├── HARDWARE_SETUP.md (GPIO, Arduino)
│   ├── EMULATOR_GUIDE.md (30+ emulators)
│   ├── SETUP_WIZARD.md
│   ├── TROUBLESHOOTING.md
│   └── API_REFERENCE.md (actualizar commands)
│
└── Crear:
    ├── INSTALLATION.md
    ├── GPIO_SETUP.md
    ├── ARDUINO_SETUP.md
    └── CRT_SHADERS.md
```

#### Tarea 8.3: Build & Packaging (10h)
```bash
Windows XP (i686):
cargo +1.53.0 build --release \
  --target i686-pc-windows-msvc \
  --no-default-features \
  --features legacy-ui
→ neocab_xp.exe

Windows 7-11 (x64):
cargo build --release \
  --target x86_64-pc-windows-msvc \
  --features modern-ui
→ neocab_modern.exe (o via npm run tauri build → MSI)

Linux (x86_64):
cargo build --release \
  --target x86_64-unknown-linux-gnu
→ AppImage

Raspberry Pi (ARM):
cargo build --release \
  --target armv7-unknown-linux-gnueabihf
→ RPi binary
```

---

## 📊 RESUMEN TOTAL

| Fase | Horas | Semanas | Tareas |
|------|-------|---------|--------|
| **1. Core Infrastructure** | 50-60 | 1-2 | 1.1-1.4 |
| **2. Legacy SDL2 Mode** | 60-80 | 2-3 | 2.1-2.4 |
| **3. HyperSpin Wheel UI** | 40-50 | 3-4 | 3.1-3.3 |
| **4. Hardware Integration** | 50-60 | 4-5 | 4.1-4.3 |
| **5. Extended Emulators** | 60-120 | 5-8 | 5.1-5.30 |
| **6. CRT Shaders** | 25-30 | 8-9 | 6.1 |
| **7. Setup Wizard** | 15-20 | 9 | 7.1 |
| **8. Testing & Docs** | 40-50 | 9-10 | 8.1-8.3 |
| **TOTAL** | **340-470** | **9-10** | **~60** |

---

## 🎯 MILESTONES

- **Semana 2**: v1.1 - Legacy SDL2 + Auto-detection working
- **Semana 4**: v1.2 - HyperSpin wheel UI complete
- **Semana 5**: v1.3 - GPIO + Arduino integration
- **Semana 8**: v1.4 - 30+ emuladores
- **Semana 9**: v2.0 - CRT shaders + Setup wizard
- **Semana 10**: v3.0 - Full NeoCab complete, all platforms

---

## ✅ PRÓXIMOS PASOS

1. **Crear branch**: `git checkout -b neocab-v3-complete`
2. **Empezar Fase 1** (Feature flags + Platform detection)
3. **Hacer commits** al final de cada tarea
4. **Actualizar STATUS.md** después de cada fase

---

**¡NeoCab v3.0 completo está a 340-470 horas de distancia!** 🚀
