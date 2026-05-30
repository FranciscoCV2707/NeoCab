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

// Read-only renderer of a widget layout. Used both as the live preview inside
// the editor and (later) to overlay widgets on the real app screens.
export function WidgetCanvas({ widgets, screen, selectedId, onSelectWidget, onWidgetPointerDown, onResizePointerDown }: WidgetCanvasProps) {
  const editing = !!onSelectWidget;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {[...widgets].sort((a, b) => a.z - b.z).map(w => {
        const def = PIECE_BY_TYPE[w.type];
        if (!def) return null;
        const sel = editing && w.id === selectedId;
        const style: CSSProperties = {
          position: 'absolute',
          left: `${w.x}%`, top: `${w.y}%`, width: `${w.w}%`, height: `${w.h}%`,
          zIndex: w.z,
          outline: sel ? '2px solid #c084fc' : editing ? '1px dashed rgba(255,255,255,.25)' : 'none',
          outlineOffset: editing ? 1 : 0,
          cursor: editing ? 'grab' : 'default',
        };
        return (
          <div key={w.id} style={style}
            onPointerDown={editing ? (e) => { onSelectWidget?.(w.id); onWidgetPointerDown?.(e, w.id); } : undefined}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: editing ? 'none' : 'auto' }}>
              {def.render({ instance: w, screen })}
            </div>
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
