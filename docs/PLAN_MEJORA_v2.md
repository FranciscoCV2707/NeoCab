# NeoCab v2.0 — Plan de Mejora Integral

> Basado en análisis meticuloso de AdvanceMAME, Attract, AttractPlus, Pegasus Frontend, RetroFE y SimpleLauncher.
> Fecha: 2026-05-15 | Partiendo de v1.3.0 | ~1100 horas estimadas

---

## Resumen Ejecutivo

NeoCab ya lidera en: JoyMapper v2 (input mapping más sofisticado del mercado libre), coin system híbrido único (arcade + timed + unlimited + token), networking P2P entre cabinets, shaders GLSL con hot-reload, GPIO/Arduino, y sistema de temas con jerarquía de 3 niveles. Las mejoras aquí apuntan a cerrar **19 brechas** identificadas en los otros 6 frontends, organizadas en 5 fases.

### KPIs objetivo v2.0

| Métrica | v1.3.0 | v2.0 target |
|---------|--------|-------------|
| Emuladores con config injection | 0 | 21 |
| Idiomas | 2 (EN, ES) | 5 (EN, ES, FR, DE, PT-BR) |
| Claves i18n | ~40 | 200+ |
| Testing frontend | 0% | 60% coverage |
| Layout engine | JSON plano | YAML con animaciones + easing |
| Tiempo setup inicial | 30min manual | 5min wizard automático |
| Plugins | 0 | ilimitados (Lua API) |
| Monitores soportados | 2 | N (layout independiente c/u) |
| Achievements | schema DB only | login + display + inyección |

---

## ARQUITECTURA OBJETIVO v2.0

```
src/                          # React frontend
├── stores/                   # [NUEVO] Zustand stores
│   ├── useGameStore.ts
│   ├── useSystemStore.ts
│   ├── useUIStore.ts
│   └── useThemeStore.ts
├── pages/                    # [NUEVO] React Router pages
│   ├── MenuPage.tsx
│   ├── SystemsPage.tsx
│   ├── GamesPage.tsx
│   └── OperatorPage.tsx
├── components/
│   ├── layout/               # [NUEVO] Layout engine
│   │   ├── LayoutEngine.tsx      # Parser YAML → React components
│   │   ├── ReloadableImage.tsx
│   │   ├── ReloadableVideo.tsx
│   │   ├── ReloadableText.tsx
│   │   ├── MenuList.tsx
│   │   ├── AnimationController.tsx
│   │   └── easing.ts             # 21 functions (expandido)
│   ├── legacy/                # Componentes actuales (transición)
│   └── ...
├── i18n/                     # [NUEVO] Multi-language
│   ├── en.json, es.json, fr.json, de.json, pt-br.json
│   └── index.ts
└── hooks/
    ├── useGamepad.ts          # [MEJORADO] event-driven
    └── useTheme.ts

src-tauri/src/
├── updater/                  # [NUEVO] Auto-updater
│   ├── mod.rs
│   ├── github_checker.rs
│   ├── downloader.rs
│   └── installer.rs
├── adapters/
│   ├── trait_adapter.rs
│   ├── mame_adapter.rs
│   ├── retroarch_adapter.rs
│   ├── config_injectors/     # [NUEVO]
│   │   ├── mod.rs
│   │   ├── mame_injector.rs
│   │   ├── retroarch_injector.rs
│   │   ├── dolphin_injector.rs
│   │   ├── pcsx2_injector.rs
│   │   ├── duckstation_injector.rs
│   │   ├── xenia_injector.rs
│   │   └── ...
│   └── launch/               # [NUEVO] Launch strategies
│       ├── mod.rs
│       ├── strategy.rs           # Trait LaunchStrategy
│       ├── chd_mount.rs
│       ├── zip_extract.rs
│       ├── batch_file.rs
│       ├── shortcut.rs
│       └── default_rom.rs
├── core/
│   ├── scraper.rs             # [MEJORADO] Completo
│   ├── retroachievements.rs   # [NUEVO]
│   ├── emulator_detector.rs   # [MEJORADO] Autodetección real
│   ├── plugin_engine.rs       # [NUEVO] Lua runtime
│   ├── script_hooks.rs        # [NUEVO] OS-level hooks
│   └── video_pipeline.rs      # [NUEVO] Auto-degradación
├── utils/
│   ├── fuzzy_match.rs         # [NUEVO] Jaro-Winkler
│   └── safe_quit.rs           # [NUEVO] AdvanceMAME-style
├── db/
│   ├── connection.rs
│   └── migrations/            # [NUEVO] Migraciones versionadas
│       ├── 001_initial.sql
│       ├── 002_emulators.sql
│       └── ...
├── commands/                  # 20+ Tauri commands nuevos
│   ├── updater.rs
│   ├── achievements.rs
│   ├── plugins.rs
│   └── ...
└── legacy/                    # Windows XP support (sin cambios)

neocab-updater/               # [NUEVO] Binario standalone
├── Cargo.toml
└── src/
    ├── main.rs
    ├── github.rs
    ├── download.rs
    ├── extract.rs
    └── installer.rs
```

---

## FASE 0 — BAJA FRUTA (menos esfuerzo, alto impacto)

### 0.1 Auto-Updater
**Origen:** SimpleLauncher
**UX:** El usuario recibe notificación de nueva versión, confirma, y NeoCab se actualiza solo sin perder configuración.
**Dependencias:** Ninguna
**Riesgo:** Bajo (proceso separado, no toca el binario principal)
**Archivos:** `src-tauri/src/updater/` + `neocab-updater/` (binario separado)
**Estimación:** ~60h

**Pipeline:**
1. `neocab-updater` es un binario Rust standalone (~500KB) sin dependencia Tauri
2. SimpleLauncher hace check vía `api.github.com/repos/neocab/neocab/releases/latest`
3. Compara versión actual vs `tag_name` usando `semver`
4. Si hay update: descarga ZIP a memoria, verifica SHA-256, extrae con protección Zip Slip
5. Lock file `update.lock` para evitar ejecución concurrente
6. Relanza NeoCab con flag `--restarting`

**Protecciones:**
- Zip Slip: verificar que `Path::new(entry.name()).components()` no contiene `..`
- Checksum: SHA-256 del ZIP contra `checksum` del release body
- Fallback manual si falla la extracción: mostrar URL de descarga
- Backup del binario anterior antes de reemplazar

**Comandos Tauri:**
- `check_for_updates` → `{ available: bool, version: string, changelog: string, download_size: number }`
- `download_and_install_update` → lanza `neocab-updater.exe` con PID como argumento
- `get_update_progress` → `{ status: "downloading"|"extracting"|"done"|"error", progress: number, error?: string }`

**UI React:**
- Badge en Settings cuando hay update disponible
- Modal con: versión actual → versión nueva, changelog, ProgressBar, botón "Update & Restart"
- Opción "Check for updates" manual

### 0.2 Config Injection en Emuladores
**Origen:** SimpleLauncher (21 emuladores)
**UX:** El usuario configura resolución, GPU, sonido, controles desde NeoCab y se inyecta automáticamente en cada emulador antes de lanzar el juego.
**Dependencias:** 2.1 (autodetección de emuladores)
**Riesgo:** Medio (formatos de config variables entre versiones)
**Archivos:** `src-tauri/src/adapters/config_injectors/`
**Estimación:** ~100h

**Arquitectura:**
```rust
#[async_trait]
trait EmulatorConfigInjector: Send + Sync {
    /// Nombre del emulador (ej: "MAME", "RetroArch")
    fn emulator_name(&self) -> &str;

    /// Detecta si este injector aplica al emulador/versión
    fn can_handle(&self, emulator_path: &str) -> bool;

    /// Inyecta settings antes del launch
    async fn inject(&self, game: &Game, settings: &EmulatorSettings) -> Result<()>;

    /// Lee settings actuales del emulador
    async fn read_current(&self, emulator_path: &str) -> Result<EmulatorSettings>;
}
```

**Inyectores iniciales (orden de implementación):**

| Emulador | Formato | Settings clave |
|----------|---------|---------------|
| MAME | ini | video, autoframeskip, cheat, artwork, bezel, sound, samplerate |
| RetroArch | cfg | video_driver, audio_driver, input_driver, video_fullscreen, video_scale, video_rotation |
| Dolphin | ini | GFXBackend, VSync, InternalResolution, FullscreenDisplay, Volume |
| PCSX2 | ini | GSAdapter, UpscaleMultiplier, VSyncEnable, Fxaa, ShadeBoost |
| DuckStation | ini | Renderer, ResolutionScale, VSync, AudioBackend, PostProcessing |
| Xenia | toml | gpu, storage, memory, apu, draw_resolution_scale_x, vsync |
| RPCS3 | yml | Video, Audio, Input, System, Network |

