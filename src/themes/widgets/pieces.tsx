import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WidgetType, WidgetInstance, ScreenKey } from '../../stores/useThemeStore';
import { SkinBackground } from '../shared/SkinBackground';
import { SkinMarquee } from '../shared/SkinMarquee';

// Registry of widget pieces for the HyperTheme-style editor. Each piece renders
// to fill its container (the canvas positions it); colors read --theme-* so the
// piece recolors live with the active theme.

const fill: CSSProperties = { position: 'absolute', inset: 0 };
const SCREEN_TITLE: Record<ScreenKey, string> = { home: 'Inicio', systems: 'Sistemas', games: 'Juegos' };

function LiveClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--theme-text,#eee)', fontFamily: 'var(--font-mono,Consolas),monospace' }}>
      <div style={{ fontSize: '2.4em', fontWeight: 800, letterSpacing: 2, color: 'var(--theme-accent,#ff6b35)', textShadow: '0 0 14px var(--theme-accent,#ff6b35)' }}>
        {p(t.getHours())}:{p(t.getMinutes())}<span style={{ opacity: .5, fontSize: '.6em' }}>:{p(t.getSeconds())}</span>
      </div>
    </div>
  );
}

function StatsBlock() {
  const rows = [['TOTAL', '2,481'], ['SISTEMAS', '24'], ['FAVORITOS', '37'], ['SESIÓN', 'HOY 21:14']];
  return (
    <div style={{ ...fill, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12, alignContent: 'center', color: 'var(--theme-text,#eee)', fontFamily: 'var(--font-ui,Arial)' }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ border: '1px solid var(--theme-border,rgba(255,255,255,.12))', borderRadius: 6, padding: '8px 10px', background: 'rgba(0,0,0,.25)' }}>
          <div style={{ fontSize: '.6em', letterSpacing: 1, opacity: .6 }}>{k}</div>
          <div style={{ fontSize: '1.2em', fontWeight: 800, color: 'var(--theme-accent,#ff6b35)' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function WheelPreview() {
  const items = ['Pac-Man', 'Galaga', 'Tetris', 'Street Fighter', 'Metal Slug', 'R-Type'];
  return (
    <div style={{ ...fill, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: 10, overflow: 'hidden', fontFamily: 'var(--font-ui,Arial)' }}>
      {items.map((it, i) => (
        <div key={it} style={{
          padding: '8px 14px', borderRadius: 6,
          background: i === 2 ? 'var(--theme-accent,#ff6b35)' : 'rgba(0,0,0,.3)',
          color: i === 2 ? '#000' : 'var(--theme-text,#eee)',
          border: '1px solid var(--theme-border,rgba(255,255,255,.1))',
          fontWeight: i === 2 ? 800 : 500, transform: i === 2 ? 'scale(1.06)' : 'none',
          boxShadow: i === 2 ? '0 0 18px var(--theme-accent,#ff6b35)' : 'none',
        }}>{it}</div>
      ))}
    </div>
  );
}

function CrtPreview() {
  return (
    <div style={{ ...fill, padding: 8 }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 12, position: 'relative', overflow: 'hidden',
        border: '3px solid var(--theme-border,#333)',
        background: 'radial-gradient(120% 120% at 50% 30%, color-mix(in srgb, var(--theme-accent,#ff6b35) 22%, #000) 0%, #000 70%)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,.8)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,.28) 3px)', opacity: .55 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--theme-accent,#ff6b35)', fontFamily: 'var(--font-mono,Consolas),monospace', textShadow: '0 0 10px var(--theme-accent,#ff6b35)' }}>
          <div style={{ fontSize: '1.6em', fontWeight: 800 }}>NOW PLAYING</div>
          <div style={{ fontSize: '.7em', opacity: .7, marginTop: 6 }}>Insert Coin to Continue</div>
        </div>
      </div>
    </div>
  );
}

export interface PieceDef {
  type: WidgetType;
  label: string;
  icon: string;
  /** Default size in canvas percentages. */
  defaultSize: { w: number; h: number };
  render: (ctx: { instance: WidgetInstance; screen: ScreenKey }) => JSX.Element;
}

export const PIECES: PieceDef[] = [
  { type: 'background', label: 'Fondo', icon: '🌌', defaultSize: { w: 100, h: 100 },
    render: ({ instance }) => <SkinBackground skin={instance.skin} /> },
  { type: 'marquee', label: 'Marquee', icon: '🏷️', defaultSize: { w: 100, h: 12 },
    render: ({ instance, screen }) => <SkinMarquee skin={instance.skin} title={SCREEN_TITLE[screen]} /> },
  { type: 'wheel', label: 'Rueda', icon: '🎡', defaultSize: { w: 28, h: 60 }, render: () => <WheelPreview /> },
  { type: 'crt', label: 'CRT / Preview', icon: '📺', defaultSize: { w: 40, h: 50 }, render: () => <CrtPreview /> },
  { type: 'clock', label: 'Reloj', icon: '🕒', defaultSize: { w: 18, h: 10 }, render: () => <LiveClock /> },
  { type: 'stats', label: 'Estadísticas', icon: '📊', defaultSize: { w: 26, h: 22 }, render: () => <StatsBlock /> },
  { type: 'text', label: 'Texto', icon: '🔤', defaultSize: { w: 24, h: 8 },
    render: ({ instance }) => (
      <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent,#ff6b35)', fontWeight: 800, letterSpacing: 2, fontFamily: 'var(--font-title,Impact)', textShadow: '0 0 12px var(--theme-accent,#ff6b35)' }}>
        {instance.text || 'TEXTO'}
      </div>
    ) },
];

export const PIECE_BY_TYPE: Record<WidgetType, PieceDef> = Object.fromEntries(PIECES.map(p => [p.type, p])) as Record<WidgetType, PieceDef>;
