// theme-operator.jsx — NeoCab Advance Operator theme
// Dense, technical, CRT-phosphor operator-grade ROM browser.
// Aesthetic: monospaced terminal, heavy scanlines, switchable phosphor color (green/amber/cyan).
const { useState: useStateO, useEffect: useEffectO, useMemo: useMemoO, useCallback: useCallbackO } = React;

const OPERATOR_CSS = `
.theme-operator{
  position:absolute;inset:0;overflow:hidden;
  font-family:'VT323', 'JetBrains Mono', ui-monospace, monospace;
  color: var(--op-fg, #66ff8a);

  /* phosphor color presets, switched via .phosphor-* class on root */
  --op-bg: #020806;
  --op-bg2: #04140a;
  --op-fg: #66ff8a;
  --op-fg-dim: rgba(102,255,138,.55);
  --op-fg-faint: rgba(102,255,138,.22);
  --op-hi: #c9ffd2;
  --op-warn: #ffd200;
  --op-err: #ff5e5e;
  --op-bezel: #0a1a10;
  --op-glow: rgba(102,255,138,.55);
}
.theme-operator.phosphor-amber{
  --op-bg:#0a0602;--op-bg2:#140a02;
  --op-fg:#ffb33b;--op-fg-dim:rgba(255,179,59,.55);--op-fg-faint:rgba(255,179,59,.22);
  --op-hi:#ffeebd;--op-glow:rgba(255,179,59,.55);
  --op-bezel:#1a0e02;
}
.theme-operator.phosphor-cyan{
  --op-bg:#020a0e;--op-bg2:#021018;
  --op-fg:#7df0ff;--op-fg-dim:rgba(125,240,255,.55);--op-fg-faint:rgba(125,240,255,.22);
  --op-hi:#d0fbff;--op-glow:rgba(125,240,255,.55);
  --op-bezel:#031a26;
}

/* ── CRT bezel + global FX ────────────────────────────────────────── */
.op-bezel{
  position:absolute;inset:0;
  background:
    radial-gradient(70% 60% at 50% 50%, var(--op-bg2) 0%, var(--op-bg) 80%);
  box-shadow:
    inset 0 0 0 2px var(--op-bezel),
    inset 0 0 80px rgba(0,0,0,.9),
    inset 0 0 200px rgba(0,0,0,.6);
}
.op-bezel::before{
  /* corner deco — chassis screws */
  content:""; position:absolute; inset:18px;
  border:1px solid var(--op-fg-faint);
  pointer-events:none;
}
.op-scanlines{
  position:absolute;inset:0;pointer-events:none;z-index:60;
  background:repeating-linear-gradient(to bottom,
    rgba(0,0,0,.35) 0 1px, transparent 1px 3px);
  mix-blend-mode:multiply;
}
.op-rgb{
  position:absolute;inset:0;pointer-events:none;z-index:59;
  background:repeating-linear-gradient(to right,
    rgba(255,0,40,.05) 0 1px, rgba(0,255,80,.05) 1px 2px, rgba(0,80,255,.05) 2px 3px);
  mix-blend-mode:screen;opacity:.55;
}
.op-vignette{
  position:absolute;inset:0;pointer-events:none;z-index:58;
  background:radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.65) 90%);
}
.op-glow-layer{
  position:absolute;inset:0;pointer-events:none;z-index:1;
  background:radial-gradient(60% 50% at 50% 50%, color-mix(in oklch, var(--op-fg) 14%, transparent) 0%, transparent 70%);
  filter:blur(40px);
  opacity:.5;
}
.op-flicker{
  position:absolute;inset:0;pointer-events:none;z-index:62;
  background:#000;opacity:0;animation:opFlicker 6s ease-in-out infinite;
}
@keyframes opFlicker{
  0%,3%,6%,100%{opacity:0}
  4%{opacity:.04}
  5%{opacity:.02}
}

/* ── Shell layout ─────────────────────────────────────────────────── */
.op-shell{
  position:absolute;inset:36px;
  display:flex;flex-direction:column;
  background:transparent;color:var(--op-fg);
  font-size:22px; /* VT323 reads larger */
  line-height:1.1;
}

/* ── Top status bar ───────────────────────────────────────────────── */
.op-topbar{
  flex:none;display:flex;align-items:center;gap:18px;
  padding:8px 16px;
  border:1px solid var(--op-fg-dim);
  background:rgba(0,0,0,.5);
}
.op-topbar .seg{
  display:flex;align-items:center;gap:10px;
  color:var(--op-fg);
}
.op-topbar .seg b{color:var(--op-hi);text-shadow:0 0 6px var(--op-glow);}
.op-topbar .sep{color:var(--op-fg-faint);}
.op-topbar .blink{
  display:inline-block;width:10px;height:14px;background:var(--op-fg);
  box-shadow:0 0 8px var(--op-glow);animation:opBlink 1s steps(2) infinite;
}
@keyframes opBlink{0%,49%{opacity:1}50%,100%{opacity:0}}

.op-filterbar{
  flex:none;display:flex;align-items:center;gap:0;
  margin-top:8px;
  border:1px solid var(--op-fg-dim);
  background:rgba(0,0,0,.5);
}
.op-filter-tab{
  padding:6px 14px;cursor:pointer;
  border-right:1px solid var(--op-fg-faint);
  color:var(--op-fg-dim);
  letter-spacing:.08em;text-transform:uppercase;
}
.op-filter-tab:last-child{border-right:0}
.op-filter-tab.active{
  background:var(--op-fg);color:#020806;
  text-shadow:none;font-weight:700;
  box-shadow:0 0 12px var(--op-glow);
}
.op-filter-tab .ct{margin-left:8px;opacity:.65;font-size:18px;}
.op-filter-tab .key{
  display:inline-block;margin-right:8px;
  border:1px solid var(--op-fg-faint);padding:0 5px;
  color:var(--op-fg);font-size:14px;
}
.op-filter-tab.active .key{border-color:#020806;color:#020806}

/* ── Two-pane main ────────────────────────────────────────────────── */
.op-main{
  flex:1;display:grid;grid-template-columns:1fr 600px;gap:8px;
  margin-top:8px;min-height:0;
}
.op-list-pane{
  display:flex;flex-direction:column;min-height:0;
  border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
}
.op-pane-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:6px 14px;
  border-bottom:1px solid var(--op-fg-faint);
  color:var(--op-hi);text-shadow:0 0 6px var(--op-glow);
  text-transform:uppercase;letter-spacing:.18em;font-size:18px;
}
.op-pane-head .right{color:var(--op-fg-dim);font-size:16px;letter-spacing:.1em;}

.op-list-head{
  display:grid;grid-template-columns:48px 32px 1fr 220px 110px 80px;gap:10px;
  padding:5px 14px;
  border-bottom:1px solid var(--op-fg-faint);
  color:var(--op-fg-dim);font-size:16px;text-transform:uppercase;letter-spacing:.2em;
}
.op-list{
  flex:1;overflow-y:auto;
  scrollbar-color:var(--op-fg-faint) transparent;scrollbar-width:thin;
  font-feature-settings:"tnum";font-variant-numeric:tabular-nums;
}
.op-list::-webkit-scrollbar{width:10px}
.op-list::-webkit-scrollbar-thumb{background:var(--op-fg-faint)}
.op-row{
  display:grid;grid-template-columns:48px 32px 1fr 220px 110px 80px;gap:10px;
  padding:5px 14px;cursor:pointer;
  color:var(--op-fg);font-size:22px;
  position:relative;
}
.op-row:hover{background:rgba(102,255,138,.07)}
.op-row .num{color:var(--op-fg-dim)}
.op-row .star{color:var(--op-warn);text-shadow:0 0 6px var(--op-warn)}
.op-row .romset{
  font-size:18px;color:var(--op-fg-dim);
  letter-spacing:.04em;text-transform:uppercase;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.op-row .genre{color:var(--op-fg-dim);font-size:18px;letter-spacing:.1em;text-transform:uppercase;}
.op-row .plays{color:var(--op-fg);text-align:right}
.op-row.active{
  background:var(--op-fg);color:#020806;
  text-shadow:none;
  box-shadow:0 0 18px var(--op-glow), inset 0 0 0 1px #020806;
}
.op-row.active .num,
.op-row.active .romset,
.op-row.active .genre,
.op-row.active .plays{color:#020806;}
.op-row.active .star{color:#020806;text-shadow:none}
.op-row.active::before{
  content:"►";position:absolute;left:-10px;top:50%;transform:translateY(-50%);
  color:var(--op-fg);text-shadow:0 0 8px var(--op-glow);font-size:24px;
}

.op-list-foot{
  display:flex;align-items:center;justify-content:space-between;
  padding:6px 14px;border-top:1px solid var(--op-fg-faint);
  color:var(--op-fg-dim);font-size:17px;letter-spacing:.16em;text-transform:uppercase;
}
.op-list-foot b{color:var(--op-hi);text-shadow:0 0 6px var(--op-glow);font-weight:400}

/* ── Right pane: marquee + snapshot + technical ───────────────────── */
.op-right-pane{
  display:flex;flex-direction:column;gap:8px;min-height:0;
}
.op-marquee-pane{
  flex:none;height:90px;
  border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;padding:6px 18px;
  position:relative;overflow:hidden;
}
.op-marquee-pane::after{
  content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(to right,
    transparent 0 4px, color-mix(in oklch, var(--op-fg) 10%, transparent) 4px 5px);
  pointer-events:none;
}
.op-marquee-text{
  font-family:'Russo One', sans-serif;font-size:34px;line-height:1;color:var(--op-fg);
  letter-spacing:.005em;text-transform:uppercase;text-align:center;
  text-shadow:0 0 14px var(--op-glow), 0 0 28px var(--op-glow);
}
.op-marquee-text .accent{color:var(--op-hi)}
.op-marquee-text .stroke{-webkit-text-stroke:1.5px var(--op-fg);color:transparent}

.op-snapshot-pane{
  flex:1.1;display:flex;flex-direction:column;min-height:0;
  border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
}
.op-snapshot-screen{
  position:relative;flex:1;
  background:#000;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;min-height:0;
}
.op-snapshot-screen::before{
  content:"";position:absolute;inset:8px;
  border:1px solid var(--op-fg-faint);
  pointer-events:none;
}
.op-snapshot-art{
  display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px;text-align:center;
}
.op-snapshot-art .ttl{
  font-family:'Russo One', sans-serif;font-size:42px;color:var(--op-fg);
  text-shadow:0 0 14px var(--op-glow);letter-spacing:.005em;line-height:1;
}
.op-snapshot-art .sub{
  font-size:20px;color:var(--op-hi);text-shadow:0 0 6px var(--op-glow);
  letter-spacing:.16em;text-transform:uppercase;
}
.op-snapshot-art .copy{
  font-size:16px;color:var(--op-fg-dim);letter-spacing:.18em;
  text-transform:uppercase;margin-top:6px;
}
.op-snapshot-fallback{
  display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--op-warn);
  text-shadow:0 0 6px var(--op-warn);text-transform:uppercase;letter-spacing:.18em;
  font-size:20px;text-align:center;padding:24px;
}
.op-snapshot-fallback .glyph{font-size:60px;line-height:1}
.op-snapshot-fallback .hint{color:var(--op-fg-dim);text-shadow:none;font-size:16px;}

.op-snapshot-corner{
  position:absolute;top:14px;left:14px;
  font-size:17px;color:var(--op-fg-dim);letter-spacing:.16em;text-transform:uppercase;
}
.op-snapshot-corner.r{left:auto;right:14px;color:var(--op-warn);text-shadow:0 0 6px var(--op-warn);}
.op-snapshot-corner.b{top:auto;bottom:10px;color:var(--op-fg-dim);}
.op-snapshot-corner.br{top:auto;left:auto;bottom:10px;right:14px;color:var(--op-fg);}

.op-tech-pane{
  flex:none;
  border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  padding:6px 14px 10px;
}
.op-tech-grid{
  display:grid;grid-template-columns:repeat(2, 1fr);column-gap:18px;row-gap:0;
  font-size:21px;
}
.op-tech-row{
  display:flex;align-items:baseline;gap:10px;
  padding:3px 0;border-bottom:1px dashed var(--op-fg-faint);
}
.op-tech-row .k{
  color:var(--op-fg-dim);letter-spacing:.18em;text-transform:uppercase;
  font-size:17px;min-width:80px;
}
.op-tech-row .v{
  color:var(--op-fg);text-shadow:0 0 6px var(--op-glow);
  flex:1;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.op-tech-row .v.hi{color:var(--op-hi)}
.op-tech-row .v.warn{color:var(--op-warn);text-shadow:0 0 6px var(--op-warn)}

/* ── Bottom bar: view modes + controls ────────────────────────────── */
.op-bottom{
  flex:none;margin-top:8px;display:flex;flex-direction:column;gap:8px;
}
.op-view-modes{
  display:flex;align-items:stretch;gap:0;
  border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
}
.op-view{
  flex:1;padding:6px 12px;cursor:pointer;
  display:flex;align-items:center;gap:10px;
  color:var(--op-fg-dim);
  border-right:1px solid var(--op-fg-faint);
  text-transform:uppercase;letter-spacing:.18em;font-size:17px;
}
.op-view:last-child{border-right:0}
.op-view.active{
  background:var(--op-fg);color:#020806;font-weight:700;
  box-shadow:inset 0 0 0 1px #020806;
}
.op-view svg{width:24px;height:24px;flex:none}
.op-view .key{
  border:1px solid var(--op-fg-faint);padding:0 5px;
  color:var(--op-fg);font-size:14px;margin-right:6px;
}
.op-view.active .key{border-color:#020806;color:#020806}

.op-controls{
  display:flex;align-items:center;gap:18px;
  padding:6px 14px;
  border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
}
.op-ctl{display:flex;align-items:center;gap:8px;color:var(--op-fg);font-size:18px;letter-spacing:.16em;text-transform:uppercase;}
.op-ctl .btn{
  display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;
  background:var(--op-fg);color:#020806;font-weight:700;font-size:16px;
  box-shadow:0 0 10px var(--op-glow);
  font-family:'Russo One', sans-serif;
}
.op-ctl .btn.warn{background:var(--op-warn);box-shadow:0 0 10px var(--op-warn)}
.op-ctl .btn.err{background:var(--op-err);color:#fff;box-shadow:0 0 10px var(--op-err)}
.op-ctl b{color:var(--op-hi);text-shadow:0 0 6px var(--op-glow);font-weight:400}
.op-ctl span{color:var(--op-fg-dim)}
.op-controls .spacer{flex:1}
.op-phosphor{
  display:flex;align-items:center;gap:8px;
  color:var(--op-fg-dim);font-size:18px;letter-spacing:.16em;text-transform:uppercase;
}
.op-phosphor .swatch{
  width:18px;height:18px;border:1px solid var(--op-fg-faint);cursor:pointer;
}
.op-phosphor .swatch.green{background:#66ff8a}
.op-phosphor .swatch.amber{background:#ffb33b}
.op-phosphor .swatch.cyan{background:#7df0ff}
.op-phosphor .swatch.active{box-shadow:0 0 12px currentColor;outline:1px solid var(--op-fg);}

/* ─── HOME (terminal-style boot menu) ─── */
.op-home{
  position:absolute;inset:36px;display:flex;flex-direction:column;gap:0;
  font-family:'VT323', monospace;color:var(--op-fg);font-size:22px;line-height:1.1;
}
.op-home-banner{padding:14px 18px;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);}
.op-home-ascii{
  font-family:ui-monospace, monospace;font-size:13px;line-height:1;color:var(--op-fg);text-shadow:0 0 8px var(--op-glow);
  white-space:pre;letter-spacing:0;
}
.op-home-brand{
  display:flex;align-items:baseline;gap:14px;margin-top:10px;
  font-family:'VT323', monospace;font-size:48px;letter-spacing:.06em;color:var(--op-hi);
  text-shadow:0 0 14px var(--op-glow);
}
.op-home-brand .build{font-size:18px;color:var(--op-fg-dim);letter-spacing:.2em;}
.op-home-status{margin-top:6px;font-size:18px;color:var(--op-fg-dim);letter-spacing:.16em;text-transform:uppercase;}
.op-home-status b{color:var(--op-fg);text-shadow:0 0 6px var(--op-glow);font-weight:400;}

.op-home-grid{flex:1;display:grid;grid-template-columns:1.1fr .9fr;gap:8px;margin-top:8px;min-height:0;}
.op-home-pane{
  display:flex;flex-direction:column;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  min-height:0;
}
.op-home-pane .head{
  padding:5px 14px;border-bottom:1px solid var(--op-fg-faint);
  color:var(--op-hi);text-shadow:0 0 6px var(--op-glow);text-transform:uppercase;letter-spacing:.18em;font-size:18px;
}
.op-home-pane .head .right{float:right;color:var(--op-fg-dim);font-size:16px;letter-spacing:.1em;}

.op-home-menu{flex:1;overflow-y:auto;padding:8px 0;}
.op-menu-row{
  display:grid;grid-template-columns:60px 40px 1fr 220px;gap:14px;align-items:center;
  padding:9px 18px;cursor:pointer;color:var(--op-fg);
}
.op-menu-row .key{font-family:ui-monospace, monospace;font-size:16px;color:var(--op-fg-dim);letter-spacing:.18em;text-transform:uppercase;}
.op-menu-row .ic{font-size:24px;color:var(--op-fg-dim);text-align:center;}
.op-menu-row .lbl{font-family:'VT323', monospace;font-size:28px;color:var(--op-fg);text-transform:uppercase;letter-spacing:.04em;}
.op-menu-row .tag{font-family:'VT323', monospace;font-size:18px;color:var(--op-fg-dim);letter-spacing:.16em;text-transform:uppercase;text-align:right;}
.op-menu-row.active{
  background:var(--op-fg);color:#020806;text-shadow:none;box-shadow:0 0 18px var(--op-glow);
}
.op-menu-row.active .key, .op-menu-row.active .ic, .op-menu-row.active .lbl, .op-menu-row.active .tag{color:#020806;}
.op-menu-row.active::before{content:"►";position:absolute;left:24px;color:#020806;}

.op-home-side{display:flex;flex-direction:column;gap:8px;min-height:0;}
.op-stats-pane{
  padding:10px 14px;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
}
.op-stats-row{display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px dashed var(--op-fg-faint);}
.op-stats-row:last-child{border-bottom:0;}
.op-stats-row .k{color:var(--op-fg-dim);font-size:18px;letter-spacing:.16em;text-transform:uppercase;}
.op-stats-row .v{color:var(--op-hi);font-size:24px;text-shadow:0 0 6px var(--op-glow);font-variant-numeric:tabular-nums;}
.op-recent-pane{flex:1;display:flex;flex-direction:column;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);min-height:0;}
.op-recent-list{flex:1;overflow-y:auto;padding:6px 0;font-feature-settings:"tnum";font-variant-numeric:tabular-nums;}
.op-recent-row{display:grid;grid-template-columns:40px 1fr 100px;gap:10px;padding:4px 14px;font-size:20px;}
.op-recent-row .num{color:var(--op-fg-dim);font-size:16px;}
.op-recent-row .ttl{color:var(--op-fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.op-recent-row .when{color:var(--op-warn);font-size:16px;text-align:right;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 0 4px var(--op-warn);}

.op-home-log{
  margin-top:8px;padding:8px 14px;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  font-size:18px;color:var(--op-fg-dim);letter-spacing:.04em;font-family:ui-monospace, monospace;
  display:flex;flex-direction:column;gap:2px;line-height:1.3;
}
.op-home-log b{color:var(--op-fg);font-weight:400;}
.op-home-log .warn{color:var(--op-warn);}

/* ─── SYSTEMS (terminal-style system selector with track-translate) ─── */
.op-systems-screen{
  position:absolute;inset:36px;display:flex;flex-direction:column;gap:8px;
  font-family:'VT323', monospace;color:var(--op-fg);font-size:22px;
}
.op-sys-head{padding:6px 14px;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  display:flex;justify-content:space-between;align-items:baseline;color:var(--op-hi);
  text-shadow:0 0 6px var(--op-glow);letter-spacing:.16em;font-size:24px;text-transform:uppercase;}
.op-sys-head .right{color:var(--op-fg-dim);font-size:18px;letter-spacing:.1em;}
.op-sys-detail{padding:14px 18px;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;}
.op-sys-detail-cell{display:flex;flex-direction:column;gap:3px;}
.op-sys-detail-cell .k{font-size:14px;letter-spacing:.18em;color:var(--op-fg-dim);text-transform:uppercase;}
.op-sys-detail-cell .v{font-size:30px;color:var(--op-fg);text-shadow:0 0 6px var(--op-glow);font-family:'VT323', monospace;line-height:1;}
.op-sys-detail-cell .v.hi{color:var(--op-hi);}

.op-sys-carousel{
  flex:1;position:relative;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);
  overflow:hidden;perspective:1400px;min-height:0;
}
.op-sys-track{
  position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:20px;
  transition:transform 460ms cubic-bezier(.18,.85,.22,1.02);
  transform-style:preserve-3d;will-change:transform;
}
.op-sys-card{
  position:relative;flex:none;width:220px;height:260px;display:flex;flex-direction:column;
  background:linear-gradient(180deg, rgba(0,0,0,.6), rgba(0,0,0,.85));
  border:1px solid var(--op-fg-faint);
  padding:12px 14px;
  transition:transform 460ms cubic-bezier(.18,.85,.22,1.02), opacity 460ms ease, border-color 460ms ease, box-shadow 460ms ease;
  cursor:pointer;
}
.op-sys-card-head{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--op-fg-faint);padding-bottom:6px;margin-bottom:8px;}
.op-sys-card-head .short{font-size:18px;color:var(--op-fg);text-shadow:0 0 4px var(--op-glow);letter-spacing:.18em;}
.op-sys-card-head .id{font-size:14px;color:var(--op-fg-dim);letter-spacing:.1em;}
.op-sys-card-art{flex:1;display:flex;align-items:center;justify-content:center;}
.op-sys-card-art svg{width:80%;max-width:140px;height:auto;opacity:.85;}
.op-sys-card-name{font-size:24px;color:var(--op-fg);text-transform:uppercase;letter-spacing:.04em;line-height:1.05;margin-top:8px;}
.op-sys-card-tag{font-size:14px;color:var(--op-fg-dim);letter-spacing:.16em;text-transform:uppercase;margin-top:2px;}
.op-sys-card-count{margin-top:8px;font-size:16px;color:var(--op-warn);text-shadow:0 0 4px var(--op-warn);letter-spacing:.12em;text-transform:uppercase;font-variant-numeric:tabular-nums;}
.op-sys-card.active{
  border-color:var(--op-fg);background:linear-gradient(180deg, rgba(0,40,20,.5), rgba(0,0,0,.85));
  box-shadow:0 0 28px var(--op-glow);
}
.op-sys-card.active .op-sys-card-head .short{color:var(--op-hi);}

.op-sys-pointer{position:absolute;inset:0;pointer-events:none;}
.op-sys-pointer::before, .op-sys-pointer::after{
  content:"►";position:absolute;top:50%;transform:translateY(-50%);
  font-family:'VT323', monospace;font-size:38px;color:var(--op-fg);text-shadow:0 0 10px var(--op-glow);
  animation:opBlink 1s steps(2) infinite;
}
.op-sys-pointer::before{left:calc(50% - 140px);content:"◄";}
.op-sys-pointer::after{right:calc(50% - 140px);}

.op-sys-rail{display:flex;gap:0;border:1px solid var(--op-fg-dim);background:rgba(0,0,0,.5);overflow-x:auto;scrollbar-width:none;}
.op-sys-rail::-webkit-scrollbar{display:none;}
.op-sys-rail-cell{flex:none;padding:6px 16px;border-right:1px solid var(--op-fg-faint);
  font-size:18px;color:var(--op-fg-dim);letter-spacing:.16em;text-transform:uppercase;cursor:pointer;}
.op-sys-rail-cell:last-child{border-right:0;}
.op-sys-rail-cell b{color:var(--op-fg);font-weight:400;font-size:16px;margin-right:8px;}
.op-sys-rail-cell.active{background:var(--op-fg);color:#020806;text-shadow:none;font-weight:700;box-shadow:0 0 14px var(--op-glow);}
.op-sys-rail-cell.active b{color:#020806;}
`;

