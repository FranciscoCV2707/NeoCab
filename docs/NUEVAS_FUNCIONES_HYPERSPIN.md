# Nuevas Funciones - HyperSpin/RocketLauncher Integration

**Objetivo:** Agregar funcionalidades avanzadas de HyperSpin que faltan en NeoCab v3.0  
**Prioridad:** CRÍTICA (créditos/temporizador) → ALTA (lanzamiento) → MEDIA (auditoría)

---

## 📊 Análisis: Qué Ya Existe vs Qué Falta

### ✅ YA EXISTE EN NEOCAB
- GameLibrary (escaneo de ROMs)
- EmulatorManager (lanzamiento básico)
- InputManager (mapeo de controles)
- CoinManager (balance de monedas)
- TimerManager (temporizador)
- MediaManager (importar/organizar media)
- ThemeManager (temas)
- OperatorPanel (PIN, stats)

### ❌ FALTA (NUEVO A AGREGAR)

| Función | Categoría | Prioridad | Ubicación |
|---------|-----------|-----------|-----------|
| **GameMetadataManager** | Config | MEDIA | src-tauri/src/core/game_metadata.rs |
| **AuditManager** | Config | MEDIA | src-tauri/src/core/audit_manager.rs |
| **LaunchParametersManager** | Lanzamiento | ALTA | src-tauri/src/core/launch_params.rs |
| **ProcessMonitor** | Lanzamiento | ALTA | src-tauri/src/core/process_monitor.rs |
| **ArcadeCreditMode** | Créditos | CRÍTICA | src-tauri/src/core/arcade_credit_mode.rs |
| **LogManager** | Auditoría | MEDIA | src-tauri/src/core/log_manager.rs |
| **GameMetadataEditor UI** | UI | MEDIA | src/components/customization/GameMetadataEditor.tsx |
| **AuditPanel UI** | UI | MEDIA | src/components/customization/AuditPanel.tsx |
| **LaunchConfig UI** | UI | ALTA | src/components/customization/LaunchConfigPanel.tsx |
| **CreditMode UI** | UI | CRÍTICA | src/components/arcade/CreditModeOverlay.tsx |
| **LogViewer UI** | UI | MEDIA | src/components/settings/LogViewer.tsx |

---

## 🔴 FASE 1: CRÍTICA - Modo Créditos Arcade (4-6h)

### 1.1 Backend: ArcadeCreditMode Manager

**Archivo:** `src-tauri/src/core/arcade_credit_mode.rs` (~250 líneas)

```rust
pub struct ArcadeCreditMode {
    credits: i32,
    current_game: Option<String>,
    credit_value: f32, // coins per credit
    coin_counter: f32,
    system_configs: HashMap<String, SystemCreditConfig>,
    listeners: Vec<CreditModeListener>,
}

pub struct SystemCreditConfig {
    system: String,
    credits_per_coin: i32,
    time_per_credit: u32, // segundos
    show_credits: bool,
    show_timer: bool,
}

impl ArcadeCreditMode {
    pub fn new() -> Self;
    
    pub fn insert_coin(&mut self, amount: f32) -> (i32, bool) {
        // Retorna (nuevos_créditos, game_started)
    }
    
    pub fn add_coins_for_game(&mut self, system: &str, coins: i32) -> Result<()>;
    
    pub fn start_game(&mut self, system: &str, game_id: &str) -> Result<()>;
    
    pub fn end_game(&mut self) -> (i32, u32) {
        // Retorna (credits_remaining, time_played)
    }
    
    pub fn get_credit_display(&self) -> CreditDisplay {
        // { credits: 2, time_remaining: 300, is_running: true }
    }
    
    pub fn set_system_config(&mut self, config: SystemCreditConfig) -> Result<()>;
    
    pub fn get_system_config(&self, system: &str) -> Option<SystemCreditConfig>;
}

pub struct CreditDisplay {
    pub credits: i32,
    pub time_remaining: Option<u32>, // segundos
    pub is_running: bool,
    pub current_game: Option<String>,
}
```

