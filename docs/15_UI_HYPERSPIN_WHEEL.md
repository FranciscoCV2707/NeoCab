# 🎡 ARCADECORE v3 — UI ESTILO HYPERSPIN + MEDIA COMPATIBILITY

> **Wheel horizontal de sistemas → Wheel vertical de juegos. Compatible con artwork HyperSpin existente.**

---

## ESTRUCTURA VISUAL COMPLETA

```
╔══════════════════════════════════════════════════════════╗
║                    ARCADECORE UI                         ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║   [Fondo animado / video del sistema]                    ║
║                                                          ║
║   ◄  [SNK]  [MAME]  [►SNES◄]  [SEGA]  [PS1]  ►          ║
║           wheel.png  wheel.png wheel.png                 ║
║                                                          ║
║        ────────────────────────────────────              ║
║        SUPER NINTENDO ENTERTAINMENT SYSTEM               ║
║                                                          ║
║   [Coin: ●●○]  [Credits: 2]   [Timer: --:--]            ║
╚══════════════════════════════════════════════════════════╝

Al seleccionar sistema → GameList aparece:

╔══════════════════════════════════════════════════════════╗
║ [Artwork/Screenshot]  │  ▲                               ║
║                       │  Street Fighter Alpha 3          ║
║ [box art del juego]   │► Super Mario World              ║
║                       │  Super Metroid                   ║
║ [info del juego]      │  Donkey Kong Country             ║
║ Año: 1996             │  ▼                               ║
║ Jugadores: 2          │                                  ║
║ Género: Action        │ [wheel del juego: logo PNG]       ║
╚══════════════════════════════════════════════════════════╝
```

---

## ESTRUCTURA DE MEDIA (COMPATIBLE CON HYPERSPIN)

ArcadeCore usa **exactamente la misma estructura** de carpetas que HyperSpin.
Si ya tienes un HyperSpin setup, simplemente apunta ArcadeCore a la misma carpeta.

```
media/                           ← Carpeta raíz de media
│
├── MAME/                        ← Nombre del sistema (exacto)
│   ├── Images/
│   │   ├── Artwork 1/           ← Imágenes decorativas/bezel
│   │   ├── Artwork 2/
│   │   ├── Artwork 3/
│   │   ├── Artwork 4/
│   │   ├── Backgrounds/         ← Fondos del sistema/juego
│   │   ├── Boxes/               ← Cajas de juegos
│   │   ├── Cart Art/            ← Arte del cartucho
│   │   ├── Flyers/              ← Flyers arcade
│   │   ├── Game Logos/          ← Logos de juegos (wheel images)
│   │   ├── Marquees/            ← Marquesinas arcade
│   │   ├── Screenshots/         ← Capturas de pantalla
│   │   ├── Snap/                ← Snaps (mismo que screenshots, alias)
│   │   ├── Wheel/               ← ★ WHEEL IMAGES (logo del juego en PNG)
│   │   └── 3D Boxes/            ← Cajas 3D
│   │
│   ├── Video/                   ← Videos de preview
│   │   └── pacman.mp4 (o .flv)
│   │
│   └── Themes/                  ← Temas HyperSpin (.zip con SWF o HTML)
│
├── Main Menu/                   ← Sistema "menú principal"
│   └── Images/
│       └── Wheel/
│           ├── MAME.png         ← Logo del sistema MAME
│           ├── Super Nintendo.png
│           ├── PlayStation.png
│           └── ...
│
├── Super Nintendo Entertainment System/
│   └── Images/
│       └── Wheel/
│           ├── Super Mario World.png
│           ├── Street Fighter Alpha 3.png
│           └── ...
│
└── Sega Genesis/
    └── Images/
        └── Wheel/
            └── ...
```

