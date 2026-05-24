import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

const CSS_VARS = `/* Colores */
--primary         Color principal (selección, botones primarios)
--secondary       Color secundario / fondos alternativos
--accent          Color de acento (highlights, íconos)
--text            Color de texto general
--background      Fondo de la pantalla
--surface         Fondo de paneles / cards
--border          Color de bordes
--highlight       Tono brillante del primary
--success         Verde de confirmación
--warning         Amarillo de advertencia
--error           Rojo de error
--platform-primary   Acento de la plataforma activa
--platform-secondary Fondo de plataforma activa

/* Tipografía */
--font-ui         Fuente de la interfaz
--font-title      Fuente de títulos grandes
--font-mono       Fuente monoespaciada
--font-google     Nombre de Google Font cargada

/* Animaciones */
--animation-speed   Duración de transiciones (ej: 300ms)
--easing            Curva de animación (ej: easeOutCubic)

/* Efectos */
--glow-intensity    Intensidad del glow (0.0 - 1.0)
--crt-curve         Curvatura CRT (0.0 - 1.0)
--vignette          Viñeta oscura en bordes (0.0 - 1.0)
--noise-opacity     Grano de película (0.0 - 0.2)
--blur-unselected   Blur en items no seleccionados (px)

/* Fondo */
--bg-color          Color sólido de fondo
--bg-gradient       Gradiente CSS de fondo
--bg-image          URL de imagen de fondo
--bg-blur           Blur del fondo (px)
--bg-overlay        Color overlay semitransparente

/* Wheel */
--wheel-item-size        Tamaño de card (px)
--wheel-spacing          Separación entre cards (px)
--wheel-selected-color   Color del item seleccionado
--wheel-unselected-color Color de items no seleccionados
--wheel-selected-scale   Escala del seleccionado (ej: 1.15)
--wheel-anim-duration    Duración animación del wheel (ms)`;

const DOM_CLASSES = `.system-card             Card de un sistema (todos los modos)
.system-card.focused     Card actualmente seleccionada
.system-card.visible     Cards visibles (cercanas al foco)
.system-card.hidden      Cards ocultas (lejos del foco)
.systems-carousel        Contenedor del carrusel
.systems-grid            Contenedor de la cuadrícula
.systems-list            Contenedor del listado
.system-header           Barra superior
.system-ambient          Fondo de gradiente ambiental
.card-focus-ring         Anillo de foco animado
[data-system-view]       En :root — "carousel" | "grid" | "list"
[data-game-view]         En :root — "split" | "full" | "compact"
[data-theme-style]       En :root — "arcade" | "neon" | "crt" etc.
[data-platform-theme]    En :root — nombre del sistema activo
[data-transition]        En :root — "systems-to-games" (set por theme.js)`;

const EVENTS = `/* Escuchar en document.addEventListener(name, e => {...}) */

neocab:navigate
  e.detail: { direction: "up"|"down"|"left"|"right", fromIndex, toIndex, view }

neocab:viewchange
  e.detail: { from: "menu"|"systems"|"games", to: "menu"|"systems"|"games" }

neocab:focus
  e.detail: { item: object, index: number, view: "systems"|"games" }

neocab:select
  e.detail: { item: object, view: "systems"|"games" }

neocab:back
  e.detail: { fromView: "systems"|"games" }`;

const API_METHODS = `/* window.NeoCabAPI — disponible desde onMount(api) */

api.version                   "2.0.0"
api.getCurrentView()          "menu" | "systems" | "games" | ...
api.getFocusedIndex()         número del item enfocado
api.getCurrentSystem()        objeto sistema activo, o null
api.getSystemCards()          NodeList de .system-card elements
api.getCssVar(name)           leer CSS custom property
api.setCssVar(name, value)    escribir var (SOLO prefijo --theme-*)

/* Ejemplo de uso: */
export function onMount(api) {
  api.setCssVar('--theme-glow-color', '#ff00ff');
  const view = api.getCurrentView();
  console.log('Vista actual:', view);
}`;

const SECTIONS = [
  { title: 'Variables CSS', content: CSS_VARS, lang: 'css' },
  { title: 'Clases DOM estables', content: DOM_CLASSES, lang: 'css' },
  { title: 'Eventos del documento', content: EVENTS, lang: 'js' },
  { title: 'window.NeoCabAPI', content: API_METHODS, lang: 'js' },
];

export const ThemeSDKManual: React.FC<Props> = ({ onClose }) => {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copySection = async (idx: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#0d0d1a', border: '1px solid #444', borderRadius: 10, width: 640, maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#eee' }}>Manual del SDK de Temas</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          <p style={{ color: '#888', fontSize: 12, margin: '0 18px 12px', lineHeight: 1.6 }}>
            Cada tema puede incluir <code style={{ color: '#7c3aed' }}>theme.css</code> y <code style={{ color: '#7c3aed' }}>theme.js</code> en su carpeta.
            Usa las variables y clases de abajo para crear animaciones y comportamientos completamente propios.
          </p>

          {SECTIONS.map((sec, idx) => (
            <div key={sec.title} style={{ borderBottom: '1px solid #222' }}>
              <button
                onClick={() => setOpenSection(openSection === idx ? null : idx)}
                style={{ width: '100%', padding: '10px 18px', background: 'none', border: 'none', color: openSection === idx ? '#c084fc' : '#ccc', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600 }}
              >
                <span>{sec.title}</span>
                <span style={{ opacity: 0.5, fontSize: 12 }}>{openSection === idx ? '▲' : '▼'}</span>
              </button>

              {openSection === idx && (
                <div style={{ padding: '0 18px 12px' }}>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 12px', fontSize: 11, color: '#aaa', overflow: 'auto', maxHeight: 260, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.7 }}>
                      {sec.content}
                    </pre>
                    <button
                      onClick={() => copySection(idx, sec.content)}
                      style={{ position: 'absolute', top: 6, right: 6, padding: '3px 8px', background: copiedIdx === idx ? '#1a3a1a' : '#333', border: 'none', borderRadius: 4, color: copiedIdx === idx ? '#0c0' : '#aaa', cursor: 'pointer', fontSize: 10 }}
                    >
                      {copiedIdx === idx ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ padding: '14px 18px', background: '#0a0a14', margin: '12px 18px 0', borderRadius: 8, border: '1px solid #2a2a3e' }}>
            <p style={{ color: '#7c3aed', fontSize: 12, fontWeight: 700, margin: '0 0 6px' }}>Estructura del paquete .neotheme</p>
            <pre style={{ color: '#888', fontSize: 11, margin: 0, lineHeight: 1.7 }}>
{`mi-tema/
  theme.json    ← configuración (colores, layout, efectos)
  theme.css     ← CSS libre con @keyframes y overrides
  theme.js      ← hooks: onMount, onNavigate, onSelect...
  preview.png   ← captura 1280×720 (se muestra en galería)
  README.md     ← descripción y créditos
  assets/
    bg.jpg      ← imagen de fondo (opcional)
    nav.wav     ← sonido de navegación (opcional)`}
            </pre>
          </div>
        </div>

        <div style={{ padding: '10px 18px', borderTop: '1px solid #333', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', background: '#333', border: 'none', borderRadius: 6, color: '#eee', cursor: 'pointer', fontSize: 12 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
