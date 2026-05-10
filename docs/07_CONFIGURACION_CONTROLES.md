# 🎮 ARCADECORE v3 - PARTE 7: CONFIGURACIÓN DE CONTROLES ULTRA DETALLADA

---

## TABLA MAESTRA DE INPUTS

### Mapeo estándar ArcadeCore

```
ACCIÓN             | XBOX        | PS4/PS5      | SWITCH      | ARCADE STICK | USB ENCODER
-------------------|-------------|--------------|-------------|--------------|-------------
UP                 | D-Pad Up    | D-Pad Up     | D-Pad Up    | Joystick Up  | Pin 1
DOWN               | D-Pad Down  | D-Pad Down   | D-Pad Down  | Joystick Dn  | Pin 2
LEFT               | D-Pad Left  | D-Pad Left   | D-Pad Left  | Joystick Lt  | Pin 3
RIGHT              | D-Pad Right | D-Pad Right  | D-Pad Right | Joystick Rt  | Pin 4
SELECT (A)         | A (Green)   | X (Blue)     | B (Red)     | Button 1     | Pin 5
BACK (B)           | B (Red)     | O (Red)      | A (Yellow)  | Button 2     | Pin 6
BUTTON 3           | X (Blue)    | Square       | X (Blue)    | Button 3     | Pin 7
BUTTON 4           | Y (Yellow)  | Triangle     | Y (Yellow)  | Button 4     | Pin 8
BUTTON 5           | LB          | L1           | L           | Button 5     | Pin 9
BUTTON 6           | RB          | R1           | R           | Button 6     | Pin 10
START              | Start       | Options      | +           | Start        | Pin 11
MENU               | Back        | Share        | -           | Coin/Menu    | Pin 12
COIN INSERT        | Select      | Touch Pad    | Capture     | Coin         | GND/Coin
SCREENSHOT        | Home        | PS Button    | Home        | N/A          | N/A
```

---

## CONFIGURACIÓN POR DISPOSITIVO

### 1. XBOX 360 / XBOX ONE / XBOX SERIES

**Capacidades:**
- ✅ D-Pad (4 botones)
- ✅ Left Thumbstick (analógico) → Navigation
- ✅ Right Thumbstick (analógico) → Ignorado
- ✅ 4 botones principales (A, B, X, Y)
- ✅ 2 bumpers (LB, RB)
- ✅ 2 triggers analógicos (LT, RT) → Botones 5/6
- ✅ Start, Back
- ✅ Left/Right stick press

**config/inputs.yaml:**
```yaml
controllers:
  xbox_one:
    device_pattern: "Xbox"
    type: "gamepad"
    mapping:
      navigation:
        up: "DPad_Up"
        down: "DPad_Down"
        left: "DPad_Left"
        right: "DPad_Right"
        # Alternativa: usar thumbstick para navegación lenta
        up_analog: "LeftY_negative"  # Si prefieres
      
      actions:
        select: "A"          # Botón verde
        back: "B"            # Botón rojo
        button_3: "X"        # Botón azul
        button_4: "Y"        # Botón amarillo
        button_5: "LB"
        button_6: "RB"
        
      triggers:
        lt_as_button: true   # LT = Button 7
        rt_as_button: true   # RT = Button 8
        
      menu:
        menu: "Back"
        start: "Start"
```

### 2. PlayStation DualShock 4 / DualSense 5

**Capacidades:**
- ✅ D-Pad (4 botones)
- ✅ Left Thumbstick
- ✅ Right Thumbstick
- ✅ 4 botones principales (X, Circle, Square, Triangle)
- ✅ L1, R1 bumpers
- ✅ L2, R2 triggers analógicos
- ✅ Share, Options
- ✅ Touch Pad (128x64 pixels)
- ✅ Gyro (opcional)
- ✅ Haptic feedback (DualSense)