**Tauri Commands:** `src-tauri/src/commands/arcade_credit_mode.rs` (~150 líneas)

```rust
#[tauri::command]
async fn insert_coin(
    amount: f32,
    arcade_credit_mode: State<'_, ArcadeCreditMode>,
) -> Result<CreditDisplay, String>

#[tauri::command]
async fn get_credit_display(
    arcade_credit_mode: State<'_, ArcadeCreditMode>,
) -> Result<CreditDisplay, String>

#[tauri::command]
async fn start_game_with_credits(
    system: String,
    game_id: String,
    arcade_credit_mode: State<'_, ArcadeCreditMode>,
) -> Result<(), String>

#[tauri::command]
async fn end_game_session(
    arcade_credit_mode: State<'_, ArcadeCreditMode>,
) -> Result<SessionStats, String>

#[tauri::command]
async fn set_system_credit_config(
    system: String,
    config: SystemCreditConfig,
    arcade_credit_mode: State<'_, ArcadeCreditMode>,
) -> Result<(), String>

#[tauri::command]
async fn get_system_credit_config(
    system: String,
    arcade_credit_mode: State<'_, ArcadeCreditMode>,
) -> Result<SystemCreditConfig, String>
```

### 1.2 Frontend: CreditModeOverlay Component

**Archivo:** `src/components/arcade/CreditModeOverlay.tsx` (~200 líneas)

```typescript
interface CreditModeOverlayProps {
  visible: boolean;
  creditDisplay: CreditDisplay;
  onCreditWarning?: () => void;
  onGameEnd?: () => void;
}

export const CreditModeOverlay: React.FC<CreditModeOverlayProps> = ({
  visible,
  creditDisplay,
}) => {
  const [warningActive, setWarningActive] = useState(false);

  useEffect(() => {
    // Mostrar advertencia cuando time_remaining < 30 segundos
    if (creditDisplay.time_remaining && creditDisplay.time_remaining < 30) {
      setWarningActive(true);
    }
  }, [creditDisplay.time_remaining]);

  if (!visible) return null;

  return (
    <div className="credit-mode-overlay">
      {/* Créditos */}
      <div className={`credits-display ${warningActive ? 'warning' : ''}`}>
        <span className="label">CREDITS</span>
        <span className="value">{creditDisplay.credits}</span>
      </div>

      {/* Timer (si aplica) */}
      {creditDisplay.time_remaining !== undefined && (
        <div className={`timer-display ${warningActive ? 'warning' : ''}`}>
          <span className="label">TIME</span>
          <span className="value">
            {formatSeconds(creditDisplay.time_remaining)}
          </span>
        </div>
      )}

      {/* Advertencia visual */}
      {warningActive && (
        <div className="warning-banner">
          <span>⚠️ TIME RUNNING OUT!</span>
        </div>
      )}
    </div>
  );
};
```

### 1.3 Integration

- Agregar `ArcadeCreditMode` al `initialize_app()` en lib.rs
- Conectar `CoinManager` ↔ `ArcadeCreditMode` (insert_coin trigger)
- Conectar `TimerManager` ↔ `ArcadeCreditMode` (time updates)
- Renderizar `CreditModeOverlay` en `GameScreen.tsx`

---

## 🟠 FASE 2: ALTA - Lanzamiento Mejorado (6-8h)

### 2.1 LaunchParametersManager

**Archivo:** `src-tauri/src/core/launch_params.rs` (~300 líneas)

```rust
pub struct LaunchParametersManager {
    system_params: HashMap<String, SystemLaunchConfig>,
    pre_launch_scripts: HashMap<String, String>,
    post_launch_scripts: HashMap<String, String>,
}

pub struct SystemLaunchConfig {
    system: String,
    extra_args: Vec<String>, // parámetros por sistema
    working_dir: Option<PathBuf>,
    env_vars: HashMap<String, String>,
    pre_script: Option<String>,
    post_script: Option<String>,
}

impl LaunchParametersManager {
    pub fn get_launch_args(&self, system: &str, game_id: &str) -> Vec<String>;
    pub fn add_system_config(&mut self, config: SystemLaunchConfig) -> Result<()>;
    pub fn run_pre_launch_script(&self, system: &str) -> Result<()>;
    pub fn run_post_launch_script(&self, system: &str) -> Result<()>;
}
```

