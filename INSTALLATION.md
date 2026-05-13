# 🎮 NeoCab Installation Guide

Complete installation instructions for all platforms.

**Version:** 1.0.0  
**Last Updated:** 2026-05-12

---

## 📋 System Requirements

### Minimum Requirements
- **CPU:** Dual-core 2.0 GHz or faster
- **RAM:** 2 GB minimum (4 GB recommended)
- **Storage:** 500 MB free space
- **Display:** 1280x720 or higher

### Recommended Requirements
- **CPU:** Quad-core 2.5 GHz or faster
- **RAM:** 4 GB or more
- **Storage:** 1 GB free space (for ROMs and media)
- **Display:** 1920x1080 or higher
- **Network:** Gigabit Ethernet (for arcade cabinets)

---

## 🪟 Windows Installation

### Windows 10 / 11 (Recommended)

#### Option 1: MSI Installer (Easiest)
```
1. Download: NeoCab_1.0.0_x64_en-US.msi
2. Double-click to run installer
3. Follow wizard steps
4. Click "Install"
5. Installer creates:
   - Start Menu shortcuts
   - Desktop shortcut
   - Uninstall option in Control Panel
```

**Installation Location:** `C:\Program Files\NeoCab\`

**After Installation:**
- Run from Start Menu → NeoCab
- Or click Desktop shortcut
- App opens to Setup Wizard

#### Option 2: Portable EXE
```
1. Download: NeoCab.exe (portable version)
2. Place in desired location (e.g., D:\Games\NeoCab\)
3. Double-click NeoCab.exe to run
4. No installation required - runs directly
```

**Advantages:** No installer, works from USB drive, easy to move

### Windows 7

**Requirements:** Windows 7 SP1 or later

**Installation:** Same as Windows 10/11

**Note:** WebView2 might need separate installation:
- Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
- Choose "Evergreen Standalone Installer"

### Windows XP / Vista

**Legacy Mode Required:** Windows XP needs SDL2-based mode

See: [BUILD.md - Windows XP Legacy Mode](BUILD.md#windows-xp-legacy-mode-important---requires-setup)

---

## 🐧 Linux Installation

### Ubuntu / Debian

#### From AppImage (Easiest)
```bash
# Download NeoCab.AppImage
wget https://github.com/yourusername/neocab/releases/download/v1.0.0/NeoCab.AppImage

# Make executable
chmod +x NeoCab.AppImage

# Run directly
./NeoCab.AppImage
```

#### Install System-Wide
```bash
# Copy to /opt
sudo cp NeoCab.AppImage /opt/neocab

# Create symlink in PATH
sudo ln -s /opt/neocab /usr/local/bin/neocab

# Create desktop launcher
sudo tee /usr/share/applications/neocab.desktop > /dev/null <<EOF
[Desktop Entry]
Type=Application
Name=NeoCab
Exec=/opt/neocab
Icon=neocab
Categories=Games;
EOF

# Run from anywhere
neocab
```

#### From Package (if available)
```bash
# For distributions with repos
sudo apt install neocab

# Or
sudo dnf install neocab
```

### Fedora / RHEL / CentOS

```bash
# Download and make executable
chmod +x NeoCab.AppImage

# Install AppImage support (optional)
sudo dnf install fuse

# Run
./NeoCab.AppImage
```

### Arch Linux

```bash
# If available in community repo
sudo pacman -S neocab

# Or use AppImage
chmod +x NeoCab.AppImage
./NeoCab.AppImage
```

---

## 🔴 Raspberry Pi / ARM Linux

### Pi 3 / 4 (32-bit ARM)

```bash
# Download ARM32 AppImage
wget https://github.com/yourusername/neocab/releases/download/v1.0.0/NeoCab-Linux-ARM32.AppImage

# Make executable and run
chmod +x NeoCab-Linux-ARM32.AppImage
./NeoCab-Linux-ARM32.AppImage

# Optionally install system-wide
sudo cp NeoCab-Linux-ARM32.AppImage /opt/neocab
sudo chmod +x /opt/neocab
```

### Pi 5 (64-bit ARM)

```bash
# Download ARM64 AppImage
wget https://github.com/yourusername/neocab/releases/download/v1.0.0/NeoCab-Linux-ARM64.AppImage

# Make executable and run
chmod +x NeoCab-Linux-ARM64.AppImage
./NeoCab-Linux-ARM64.AppImage
```

### Pi Display Setup

```bash
# If using HDMI output
# Edit /boot/config.txt to match your TV:
# hdmi_group=1    # For CEA (HDMI-A, most TVs)
# hdmi_mode=16    # 1920x1080 60Hz

# Restart
sudo reboot

# Full screen mode
# In NeoCab Settings → Display → Fullscreen
```

---

## 🍎 macOS

**Status:** Not yet tested on macOS

To build for macOS:
```bash
git clone https://github.com/yourusername/neocab
cd neocab
npm install
npm run tauri build
```

See [BUILD.md](BUILD.md) for macOS prerequisites.

---

## 📦 Post-Installation Setup

### 1. Create ROMs Directory

**Windows:**
```
C:\Users\YourUsername\Documents\NeoCab\roms\
```

**Linux:**
```
~/NeoCab/roms/
```

**Structure (example):**
```
roms/
├── mame/
│   ├── pacman.zip
│   ├── donkeykong.zip
│   └── ...
├── nes/
│   ├── mario.nes
│   ├── zelda.nes
│   └── ...
└── snes/
    ├── mario-world.smc
    └── ...
