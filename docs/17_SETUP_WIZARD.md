# 🧙 ARCADECORE v3 — SETUP WIZARD (Configuración Fácil)

> **De cero a arcade funcionando en menos de 15 minutos. Sin editar archivos a mano.**

---

## FILOSOFÍA DE DISEÑO: FACILIDAD PRIMERO

```
Principios de UX de ArcadeCore:

  ✅ Primera vez: Wizard visual paso a paso
  ✅ Auto-detección de emuladores instalados
  ✅ Auto-detección de carpetas de ROMs
  ✅ Auto-detección de controles conectados
  ✅ Configuración por pantallas, no archivos YAML a mano
  ✅ Preview en tiempo real de cambios
  ✅ "Funciona" con configuración mínima
  ✅ Configuración avanzada disponible pero no obligatoria
  ✅ Un solo clic para agregar un sistema
  ✅ Mensajes de error en lenguaje humano
```

---

## FLUJO DEL WIZARD (Primera vez)

```
┌─────────────────────────────────────────────────────────┐
│  Paso 1: Bienvenida + Idioma + Tema visual              │
│  Paso 2: ¿Dónde están tus ROMs?  (auto-scan o manual)  │
│  Paso 3: ¿Tienes emuladores? (auto-detección)           │
│  Paso 4: Configura tu control (wizard botón a botón)    │
│  Paso 5: ¿Monedas o libre? (coins vs free play)         │
│  Paso 6: ¡Listo! Vista previa de tu colección           │
└─────────────────────────────────────────────────────────┘

Tiempo promedio: 5-10 minutos
```

---

## PASO 1: BIENVENIDA

```tsx
// src/pages/wizard/Step1Welcome.tsx
export function Step1Welcome({ onNext }: { onNext: () => void }) {
  const [lang, setLang]   = useState("es");
  const [theme, setTheme] = useState("hyperspin-classic");

  return (
    <div className="wizard-step">
      <div className="wizard-logo">
        <img src="assets/logo.png" alt="ArcadeCore" />
        <h1>ArcadeCore</h1>
        <p>Tu sistema arcade definitivo</p>
      </div>

      <div className="wizard-options">
        <div className="option-group">
          <label>🌍 Idioma</label>
          <div className="option-buttons">
            {[
              { code: "es", label: "Español" },
              { code: "en", label: "English" },
              { code: "pt", label: "Português" },
              { code: "fr", label: "Français" },
            ].map(l => (
              <button
                key={l.code}
                className={lang === l.code ? "selected" : ""}
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>🎨 Tema visual</label>
          <div className="theme-grid">
            {[
              { id: "hyperspin-classic", label: "HyperSpin Classic",  preview: "themes/hs-preview.jpg" },
              { id: "dark-neon",         label: "Dark Neon",           preview: "themes/neon-preview.jpg" },
              { id: "crt-retro",         label: "CRT Retro",           preview: "themes/crt-preview.jpg" },
              { id: "grid-modern",       label: "Grid Moderno",         preview: "themes/grid-preview.jpg" },
            ].map(t => (
              <div
                key={t.id}
                className={`theme-card ${theme === t.id ? "selected" : ""}`}
                onClick={() => setTheme(t.id)}
              >
                <img src={t.preview} alt={t.label} />
                <span>{t.label}</span>
                {theme === t.id && <span className="check">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-next" onClick={onNext}>
        Continuar →
      </button>
    </div>
  );
}
```

---

## PASO 2: DÓNDE ESTÁN TUS ROMS (Auto-scan)