### 2.2 ProcessMonitor

**Archivo:** `src-tauri/src/core/process_monitor.rs` (~250 líneas)

```rust
pub struct ProcessMonitor {
    watched_processes: HashMap<u32, ProcessInfo>,
}

pub struct ProcessInfo {
    pid: u32,
    exe_name: String,
    system: String,
    game_id: String,
    start_time: SystemTime,
}

impl ProcessMonitor {
    pub fn watch_process(&mut self, pid: u32, info: ProcessInfo) -> Result<()>;
    pub fn is_process_running(&self, pid: u32) -> bool;
    pub fn wait_for_process_exit(&self, pid: u32, timeout: u32) -> Result<()>;
    pub fn get_process_info(&self, pid: u32) -> Option<ProcessInfo>;
    pub fn kill_process(&mut self, pid: u32) -> Result<()>;
}
```

### 2.3 Mejorar EmulatorManager

**Actualizar:** `src-tauri/src/core/emulator_manager.rs`

```rust
pub async fn launch_game_with_params(
    &self,
    system: &str,
    game_id: &str,
    launch_params: &SystemLaunchConfig,
) -> Result<u32> {
    // 1. Run pre-launch script
    // 2. Get launch args from LaunchParametersManager
    // 3. Start process
    // 4. Monitor with ProcessMonitor
    // 5. Return PID
}

pub async fn stop_game_with_cleanup(
    &self,
    pid: u32,
    run_post_script: bool,
) -> Result<()> {
    // 1. Kill process
    // 2. Run post-launch script if enabled
    // 3. Clean up resources
}
```

---

## 🟡 FASE 3: MEDIA - Auditoría & Metadata (4-6h)

### 3.1 GameMetadataManager

**Archivo:** `src-tauri/src/core/game_metadata.rs` (~200 líneas)

```rust
pub struct GameMetadataManager {
    metadata_db: HashMap<String, GameMetadata>,
}

pub struct GameMetadata {
    pub game_id: String,
    pub system: String,
    pub title: String,
    pub description: String,
    pub genre: Vec<String>,
    pub year: Option<i32>,
    pub developer: Option<String>,
    pub rating: Option<f32>,
    pub playtime: u32, // horas
    pub last_played: Option<SystemTime>,
    pub custom_fields: HashMap<String, String>,
}

impl GameMetadataManager {
    pub fn get_metadata(&self, game_id: &str, system: &str) -> Option<GameMetadata>;
    pub fn update_metadata(&mut self, metadata: GameMetadata) -> Result<()>;
    pub fn auto_fetch_metadata(&self, system: &str, game_id: &str) -> Result<GameMetadata>;
    pub fn bulk_import_metadata(&mut self, system: &str) -> Result<u32>; // count imported
}
```

### 3.2 AuditManager

**Archivo:** `src-tauri/src/core/audit_manager.rs` (~250 líneas)

```rust
pub struct AuditManager {
    rom_index: HashMap<String, Vec<GameInfo>>,
    media_index: HashMap<String, MediaAuditReport>,
}

pub struct AuditReport {
    pub system: String,
    pub total_roms: u32,
    pub found_roms: u32,
    pub missing_roms: Vec<String>,
    pub missing_wheels: Vec<String>,
    pub missing_boxes: Vec<String>,
    pub missing_backgrounds: Vec<String>,
    pub validation_errors: Vec<String>,
}

impl AuditManager {
    pub async fn audit_system(&self, system: &str) -> Result<AuditReport>;
    pub fn validate_rom_paths(&self, system: &str) -> Result<ValidationReport>;
    pub fn get_missing_media(&self, system: &str) -> Result<Vec<String>>;
    pub fn check_path_validity(&self, path: &Path) -> Result<()>;
}
```

