import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, FC } from 'react';
import type { ComposeMap, SkinId } from '../../stores/useThemeStore';
import { THEME_REGISTRY } from '../../themes/registry';
import { SkinPreview } from './SkinPreview';

interface Props {
  compose: ComposeMap;
  /** Canonical --theme-* vars from the editor, applied to the preview. */
  vars: CSSProperties;
  onSave: (compose: ComposeMap) => void;
  onClose: () => void;
}

const ZONES: { key: keyof ComposeMap; label: string; hint: string }[] = [
  { key: 'home', label: 'Inicio / Menú', hint: 'pantalla principal' },
  { key: 'systems', label: 'Sistemas', hint: 'selección de plataforma' },
  { key: 'games', label: 'Juegos', hint: 'lista / rueda de títulos' },
];

// Visual editor reworked into a theme COMPOSER: drag a theme onto each screen
// (Home / Systems / Games) and see the real result live on the right. Drag is
// pointer-based (works in any webview, unlike flaky native HTML5 DnD).
export const LayoutEditor: FC<Props> = ({ compose, vars, onSave, onClose }) => {
  const [c, setC] = useState<ComposeMap>(compose);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragSkin = useRef<SkinId | null>(null);
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const opts = THEME_REGISTRY.filter(t => t.status === 'available');
  const nameOf = (s: SkinId) => opts.find(o => o.skin === s)?.name ?? s;
  const accentOf = (s: SkinId) => opts.find(o => o.skin === s)?.accent ?? '#888';

  const startDrag = (skin: SkinId, e: React.MouseEvent) => {
    e.preventDefault();
    dragSkin.current = skin;
    setPos({ x: e.clientX, y: e.clientY });
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const up = (e: MouseEvent) => {
      const skin = dragSkin.current;
      if (skin) {
        for (const z of ZONES) {
          const el = zoneRefs.current[z.key];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            setC(prev => ({ ...prev, [z.key]: skin }));
            break;
          }
        }
      }
      dragSkin.current = null;
      setDragging(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.96)', display: 'flex', flexDirection: 'column', fontFamily: 'Arial,sans-serif', color: '#eee' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', background: '#0d0d1a', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#c084fc' }}>Editor Visual · Compositor de Tema</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => onSave(c)}
            style={{ padding: '6px 16px', background: '#7c3aed', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            Aplicar al tema ✓
          </button>
          <button onClick={onClose}
            style={{ padding: '6px 12px', background: '#222', border: '1px solid #444', borderRadius: 4, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Body: compose board | live preview */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Compose board */}
        <div style={{ width: '44%', minWidth: 380, padding: 20, overflowY: 'auto', borderRight: '1px solid #222' }}>
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 0, lineHeight: 1.5 }}>
            Arrastra un tema a cada pantalla (o haz clic en un tema para usarlo en las tres). El preview de la derecha muestra el resultado real; pulsa <b>Aplicar al tema</b> y luego <b>Guardar y Aplicar</b>.
          </p>

          {/* Theme palette (drag with mouse) */}
          <p style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, margin: '14px 0 8px' }}>Temas — arrastra a una pantalla</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            {opts.map(o => (
              <div key={o.id}
                onMouseDown={e => startDrag(o.skin, e)}
                onClick={() => setC({ home: o.skin, systems: o.skin, games: o.skin })}
                title={`Arrastra "${o.name}" a una pantalla, o clic para usarlo en todas`}
                style={{ padding: '9px 15px', borderRadius: 8, cursor: 'grab', userSelect: 'none', border: `2px solid ${o.accent}`, background: `${o.accent}18`, color: o.accent, fontWeight: 600, fontSize: 13 }}>
                ⠿ {o.name}
              </div>
            ))}
          </div>

          {/* Drop zones */}
          <p style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Pantallas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ZONES.map(z => {
              const cur = c[z.key];
              return (
                <div key={z.key}
                  ref={el => { zoneRefs.current[z.key] = el; }}
                  style={{
                    minHeight: 76, borderRadius: 10, padding: '12px 18px',
                    border: `2px dashed ${accentOf(cur)}`,
                    background: dragging ? `${accentOf(cur)}22` : `${accentOf(cur)}11`,
                    boxShadow: dragging ? `0 0 0 2px ${accentOf(cur)}55 inset` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    transition: 'background 120ms ease',
                  }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{z.label}</div>
                    <div style={{ fontSize: 10, opacity: .5 }}>{dragging ? 'suelta aquí' : z.hint}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: accentOf(cur) }}>{nameOf(cur)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', padding: 20, overflow: 'auto' }}>
          <SkinPreview skin={c.systems} vars={vars} width={760} compose={c} />
        </div>
      </div>

      {/* Drag ghost following the cursor */}
      {dragging && dragSkin.current && (
        <div style={{
          position: 'fixed', left: pos.x + 14, top: pos.y + 8, zIndex: 10010, pointerEvents: 'none',
          padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          border: `2px solid ${accentOf(dragSkin.current)}`, background: '#0d0d1a', color: accentOf(dragSkin.current),
          boxShadow: '0 8px 24px rgba(0,0,0,.6)',
        }}>
          ⠿ {nameOf(dragSkin.current)}
        </div>
      )}
    </div>
  );
};