```tsx
// src/pages/wizard/Step2Roms.tsx
export function Step2Roms({ onNext }: StepProps) {
  const [scanning,  setScanning]  = useState(false);
  const [found,     setFound]     = useState<FoundSystem[]>([]);
  const [manualDir, setManualDir] = useState("");

  // Auto-scan: buscar en las ubicaciones más comunes
  const autoScan = async () => {
    setScanning(true);
    const results = await invoke<FoundSystem[]>("wizard_scan_roms", {
      extraPaths: manualDir ? [manualDir] : []
    });
    setFound(results);
    setScanning(false);
  };

  useEffect(() => { autoScan(); }, []);

  return (
    <div className="wizard-step">
      <h2>📁 ¿Dónde están tus ROMs?</h2>

      {scanning ? (
        <div className="scanning">
          <div className="spinner" />
          <p>Buscando ROMs en tu PC...</p>
          <p className="hint">Buscando en carpetas comunes: Descargas, Documentos, C:/ROMs...</p>
        </div>
      ) : (
        <>
          {found.length > 0 ? (
            <div className="found-systems">
              <h3>✅ Encontramos {found.reduce((s, f) => s + f.game_count, 0)} juegos en {found.length} sistemas:</h3>
              {found.map(sys => (
                <div key={sys.name} className="found-system">
                  <img src={`media/systems/${sys.name}.png`} alt={sys.display_name} className="sys-icon" />
                  <div className="sys-info">
                    <strong>{sys.display_name}</strong>
                    <span>{sys.game_count} juegos en {sys.path}</span>
                  </div>
                  <input type="checkbox" defaultChecked onChange={(e) =>
                    setFound(f => f.map(x => x.name === sys.name ? {...x, enabled: e.target.checked} : x))
                  } />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-found">
              <p>No encontramos ROMs automáticamente.</p>
            </div>
          )}

          {/* Agregar carpeta manual */}
          <div className="manual-add">
            <p>¿Tienes ROMs en otra carpeta?</p>
            <div className="path-input">
              <input
                value={manualDir}
                onChange={e => setManualDir(e.target.value)}
                placeholder="C:/Mis ROMs o /home/usuario/roms"
              />
              <button onClick={() => invoke("pick_folder").then(setManualDir)}>
                Examinar...
              </button>
              <button onClick={autoScan}>Escanear</button>
            </div>
          </div>
        </>
      )}

      <div className="wizard-nav">
        <button className="btn-skip" onClick={onNext}>Saltar por ahora</button>
        <button className="btn-next" onClick={onNext} disabled={found.length === 0}>
          Continuar con {found.filter(f => f.enabled).length} sistemas →
        </button>
      </div>
    </div>
  );
}
```

```rust
// Comando Tauri: escanear ROMs automáticamente
#[tauri::command]
pub async fn wizard_scan_roms(extra_paths: Vec<String>) -> Vec<FoundSystem> {
    let mut search_dirs = get_common_rom_dirs();
    search_dirs.extend(extra_paths.into_iter().map(std::path::PathBuf::from));

    // Extensiones típicas de cada sistema
    let system_exts: &[(&str, &str, &[&str])] = &[
        ("mame",     "MAME Arcade",                 &["zip", "7z", "chd"]),
        ("snes",     "Super Nintendo",              &["sfc", "smc", "zip"]),
        ("nes",      "Nintendo NES",                &["nes", "fds", "zip"]),
        ("genesis",  "Sega Genesis",                &["md", "bin", "smd"]),
        ("ps1",      "PlayStation 1",               &["bin", "cue", "iso", "chd"]),
        ("ps2",      "PlayStation 2",               &["iso", "img", "chd"]),
        ("psp",      "PSP",                         &["iso", "cso", "pbp"]),
        ("gba",      "Game Boy Advance",             &["gba", "zip"]),
        ("n64",      "Nintendo 64",                 &["z64", "v64", "n64"]),
        ("gamecube", "GameCube",                    &["iso", "gcm", "rvz"]),
        ("dos",      "MS-DOS",                      &["exe", "bat"]),
    ];

    let mut found = vec![];

    for (name, display, exts) in system_exts {
        for dir in &search_dirs {
            // Buscar subcarpeta con nombre del sistema
            let candidates = [
                dir.join(name),
                dir.join(display),
                dir.join(name.to_uppercase()),
                dir.clone(),
            ];

            for candidate in &candidates {
                if !candidate.exists() { continue; }
                let count = walkdir::WalkDir::new(candidate)
                    .into_iter()
                    .filter_map(|e| e.ok())
                    .filter(|e| {
                        let ext = e.path().extension()
                            .and_then(|s| s.to_str())
                            .unwrap_or("")
                            .to_lowercase();
                        exts.contains(&ext.as_str())
                    })
                    .count();

                if count > 0 {
                    found.push(FoundSystem {
                        name:         name.to_string(),
                        display_name: display.to_string(),
                        path:         candidate.to_string_lossy().to_string(),
                        game_count:   count,
                        enabled:      true,
                    });
                    break;
                }
            }
        }
    }

    found
}

/// Directorios comunes donde la gente guarda ROMs
fn get_common_rom_dirs() -> Vec<std::path::PathBuf> {
    let mut dirs = vec![];
    let home = dirs::home_dir().unwrap_or_default();

    #[cfg(target_os = "windows")]
    {
        dirs.extend([
            home.join("Downloads"), home.join("Descargas"),
            home.join("Documents\\ROMs"), home.join("Documentos\\ROMs"),
            home.join("Desktop\\ROMs"), home.join("Escritorio\\ROMs"),
            std::path::PathBuf::from("C:\\ROMs"),
            std::path::PathBuf::from("C:\\Emuladores"),
            std::path::PathBuf::from("D:\\ROMs"),
            std::path::PathBuf::from("D:\\Games"),
            std::path::PathBuf::from("E:\\ROMs"),
        ]);
    }

    #[cfg(target_os = "linux")]
    {
        dirs.extend([
            home.join("ROMs"), home.join("roms"),
            home.join("Games"), home.join("Juegos"),
            home.join("Downloads"), home.join("Descargas"),
            std::path::PathBuf::from("/media"),
            std::path::PathBuf::from("/mnt"),
            std::path::PathBuf::from("/opt/roms"),
        ]);
    }

    dirs.into_iter().filter(|d| d.exists()).collect()
}
```

