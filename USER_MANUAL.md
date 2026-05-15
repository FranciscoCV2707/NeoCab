# 📖 NeoCab Master User Manual v1.3 🎮

This manual provides a comprehensive, step-by-step guide to mastering your **NeoCab** installation. From basic navigation to advanced theme creation, input engineering, and keyboard/gamepad configuration, everything is covered here.

**Version:** 1.3.0 | **Last Updated:** 2026-05-14

---

## 📑 Table of Contents
1.  [The NeoCab Philosophy](#-the-neocab-philosophy)
2.  [Interface & Navigation](#-interface--navigation)
3.  [Operator Panel (The Hub)](#-operator-panel-the-hub)
4.  [NeoCab Studio (Design Mode)](#-neocab-studio-design-mode)
5.  [JoyMapper (Control Engineering)](#-joymapper-control-engineering)
6.  [Media & Scraping (The Library)](#-media--scraping-the-library)
7.  [Launcher Pro (Transitions & Bezels)](#-launcher-pro-transitions--bezels)
8.  [Advanced Configuration](#-advanced-configuration)
9.  [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏛️ The NeoCab Philosophy
NeoCab was built to solve the "Fragmented Arcade" problem. Instead of running 5 different programs (frontend, launcher, key-mapper, config, and media manager), NeoCab does it all in a single executable. It is designed to be:
- **Fast**: Boots in seconds.
- **Stable**: Rust-powered core that never crashes.
- **Beautiful**: High-fidelity graphics on any screen.

---

## 🕹️ Interface & Navigation
The main interface is designed for **Arcade Controls**.
- **The Wheel**: Rotate through systems using your Joystick (Up/Down).
- **Game List**: Select a game with **Button 1 (Start/Confirm)**.
- **Favorites**: Mark a game as favorite with **Button 4**.
- **Exit Game**: Hold **Start + Select** for 2 seconds to trigger the Pause Menu or exit.

---

## 👨‍💼 Operator Panel (The Hub)
The Operator Panel is the "Brain" of your machine. Access it by pressing `Ctrl + Alt + O` (Keyboard) or your assigned Operator Button.
- **PIN Security**: Default is `0000`. You can change this in the Settings tab.
- **Dashboard**: View real-time CPU/RAM usage, coin count, and session duration.
- **System Health**: Check if emulators are correctly installed and paths are valid.

---

## 🎨 NeoCab Studio (Design Mode)
NeoCab Studio is a built-in WYSIWYG (What You See Is What You Get) theme editor.
1.  **Access**: Go to Operator Panel -> **Studio**.
2.  **Element Selection**: Click on any element (Game Wheel, Video Window, Background) to select it.
3.  **Transformation**:
    - **Position**: Drag and drop anywhere on the screen.
    - **Scale**: Use the slider to make elements larger or smaller.
    - **Opacity**: Create subtle overlays by adjusting transparency.
4.  **Transitions (Fades)**:
    - Set the **Duration** of the loading screen.
    - Change the **Loading Text** (e.g., "Now Loading", "Get Ready!").
5.  **Save**: Always click **Save Config** to apply changes.

---

## 🕹️ JoyMapper (Control Engineering)
NeoCab features a professional-grade input engine. **No drivers required.**
### The Input Wizard
1.  Go to Operator Panel -> **Controles**.
2.  Follow the prompts: The system will ask you to press specific directions and buttons.
3.  **Deadzone Adjustment**: If your joystick is old and has "ghost movement", increase the deadzone (0.1 to 0.3) until the red dot stays centered when idle.
4.  **Response Curves**:
    - **Linear**: 1:1 movement.
    - **Exponential**: Slower near the center, faster at the edges (Perfect for precise aiming).

---

## 🔍 Media & Scraping (The Library)
A great arcade needs great art. NeoCab automates this.
- **Audit Tool**: Found in the **Audit** tab. It will list games missing Wheels, Videos, or Box Art.
- **Scraping**:
    1. Select a game in the list.
    2. Click **Scrape Game**.
    3. NeoCab connects to **ScreenScraper.fr**, downloads the highest quality assets, and organizes them in `data/media/[system]`.

---

## 🚀 Launcher Pro (Transitions & Bezels)
### Automatic Bezels
When playing a 4:3 game (like Pac-Man or SNES) on a 16:9 widescreen, NeoCab fills the black bars with decorative frames.
- **Location**: Place your images in `data/media/bezels/`.
- **Naming**: `[system_id].png` or `[game_filename].png`.

### Universal Pause Menu
Press the Pause button (assigned in JoyMapper) to bring up the **Glassmorphism Pause Menu**.
- **Save/Load**: Manage your game states visually.
- **Shaders**: Change visual styles (Scanlines, CRT, Smooth) without quitting.

---

## ⚙️ Advanced Configuration
For power users, everything is stored in `config/`:
- `config.yml`: Global settings.
- `themes/current_theme.json`: Studio output.
- `joy_profiles/`: Button mapping files.

---

## ❓ Troubleshooting & FAQ
- **My emulator won't start**: Check the **Logs** tab in the Operator Panel. It shows exactly why it failed.
- **Input is lagging**: Ensure your monitor is in "Game Mode" and check that no other background processes are running.
- **Assets are missing**: Run a **Full Audit** and use the **Smart Scraper**.

---
**NeoCab - Engineering the Perfect Arcade Experience.**