**UI React:**
- Settings → Emulators → [seleccionar emulador] → pestaña "Configuration"
- Formulario generado dinámicamente según campos del emulador
- Botón "Detect & Read Current" que lee config actual
- Botón "Apply & Test" que inyecta y lanza un juego de prueba

**Formato unificado `EmulatorSettings` (serde):**
```rust
struct EmulatorSettings {
    video: VideoSettings { renderer, resolution_scale, vsync, fullscreen, aspect_ratio, rotation },
    audio: AudioSettings { backend, device, volume, samplerate, latency },
    input: InputSettings { device, bindings, deadzone },
    advanced: HashMap<String, String>, // custom key-value for unsupported settings
}
```

### 0.3 Fuzzy Matching de Artwork
**Origen:** SimpleLauncher (Jaro-Winkler)
**UX:** Las carátulas aparecen aunque el nombre del archivo no coincida exactamente con el nombre del juego.
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/utils/fuzzy_match.rs`
**Estimación:** ~25h

**Algoritmo:**
1. Normalizar nombres: lowercase, sin acentos, sin paréntesis/paréntesis/corchetes
2. Exact match → O(1) con HashMap
3. Fuzzy match via Jaro-Winkler → O(n × m) sobre nombres de archivo
4. Threshold: 0.80 (configurable 0.0 - 1.0)
5. Si hay múltiples matches sobre threshold, elegir el más alto
6. Cache en SQLite: `fuzzy_matches(game_crc32, artwork_filename, similarity, threshold_used)`

**Extensiones soportadas:** png, jpg, jpeg, gif, webp, bmp

**Comando Tauri:**
- `find_cover_art { game_title, system_name, game_crc32 }` → `{ found: bool, path: string, similarity: float, method: "exact"|"fuzzy"|"default" }`

### 0.4 Scraping Batch Funcional
**Origen:** SimpleLauncher + AttractPlus
**UX:** El usuario selecciona "Scrape All" y NeoCab descarga metadata + artwork de todos los juegos automáticamente.
**Dependencias:** 0.3 (fuzzy matching para asignar artwork descargado)
**Riesgo:** Medio (APIs externas pueden cambiar, rate limiting)
**Archivos:** `src-tauri/src/core/scraper.rs` (completar esqueleto actual)
**Estimación:** ~80h

**Arquitectura:**

```
ScraperManager
├── RateLimiter (1 req/s, cola de prioridad)
├── SourceRegistry
│   ├── TheGamesDB (XML API, gratuita)
│   ├── ArcadeDB (API REST, gratuita)
│   ├── IGDB (requiere API key de Twitch)
│   └── Screenscraper (API key opcional, mejor cobertura)
├── CacheManager (SQLite)
└── BatchOrchestrator
    ├── ScrapeJob { game_id, sources[], retry_count, status }
    ├── ProgressTracker { current, total, failed }
    └── ExportPipeline { metadata → DB, artwork → disco }
```

**Pipeline de scraping:**
1. Queue de juegos sin metadata (SELECT * FROM games WHERE description IS NULL)
2. Por cada juego: consultar fuente primaria → fallback a secundaria
3. Parsear respuesta → extraer: description, year, developer, publisher, genre, players, rating
4. Descargar artwork: box art, screenshot, marquee, wheel
5. Asignar artwork con fuzzy matching si el nombre no coincide
6. Actualizar DB y disco

**Características:**
- Resume: si se interrumpe, continuar desde donde quedó
- Dedup: no re-scrapear juegos ya scrapeados (configurable: force)
- Prioridad: juegos más populares primero
- Modo offline: usar cache existente

**Comandos Tauri:**
- `scrape_game { game_id, force? }` → scrapeo individual
- `scrape_all { source?, system? }` → batch con progreso real-time
- `cancel_scraping` → detener batch actual
- `get_scraping_progress` → `{ current, total, failed, eta }`

### 0.5 Multi-language Completo
**Origen:** SimpleLauncher (17 idiomas) + AttractPlus
**UX:** La UI cambia de idioma al instante sin reiniciar.
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Archivos:** `src/i18n/`
**Estimación:** ~40h

**Estructura:**
```
src/i18n/
├── index.ts                    # Loader + reactive hook
├── en.json                     # 200+ claves (idioma base, reference)
├── es.json                     # Traducción completa
├── fr.json
├── de.json
└── pt-br.json
```

**Sistema reactivo:**
```typescript
// useTranslation hook
function useTranslation() {
  const [locale, setLocale] = useState(detectLocale());
  const t = useCallback((key: string, vars?: Record<string, string>) => {
    const template = translations[locale][key] || translations['en'][key] || key;
    return vars ? interpolate(template, vars) : template;
  }, [locale]);
  return { t, locale, setLocale };
}
```

**200+ claves organizadas en categorías:**
- `nav.`: back, search, settings, exit
- `menu.`: play, scan_roms, operator_panel, system_settings
- `game.`: title, year, developer, publisher, genre, players, play_count, rating
- `filter.`: all, favorites, genre, year, sort, clear
- `settings.`: display, audio, input, emulators, network, themes, language, updates
- `operator.`: pin, earnings, stats, maintenance, logs
- `coin.`: insert_coin, credit, time_remaining, free_play
- `attract.`: press_start, attract_mode, insert_coin_blink
- `error.`: generic, file_not_found, emulator_not_found, scan_failed, launch_failed
- `updater.`: check_update, update_available, downloading, restart, up_to_date

**Detección de locale:** `navigator.language` → match con ISO 639-1 → fallback EN

---

## FASE 1 — ARQUITECTURA FRONTEND (media esfuerzo, alto impacto)

### 1.1 Estado Global con Zustand
**Origen:** Deuda técnica identificada
**UX:** Navegación más fluida, menos parpadeos, estado compartido sin prop drilling.
**Dependencias:** Ninguna
**Riesgo:** Medio (refactor grande, requiere testing)
**Archivos:** `src/stores/`
**Estimación:** ~50h

**Stores:**

```typescript
// useGameStore.ts
interface GameStore {
  games: Game[];
  filteredGames: Game[];
  focusedIndex: number;
  searchQuery: string;
  filters: { genre: string; year: string; favorites: boolean };
  sort: { field: SortField; order: SortOrder };
  loadGames: (systemName: string) => Promise<void>;
  setFilter: (key: string, value: string) => void;
  setSort: (field: SortField, order: SortOrder) => void;
  setFocus: (index: number) => void;
}

// useSystemStore.ts
interface SystemStore {
  systems: System[];
  selectedSystem: System | null;
  loading: boolean;
  loadSystems: () => Promise<void>;
  selectSystem: (system: System) => void;
}

// useUIStore.ts
interface UIStore {
  currentView: View;
  fadeVisible: boolean;
  pauseVisible: boolean;
  attractMode: boolean;
  showSaveStateModal: boolean;
  setView: (view: View) => void;
  togglePause: () => void;
  toggleAttract: () => void;
}

// useThemeStore.ts
interface ThemeStore {
  currentTheme: Theme | null;
  themes: Theme[];
  applyTheme: (theme: Theme) => void;
  listThemes: () => Promise<void>;
}
```

**Migración:**
1. Crear stores con Zustand (sincrónico, sin boilerplate)
2. Refactor App.tsx: mover lógica de estado a stores
3. Componentes consumen hooks en vez de props
4. Eliminar prop drilling: `focusedIndex`, `loading`, etc. van a store

### 1.2 React Router
**Origen:** Deuda técnica identificada
**UX:** URLs navegables, back button del navegador funcional, lazy loading por ruta.
**Dependencias:** 1.1 (stores disponibles globalmente)
**Riesgo:** Medio
**Archivos:** `src/pages/` (nuevo), `src/App.tsx` (refactor)
**Estimación:** ~30h

**Rutas:**
```
/                          → MenuPage
/systems                   → SystemsPage
/systems/:name             → GamesPage
/operator                  → OperatorPage
/settings                  → SettingsPage
/settings/emulators        → EmulatorSettingsPage
/settings/themes/:id       → ThemeEditorPage
```

**Layout anidado:**
```tsx
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/" element={<MenuPage />} />
    <Route path="/systems" element={<SystemsPage />} />
    <Route path="/systems/:name" element={<GamesPage />} />
    <Route path="/operator" element={<OperatorPage />} />
    <Route path="/settings" element={<SettingsPage />}>
      <Route path="emulators" element={<EmulatorSettings />} />
      <Route path="themes" element={<ThemeSettings />} />
      <Route path="updates" element={<UpdateSettings />} />
    </Route>
  </Route>
