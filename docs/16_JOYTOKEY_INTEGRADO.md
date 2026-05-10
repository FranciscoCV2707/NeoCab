# 🕹️ ARCADECORE v3 — JOYTOKEY INTEGRADO (JoyMapper)

> **Mapeo joystick→teclado nativo, sin software externo. Funciona en WinXP, Win7-11, Linux, ARM.**

---

## QUÉ ES Y POR QUÉ

**JoyToKey** convierte botones de joystick en pulsaciones de teclado.
ArcadeCore incluye esto de forma nativa: **JoyMapper**.

```
Sin JoyToKey externo:          Con JoyMapper integrado:
  ┌─────────────────────┐        ┌─────────────────────┐
  │ Joystick           │        │ Joystick           │
  │ → JoyToKey.exe     │        │ → JoyMapper (dentro│
  │ → Emulador         │        │   de ArcadeCore)   │
  │                    │        │ → Emulador         │
  │ Problema:          │        │                    │
  │ - Config separada  │        │ Ventajas:          │
  │ - Puede crashear   │        │ - Config unificada │
  │ - Incompatible XP  │        │ - Siempre activo   │
  │ - Solo Windows     │        │ - Win/Linux/ARM    │
  └─────────────────────┘        └─────────────────────┘
```

---

## ARQUITECTURA JOYMAPPER

```
SDL2 raw events
    │
    ▼
JoyMapper Core
    ├── Leer perfil activo (YAML)
    ├── Matchear botón/eje → acción
    └── Emitir:
        ├── KeyboardEvent (via OS virtual key injection)
        ├── MouseEvent
        ├── ArcadeCore internal event (insertar moneda, etc)
        └── Texto (para búsqueda rápida)

Niveles de perfil (prioridad cascada):
  1. Perfil específico del juego    → "Street Fighter II.yaml"
  2. Perfil del sistema             → "mame.yaml"
  3. Perfil del frontend ArcadeCore → "arcadecore_ui.yaml"
  4. Perfil global fallback         → "default.yaml"
```

---

## CÓDIGO: JOYMAPPER CORE

