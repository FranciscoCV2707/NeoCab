// theme-neonwall.jsx — NeoCab CoinOps Neon Wall
// Cinematic premium frontend for big cabinets.
// Layout: fullscreen blurred bg of selected game, wall of game tiles in perspective,
// featured game center (big logo + video + marquee + launch), collection rail bottom.
const { useState: useStateNW, useEffect: useEffectNW, useMemo: useMemoNW } = React;

const NEONWALL_CSS = `
.theme-neonwall{
  position:absolute;inset:0;overflow:hidden;color:#fff;
  font-family:'Space Grotesk', sans-serif;
  --nw-h: 270; --nw-h2: 340;
  --nw-bone:#fff5e4;
  --nw-accent: oklch(72% 0.22 var(--nw-h));
  --nw-accent2: oklch(72% 0.20 var(--nw-h2));
  --nw-gold: oklch(82% 0.18 75);
  --nw-deep:#04030a;
}

/* ─── BLURRED FULLSCREEN BG ─── */
.nw-bg{position:absolute;inset:0;z-index:0;}
.nw-bg::before{
  content:"";position:absolute;inset:-12%;
  background:
    radial-gradient(60% 50% at 50% 35%, oklch(38% 0.22 var(--nw-h) / .85), transparent 70%),
    radial-gradient(55% 45% at 75% 85%, oklch(32% 0.20 var(--nw-h2) / .65), transparent 70%),
    radial-gradient(40% 35% at 15% 80%, oklch(35% 0.16 var(--nw-h) / .55), transparent 70%),
    linear-gradient(180deg, oklch(10% 0.04 var(--nw-h)) 0%, var(--nw-deep) 100%);
  filter:blur(1.5px) saturate(1.15);
  transition:background 800ms ease;
}
.nw-bg::after{
  content:"";position:absolute;inset:0;
  background:
    radial-gradient(40% 30% at 50% 70%, oklch(60% 0.22 var(--nw-h) / .15), transparent 70%);
  filter:blur(40px);
}
.nw-bg-rays{
  position:absolute;left:50%;top:120%;width:2400px;height:1500px;transform:translateX(-50%);
  background:radial-gradient(50% 60% at 50% 0%, oklch(60% 0.22 var(--nw-h) / .25), transparent 60%);
  filter:blur(60px);
  pointer-events:none;
}
.nw-bg-tex{position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}

/* ─── SHELL ─── */
.nw-shell{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;}

/* ─── TOP MARQUEE/LIGHTBOX ─── */
.nw-top{
  flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:24px 56px 14px;
}
.nw-brand{display:flex;align-items:center;gap:16px;}
.nw-brand-mark{
  width:42px;height:42px;border-radius:10px;
  background:linear-gradient(135deg, var(--nw-accent), oklch(38% 0.20 var(--nw-h)));
  display:flex;align-items:center;justify-content:center;
  font-family:'Major Mono Display', monospace;font-size:22px;color:#fff;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.2), 0 0 18px oklch(60% 0.22 var(--nw-h) / .5);
}
.nw-brand-name{font-family:'Russo One', sans-serif;font-size:22px;letter-spacing:.005em;color:#fff;}
.nw-brand-sub{font-family:'JetBrains Mono', monospace;font-size:9px;letter-spacing:.4em;color:rgba(255,255,255,.5);text-transform:uppercase;margin-top:2px;}

.nw-collection-name{
  flex:1;text-align:center;
  font-family:'Russo One', sans-serif;font-size:30px;letter-spacing:.04em;
  color:#fff;text-transform:uppercase;
  text-shadow:0 0 22px var(--nw-accent), 0 0 50px oklch(60% 0.22 var(--nw-h) / .4);
  position:relative;display:inline-flex;align-items:center;justify-content:center;gap:14px;
}
.nw-collection-name::before, .nw-collection-name::after{
  content:"";width:80px;height:1px;background:linear-gradient(to right, transparent, var(--nw-accent));
  box-shadow:0 0 8px var(--nw-accent);
}
.nw-collection-name::after{background:linear-gradient(to left, transparent, var(--nw-accent));}

.nw-time{
  display:flex;align-items:center;gap:14px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.3em;color:rgba(255,255,255,.5);text-transform:uppercase;
}
.nw-time b{font-family:'Bebas Neue', sans-serif;font-size:20px;color:#fff;letter-spacing:.06em;font-weight:400}
.nw-time .led{width:8px;height:8px;border-radius:50%;background:#5cff8a;box-shadow:0 0 8px #5cff8a;animation:nwPulse 1.6s ease-in-out infinite;}
@keyframes nwPulse{0%,100%{opacity:1}50%{opacity:.4}}

/* ─── MAIN: featured game center + tile wall around ─── */
.nw-main{
  flex:1;display:flex;flex-direction:column;justify-content:center;
  position:relative;min-height:0;
}

/* perspective wall container */
.nw-wall{
  position:relative;flex:1;display:flex;align-items:center;justify-content:center;
  perspective:1600px;perspective-origin:50% 50%;
  min-height:0;
}

/* TILE ROWS (top + bottom rows of fanart cards) */
.nw-tile-row{
  position:absolute;left:50%;display:flex;gap:18px;
  transform-style:preserve-3d;
}
.nw-tile-row.top{top:24px;transform:translateX(-50%) translateZ(-200px) rotateX(15deg);}
.nw-tile-row.bottom{bottom:24px;transform:translateX(-50%) translateZ(-200px) rotateX(-15deg);}
.nw-tile{
  position:relative;width:200px;height:130px;flex:none;
  background:linear-gradient(135deg, oklch(40% 0.18 var(--t-h, var(--nw-h)) / .9), oklch(18% 0.10 var(--t-h, var(--nw-h)) / .9));
  border:1px solid oklch(60% 0.18 var(--t-h, var(--nw-h)) / .45);
  display:flex;flex-direction:column;justify-content:flex-end;padding:10px 14px;
  overflow:hidden;border-radius:6px;
  box-shadow:0 14px 36px rgba(0,0,0,.6);
}
.nw-tile::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(60% 50% at 50% 35%, oklch(60% 0.22 var(--t-h, var(--nw-h)) / .55), transparent 75%);
}
.nw-tile .t{position:relative;font-family:'Russo One', sans-serif;font-size:13px;color:#fff;letter-spacing:.005em;
  text-shadow:0 1px 0 rgba(0,0,0,.7), 0 0 12px oklch(60% 0.22 var(--t-h, var(--nw-h)) / .6);line-height:1.05;}
.nw-tile .s{position:relative;font-family:'JetBrains Mono', monospace;font-size:8px;letter-spacing:.24em;color:rgba(255,255,255,.6);text-transform:uppercase;margin-top:3px;}
.nw-tile.active{
  border-color:var(--nw-bone);
  box-shadow:0 18px 44px rgba(0,0,0,.6), 0 0 24px oklch(60% 0.22 var(--t-h, var(--nw-h)) / .8), 0 0 50px oklch(60% 0.22 var(--t-h, var(--nw-h)) / .4);
}

/* CENTER FEATURED GAME */
.nw-featured{
  position:relative;z-index:2;
  display:grid;grid-template-columns:1fr 700px;gap:36px;
  width:1500px;align-items:center;padding:0 24px;
}
.nw-feat-text{display:flex;flex-direction:column;gap:14px;animation:nwFeatIn 480ms cubic-bezier(.18,.9,.22,1.05) both;}
@keyframes nwFeatIn{from{transform:translateX(-12px);opacity:0}to{transform:none;opacity:1}}
.nw-feat-eyebrow{
  display:flex;align-items:center;gap:14px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.4em;color:rgba(255,255,255,.55);
  text-transform:uppercase;
}
.nw-feat-eyebrow .dot{width:6px;height:6px;background:var(--nw-accent2);border-radius:50%;box-shadow:0 0 6px var(--nw-accent2);}
.nw-feat-logo{
  font-family:'Russo One', sans-serif;font-size:96px;line-height:.88;color:var(--nw-bone);
  letter-spacing:-.005em;text-transform:uppercase;
  text-shadow:0 6px 0 oklch(28% 0.18 var(--nw-h)), 0 12px 30px rgba(0,0,0,.6), 0 0 40px oklch(60% 0.22 var(--nw-h) / .55);
}
.nw-feat-logo .accent{color:var(--nw-accent2);text-shadow:0 0 22px var(--nw-accent2);}
.nw-feat-logo .stroke{-webkit-text-stroke:2px var(--nw-accent);color:transparent;text-shadow:none;filter:drop-shadow(0 0 12px var(--nw-accent));}
.nw-feat-sub{font-family:'Bebas Neue', sans-serif;font-size:30px;letter-spacing:.18em;color:rgba(255,255,255,.7);text-transform:uppercase;}
.nw-feat-tagline{font-family:'Space Grotesk', sans-serif;font-style:italic;font-size:18px;color:rgba(255,255,255,.7);max-width:550px;line-height:1.4;}

.nw-feat-meta{
  display:flex;align-items:center;gap:24px;padding:12px 0 0;margin-top:6px;
  border-top:1px dashed rgba(255,255,255,.15);
}
.nw-feat-meta-cell{display:flex;flex-direction:column;gap:2px;}
.nw-feat-meta-cell .k{font-family:'JetBrains Mono', monospace;font-size:9px;letter-spacing:.32em;color:rgba(255,255,255,.5);text-transform:uppercase;}
.nw-feat-meta-cell .v{font-family:'Bebas Neue', sans-serif;font-size:22px;line-height:1;color:#fff;letter-spacing:.04em;}
.nw-feat-meta-cell .v.hi{color:var(--nw-accent2);text-shadow:0 0 10px var(--nw-accent2);}

.nw-launch-btn{
  margin-top:14px;display:inline-flex;align-items:center;gap:14px;
  padding:14px 28px;align-self:flex-start;
  background:linear-gradient(135deg, var(--nw-accent), oklch(48% 0.22 var(--nw-h)));
  border:1px solid rgba(255,255,255,.25);
  font-family:'Russo One', sans-serif;font-size:20px;color:#fff;letter-spacing:.05em;text-transform:uppercase;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3), 0 12px 30px rgba(0,0,0,.5), 0 0 30px oklch(60% 0.22 var(--nw-h) / .55);
  cursor:pointer;
}
.nw-launch-btn .kbd{
  width:30px;height:30px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#9bff9b,#1ea03a 70%);color:#0a0712;
  font-family:'Russo One', sans-serif;font-size:14px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:inset 0 -3px 6px rgba(0,0,0,.4), inset 0 3px 6px rgba(255,255,255,.4);
}

/* Featured media (right) — cinema preview */
.nw-feat-media-col{display:flex;flex-direction:column;gap:14px;animation:nwFeatMediaIn 520ms cubic-bezier(.18,.9,.22,1.05) both;}
@keyframes nwFeatMediaIn{from{transform:translateX(12px) scale(.98);opacity:0}to{transform:none;opacity:1}}
.nw-feat-marquee{
  height:80px;padding:0 18px;
  background:linear-gradient(135deg, oklch(20% 0.10 var(--nw-h) / .85), oklch(8% 0.06 var(--nw-h) / .8));
  border:1px solid var(--nw-accent);
  display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;
  box-shadow:0 0 22px oklch(60% 0.22 var(--nw-h) / .35);
}
.nw-feat-marquee::before{
  content:"";position:absolute;left:0;right:0;bottom:0;height:2px;
  background:linear-gradient(to right, transparent, var(--nw-accent), transparent);
  box-shadow:0 0 12px var(--nw-accent);
}
.nw-marquee-text{font-family:'Russo One', sans-serif;font-size:32px;line-height:1;color:#fff;letter-spacing:.01em;text-transform:uppercase;text-shadow:0 0 14px var(--nw-accent), 0 0 30px oklch(60% 0.22 var(--nw-h) / .55);text-align:center;white-space:nowrap;}
.nw-marquee-text .accent{color:var(--nw-accent2);text-shadow:0 0 14px var(--nw-accent2);}
.nw-marquee-text .stroke{-webkit-text-stroke:1.5px var(--nw-accent);color:transparent;text-shadow:none;}

.nw-feat-screen{
  position:relative;height:380px;
  background:#000;
  border:1px solid var(--nw-accent);
  box-shadow:0 30px 80px rgba(0,0,0,.65), 0 0 50px oklch(60% 0.22 var(--nw-h) / .35);
  overflow:hidden;
}
.nw-feat-screen-content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;text-align:center;background:radial-gradient(70% 60% at 50% 40%, oklch(28% 0.20 var(--nw-h) / 1), oklch(6% 0.04 var(--nw-h)) 80%);}
.nw-feat-screen-content .big{font-family:'Russo One', sans-serif;font-size:72px;line-height:.95;color:#fff;letter-spacing:.005em;text-shadow:0 0 28px var(--nw-accent);}
.nw-feat-screen-content .sub{font-family:'Bebas Neue', sans-serif;font-size:26px;letter-spacing:.2em;color:var(--nw-accent2);margin-top:14px;}
.nw-feat-screen-content .copy{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.3em;color:rgba(255,255,255,.5);margin-top:24px;}
.nw-feat-screen-fallback{display:flex;flex-direction:column;align-items:center;gap:14px;color:rgba(255,255,255,.55);padding:32px;text-align:center;justify-content:center;height:100%;}
.nw-feat-screen-fallback .glyph{font-family:'Major Mono Display', monospace;font-size:80px;color:var(--nw-accent2);text-shadow:0 0 24px var(--nw-accent2);}
.nw-feat-screen-fallback .ttl{font-family:'Russo One', sans-serif;font-size:32px;color:#fff;letter-spacing:.04em;}
.nw-feat-screen-fallback .sub{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.32em;text-transform:uppercase;}
.nw-feat-screen-corner{position:absolute;font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.3em;color:rgba(255,255,255,.7);text-transform:uppercase;}
.nw-feat-screen-corner.tl{top:14px;left:18px}
.nw-feat-screen-corner.tr{top:14px;right:18px;color:var(--nw-accent2);}
.nw-feat-screen-corner.bl{bottom:14px;left:18px;color:rgba(255,255,255,.5)}
.nw-feat-screen-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom, rgba(0,0,0,.45) 0 1px, transparent 1px 3px);mix-blend-mode:multiply;opacity:.45;}

/* REFLECTIVE FLOOR (under wall) */
.nw-floor{
  position:absolute;left:0;right:0;bottom:0;height:38%;pointer-events:none;
  background:
    repeating-linear-gradient(to right, transparent 0 64px, oklch(70% 0.22 var(--nw-h) / .25) 64px 65px),
    repeating-linear-gradient(to top, transparent 0 48px, oklch(70% 0.22 var(--nw-h) / .18) 48px 49px),
    linear-gradient(to top, oklch(40% 0.22 var(--nw-h) / .12), transparent 80%);
  transform:perspective(700px) rotateX(58deg) translateY(20%);
  transform-origin:bottom center;
  mask-image:linear-gradient(to top, #000 30%, transparent 95%);
  opacity:.5;
}

/* ─── COLLECTION RAIL bottom ─── */
.nw-rail-wrap{
  position:relative;z-index:2;flex:none;padding:8px 56px 0;
}
.nw-rail-head{
  display:flex;align-items:center;gap:14px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.36em;color:rgba(255,255,255,.55);
  text-transform:uppercase;margin-bottom:10px;
}
.nw-rail-head .line{flex:1;height:1px;background:linear-gradient(to right, transparent, rgba(255,255,255,.18), transparent);}
.nw-rail{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none;}
.nw-rail::-webkit-scrollbar{display:none}
.nw-rail-card{
  flex:none;display:flex;align-items:center;gap:12px;padding:10px 16px;
  background:linear-gradient(135deg, oklch(16% 0.06 var(--c-h, var(--nw-h)) / .85), oklch(8% 0.04 var(--c-h, var(--nw-h)) / .8));
  border:1px solid oklch(40% 0.14 var(--c-h, var(--nw-h)) / .4);
  border-radius:8px;cursor:pointer;
  transition:all 200ms ease;
}
.nw-rail-card .ic{
  width:30px;height:30px;border-radius:6px;
  background:linear-gradient(135deg, oklch(55% 0.22 var(--c-h, var(--nw-h))), oklch(28% 0.16 var(--c-h, var(--nw-h))));
  font-family:'Major Mono Display', monospace;font-size:14px;color:#fff;
  display:flex;align-items:center;justify-content:center;
}
.nw-rail-card .lbl{display:flex;flex-direction:column;gap:1px;line-height:1.1;}
.nw-rail-card .name{font-family:'Bebas Neue', sans-serif;font-size:18px;letter-spacing:.06em;color:#fff;}
.nw-rail-card .ct{font-family:'JetBrains Mono', monospace;font-size:9px;letter-spacing:.28em;color:rgba(255,255,255,.5);text-transform:uppercase;}
.nw-rail-card.active{
  background:linear-gradient(135deg, oklch(50% 0.22 var(--c-h)) 0%, oklch(25% 0.18 var(--c-h)) 80%);
  border-color:var(--nw-bone);
  box-shadow:0 0 22px oklch(60% 0.22 var(--c-h) / .55);
}

/* ─── BOTTOM CONTROLS HINT ─── */
.nw-controls{
  position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:24px;
  padding:8px 56px 16px;
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.28em;color:rgba(255,255,255,.55);text-transform:uppercase;
}
.nw-controls .ctl{display:flex;align-items:center;gap:8px;}
.nw-controls .ctl b{font-family:'Bebas Neue', sans-serif;font-size:18px;color:#fff;font-weight:400;letter-spacing:.06em;}
.nw-controls .ctl .kk{
  width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'Russo One', sans-serif;font-size:11px;color:#0a0712;
  box-shadow:inset 0 -2px 4px rgba(0,0,0,.4), inset 0 2px 4px rgba(255,255,255,.4);
}
.nw-controls .ctl .kk.g{background:radial-gradient(circle at 35% 30%,#9bff9b,#1ea03a 70%)}
.nw-controls .ctl .kk.r{background:radial-gradient(circle at 35% 30%,#ff9a9a,#c41a1a 70%)}
.nw-controls .ctl .kk.y{background:radial-gradient(circle at 35% 30%,#ffe89a,#d99000 70%)}
.nw-controls .ctl .kk.b{background:radial-gradient(circle at 35% 30%,#a0e9ff,#0a7aa8 70%)}
.nw-controls .spacer{flex:1}
`;

