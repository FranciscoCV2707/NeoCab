# 🕹️ Documentación Técnica: NeoCab JoyMapper Engine

El **JoyMapper Nativo** de NeoCab es un motor de gestión de entrada de ultra-baja latencia escrito íntegramente en Rust. Su objetivo es eliminar por completo la necesidad de drivers de terceros y herramientas de mapeo externas.

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
- **Respuesta Exponencial**: `f(x) = x^3`. Suaviza el centro del stick y acelera los bordes.
- **Deadzone Circular**: Filtra el ruido del hardware en un radio específico del centro.
- **Macros Dinámicas**: Permite asignar combinaciones (ej. Start + Botón 1) a acciones globales como "Toggle Pause Menu".

---

## 🛠️ Configuración Avanzada (`joy_profiles/`)
Los perfiles se guardan en formato YAML para facilitar la edición manual si es necesario:

```yaml
# Ejemplo de perfil para MAME
device_name: "Generic USB Joystick"
deadzone: 0.15
response_curve: "Exponential"
mappings:
  - hardware_id: 0
    action: "UP"
    key_code: "UpArrow"
  - hardware_id: 1
    action: "DOWN"
    key_code: "DownArrow"
  - combo: ["START", "SELECT"]
    action: "EXIT_TO_MENU"
```

---

## 🚀 Beneficios sobre el Ecosistema Antiguo
| Característica | JoyToKey / ViGEm | NeoCab JoyMapper |
|----------------|------------------|------------------|
| **Drivers** | Requiere instalación manual | **Ninguno** (Built-in) |
| **Latencia** | Variable (Basado en polling) | **Ultra-baja** (Inyección nativa) |
| **Configuración** | Interfaz externa compleja | **Setup Wizard** integrado |
| **Mantenimiento** | Puede romperse con actualizaciones | Integrado en el núcleo de Rust |

---
**NeoCab JoyMapper: Precisión milimétrica para el jugador exigente.**