```rust
// src-tauri/src/input/joy_mapper.rs
use sdl2::controller::{Axis, Button};
use sdl2::event::Event;
use std::collections::HashMap;
use std::time::Instant;
use serde::{Deserialize, Serialize};

/// Una acción que puede disparar un botón
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum MappedAction {
    Key(String),                  // "A", "Space", "F12", "ctrl+alt+del"
    Keys(Vec<String>),            // Combo: ["Ctrl", "Shift", "F5"]
    MouseButton(u8),              // 0=left, 1=right, 2=middle
    MouseMove { dx: i32, dy: i32 },
    ArcadeAction(ArcadeActionType),
    Text(String),                 // Escribir texto
    Nothing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArcadeActionType {
    InsertCoin,
    StartGame,
    SelectButton,
    BackButton,
    OpenOperatorPanel,
    PauseGame,
    SaveState(u8),
    LoadState(u8),
    ExitEmulator,
    VolumeUp,
    VolumeDown,
    Screenshot,
}

/// Un mapeo: disparador → acción
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoyMapping {
    pub trigger:     JoyTrigger,
    pub action:      MappedAction,
    pub hold_ms:     Option<u64>,     // None = press, Some(ms) = hold required
    pub repeat_ms:   Option<u64>,     // Repeat while held (para navegar listas)
    pub turbo_hz:    Option<f32>,     // Turbo fire (24.0 = 24 veces/seg)
}

/// Qué puede disparar un mapeo
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum JoyTrigger {
    Button { button: u8 },
    Axis   { axis: u8, direction: AxisDir, threshold: f32 },
    Combo  { buttons: Vec<u8> },          // Múltiples botones simultáneos
    HatDir { hat: u8, dir: HatDirection },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AxisDir { Positive, Negative }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HatDirection { Up, Down, Left, Right, UpLeft, UpRight, DownLeft, DownRight }

/// Perfil completo de un dispositivo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoyProfile {
    pub name:        String,
    pub device_guid: Option<String>,     // None = aplica a todos
    pub device_name: Option<String>,     // Nombre SDL2
    pub deadzone:    f32,                // 0.0 - 1.0
    pub mappings:    Vec<JoyMapping>,
}

/// El JoyMapper en sí
pub struct JoyMapper {
    profiles:         Vec<JoyProfile>,    // Todos los perfiles cargados
    active_profile:   String,             // Perfil activo actual
    button_state:     HashMap<u8, bool>,  // Estado actual botones
    axis_state:       HashMap<u8, f32>,   // Estado actual ejes
    press_times:      HashMap<u8, Instant>,
    last_repeat:      HashMap<String, Instant>,
    injector:         Box<dyn KeyInjector>,
}

impl JoyMapper {
    pub fn new() -> Self {
        Self {
            profiles:      Self::load_all_profiles(),
            active_profile: "default".into(),
            button_state:  HashMap::new(),
            axis_state:    HashMap::new(),
            press_times:   HashMap::new(),
            last_repeat:   HashMap::new(),
            injector:      create_injector(),   // Platform-specific
        }
    }

    /// Cargar todos los perfiles desde config/joy_profiles/
    fn load_all_profiles() -> Vec<JoyProfile> {
        let dir = std::path::Path::new("config/joy_profiles");
        if !dir.exists() { return vec![Self::default_profile()]; }

        std::fs::read_dir(dir)
            .into_iter()
            .flatten()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().map_or(false, |x| x == "yaml"))
            .filter_map(|e| {
                let content = std::fs::read_to_string(e.path()).ok()?;
                serde_yaml::from_str::<JoyProfile>(&content).ok()
            })
            .collect()
    }

    /// Procesar evento SDL2
    pub fn process_event(&mut self, event: &Event) {
        let active = self.get_active_profile();
        if active.is_none() { return; }
        let profile = active.unwrap().clone();

        match event {
            Event::ControllerButtonDown { button, .. } => {
                let btn_id = *button as u8;
                self.button_state.insert(btn_id, true);
                self.press_times.insert(btn_id, Instant::now());
                self.handle_trigger(&profile, &JoyTrigger::Button { button: btn_id }, true);
            }
            Event::ControllerButtonUp { button, .. } => {
                let btn_id = *button as u8;
                self.button_state.insert(btn_id, false);
                self.handle_trigger(&profile, &JoyTrigger::Button { button: btn_id }, false);
            }
            Event::ControllerAxisMotion { axis, value, .. } => {
                let ax_id  = *axis as u8;
                let norm   = *value as f32 / 32768.0;
                self.axis_state.insert(ax_id, norm);

                let dead = profile.deadzone;
                if norm >  dead { self.handle_trigger(&profile, &JoyTrigger::Axis { axis: ax_id, direction: AxisDir::Positive, threshold: dead }, true); }
                if norm < -dead { self.handle_trigger(&profile, &JoyTrigger::Axis { axis: ax_id, direction: AxisDir::Negative, threshold: dead }, true); }
                if norm.abs() <= dead {
                    self.handle_trigger(&profile, &JoyTrigger::Axis { axis: ax_id, direction: AxisDir::Positive, threshold: dead }, false);
                    self.handle_trigger(&profile, &JoyTrigger::Axis { axis: ax_id, direction: AxisDir::Negative, threshold: dead }, false);
                }
            }
            _ => {}
        }
    }

    fn handle_trigger(&mut self, profile: &JoyProfile, trigger: &JoyTrigger, pressed: bool) {
        for mapping in &profile.mappings {
            if self.trigger_matches(&mapping.trigger, trigger) {
                if pressed {
                    self.fire_action(&mapping.action);
                }
            }
        }
    }

    fn fire_action(&mut self, action: &MappedAction) {
        match action {
            MappedAction::Key(key) => {
                self.injector.inject_key(key);
            }
            MappedAction::Keys(keys) => {
                for key in keys {
                    self.injector.inject_key_down(key);
                }
                for key in keys.iter().rev() {
                    self.injector.inject_key_up(key);
                }
            }
            MappedAction::ArcadeAction(a) => {
                self.handle_arcade_action(a);
            }
            _ => {}
        }
    }

    fn trigger_matches(&self, a: &JoyTrigger, b: &JoyTrigger) -> bool {
        match (a, b) {
            (JoyTrigger::Button { button: ba },
             JoyTrigger::Button { button: bb }) => ba == bb,
            (JoyTrigger::Axis { axis: aa, direction: da, .. },
             JoyTrigger::Axis { axis: ab, direction: db, .. }) =>
                aa == ab && std::mem::discriminant(da) == std::mem::discriminant(db),
            _ => false,
        }
    }

    fn handle_arcade_action(&self, action: &ArcadeActionType) {
        match action {
            ArcadeActionType::InsertCoin => {
                // Emitir evento interno a CoinManager
                let _ = COIN_TX.get().map(|tx| tx.send(CoinEvent::Insert));
            }
            _ => {}
        }
    }

    pub fn set_profile(&mut self, name: &str) {
        self.active_profile = name.to_string();
    }

    fn get_active_profile(&self) -> Option<&JoyProfile> {
        self.profiles.iter().find(|p| p.name == self.active_profile)
    }

    fn default_profile() -> JoyProfile {
        JoyProfile {
            name: "default".into(),
            device_guid: None,
            device_name: None,
            deadzone: 0.15,
            mappings: vec![
                JoyMapping {
                    trigger: JoyTrigger::Button { button: 0 },   // A / Cross
                    action:  MappedAction::ArcadeAction(ArcadeActionType::SelectButton),
                    hold_ms: None, repeat_ms: None, turbo_hz: None,
                },
                JoyMapping {
                    trigger: JoyTrigger::Button { button: 1 },   // B / Circle
                    action:  MappedAction::ArcadeAction(ArcadeActionType::BackButton),
                    hold_ms: None, repeat_ms: None, turbo_hz: None,
                },
                JoyMapping {
                    trigger: JoyTrigger::Axis { axis: 1, direction: AxisDir::Negative, threshold: 0.5 },
                    action:  MappedAction::Key("Up".into()),
                    hold_ms: None, repeat_ms: Some(150), turbo_hz: None,
                },
                JoyMapping {
                    trigger: JoyTrigger::Axis { axis: 1, direction: AxisDir::Positive, threshold: 0.5 },
                    action:  MappedAction::Key("Down".into()),
                    hold_ms: None, repeat_ms: Some(150), turbo_hz: None,
                },
                // Insertar moneda con Select
                JoyMapping {
                    trigger: JoyTrigger::Button { button: 6 },   // Select / Back
                    action:  MappedAction::ArcadeAction(ArcadeActionType::InsertCoin),
                    hold_ms: None, repeat_ms: None, turbo_hz: None,
                },
            ],
        }
    }
}

// ── KEY INJECTOR: diferente para cada OS ──────────────────

pub trait KeyInjector: Send + Sync {
    fn inject_key(&self, key: &str);
    fn inject_key_down(&self, key: &str);
    fn inject_key_up(&self, key: &str);
}

#[cfg(target_os = "windows")]
fn create_injector() -> Box<dyn KeyInjector> {
    Box::new(WindowsKeyInjector)
}

#[cfg(target_os = "linux")]
fn create_injector() -> Box<dyn KeyInjector> {
    Box::new(LinuxKeyInjector::new())
}

// Windows: SendInput API (funciona en WinXP+)
#[cfg(target_os = "windows")]
struct WindowsKeyInjector;

#[cfg(target_os = "windows")]
impl KeyInjector for WindowsKeyInjector {
    fn inject_key(&self, key: &str) {
        let vk = str_to_vkcode(key);
        unsafe {
            let inputs = [
                winapi::um::winuser::INPUT {
                    type_: winapi::um::winuser::INPUT_KEYBOARD,
                    u: {
                        let mut u = std::mem::zeroed();
                        *u.ki_mut() = winapi::um::winuser::KEYBDINPUT {
                            wVk: vk, wScan: 0, dwFlags: 0,
                            time: 0, dwExtraInfo: 0,
                        };
                        u
                    }
                },
                winapi::um::winuser::INPUT {
                    type_: winapi::um::winuser::INPUT_KEYBOARD,
                    u: {
                        let mut u = std::mem::zeroed();
                        *u.ki_mut() = winapi::um::winuser::KEYBDINPUT {
                            wVk: vk, wScan: 0,
                            dwFlags: winapi::um::winuser::KEYEVENTF_KEYUP,
                            time: 0, dwExtraInfo: 0,
                        };
                        u
                    }
                },
            ];
            winapi::um::winuser::SendInput(
                2,
                inputs.as_ptr() as *mut _,
                std::mem::size_of::<winapi::um::winuser::INPUT>() as i32,
            );
        }
    }
    fn inject_key_down(&self, key: &str) { /* similar */ }
    fn inject_key_up(&self, key: &str)   { /* similar */ }
}

// Linux: /dev/uinput (virtual keyboard — funciona sin X11)
#[cfg(target_os = "linux")]
struct LinuxKeyInjector { uinput: std::fs::File }

#[cfg(target_os = "linux")]
impl LinuxKeyInjector {
    fn new() -> Self {
        // Crear virtual keyboard con uinput
        // Requiere: /dev/uinput disponible (sudo o grupo uinput)
        let f = std::fs::OpenOptions::new()
            .write(true)
            .open("/dev/uinput")
            .expect("Cannot open /dev/uinput. Add user to 'uinput' group.");
        Self { uinput: f }
    }
}

#[cfg(target_os = "linux")]
impl KeyInjector for LinuxKeyInjector {
    fn inject_key(&self, key: &str) {
        let code = str_to_linux_keycode(key);
        inject_linux_key(&self.uinput, code, 1);  // press
        inject_linux_key(&self.uinput, code, 0);  // release
    }
    fn inject_key_down(&self, key: &str) { /* ... */ }
    fn inject_key_up(&self, key: &str)   { /* ... */ }
}
```

