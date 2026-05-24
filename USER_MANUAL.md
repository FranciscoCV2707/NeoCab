# NeoCab Master User Manual v1.4

This manual provides a comprehensive, step-by-step guide to mastering your **NeoCab** installation. From basic navigation to advanced theme creation, input engineering, and keyboard/gamepad configuration, everything is covered here.

**Version:** 1.4.0 | **Last Updated:** 2026-05-21

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

## NeoCab Studio (Design Mode)

NeoCab Studio is the built-in visual theme engine. Access it via **Operator Panel → Studio**. It has two layers that work together:

### Attribute Editor (ThemeEditor)
The left panel lets you configure colors, fonts, background type (color/gradient/image/video), effects (scanlines, CRT curve, glow), layout style, wheel behavior, and sounds. A live preview at the bottom shows either the Systems screen or the Main Menu — toggle between them with the **Sistema / Menú Principal** selector.

### Visual Layout Editor (drag-and-drop)
Click **Editor Visual** in the Studio header to open the full-screen canvas editor.

**How it works:**
- **Palette (left)** — click a widget type to add it to the canvas at a default size and position.
- **Canvas (center)** — drag widgets to move them; drag the bottom-right handle to resize. Click outside to deselect. Press `Delete` to remove the selected widget.
- **Properties (right)** — when a widget is selected: adjust X, Y, W, H in % with ±0.5 buttons; set Z-index (stacking order); toggle visibility; and configure widget-specific options.
- **Resolution presets** — 1920×1080, 1280×720, 2560×1440, 1080×1920 (vertical cabinet).
- **Screen tabs** — Sistemas / Juegos / Menú each have their own widget layout.
- Click **Aplicar al tema** to push the layout back into the theme, then **Guardar y Aplicar** to persist it.

All positions are in % (0–100), so the layout scales automatically to any resolution.

### Available Widget Types

| Widget | What it shows |
|---|---|
| `background` | Full-area background using the theme's color/gradient/image |
| `system-wheel` | The system selector (carousel, grid, or list style) |
| `system-logo` | PNG logo from `assets/systems/{name}.png`, or styled initial letter |
| `clock` | Live clock HH:MM |
| `credits` | Current coin/credit counter |
| `session-timer` | Active session countdown |
| `text-label` | Custom text with font, size, and color |
| `image` | Static image with contain/cover/fill modes |
| `game-list` | Game list (active in Games screen) |
| `game-preview` | Video/screenshot preview (active in Games screen) |
| `game-info` | Title, developer, tags (active in Games screen) |

### Community Themes & SDK

**Create your own theme:**
1. Click **Nueva plantilla** → enter a name → a starter folder is created in `themes/{slug}/` with `theme.json`, `theme.css`, `theme.js`, and `metadata.json`.
2. Click **Abrir carpeta** to open it in your OS file manager.
3. Edit `theme.css` for custom animations and style overrides; edit `theme.js` for lifecycle hooks (`onMount`, `onNavigate`, `onSelect`, `onBack`, etc.).
4. Return to NeoCab — your theme appears under **Mis Temas**.
5. Load it, then open **Editor Visual** to position widgets.
6. Click **Guardar y Aplicar**.

**Import a community theme:** click **Importar carpeta** → paste the path to any folder containing a `theme.json`.

**Manual SDK:** click **Manual SDK** for a reference modal covering all CSS custom properties, stable DOM classes, custom events, and the `window.NeoCabAPI` object.

### Save
Click **Guardar y Aplicar** at any time to write all changes (colors, fonts, effects, and widget layout) to `theme.json`.

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
