# NeoCab Studio — Documentación Técnica v1.4

**NeoCab Studio** es el entorno de personalización visual integrado. Permite diseñar la interfaz del gabinete de dos formas:

1. **Editor de atributos** (ThemeEditor): colores, fuentes, efectos, fondo, layout y sonidos desde el panel lateral del Operator Panel.
2. **Editor Visual de Layout** (LayoutEditor): canvas drag-and-drop donde se posicionan widgets libremente, como en HyperTheme.

Ambos escriben al mismo `theme.json` — son capas complementarias, no excluyentes.

---

## Estructura del paquete de tema

```
mi-tema/
  theme.json     — configuración completa (colores, layout, screens, efectos…)
  theme.css      — CSS libre: @keyframes, overrides, animaciones propias
  theme.js       — Hooks JS: onMount, onNavigate, onSelect…
  preview.png    — captura 1280×720 (se muestra en galería)
  README.md      — descripción y créditos
  metadata.json  — {"is_custom": true}  (marca como tema del usuario)
  assets/
    bg.jpg          — imagen de fondo opcional
    nav.wav         — sonido de navegación opcional
    systems/
      mame.png      — logo PNG para el widget system-logo
      nes.png
      snes.png
```

---

## `theme.json` — Schema completo

```jsonc
{
  "name": "Mi Tema",
  "version": "1.0.0",
  "author": "Tu nombre",
  "style": "custom",           // arcade | neon | crt | minimal | cyberpunk | custom
  "description": "Descripción",

  "colors": {
    "primary": "#ff6b00",
    "secondary": "#1a1a1a",
    "accent": "#00ffcc",
    "text": "#ffffff",
    "background": "#0a0a0a",
    "surface": "#1a1a1a",
    "border": "#ff6b00",
    "highlight": "#ff8c00",
    "success": "#00c853",
    "warning": "#ffcc00",
    "error": "#ff1744"
  },

  "fonts": {
    "ui": "Arial",
    "title": "Impact",
    "subtitle": "Arial",
    "mono": "Consolas",
    "google_font": "Press Start 2P"   // nombre de Google Font a cargar
  },

  "background": {
    "type": "color",                  // color | gradient | image | video
    "color": "#0a0a0a",
    "gradient": null,                 // "linear-gradient(135deg, #0a0a0a, #1a0a2e)"
    "image": null,                    // "assets/bg.jpg"
    "video": null,
    "opacity": 1.0,
    "blur": 0,
    "overlay_color": null             // "#00000066" — overlay semitransparente
  },

  "layout": {
    "system_view": "carousel",        // carousel | grid | list
    "game_view": "split",             // split | full | compact
    "wheel_style": "3d",
    "transition": "slide",
    "animation_speed": 300,
    "easing": "easeOutCubic"
  },

  "wheel": {
    "item_size": 120,
    "item_spacing": 15,
    "animation_duration": 300,
    "selected_color": "#ff6b00",
    "unselected_color": "#444444",
    "selected_scale": 1.15,
    "glow_selected": true
  },

  "effects": {
    "scanlines": false,
    "crt_curve": 0.0,
    "glow_intensity": 0.5,
    "shadow_enabled": true,
    "vignette": 0.0,
    "noise": 0.0,
    "blur_unselected": 0
  },

  "overlay": {
    "coin_position": "top-right",
    "timer_position": "bottom-right",
    "stats_opacity": 0.8,
    "animation_style": "smooth"
  },

  "media": {
    "video_enabled": true,
    "video_loop": true,
    "snap_type": "video",
    "marquee_enabled": true,
    "wheel_enabled": true,
    "box_art_enabled": true
  },

  "sounds": {
    "navigate": "nav.wav",
    "select": "select.wav",
    "back": "back.wav",
    "coin": "coin.wav",
    "start": "start.wav"
  },

  // --- WIDGET LAYOUT (v1.4) ---
  "screens": {
    "systems": {
      "widgets": [
        { "id": "bg",      "type": "background",  "x": 0,  "y": 0,  "w": 100, "h": 100, "z": 0, "visible": true, "config": {} },
        { "id": "wheel",   "type": "system-wheel", "x": 10, "y": 5,  "w": 80,  "h": 60,  "z": 1, "visible": true, "config": { "style": "carousel" } },
        { "id": "logo",    "type": "system-logo",  "x": 35, "y": 70, "w": 30,  "h": 20,  "z": 2, "visible": true, "config": { "use_png": false, "fallback": "initial" } },
        { "id": "clock",   "type": "clock",         "x": 82, "y": 2,  "w": 16,  "h": 7,   "z": 3, "visible": true, "config": {} },
        { "id": "credits", "type": "credits",       "x": 2,  "y": 2,  "w": 16,  "h": 7,   "z": 3, "visible": true, "config": {} }
      ]
    }
  }
}
```

