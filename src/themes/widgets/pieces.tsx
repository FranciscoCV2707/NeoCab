import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WidgetType, WidgetInstance, ScreenKey, SkinId } from '../../stores/useThemeStore';
import { SkinBackground } from '../shared/SkinBackground';
import { SkinMarquee } from '../shared/SkinMarquee';
import { MediaShape, getSystemHue, getSystemShape } from '../../components/arcade';

// Every widget piece is a faithful slice of a real skin: it renders that skin's
// own markup + CSS classes (wrapped in its `theme-*` root) so it looks exactly
// like the theme it comes from. CSS is loaded via SkinBackground's imports.

const fill: CSSProperties = { position: 'absolute', inset: 0 };
const center: CSSProperties = { ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
const SCREEN_TITLE: Record<ScreenKey, string> = { home: 'Inicio', systems: 'Sistemas', games: 'Juegos' };

// Representative content (the skins are data-driven; widgets show a sample item).
const SYS = { name: 'snes', display_name: 'Super Nintendo', game_count: 248 };
const GAME = { title: 'Chrono Trigger', developer: 'Squaresoft', year: 1995 };
const H = getSystemHue(SYS.name)[0];
const SHORT = SYS.name.slice(0, 4).toUpperCase();

function Frame({ skin, children, style }: { skin: SkinId; children: React.ReactNode; style?: CSSProperties }) {
  const root = skin === 'hyperwheel' ? 'theme-hyperrush hr-variant-wheel' : `theme-${skin}`;
  return <div className={root} style={{ ...center, ...style }}>{children}</div>;
}

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  return { hhmm: `${p(t.getHours())}:${p(t.getMinutes())}`, hms: `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}` };
}

// ── CARD: the system card of each skin ────────────────────────────────────
function Card({ skin }: { skin: SkinId }) {
  const media = <MediaShape shape={getSystemShape(SYS.name)} hue={H} short={SHORT} />;
  const hrLike = skin === 'hyperrush' || skin === 'hyperwheel';
  if (hrLike) return (
    <Frame skin={skin}><div className="hr-carousel"><div className="hr-sys-card active" style={{ '--c-h': H, '--c-h2': H } as CSSProperties}>
      <div className="hr-sys-card-bg" /><div className="hr-sys-card-grid" />
      <div className="hr-sys-card-kind">■ PLATFORM</div>
      <div className="hr-sys-card-media">{media}</div>
      <div className="hr-sys-card-body">
        <div className="hr-sys-card-name">{SYS.display_name}</div>
        <div className="hr-sys-card-tag">{SYS.name}</div>
        <div className="hr-sys-card-foot"><span className="hr-sys-card-count">{SYS.game_count}</span><span className="hr-sys-card-count-k">TITLES</span></div>
      </div>
    </div></div></Frame>
  );
  if (skin === 'neonwall') return (
    <Frame skin={skin}><div className="nw-sys-card active" style={{ '--c-h': H, '--c-h2': H } as CSSProperties}>
      <div className="nw-sys-card-bg" />
      <div className="nw-sys-card-kind">■ PLATFORM</div>
      <div className="nw-sys-card-media">{media}</div>
      <div className="nw-sys-card-body">
        <div className="nw-sys-card-name">{SYS.display_name}</div>
        <div className="nw-sys-card-tag">{SYS.name}</div>
        <div className="nw-sys-card-foot"><span className="nw-sys-card-count">{SYS.game_count}</span><span className="nw-sys-card-count-k">TITLES</span></div>
      </div>
    </div></Frame>
  );
  if (skin === 'flux') return (
    <Frame skin={skin}><div className="fx-sys-carousel"><button className="fx-sys-card active" style={{ '--c-h': H } as CSSProperties} tabIndex={-1}>
      <div className="fx-sys-card-bg" />
      <div className="fx-sys-card-short">{SHORT}</div>
      <div className="fx-sys-card-name">{SYS.display_name}</div>
      <div className="fx-sys-card-tag">{SYS.name}</div>
      <div className="fx-sys-card-count"><b>{SYS.game_count}</b> titles</div>
    </button></div></Frame>
  );
  if (skin === 'batocera') return (
    <Frame skin={skin}><button className="bat-sys-card active" style={{ '--card-h': H } as CSSProperties} tabIndex={-1}>
      <div className="sc-glow" /><div className="sc-shape">{media}</div>
      <div className="sc-foot">
        <div className="sc-name">{SYS.display_name}</div>
        <div className="sc-tag">{SYS.name.toUpperCase()}</div>
        <div className="sc-count"><b>{SYS.game_count}</b> titles</div>
      </div>
    </button></Frame>
  );
  // operator: a faithful list row
  return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="op-list" style={{ width: '100%' }}>
      <div className="op-list-head"><span>#</span><span>★</span><span>Title</span><span>Developer</span><span>Genre</span><span style={{ textAlign: 'right' }}>Plays</span></div>
      <div className="op-row active">
        <span className="num">001</span><span className="star">★</span><span className="ttl">{GAME.title}</span>
        <span className="sys">{GAME.developer}</span><span className="genre">RPG</span><span className="plays">42</span>
      </div>
    </div></Frame>
  );
}

