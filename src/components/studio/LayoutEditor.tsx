import { useRef, useState } from 'react';
import type { CSSProperties, FC } from 'react';
import type { ComposeMap, SkinId, ScreenKey, WidgetInstance, WidgetLayout, WidgetType } from '../../stores/useThemeStore';
import { THEME_REGISTRY } from '../../themes/registry';
import { SkinBackground } from '../../themes/shared/SkinBackground';
import { WidgetCanvas } from '../../themes/widgets/WidgetCanvas';
import { PIECES, PIECE_BY_TYPE } from '../../themes/widgets/pieces';

interface Props {
  compose: ComposeMap;
  widgets?: WidgetLayout;
  /** Canonical --theme-* vars from the editor, applied to the canvas. */
  vars: CSSProperties;
  onSave: (compose: ComposeMap, widgets: WidgetLayout) => void;
  onClose: () => void;
}

const SCREENS: { key: ScreenKey; label: string }[] = [
  { key: 'home', label: 'Inicio' },
  { key: 'systems', label: 'Sistemas' },
  { key: 'games', label: 'Juegos' },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const uid = () => Math.random().toString(36).slice(2, 8);

// HyperTheme-style visual editor: per screen, pick a base skin and freely place
// widget pieces (background/marquee/wheel/crt/clock/stats/text) sourced from any
// skin. Drag to move, corner handle to resize; everything renders live.
export const LayoutEditor: FC<Props> = ({ compose, widgets, vars, onSave, onClose }) => {
  const [comp, setComp] = useState<ComposeMap>(compose);
  const [wl, setWl] = useState<WidgetLayout>(widgets ?? {});
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [selId, setSelId] = useState<string | null>(null);
  const [newSkin, setNewSkin] = useState<SkinId>(compose.home);

  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; mode: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const opts = THEME_REGISTRY.filter(t => t.status === 'available');

  const items = wl[screen] ?? [];
  const sel = items.find(w => w.id === selId) ?? null;

  const setItems = (fn: (prev: WidgetInstance[]) => WidgetInstance[]) =>
    setWl(prev => ({ ...prev, [screen]: fn(prev[screen] ?? []) }));

  const addWidget = (type: WidgetType) => {
    const def = PIECE_BY_TYPE[type];
    const w: WidgetInstance = {
      id: uid(), type, skin: newSkin,
      x: type === 'background' ? 0 : clamp(50 - def.defaultSize.w / 2, 0, 90),
      y: type === 'background' ? 0 : type === 'marquee' ? 0 : clamp(40 - def.defaultSize.h / 2, 0, 80),
      w: def.defaultSize.w, h: def.defaultSize.h,
      z: type === 'background' ? 0 : items.length + 1,
    };
    setItems(prev => [...prev, w]);
    setSelId(w.id);
  };

  const patchSel = (p: Partial<WidgetInstance>) => {
    if (!selId) return;
    setItems(prev => prev.map(w => w.id === selId ? { ...w, ...p } : w));
  };
  const removeSel = () => { if (selId) { setItems(prev => prev.filter(w => w.id !== selId)); setSelId(null); } };

  // ── Pointer drag / resize (percentages relative to the canvas) ──
  const onPointerDown = (e: React.PointerEvent, id: string, mode: 'move' | 'resize') => {
    const w = items.find(it => it.id === id);
    if (!w) return;
    drag.current = { id, mode, sx: e.clientX, sy: e.clientY, ox: mode === 'move' ? w.x : w.w, oy: mode === 'move' ? w.y : w.h };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current; const rect = canvasRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = ((e.clientX - d.sx) / rect.width) * 100;
    const dy = ((e.clientY - d.sy) / rect.height) * 100;
    setItems(prev => prev.map(w => {
      if (w.id !== d.id) return w;
      if (d.mode === 'move') return { ...w, x: clamp(d.ox + dx, 0, 100 - w.w), y: clamp(d.oy + dy, 0, 100 - w.h) };
      return { ...w, w: clamp(d.ox + dx, 4, 100 - w.x), h: clamp(d.oy + dy, 3, 100 - w.y) };
    }));
  };
  const onPointerUp = () => { drag.current = null; };

  const baseSkin = comp[screen];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(8,8,14,0.98)', display: 'flex', flexDirection: 'column', fontFamily: 'Arial,sans-serif', color: '#eee' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', background: '#0d0d1a', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#c084fc' }}>Editor Visual · HyperTheme</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {SCREENS.map(s => (
            <button key={s.key} onClick={() => { setScreen(s.key); setSelId(null); }}
              style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #333', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: screen === s.key ? '#7c3aed' : '#1a1a2e', color: screen === s.key ? '#fff' : '#aaa' }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => onSave(comp, wl)}
            style={{ padding: '6px 16px', background: '#7c3aed', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            Aplicar al tema ✓
          </button>
          <button onClick={onClose}
            style={{ padding: '6px 12px', background: '#222', border: '1px solid #444', borderRadius: 4, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
            Cerrar
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: base skin + palette */}
        <div style={{ width: 220, flexShrink: 0, padding: 14, overflowY: 'auto', borderRight: '1px solid #222', background: '#0b0b16' }}>
          <p style={lbl}>Base de "{SCREENS.find(s => s.key === screen)!.label}"</p>
          <select value={baseSkin} onChange={e => setComp({ ...comp, [screen]: e.target.value as SkinId })} style={input}>
            {opts.map(o => <option key={o.id} value={o.skin}>{o.name}</option>)}
          </select>

          <p style={{ ...lbl, marginTop: 18 }}>Origen de nuevos widgets</p>
          <select value={newSkin} onChange={e => setNewSkin(e.target.value as SkinId)} style={input}>
            {opts.map(o => <option key={o.id} value={o.skin}>{o.name}</option>)}
          </select>

          <p style={{ ...lbl, marginTop: 18 }}>Añadir widget</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PIECES.map(p => (
              <button key={p.type} onClick={() => addWidget(p.type)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid #2a2a40', background: '#15152a', color: '#ddd', cursor: 'pointer', fontSize: 12, textAlign: 'left' }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: live canvas (16:9) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', padding: 20, overflow: 'hidden' }}>
          <div ref={canvasRef}
            onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            onPointerDown={e => { if (e.target === e.currentTarget) setSelId(null); }}
            style={{ ...vars, position: 'relative', width: 'min(100%, 1024px)', aspectRatio: '16 / 9', background: '#000', borderRadius: 8, overflow: 'hidden', boxShadow: '0 0 0 1px #333, 0 16px 50px rgba(0,0,0,.6)' }}>
            {/* Base skin backdrop for the screen */}
            <SkinBackground skin={baseSkin} />
            <WidgetCanvas
              widgets={items} screen={screen}
              selectedId={selId} onSelectWidget={setSelId}
              onWidgetPointerDown={(e, id) => onPointerDown(e, id, 'move')}
              onResizePointerDown={(e, id) => onPointerDown(e, id, 'resize')}
            />
          </div>
        </div>

        {/* Right: properties */}
        <div style={{ width: 230, flexShrink: 0, padding: 14, overflowY: 'auto', borderLeft: '1px solid #222', background: '#0b0b16' }}>
          <p style={lbl}>Propiedades</p>
          {!sel && <p style={{ fontSize: 12, color: '#666' }}>Selecciona un widget en el lienzo.</p>}
          {sel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc' }}>
                {PIECE_BY_TYPE[sel.type].icon} {PIECE_BY_TYPE[sel.type].label}
              </div>

              <label style={fieldLbl}>Origen (skin)
                <select value={sel.skin} onChange={e => patchSel({ skin: e.target.value as SkinId })} style={input}>
                  {opts.map(o => <option key={o.id} value={o.skin}>{o.name}</option>)}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['x', 'y', 'w', 'h'] as const).map(k => (
                  <label key={k} style={fieldLbl}>{k.toUpperCase()} %
                    <input type="number" value={Math.round(sel[k])} onChange={e => patchSel({ [k]: clamp(+e.target.value, 0, 100) })} style={input} />
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => patchSel({ z: sel.z + 1 })} style={miniBtn}>▲ Frente</button>
                <button onClick={() => patchSel({ z: Math.max(0, sel.z - 1) })} style={miniBtn}>▼ Fondo</button>
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>z-index: {sel.z}</div>

              <button onClick={removeSel} style={{ ...miniBtn, borderColor: '#7a2230', color: '#ff8092' }}>Eliminar widget</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const lbl: CSSProperties = { fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' };
const fieldLbl: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#999' };
const input: CSSProperties = { width: '100%', padding: '6px 8px', background: '#15152a', border: '1px solid #2a2a40', borderRadius: 4, color: '#eee', fontSize: 12, boxSizing: 'border-box' };
const miniBtn: CSSProperties = { flex: 1, padding: '7px 8px', background: '#15152a', border: '1px solid #2a2a40', borderRadius: 4, color: '#ddd', cursor: 'pointer', fontSize: 11 };
