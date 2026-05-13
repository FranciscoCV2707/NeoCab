# 🕹️ Módulo 16: JoyMapper Nativo (Universal)

NeoCab v1.0 ha reemplazado oficialmente la dependencia de software externo como JoyToKey por un motor de mapeo nativo escrito en Rust. Este sistema es el corazón de la compatibilidad de hardware del sistema.

## 🚀 Características Principales

### 1. Compatibilidad Universal (Zero-Driver)
*   **Windows XP a 11:** Utiliza inyección de bajo nivel mediante la API nativa `SendInput`. No requiere instalación de drivers adicionales.
*   **Linux y ARM:** Utiliza el sistema `uinput` del kernel para crear dispositivos virtuales de entrada.

### 2. Curvas de Respuesta Profesionales
Permite ajustar cómo reacciona el juego a tus movimientos físicos:
*   **Lineal:** Respuesta 1:1.
*   **Exponencial:** Ideal para juegos que requieren precisión en el centro y velocidad en los bordes.
*   **Digital:** Convierte sticks analógicos en pulsaciones digitales puras (On/Off).

### 3. Anti-Deadzone
Lógica avanzada para compensar el desgaste de potenciómetros en palancas arcade antiguas, asegurando que el juego responda al primer milímetro de movimiento.

### 4. Sistema de Macros y Secuencias
Permite encadenar múltiples teclas con retardos precisos. Ejemplo:
*   `Botón 1` -> `Pulsar A` -> `Esperar 50ms` -> `Pulsar B`.

## 🛠️ Configuración (JoyProfiles)

Los perfiles se guardan en `config/joy_profiles/` en formato YAML:

```yaml
name: "MAME Arcade"
deadzone: 0.1
anti_deadzone: 0.05
curve: { type: "Exponential", factor: 1.5 }
mappings:
  - trigger: { kind: "Button", button: 0 }
    action: { type: "Key", value: "LCTRL" }
  - trigger: { kind: "Button", button: 7 }
    action: { type: "ArcadeAction", value: "StartGame" }
```

## 🪄 Asistente de Mapeo (Input Wizard)
Integrado en el **Operator Panel**, permite configurar cualquier mando arcade paso a paso sin necesidad de editar archivos manualmente.

---
**NeoCab es ahora un sistema totalmente autónomo y el más compatible del mercado para hardware arcade real.**
