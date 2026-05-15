# 🕹️ Documentación Técnica: NeoCab JoyMapper Engine v2

El **JoyMapper Nativo** de NeoCab es un motor de gestión de entrada de ultra-baja latencia escrito íntegramente en Rust. Su objetivo es eliminar por completo la necesidad de drivers de terceros y herramientas de mapeo externas.

**Versión:** 2.0 (v1.2) — Con deadzones radiales, curvas spline, shift layers, multi-gamepad, import AntiMicroX

---

## 🏗️ Arquitectura del Motor
El motor opera en tres capas principales:

### 1. Capa de Abstracción de Hardware (HAL)
Utiliza la biblioteca `gilrs` en Rust para detectar dispositivos de juego (Gamepads, Joysticks Arcade, Encoders USB) de forma multiplataforma.
- **Detección Hot-swap**: Reconoce la conexión y desconexión de mandos en tiempo real sin reiniciar la aplicación.
- **Normalización de Ejes**: Convierte los valores crudos del hardware a un rango estándar de -1.0 a 1.0.

### 2. Capa de Inyección (OS Level)
A diferencia de otros sistemas que emulan mandos de Xbox (que requieren drivers), NeoCab inyecta las pulsaciones directamente en el sistema operativo:
- **Windows**: Utiliza `SendInput` de la WinAPI para simular pulsaciones de teclado y movimientos de ratón. Esto garantiza compatibilidad con el 99% de los emuladores (MAME, RetroArch, PCSX2, etc.).
- **Linux**: Utiliza el subsistema `uinput` del kernel para crear un dispositivo de entrada virtual.

### 3. Capa de Post-procesamiento
Antes de inyectar la señal, el motor aplica transformaciones matemáticas configurables:
- **Deadzone Lineal/Radial**: Filtra el ruido del hardware (por eje o circular combinado)
- **Anti-Deadzone**: Compensa deadzones internos de juegos
- **Curvas de Respuesta**: Linear, Exponencial, Digital, Spline (puntos de control personalizados)
- **Stick Delay**: Smoothing para cambios de dirección
- **Trigger Range**: Remapeo de rango para pedales/throttles
- **Macros Dinámicas**: Secuencias con delays y modos de repetición
- **Hold Actions**: Acción diferente para tap vs hold
- **Button Combos**: Múltiples botones → una acción (buffer 300ms)

### 4. Capa de Perfiles (v2)
- **Multi-gamepad**: JoyMapper independiente por dispositivo
- **Shift Layers**: Múltiples sets de mapeo por perfil, toggle con botón
- **Per-game profiles**: Resolución jerárquica game > system > global
- **Auto-switching**: Carga automática al cambiar de sistema/juego
- **Import AntiMicroX**: Parseo de perfiles XML de AntiMicroX
- **6 Templates**: ArcadeStick, SNES, Xbox, PlayStation, Flight, Racing

---

## 🛠️ Configuración Avanzada (`joy_profiles/`)
Los perfiles se guardan en formato YAML para facilitar la edición manual si es necesario:

```yaml
# Ejemplo de perfil avanzado para Xbox Controller
name: "Xbox Controller"
left_stick_deadzone:
  type: "radial"
  value: 0.15
  anti_deadzone: 0.0
right_stick_deadzone:
  type: "radial"
  value: 0.15
left_stick_curve:
  type: "exponential"
  factor: 2.0
trigger_range:
  min: 0.05
  max: 1.0
mappings:
  - trigger: { button: 0 }
    action: { type: "key", value: "Enter" }
  - trigger: { button: 1 }
    action: { type: "key", value: "Escape" }
  - trigger: { button: 7 }
    action: { type: "arcade_action", value: "StartGame" }
sets:
  - name: "shift"
    toggle_button: 5
    mappings:
      - trigger: { button: 0 }
        action: { type: "arcade_action", value: "QuickSave" }
      - trigger: { button: 1 }
        action: { type: "arcade_action", value: "QuickLoad" }
```

---

## 🚀 Beneficios sobre el Ecosistema Antiguo
| Característica | JoyToKey / ViGEm | NeoCab JoyMapper v2 |
|----------------|------------------|---------------------|
| **Drivers** | Requiere instalación manual | **Ninguno** (Built-in) |
| **Latencia** | Variable (Basado en polling) | **Ultra-baja** (Inyección nativa) |
| **Deadzones** | Solo lineal | **Lineal + Radial + Anti-deadzone** |
| **Curvas** | Básicas | **Linear, Exponential, Digital, Spline** |
| **Shift Layers** | No | **Sí (múltiples sets por perfil)** |
| **Multi-gamepad** | Limitado | **JoyMapper independiente por dispositivo** |
| **Import** | No | **AntiMicroX XML** |
| **Templates** | No | **6 presets incluidos** |
| **Configuración** | Interfaz externa compleja | **Setup Wizard + Tauri commands** |
| **Mantenimiento** | Puede romperse con actualizaciones | Integrado en el núcleo de Rust |

---
**NeoCab JoyMapper: Precisión milimétrica para el jugador exigente.**
