# 🚀 Documentación Técnica: NeoCab Launcher Pro & Fade System

El **Launcher Pro** es el componente encargado de la transición crítica entre el frontend de NeoCab y la ejecución del emulador. Su objetivo es proporcionar una experiencia "Seamless" (sin costuras), eliminando los parpadeos del escritorio.

---

## 🏗️ El Ciclo de Lanzamiento
El proceso se divide en 5 etapas sincronizadas entre Rust y React:

### 1. Etapa de Disparo (Trigger)
Cuando el usuario pulsa "Jugar", el comando `launch_game` en Rust inicia el proceso.
- **Evento**: `game_launch_start`.
- **Acción**: El frontend muestra instantáneamente el `FadeOverlay`.

### 2. Preparación de Recursos
Mientras el usuario ve la pantalla de carga, el backend realiza:
- **Carga de Perfil JoyMapper**: Selecciona el mapeo de controles específico para ese emulador.
- **Detección de Bezel**: El `BezelManager` busca el marco decorativo adecuado.

### 3. Ejecución del Emulador
Rust lanza el proceso del emulador en segundo plano.
- **Optimización**: Se ajusta la prioridad del proceso para evitar saltos de frames.
- **Window Management**: NeoCab intenta forzar al emulador a estar en primer plano y ocultar su propia ventana si es necesario.

### 4. Sincronización de Pantalla (Handshake)
Para evitar que el usuario vea la pantalla de carga del propio emulador (que a veces es fea):
- **Delay Inteligente**: NeoCab espera a que la ventana del emulador esté lista y enfocada.
- **Evento**: `game_launch_ready`.

### 5. Finalización del Fade
Una vez confirmado que el juego está corriendo:
- El `FadeOverlay` desaparece con una transición de opacidad suave, revelando el juego ya en marcha.

---

## 🖼️ Bezel Manager (Marcos Inteligentes)
El sistema rellena los espacios negros en pantallas 16:9 al jugar títulos 4:3.
- **Algoritmo de Búsqueda**:
    1.  `data/media/bezels/[ROM_NAME].png`
    2.  `data/media/bezels/[SYSTEM_ID].png`
    3.  `data/media/bezels/default.png`
- **Integración**: Se inyectan como overlays o se configuran automáticamente en RetroArch/MAME mediante archivos `.cfg` temporales.

---

## ⏸️ Pause Menu Pro (Overlay Universal)
Durante el juego, el usuario puede invocar un menú de pausa avanzado:
- **Tecnología**: Ventana transparente de Tauri sobrepuesta.
- **Funcionalidades**:
    - **Save/Load States**: Conexión vía IPC con el emulador.
    - **Shader Tuner**: Ajuste de efectos visuales sin salir del juego.
    - **Safe Exit**: Limpieza de procesos y retorno suave al frontend.

---
**NeoCab Launcher Pro: La transición perfecta hacia la nostalgia.**