---

## CONFIGURACIÓN DE PERFILES (YAML)

```yaml
# config/joy_profiles/default.yaml
# Perfil global — aplica a todos los controles
name: default
deadzone: 0.15

mappings:
  # Navegación UI
  - trigger: { kind: Axis, axis: 1, direction: Negative, threshold: 0.5 }
    action:  { type: Key, value: "Up" }
    repeat_ms: 150

  - trigger: { kind: Axis, axis: 1, direction: Positive, threshold: 0.5 }
    action:  { type: Key, value: "Down" }
    repeat_ms: 150

  - trigger: { kind: Axis, axis: 0, direction: Negative, threshold: 0.5 }
    action:  { type: Key, value: "Left" }
    repeat_ms: 150

  - trigger: { kind: Axis, axis: 0, direction: Positive, threshold: 0.5 }
    action:  { type: Key, value: "Right" }
    repeat_ms: 150

  # Botones principales (Xbox layout)
  - trigger: { kind: Button, button: 0 }   # A / Cross
    action:  { type: ArcadeAction, value: SelectButton }

  - trigger: { kind: Button, button: 1 }   # B / Circle
    action:  { type: ArcadeAction, value: BackButton }

  # Moneda
  - trigger: { kind: Button, button: 6 }   # Select / Back / Share
    action:  { type: ArcadeAction, value: InsertCoin }

  # Start
  - trigger: { kind: Button, button: 7 }   # Start / Options / +
    action:  { type: ArcadeAction, value: StartGame }

  # Pausa
  - trigger: { kind: Combo, buttons: [6, 7] }   # Select + Start
    action:  { type: ArcadeAction, value: PauseGame }

  # Exit emulador: LB + RB + Start
  - trigger: { kind: Combo, buttons: [4, 5, 7] }
    action:  { type: ArcadeAction, value: ExitEmulator }
    hold_ms: 2000   # Sostener 2 segundos

---
# config/joy_profiles/mame.yaml
# Perfil para MAME — las teclas que MAME espera
name: mame
deadzone: 0.15

mappings:
  # MAME: D-Pad + botones en modo teclado
  - trigger: { kind: Axis, axis: 1, direction: Negative, threshold: 0.5 }
    action:  { type: Key, value: "Up" }
    repeat_ms: 100

  - trigger: { kind: Axis, axis: 1, direction: Positive, threshold: 0.5 }
    action:  { type: Key, value: "Down" }
    repeat_ms: 100

  - trigger: { kind: Axis, axis: 0, direction: Negative, threshold: 0.5 }
    action:  { type: Key, value: "Left" }
    repeat_ms: 100

  - trigger: { kind: Axis, axis: 0, direction: Positive, threshold: 0.5 }
    action:  { type: Key, value: "Right" }
    repeat_ms: 100

  # Botones MAME default
  - trigger: { kind: Button, button: 0 }
    action:  { type: Key, value: "LeftCtrl" }   # Button 1

  - trigger: { kind: Button, button: 1 }
    action:  { type: Key, value: "LeftAlt" }    # Button 2

  - trigger: { kind: Button, button: 2 }
    action:  { type: Key, value: "Space" }      # Button 3

  - trigger: { kind: Button, button: 3 }
    action:  { type: Key, value: "LeftShift" }  # Button 4

  - trigger: { kind: Button, button: 4 }
    action:  { type: Key, value: "Z" }          # Button 5

  - trigger: { kind: Button, button: 5 }
    action:  { type: Key, value: "X" }          # Button 6

  # Moneda = tecla 5
  - trigger: { kind: Button, button: 6 }
    action:  { type: Key, value: "5" }

  # Start 1P = tecla 1
  - trigger: { kind: Button, button: 7 }
    action:  { type: Key, value: "1" }

  # Exit = ESC
  - trigger: { kind: Combo, buttons: [4, 5, 7] }
    action:  { type: Key, value: "Escape" }
    hold_ms: 2000

---
# config/joy_profiles/retroarch.yaml
# Perfil RetroArch — hotkeys estándar RA
name: retroarch
deadzone: 0.15

mappings:
  # RetroArch usa botones SDL nativamente + hotkeys específicos
  # Hotkeys via combinación con Select (enable_hotkey_btn)
  
  # RetroArch menu: Select + X
  - trigger: { kind: Combo, buttons: [6, 2] }
    action:  { type: Key, value: "F1" }         # RGUI menu

  # Save state: Select + R1
  - trigger: { kind: Combo, buttons: [6, 5] }
    action:  { type: Key, value: "F2" }

  # Load state: Select + L1
  - trigger: { kind: Combo, buttons: [6, 4] }
    action:  { type: Key, value: "F4" }

  # Exit RetroArch: Select + Start
  - trigger: { kind: Combo, buttons: [6, 7] }
    action:  { type: Key, value: "F9" }         # Quit
    hold_ms: 1500
```

