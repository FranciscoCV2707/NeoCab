# 🪟 ARCADECORE v3 — SOPORTE WINDOWS XP

> **Modo Legacy SDL2: La UI funciona en Windows XP SP2+ sin WebView2**

---

## REALIDAD TÉCNICA

```
WebView2 (usado por Tauri):  Mínimo Windows 7 SP1
Tauri 2.x:                   Mínimo Windows 7 SP1

ENTONCES: Para Windows XP necesitamos un renderizador diferente.
SOLUCIÓN:  ArcadeCore tiene DOS modos de UI:

  ┌─────────────────────────────────────────────────────┐
  │  MODO MODERNO  (Win7 → Win11, Linux, ARM)           │
  │  Tauri + React + WebView2                           │
  │  UI completa, temas animados, todo el HTML/CSS      │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  MODO LEGACY  (Windows XP SP2+, hardware viejo)     │
  │  SDL2 + OpenGL/Software renderer                    │
  │  Wheel HyperSpin-style renderizado nativo           │
  │  Sin WebView2, sin browser — solo Rust + SDL2       │
  └─────────────────────────────────────────────────────┘
```

ArcadeCore detecta automáticamente cuál modo usar al iniciar.

---

## REQUISITOS WINDOWS XP

```
OS:        Windows XP SP2 (5.1) o SP3 — x86 (32-bit)
           Windows XP SP2 (5.2) x64 también soportado
CPU:       Pentium III / AMD Athlon a 800MHz mínimo
RAM:       256MB (512MB recomendado)
GPU:       DirectX 8.1 / OpenGL 1.2 (prácticamente cualquier GPU del 2001+)
Disco:     50MB para app
DirectX:   8.1+ (viene incluido en XP SP2)

Herramientas desarrollo:
  Visual C++ 2013 Redistributable (el último que soporta XP)
  SDL2 2.0.x (bundled en ArcadeCore)
  → NO requiere WebView2
  → NO requiere .NET Framework
```

---

## COMPILAR PARA WINDOWS XP

### Target Rust para XP
```toml
# Cargo.toml — agregar feature "legacy"
[features]
default  = ["modern-ui"]
modern-ui = ["tauri"]      # Win7+ con Tauri
legacy-ui = ["sdl2-ui"]    # WinXP con SDL2 puro

[dependencies]
# Core (ambos modos)
sqlx       = { version = "0.7", features = ["sqlite", "runtime-tokio", "migrate"] }
tokio      = { version = "1.35", features = ["full"] }
serde      = { version = "1.0", features = ["derive"] }
serde_yaml = "0.9"
sdl2       = { version = "0.36", features = ["bundled", "static-link"] }
sdl2-sys   = "0.36"

# Solo modo moderno (Win7+)
tauri = { version = "2.0", optional = true }

# Solo modo legacy (XP compatible)
# sdl2-ui features se manejan con cfg
```

```bash
# Compilar para Windows XP x86:
rustup target add i686-pc-windows-msvc

# IMPORTANTE: Rust moderno (1.75+) ya no soporta WinXP por defecto
# Necesitas una versión de Rust más antigua para XP real:
# → Usar Rust 1.53 (última con soporte XP completo)
rustup toolchain install 1.53.0
rustup target add --toolchain 1.53.0 i686-pc-windows-msvc

# Compilar:
cargo +1.53.0 build --release \
  --target i686-pc-windows-msvc \
  --no-default-features \
  --features legacy-ui

# O con cargo-xwin para cross desde Linux:
cargo install cargo-xwin
cargo xwin build --release --target i686-pc-windows-msvc --no-default-features --features legacy-ui
```

### Flags especiales para XP en .cargo/config.toml
```toml
[target.i686-pc-windows-msvc]
rustflags = [
    "-C", "target-feature=+crt-static",
    # Mínimo compatibilidad Windows XP SP2
    "-C", "link-arg=/SUBSYSTEM:WINDOWS,5.01",
    # NOTA: 5.01 = XP x86, 5.02 = XP x64
]
```

---

## ARQUITECTURA MODO LEGACY (SDL2 puro)

