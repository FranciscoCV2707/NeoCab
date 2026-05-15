# NeoCab — Plan de Mejora Completa

> Basado en análisis exhaustivo de 6 frontends arcade + 11 herramientas de control.
> Fecha: 2026-05-14
> Estado: Fases 1-6 COMPLETADAS (v1.3.0)

## Proyectos Analizados

### Frontends Arcade
| Proyecto | Tecnología | UI/Temas | Controles |
|----------|-----------|----------|-----------|
| **AdvanceMAME** | C, SDL | Config .rc, colores limitados | Mapeo texto avanzado, auto-mapping, 8 joysticks |
| **AttractMode** | C++, SFML, Squirrel | Layouts en Squirrel, 50+ commands | Combos, touch, 50+ acciones |
| **AttractPlus** | C++, SFML, Squirrel | +blend modes, 9-slice, easing, rectángulos | +touch, POV hats, ejes extra, FFT audio |
| **Pegasus** | Qt5/QML | Temas QML, QtQuick | Keys API + SDL2 gamepad, provider system |
| **RetroFE** | C++, SDL2 | XML layouts, tween animations, 20+ eventos | Strategy pattern, 40+ keycodes, 4 joysticks |
| **SimpleLauncher** | .NET/WPF, MahApps | 5 temas base, 27 acentos, 3D templates | SharpDX XInput/DirectInput, deadzones |

