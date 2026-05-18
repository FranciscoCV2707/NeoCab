# NeoCab v2.0 - Plan Maestro de Implementación

**Versión**: 1.0
**Fecha**: 2026-05-16
**Autor**: Francisco Caballero (NeoCab)
**Repositorio**: https://github.com/FranciscoCV2707/NeoCab

---

## Resumen Ejecutivo

Este documento define el plan de implementación para 15 mejoras arquitecturales en NeoCab v1.3.0, transformando el proyecto en una plataforma arcade más robusta, extensible y mantenible.

| Fase | Mejora | Prioridad | Esfuerzo | Impacto |
|------|--------|-----------|-----------|---------|
| 1 | Type-Safe Commands | 🔴 ALTA | Medio | Alto |
| 2 | Toast/Notification System | 🔴 ALTA | Bajo | Alto |
| 3 | i18n Expandido | 🔴 ALTA | Bajo | Medio |
| 4 | Scraper/Provider System | 🔴 ALTA | Alto | Alto |
| 5 | Launch Strategies | 🟡 MEDIA-ALTA | Alto | Alto |
| 6 | AsyncHandle Pattern | 🟡 MEDIA | Medio | Medio |
| 7 | Cascading Config | 🟡 MEDIA | Medio | Medio |
| 8 | Migration System | 🟡 MEDIA | Medio | Alto |
| 9 | Composable Stores | 🟡 MEDIA | Medio | Medio |
| 10 | Resource Pool/Reload | 🟢 BAJA | Alto | Medio |
| 11 | Testing Integration | 🟡 MEDIA-ALTA | Alto | Alto |
| 12 | Scripting/Plugins | 🟢 BAJA | Muy Alto | Alto |

**Decisiones de implementación**:
- Orden: Alta prioridad primero
- Testing: Tests de integración
- Breaking Changes: Sí, optimizar arquitectura
- Scrapers: Prioridad alta
- Scripting: Lo que mejor parezca (Lua embedding)

---

## FASE 1: Type-Safe Commands

### Objetivo
Transformar los 189 comandos Tauri de `Result<String, String>` (JSON strings) a tipos Rust tipados que se serializan directamente, con generación automática de tipos TypeScript.

### Estructura de tipos de respuesta

