// theme-flux.jsx — NeoCab Attract Flux
// Configurable arcade frontend with floating diagonal panels.
// Layout: big logo top-left, tilted video preview center, perspective list right,
// floating metadata bottom-right, mini screenshots strip, optional debug overlay.
const { useState: useStateFX, useEffect: useEffectFX, useMemo: useMemoFX } = React;

const FLUX_CSS = `
.theme-flux{
  position:absolute;inset:0;overflow:hidden;color:#fff;
  font-family:'Space Grotesk', sans-serif;
  --fx-h: 290; --fx-h2: 50;
  --fx-bone:#f6f3eb;
  --fx-accent: oklch(72% 0.22 var(--fx-h));
  --fx-accent2: oklch(75% 0.20 var(--fx-h2));
  --fx-deep:#08060f;
}

/* ─── FULLSCREEN FANART BG ─── */
.fx-bg{position:absolute;inset:0;z-index:0;}
.fx-bg::before{
  content:"";position:absolute;inset:-8%;
  background:
    radial-gradient(70% 60% at 30% 40%, oklch(35% 0.20 var(--fx-h) / .8), transparent 70%),
    radial-gradient(60% 50% at 75% 80%, oklch(28% 0.20 var(--fx-h2) / .7), transparent 70%),
    linear-gradient(180deg, oklch(10% 0.04 var(--fx-h)) 0%, var(--fx-deep) 100%);
  filter:blur(0.5px) saturate(1.1);
  transition:background 700ms ease;
}
.fx-bg::after{
  /* large faded "fanart" art representation */
  content:"";position:absolute;inset:0;
  background:
    radial-gradient(40% 30% at 70% 50%, oklch(60% 0.22 var(--fx-h) / .35), transparent 60%),
    radial-gradient(30% 25% at 20% 60%, oklch(60% 0.20 var(--fx-h2) / .25), transparent 60%);
  filter:blur(40px);
  animation:fxBgPan 28s ease-in-out infinite alternate;
}
@keyframes fxBgPan{from{transform:translate(0,0) scale(1)}to{transform:translate(-30px,20px) scale(1.05)}}
.fx-bg-tex{
  position:absolute;inset:0;opacity:.06;mix-blend-mode:overlay;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* ─── SHELL ─── */
.fx-shell{position:absolute;inset:0;z-index:2;display:block;}

/* ─── TOP-LEFT: BIG LOGO + FILTER INDICATOR ─── */
.fx-logo-wrap{
  position:absolute;top:48px;left:56px;max-width:60%;
  animation:fxLogoIn 480ms cubic-bezier(.18,.9,.22,1.05) both;
}
@keyframes fxLogoIn{from{transform:translate(-12px, 4px) rotate(-1deg);opacity:0}to{transform:none;opacity:1}}
.fx-logo-eyebrow{
  display:flex;align-items:center;gap:14px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.4em;color:rgba(255,255,255,.55);
  text-transform:uppercase;margin-bottom:10px;
}
.fx-logo-eyebrow .sq{width:8px;height:8px;background:var(--fx-accent2);box-shadow:0 0 8px var(--fx-accent2);}
.fx-logo-big{
  font-family:'Russo One', sans-serif;font-size:128px;line-height:.86;
  color:var(--fx-bone);text-transform:uppercase;letter-spacing:-.012em;
  text-shadow:
    0 6px 0 oklch(28% 0.18 var(--fx-h)),
    0 14px 30px rgba(0,0,0,.65),
    0 0 40px oklch(60% 0.22 var(--fx-h) / .55);
}
.fx-logo-big .accent{color:var(--fx-accent2);text-shadow:0 0 22px var(--fx-accent2), 0 0 60px var(--fx-accent2);}
.fx-logo-big .stroke{-webkit-text-stroke:2px var(--fx-accent);color:transparent;text-shadow:none;filter:drop-shadow(0 0 14px oklch(70% 0.22 var(--fx-h) / .6));}
.fx-logo-sub{margin-top:14px;font-family:'Bebas Neue', sans-serif;font-size:32px;letter-spacing:.22em;color:rgba(255,255,255,.65);text-transform:uppercase;}
.fx-logo-tagline{margin-top:10px;font-family:'Space Grotesk', sans-serif;font-size:18px;font-style:italic;color:rgba(255,255,255,.65);max-width:520px;line-height:1.35;}

.fx-filter-ind{
  position:absolute;top:48px;right:56px;display:flex;flex-direction:column;align-items:flex-end;gap:6px;
}
.fx-filter-ind .lbl{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.4em;color:rgba(255,255,255,.45);text-transform:uppercase;}
.fx-filter-ind .v{
  font-family:'Bebas Neue', sans-serif;font-size:28px;letter-spacing:.1em;color:#fff;
  padding:5px 14px;background:oklch(15% 0.08 var(--fx-h) / .6);border:1px solid var(--fx-accent);
  box-shadow:0 0 22px oklch(60% 0.22 var(--fx-h) / .45);
}
.fx-filter-ind .row{
  display:flex;gap:6px;margin-top:4px;
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.3em;color:rgba(255,255,255,.45);text-transform:uppercase;
}

/* ─── TILTED MEDIA PREVIEW center ─── */
.fx-preview-wrap{
  position:absolute;left:50%;top:54%;
  width:780px;height:480px;
  transform:translate(-50%, -50%) rotate(-6deg);
  perspective:1400px;
  filter:drop-shadow(0 30px 80px rgba(0,0,0,.65)) drop-shadow(0 0 60px oklch(60% 0.22 var(--fx-h) / .45));
  animation:fxPreviewIn 520ms cubic-bezier(.18,.9,.22,1.05) both;
}
@keyframes fxPreviewIn{from{transform:translate(-50%, -50%) rotate(-9deg) scale(.95);opacity:.6}to{transform:translate(-50%, -50%) rotate(-6deg) scale(1);opacity:1}}
.fx-preview{
  position:relative;width:100%;height:100%;
  background:#000;
  border:1px solid var(--fx-accent);
  box-shadow:inset 0 0 0 6px #08060f, inset 0 0 60px rgba(0,0,0,.9), 0 0 50px oklch(60% 0.22 var(--fx-h) / .35);
  overflow:hidden;
}
.fx-preview-content{
  position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:36px;text-align:center;color:#fff;
  background:radial-gradient(70% 60% at 50% 40%, oklch(28% 0.20 var(--fx-h) / 1), oklch(6% 0.04 var(--fx-h)) 80%);
}
.fx-preview-content .big{font-family:'Russo One', sans-serif;font-size:62px;line-height:.95;letter-spacing:.005em;text-shadow:0 0 28px var(--fx-accent);}
.fx-preview-content .sub{font-family:'Bebas Neue', sans-serif;font-size:24px;letter-spacing:.2em;color:var(--fx-accent2);margin-top:14px;}
.fx-preview-content .copy{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.3em;color:rgba(255,255,255,.5);margin-top:22px;}
.fx-preview-fallback{display:flex;flex-direction:column;align-items:center;gap:14px;color:rgba(255,255,255,.55);padding:32px;text-align:center;}
.fx-preview-fallback .glyph{font-family:'Major Mono Display', monospace;font-size:80px;color:var(--fx-accent);text-shadow:0 0 24px var(--fx-accent);}
.fx-preview-fallback .ttl{font-family:'Russo One', sans-serif;font-size:32px;color:#fff;letter-spacing:.04em;}
.fx-preview-fallback .sub{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.32em;text-transform:uppercase;}
.fx-preview-corner{
  position:absolute;font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.3em;color:rgba(255,255,255,.7);text-transform:uppercase;
}
.fx-preview-corner.tl{top:14px;left:18px}
.fx-preview-corner.tr{top:14px;right:18px;color:var(--fx-accent2);}
.fx-preview-corner.bl{bottom:14px;left:18px}
.fx-preview-corner.br{bottom:14px;right:18px;color:var(--fx-accent);}
.fx-preview-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom, rgba(0,0,0,.45) 0 1px, transparent 1px 3px);mix-blend-mode:multiply;}

/* ─── MINI SCREENSHOTS STRIP — around the preview ─── */
.fx-mini-strip{
  position:absolute;left:50%;top:13%;transform:translateX(-50%) rotate(-6deg);
  display:flex;gap:10px;
}
.fx-mini{
  width:120px;height:78px;
  background:linear-gradient(135deg, oklch(38% 0.16 var(--fx-h) / .9), oklch(15% 0.08 var(--fx-h) / .9));
  border:1px solid oklch(60% 0.18 var(--fx-h) / .4);
  position:relative;overflow:hidden;
  font-family:'JetBrains Mono', monospace;font-size:8px;letter-spacing:.18em;color:rgba(255,255,255,.5);
  display:flex;flex-direction:column;justify-content:flex-end;padding:5px 8px;text-transform:uppercase;
}
.fx-mini::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(50% 40% at 50% 35%, oklch(60% 0.22 var(--fx-h) / .35), transparent 75%);
}
.fx-mini.active{
  border-color:var(--fx-accent);
  box-shadow:0 0 18px oklch(60% 0.22 var(--fx-h) / .55);
}

/* ─── PERSPECTIVE GAME LIST right ─── */
.fx-list-col{
  position:absolute;right:0;top:50%;transform:translateY(-50%);
  width:420px;padding-right:56px;
  perspective:1400px;
}
.fx-list-head{
  display:flex;align-items:baseline;justify-content:space-between;padding:0 6px 12px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.4em;color:rgba(255,255,255,.55);text-transform:uppercase;
}
.fx-list-head .v{font-family:'Bebas Neue', sans-serif;font-size:22px;letter-spacing:.06em;color:#fff;}
.fx-list{
  display:flex;flex-direction:column;gap:8px;
  transform-style:preserve-3d;
}
.fx-list-row{
  position:relative;padding:14px 18px;
  background:linear-gradient(135deg, oklch(15% 0.06 var(--fx-h) / .85), oklch(8% 0.04 var(--fx-h) / .8));
  border:1px solid oklch(40% 0.14 var(--fx-h) / .5);
  font-family:'Space Grotesk', sans-serif;font-size:16px;color:#fff;font-weight:500;
  transition:transform 300ms cubic-bezier(.18,.9,.22,1.05), opacity 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
  cursor:pointer;
  display:flex;align-items:center;gap:10px;
  clip-path:polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
}
.fx-list-row .num{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.24em;color:rgba(255,255,255,.5);min-width:22px;}
.fx-list-row .star{width:11px;height:11px;background:var(--fx-accent2);flex:none;
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
  filter:drop-shadow(0 0 4px var(--fx-accent2));opacity:0;}
.fx-list-row.fav .star{opacity:1}
.fx-list-row .ttl{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fx-list-row .yr{font-family:'JetBrains Mono', monospace;font-size:10px;color:rgba(255,255,255,.5);}

.fx-list-row.d0{transform:translateZ(40px) translateX(-30px);opacity:1;border-color:var(--fx-accent);
  background:linear-gradient(135deg, oklch(45% 0.20 var(--fx-h) / .85), oklch(20% 0.12 var(--fx-h) / .8));
  box-shadow:0 0 26px oklch(60% 0.22 var(--fx-h) / .55);}
.fx-list-row.d0 .num{color:#fff;}
.fx-list-row.d1{transform:translateZ(0) translateX(0);opacity:.7;}
.fx-list-row.d2{transform:translateZ(-40px) translateX(20px) rotateY(-10deg);opacity:.45;transform-origin:right center;}
.fx-list-row.d3{transform:translateZ(-80px) translateX(40px) rotateY(-16deg);opacity:.25;transform-origin:right center;filter:blur(.5px);}

/* ─── FLOATING METADATA PANEL bottom-right ─── */
.fx-meta-panel{
  position:absolute;bottom:128px;right:56px;width:380px;
  padding:18px 22px;
  background:linear-gradient(135deg, oklch(15% 0.06 var(--fx-h) / .85), oklch(8% 0.04 var(--fx-h) / .8));
  border:1px solid var(--fx-accent);
  transform:rotate(2deg);
  clip-path:polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  box-shadow:0 20px 60px rgba(0,0,0,.5), 0 0 32px oklch(60% 0.22 var(--fx-h) / .35);
  animation:fxMetaIn 520ms cubic-bezier(.18,.9,.22,1.05) both;
}
@keyframes fxMetaIn{from{transform:rotate(5deg) translateY(20px);opacity:0}to{transform:rotate(2deg) translateY(0);opacity:1}}
.fx-meta-head{display:flex;align-items:center;gap:10px;
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.36em;color:var(--fx-accent2);
  text-transform:uppercase;margin-bottom:10px;padding-bottom:8px;
  border-bottom:1px dashed rgba(255,255,255,.18);}
.fx-meta-head .dot{width:6px;height:6px;background:var(--fx-accent2);border-radius:50%;box-shadow:0 0 6px var(--fx-accent2);}
.fx-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;}
.fx-meta-grid .k{font-family:'JetBrains Mono', monospace;font-size:9px;letter-spacing:.3em;color:rgba(255,255,255,.5);text-transform:uppercase;}
.fx-meta-grid .v{font-family:'Bebas Neue', sans-serif;font-size:22px;line-height:1;color:#fff;letter-spacing:.04em;margin-top:2px;}
.fx-meta-grid .v.hi{color:var(--fx-accent2);text-shadow:0 0 10px var(--fx-accent2);}
.fx-meta-cell{display:flex;flex-direction:column;}

/* ─── SYSTEMS SCREEN ─── */
.fx-sys-screen{position:absolute;inset:0;display:flex;flex-direction:column;padding:60px 0 80px;perspective:1400px;}
.fx-sys-head{padding:0 64px 16px;display:flex;flex-direction:column;gap:6px;}
.fx-sys-carousel{flex:1;display:flex;align-items:center;justify-content:flex-start;min-height:0;overflow:hidden;}
.fx-sys-track{position:relative;display:flex;align-items:center;gap:60px;height:380px;
  transition:transform 460ms cubic-bezier(.18,.85,.22,1.02);will-change:transform;}
.fx-sys-card{position:relative;flex:none;width:260px;height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;cursor:pointer;
  background:linear-gradient(160deg, oklch(20% 0.10 var(--c-h, var(--fx-h)) / .9), oklch(8% 0.05 var(--c-h, var(--fx-h)) / .95));
  border:1px solid oklch(45% 0.14 var(--c-h, var(--fx-h)) / .55);
  clip-path:polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
  transition:transform 460ms cubic-bezier(.18,.85,.22,1.02), opacity 460ms ease, filter 460ms ease, box-shadow 460ms ease, border-color 460ms ease;
  text-align:center;overflow:hidden;}
.fx-sys-card.active{border-color:#fff;box-shadow:0 18px 60px rgba(0,0,0,.6), 0 0 30px oklch(60% 0.22 var(--c-h) / .65), 0 0 80px oklch(60% 0.22 var(--c-h) / .35);}
.fx-sys-card-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(60% 50% at 50% 30%, oklch(45% 0.20 var(--c-h, var(--fx-h)) / .55), transparent 70%);}
.fx-sys-card-short{position:relative;font-family:'Russo One', sans-serif;font-size:56px;color:#fff;letter-spacing:.005em;line-height:1;text-shadow:0 0 24px oklch(60% 0.22 var(--c-h, var(--fx-h)) / .65);}
.fx-sys-card-name{position:relative;font-family:'Bebas Neue', sans-serif;font-size:26px;color:#fff;letter-spacing:.08em;text-transform:uppercase;}
.fx-sys-card-tag{position:relative;font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.32em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.fx-sys-card-count{position:relative;margin-top:6px;font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.16em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.fx-sys-card-count b{font-family:'Bebas Neue', sans-serif;font-size:24px;color:oklch(80% 0.18 var(--c-h, var(--fx-h)));letter-spacing:.04em;}

/* ─── BOTTOM CONTROLS ─── */
.fx-controls{
  position:absolute;left:0;right:0;bottom:0;
  display:flex;align-items:center;gap:24px;padding:14px 56px;
  background:linear-gradient(to top, rgba(8,6,15,.85), rgba(8,6,15,.3));
  border-top:1px solid rgba(255,255,255,.08);
}
.fx-ctl{display:flex;align-items:center;gap:10px;font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.26em;color:rgba(255,255,255,.85);text-transform:uppercase;}
.fx-ctl .btn{
  width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'Russo One', sans-serif;font-size:13px;color:#0a0712;
  box-shadow:inset 0 -3px 6px rgba(0,0,0,.45), inset 0 3px 6px rgba(255,255,255,.4);
}
.fx-ctl .btn.g{background:radial-gradient(circle at 35% 30%,#9bff9b,#1ea03a 70%)}
.fx-ctl .btn.r{background:radial-gradient(circle at 35% 30%,#ff9a9a,#c41a1a 70%)}
.fx-ctl .btn.y{background:radial-gradient(circle at 35% 30%,#ffe89a,#d99000 70%)}
.fx-ctl .btn.b{background:radial-gradient(circle at 35% 30%,#a0e9ff,#0a7aa8 70%)}
.fx-ctl .lbl{display:flex;flex-direction:column;line-height:1.1;gap:2px;text-transform:none;}
.fx-ctl .lbl b{font-family:'Space Grotesk', sans-serif;font-size:14px;color:#fff;font-weight:600;letter-spacing:0}
.fx-ctl .lbl span{color:rgba(255,255,255,.5);font-size:9px;letter-spacing:.22em}
.fx-controls .spacer{flex:1}

/* ─── DEBUG OVERLAY (toggle with D) ─── */
.fx-debug{
  position:absolute;left:56px;bottom:90px;width:280px;padding:12px 14px;
  background:rgba(0,0,0,.7);border:1px dashed var(--fx-accent2);
  font-family:'JetBrains Mono', monospace;font-size:11px;color:#fff;
  display:flex;flex-direction:column;gap:5px;backdrop-filter:blur(6px);
}
.fx-debug .row{display:flex;justify-content:space-between;gap:14px;}
.fx-debug .k{color:rgba(255,255,255,.5);letter-spacing:.2em;text-transform:uppercase;font-size:10px;}
.fx-debug .v{color:#fff;}
.fx-debug .ttl{color:var(--fx-accent2);letter-spacing:.32em;text-transform:uppercase;font-size:10px;border-bottom:1px solid rgba(255,255,255,.15);padding-bottom:6px;margin-bottom:4px;display:flex;justify-content:space-between;}
.fx-debug .ttl span:last-child{color:rgba(255,255,255,.4);}

/* ─── ATTRACT clock indicator (top center) ─── */
.fx-attract-clock{
  position:absolute;top:54px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:10px;
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.4em;color:rgba(255,255,255,.45);
  text-transform:uppercase;
}
.fx-attract-clock .dot{width:6px;height:6px;background:var(--fx-accent2);border-radius:50%;
  box-shadow:0 0 8px var(--fx-accent2);animation:fxPulse 2s ease-in-out infinite;}
@keyframes fxPulse{0%,100%{opacity:1}50%{opacity:.3}}
.fx-attract-clock b{font-family:'Bebas Neue', sans-serif;font-size:20px;color:#fff;letter-spacing:.1em;font-weight:400;}
`;