</Routes>
```

**Transiciones:** Usar `ViewTransition.tsx` existente envuelta en `AnimatePresence`-like.

### 1.3 Sistema de Layouts Dinámicos
**Origen:** RetroFE (XML + tweens por evento) + AttractPlus (Squirrel)
**UX:** Los themes pueden definir layouts completamente diferentes: wheel horizontal, grid, lista vertical, coverflow, cada uno con sus propias animaciones.
**Dependencias:** 1.1, 1.2
**Riesgo:** Alto (cambio arquitectural significativo)
**Archivos:** `src/components/layout/`
**Estimación:** ~120h

**Formato layout.yaml:**
```yaml
name: arcade-classic-v2
version: "2.0"
author: NeoCab Team
description: Classic arcade layout with animated carousel

layout:
  width: 1920
  height: 1080
  background: "#0a0a0a"

  components:
    - id: bg_video
      type: reloadableVideo
      source: fanart
      x: 0
      y: 0
      width: stretch
      height: stretch
      alpha: 0.6
      animations:
        onHighlightEnter:
          - property: alpha
            from: 0.3
            to: 0.6
            duration: 500
            easing: easeOutCubic

    - id: wheel_container
      type: container
      x: center
      y: 80
      width: 1200
      height: 400
      clip: true
      children:
        - id: wheel
          type: menu
          mode: horizontal
          itemWidth: 200
          itemHeight: 300
          spacing: 20
          scrollTime: 300
          scrollAcceleration: true
          animations:
            onHighlightEnter:
              - property: alpha
                to: 1.0
                duration: 200
              - property: scale
                to: 1.1
                duration: 200
                algorithm: easeOutQuadratic

    - id: game_title
      type: reloadableText
      source: title
      font: "Roboto Bold"
      fontSize: 48
      color: "#ffffff"
      x: center
      y: 500
      align: center
      animations:
        onHighlightEnter:
          - property: y
            from: 520
            to: 500
            duration: 300
            easing: easeOutBack  # overshoot elegante

    - id: game_info
      type: reloadableText
      source: "[[year]] • [[developer]] • [[players]]P"
      fontSize: 24
      color: "#aaaaaa"
      x: center
      y: 560

    - id: scanlines
      type: effect
      effect: scanlines
      opacity: 0.15
```

**Componentes del layout engine:**

| Componente | Propósito | Props |
|------------|-----------|-------|
| `reloadableImage` | Imagen que cambia con selección | source, x, y, width, height, alpha, angle, reflection, corner_radius |
| `reloadableVideo` | Video que cambia con selección | source, numLoops, volume, fallbackImage |
| `reloadableText` | Texto con metadata dinámica | source (token string), font, fontSize, color, align, scroll |
| `menu` | Lista scrolling de items | mode, itemWidth, scrollTime, orientation, custom (para wheels) |
| `container` | Grupo con clipping | clip, children, backgroundColor |
| `effect` | Efecto visual | effect (scanlines, crt, glow, rgb_triad), params |
| `sound` | Evento de audio | type (highlight, select, load), src |

**21 easing functions:**
`linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInQuart`, `easeOutQuart`, `easeInOutQuart`, `easeInQuint`, `easeOutQuint`, `easeInOutQuint`, `easeInSine`, `easeOutSine`, `easeInOutSine`, `easeInExpo`, `easeOutExpo`, `easeInOutExpo`, `easeOutBack`, `easeInOutBack`

### 1.4 Live Theme Reload (F5)
**Origen:** Pegasus Frontend
**UX:** Los theme designers ven cambios al instante sin reiniciar la app.
**Dependencias:** 1.3
**Riesgo:** Bajo
**Archivos:** `src/hooks/useTheme.ts` (mejorado)
**Estimación:** ~15h

**Pipeline F5:**
1. Tauri listener: `global_shortcut("F5")` → evento `reload_theme`
2. `ThemeStore.applyTheme()` invalida todo:
   - Limpia caché de imágenes/videos
   - Recarga `theme.json` / `layout.yaml` de disco
   - Re-aplica variables CSS
   - Forza re-render del `LayoutEngine`
3. Efecto visual: flash sutil de 200ms para indicar recarga

**Para desarrollo:** Flag `--dev-theme` que watch el directorio del theme y hace auto-reload.

### 1.5 Magic Tokens
**Origen:** AttractPlus (`[Title]`, `[Year]`, `[!func]`) + RetroFE (`reloadableText` en XML)
**UX:** Los textos en layouts se actualizan automáticamente según el juego seleccionado.
**Dependencias:** 1.3 (layout engine consume tokens)
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/core/token_parser.rs` + `src/utils/tokens.ts`
**Estimación:** ~25h

**Tokens soportados:**

| Token | Fuente | Ejemplo |
|-------|--------|---------|
| `[Title]` | game.title | "Super Mario Bros" |
| `[Year]` | game.year | "1985" |
| `[Developer]` | game.developer | "Nintendo" |
| `[Publisher]` | game.publisher | "Nintendo" |
| `[Genre]` | game.genre | "Platformer" |
| `[Players]` | game.players | "1-2" |
| `[PlayedCount]` | game.play_count | "42" |
| `[PlayedTime]` | game.total_play_time | "6h 30m" |
| `[Rating]` | game.rating | "4.5" |
| `[Description]` | game.description | "Mario and Luigi..." |
| `[DisplayName]` | system.display_name | "Super Nintendo" |
| `[ListSize]` | games.length | "150" |
| `[ListEntry]` | focusedIndex + 1 | "7" |
| `[FilterName]` | filter name | "Favorites" |
| `[PlayedLast]` | game.last_played | "2026-05-10" |
| `[Favourite]` | game.is_favorite | "★" |
| `[Emulator]` | emulator name | "retroarch-snes" |

**Token functions:** `[!func_name]` invoca una función registrada en Lua/JS.
```yaml
# layout.yaml
- type: reloadableText
  source: "[!strip_man]"
```
```lua
-- script: functions.lua
function strip_man(game)
  local parts = split(game.developer, " ")
  return parts[1] -- "Nintendo" en vez de "Nintendo Co., Ltd."
end
```

**Parser:**
1. Escanear string en busca de `[...]`
2. Si empieza con `!`, ejecutar función
3. Si es token conocido, reemplazar con valor del juego actual
4. Cachear parse result por `(game.id, template_string)`
5. Re-parsear solo cuando cambia el juego seleccionado

---

## FASE 2 — BACKEND RUST (alta complejidad, alto impacto)

### 2.1 Autodetección de Emuladores + GUI de Configuración
**Origen:** Deuda técnica identificada + AttractPlus (auto-detect emulators)
**UX:** Al primer inicio, NeoCab detecta automáticamente los emuladores instalados y los configura.
**Dependencias:** Ninguna
**Riesgo:** Medio (paths varían por plataforma)
**Archivos:** `src-tauri/src/core/emulator_detector.rs` + `src-tauri/src/db/migrations/002_emulators.sql`
**Estimación:** ~60h

**Detección:**

| Emulador | Windows | Linux |
|----------|---------|-------|
| MAME | `where mame`, registry HKLM, `%PROGRAMFILES%` | `which mame`, `/usr/games/mame` |
| RetroArch | `where retroarch`, `%APPDATA%/RetroArch` | `which retroarch`, flatpak, snap |
| Dolphin | `where dolphin`, `%PROGRAMFILES%/Dolphin` | `which dolphin-emu` |
| PCSX2 | `where pcsx2`, `%PROGRAMFILES%/PCSX2` | `which pcsx2`, flatpak |
| DuckStation | `where duckstation`, `%LOCALAPPDATA%/DuckStation` | AppImage, flatpak |
| Xenia | `where xenia`, `%PROGRAMFILES%/Xenia` | - |
| RPCS3 | `where rpcs3`, `%PROGRAMFILES%/RPCS3` | `which rpcs3`, AppImage |
| Cemu | `where cemu`, `%PROGRAMFILES%/Cemu` | `which Cemu` |