```
WinXP Process:
  arcadecore_legacy.exe (i686, ~8MB)
    │
    ├── SDL2.dll (bundled, 2MB)
    ├── SDL2_image.dll (bundled)
    ├── SDL2_ttf.dll (bundled)
    │
    ├── arcadecore.db (SQLite)
    │
    └── BUCLE PRINCIPAL:
         sdl2::window → renderer (OpenGL/D3D8/Software)
           → SystemWheel renderer (PNG wheels)
           → GameList renderer
           → CoinDisplay
           → TimerOverlay
           → Keyboard virtual
```

---

## CÓDIGO: MODO LEGACY SDL2

```rust
// src/legacy/main_legacy.rs
// Este archivo SOLO se compila con feature "legacy-ui"
#![cfg(feature = "legacy-ui")]

use sdl2::event::Event;
use sdl2::keyboard::Keycode;
use sdl2::rect::Rect;
use sdl2::pixels::Color;
use sdl2::image::LoadTexture;
use sdl2::ttf::Font;
use std::time::Duration;

/// Estado de la UI en modo legacy
#[derive(Debug, Clone, PartialEq)]
enum AppState {
    SplashScreen,
    SystemWheel,          // Selección de sistema (carrusel horizontal)
    GameList,             // Lista de juegos (carrusel vertical)
    InGame,               // Juego corriendo (overlay mínimo)
    OperatorPin,          // Pantalla PIN operador
    OperatorMenu,         // Menú de operador
}

pub fn run_legacy() -> Result<(), Box<dyn std::error::Error>> {
    // Inicializar SDL2 (funciona en WinXP SP2+)
    let sdl_ctx   = sdl2::init()?;
    let video     = sdl_ctx.video()?;
    let ttf_ctx   = sdl2::ttf::init()?;
    let _img_ctx  = sdl2::image::init(sdl2::image::InitFlag::PNG | sdl2::image::InitFlag::JPG)?;

    // Ventana fullscreen adaptativa
    let display   = video.desktop_display_mode(0)?;
    let (w, h)    = (display.w as u32, display.h as u32);

    let window = video.window("ArcadeCore", w, h)
        .fullscreen_desktop()
        .opengl()
        .build()?;

    // Renderer — usa OpenGL si disponible, D3D si no, Software como fallback
    let mut canvas = window.into_canvas()
        .accelerated()   // Intenta GPU
        .build()
        .or_else(|_| {   // Fallback: software renderer (siempre funciona en XP)
            video.window("ArcadeCore", w, h)
                .fullscreen_desktop()
                .build()
                .unwrap()
                .into_canvas()
                .software()
                .build()
        })?;

    let texture_creator = canvas.texture_creator();
    let mut event_pump  = sdl_ctx.event_pump()?;

    // Fuente — XP compatible TTF
    let font_path = "assets/fonts/arcade.ttf";
    let font_large = ttf_ctx.load_font(font_path, 48)?;
    let font_med   = ttf_ctx.load_font(font_path, 28)?;
    let font_small = ttf_ctx.load_font(font_path, 18)?;

    // Estado inicial
    let mut state        = AppState::SplashScreen;
    let mut selected_sys = 0usize;
    let mut selected_game = 0usize;
    let mut splash_timer = std::time::Instant::now();

    // Cargar datos
    let systems = load_systems_from_db()?;
    let mut games: Vec<Game> = vec![];

    // Imágenes de sistemas (wheels HyperSpin-style)
    let sys_textures: Vec<_> = systems.iter().map(|s| {
        let path = format!("media/{}/wheel/{}.png", s.name, s.name);
        texture_creator.load_texture(&path)
            .unwrap_or_else(|_| make_text_texture(&texture_creator, &font_med, &s.display_name))
    }).collect();

    // FPS target
    let target_fps = Duration::from_millis(1000 / 60);

    'main: loop {
        let frame_start = std::time::Instant::now();

        // ── EVENTOS ───────────────────────────────────────────
        for event in event_pump.poll_iter() {
            match (&state, event) {
                (_, Event::Quit { .. }) => break 'main,

                // Escape → volver atrás
                (AppState::GameList, Event::KeyDown { keycode: Some(Keycode::Escape), .. }) => {
                    state = AppState::SystemWheel;
                }
                (AppState::InGame, Event::KeyDown { keycode: Some(Keycode::F10), .. }) => {
                    // F10 = volver al menú (matar emulador)
                    kill_current_game();
                    state = AppState::GameList;
                }

                // Navegación SystemWheel
                (AppState::SystemWheel, Event::KeyDown { keycode: Some(Keycode::Right), .. })
                | (AppState::SystemWheel, Event::KeyDown { keycode: Some(Keycode::Joystick0Button4), .. }) => {
                    selected_sys = (selected_sys + 1) % systems.len();
                }
                (AppState::SystemWheel, Event::KeyDown { keycode: Some(Keycode::Left), .. }) => {
                    selected_sys = selected_sys.saturating_sub(1);
                    if selected_sys == 0 { selected_sys = systems.len().saturating_sub(1); }
                }
                (AppState::SystemWheel, Event::KeyDown { keycode: Some(Keycode::Return), .. })
                | (AppState::SystemWheel, Event::KeyDown { keycode: Some(Keycode::Space), .. }) => {
                    // Entrar al sistema seleccionado
                    games = load_games_from_db(systems[selected_sys].id)?;
                    selected_game = 0;
                    state = AppState::GameList;
                }

                // Navegación GameList
                (AppState::GameList, Event::KeyDown { keycode: Some(Keycode::Down), .. }) => {
                    selected_game = (selected_game + 1).min(games.len().saturating_sub(1));
                }
                (AppState::GameList, Event::KeyDown { keycode: Some(Keycode::Up), .. }) => {
                    selected_game = selected_game.saturating_sub(1);
                }
                (AppState::GameList, Event::KeyDown { keycode: Some(Keycode::Return), .. }) => {
                    launch_game(&games[selected_game]);
                    state = AppState::InGame;
                }

                // PIN operador: Ctrl+O
                (_, Event::KeyDown { keycode: Some(Keycode::O), keymod, .. })
                    if keymod.contains(sdl2::keyboard::Mod::LCTRLMOD) =>
                {
                    state = AppState::OperatorPin;
                }

                // Insertar moneda: tecla 5
                (_, Event::KeyDown { keycode: Some(Keycode::Num5), .. }) => {
                    insert_coin();
                }

                _ => {}
            }
        }

        // ── SPLASH AUTO-ADVANCE ───────────────────────────────
        if state == AppState::SplashScreen && splash_timer.elapsed().as_secs() >= 3 {
            state = AppState::SystemWheel;
        }

        // ── RENDER ────────────────────────────────────────────
        canvas.set_draw_color(Color::RGB(0, 0, 0));
        canvas.clear();

        match state {
            AppState::SplashScreen =>
                render_splash(&mut canvas, &texture_creator, &font_large, w, h),

            AppState::SystemWheel =>
                render_system_wheel(&mut canvas, &sys_textures, &systems,
                                    selected_sys, w, h),

            AppState::GameList =>
                render_game_list(&mut canvas, &texture_creator, &font_med, &font_small,
                                 &games, selected_game, &systems[selected_sys], w, h),

            AppState::InGame =>
                render_ingame_overlay(&mut canvas, &font_small, w, h),

            AppState::OperatorPin =>
                render_operator_pin(&mut canvas, &font_large, w, h),

            _ => {}
        }

        canvas.present();

        // Cap FPS
        let elapsed = frame_start.elapsed();
        if elapsed < target_fps {
            std::thread::sleep(target_fps - elapsed);
        }
    }

    Ok(())
}
```

