# Nuevas Funciones - HyperSpin/RocketLauncher Integration

**Versión simplificada:** Reutilizar managers existentes + agregar solo UI intuitiva  
**Total código:** ~900 líneas (no 4,650)  
**Enfoque:** Usabilidad extrema + Configuración sencilla

---

## 🎯 Estrategia

### ✅ NO MODIFICAR (Ya funciona)
- **CoinManager** - monedas, balance, eventos
- **TimerManager** - temporizador, pausar/reanudar
- **EmulatorManager** - lanzar juegos
- **GameLibrary** - escanear ROMs

### 🔧 MEJORAR (Pequeños cambios)
- **ConfigManager** - agregar persistencia de `SystemGameConfig`
- **GameScreen** - conectar CoinManager + TimerManager para mostrar overlay

### ✨ AGREGAR (Solo UI/configuración)
1. **SystemGameConfig** struct (~50 líneas) - guardar config por sistema
2. **CoinConfigPanel** (~250 líneas) - UI para configurar
3. **CreditOverlay mejorado** (~150 líneas) - mostrar créditos/tiempo
4. **GameLaunchConnector** (~100 líneas) - lógica de cuando time=0, salir

---

## 📋 FASE 1: Configuración de Sistemas (CRÍTICA) - 2h

### 1.1 Struct para persistencia

**Actualizar:** `src-tauri/src/core/config_manager.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemGameConfig {
    pub system: String,
    pub mode: GameMode, // Arcade | Console | TimedFree
    pub coins_per_time: u32, // monedas = X segundos (ej: 1 moneda = 180 seg)
    pub max_time: u32, // máximo tiempo permitido (segundos)
    pub show_overlay: bool,
    pub warn_before: u32, // advertencia con X segundos restantes
    pub auto_exit: bool, // cerrar emulador cuando time=0
}

pub enum GameMode {
    Arcade,    // 1 moneda = 3 minutos, sale cuando se acaba
    Console,   // 1 moneda = 5 minutos, sale cuando se acaba
    TimedFree, // sin monedas, tiempo fijo, sale cuando se acaba
}

impl ConfigManager {
    pub async fn save_system_config(&mut self, config: SystemGameConfig) -> Result<()>;
    pub async fn load_system_config(&self, system: &str) -> Result<SystemGameConfig>;
    pub async fn get_all_system_configs(&self) -> Result<Vec<SystemGameConfig>>;
}
```

### 1.2 Tauri commands (100 líneas)

**Crear/actualizar:** `src-tauri/src/commands/config.rs`

```rust
#[tauri::command]
async fn save_system_config(
    system: String,
    config: SystemGameConfig,
    config_manager: State<'_, ConfigManager>,
) -> Result<(), String>

#[tauri::command]
async fn load_system_config(
    system: String,
    config_manager: State<'_, ConfigManager>,
) -> Result<SystemGameConfig, String>

#[tauri::command]
async fn get_all_system_configs(
    config_manager: State<'_, ConfigManager>,
) -> Result<Vec<SystemGameConfig>, String>
```

---

## 🎨 FASE 2: UI de Configuración (CRÍTICA) - 2-3h

### 2.1 CoinConfigPanel Component (250 líneas)

**Archivo:** `src/components/customization/CoinConfigPanel.tsx`

