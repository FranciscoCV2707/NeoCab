# 📋 TAREAS DE PROYECTO - NEOCAB

**Actualizado:** 2026-05-10  
**Total horas estimadas:** 80-120 horas | 16 semanas | 4-6 horas/semana

---

## 🚀 SEMANA 0 - PREPARACIÓN (ACTUAL)

### T0.1: Organización de Documentación ✅
- [x] Revisar todos los archivos .md
- [x] Crear STATUS.md
- [x] Crear TAREAS.md
- [x] Crear PROGRESO_ACTUAL.md
- [x] Actualizar nombre proyecto a NeoCab en todos lados
- **Responsable:** Claude  
- **Estimado:** 30 min  
- **Estado:** ✅ COMPLETADO

### T0.2: Verificar Herramientas ✅
- [x] Git 2.53.0 ✅
- [x] Rust 1.95.0 ✅
- [x] Node.js v20.20.2 ✅
- [x] npm 10.8.2 ✅
- [x] Tauri CLI 2.11.1 ✅
- [x] CMake 4.3.1 ✅
- [x] VS C++ / MSVC ✅
- **Responsable:** Usuario (verificadas en su máquina)
- **Estado:** ✅ COMPLETADO

### T0.3: Leer Documentación Esencial ✅
- [x] INDEX_MAESTRO.md (20 min)
- [x] 00_README_MAESTRO.md (30 min)
- [x] 01_PLAN_MAESTRO_PARTE_1.md (1.5h)
- **Estimado:** 2h 20 min  
- **Estado:** ✅ COMPLETADO

### T0.4: Crear Estructura de Carpetas Local ✅
- [x] Crear carpeta C:\Dev\NeoCab
- [x] Clonar repo GitHub
- [x] Tauri inicializado automáticamente
- **Estimado:** 30 min  
- **Estado:** ✅ COMPLETADO

---

## 🎯 SEMANA 1 - SETUP + ESTRUCTURA

### T1.1: Crear Repositorio GitHub ✅
- [x] Crear repo en GitHub (neocab)
- [x] Clonar localmente en C:\Dev\NeoCab
- **Estimado:** 15 min  
- **Estado:** ✅ COMPLETADO
- **URL:** https://github.com/FranciscoCV2707/NeoCab.git

### T1.2: Inicializar Proyecto Tauri ✅
- [x] Ejecutar `cargo create-tauri-app --directory .`
- [x] React + TypeScript seleccionado
- [x] npm install completado
- **Estimado:** 30 min  
- **Estado:** ✅ COMPLETADO
- **Próximo:** Ejecutar `npm tauri dev`

### T1.3: Crear Estructura de Carpetas Backend ⏳
- [ ] Crear carpetas en src-tauri/src/:
  - [ ] commands/
  - [ ] core/
  - [ ] adapters/
  - [ ] input/
  - [ ] models/
  - [ ] db/
  - [ ] utils/
- [ ] Crear archivos mod.rs en cada carpeta
- **Estimado:** 20 min
- **Estado:** ⏳ PRÓXIMA SESIÓN

### T1.4: Crear Estructura de Carpetas Frontend ⏳
- [ ] Crear carpetas en src/:
  - [ ] pages/
  - [ ] components/ (subdivisiones)
  - [ ] hooks/
  - [ ] store/
  - [ ] types/
  - [ ] assets/
- **Estimado:** 15 min
- **Estado:** ⏳ PRÓXIMA SESIÓN

### T1.5: Configurar Cargo.toml
- [ ] Agregar dependencias básicas
- [ ] Configurar features
- [ ] Configurar target-specific dependencies
- **Estimado:** 45 min  
- **Referencia:** Doc 03 Semana 1 - Día 2

### T1.6: Configurar package.json
- [ ] Agregar scripts npm
- [ ] Instalar dependencias npm
- [ ] Verificar que no hay errores
- **Estimado:** 30 min

### T1.7: Crear .gitignore Completo
- [ ] Copiar del doc 03 Semana 1
- [ ] Adaptarlo a estructura local
- [ ] Verificar funcionamiento
- **Estimado:** 10 min

### T1.8: Primer Commit
- [ ] Agregar todo a git
- [ ] Commit inicial: "Initial project structure with Tauri + React + TypeScript"
- [ ] Push a GitHub main
- **Estimado:** 5 min  
- **Entregable:** Proyecto compilando ✅

**Semana 1 Total:** 2.5 horas  
**Hito:** Proyecto compila sin errores

