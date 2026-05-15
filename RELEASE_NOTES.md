# 🚀 NeoCab v1.3 - Release Notes

**Release Date:** May 14, 2026  
**Status:** Stable Release

## Overview

NeoCab v1.3 is the complete arcade cabinet operating system with advanced input processing and unified navigation. Built on v1.0 foundation with major improvements in themes, session management, input processing, and keyboard/gamepad navigation.

## Major Features (v1.3)

### Unified Navigation
- **Keyboard + Gamepad:** Single hook for both input types
- **Configurable Keymap:** 15 mappable actions with localStorage persistence
- **KeymapConfigPanel:** UI with recording mode in Operator Panel
- **useKeyboardNav:** List/grid navigation with page up/down support

### Advanced Input System (v1.2)
- **JoyMapper v2:** Radial deadzone, spline curves, shift layers, stick delay
- **Multi-gamepad:** Independent mapper per device with GUID tracking
- **6 Controller Templates:** ArcadeStick, SNES, Xbox, PS, Flight, Racing
- **AntiMicroX Import:** Parse XML profiles automatically
- **Per-game profiles:** Hierarchical resolution (game > system > global)
- **14 new Tauri commands** for input management

### Session System (v1.1)
- **SessionManager:** Unified coins + time management
- **4 modes:** Arcade, Timed, Unlimited, Token
- **Per-system configuration** with pause/resume support

### Theme System (v1.1)
- **5 bundled themes** with auto-install
- **Per-system/game assignment** with hierarchy resolution
- **Theme Editor** with 7 tabs and export/import

## Previous Features (v1.0)

### Emulation
- **6 Emulators:** MAME, RetroArch (7 cores), PCSX Redux, Mupen64, Gambatte
- **12+ Systems:** Arcade, NES, SNES, Genesis, Game Boy, PS1, N64, and more
- **Crash Detection:** Automatic detection and cleanup
- **Session Tracking:** Database logging of all gameplay

### Commerce
- **Coin System:** Virtual balance with hardware integration ready
- **Time Limits:** Arcade/Console/TimedFree modes per system
- **Multi-Cabinet Network:** Revenue aggregation across cabinets
- **Operator Dashboard:** Real-time statistics and analytics

### User Experience
- **Arcade UI:** Authentic cabinet controls and display
- **Themes:** Customizable per-system themes with ZIP support
- **Shaders:** GLSL shaders with hot-reload
- **Multi-language:** English and Spanish

### Technical
- **Cross-platform:** Windows 7+, Linux x86_64, Raspberry Pi (ARM)
- **Pre/Post Scripts:** Per-system launch scripts
- **Database:** SQLite with 10+ tables
- **Input:** Universal gamepad/joystick support

## What's New in v1.0

### Phase 7: Network & Multi-Cabinet
- Cabinet discovery via mDNS
- Revenue synchronization protocol
- Master dashboard for monitoring
- Network diagnostics tools

### Phase 8: Installer System
- One-click installer (Windows)
- AppImage for Linux
- WebView2/WebKitGTK bundled
- Automatic emulator detection

### Phase 9: Critical Features
- Auto-close on timeout
- Keyboard coin input
- File-based logging with rotation
- Log viewer and audit panel

### Phase 10: Launcher Enhancements
- Emulator process monitoring
- Crash detection with auto-cleanup
- Session history tracking
- Window detection (foundation)

### Phase 11: Pre/Post Launch Scripts
- Script editor component
- Pre-launch execution
- Post-launch background tasks
- Per-system script configuration

## Fixes & Improvements

### Bug Fixes
- Fixed duplicate Tauri command definitions
- Resolved TypeScript strict mode issues
- Fixed EmulatorMonitor process detection
- Corrected GameRunningOverlay state management

### Performance
- Optimized shader reloading
- Improved media caching
- Reduced startup time to 500-800ms
- Better memory management for game sessions

### User Interface
- Enhanced operator panel with tabs
- Improved error messaging
- Better visual feedback for timeouts
- Consistent arcade-themed styling

## Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| Windows 10/11 x64 | ✅ Full | WebView2 bundled |
| Windows 7 x64 | ✅ Full | Requires WebView2 runtime |
| Windows XP | ⏳ Beta | Legacy SDL2 mode available |
| Linux x86_64 | ✅ Full | WebKitGTK required |
| Linux ARM (RPi) | ✅ Full | Optimized for Pi 4/5 |

## Database Schema

10+ tables supporting:
- Game library (300+ games)
- System configurations
- Session history and analytics
- Coin/credit tracking
- Operator audit logs
- Theme assignments
- Network configuration

## Requirements

### Minimum
- 2GB RAM
- 500MB disk space
- Tauri 2.x runtime
- One emulator installed

### Recommended
- 4GB RAM
- 2GB disk space
- Windows 10/11 or Ubuntu 20.04+
- Multiple emulators
- External SSD for ROMs

## Installation

See `INSTALLATION.md` for detailed platform-specific instructions.

Quick start:
```bash
# Windows: Run MSI installer
# Linux: Download and run AppImage
./neocab-1.0-x86_64.AppImage
# Raspberry Pi: Same as Linux
```

## Known Limitations

### Hardware (Stubs Ready)
- GPIO coin detection (awaiting hardware)
- Arduino serial protocol (awaiting hardware)

### Optional
- In-game pause menu (not integrated)
- Bezel support (config only)
- Per-game ROM override (model ready)

## Breaking Changes

None - first release, no previous versions.

## Migration Guide

N/A for v1.0

## Upgrade Path

To upgrade from earlier phases:
1. Backup `~/.local/share/NeoCab/` directory
2. Install v1.0 fresh
3. Copy backup config and ROM paths
4. Run "Scan ROMs" to update database

## Testing & Validation

- ✅ Compilation: Rust `cargo check` CLEAN, React `npm run build` CLEAN
- ✅ Unit Tests: 50+ tests passing
- ✅ Code Quality: TypeScript strict mode, zero unsafe Rust
- ✅ Performance: <1s game launch, 500ms startup
- ⚠️ E2E Tests: Complete (Phase 12)

## Security

- PIN-protected operator mode (default: 0000)
- Session isolation
- File permissions validation
- No remote execution vulnerabilities

## Documentation

- ✅ `INSTALLATION.md` - Per-platform setup
- ✅ `USER_MANUAL.md` - Player & operator guide
- ✅ `BUILD.md` - Developer setup
- ✅ `PROJECT_STATUS_DETAILED.md` - Full feature inventory

## Support

- **Issues:** github.com/neocab/neocab/issues
- **Wiki:** github.com/neocab/neocab/wiki
- **Email:** support@neocab.local

## Changelog

### v1.3.0 (2026-05-14)
- Unified keyboard + gamepad navigation
- Configurable keymap with 15 actions
- KeymapConfigPanel in Operator Panel
- useKeyboardNav hook for list/grid navigation
- SessionConfig tab in Operator Panel

### v1.2.0 (2026-05-14)
- JoyMapper v2 with radial deadzone, spline curves, shift layers
- Multi-gamepad support with per-device profiles
- 6 controller templates
- AntiMicroX profile import
- 14 new Tauri commands for input management
- Per-game profile system with auto-switching

### v1.1.0 (2026-05-14)
- 5 bundled themes with auto-install
- Theme hierarchy (game > system > global)
- SessionManager (coins + time unified, 4 modes)
- ViewTransition component (5 types)
- MainMenu + SystemSelect redesigned
- 12 new session Tauri commands

### v1.0.0 (2026-05-13)
- Initial stable release
- All phases 1-11 complete
- 6 emulators, 12+ systems
- Multi-platform support (Windows/Linux/ARM)
- Network multi-cabinet
- Crash detection & session tracking
- Pre/post launch scripts

## Credits

Developed by Francisco Caballero  
Built with Rust, React, Tauri  
Powered by MAME, RetroArch, and open-source emulators

## License

NeoCab v1.3.0 - All Rights Reserved (Commercial)

---

**Ready to deploy. Enjoy NeoCab! 🎮**