function injectCssFX() {
  if (document.getElementById('theme-flux-css')) return;
  const s = document.createElement('style');
  s.id = 'theme-flux-css';
  s.textContent = FLUX_CSS;
  document.head.appendChild(s);
}

function FluxTheme({ onChangeTheme }) {
  useEffectFX(() => { injectCssFX(); }, []);
  const allSystems = window.PACK_SYSTEMS;
  const allGames = window.PACK_GAMES;

  const shell = window.useArcadeShell({ onChangeTheme, defaultSystem: 1 }); // start on Neo Geo
  const [debug, setDebug] = useStateFX(true);

  const sys = allSystems[shell.sysIndex];

  // games respect home-menu shortcut (favs/recent/shuffle) if set
  const games = useMemoFX(() => {
    if (shell.shortcut) return shell.shortcut.games;
    return allGames.filter(g => g.systemId === sys.id);
  }, [allGames, sys, shell.shortcut]);

  const safeIdx = Math.min(shell.gameIndex, Math.max(0, games.length - 1));
  const game = games[safeIdx];

  useEffectFX(() => {
    const root = document.querySelector('.theme-flux');
    if (!root || !game) return;
    root.style.setProperty('--fx-h', game.hue);
    root.style.setProperty('--fx-h2', game.hue2);
  }, [game]);

  // shared keyboard
  window.useArcadeKeys({ shell, allSystems, games });

  // local debug toggle
  useEffectFX(() => {
    function onKey(e) {
      if ((e.key === 'd' || e.key === 'D') && shell.screen === 'wheel') {
        setDebug(v => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shell.screen]);

  const totals = {
    systems: allSystems.length,
    titles: allSystems.reduce((n, s) => n + s.count, 0),
    favorites: allGames.filter(g => g.favorite).length,
  };

  const visible = useMemoFX(() => {
    if (!games.length) return [];
    return [-1, 0, 1, 2, 3].map(d => {
      const i = safeIdx + d;
      if (i < 0 || i >= games.length) return null;
      return { g: games[i], i, d: Math.abs(d) };
    }).filter(Boolean);
  }, [games, safeIdx]);

  // Systems screen — simple horizontal slide carousel themed for Flux
  const SysCarousel = () => {
    const STRIDE = 320;
    const translateX = `calc(50% - ${shell.sysIndex * STRIDE + STRIDE/2}px)`;
    return (
      <div className="fx-sys-screen" data-screen-label="Flux · Systems">
        <div className="fx-sys-head">
          <div className="fx-logo-eyebrow"><span className="sq"></span><span>SELECT SYSTEM</span></div>
          <div className="fx-logo-big" style={{fontSize:84}}>{sys.name.toUpperCase()}</div>
          <div className="fx-logo-sub">{sys.tag.toUpperCase()}</div>
        </div>
        <div className="fx-sys-carousel">
          <div className="fx-sys-track" style={{transform:`translateX(${translateX})`}}>
            {allSystems.map((s, i) => {
              const d = i - shell.sysIndex;
              const abs = Math.abs(d);
              return (
                <div key={s.id}
                     className={'fx-sys-card' + (d === 0 ? ' active' : '')}
                     style={{
                       '--c-h': s.hue,
                       transform:`rotate(${d * -3}deg) scale(${abs === 0 ? 1 : abs === 1 ? .85 : .68})`,
                       opacity: abs === 0 ? 1 : abs === 1 ? .75 : .35,
                       filter: `blur(${abs === 0 ? 0 : abs * .6}px)`,
                       zIndex: 100 - abs,
                     }}
                     onClick={() => shell.setSysIndex(i)}>
                  <div className="fx-sys-card-bg"></div>
                  <div className="fx-sys-card-short">{s.short}</div>
                  <div className="fx-sys-card-name">{s.name}</div>
                  <div className="fx-sys-card-tag">{s.tag}</div>
                  <div className="fx-sys-card-count"><b>{s.count.toLocaleString()}</b> titles</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="theme-flux" data-screen-label="Attract Flux">
      <div className="fx-bg">
        <div className="fx-bg-tex"></div>
      </div>

      {shell.screen === 'home' && (
        <window.HomeShell shell={shell} themeName="Attract Flux" themeTag="Diagonal panels · Configurable"
                          totals={totals} onAction={(id) => shell.openMenuItem(id, allGames)} />
      )}
      {shell.screen === 'systems' && <SysCarousel/>}
      {shell.screen === 'settings' && <window.SettingsShell shell={shell} />}
      {shell.screen === 'themes' && <window.ThemeSwitcherPanel shell={shell} activeId="attractflux" />}
      {shell.screen === 'wheel' && (
        <>
        {/* TOP-LEFT BIG LOGO */}
        <div className="fx-logo-wrap" key={game?.id || 'none'}>
          <div className="fx-logo-eyebrow">
            <span className="sq"></span>
            <span>{(shell.shortcut?.label || sys.name).toUpperCase()} · {game?.year}</span>
            <span style={{opacity:.4}}>·</span>
            <span>{game?.manufacturer}</span>
          </div>
          <div className="fx-logo-big">
            {game?.titleParts.map((p,i) => {
              if (typeof p === 'string') return <span key={i}>{i>0?' ':''}{p}</span>;
              if (p.accent) return <span key={i} className="accent">{i>0?' ':''}{p.accent}</span>;
              if (p.stroke) return <span key={i} className="stroke">{i>0?' ':''}{p.stroke}</span>;
              return null;
            })}
          </div>
          <div className="fx-logo-sub">{game?.sub}</div>
          <div className="fx-logo-tagline">"{game?.tagline}"</div>
        </div>

      {/* TOP CENTER attract clock */}
      <div className="fx-attract-clock">
        <span className="dot"></span>
        <span>ATTRACT IDLE</span>
        <b>00:00:42</b>
        <span style={{opacity:.5}}>· auto-cycle in 22s</span>
      </div>

      {/* TOP RIGHT filter indicator */}
      <div className="fx-filter-ind">
        <div className="lbl">Current Filter</div>
        <div className="v">{sys.name.toUpperCase()}</div>
        <div className="row">
          <span>GENRE · {game?.genre}</span>
          <span style={{opacity:.4}}>·</span>
          <span>{game?.year}</span>
        </div>
      </div>

      {/* MINI SCREENSHOT STRIP above preview */}
      <div className="fx-mini-strip">
        {[0,1,2,3].map(i => (
          <div key={i} className={'fx-mini' + (i === 1 ? ' active' : '')}>
            <span>{game ? (i === 0 ? 'TITLE' : i === 1 ? 'GAMEPLAY' : i === 2 ? 'BOSS' : 'CREDIT') : 'EMPTY'}</span>
          </div>
        ))}
      </div>

      {/* TILTED PREVIEW center */}
      <div className="fx-preview-wrap">
        <div className="fx-preview">
          {game && (game.hasVideo || game.hasScreenshot) ? (
            <>
              <div className="fx-preview-content">
                <div className="big">{game.title.toUpperCase()}</div>
                <div className="sub">{game.sub}</div>
                <div className="copy">© {game.year} {game.manufacturer.toUpperCase()}</div>
              </div>
              <div className="fx-preview-corner tl">CH 02</div>
              <div className="fx-preview-corner tr">● {game.hasVideo ? 'VIDEO' : 'SCREEN'}</div>
              <div className="fx-preview-corner bl">RGB · 320×240</div>
              <div className="fx-preview-corner br">{game.hasBackground ? 'FANART OK' : 'NO FANART'}</div>
            </>
          ) : (
            <div className="fx-preview-fallback">
              <div className="glyph">◇</div>
              <div className="ttl">{game ? game.title.toUpperCase() : 'NO GAME'}</div>
              <div className="sub">no fanart · no video · no screenshot</div>
              <div className="sub" style={{color:'var(--fx-accent2)'}}>↳ press [Y] to scrape</div>
            </div>
          )}
          <div className="fx-preview-scan"></div>
        </div>
      </div>

      {/* PERSPECTIVE LIST right */}
      <div className="fx-list-col">
        <div className="fx-list-head">
          <span>BROWSE</span>
          <span><span className="v">{games.length ? safeIdx+1 : 0}</span> <span style={{opacity:.4}}>/</span> <span className="v" style={{color:'rgba(255,255,255,.5)'}}>{games.length}</span></span>
        </div>
        <div className="fx-list">
          {visible.map(({g, i, d}) => (
            <div
              key={g.id}
              className={`fx-list-row d${d} ${g.favorite ? 'fav' : ''}`}>
              <span className="num">{String(i+1).padStart(2,'0')}</span>
              <span className="star"></span>
              <span className="ttl">{g.title}</span>
              <span className="yr">{g.year}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FLOATING METADATA bottom-right */}
      {game && (
        <div className="fx-meta-panel" key={game.id+'meta'}>
          <div className="fx-meta-head">
            <span className="dot"></span>
            <span>GAME INFO · NOW PLAYING</span>
          </div>
          <div className="fx-meta-grid">
            <div className="fx-meta-cell"><div className="k">System</div><div className="v">{game.system}</div></div>
            <div className="fx-meta-cell"><div className="k">Year</div><div className="v">{game.year}</div></div>
            <div className="fx-meta-cell"><div className="k">Maker</div><div className="v">{game.manufacturer}</div></div>
            <div className="fx-meta-cell"><div className="k">Genre</div><div className="v">{game.genre}</div></div>
            <div className="fx-meta-cell"><div className="k">Players</div><div className="v">{game.players}</div></div>
            <div className="fx-meta-cell"><div className="k">Plays</div><div className="v hi">{game.playCount}</div></div>
          </div>
        </div>
      )}

      {/* DEBUG OVERLAY */}
      {debug && (
        <div className="fx-debug">
          <div className="ttl"><span>THEME DEBUG</span><span>[D] hide</span></div>
          <div className="row"><span className="k">Layout</span><span className="v">flux/diagonal</span></div>
          <div className="row"><span className="k">System</span><span className="v">{sys.id}</span></div>
          <div className="row"><span className="k">Filter</span><span className="v">{sys.name}</span></div>
          <div className="row"><span className="k">Games</span><span className="v">{games.length}</span></div>
          <div className="row"><span className="k">Resolution</span><span className="v">1920 × 1080</span></div>
          <div className="row"><span className="k">Tint</span><span className="v">h{game?.hue || 0} / h{game?.hue2 || 0}</span></div>
        </div>
      )}
        </>
      )}

      {/* CONTROLS — persistent across screens */}
      <div className="fx-controls">
        <div className="fx-ctl"><span className="btn g">A</span><span className="lbl"><b>Launch</b><span>start game</span></span></div>
        <div className="fx-ctl"><span className="btn r">B</span><span className="lbl"><b>Back</b><span>main menu</span></span></div>
        <div className="fx-ctl"><span className="btn y">Y</span><span className="lbl"><b>Favorite</b><span>pin</span></span></div>
        <div className="fx-ctl"><span className="btn b">X</span><span className="lbl"><b>Layout</b><span>cycle layout</span></span></div>
        <div className="spacer"></div>
        <div className="fx-ctl" style={{opacity:.55}}><span>D · debug</span></div>
        <div className="fx-ctl" style={{opacity:.55}}><span>← → systems · ↑ ↓ games</span></div>
      </div>
    </div>
  );
}

window.FluxTheme = FluxTheme;