---

## 📊 SEMANA 2 - MODELS + DATABASE

### T2.1: Diseñar Schema SQLite
- [ ] Leer schema de doc 02
- [ ] Crear archivo 001_initial.sql
- [ ] Definir 10 tablas (games, systems, emulators, etc)
- [ ] Agregar relaciones y constraints
- **Estimado:** 1.5h  
- **Referencia:** Doc 02 - Database Schema

### T2.2: Crear Modelos Rust
- [ ] Crear game.rs (Game model)
- [ ] Crear system.rs (System model)
- [ ] Crear emulator.rs (Emulator model)
- [ ] Crear otros models (session, profile, achievement)
- **Estimado:** 1.5h

### T2.3: Configurar SQLite Connection
- [ ] Agregar dependencia rusqlite a Cargo.toml
- [ ] Crear db/connection.rs
- [ ] Implementar DbConnection struct
- [ ] Agregar pool de conexiones (opcional)
- **Estimado:** 1h

### T2.4: Crear Migrations
- [ ] Implementar sistema de migrations
- [ ] Crear 001_initial.sql
- [ ] Crear 002_inputs.sql
- [ ] Crear 003_profiles.sql
- **Estimado:** 1h

### T2.5: Tests para Models
- [ ] Escribir tests para cada modelo
- [ ] Verificar serialización/deserialización
- [ ] Tests de BD (insert/select/update)
- **Estimado:** 1.5h

### T2.6: Commit Semana 2
- [ ] Commit: "Add database schema and Rust models"
- [ ] Push a GitHub
- **Estimado:** 5 min  
- **Entregable:** BD compilando, tests pasando ✅

**Semana 2 Total:** 6.5 horas  
**Hito:** Schema + Models funcionando

---

## ⚙️ SEMANA 3 - CONFIG MANAGER + YAML

### T3.1: Configurar Parser YAML
- [ ] Agregar dependencia serde_yaml a Cargo.toml
- [ ] Crear structures para config YAML
- [ ] Implementar parser
- **Estimado:** 1h

### T3.2: Config Manager Core
- [ ] Crear core/config_manager.rs
- [ ] Implementar cargar/guardar configuración
- [ ] Validar estructura YAML
- **Estimado:** 1.5h

### T3.3: Hot-Reload Configuración
- [ ] Implementar watch de archivos config
- [ ] File system watchers (notify crate)
- [ ] Reload sin reiniciar aplicación
- **Estimado:** 2h

### T3.4: Crear Archivos Config Defaults
- [ ] config/systems.yaml (configuración de sistemas)
- [ ] config/inputs.yaml (mapeos de controles)
- [ ] config/display.yaml (configuración visual)
- **Estimado:** 1h

### T3.5: Tests y Validación
- [ ] Tests para parser YAML
- [ ] Tests para hot-reload
- [ ] Verificar que no hay panics
- **Estimado:** 1.5h

**Semana 3 Total:** 7 horas  
**Hito:** Config system funcionando

---

## 🎮 SEMANA 4 - GAME LIBRARY SCANNER

### T4.1: Implementar Game Scanner
- [ ] Crear core/game_library.rs
- [ ] Scanner de ROMs parallelizado (rayon)
- [ ] Detectar archivos por extensión
- **Estimado:** 2h  
- **Referencia:** Doc 04 - Game Library Scanner

### T4.2: Metadata y Parsing
- [ ] Parser de metadata (nombres, descripciones)
- [ ] Integration con scraper APIs
- [ ] Guardar en BD
- **Estimado:** 2h

### T4.3: Frontend para Game Library
- [ ] Crear GameGrid.tsx component
- [ ] Mostrar juegos encontrados
- [ ] Búsqueda básica
- **Estimado:** 1.5h

### T4.4: Tests y Optimización
- [ ] Tests de scanner
- [ ] Optimizar queries BD
- [ ] Verificar performance
- **Estimado:** 1.5h

**Semana 4 Total:** 7 horas  
**Hito:** Scanner de ROMs funcionando

---

## 🕹️ SEMANA 5 - PRIMER EMULADOR (MAME)

### T5.1: Crear MAME Adapter
- [ ] Crear adapters/mame.rs
- [ ] Implementar trait EmulatorAdapter
- [ ] Builder de argumentos CLI
- **Estimado:** 1.5h  
- **Referencia:** Doc 06 - MAME Adapter