---

## PASO 3: AUTO-DETECCIÓN DE EMULADORES

```tsx
// src/pages/wizard/Step3Emulators.tsx
export function Step3Emulators({ onNext }: StepProps) {
  const [detected, setDetected] = useState<DetectedEmulator[]>([]);

  useEffect(() => {
    invoke<DetectedEmulator[]>("wizard_detect_emulators").then(setDetected);
  }, []);

  return (
    <div className="wizard-step">
      <h2>🎮 Emuladores detectados</h2>

      {detected.length > 0 ? (
        <div className="emulator-list">
          {detected.map(emu => (
            <div key={emu.name} className={`emu-item ${emu.found ? "found" : "missing"}`}>
              <span className="status">{emu.found ? "✅" : "❌"}</span>
              <div className="emu-info">
                <strong>{emu.display_name}</strong>
                <span className="emu-systems">{emu.systems.join(", ")}</span>
                {emu.found && <span className="emu-path">{emu.path}</span>}
                {!emu.found && (
                  <a href={emu.download_url} target="_blank" className="download-link">
                    Descargar →
                  </a>
                )}
              </div>
              {!emu.found && (
                <button onClick={() => invoke("pick_emulator_exe", { name: emu.name })}>
                  Ubicar...
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-emus">
          <p>⚠️ No encontramos emuladores instalados.</p>
          <p>ArcadeCore funciona con emuladores externos. Instala al menos uno:</p>
          <div className="emu-recommendations">
            <a href="https://retroarch.com" target="_blank">
              RetroArch (recomendado — soporta 200+ sistemas)
            </a>
            <a href="https://mamedev.org" target="_blank">
              MAME (para arcade)
            </a>
          </div>
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn-skip" onClick={onNext}>Configurar después</button>
        <button className="btn-next" onClick={onNext}>Continuar →</button>
      </div>
    </div>
  );
}
```

---

## PASO 4: CONTROL FÁCIL (Auto-wizard)