### Herramientas de Control
| Herramienta | Enfoque | Features Clave |
|------------|---------|----------------|
| **AntiMicroX** | Gamepad → Keyboard/Mouse | Per-app profiles, shift layers (sets), mouse curves, SDL mapping |
| **Durazno** | XInput wrapper DLL | Radial+linear deadzone, anti-deadzone, linearity curves, trigger range |
| **FreePIE** | Python scripting | Plugins, 20+ device types, built-in filters, curve editor |
| **joy2key** | Joystick → Keyboard (Linux) | Simple, per-game RC files, calibration wizard |
| **JoystickGremlin** | Joystick → vJoy | Library actions, hierarchical modes, macros, Python scripts, spline curves |
| **JoystickGremlinEx** | Multi-protocol | OSC, MIDI, keyboard/mouse input, containers (Sequence/State/Repeat/Tempo) |
| **Key2Joy** | Keyboard → Xbox360 | JSON profiles, combined triggers (AND), Lua scripting, CLI |
| **UCR-AHK** | AHK plugins | Text-file plugins, profile inheritance, CLI switching |
| **UCR (C#)** | MEF plugins | HidGuardian, provider abstraction, filters, shadow mappings |
| **x360ce** | DLL wrapper XInput | Per-game GDB, controller combining, force feedback, device type spoofing |

---

## Diagnóstico de NeoCab

### Problemas Críticos — ESTADO ACTUAL
1. ~~**Sistema de temas completamente desconectado**~~ ✅ RESUELTO (Fase 1-2)
2. ~~**Dos ThemeEditores conflictivos**~~ ✅ RESUELTO (Fase 1)
3. ~~**Código muerto**~~ ✅ RESUELTO (Fase 1)
4. ~~**Input systems desconectados**~~ ✅ RESUELTO (Fase 5-6)
5. ~~**Sin navegación por teclado**~~ ✅ RESUELTO (Fase 6)
6. ~~**`list_available_themes` retorna valores hardcodeados**~~ ✅ RESUELTO (Fase 1)
7. ~~**`ArcadeContext` definido pero nunca usado**~~ ✅ RESUELTO (Fase 1)
8. ~~**PIN hardcodeados**~~ ⚠️ Pendiente
9. ~~**Tracking de juego simulado**~~ ⚠️ Pendiente
10. ~~**Ruta de ROMs hardcodeada**~~ ⚠️ Pendiente

### Fortalezas Actuales
- Tauri 2.x con backend Rust sólido (23 managers, 22 command modules)
- SQLite con WAL mode, 15+ tablas
- Media scanning con file watcher
- Shader system (GLSL) funcional
- Network discovery (mDNS + axum)
- ScreenScraper.fr integration
- Multi-ventana (main + marquee)
- i18n (EN/ES)
- 20+ documentación

---

## FASE 1: Arquitectura Base

### Objetivo
Limpiar código muerto, integrar sistemas desconectados, crear base sólida.

### 1.1 Eliminar código muerto
```
package.json:
  - zustand (no importado)
  - framer-motion (no importado)
  - @tabler/icons-react (no importado)

src/:
  - context/ArcadeContext.tsx (nunca usado)
  - components/wheel/HyperSpinWheel.tsx (nunca usado)
  - hooks/useMedia.ts (no usado en App.tsx)
  - hooks/useShaders.ts (no usado)
  - hooks/useNetwork.ts (no usado)
  - hooks/useHardware.ts (no usado)
  - hooks/useTauri.ts (no usado)
  - hooks/useGameSession.ts (no usado)
  - hooks/useLaunchMonitor.ts (no usado)
  - hooks/useLaunchOverlay.ts (no usado)
  - hooks/useGameTimeout.ts (no usado)
  - hooks/useKeyboardCoinInput.ts (no usado)
  - hooks/useEmulatorDetection.ts (no usado)
  - hooks/useWindowDetection.ts (no usado)
  - hooks/useTimer.ts (no usado)
  - components/customization/ThemeEditor.tsx (no usado)
  - components/customization/ColorPickerSection.tsx (no usado)
  - components/customization/SliderSection.tsx (no usado)
  - components/customization/MediaSettingsSection.tsx (no usado)
  - components/customization/ThemePreview.tsx (no usado)
  - components/customization/MediaManager.tsx (no usado)
```

### 1.2 Integrar useTheme en App.tsx
```typescript
// Agregar al inicio de App.tsx
import { useTheme } from './hooks/useTheme';

// Dentro de App():
const { currentTheme, loadTheme, applyTheme } = useTheme();

// Efecto para aplicar CSS variables dinámicas
useEffect(() => {
  if (!currentTheme?.colors) return;
  const root = document.documentElement;
  Object.entries(currentTheme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}, [currentTheme]);
```

### 1.3 Conectar get_theme_css del backend
```typescript
// Nuevo hook: hooks/useThemeCSS.ts
export function useThemeCSS(themeName: string) {
  useEffect(() => {
    invoke<string>('get_theme_css', { name: themeName })
      .then(css => {
        let style = document.getElementById('dynamic-theme');
        if (!style) {
          style = document.createElement('style');
          style.id = 'dynamic-theme';
          document.head.appendChild(style);
        }
        style.textContent = css;
      });
  }, [themeName]);
}
```

### 1.4 Arreglar list_available_themes
```rust
// src-tauri/src/commands/theme.rs
// Reemplazar valores hardcodeados con escaneo real del directorio
#[tauri::command]
async fn list_available_themes() -> Result<String, String> {
    let themes_dir = get_themes_directory()?;
    let mut themes = Vec::new();
    
    for entry in std::fs::read_dir(&themes_dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            let theme_path = entry.path().join("theme.json");
            if theme_path.exists() {
                let content = std::fs::read_to_string(&theme_path)?;
                let info: ThemeInfo = serde_json::from_str(&content)?;
                themes.push(info);
            }
        }
    }
    
    Ok(serde_json::json!({ "success": true, "themes": themes }).to_string())
}
```

### 1.5 Unificar ThemeEditores
- Eliminar `src/components/customization/` completo
- Expandir `src/components/studio/ThemeEditor.tsx` para incluir:
  - Color pickers para cada variable
  - Sliders para sizes/spacing
  - Preview en tiempo real
  - Export/Import de temas
  - Templates predefinidos

---

## FASE 2: Sistema de Temas HyperSpin-Style

### 2.1 Estructura de Temas
```
data/themes/
  ├── classic-arcade/
  │   ├── theme.json          # Metadatos + colores + config
  │   ├── layout.json         # Posiciones de elementos
  │   ├── preview.png         # Screenshot del tema
  │   ├── assets/             # Imágenes del tema (fondos, bordes)
  │   └── sounds/             # Sonidos de navegación
  ├── neon-future/
  ├── retro-crt/
  ├── minimal-clean/
  └── cyberpunk/
```

### 2.2 Formato theme.json
```json
{
  "name": "Classic Arcade",
  "author": "NeoCab",
  "version": "1.0",
  "style": "arcade",
  "description": "Tema clásico estilo arcade con neon glow",
  "colors": {
    "primary": "#ff6b00",
    "secondary": "#1a1a1a",
    "accent": "#00ffcc",
    "text": "#ffffff",
    "background": "#0d0d0d",
    "surface": "#1a1a1a",
    "border": "#ff6b00",
    "highlight": "#ff8c00",
    "success": "#00ff00",
    "warning": "#ffcc00",
    "error": "#ff0000"
  },
  "fonts": {
    "main": { "family": "Arial", "size": 16 },
    "title": { "family": "Impact", "size": 48 },
    "subtitle": { "family": "Arial", "size": 24 },
    "mono": { "family": "Consolas", "size": 14 }
  },
  "layout": {
    "system_view": "carousel",
    "game_view": "split",
    "wheel_style": "3d",
    "transition": "slide",
    "animation_speed": 300,
    "easing": "easeOutCubic"
  },
  "media": {
    "video_enabled": true,
    "video_loop": true,
    "snap_type": "video",
    "marquee_enabled": true,
    "wheel_enabled": true,
    "box_art_enabled": true
  },
  "sounds": {
    "navigate": "sounds/nav.wav",
    "select": "sounds/select.wav",
    "back": "sounds/back.wav",
    "coin": "sounds/coin.wav",
    "start": "sounds/start.wav"
  },
  "effects": {
    "scanlines": false,
    "crt_curve": 0,
    "glow_intensity": 0.5,
    "shadow_enabled": true
  }
}
```

### 2.3 Formato layout.json (inspirado en RetroFE XML)
```json
{
  "width": 1920,
  "height": 1080,
  "components": {
    "system_carousel": {
      "type": "carousel",
      "position": { "x": "center", "y": "center" },
      "size": { "width": "100%", "height": 400 },
      "item_size": { "width": 300, "height": 200 },
      "visible_items": 5,
      "animation": {
        "onFocus": { "scale": 1.2, "duration": 200 },
        "onBlur": { "scale": 0.8, "opacity": 0.5, "duration": 200 }
      }
    },
    "game_list": {
      "type": "list",
      "position": { "x": 50, "y": 100 },
      "size": { "width": 600, "height": 800 },
      "item_height": 60,
      "visible_items": 12
    },
    "preview_panel": {
      "type": "panel",
      "position": { "x": 700, "y": 100 },
      "size": { "width": 1170, "height": 800 },
      "elements": [
        { "type": "video", "position": { "x": 0, "y": 0 }, "size": { "width": "100%", "height": 400 } },
        { "type": "wheel", "position": { "x": 0, "y": 420 }, "size": { "width": 300, "height": 150 } },
        { "type": "text", "field": "title", "position": { "x": 320, "y": 420 }, "font": "title" },
        { "type": "text", "field": "description", "position": { "x": 320, "y": 500 }, "font": "main" },
        { "type": "metadata", "fields": ["year", "developer", "genre", "players"], "position": { "x": 320, "y": 650 } }
      ]
    },
    "status_bar": {
      "type": "bar",
      "position": { "x": 0, "y": "bottom" },
      "size": { "width": "100%", "height": 40 },
      "elements": [
        { "type": "text", "field": "credits", "align": "left" },
        { "type": "text", "field": "timer", "align": "center" },
        { "type": "text", "field": "clock", "align": "right" }
      ]
    }
  }
}
```

### 2.4 Asignación de Temas
```json
// config/theme_assignments.json
{
  "global_theme": "classic-arcade",
  "system_overrides": {
    "mame": "retro-crt",
    "nes": "retro-crt",
    "snes": "retro-crt",
    "psx": "neon-future",
    "steam": "minimal-clean",
    "pinball": "cyberpunk"
  },
  "game_overrides": {
    "mame:pacman": "retro-crt",
    "mame:streetfighter2": "neon-future"
  }
}
```

### 2.5 Theme Editor Unificado
**Ubicación:** `src/components/studio/ThemeEditor.tsx`

**Funcionalidades:**
- **Vista previa en vivo** — Cambios se reflejan inmediatamente
- **Editor de colores** — Color picker para cada variable CSS
- **Editor de layout** — Drag-and-drop para posicionar componentes
- **Editor de fuentes** — Selector de fuentes + tamaños
- **Editor de sonidos** — Asignar sonidos a acciones
- **Editor de efectos** — Toggle scanlines, CRT, glow
- **Templates** — 5 plantillas predefinidas para empezar
- **Exportar** — Generar `.neotheme` (ZIP con theme.json + assets)
- **Importar** — Cargar `.neotheme` compartido
- **Guardar** — Guardar en `data/themes/<nombre>/`

---

## FASE 3: UI Visual — Múltiples Estilos

### 3.1 Estilos Predefinidos

| Estilo | Descripción | Inspiración | Colores Clave |
|--------|-------------|-------------|---------------|
| **Arcade Classic** | Neon glow, scanlines, CRT feel | AdvanceMAME + RetroFE | `#ff6b00`, `#1a1a1a`, `#00ffcc` |
| **Neon Future** | Vibrantes, gradientes, glow | AttractPlus blend modes | `#ff00ff`, `#00ffff`, `#0d0d0d` |
| **Minimal Clean** | Limpio, moderno, flat | SimpleLauncher MahApps | `#ffffff`, `#f5f5f5`, `#0078d4` |
| **Retro CRT** | Efecto CRT real con shaders | Pegasus + GLSL | `#33ff33`, `#0d1a0d`, `#00ff00` |
| **Cyberpunk** | Dark + neon, glitch effects | AttractPlus shaders | `#ff006e`, `#8338ec`, `#0d0d0d` |

### 3.2 Sistema de Animaciones (inspirado en AttractPlus easing)
```typescript
// src/utils/easing.ts
export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number) => Math.sqrt(1 - (--t) * t),
  easeOutBack: (t: number) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeOutBounce: (t: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};
```

### 3.3 Componentes a Mejorar

**MainMenu:**
- Hero section con logo animado (glow pulse)
- Botones con efectos hover 3D (scale + shadow)
- Background con partículas o grid animado
- Indicador de credits/timer en esquina

**SystemSelect:**
- Carousel 3D como HyperSpin (perspective + rotation)
- Wheel de sistemas con snap animation
- Preview del sistema seleccionado (logo + game count)
- Background dinámico según sistema

**GameList:**
- Vista split mejorada con video preview grande
- Metadata animada (fade in al cambiar selección)
- Wheel/logo del juego seleccionado
- Indicador de favoritos con animación
- Scroll suave con momentum

**AttractMode:**
- Video attract con transiciones crossfade
- "PRESS START TO PLAY" con animación breathe/blink
- Rotación de videos cada 30s
- Mostrar metadata del juego actual

**Transiciones entre vistas:**
- Slide, fade, scale, flip
- Configurable por tema
- Duración configurable

---

## FASE 4: Sistema de Coins/Tiempo Configurable

### 4.1 Modos de Juego

| Modo | Descripción | Uso |
|------|-------------|-----|
| **arcade** | Créditos clásicos (1 coin = 1 credit = X min) | MAME, arcade |
| **timed** | 1 crédito = X minutos de juego | SNES, PSX, emuladores |
| **unlimited** | Sin restricciones | Steam, aplicaciones |
| **token** | Fichas físicas (GPIO/Arduino) | Cabinas con monedero |

### 4.2 Configuración por Sistema
```json
// config/system_modes.json
[
  {
    "system_id": 1,
    "system_name": "MAME",
    "mode": "arcade",
    "arcade": {
      "coins_per_credit": 1,
      "time_per_credit_minutes": 3,
      "max_credits": 99,
      "coin_sound": "coin.wav",
      "free_play": false,
      "continue_cost": 1,
      "max_continues": 5
    }
  },
  {
    "system_id": 2,
    "system_name": "SNES",
    "mode": "timed",
    "timed": {
      "minutes_per_credit": 5,
      "max_time_minutes": 60,
      "warning_at_minutes": 2,
      "warning_sound": "warning.wav",
      "pause_allowed": true,
      "pause_limit_minutes": 5,
      "pause_max_count": 3
    }
  },
  {
    "system_id": 3,
    "system_name": "Steam",
    "mode": "unlimited"
  }
]
```

### 4.3 Flujo de Juego
```
[Insert Coin] → [Credit +1] → [Press Start] → [Timer inicia]
     ↓                                    ↓
[Credit display]                   [Countdown visible]
     ↓                                    ↓
                                 [Warning a 2min] → [0:00]
                                                      ↓
                                              [Game Over screen]
                                                      ↓
                                    [Insert Coin para continuar] o [Salir]
```

### 4.4 Backend — SessionManager (nuevo)
```rust
// src-tauri/src/core/session_manager.rs
pub struct SessionManager {
    coin_manager: Arc<RwLock<CoinManager>>,
    timer_manager: Arc<RwLock<TimerManager>>,
    config: Arc<RwLock<AppConfig>>,
}

impl SessionManager {
    pub fn insert_coin(&self, system_id: i64) -> Result<SessionState> {
        let mode = self.get_system_mode(system_id)?;
        match mode {
            SystemMode::Arcade(config) => {
                self.coin_manager.add_credits(config.coins_per_credit)?;
                Ok(SessionState::CreditAdded)
            }
            SystemMode::Timed(config) => {
                self.timer_manager.add_time(config.minutes_per_credit * 60)?;
                Ok(SessionState::TimeAdded)
            }
            SystemMode::Unlimited => Ok(SessionState::NoRestriction),
        }
    }

    pub fn start_session(&self, system_id: i64, game_id: i64) -> Result<SessionState> {
        let mode = self.get_system_mode(system_id)?;
        match mode {
            SystemMode::Arcade(config) => {
                let credits = self.coin_manager.get_credits()?;
                if credits <= 0 && !config.free_play {
                    return Ok(SessionState::NoCredits);
                }
                if !config.free_play {
                    self.coin_manager.spend_credit()?;
                }
                self.timer_manager.start(config.time_per_credit_minutes * 60)?;
                Ok(SessionState::SessionStarted)
            }
            SystemMode::Timed(config) => {
                let remaining = self.timer_manager.get_remaining()?;
                if remaining <= 0 {
                    return Ok(SessionState::NoTime);
                }
                self.timer_manager.start(remaining)?;
                Ok(SessionState::SessionStarted)
            }
            SystemMode::Unlimited => Ok(SessionState::SessionStarted),
        }
    }

    pub fn check_session(&self) -> Result<SessionState> {
        let remaining = self.timer_manager.get_remaining()?;
        if remaining <= 0 {
            return Ok(SessionState::SessionExpired);
        }
        let warning = self.get_warning_threshold()?;
        if remaining <= warning {
            return Ok(SessionState::Warning { remaining });
        }
        Ok(SessionState::Active { remaining })
    }
}

pub enum SessionState {
    CreditAdded,
    TimeAdded,
    NoCredits,
    NoTime,
    SessionStarted,
    SessionExpired,
    Warning { remaining: u64 },
    Active { remaining: u64 },
    NoRestriction,
}
```

### 4.5 Eventos Tauri
```rust
// Eventos emitidos al frontend
emit("coin_inserted", { credits: 5 });
emit("credit_updated", { credits: 4 });
emit("timer_started", { total_seconds: 300 });
emit("timer_tick", { remaining_seconds: 120 });
emit("timer_warning", { remaining_seconds: 120 });
emit("time_expired", {});
emit("session_ended", { total_played: 295 });
```

### 4.6 Frontend — Coin/Timer Overlay
```typescript
// components/hardware/CoinTimerOverlay.tsx
// Muestra credits + timer en esquina de pantalla
// Warning visual cuando queda poco tiempo
// Screen de "Game Over" con opción de insertar coins
```

### 4.7 Configuración en Operator Panel
- Tab "Coins & Time" en OperatorPanel
- Selector de modo por sistema (arcade/timed/unlimited)
- Sliders para tiempos, credits, warnings
- Toggle free_play
- Test de monedero (si aplica)

---

## FASE 5: Sistema de Controles Mejorado

### 5.1 Arquitectura Unificada
```
Input System
├── Device Layer (gilrs/SDL2)
│   ├── Gamepad detection (hot-plug)
│   ├── Multi-gamepad support (hasta 4)
│   └── Device identification (GUID, name, type)
│
├── Mapping Layer (JoyMapper mejorado)
│   ├── Button → Key injection (SendInput/uinput)
│   ├── Button → Macro (secuencia de teclas)
│   ├── Axis → Key (con deadzone/curves)
│   ├── Button → Mouse events
│   ├── Button → ArcadeAction (coin, start, pause)
│   └── Button → Internal (UI navigation)
│
├── Profile System
│   ├── Global profile (default)
│   ├── Per-system profiles
│   ├── Per-game profiles
│   └── Auto-switching (como AntiMicroX)
│
├── Processing Layer
│   ├── Deadzone (radial + linear)
│   ├── Anti-deadzone
│   ├── Response curves (Linear, Exponential, Digital, Spline)
│   ├── Hold/Repeat logic
│   └── Stick delay (smoothing)
│
└── Output Layer
    ├── Windows: SendInput (XP-11 compatible)
    ├── Linux: uinput
    └── ARM: GPIO + uinput
```

### 5.2 Perfil de Control (YAML)
```yaml
# config/joy_profiles/snes-controller.yaml
profile:
  name: "SNES Controller"
  device_guid: "03000000-xxxx"
  version: 2

deadzone:
  left_stick: { type: "radial", value: 0.15 }
  right_stick: { type: "radial", value: 0.15 }
  triggers: { value: 0.1 }

response_curves:
  left_stick: { type: "exponential", exponent: 2.0 }
  right_stick: { type: "exponential", exponent: 2.0 }

mappings:
  # UI Navigation
  - input: "dpad_up"
    output: { type: "key", key: "Up" }
  - input: "dpad_down"
    output: { type: "key", key: "Down" }
  - input: "dpad_left"
    output: { type: "key", key: "Left" }
  - input: "dpad_right"
    output: { type: "key", key: "Right" }
  - input: "button_south"
    output: { type: "key", key: "Return" }
  - input: "button_east"
    output: { type: "key", key: "Escape" }

  # Arcade Actions
  - input: "button_west"
    output: { type: "arcade_action", action: "insert_coin" }
  - input: "button_north"
    output: { type: "arcade_action", action: "pause" }
  - input: "start"
    output: { type: "arcade_action", action: "launch_game" }
  - input: "select"
    output: { type: "arcade_action", action: "toggle_menu" }

  # Macro example (como JoystickGremlin)
  - input: "button_left_shoulder"
    output:
      type: "macro"
      sequence:
        - { type: "key", key: "F5", hold_ms: 50 }
        - { type: "key", key: "1", hold_ms: 50 }
        - { type: "key", key: "Return", hold_ms: 50 }
      repeat: "hold"  # hold, toggle, count

  # Axis to keys (con deadzone y curves)
  - input: "left_stick_x"
    output:
      type: "axis_to_keys"
      negative: { type: "key", key: "Left" }
      positive: { type: "key", key: "Right" }
      deadzone: 0.2
      response_curve: "exponential"

# Shift layers (como AntiMicroX sets)
sets:
  - name: "default"
    mappings: [ ... ]
  - name: "shift"
    toggle_button: "button_right_shoulder"
    mappings:
      - input: "button_south"
        output: { type: "arcade_action", action: "quick_save" }
      - input: "button_east"
        output: { type: "arcade_action", action: "quick_load" }
```

### 5.3 Funciones Avanzadas por Implementar

| Feature | Inspirado en | Descripción |
|---------|-------------|-------------|
| **Shift layers** | AntiMicroX sets | Múltiples sets por perfil, toggle con botón |
| **Response curves** | Durazno linearity | Linear, Exponential, Digital, Custom spline |
| **Radial deadzone** | Durazno | Deadzone circular para sticks |
| **Anti-deadzone** | Durazno/x360ce | Para juegos con deadzones internos grandes |
| **Macro system** | JoystickGremlin | Hold/Toggle/Count repeat modes |
| **Per-game profiles** | AntiMicroX + x360ce | Auto-switch por juego/sistema |
| **Multi-gamepad** | UCR | Hasta 4 gamepads simultáneos |
| **Stick delay** | AntiMicroX | Smoothing para cambios de dirección |
| **Trigger range** | Durazno | Min/max range para triggers |
| **Rumble control** | x360ce | Force feedback strength multiplier |
| **Button combos** | AttractMode | Múltiples inputs → una acción |
| **Hold actions** | JoystickGremlin | Acción diferente si se mantiene presionado |

### 5.4 Input Wizard Mejorado
- Grabación de inputs (ya existe, mejorar UI)
- Visualización del gamepad en tiempo real (todos los botones/axes)
- Test de deadzone con visualización gráfica
- Test de response curves con gráfico interactivo
- Importar perfiles de AntiMicroX (XML → YAML)
- Templates predefinidos:
  - Arcade Stick (8way + 6 buttons)
  - SNES Pad (D-pad + 4 buttons)
  - Xbox Controller
  - PlayStation Controller
  - Flight Stick
  - Racing Wheel

### 5.5 Compatibilidad Multi-Plataforma

| Plataforma | Input Backend | Output Backend | Notas |
|-----------|--------------|----------------|-------|
| **Windows XP-7** | SDL2 | SendInput (WinAPI) | Sin XInput, usar DirectInput |
| **Windows 8-11** | SDL2 + XInput | SendInput (WinAPI) | XInput nativo |
| **Linux x86** | SDL2 + evdev | uinput | Requiere permisos |
| **Linux ARM** | SDL2 + evdev | uinput + GPIO | Raspberry Pi |
| **macOS** | SDL2 | CGEvent | Limitado |

---

## FASE 6: Navegación UI Integrada

### 6.1 Problema Actual
- Solo gamepad via browser Gamepad API
- Sin navegación por teclado
- Frontend y backend input systems desconectados

### 6.2 Solución: Unified Input Hook
```typescript
// hooks/useUnifiedInput.ts
interface InputConfig {
  keyboard: boolean;
  gamepad: boolean;
  gamepadIndex: number;
}

interface InputCallbacks {
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onConfirm: () => void;
  onBack: () => void;
  onCoin: () => void;
  onStart: () => void;
  onPause: () => void;
}

export function useUnifiedInput(config: InputConfig, callbacks: InputCallbacks) {
  // Keyboard events
  useEffect(() => {
    if (!config.keyboard) return;
    const handler = (e: KeyboardEvent) => {
      const action = mapKeyboardToAction(e.key);
      if (action) {
        e.preventDefault();
        executeCallback(action, callbacks);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [config.keyboard, callbacks]);

  // Gamepad events (via backend JoyMapper)
  useEffect(() => {
    if (!config.gamepad) return;
    // Poll backend for gamepad state via Tauri
    const interval = setInterval(async () => {
      const state = await invoke<string>('get_gamepad_state', { index: config.gamepadIndex });
      const actions = parseGamepadState(state);
      actions.forEach(action => executeCallback(action, callbacks));
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [config.gamepad, config.gamepadIndex, callbacks]);
}

function mapKeyboardToAction(key: string): string | null {
  const map: Record<string, string> = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Enter': 'confirm',
    'Escape': 'back',
    'Backspace': 'back',
    '5': 'coin',      // Arcade coin 1
    '1': 'start',     // Arcade start 1
    'p': 'pause',
    'F5': 'quick_save',
    'F7': 'quick_load',
  };
  return map[key] || null;
}
```

### 6.3 Keymap Configurable
```json
// config/keymap.json
{
  "keyboard": {
    "up": ["ArrowUp", "W"],
    "down": ["ArrowDown", "S"],
    "left": ["ArrowLeft", "A"],
    "right": ["ArrowRight", "D"],
    "confirm": ["Enter", "Space"],
    "back": ["Escape", "Backspace"],
    "coin": ["5", "ShiftLeft"],
    "start": ["1"],
    "pause": ["P", "Pause"],
    "quick_save": ["F5"],
    "quick_load": ["F7"],
    "screenshot": ["F12"],
    "toggle_menu": ["Tab"]
  },
  "gamepad": {
    "up": ["dpad_up", "left_stick_up"],
    "down": ["dpad_down", "left_stick_down"],
    "left": ["dpad_left", "left_stick_left"],
    "right": ["dpad_right", "left_stick_right"],
    "confirm": ["button_south"],
    "back": ["button_east"],
    "coin": ["button_west"],
    "start": ["start"],
    "pause": ["button_north"],
    "quick_save": ["button_left_shoulder"],
    "quick_load": ["button_right_shoulder"]
  }
}
```

---

## Hoja de Ruta Sugerida

### Semana 1-2: Fase 1 (Arquitectura) ✅ COMPLETADA
- [x] Eliminar dependencias no usadas
- [x] Integrar useTheme en App.tsx
- [x] Conectar get_theme_css
- [x] Arreglar list_available_themes
- [x] Unificar ThemeEditores

### Semana 3-5: Fase 2 (Temas) ✅ COMPLETADA
- [x] Crear estructura de temas
- [x] Implementar theme.json + layout.json
- [x] Asignación per-system/per-game
- [x] Theme Editor unificado con preview
- [x] Export/Import de temas
- [x] 5 templates predefinidos

### Semana 6-7: Fase 3 (UI Visual) ✅ COMPLETADA
- [x] Sistema de easing/animaciones
- [x] Mejorar MainMenu (hero, botones 3D)
- [x] Mejorar SystemSelect (carousel 3D)
- [x] Mejorar GameList (video preview, metadata)
- [x] Mejorar AttractMode (transitions)
- [x] Transiciones entre vistas

### Semana 8-9: Fase 4 (Coins/Tiempo) ✅ COMPLETADA
- [x] SessionManager en Rust
- [x] Configuración por sistema
- [x] Eventos Tauri para coin/timer
- [x] Frontend overlay (credits + timer) — SessionOverlay component
- [x] Warning visual + Game Over screen — animaciones + timer expired
- [x] Configuración en Operator Panel — SessionConfig tab
- [ ] Frontend overlay (credits + timer)
- [ ] Warning visual + Game Over screen
- [ ] Configuración en Operator Panel

### Semana 10-13: Fase 5 (Controles) ✅ COMPLETADA
- [x] JoyMapper mejorado (curves, deadzones)
- [x] Profile system (global/system/game)
- [x] Macro system
- [x] Shift layers
- [x] Multi-gamepad support
- [x] Input Wizard mejorado
- [x] Import AntiMicroX profiles
- [x] Templates de controles

### Semana 14: Fase 6 (Navegación) ✅ COMPLETADA
- [x] useUnifiedInput hook
- [x] Keymap configurable
- [x] Keyboard navigation completa
- [x] Integración frontend-backend input

---

## Referencias Clave

### Patrones Aprendidos
| Patrón | Mejor Ejemplo | Aplicación en NeoCab |
|--------|--------------|---------------------|
| Script-driven UI | AttractMode (Squirrel) | Layout.json + theme.json |
| Tween animations | RetroFE (20+ eventos) | Sistema de easing + CSS transitions |
| Provider system | Pegasus (game data) | Media providers, metadata providers |
| Plugin architecture | UCR (MEF), JoystickGremlin | Action plugins para input |
| Per-app profiles | AntiMicroX | Per-system/per-game profiles |
| Response curves | Durazno (linearity) | Deadzone + curve processing |
| Container system | JoystickGremlinEx | Macros con Sequence/State/Repeat |
| Theme colors | SimpleLauncher (27 accents) | Sistema de colores + acentos |
| DLL wrapper | x360ce, Durazno | Per-game input config |

### Formatos de Configuración
| Formato | Usado por | Recomendación NeoCab |
|---------|----------|---------------------|
| YAML | NeoCab actual, JoystickGremlin | Perfiles de control |
| JSON | NeoCab actual, Key2Joy | Temas, keymaps, config |
| XML | RetroFE, AntiMicroX, UCR | Layouts de temas (alternativa) |
| INI | Durazno, x360ce, joy2key | Config simple (no recomendado) |

---

## Notas de Compatibilidad

### Windows XP
- Tauri 2.x NO soporta Windows XP nativamente
- Opción: compilar con WebView2 fallback o usar Tauri 1.x
- Alternativa: build separado con backend Rust puro + UI web embebida
- SendInput funciona en XP sin problemas
- SDL2 funciona en XP con compilación adecuada

### Linux ARM (Raspberry Pi)
- SDL2 + evdev para input
- uinput para output (requiere `sudo` o grupo `input`)
- GPIO para monedero físico (opcional)
- Renderizado optimizado con KMS/DRM

### Performance
- Virtual scrolling en game list (ya implementado, mantener)
- Lazy loading de media (videos solo al enfocar)
- Image caching (ya existe en backend)
- CSS animations con `will-change` y `transform` (GPU accelerated)