**Nuevo archivo**: `src-tauri/src/commands/types.rs`

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============= SESSION TYPES =============
#[derive(Debug, Serialize, Deserialize)]
pub struct SessionStatusResponse {
    pub state: String,
    pub mode: String,
    pub credits: f64,
    pub remaining_seconds: i64,
    pub total_seconds: i64,
    pub elapsed_seconds: i64,
    pub pause_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoinBalanceResponse {
    pub total_balance: i64,
    pub coins_inserted: i64,
    pub coins_used: i64,
    pub game_cost: i64,
    pub coins_needed: i64,
    pub is_game_running: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimerStatusResponse {
    pub state: String,
    pub elapsed_seconds: i64,
    pub remaining_seconds: i64,
    pub total_seconds: i64,
    pub percentage: f64,
    pub is_overtime: bool,
}

// ============= INPUT TYPES =============
#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: u32,
    pub name: String,
    pub guid: String,
    pub device_type: String,
    pub is_connected: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InputStateResponse {
    pub device_id: u32,
    pub buttons: HashMap<u8, bool>,
    pub axes: HashMap<u8, f32>,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JoyProfileInfo {
    pub name: String,
    pub deadzone: DeadzoneConfig,
    pub active_set: String,
}

// ============= GAME TYPES =============
#[derive(Debug, Serialize, Deserialize)]
pub struct GameListResponse {
    pub games: Vec<GameInfo>,
    pub total: usize,
    pub page: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameInfo {
    pub id: i64,
    pub title: String,
    pub system_id: i64,
    pub system_name: String,
    pub is_favorite: bool,
    pub play_count: i64,
    pub last_played: Option<String>,
    pub rating: f64,
    pub media: GameMedia,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameMedia {
    pub image_path: Option<String>,
    pub marquee_path: Option<String>,
    pub video_path: Option<String>,
    pub wheel_path: Option<String>,
}

// ============= THEME TYPES =============
#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeListResponse {
    pub themes: Vec<ThemeInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThemeInfo {
    pub name: String,
    pub author: String,
    pub version: String,
    pub description: String,
    pub preview_path: Option<String>,
}
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src-tauri/src/commands/sessions.rs` | 12 commands → tipos tipados |
| `src-tauri/src/commands/coin.rs` | 6 commands → tipos tipados |
| `src-tauri/src/commands/timer.rs` | 7 commands → tipos tipados |
| `src-tauri/src/commands/input.rs` | 18 commands → tipos tipados |
| `src-tauri/src/commands/games.rs` | 12 commands → tipos tipados |
| `src-tauri/src/commands/theme.rs` | 17 commands → tipos tipados |
| `src-tauri/src/commands/network.rs` | 10 commands → tipos tipados |
| `src-tauri/src/commands/*.rs` | **TODOS** los demás módulos |
| `src/types/commands.ts` | NUEVO - tipos TypeScript |
| `src/hooks/useUnifiedInputHook.ts` | Actualizar llamadas |

### Comandos de verificación

```bash
cd src-tauri && cargo build 2>&1 | head -50
npm run build 2>&1 | head -50
```

---

## FASE 2: Toast/Notification System

### Objetivo
Implementar un sistema de notificaciones toast similar a EmuHub/Heroic para reemplazar alerts y proporcionar feedback visual al usuario.

### Tipos de notificación

**Nuevo archivo**: `src/stores/useNotificationStore.ts`

```typescript
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  actions?: ToastAction[];
  createdAt: number;
}

interface NotificationState {
  toasts: Toast[];
}

interface NotificationActions {
  addToast(toast: Omit<Toast, 'id' | 'createdAt'>): string;
  removeToast(id: string): void;
  showSuccess(title: string, message: string): void;
  showError(title: string, message: string): void;
}
```

### Componente Toast

**Nuevo archivo**: `src/components/Toast.tsx`

```tsx
export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
```

### CSS del Toast

**Nuevo archivo**: `src/components/Toast.css`

```css
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.toast {
  background: var(--surface, #1a1a2e);
  border: 1px solid var(--border, #333);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: slideIn 0.3s ease-out;
}

.toast-success .toast-icon { color: #4ade80; }
.toast-error .toast-icon { color: #f87171; }
.toast-warning .toast-icon { color: #fbbf24; }
.toast-info .toast-icon { color: #60a5fa; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/stores/useNotificationStore.ts` | NUEVO |
| `src/components/Toast.tsx` | NUEVO |
| `src/components/Toast.css` | NUEVO |
| `src/App.tsx` | Añadir ToastContainer |
| `src/hooks/*.ts` | Integrar notifications |

---

## FASE 3: i18n Expandido

### Objetivo
Ampliar el sistema de internacionalización de 5 a ~15 idiomas como SimpleLauncher.

### Idiomas a agregar

| Código | Idioma | Prioridad |
|--------|--------|-----------|
| ja | Japonés | Alta |
| zh-CN | Chino Simplificado | Alta |
| zh-TW | Chino Tradicional | Media |
| ko | Coreano | Alta |
| ru | Ruso | Media |
| it | Italiano | Media |
| nl | Holandés | Baja |
| pl | Polaco | Baja |

### Estructura de archivos

```
src/i18n/
├── index.ts
├── en.json (base - 312 keys)
├── es.json
├── fr.json
├── de.json
├── pt-br.json
├── ja.json     # NUEVO
├── zh-CN.json   # NUEVO
├── zh-TW.json   # NUEVO
├── ko.json      # NUEVO
├── ru.json      # NUEVO
├── it.json      # NUEVO
├── nl.json      # NUEVO
└── pl.json      # NUEVO
```

---

## FASE 4: Scraper/Provider System

### Objetivo
Crear un sistema de scrapers extensible similar a Pegasus/Skyscraper/RomM.

### Trait ScraperProvider

**Nuevo archivo**: `src-tauri/src/scrapers/mod.rs`

```rust
pub mod traits;
pub mod screen_scraper;
pub mod thegamesdb;
pub mod igdb;
pub mod mobygames;

pub use traits::{ScraperProvider, ScraperResult, GameMetadata};
```

### Trait definición

```rust
#[async_trait]
pub trait ScraperProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn priority(&self) -> u32 { 100 }
    async fn search(&self, query: &str, system: Option<&str>)
        -> Result<Vec<ScraperResult>, Box<dyn Error + Send + Sync>>;
    async fn get_metadata(&self, game_id: &str)
        -> Result<GameMetadata, Box<dyn Error + Send + Sync>>;
    async fn download_media(&self, url: &str, dest_path: &Path)
        -> Result<(), Box<dyn Error + Send + Sync>>;
}
```

### Providers a implementar

1. **ScreenScraperProvider** (prioridad 10) - Más completo, requiere credenciales
2. **TheGamesDBProvider** (prioridad 20) - Alternativa, no requiere auth
3. **IGDBProvider** (prioridad 30) - Datos de videojuegos
4. **MobyGamesProvider** (prioridad 40) - Datos adicionales

### Comandos Tauri

```rust
#[tauri::command]
pub async fn scraper_search(
    query: String,
    system: Option<String>,
    scraper_state: State<'_, ScraperState>,
) -> Result<ScraperSearchResponse, String>;

#[tauri::command]
pub async fn scraper_get_metadata(
    game_id: String,
    provider: Option<String>,
    scraper_state: State<'_, ScraperState>,
) -> Result<GameMetadata, String>;

#[tauri::command]
pub async fn scraper_batch_scrape(
    game_ids: Vec<String>,
    provider: Option<String>,
    app: AppHandle,
    scraper_state: State<'_, ScraperState>,
) -> Result<BatchScrapeResponse, String>;
```

---

## FASE 5: Launch Strategies

### Objetivo
Implementar el patrón Strategy para launching de juegos, permitiendo mount de archivos CHD/ZIP/XISO.

### Trait LaunchStrategy

```rust
#[async_trait]
pub trait LaunchStrategy: Send + Sync {
    fn name(&self) -> &str;
    fn priority(&self) -> u32 { 100 }
    async fn can_handle(&self, ctx: &LaunchContext) -> bool;
    async fn prepare(&self, ctx: &mut LaunchContext) -> Result<Option<MountInfo>, Error>;
    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult, Error>;
}
```

### Estrategias a implementar

1. **ChdMountStrategy** (prioridad 10) - Montaje de CHD
2. **ChdToCueStrategy** (prioridad 20) - Conversión CHD a CUE
3. **ZipExtractStrategy** (prioridad 30) - Extracción de ZIP
4. **DefaultRomStrategy** (prioridad 1000) - Lanzamiento directo

---

## FASE 6: AsyncHandle Pattern

### Objetivo
Implementar un sistema de handles asíncronos con progress tracking similar a ES-DE.

### Trait AsyncHandle

```rust
pub trait AsyncHandle: Send {
    fn id(&self) -> &str;
    fn status(&self) -> AsyncStatus;
    fn progress(&self) -> f64;
    fn update(&mut self);
    fn cancel(&mut self);
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AsyncStatus {
    Pending,
    InProgress { progress: f64, message: String },
    Completed,
    Failed { error: String },
    Cancelled,
}
```

---

## FASE 7: Cascading Config

### Objetivo
Sistema de configuración en cascada: `game > system > global`

### Estructura

```rust
pub struct ConfigResolver {
    global: GlobalConfig,
    systems: HashMap<String, SystemConfig>,
    games: HashMap<i64, GameConfig>,
}

impl ConfigResolver {
    pub fn resolve(&self, game_id: i64, system_name: &str) -> ResolvedConfig {
        // game > system > global
    }
}
```

---

## FASE 8: Migration System

### Objetivo
Sistema de migraciones de base de datos versionadas.

### Estructura

```rust
pub struct Migration {
    pub version: i32,
    pub name: &'static str,
    pub up: &'static str,
    pub down: &'static str,
}

pub const MIGRATIONS: &[Migration] = &[
    Migration { version: 1, name: "initial_schema", up: "...", down: "..." },
    Migration { version: 2, name: "add_tags", up: "...", down: "..." },
];
```

---

## FASE 9: Composable Stores

### Objetivo
Reorganizar los stores Zustand para mejor separación de concerns.

### Nuevos stores

1. `useSessionStore` - Estado de sesión (créditos, tiempo)
2. `useInputStore` - Dispositivos de entrada y perfiles
3. `useNotificationStore` - Sistema de notificaciones
4. Migrar `useUIStore`, `useGameStore`, `useSystemStore`, `useThemeStore`

---

## FASE 10: Resource Pool/Reload

### Objetivo
Sistema de cache de recursos (fonts, textures) con hot-reload.

### Estructura

```rust
pub struct ResourceManager {
    fonts: RwLock<HashMap<String, Font>>,
    textures: RwLock<HashMap<String, Texture>>,
}

pub trait Reloadable {
    fn unload(&mut self);
    fn reload(&mut self) -> Result<(), String>;
}
```

---

## FASE 11: Testing Integration

### Objetivo
Crear suite de tests de integración.

### Tests a implementar

1. **Tests de comandos**: Tests para cada módulo de commands
2. **Tests de integración**: Tests end-to-end del flujo completo
3. **Tests de UI**: Tests con Vitest + Testing Library

### Comandos de test

```bash
# Frontend
npm run test

# Backend
cd src-tauri && cargo test

# Coverage
npm run test:coverage
```

---

## FASE 12: Scripting/Plugins

### Objetivo
Implementar sistema de scripting para extensibilidad.

### Decisión
Se implementará **Lua scripting** por:
- Embedding sencillo (mlua-rs)
- Comunidad activa
- Sintaxis simple para usuarios

### Estructura

```rust
pub struct ScriptVM {
    lua: rlua::Lua,
}

impl ScriptVM {
    pub fn new() -> Self { ... }
    pub fn execute(&self, script: &str) -> Result<(), String> { ... }
    pub fn call_function(&self, name: &str, args: Vec<rlua::Value>) -> Result<rlua::Value, String> { ... }
}
```

### API expuesta a scripts

- `neocab.launch_game(game_id)`
- `neocab.insert_coin()`
- `neocab.set_theme(theme_name)`
- `neocab.log(message)`

---

## Orden de Implementación

1. **FASE 2**: Toast/Notification System (bajo esfuerzo, alto impacto, establece patrón)
2. **FASE 3**: i18n Expandido (bajo esfuerzo, mejora accesibilidad)
3. **FASE 1**: Type-Safe Commands (alto impacto, requiere refactorización)
4. **FASE 4**: Scraper/Provider System (prioridad alta, nueva funcionalidad)
5. **FASE 5**: Launch Strategies (soporte CHD/ZIP)
6. **FASE 6**: AsyncHandle Pattern (mejora DX)
7. **FASE 7**: Cascading Config (mejora arquitectura)
8. **FASE 8**: Migration System (datos seguros)
9. **FASE 9**: Composable Stores (mejora mantenimiento)
10. **FASE 10**: Resource Pool/Reload (optimización)
11. **FASE 11**: Testing Integration (calidad)
12. **FASE 12**: Scripting/Plugins (extensibilidad)

---

## Notas de Implementación

### Breaking Changes
Este plan introduce breaking changes en la API de Tauri commands. Se recomienda:
- Version bump a v2.0
- Documentar cambios en CHANGELOG.md
- Proveer script de migración si es necesario

### Testing Strategy
- Tests de integración primero
- Coverage mínimo: 70% para módulos core
- CI/CD con GitHub Actions

### Performance
- Lazy loading de providers de scraper
- Connection pooling para DB
- Resource pooling para media

---

*Documento generado: 2026-05-16*
*Última actualización: 2026-05-16*