### Alternativa: Estructura simplificada
Si no tienes media HyperSpin, ArcadeCore también acepta:
```
media/
├── systems/
│   ├── mame.png           ← Logo sistema
│   ├── snes.png
│   └── ...
└── games/
    └── snes/
        ├── super-mario-world.png    ← Wheel del juego
        ├── street-fighter.png
        └── ...
```

---

## CONFIGURACIÓN DE MEDIA EN YAML

```yaml
# config/media.yaml
media:
  # Ruta raíz de media (puede ser tu carpeta HyperSpin existente)
  root_path: "./media"
  
  # Si usas estructura HyperSpin legacy:
  hyperspin_compat: true
  hyperspin_path: "C:/HyperSpin/Media"   # Apuntar directo a tu HyperSpin
  
  # Resolución objetivo para wheels
  wheel_width:  400
  wheel_height: 150
  
  # Fallback si no hay imagen: generar texto
  text_fallback: true
  text_fallback_font: "assets/fonts/arcade.ttf"
  
  # Videos de preview (reproducir al seleccionar)
  video_preview: true
  video_preview_delay_ms: 1500    # Esperar 1.5s antes de reproducir
  video_preview_volume: 0.3
  
  # Animaciones
  wheel_animation: "spin"         # "spin", "slide", "fade"
  wheel_animation_speed_ms: 250
  
  # Fondo
  background_mode: "system"      # "system" (por sistema) | "static" | "video"
  background_blur: false
  background_dimm: 0.4            # Oscurecer fondo 40%

systems:
  # Cada sistema puede tener su propio media path
  mame:
    media_name: "MAME"            # Nombre carpeta en /media/
    background: "media/MAME/Images/Backgrounds/main.jpg"
    wheel_image: "media/Main Menu/Images/Wheel/MAME.png"
    
  snes:
    media_name: "Super Nintendo Entertainment System"
    background: "media/Super Nintendo/Images/Backgrounds/main.jpg"
    wheel_image: "media/Main Menu/Images/Wheel/Super Nintendo.png"
```

---

## COMPONENTE REACT: SYSTEM WHEEL