function injectCssOp() {
  if (document.getElementById('theme-operator-css')) return;
  const s = document.createElement('style');
  s.id = 'theme-operator-css';
  s.textContent = OPERATOR_CSS;
  document.head.appendChild(s);
}

// ─── view-mode icons ───────────────────────────────────────────────────────
const VIEW_ICONS = {
  list: <svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="2" y="4" width="20" height="3"/><rect x="2" y="10" width="20" height="3"/><rect x="2" y="16" width="20" height="3"/></g></svg>,
  preview: <svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="2" y="4" width="10" height="3"/><rect x="2" y="10" width="10" height="3"/><rect x="2" y="16" width="10" height="3"/><rect x="14" y="4" width="8" height="15" stroke="currentColor" strokeWidth="1.2" fill="none"/></g></svg>,
  grid:  <svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></g></svg>,
  flyers:<svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="10" y="3" width="6" height="18" rx="1" opacity=".7"/><rect x="17" y="3" width="4" height="18" rx="1" opacity=".45"/></g></svg>,
};

// ─── HOOK ─────────────────────────────────────────────────────────────────
function useClockOp() {
  const [t, setT] = useStateO(() => new Date());
  useEffectO(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;
}

// ─── operator filter set (intentionally different from Batocera's) ───
const OP_FILTERS = [
  { id: 'sys',    label: 'System',     key: 'S' },
  { id: 'all',    label: 'All',        key: 'A' },
  { id: 'favs',   label: 'Favorites',  key: 'F' },
  { id: 'clones', label: 'Clones',     key: 'C' },
  { id: 'noplay', label: 'Not Played', key: 'N' },
  { id: 'recent', label: 'Recent',     key: 'R' },
];

const OP_VIEWS = [
  { id: 'list',    label: 'List',          key: '1', icon: 'list' },
  { id: 'preview', label: 'List + Preview',key: '2', icon: 'preview' },
  { id: 'grid',    label: 'Grid',          key: '3', icon: 'grid' },
  { id: 'flyers',  label: 'Flyers',        key: '4', icon: 'flyers' },
];

// ─── HOME (terminal-style) ─────────────────────────────────────────────────
const OP_ASCII = `
  ##    ## ########  #######  ######   ######  ########
  ###   ## ##       ##     ## ##    ## ##    ## ##
  #### ##  ##       ##     ## ##       ##    ## ##
  ## ## ## ######   ##     ## ##       ########  ######
  ##  #### ##       ##     ## ##       ##   ##   ##
  ##   ### ##       ##     ## ##    ## ##    ##  ##
  ##    ## ########  #######  ######   ##    ## ########
`.trimEnd();

function OpHome({ shell, totals, recentGames, onSelect, time }) {
  return (
    <div className="op-home" data-screen-label="Operator · Home">
      <div className="op-home-banner">
        <div className="op-home-ascii">{OP_ASCII}</div>
        <div className="op-home-brand">NEOCAB <span className="build">v0.7-r1 · ADV-OP TERMINAL</span></div>
        <div className="op-home-status">SYSTEM <b>ONLINE</b> · <b>{totals.systems}</b> SYSTEMS · <b>{totals.titles.toLocaleString()}</b> ROMS INDEXED · UPTIME <b>04:32:11</b> · {time}</div>
      </div>

      <div className="op-home-grid">
        <div className="op-home-pane">
          <div className="op-pane-head">MAIN MENU<span className="right">SELECT &amp; PRESS [ENTER]</span></div>
          <div className="op-home-menu">
            {window.ARCADE_MENU.map((it, i) => (
              <div key={it.id} className={'op-menu-row' + (i === shell.menuIndex ? ' active' : '')}
                onClick={() => { shell.setMenuIndex(i); onSelect(it.id); }}>
                <span className="key">[{i+1}]</span>
                <span className="ic">{it.icon}</span>
                <span className="lbl">{it.label}</span>
                <span className="tag">{it.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="op-home-side">
          <div className="op-stats-pane">
            <div className="op-pane-head" style={{padding:'0 0 6px',border:'none',marginBottom:6}}>SESSION STATS</div>
            <div className="op-stats-row"><span className="k">Total titles</span><span className="v">{totals.titles.toLocaleString()}</span></div>
            <div className="op-stats-row"><span className="k">Systems online</span><span className="v">{totals.systems}</span></div>
            <div className="op-stats-row"><span className="k">Favorites</span><span className="v">{totals.favorites}</span></div>
            <div className="op-stats-row"><span className="k">Last scrape</span><span className="v">10:32:04</span></div>
            <div className="op-stats-row"><span className="k">Free disk</span><span className="v">214.6 GB</span></div>
          </div>
          <div className="op-recent-pane">
            <div className="op-pane-head">RECENT LAUNCHES<span className="right">last {Math.min(5, recentGames.length)}</span></div>
            <div className="op-recent-list">
              {recentGames.slice(0, 5).map((g, i) => (
                <div key={g.id} className="op-recent-row">
                  <span className="num">{String(i+1).padStart(2,'0')}</span>
                  <span className="ttl">{g.title}</span>
                  <span className="when">{g.lastPlayed}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="op-home-log">
        <div><b>&gt;</b> system boot ok</div>
        <div><b>&gt;</b> roms.idx loaded · {totals.titles.toLocaleString()} entries indexed</div>
        <div><b>&gt;</b> crt phosphor warm · scanline integrity ok</div>
        <div><b>&gt;</b> awaiting input <span className="warn">_</span></div>
      </div>
    </div>
  );
}

// ─── SYSTEMS (terminal-style smooth carousel) ──────────────────────────────
function OpSystems({ shell, systems }) {
  const sys = systems[shell.sysIndex];
  return (
    <div className="op-systems-screen" data-screen-label="Operator · Systems">
      <div className="op-sys-head">
        <span>SELECT SYSTEM <span style={{opacity:.5,marginLeft:8}}>· {String(shell.sysIndex+1).padStart(2,'0')}/{String(systems.length).padStart(2,'0')}</span></span>
        <span className="right">USE [◄] [►] · ENTER TO OPEN</span>
      </div>
      <div className="op-sys-detail">
        <div className="op-sys-detail-cell"><div className="k">System</div><div className="v hi">{sys.name.toUpperCase()}</div></div>
        <div className="op-sys-detail-cell"><div className="k">Type</div><div className="v">{sys.tag.toUpperCase()}</div></div>
        <div className="op-sys-detail-cell"><div className="k">Titles</div><div className="v hi">{sys.count.toLocaleString()}</div></div>
      </div>

      <div className="op-sys-carousel">
        <div className="op-sys-track" style={{ transform: `translate(calc(-${shell.sysIndex * 240}px - 110px), -50%)` }}>
          {systems.map((s, i) => {
            const d = i - shell.sysIndex;
            const abs = Math.abs(d);
            const scale = d === 0 ? 1.2 : abs === 1 ? .82 : abs === 2 ? .62 : .42;
            const rotY = d * -15;
            const opacity = abs === 0 ? 1 : abs === 1 ? .65 : abs === 2 ? .25 : .08;
            const blur = abs === 0 ? 0 : abs === 1 ? .35 : abs === 2 ? 1.2 : 2.2;
            return (
              <div
                key={s.id}
                className={'op-sys-card' + (d === 0 ? ' active' : '')}
                onClick={() => shell.setSysIndex(i)}
                style={{ transform: `scale(${scale}) rotateY(${rotY}deg)`, opacity, filter:`blur(${blur}px)`, zIndex: 100 - abs }}>
                <div className="op-sys-card-head">
                  <span className="short">{s.short}</span>
                  <span className="id">{s.id}.cpp</span>
                </div>
                <div className="op-sys-card-art">
                  <BatShape shape={s.shape} short={s.short} hue={s.hue}/>
                </div>
                <div className="op-sys-card-name">{s.name}</div>
                <div className="op-sys-card-tag">{s.tag}</div>
                <div className="op-sys-card-count">{s.count.toLocaleString()} ROMS</div>
              </div>
            );
          })}
        </div>
        <div className="op-sys-pointer"></div>
      </div>

      <div className="op-sys-rail">
        {systems.map((s, i) => (
          <div key={s.id}
            className={'op-sys-rail-cell' + (i === shell.sysIndex ? ' active' : '')}
            onClick={() => shell.setSysIndex(i)}>
            <b>{String(i+1).padStart(2,'0')}</b>{s.short}
          </div>
        ))}
      </div>
    </div>
  );
}

// We re-use BatShape (loaded by theme-batocera). Ensure it's defined here in case ordering changes.
// (Operator loads after batocera, so window.BatShape may not be exposed — alias from local file.)

// ═══════════════════════════════════════════════════════════════════════════
function OperatorTheme({ onChangeTheme }) {
  useEffectO(() => { injectCssOp(); }, []);

  const allGames = window.PACK_GAMES;
  const allSystems = window.PACK_SYSTEMS;
  const shell = window.useArcadeShell({ onChangeTheme, defaultSystem: 0 });

  const [phosphor, setPhosphor] = useStateO('green');
  const [filter, setFilter] = useStateO('all');
  const [viewMode, setViewMode] = useStateO('preview');

  const sys = allSystems[shell.sysIndex];

  // Filtering logic
  const games = useMemoO(() => {
    if (shell.shortcut) return shell.shortcut.games;
    let list = allGames.filter(g => g.systemId === sys.id);
    switch (filter) {
      case 'all':    return allGames.filter(g => g.systemId === sys.id);
      case 'favs':   return allGames.filter(g => g.systemId === sys.id && g.favorite);
      case 'clones': return list.filter(g => g.romset && g.romset.length > 4);
      case 'noplay': return list.filter(g => g.lastPlayed === 'Never' || g.playCount < 20);
      case 'recent': return list.filter(g => ['Today','Yesterday','2 days ago','4 days ago'].includes(g.lastPlayed));
      default:       return list;
    }
  }, [allGames, sys, filter, shell.shortcut]);

  const safeIdx = Math.min(shell.gameIndex, Math.max(0, games.length - 1));
  const game = games[safeIdx];

  const time = useClockOp();
  const totals = {
    systems: allSystems.length,
    titles: allSystems.reduce((n, s) => n + s.count, 0),
    favorites: allGames.filter(g => g.favorite).length,
  };
  const recentGames = useMemoO(() => allGames.filter(g => g.lastPlayed !== 'Never').slice(0, 5), [allGames]);

  // Use shared shell keys; on the wheel screen also bind phosphor (P) + filter letters.
  window.useArcadeKeys({ shell, allSystems, games });
  useEffectO(() => {
    function onKey(e) {
      if (shell.screen !== 'wheel') return;
      const k = e.key;
      if (k === 'p' || k === 'P') { setPhosphor(p => p === 'green' ? 'amber' : p === 'amber' ? 'cyan' : 'green'); e.preventDefault(); }
      else if (['1','2','3','4'].includes(k)) {
        const v = OP_VIEWS.find(v => v.key === k);
        if (v) { setViewMode(v.id); e.preventDefault(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shell.screen]);

  return (
    <div className={`theme-operator phosphor-${phosphor}`} data-screen-label="Operator">
      <div className="op-bezel"></div>
      <div className="op-glow-layer"></div>

      {shell.screen === 'home' && (
        <OpHome shell={shell} totals={totals} recentGames={recentGames} time={time}
          onSelect={(id) => shell.openMenuItem(id, allGames)} />
      )}
      {shell.screen === 'systems' && (
        <OpSystems shell={shell} systems={allSystems} />
      )}
      {shell.screen === 'wheel' && (
        <div className="op-shell">
        {/* Top status bar */}
        <div className="op-topbar">
          <div className="seg"><b>ADV-OP</b><span className="sep">·</span>v0.7-r1</div>
          <div className="seg"><span className="sep">│</span>SYS: <b>{(shell.shortcut?.label || sys.name).toUpperCase()}</b><span className="sep">·</span>{shell.shortcut ? 'curated' : sys.tag}</div>
          <div className="seg"><span className="sep">│</span>ROMS: <b>{games.length}</b>/{allGames.length}</div>
          <div className="seg"><span className="sep">│</span>FILTER: <b>{(OP_FILTERS.find(f=>f.id===filter)||{}).label}</b></div>
          <div className="seg" style={{marginLeft:'auto'}}>UPTIME 04:32:11<span className="sep">·</span>{time}<span className="blink"></span></div>
        </div>

        {/* Filter tabs */}
        <div className="op-filterbar">
          {OP_FILTERS.map(f => (
            <div
              key={f.id}
              className={'op-filter-tab' + (filter === f.id ? ' active' : '')}
              onClick={() => { setFilter(f.id); shell.setGameIndex(0); }}>
              <span className="key">{f.key}</span>
              <span>{f.label}</span>
              {f.id === 'all' && <span className="ct">{allGames.length}</span>}
              {f.id === 'favs' && <span className="ct">{allGames.filter(g=>g.favorite).length}</span>}
            </div>
          ))}
        </div>

        {/* Main two-pane */}
        <div className="op-main">
          {/* Left: ROM list */}
          <div className="op-list-pane">
            <div className="op-pane-head">
              <span>ROM LIST · {filter === 'sys' ? sys.name.toUpperCase() : 'ALL SYSTEMS'}</span>
              <span className="right">Sorted A-Z · {games.length} entries</span>
            </div>
            <div className="op-list-head">
              <span>#</span><span>★</span><span>Title</span><span>Romset · Driver</span><span>Genre</span><span style={{textAlign:'right'}}>Plays</span>
            </div>
            <div className="op-list">
              {games.length === 0 && (
                <div style={{padding:'30px',textAlign:'center',color:'var(--op-warn)',fontSize:22,letterSpacing:'.18em',textTransform:'uppercase'}}>
                  ⚠ Empty result set — relax filter
                </div>
              )}
              {games.map((g, i) => (
                <div
                  key={g.id}
                  className={'op-row' + (i === safeIdx ? ' active' : '')}
                  onClick={() => shell.setGameIndex(i)}>
                  <span className="num">{String(i+1).padStart(3,'0')}</span>
                  <span className="star">{g.favorite ? '★' : ' '}</span>
                  <span className="ttl" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.title}</span>
                  <span className="romset">{g.romset} · {g.driver}</span>
                  <span className="genre">{g.genre}</span>
                  <span className="plays">{g.playCount}</span>
                </div>
              ))}
            </div>
            <div className="op-list-foot">
              <span>showing <b>{games.length}</b> entries</span>
              <span>line <b>{games.length ? safeIdx + 1 : 0}</b> of <b>{games.length}</b></span>
            </div>
          </div>

          {/* Right: marquee + snapshot + technical */}
          <div className="op-right-pane">
            {/* Marquee */}
            <div className="op-marquee-pane">
              {game ? (
                <div className="op-marquee-text">
                  {game.titleParts.map((p,i)=>{
                    if (typeof p === 'string') return <span key={i}>{i>0?' ':''}{p}</span>;
                    if (p.accent) return <span key={i} className="accent">{i>0?' ':''}{p.accent}</span>;
                    if (p.stroke) return <span key={i} className="stroke">{i>0?' ':''}{p.stroke}</span>;
                    return null;
                  })}
                </div>
              ) : (
                <div style={{color:'var(--op-fg-dim)',letterSpacing:'.18em',textTransform:'uppercase'}}>— NO ROM SELECTED —</div>
              )}
            </div>

            {/* Snapshot */}
            <div className="op-snapshot-pane">
              <div className="op-pane-head">
                <span>SNAPSHOT · {game ? (game.hasVideo ? 'VIDEO' : game.hasScreenshot ? 'SCREEN' : 'MISSING') : '—'}</span>
                <span className="right">{game ? `${game.romset}.${game.systemId}` : '—'}</span>
              </div>
              <div className="op-snapshot-screen">
                <div className="op-snapshot-corner">CH 03</div>
                <div className="op-snapshot-corner r">● REC</div>
                <div className="op-snapshot-corner b">320×240 · 4:3</div>
                <div className="op-snapshot-corner br">60.00 Hz</div>
                {game ? (
                  game.hasScreenshot || game.hasVideo ? (
                    <div className="op-snapshot-art">
                      <div className="ttl">{game.title.toUpperCase()}</div>
                      <div className="sub">{game.sub}</div>
                      <div className="copy">© {game.year} {game.manufacturer.toUpperCase()}</div>
                    </div>
                  ) : (
                    <div className="op-snapshot-fallback">
                      <div className="glyph">⚠</div>
                      <div>NO ASSETS</div>
                      <div className="hint">scrape · or copy snap/{game.romset}.png</div>
                    </div>
                  )
                ) : (
                  <div className="op-snapshot-fallback"><div>—</div></div>
                )}
              </div>
            </div>

            {/* Technical */}
            <div className="op-tech-pane">
              <div className="op-pane-head" style={{borderBottom:'1px dashed var(--op-fg-faint)',marginBottom:6,padding:'2px 0'}}>
                <span>TECHNICAL</span>
                <span className="right">{game ? game.driver : '—'}</span>
              </div>
              {game ? (
                <div className="op-tech-grid">
                  <div className="op-tech-row"><span className="k">System</span><span className="v hi">{game.system}</span></div>
                  <div className="op-tech-row"><span className="k">Year</span><span className="v">{game.year}</span></div>
                  <div className="op-tech-row"><span className="k">Maker</span><span className="v">{game.manufacturer}</span></div>
                  <div className="op-tech-row"><span className="k">Genre</span><span className="v">{game.genre}</span></div>
                  <div className="op-tech-row"><span className="k">Players</span><span className="v">{game.players}</span></div>
                  <div className="op-tech-row"><span className="k">Driver</span><span className="v">{game.driver}</span></div>
                  <div className="op-tech-row"><span className="k">Romset</span><span className="v">{game.romset}</span></div>
                  <div className="op-tech-row"><span className="k">Status</span><span className={'v ' + (game.hasVideo ? 'hi' : game.hasScreenshot ? '' : 'warn')}>
                    {game.hasVideo ? 'OK · VIDEO' : game.hasScreenshot ? 'OK · SCREEN' : '⚠ MISSING'}
                  </span></div>
                  <div className="op-tech-row"><span className="k">Plays</span><span className="v hi">{game.playCount}</span></div>
                  <div className="op-tech-row"><span className="k">Last</span><span className="v">{game.lastPlayed}</span></div>
                </div>
              ) : (
                <div style={{padding:20,color:'var(--op-fg-dim)',textAlign:'center'}}>No selection</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: view modes + controls */}
        <div className="op-bottom">
          <div className="op-view-modes">
            {OP_VIEWS.map(v => (
              <div
                key={v.id}
                className={'op-view' + (viewMode === v.id ? ' active' : '')}
                onClick={() => setViewMode(v.id)}>
                <span className="key">{v.key}</span>
                {VIEW_ICONS[v.icon]}
                <span>{v.label}</span>
              </div>
            ))}
          </div>
          <div className="op-controls">
            <div className="op-ctl"><span className="btn">A</span><b>LAUNCH</b><span>start rom</span></div>
            <div className="op-ctl"><span className="btn err">B</span><b>BACK</b><span>parent menu</span></div>
            <div className="op-ctl"><span className="btn warn">Y</span><b>FAV</b><span>toggle pin</span></div>
            <div className="op-ctl"><span className="btn">X</span><b>VIEW</b><span>cycle mode</span></div>
            <div className="op-ctl"><span className="btn">START</span><b>OPTIONS</b><span>operator menu</span></div>
            <div className="spacer"></div>
            <div className="op-phosphor">
              <span>PHOSPHOR</span>
              <span className={'swatch green' + (phosphor==='green'?' active':'')} style={{color:'#66ff8a'}} onClick={() => setPhosphor('green')}></span>
              <span className={'swatch amber' + (phosphor==='amber'?' active':'')} style={{color:'#ffb33b'}} onClick={() => setPhosphor('amber')}></span>
              <span className={'swatch cyan' + (phosphor==='cyan'?' active':'')} style={{color:'#7df0ff'}} onClick={() => setPhosphor('cyan')}></span>
              <span style={{opacity:.5,marginLeft:8}}>[P] cycle</span>
            </div>
          </div>
        </div>
      </div>
      )}
      {shell.screen === 'settings' && <window.SettingsShell shell={shell} />}
      {shell.screen === 'themes'   && <window.ThemeSwitcherPanel shell={shell} activeId="operator" />}

      {/* CRT global FX */}
      <div className="op-rgb"></div>
      <div className="op-scanlines"></div>
      <div className="op-vignette"></div>
      <div className="op-flicker"></div>
    </div>
  );
}

window.OperatorTheme = OperatorTheme;
