# NeoCab v3.0 Build Instructions

Complete guide for building NeoCab for Windows and Linux.

## Prerequisites

### Windows
- **Rust 1.95.0+**: [https://rustup.rs/](https://rustup.rs/)
- **Node.js 18+**: [https://nodejs.org/](https://nodejs.org/)
- **WebView2**: [https://developer.microsoft.com/en-us/microsoft-edge/webview2/](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- **NSIS 3.08+**: [https://nsis.sourceforge.io/](https://nsis.sourceforge.io/)
- **Visual Studio Build Tools** (for MSVC toolchain)

### Linux
- **Rust 1.95.0+**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js 18+**: `sudo apt-get install nodejs npm`
- **Build essentials**: `sudo apt-get install build-essential pkg-config`
- **AppImageKit**: Download from [https://github.com/AppImage/AppImageKit](https://github.com/AppImage/AppImageKit)

## Building from Source

### 1. Clone Repository
```bash
git clone https://github.com/neocab/NeoCab.git
cd NeoCab
git checkout phase1-core-infrastructure
```

### 2. Install Dependencies
```bash
npm install
cd src-tauri
cargo build --release
cd ..
```

### 3. Build for Windows (NSIS Installer)

```powershell
# Using PowerShell
.\build-scripts\build-nsis.ps1 -version "3.0.0"

# Or use master build script
.\build-scripts\build-all.ps1 -platform windows
```

**Output**: `dist/NeoCab-v3.0.0-windows.msi`

### 4. Build for Linux (AppImage)

```bash
# Make script executable
chmod +x ./build-scripts/build-appimage.sh

# Build AppImage
./build-scripts/build-appimage.sh 3.0.0

# Or use master build script
chmod +x ./build-scripts/build-all.sh
./build-scripts/build-all.sh 3.0.0 linux
```

**Output**: `dist/NeoCab-v3.0.0-linux-x86_64.AppImage`

### 5. Build All Platforms

```bash
# PowerShell (Windows)
.\build-scripts\build-all.ps1 -version "3.0.0"

# Bash (Linux/macOS)
./build-scripts/build-all.sh 3.0.0 all
```

## Build Configuration

### Tauri Configuration
- **File**: `src-tauri/tauri.conf.json`
- Controls app name, version, features, window settings

### Cargo.toml Features
```toml
[features]
default = ["modern-ui", "platform-detection"]
modern-ui = ["tauri"]          # Tauri + React
legacy-ui = ["sdl2", "gl"]     # SDL2 + OpenGL
hardware-gpio = ["rppal"]      # Raspberry Pi GPIO
hardware-arduino = ["serialport"] # Arduino serial
```

Build with specific features:
```bash
cargo build --release --features "modern-ui,hardware-gpio"
```

## Development Build

For development with hot-reload:
```bash
npm run tauri dev
```

This launches:
- Vite dev server on http://localhost:1420
- Tauri window with auto-reload on file changes
- Full debugging capabilities

## Production Build

Optimized release build:
```bash
npm run tauri build
```

Features:
- Rust binary stripped and optimized (LTO enabled)
- React bundle minified
- No debug symbols in release binary
- Windows: MSI installer generated
- Linux: AppImage generated

## Windows Code Signing

To sign the Windows installer:

1. Obtain a code signing certificate
2. Update `build-nsis.ps1`:
```powershell
$signtool = "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe"
& $signtool sign /f "path\to\cert.pfx" /p "password" "$outputDir\NeoCab-v${version}-windows.msi"
```

## Linux AppImage Signing

To sign the AppImage with GPG:

```bash
# Build AppImage first
./build-scripts/build-appimage.sh 3.0.0

# Sign with GPG
gpg --detach-sign dist/NeoCab-v3.0.0-linux-x86_64.AppImage
```

This creates `dist/NeoCab-v3.0.0-linux-x86_64.AppImage.sig`

## Troubleshooting

### Windows Build Issues

**Error: WebView2 not found**
- Install from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
- Requires Windows 7+ with KB2919355+ installed

**Error: NSIS not found**
- Install from: https://nsis.sourceforge.io/Download
- Ensure path is: `C:\Program Files (x86)\NSIS\`

**Error: Cargo build fails**
- Ensure Visual Studio Build Tools are installed
- Run: `rustup update`
- Clean and rebuild: `cargo clean && cargo build --release`

### Linux Build Issues

**Error: appimagetool not found**
```bash
cd /tmp
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage
sudo mv appimagetool-x86_64.AppImage /usr/local/bin/appimagetool
```

**Error: SDL2 not found**
```bash
sudo apt-get install libsdl2-dev libsdl2-image-dev libsdl2-mixer-dev libsdl2-ttf-dev
```

## Distribution

### Windows
- **Format**: MSI (Windows Installer)
- **Requirements**: Windows 7+ (x86_64), WebView2 runtime
- **Installation**: Standard Windows installer process
- **Uninstall**: Add/Remove Programs or installer uninstall option

### Linux
- **Format**: AppImage
- **Requirements**: glibc 2.29+, x86_64 architecture
- **Installation**: `chmod +x *.AppImage && ./NeoCab-*.AppImage`
- **Integration**: AppImage registers with system after first run

## Continuous Integration

GitHub Actions workflow available at `.github/workflows/build.yml`

Automatically builds and releases on:
- Tag push: `v*` tags trigger production builds
- Pull requests: Build validation on all PRs

## Performance Optimization

Release binary optimization flags in `.cargo/config.toml`:
```toml
[profile.release]
lto = true                    # Link-time optimization
codegen-units = 1            # Single codegen unit
opt-level = 3                # Maximum optimization
strip = true                 # Strip debug symbols
```

This results in:
- Faster startup time (~2-3 seconds)
- Smaller binary size (~30-40% reduction)
- Better runtime performance

## Build Size Reference

| Component | Size |
|-----------|------|
| Rust binary (stripped) | ~45-55 MB |
| React bundle | ~2-3 MB (minified) |
| Assets & Data | ~50-100 MB |
| **Total (uncompressed)** | ~100-150 MB |
| **MSI Installer** | ~40-60 MB |
| **AppImage** | ~50-70 MB |

## Build Artifacts

After successful build, find output in:
- **Windows**: `dist/NeoCab-v*.msi`
- **Linux**: `dist/NeoCab-v*-linux-x86_64.AppImage`

Verify installer integrity:
```bash
# Windows
certutil -hashfile dist/NeoCab-v3.0.0-windows.msi SHA256

# Linux
sha256sum dist/NeoCab-v3.0.0-linux-x86_64.AppImage
```

## Next Steps

1. Test installer on clean system
2. Verify all features work (ROM scanning, game launch, settings)
3. Collect telemetry (startup time, memory usage)
4. Generate release notes
5. Upload to GitHub Releases or distribution server
