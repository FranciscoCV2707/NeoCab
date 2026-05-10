# 🎮 ARCADECORE v3 — PLAN MAESTRO PARTE 1
## Visión · Stack · Compatibilidad · Instalación Win7→Win11 + Linux + ARM

> **Soporte garantizado: Windows 7 SP1 → Windows 11 · Linux x86_64/ARM · Raspberry Pi 3/4/5**

---

## 1. VISIÓN Y OBJETIVOS

**ArcadeCore** es un frontend arcade nativo que fusiona lo mejor de tres proyectos:

| Tomamos de | Qué tomamos |
|-----------|-------------|
| **HyperSpin** | UI visual hermosa, carrusel/wheel, artwork rico (videos, marquees, wheels) |
| **Attract Mode** | Multi-sistema, filtros avanzados, romlists, layouts modulares, cross-platform |
| **AdvanceMAME** | Optimización extrema, soporte CRT, configuración video especializada, bajo consumo |

### Features exclusivas de ArcadeCore

```
✅ Sistema híbrido coins + timer (arcade y consolas en una app)
✅ Panel operador con PIN y logs auditables
✅ Autoboot Windows 7/8/10/11 + Linux systemd + OpenRC
✅ Hot-reload YAML (cambios sin reiniciar)
✅ SDL2 universal: gamepads, arcade sticks, lightguns, spinners, GPIO
✅ Plugin system (Discord, Twitch, LED marquees, cloud saves)
✅ Scraper automático (TheGamesDB, ScreenScraper, IGDB, MAME XML)
✅ DAT verification (No-Intro, Redump)
✅ RetroAchievements integrado
✅ CRT shaders y bezels arcade
✅ Netplay (RetroArch)
✅ Save states con thumbnails
✅ Attract mode nativo
✅ Virtual keyboard para kioscos
✅ Multi-perfil / multi-usuario
✅ 300+ emuladores vía adapters o RetroArch
```

---

## 2. COMPATIBILIDAD DE PLATAFORMAS (CRÍTICO)

### Plataformas soportadas

| OS | Versión mínima | Arq | Estado |
|----|----------------|-----|--------|
| **Windows** | 7 SP1 + WebView2 | x86, x64, ARM64 | ✅ Principal |
| **Linux** | Kernel 3.10+ | x86_64, ARM, AArch64 | ✅ Principal |
| **Raspberry Pi** | RPi 3+ | armv7hf, aarch64 | ✅ Soportado |

> ℹ️ **Windows 7 y WebView2**: Tauri usa WebView2 en Windows. WebView2 SI instala en Windows 7 SP1.
> Descargar: https://go.microsoft.com/fwlink/p/?LinkId=2124703
> ArcadeCore detecta si está presente y lo descarga automáticamente si no.

### Matriz de funciones por plataforma

| Feature | Win7 | Win8.1 | Win10 | Win11 | Linux | RPi4 | RPi3 |
|---------|------|--------|-------|-------|-------|------|------|
| Core + UI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SDL2 input | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Autoboot | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GPIO coins | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| CRT shaders | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️lento | ❌ |
| RetroArch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RPCS3 (PS3) | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Switch emus | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xenia (X360) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| PS2 (PCSX2) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️slow | ❌ |
| GameCube | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |

---

## 3. STACK TÉCNICO

### Backend (Rust)
```
Rust 1.75+  →  Lenguaje
Tauri 2.x   →  Framework nativo (Win7 SP1+, Linux, ARM)
SQLite 3    →  BD embebida (sqlx 0.7, WAL mode)
Tokio 1.35  →  Runtime async (full features)
SDL2 0.36   →  Input universal (bundled, sin deps)
GilRs 0.10  →  Backup para gamepads
serde_yaml  →  Config YAML hot-reload
tracing     →  Logging estructurado
serialport  →  Arduino / aceptadores moneda
reqwest     →  Scrapers y actualizaciones
```

### Frontend (React)
```
React 18       →  Framework UI
TypeScript 5   →  Tipado
Vite 5         →  Build tool (dev y prod)
CSS Modules    →  Estilos (sin Tailwind)
Zustand 4      →  State management simple
```