```tsx
// src/pages/wizard/Step4Controller.tsx
const ACTIONS_TO_MAP = [
  { id: "up",       label: "ARRIBA ↑",       icon: "⬆️", required: true },
  { id: "down",     label: "ABAJO ↓",         icon: "⬇️", required: true },
  { id: "left",     label: "IZQUIERDA ←",     icon: "⬅️", required: true },
  { id: "right",    label: "DERECHA →",       icon: "➡️", required: true },
  { id: "select",   label: "SELECCIONAR / OK", icon: "✅", required: true },
  { id: "back",     label: "VOLVER / ATRÁS",   icon: "↩️", required: true },
  { id: "coin",     label: "INSERTAR MONEDA",  icon: "🪙", required: false },
  { id: "start",    label: "START",            icon: "▶️", required: false },
  { id: "exit",     label: "SALIR DEL JUEGO",  icon: "🚪", required: false },
];

export function Step4Controller({ onNext }: StepProps) {
  const [currentAction, setCurrentAction] = useState(0);
  const [mappings,      setMappings]      = useState<Record<string, string>>({});
  const [lastInput,     setLastInput]     = useState<string | null>(null);
  const [listening,     setListening]     = useState(true);

  // Escuchar cualquier input (teclado o control)
  useEffect(() => {
    if (!listening) return;
    const action = ACTIONS_TO_MAP[currentAction];
    if (!action) return;

    const unlisten = listen<string>("joystick-any-input", (e) => {
      if (e.payload) {
        setLastInput(e.payload);
        setMappings(m => ({ ...m, [action.id]: e.payload }));
        setListening(false);
        setTimeout(() => {
          setCurrentAction(i => i + 1);
          setListening(true);
          setLastInput(null);
        }, 800);
      }
    });

    return () => { unlisten.then(f => f()); };
  }, [currentAction, listening]);

  const action = ACTIONS_TO_MAP[currentAction];
  const done   = currentAction >= ACTIONS_TO_MAP.length;

  return (
    <div className="wizard-step controller-wizard">
      {!done ? (
        <>
          <h2>🎮 Configura tu control</h2>
          <p className="step-count">{currentAction + 1} / {ACTIONS_TO_MAP.length}</p>

          {/* Botón que están mapeando AHORA */}
          <div className={`action-prompt ${lastInput ? "captured" : "waiting"}`}>
            <div className="action-icon">{action.icon}</div>
            <div className="action-label">{action.label}</div>
            {lastInput ? (
              <div className="captured-label">
                ✅ Capturado: <strong>{lastInput}</strong>
              </div>
            ) : (
              <div className="waiting-label">
                Presiona el botón ahora...
                <span className="blink">●</span>
              </div>
            )}
            {!action.required && (
              <button className="btn-skip-action" onClick={() => {
                setCurrentAction(i => i + 1);
                setLastInput(null);
              }}>
                Saltar este botón
              </button>
            )}
          </div>

          {/* Mapeos ya capturados */}
          <div className="done-mappings">
            {Object.entries(mappings).map(([id, input]) => {
              const a = ACTIONS_TO_MAP.find(x => x.id === id)!;
              return (
                <div key={id} className="done-mapping">
                  {a.icon} {a.label}: <strong>{input}</strong>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="all-done">
          <h2>✅ ¡Control configurado!</h2>
          <p>Tu control está listo. Puedes cambiarlo después en Configuración.</p>
        </div>
      )}

      {done && (
        <button className="btn-next" onClick={() => { saveMappings(mappings); onNext(); }}>
          Continuar →
        </button>
      )}
    </div>
  );
}
```

---

## PASO 5: COINS / LIBRE

```tsx
// src/pages/wizard/Step5Coins.tsx
export function Step5Coins({ onNext }: StepProps) {
  const [mode, setMode] = useState<"free" | "coins" | "timer">("free");
  const [coinsPerCredit, setCoins]   = useState(1);
  const [minutesPerCoin, setMinutes] = useState(10);

  return (
    <div className="wizard-step">
      <h2>🪙 ¿Cómo quieres que funcione?</h2>

      <div className="mode-cards">
        <div
          className={`mode-card ${mode === "free" ? "selected" : ""}`}
          onClick={() => setMode("free")}
        >
          <div className="mode-icon">🎮</div>
          <h3>Juego Libre</h3>
          <p>Sin monedas, sin límite de tiempo. Perfecto para casa o sala privada.</p>
          {mode === "free" && <span className="check">✓ Seleccionado</span>}
        </div>

        <div
          className={`mode-card ${mode === "coins" ? "selected" : ""}`}
          onClick={() => setMode("coins")}
        >
          <div className="mode-icon">🪙</div>
          <h3>Monedas (Arcade)</h3>
          <p>Insertar moneda para jugar. Igual que las máquinas arcade reales.</p>
          {mode === "coins" && (
            <div className="mode-config">
              <label>Monedas por crédito:</label>
              <input type="number" value={coinsPerCredit} min={1} max={10}
                onChange={e => setCoins(+e.target.value)} />
            </div>
          )}
          {mode === "coins" && <span className="check">✓ Seleccionado</span>}
        </div>

        <div
          className={`mode-card ${mode === "timer" ? "selected" : ""}`}
          onClick={() => setMode("timer")}
        >
          <div className="mode-icon">⏱️</div>
          <h3>Por Tiempo</h3>
          <p>Cada moneda compra X minutos de juego. Ideal para arcades públicos.</p>
          {mode === "timer" && (
            <div className="mode-config">
              <label>Minutos por moneda:</label>
              <input type="number" value={minutesPerCoin} min={1} max={60}
                onChange={e => setMinutes(+e.target.value)} />
            </div>
          )}
          {mode === "timer" && <span className="check">✓ Seleccionado</span>}
        </div>
      </div>

      <button className="btn-next" onClick={() => { saveMode(mode, coinsPerCredit, minutesPerCoin); onNext(); }}>
        Continuar →
      </button>
    </div>
  );
}
```

