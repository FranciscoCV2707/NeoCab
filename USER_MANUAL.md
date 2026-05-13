# 🎮 NeoCab Operator Manual

Complete guide for operating and managing NeoCab arcade cabinets.

**Version:** 1.0.0  
**Audience:** Arcade Operators, Technicians  
**Last Updated:** 2026-05-12

---

## 📖 Table of Contents

1. [Daily Operations](#daily-operations)
2. [Game Selection & Launching](#game-selection--launching)
3. [Coin & Credit System](#coin--credit-system)
4. [Settings & Configuration](#settings--configuration)
5. [Maintenance](#maintenance)
6. [Network Features](#network-features)
7. [Troubleshooting](#troubleshooting)

---

## Daily Operations

### Startup

```
1. Power on arcade cabinet
2. NeoCab boots automatically (if configured)
3. Shows main arcade wheel with games
4. Ready to accept coins/plays
```

### Main Screen Layout

```
┌─────────────────────────────────┐
│  ARCADE WHEEL (Game Selection)  │
│                                 │
│         [Game List]             │
│   ← MAME    NES     SNES →     │
│                                 │
│  Credits: 10    Time Left: 5:42 │
└─────────────────────────────────┘
```

**Elements:**
- **Wheel:** Rotate to browse games
- **System Selector:** Left/Right to switch systems
- **Credit Display:** Shows current credits
- **Timer:** Shows remaining play time

### Daily Shutdown

```
1. Wait for any active game to finish
2. Press Operator Menu (default: Alt+O)
3. Enter PIN (operator security)
4. Select "Shutdown"
5. Confirm and wait for safe shutdown
6. Power off cabinet
```

---

## Game Selection & Launching

### Selecting a Game

```
1. Use Joystick/Buttons to browse wheel:
   - UP/DOWN rotate wheel
   - LEFT/RIGHT switch systems
   
2. Press SELECT (green button) to launch

3. If insufficient credits:
   - Insert coins to add credits
   - Press SELECT again
```

### Credit System

**Default:** 1 coin = 1 credit

```
Game Type        | Credits Required
─────────────────┼──────────────────
Arcade (timed)   | 1 credit = 3 min
Console games    | 1 credit = 5 min
Free-play mode   | 0 credits
```

### During Gameplay

```
Joystick Controls:
  - Game-specific (varies by emulator)
  - Consult game manual for specifics

Pause Menu (if enabled):
  - Press SELECT + START simultaneously
  - Options: Resume, End Game, Settings
  - Auto-resumes after 30 seconds idle

Game Exit:
  - Auto-closes when game ends
  - Manual exit: Press QUIT button
  - Returns to main wheel with time remaining
```

---

## Coin & Credit System

### Hardware Setup

**Coin Mechanism:**
```
Coin Acceptor → GPIO Input → Credit System
  ↓
  1 coin detected
  ↓
  +1 credit added
  ↓
  Credit display updates
```

**Alternative: Keyboard Input**
```
Press "5" key → +1 credit (configurable)
Press "6" key → +5 credits (configurable)

Useful for testing without coins
```

### Credit Management

**Operator View:**
```
Menu → Settings → Credits →
  Total Coins Today: 156
  Total Revenue: $78.00
  Credits Remaining: 24
  Credits Used: 132
```

**Reset Daily Totals:**
```
1. Menu → Settings → Credits
2. Enter Operator PIN
3. Select "Reset Daily"
4. Confirm
5. Totals reset, running balance kept
```

### Timed Games

```
Standard Arcade Settings:
  1 credit = 3 minutes play time

Configuration:
  Settings → Systems → [System] →
    Play Time per Credit: 3 min
    Auto-close on timeout: ON
    Warning at: 30 sec remaining
```

---

## Settings & Configuration

### Accessing Settings

```
Main Screen:
  A. Press Menu button (or key M)
  B. Enter Operator PIN (default: 0000)
  C. Navigate with Joystick
  D. Press SELECT to confirm
```

### Change Operator PIN

```
Settings → Security → Operator PIN
1. Current PIN: ______ (enter current)
2. New PIN: ______ (enter new)
3. Confirm: ______ (confirm new)
4. Changed ✓
```

**Important:** Keep PIN secure. Default 0000 is insecure.

### System Configuration

```
Settings → Systems →
  ☑ MAME (Arcade)
  ☑ NES (Nintendo)
  ☑ SNES (Super Nintendo)
  ☑ Genesis (Sega)
  ☐ [Disabled systems not shown]
```

**Per-System Settings:**
```
Settings → Systems → [System] →
  
ROM Path: /home/arcade/roms/[system]/
Play Time per Credit: 3 min
Auto-close on exit: ON
Emulator: RetroArch
```

### Theme Customization

```
Settings → Customization → Theme →
  Current: Arcade Neon
  
Available themes:
  - Classic
  - Neon Arcade
  - Cyberpunk
  - Dark Mode
  
[Set for System] - Use different theme per system
```

**Per-System Themes:**
```
MAME → Arcade Neon
NES → Classic
SNES → Cyberpunk
```

### Display Settings

```
Settings → Display →
  Resolution: 1920x1080 (native)
  Fullscreen: ON
  V-Sync: ON
  Scanlines: ON (retro CRT effect)
  Animation Duration: 400ms
```

---

## Maintenance

### Daily Checklist

```
□ Check coin box - empty if full
□ Inspect joystick/buttons for wear
□ Verify all games launch properly
□ Check credit display accuracy
□ Test volume levels
□ Inspect screen for dead pixels
```

### Weekly Maintenance

```
□ Clean screen and joystick
□ Check for debris in coin slot
□ Test backup systems
□ Verify network sync (if enabled)
□ Check logs for errors
```

### Monthly Maintenance

```
□ Full system test - all games
□ Clean internal fans/vents
□ Update ROM collection if needed
□ Test emulator upgrades
□ Rotate media (shuffle game order)
```

### Log Viewer

```
Settings → Maintenance → Logs →
  
View recent activity:
  - Game launches: 15:32:45 Mario Bros
  - Coin events: 15:25:33 +1 credit
  - System errors: None
  - Network sync: OK

Export logs:
  Menu → Settings → Logs → Export
  Saves to USB drive or network
```

---

## Network Features

### Multi-Cabinet Setup

**Centralized Revenue Tracking:**
```
Master Cabinet:
  - IP: 192.168.1.100
  - Role: Master
  - Receives revenue from all slaves

Slave Cabinets (up to 10):
  - Role: Slave
  - Master IP: 192.168.1.100
  - Syncs revenue every 5 min
```

**Configuration:**
```
Settings → Network →
  Role: [Master / Slave]
  Master IP: 192.168.1.100 (if slave)
  
Sync Status:
  Last Sync: 14:32:15 ✓
  Next Sync: 14:37:15
  Revenue Synced: $234.50
```

### Game Library Sharing

```
Multiple cabinets can share ROMs via NFS:
  
Master:
  Settings → Network → Sharing → Enable
  Shared Path: /games/roms/

Slave:
  Settings → Network → Mount Remote ROMs
  Master IP: 192.168.1.100
```

---

## Troubleshooting

### Screen Issues

**No image:**
```
1. Check HDMI/Display cable
2. Verify display power
3. Restart cabinet
4. Check video output: Settings → Display
```

**Flickering/Artifacts:**
```
1. Disable Scanlines: Settings → Display → Scanlines OFF
2. Check V-Sync: Settings → Display → V-Sync ON
3. Reduce animation: Settings → Display → Animation 200ms
```

### Input Issues

**Joystick not responding:**
```
1. Check cable connection
2. Test buttons: Settings → Input → Test Controllers
3. Recalibrate: Settings → Input → Calibrate
4. Power cycle cabinet
```

**Coins not registering:**
```
1. Clean coin slot
2. Check coin detector: Settings → Hardware → Coin Test
3. Verify GPIO connection
4. Check coin mechanism timeout setting
```

### Game Launching

**Game won't start:**
```
1. Check ROM file exists: Menu → Games → Audit
2. Verify emulator installed: Menu → Emulators → Detect
3. Check sufficient credits
4. Try different game to isolate issue
```

**Game crashes after launch:**
```
1. Check emulator compatibility
2. Try RetroArch instead of native emulator
3. Reduce graphics settings
4. Check system temperature (not overheating)
```

### Network Issues

**Network sync fails:**
```
1. Check network cable connection
2. Verify IP addresses: Settings → Network → Status
3. Test ping: ping 192.168.1.100
4. Check firewall ports (default: 8080)
```

---

## Emergency Procedures

### Hard Reset

```
If cabinet unresponsive:
1. Hold power button for 10 seconds
2. Wait 5 seconds
3. Power back on
4. Check logs for errors
```

### Operator PIN Reset

If PIN is lost and cabinet locked:
```
On powered-off cabinet:
1. Remove security jumper inside (see manual)
2. Power on - PIN requirement disabled
3. Boot into BIOS setup
4. Set new PIN: Settings → Security
5. Replace security jumper
6. Power cycle
```

### Data Recovery

If system won't boot:
```
1. All game data backed up on USB weekly
2. Latest backup: Settings → Maintenance → Backups
3. Restore: Menu → Maintenance → Restore Backup
4. Select backup date and restore
```

---

## Performance Optimization

### Slow Performance

```
Settings → Performance →
  - Disable scanlines
  - Disable background blur
  - Reduce animation duration to 200ms
  - Disable game previews
```

### Optimize Storage

```
Utilities → Storage Optimization →
  
Run on low storage:
  1. Remove unused systems
  2. Delete duplicate ROMs
  3. Clean media cache
  4. Compress old logs
```

---

## Health & Safety

### Cabinet Maintenance

```
Ventilation:
  - Keep vents clear
  - Dust filter weekly
  - Maintain 5cm clearance around cabinet

Temperature:
  - Normal: 20-30°C (68-86°F)
  - Warning: > 40°C (104°F)
  - Auto-shutdown: > 50°C (122°F)

Monitor temperature: Settings → System → Temperature
```

### Ergonomics

```
Cabinet Setup:
  - Height: 60-75 inches (152-190cm)
  - Button angle: 30 degrees
  - Joystick reach: 18-24 inches (45-60cm)
  - Screen distance: 24-30 inches (60-75cm)
```

---

## Support & Resources

- **Installation:** [INSTALLATION.md](INSTALLATION.md)
- **Configuration:** [CONFIGURATION.md](CONFIGURATION.md)
- **FAQ:** [FAQ.md](FAQ.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Version 1.0.0 - May 2026 | Contact: support@neocab.dev**