### Targets de compilación
```bash
# Instalar TODOS los targets (hazlo una sola vez):
rustup target add \
    x86_64-pc-windows-msvc \
    i686-pc-windows-msvc \
    aarch64-pc-windows-msvc \
    x86_64-unknown-linux-gnu \
    aarch64-unknown-linux-gnu \
    armv7-unknown-linux-gnueabihf
```

---

## 4. CARGO.TOML COMPLETO (CORRECTO PARA TODAS LAS PLATAFORMAS)

```toml
[package]
name = "arcadecore"
version = "1.0.0"
edition = "2021"
rust-version = "1.75"
description = "Universal arcade frontend"
license = "GPL-3.0"
authors = ["Francisco"]

[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
strip = true
panic = "abort"

[profile.dev]
opt-level = 0
debug = true
incremental = true

# ── DEPS COMUNES ────────────────────────────────────────
[dependencies]
tauri = { version = "2.0", features = ["native-tls-vendored", "protocol-asset"] }
tauri-plugin-shell    = "2.0"
tauri-plugin-dialog   = "2.0"
tauri-plugin-fs       = "2.0"
tauri-plugin-store    = "2.0"
tauri-plugin-updater  = "2.0"
tauri-plugin-notification = "2.0"

# Async
tokio = { version = "1.35", features = ["full"] }
tokio-stream = "0.1"

# DB
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio", "migrate", "chrono", "uuid", "macros"] }

# Serialización
serde        = { version = "1.0", features = ["derive"] }
serde_json   = "1.0"
serde_yaml   = "0.9"
toml         = "0.8"
quick-xml    = "0.31"

# Errores
anyhow    = "1.0"
thiserror = "1.0"

# Logging
tracing            = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Input
sdl2 = { version = "0.36", features = ["bundled", "static-link"] }
gilrs      = "0.10"
serialport = "4.3"

# Filesystem
walkdir = "2.4"
notify  = "6.1"

# Hashing / verificación ROMs
sha2      = "0.10"
sha1      = "0.10"
crc32fast = "1.3"
md5       = "0.7"
bcrypt    = "0.15"
hex       = "0.4"

# Utilidades
uuid    = { version = "1.6", features = ["v4", "serde"] }
chrono  = { version = "0.4", features = ["serde"] }
rayon   = "1.8"
image   = { version = "0.24", default-features = false, features = ["jpeg", "png", "webp"] }
dirs    = "5.0"
sysinfo = "0.30"
zip     = "0.6"
sevenz-rust = "0.5"
regex   = "1.10"

# HTTP (scrapers, actualizaciones, achievements)
reqwest = { version = "0.11", features = ["json", "blocking", "native-tls-vendored"] }
url     = "2.5"

# ── WINDOWS (Win7 SP1+) ──────────────────────────────────
[target.'cfg(target_os = "windows")'.dependencies]
winapi = { version = "0.3", features = [
    "processthreadsapi", "handleapi", "tlhelp32", "psapi",
    "winreg", "winbase", "winuser", "windef", "wingdi",
    "winsvc", "synchapi", "shellapi", "shlobj", "knownfolders",
    "wincon", "winnt", "winerror"
]}
registry = "1.2"

# ── LINUX ──────────────────────────────────────────────────
[target.'cfg(target_os = "linux")'.dependencies]
nix = { version = "0.27", features = ["process", "signal", "fs", "ioctl", "term"] }

# ── ARM (Raspberry Pi GPIO) ────────────────────────────────
[target.'cfg(any(target_arch = "arm", target_arch = "aarch64"))'.dependencies]
rppal = { version = "0.14", optional = true }

[features]
default = []
rpi-gpio = ["rppal"]   # Activar: cargo build --features rpi-gpio
```

---

## 5. INSTALACIÓN EN WINDOWS 7 SP1

### Pre-requisitos especiales Win7
```powershell
# Verificar SP1
winver

# Instalar en orden:
# 1. .NET 4.5 → https://dotnet.microsoft.com/download/dotnet-framework/net45
# 2. VC++ 2019 Redist x64 → https://aka.ms/vs/16/release/vc_redist.x64.exe
# 3. VC++ 2019 Redist x86 → https://aka.ms/vs/16/release/vc_redist.x86.exe
# 4. WebView2 Runtime → https://go.microsoft.com/fwlink/p/?LinkId=2124703
# 5. PowerShell 5 → https://aka.ms/wmf5download
```