### T5.2: Lanzar Juegos MAME
- [ ] Implementar launch()
- [ ] Manejo de procesos (std::process)
- [ ] Capture de stdout/stderr
- **Estimado:** 1.5h

### T5.3: Integración Tauri IPC
- [ ] Crear command en commands/emulators.rs
- [ ] Tauri invoke desde frontend
- [ ] Pasar game info al adapter
- **Estimado:** 1h

### T5.4: Frontend para Launcher
- [ ] Botón "Play" en GameDetails
- [ ] Spinner mientras carga
- [ ] Manejo de errores
- **Estimado:** 1h

### T5.5: Tests
- [ ] Mock de MAME executable
- [ ] Tests de argumentos CLI
- [ ] Tests de IPC
- **Estimado:** 1.5h

**Semana 5 Total:** 6.5 horas  
**Hito:** MAME se lanza desde código ✅

---

## 💰 SEMANA 6 - COIN SYSTEM

### T6.1: Coin Manager Core
- [ ] Crear core/coin_manager.rs
- [ ] Contador de monedas
- [ ] Persistencia en BD
- **Estimado:** 1.5h

### T6.2: Detectar Monedas
- [ ] GPIO input (para cabinetes físicos)
- [ ] Simulación en dev
- [ ] Validación de monedas
- **Estimado:** 1.5h

### T6.3: Frontend Coin Counter
- [ ] Crear CoinCounter.tsx component
- [ ] Mostrar saldo actual
- [ ] Animación de suma
- **Estimado:** 1h

### T6.4: Tauri Commands
- [ ] Comando para agregar moneda
- [ ] Comando para ver saldo
- [ ] Comando para reseteir
- **Estimado:** 1h

### T6.5: Tests
- [ ] Tests de contador
- [ ] Tests de persistencia
- [ ] Tests de validación
- **Estimado:** 1.5h

**Semana 6 Total:** 6.5 horas  
**Hito:** Sistema de monedas funcionando ✅

---

## 📱 SEMANA 7 - UI BÁSICA

### T7.1: Componentes Base
- [ ] SplashScreen.tsx
- [ ] MainMenu.tsx
- [ ] SystemList.tsx
- **Estimado:** 2h

### T7.2: Navegación
- [ ] Router (React Router)
- [ ] Navegación entre pantallas
- [ ] Breadcrumbs
- **Estimado:** 1.5h

### T7.3: Estilo y Temas
- [ ] Crear tema base (Tailwind/CSS)
- [ ] Colores arcade
- [ ] Fuentes retro
- **Estimado:** 1.5h

### T7.4: Input Feedback
- [ ] Teclado para navegar
- [ ] Gamepad support (básico)
- [ ] Sonidos de UI
- **Estimado:** 1h

### T7.5: Testing
- [ ] Tests de componentes (Vitest)
- [ ] Tests de routing
- [ ] Snapshot tests
- **Estimado:** 1.5h

**Semana 7 Total:** 7.5 horas  
**Hito:** UI navegable ✅

---

## ⏱️ SEMANA 8 - TIMER MANAGER

### T8.1: Timer Core
- [ ] Crear core/timer_manager.rs
- [ ] Sistema de temporizador
- [ ] Estados (running, paused, finished)
- **Estimado:** 1.5h

### T8.2: Modo Coins vs Timer
- [ ] Lógica híbrida monedas/timer
- [ ] Configuración por juego
- [ ] Validaciones
- **Estimado:** 1.5h

### T8.3: Frontend Timer
- [ ] TimerOverlay.tsx component
- [ ] Mostrar tiempo restante
- [ ] Animaciones
- **Estimado:** 1h

### T8.4: Tauri Commands
- [ ] Start/pause/resume timer
- [ ] Set duration
- [ ] Callbacks al terminar
- **Estimado:** 1h

### T8.5: Tests
- [ ] Tests de timer
- [ ] Tests de híbrido coins/timer
- [ ] Edge cases
- **Estimado:** 1.5h

**Semana 8 Total:** 6.5 horas  
**Hito:** Timer funcionando ✅

---

## 🔊 SEMANA 9 - MULTI-EMULADOR (RetroArch)

### T9.1: RetroArch Adapter
- [ ] Crear adapters/retroarch.rs
- [ ] Support para cores
- [ ] Builder de argumentos
- **Estimado:** 1.5h

### T9.2: Cores y Sistemas
- [ ] Mapear cores a sistemas (SNES, Genesis, NES)
- [ ] Crear adapters para cada core
- [ ] Validar cores instalados
- **Estimado:** 2h