function injectCssNW() {
  if (document.getElementById('theme-neonwall-css')) return;
  const s = document.createElement('style');
  s.id = 'theme-neonwall-css';
  s.textContent = NEONWALL_CSS;
  document.head.appendChild(s);
}

// Collections defined for this theme — flavored buckets
const NW_COLLECTIONS = [
  { id: 'arcade',  label: 'Arcade Classics',  icon: '⚙', hue: 35,  filter: g => g.systemId === 'arcade' || g.systemId === 'cps1' || g.systemId === 'cps2' || g.systemId === 'neogeo' },
  { id: 'fighting',label: 'Fighting Games',   icon: '✊', hue: 0,   filter: g => g.genre === 'Versus Fighting' },
  { id: 'beat',    label: 'Beat \u2019em Ups',icon: '⚔', hue: 25,  filter: g => g.genre.startsWith('Beat') },
  { id: 'rng',     label: 'Run & Gun',        icon: '◎', hue: 130, filter: g => g.genre === 'Run & Gun' },
  { id: 'platform',label: 'Platformers',      icon: '◆', hue: 210, filter: g => g.genre === 'Platformer' },
  { id: 'favs',    label: 'Favorites',        icon: '★', hue: 320, filter: g => g.favorite },
  { id: 'recent',  label: 'Recently Played',  icon: '↻', hue: 165, filter: g => g.lastPlayed === 'Today' || g.lastPlayed === 'Yesterday' || g.lastPlayed.includes('day') },
];