**Tabla emulators en SQLite:**
```sql
CREATE TABLE emulators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    executable_path TEXT,
    version TEXT,
    core TEXT,                          -- para RetroArch: "snes9x", "nestopia", etc.
    supported_systems TEXT,              -- JSON array de system names
    last_detected_at TEXT,
    config_injector TEXT,               -- nombre del injector a usar
    settings_json TEXT,                 -- settings serializadas
    is_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

**Wizard de setup (nuevo componente React):**
```
Step 1/4: Welcome         → "NeoCab detected X emulators!"
Step 2/4: Review          → Lista de emuladores detectados (check/uncheck)
Step 3/4: Configure       → Para cada emulador: path, args, cores
Step 4/4: Map Systems     → Asignar emulador a cada sistema
```

### 2.2 Launch Pipeline con Estrategias
**Origen:** SimpleLauncher (6 estrategias con prioridad)
**UX:** NeoCab elige automáticamente la mejor forma de lanzar cada juego (CHD → mount, ZIP → extract, .bat → cmd, shortcut → ShellExecute, ROM → emulador).
**Dependencias:** 2.1 (necesita emuladores configurados)
**Riesgo:** Medio
**Archivos:** `src-tauri/src/adapters/launch/`
**Estimación:** ~50h

**Trait LaunchStrategy:**
```rust
#[async_trait]
pub trait LaunchStrategy: Send + Sync {
    /// Prioridad (menor = más alta)
    fn priority(&self) -> u32;

    /// Determina si esta estrategia puede manejar este contexto
    async fn can_handle(&self, ctx: &LaunchContext) -> bool;

    /// Ejecuta el lanzamiento
    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult>;

    /// Nombre descriptivo para logging
    fn name(&self) -> &str;
}

pub struct LaunchContext {
    pub game: Game,
    pub system: System,
    pub emulator: EmulatorConfig,
    pub original_path: PathBuf,         // ruta original del archivo
    pub resolved_path: Option<PathBuf>, // ruta resuelta (temp si se extrajo)
    pub pre_script: Option<String>,
    pub post_script: Option<String>,
    pub settings: EmulatorSettings,
    pub save_state_slot: Option<u32>,
}

pub struct LaunchResult {
    pub process_id: Option<u32>,
    pub resolved_path: Option<PathBuf>, // para limpieza post-launch
    pub method: String,                 // "direct", "mounted", "extracted", "bat"
}
```

**Estrategias (orden de prioridad):**

| Estrategia | Prioridad | Maneja |
|------------|-----------|--------|
| `ChdMountStrategy` | 10 | Archivos .chd → mount via chdman → lanzar .cue |
| `ChdToCueStrategy` | 15 | .chd → convertir a .cue temporal → lanzar .cue |
| `ZipExtractStrategy` | 20 | .zip/.7z extraer a temp → lanzar ROM |
| `XisoMountStrategy` | 25 | .xiso → mount virtual → lanzar |
| `PbpToCueStrategy` | 26 | .pbp → convertir .cue → lanzar (PSX) |
| `BatchFileStrategy` | 30 | .bat → cmd.exe /c |
| `ShortcutStrategy` | 40 | .lnk/.url → ShellExecute |
| `ExecutableStrategy` | 50 | .exe → directo (juegos PC) |
| `DefaultRomStrategy` | 999 | Cualquier otra extensión → emulador |

**Pipeline executor:**
```rust
pub async fn execute(ctx: LaunchContext) -> Result<LaunchResult> {
    let mut strategies: Vec<Box<dyn LaunchStrategy>> = vec![
        Box::new(ChdMountStrategy),
        Box::new(ZipExtractStrategy),
        Box::new(BatchFileStrategy),
        Box::new(DefaultRomStrategy),
    ];
    strategies.sort_by_key(|s| s.priority());

    for strategy in &strategies {
        if strategy.can_handle(&ctx).await {
            info!("Launching with strategy: {}", strategy.name());
            return strategy.launch(&ctx).await;
        }
    }

    Err(NeoCabError::NoSuitableLaunchStrategy)
}
```

### 2.3 Mount de Archivos (CHD, ZIP, XISO)
**Origen:** SimpleLauncher
**UX:** Los juegos en formato comprimido se montan sin extraer, ahorrando espacio y tiempo.
**Dependencias:** 2.2 (integración con launch pipeline)
**Riesgo:** Alto (depende de herramientas externas: chdman, Dokan)
**Archivos:** `src-tauri/src/adapters/launch/chd_mount.rs`, `zip_mount.rs`
**Estimación:** ~70h

**CHD Mount (prioridad alta):**
```rust
pub struct ChdMountStrategy;

#[async_trait]
impl LaunchStrategy for ChdMountStrategy {
    fn priority(&self) -> u32 { 10 }

    async fn can_handle(&self, ctx: &LaunchContext) -> bool {
        ctx.original_path.extension() == Some("chd")
            && which("chdman").is_ok()
    }

    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult> {
        // 1. Extraer CHD a .cue + .bin temporal
        let temp_dir = tempfile::tempdir()?;
        let output = Command::new("chdman")
            .arg("extractcd")
            .arg("-i").arg(&ctx.original_path)
            .arg("-o").arg(temp_dir.path().join("game.cue"))
            .output().await?;

        // 2. Buscar el .cue generado
        let cue = temp_dir.path().join("game.cue");

        // 3. Lanzar emulador con el .cue
        let emu_ctx = LaunchContext {
            resolved_path: Some(cue),
            ..ctx
        };
        DefaultRomStrategy.launch(&emu_ctx).await
    }
}
```

**Zip mount (Windows/Dokan):**
```rust
// Usar Dokan/WinFSP para montar ZIP como unidad virtual
// Alternativa: extraer a temp (más simple, más espacio)
```

**Limpieza:** Registrar `temp_dir` en `Drop` o en un `CleanupRegistry` global que limpia al salir del juego.

### 2.4 Kiosk Mode + Autoboot Reales
**Origen:** Deuda técnica (placeholders) + Pegasus (`--kiosk`)
**UX:** En modo kiosk, el usuario no puede salir, acceder a settings, ni apagar el sistema sin PIN.
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/core/autoboot.rs`, `src-tauri/src/main.rs`
**Estimación:** ~35h

**CLI flags:**
```
--kiosk                           # Habilita todo
--autoboot <system_name>          # Sistema a autoboot
--autoboot-delay <seconds>        # Delay antes de autoboot (default 5)
--disable-menu-settings           # Oculta settings
--disable-menu-shutdown           # Oculta shutdown
--disable-menu-reboot             # Oculta reboot
--disable-menu-appclose           # Oculta cerrar app
--disable-menu-suspend            # Oculta suspender
```

**Comportamiento kiosk:**
- Sin barra de título, sin botón de cerrar (Tauri window decorations: false)
- Alt+F4 interceptado (Tauri window listener)
- Escape en menu → no hace nada
- Task Manager disabled via `--kiosk` flag → registry en Windows
- PIN de operador: almacenado con bcrypt (`argon2` o `bcrypt` crate), verificado via `authenticate_operator` command
- Autoboot: `GameState` arranca en vista systems en vez de menu

**PIN de operador (mejora de seguridad):**
```rust
pub struct OperatorPin {
    pub pin_hash: String,   // bcrypt hash
    pub salt: String,
    pub attempts: u32,      // 3 intentos → lockout 30s
    pub locked_until: Option<DateTime<Utc>>,
}
```

### 2.5 RetroAchievements
**Origen:** SimpleLauncher (API completa)
**UX:** Los jugadores pueden hacer login con su cuenta de RetroAchievements, ver logros en pantalla y recibir notificaciones overlay cuando los consiguen.
**Dependencias:** Ninguna
**Riesgo:** Medio (API externa, puede cambiar)
**Archivos:** `src-tauri/src/core/retroachievements.rs`
**Estimación:** ~60h

**API Client:**
```rust
pub struct RetroAchievementsService {
    api_key: String,
    username: String,
    client: reqwest::Client,
    cache: Arc<Mutex<HashMap<String, AchievementSet>>>,
}

#[derive(Serialize, Deserialize)]
pub struct Achievement {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub badge_name: String,
    pub badge_url: String,
    pub points: u32,
    pub unlocked: bool,
    pub unlocked_at: Option<DateTime<Utc>>,
    pub category: String, // "achievement" | "progression"
}

impl RetroAchievementsService {
    pub async fn login(&self, username: &str, api_key: &str) -> Result<bool>;
    pub async fn get_game_achievements(&self, game_hash: &str) -> Result<Vec<Achievement>>;
    pub async fn get_user_achievements(&self, game_hash: &str) -> Result<Vec<Achievement>>;
    pub async fn get_user_summary(&self) -> Result<UserSummary>;
    pub async fn get_leaderboard(&self, lb_id: u32) -> Result<Vec<LeaderboardEntry>>;
}
```