### Instalación herramientas (Win7 / Win8 / Win10 / Win11)
```powershell
# Visual Studio Build Tools 2022
# Descargar: https://aka.ms/vs/17/release/vs_buildtools.exe
# Marcar:
#   [x] Herramientas de compilación C++
#   [x] Windows SDK (7.0 para Win7, 10.0 para Win10+)
#   [x] CMake para C++

# Rust (funciona Win7+)
# → https://rustup.rs → descargar rustup-init.exe
# Elegir: x86_64-pc-windows-msvc (o i686 si es Win7 32-bit)
rustup toolchain install stable
rustup target add i686-pc-windows-msvc   # Si necesitas 32-bit

# Node.js
# IMPORTANTE: Win7 requiere Node.js 18 LTS MÁXIMO
# Node 19+ ya no soporta Win7
# Descargar: https://nodejs.org/dist/v18.20.4/node-v18.20.4-x64.msi
node -v   # Debe ser v18.x

# Tauri CLI
cargo install tauri-cli --version "^2.0" --locked

# Git → https://git-scm.com/download/win

# CMake → https://cmake.org/download/
# (necesario para SDL2 bundled en Windows)

# Verificar:
rustc --version && cargo --version && node -v && npm -v && cmake --version
```

---

## 6. INSTALACIÓN EN LINUX

### Ubuntu / Debian
```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
    build-essential curl git cmake pkg-config \
    libwebkit2gtk-4.1-dev libgtk-3-dev \
    libayatana-appindicator3-dev librsvg2-dev \
    libsdl2-dev libsdl2-mixer-dev libsdl2-image-dev \
    libasound2-dev libudev-dev libusb-1.0-0-dev \
    libgl1-mesa-dev libglu1-mesa-dev \
    p7zip-full

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

cargo install tauri-cli --version "^2.0" --locked

# Permisos controles / serial
sudo usermod -aG input,dialout,plugdev $USER
sudo tee /etc/udev/rules.d/99-arcade.rules << 'EOF'
SUBSYSTEM=="input", GROUP="input", MODE="0664"
KERNEL=="js[0-9]*", GROUP="input", MODE="0664"
KERNEL=="event[0-9]*", GROUP="input", MODE="0664"
KERNEL=="ttyUSB[0-9]*", GROUP="dialout", MODE="0664"
KERNEL=="ttyACM[0-9]*", GROUP="dialout", MODE="0664"
ATTRS{idVendor}=="04d8", GROUP="input", MODE="0664"
ATTRS{idVendor}=="0079", GROUP="input", MODE="0664"
EOF
sudo udevadm control --reload-rules && sudo udevadm trigger
# Cerrar sesión y volver para aplicar grupos
```

### Arch Linux
```bash
sudo pacman -Syu --needed base-devel curl git cmake \
    webkit2gtk gtk3 libayatana-appindicator \
    sdl2 sdl2_mixer alsa-lib pipewire udev libusb p7zip
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sudo pacman -S nodejs npm
cargo install tauri-cli --version "^2.0" --locked
```

### Fedora
```bash
sudo dnf install -y gcc gcc-c++ make cmake pkg-config curl git \
    webkit2gtk4.1-devel gtk3-devel SDL2-devel SDL2_mixer-devel \
    alsa-lib-devel libudev-devel libusb-devel p7zip
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## 7. INSTALACIÓN EN RASPBERRY PI

### Raspberry Pi 4/5 (AArch64 — RECOMENDADO)
```bash
# SO: Raspberry Pi OS Lite 64-bit
# https://www.raspberrypi.com/software/

sudo raspi-config
# Performance → GPU Memory → 256
# Interface → SPI, I2C, Serial Hardware ON

sudo apt update && sudo apt install -y \
    build-essential cmake curl git pkg-config \
    libwebkit2gtk-4.1-dev libgtk-3-dev \
    libsdl2-dev libasound2-dev \
    libudev-dev libusb-1.0-0-dev \
    libdrm-dev libgbm-dev p7zip-full \
    libraspberrypi-dev python3-rpi.gpio

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Node.js 20 para ARM64
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Compilar con GPIO habilitado
cargo build --release --features rpi-gpio

