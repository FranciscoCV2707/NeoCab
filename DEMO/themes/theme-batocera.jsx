// theme-batocera.jsx — NeoCab Batocera Station theme
// Clean modern-retro frontend: horizontal system carousel + game list with media preview.
// Aesthetic: dark glass panels (NOT SaaS), per-system color tinting, subtle blur, rounded edges.
const { useState: useStateB, useEffect: useEffectB, useMemo: useMemoB, useRef: useRefB, useCallback: useCallbackB } = React;

// ─── CSS injection (scoped under .theme-batocera) ──────────────────────────
const BATOCERA_CSS = `
.theme-batocera{
  position:absolute;inset:0;overflow:hidden;color:#fff;
  font-family:'Space Grotesk', 'Inter', system-ui, sans-serif;
  --bat-h: 220; --bat-h2: 280;
  --bat-accent: oklch(72% 0.18 var(--bat-h));
  --bat-accent2: oklch(68% 0.16 var(--bat-h2));
  --bat-bone: #f6f3eb;
  --bat-dim: rgba(255,255,255,.55);
  --bat-dim2: rgba(255,255,255,.32);
  --bat-panel: rgba(14,12,22,.78);
  --bat-panel-2: rgba(18,16,28,.7);
  --bat-border: rgba(255,255,255,.1);
  --bat-border-strong: rgba(255,255,255,.22);
  --bat-bg-deep: #0a0814;
}

/* ── Dynamic background: blurred art + tinted radial ───────────────── */
.bat-bg{position:absolute;inset:0;z-index:0;overflow:hidden}
.bat-bg-art{
  position:absolute;inset:-8%;
  background:
    radial-gradient(70% 60% at 30% 30%, oklch(35% 0.18 var(--bat-h) / .55), transparent 70%),
    radial-gradient(60% 50% at 80% 80%, oklch(28% 0.16 var(--bat-h2) / .55), transparent 70%),
    linear-gradient(180deg, oklch(11% 0.04 var(--bat-h) / 1) 0%, var(--bat-bg-deep) 100%);
  transition:background 700ms ease;
}
.bat-bg-tex{
  position:absolute;inset:0;opacity:.04;mix-blend-mode:overlay;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.bat-bg-glow{
  position:absolute;left:50%;top:60%;width:1600px;height:1100px;transform:translate(-50%,-50%);pointer-events:none;
  background:radial-gradient(50% 50% at 50% 50%, oklch(70% 0.20 var(--bat-h) / .14), transparent 70%);
  filter:blur(20px);
}

/* ── Top bar (Batocera-style header) ──────────────────────────────── */
.bat-header{
  position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;
  padding:24px 56px 16px;
}
.bat-header-left{display:flex;align-items:center;gap:24px}
.bat-brand{
  display:flex;align-items:center;gap:12px;
  font-family:'Russo One', sans-serif;font-size:24px;letter-spacing:.005em;color:#fff;
}
.bat-brand-dot{
  width:12px;height:12px;border-radius:50%;
  background:var(--bat-accent);box-shadow:0 0 10px var(--bat-accent), 0 0 24px var(--bat-accent);
  animation:batPulse 1.6s ease-in-out infinite;
}
@keyframes batPulse{0%,100%{opacity:1}50%{opacity:.45}}
.bat-section{
  font-family:'JetBrains Mono', monospace;font-size:12px;letter-spacing:.32em;color:var(--bat-dim);
  text-transform:uppercase;display:flex;align-items:center;gap:14px;
  padding-left:24px;border-left:1px solid var(--bat-border);
}
.bat-section b{color:#fff;font-weight:500}
.bat-header-right{
  display:flex;align-items:center;gap:14px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.28em;color:var(--bat-dim);
  text-transform:uppercase;
}
.bat-pill{
  padding:6px 12px;border:1px solid var(--bat-border-strong);border-radius:99px;
  display:flex;align-items:center;gap:8px;
}
.bat-pill .dot{width:6px;height:6px;background:#5cff9a;border-radius:50%;box-shadow:0 0 8px #5cff9a;}
.bat-pill.bat-pill-accent{
  background:color-mix(in oklch, var(--bat-accent) 20%, transparent);
  border-color:var(--bat-accent);color:#fff;
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN: SYSTEM CAROUSEL
   ═══════════════════════════════════════════════════════════════════ */
.bat-systems{
  position:relative;z-index:2;flex:1;display:flex;flex-direction:column;
  padding:0 56px 0;
}

.bat-systems-hero{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;min-height:0;
}
.bat-systems-eyebrow{
  font-family:'JetBrains Mono', monospace;font-size:13px;letter-spacing:.5em;color:var(--bat-dim);
  text-transform:uppercase;margin-bottom:10px;
}
.bat-systems-name{
  font-family:'Russo One', sans-serif;font-size:96px;line-height:.94;color:#fff;letter-spacing:-.005em;
  text-transform:uppercase;text-align:center;text-shadow:0 0 40px oklch(60% 0.18 var(--bat-h) / .5);
  white-space:nowrap;
}
.bat-systems-tag{
  margin-top:14px;font-family:'JetBrains Mono', monospace;font-size:14px;letter-spacing:.4em;
  color:var(--bat-dim);text-transform:uppercase;
}
.bat-systems-stats{
  margin-top:24px;display:flex;align-items:center;gap:36px;
  font-family:'JetBrains Mono', monospace;font-size:12px;letter-spacing:.3em;color:var(--bat-dim);
  text-transform:uppercase;
}
.bat-systems-stats .stat{display:flex;align-items:baseline;gap:8px;}
.bat-systems-stats .v{
  font-family:'Russo One', sans-serif;font-size:28px;line-height:1;color:#fff;letter-spacing:.02em;
  font-variant-numeric:tabular-nums;
}
.bat-systems-stats .stat span:last-child{padding-left:0}

/* ── Carousel ─────────────────────────────────────────────────────── */
.bat-carousel{
  position:relative;width:100%;height:340px;display:block;
  perspective:1400px;margin-top:24px;overflow:hidden;
}
.bat-carousel-track{
  position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:20px;
  transition:transform 460ms cubic-bezier(.18,.85,.22,1.02);
  transform-style:preserve-3d;
  will-change:transform;
}
.bat-system-card{
  position:relative;flex:none;
  width:240px;height:260px;
  display:flex;flex-direction:column;
  background:linear-gradient(180deg, oklch(25% 0.10 var(--card-h, var(--bat-h)) / .8), oklch(10% 0.05 var(--card-h, var(--bat-h)) / .9));
  border:1px solid var(--bat-border);
  border-radius:18px;
  transition:transform 460ms cubic-bezier(.18,.85,.22,1.02),
             opacity 460ms ease, filter 460ms ease, box-shadow 460ms ease, border-color 460ms ease;
  will-change:transform,filter,opacity;
  overflow:hidden;cursor:pointer;
}
.bat-system-card .sc-glow{
  position:absolute;inset:0;z-index:0;
  background:radial-gradient(70% 55% at 50% 30%, oklch(55% 0.18 var(--card-h, var(--bat-h)) / .55), transparent 70%);
}
.bat-system-card .sc-shape{
  position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:18px;
}
.bat-system-card .sc-shape svg{width:80%;max-width:160px;height:auto;
  filter:drop-shadow(0 8px 18px rgba(0,0,0,.6)) drop-shadow(0 0 14px oklch(60% 0.22 var(--card-h, var(--bat-h)) / .3));}
.bat-system-card .sc-body{
  position:relative;z-index:1;padding:10px 14px 16px;text-align:center;
  border-top:1px solid var(--bat-border);
  background:linear-gradient(to bottom, transparent, oklch(8% 0.04 var(--card-h, var(--bat-h)) / .65));
}
.bat-system-card .sc-name{
  font-family:'Russo One', sans-serif;font-size:18px;color:#fff;letter-spacing:.005em;
  text-transform:uppercase;line-height:1;
}
.bat-system-card .sc-tag{
  margin-top:5px;font-family:'JetBrains Mono', monospace;font-size:9.5px;letter-spacing:.28em;
  color:var(--bat-dim);text-transform:uppercase;
}
.bat-system-card .sc-count{
  margin-top:8px;font-family:'JetBrains Mono', monospace;font-size:11px;color:#fff;
}
.bat-system-card .sc-count b{
  font-family:'Russo One', sans-serif;font-size:18px;color:oklch(80% 0.18 var(--card-h, var(--bat-h)));
  font-variant-numeric:tabular-nums;
}

.bat-system-card.active{
  border-color:oklch(75% 0.18 var(--card-h, var(--bat-h)));
  box-shadow:
    0 24px 50px rgba(0,0,0,.6),
    0 0 30px oklch(60% 0.22 var(--card-h, var(--bat-h)) / .6),
    0 0 80px oklch(60% 0.22 var(--card-h, var(--bat-h)) / .3),
    inset 0 0 0 1px rgba(255,255,255,.18);
}
.bat-system-card.active .sc-shape svg{max-width:200px;}

/* ── Bottom rail of all systems ───────────────────────────────────── */
.bat-system-rail{
  position:relative;z-index:2;flex:none;
  display:flex;justify-content:center;gap:8px;
  padding:14px 56px 8px;
  max-width:100%;overflow-x:auto;scrollbar-width:none;
}
.bat-system-rail::-webkit-scrollbar{display:none}
.bat-rail-dot{
  flex:none;display:flex;align-items:center;gap:8px;
  padding:8px 14px;border-radius:99px;
  background:rgba(8,6,15,.6);border:1px solid var(--bat-border);
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.28em;
  color:var(--bat-dim);text-transform:uppercase;cursor:pointer;
  transition:all 200ms ease;
}
.bat-rail-dot .lbl{color:#fff}
.bat-rail-dot.active{
  background:var(--bat-accent);color:#0a0712;border-color:var(--bat-accent);
  box-shadow:0 0 14px var(--bat-accent);
}
.bat-rail-dot.active .lbl{color:#0a0712}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN: GAME LIST + PREVIEW
   ═══════════════════════════════════════════════════════════════════ */
.bat-games{
  position:relative;z-index:2;flex:1;display:grid;
  grid-template-columns: 420px 1fr;
  gap:24px;padding:8px 56px 0;min-height:0;
}

/* ── Game list (left) ─────────────────────────────────────────────── */
.bat-list-col{display:flex;flex-direction:column;gap:14px;min-height:0;}
.bat-filters{
  display:flex;align-items:center;gap:6px;overflow-x:auto;
  padding-bottom:6px;scrollbar-width:none;flex:none;
}
.bat-filters::-webkit-scrollbar{display:none}
.bat-filter{
  padding:7px 12px;border:1px solid var(--bat-border);background:rgba(8,6,15,.5);
  border-radius:8px;flex:none;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.18em;
  color:var(--bat-dim);text-transform:uppercase;cursor:pointer;
  transition:all 200ms ease;
}
.bat-filter.active{
  background:var(--bat-accent);color:#0a0712;border-color:var(--bat-accent);
}
.bat-filter .ct{
  margin-left:6px;font-size:10px;opacity:.7;
}

.bat-list{
  flex:1;display:flex;flex-direction:column;gap:6px;
  min-height:0;overflow-y:auto;
  scrollbar-color:rgba(255,255,255,.15) transparent;scrollbar-width:thin;
  padding-right:6px;
}
.bat-list::-webkit-scrollbar{width:6px}
.bat-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:99px}
.bat-row{
  position:relative;display:flex;align-items:center;gap:14px;padding:14px 16px;
  background:linear-gradient(135deg, var(--bat-panel) 0%, var(--bat-panel-2) 100%);
  border:1px solid var(--bat-border);
  border-radius:10px;cursor:pointer;
  transition:transform 200ms ease, border-color 200ms ease, background 200ms ease;
  flex:none;
}
.bat-row .num{
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.18em;
  color:var(--bat-dim2);min-width:24px;text-align:right;
}
.bat-row .star{
  width:14px;height:14px;flex:none;
  background:oklch(75% 0.18 var(--bat-h2));
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
  filter:drop-shadow(0 0 4px oklch(75% 0.18 var(--bat-h2)));
  opacity:0;
}
.bat-row.is-fav .star{opacity:1}
.bat-row .ttl{
  flex:1;font-family:'Space Grotesk', sans-serif;font-size:18px;line-height:1.1;
  color:#fff;font-weight:500;letter-spacing:-.005em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.bat-row .sys{
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.22em;
  color:var(--bat-dim);text-transform:uppercase;flex:none;
}
.bat-row .pc{
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.06em;
  color:var(--bat-dim);font-variant-numeric:tabular-nums;flex:none;
  display:flex;align-items:baseline;gap:4px;
}
.bat-row .pc b{color:#fff;font-weight:500;font-size:13px;}

.bat-row.active{
  background:linear-gradient(135deg,
    oklch(45% 0.18 var(--bat-h) / .8) 0%,
    oklch(28% 0.14 var(--bat-h) / .7) 80%);
  border-color:var(--bat-accent);
  box-shadow:0 0 24px oklch(60% 0.18 var(--bat-h) / .35);
  transform:translateX(2px);
}
.bat-row.active .ttl{color:#fff;font-weight:600}
.bat-row.active .num{color:#fff}

/* ── Preview column (right) ───────────────────────────────────────── */
.bat-preview-col{
  display:flex;flex-direction:column;gap:14px;min-height:0;
}

.bat-marquee{
  flex:none;display:flex;align-items:center;justify-content:center;
  height:120px;padding:14px 28px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,
    oklch(15% 0.06 var(--bat-h) / .9) 0%,
    oklch(8% 0.04 var(--bat-h) / .9) 100%);
  border:1px solid var(--bat-border);border-radius:12px;
}
.bat-marquee::before{
  content:"";position:absolute;left:0;right:0;bottom:0;height:2px;
  background:linear-gradient(to right, transparent, var(--bat-accent), transparent);
  box-shadow:0 0 18px var(--bat-accent);
}
.bat-marquee-text{
  font-family:'Russo One', sans-serif;font-size:46px;line-height:1;color:#fff;
  letter-spacing:.005em;text-transform:uppercase;text-align:center;
  text-shadow:0 0 24px oklch(60% 0.22 var(--bat-h) / .5);
  white-space:nowrap;
}
.bat-marquee-text .accent{color:oklch(82% 0.18 var(--bat-h))}
.bat-marquee-text .stroke{-webkit-text-stroke:2px oklch(82% 0.18 var(--bat-h));color:transparent}

.bat-preview{
  flex:1;display:flex;flex-direction:column;
  background:linear-gradient(135deg, var(--bat-panel) 0%, var(--bat-panel-2) 100%);
  border:1px solid var(--bat-border);border-radius:14px;overflow:hidden;
  min-height:0;
}
.bat-screen{
  position:relative;aspect-ratio:16/10;width:100%;
  background:#04030a;overflow:hidden;
}
.bat-screen-bg{
  position:absolute;inset:0;
  background:
    radial-gradient(70% 60% at 50% 35%, oklch(35% 0.18 var(--bat-h) / 1), oklch(8% 0.04 var(--bat-h) / 1) 80%);
}
.bat-screen-art{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  flex-direction:column;gap:14px;color:#fff;padding:28px;text-align:center;
}
.bat-screen-art .big{
  font-family:'Russo One', sans-serif;font-size:78px;line-height:.95;letter-spacing:.005em;
  text-shadow:0 4px 0 oklch(28% 0.14 var(--bat-h)),
              0 0 24px oklch(60% 0.22 var(--bat-h) / .55);
}
.bat-screen-art .sub{
  font-family:'JetBrains Mono', monospace;font-size:14px;letter-spacing:.32em;
  color:oklch(85% 0.10 var(--bat-h));text-transform:uppercase;
}
.bat-screen-art .tagline{
  font-family:'Space Grotesk', sans-serif;font-size:18px;color:rgba(255,255,255,.78);
  font-style:italic;max-width:560px;line-height:1.4;
}
.bat-screen-corner{
  position:absolute;top:14px;right:14px;
  display:flex;align-items:center;gap:8px;
  padding:5px 10px;border-radius:99px;
  background:rgba(0,0,0,.55);backdrop-filter:blur(6px);
  font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.28em;
  color:#fff;text-transform:uppercase;
}
.bat-screen-corner .dot{
  width:6px;height:6px;border-radius:50%;background:#ff3b3b;
  box-shadow:0 0 8px #ff3b3b;animation:batPulse 1.4s ease-in-out infinite;
}
.bat-screen-scan{
  position:absolute;inset:0;pointer-events:none;opacity:.18;
  background:repeating-linear-gradient(to bottom, rgba(0,0,0,.5) 0 1px, transparent 1px 3px);
}

/* fallback art */
.bat-screen-fallback{
  position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:18px;
  background:repeating-linear-gradient(45deg,
    oklch(14% 0.04 var(--bat-h) / 1) 0 24px,
    oklch(10% 0.04 var(--bat-h) / 1) 24px 48px);
}
.bat-screen-fallback .glyph{
  width:160px;height:120px;border:2px dashed rgba(255,255,255,.3);
  display:flex;align-items:center;justify-content:center;
  font-family:'JetBrains Mono', monospace;font-size:12px;letter-spacing:.4em;
  color:rgba(255,255,255,.6);text-transform:uppercase;border-radius:8px;
}
.bat-screen-fallback .ttl{
  font-family:'Russo One', sans-serif;font-size:32px;color:rgba(255,255,255,.8);
  letter-spacing:.04em;text-transform:uppercase;
}
.bat-screen-fallback .sub{
  font-family:'JetBrains Mono', monospace;font-size:12px;letter-spacing:.28em;
  color:var(--bat-dim);text-transform:uppercase;
}

/* metadata bar under screen */
.bat-meta{
  flex:none;display:grid;grid-template-columns:repeat(6, minmax(0,1fr));
  padding:16px 22px;gap:14px;border-top:1px solid var(--bat-border);
}
.bat-meta-cell{display:flex;flex-direction:column;gap:3px;min-width:0;}
.bat-meta-cell .k{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.28em;
  color:var(--bat-dim);text-transform:uppercase;}
.bat-meta-cell .v{font-family:'Space Grotesk', sans-serif;font-size:16px;color:#fff;line-height:1.15;
  font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bat-meta-cell .v.hi{color:oklch(80% 0.18 var(--bat-h))}
.bat-meta-cell .v.fav{color:oklch(80% 0.18 var(--bat-h2))}

/* ─── Controls bar (shared style across themes via .bat-controls) ─── */
.bat-controls{
  position:relative;z-index:2;flex:none;display:flex;align-items:center;
  padding:14px 56px;gap:18px;
  border-top:1px solid var(--bat-border);
  background:linear-gradient(to top, rgba(8,6,15,.85), rgba(8,6,15,.4));
}
.bat-control{
  display:flex;align-items:center;gap:10px;
  font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.2em;
  color:#fff;text-transform:uppercase;
}
.bat-control .btn{
  display:inline-flex;align-items:center;justify-content:center;
  width:32px;height:32px;border-radius:50%;
  font-family:'Russo One', sans-serif;font-size:13px;color:#0a0712;
  box-shadow:inset 0 -3px 6px rgba(0,0,0,.45),inset 0 3px 6px rgba(255,255,255,.4);
}
.bat-control .btn.g{background:radial-gradient(circle at 35% 30%,#9bff9b,#1ea03a 70%)}
.bat-control .btn.r{background:radial-gradient(circle at 35% 30%,#ff9a9a,#c41a1a 70%)}
.bat-control .btn.y{background:radial-gradient(circle at 35% 30%,#ffe89a,#d99000 70%)}
.bat-control .btn.b{background:radial-gradient(circle at 35% 30%,#a0e9ff,#0a7aa8 70%)}
.bat-control .lbl{display:flex;flex-direction:column;gap:1px;line-height:1.1}
.bat-control .lbl b{color:#fff;font-family:'Space Grotesk', sans-serif;font-size:14px;font-weight:600;letter-spacing:0;text-transform:none;}
.bat-control .lbl span{color:var(--bat-dim);font-size:10px;letter-spacing:.2em}
.bat-controls .spacer{flex:1}
.bat-controls .kk{
  display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid var(--bat-border-strong);
  border-radius:6px;font-family:'JetBrains Mono', monospace;font-size:10px;color:#fff;
}

/* shell layout */
.bat-shell{
  position:absolute;inset:0;display:flex;flex-direction:column;
}
.bat-main{flex:1;display:flex;flex-direction:column;min-height:0;position:relative;}

/* ─── HOME SCREEN (clean modern menu) ─── */
.bat-home{position:absolute;inset:0;display:grid;grid-template-columns:1.05fr .95fr;gap:48px;padding:24px 56px 28px;}
.bat-home-left{display:flex;flex-direction:column;gap:24px;justify-content:center;min-width:0;}
.bat-home-eyebrow{display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono', monospace;font-size:12px;letter-spacing:.4em;color:var(--bat-dim);text-transform:uppercase;}
.bat-home-eyebrow .dot{width:8px;height:8px;border-radius:50%;background:var(--bat-accent);box-shadow:0 0 10px var(--bat-accent);animation:batPulse 1.6s ease-in-out infinite;}
.bat-home-title{font-family:'Russo One', sans-serif;font-size:120px;line-height:.9;letter-spacing:-.012em;color:#fff;text-transform:uppercase;text-shadow:0 0 50px oklch(60% 0.18 var(--bat-h) / .5);}
.bat-home-title .accent{color:var(--bat-accent);}
.bat-home-sub{font-family:'Space Grotesk', sans-serif;font-size:22px;color:rgba(255,255,255,.7);font-weight:400;line-height:1.4;max-width:560px;}
.bat-home-stats{margin-top:18px;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--bat-border);border-bottom:1px solid var(--bat-border);padding:14px 0;}
.bat-home-stat{padding:0 18px;border-right:1px dashed rgba(255,255,255,.08);min-width:0;display:flex;flex-direction:column;gap:3px;}
.bat-home-stat:last-child{border-right:0;}
.bat-home-stat .k{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.32em;color:var(--bat-dim);text-transform:uppercase;}
.bat-home-stat .v{font-family:'Space Grotesk', sans-serif;font-size:28px;line-height:1;color:#fff;font-weight:600;letter-spacing:-.005em;}
.bat-home-recent{margin-top:8px;display:flex;flex-direction:column;gap:8px;}
.bat-home-recent-head{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.4em;color:var(--bat-dim);text-transform:uppercase;display:flex;align-items:center;gap:10px;}
.bat-home-recent-head .line{flex:1;height:1px;background:rgba(255,255,255,.1);}
.bat-home-recent-row{display:flex;align-items:center;gap:14px;padding:8px 12px;background:rgba(255,255,255,.03);border:1px solid var(--bat-border);border-radius:8px;}
.bat-home-recent-row .ttl{flex:1;font-family:'Space Grotesk', sans-serif;font-size:15px;color:#fff;font-weight:500;}
.bat-home-recent-row .sys{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.2em;color:var(--bat-dim);text-transform:uppercase;}
.bat-home-recent-row .when{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.18em;color:var(--bat-accent);text-transform:uppercase;}

.bat-home-right{display:flex;flex-direction:column;gap:14px;justify-content:center;}
.bat-home-menu-head{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.4em;color:var(--bat-dim);text-transform:uppercase;display:flex;align-items:center;gap:10px;padding:0 6px 6px;}
.bat-home-menu-head .line{flex:1;height:1px;background:rgba(255,255,255,.1);}
.bat-home-menu{display:flex;flex-direction:column;gap:10px;}
.bat-menu-item{all:unset;cursor:pointer;display:flex;align-items:center;gap:18px;padding:18px 22px;
  background:linear-gradient(135deg, var(--bat-panel) 0%, var(--bat-panel-2) 100%);
  border:1px solid var(--bat-border);
  border-radius:14px;
  transition:transform 240ms cubic-bezier(.18,.9,.22,1.05), background 240ms ease, border-color 240ms ease, box-shadow 240ms ease;}
.bat-menu-item .mi-num{font-family:'JetBrains Mono', monospace;font-size:11px;letter-spacing:.3em;color:var(--bat-dim2);min-width:30px;}
.bat-menu-item .mi-icon{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg, oklch(28% 0.14 var(--bat-h)), oklch(14% 0.08 var(--bat-h)));border:1px solid oklch(60% 0.18 var(--bat-h) / .5);display:flex;align-items:center;justify-content:center;font-family:'Russo One', sans-serif;font-size:22px;color:#fff;flex:none;}
.bat-menu-item .mi-body{display:flex;flex-direction:column;gap:2px;line-height:1;}
.bat-menu-item .mi-label{font-family:'Space Grotesk', sans-serif;font-size:26px;font-weight:600;color:#fff;letter-spacing:-.005em;}
.bat-menu-item .mi-tag{font-family:'JetBrains Mono', monospace;font-size:10px;letter-spacing:.3em;color:var(--bat-dim);text-transform:uppercase;}
.bat-menu-item .mi-arrow{margin-left:auto;color:var(--bat-accent);font-size:24px;text-shadow:0 0 10px var(--bat-accent);animation:batArrow 1s ease-in-out infinite alternate;}
@keyframes batArrow{from{transform:translateX(0)}to{transform:translateX(5px)}}
.bat-menu-item.active{background:linear-gradient(135deg, oklch(45% 0.18 var(--bat-h) / .8) 0%, oklch(20% 0.12 var(--bat-h) / .7) 100%);border-color:var(--bat-accent);box-shadow:0 0 24px oklch(60% 0.22 var(--bat-h) / .55);transform:translateX(6px);}
.bat-menu-item.active .mi-icon{background:linear-gradient(135deg, var(--bat-accent), oklch(38% 0.18 var(--bat-h)));border-color:#fff;}
`;

