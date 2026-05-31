import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WidgetType, WidgetInstance, ScreenKey, SkinId } from '../../stores/useThemeStore';
import { SkinBackground } from '../shared/SkinBackground';
import { SkinMarquee } from '../shared/SkinMarquee';
import { ARCADE_MENU } from '../shared/menu';
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
const GAMES = [
  { id: 1, title: 'Chrono Trigger', year: 1995 },
  { id: 2, title: 'Super Metroid', year: 1994 },
  { id: 3, title: 'F-Zero', year: 1990 },
  { id: 4, title: 'Donkey Kong Country', year: 1994 },
  { id: 5, title: 'Star Fox', year: 1993 },
];
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

// ── MENU: the home main-menu of each skin ─────────────────────────────────
const NW_MENU_HUES: Record<string, number> = { play: 270, scan: 200, settings: 320, operator: 160 };

function Menu({ skin }: { skin: SkinId }) {
  if (skin === 'hyperrush' || skin === 'hyperwheel') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="hr-home-menu" style={{ width: '100%' }}>
      {ARCADE_MENU.map((item, i) => (
        <button key={item.id} className={`hr-menu-item${i === 0 ? ' active' : ''}`} tabIndex={-1}>
          <span className="mi-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="mi-icon">{item.icon}</span>
          <span className="mi-body"><span className="mi-label">{item.label}</span><span className="mi-tag">{item.sub}</span></span>
          {i === 0 && <span className="mi-arrow">▶</span>}
        </button>
      ))}
    </div></Frame>
  );
  if (skin === 'neonwall') return (
    <Frame skin={skin}><div className="nw-home-rail">
      {ARCADE_MENU.map((it, i) => (
        <div key={it.id} className={`nw-home-poster${i === 0 ? ' active' : ''}`} style={{ '--p-h': NW_MENU_HUES[it.id] ?? 270 } as CSSProperties}>
          <div className="nw-home-poster-bg" /><div className="nw-home-poster-strip" />
          <div className="nw-home-poster-num">{String(i + 1).padStart(2, '0')} / {String(ARCADE_MENU.length).padStart(2, '0')}</div>
          <div className="nw-home-poster-ic">{it.icon}</div>
          <div className="nw-home-poster-body"><div className="nw-home-poster-label">{it.label}</div><div className="nw-home-poster-tag">{it.sub}</div></div>
        </div>
      ))}
    </div></Frame>
  );
  if (skin === 'flux') return (
    <Frame skin={skin} style={{ alignItems: 'flex-end' }}><div className="fx-home-menu">
      <div className="fx-home-menu-head"><span className="ln" /><span>MAIN MENU</span></div>
      {ARCADE_MENU.map((item, i) => (
        <div key={item.id} className={`fx-home-item${i === 0 ? ' active' : ''}`} style={{ marginRight: (ARCADE_MENU.length - 1 - i) * 30, opacity: i === 0 ? 1 : .82 }}>
          <span className="num">{String(i + 1).padStart(2, '0')}</span>
          <span className="ic">{item.icon}</span>
          <span className="body"><span className="label">{item.label}</span><span className="tag">{item.sub}</span></span>
          <span className="arrow">▶</span>
        </div>
      ))}
    </div></Frame>
  );
  if (skin === 'batocera') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="bat-home-right" style={{ width: '100%' }}>
      <div className="bat-home-menu-head"><span>MAIN MENU</span><div className="line" /></div>
      <div className="bat-home-menu">
        {ARCADE_MENU.map((item, i) => (
          <button key={item.id} className={`bat-menu-item${i === 0 ? ' active' : ''}`} tabIndex={-1}>
            <span className="mi-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="mi-icon">{item.icon}</span>
            <span className="mi-body"><span className="mi-label">{item.label}</span><span className="mi-tag">{item.sub}</span></span>
            {i === 0 && <span className="mi-arrow">▶</span>}
          </button>
        ))}
      </div>
    </div></Frame>
  );
  return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div style={{ width: '100%' }}>
      <div className="op-pane-head">MAIN MENU<span className="right">SELECT &amp; PRESS [ENTER]</span></div>
      <div className="op-home-menu">
        {ARCADE_MENU.map((item, i) => (
          <div key={item.id} className={`op-menu-row${i === 0 ? ' active' : ''}`}>
            <span className="key">[{i + 1}]</span><span className="ic">{item.icon}</span><span className="lbl">{item.label}</span><span className="tag">{item.sub}</span>
          </div>
        ))}
      </div>
    </div></Frame>
  );
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
  // operator: its real system card (op-sys-card)
  return (
    <Frame skin={skin}><div className="op-sys-card active" style={{ '--c-h': H } as CSSProperties}>
      <div className="op-sys-card-head"><span className="short">{SHORT}</span><span className="id">1.sys</span></div>
      <div className="op-sys-card-art">{media}</div>
      <div className="op-sys-card-name">{SYS.display_name}</div>
      <div className="op-sys-card-tag">{SYS.name}</div>
      <div className="op-sys-card-count">{SYS.game_count} ROMS</div>
    </div></Frame>
  );
}