**Hashing de ROMs:**
- CRC32 ya calculado en scan (pero RA usa MD5 para la mayoría de sistemas)
- Añadir MD5 + SHA1 en scan (campos ya existen en modelo Game)
- Cache: `SELECT * FROM games WHERE md5 IS NOT NULL`

**Integración en UI:**
- Settings → RetroAchievements: login form + status
- GameList: badge indicando logros disponibles
- Preview panel: lista de achievements con progress
- Overlay: notificación emergente cuando se desbloquea un logro (Tauri event)

**Inyección en RetroArch:**
```rust
// retroarch_injector.rs
// Inyectar en retroarch.cfg:
// cheevos_enable = "true"
// cheevos_username = "<username>"
// cheevos_password = "<api_key>"
// cheevos_badge_visible = "true"
// cheevos_leaderboards_enable = "true"
```

### 2.6 Migraciones de DB
**Origen:** Deuda técnica identificada
**Qué:** Schema se crea desde cero → DB corrupta si cambia en futura versión.
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/db/migrations/`
**Estimación:** ~20h

**Estructura:**
```
src-tauri/src/db/
├── connection.rs
├── migrations/
│   ├── mod.rs
│   ├── 001_initial.sql
│   └── 002_emulators.sql
```

**001_initial.sql:**
```sql
-- Same as current init_schema() but in migration format
CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now')),
    checksum TEXT
);
-- ... existing schema ...
INSERT INTO _migrations (version, checksum) VALUES (1, 'sha256_of_file');
```

**002_emulators.sql:**
```sql
CREATE TABLE emulators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    executable_path TEXT,
    version TEXT,
    core TEXT,
    supported_systems TEXT,
    last_detected_at TEXT,
    config_injector TEXT,
    settings_json TEXT DEFAULT '{}',
    is_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

**Runner:**
```rust
pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    let applied = get_applied_versions(pool).await?;
    let mut dir = fs::read_dir("src-tauri/src/db/migrations/")?;
    let mut files: Vec<_> = dir.filter_map(|e| e.ok())
        .filter(|e| e.path().extension() == Some("sql"))
        .collect();
    files.sort_by_key(|f| f.file_name());

    for entry in &files {
        let version: i64 = parse_version(entry.file_name())?;
        if !applied.contains(&version) {
            let sql = fs::read_to_string(entry.path())?;
            let checksum = sha256(&sql);
            execute_migration(pool, version, &sql, &checksum).await?;
        }
    }
    Ok(())
}
```

**Backup automático pre-migración:**
```rust
// Antes de migrar, copiar DB a neocab_backup_v{version}.db
fs::copy("neocab.db", format!("neocab_backup_v{}.db", version))?;
```

---

## FASE 3 — CARACTERÍSTICAS AVANZADAS

### 3.1 Sistema de Plugins (Lua Scripting)
**Origen:** AttractPlus (Squirrel plugins) + Pegasus (script hooks)
**UX:** La comunidad puede crear plugins (search, scoreboard, utility menu) que se cargan dinámicamente.
**Dependencias:** 1.3 (layout engine para renderizado de plugins UI)
**Riesgo:** Alto (seguridad del sandbox Lua)
**Archivos:** `src-tauri/src/core/plugin_engine.rs`, `data/plugins/`
**Estimación:** ~100h

**API Lua expuesta:**
```lua
-- Acceso a datos
neocab.games.current()          -> { title, year, developer, ... }
neocab.games.list(filter)       -> [{ title, ... }]
neocab.games.all()              -> [{ title, ... }]
neocab.systems.current()        -> { name, display_name }
neocab.systems.list()           -> [{ name, display_name }]

-- Input
neocab.input.on_key(key_name, callback)  -- "up", "down", "confirm", "cancel"
neocab.input.on_action(action, callback)

-- UI
neocab.ui.add_text(text, x, y, opts)    -- opcional, para plugins con UI
neocab.ui.add_image(path, x, y, opts)
neocab.ui.show_notification(text, type)  -- "info", "achievement", "warning"
neocab.ui.create_overlay(id)            -- overlay persistente

-- Audio
neocab.audio.play_sound(path)
neocab.audio.play_music(path)
neocab.audio.stop_music()

-- Config
neocab.config.get(key)                  -> value
neocab.config.set(key, value)

-- Network
neocab.network.http_get(url)            -> body
neocab.network.http_post(url, body)     -> body

-- Storage (persistente por plugin)
neocab.storage.get(key)                 -> value
neocab.storage.set(key, value)
neocab.storage.delete(key)
```

**Hooks disponibles:**
```
on_ready()                    → NeoCab iniciado
on_game_start(game)           → antes de lanzar juego
on_game_end(game, duration)   → después de cerrar juego
on_highlight_change(game)     → cambio de selección
on_idle(seconds)              → cada segundo de inactividad
on_coin_inserted(amount)      → moneda insertada
on_credit_added(count)        → crédito otorgado
on_session_start()            → sesión iniciada
on_session_end(stats)         → sesión terminada
```

**Plugins bundled:**
- **SearchPlus**: Búsqueda con teclado virtual en pantalla (AttractPlus)
- **ScorePlus**: Leaderboard local con persistencia
- **UtilityMenu**: Menú de utilidades (reset, shutdown, reboot)

**Seguridad:**
- Sandbox Lua: `rlua` con `set_userdata` limitado
- No acceso a filesystem fuera de `data/plugins/`
- Timeout de ejecución: 5s por callback
- Memoria limitada: 64MB heap
- API de red solo HTTP (no sockets raw)

### 3.2 Event-driven Animation System
**Origen:** RetroFE (onEnter/onExit/onHighlightEnter con tweens)
**UX:** Animaciones fluidas y responsivas que reaccionan a cada acción del usuario.
**Dependencias:** 1.3 (layout engine)
**Riesgo:** Medio
**Archivos:** `src/components/layout/AnimationController.tsx`
**Estimación:** ~60h

**Modelo de eventos vs timeline:**

```
RetroFE (event-driven):              Timeline (tradicional):
                                     ┌─────────────────────────┐
┌──────────┐                         │                         │
│ onEnter  │──→ alpha 1.0 (300ms)    │  alpha 0→1 (0-300ms)   │
│          │──→ x 0→center (400ms)   │  x left→center (0-400) │
├──────────┤                         │  esperar (400-1000ms)   │
│ onIdle   │──→ rotation 360 (2s)    │  rotation 360 (1-3s)    │
├──────────┤                         │  esperar (3-4s)         │
│ onExit   │──→ alpha 1→0 (200ms)    │  alpha 1→0 (4-4.2s)    │
└──────────┘                         └─────────────────────────┘
```

**AnimationController:**
```typescript
interface AnimationEvent {
  trigger: 'onEnter' | 'onExit' | 'onHighlightEnter' | 'onHighlightExit'
         | 'onIdle' | 'onMenuScroll' | 'onGameEnter' | 'onGameExit';
  tweens: TweenDef[];
}

interface TweenDef {
  property: 'x' | 'y' | 'alpha' | 'scale' | 'rotation' | 'width' | 'height';
  from?: number;
  to: number;
  duration: number;
  delay?: number;
  easing: EasingFunction;
}

function useAnimation(element: HTMLElement, events: AnimationEvent[], deps: any[]) {
  useEffect(() => {
    const controller = new AnimationController(element);
    events.forEach(event => {
      controller.on(event.trigger, () => {
        event.tweens.forEach(tween => {
          controller.animate(tween);
        });
      });
    });
    return () => controller.destroy();
  }, deps);
}
```

**21 easing functions implementadas en `src/utils/easing.ts`:**
```typescript
export const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + --t * t * t * t * t,
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) => !t ? 0 : t === 1 ? 1 : t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  easeOutBack: (t: number) => { const c = 1.70158; return --t * t * ((c + 1) * t + c) + 1; },
  easeInOutBack: (t: number) => { const c = 1.70158 * 1.525; return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; },
};
```

### 3.3 Video Pipeline con Degradación Automática
**Origen:** AdvanceMAME (pipeline de blit + combine degradation)
**UX:** NeoCab se adapta al hardware: en PCs potentes usa XBR, en débiles baja automáticamente a bilinear.
**Dependencias:** Ninguna
**Riesgo:** Medio
**Archivos:** `src-tauri/src/core/video_pipeline.rs`
**Estimación:** ~40h