---

## UI DE CONFIGURACIÓN DE CONTROLES (SIMPLE)

```tsx
// src/pages/InputConfig.tsx
// Wizard de configuración paso a paso

export function InputConfig() {
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<Device | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [listening, setListening] = useState<string | null>(null);

  const steps = [
    { label: "Seleccionar control",  component: <SelectDevice /> },
    { label: "Botón ARRIBA",         action: "up" },
    { label: "Botón ABAJO",          action: "down" },
    { label: "Botón IZQUIERDA",      action: "left" },
    { label: "Botón DERECHA",        action: "right" },
    { label: "Botón SELECCIONAR",    action: "select" },
    { label: "Botón VOLVER",         action: "back" },
    { label: "INSERTAR MONEDA",      action: "coin" },
    { label: "START",                action: "start" },
    { label: "¡Listo!",              component: <Summary /> },
  ];

  return (
    <div className="input-config">
      <h1>Configuración de Control</h1>

      {/* Barra de progreso */}
      <div className="progress">
        {steps.map((s, i) => (
          <div key={i} className={`step ${i <= step ? "done" : ""} ${i === step ? "active" : ""}`}>
            {s.label}
          </div>
        ))}
      </div>

      {/* Instrucción actual */}
      <div className="instruction">
        {step < steps.length && steps[step].action ? (
          <>
            <div className="icon">🎮</div>
            <h2>Presiona el botón para:</h2>
            <h1 className="action-name">{steps[step].label}</h1>
            <p className="hint">Presiona ESC para saltar este botón</p>
          </>
        ) : (
          steps[step].component
        )}
      </div>

      {/* Auto-detect input: escuchar cualquier botón */}
      {listening && (
        <div className="listening-overlay">
          Esperando input... <span className="blink">●</span>
        </div>
      )}
    </div>
  );
}
```

---

## TURBO Y CARACTERÍSTICAS AVANZADAS

```yaml
# Turbo fire: disparar rápido al mantener botón
- trigger: { kind: Button, button: 0 }
  action:  { type: Key, value: "LeftCtrl" }
  turbo_hz: 24.0    # 24 disparos por segundo

# Macro: secuencia de teclas
- trigger: { kind: Button, button: 3 }
  action:  { type: Keys, value: ["Down", "DownRight", "Right", "LeftCtrl"] }  # Hadouken!

# Hold: solo dispara si mantienes 0.5 seg
- trigger: { kind: Button, button: 7 }
  action:  { type: ArcadeAction, value: ExitEmulator }
  hold_ms: 500

# Repeat: si mantienes, repite cada 150ms (para navegar menús)
- trigger: { kind: Axis, axis: 1, direction: Negative, threshold: 0.5 }
  action:  { type: Key, value: "Up" }
  repeat_ms: 150
```