function injectCssBat() {
  if (document.getElementById('theme-batocera-css')) return;
  const s = document.createElement('style');
  s.id = 'theme-batocera-css';
  s.textContent = BATOCERA_CSS;
  document.head.appendChild(s);
}

// ─── SVG platform shapes (reused from HyperWheel data with simplified versions) ─
function BatShape({ shape, short, hue }) {
  const tint = `oklch(75% 0.18 ${hue})`;
  const tintDim = `oklch(40% 0.16 ${hue})`;
  if (shape === 'cartridge') return (
    <svg viewBox="0 0 200 220">
      <path d="M30 30 L170 30 L170 36 L180 42 L180 200 L20 200 L20 42 L30 36 Z" fill={tintDim} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
      <rect x="60" y="20" width="80" height="14" fill="#08060f"/>
      <rect x="40" y="74" width="120" height="86" fill={tint} opacity=".95"/>
      <text x="100" y="124" textAnchor="middle" fill="#08060f" fontFamily="Russo One" fontSize="26" letterSpacing="1">{short}</text>
      <rect x="42" y="186" width="116" height="8" fill="#08060f"/>
    </svg>
  );
  if (shape === 'disc' || shape === 'gd-rom') return (
    <svg viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`bg-${hue}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity=".05"/>
          <stop offset=".55" stopColor={tint} stopOpacity=".55"/>
          <stop offset=".85" stopColor={tintDim} stopOpacity="1"/>
          <stop offset="1" stopColor="#020410" stopOpacity="1"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#bg-${hue})`} stroke="rgba(255,255,255,.18)"/>
      {Array.from({length:7}).map((_,i)=>(
        <circle key={i} cx="100" cy="100" r={86-i*7} fill="none" stroke="rgba(255,255,255,.05)"/>
      ))}
      <circle cx="100" cy="100" r="34" fill={tint}/>
      <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#08060f" fontFamily="Russo One" fontSize="14" letterSpacing="1">{short}</text>
      <circle cx="100" cy="100" r="11" fill="#08060f"/>
    </svg>
  );
  if (shape === 'chip') return (
    <svg viewBox="0 0 200 200">
      <rect x="22" y="36" width="156" height="128" fill={tintDim} stroke="rgba(255,255,255,.18)"/>
      <rect x="50" y="64" width="100" height="60" fill="#08060f" stroke="rgba(255,255,255,.2)"/>
      {Array.from({length:10}).map((_,i)=>(
        <g key={i}>
          <rect x={56+i*9.5} y="56" width="5" height="8" fill={tint} opacity=".7"/>
          <rect x={56+i*9.5} y="124" width="5" height="8" fill={tint} opacity=".7"/>
        </g>
      ))}
      <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill={tint} fontFamily="Russo One" fontSize="20" letterSpacing="1">{short}</text>
      <rect x="22" y="158" width="156" height="8" fill="#08060f"/>
    </svg>
  );
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function useClockBat() {
  const [t, setT] = useStateB(() => new Date());
  useEffectB(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
}

// ─── HEADER ────────────────────────────────────────────────────────────────
function BatHeader({ section, sectionDetail, accent }) {
  const time = useClockBat();
  return (
    <div className="bat-header">
      <div className="bat-header-left">
        <div className="bat-brand">
          <span className="bat-brand-dot"></span>
          <span>NEOCAB</span>
        </div>
        <div className="bat-section">
          <span style={{color:'#fff', fontWeight:500}}>{section}</span>
          {sectionDetail && <><span style={{opacity:.4}}>·</span><span>{sectionDetail}</span></>}
        </div>
      </div>
      <div className="bat-header-right">
        <div className="bat-pill"><span className="dot"></span><span>ONLINE</span></div>
        <div className="bat-pill bat-pill-accent">CABINET MODE</div>
        <div className="bat-pill"><span>{time}</span></div>
      </div>
    </div>
  );
}

// ─── SYSTEM CAROUSEL ───────────────────────────────────────────────────────
function BatSystemCarousel({ systems, index, onPick }) {
  const sys = systems[index];
  return (
    <div className="bat-systems" data-screen-label="Batocera · Systems">
      <div className="bat-systems-hero">
        <div className="bat-systems-eyebrow">SELECT A LIBRARY</div>
        <div className="bat-systems-name">{sys.name}</div>
        <div className="bat-systems-tag">{sys.tag}</div>
        <div className="bat-systems-stats">
          <div className="stat"><span className="v">{sys.count.toLocaleString()}</span><span>titles</span></div>
          <div className="stat"><span className="v">{sys.year}</span><span>since</span></div>
          <div className="stat"><span className="v">{systems.length}</span><span>systems online</span></div>
        </div>

        <div className="bat-carousel">
          <div className="bat-carousel-track" style={{ transform: `translate(calc(-${index * 260}px - 130px), -50%)` }}>
            {systems.map((s, i) => {
              const d = i - index;
              const abs = Math.abs(d);
              const scale = d === 0 ? 1.2 : abs === 1 ? .78 : abs === 2 ? .58 : .42;
              const rotY = d * -14;
              const opacity = abs === 0 ? 1 : abs === 1 ? .8 : abs === 2 ? .35 : .12;
              const blur = abs === 0 ? 0 : abs === 1 ? .4 : abs === 2 ? 1.6 : 3;
              return (
                <div
                  key={s.id}
                  className={'bat-system-card' + (d === 0 ? ' active' : '')}
                  onClick={() => onPick(i)}
                  style={{
                    transform: `scale(${scale}) rotateY(${rotY}deg)`,
                    opacity, filter: `blur(${blur}px)`, zIndex: 100 - abs,
                    '--card-h': s.hue,
                  }}>
                  <div className="sc-glow"></div>
                  <div className="sc-shape">
                    <BatShape shape={s.shape} short={s.short} hue={s.hue}/>
                  </div>
                  <div className="sc-body">
                    <div className="sc-name">{s.name}</div>
                    <div className="sc-tag">{s.tag}</div>
                    <div className="sc-count"><b>{s.count.toLocaleString()}</b> titles</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bat-system-rail">
        {systems.map((s, i) => (
          <div
            key={s.id}
            className={'bat-rail-dot' + (i === index ? ' active' : '')}
            onClick={() => onPick(i)}>
            <span>{s.short}</span>
            <span className="lbl">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GAME LIST + PREVIEW ───────────────────────────────────────────────────
function BatGameList({ games, index, onPick, filter, onFilter, system }) {
  const game = games[index];
  return (
    <div className="bat-games" data-screen-label="Batocera · Games">
      <div className="bat-list-col">
        <div className="bat-filters">
          {window.PACK_FILTERS.map(f => (
            <div
              key={f.id}
              className={'bat-filter' + (filter === f.id ? ' active' : '')}
              onClick={() => onFilter(f.id)}>
              <span>{f.label}</span>
              {f.id === 'all' && <span className="ct">{games.length}</span>}
            </div>
          ))}
        </div>
        <div className="bat-list">
          {games.length === 0 && (
            <div style={{padding:'40px 20px',textAlign:'center',color:'rgba(255,255,255,.45)',fontFamily:'JetBrains Mono, monospace',fontSize:12,letterSpacing:'.2em',textTransform:'uppercase'}}>
              No games match this filter.
            </div>
          )}
          {games.map((g, i) => (
            <div
              key={g.id}
              className={'bat-row' + (i === index ? ' active' : '') + (g.favorite ? ' is-fav' : '')}
              onClick={() => onPick(i)}>
              <span className="num">{String(i+1).padStart(2,'0')}</span>
              <span className="star"></span>
              <span className="ttl">{g.title}</span>
              <span className="sys">{g.system}</span>
              <span className="pc"><b>{g.playCount}</b><span>plays</span></span>
            </div>
          ))}
        </div>
      </div>

      <div className="bat-preview-col">
        {!game ? (
          <div className="bat-preview" style={{justifyContent:'center',alignItems:'center',padding:'60px 40px',textAlign:'center'}}>
            <div className="bat-screen-fallback" style={{position:'static',aspectRatio:'auto'}}>
              <div className="glyph">EMPTY</div>
              <div className="ttl">Nothing here yet</div>
              <div className="sub">{system.name} · 0 titles match this filter</div>
            </div>
          </div>
        ) : (
        <>
        <div className="bat-marquee">
          <div className="bat-marquee-text">
            {game.titleParts.map((p,i) => {
              if (typeof p === 'string') return <span key={i}>{i>0?' ':''}{p}</span>;
              if (p.accent) return <span key={i} className="accent">{i>0?' ':''}{p.accent}</span>;
              if (p.stroke) return <span key={i} className="stroke">{i>0?' ':''}{p.stroke}</span>;
              return null;
            })}
          </div>
        </div>

        <div className="bat-preview">
          <div className="bat-screen">
            <div className="bat-screen-bg"></div>
            {game.hasVideo ? (
              <>
                <div className="bat-screen-art">
                  <div className="big">{game.title.toUpperCase()}</div>
                  <div className="sub">{game.sub}</div>
                  <div className="tagline">"{game.tagline}"</div>
                </div>
                <div className="bat-screen-corner"><span className="dot"></span><span>VIDEO · 4:3</span></div>
              </>
            ) : game.hasScreenshot ? (
              <>
                <div className="bat-screen-art">
                  <div className="big" style={{fontSize:60}}>{game.title.toUpperCase()}</div>
                  <div className="sub">{game.sub}</div>
                </div>
                <div className="bat-screen-corner"><span>SCREENSHOT</span></div>
              </>
            ) : (
              <div className="bat-screen-fallback">
                <div className="glyph">NO PREVIEW</div>
                <div className="ttl">{game.title}</div>
                <div className="sub">No video · No screenshot · Scrape to populate</div>
              </div>
            )}
            <div className="bat-screen-scan"></div>
          </div>

          <div className="bat-meta">
            <div className="bat-meta-cell">
              <div className="k">System</div>
              <div className="v">{game.system}</div>
            </div>
            <div className="bat-meta-cell">
              <div className="k">Year</div>
              <div className="v">{game.year}</div>
            </div>
            <div className="bat-meta-cell">
              <div className="k">Maker</div>
              <div className="v">{game.manufacturer}</div>
            </div>
            <div className="bat-meta-cell">
              <div className="k">Genre</div>
              <div className="v">{game.genre}</div>
            </div>
            <div className="bat-meta-cell">
              <div className="k">Players</div>
              <div className="v">{game.players}</div>
            </div>
            <div className="bat-meta-cell">
              <div className="k">Plays</div>
              <div className="v hi">{game.playCount}</div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

// ─── CONTROLS BAR ──────────────────────────────────────────────────────────
function BatControls({ inGameList }) {
  return (
    <div className="bat-controls">
      <div className="bat-control"><span className="btn g">A</span><span className="lbl"><b>{inGameList?'Launch':'Open'}</b><span>{inGameList?'start game':'load library'}</span></span></div>
      <div className="bat-control"><span className="btn r">B</span><span className="lbl"><b>Back</b><span>{inGameList?'to systems':'main menu'}</span></span></div>
      <div className="bat-control"><span className="btn y">Y</span><span className="lbl"><b>Favorite</b><span>pin · scrape</span></span></div>
      <div className="bat-control"><span className="btn b">X</span><span className="lbl"><b>Filter</b><span>collection</span></span></div>
      <div className="spacer"></div>
      <div className="bat-control"><span className="kk">↑↓</span><span style={{color:'var(--bat-dim)'}}>list</span></div>
      <div className="bat-control"><span className="kk">←→</span><span style={{color:'var(--bat-dim)'}}>tabs</span></div>
      <div className="bat-control"><span className="kk">START</span><span style={{color:'var(--bat-dim)'}}>options</span></div>
    </div>
  );
}

// ─── HOME ──────────────────────────────────────────────────────────────────
function BatHome({ shell, totals, recentGames, onSelect }) {
  return (
    <div className="bat-home" data-screen-label="Batocera · Home">
      <div className="bat-home-left">
        <div className="bat-home-eyebrow"><span className="dot"></span><span>SYSTEM ONLINE · LAUNCHER READY</span></div>
        <div className="bat-home-title">NEO<span className="accent">CAB</span></div>
        <div className="bat-home-sub">Your arcade cabinet, dressed up clean. Pick a system or jump straight to your pinned titles.</div>
        <div className="bat-home-stats">
          <div className="bat-home-stat"><div className="k">Titles</div><div className="v">{totals.titles.toLocaleString()}</div></div>
          <div className="bat-home-stat"><div className="k">Systems</div><div className="v">{totals.systems}</div></div>
          <div className="bat-home-stat"><div className="k">Favorites</div><div className="v">{totals.favorites}</div></div>
          <div className="bat-home-stat"><div className="k">Sessions</div><div className="v">142</div></div>
        </div>
        <div className="bat-home-recent">
          <div className="bat-home-recent-head"><span>RECENT</span><div className="line"></div><span>last 5 sessions</span></div>
          {recentGames.slice(0, 5).map(g => (
            <div key={g.id} className="bat-home-recent-row">
              <span className="ttl">{g.title}</span>
              <span className="sys">{g.system}</span>
              <span className="when">{g.lastPlayed}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bat-home-right">
        <div className="bat-home-menu-head"><span>MAIN MENU</span><div className="line"></div></div>
        <div className="bat-home-menu">
          {window.ARCADE_MENU.map((it, i) => (
            <button key={it.id} className={'bat-menu-item' + (i === shell.menuIndex ? ' active' : '')}
              tabIndex={-1}
              onClick={() => { shell.setMenuIndex(i); onSelect(it.id); }}>
              <span className="mi-num">{String(i+1).padStart(2,'0')}</span>
              <span className="mi-icon">{it.icon}</span>
              <span className="mi-body">
                <span className="mi-label">{it.label}</span>
                <span className="mi-tag">{it.sub}</span>
              </span>
              {i === shell.menuIndex && <span className="mi-arrow">▶</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BATOCERA THEME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function BatoceraTheme({ onChangeTheme }) {
  useEffectB(() => { injectCssBat(); }, []);
  const allSystems = window.PACK_SYSTEMS;
  const allGames = window.PACK_GAMES;
  const shell = window.useArcadeShell({ onChangeTheme, defaultSystem: 0 });
  const [filter, setFilter] = useStateB('all');

  const sys = allSystems[shell.sysIndex];

  // games for current screen
  const games = useMemoB(() => {
    if (shell.shortcut) return shell.shortcut.games;
    let list = allGames.filter(g => g.systemId === sys.id);
    switch (filter) {
      case 'favs':     return list.filter(g => g.favorite);
      case 'most':     return [...list].sort((a,b) => b.playCount - a.playCount);
      case 'recent':   return list.filter(g => g.lastPlayed && g.lastPlayed !== 'Never');
      case 'fight':    return list.filter(g => g.genre === 'Versus Fighting');
      case 'beat':     return list.filter(g => g.genre.startsWith('Beat'));
      case 'platform': return list.filter(g => g.genre === 'Platformer');
      default:         return list;
    }
  }, [allGames, sys, filter, shell.shortcut]);

  const safeIdx = Math.min(shell.gameIndex, Math.max(0, games.length - 1));
  const game = games[safeIdx];

  // dynamic accent
  useEffectB(() => {
    const el = document.querySelector('.theme-batocera');
    if (!el) return;
    el.style.setProperty('--bat-h', sys.hue);
    el.style.setProperty('--bat-h2', sys.hue2);
  }, [sys]);

  // shared keyboard
  window.useArcadeKeys({ shell, allSystems, games });

  const totals = {
    systems: allSystems.length,
    titles: allSystems.reduce((n, s) => n + s.count, 0),
    favorites: allGames.filter(g => g.favorite).length,
  };
  const recentGames = useMemoB(() => allGames.filter(g => g.lastPlayed !== 'Never').slice(0, 5), [allGames]);

  return (
    <div className="theme-batocera">
      <div className="bat-bg">
        <div className="bat-bg-art"></div>
        <div className="bat-bg-glow"></div>
        <div className="bat-bg-tex"></div>
      </div>
      <div className="bat-shell">
        <BatHeader
          section={shell.screen === 'home' ? 'HOME' : shell.screen === 'systems' ? 'SYSTEMS' : (shell.shortcut?.label.toUpperCase() || sys.name.toUpperCase())}
          sectionDetail={shell.screen === 'home' ? 'main menu' : shell.screen === 'systems' ? `${allSystems.length} libraries` : `${games.length} of ${shell.shortcut ? allGames.length : allGames.filter(g => g.systemId === sys.id).length} titles`}
        />
        <div className="bat-main">
          {shell.screen === 'home' && (
            <BatHome shell={shell} totals={totals} recentGames={recentGames}
              onSelect={(id) => shell.openMenuItem(id, allGames)} />
          )}
          {shell.screen === 'systems' && (
            <BatSystemCarousel systems={allSystems} index={shell.sysIndex} onPick={shell.setSysIndex}/>
          )}
          {shell.screen === 'wheel' && (
            <BatGameList
              games={games}
              index={safeIdx}
              onPick={shell.setGameIndex}
              filter={filter}
              onFilter={(f) => { setFilter(f); shell.setGameIndex(0); }}
              system={sys}/>
          )}
          {shell.screen === 'settings' && <window.SettingsShell shell={shell} />}
          {shell.screen === 'themes'   && <window.ThemeSwitcherPanel shell={shell} activeId="batocera" />}
        </div>
        <BatControls inGameList={shell.screen === 'wheel'}/>
      </div>
    </div>
  );
}

window.BatoceraTheme = BatoceraTheme;