---

## RENDER: WHEEL ESTILO HYPERSPIN (SDL2)

```rust
/// Renderiza el carrusel horizontal de sistemas — idéntico a HyperSpin
fn render_system_wheel(
    canvas:       &mut sdl2::render::Canvas<sdl2::video::Window>,
    textures:     &[sdl2::render::Texture],
    systems:      &[System],
    selected:     usize,
    w:            u32,
    h:            u32,
) {
    let center_x = (w / 2) as i32;
    let center_y = (h / 2) as i32;

    // Fondo
    canvas.set_draw_color(sdl2::pixels::Color::RGB(10, 10, 20));
    canvas.clear();

    // Renderizar wheels en arco — mismo estilo que HyperSpin
    let visible = 7i32;  // 7 sistemas visibles a la vez
    let half    = visible / 2;

    for offset in -half..=half {
        let idx_raw = selected as i32 + offset;
        let idx     = ((idx_raw % systems.len() as i32 + systems.len() as i32)
                       % systems.len() as i32) as usize;

        let tex = &textures[idx];
        let q   = tex.query();

        // Posición en arco
        let frac    = offset as f32 / half as f32;       // -1.0 a 1.0
        let x       = center_x + (frac * w as f32 * 0.38) as i32;
        let y       = center_y + (frac.abs() * 80.0) as i32;  // Arco

        // Escala: el central es el más grande
        let scale   = 1.0 - frac.abs() * 0.45;
        let img_w   = (q.width  as f32 * scale * 0.55) as u32;
        let img_h   = (q.height as f32 * scale * 0.55) as u32;

        // Opacidad: el central es más brillante
        let alpha   = ((1.0 - frac.abs() * 0.5) * 255.0) as u8;
        tex.set_alpha_mod(alpha);

        let dst = Rect::new(x - img_w as i32 / 2, y - img_h as i32 / 2, img_w, img_h);
        canvas.copy(tex, None, dst).ok();
    }

    // Línea decorativa debajo del wheel (igual que HyperSpin)
    let line_y = center_y + 120;
    canvas.set_draw_color(sdl2::pixels::Color::RGBA(255, 165, 0, 180));
    for _ in 0..3 {
        canvas.draw_line((0, line_y), (w as i32, line_y)).ok();
    }
}

/// Renderiza lista vertical de juegos (carrusel)
fn render_game_list(
    canvas:   &mut sdl2::render::Canvas<sdl2::video::Window>,
    tc:       &sdl2::render::TextureCreator<sdl2::video::WindowContext>,
    font:     &sdl2::ttf::Font,
    font_sm:  &sdl2::ttf::Font,
    games:    &[Game],
    selected: usize,
    system:   &System,
    w:        u32,
    h:        u32,
) {
    // Panel izquierda: artwork del juego seleccionado
    let art_path = format!("media/{}/box/{}.png", system.name, games[selected].title);
    if let Ok(tex) = tc.load_texture(&art_path) {
        let q = tex.query();
        let art_w = (w / 3) as u32;
        let art_h = (art_w as f32 * q.height as f32 / q.width as f32) as u32;
        let art_rect = Rect::new(20, (h / 2 - art_h / 2) as i32, art_w, art_h);
        canvas.copy(&tex, None, art_rect).ok();
    }

    // Panel derecha: lista de juegos
    let list_x   = (w / 3 + 40) as i32;
    let list_w   = (w * 2 / 3 - 60) as u32;
    let item_h   = 48i32;
    let visible  = ((h as i32 - 100) / item_h) as usize;
    let start    = selected.saturating_sub(visible / 2);

    for (i, game) in games.iter().skip(start).take(visible).enumerate() {
        let actual_idx = start + i;
        let y          = 60 + i as i32 * item_h;
        let is_sel     = actual_idx == selected;

        // Resaltado del seleccionado
        if is_sel {
            canvas.set_draw_color(sdl2::pixels::Color::RGBA(255, 165, 0, 80));
            canvas.fill_rect(Rect::new(list_x - 10, y - 5, list_w + 20, item_h as u32 - 4)).ok();
        }

        // Texto del juego
        let color = if is_sel { sdl2::pixels::Color::RGB(255, 200, 0) }
                    else       { sdl2::pixels::Color::RGB(200, 200, 200) };

        draw_text(canvas, tc, font, &game.title, color, list_x, y);
    }

    // Nombre del sistema arriba
    draw_text(canvas, tc, font_sm, &system.display_name,
              sdl2::pixels::Color::RGB(150, 150, 150), list_x, 20);
}
```