function useClockNW() {
  const [t, setT] = useStateNW(() => new Date());
  useEffectNW(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
}

function NeonWallTheme({ onChangeTheme }) {
  useEffectNW(() => { injectCssNW(); }, []);
  const allGames = window.PACK_GAMES;
  const allSystems = window.PACK_SYSTEMS;

  const shell = window.useArcadeShell({ onChangeTheme, defaultSystem: 0 });
  const [collIndex, setCollIndex] = useStateNW(0);

  const coll = NW_COLLECTIONS[collIndex];
  const games = useMemoNW(() => {
    if (shell.shortcut) return shell.shortcut.games;
    return allGames.filter(coll.filter);
  }, [allGames, coll, shell.shortcut]);
  const safeIdx = Math.min(shell.gameIndex, Math.max(0, games.length - 1));
  const game = games[safeIdx];

  useEffectNW(() => {
    const root = document.querySelector('.theme-neonwall');
    if (!root || !game) return;
    root.style.setProperty('--nw-h', game.hue);
    root.style.setProperty('--nw-h2', game.hue2);
  }, [game]);

  // shared keys: but on 'wheel' override up/down to navigate collections (not systems)
  useEffectNW(() => {
    function onKey(e) {
      const k = e.key;
      const screen = shell.screen;
      if (screen === 'home') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { shell.setMenuIndex(i => (i+1) % window.ARCADE_MENU.length); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { shell.setMenuIndex(i => (i-1+window.ARCADE_MENU.length) % window.ARCADE_MENU.length); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') {
          const id = window.ARCADE_MENU[shell.menuIndex].id;
          if (id === 'play') { shell.setShortcut(null); shell.setGameIndex(0); shell.setScreen('wheel'); }
          else shell.openMenuItem(id, allGames);
          e.preventDefault();
        }
      } else if (screen === 'wheel') {
        if (k === 'ArrowRight' || k === 'l') { if (games.length) shell.setGameIndex(i => (i+1) % games.length); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h') { if (games.length) shell.setGameIndex(i => (i-1+games.length) % games.length); e.preventDefault(); }
        else if (k === 'ArrowDown' || k === 'j') { setCollIndex(i => (i+1) % NW_COLLECTIONS.length); shell.setGameIndex(0); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k') { setCollIndex(i => (i-1+NW_COLLECTIONS.length) % NW_COLLECTIONS.length); shell.setGameIndex(0); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { shell.goBack(); e.preventDefault(); }
      } else if (screen === 'settings') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { shell.setSettingsIndex(i => (i+1) % window.SETTINGS_MENU.length); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { shell.setSettingsIndex(i => (i-1+window.SETTINGS_MENU.length) % window.SETTINGS_MENU.length); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { shell.openSettingsItem(window.SETTINGS_MENU[shell.settingsIndex].id); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { shell.goBack(); e.preventDefault(); }
      } else if (screen === 'themes') {
        const reg = window.THEME_REGISTRY;
        if (k === 'ArrowRight' || k === 'l' || k === 'ArrowDown' || k === 'j') { shell.setThemeFocusIndex(i => (i+1) % reg.length); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h' || k === 'ArrowUp' || k === 'k') { shell.setThemeFocusIndex(i => (i-1+reg.length) % reg.length); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { shell.pickTheme(reg[shell.themeFocusIndex].id); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { shell.goBack(); e.preventDefault(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shell, games, allGames]);

  const time = useClockNW();

  const totals = {
    systems: allSystems.length,
    titles: allSystems.reduce((n, s) => n + s.count, 0),
    favorites: allGames.filter(g => g.favorite).length,
  };

  const topRow = useMemoNW(() => allGames.slice(0, 5), [allGames]);
  const bottomRow = useMemoNW(() => allGames.slice(3, 8), [allGames]);

  return (
    <div className="theme-neonwall" data-screen-label="CoinOps Neon Wall">
      <div className="nw-bg">
        <div className="nw-bg-rays"></div>
        <div className="nw-bg-tex"></div>
      </div>

      {shell.screen === 'home' && (
        <window.HomeShell shell={shell} themeName="CoinOps Neon Wall" themeTag="Cinematic · premium wall"
                          totals={totals} onAction={(id) => {
                            if (id === 'play') { shell.setShortcut(null); shell.setGameIndex(0); shell.setScreen('wheel'); return; }
                            shell.openMenuItem(id, allGames);
                          }} />
      )}
      {shell.screen === 'settings' && <window.SettingsShell shell={shell} />}
      {shell.screen === 'themes' && <window.ThemeSwitcherPanel shell={shell} activeId="neonwall" />}
      {shell.screen === 'wheel' && (
      <div className="nw-shell">
        {/* TOP */}
        <div className="nw-top">
          <div className="nw-brand">
            <div className="nw-brand-mark">N</div>
            <div>
              <div className="nw-brand-name">NEOCAB</div>
              <div className="nw-brand-sub">Neon Wall · Cinema Mode</div>
            </div>
          </div>
          <div className="nw-collection-name">{shell.shortcut?.label || coll.label}</div>
          <div className="nw-time">
            <span className="led"></span>
            <span>LIVE</span>
            <span style={{opacity:.5}}>·</span>
            <b>{time}</b>
          </div>
        </div>

        {/* MAIN WALL */}
        <div className="nw-main">
          <div className="nw-wall">
            {/* Top row tiles */}
            <div className="nw-tile-row top">
              {topRow.map(g => (
                <div key={g.id} className={'nw-tile' + (g.id === game?.id ? ' active' : '')} style={{'--t-h': g.hue}}>
                  <div className="t">{g.title}</div>
                  <div className="s">{g.system}</div>
                </div>
              ))}
            </div>
            {/* Bottom row tiles */}
            <div className="nw-tile-row bottom">
              {bottomRow.map(g => (
                <div key={g.id} className={'nw-tile' + (g.id === game?.id ? ' active' : '')} style={{'--t-h': g.hue}}>
                  <div className="t">{g.title}</div>
                  <div className="s">{g.system}</div>
                </div>
              ))}
            </div>

            {/* FEATURED GAME center */}
            {game ? (
              <div className="nw-featured" key={game.id}>
                <div className="nw-feat-text">
                  <div className="nw-feat-eyebrow">
                    <span className="dot"></span>
                    <span>NOW FEATURED · {game.system}</span>
                    <span style={{opacity:.4}}>·</span>
                    <span>{game.year}</span>
                  </div>
                  <div className="nw-feat-logo">
                    {game.titleParts.map((p,i) => {
                      if (typeof p === 'string') return <span key={i}>{i>0?' ':''}{p}</span>;
                      if (p.accent) return <span key={i} className="accent">{i>0?' ':''}{p.accent}</span>;
                      if (p.stroke) return <span key={i} className="stroke">{i>0?' ':''}{p.stroke}</span>;
                      return null;
                    })}
                  </div>
                  <div className="nw-feat-sub">{game.sub}</div>
                  <div className="nw-feat-tagline">"{game.tagline}"</div>
                  <div className="nw-feat-meta">
                    <div className="nw-feat-meta-cell"><div className="k">Maker</div><div className="v">{game.manufacturer}</div></div>
                    <div className="nw-feat-meta-cell"><div className="k">Genre</div><div className="v">{game.genre}</div></div>
                    <div className="nw-feat-meta-cell"><div className="k">Players</div><div className="v">{game.players}</div></div>
                    <div className="nw-feat-meta-cell"><div className="k">Plays</div><div className="v hi">{game.playCount}</div></div>
                  </div>
                  <div className="nw-launch-btn">
                    <span className="kbd">A</span>
                    <span>Launch Game</span>
                  </div>
                </div>

                <div className="nw-feat-media-col">
                  <div className="nw-feat-marquee">
                    <div className="nw-marquee-text">
                      {game.titleParts.map((p,i) => {
                        if (typeof p === 'string') return <span key={i}>{i>0?' ':''}{p}</span>;
                        if (p.accent) return <span key={i} className="accent">{i>0?' ':''}{p.accent}</span>;
                        if (p.stroke) return <span key={i} className="stroke">{i>0?' ':''}{p.stroke}</span>;
                        return null;
                      })}
                    </div>
                  </div>
                  <div className="nw-feat-screen">
                    {(game.hasVideo || game.hasScreenshot) ? (
                      <>
                        <div className="nw-feat-screen-content">
                          <div className="big">{game.title.toUpperCase()}</div>
                          <div className="sub">{game.sub}</div>
                          <div className="copy">© {game.year} {game.manufacturer.toUpperCase()}</div>
                        </div>
                        <div className="nw-feat-screen-corner tl">CH 02</div>
                        <div className="nw-feat-screen-corner tr">● {game.hasVideo ? 'CINEMA · 16:9' : 'STILL · 4:3'}</div>
                        <div className="nw-feat-screen-corner bl">{game.hasBackground ? 'FANART · 1920' : 'NO FANART'}</div>
                      </>
                    ) : (
                      <div className="nw-feat-screen-fallback">
                        <div className="glyph">◇</div>
                        <div className="ttl">NO MEDIA</div>
                        <div className="sub">video · screenshot · fanart missing</div>
                        <div className="sub" style={{color:'var(--nw-accent2)'}}>↳ press [Y] to scrape</div>
                      </div>
                    )}
                    <div className="nw-feat-screen-scan"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="nw-feat-text" style={{textAlign:'center',padding:60}}>
                <div className="nw-feat-eyebrow"><span className="dot"></span><span>EMPTY COLLECTION</span></div>
                <div className="nw-feat-logo">NO TITLES</div>
                <div className="nw-feat-sub">{coll.label.toUpperCase()} · 0 games</div>
              </div>
            )}
          </div>

          {/* Reflective floor */}
          <div className="nw-floor"></div>
        </div>

        {/* COLLECTION RAIL */}
        <div className="nw-rail-wrap">
          <div className="nw-rail-head">
            <span>COLLECTIONS</span>
            <div className="line"></div>
            <span><b style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,color:'#fff',letterSpacing:'.06em',fontWeight:400}}>{games.length}</b> titles in {coll.label}</span>
          </div>
          <div className="nw-rail">
            {NW_COLLECTIONS.map((c, i) => (
              <div
                key={c.id}
                className={'nw-rail-card' + (i === collIndex ? ' active' : '')}
                style={{'--c-h': c.hue}}
                onClick={() => setCollIndex(i)}>
                <span className="ic">{c.icon}</span>
                <span className="lbl">
                  <span className="name">{c.label}</span>
                  <span className="ct">{allGames.filter(c.filter).length} titles</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="nw-controls">
          <div className="ctl"><span className="kk g">A</span><b>Launch</b></div>
          <div className="ctl"><span className="kk r">B</span><b>Back</b></div>
          <div className="ctl"><span className="kk y">Y</span><b>Favorite</b></div>
          <div className="ctl"><span className="kk b">X</span><b>Info</b></div>
          <div className="spacer"></div>
          <div className="ctl" style={{opacity:.6}}><span>← → games</span></div>
          <div className="ctl" style={{opacity:.6}}><span>↑ ↓ collections</span></div>
        </div>
      </div>
      )}
    </div>
  );
}

window.NeonWallTheme = NeonWallTheme;
