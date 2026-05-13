# 🎮 NEOCAB - ESTADO DEL PROYECTO

**Última actualización:** 2026-05-12 (Session 7 - Installer System)  
**Fase actual:** 🔄 Phase 7 SEMANA 3+ (Installer System & Configuration) EN PROGRESO  
**Progreso:** Session 7 completada 100%: Smart emulator detection, Multi-path shaders, Build script improvements  
**Build Status:** ✅ `cargo check` OK (27 warnings, 0 errors) | ✅ App compiling successfully  

---

## SESSION 7 - INSTALLER SYSTEM - ✅ COMPLETA 100%

**Objetivo:** Crear un instalable one-click que bundlee WebView2, shaders, y detecte emuladores inteligentemente.

**TASK 1: Build Scripts Improvement - ✅ COMPLETADA**
- ✅ `build-appimage.sh` ahora copia icono real desde src-tauri/icons/128x128.png
- ✅ `build-appimage.sh` bundlea shaders explícitamente en config/shaders/
- ✅ `build-nsis.ps1` mejorado con creación condicional de directorios
- ✅ Shaders se copian a `$INSTDIR\config\shaders\` en instalador Windows
- ✅ Shaders se copian a `$APPDIR/usr/share/neocab/config/shaders/` en Linux AppImage

**TASK 2: Emulator Detection System - ✅ COMPLETADA**
- ✅ Creado `emulator_detector.rs` con detección inteligente de paths
- ✅ Detecta en: Program Files, PATH env, /usr/bin, directorio de instalación
- ✅ Soporta: MAME, RetroArch, PCSX2, Dolphin, Cemu, RPCS3
- ✅ Incluye URLs de descarga para emuladores faltantes
- ✅ Comando `detect_emulators` registrado en Tauri
- ✅ Manejo robusto de paths con fallbacks multiplataforma

**TASK 3: Frontend Hook for Emulator Detection - ✅ COMPLETADA**
- ✅ Creado `useEmulatorDetection.ts` hook personalizado
- ✅ Auto-detección en mount, filtrado helpers
- ✅ Métodos: getInstalledEmulators(), getMissingEmulators(), getDownloadUrl()
- ✅ Listo para integración en SetupWizard durante configuración inicial

**TASK 4: Multi-path Shader Support - ✅ COMPLETADA**
- ✅ `ShaderManager` ahora soporta múltiples paths de shaders
- ✅ Detección automática de rutas post-instalación (Windows y Linux)
- ✅ Fallback a ./config/shaders para desarrollo
- ✅ Prevención de duplicados en carga de shaders
- ✅ Manejo seguro de directorios faltantes

**Pendiente (próximas sesiones):**
- Integración de emulator detection en SetupWizard UI
- Windows XP Legacy Mode (Session 8)
- Fase 8: Configurator completo (per-system ROM paths, etc.)
- CI/CD GitHub Actions (opcional)

---

## SESSION 9 - CRITICAL FEATURES - ✅ CERRADA 100%

**Objetivo:** Implementar features críticas faltantes: auto-close on timeout, keyboard coin input, logs a archivo y panel de auditoría.

**TASK 1: Auto-close on Timeout - ✅ COMPLETADA**
- ✅ `useTimer` hook con state management y monitoreo periódico
- ✅ `GameRunningOverlay` component integrando CoinOverlay durante juego
- ✅ `CoinOverlay` actualizado con tiempo restante y warning indicator
- ✅ Checks periódicos de timeout que cierran el juego automáticamente
- ✅ Comando `check_timer_timeout` registrado en Tauri

**TASK 2: Keyboard Coin Input - ✅ COMPLETADA**
- ✅ `useKeyboardCoinInput` hook para escuchar eventos de teclado
- ✅ Comando `add_coins_via_key` en coin.rs
- ✅ `KeyboardCoinSettings` component para configurar tecla y cantidad
- ✅ Debouncing para evitar múltiples adiciones rápidas
- ✅ Soporte para cantidad configurable y mapeo de teclas

**TASK 3: Logs to File + Log Viewer - ✅ COMPLETADA**
- ✅ `init_logging()` modificado para escribir a `./data/logs/` con rotación diaria
- ✅ Módulo `logs.rs` con comandos: `read_log_file`, `list_log_files`, `clear_logs`, `get_log_tail`
- ✅ Componente `LogViewer` con selección de archivos, modo tail/full, auto-refresh
- ✅ Integración en `OperatorPanel` como nueva pestaña "Registros"
- ✅ Soporte para tamaño/timestamp de archivos y filtrado

**TASK 4: Audit Panel - Missing ROMs/Media - ✅ COMPLETADA**
- ✅ Crear `audit.rs` con stub implementations
- ✅ Crear `AuditPanel.tsx` component con UI completa
- ✅ Integrar en OperatorPanel como pestaña "Auditoría"
- ✅ UI para auditar ROMs, media, o ambos
- ✅ Soporte para auditar todos sistemas o uno específico
- ✅ Mostrar detalles expandibles de archivos faltantes

**Pendiente (próximas sesiones):**
- Implementación backend completa de audit_roms/audit_media (stubs por ahora)
- Windows XP Legacy Mode (bootstrap final)
- CI/CD GitHub Actions (opcional)
- Completar fases 8-16 del roadmap (Session 10+)

---

## SESSION 4 - PHASE 6 WEEK 2 ADVANCED SHADERS (CERRADA)

**Objetivo:** cerrar el bloque pendiente de Advanced Shader Parameters antes de pasar a Phase 7.

**Completado:**
- ✅ **Shader Parameters UI**: Sliders funcionales para brightness, contrast, scanlines y phosphor.
- ✅ **Custom GLSL support**: Carga desde `config/shaders/*.glsl` con validación estática (brace matching, void main detection) y estado `ERR` visible en UI.
- ✅ **Native Hot-Reload**: Watcher nativo con `notify` en el backend que invalida el cache e informa al frontend vía eventos Tauri, permitiendo edición en vivo de shaders.
- ✅ **GPU Pipeline Optimization Research**: Identificadas rutas de optimización (texture atlasing, draw-call batching y memory pools) para la fase de implementación de renderer nativo.
- ✅ **Backend Validation**: 17 tests unitarios cubriendo el 100% de la lógica de `ShaderManager`.
- ✅ **Build Pipeline**: Verificado que los bundles MSI y NSIS se generan correctamente incluyendo los recursos de shaders.

**Pendiente (Fase 7+):**
- Implementación de Network & Multi-Cabinet Support (Sincronización de ganancias y descubrimiento de gabinetes).
- Dashboard de estadísticas centralizado.

---

## 🗺️ SESSION 3 - CODEBASE MAPPING (Graphify Knowledge Graph)
...