// Faithful copy of NeonWall's coverflow transform (cvTransform).
function nwCvTransform(d: number): string {
  const sign = Math.sign(d), abs = Math.abs(d);
  const x = d === 0 ? 0 : sign * (150 + (abs - 1) * 92);
  const rotY = d === 0 ? 0 : -sign * 46;
  const scale = d === 0 ? 1.18 : Math.max(0.5, 0.9 - (abs - 1) * 0.1);
  const z = d === 0 ? 130 : -abs * 55;
  return `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
}

// ── GAMEWHEEL: the game selection list/wheel of each skin ──────────────────
function GameWheel({ skin }: { skin: SkinId }) {
  const hrCls = (i: number) => `hr-wheel-item${i === 0 ? ' active' : i === 1 ? ' n1' : i === 2 ? ' n2' : ' f'}`;
  if (skin === 'hyperrush' || skin === 'hyperwheel') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="hr-wheel-col" style={{ width: '100%' }}>
      <div className="hr-wheel-frame"><div className="hr-wheel-track">
        {GAMES.map((g, i) => (
          <div key={g.id} className={hrCls(i)} style={{ '--c-h': H } as CSSProperties}>
            <button className="hr-wheel-card" tabIndex={-1}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span className="ttl">{g.title}</span><span className="star" />
            </button>
          </div>
        ))}
      </div><div className="hr-wheel-rail" /></div>
    </div></Frame>
  );
  if (skin === 'flux') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="fx-list-col" style={{ width: '100%' }}><div className="fx-list">
      {GAMES.map((g, i) => (
        <button key={g.id} className={`fx-list-row d${Math.min(i, 3)}`} tabIndex={-1}>
          <span className="num">{String(i + 1).padStart(2, '0')}</span><span className="star" />
          <span className="ttl">{g.title}</span><span className="yr">{g.year}</span>
        </button>
      ))}
    </div></div></Frame>
  );
  if (skin === 'batocera') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="bat-list-col" style={{ width: '100%' }}><div className="bat-game-list">
      {GAMES.map((g, i) => (
        <button key={g.id} className={`bat-row${i === 0 ? ' active' : ''}`} tabIndex={-1}>
          <span className="num">{String(i + 1).padStart(3, '0')}</span><span className="star" />
          <span className="ttl">{g.title}</span><span className="pc"><b>{(5 - i) * 3}</b></span>
        </button>
      ))}
    </div></div></Frame>
  );
  if (skin === 'neonwall') {
    const tiles = [-3, -2, -1, 0, 1, 2, 3].map(d => ({ d, g: GAMES[((d % GAMES.length) + GAMES.length) % GAMES.length] }));
    return (
      <Frame skin={skin}><div className="nw-cv-wrap" style={{ width: '100%', height: '100%' }}>
        <div className="nw-cv-floor" />
        <div className="nw-cv"><div className="nw-cv-track">
          {tiles.map(({ d, g }) => {
            const absD = Math.abs(d);
            return (
              <div key={d} className={`nw-cv-tile${d === 0 ? ' active' : ''}`}
                style={{ transform: nwCvTransform(d), opacity: d === 0 ? 1 : Math.max(.12, .82 - (absD - 1) * .15), filter: absD >= 4 ? `blur(${(absD - 3) * .9}px)` : 'none', '--g-h': H, '--g-h2': H, zIndex: 100 - absD } as CSSProperties}>
                <div className="nw-cv-tile-bg" /><div className="nw-cv-tile-scan" /><div className="nw-cv-tile-strip" />
                <div className="nw-cv-tile-ic">{g.title.charAt(0)}</div>
                <div className="nw-cv-tile-name">{g.title}</div>
              </div>
            );
          })}
        </div></div>
        <button className="nw-cv-arrow l">‹</button><button className="nw-cv-arrow r">›</button>
      </div></Frame>
    );
  }
  // operator: the real game list
  return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="op-list" style={{ width: '100%' }}>
      <div className="op-list-head"><span>#</span><span>★</span><span>Title</span><span>Developer</span><span>Genre</span><span style={{ textAlign: 'right' }}>Plays</span></div>
      {GAMES.map((g, i) => (
        <div key={g.id} className={`op-row${i === 0 ? ' active' : ''}`}>
          <span className="num">{String(i + 1).padStart(3, '0')}</span><span className="star">{i === 0 ? '★' : ' '}</span>
          <span className="ttl">{g.title}</span><span className="sys">Squaresoft</span><span className="genre">RPG</span><span className="plays">{(5 - i) * 3}</span>
        </div>
      ))}
    </div></Frame>
  );
}

// ── SHOWCASE: the VIDEO/preview screen of each skin (filling the box) ───────
const fillBox: CSSProperties = { width: '100%', height: '100%', position: 'relative' };
function Showcase({ skin }: { skin: SkinId }) {
  if (skin === 'hyperrush' || skin === 'hyperwheel') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="hr-crt" style={fillBox}><div className="hr-crt-screen">
      <div className="hr-crt-content">
        <div className="hr-crt-game-name">{GAME.title.toUpperCase()}</div>
        <div className="hr-crt-sub">{GAME.developer.toUpperCase()}</div>
        <div className="hr-crt-press">Insert Coin to Continue</div>
        <div className="hr-crt-copy">© {GAME.year} · {SYS.display_name.toUpperCase()}</div>
      </div>
      <div className="hr-crt-scan" /><div className="hr-crt-rgb" /><div className="hr-crt-bulge" /><div className="hr-crt-roll" />
      <div className="hr-crt-corner tl">CH 03</div><div className="hr-crt-corner tr">● REC</div>
      <div className="hr-crt-corner bl">RGB · 320×240</div><div className="hr-crt-corner br">60.00 Hz</div>
    </div></div></Frame>
  );
  if (skin === 'neonwall') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="nw-cine-screen" style={fillBox}>
      <div className="nw-feat-screen-content">
        <div className="big">{GAME.title.toUpperCase()}</div>
        <div className="sub">{GAME.developer.toUpperCase()}</div>
        <div className="copy">© {GAME.year} · {SYS.display_name.toUpperCase()}</div>
      </div>
      <div className="nw-feat-screen-scan" />
    </div></Frame>
  );
  if (skin === 'flux') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="fx-preview" style={fillBox}>
      <div className="fx-preview-content">
        <div className="big">{GAME.title.toUpperCase()}</div>
        <div className="sub">{GAME.developer.toUpperCase()}</div>
        <div className="copy">© {GAME.year} · {SYS.display_name.toUpperCase()}</div>
      </div>
      <div className="fx-preview-scan" />
    </div></Frame>
  );
  if (skin === 'batocera') return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="bat-screen" style={fillBox}>
      <div className="bat-screen-bg" />
      <div className="bat-screen-art"><div className="big">{GAME.title.toUpperCase()}</div><div className="sub">{GAME.developer.toUpperCase()}</div></div>
      <div className="bat-screen-corner"><span className="dot" /><span>SCREEN</span></div>
      <div className="bat-screen-scan" />
    </div></Frame>
  );
  return (
    <Frame skin={skin} style={{ alignItems: 'stretch' }}><div className="op-snapshot-screen" style={fillBox}>
      <div className="op-snapshot-corner tl">CH 03</div><div className="op-snapshot-corner tr">● REC</div>
      <div className="op-snapshot-corner bl">320×240 · 4:3</div><div className="op-snapshot-corner br">60.00 Hz</div>
      <div className="op-snapshot-art">
        <div className="ttl">{GAME.title.toUpperCase()}</div><div className="sub">{GAME.developer.toUpperCase()}</div>
        <div className="copy">© {GAME.year} · {SYS.display_name.toUpperCase()}</div>
      </div>
    </div></Frame>
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
  /** Design pixel size the piece is authored at; the canvas scales it to fit. */
  base: { w: number; h: number };
  /** 'stretch' fills the box; 'scale' grows/shrinks the piece keeping aspect. */
  fit: 'stretch' | 'scale';
  render: (ctx: { instance: WidgetInstance; screen: ScreenKey }) => JSX.Element;
}

export const PIECES: PieceDef[] = [
  { type: 'background', label: 'Fondo', icon: '🌌', defaultSize: { w: 100, h: 100 }, base: { w: 1280, h: 720 }, fit: 'stretch',
    render: ({ instance }) => <SkinBackground skin={instance.skin} /> },
  { type: 'marquee', label: 'Marquee', icon: '🏷️', defaultSize: { w: 100, h: 12 }, base: { w: 1280, h: 120 }, fit: 'stretch',
    render: ({ instance, screen }) => <SkinMarquee skin={instance.skin} title={SCREEN_TITLE[screen]} /> },
  { type: 'menu', label: 'Menú principal', icon: '☰', defaultSize: { w: 40, h: 58 }, base: { w: 540, h: 640 }, fit: 'scale',
    render: ({ instance }) => <Menu skin={instance.skin} /> },
  { type: 'card', label: 'Tarjeta de sistema', icon: '🎴', defaultSize: { w: 20, h: 52 }, base: { w: 300, h: 540 }, fit: 'scale',
    render: ({ instance }) => <Card skin={instance.skin} /> },
  { type: 'gamewheel', label: 'Lista / rueda de juegos', icon: '🎮', defaultSize: { w: 34, h: 60 }, base: { w: 900, h: 680 }, fit: 'scale',
    render: ({ instance }) => <GameWheel skin={instance.skin} /> },
  { type: 'showcase', label: 'Pantalla / vídeo', icon: '📺', defaultSize: { w: 42, h: 40 }, base: { w: 800, h: 470 }, fit: 'scale',
    render: ({ instance }) => <Showcase skin={instance.skin} /> },
  { type: 'clock', label: 'Reloj', icon: '🕒', defaultSize: { w: 16, h: 8 }, base: { w: 260, h: 96 }, fit: 'scale',
    render: ({ instance }) => <Clock skin={instance.skin} /> },
];

export const PIECE_BY_TYPE: Record<WidgetType, PieceDef> = Object.fromEntries(PIECES.map(p => [p.type, p])) as Record<WidgetType, PieceDef>;

// Which pieces make sense on each screen type. Universal pieces (background,
// marquee, clock) appear everywhere; the rest are screen-specific.
export const PIECES_BY_SCREEN: Record<ScreenKey, WidgetType[]> = {
  home:    ['background', 'marquee', 'menu', 'clock'],
  systems: ['background', 'marquee', 'card', 'clock'],
  games:   ['background', 'marquee', 'gamewheel', 'showcase', 'clock'],
};
