# 🎮 NeoCab - Arcade Cabinet Operating System v3.0

Professional arcade cabinet OS with dual-mode architecture (Modern + Legacy), 15+ emulators, coin management, operator panel, and customizable themes. Built with Tauri 2.x, React 19, Rust, and SDL2.

**Status**: Phase 3 COMPLETE - 29% of v3.0 plan (125-155 hours invested)

## ✨ Features

### Core Features (v1.0 - Production Ready)
- **15+ Emulators**: MAME, RetroArch (6 cores), PCSX-Redux, Mupen64Plus, Gambatte
- **Coin System**: Automatic coin tracking, earnings analytics, balance management
- **Timer Management**: Game session timers with pause/resume, overtime detection
- **Operator Panel**: PIN-protected operator mode with statistics dashboard
- **Input System**: Universal device mapping with deadzone handling (16 buttons + analog)
- **Theme System**: 3 arcade-style themes (Classic, Neon, Cyberpunk) with CSS customization
- **Autoboot**: Windows Registry + Linux autostart support, kiosk mode enforcement
- **Cross-Platform**: Windows 10-11 and Linux support

### Modern Mode (Phase 3 - In Development)
- **HyperSpin Wheel UI**: Canvas-based 60FPS system/game selection
- **React Frontend**: Full responsive arcade UI (desktop, tablet, mobile)
- **Smart Platform Detection**: Auto-detect Windows XP vs Win7+ and WebView2
- **Game List Panel**: Metadata-rich game selection with box art
- **Global State Management**: Context API for arcade state

### Legacy Mode (Phase 2 - In Development)
- **SDL2 Rendering**: Native graphics for Windows XP SP2+
- **Event Loop**: Frame-timing statistics and performance monitoring
- **Input Polling**: Real-time SDL2 event handling (keyboard, joystick, D-pad)
- **Media System**: HyperSpin-compatible image caching (wheels, box art, backgrounds)
- **Game State Manager**: Pause/resume with state tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust 1.70+
- Windows 10/11 or Linux

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/neocab.git
cd neocab

# Install frontend dependencies
npm install

# Development server (Vite + Tauri)
npm run tauri dev

