# 🕹️ NeoCab: The Ultimate Unified Arcade OS

[![Version](https://img.shields.io/badge/version-1.4.0--stable-brightgreen)](https://github.com/FranciscoCV2707/NeoCab)
[![Platform](https://img.shields.io/badge/platform-Windows%20XP%20|%207%20|%2010%20|%2011%20|%20Linux%20|%20ARM-blue)](https://github.com/FranciscoCV2707/NeoCab)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

**NeoCab** is a high-performance, all-in-one arcade management platform designed to replace the fragmented legacy ecosystem (HyperSpin, RocketLauncher, JoyToKey, etc.) with a single, ultra-fast, and visually stunning native application.

Built with **Rust** for maximum performance and **React/Tauri** for a modern, fluid interface, NeoCab runs flawlessly on everything from 20-year-old Windows XP cabinets to modern 4K gaming rigs and Raspberry Pi devices.

---

## 📋 Latest Updates (v1.4.0)
- ✅ **Widget Layout System** (v1.4): Drag-and-drop visual editor, 11 widget types, percentage-based positions, resolution presets
- ✅ **Theme SDK** (v1.4): theme.css + theme.js hooks (onMount, onNavigate, onSelect…), NeoCabAPI, custom events bus
- ✅ **Theme Community Tools** (v1.4): "Nueva plantilla", "Importar carpeta", "Abrir carpeta", bundled vs. custom split, Manual SDK modal
- ✅ **Advanced Input System** (v1.2): JoyMapper v2 with radial deadzones, spline curves, shift layers, 6 controller templates, AntiMicroX import
- ✅ **Unified Navigation** (v1.3): Keyboard + gamepad navigation with configurable keymap, 15 mappable actions
- ✅ **Session System** (v1.1): Unified coins + time management with 4 modes (Arcade, Timed, Unlimited, Token)

---

## 🌟 The "Master System" Unification
NeoCab eliminates the need for external configuration tools by integrating every essential arcade component into one unified core:

### 🎨 NeoCab Studio (Visual Theme Engine)
*Replaces: HyperTheme, Photoshop templates, and XML editing.*
- **Widget Layout Editor**: Full drag-and-drop canvas. Position the system wheel, logos, clock, credits counter, video preview, and custom images anywhere — in percentage-based coordinates that scale perfectly on any resolution (720p → 4K → vertical cabinet).
- **11 Widget Types**: background, system-wheel, system-logo (with PNG support), game-list, game-preview, game-info, clock, credits, session-timer, text-label, image.
- **Theme SDK**: Every theme can ship `theme.css` (custom `@keyframes`, overrides) and `theme.js` (lifecycle hooks: `onMount`, `onNavigate`, `onSelect`, `onBack`…). Access live state via `window.NeoCabAPI`.
- **Community-First**: "Nueva plantilla" creates a starter folder with CSS + JS template. "Importar carpeta" installs any community theme. "Abrir carpeta" opens the theme in your OS file manager.
- **Bundled vs. Custom**: Clear separation between 5 included themes and user/community themes.
- **Theme Persistence**: Saved to `theme.json` with a `screens` widget layout section, compatible across all platforms.

### 🕹️ Native JoyMapper (Input Engine)
*Replaces: JoyToKey, x360ce, ViGEmBus, and native emulator mapping.*
- **Zero-Driver Architecture**: Injects inputs at the kernel level (WinAPI/uinput) without requiring third-party drivers.
- **Input Wizard**: A guided process to map your joysticks and buttons in seconds.
- **Pro Features**:
    - **Response Curves**: Linear, Exponential, or Digital modes for analog sticks.
    - **Anti-Deadzone**: Corrects loose or aging arcade sticks.
    - **Universal Profiles**: One profile to rule all emulators.

### 🚀 Launcher Pro (Transition & Transition Engine)
*Replaces: RocketLauncher, Fade-in scripts, and complex module configurations.*
- **High-Fidelity Fades**: Smooth, customizable loading screens that hide the emulator startup process.
- **Bezel Manager**: Automatically detects 4:3 games and applies decorative frames (bezels) to fill 16:9 screens.
- **Smart Launch**: Pre-calculates resources and handles process priority to ensure 60FPS gaming.

### 🔍 Smart Scraper (Media Enrichment)
*Replaces: Don's Tools, FatMatch, and manual media downloads.*
- **API Integration**: Native connection to **ScreenScraper.fr**.
- **Automated Downloads**: Fetches high-res Wheels, Box Art, Screenshots, and Marquee videos.
- **Library Audit**: Scans your entire collection to identify and fix missing assets with one click.

---

## 🏗️ Architecture & Performance
NeoCab is engineered for the "Instant-On" arcade experience:
- **Rust Core**: Ultra-low memory footprint and zero-latency input processing.
- **SQLite Database**: Optimized for massive libraries (tested with 50,000+ titles).
- **Glassmorphism UI**: A premium, modern aesthetic using hardware-accelerated CSS.
- **Legacy Bridge**: A specialized SDL2 fallback layer specifically for Windows XP compatibility.

---

## 🛠️ Getting Started
1.  **Download**: Get the latest release for your platform.
2.  **Initialize**: Run `NeoCab.exe`. The Setup Wizard will guide you through directory creation.
3.  **Add Games**: Drop your ROMs into `data/games/[system]`.
4.  **Configure**: Access the **Operator Panel** (`Ctrl+Alt+O` or PIN 0000) to scan your library and map your controls.
5.  **Enjoy**: Immerse yourself in the most advanced arcade experience ever created.

---

## 📄 Documentation
*   [**User Manual**](USER_MANUAL.md): Comprehensive guide for cabinet owners.
*   [**Developer Wiki**](https://github.com/FranciscoCV2707/NeoCab/wiki): Deep dive into the Rust core and API.
*   [**Windows XP Guide**](WINDOWS_XP_BUILD_GUIDE.md): Special instructions for legacy hardware.

---
**NeoCab: Built by Arcade Lovers, for Arcade Legends.**