**Pipeline stages:**
```
Raw frame
  → Scale (nearest → bilinear → bicubic → lanczos)
  → Color (RGB565 → RGB888 → RGBA)
  → Effect (scanlines → rgb_triad → crt_geom)
  → Post (glow → bloom → sharpen)
  → Output (framebuffer → GPU texture)
```

**Auto-degradación:**
```rust
pub enum QualityLevel {
    Ultra,    // lanczos + crt_geom + bloom
    High,     // bicubic + scanlines + glow
    Medium,   // bilinear + scanlines
    Low,      // bilinear
    Potato,   // nearest neighbor
}

impl VideoPipeline {
    pub async fn benchmark(&self) -> QualityLevel {
        // Reproducir video de prueba de 5s
        // Medir FPS promedio con cada nivel
        // Elegir el nivel más alto que mantenga 60 FPS
    }

    pub fn monitor_fps(&self, current_fps: f64) -> Option<QualityLevel> {
        if current_fps < 30.0 { Some(QualityLevel::degrade(self.current)) }
        else if current_fps > 55.0 { Some(QualityLevel::upgrade(self.current)) }
        else { None }
    }
}
```

**Config:**
```yaml
video:
  pipeline: auto                # auto | ultra | high | medium | low | potato
  benchmark_on_startup: true    # re-benchmark each startup
  fps_target: 60                # target FPS for auto mode
  effects:
    scanlines: true
    crt_curve: 0.05
    glow: 0.2
    bloom: false
```

### 3.4 Sistema de Script Hooks (OS-level)
**Origen:** Pegasus Frontend (script runner) + AdvanceMAME (hardware scripting)
**UX:** El usuario puede ejecutar scripts en eventos del sistema: encender luces al lanzar un juego, apagar monitor al salir, etc.
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/core/script_hooks.rs`
**Estimación:** ~35h

**Eventos disponibles:**
```rust
pub enum ScriptEvent {
    Quit,               // NeoCab se cierra
    Reboot,             // Se solicita reboot del sistema
    Shutdown,           // Se solicita shutdown
    GameLaunchStart,    // Justo antes de lanzar juego
    GameLaunchEnd,      // Justo después de cerrar juego
    ConfigChanged,      // Alguna config cambió
    DisplayOn,          // Monitor se enciende
    DisplayOff,         // Monitor se apaga
    CoinInserted,       // Moneda insertada
    IdleTimeout,        // Tiempo de inactividad excedido
    Error,              // Error crítico
}
```

**Config:**
```yaml
# settings.yaml
scripts:
  on_game_launch_start: "C:\\scripts\\turn_on_marquee.bat"
  on_game_launch_end: "C:\\scripts\\turn_off_marquee.bat"
  on_coin_inserted: "C:\\scripts\\coin_counter.exe add"
  on_startup: "C:\\scripts\\boot_leds.exe on"
  on_shutdown: "C:\\scripts\\boot_leds.exe off"
```

**Variables de entorno expuestas:**
```
NEOCAB_GAME_TITLE="Pac-Man"
NEOCAB_GAME_PATH="D:\roms\pacman.zip"
NEOCAB_SYSTEM="arcade"
NEOCAB_EMULATOR="mame"
NEOCAB_EVENT="game_launch_start"
NEOCAB_PIN="0000"  # solo en eventos coin_inserted
```

**Runner:**
```rust
pub fn run_script(event: ScriptEvent, game: Option<&Game>) -> Result<()> {
    let config = ConfigManager::get_script(event)?;
    if config.trim().is_empty() { return Ok(()); }

    let mut cmd = if cfg!(windows) {
        Command::new("cmd").arg("/c").arg(&config)
    } else {
        Command::new("bash").arg("-c").arg(&config)
    };

    if let Some(game) = game {
        cmd.env("NEOCAB_GAME_TITLE", &game.title)
           .env("NEOCAB_GAME_PATH", &game.rom_path);
    }

    let output = cmd.output()?;
    if !output.status.success() {
        warn!("Script failed (event={:?}): {}", event, String::from_utf8_lossy(&output.stderr));
    }
    Ok(())
}
```

### 3.5 Multi-monitor Nativo
**Origen:** RetroFE (layout por monitor, rotación, mirror)
**UX:** Gabinetes con 2-3 monitores (juego + marquee + scoreboard) con layouts independientes.
**Dependencias:** 1.3 (layout engine)
**Riesgo:** Alto
**Archivos:** `src-tauri/src/core/display_manager.rs`, Tauri multi-window
**Estimación:** ~80h

**Config:**
```yaml
displays:
  - id: main
    monitor: 0
    resolution: "1920x1080"
    layout: "arcade-classic"
    rotation: 0
    mirror: false
  - id: marquee
    monitor: 1
    resolution: "1920x480"
    layout: "marquee-default"
    rotation: 0
    mirror: false
  - id: scoreboard
    monitor: 2
    resolution: "1920x1080"
    layout: "scoreboard-dark"
    rotation: 90
    mirror: false
```

**Tauri multi-window:**
```rust
// Cada monitor es una ventana Tauri separada
let marquee_window = tauri::WebviewWindowBuilder::new(
    app,
    "marquee",
    tauri::WebviewUrl::App("marquee.html".into()),
)
.title("NeoCab Marquee")
.position(1920, 0)  // segundo monitor
.inner_size(1920.0, 480.0)
.decorations(false)
.fullscreen(true)
.build()?;

// Comunicación vía eventos
app.emit("update_marquee", MarqueePayload {
    title: game.title,
    marquee_path: game.marquee_path,
}).ok();
```

**Modo mirror (cocktail cabinets):**
```rust
// Layout mirror: renderizar toda la UI reflejada verticalmente
// Útil para mesas cocktail donde 2 jugadores se sientan frente a frente
if config.mirror {
    // CSS: transform: scaleY(-1) en el contenedor raíz
    // Input: invertir up/down para el jugador 2
}
```

**Rotación por monitor:**
- 0°, 90°, 180°, 270° (para pantallas montadas verticalmente)

### 3.6 SafeQuit System (AdvanceMAME)
**Origen:** AdvanceMAME (memory address monitoring)
**UX:** NeoCab detecta automáticamente cuando un juego entra en modo demo o sin créditos y vuelve al menú.
**Dependencias:** Ninguna
**Riesgo:** Alto (monitoreo de memoria específico de cada emulador)
**Archivos:** `src-tauri/src/utils/safe_quit.rs`
**Estimación:** ~40h

**Implementación genérica:**
```rust
pub struct SafeQuitRule {
    pub emulator: String,
    pub game_pattern: Option<String>,    // regex para filtrar juegos
    pub monitor_type: MonitorType,       // Memory | Process | Timeout
    pub condition: Condition,            // Equals | Changed | NoChange
    pub address: Option<u64>,            // dirección de memoria a monitorear
    pub expected_value: Option<Vec<u8>>, // valor esperado para "demo mode"
    pub timeout_seconds: Option<u64>,    // tiempo de inactividad
    pub action: SafeQuitAction,          // ExitToMenu | ShowAttract | Shutdown
}

pub enum SafeQuitAction {
    ExitToMenu,      // Volver al selector de juegos
    ShowAttract,     // Mostrar attract mode
    Shutdown,        // Apagar el sistema
    RunScript(String), // Ejecutar script personalizado
}
```

**Casos de uso:**
- MAME: monitorear `0x00` en dirección de "credit" → sin créditos → volver al menú
- RetroArch: detectar proceso inactivo por X segundos → attract mode
- Juegos sin crédito: después de 5min de demo → mostrar mensaje "Insert Coin"

**Config:**
```yaml
safe_quit:
  enabled: true
  rules:
    - emulator: "mame"
      monitor_type: timeout
      timeout_seconds: 120
      action: ShowAttract
    - emulator: "retroarch"
      monitor_type: process
      condition: no_change
      timeout_seconds: 300
      action: ExitToMenu
```

### 3.7 Sistema de Tags por Juego (AttractPlus)
**Origen:** AttractPlus (sistema de tags)
**UX:** El usuario puede etiquetar juegos con tags personalizados y filtrar por ellos.
**Dependencias:** 1.1 (filtros en store)
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/db/migrations/003_tags.sql`
**Estimación:** ~15h

