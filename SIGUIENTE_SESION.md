# 📋 SIGUIENTE SESIÓN - Session 9: Critical Features & Windows XP Legacy

**Última sesión completada:** 2026-05-12 (Session 8 - Installer & ARM)  
**Commits completados:**
- `5a0410c` — Phase 7 Week 1: Network Infrastructure
- `b05a6b5` — Phase 7 Week 2: Revenue Sync Client  
- `50ebc78` — NetworkPanel UI Integration
- `7e20295` — Installer System Core (WebView2 + Shaders)
- `030bd67` — ARM Cross-Compilation (RPi armv7/aarch64)

**Estado actual:** ✅ Installer System 75% COMPLETA | Network + Revenue Sync COMPLETA
**Progreso Global:** 72-74%

---

## 🎯 Objetivos para la Sesión 9 (Critical Features)

### 1. Auto-close on Timeout (Créditos/Temporizador)
- [ ] Modificar `TimerManager` para emitir evento `timer_expired` vía Tauri
- [ ] En `emulator_manager.rs`: escuchar evento y llamar `stop_game()`
- [ ] UI: CoinOverlay muestra warning animado cuando quedan `warn_before` segundos
- [ ] Lógica: Si `auto_exit: true`, cierra emulador automáticamente

**Archivos:**
- `src-tauri/src/core/timer_manager.rs`
- `src-tauri/src/commands/emulator.rs`
- `src/components/hardware/CoinOverlay.tsx`

### 2. Keyboard Coin Input
- [ ] Crear mapeo configurable (ej: tecla '5' = coin)
- [ ] Escuchar eventos de teclado en `InputManager`
- [ ] Pasar a `CoinManager.add_coins()`
- [ ] UI: Configurar tecla en Settings

**Archivos:**
- `src-tauri/src/input/keyboard.rs` (si no existe, crear)
- `src-tauri/src/commands/coin.rs`

### 3. Logs a Archivo + Log Viewer
- [ ] `tracing_subscriber` con file appender en `~/NeoCab/logs/`
- [ ] Crear `src-tauri/src/commands/logs.rs` (read_log_file, clear_logs)
- [ ] Crear `src/components/operator/LogViewer.tsx` (NEW)
- [ ] Integrar en OperatorPanel como nuevo tab

**Archivos:**
- `src-tauri/src/lib.rs` (init_logging)
- `src-tauri/src/commands/logs.rs` (NEW)
- `src/components/operator/LogViewer.tsx` (NEW)

### 4. Audit Panel - Missing ROMs/Media
- [ ] Crear `src-tauri/src/commands/audit.rs` (audit_roms, audit_media)
- [ ] Comparar game list vs archivos en disco
- [ ] Reportar qué ROMs/media faltan por gabinete
- [ ] Crear `src/components/operator/AuditPanel.tsx` (NEW)

**Archivos:**
- `src-tauri/src/commands/audit.rs` (NEW)
- `src/components/operator/AuditPanel.tsx` (NEW)

---

## ⏳ Pendiente de Sessions Anteriores

### Windows XP Legacy Mode (Session 8 - Partial)
- [ ] Completar bootstrap en `lib.rs` 
- [ ] Detectar XP y ejecutar `legacy::LegacyApp::run()` en lugar de Tauri
- [ ] CI/CD GitHub Actions para builds multiplataforma (opcional)

---

## 📊 Status Actual (Fin Session 8)

✅ **Completadas en esta sesión:**
- Phase 7 Week 1: Network Infrastructure ✅
- Phase 7 Week 2: Revenue Sync Client ✅
- NetworkPanel UI Integration ✅
- Installer System Core (WebView2 + Shaders) ✅
- ARM Cross-Compilation (RPi 32/64-bit) ✅

⏳ **Pendiente:**
- Windows XP Legacy Mode Bootstrap (partial)
- Critical Features (Session 9)

---

**Build status:** ✅ `cargo check` OK | ✅ `npm run build` OK