Si `screens` está ausente, NeoCab usa el renderer clásico (backward-compatible).

---

## Widget Types

| type | Descripción | Config |
|---|---|---|
| `background` | Fondo — usa colores/imagen del tema | — |
| `system-wheel` | Rueda de sistemas (carousel/grid/list) | `style: "carousel"\|"grid"\|"list"` |
| `system-logo` | Logo PNG o inicial del sistema activo | `use_png: bool`, `fallback: "initial"\|"text"` |
| `game-list` | Lista de juegos | — *(activo en games screen)* |
| `game-preview` | Video/imagen preview del juego | — *(activo en games screen)* |
| `game-info` | Info del juego (título, developer, tags) | — *(activo en games screen)* |
| `clock` | Reloj HH:MM | — |
| `credits` | Contador de créditos/monedas | — |
| `session-timer` | Temporizador de sesión activa | — |
| `text-label` | Texto libre con fuente y color propios | `text`, `font: "ui"\|"title"\|"mono"`, `size`, `color` |
| `image` | Imagen estática | `src: string`, `fit: "contain"\|"cover"\|"fill"` |

Posición y tamaño en porcentaje (0–100) — se escalan a cualquier resolución.

---

## Theme SDK — `theme.css`

El archivo `theme.css` se inyecta en el DOM usando un blob URL (CSP-safe). Tiene acceso a todas las CSS vars del tema y a las clases del DOM estable:

```css
/* Variables disponibles */
:root {
  --primary, --secondary, --accent, --text, --background, --surface,
  --border, --highlight, --success, --warning, --error,
  --font-ui, --font-title, --font-mono,
  --animation-speed, --glow-intensity, --vignette, --blur-unselected,
  --wheel-item-size, --wheel-spacing, --wheel-selected-scale,
  --platform-primary, --platform-secondary
}

/* Clases DOM estables */
.system-card           { /* card de sistema en carousel */ }
.system-card.focused   { /* card seleccionada */ }
.system-card.hidden    { /* cards fuera de foco */ }
.systems-carousel      { /* contenedor del carrusel */ }
.systems-grid          { /* contenedor cuadrícula */ }
.systems-list          { /* contenedor lista */ }
.system-header         { /* barra superior */ }
.card-focus-ring       { /* anillo animado del foco */ }

/* Atributos en :root */
[data-system-view="carousel"]
[data-system-view="grid"]
[data-system-view="list"]
[data-game-view="split"]
[data-theme-style="arcade"]
[data-platform-theme="mame"]

/* Ejemplo: animación propia */
@keyframes mi-entrada {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.system-card.focused {
  animation: mi-entrada 0.3s ease;
}
```

---

## Theme SDK — `theme.js`

El archivo `theme.js` es un ES module inyectado vía blob URL. Exporta hooks opcionales:

```js
// window.NeoCabAPI disponible en onMount
export function onMount(api) {
  console.log('Tema montado — vista:', api.getCurrentView());
  api.setCssVar('--theme-glow-color', '#ff00ff'); // solo --theme-* permitido
}

export function onNavigate({ direction, fromIndex, toIndex, view }) {
  // se dispara en cada movimiento de la rueda
}

export function onViewChange({ from, to }) {
  // "menu" → "systems" → "games"
  document.documentElement.setAttribute('data-transition', `${from}-to-${to}`);
}

export function onFocus({ item, index, view }) {
  // item seleccionado cambió
}

export function onSelect({ item, view }) {
  // usuario confirmó selección
}

export function onBack({ fromView }) {
  // usuario presionó back
}

export function onUnmount() {
  // limpiar listeners, intervalos, etc.
}
```