```tsx
// src/components/SystemWheel.tsx
import { useState, useEffect, useRef } from "react";
import styles from "./SystemWheel.module.css";

interface System {
  id: number;
  name: string;
  display_name: string;
  wheel_image: string;
  background: string;
}

interface Props {
  systems: System[];
  onSelect: (system: System) => void;
}

export function SystemWheel({ systems, onSelect }: Props) {
  const [selected, setSelected] = useState(0);
  const [animOffset, setAnimOffset] = useState(0);
  const animRef = useRef<number>(0);

  // Animación suave del scroll
  const scrollTo = (newIdx: number) => {
    const prev = selected;
    setSelected(newIdx);
    // Animar el offset
    animRef.current = prev;
    const diff = newIdx - prev;
    let frame = 0;
    const totalFrames = 15;
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setAnimOffset((1 - ease) * diff);
      if (frame < totalFrames) requestAnimationFrame(animate);
      else setAnimOffset(0);
    };
    requestAnimationFrame(animate);
  };

  // Teclado / controles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d") {
        scrollTo((selected + 1) % systems.length);
      } else if (e.key === "ArrowLeft" || e.key === "a") {
        scrollTo((selected - 1 + systems.length) % systems.length);
      } else if (e.key === "Enter" || e.key === " ") {
        onSelect(systems[selected]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, systems]);

  // Renderizar items visibles (7: 3 izquierda, central, 3 derecha)
  const visible = 7;
  const half    = Math.floor(visible / 2);

  return (
    <div className={styles.wheelContainer}>
      {/* Fondo del sistema seleccionado */}
      <div
        className={styles.background}
        style={{ backgroundImage: `url(${systems[selected]?.background})` }}
      />

      {/* Wheel de sistemas */}
      <div className={styles.wheel}>
        {Array.from({ length: visible }, (_, i) => {
          const offset  = i - half + animOffset;
          const rawIdx  = selected + i - half;
          const idx     = ((rawIdx % systems.length) + systems.length) % systems.length;
          const sys     = systems[idx];
          const isCenter = i === half;

          return (
            <WheelItem
              key={sys.id}
              system={sys}
              offset={offset}
              isCenter={isCenter}
              totalItems={visible}
              onClick={() => isCenter ? onSelect(sys) : scrollTo(idx)}
            />
          );
        })}
      </div>

      {/* Nombre del sistema seleccionado */}
      <div className={styles.systemName}>
        {systems[selected]?.display_name}
      </div>

      {/* Línea decorativa */}
      <div className={styles.decorLine} />
    </div>
  );
}

function WheelItem({ system, offset, isCenter, totalItems, onClick }: {
  system: System;
  offset: number;
  isCenter: boolean;
  totalItems: number;
  onClick: () => void;
}) {
  const half    = Math.floor(totalItems / 2);
  const frac    = offset / half;               // -1 a 1
  const absF    = Math.abs(frac);

  // Posición: arco horizontal
  const x       = frac * 38;                  // % desde centro
  const y       = absF * 8;                   // % bajada en arco
  const scale   = 1 - absF * 0.45;           // El central es más grande
  const opacity = 1 - absF * 0.5;            // El central es más brillante
  const zIndex  = Math.round((1 - absF) * 10);

  return (
    <div
      className={`${styles.wheelItem} ${isCenter ? styles.center : ""}`}
      style={{
        transform: `translate(-50%, -50%) translateX(${x}vw) translateY(${y}vh) scale(${scale})`,
        opacity,
        zIndex,
        left: "50%",
        top: "50%",
      }}
      onClick={onClick}
    >
      <img
        src={system.wheel_image}
        alt={system.display_name}
        className={styles.wheelImage}
        onError={(e) => {
          // Fallback a texto si no hay imagen
          (e.target as HTMLImageElement).style.display = "none";
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove(styles.hidden);
        }}
      />
      <span className={`${styles.wheelText} ${styles.hidden}`}>
        {system.display_name}
      </span>
    </div>
  );
}
```

```css
/* src/components/SystemWheel.module.css */
.wheelContainer {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(4px) brightness(0.4);
  transition: background-image 0.5s ease;
}

.wheel {
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheelItem {
  position: absolute;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity  0.25s ease;
}

.wheelImage {
  height: 120px;
  max-width: 400px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.8));
  transition: filter 0.25s ease;
}

.center .wheelImage {
  filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.6))
          drop-shadow(0 4px 12px rgba(0,0,0,0.8));
}

.wheelText {
  color: white;
  font-family: "ArcadeFont", sans-serif;
  font-size: 1.5rem;
  text-shadow: 0 0 10px rgba(255, 165, 0, 0.8);
  white-space: nowrap;
}

.systemName {
  position: relative;
  margin-top: 30px;
  color: white;
  font-family: "ArcadeFont", sans-serif;
  font-size: 1.2rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.8;
}

.decorLine {
  position: relative;
  width: 80%;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 165, 0, 0.8),
    transparent
  );
  margin-top: 10px;
}

.hidden { display: none; }
```

---

## COMPONENTE REACT: GAME LIST (vertical)