```

### 2. Setup Emulators

NeoCab autodetects emulators from your system:
- MAME (https://www.mamedev.org/)
- RetroArch (https://www.retroarch.com/)
- PCSX2 (https://pcsx2.net/)
- Dolphin (https://dolphin-emu.org/)

**Windows:** Installers typically add to PATH automatically

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install mame retroarch pcsx2

# Fedora
sudo dnf install mame retroarch pcsx2
```

### 3. Create Media Directory (Optional)

For game artwork (wheels, box art, backgrounds):

**Windows:**
```
C:\Users\YourUsername\Documents\NeoCab\media\
```

**Linux:**
```
~/NeoCab/media/
```

Structure:
```
media/
├── mame/
│   └── Images/
│       ├── Wheel/        (game logos)
│       ├── Boxes/        (box art)
│       ├── Backgrounds/  (marquees)
│       └── Screenshots/
└── nes/
    └── Images/
        ├── Wheel/
        ├── Boxes/
        └── ...
```

### 4. First Launch

On first run, NeoCab shows Setup Wizard:

1. **Select Systems** - Choose which systems to enable
2. **Configure ROMs** - Point to your ROMs directory
3. **Emulator Detection** - Verify installed emulators
4. **Customize Theme** - Choose arcade theme
5. **Done** - Ready to play!

---

## 🔄 Updating NeoCab

### Windows

**MSI Installer:**
```
1. Download new NeoCab_1.0.x_x64_en-US.msi
2. Run installer
3. Old version is replaced
4. Settings preserved automatically
```

**Portable EXE:**
```
1. Download new NeoCab.exe
2. Replace old file
3. Settings in C:\Users\YourUsername\AppData\Local\NeoCab preserved
```

### Linux

**AppImage:**
```bash
# Download new version
wget https://github.com/yourusername/neocab/releases/download/v1.0.x/NeoCab.AppImage

# Replace old file
sudo cp NeoCab.AppImage /opt/neocab

# Run
/opt/neocab
```

---

## 🚀 Optimized Cabinet Setup

### For Arcade Machines

```bash
# Linux - Kiosk Mode
1. Edit ~/.config/neocab/config.yml:
   kiosk_mode: true
   autoboot_on_startup: true
   default_system: mame

2. Create systemd service:
   sudo tee /etc/systemd/system/neocab.service
   [Unit]
   Description=NeoCab Arcade
   After=network.target
   
   [Service]
   Type=simple
   User=arcade
   ExecStart=/opt/neocab --kiosk
   Restart=always
   
   [Install]
   WantedBy=multi-user.target

3. Enable on boot:
   sudo systemctl enable neocab
   sudo systemctl start neocab
```

### Network Setup (Multi-Cabinet)

```bash
# Cabinet 1 (Master)
1. Configure as Network Role: Master
2. Set IP: 192.168.1.100

# Cabinet 2 (Slave)
1. Configure as Network Role: Slave  
2. Set Master IP: 192.168.1.100

# Result: Revenue synced centrally, shared game library
```

---

## ⚡ Performance Tuning

### For Slower Machines

**Windows:**
```
Settings → Performance → 
  - Disable CRT Scanlines
  - Reduce animation duration
  - Disable background blur
```

**Linux:**
```
Edit ~/.config/neocab/config.yml:
enable_crt_effect: false
animation_duration_ms: 200
```

### For Maximal Performance

```
- Enable V-sync: ON
- Frame rate cap: 60 FPS
- Resolution: Native (avoid scaling)
- Media preload: ON
```

---

## 🔐 Security Setup

### Operator PIN

On first run, set operator PIN (default: 0000):

```
Settings → Security → Operator PIN
1. Enter current PIN (0000)
2. Enter new PIN
3. Confirm new PIN
```

PIN protects:
- Settings changes
- System configuration
- Revenue reports
- Emulator selection

### User Profiles (Planned v1.1)

```
Settings → Profiles →
  - Create player profile
  - Set play limits
  - Track statistics per player
```

---

## 📞 Troubleshooting

### App won't start
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Emulator not found
See [TROUBLESHOOTING.md - Emulator Detection](TROUBLESHOOTING.md#emulator-not-found)

### ROMs not appearing
See [TROUBLESHOOTING.md - ROM Scanning](TROUBLESHOOTING.md#roms-not-appearing)

### Performance issues
See [TROUBLESHOOTING.md - Performance](TROUBLESHOOTING.md#performance)

---

## 📞 Getting Help

- **FAQ:** [FAQ.md](FAQ.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Configuration:** [CONFIGURATION.md](CONFIGURATION.md)
- **GitHub Issues:** https://github.com/yourusername/neocab/issues

---

## ✅ Installation Checklist

- [ ] Downloaded NeoCab for your platform
- [ ] Installed or extracted NeoCab
- [ ] Created roms/ directory
- [ ] Created media/ directory (optional)
- [ ] Installed emulators (MAME, RetroArch, etc.)
- [ ] Ran Setup Wizard on first launch
- [ ] Added at least one ROM file
- [ ] Tested launching a game
- [ ] Customized theme (optional)
- [ ] Set operator PIN (recommended)
- [ ] Enabled network sync (multi-cabinet only)

---

**Installation complete! Proceed to [USER_MANUAL.md](USER_MANUAL.md) for usage instructions.**
