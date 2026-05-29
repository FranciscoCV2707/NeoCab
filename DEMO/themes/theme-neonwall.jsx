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

/* ─── HOME (cinematic poster wall — NeonWall signature) ─── */
.nw-home{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;}
.nw-home-hero{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  position:relative;min-height:0;padding-top:30px;
}
.nw-home-eyebrow{
  display:flex;align-items:center;gap:14px;
  font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.42em;color:rgba(255,255,255,.55);text-transform:uppercase;
}
.nw-home-eyebrow .led{width:8px;height:8px;border-radius:50%;background:#5cff8a;box-shadow:0 0 8px #5cff8a;animation:nwPulse 1.6s ease-in-out infinite;}
.nw-home-logo{
  font-family:'Russo One',sans-serif;font-size:160px;line-height:.82;color:var(--nw-bone);text-transform:uppercase;letter-spacing:-.015em;text-align:center;
  text-shadow:0 8px 0 oklch(26% 0.18 var(--nw-h)), 0 16px 40px rgba(0,0,0,.65), 0 0 60px oklch(60% 0.22 var(--nw-h) / .55);
}
.nw-home-logo .accent{color:var(--nw-accent2);text-shadow:0 0 28px var(--nw-accent2), 0 0 80px var(--nw-accent2);}
.nw-home-tagline{font-family:'Space Grotesk',sans-serif;font-style:italic;font-size:20px;color:rgba(255,255,255,.7);max-width:640px;text-align:center;line-height:1.4;}
.nw-home-statline{
  display:flex;align-items:center;gap:0;margin-top:6px;
  border:1px solid oklch(50% 0.16 var(--nw-h) / .4);border-radius:99px;overflow:hidden;
  background:oklch(12% 0.05 var(--nw-h) / .6);backdrop-filter:blur(8px);
}
.nw-home-statline .cell{display:flex;align-items:baseline;gap:8px;padding:10px 22px;border-right:1px solid rgba(255,255,255,.1);}
.nw-home-statline .cell:last-child{border-right:none;}
.nw-home-statline .v{font-family:'Bebas Neue',sans-serif;font-size:26px;color:#fff;letter-spacing:.04em;line-height:1;}
.nw-home-statline .v.hi{color:var(--nw-accent2);text-shadow:0 0 10px var(--nw-accent2);}
.nw-home-statline .k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.28em;color:rgba(255,255,255,.5);text-transform:uppercase;}

/* the poster rail along the bottom */
.nw-home-rail-wrap{flex:none;padding:0 56px;position:relative;z-index:3;}
.nw-home-rail-head{
  display:flex;align-items:center;gap:14px;margin-bottom:14px;
  font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4em;color:rgba(255,255,255,.55);text-transform:uppercase;
}
.nw-home-rail-head .line{flex:1;height:1px;background:linear-gradient(to right, transparent, rgba(255,255,255,.18), transparent);}
.nw-home-rail{display:flex;gap:20px;justify-content:center;align-items:flex-end;padding-bottom:8px;}
.nw-home-poster{
  position:relative;flex:none;width:228px;height:288px;cursor:pointer;
  display:flex;flex-direction:column;overflow:hidden;border-radius:12px;
  background:linear-gradient(165deg, oklch(24% 0.13 var(--p-h, var(--nw-h)) / .92) 0%, oklch(10% 0.06 var(--p-h, var(--nw-h)) / .96) 65%, oklch(6% 0.03 var(--p-h, var(--nw-h))) 100%);
  border:1px solid oklch(50% 0.18 var(--p-h, var(--nw-h)) / .5);
  box-shadow:0 18px 44px rgba(0,0,0,.55);
  transition:transform 360ms cubic-bezier(.18,.9,.22,1.05), box-shadow 360ms ease, border-color 360ms ease, filter 360ms ease;
  filter:saturate(.85) brightness(.82);
}
.nw-home-poster-bg{position:absolute;inset:0;z-index:0;
  background:radial-gradient(70% 55% at 50% 28%, oklch(58% 0.22 var(--p-h, var(--nw-h)) / .6), transparent 72%);}
.nw-home-poster-strip{position:absolute;left:0;right:0;top:0;height:3px;z-index:2;
  background:linear-gradient(to right, transparent, oklch(75% 0.20 var(--p-h, var(--nw-h))), transparent);
  opacity:0;transition:opacity 360ms ease;box-shadow:0 0 14px oklch(70% 0.22 var(--p-h, var(--nw-h)));}
.nw-home-poster-num{position:relative;z-index:1;margin:16px 18px 0;align-self:flex-start;
  font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.3em;color:rgba(255,255,255,.5);}
.nw-home-poster-ic{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;
  font-family:'Major Mono Display',monospace;font-size:72px;color:#fff;
  text-shadow:0 6px 20px rgba(0,0,0,.7), 0 0 30px oklch(65% 0.22 var(--p-h, var(--nw-h)) / .55);}
.nw-home-poster-body{position:relative;z-index:1;padding:14px 20px 20px;text-align:left;
  border-top:1px solid oklch(50% 0.18 var(--p-h, var(--nw-h)) / .35);
  background:linear-gradient(to bottom, transparent, oklch(8% 0.04 var(--p-h, var(--nw-h)) / .7));}
.nw-home-poster-label{font-family:'Russo One',sans-serif;font-size:26px;color:#fff;letter-spacing:.01em;text-transform:uppercase;line-height:1;}
.nw-home-poster-tag{margin-top:5px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.28em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.nw-home-poster.active{
  filter:saturate(1.1) brightness(1.05);
  transform:translateY(-22px) scale(1.045);
  border-color:var(--nw-bone);
  box-shadow:0 32px 70px rgba(0,0,0,.6), 0 0 36px oklch(62% 0.22 var(--p-h) / .75), 0 0 100px oklch(62% 0.22 var(--p-h) / .4), inset 0 0 0 1px rgba(255,255,255,.2);
}
.nw-home-poster.active .nw-home-poster-strip{opacity:1;}
.nw-home-poster.active .nw-home-poster-ic{color:#fff;text-shadow:0 6px 20px rgba(0,0,0,.7), 0 0 40px oklch(72% 0.22 var(--p-h));}

/* ─── SYSTEMS SCREEN (cinematic wall of systems) ─── */
.nw-sys-screen{position:absolute;inset:0;display:flex;flex-direction:column;padding-bottom:60px;}
.nw-sys-head{flex:none;padding:28px 56px 0;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;}
.nw-sys-eyebrow{display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.nw-sys-eyebrow .dot{width:8px;height:8px;background:var(--nw-accent2);border-radius:50%;box-shadow:0 0 8px var(--nw-accent2);}
.nw-sys-title{font-family:'Russo One',sans-serif;font-size:88px;line-height:.9;color:var(--nw-bone);letter-spacing:-.005em;text-transform:uppercase;
  text-shadow:0 6px 0 oklch(28% 0.18 var(--nw-h)), 0 12px 30px rgba(0,0,0,.6), 0 0 40px oklch(60% 0.22 var(--nw-h) / .55);}
.nw-sys-title .accent{color:var(--nw-accent2);text-shadow:0 0 22px var(--nw-accent2);}
.nw-sys-sub{font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.32em;color:rgba(255,255,255,.6);text-transform:uppercase;}

.nw-sys-stage{flex:1;position:relative;display:flex;align-items:center;justify-content:center;perspective:1600px;perspective-origin:50% 60%;overflow:hidden;min-height:0;}
.nw-sys-track{position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:28px;transform-style:preserve-3d;
  transition:transform 500ms cubic-bezier(.18,.85,.22,1.02);will-change:transform;}
.nw-sys-card{
  position:relative;flex:none;width:320px;height:420px;
  display:flex;flex-direction:column;cursor:pointer;
  background:linear-gradient(160deg, oklch(22% 0.12 var(--c-h, var(--nw-h)) / .92) 0%, oklch(10% 0.06 var(--c-h, var(--nw-h)) / .96) 60%, oklch(6% 0.03 var(--c-h, var(--nw-h))) 100%);
  border:1px solid oklch(50% 0.18 var(--c-h, var(--nw-h)) / .55);
  border-radius:14px;overflow:hidden;
  box-shadow:0 22px 50px rgba(0,0,0,.55);
  transition:transform 500ms cubic-bezier(.18,.85,.22,1.02), opacity 500ms ease, box-shadow 500ms ease, border-color 500ms ease, filter 500ms ease;
  will-change:transform,opacity,filter;
}
.nw-sys-card-bg{position:absolute;inset:0;z-index:0;
  background:radial-gradient(70% 55% at 50% 30%, oklch(55% 0.22 var(--c-h, var(--nw-h)) / .6), transparent 70%),
             radial-gradient(50% 40% at 50% 110%, oklch(35% 0.18 var(--c-h2, var(--nw-h2)) / .55), transparent 70%);}
.nw-sys-card-kind{position:relative;z-index:1;margin:18px 20px 0;align-self:flex-start;padding:5px 10px;
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.34em;color:var(--nw-accent2);
  text-shadow:0 0 8px var(--nw-accent2);text-transform:uppercase;
  background:rgba(0,0,0,.5);border:1px solid oklch(60% 0.18 var(--c-h, var(--nw-h)) / .55);border-radius:99px;}
.nw-sys-card-media{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:12px 24px;}
.nw-sys-card-media svg{width:80%;max-width:200px;height:auto;filter:drop-shadow(0 10px 26px rgba(0,0,0,.7)) drop-shadow(0 0 18px oklch(60% 0.22 var(--c-h, var(--nw-h)) / .45));}
.nw-sys-card-body{position:relative;z-index:1;padding:14px 22px 18px;text-align:center;
  border-top:1px solid oklch(50% 0.18 var(--c-h, var(--nw-h)) / .4);
  background:linear-gradient(to bottom, transparent, oklch(8% 0.04 var(--c-h, var(--nw-h)) / .7));}
.nw-sys-card-name{font-family:'Russo One',sans-serif;font-size:24px;color:#fff;letter-spacing:.005em;text-transform:uppercase;line-height:1.05;}
.nw-sys-card-tag{margin-top:5px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.3em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.nw-sys-card-foot{display:flex;align-items:baseline;justify-content:center;gap:8px;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.1);}
.nw-sys-card-count{font-family:'Bebas Neue',sans-serif;font-size:26px;color:oklch(80% 0.18 var(--c-h, var(--nw-h)));letter-spacing:.04em;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 10px oklch(60% 0.22 var(--c-h, var(--nw-h)) / .5);}
.nw-sys-card-count-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.32em;color:rgba(255,255,255,.5);text-transform:uppercase;}

.nw-sys-card.active{
  border-color:var(--nw-bone);
  box-shadow:0 28px 70px rgba(0,0,0,.65), 0 0 36px oklch(60% 0.22 var(--c-h) / .75), 0 0 90px oklch(60% 0.22 var(--c-h) / .4),
    inset 0 0 0 1px rgba(255,255,255,.2);
}

.nw-sys-rail{flex:none;display:flex;justify-content:center;gap:8px;padding:18px 56px 4px;flex-wrap:wrap;}
.nw-sys-pill{
  display:flex;align-items:center;gap:10px;padding:8px 16px;border-radius:99px;cursor:pointer;
  background:rgba(8,6,15,.6);border:1px solid rgba(255,255,255,.1);
  font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.28em;color:rgba(255,255,255,.55);text-transform:uppercase;
  transition:all 200ms ease;
}
.nw-sys-pill .short{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.06em;color:#fff;font-weight:400;}
.nw-sys-pill.active{background:var(--nw-accent);color:#0a0712;border-color:var(--nw-accent);box-shadow:0 0 18px oklch(60% 0.22 var(--nw-h) / .6);}
.nw-sys-pill.active .short{color:#0a0712;}

.nw-sys-floor{position:absolute;left:0;right:0;bottom:0;height:40%;pointer-events:none;z-index:0;
  background:
    repeating-linear-gradient(to right, transparent 0 64px, oklch(70% 0.22 var(--nw-h) / .25) 64px 65px),
    repeating-linear-gradient(to top, transparent 0 48px, oklch(70% 0.22 var(--nw-h) / .18) 48px 49px),
    linear-gradient(to top, oklch(40% 0.22 var(--nw-h) / .12), transparent 80%);
  transform:perspective(700px) rotateX(58deg) translateY(20%);
  transform-origin:bottom center;
  mask-image:linear-gradient(to top, #000 30%, transparent 95%);
  opacity:.5;
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

/* ─── BROWSE: featured + game-wall grid ─── */
.nw-browse{position:relative;z-index:2;flex:1;min-height:0;display:grid;grid-template-columns:540px 1fr;gap:40px;padding:14px 56px 4px;}

/* featured (left) */
.nw-feat2{display:flex;flex-direction:column;gap:16px;min-height:0;min-width:0;}
.nw-feat2 .nw-feat-marquee{flex:none;}
.nw-feat2 .nw-feat-screen--browse{height:248px;flex:none;}
.nw-feat2-info{display:flex;flex-direction:column;gap:10px;min-width:0;}
.nw-feat2-info .nw-feat-logo{font-size:54px;line-height:.92;}
.nw-feat-fav{margin-left:8px;color:var(--nw-accent2);text-shadow:0 0 10px var(--nw-accent2);letter-spacing:.2em;}
.nw-feat2-info .nw-feat-meta{margin-top:2px;}
.nw-feat2-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:100%;text-align:center;}

/* wall (right) */
.nw-wallgrid{display:flex;flex-direction:column;min-height:0;min-width:0;gap:12px;}
.nw-wallgrid-head{flex:none;display:flex;align-items:baseline;justify-content:space-between;
  border-bottom:1px solid oklch(55% 0.16 var(--nw-h) / .4);padding-bottom:8px;}
.nw-wallgrid-head .ttl{font-family:'Russo One',sans-serif;font-size:24px;color:#fff;letter-spacing:.01em;text-transform:uppercase;}
.nw-wallgrid-head .cnt{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.24em;color:rgba(255,255,255,.6);text-transform:uppercase;}
.nw-wallgrid-head .cnt b{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--nw-accent2);letter-spacing:.04em;font-weight:400;
  text-shadow:0 0 10px var(--nw-accent2);}
.nw-wallgrid-view{flex:1;min-height:0;overflow:hidden;position:relative;
  -webkit-mask-image:linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%);
          mask-image:linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%);}
.nw-wallgrid-track{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;grid-auto-rows:150px;
  transition:transform 340ms cubic-bezier(.18,.85,.22,1.02);will-change:transform;padding:6px 4px;}
.nw-gtile{position:relative;border-radius:10px;overflow:hidden;cursor:pointer;
  display:flex;flex-direction:column;justify-content:flex-end;padding:12px;
  background:linear-gradient(160deg, oklch(26% 0.10 var(--g-h, 270) / .9), oklch(9% 0.05 var(--g-h, 270) / .96));
  border:1px solid oklch(45% 0.12 var(--g-h, 270) / .5);
  box-shadow:0 8px 20px rgba(0,0,0,.4);
  transition:transform 220ms cubic-bezier(.18,.9,.22,1.05), border-color 220ms ease, box-shadow 220ms ease;}
.nw-gtile-bg{position:absolute;inset:0;z-index:0;opacity:.8;
  background:radial-gradient(80% 70% at 50% 18%, oklch(55% 0.22 var(--g-h, 270) / .6), transparent 72%),
             radial-gradient(60% 50% at 80% 110%, oklch(40% 0.18 var(--g-h2, 320) / .5), transparent 70%);}
.nw-gtile-scan{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.5;
  background:repeating-linear-gradient(to bottom, rgba(0,0,0,.22) 0 1px, transparent 1px 3px);mix-blend-mode:multiply;}
.nw-gtile-fav{position:absolute;top:8px;right:10px;z-index:2;font-size:14px;color:#ffd166;text-shadow:0 0 8px #ffb000;}
.nw-gtile-title{position:relative;z-index:2;font-family:'Russo One',sans-serif;font-size:17px;line-height:1.05;color:#fff;
  text-transform:uppercase;letter-spacing:.005em;text-shadow:0 2px 8px rgba(0,0,0,.7);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.nw-gtile-foot{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;
  font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.16em;color:rgba(255,255,255,.6);text-transform:uppercase;}
.nw-gtile-foot .pl{color:var(--nw-accent2);}
.nw-gtile.active{border-color:#fff;transform:scale(1.05);z-index:5;
  box-shadow:0 14px 34px rgba(0,0,0,.6), 0 0 26px oklch(65% 0.22 var(--g-h,270) / .8), 0 0 60px oklch(65% 0.22 var(--g-h,270) / .4);}
.nw-gtile.active .nw-gtile-bg{opacity:1;}

/* collection chips (switch with Q/E) */
.nw-collbar{flex:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:10px;}
.nw-collchip{all:unset;display:flex;align-items:center;gap:8px;cursor:pointer;padding:7px 14px;border-radius:99px;
  background:rgba(8,6,15,.6);border:1px solid rgba(255,255,255,.12);transition:all 180ms ease;}
.nw-collchip .ic{font-size:13px;color:oklch(80% 0.16 var(--c-h, 270));}
.nw-collchip .lbl{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;color:rgba(255,255,255,.7);text-transform:uppercase;}
.nw-collchip.active{background:oklch(60% 0.2 var(--c-h,270) / .9);border-color:#fff;box-shadow:0 0 18px oklch(60% 0.22 var(--c-h,270) / .6);}
.nw-collchip.active .ic, .nw-collchip.active .lbl{color:#0a0712;}

/* ════════════════════════════════════════════════════════════════════════
   CINEMATIC WHEEL — CoinOps/HyperSpin style:
   marquee logo (top) · big video preview (center) · title+meta (bottom) ·
   infinite horizontal coverflow carousel to pick games.
   ════════════════════════════════════════════════════════════════════════ */
.nw-cine{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;}

/* center stage: marquee + screen + info, vertically stacked & centered */
.nw-cine-stage{
  flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;padding:6px 56px 0;position:relative;
}

/* ── MARQUEE LIGHTBOX (top game logo) ── */
.nw-cine-marquee{
  position:relative;flex:none;min-width:540px;max-width:980px;height:92px;padding:0 64px;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg, oklch(20% 0.10 var(--nw-h) / .92), oklch(8% 0.05 var(--nw-h) / .85));
  border:1px solid var(--nw-accent);border-radius:7px;overflow:hidden;
  box-shadow:0 0 34px oklch(60% 0.22 var(--nw-h) / .42), inset 0 0 46px oklch(40% 0.18 var(--nw-h) / .28);
  animation:nwCineMarqueeIn 460ms cubic-bezier(.2,.85,.22,1.02) both;
}
@keyframes nwCineMarqueeIn{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}
.nw-cine-marquee .nw-marquee-text{font-size:46px;}
/* light bulbs along top & bottom edges */
.nw-cine-bulbs{position:absolute;left:14px;right:14px;display:flex;justify-content:space-between;z-index:3;pointer-events:none;}
.nw-cine-bulbs.top{top:7px;}
.nw-cine-bulbs.bottom{bottom:7px;}
.nw-cine-bulbs .b{width:5px;height:5px;border-radius:50%;background:var(--nw-accent2);
  box-shadow:0 0 7px var(--nw-accent2);animation:nwBulb 1.4s ease-in-out infinite;}
.nw-cine-bulbs .b:nth-child(odd){animation-delay:.7s;}
@keyframes nwBulb{0%,100%{opacity:1}50%{opacity:.25}}

/* ── CENTER VIDEO PREVIEW SCREEN ── */
.nw-cine-screen{
  position:relative;flex:none;width:800px;height:450px;
  background:#000;border:1px solid var(--nw-accent);border-radius:4px;overflow:hidden;
  box-shadow:0 40px 90px rgba(0,0,0,.7), 0 0 64px oklch(60% 0.22 var(--nw-h) / .42), inset 0 0 0 3px rgba(0,0,0,.55);
}
/* light-load sweep across the screen on game change */
.nw-cine-screen-sweep{position:absolute;inset:0;z-index:5;pointer-events:none;
  background:linear-gradient(105deg, transparent 38%, oklch(92% 0.12 var(--nw-h) / .55) 50%, transparent 62%);
  transform:translateX(-120%);animation:nwScreenSweep 620ms cubic-bezier(.3,.7,.3,1) 60ms both;}
@keyframes nwScreenSweep{to{transform:translateX(120%)}}
.nw-cine-screen .nw-feat-screen-content{animation:nwScreenFade 520ms ease both;}
@keyframes nwScreenFade{from{opacity:0}to{opacity:1}}

/* ── BOTTOM INFO (title repeated + metadata + launch) ── */
.nw-cine-info{
  flex:none;width:800px;display:flex;align-items:flex-end;justify-content:space-between;gap:32px;
  animation:nwScreenFade 480ms ease both;
}
.nw-cine-info-main{display:flex;flex-direction:column;gap:5px;min-width:0;}
.nw-cine-eyebrow{display:flex;align-items:center;gap:12px;
  font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.32em;color:rgba(255,255,255,.6);text-transform:uppercase;}
.nw-cine-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--nw-accent2);box-shadow:0 0 6px var(--nw-accent2);}
.nw-cine-eyebrow .fav{color:var(--nw-accent2);text-shadow:0 0 10px var(--nw-accent2);letter-spacing:.12em;}
.nw-cine-title{font-family:'Russo One',sans-serif;font-size:38px;line-height:1;color:#fff;letter-spacing:.005em;text-transform:uppercase;
  text-shadow:0 2px 0 oklch(28% 0.18 var(--nw-h)), 0 0 26px oklch(60% 0.22 var(--nw-h) / .5);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px;}
.nw-cine-tag{font-family:'Space Grotesk',sans-serif;font-style:italic;font-size:15px;color:rgba(255,255,255,.65);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px;}
.nw-cine-info-side{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex:none;}
.nw-cine-pos{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.28em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.nw-cine-pos b{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--nw-accent2);letter-spacing:.06em;font-weight:400;text-shadow:0 0 10px var(--nw-accent2);}
.nw-cine-info .nw-launch-btn{margin-top:0;}

.nw-cine-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;}

/* ── INFINITE COVERFLOW CAROUSEL ── */
.nw-cv-wrap{position:relative;flex:none;height:218px;margin-top:2px;}
.nw-cv-floor{position:absolute;left:0;right:0;bottom:0;height:90px;pointer-events:none;z-index:0;
  background:
    repeating-linear-gradient(to right, transparent 0 70px, oklch(70% 0.22 var(--nw-h) / .22) 70px 71px),
    linear-gradient(to top, oklch(45% 0.22 var(--nw-h) / .14), transparent 80%);
  transform:perspective(600px) rotateX(62deg);transform-origin:bottom center;
  mask-image:linear-gradient(to top, #000 20%, transparent 92%);opacity:.55;}
.nw-cv{position:absolute;inset:0;perspective:1300px;perspective-origin:50% 42%;z-index:1;}
.nw-cv-track{position:absolute;left:50%;top:46%;transform-style:preserve-3d;}
.nw-cv-tile{
  position:absolute;left:0;top:0;width:152px;height:190px;margin-left:-76px;margin-top:-95px;
  border-radius:11px;overflow:hidden;cursor:pointer;
  display:flex;flex-direction:column;justify-content:flex-end;
  background:linear-gradient(162deg, oklch(26% 0.12 var(--g-h, 270) / .94) 0%, oklch(9% 0.05 var(--g-h, 270) / .97) 62%, oklch(6% 0.03 var(--g-h, 270)) 100%);
  border:1px solid oklch(48% 0.14 var(--g-h, 270) / .5);
  box-shadow:0 16px 36px rgba(0,0,0,.55);
  transition:transform 440ms cubic-bezier(.2,.82,.2,1), opacity 440ms ease, box-shadow 440ms ease, filter 440ms ease, border-color 300ms ease;
  will-change:transform,opacity,filter;
}
.nw-cv-tile-bg{position:absolute;inset:0;z-index:0;
  background:radial-gradient(78% 60% at 50% 22%, oklch(56% 0.22 var(--g-h, 270) / .6), transparent 72%),
             radial-gradient(60% 50% at 78% 112%, oklch(40% 0.18 var(--g-h2, 320) / .5), transparent 70%);}
.nw-cv-tile-scan{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.45;
  background:repeating-linear-gradient(to bottom, rgba(0,0,0,.22) 0 1px, transparent 1px 3px);mix-blend-mode:multiply;}
.nw-cv-tile-ic{position:absolute;top:0;left:0;right:0;bottom:46px;z-index:1;display:flex;align-items:center;justify-content:center;
  font-family:'Major Mono Display',monospace;font-size:64px;color:#fff;
  text-shadow:0 6px 18px rgba(0,0,0,.7), 0 0 26px oklch(64% 0.22 var(--g-h, 270) / .55);}
.nw-cv-tile-fav{position:absolute;top:9px;right:11px;z-index:3;font-size:13px;color:#ffd166;text-shadow:0 0 8px #ffb000;}
.nw-cv-tile-name{position:relative;z-index:2;padding:8px 12px;
  font-family:'Russo One',sans-serif;font-size:13px;line-height:1.05;color:#fff;letter-spacing:.005em;text-transform:uppercase;
  text-shadow:0 2px 6px rgba(0,0,0,.8);
  border-top:1px solid oklch(50% 0.16 var(--g-h, 270) / .4);
  background:linear-gradient(to bottom, transparent, oklch(7% 0.04 var(--g-h, 270) / .85));
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.nw-cv-tile.active{
  border-color:var(--nw-bone);
  box-shadow:0 26px 60px rgba(0,0,0,.65), 0 0 34px oklch(64% 0.22 var(--g-h, 270) / .85), 0 0 90px oklch(64% 0.22 var(--g-h, 270) / .42),
    inset 0 0 0 1px rgba(255,255,255,.22);
}
.nw-cv-tile.active .nw-cv-tile-bg{filter:brightness(1.15) saturate(1.1);}
/* selected-tile pulsing top light */
.nw-cv-tile-strip{position:absolute;left:0;right:0;top:0;height:3px;z-index:3;opacity:0;
  background:linear-gradient(to right, transparent, oklch(80% 0.2 var(--g-h, 270)), transparent);
  box-shadow:0 0 14px oklch(72% 0.22 var(--g-h, 270));transition:opacity 300ms ease;}
.nw-cv-tile.active .nw-cv-tile-strip{opacity:1;}

/* side nav arrows */
.nw-cv-arrow{position:absolute;top:42%;transform:translateY(-50%);z-index:20;
  width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:oklch(14% 0.06 var(--nw-h) / .7);border:1px solid oklch(60% 0.18 var(--nw-h) / .5);
  color:#fff;font-size:20px;cursor:pointer;backdrop-filter:blur(6px);
  box-shadow:0 0 20px oklch(60% 0.22 var(--nw-h) / .35);transition:all 180ms ease;}
.nw-cv-arrow:hover{background:var(--nw-accent);color:#0a0712;border-color:var(--nw-accent);}
.nw-cv-arrow.l{left:24px;}
.nw-cv-arrow.r{right:24px;}
`;

function injectCssNW() {
  if (document.getElementById('theme-neonwall-css')) return;
  const s = document.createElement('style');
  s.id = 'theme-neonwall-css';
  s.textContent = NEONWALL_CSS;
  document.head.appendChild(s);
}

// Collections defined for this theme — flavored buckets. Index 0 is the default
// after picking a system ("All Titles"); subsequent collections cross-cut the system.
const NW_COLLECTIONS = [
  { id: 'all',     label: 'All Titles',       icon: '◉', hue: 270, filter: () => true },
  { id: 'fighting',label: 'Fighting Games',   icon: '✊', hue: 0,   filter: g => g.genre === 'Versus Fighting' },
  { id: 'beat',    label: 'Beat \u2019em Ups',icon: '⚔', hue: 25,  filter: g => g.genre.startsWith('Beat') },
  { id: 'rng',     label: 'Run & Gun',        icon: '◎', hue: 130, filter: g => g.genre === 'Run & Gun' },
  { id: 'platform',label: 'Platformers',      icon: '◆', hue: 210, filter: g => g.genre === 'Platformer' },
  { id: 'favs',    label: 'Favorites',        icon: '★', hue: 320, filter: g => g.favorite },
  { id: 'recent',  label: 'Recently Played',  icon: '↻', hue: 165, filter: g => g.lastPlayed === 'Today' || g.lastPlayed === 'Yesterday' || g.lastPlayed.includes('day') },
];

// ─── Platform shape SVGs (same vocabulary used across themes) ──────────────
function NWShape({ shape, short, hue }) {
  const tint = `oklch(75% 0.18 ${hue})`;
  const tintDim = `oklch(40% 0.16 ${hue})`;
  if (shape === 'cartridge') return (
    <svg viewBox="0 0 200 220">
      <path d="M30 30 L170 30 L170 36 L180 42 L180 200 L20 200 L20 42 L30 36 Z" fill={tintDim} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
      <rect x="60" y="20" width="80" height="14" fill="#08060f"/>
      <rect x="40" y="74" width="120" height="92" fill={tint} opacity=".95"/>
      <text x="100" y="124" textAnchor="middle" fill="#08060f" fontFamily="Russo One" fontSize="26" letterSpacing="1">{short}</text>
      <rect x="42" y="186" width="116" height="8" fill="#08060f"/>
    </svg>
  );
  if (shape === 'disc' || shape === 'gd-rom') return (
    <svg viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`nw-disc-${hue}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity=".05"/>
          <stop offset=".55" stopColor={tint} stopOpacity=".55"/>
          <stop offset=".85" stopColor={tintDim} stopOpacity="1"/>
          <stop offset="1" stopColor="#020410" stopOpacity="1"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#nw-disc-${hue})`} stroke="rgba(255,255,255,.18)"/>
      {Array.from({length:7}).map((_,i)=>(<circle key={i} cx="100" cy="100" r={86-i*7} fill="none" stroke="rgba(255,255,255,.05)"/>))}
      <circle cx="100" cy="100" r="34" fill={tint}/>
      <text x="100" y="106" textAnchor="middle" fill="#08060f" fontFamily="Russo One" fontSize="16" letterSpacing="1">{short}</text>
      <circle cx="100" cy="100" r="11" fill="#08060f"/>
    </svg>
  );
  if (shape === 'chip') return (
    <svg viewBox="0 0 200 200">
      <rect x="22" y="36" width="156" height="128" fill={tintDim} stroke="rgba(255,255,255,.18)"/>
      <rect x="50" y="64" width="100" height="60" fill="#08060f" stroke="rgba(255,255,255,.2)"/>
      {Array.from({length:10}).map((_,i)=>(
        <g key={i}><rect x={56+i*9.5} y="56" width="5" height="8" fill={tint} opacity=".7"/><rect x={56+i*9.5} y="124" width="5" height="8" fill={tint} opacity=".7"/></g>
      ))}
      <text x="100" y="102" textAnchor="middle" fill={tint} fontFamily="Russo One" fontSize="20" letterSpacing="1">{short}</text>
      <rect x="22" y="158" width="156" height="8" fill="#08060f"/>
    </svg>
  );
  return null;
}

// ─── Systems screen ───────────────────────────────────────────────────────
function NWSystems({ shell, systems, totals }) {
  const sys = systems[shell.sysIndex];
  const STRIDE = 348; // 320 width + 28 gap
  const translateX = `calc(-${shell.sysIndex * STRIDE}px - ${STRIDE/2}px)`;
  return (
    <div className="nw-sys-screen" data-screen-label="NeonWall · Systems">
      <div className="nw-sys-head">
        <div className="nw-sys-eyebrow"><span className="dot"></span><span>Select a System · {String(shell.sysIndex+1).padStart(2,'0')} / {String(systems.length).padStart(2,'0')}</span></div>
        <div className="nw-sys-title">{sys.name.split(' ').map((w,i,arr) => (
          <React.Fragment key={i}>
            {i === arr.length - 1 && arr.length > 1 ? <span className="accent">{w}</span> : w}
            {i < arr.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}</div>
        <div className="nw-sys-sub">{sys.tag} · {sys.count.toLocaleString()} titles · since {sys.year}</div>
      </div>

      <div className="nw-sys-stage">
        <div className="nw-sys-floor"></div>
        <div className="nw-sys-track" style={{ transform:`translate(${translateX}, -50%)` }}>
          {systems.map((s, i) => {
            const d = i - shell.sysIndex;
            const abs = Math.abs(d);
            const scale = abs === 0 ? 1 : abs === 1 ? .82 : abs === 2 ? .62 : .46;
            const rotY = d * -16;
            const opacity = abs === 0 ? 1 : abs === 1 ? .85 : abs === 2 ? .45 : .15;
            const blur = abs === 0 ? 0 : abs === 1 ? .4 : abs === 2 ? 1.4 : 2.6;
            return (
              <div
                key={s.id}
                className={'nw-sys-card' + (d === 0 ? ' active' : '')}
                style={{
                  transform:`scale(${scale}) rotateY(${rotY}deg)`,
                  opacity, filter:`blur(${blur}px)`, zIndex: 100 - abs,
                  '--c-h': s.hue, '--c-h2': s.hue2,
                }}
                onClick={() => d === 0 ? shell.enterSystem(i) : shell.setSysIndex(i)}>
                <div className="nw-sys-card-bg"></div>
                <div className="nw-sys-card-kind">■ PLATFORM</div>
                <div className="nw-sys-card-media"><NWShape shape={s.shape} short={s.short} hue={s.hue}/></div>
                <div className="nw-sys-card-body">
                  <div className="nw-sys-card-name">{s.name}</div>
                  <div className="nw-sys-card-tag">{s.tag}</div>
                  <div className="nw-sys-card-foot">
                    <span className="nw-sys-card-count">{s.count.toLocaleString()}</span>
                    <span className="nw-sys-card-count-k">TITLES</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nw-sys-rail">
        {systems.map((s, i) => (
          <div key={s.id}
            className={'nw-sys-pill' + (i === shell.sysIndex ? ' active' : '')}
            onClick={() => shell.setSysIndex(i)}>
            <span className="short">{s.short}</span>
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      <div className="nw-controls" style={{position:'absolute',left:0,right:0,bottom:0}}>
        <div className="ctl"><span className="kk g">A</span><b>Enter</b></div>
        <div className="ctl"><span className="kk r">B</span><b>Back</b></div>
        <div className="spacer"></div>
        <div className="ctl" style={{opacity:.6}}><span>← → systems</span></div>
        <div className="ctl" style={{opacity:.6}}><span>ENTER · open library</span></div>
      </div>
    </div>
  );
}

// Per-menu-item hue so each home poster reads as a distinct cinematic panel.
const NW_MENU_HUES = { play: 270, favs: 320, recent: 165, shuffle: 50, settings: 210 };

// ─── Home (cinematic poster wall) ─────────────────────────────────────────
function NWHome({ shell, totals, time, onAction }) {
  return (
    <div className="nw-home" data-screen-label="NeonWall · Home">
      {/* top brand bar (shared with wheel) */}
      <div className="nw-top">
        <div className="nw-brand">
          <div className="nw-brand-mark">N</div>
          <div>
            <div className="nw-brand-name">NEOCAB</div>
            <div className="nw-brand-sub">Neon Wall · Cinema Mode</div>
          </div>
        </div>
        <div className="nw-time">
          <span className="led"></span><span>LIVE</span><span style={{opacity:.5}}>·</span><b>{time}</b>
        </div>
      </div>

      {/* centered hero marquee */}
      <div className="nw-home-hero">
        <div className="nw-home-eyebrow"><span className="led"></span><span>SYSTEM ONLINE · CABINET READY · FREEPLAY ON</span></div>
        <div className="nw-home-logo">NEO<span className="accent">CAB</span></div>
        <div className="nw-home-tagline">A wall of light for the big cabinet. Step up, pick a system, and let the marquee do the talking.</div>
        <div className="nw-home-statline">
          <div className="cell"><span className="v">{totals.titles.toLocaleString()}</span><span className="k">Titles</span></div>
          <div className="cell"><span className="v">{totals.systems}</span><span className="k">Systems</span></div>
          <div className="cell"><span className="v hi">{totals.favorites}</span><span className="k">Favorites</span></div>
          <div className="cell"><span className="v">TODAY</span><span className="k">Last Session</span></div>
        </div>
      </div>

      {/* poster rail */}
      <div className="nw-home-rail-wrap">
        <div className="nw-home-rail-head"><span>MAIN MENU</span><div className="line"></div><span>← → SELECT · ENTER OPEN</span></div>
        <div className="nw-home-rail">
          {window.ARCADE_MENU.map((it, i) => (
            <div key={it.id}
                 className={'nw-home-poster' + (i === shell.menuIndex ? ' active' : '')}
                 style={{'--p-h': NW_MENU_HUES[it.id] || 270}}
                 onClick={() => { shell.setMenuIndex(i); onAction(it.id); }}>
              <div className="nw-home-poster-bg"></div>
              <div className="nw-home-poster-strip"></div>
              <div className="nw-home-poster-num">{String(i+1).padStart(2,'0')} / {String(window.ARCADE_MENU.length).padStart(2,'0')}</div>
              <div className="nw-home-poster-ic">{it.icon}</div>
              <div className="nw-home-poster-body">
                <div className="nw-home-poster-label">{it.label}</div>
                <div className="nw-home-poster-tag">{it.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nw-controls">
        <div className="ctl"><span className="kk g">A</span><b>Select</b></div>
        <div className="ctl"><span className="kk r">B</span><b>Exit</b></div>
        <div className="spacer"></div>
        <div className="ctl" style={{opacity:.6}}><span>← → menu</span></div>
      </div>
    </div>
  );
}

function useClockNW() {
  const [t, setT] = useStateNW(() => new Date());
  useEffectNW(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
}

// Render a game's typographic logo from its titleParts.
function NWTitle({ game }) {
  return game.titleParts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{i>0?' ':''}{p}</span>;
    if (p.accent) return <span key={i} className="accent">{i>0?' ':''}{p.accent}</span>;
    if (p.stroke) return <span key={i} className="stroke">{i>0?' ':''}{p.stroke}</span>;
    return null;
  });
}

function NeonWallTheme({ onChangeTheme }) {
  useEffectNW(() => { injectCssNW(); }, []);
  const allGames = window.PACK_GAMES;
  const allSystems = window.PACK_SYSTEMS;

  const shell = window.useArcadeShell({ onChangeTheme, defaultSystem: 0 });
  const [collIndex, setCollIndex] = useStateNW(0);

  const coll = NW_COLLECTIONS[collIndex];
  const sys = allSystems[shell.sysIndex];
  // Full per-system library (real heroes + generated filler) so the wall is dense.
  const library = useMemoNW(
    () => (shell.shortcut ? shell.shortcut.games : window.buildSystemLibrary(sys, 120)),
    [sys, shell.shortcut]
  );
  const games = useMemoNW(
    () => (shell.shortcut ? library : library.filter(coll.filter)),
    [library, coll, shell.shortcut]
  );
  const safeIdx = Math.min(shell.gameIndex, Math.max(0, games.length - 1));
  const game = games[safeIdx];

  // Infinite coverflow carousel — render a window of tiles around the selection,
  // wrapping with modulo so the rail never ends.
  const CV_RADIUS = 6;
  const cvLen = games.length;
  const wrapIdx = (n) => cvLen ? ((n % cvLen) + cvLen) % cvLen : 0;
  const cvTiles = [];
  for (let d = -CV_RADIUS; d <= CV_RADIUS; d++) {
    const p = safeIdx + d;
    cvTiles.push({ p, d, g: cvLen ? games[wrapIdx(p)] : null });
  }
  function cvTransform(d) {
    const sign = Math.sign(d), abs = Math.abs(d);
    const x = d === 0 ? 0 : sign * (150 + (abs - 1) * 92);
    const rotY = d === 0 ? 0 : -sign * 46;
    const scale = d === 0 ? 1.18 : Math.max(0.5, 0.9 - (abs - 1) * 0.1);
    const z = d === 0 ? 130 : -abs * 55;
    return `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
  }

  useEffectNW(() => {
    const root = document.querySelector('.theme-neonwall');
    if (!root || !game) return;
    root.style.setProperty('--nw-h', game.hue);
    root.style.setProperty('--nw-h2', game.hue2);
  }, [game]);

  // shared keys: home and 'systems' use the standard arcade flow; on 'wheel' we
  // override up/down to navigate collections instead of system list.
  useEffectNW(() => {
    function onKey(e) {
      const k = e.key;
      const screen = shell.screen;
      if (screen === 'home') {
        if (k === 'ArrowDown' || k === 'j' || k === 's' || k === 'ArrowRight' || k === 'l' || k === 'd') { shell.setMenuIndex(i => (i+1) % window.ARCADE_MENU.length); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w' || k === 'ArrowLeft' || k === 'h' || k === 'a') { shell.setMenuIndex(i => (i-1+window.ARCADE_MENU.length) % window.ARCADE_MENU.length); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') {
          shell.openMenuItem(window.ARCADE_MENU[shell.menuIndex].id, allGames);
          e.preventDefault();
        }
      } else if (screen === 'systems') {
        if (k === 'ArrowRight' || k === 'l' || k === 'd') { shell.setSysIndex(i => Math.min(allSystems.length-1, i+1)); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h' || k === 'a') { shell.setSysIndex(i => Math.max(0, i-1)); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { setCollIndex(0); shell.enterSystem(); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { shell.goBack(); e.preventDefault(); }
      } else if (screen === 'wheel') {
        if (!games.length) {
          if (k === 'Escape' || k === 'b' || k === 'B') { shell.goBack(); e.preventDefault(); }
        }
        else if (k === 'ArrowRight' || k === 'l' || k === 'd') { shell.setGameIndex(i => (i+1) % games.length); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h' || k === 'a') { shell.setGameIndex(i => (i-1+games.length) % games.length); e.preventDefault(); }
        else if (k === 'PageDown') { shell.setGameIndex(i => (i+10) % games.length); e.preventDefault(); }
        else if (k === 'PageUp')   { shell.setGameIndex(i => (i-10+games.length) % games.length); e.preventDefault(); }
        else if (k === 'e' || k === 'E' || k === ']' || k === 'ArrowDown' || k === 'j') { setCollIndex(i => (i+1) % NW_COLLECTIONS.length); shell.setGameIndex(0); e.preventDefault(); }
        else if (k === 'q' || k === 'Q' || k === '[' || k === 'ArrowUp' || k === 'k') { setCollIndex(i => (i-1+NW_COLLECTIONS.length) % NW_COLLECTIONS.length); shell.setGameIndex(0); e.preventDefault(); }
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
  }, [shell, games, allGames, allSystems]);

  const time = useClockNW();

  const totals = {
    systems: allSystems.length,
    titles: allSystems.reduce((n, s) => n + s.count, 0),
    favorites: allGames.filter(g => g.favorite).length,
  };

  return (
    <div className="theme-neonwall" data-screen-label="CoinOps Neon Wall">
      <div className="nw-bg">
        <div className="nw-bg-rays"></div>
        <div className="nw-bg-tex"></div>
      </div>

      {shell.screen === 'home' && (
        <NWHome shell={shell} totals={totals} time={time}
                onAction={(id) => shell.openMenuItem(id, allGames)} />
      )}
      {shell.screen === 'systems' && <NWSystems shell={shell} systems={allSystems} totals={totals}/>}
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
          <div className="nw-collection-name">{shell.shortcut?.label || `${sys.name.toUpperCase()} · ${coll.label}`}</div>
          <div className="nw-time">
            <span className="led"></span>
            <span>LIVE</span>
            <span style={{opacity:.5}}>·</span>
            <b>{time}</b>
          </div>
        </div>

        {/* CINEMATIC STAGE — marquee logo · center video · title+meta — and infinite coverflow */}
        <div className="nw-cine">
          <div className="nw-cine-stage">
            {game ? (
              <React.Fragment key={game.id}>
                {/* MARQUEE LIGHTBOX */}
                <div className="nw-cine-marquee">
                  <div className="nw-cine-bulbs top">{Array.from({length:20}).map((_,i)=><span key={i} className="b"></span>)}</div>
                  <div className="nw-marquee-text"><NWTitle game={game}/></div>
                  <div className="nw-cine-bulbs bottom">{Array.from({length:20}).map((_,i)=><span key={i} className="b"></span>)}</div>
                </div>

                {/* CENTER VIDEO PREVIEW */}
                <div className="nw-cine-screen">
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
                      <div className="nw-feat-screen-scan"></div>
                      <div className="nw-cine-screen-sweep"></div>
                    </>
                  ) : (
                    <>
                      <div className="nw-feat-screen-fallback">
                        <div className="glyph">◇</div>
                        <div className="ttl">NO MEDIA</div>
                        <div className="sub">video · screenshot missing</div>
                        <div className="sub" style={{color:'var(--nw-accent2)'}}>↳ press [Y] to scrape</div>
                      </div>
                      <div className="nw-feat-screen-scan"></div>
                      <div className="nw-cine-screen-sweep"></div>
                    </>
                  )}
                </div>

                {/* BOTTOM TITLE + META + LAUNCH */}
                <div className="nw-cine-info">
                  <div className="nw-cine-info-main">
                    <div className="nw-cine-eyebrow">
                      <span className="dot"></span>
                      <span>{game.system} · {game.genre} · {game.year}</span>
                      {game.favorite && <span className="fav">★ FAV</span>}
                    </div>
                    <div className="nw-cine-title">{game.title}</div>
                    <div className="nw-cine-tag">"{game.tagline}"</div>
                  </div>
                  <div className="nw-cine-info-side">
                    <div className="nw-cine-pos"><b>{String(safeIdx+1).padStart(3,'0')}</b> / {String(games.length).padStart(3,'0')}</div>
                    <div className="nw-launch-btn"><span className="kbd">A</span><span>Launch Game</span></div>
                  </div>
                </div>
              </React.Fragment>
            ) : (
              <div className="nw-cine-empty">
                <div className="nw-feat-eyebrow"><span className="dot"></span><span>EMPTY COLLECTION</span></div>
                <div className="nw-feat-logo">NO TITLES</div>
                <div className="nw-feat-sub">{coll.label.toUpperCase()} · 0 games</div>
              </div>
            )}
          </div>

          {/* COLLECTION CHIPS */}
          <div className="nw-collbar" style={{justifyContent:'center'}}>
            {NW_COLLECTIONS.map((c, i) => (
              <button key={c.id}
                      className={'nw-collchip' + (i === collIndex ? ' active' : '')}
                      style={{'--c-h': c.hue}}
                      onClick={() => { setCollIndex(i); shell.setGameIndex(0); }}>
                <span className="ic">{c.icon}</span><span className="lbl">{c.label}</span>
              </button>
            ))}
          </div>

          {/* INFINITE COVERFLOW CAROUSEL */}
          <div className="nw-cv-wrap">
            <div className="nw-cv-floor"></div>
            <div className="nw-cv-arrow l" onClick={() => cvLen && shell.setGameIndex(i => (i-1+cvLen) % cvLen)}>‹</div>
            <div className="nw-cv-arrow r" onClick={() => cvLen && shell.setGameIndex(i => (i+1) % cvLen)}>›</div>
            <div className="nw-cv">
              <div className="nw-cv-track">
                {cvTiles.map(t => t.g && (
                  <div key={t.p}
                       className={'nw-cv-tile' + (t.d === 0 ? ' active' : '')}
                       style={{
                         transform: cvTransform(t.d),
                         opacity: t.d === 0 ? 1 : Math.max(0.12, 0.82 - (Math.abs(t.d)-1) * 0.15),
                         filter: Math.abs(t.d) >= 4 ? `blur(${(Math.abs(t.d)-3) * 0.9}px)` : 'none',
                         zIndex: 100 - Math.abs(t.d),
                         '--g-h': t.g.hue, '--g-h2': t.g.hue2,
                       }}
                       onClick={() => shell.setGameIndex(wrapIdx(t.p))}>
                    <div className="nw-cv-tile-bg"></div>
                    <div className="nw-cv-tile-scan"></div>
                    <div className="nw-cv-tile-strip"></div>
                    {t.g.favorite && <span className="nw-cv-tile-fav">★</span>}
                    <div className="nw-cv-tile-ic">{t.g.title.charAt(0)}</div>
                    <div className="nw-cv-tile-name">{t.g.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="nw-controls">
          <div className="ctl"><span className="kk g">A</span><b>Launch</b></div>
          <div className="ctl"><span className="kk r">B</span><b>Back</b></div>
          <div className="ctl"><span className="kk y">Y</span><b>Favorite</b></div>
          <div className="spacer"></div>
          <div className="ctl" style={{opacity:.6}}><span>← → browse games</span></div>
          <div className="ctl" style={{opacity:.6}}><span>Q / E · ↑ ↓ collections</span></div>
        </div>
      </div>
      )}
    </div>
  );
}

window.NeonWallTheme = NeonWallTheme;
