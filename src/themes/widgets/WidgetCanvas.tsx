import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WidgetInstance, ScreenKey } from '../../stores/useThemeStore';
import { PIECE_BY_TYPE } from './pieces';

interface WidgetCanvasProps {
  widgets: WidgetInstance[];
  screen: ScreenKey;
  /** Selected widget id (editor) — draws a focus ring. */
  selectedId?: string | null;
  onSelectWidget?: (id: string) => void;
  /** Pointer-down on a widget body (editor drag). */
  onWidgetPointerDown?: (e: React.PointerEvent, id: string) => void;
  /** Pointer-down on the resize handle (editor). */
  onResizePointerDown?: (e: React.PointerEvent, id: string) => void;
}

// Read-only renderer of a widget layout. Each piece is authored at a design
// pixel size and SCALED to fit its box (so resizing grows/shrinks the whole
// piece instead of cropping it). Used as the editor preview and the app overlay.
export function WidgetCanvas({ widgets, screen, selectedId, onSelectWidget, onWidgetPointerDown, onResizePointerDown }: WidgetCanvasProps) {
  const editing = !!onSelectWidget;
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {size.w > 0 && [...widgets].sort((a, b) => a.z - b.z).map(w => {
        const def = PIECE_BY_TYPE[w.type];
        if (!def) return null;
        const sel = editing && w.id === selectedId;
        const boxW = (size.w * w.w) / 100;
        const boxH = (size.h * w.h) / 100;

        const box: CSSProperties = {
          position: 'absolute',
          left: `${w.x}%`, top: `${w.y}%`, width: `${w.w}%`, height: `${w.h}%`,
          zIndex: w.z,
          outline: sel ? '2px solid #c084fc' : editing ? '1px dashed rgba(255,255,255,.25)' : 'none',
          outlineOffset: editing ? 1 : 0,
          cursor: editing ? 'grab' : 'default',
          overflow: 'hidden',
        };

        // Effective fit: per-widget override, else the piece's default.
        // 'stretch' fills the box; 'scale' keeps aspect and grows/shrinks the
        // whole piece; 'crop' shows it at native size and clips to the box.
        const fit = w.fit ?? def.fit;
        let inner;
        if (fit === 'stretch') {
          inner = <div style={{ position: 'absolute', inset: 0 }}>{def.render({ instance: w, screen })}</div>;
        } else {
          const s = fit === 'crop' ? 1 : (Math.min(boxW / def.base.w, boxH / def.base.h) || 0);
          inner = (
            <div style={{ position: 'absolute', left: '50%', top: '50%', width: def.base.w, height: def.base.h, transform: `translate(-50%,-50%) scale(${s})` }}>
              {def.render({ instance: w, screen })}
            </div>
          );
        }

        return (
          <div key={w.id} style={box}
            onPointerDown={editing ? (e) => { onSelectWidget?.(w.id); onWidgetPointerDown?.(e, w.id); } : undefined}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: editing ? 'none' : 'auto' }}>{inner}</div>
            {sel && (
              <div
                onPointerDown={(e) => { e.stopPropagation(); onResizePointerDown?.(e, w.id); }}
                style={{ position: 'absolute', right: -6, bottom: -6, width: 14, height: 14, background: '#c084fc', borderRadius: 3, cursor: 'nwse-resize', zIndex: 9999 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
