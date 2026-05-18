# NeoCab v1.3.0 - Estado del Proyecto

**Última actualización:** 2026-05-18  
**Versión:** 1.3.0 ESTABLE  
**Progreso Global:** FASES 1-6 COMPLETADAS

---

## SESION 2026-05-18 - Bugs UI corregidos

### PinPad invisible (ARREGLADO)
**Problema**: Panel de Operador y Ajustes no hacian nada al hacer click  
**Causa**: `PinPad.tsx` no importaba su propio `PinPad.css` — el overlay era invisible  
**Solucion**: Añadido `import './PinPad.css'` en `PinPad.tsx`  
**PIN de acceso**: 1234

### ViewTransition pantalla negra (ARREGLADO)
**Problema**: Al navegar a "Jugar Arcade" el contenido desaparecia (pantalla negra)  
**Causa**: `useEffect` dependia de `children` como prop, que tiene nueva referencia en cada re-render — disparaba ciclo exit→negro→enter continuamente  
**Solucion**: Simplificado a animacion de entrada unica al montar el componente

### AttractMode tapaba SystemSelect (ARREGLADO)
**Problema**: Al entrar a seleccion de sistemas el contenido desaparecia  
**Causa**: `{currentView === "systems" && <AttractMode ...>}` siempre renderizaba AttractMode encima, ignorando el estado `attractMode`  
**Solucion**: Cambiado a `{attractMode && <AttractMode ...>}` con onExit correcto

### Ajustes y Panel Operador eran lo mismo (ARREGLADO)
**Problema**: Ambos botones del menu abrían el mismo OperatorPanel  
**Causa**: `handlePinSuccess` llamaba `onShowOperator()` para ambas acciones  
**Solucion**: Creado `SettingsPanel` separado con sus propios tabs:
- **Ajustes** → Sistemas, Apariencia, Controles, Teclado
- **Panel Operador** → Estadisticas, Sesiones, Red, Registros, Auditoria, Kiosk, Plugins, Safe Quit

### save_system_config Command not found (ARREGLADO)
**Problema**: "Failed to add system: Command save_system_config not found"  
**Causa**: El comando existia en `commands/config.rs` pero no estaba registrado en `generate_handler!` de `lib.rs`  
**Solucion**: Añadido `commands::save_system_config` en `lib.rs`

### JSON.parse en SystemManager (ARREGLADO)
**Problema**: "Unexpected token 'o', [object Obj... is not valid JSON" al cargar sistemas  
**Causa**: Tauri 2.x deserializa automaticamente Rust → JS; el frontend hacia `invoke<string>` + `JSON.parse()` innecesariamente  
**Solucion**: Cambiado a `invoke<SystemConfig[]>` sin JSON.parse

### Marquee segunda ventana no actualizaba (ARREGLADO)
**Problema**: La ventana marquee no mostraba el juego enfocado  
**Causa**: `App.tsx` emitia evento `"update_marquee"` con campos `system`/`wheel_path`, pero `MarqueeView.tsx` escuchaba `"game_focused"` esperando `system_name`/`image_path`  
**Solucion**: Sincronizados — App.tsx ahora emite `"game_focused"` con los campos correctos

### Scan no recargaba juegos (ARREGLADO)
**Problema**: Despues de escanear ROMs la lista de juegos no se actualizaba  
**Causa**: `handleScanROMs` solo llamaba `loadSystems()`, no `loadGames()`  
**Solucion**: Añadido `loadGames(selectedSystem.name)` si hay sistema seleccionado

---

## HITOS CRÍTICOS CORREGIDOS EN SESIONES ANTERIORES

### 1️⃣ Crash por mDNS Daemon (ARREGLADO ✅)
**Problema**: App se cerraba al iniciar si no había red/UDP multicast  
**Causa**: `ServiceDaemon::new()` fallaba → error se propagaba → app cerraba silenciosamente  
**Solución**: Daemon ahora es `Option<ServiceDaemon>`, fallback a modo standalone  
**Resultado**: App arranca incluso sin red

### 2️⃣ Crash por Config.yml Inválido (ARREGLADO ✅)
**Problema**: YAML generado tenía estructura incompatible con AppConfig struct  
**Causa**: Schema mismatch entre generador y parser  
**Solución**: ConfigManager ahora carga defaults si el YAML falla al parsear  
**Resultado**: App carga con configuración por defecto incluso si config.yml está mal

