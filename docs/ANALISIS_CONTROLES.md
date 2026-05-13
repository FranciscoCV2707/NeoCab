# 📑 Análisis Exhaustivo: Herramientas de Control para NeoCab

Este documento detalla el análisis de los proyectos de mapeo de controles clonados y define una hoja de ruta para integrar sus mejores funcionalidades de forma nativa en **NeoCab**, eliminando la necesidad de software externo como JoyToKey.

---

## 🔍 Resumen de Proyectos Analizados

| Proyecto | Especialidad | Fortalezas Clave | Potencial de Integración |
| :--- | :--- | :--- | :--- |
| **antimicrox** | Mapeo Universal | Soporte de "Sets" (capas), auto-perfiles, multiplataforma, muy estable. | **MÁXIMO**. Es la referencia para mapeo de Gamepad → Teclado/Ratón. |
| **x360ce** | Emulación XInput | Compatibilidad total con juegos modernos, uso de ViGEmBus, wrapper de DLLs. | **ALTO**. Crucial para que mandos genéricos funcionen en juegos de Steam/Epic. |
| **FreePIE** | Scripting (Python) | Flexibilidad absoluta, soporte para dispositivos exóticos (Wiimote, trackers). | **MEDIO**. Inspiración para un sistema de scripts de control. |
| **UCR** | Modularidad | Sistema de plugins, persistencia de dispositivos, usa ViGEm para salida virtual. | **ALTO**. Inspiración para la arquitectura de "Input Providers". |
| **Durazno** | Simplicidad | Ligero, perfiles por juego vía INI, ajustes finos de ejes (stick sensitivity). | **MEDIO**. Útil para ajustes de precisión en los joysticks. |
| **Joystick Gremlin** | HOTAS & Curvas | Curvas de respuesta de ejes, combinación de múltiples mandos en uno solo. | **MEDIO**. Ideal para configuraciones de vuelo o arcade complejas. |

---

## 🛠️ Funcionalidades para Integrar en NeoCab

Para convertir a NeoCab en la plataforma definitiva, implementaremos los siguientes módulos basados en el análisis anterior:

### 1. Motor JoyMapper Nativo (Inspirado en AntiMicroX)
*   **Mapeo Directo:** Convertir botones de joystick a teclas de teclado o clicks de ratón.
*   **Sistema de Capas (Sets):** Permitir que un botón (ej: Select) actúe como un modificador ("Shift") para cambiar las funciones de los demás botones.
*   **Turbo & Macros:** Implementar fuego rápido y secuencias de teclas (combos) programables.

### 2. Virtual Input Bus (Inspirado en x360ce/ViGEm)
*   **XInput Bridge:** Integrar el driver **ViGEmBus** para crear mandos virtuales de Xbox 360 a partir de mandos DirectInput genéricos.
*   **Zero-Config:** NeoCab detectará mandos conocidos y aplicará un perfil XInput automáticamente.

### 3. Perfiles Dinámicos por Juego (Inspirado en UCR/antimicrox)
*   **Auto-Load:** Al lanzar un juego desde NeoCab, el sistema cargará el perfil de control específico para ese ejecutable y lo descargará al salir.
*   **Herencia de Perfiles:** Un perfil "Base" para Arcade, y overrides específicos para juegos como "Street Fighter".

### 4. Calibración de Precisión (Inspirado en Durazno)
*   **Deadzone & Sensibilidad:** Panel visual en el Operator Panel para ajustar la zona muerta y la curva de respuesta de las palancas arcade.
*   **Anti-Deadzone:** Corregir mandos desgastados que no llegan al 100% del recorrido.

---

## 🗺️ Plan de Implementación Sugerido

### Fase 1: Motor de Entrada (Backend Rust)
1.  **Refactorizar `input/mod.rs`**: Crear una abstracción de `InputSource` (SDL2/Gilrs).
2.  **Implementar `InputMapper`**: Un gestor que reciba eventos de mando y emita eventos de teclado/ratón usando la crate `enigo` o `uinput`.
3.  **Persistencia YAML**: Definir el esquema de perfiles de control en `config/joy_profiles/`.

### Fase 2: Interfaz de Usuario (React)
1.  **Input Config Wizard**: Un asistente visual para mapear botones ("Presiona el botón A para Saltar").
2.  **Visualizer**: Un componente que muestre en tiempo real qué botones se están pulsando y a qué teclas se traducen.

### Fase 3: Emulación Avanzada
1.  **ViGEm Integration**: Implementar un puente hacia el driver ViGEmBus para Windows.
2.  **XInput Wrapper**: Generar archivos `.ini` compatibles con Durazno/x360ce para juegos antiguos que lo requieran.

---

## 💡 Conclusión y Próximo Paso
El análisis confirma que **NeoCab** puede absorber la funcionalidad de todas estas herramientas. La integración nativa no solo es más eficiente (menos procesos en segundo plano), sino que permite una experiencia de usuario integrada donde el mando configurado en el frontend funciona perfectamente en el emulador sin tocar nada más.

**¿Deseas que comencemos con la implementación del Motor JoyMapper básico en el backend de Rust?**