### T9.3: Frontend Selector
- [ ] Mostrar core disponibles
- [ ] Seleccionar core por juego
- [ ] Guardar preferencias
- **Estimado:** 1.5h

### T9.4: Testing
- [ ] Tests de cores
- [ ] Tests de mapeo sistemas->cores
- [ ] Mock de RetroArch
- **Estimado:** 1.5h

**Semana 9 Total:** 6.5 horas  
**Hito:** RetroArch + múltiples sistemas ✅

---

## 🎮 SEMANA 10 - INPUT UNIVERSAL (SDL2)

### T10.1: SDL2 Backend
- [ ] Crear input/sdl_backend.rs
- [ ] Inicializar SDL2
- [ ] Joystick detection
- **Estimado:** 2h

### T10.2: GilRs Integration
- [ ] Crear input/gilrs_backend.rs
- [ ] Gamepad detection
- [ ] Event handling
- **Estimado:** 1.5h

### T10.3: Input Mapping
- [ ] Crear input/mapping.rs
- [ ] Profile system (Xbox, PS4, Arcade)
- [ ] Key remapping
- **Estimado:** 2h

### T10.4: Config Wizard
- [ ] InputConfig.tsx component
- [ ] Wizard de configuración visual
- [ ] Test de inputs
- **Estimado:** 1.5h

### T10.5: Tests
- [ ] Mock de SDL2
- [ ] Tests de mapping
- [ ] Tests de profiles
- **Estimado:** 1.5h

**Semana 10 Total:** 8.5 horas  
**Hito:** SDL2 + GilRs funcionando ✅

---

## 🛡️ SEMANA 11 - OPERATOR PANEL

### T11.1: Panel Backend
- [ ] Crear OperatorPanel.tsx component
- [ ] PIN protection
- [ ] Admin commands
- **Estimado:** 2h

### T11.2: Estadísticas
- [ ] Dashboard con stats (earnings, top games)
- [ ] Gráficos
- [ ] Reportes
- **Estimado:** 1.5h

### T11.3: Configuración Operador
- [ ] Precios y monedas
- [ ] Mantenimiento checklist
- [ ] Logs de operaciones
- **Estimado:** 1.5h

### T11.4: Security
- [ ] PIN hashing
- [ ] Rate limiting
- [ ] Audit log
- **Estimado:** 1.5h

### T11.5: Tests
- [ ] Tests de PIN
- [ ] Tests de permisos
- [ ] Tests de stats
- **Estimado:** 1h

**Semana 11 Total:** 7.5 horas  
**Hito:** Panel operador funcional ✅

---

## 🚀 SEMANA 12 - AUTOBOOT + KIOSK

### T12.1: Autoboot Windows
- [ ] Registry keys para autostart
- [ ] Startup scripts
- [ ] Minimizar a system tray
- **Estimado:** 1.5h

### T12.2: Autoboot Linux
- [ ] Systemd service
- [ ] Startup scripts
- [ ] Minimizar a system tray
- **Estimado:** 1.5h

### T12.3: Kiosk Mode
- [ ] Disable alt+tab, alt+f4
- [ ] Disable context menus
- [ ] Fullscreen enforced
- **Estimado:** 1.5h

### T12.4: Process Supervisor
- [ ] Crear core/process_supervisor.rs
- [ ] Monitor emulator processes
- [ ] Kill processes on error
- **Estimado:** 1h

### T12.5: Tests
- [ ] Tests de autoboot
- [ ] Tests de process supervisor
- [ ] Tests de kiosk mode
- **Estimado:** 1.5h

**Semana 12 Total:** 7 horas  
**Hito:** Autoboot en Win/Linux ✅

---

## 🎨 SEMANA 13 - THEMES + POLISH

### T13.1: Theme System
- [ ] Crear sistema de temas
- [ ] Tema clásico (HyperSpin style)
- [ ] Tema moderno (flat design)
- **Estimado:** 2h

### T13.2: Tercero Tema
- [ ] Tema retro (CRT effect)
- [ ] Switcher de temas
- [ ] Persistencia
- **Estimado:** 1.5h

### T13.3: Polish UI
- [ ] Animaciones suaves
- [ ] Transiciones
- [ ] Sound effects
- **Estimado:** 2h

### T13.4: Performance Optimization
- [ ] Profile de performance
- [ ] Optimizar renders
- [ ] Lazy loading
- **Estimado:** 1.5h

