import type { ThemeEntry } from './registry';
import './ThemeTransition.css';

export interface ThemeTransitionProps {
  phase: 'idle' | 'out' | 'in';
  incoming: ThemeEntry | null;
}

export function ThemeTransition({ phase, incoming }: ThemeTransitionProps) {
  if (phase === 'idle' || !incoming) return null;
  return (
    <div className={`nc-xfade is-${phase}`} style={{ '--xacc': incoming.accent } as React.CSSProperties}>
      <div className="nc-xfade-grid" />
      <div className="nc-xfade-flash" />
      <div className="nc-xfade-sweep" />
      <div className="nc-xfade-line" />
      <div className="nc-xfade-badge">
        <div className="nc-xfade-k">SWITCHING <b>FRONTEND</b></div>
        <div className="nc-xfade-name">{incoming.name}</div>
        <div className="nc-xfade-tag">{incoming.tagline}</div>
        <div className="nc-xfade-bar"><span /></div>
      </div>
    </div>
  );
}