# /boot/firmware/config.txt (RPi 5) o /boot/config.txt (RPi 3/4)
sudo tee -a /boot/config.txt << 'EOF'
gpu_mem=256
dtoverlay=vc4-kms-v3d
max_framebuffers=2
disable_overscan=1
EOF
```

### Cross-compile desde PC (mucho más rápido)
```bash
# En tu PC de desarrollo:
cargo install cross
docker pull ghcr.io/cross-rs/aarch64-unknown-linux-gnu:main

# Compilar para RPi 4/5:
cross build --release --target aarch64-unknown-linux-gnu

# Compilar para RPi 3 (32-bit):
cross build --release --target armv7-unknown-linux-gnueabihf

# Copiar a Raspberry Pi:
scp target/aarch64-unknown-linux-gnu/release/arcadecore pi@192.168.1.XXX:~/
```

---

## 8. AUTOBOOT POR PLATAFORMA

### Windows 7/8/10/11 — Registro (Universal)
```rust
// src-tauri/src/core/autoboot_manager.rs
#[cfg(target_os = "windows")]
pub fn enable_autoboot() -> Result<()> {
    use registry::{Hive, Security};

    let key = Hive::CurrentUser.open(
        r"Software\Microsoft\Windows\CurrentVersion\Run",
        Security::Write,
    )?;

    let exe_path = std::env::current_exe()?;
    key.set_value(
        "ArcadeCore",
        &registry::Data::String(
            exe_path.to_string_lossy().to_string().into()
        ),
    )?;
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn disable_autoboot() -> Result<()> {
    use registry::{Hive, Security};
    let key = Hive::CurrentUser.open(
        r"Software\Microsoft\Windows\CurrentVersion\Run",
        Security::Write,
    )?;
    let _ = key.delete_value("ArcadeCore");
    Ok(())
}
```

### Linux — systemd (Ubuntu 18.04+, Debian 9+)
```rust
#[cfg(target_os = "linux")]
pub fn enable_autoboot_systemd() -> Result<()> {
    let exe_path = std::env::current_exe()?;
    let home = dirs::home_dir().unwrap();
    let service_dir = home.join(".config/systemd/user");
    std::fs::create_dir_all(&service_dir)?;

    let service = format!(r#"[Unit]
Description=ArcadeCore Frontend
After=graphical-session.target

[Service]
Type=simple
ExecStart={}
Restart=on-failure
RestartSec=5
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/{}/.Xauthority

[Install]
WantedBy=graphical-session.target
"#, exe_path.display(), whoami::username());

    std::fs::write(service_dir.join("arcadecore.service"), service)?;

    std::process::Command::new("systemctl")
        .args(["--user", "enable", "arcadecore"])
        .status()?;
    Ok(())
}
```

### Linux — /etc/rc.local + .bashrc (sistemas sin systemd)
```bash
# /etc/rc.local
su - pi -c "DISPLAY=:0 /home/pi/arcadecore/arcadecore &"
```

### Raspberry Pi — autostart X11
```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/arcadecore.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=ArcadeCore
Exec=/home/pi/arcadecore/arcadecore
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

---

## 9. HARDWARE MÍNIMO PARA CORRER ARCADECORE

```
MÍNIMO ABSOLUTO (hardware Win7 era, 2007+):
  CPU:  Pentium 4 / Athlon 64 a 1.6GHz
  RAM:  512MB
  GPU:  OpenGL 1.4
  SO:   Windows 7 SP1 + WebView2 / Linux kernel 3.10
  → Solo emuladores clásicos: MAME, RetroArch cores 8-16 bit

RECOMENDADO (gabinete actual):
  CPU:  Intel Core i3 / Ryzen 3 (cualquier gen)
  RAM:  4GB
  GPU:  Intel HD 4000 / cualquier integrada reciente
  SO:   Windows 10 / Linux Ubuntu 20.04+
  → Funciona: PS1, PS2, N64, GameCube, PSP, NDS

GAMING COMPLETO:
  CPU:  Intel i5 8va gen / Ryzen 5 2600+
  RAM:  16GB
  GPU:  GTX 1060 / RX 580 o mejor
  SO:   Windows 10/11 / Linux
  → Funciona: Switch, PS3, Wii U, PS2 HD

RASPBERRY PI 4 (8GB):
  → Funciona: PS1, N64, GBA, SNES, Genesis, MAME
  → Limitado: PS2, GameCube básico
  → No: Switch, PS3, Xbox 360
```

---

*Siguiente: Parte 2 — Arquitectura completa, módulos, y Cargo.toml funcional*