```tsx
// src/components/GameList.tsx
import { useState, useEffect, useRef } from "react";
import styles from "./GameList.module.css";

interface Game {
  id: number;
  title: string;
  year?: number;
  players?: number;
  genre?: string;
  wheel_image?: string;
  box_art?: string;
  screenshot?: string;
  video_path?: string;
  rating: number;
}

interface Props {
  games: Game[];
  system: { display_name: string; name: string };
  onLaunch: (game: Game) => void;
  onBack: () => void;
}

export function GameList({ games, system, onLaunch, onBack }: Props) {
  const [selected, setSelected] = useState(0);
  const [search, setSearch]     = useState("");
  const [videoReady, setVideoReady] = useState(false);
  const videoTimer = useRef<ReturnType<typeof setTimeout>>();

  const filtered = games.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  // Preview del juego: cargar video/art después de 1.5s
  useEffect(() => {
    setVideoReady(false);
    clearTimeout(videoTimer.current);
    videoTimer.current = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(videoTimer.current);
  }, [selected]);

  // Navegación
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":  case "s":
          setSelected(i => Math.min(i + 1, filtered.length - 1)); break;
        case "ArrowUp":    case "w":
          setSelected(i => Math.max(i - 1, 0)); break;
        case "Enter":
          if (filtered[selected]) onLaunch(filtered[selected]); break;
        case "Escape":     case "Backspace":
          onBack(); break;
        // Búsqueda rápida: cualquier letra
        default:
          if (e.key.length === 1 && !e.ctrlKey) {
            setSearch(s => s + e.key);
            setSelected(0);
          }
          if (e.key === "Backspace") setSearch(s => s.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, filtered]);

  const current = filtered[selected];
  const VISIBLE = 12;
  const start   = Math.max(0, selected - Math.floor(VISIBLE / 2));

  return (
    <div className={styles.gameList}>
      {/* Panel izquierda: media del juego */}
      <div className={styles.mediaPanel}>
        {videoReady && current?.video_path ? (
          <video
            key={current.id}
            src={current.video_path}
            autoPlay muted loop
            className={styles.previewVideo}
          />
        ) : (
          <img
            src={current?.box_art || current?.screenshot || "assets/no-art.png"}
            alt={current?.title}
            className={styles.boxArt}
          />
        )}

        {/* Info del juego */}
        {current && (
          <div className={styles.gameInfo}>
            {current.year     && <span>📅 {current.year}</span>}
            {current.players  && <span>👥 {current.players}P</span>}
            {current.genre    && <span>🎮 {current.genre}</span>}
            {current.rating > 0 && <span>⭐ {current.rating.toFixed(1)}</span>}
          </div>
        )}
      </div>

      {/* Panel derecha: lista de juegos */}
      <div className={styles.listPanel}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.systemTitle}>{system.display_name}</span>
          <span className={styles.gameCount}>{filtered.length} juegos</span>
        </div>

        {/* Búsqueda activa */}
        {search && (
          <div className={styles.searchBar}>
            🔍 {search}
            <button onClick={() => setSearch("")}>✕</button>
          </div>
        )}

        {/* Lista */}
        <div className={styles.list}>
          {filtered.slice(start, start + VISIBLE).map((game, i) => {
            const idx     = start + i;
            const isSel   = idx === selected;
            return (
              <div
                key={game.id}
                className={`${styles.gameItem} ${isSel ? styles.selected : ""}`}
                onClick={() => { setSelected(idx); if (isSel) onLaunch(game); }}
              >
                {/* Wheel image del juego */}
                {game.wheel_image && (
                  <img src={game.wheel_image} alt="" className={styles.gameWheel} />
                )}
                <span className={styles.gameTitle}>{game.title}</span>
                {isSel && <span className={styles.arrow}>▶</span>}
              </div>
            );
          })}
        </div>

        {/* Instrucciones */}
        <div className={styles.instructions}>
          ↑↓ Navegar &nbsp; ENTER Jugar &nbsp; ESC Volver &nbsp; Letras Buscar
        </div>
      </div>
    </div>
  );
}
```

---

## ESTRUCTURA COMPLETA DE TEMAS

```
src/themes/
├── hyperspin-classic/           ← Réplica del estilo HyperSpin original
│   ├── theme.yaml               ← Configuración del tema
│   ├── fonts/
│   │   └── arcade.ttf
│   ├── images/
│   │   ├── bg_overlay.png
│   │   └── coin_icon.png
│   └── theme.css
│
├── dark-neon/                   ← Estilo moderno oscuro neón
├── crt-retro/                   ← Simulación CRT vintage
├── grid-modern/                 ← Grid estilo Steam / EmulationStation
└── minimal/                     ← Minimalista, máxima velocidad
```