---

## DETECCIÓN AUTOMÁTICA DEL MODO

```rust
// src/main.rs — Entry point unificado
fn main() {
    // Detectar si estamos en XP o en Win7+
    let use_legacy = should_use_legacy_mode();

    if use_legacy {
        // Modo SDL2 — funciona en WinXP
        #[cfg(feature = "legacy-ui")]
        arcadecore::legacy::run_legacy().expect("Legacy mode failed");

        #[cfg(not(feature = "legacy-ui"))]
        eprintln!("Legacy mode not compiled. Rebuild with --features legacy-ui");
    } else {
        // Modo Tauri — Win7+
        #[cfg(feature = "modern-ui")]
        arcadecore::tauri_app::run();
    }
}

fn should_use_legacy_mode() -> bool {
    // 1. Flag de línea de comandos
    if std::env::args().any(|a| a == "--legacy") { return true; }

    // 2. Archivo sentinel
    if std::path::Path::new("FORCE_LEGACY").exists() { return true; }

    // 3. Detección automática de Windows XP
    #[cfg(target_os = "windows")]
    {
        // Obtener versión de Windows
        let ver = get_windows_version_number();
        if ver.0 < 6 { return true; }  // Major < 6 = XP (5.1) o anterior
    }

    false
}

#[cfg(target_os = "windows")]
fn get_windows_version_number() -> (u32, u32) {
    // Usar RtlGetVersion para obtener versión real
    (6, 1) // placeholder — ver 00B_COMPATIBILIDAD_PLATAFORMAS.md
}
```

