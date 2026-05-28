// hyperwheel.jsx — NeoCab HyperWheel theme · screen state machine + Game Wheel screen
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── THEME CONFIG (export-shape, mirrors what a real theme would ship) ─────
const HYPERWHEEL_THEME = {
  id: 'hyperwheel',
  name: 'NeoCab HyperWheel',
  layout: 'vertical-wheel',
  wheelPosition: 'right',
  previewStyle: 'crt',
  backgroundMode: 'dynamic',
  scanlines: true,
  glow: true,
  animations: true,
};

// ─── helpers ───────────────────────────────────────────────────────────────
function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  const ss = String(t.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ─── MARQUEE (top backlit plate) — shared across screens ────────────────────
function Marquee({ screen, game, systemMeta, totals }) {
  const time = useClock();

  // Per-screen context line
  let headline = null;
  let metaLine = null;
  if (screen === 'home') {
    headline = (
      <div className="system-name">
        <span>MAIN MENU</span>
        <span className="sep">/</span>
        <span>WELCOME</span>
      </div>
    );
    metaLine = (
      <div className="system-meta">
        <span><b>{totals.systems}</b> SYSTEMS</span>
        <span><b>{totals.titles.toLocaleString()}</b> TITLES</span>
        <span><b>{totals.favorites}</b> FAVORITES</span>
        <span>FREEPLAY · ON</span>
      </div>
    );
  } else if (screen === 'systems') {
    headline = (
      <div className="system-name">
        <span>SELECT</span>
        <span className="sep">/</span>
        <span>SYSTEM</span>
      </div>
    );
    metaLine = (
      <div className="system-meta">
        <span><b>{systemMeta?.count?.toLocaleString?.() ?? 0}</b> TITLES</span>
        <span>KIND · {systemMeta?.kind?.toUpperCase?.()}</span>
        <span>{systemMeta?.tag}</span>
        <span>REGION · WORLD</span>
      </div>
    );
  } else {
    headline = (
      <div className="system-name">
        <span>{systemMeta?.name?.toUpperCase?.()}</span>
        <span className="sep">/</span>
        <span>{systemMeta?.tag}</span>
      </div>
    );
    metaLine = (
      <div className="system-meta">
        <span><b>{systemMeta?.count}</b> TITLES</span>
        <span>SORT · A-Z</span>
        <span>FILTER · ALL</span>
        <span>REGION · WORLD</span>
      </div>
    );
  }

  return (
    <div className="marquee" data-screen-label={`Marquee · ${screen}`}>
      <div className="brand">
        <div className="brand-mark">N</div>
        <div>
          <div className="brand-name">NEOCAB</div>
          <div className="brand-tag">v0.7 · cabinet mode</div>
        </div>
      </div>
      <div className="system-tag">
        {headline}
        {metaLine}
      </div>
      <div className="status">
        <div className="status-block">
          <div className="v tab">{time}</div>
          <div className="k">cab-time</div>
        </div>
        <div className="status-block">
          <div className="v">
            {screen === 'wheel' ? String(game?.playCount ?? 0).padStart(3, '0') :
             screen === 'systems' ? String(systemMeta?.count ?? 0).padStart(3, '0') :
             String(totals.systems).padStart(3, '0')}
          </div>
          <div className="k">{screen === 'wheel' ? 'plays' : screen === 'systems' ? 'count' : 'systems'}</div>
        </div>
        <div className="status-led">
          <span className="dot"></span>
          <span>live</span>
        </div>
      </div>
    </div>
  );
}

// ─── CRT preview (used on the Game Wheel screen) ───────────────────────────
function CRTPreview({ game }) {
  return (
    <div className="crt-wrap">
      <div>
        <div className="crt">
          <div className="crt-screen">
            <div className="crt-content">
              {game && game.hasMedia ? (
                <div className="crt-title">
                  <div className="crt-game-name">{game.title.toUpperCase()}</div>
                  <div className="crt-sub">{game.sub}</div>
                  <div className="crt-press">Insert Coin to Continue</div>
                  <div className="crt-copy">© {game.year} {game.manufacturer.toUpperCase()} · ALL RIGHTS RESERVED</div>
                </div>
              ) : (
                <div className="crt-missing">
                  <div className="glyph">NO SIGNAL</div>
                  <div className="ttl">ASSET MISSING</div>
                  <div className="sub">video · screenshot · marquee</div>
                  <div className="sub" style={{color:'var(--amber)'}}>↳ press [Y] to scrape</div>
                </div>
              )}
            </div>
            <div className="crt-rgb"></div>
            <div className="crt-scan"></div>
            <div className="crt-rolling"></div>
            <div className="crt-bulge"></div>
            <div className="crt-corner tl">CH 03</div>
            <div className="crt-corner tr">● REC</div>
            <div className="crt-corner bl">RGB · 320×240</div>
            <div className="crt-corner br">60.00 Hz</div>
          </div>
        </div>
        <div className="crt-strip">
          <span className="pip"></span>
          <span>VIDEO PREVIEW</span>
          <span className="bar"></span>
          <span>CH 03 / 04</span>
        </div>
      </div>
    </div>
  );
}

// ─── BIG TYPOGRAPHIC GAME LOGO ─────────────────────────────────────────────
function GameLogoBig({ game }) {
  return (
    <div className="center">
      {game.favorite && (
        <div className="fav-mark">
          <span className="star"></span>
          <span>Favorite · pinned</span>
        </div>
      )}
      <div className="logo-stage">
        <div className="game-logo">
          <div className="gl-system-pill">
            <span className="sq"></span>
            <span>{game.system}</span>
            <span style={{opacity:.55,marginLeft:6}}>·</span>
            <span style={{opacity:.7}}>{game.year}</span>
          </div>
          <div className="gl-title">
            {game.titleParts.map((part, i) => {
              if (typeof part === 'string') {
                return <span key={i}>{i > 0 ? ' ' : ''}{part.toUpperCase()}</span>;
              }
              if (part.accent) {
                return <span key={i} className="accent">{i > 0 ? ' ' : ''}{part.accent.toUpperCase()}</span>;
              }
              if (part.stroke) {
                return <span key={i} className="stroke">{i > 0 ? ' ' : ''}{part.stroke.toUpperCase()}</span>;
              }
              return null;
            })}
          </div>
          <div className="gl-sub">{game.sub}</div>
          <div className="gl-divider"></div>
        </div>
      </div>
      <MetadataPanel game={game} />
    </div>
  );
}

// ─── METADATA PANEL ────────────────────────────────────────────────────────
function MetadataPanel({ game }) {
  return (
    <div className="meta">
      <div className="meta-cell">
        <div className="k">Genre</div>
        <div className="v">{game.genre}</div>
      </div>
      <div className="meta-cell">
        <div className="k">Players</div>
        <div className="v">{game.players}</div>
      </div>
      <div className="meta-cell">
        <div className="k">Plays · Hi</div>
        <div className="v tab hi">{String(game.playCount).padStart(3,'0')}</div>
      </div>
      <div className="meta-cell">
        <div className="k">Last Session</div>
        <div className="v">{game.lastPlayed}</div>
      </div>
    </div>
  );
}

// ─── EMPTY-LIBRARY STATE (system has 0 matched games) ──────────────────────
function EmptyLibrary({ systemMeta }) {
  return (
    <div className="empty-lib">
      <div className="el-frame">
        <div className="el-noise"></div>
        <div className="el-glyph">⚠</div>
        <div className="el-ttl">LIBRARY NOT INDEXED</div>
        <div className="el-sub">{systemMeta.name.toUpperCase()} · {systemMeta.count} titles available · 0 scraped</div>
        <div className="el-actions">
          <span className="ek">[Y]</span><span>SCRAPE NOW</span>
          <span className="ek">[B]</span><span>BACK TO SYSTEMS</span>
        </div>
      </div>
    </div>
  );
}

// ─── VERTICAL GAME WHEEL ───────────────────────────────────────────────────
function GameWheel({ games, index, total }) {
  const STRIDE = 88;
  const offset = -(index * STRIDE) - STRIDE / 2;

  return (
    <div className="wheel-col">
      <div className="wheel-header">
        <span>NOW BROWSING</span>
        <span className="v">{String(index + 1).padStart(2, '0')}</span>
        <span style={{opacity:.5}}>/</span>
        <span className="v" style={{color:'var(--bone-dim)'}}>{String(total).padStart(2, '0')}</span>
      </div>
      <div className="wheel-frame">
        <div className="wheel-track" style={{ transform: `translateY(${offset}px)` }}>
          {games.map((g, i) => {
            const d = Math.abs(i - index);
            let cls = 'wheel-item';
            if (d === 0) cls += ' active';
            else if (d === 1) cls += ' near';
            else if (d >= 3) cls += ' far';
            return (
              <div key={g.id} className={cls}
                   style={{ '--card-hue': g.hue }}>
                <div className={'wheel-card' + (g.favorite ? ' is-fav' : '')}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ttl">{g.title}</span>
                  <span className="star"></span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="wheel-rail"></div>
      </div>
    </div>
  );
}

// ─── ARCADE BOTTOM CONTROLS HINT ───────────────────────────────────────────
function ArcadeControlsHint({ screen, dir }) {
  // Hints adapt per screen
  const hints = screen === 'home' ? [
    { btn:'green',  k:'A', label:'Select', sub:'enter menu' },
    { btn:'red',    k:'B', label:'Exit',   sub:'shut down'  },
    { btn:'yellow', k:'Y', label:'About',  sub:'cabinet info' },
    { btn:'blue',   k:'X', label:'Theme',  sub:'cycle theme'  },
  ] : screen === 'systems' ? [
    { btn:'green',  k:'A', label:'Open',     sub:'load library' },
    { btn:'red',    k:'B', label:'Back',     sub:'main menu'    },
    { btn:'yellow', k:'Y', label:'Pin',      sub:'add favorite' },
    { btn:'blue',   k:'X', label:'Filter',   sub:'platform / collection' },
  ] : [
    { btn:'green',  k:'A', label:'Launch',   sub:'start game'   },
    { btn:'red',    k:'B', label:'Back',     sub:'to systems'   },
    { btn:'yellow', k:'Y', label:'Favorite', sub:'pin / scrape' },
    { btn:'blue',   k:'X', label:'Info',     sub:'history · cheats' },
  ];

  return (
    <div className="controls">
      <div className="joystick">
        <div className="joy-stick"></div>
        <div className="joy-arrows">
          <i></i><i className="on" style={{opacity: dir==='up'?1:.18}}></i><i></i>
          <i className="on l" style={{opacity: dir==='left'?1:.18}}></i><i></i><i className="on r" style={{opacity: dir==='right'?1:.18}}></i>
          <i></i><i className="on d" style={{opacity: dir==='down'?1:.18}}></i><i></i>
        </div>
        <span style={{marginLeft:6}}>navigate</span>
      </div>
      <div className="btn-hints">
        {hints.map(h => (
          <div className="btn-hint" key={h.k}>
            <span className={'arcade-btn ' + h.btn}>{h.k}</span>
            <span className="lbl"><b>{h.label}</b><span>{h.sub}</span></span>
          </div>
        ))}
      </div>
      <div className="right-coin">
        <span className="coin">25¢</span>
        <span>credits</span>
        <span className="credits">99</span>
      </div>
    </div>
  );
}

// ─── CRT CHANNEL-CHANGE TRANSITION OVERLAY ─────────────────────────────────
function ChannelChange() {
  return (
    <div className="chan-change">
      <div className="cc-bar"></div>
      <div className="cc-static"></div>
      <div className="cc-text">CH ▲</div>
    </div>
  );
}

// ─── ATTRACT MODE OVERLAY ──────────────────────────────────────────────────
function AttractMode({ games }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);
  const featured = games[tick % games.length];
  return (
    <div className="attract" style={{ '--hue': featured.hue, '--hue2': featured.hue2 }}>
      <div className="attract-big">
        <span className="l1">PLAY</span>
        <span className="l2">{featured.title.toUpperCase()}</span>
      </div>
      <div className="attract-marquee-strip">
        {games.concat(games).slice(0, 14).map((g, i) => (
          <React.Fragment key={i}>
            <span>{g.title.toUpperCase()}</span>
            <span className="pip">◆</span>
          </React.Fragment>
        ))}
      </div>
      <div className="attract-hint">Press any button to continue</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP — state machine
// ═══════════════════════════════════════════════════════════════════════════
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scanlines": 1,
  "glow": 1,
  "attract": false,
  "forceMissing": false,
  "bgEnergy": 1,
  "startScreen": "home"
}/*EDITMODE-END*/;

function App() {
  const games = window.GAMES;
  const systems = window.SYSTEMS;

  const [t, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);

  // screen: 'home' | 'systems' | 'wheel'
  const [screen, setScreen] = useState(t.startScreen || 'home');
  useEffect(() => { if (t.startScreen && t.startScreen !== screen) setScreen(t.startScreen); /* eslint-disable-next-line */}, [t.startScreen]);

  const [menuIndex, setMenuIndex] = useState(0);   // home menu cursor
  const [sysIndex,  setSysIndex]  = useState(0);   // system picker cursor
  const [gameIndex, setGameIndex] = useState(0);   // wheel cursor
  const [lastDir, setLastDir]     = useState(null);
  const [changing, setChanging]   = useState(false);

  // ── derive view-models ─────────────────────────────────────────────────
  const totals = useMemo(() => ({
    systems: systems.filter(s => s.kind === 'platform').length,
    titles: systems.filter(s => s.kind === 'platform').reduce((n, s) => n + s.count, 0),
    favorites: games.filter(g => g.favorite).length,
  }), [systems, games]);

  const activeSystem = systems[sysIndex];

  // games filtered by current system / collection / meta list
  const filteredGames = useMemo(() => {
    if (!activeSystem) return games;
    if (activeSystem.id === 'meta_favs')   return games.filter(g => g.favorite);
    if (activeSystem.id === 'meta_recent') return games.filter(g => g.lastPlayed && g.lastPlayed !== 'NEVER');
    if (activeSystem.id === 'meta_random') return [...games].sort(() => Math.random() - .5).slice(0, 12);
    if (activeSystem.id === 'col_metalslug') return games.filter(g => g.systemId === 'neogeo' && g.genre === 'Run & Gun');
    if (activeSystem.id === 'col_streetf')   return games.filter(g => g.genre === 'Versus Fighting' && (g.systemId === 'cps1' || g.systemId === 'cps2'));
    if (activeSystem.id === 'col_kof')       return games.filter(g => g.systemId === 'neogeo' && g.genre === 'Versus Fighting');
    if (activeSystem.id === 'col_shmups')    return games.filter(g => g.genre === 'Shoot \u2019em Up');
    return games.filter(g => g.systemId === activeSystem.id);
  }, [activeSystem, games]);

  const safeGameIndex = Math.min(gameIndex, Math.max(0, filteredGames.length - 1));
  const game = filteredGames[safeGameIndex];

  const systemMeta = useMemo(() => {
    if (screen === 'systems') return activeSystem;
    if (screen === 'wheel') return activeSystem;
    return null;
  }, [screen, activeSystem]);

  // ── dynamic background hues ────────────────────────────────────────────
  useEffect(() => {
    const el = document.getElementById('cabinet');
    if (!el) return;
    let hue = 35, hue2 = 195;
    if (screen === 'systems' && activeSystem) { hue = activeSystem.hue; hue2 = activeSystem.hue2; }
    else if (screen === 'wheel' && game)      { hue = game.hue; hue2 = game.hue2; }
    else if (screen === 'home')               { hue = 35; hue2 = 200; }
    el.style.setProperty('--hue', hue);
    el.style.setProperty('--hue2', hue2);
    el.style.setProperty('--scan', t.scanlines);
    el.style.setProperty('--glow', t.glow);
    el.style.setProperty('--bg-energy', t.bgEnergy);
  }, [screen, activeSystem, game, t.scanlines, t.glow, t.bgEnergy]);

  // ── channel-change transition ─────────────────────────────────────────
  const flickerTo = useCallback((nextScreen) => {
    setChanging(true);
    setTimeout(() => setScreen(nextScreen), 180);
    setTimeout(() => setChanging(false), 520);
  }, []);

  // ── input handling ─────────────────────────────────────────────────────
  const showDir = (d) => {
    setLastDir(d);
    clearTimeout(showDir._t);
    showDir._t = setTimeout(() => setLastDir(null), 220);
  };

  useEffect(() => {
    function onKey(e) {
      if (t.attract) {
        if (e.key) setTweak('attract', false);
        return;
      }
      const k = e.key;

      // global: A toggles attract for demo
      if (k === 'p' || k === 'P') { setTweak('attract', true); return; }

      if (screen === 'home') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { setMenuIndex(i => (i+1) % window.MENU_ITEMS.length); showDir('down'); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { setMenuIndex(i => (i-1+window.MENU_ITEMS.length) % window.MENU_ITEMS.length); showDir('up'); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') {
          const item = window.MENU_ITEMS[menuIndex];
          if (item.id === 'favs')    { setSysIndex(systems.findIndex(s => s.id === 'meta_favs'));   flickerTo('wheel'); }
          else if (item.id === 'recent')  { setSysIndex(systems.findIndex(s => s.id === 'meta_recent')); flickerTo('wheel'); }
          else if (item.id === 'shuffle') { setSysIndex(systems.findIndex(s => s.id === 'meta_random')); flickerTo('wheel'); }
          else if (item.id === 'settings'){ /* open tweaks */ }
          else                            { flickerTo('systems'); }
          e.preventDefault();
        }
        else if (k === 'Escape' || k === 'b' || k === 'B') { /* no-op at home */ }
      } else if (screen === 'systems') {
        if (k === 'ArrowRight' || k === 'l' || k === 'd') { setSysIndex(i => (i+1) % systems.length); showDir('right'); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h' || k === 'a') { setSysIndex(i => (i-1+systems.length) % systems.length); showDir('left'); e.preventDefault(); }
        else if (k === 'ArrowDown') { setSysIndex(i => (i+1) % systems.length); showDir('right'); e.preventDefault(); }
        else if (k === 'ArrowUp')   { setSysIndex(i => (i-1+systems.length) % systems.length); showDir('left'); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { setGameIndex(0); flickerTo('wheel'); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { flickerTo('home'); e.preventDefault(); }
      } else if (screen === 'wheel') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { setGameIndex(i => (i+1+filteredGames.length) % Math.max(1,filteredGames.length)); showDir('down'); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { setGameIndex(i => (i-1+filteredGames.length) % Math.max(1,filteredGames.length)); showDir('up'); e.preventDefault(); }
        else if (k === 'PageDown') { setGameIndex(i => Math.min(filteredGames.length-1, i+5)); showDir('down'); e.preventDefault(); }
        else if (k === 'PageUp') { setGameIndex(i => Math.max(0, i-5)); showDir('up'); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { flickerTo('systems'); e.preventDefault(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, menuIndex, systems, filteredGames, t.attract, setTweak, flickerTo]);

  // attract idle trigger
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      if (t.attract) return;
      timer = setTimeout(() => setTweak('attract', true), 90_000);
    };
    reset();
    window.addEventListener('keydown', reset);
    window.addEventListener('mousemove', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('mousemove', reset);
    };
  }, [t.attract, setTweak]);

  // ── render ─────────────────────────────────────────────────────────────
  const effectiveGame = game && t.forceMissing ? { ...game, hasMedia: false } : game;

  function handleHomeSelect(id) {
    if (id === 'favs')    { setSysIndex(systems.findIndex(s => s.id === 'meta_favs'));   flickerTo('wheel'); return; }
    if (id === 'recent')  { setSysIndex(systems.findIndex(s => s.id === 'meta_recent')); flickerTo('wheel'); return; }
    if (id === 'shuffle') { setSysIndex(systems.findIndex(s => s.id === 'meta_random')); flickerTo('wheel'); return; }
    if (id === 'settings'){ return; }
    flickerTo('systems');
  }

  return (
    <>
      <div className={'bg bg-' + screen}>
        <div className="bg-grid"></div>
      </div>

      <div className="layout">
        <Marquee screen={screen} game={effectiveGame} systemMeta={systemMeta} totals={totals}/>
        <div className={'main main-' + screen}>
          {screen === 'home' && window.HomeScreen && (
            <window.HomeScreen
              menuIndex={menuIndex}
              onSelect={(id, i) => { setMenuIndex(i); handleHomeSelect(id); }}
              totals={totals}/>
          )}
          {screen === 'systems' && window.SystemPicker && (
            <window.SystemPicker
              systems={systems}
              index={sysIndex}
              onPick={(i) => { setSysIndex(i); }}
              onEnter={(i) => { setSysIndex(i); setGameIndex(0); flickerTo('wheel'); }}/>
          )}
          {screen === 'wheel' && (
            filteredGames.length === 0 ? (
              <EmptyLibrary systemMeta={activeSystem}/>
            ) : (
              <>
                <CRTPreview game={effectiveGame}/>
                <GameLogoBig game={effectiveGame}/>
                <GameWheel games={filteredGames} index={safeGameIndex} total={filteredGames.length}/>
              </>
            )
          )}
        </div>
        <ArcadeControlsHint screen={screen} dir={lastDir}/>
      </div>

      <div className="fx-scanlines" style={{ opacity: t.scanlines }}></div>
      <div className="fx-noise"></div>
      <div className="fx-vignette"></div>

      {changing && <ChannelChange/>}
      {t.attract && <AttractMode games={games}/>}

      {window.TweaksPanel && (
        <window.TweaksPanel>
          <window.TweakSection label="Navigation" />
          <window.TweakSelect label="Screen" value={screen}
            options={[
              {value:'home',label:'Home'},
              {value:'systems',label:'Systems'},
              {value:'wheel',label:'Game Wheel'}
            ]}
            onChange={(v) => flickerTo(v)} />
          <window.TweakSection label="CRT" />
          <window.TweakSlider label="Scanlines" value={t.scanlines} min={0} max={1.4} step={.05}
            onChange={(v) => setTweak('scanlines', v)} />
          <window.TweakSlider label="Glow / neon" value={t.glow} min={0} max={1.6} step={.05}
            onChange={(v) => setTweak('glow', v)} />
          <window.TweakSlider label="Bg energy" value={t.bgEnergy} min={.2} max={1.4} step={.05}
            onChange={(v) => setTweak('bgEnergy', v)} />
          <window.TweakSection label="States" />
          <window.TweakToggle label="Attract mode" value={t.attract}
            onChange={(v) => setTweak('attract', v)} />
          <window.TweakToggle label="Force missing asset" value={t.forceMissing}
            onChange={(v) => setTweak('forceMissing', v)} />
        </window.TweaksPanel>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

window.HYPERWHEEL_THEME = HYPERWHEEL_THEME;