### 3️⃣ Comandos Duplicados en Handler (ARREGLADO ✅)
**Problema**: 8 comandos registrados dos veces en invoke_handler  
**Causa**: Copy-paste en lib.rs  
**Solución**: Eliminados duplicados, reorganizado por categoría  
**Resultado**: Handler compila limpio

### 4️⃣ OperatorPanel Importaba Versión Vieja (ARREGLADO ✅)
**Problema**: App.tsx importaba OperatorPanel simple (3 tabs) en lugar del nuevo (7 tabs)  
**Causa**: Import equivocado  
**Solución**: Cambio de `./components/OperatorPanel` → `./components/operator/OperatorPanel`  
**Resultado**: Ahora ves los 7 tabs: Estadísticas, Controles, Red, Studio, Logs, Auditoría, Config

---

## ⚙️ MEJORAS DE INSTALACIÓN Y RUTAS

### Sin Necesidad de Administrador
- **Antes**: Instalaba en `C:\Program Files\NeoCab\` (requería admin)
- **Después**: Instala en `C:\Users\[Usuario]\AppData\Local\Programs\NeoCab\` (sin admin)
- **Configuración**: `tauri.conf.json` → `installMode: "currentUser"`

### Rutas Portables (Auto-Contenida)
- **Antes**: `./data/` relativo al CWD (impredecible en app instalada)
- **Después**: `./data/` relativo al directorio del exe (portable)
- **Función**: `get_base_dir()` en lib.rs que resuelve a la carpeta del exe
- **Resultado**: Todo se crea junto al exe, sin problemas de permisos

**Estructura de directorios post-instalación**:
```
C:\Users\[Usuario]\AppData\Local\Programs\NeoCab\
├── NeoCab.exe
├── data/
│   ├── neocab.db          ← Base de datos SQLite
│   ├── config.yml         ← Config auto-generada
│   ├── games/             ← ROMs por sistema
│   ├── media/             ← Assets (wheels, marquees, etc.)
│   ├── themes/            ← Configuración de temas
│   ├── logs/              ← Registros diarios
│   └── backups/
└── config/
    ├── shaders/           ← Shaders CRT/upscaling
    ├── themes/
    └── joy_profiles/      ← Mapeos de controles