---

## EMULADORES COMPATIBLES CON WINDOWS XP

```
✅ FUNCIONAN EN XP:
  MAME 0.78 - 0.188 (versiones que soportan XP)
  AdvanceMAME (cualquier versión)
  GENS / Gens32 (Genesis)
  Snes9x 1.52 (última con XP)
  Project64 1.6.1 (N64)
  ePSXe 1.9.0 (última con XP)
  VBA 1.8 / VisualBoyAdvance (GBA)
  PCSX2 0.9.8 (PS2, requiere SSE2)
  PPSSPP 1.9.x (PSP, requiere SSE2)
  Dolphin 5.0 2016 (GameCube, requiere SSE2+)
  ScummVM 2.1.x (la mayoría)
  DOSBox 0.74-3
  WinUAE 3.x (Amiga)
  VICE 3.x (C64)
  Nestopia 1.40 (NES)
  FCEUltraX (NES)
  Stella 3.x (Atari 2600)
  RetroArch 1.7.x (última con XP)
  Mednafen 0.9.x

❌ NO FUNCIONAN EN XP:
  RetroArch 1.8+ (usa API Vista+)
  DuckStation (requiere Win7+)
  PCSX2 1.6+ (DirectX 11)
  RPCS3 (requiere Win8.1+)
  Yuzu / Ryujinx (requiere Win10+)
  Dolphin 5.0 2020+ (requiere Win7+)
  Cemu (requiere Win7+)
  Xenia (requiere Win8+)
  Vita3K (requiere Win10+)

⚠️ PARCIAL EN XP:
  PPSSPP (solo si CPU tiene SSE2 → Pentium 4+)
  Dolphin (solo si CPU tiene SSE2 + SSE3)
```

---

## CONFIGURAR XP EN systems.yaml

```yaml
# Emuladores específicos para Windows XP
emulators_xp:
  - name: mame_xp
    display_name: "MAME (XP compatible)"
    executable_win: "C:/MAME078/mame.exe"   # Versión 0.78 para XP
    min_os_win: "5.1"                        # Windows XP
    
  - name: snes9x_xp
    display_name: "Snes9x (XP)"
    executable_win: "C:/Snes9x/snes9x.exe"  # Versión 1.52
    min_os_win: "5.1"
    
  - name: retroarch_xp
    display_name: "RetroArch (XP)"
    executable_win: "C:/RetroArch17/retroarch.exe"  # 1.7.x para XP
    min_os_win: "5.1"
    args_template: "-L {core} {rom}"
    
  - name: epsxe_xp
    display_name: "ePSXe (PS1, XP)"
    executable_win: "C:/ePSXe/epsxe.exe"
    min_os_win: "5.1"
    args_template: "-bios bios/SCPH1001.BIN -nogui -fullscreen -loadiso {rom}"
```
