# 🔨 NeoCab Build Guide

Complete instructions for building NeoCab on all supported platforms.

**Last Updated:** 2026-05-12  
**Status:** ✅ Ready for Windows/Linux/ARM builds

---

## 📋 Prerequisites

### All Platforms
- **Node.js** 18+ (for frontend)
- **Rust** 1.70+ (via rustup)
- **Git** 2.0+

### Platform-Specific

#### Windows 10/11 (x64) - Modern Mode
```bash
# No additional requirements beyond Rust + Node
# WebView2 is bundled with installer
```

#### Windows 7 (x64) - Modern Mode
```bash
# Same as Windows 10/11
# WebView2 can be installed separately if needed
```

#### Windows XP (32-bit) - Legacy Mode [REQUIRES SETUP]
```bash
# Required: CMake and SDL2 development libraries
# See "Windows XP Legacy Mode Setup" section below
```

#### Linux x86_64
```bash
# Debian/Ubuntu
sudo apt-get install libsdl2-dev libssl-dev pkg-config cmake

# Fedora/RHEL
sudo dnf install SDL2-devel openssl-devel pkg-config cmake

# Arch
sudo pacman -S sdl2 openssl pkg-config cmake
```

#### Linux ARM (Raspberry Pi)
```bash
# Raspberry Pi OS / Debian
sudo apt-get install libsdl2-dev libssl-dev pkg-config cmake

# Build tools for cross-compilation
sudo apt-get install build-essential
```

#### macOS
```bash
# Homebrew
brew install sdl2 cmake pkg-config
```

---

## 🖥️ Windows 10/11 Build (Modern Mode - EASIEST)

### Quick Start
```bash
# Clone and setup
git clone https://github.com/yourusername/neocab.git
cd neocab

# Install dependencies
npm install

# Development build (with hot reload)
npm run tauri dev

# Production build
npm run tauri build
```

**Output:** `src-tauri/target/release/NeoCab.exe` and `NeoCab.msi` installer

**No additional setup required!** The modern mode uses WebView2 which is handled by Tauri.

---

## 🐧 Linux x86_64 Build

### Prerequisites Installation
```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y \
  curl \
  libssl-dev \
  pkg-config \
  cmake \
  libsdl2-dev \
  build-essential

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Build Steps
```bash
cd neocab

# Development
npm run tauri dev

# Production (creates AppImage)
npm run tauri build
```

**Output:** `src-tauri/target/release/NeoCab.AppImage` (single-file executable)

---

## 🔴 Linux ARM Build (Raspberry Pi 3/4/5)

### Prerequisites

#### For RPi 3/4 (32-bit ARM / armv7)
```bash
sudo apt-get install -y \
  curl libssl-dev pkg-config cmake libsdl2-dev \
  build-essential gcc-arm-linux-gnueabihf

# Install Rust with ARM target
rustup target add armv7-unknown-linux-gnueabihf
```

#### For RPi 5 (64-bit ARM / aarch64)
```bash
sudo apt-get install -y \
  curl libssl-dev pkg-config cmake libsdl2-dev \
  build-essential gcc-aarch64-linux-gnu

# Install Rust with ARM64 target
rustup target add aarch64-unknown-linux-gnu
```

### Build Steps

#### From Raspberry Pi itself
```bash
cd neocab
npm install
npm run tauri build
```

#### From x86_64 Linux (Cross-Compilation)
```bash
# For armv7 (RPi 3/4)
./build-scripts/build-appimage-arm.sh 1.0 armv7

# For aarch64 (RPi 5+)
./build-scripts/build-appimage-arm.sh 1.0 aarch64
```

**Output:** `src-tauri/target/armv7-unknown-linux-gnueabihf/release/NeoCab.AppImage`

---

## ⚠️ Windows XP Legacy Mode [IMPORTANT - REQUIRES SETUP]

### Why Separate Setup?

Windows XP doesn't support WebView2 (modern browser control). Instead, NeoCab boots into **SDL2 legacy mode** which uses:
- SDL2 for windowing and input
- OpenGL for rendering
- Custom arcade UI (no React/web)

### Step-by-Step Setup (Windows)

#### 1. Install CMake
```
Download: https://cmake.org/download/
Choose: Windows x64 Installer
Run installer, add to PATH during installation
Verify: Open PowerShell, type `cmake --version`
```

#### 2. Install SDL2 Development Libraries
```
Download: https://github.com/libsdl-org/SDL/releases
Choose: SDL2-devel-2.28.x-VC.zip (Visual Studio version)
Extract to: C:\SDL2
```

#### 3. Set SDL2 Environment Variables
```powershell
# Open Environment Variables (Windows Key → Environment)
# User variables → New