// ── SHOWCASE: the hero / feature panel of each skin ────────────────────────
function Showcase({ skin }: { skin: SkinId }) {
  if (skin === 'hyperrush' || skin === 'hyperwheel') return (
    <Frame skin={skin}><div className="hr-crt-wrap"><div className="hr-crt"><div className="hr-crt-screen">
      <div className="hr-crt-content">
        <div className="hr-crt-game-name">{GAME.title.toUpperCase()}</div>
        <div className="hr-crt-sub">{GAME.developer.toUpperCase()}</div>
        <div className="hr-crt-press">Insert Coin to Continue</div>
        <div className="hr-crt-copy">© {GAME.year} · {SYS.display_name.toUpperCase()}</div>
      </div>
      <div className="hr-crt-scan" /><div className="hr-crt-rgb" /><div className="hr-crt-bulge" /><div className="hr-crt-roll" />
      <div className="hr-crt-corner tl">CH 03</div><div className="hr-crt-corner tr">● REC</div>
      <div className="hr-crt-corner bl">RGB · 320×240</div><div className="hr-crt-corner br">60.00 Hz</div>
    </div></div></div></Frame>
  );
  if (skin === 'neonwall') return (
    <Frame skin={skin}><div className="nw-cine-stage"><div className="nw-cine-marquee">
      <div className="nw-cine-bulbs top" /><div className="nw-marquee-text">{GAME.title.toUpperCase()}</div><div className="nw-cine-bulbs bottom" />
    </div></div></Frame>
  );
  if (skin === 'flux') return (
    <Frame skin={skin}><div className="fx-preview-wrap"><div className="fx-preview"><div className="fx-preview-content">
      <div className="fx-logo-big" style={{ fontSize: 40 }}>{GAME.title}</div>
      <div className="fx-logo-sub">{GAME.developer}</div>
    </div></div></div></Frame>
  );
  if (skin === 'batocera') return (
    <Frame skin={skin}><div className="bat-marquee"><div className="bat-marquee-text">{GAME.title.toUpperCase()}</div></div></Frame>
  );
  return (
    <Frame skin={skin}><div className="op-marquee-pane" style={{ width: '100%' }}><div className="op-marquee-text">{GAME.title.toUpperCase()}</div></div></Frame>
  );
}

// ── CLOCK: each skin's own time element ────────────────────────────────────
function Clock({ skin }: { skin: SkinId }) {
  const { hhmm, hms } = useClock();
  if (skin === 'hyperrush' || skin === 'hyperwheel') return (
    <Frame skin={skin}><div className="hr-marquee-meta">{hms}</div></Frame>
  );
  if (skin === 'neonwall') return (
    <Frame skin={skin}><div className="nw-time"><span className="led" /><span>LIVE</span><span style={{ opacity: .5 }}>·</span><b>{hhmm}</b></div></Frame>
  );
  if (skin === 'flux') return (
    <Frame skin={skin}><div className="fx-attract-clock"><span className="dot" /><span>ARCADE</span><b>{hhmm}</b></div></Frame>
  );
  if (skin === 'batocera') return (
    <Frame skin={skin}><div className="bat-pill"><span>{hhmm}</span></div></Frame>
  );
  return (
    <Frame skin={skin}><div className="op-topbar" style={{ width: 'auto' }}><div className="seg">{hhmm}<span className="blink" /></div></div></Frame>
  );
}

export interface PieceDef {
  type: WidgetType;
  label: string;
  icon: string;
  defaultSize: { w: number; h: number };
  render: (ctx: { instance: WidgetInstance; screen: ScreenKey }) => JSX.Element;
}

export const PIECES: PieceDef[] = [
  { type: 'background', label: 'Fondo', icon: '🌌', defaultSize: { w: 100, h: 100 },
    render: ({ instance }) => <SkinBackground skin={instance.skin} /> },
  { type: 'marquee', label: 'Marquee', icon: '🏷️', defaultSize: { w: 100, h: 12 },
    render: ({ instance, screen }) => <SkinMarquee skin={instance.skin} title={SCREEN_TITLE[screen]} /> },
  { type: 'card', label: 'Tarjeta de sistema', icon: '🎴', defaultSize: { w: 20, h: 52 },
    render: ({ instance }) => <Card skin={instance.skin} /> },
  { type: 'showcase', label: 'Escaparate / CRT', icon: '📺', defaultSize: { w: 42, h: 46 },
    render: ({ instance }) => <Showcase skin={instance.skin} /> },
  { type: 'clock', label: 'Reloj', icon: '🕒', defaultSize: { w: 16, h: 8 },
    render: ({ instance }) => <Clock skin={instance.skin} /> },
];

export const PIECE_BY_TYPE: Record<WidgetType, PieceDef> = Object.fromEntries(PIECES.map(p => [p.type, p])) as Record<WidgetType, PieceDef>;