### T13.5: Tests
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Theme switching tests
- **Estimado:** 1.5h

**Semana 13 Total:** 8.5 horas  
**Hito:** 3 temas funcionando ✅

---

## 🎮 SEMANA 14 - EMULADORES ADICIONALES

### T14.1: Más Adapters
- [ ] PS1/2 (DuckStation, PCSX2)
- [ ] PSP (PPSSPP)
- [ ] GameCube/Wii (Dolphin)
- **Estimado:** 3h

### T14.2: Más Adapters Parte 2
- [ ] Xbox/360 (Xemu, Xenia)
- [ ] Arcade adicional (FBNeo)
- [ ] Computadoras (DOSBox, ScummVM)
- **Estimado:** 2.5h

### T14.3: Testing
- [ ] Tests de cada adapter
- [ ] Validar argumentos CLI
- [ ] Mock de ejecución
- **Estimado:** 2h

**Semana 14 Total:** 7.5 horas  
**Hito:** 15+ emuladores trabajando ✅

---

## 🧪 SEMANA 15 - TESTING + BUG FIXING

### T15.1: Unit Tests
- [ ] Cobertura >80% en core/
- [ ] Cobertura >70% en adapters/
- [ ] Coverage report
- **Estimado:** 3h

### T15.2: Integration Tests
- [ ] Tests de flujo completo
- [ ] Tests de IPC Tauri
- [ ] Tests de BD
- **Estimado:** 2h

### T15.3: Bug Fixing
- [ ] Identificar bugs
- [ ] Reproducir y documentar
- [ ] Fixear
- **Estimado:** 2.5h

### T15.4: Performance Testing
- [ ] Benchmark de startup
- [ ] Benchmark de scanning
- [ ] Memory profiling
- **Estimado:** 1.5h

**Semana 15 Total:** 9 horas  
**Hito:** Tests pasando, bugs fijos ✅

---

## 🎉 SEMANA 16 - RELEASE v1.0

### T16.1: Build Windows MSI
- [ ] Configurar NSIS
- [ ] Crear installer
- [ ] Code signing (opcional)
- **Estimado:** 2h

### T16.2: Build Linux
- [ ] .deb package
- [ ] .rpm package
- [ ] .AppImage
- **Estimado:** 1.5h

### T16.3: GitHub Release
- [ ] Crear GitHub release
- [ ] Upload binarios
- [ ] Escribir changelog
- **Estimado:** 1h

### T16.4: Documentación Final
- [ ] README actualizado
- [ ] Installation guide
- [ ] User guide
- **Estimado:** 2h

### T16.5: Celebration
- [ ] 🎉 NeoCab v1.0 oficial
- **Estimado:** 5 min

**Semana 16 Total:** 6.5 horas  
**Hito:** v1.0 released ✅

---

## 📊 RESUMEN TOTAL

| Semana | Horas | Hito |
|--------|-------|------|
| 0 | 2.5 | Preparación ✅ |
| 1 | 2.5 | Proyecto compilando ✅ |
| 2 | 6.5 | BD + Models ✅ |
| 3 | 7 | Config system ✅ |
| 4 | 7 | Game scanner ✅ |
| 5 | 6.5 | MAME ✅ |
| 6 | 6.5 | Coin system ✅ |
| 7 | 7.5 | UI ✅ |
| 8 | 6.5 | Timer ✅ |
| 9 | 6.5 | Multi-emu ✅ |
| 10 | 8.5 | SDL2 input ✅ |
| 11 | 7.5 | Operator panel ✅ |
| 12 | 7 | Autoboot ✅ |
| 13 | 8.5 | Themes ✅ |
| 14 | 7.5 | Emuladores ✅ |
| 15 | 9 | Testing ✅ |
| 16 | 6.5 | Release ✅ |
| **TOTAL** | **121 horas** | **v1.0 official** |

**Ritmo:** 4-6 horas/semana | 4 meses

---

## 🎯 CRITERIOS DE ÉXITO

- ✅ Compilación sin errores
- ✅ Tests pasando >80% cobertura
- ✅ Mínimo 10 emuladores funcionando
- ✅ Panel operador con PIN
- ✅ Autoboot en Win/Linux
- ✅ Documentación completa
- ✅ Builds para múltiples plataformas
- ✅ GitHub release oficial

---

**Plan de tareas finalizado**  
**Listo para comenzar Semana 1**  
**Próximo paso: Crear repositorio GitHub**