# Variable 1
Name: SDL2_DIR
Value: C:\SDL2

# Variable 2
Name: SDL2_LIB_DIR
Value: C:\SDL2\lib\x64

# Restart PowerShell after adding these
```

#### 4. Verify Installation
```powershell
# Check CMake
cmake --version

# Check SDL2 libs exist
ls $env:SDL2_DIR\lib\x64
# Should show: SDL2.lib, SDL2main.lib
```

#### 5. Build Legacy Mode
```powershell
cd neocab
cargo build --release --features legacy-ui
```

**Output:** `src-tauri\target\release\neocab.exe`

This executable boots on Windows XP with SDL2 UI (no WebView2 needed).

### Testing Legacy Mode on Windows XP VM
1. Copy `neocab.exe` to VM
2. Run it - you should see arcade wheel UI
3. Test: Select system → Select game → Check fade overlay and controls

---

## 📦 Building Installers

### Windows MSI Installer
```bash
npm run tauri build
# Output: src-tauri\target\release\NeoCab_1.0.0_x64_en-US.msi
```

### Windows XP Compatible Build
```bash
# Requires legacy-ui feature (SDL2 mode)
cargo build --release --features legacy-ui
# Manual bundling into installer (see build-scripts/build-nsis.ps1)
```

### Linux AppImage
```bash
npm run tauri build
# Output: src-tauri\target\release\NeoCab.AppImage
```

### Linux ARM AppImage
```bash
./build-scripts/build-appimage-arm.sh 1.0 armv7
# Output: src-tauri\target\armv7-unknown-linux-gnueabihf\release\NeoCab.AppImage
```

---

## 🧪 Testing Builds

### Windows
```bash
# Dev build with hot reload
npm run tauri dev

# Release build verification
cargo check --release
npm run build
```

### Linux
```bash
# AppImage can be tested directly
./src-tauri/target/release/NeoCab.AppImage

# Or install it
sudo mv NeoCab.AppImage /opt/neocab/
chmod +x /opt/neocab/NeoCab.AppImage
```

### Verify Compilation
```bash
# Rust compilation
cargo check            # Full check
cargo check --release # Release check

# Frontend
npm run build         # TypeScript check + Vite build
```

---

## 🐛 Troubleshooting

### "SDL2 not found" on Windows
- Verify `SDL2_DIR` environment variable is set
- Check `C:\SDL2\lib\x64\SDL2.lib` exists
- Restart PowerShell after setting env vars

### "cargo build fails with linking errors"
```bash
# Try updating Rust
rustup update

# Try cleaning build
cargo clean
cargo build --release
```

### "npm install fails"
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### "WebView2 not found" on Windows 7
```
# WebView2 runtime can be downloaded from:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/
Choose: "Evergreen Standalone Installer"
```

---

## 📊 Build Matrix

| Platform | Mode | Requirements | Output | Status |
|----------|------|--------------|--------|--------|
| Windows 10/11 x64 | Modern | Node + Rust | .msi, .exe | ✅ Working |
| Windows 7 x64 | Modern | Node + Rust | .msi, .exe | ✅ Working |
| Windows XP 32-bit | Legacy | CMake + SDL2 | .exe | ⏳ Dev Setup |
| Linux x86_64 | Modern | Node + Rust + SDL2 | .AppImage | ✅ Working |
| Linux ARM v7 | Modern | Node + Rust + SDL2 | .AppImage | ✅ Working |
| Linux ARM v8 | Modern | Node + Rust + SDL2 | .AppImage | ✅ Working |
| macOS x64 | Modern | Node + Rust + SDL2 | .dmg | ⏳ Not Tested |

---

## 🚀 CI/CD (GitHub Actions)

See `.github/workflows/build.yml` for automated builds (future implementation).

---

## 📝 Notes

- **Feature flags:** `--features modern-ui` (default) or `--features legacy-ui`
- **Release vs Debug:** Always use `--release` for production builds
- **Cross-compilation:** Use separate build scripts per platform
- **Build time:** ~5 min (first build), ~1 min (incremental)

---

## ✅ Checklist Before Release

- [ ] Windows 10/11 build tested
- [ ] Linux AppImage tested
- [ ] Windows XP legacy mode compilation verified
- [ ] ARM build tested on Raspberry Pi
- [ ] All installers generate without errors
- [ ] File sizes reasonable (< 200MB uncompressed)
- [ ] No missing dependencies in distribution

---

**Need help?** See `docs/TROUBLESHOOTING.md` or open an issue on GitHub.