### NeoCabAPI

```ts
api.version                   // "2.0.0"
api.getCurrentView()          // "menu" | "systems" | "games"
api.getFocusedIndex()         // número del item enfocado
api.getCurrentSystem()        // objeto sistema activo, o null
api.getSystemCards()          // NodeList de .system-card elements
api.getCssVar('--primary')    // leer CSS custom property
api.setCssVar('--theme-color', '#fff')  // escribir (solo --theme-* prefix)
```

### Eventos del documento

```js
document.addEventListener('neocab:navigate', e => {
  const { direction, fromIndex, toIndex, view } = e.detail;
});
document.addEventListener('neocab:viewchange', e => {
  const { from, to } = e.detail;
});
document.addEventListener('neocab:focus', e => {
  const { item, index, view } = e.detail;
});
document.addEventListener('neocab:select', e => {
  const { item, view } = e.detail;
});
document.addEventListener('neocab:back', e => {
  const { fromView } = e.detail;
});
```

---

## Editor Visual de Layout

Acceso: **ThemeEditor → "Editor Visual ✦"**

### Zonas del editor

**Palette (izquierda)** — Clic en un tipo de widget para añadirlo al canvas en posición centrada con tamaño por defecto.

**Canvas (centro)** — Área escalada al aspect ratio de la resolución elegida.
- Arrastra un widget para moverlo
- Handle esquina inferior-derecha para redimensionar
- Clic fuera de todo para deseleccionar
- `Delete` para eliminar widget seleccionado

**Properties (derecha)** — Cuando hay widget seleccionado:
- X, Y, W, H en % con botones ±0.5
- Z-index (capa)
- Toggle visible/oculto
- Config específica del tipo

**Resoluciones disponibles:** 1920×1080, 1280×720, 2560×1440, 1080×1920 (vertical)

**Pantallas:** Sistemas / Juegos / Menú (cada una tiene su propio array de widgets)

**"Aplicar al tema"** → actualiza `theme.screens` en el ThemeEditor. Luego "Guardar y Aplicar" persiste en `theme.json`.

---

## Flujo de creación de un tema propio

1. **ThemeEditor → "Nueva plantilla"** → introduce nombre → se crea carpeta en `themes/{slug}/` con `theme.json`, `theme.css`, `theme.js`, `metadata.json`
2. **"Abrir carpeta"** → se abre en el explorador de archivos
3. Edita `theme.css` y `theme.js` en tu editor preferido (o pide a una IA que los genere)
4. Regresa a NeoCab → el tema aparece en **"Mis Temas"**
5. Cárgalo → **"Editor Visual"** para ajustar el layout drag-and-drop
6. **"Guardar y Aplicar"** → el tema está activo

Para importar un tema de la comunidad: **"Importar carpeta"** → pega la ruta de la carpeta del tema (debe contener `theme.json`).

---

## Archivos implementados (v1.4)

| Archivo | Rol |
|---|---|
| `src/types/layout.ts` | Tipos Widget, ScreenLayout, ThemeScreens, WidgetType |
| `src/components/ScreenRenderer.tsx` | Renderer runtime de widgets |
| `src/components/studio/LayoutEditor.tsx` | Canvas drag-and-drop |
| `src/components/studio/ThemeEditor.tsx` | Editor de atributos + integración SDK |
| `src/components/studio/ThemeSDKManual.tsx` | Modal de referencia del SDK |
| `src/components/studio/ThemeAIHelper.tsx` | Asistente para generar temas con IA |
| `src/theme/themePlugin.ts` | Carga/descarga CSS+JS via blob URLs |
| `src/theme/themeEvents.ts` | Dispatcher de eventos neocab:* |
| `src/theme/neoCabApi.ts` | Implementación de window.NeoCabAPI |
| `src/stores/useThemeStore.ts` | Estado global + injectThemeCss |
| `src-tauri/src/commands/theme_path.rs` | create_from_template, open_folder, import_folder |
| `src-tauri/src/core/theme_manager.rs` | list_themes con is_custom, get_themes_dir |
| `src-tauri/bundled-themes/*/` | 5 temas incluidos con CSS + JS propios |