**Tabla tags:**
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#888888',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE game_tags (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, tag_id)
);
```

**Comandos Tauri:**
- `list_tags` → `[{ id, name, color, game_count }]`
- `create_tag { name, color }`
- `delete_tag { tag_id }`
- `add_game_tag { game_id, tag_id }`
- `remove_game_tag { game_id, tag_id }`
- `get_game_tags { game_id }` → `[{ id, name, color }]`

**UI:**
- Modal de tags en GameList (botón "Tag")
- Tag input con autocomplete
- Tags como badges de colores en preview
- Filtro por tag en filter bar

### 3.8 Screen Rotation Nativa (AttractPlus)
**Origen:** AttractPlus (screen rotation)
**UX:** Soporte para monitores montados verticalmente (tate mode) en shmups y juegos verticales.
**Dependencias:** 3.5 (multi-monitor comparte config de rotación)
**Riesgo:** Bajo
**Archivos:** `src-tauri/src/core/display_manager.rs` (extender)
**Estimación:** ~10h

**Config:**
```yaml
display:
  rotation: auto    # auto = sigue orientación del juego
                    # 0 | 90 | 180 | 270 = fijo
```

**Por juego:** Config override en cada juego para rotación específica.

### 3.9 Jukebox Mode (RetroFE)
**Origen:** RetroFE (reloadableAudio con jukebox flag)
**UX:** Reproductor de música integrado que se reproduce en background durante la navegación.
**Dependencias:** 1.3 (layout component reloadableAudio)
**Riesgo:** Bajo
**Archivos:** `src/core/jukebox.rs`, `src/hooks/useJukebox.ts`
**Estimación:** ~20h

**Config:**
- Directorio de música: `media/music/`
- Formatos: mp3, ogg, flac, wav
- Modo: random, sequential, playlist
- Controles: next, prev, pause, volume

**UI:**
- Botón de jukebox en esquina inferior
- Overlay con: portada, título, artista, progress bar
- Comandos de gamepad: L2/R2 para skip

---

## FASE 4 — INFRAESTRUCTURA Y CALIDAD

### 4.1 Testing Frontend
**Origen:** Mejora calidad
**Dependencias:** 1.1 (stores testeables sin mount)
**Riesgo:** Bajo
**Estimación:** ~50h

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom msw
```

**Tests por tipo:**

| Tipo | Archivo | Lo que testea |
|------|---------|---------------|
| Unit | `stores/__tests__/useGameStore.test.ts` | Lógica de filtros, sort, paginación |
| Unit | `utils/__tests__/easing.test.ts` | 21 funciones de easing (valores conocidos) |
| Unit | `utils/__tests__/tokens.test.ts` | Parser de magic tokens |
| Component | `components/__tests__/GameList.test.tsx` | Renderizado, filtros, virtual scroll |
| Component | `components/__tests__/SystemSelect.test.tsx` | Carousel, selección, scroll |
| Component | `components/__tests__/PinPad.test.tsx` | Input numérico, validación |
| Hook | `hooks/__tests__/useUnifiedInput.test.ts` | Mapeo de acciones |
| Integration | `pages/__tests__/GamesPage.test.tsx` | Flujo: select game → launch |

**Coverage target:**
- Statements: 60%
- Branches: 50%
- Functions: 60%
- Lines: 60%

### 4.2 WebSocket para Tiempo Real
**Origen:** Deuda técnica
**Qué:** InputManager usa polling cada 16ms → CPU innecesaria.
**Dependencias:** Ninguna
**Riesgo:** Medio
**Estimación:** ~30h

**Arquitectura:**
```
Antes:
  useUnifiedInputHook → setInterval(16ms) → invoke("get_input_state")

Después:
  Rust InputManager → emit("input_state_changed", state) → hook escucha evento
  Solo emite cuando hay cambio real (delta > threshold)
```

**Beneficio:** CPU idle pasa de ~5-8% a ~0.5-1% en sistemas sin gamepad conectado.

**Implementación:**
```rust
// input_manager.rs
pub fn poll_and_emit(&self, app_handle: &AppHandle) {
    let current_state = self.read_all_devices();

    // Solo emitir si hay cambio significativo
    if self.has_significant_change(&current_state) {
        app_handle.emit("input_state_changed", current_state).ok();
        self.last_state = current_state;
    }
}
```

### 4.3 Logging con Rotación y Limpieza
**Origen:** Deuda técnica
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Estimación:** ~10h

**Config:**
```rust
use tracing_appender::rolling::{RollingFileAppender, Rotation};

let file_appender = RollingFileAppender::builder()
    .rotation(Rotation::DAILY)
    .filename_prefix("neocab")
    .filename_suffix("log")
    .max_log_files(30)     // mantener 30 días
    .build("logs/")?;

let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

tracing_subscriber::fmt()
    .with_writer(non_blocking)
    .with_env_filter("neocab=info,tauri=warn")
    .init();
```

**Nuevo: Compresión de logs viejos:**
- Logs con más de 7 días se comprimen a .gz
- Logs con más de 30 días se eliminan

**UI en Operator Panel:**
- Ver logs en tiempo real (tail -f)
- Exportar logs actuales
- Clear logs

### 4.4 CI/CD
**Origen:** Mejora calidad
**Dependencias:** Todo lo demás debe estar testeable
**Riesgo:** Bajo
**Estimación:** ~20h

**GitHub Actions workflow:**
```yaml
name: NeoCab CI/CD
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run build          # TypeScript check + Vite build
      - run: cargo clippy -- -D warnings
      - run: cargo test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx vitest --coverage

  build-windows:
    needs: [quality, test-frontend]
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: neocab-windows-x64
          path: src-tauri/target/release/neocab.msi

  build-linux:
    needs: [quality, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: neocab-linux-x86_64
          path: src-tauri/target/release/neocab.AppImage

  release:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: [build-windows, build-linux]
    runs-on: ubuntu-latest
    steps:
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            neocab-windows-x64/neocab.msi
            neocab-linux-x86_64/neocab.AppImage
          generate_release_notes: true
```

### 4.5 Refactor de Input: Gamepad Event-driven + SDL2 GameDB
**Origen:** Pegasus (SDL2 gamecontrollerdb.txt) + Deuda técnica
**Dependencias:** Ninguna
**Riesgo:** Medio
**Estimación:** ~40h

**Mejoras:**
1. Incluir `gamecontrollerdb.txt` de SDL2 (base de datos de 3000+ controladores)
2. Auto-configuración de gamepad detectado
3. Mover a event-driven en vez de polling (ver 4.2)
4. Hot-plug detection (cuando se conecta/desconecta un gamepad durante uso)

### 4.6 Startup Validation + Portable Mode
**Origen:** SimpleLauncher (startup validation) + Pegasus (portable.txt)
**Dependencias:** Ninguna
**Riesgo:** Bajo
**Estimación:** ~15h

**Validaciones al iniciar:**
- ¿Se ejecuta desde directorio temporal? → warning
- ¿Los paths de ROMs existen? → warning con opción de configurar
- ¿Emuladores configurados? → auto-detectar o mostrar wizard
- ¿Hay al menos un sistema con juegos? → warning

**Portable mode:**
- Si existe `portable.txt` junto al ejecutable, usar directorio local
- Si no, usar `%APPDATA%/NeoCab` (Windows) o `~/.local/share/neocab` (Linux)

---

## MATRIZ DE DEPENDENCIAS

```
Feature                      Depende de              Es requerido por
─────────────────────────────────────────────────────────────────────
0.1 Auto-Updater             —                       —
0.2 Config Injection         2.1 Autodetección        —
0.3 Fuzzy Matching           —                       0.4 Scraping
0.4 Scraping Batch           0.3 Fuzzy Matching       —
0.5 Multi-language           —                       —

1.1 Zustand Stores           —                       1.2, 1.3, 1.5
1.2 React Router             1.1 Zustand             —
1.3 Layout Engine            1.1 Zustand             —1.4, 3.5, 3.9
1.4 Live Reload              1.3 Layout Engine       —
1.5 Magic Tokens             1.3 Layout Engine       3.1 Plugins

2.1 Emulator Autodetect      —                       0.2, 2.2
2.2 Launch Pipeline          2.1 Autodetect           —
2.3 Mount Archivos           2.2 Launch Pipeline     —
2.4 Kiosk Mode               —                       —
2.5 RetroAchievements        —                       —
2.6 DB Migrations            —                       —

3.1 Plugins Lua              1.5 Magic Tokens        —
3.2 Animation Events         1.3 Layout Engine       —
3.3 Video Pipeline           —                       —
3.4 Script Hooks             —                       —
3.5 Multi-monitor            1.3 Layout Engine       —
3.6 SafeQuit                 —                       —
3.7 Tags                     —                       —
3.8 Screen Rotation          3.5 Multi-monitor       —
3.9 Jukebox                  1.3 Layout Engine       —

4.1 Testing                  1.1 Zustand             —
4.2 WebSocket Input          —                       —
4.3 Logging                  —                       —
4.4 CI/CD                    —                       —
4.5 Gamepad Refactor         4.2 WebSocket           —
4.6 Startup Validation       —                       —
```