```typescript
interface CoinConfigPanelProps {
  systems: string[];
  onSave?: () => void;
}

export const CoinConfigPanel: React.FC<CoinConfigPanelProps> = ({ systems }) => {
  const [selectedSystem, setSelectedSystem] = useState(systems[0]);
  const [config, setConfig] = useState<SystemGameConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig(selectedSystem);
  }, [selectedSystem]);

  const loadConfig = async (system: string) => {
    try {
      const cfg = await invoke('load_system_config', { system });
      setConfig(cfg);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await invoke('save_system_config', {
        system: selectedSystem,
        config,
      });
      // Toast: "Configuración guardada"
    } finally {
      setIsSaving(false);
    }
  };

  if (!config) return <div>Cargando...</div>;

  return (
    <div className="coin-config-panel">
      <h2>Configurar Créditos/Monedas</h2>

      {/* System selector */}
      <div className="system-selector">
        <label>Sistema:</label>
        <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)}>
          {systems.map((sys) => (
            <option key={sys} value={sys}>
              {sys}
            </option>
          ))}
        </select>
      </div>

      {/* Mode selector */}
      <div className="mode-section">
        <h3>Tipo de Máquina</h3>
        <div className="mode-options">
          <label>
            <input
              type="radio"
              name="mode"
              value="Arcade"
              checked={config.mode === 'Arcade'}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as GameMode })}
            />
            <span>Arcade (Monedas = Tiempo)</span>
            <small>1 moneda = 3 minutos, sale cuando se acaba</small>
          </label>

          <label>
            <input
              type="radio"
              name="mode"
              value="Console"
              checked={config.mode === 'Console'}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as GameMode })}
            />
            <span>Consola (Monedas = Créditos)</span>
            <small>1 moneda = 5 minutos, sale cuando se acaba</small>
          </label>

          <label>
            <input
              type="radio"
              name="mode"
              value="TimedFree"
              checked={config.mode === 'TimedFree'}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as GameMode })}
            />
            <span>Tiempo Libre (Sin Monedas)</span>
            <small>Tiempo fijo, sale cuando se acaba</small>
          </label>
        </div>
      </div>

      {/* Time configuration */}
      <div className="time-section">
        <h3>Configuración de Tiempo</h3>
        
        <label>
          Tiempo por Moneda (segundos):
          <input
            type="number"
            value={config.coins_per_time}
            onChange={(e) => setConfig({ ...config, coins_per_time: parseInt(e.target.value) })}
            min="30"
            max="600"
            step="30"
          />
          <small>Default: Arcade=180, Console=300</small>
        </label>

        <label>
          Tiempo Máximo (segundos):
          <input
            type="number"
            value={config.max_time}
            onChange={(e) => setConfig({ ...config, max_time: parseInt(e.target.value) })}
            min="60"
            max="3600"
            step="60"
          />
        </label>

        <label>
          Advertencia con (segundos restantes):
          <input
            type="number"
            value={config.warn_before}
            onChange={(e) => setConfig({ ...config, warn_before: parseInt(e.target.value) })}
            min="10"
            max="120"
            step="10"
          />
        </label>
      </div>

      {/* Behavior options */}
      <div className="behavior-section">
        <h3>Comportamiento</h3>
        
        <label>
          <input
            type="checkbox"
            checked={config.show_overlay}
            onChange={(e) => setConfig({ ...config, show_overlay: e.target.checked })}
          />
          Mostrar overlay de créditos/tiempo
        </label>

        <label>
          <input
            type="checkbox"
            checked={config.auto_exit}
            onChange={(e) => setConfig({ ...config, auto_exit: e.target.checked })}
          />
          Salir automáticamente cuando termina el tiempo
        </label>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={isSaving} className="save-btn">
        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </div>
  );
};
```

### 2.2 CSS para CoinConfigPanel (150 líneas)

```css
.coin-config-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #FF6400;
  border-radius: 8px;
  padding: 24px;
  color: #ffffff;
  max-width: 600px;
}

.coin-config-panel h2 {
  color: #FFCC00;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.coin-config-panel h3 {
  color: #FF6400;
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: uppercase;
}

.system-selector,
.time-section label,
.behavior-section label {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.system-selector select,
.time-section input {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #404040;
  border-radius: 4px;
  color: #ffffff;
  font-size: 12px;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 100, 0, 0.1);
  border: 1px solid #FF6400;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-options label:hover {
  background: rgba(255, 100, 0, 0.15);
}

.mode-options small {
  display: block;
  color: #999999;
  font-size: 11px;
  margin-top: 4px;
}

.save-btn {
  margin-top: 24px;
  padding: 12px 24px;
  background: #FF6400;
  color: #000000;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #FFCC00;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 📺 FASE 3: Overlay Mejorado (CRÍTICA) - 2h

### 3.1 CreditOverlay Component (150 líneas)

**Actualizar/crear:** `src/components/arcade/CreditOverlay.tsx`

```typescript
interface CreditOverlayProps {
  visible: boolean;
  credits: number;
  timeRemaining?: number; // segundos
  isRunning: boolean;
  warningThreshold?: number;
  gameTitle?: string;
}

export const CreditOverlay: React.FC<CreditOverlayProps> = ({
  visible,
  credits,
  timeRemaining,
  isRunning,
  warningThreshold = 30,
  gameTitle,
}) => {
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setIsWarning(timeRemaining ? timeRemaining < warningThreshold : false);
  }, [timeRemaining, warningThreshold]);

  if (!visible) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`credit-overlay ${isWarning ? 'warning' : ''}`}>
      {/* Esquina superior izquierda: Créditos */}
      <div className="credits-box">
        <div className="label">CREDITS</div>
        <div className="value">{credits}</div>
      </div>

      {/* Esquina superior derecha: Tiempo */}
      {timeRemaining !== undefined && (
        <div className={`time-box ${isRunning ? 'running' : ''}`}>
          <div className="label">TIME</div>
          <div className="value">{formatTime(timeRemaining)}</div>
        </div>
      )}

      {/* Centro: Título del juego (opcional) */}
      {gameTitle && (
        <div className="game-title">{gameTitle}</div>
      )}

      {/* Advertencia en centro-abajo */}
      {isWarning && isRunning && (
        <div className="warning-flash">
          <span className="blink">⚠️ TIME RUNNING OUT! ⚠️</span>
        </div>
      )}
    </div>
  );
};
```

### 3.2 CSS para Overlay (100 líneas)

```css
.credit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-family: 'Courier New', monospace;
  z-index: 1000;
}

