# ❓ NeoCab FAQ - Frequently Asked Questions

**Version:** 1.0.0  
**Last Updated:** 2026-05-12

---

## Installation & Setup

### Q: What are the system requirements?
**A:** Minimum 2GB RAM, dual-core CPU, 500MB storage. Recommended: 4GB RAM, quad-core CPU. See [INSTALLATION.md](INSTALLATION.md) for details.

### Q: Can I run NeoCab on Mac?
**A:** Not officially tested yet. Installation and troubleshooting would require macOS-specific setup. Contact support for Mac builds.

### Q: How do I install ROMs?
**A:** Create `~/NeoCab/roms/[system]/` directories and place ROM files there. NeoCab auto-detects on startup. See [INSTALLATION.md - Create ROMs Directory](INSTALLATION.md#1-create-roms-directory).

### Q: What emulators do I need?
**A:** NeoCab auto-detects MAME, RetroArch, PCSX2, Dolphin, etc. Install emulators separately on your system. See [INSTALLATION.md - Setup Emulators](INSTALLATION.md#2-setup-emulators).

### Q: Do I need to install emulators or can I use NeoCab's bundled emulators?
**A:** You install emulators separately. NeoCab detects them from your system. This gives flexibility and keeps NeoCab lightweight.

---

## Credits & Payment

### Q: How do I set up coin detection?
**A:** For arcade cabinets, connect coin acceptor to GPIO inputs. For testing, use keyboard (default: "5" key = 1 credit). See [USER_MANUAL.md - Coin & Credit System](USER_MANUAL.md#coin--credit-system).

### Q: Can I use a button instead of coins?
**A:** Yes! Keyboard input works: Press "5" for +1 credit, "6" for +5 credits. Configurable in Settings.

### Q: How do I prevent people from bypassing the credit system?
**A:** Set a strong Operator PIN. This locks Settings and prevents unauthorized changes. Default 0000 is insecure - change it immediately.

### Q: What if someone forgets the Operator PIN?
**A:** Emergency reset requires opening the cabinet and removing the security jumper. See [USER_MANUAL.md - Emergency Procedures](USER_MANUAL.md#emergency-procedures).

---

## Games & ROMs

### Q: Why don't my ROMs show up?
**A:** Check [TROUBLESHOOTING.md - ROMs not appearing](TROUBLESHOOTING.md). Common issues:
- ROM in wrong folder structure
- Wrong file extension
- ROM already indexed (CRC32 duplicate)

### Q: Can I edit game titles or descriptions?
**A:** Yes! In-game list: Select game → Press Edit (✎) → Modify details → Save. Changes persist.

### Q: How do I add game artwork (wheels, box art)?
**A:** Create `~/NeoCab/media/[system]/Images/[Wheel|Boxes|Backgrounds]/` folders and add PNG/JPG files. Artwork auto-loads by game name.

### Q: Why are some games slow or laggy?
**A:** Some games need higher specs. Try:
1. Reduce animation duration: Settings → Display → 200ms
2. Disable scanlines: Settings → Display
3. Use different emulator: Settings → Systems → [Game] → Emulator

### Q: Can I skip games or hide ones I don't want?
**A:** Game editing (right-click on game) allows marking as "Hidden". Hidden games don't appear in wheel.

---

## Display & Performance

### Q: What resolution should I use?
**A:** Native resolution of your display (1920x1080 for most modern TVs). NeoCab auto-detects.

### Q: What are scanlines and should I enable them?
**A:** Scanlines simulate old CRT monitor lines - adds retro look. Toggle: Settings → Display → Scanlines (ON/OFF).

### Q: Why is the app slow on startup?
**A:** First startup scans all ROMs (slow). Subsequent starts are fast. If still slow, see [PERFORMANCE.md - Optimization](PERFORMANCE.md#optimization-strategies).

### Q: Can I change the theme?
**A:** Yes! Settings → Customization → Theme. Choose: Classic, Neon Arcade, Cyberpunk, Dark Mode. Per-system themes also available.

---

## Network & Multi-Cabinet

### Q: Can I run multiple cabinets and sync revenue?
**A:** Yes! Setup one as Master, others as Slaves. Revenue syncs every 5 minutes. See [USER_MANUAL.md - Network Features](USER_MANUAL.md#network-features).

### Q: What happens if network goes down?
**A:** Slave cabinets continue working offline. Revenue syncs when connection restored. No data lost.

### Q: Can I share ROMs between cabinets?
**A:** Yes, via network NFS mounting. See [USER_MANUAL.md - Game Library Sharing](USER_MANUAL.md#game-library-sharing).

### Q: Is network secure?
**A:** Default port 8080. For security: Firewall restrict access, use VPN, change operator PIN. Production deployments should use VPN tunnel.

---

## Troubleshooting

### Q: App won't start
**A:** See [TROUBLESHOOTING.md - App won't start](TROUBLESHOOTING.md). Common causes: Missing WebView2 (Windows), incompatible display driver.

### Q: Game crashes after launching
**A:** See [TROUBLESHOOTING.md - Game crashes](TROUBLESHOOTING.md). Try different emulator or reduce graphics.

### Q: Joystick/buttons not responding
**A:** Calibrate: Settings → Input → Calibrate Controllers. Check cable connections. Test in Settings → Input → Test.

### Q: Coins not registering
**A:** Clean coin slot. Check GPIO connection. See [TROUBLESHOOTING.md - Coin detection fails](TROUBLESHOOTING.md).

### Q: Network sync failing
**A:** Check IP addresses match. Verify network cable. See [TROUBLESHOOTING.md - Network issues](TROUBLESHOOTING.md).

### Q: Cabinet running hot
**A:** Normal: 20-30°C. Check ventilation, dust filter. Temperature monitor: Settings → System → Temperature.

---

## Themes & Customization

### Q: Can I create custom themes?
**A:** Not in v1.0, but themes are JSON files. Advanced users can edit. v1.1 will have UI theme creator.

### Q: Can I import themes from other sources?
**A:** Yes! NeoCab supports .neotheme ZIP files. Drag-and-drop to import.

### Q: Can I have different themes for different systems?
**A:** Yes! Settings → Customization → Theme → "Set for System". Each system can have its own theme.

---

## Maintenance & Backups

### Q: How do I backup my settings?
**A:** Settings → Maintenance → Backups → Create Backup. Saves to USB or cloud (v1.1).

### Q: How do I restore from backup?
**A:** Settings → Maintenance → Backups → Restore. Select backup date and confirm.

### Q: What gets backed up?
**A:** Game library, settings, operator PIN, theme assignments, revenue data. ROMs NOT backed up (too large).

### Q: How do I clean up old logs?
**A:** Settings → Maintenance → Logs → Clean Old Logs. Keeps last 30 days by default.

---

## Updates & Support

### Q: How do I update NeoCab?
**A:** Download new version from GitHub releases. Install over existing (Windows MSI) or replace AppImage (Linux). Settings preserved.

### Q: What data persists after update?
**A:** Game library, settings, operator PIN, revenue data, theme assignments. No data loss.

### Q: Where's the source code?
**A:** Open source on GitHub: https://github.com/yourusername/neocab

### Q: How do I report bugs?
**A:** GitHub Issues: https://github.com/yourusername/neocab/issues

### Q: Who do I contact for commercial support?
**A:** Email: support@neocab.dev | Enterprise support available.

---

## Licensing & Legal

### Q: Is NeoCab free?
**A:** Yes, open source under MIT license.

### Q: Can I modify NeoCab for my arcade?
**A:** Yes! MIT license allows modifications. Share improvements via pull requests.

### Q: What about ROM licensing?
**A:** NeoCab doesn't provide ROMs. You provide your own. Ensure you have rights to use ROMs you run.

### Q: Can I sell cabinets running NeoCab?
**A:** Yes, NeoCab is free. But verify you have rights to distribute the ROMs.

---

## Performance & Hardware

### Q: What's the minimum CPU for good performance?
**A:** Dual-core 2GHz acceptable. Quad-core 2.5GHz recommended for smooth 60 FPS.

### Q: How much RAM do I really need?
**A:** 2GB minimum, 4GB+ recommended. Check Settings → System → Memory usage while playing.

### Q: Should I use SSD or HDD?
**A:** SSD faster (recommended). HDD works but slower at loading games initially.

### Q: Can I run this on a Raspberry Pi?
**A:** Yes! Pi 3/4 (32-bit) or Pi 5 (64-bit) supported. Download ARM AppImage. See [INSTALLATION.md - Raspberry Pi](INSTALLATION.md#-raspberry-pi--arm-linux).

---

## Advanced

### Q: Can I run this headless (no display)?
**A:** Not in v1.0. Requires display for UI. Headless mode planned for v1.2.

### Q: Can I script NeoCab?
**A:** Not yet. CLI/API planned for v1.1.

### Q: How do I contribute to NeoCab?
**A:** Fork on GitHub, make changes, submit pull request. All contributions welcome!

---

## Still Have Questions?

- **Documentation:** [INSTALLATION.md](INSTALLATION.md) | [USER_MANUAL.md](USER_MANUAL.md) | [CONFIGURATION.md](CONFIGURATION.md) | [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **GitHub Issues:** https://github.com/yourusername/neocab/issues
- **Email Support:** support@neocab.dev
- **Discord Community:** Coming soon v1.1

---

**Last Updated:** 2026-05-12 | **Version:** 1.0.0