### 3.3 LogManager

**Archivo:** `src-tauri/src/core/log_manager.rs` (~200 líneas)

```rust
pub struct LogManager {
    logs: Vec<LogEntry>,
    log_file: PathBuf,
}

pub struct LogEntry {
    pub timestamp: SystemTime,
    pub level: LogLevel, // Info, Warning, Error
    pub category: String, // "emulator", "media", "hardware"
    pub message: String,
    pub details: Option<String>,
}

impl LogManager {
    pub fn log_game_launch(&mut self, system: &str, game_id: &str) -> Result<()>;
    pub fn log_game_exit(&mut self, system: &str, game_id: &str, playtime: u32) -> Result<()>;
    pub fn log_error(&mut self, category: &str, message: String) -> Result<()>;
    pub fn get_logs(&self, limit: u32) -> Vec<LogEntry>;
    pub fn get_session_history(&self) -> Vec<GameSessionLog>;
    pub fn clear_logs(&mut self) -> Result<()>;
}
```

---

## 📋 Tareas por Fase

### FASE 1: Créditos (CRÍTICA) - 4-6h

**Backend:**
- [ ] ArcadeCreditMode struct (250 líneas)
- [ ] Logic de insert_coin, start_game, end_game
- [ ] Tauri commands (150 líneas)
- [ ] Integration con lib.rs

**Frontend:**
- [ ] CreditModeOverlay.tsx (200 líneas)
- [ ] CreditModeOverlay.css (150 líneas)
- [ ] Hook useCreditMode.ts (100 líneas)
- [ ] Integración en GameScreen.tsx

**Testing:**
- [ ] Unit tests para ArcadeCreditMode
- [ ] Manual testing con monedas

**Commits:**
- feat: arcade credit mode manager (backend)
- feat: credit mode overlay UI (frontend)

### FASE 2: Lanzamiento (ALTA) - 6-8h

**Backend:**
- [ ] LaunchParametersManager (300 líneas)
- [ ] ProcessMonitor (250 líneas)
- [ ] Actualizar EmulatorManager.launch_game_with_params
- [ ] Tauri commands (200 líneas)

**Frontend:**
- [ ] LaunchConfigPanel.tsx (300 líneas)
- [ ] Sistema de configuración por sistema
- [ ] CSS styling (200 líneas)

**Commits:**
- feat: launch parameters & process monitoring
- feat: launch configuration UI

### FASE 3: Auditoría (MEDIA) - 4-6h

**Backend:**
- [ ] GameMetadataManager (200 líneas)
- [ ] AuditManager (250 líneas)
- [ ] LogManager (200 líneas)
- [ ] Tauri commands (300 líneas)

**Frontend:**
- [ ] GameMetadataEditor.tsx (300 líneas)
- [ ] AuditPanel.tsx (250 líneas)
- [ ] LogViewer.tsx (200 líneas)
- [ ] CSS styling (300 líneas)

**Commits:**
- feat: game metadata & audit managers
- feat: audit & metadata UI panels

---

## 🎯 Resumen Total

| Fase | Horas | Prioridad | Status |
|------|-------|-----------|--------|
| 1: Créditos | 4-6h | CRÍTICA | ⏳ |
| 2: Lanzamiento | 6-8h | ALTA | ⏳ |
| 3: Auditoría | 4-6h | MEDIA | ⏳ |
| **TOTAL** | **14-20h** | - | - |

---

## 📊 Código Total a Agregar

```
Backend Rust:      ~2,000 líneas
Frontend React:    ~1,500 líneas
CSS:               ~650 líneas
Tauri Commands:    ~500 líneas
─────────────────────────────
TOTAL:             ~4,650 líneas
```

---

**Listo para comenzar cuando digas. ¿Empezamos por Fase 1 (Créditos)?**