**config/inputs.yaml:**
```yaml
controllers:
  ps4_ps5:
    device_pattern: "Playstation|Dualsense"
    type: "gamepad"
    mapping:
      navigation:
        up: "DPad_Up"
        down: "DPad_Down"
        left: "DPad_Left"
        right: "DPad_Right"
      
      actions:
        select: "Square"         # Botón azul
        back: "Circle"           # Botón rojo
        button_3: "X"            # Botón azul oscuro
        button_4: "Triangle"     # Botón verde
        button_5: "L1"
        button_6: "R1"
      
      triggers:
        l2_as_button: true       # L2 = Button 7
        r2_as_button: true       # R2 = Button 8
      
      menu:
        menu: "Options"
        start: "Options"
        
      special:
        touchpad_swipe_left: "prev_game"
        touchpad_swipe_right: "next_game"
        gyro_aim: true           # Para juegos que lo soportan
```

### 3. Nintendo Switch Pro Controller

**Capacidades:**
- ✅ D-Pad (opcional, en algunos modelos)
- ✅ 4 botones direccionales (para no-Pro)
- ✅ 2 thumbsticks
- ✅ 4 botones principales (A, B, X, Y)
- ✅ L, R bumpers
- ✅ ZL, ZR triggers
- ✅ -, + buttons
- ✅ Gyro (excelente)
- ✅ HD Rumble

**config/inputs.yaml:**
```yaml
controllers:
  switch_pro:
    device_pattern: "Pro Controller"
    type: "gamepad"
    mapping:
      navigation:
        up: "DPad_Up"
        down: "DPad_Down"
        left: "DPad_Left"
        right: "DPad_Right"
      
      actions:
        select: "B"              # Botón rojo derecha
        back: "A"                # Botón amarillo derecha
        button_3: "X"            # Botón azul arriba
        button_4: "Y"            # Botón verde izq
        button_5: "L"
        button_6: "R"
      
      triggers:
        zl_as_button: true       # ZL = Button 7
        zr_as_button: true       # ZR = Button 8
      
      menu:
        menu: "Minus"
        start: "Plus"
```

### 4. 8BitDo SN30 Pro / SN30 Pro+

**Especial: Modos múltiples (Nintendo, SNES, Genesis, Arcade)**

```yaml
controllers:
  8bitdo_sn30:
    device_pattern: "8BitDo"
    type: "gamepad"
    
    modes:
      "Nintendo_Mode":
        select: "B"              # Botón rojo
        back: "A"                # Botón amarillo
        button_3: "X"
        button_4: "Y"
      
      "SNES_Mode":
        select: "B"
        back: "A"
        button_3: "X"
        button_4: "Y"
        button_5: "L"
        button_6: "R"
      
      "Genesis_Mode":
        # Mapeo Sega
        button_1: "A"
        button_2: "B"
        button_3: "C"
        button_4: "X"
        button_5: "Y"
        button_6: "Z"
      
      "Arcade_Mode":
        # Mapeo arcade straight
        button_1: "B1"
        button_2: "B2"
        button_3: "B3"
        button_4: "B4"
        button_5: "B5"
        button_6: "B6"
```

---

## ARCADE STICKS Y USB ENCODERS

### Sanwa JLF Joystick + Buttons

**Instalación física:**
```
Panel arcade:
┌─────────────────────────────┐
│ Joystick      │    Buttons  │
│               │  B1 B2 B3   │
│     (8-way)   │  B4 B5 B6   │
│               │             │
└─────────────────────────────┘
```

**USB Encoder (I-PAC 2, Zero Delay, etc):**

```yaml
controllers:
  arcade_stick:
    device_pattern: "USB.*Encoder|I-PAC|Zero Delay"
    type: "arcade_stick"
    
    mapping:
      # Joystick directions
      navigation:
        up: "Joystick_Up"
        down: "Joystick_Down"
        left: "Joystick_Left"
        right: "Joystick_Right"
      
      # 6 botones estándar arcade
      arcade_buttons:
        button_1: "Pin_5"        # Botón puro 1
        button_2: "Pin_6"        # Botón puro 2
        button_3: "Pin_7"        # Botón puro 3
        button_4: "Pin_8"        # Botón puro 4
        button_5: "Pin_9"        # Botón puro 5
        button_6: "Pin_10"       # Botón puro 6
      
      # Extra funciones
      system:
        coin: "Pin_11"
        start: "Pin_12"
        menu: "Pin_13"
        
      # Para FPS / lightgun games
      special:
        "TriggerA": "Pin_14"
        "TriggerB": "Pin_15"
```

