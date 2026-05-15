# 🎮 NeoCab - Installation Guide

**Version:** 1.3  
**Last Updated:** 2026-05-14

## Table of Contents
1. [Windows Installation](#windows-installation)
2. [Linux Installation](#linux-installation)
3. [Raspberry Pi Installation](#raspberry-pi-installation)
4. [Initial Setup](#initial-setup)
5. [Emulator Setup](#emulator-setup)
6. [Troubleshooting](#troubleshooting)

---

## Windows Installation

### Prerequisites
- Windows 7 SP1 or later (Windows 10/11 recommended)
- 2GB RAM minimum (4GB recommended)
- 500MB free disk space (1GB with ROMs)
- Administrator privileges for installation

### Installation Steps

1. **Download** `neocab-1.0-x64.msi` from releases
2. **Run installer** with administrator rights
3. **Choose installation directory** (default: `C:\Program Files\NeoCab`)
4. **WebView2 runtime** installs automatically if missing
5. **Data directory** created at `C:\Users\<YourUsername>\AppData\Local\NeoCab\`

### Post-Installation Setup
- Launch NeoCab
- Follow Setup Wizard (systems, ROM paths, emulator config)
- Scan ROMs (Operator Panel → Config)
- Test launch a game

---

## Linux Installation

### Prerequisites
- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum

### Installation Steps

```bash
# Download AppImage
wget https://github.com/neocab/neocab/releases/download/v1.0/neocab-1.0-x86_64.AppImage
chmod +x neocab-1.0-x86_64.AppImage

# Create NeoCab directory
mkdir -p ~/NeoCab && cd ~/NeoCab

# Run
./neocab-1.0-x86_64.AppImage
```

### Install Emulators
```bash
sudo apt install retroarch retroarch-cores mame libpcsx2-dev
```

---

## Raspberry Pi Installation

### Prerequisites
- Raspberry Pi 4 recommended (8GB RAM ideal)
- Raspberry Pi OS 64-bit
- 16GB+ SD card or USB SSD

### Installation Steps

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y libwebkit2gtk-4.0-dev curl wget \
  retroarch retroarch-cores

# Download ARM AppImage
wget https://github.com/neocab/neocab/releases/download/v1.0/neocab-1.0-armv7.AppImage
chmod +x neocab-1.0-armv7.AppImage

# Run
./neocab-1.0-armv7.AppImage
```

### Performance Tips
- Use 2D emulators (SNES, NES, Genesis) for best results
- Enable heatsink + fan for sustained gaming
- Use external USB SSD for game library
- Disable heavy shaders if needed

---

## Initial Setup

### First Launch
1. **Welcome** - Choose language & mode
2. **Systems** - Select enabled systems
3. **ROM Paths** - Specify directory for each system
4. **ROM Scan** - Discover games (2-5 minutes)
5. **Operator PIN** - Set access code (default: 0000)
6. **Display** - Configure resolution
7. **Input** - Configure gamepad/joystick
8. **Complete** - Ready to play!

### ROM Directory Structure
```
~/.local/share/NeoCab/roms/
├── mame/          (MAME ROMs)
├── snes/          (SNES ROMs)
├── nes/           (NES ROMs)
├── genesis/       (Mega Drive)
├── gameboy/       (Game Boy)
├── ps1/           (PlayStation 1)
└── n64/           (Nintendo 64)
```

---

## Emulator Setup

### MAME
- Place .zip files in `roms/mame/`
- No additional setup needed
- 300+ games supported

### RetroArch
- Install cores via RetroArch menu
- Common cores: Snes9x, Nestopia, Genesis-Plus, Gambatte, Pcsx, Mupen64
- Place ROMs in system-specific folders

### PCSX Redux (PS1)
- Copy PS1 BIOS files to `bios/ps1/`
- Place game files (.cue/.bin or .iso) in `roms/ps1/`
- BIOS required: scph1001.bin

---

## Troubleshooting

### Games Won't Launch
1. Verify ROM format matches system
2. Check ROM file exists in correct directory
3. Operator Panel → "Registros" for error logs
4. Rescan ROMs: Settings → "Scan ROMs"

### Emulator Not Found
- **Windows:** Add emulator to PATH environment variable
- **Linux:** `sudo apt install <emulator-name>`
- NeoCab auto-detects from PATH

### Controller Issues
1. Operator Panel → Input Configuration
2. Click "Detect Gamepad"
3. Follow prompts to map buttons
4. Test in game

### Performance Problems
- Close other applications
- Reduce display resolution
- Disable shaders if needed
- For Raspberry Pi: use 2D emulators only

### View Logs
- Operator Panel → "Registros" tab
- Real-time log viewing with filtering
- Enable debug mode for detailed output

---

## Multi-Cabinet Network

### Master Cabinet
1. Operator Panel → "Red" (Network)
2. Click "Start Master Server"
3. Note displayed IP address

### Client Cabinet
1. Operator Panel → "Red" (Network)
2. Enter Master IP
3. Click "Connect"
4. Revenue syncs automatically

### Firewall
- **Windows:** Allow NeoCab in Windows Firewall
- **Linux:** `sudo ufw allow 8080/tcp`
- Default port: 8080

---

## Uninstallation

### Windows
- Control Panel → Apps & Features → NeoCab → Uninstall
- Data in AppData not deleted (remove manually if desired)

### Linux/Pi
```bash
rm ~/NeoCab/neocab-1.0-*.AppImage
rm -rf ~/.local/share/NeoCab/
```

---

**For more help, see USER_MANUAL.md or visit github.com/neocab/neocab**