---

## PASO 6: ¡LISTO! (Preview de colección)

```tsx
// src/pages/wizard/Step6Done.tsx
export function Step6Done({ onFinish }: { onFinish: () => void }) {
  const [stats, setStats] = useState({ systems: 0, games: 0, emulators: 0 });

  useEffect(() => {
    invoke<WizardStats>("wizard_get_stats").then(setStats);
  }, []);

  return (
    <div className="wizard-step done-step">
      <div className="celebration">🎉</div>
      <h1>¡ArcadeCore está listo!</h1>

      <div className="stats-grid">
        <div className="stat">
          <div className="stat-number">{stats.systems}</div>
          <div className="stat-label">Sistemas</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.games.toLocaleString()}</div>
          <div className="stat-label">Juegos</div>
        </div>
        <div className="stat">
          <div className="stat-number">{stats.emulators}</div>
          <div className="stat-label">Emuladores</div>
        </div>
      </div>

      <div className="tips">
        <h3>💡 Consejos rápidos</h3>
        <ul>
          <li>Usa <kbd>←</kbd> <kbd>→</kbd> para navegar entre sistemas</li>
          <li>Presiona <kbd>Enter</kbd> para entrar a un sistema o lanzar un juego</li>
          <li>Mantén <kbd>LB+RB+Start</kbd> para salir de un juego</li>
          <li>Accede a Configuración con <kbd>Ctrl+O</kbd></li>
        </ul>
      </div>

      <button className="btn-launch" onClick={onFinish}>
        🚀 ¡Empezar a jugar!
      </button>
    </div>
  );
}
```

---

## CONFIGURACIÓN RÁPIDA EN YAML (para usuarios avanzados)

Aunque el wizard hace todo automático, los archivos YAML son simples y autoexplicativos:

```yaml
# config/arcadecore.yaml
# Este archivo se genera automáticamente por el wizard
# Puedes editarlo a mano si quieres

app:
  language:  "es"
  theme:     "hyperspin-classic"
  first_run: false

kiosk:
  fullscreen: true
  hide_cursor: true
  operator_pin: "1234"    # Cambia esto
  autoboot: false         # true para gabinete

coins:
  default_mode: free      # free | coin | timer
  coin_key: "5"           # Tecla = insertar moneda

media:
  root: "./media"
  hyperspin_compat: true

systems:
  # Generado automáticamente — un item por sistema encontrado
  - name: snes
    enabled: true
    roms_path: "C:/ROMs/SNES"
    emulator: retroarch
    retroarch_core: snes9x_libretro
```

---

## MENSAJES DE ERROR EN LENGUAJE HUMANO

```rust
// En vez de: "SQLX Error: no such table: games"
// Mostrar:   "La base de datos no está inicializada. Haz clic para arreglar."

// En vez de: "Process exited with code -1073741515"
// Mostrar:   "El emulador se cerró inesperadamente. ¿Tienes los BIOS necesarios?"

fn humanize_error(err: &ArcadeError) -> String {
    match err {
        ArcadeError::EmulatorNotInstalled(name) =>
            format!("El emulador {} no está instalado. Haz clic para descargarlo.", name),

        ArcadeError::NoRomsPath(system) =>
            format!("No hay ROMs configuradas para {}. Ve a Configuración → Sistemas.", system),

        ArcadeError::ProcessSpawn(msg) if msg.contains("No such file") =>
            "El emulador no se encontró. Verifica la ruta en Configuración.".into(),

        ArcadeError::IncompatibleOS(msg) =>
            format!("Este emulador no es compatible con tu versión de Windows. {}", msg),

        _ => "Ocurrió un error. Revisa los logs en Configuración → Avanzado.".into(),
    }
}
```