### Configuración específica para MAME

En **config/input_profiles/mame_arcade.yaml:**

```yaml
# MAME-specific mappings
mame_arcade:
  player_1:
    # Coin / Insert
    insert_coin: "Pin_11"
    
    # Start
    p1_start: "Pin_12"
    
    # Joystick + botones arcade
    p1_joystick_up: "Joystick_Up"
    p1_joystick_down: "Joystick_Down"
    p1_joystick_left: "Joystick_Left"
    p1_joystick_right: "Joystick_Right"
    
    p1_button_1: "Pin_5"     # Punch / Button 1
    p1_button_2: "Pin_6"     # Kick / Button 2
    p1_button_3: "Pin_7"     # Button 3
    p1_button_4: "Pin_8"     # Button 4
    p1_button_5: "Pin_9"     # Button 5
    p1_button_6: "Pin_10"    # Button 6
  
  player_2:
    insert_coin: "Pin_11"
    p2_start: "Pin_12"
    
    p2_joystick_up: "Joystick2_Up"
    p2_joystick_down: "Joystick2_Down"
    p2_joystick_left: "Joystick2_Left"
    p2_joystick_right: "Joystick2_Right"
    
    p2_button_1: "Pin_20"
    p2_button_2: "Pin_21"
    p2_button_3: "Pin_22"
    p2_button_4: "Pin_23"
    p2_button_5: "Pin_24"
    p2_button_6: "Pin_25"
  
  # Service mode
  service_menu: "Pin_26"
  test_switch: "Pin_27"
```

---

## LIGHT GUNS Y DISPOSITIVOS ESPECIALES

### Sinden Light Gun

```yaml
controllers:
  sinden_lightgun:
    device_pattern: "Sinden"
    type: "lightgun"
    
    # Usa mouse-like positioning
    aiming:
      x_axis: "MouseX"
      y_axis: "MouseY"
    
    triggers:
      trigger_a: "LeftClick"
      trigger_b: "RightClick"
      pump_action: "MiddleClick"
    
    # Para calibración
    calibration:
      corner_tl: "Keyboard_1"
      corner_br: "Keyboard_2"
      auto_calibrate_on_boot: true
```

### Trackball (Spinners para juegos Arkanoid, Breakout, etc)

```yaml
controllers:
  trackball:
    device_pattern: "TrackBall|Spinner"
    type: "trackball"
    
    axis:
      x_movement: "Trackball_X"
      y_movement: "Trackball_Y"
      sensitivity: 1.5
      deadzone: 0.05
    
    buttons:
      left_click: "Button_1"
      right_click: "Button_2"
```

### Steering Wheel (Racing games)

```yaml
controllers:
  steering_wheel:
    device_pattern: "Logitech|Thrustmaster|Fanatec"
    type: "steering_wheel"
    
    wheel:
      axis: "X_Rotation"
      sensitivity: 2.0
      deadzone: 0.1
      inverted: false
      force_feedback: true
    
    pedals:
      accelerator: "Y_Axis"
      brake: "Slider_1"
      clutch: "Slider_2"
    
    buttons:
      shift_up: "Button_1"
      shift_down: "Button_2"
      handbrake: "Button_3"
```

---

## CONFIGURACIÓN POR JUEGO

Ejemplo: **Street Fighter II** requiere botones específicos

**config/input_profiles/games/street_fighter_2.yaml:**

```yaml
game_profile: "Street Fighter II"
emulator: "mame"
systems: ["cps1", "cps2"]

player_1:
  # 6 botones clásicos SF
  jab: "Button_1"
  strong: "Button_2"
  fierce: "Button_3"
  short: "Button_4"
  forward: "Button_5"
  roundhouse: "Button_6"
  
  # Joystick
  up: "Joystick_Up"
  down: "Joystick_Down"
  left: "Joystick_Left"
  right: "Joystick_Right"

player_2:
  # Similar para player 2
  jab: "Button_20"
  strong: "Button_21"
  # ...
```