```

---

## ✅ ESTADO ACTUAL: ESTABLE

### Backend (Rust)
- ✅ Base de datos SQLite inicializada
- ✅ 7 sistemas por defecto cargados (MAME, NES, SNES, Genesis, PSX, N64, GB)
- ✅ 8 emuladores registrados (MAME + 7 cores RetroArch)
- ✅ Servidor API (Axum en puerto 8080)
- ✅ mDNS discovery y advertising
- ✅ Monitoreo de carpetas media
- ✅ Detección de shaders
- ✅ Sistema de logging

### Frontend (React)
- ✅ App arranca sin crashes
- ✅ UI se renderiza correctamente
- ✅ Panel Operador (PIN 1234): Estadisticas, Sesiones, Red, Logs, Auditoria, Kiosk, Plugins, Safe Quit
- ✅ Ajustes (PIN 1234): Sistemas, Apariencia, Controles, Teclado
- ✅ Navegacion sin pantallas negras
- ✅ AttractMode solo activa tras 60s inactividad
- ✅ Marquee segunda ventana sincronizada
- ✅ Escaneo de ROMs actualiza lista de juegos

### Instalación
- ✅ Instalador NSIS (sin admin)
- ✅ Instalación portátil
- ✅ Auto-crea directorios necesarios
- ✅ Fallback graceful en errores
- ✅ Maneja ausencia de red

---

## PROBLEMAS CONOCIDOS (Por Resolver)

### Prioridad Alta
- [ ] **Lanzar Juegos**: No se pueden probar sin ROMs reales — backend listo, falta contenido

### Prioridad Media
- [ ] JoyMapper UI refinement
- [ ] Smart Scraper integration completa
- [ ] Pause Menu en contexto de juego

---

## 📊 MATRIZ DE FEATURES

| Feature | Status | Notas |
|---------|--------|-------|
| **NeoCab Studio** | ⚠️ Parcial | Componente existe, UI funcional, necesita ROM test |
| **JoyMapper** | ⚠️ Parcial | InputWizard tab visible, motor core funcional |
| **Launcher Pro Fades** | ⚠️ Parcial | FadeOverlay existe, necesita contexto de juego |
| **Smart Scraper** | ⚠️ Parcial | Comandos existen, UI no integrada |
| **Attract Mode** | ✅ Implementado | Listo, auto-trigger pendiente |
| **Marquee Dual Monitor** | ✅ Implementado | Segunda ventana configurada |
| **Operator Panel** | ✅ Funcional | 7 tabs visibles y clickeables |
| **Database** | ✅ Completo | SQLite 10 tablas, sistemas preload |
| **Emulator Framework** | ✅ Completo | 8 adapters registrados |

---

## 🔨 INFORMACIÓN DE BUILD

**Último build exitoso**: 2026-05-14 00:15 UTC  
**Compilación**: ~7 minutos (React + Rust)  
**Tamaño**: ~55 MB MSI, ~40 MB NSIS exe  

**Instaladores**:
- 📦 MSI: `src-tauri/target/release/bundle/msi/NeoCab_0.1.0_x64_en-US.msi`
- 📦 EXE: `src-tauri/target/release/bundle/nsis/NeoCab_0.1.0_x64-setup.exe` ← Recomendado

---

## 📋 QUÉ FUNCIONA END-TO-END (TESTEABLE AHORA)

1. ✅ Instalar sin admin
2. ✅ App arranca a menú principal
3. ✅ Botón "Operator" → OperatorPanel
4. ✅ Ver 7 tabs (Estadísticas, Controles, Red, Studio, Logs, Auditoría, Config)
5. ✅ Cambiar entre tabs clickeando
6. ✅ Ver información de sistema/logs
7. ✅ Red discovery funcional en background
8. ✅ API server corriendo en puerto 8080
9. ✅ Crear carpetas y archivos automáticamente
10. ✅ Recuperarse de errores de config sin crashear

---

## 🚀 PRÓXIMOS PASOS (ROADMAP)

### Semana 1
- [ ] Integrar navegación por teclado (flechas)
- [ ] Enforcer PIN en acceso a Operator
- [ ] Crear ROM demo o mock para testing
- [ ] Pause menu en contexto de juego

### Semana 2
- [ ] Smart Scraper UI integration
- [ ] Theme editor flujo completo
- [ ] Statistics population
- [ ] InputWizard flujo end-to-end

### Semana 3
- [ ] Soporte multi-idioma (i18n framework existe)
- [ ] Profiling y optimización
- [ ] Testing de edge cases

---

## 🎓 DOCUMENTACIÓN RELACIONADA

- **Arquitectura**: `docs/02_PLAN_MAESTRO_PARTE_2.md`
- **UI Guide**: `docs/15_UI_HYPERSPIN_WHEEL.md`
- **JoyMapper**: `docs/16_JOYMAPPER_NATIVO.md`
- **NeoCab Studio**: `docs/18_NEOCAB_STUDIO.md`
- **Setup**: `docs/17_SETUP_WIZARD.md`
- **Roadmap Completo**: `docs/05_CRONOGRAMA_DIA_POR_DIA.md`

---

## 🔍 DEBUGGING

**Ubicación de logs**:
```
%LOCALAPPDATA%\Programs\NeoCab\data\logs\neocab.log
```

**Verificar que app arranca correctamente**: Log debe contener:
```
Base directory: C:\Users\...\AppData\Local\Programs\NeoCab
Default emulators initialized
NeoCab API Server listening on 0.0.0.0:8080
mDNS Advertising started
mDNS Discovery started
```

---

## 📈 EVALUACIÓN GENERAL

**Salud del Proyecto**: 🟢 **ESTABLE**  
**Arquitectura**: 🟢 **SÓLIDA**  
**Backend**: 🟢 **LISTO**  
**Frontend**: 🟡 **EN PROGRESO** (faltan integraciones)  
**Testing**: 🟡 **BLOQUEADO POR CONTENIDO** (sin ROMs)  

**Conclusión**: La aplicación es estable y funciona. El núcleo está listo. Los próximos pasos son completar las integraciones UI y permitir testing con contenido real (ROMs).
