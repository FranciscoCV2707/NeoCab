# 🕹️ NeoCab: The Ultimate Unified Arcade OS

[![Version](https://img.shields.io/badge/version-1.0.0--stable-brightgreen)](https://github.com/FranciscoCV2707/NeoCab)
[![Platform](https://img.shields.io/badge/platform-Windows%20XP%20|%207%20|%2010%20|%2011%20|%20Linux%20|%20ARM-blue)](https://github.com/FranciscoCV2707/NeoCab)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

**NeoCab** is a high-performance, all-in-one arcade management platform designed to replace the fragmented legacy ecosystem (HyperSpin, RocketLauncher, JoyToKey, etc.) with a single, ultra-fast, and visually stunning native application.

Built with **Rust** for maximum performance and **React/Tauri** for a modern, fluid interface, NeoCab runs flawlessly on everything from 20-year-old Windows XP cabinets to modern 4K gaming rigs and Raspberry Pi devices.

---

## 🌟 The "Master System" Unification
NeoCab eliminates the need for external configuration tools by integrating every essential arcade component into one unified core:

### 🎨 NeoCab Studio (Visual Theme Engine)
*Replaces: HyperTheme, Photoshop templates, and XML editing.*
- **WYSIWYG Editor**: Real-time visual editor integrated directly into the Operator Panel.
- **Drag-and-Drop**: Position wheels, videos, and artwork with your mouse.
- **Dynamic Styling**: Adjust scale, rotation, opacity, and Z-index on the fly.
- **Theme Persistence**: Changes are saved instantly to a lightweight JSON schema, compatible across all platforms.

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