.credit-overlay.warning .credits-box,
.credit-overlay.warning .time-box {
  animation: pulse 0.5s infinite;
}

.credits-box,
.time-box {
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #FF6400;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
}

.credits-box {
  top: 20px;
  left: 20px;
}

.time-box {
  top: 20px;
  right: 20px;
}

.credits-box .label,
.time-box .label {
  color: #FFCC00;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.credits-box .value,
.time-box .value {
  color: #00FF64;
  font-size: 36px;
  font-weight: bold;
  min-width: 60px;
}

.time-box.running .value {
  color: #FFFFFF;
}

.game-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #FFCC00;
  font-size: 24px;
  text-transform: uppercase;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  max-width: 80%;
}

.warning-flash {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.warning-flash .blink {
  color: #FF3333;
  font-size: 18px;
  font-weight: bold;
  text-transform: uppercase;
  animation: blink 0.3s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.3; }
}
```

---

## 🔗 FASE 4: Conectar Todo (ALTA) - 1-2h

### 4.1 Hook useCoinGame (100 líneas)

**Archivo:** `src/hooks/useCoinGame.ts`

```typescript
interface UseCoinGameReturn {
  credits: number;
  timeRemaining: number | null;
  isPlaying: boolean;
  insertCoin: (amount: number) => Promise<void>;
  startGame: (system: string, gameId: string) => Promise<void>;
  endGame: () => Promise<void>;
  systemConfig: SystemGameConfig | null;
}

export const useCoinGame = (system: string): UseCoinGameReturn => {
  const [credits, setCredits] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemGameConfig | null>(null);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [system]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev! <= 1) {
          // Time's up - exit game
          invoke('end_game_session', { system }).catch(console.error);
          setIsPlaying(false);
          return null;
        }
        return prev! - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeRemaining, system]);

  const loadConfig = async () => {
    try {
      const cfg = await invoke('load_system_config', { system });
      setSystemConfig(cfg);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const insertCoin = async (amount: number) => {
    try {
      const state = await invoke('add_coins', { amount });
      setCredits(state.total_balance);
    } catch (err) {
      console.error('Error inserting coin:', err);
    }
  };

  const startGame = async (systemStr: string, gameId: string) => {
    if (!systemConfig) return;

    try {
      const timeSeconds = systemConfig.coins_per_time;
      setTimeRemaining(timeSeconds);
      setIsPlaying(true);
      // Start timer on backend
      await invoke('start_timer', { duration_seconds: timeSeconds });
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const endGame = async () => {
    try {
      await invoke('stop_timer', {});
      setIsPlaying(false);
      setTimeRemaining(null);
    } catch (err) {
      console.error('Error ending game:', err);
    }
  };

  return {
    credits,
    timeRemaining,
    isPlaying,
    insertCoin,
    startGame,
    endGame,
    systemConfig,
  };
};
```

### 4.2 Integración en GameScreen

**Actualizar:** `src/components/arcade/GameScreen.tsx`

```typescript
import { CreditOverlay } from './CreditOverlay';
import { useCoinGame } from '../../hooks/useCoinGame';

export const GameScreen: React.FC<GameScreenProps> = ({ system, gameId }) => {
  const { credits, timeRemaining, isPlaying, systemConfig } = useCoinGame(system);

  return (
    <div className="game-screen">
      {/* Game render area */}
      <div className="game-canvas">
        {/* emulator renders here */}
      </div>

      {/* Overlay */}
      {systemConfig?.show_overlay && (
        <CreditOverlay
          visible={true}
          credits={credits}
          timeRemaining={timeRemaining || undefined}
          isRunning={isPlaying}
          warningThreshold={systemConfig.warn_before}
          gameTitle={gameId}
        />
      )}
    </div>
  );
};
```

---

## 📋 Tareas Totales

### FASE 1: Config (2h)
- [ ] SystemGameConfig struct
- [ ] ConfigManager methods
- [ ] Tauri commands

### FASE 2: UI Config (2-3h)
- [ ] CoinConfigPanel component
- [ ] CSS styling
- [ ] Form validación

### FASE 3: Overlay (2h)
- [ ] CreditOverlay mejorado
- [ ] CSS animations
- [ ] Integración en GameScreen

### FASE 4: Conectar (1-2h)
- [ ] useCoinGame hook
- [ ] Persistencia de config
- [ ] Testing manual

**TOTAL: 7-9 horas**

---

## 🎨 Principios de Diseño

✅ **Intuitivo:** Radio buttons para modos, sliders para tiempos  
✅ **Visual:** Overlay arcade retro con animaciones  
✅ **Configurable:** Cada sistema puede ser diferente  
✅ **Robusto:** Persistencia en DB, sin perder config  
✅ **Usable:** SIN requiere tocar código, todo desde UI  

---

**¿Empezamos por Fase 1?**
