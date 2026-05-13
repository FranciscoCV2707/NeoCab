# 🎮 NeoCab (ArcadeCore v3) - Project Context

NeoCab is a professional-grade arcade cabinet operating system and frontend. It is designed to be high-performance, cross-platform, and support both modern hardware (Win7+, Linux, RPi) and legacy cabinets (Windows XP).

## 🏗️ Architectural Vision

NeoCab v3 follows a **Dual-Mode Architecture**:
- **Modern Mode**: Built with **Tauri 2.x** and **React 19**. Uses WebView2/Webkit for a high-fidelity, 60FPS UI (HyperSpin wheel style).
- **Legacy Mode**: Built with **Rust + SDL2 + OpenGL**. Designed for native performance on vintage hardware like Windows XP SP2+, providing a responsive experience without modern web overhead.

### Backend (Rust) God Nodes
The system is managed by specialized "God Nodes" (Managers) that orchestrate different subsystems:
1. **Database**: SQLite (SQLx) - The central hub for state and persistence.
2. **InputManager**: Universal input hub (Keyboard, Joystick, Arcade Sticks) using SDL2/gilrs.
3. **EventLoop**: The main execution loop, especially critical for the Legacy mode.
4. **TimerManager**: Handles game session timing, pause/resume, and overtime.
5. **CoinManager**: Manages coin insertion events, tracking, and balance.
6. **ConfigManager**: Centralized YAML configuration with nativo **hot-reload** via `notify`.
7. **GameStateManager**: A Finite State Machine (FSM) controlling the application lifecycle.
8. **MediaManager**: Handles assets (wheels, box art, backgrounds) with caching.
9. **ShaderManager**: Manages GLSL shaders for CRT emulation and post-processing.
10. **ArduinoInterface**: Serial communication for hardware-level coin counters and solenoids.

## 🚀 Current Status: Phase 6 Week 2
**Current Focus**: Advanced Shaders & CRT Emulation.
- **Completed**: Shader Parameters UI, Custom GLSL support, Native watcher (hot-reload), Uniform parsing, Scan profiling.
- **Immediate Next Steps**: Visual QA of the shader UI in `tauri dev`, GPU pipeline optimization (batching/memory pools), and progressing to Phase 7 (Network & Multi-Cabinet).

## 📂 Project Structure

- `src/`: React frontend (Modern UI).
  - `components/wheel/HyperSpinWheel.tsx`: Canvas-based 60FPS wheel UI.
  - `context/ArcadeContext.tsx`: Global state provider.
  - `hooks/useShaders.ts`: Logic for CRT parameters and custom GLSL.
- `src-tauri/src/`: Rust backend.
  - `lib.rs`: Entry point and command registration (47+ commands).
  - `core/`: Business logic managers (ShaderManager, CoinManager, etc.).
  - `legacy/`: SDL2-based renderer for legacy hardware.
  - `adapters/`: Emulator-specific launch logic (MAME, RetroArch, etc.).
- `docs/`: Comprehensive master plans (00-12) and phase-specific implementation guides.
- `graphify-out/`: Knowledge graph and architectural analysis.
- `public/shaders/`: GLSL source files (`crt-geom.glsl`, `scanlines.glsl`).
- `config/shaders/`: Directory for user-defined custom shaders.

## 🛠️ Development Conventions

### General
- **Operator PIN**: Default is `0000`.
- **Naming**: Follow idiomatic Rust (snake_case) and React (PascalCase components).
- **Security**: Never log PINs or sensitive hardware paths.

### Backend (Rust)
- **Error Handling**: Use `NeoCabError` or `anyhow`.
- **Async**: Utilize `tokio` for async tasks, especially for ROM scanning and media processing.
- **Traits**: Implement `EmulatorAdapter` for all new emulators.
- **Database**: Use SQLx macros for type safety.

### Frontend (React)
- **State**: Prefer `ArcadeContext` or `zustand` stores.
- **Styling**: Vanilla CSS with variables for live theme injection.
- **IPC**: Communication via `invoke` handlers defined in `commands/`.

## 🧪 Testing and Validation
- **Backend**: `cd src-tauri && cargo test`
- **Frontend**: `npm run lint` and visual QA via `npm run tauri dev`.
- **Hot-Reload**: Verify config and shader changes refresh automatically in the UI.

## 📖 Key Documentation
- `SIGUIENTE_SESION.md`: Immediate tasks and session history.
- `PLAN_MAESTRO_REAL_COMPLETO.md`: Gap analysis between plan and implementation.
- `docs/INDEX_MAESTRO.md`: Root of the 12,000+ line documentation suite.
- `graphify-out/GRAPH_REPORT.md`: Detailed architectural dependency map.