```yaml
# src/themes/hyperspin-classic/theme.yaml
name: "HyperSpin Classic"
version: "1.0"
author: "ArcadeCore"

colors:
  background:    "#000000"
  text_primary:  "#FFFFFF"
  text_selected: "#FFA500"
  accent:        "#FFA500"
  overlay_bg:    "rgba(0,0,0,0.7)"

wheel:
  orientation: "horizontal"    # "horizontal" para sistemas
  items_visible: 7
  center_scale:  1.0
  side_scale:    0.55
  arc_depth:     80            # px que bajan los lados
  animation: "ease-out"
  animation_ms: 200
  image_height: 120            # px height de las wheel images

game_list:
  orientation: "vertical"     # "vertical" para juegos dentro de sistema
  items_visible: 12
  show_box_art: true
  show_video_preview: true
  video_delay_ms: 1500
  show_game_info: true

font:
  family: "ArcadeFont"
  sizes: { large: 48, medium: 28, small: 18 }

animations:
  transition: "fade"           # "fade", "slide", "zoom"
  transition_ms: 300
```

---

## COMPATIBILIDAD CON MEDIA EXISTENTE

### Scrapers automáticos de media

```rust
// src-tauri/src/scrapers/media_scraper.rs
pub async fn scrape_media_for_game(
    game: &Game,
    system: &System,
    config: &MediaConfig,
) -> MediaResult {
    // 1. Buscar localmente primero (HyperSpin existente)
    let local = find_local_media(game, system, config);
    if local.is_complete() { return local; }

    // 2. ScreenScraper (mejor base de datos de media arcade)
    if let Ok(media) = screenscraper::fetch(game, system).await {
        save_media(&media, game, system, config).await;
        return media;
    }

    // 3. TheGamesDB
    if let Ok(media) = thegamesdb::fetch(game, system).await {
        save_media(&media, game, system, config).await;
        return media;
    }

    // 4. IGDB (para juegos modernos)
    if let Ok(media) = igdb::fetch(game, system).await {
        save_media(&media, game, system, config).await;
        return media;
    }

    // 5. Fallback: generar texto/placeholder
    MediaResult::text_only(&game.title)
}

/// Buscar media local (compatible con estructura HyperSpin)
fn find_local_media(game: &Game, system: &System, cfg: &MediaConfig) -> MediaResult {
    let sys_name = &system.media_name;   // Nombre exacto de carpeta
    let title    = &game.title;

    let base = std::path::Path::new(&cfg.root_path);

    // Rutas HyperSpin
    let wheel_hs  = base.join(sys_name).join("Images").join("Wheel").join(format!("{title}.png"));
    let box_hs    = base.join(sys_name).join("Images").join("Boxes").join(format!("{title}.png"));
    let snap_hs   = base.join(sys_name).join("Images").join("Snap").join(format!("{title}.png"));
    let video_hs  = base.join(sys_name).join("Video").join(format!("{title}.mp4"));

    // Rutas ArcadeCore nativas
    let wheel_ac  = base.join("games").join(&system.name).join(format!("{title}.png"));

    MediaResult {
        wheel:      first_existing(&[&wheel_hs, &wheel_ac]).map(|p| p.to_string_lossy().to_string()),
        box_art:    first_existing(&[&box_hs]).map(|p| p.to_string_lossy().to_string()),
        screenshot: first_existing(&[&snap_hs]).map(|p| p.to_string_lossy().to_string()),
        video:      first_existing(&[&video_hs]).map(|p| p.to_string_lossy().to_string()),
    }
}

fn first_existing(paths: &[&std::path::Path]) -> Option<std::path::PathBuf> {
    paths.iter().find(|p| p.exists()).map(|p| p.to_path_buf())
}
```