---

## MATRIZ DE RIESGOS

| Feature | Riesgo | Mitigación |
|---------|--------|------------|
| 0.2 Config Injection | Medio | Formato de config varía entre versiones de emulador. Testear contra versiones conocidas. |
| 0.4 Scraping Batch | Medio | APIs externas pueden cambiar. Diseñar con adapter pattern para swap de fuentes. |
| 1.3 Layout Engine | Alto | Cambio arquitectural mayor. Hacerlo como sistema paralelo, con flag de feature toggle. |
| 2.2 Launch Pipeline | Medio | Edge cases: rutas con espacios, permisos, procesos bloqueados. Logging extensivo. |
| 2.3 Mount Archivos | Alto | Depende de herramientas externas (chdman, Dokan). Fallback a extracción siempre disponible. |
| 2.5 RetroAchievements | Medio | API externa, puede cambiar sin aviso. Cache agresivo + modo offline. |
| 3.1 Plugins Lua | Alto | Seguridad del sandbox. No exponer filesystem ni sockets raw. Timeout 5s. |
| 3.3 Video Pipeline | Medio | Calidad de benchmark puede variar. Override manual siempre disponible. |
| 3.5 Multi-monitor | Alto | Tauri multi-window tiene limitaciones en algunas plataformas. Investigar before implementar. |
| 3.6 SafeQuit | Alto | Direcciones de memoria varían por versión de emulador. Hacerlo configurable por el usuario. |
| 4.2 WebSocket | Medio | Eventos Tauri tienen overhead. Medir antes/después para confirmar mejora. |

---

## LÍNEA DE TIEMPO DETALLADA

```
Semana 1-2   [80h]
  ├── 0.1 Auto-Updater              (60h)
  └── 0.5 Multi-language            (20h)

Semana 3-4   [80h]
  ├── 0.3 Fuzzy Matching            (25h)
  ├── 0.4 Scraping Batch            (40h)
  └── 4.6 Startup Validation        (15h)

Semana 5-6   [80h]
  ├── 1.1 Zustand Stores            (50h)
  └── 1.2 React Router              (30h)

Semana 7-8   [80h]
  ├── 2.1 Emulator Autodetect       (60h)
  └── 0.2 Config Injection          (20h / comenzar)

Semana 9-10  [80h]
  ├── 0.2 Config Injection          (80h / completar)
  └── 2.4 Kiosk Mode                (incluido arriba)

Semana 11-12 [80h]
  ├── 2.2 Launch Pipeline           (50h)
  └── 2.3 Mount Archivos            (30h)

Semana 13-14 [80h]
  ├── 2.5 RetroAchievements         (60h)
  ├── 2.6 DB Migrations             (20h)
  └── 4.3 Logging                   (incluido)

Semana 15-17 [120h]
  ├── 1.3 Layout Engine             (120h / primero prototipo, luego feature completo)

Semana 18    [40h]
  ├── 1.4 Live Theme Reload         (15h)
  ├── 1.5 Magic Tokens              (25h)

Semana 19-20 [80h]
  ├── 3.2 Animation Events          (60h)
  └── 3.7 Tags                      (15h)
  └── 3.8 Screen Rotation           (5h)

Semana 21-22 [80h]
  ├── 3.1 Plugins Lua               (80h / core + SearchPlus plugin)

Semana 23    [40h]
  ├── 3.4 Script Hooks              (35h)
  └── 3.9 Jukebox                   (5h)

Semana 24-25 [80h]
  ├── 3.3 Video Pipeline            (40h)
  └── 3.6 SafeQuit                  (40h)

Semana 26-27 [80h]
  ├── 3.5 Multi-monitor             (80h)

Semana 28-29 [80h]
  ├── 4.1 Testing Frontend          (50h)
  ├── 4.2 WebSocket Input           (30h)

Semana 30    [40h]
  ├── 4.4 CI/CD                     (20h)
  ├── 4.5 Gamepad Refactor          (20h)
  └── Release v2.0

Total: ~1100 horas (~30 semanas)
```

---

## MATRIZ ORIGEN vs FEATURE

| Feature | AdvanceMAME | AttractPlus | Pegasus | RetroFE | SimpleLauncher |
|---------|-------------|-------------|---------|---------|----------------|
| 0.1 Auto-Updater | - | - | - | - | ✅ |
| 0.2 Config Injection | - | - | - | - | ✅ 21 emus |
| 0.3 Fuzzy Matching | - | - | - | - | ✅ Jaro-Winkler |
| 0.4 Scraping Batch | - | ✅ | ✅ multi-provider | - | ✅ |
| 0.5 Multi-language | - | ✅ `_()` | ✅ Qt i18n | - | ✅ 17 idiomas |
| 1.1 Zustand Stores | - | - | - | - | - |
| 1.2 React Router | - | - | - | - | - |
| 1.3 Layout Engine | - | ✅ Squirrel | ✅ QML | ✅ XML+tweens | - |
| 1.4 Live Reload | - | - | ✅ F5 | - | - |
| 1.5 Magic Tokens | - | ✅ `[Title]` | - | ✅ reloadableText | - |
| 2.1 Emulator Autodetect | - | ✅ auto-detect | - | - | ✅ |
| 2.2 Launch Pipeline | - | - | - | - | ✅ Strategy |
| 2.3 Mount Archivos | - | - | - | - | ✅ CHD/ZIP/XISO |
| 2.4 Kiosk Mode | - | - | ✅ `--kiosk` | - | - |
| 2.5 RetroAchievements | - | - | - | - | ✅ |
| 2.6 DB Migrations | - | - | - | - | - |
| 3.1 Plugins/Scripts | ✅ HW scripting | ✅ Squirrel | ✅ Hooks | - | - |
| 3.2 Animation Events | - | - | - | ✅ tweens | - |
| 3.3 Video Pipeline | ✅ blit pipeline | - | - | - | - |
| 3.4 Script Hooks | ✅ HW events | - | ✅ QUIT/REBOOT | - | - |
| 3.5 Multi-monitor | - | - | - | ✅ layout/display | - |
| 3.6 SafeQuit | ✅ mem monitor | - | - | - | - |
| 3.7 Tags | - | ✅ tags | - | - | - |
| 3.8 Screen Rotation | - | ✅ rotation | - | ✅ rotation | - |
| 3.9 Jukebox | - | - | - | ✅ reloadableAudio | - |
| 4.1 Testing | - | - | - | - | ✅ |
| 4.2 WebSocket | - | - | - | - | - |
| 4.3 Logging | - | - | - | - | - |
| 4.4 CI/CD | - | ✅ GH Actions | ✅ GH Actions | - | ✅ GH Actions |
| 4.5 Gamepad Refactor | - | - | ✅ SDL2 GameDB | - | ✅ |
| 4.6 Startup Validation | - | - | - | - | ✅ |

---

## MÉTRICAS DE ÉXITO v2.0

| Área | Métrica | v1.3.0 | v2.0 Target |
|------|---------|--------|-------------|
| **Instalación** | Tiempo de setup inicial | ~30min manual | <5min wizard |
| **Emuladores** | Con detección automática | 0 | Todos los instalados |
| **Emuladores** | Con config injection | 0 | 21 |
| **Layouts** | Motor de layouts | JSON plano | YAML con animaciones |
| **Themes** | Live reload | ❌ | ✅ F5 |
| **Idiomas** | Número de idiomas | 2 | 5 |
| **Claves i18n** | Cobertura de traducción | ~40 | 200+ |
| **Plugins** | Sistema de plugins | ❌ | Lua API completa |
| **Monitores** | Multi-monitor nativo | 2 (marquee) | N (independientes) |
| **Achievements** | RetroAchievements | schema DB | login + display + inyección |
| **Testing** | Frontend coverage | 0% | 60% |
| **Input** | CPU idle con gamepad | ~5-8% | ~0.5-1% |
| **Actualización** | Auto-updater | ❌ | ✅ |
| **Estabilidad** | DB schema versionado | ❌ | ✅ migraciones |
| **Seguridad** | PIN de operador | hardcoded "1234" | bcrypt + lockout |

---

*Este plan reemplaza y expande las secciones de mejora de PLAN_MEJORA_COMPLETA.md. El foco es v2.0 basado en el análisis comparativo de 6 frontends.*

*Próximo paso: Elegir fase de inicio y comenzar implementación secuencial.*