# Production build
npm run tauri build
```

### Default Credentials
- **Operator PIN**: `0000`

## 📊 Architecture

### Backend (Rust + Tauri)
```
src-tauri/src/
├── core/              - Business logic (EmulatorManager, CoinManager, etc.)
├── commands/          - 47 Tauri IPC handlers
├── adapters/          - 10+ emulator implementations
├── db/                - SQLite (10 tables)
├── input/             - Input system
└── utils/             - Platform utilities
```

### Frontend (React + TypeScript)
```
src/
├── components/        - React components
├── pages/             - Page layouts
├── hooks/             - Custom hooks
└── assets/            - Images, styles
```

### Database Schema
- `systems` - Supported emulator systems
- `games` - Game library (CRC32 indexed)
- `sessions` - Play session history
- `coin_events` - Coin transaction log
- `emulators` - Emulator configurations
- `profiles` - Player profiles
- `input_devices` - Device mappings
- `config` - Key-value settings
- `achievements` - RetroAchievements integration
- `save_states` - Save state metadata

## 🎛 Operator Features

### PIN Authentication (default: `0000`)
```
- Change PIN anytime
- 3-attempt lockout protection
- Secure admin mode
```

### Statistics Dashboard
- Total earnings by coin type
- Session count and playtime
- Top games by plays
- System health status

### System Configuration
- Autoboot enable/disable
- Kiosk mode toggle
- Theme selection
- Coin cost per game

## 🎨 Themes

| Theme | Primary | Secondary | Use Case |
|-------|---------|-----------|----------|
| **Classic** | #ff6b00 (Orange) | #1a1a1a (Black) | Default arcade aesthetic |
| **Neon** | #00ff00 (Green) | #00ffff (Cyan) | Retro 80s neon |
| **Cyberpunk** | #ff006e (Pink) | #00f5ff (Cyan) | Modern neon futuristic |

Change themes at runtime with `set_theme` command.

## 🕹 Supported Emulators

### Direct Adapters
- **MAME** - Arcade systems
- **PCSX-Redux** - PlayStation 1
- **Mupen64Plus** - Nintendo 64
- **Gambatte** - Game Boy Color

### RetroArch Cores (via libretro)
1. Snes9x (SNES)
2. Genesis-Plus-GX (Sega Genesis)
3. Nestopia (NES)
4. Gambatte (Game Boy)
5. PCSX (PlayStation 1)
6. Mupen64Plus (Nintendo 64)

## 🔧 Development

### Run Tests
```bash
cd src-tauri
cargo test              # Rust tests
```

### Build Commands
```bash
npm run dev             # Tauri dev mode
npm run build           # Production build
npm run tauri build     # Platform-specific installer
```

### Project Structure
- 16-week development cycle completed
- 47 Tauri commands exposed
- 100+ unit tests
- Zero compilation errors

## 📱 API Commands

### Game Management
- `list_games(system)` - Get games for system
- `scan_roms()` - Scan for ROMs
- `launch_game(game_id, emulator)` - Launch game
- `stop_game()` - Stop running game

### Coin System
- `add_coins(amount)` - Add coins
- `get_coin_balance()` - Check balance
- `start_game()` - Deduct coin & start session
- `end_game()` - End session
- `get_earnings()` - Total earnings

### Timer
- `start_timer(seconds)` - Start timer
- `pause_timer()` - Pause timer
- `resume_timer()` - Resume timer
- `get_timer_status()` - Timer info

### Operator Panel
- `authenticate_operator(pin)` - Login
- `logout_operator()` - Logout
- `get_operator_stats()` - Earnings stats
- `get_session_stats()` - Session info
- `change_operator_pin(old, new)` - Update PIN

### System
- `enable_autoboot()` - Enable autostart
- `enable_kiosk_mode()` - Lock full-screen
- `set_theme(name)` - Change theme
- `get_current_theme()` - Current theme

See full command list in [CLAUDE.md](CLAUDE.md).

## 🛠 Configuration

### YAML Config (`config/app.yaml`)
```yaml
app:
  name: NeoCab
  version: "1.0.0"

arcade:
  default_coin_value: 1
  game_cost: 1

display:
  resolution: "1920x1080"
  fullscreen: true

emulators:
  default_system: mame
```

## 📖 Documentation

- **[INDEX_MAESTRO.md](docs/INDEX_MAESTRO.md)** - Full documentation index
- **[STATUS.md](STATUS.md)** - Project progress (100% complete)
- **[CLAUDE.md](CLAUDE.md)** - Developer guide
- **[docs/11_OPERACIONES.md](docs/11_OPERACIONES.md)** - Operator manual

## 🔐 Security

- PIN-protected operator mode (3-attempt lockout)
- No sensitive data in commits
- Windows Registry security (elevated permissions for autoboot)
- Input validation on all Tauri commands

## 🚢 Deployment

### Windows
```bash
npm run tauri build
# Creates: src-tauri/target/release/bundle/msi/NeoCab_1.0.0_x64_en-US.msi
```

### Linux
```bash
npm run tauri build
# Creates: src-tauri/target/release/bundle/appimage/neocab_1.0.0_amd64.AppImage
```

## 📝 License

Proprietary - Arcade Cabinet Operating System

## 🤝 Support

For issues, check:
1. [docs/08_CHECKLIST_FINAL.md](docs/08_CHECKLIST_FINAL.md) - Troubleshooting
2. [CLAUDE.md](CLAUDE.md) - Architecture details
3. Issues in GitHub repository

## 🎯 Roadmap (Post v1.0)

- [ ] Mobile operator panel app
- [ ] Additional emulators (Saturn, Dreamcast, Neo Geo)
- [ ] Advanced analytics dashboard
- [ ] Cloud backup for earnings data
- [ ] Multi-cabinet network support
- [ ] Custom ROM folder scanning

## 👥 Team

Built with Tauri, React, and Rust. Single developer, 16-week development cycle.

---

**Status**: ✅ v1.0 Production Ready | **Last Updated**: 2026-05-10