---

## HOTKEYS / COMBINACIONES

```yaml
hotkeys:
  # Emulador-específicas
  retroarch_save_state: "Ctrl+L1"
  retroarch_load_state: "Ctrl+L2"
  retroarch_menu: "Select+Start"
  
  # Globales ArcadeCore
  return_to_menu: "Escape"
  screenshot: "F12"
  toggle_pause: "P"
  operator_panel: "Ctrl+Alt+O"
  
  # Debug (solo en dev mode)
  show_fps: "F1"
  toggle_fullscreen: "F11"
```

---

## CALIBRACIÓN Y TESTING

```tsx
// src/pages/InputTest.tsx
export function InputTest() {
  return (
    <div className="input-test">
      <h2>Input Device Test</h2>
      
      <div className="joystick-test">
        <h3>Joystick Position</h3>
        <div className="cross">
          <div className="vertical"></div>
          <div className="horizontal"></div>
          <div className="cursor"></div>
        </div>
      </div>
      
      <div className="button-test">
        <h3>Buttons</h3>
        {Array(10).fill(0).map((_, i) => (
          <button key={i} className={pressed[i] ? 'active' : ''}>
            {i + 1}
          </button>
        ))}
      </div>
      
      <div className="axis-test">
        <h3>Analog Axes</h3>
        <div className="axis-display">LT: {axes.lt}</div>
        <div className="axis-display">RT: {axes.rt}</div>
        <div className="axis-display">LX: {axes.lx}</div>
        <div className="axis-display">LY: {axes.ly}</div>
      </div>
    </div>
  );
}
```

---

## AUTO-DETECCIÓN DE DISPOSITIVOS

```rust
// input/device_detection.rs
pub async fn detect_arcade_stick(device_name: &str, vendor_id: u16, product_id: u16) -> bool {
    // Detectar por patrón de nombre
    if device_name.contains("I-PAC") || device_name.contains("encoder") {
        return true;
    }
    
    // Detectar por vendor ID conocido
    match vendor_id {
        0x16C0 => true,  // VOTI
        0x0B9E => true,  // Genius
        0x0C45 => true,  // Microdia
        _ => false,
    }
}

pub async fn auto_profile_assignment(device: &InputDevice) -> String {
    // Asignar profile automáticamente según tipo
    match device.device_type.as_str() {
        "arcade_stick" => "arcade_default".to_string(),
        "gamepad" => {
            if device.name.contains("Xbox") { "xbox_default".to_string() }
            else if device.name.contains("Playstation") { "ps4_default".to_string() }
            else if device.name.contains("Switch") { "switch_default".to_string() }
            else { "gamepad_default".to_string() }
        }
        "lightgun" => "lightgun_default".to_string(),
        _ => "default".to_string(),
    }
}
```

---

## MIGRACIÓN DE ARCADECORE v2 a v3

Si ya tienes config de otra versión:

```bash
# Convertir formato viejo a nuevo
python3 migrate_inputs.py old_config.yaml > new_inputs.yaml

# Script:
```

```python
import yaml

def migrate_inputs(old_file):
    with open(old_file) as f:
        old = yaml.safe_load(f)
    
    new = {
        'controllers': {},
        'hotkeys': {}
    }
    
    # Mapear controladores
    for name, config in old.get('controllers', {}).items():
        new['controllers'][name] = {
            'device_pattern': config.get('pattern'),
            'type': config.get('type', 'gamepad'),
            'mapping': config.get('mapping', {})
        }
    
    with open('new_inputs.yaml', 'w') as f:
        yaml.dump(new, f)

if __name__ == '__main__':
    migrate_inputs('old_inputs.yaml')
```

---

## SIGUIENTE: PARTE 8 - CHECKLIST FINAL Y RESUMEN
