// hyperwheel-screens.jsx — Home (Main Menu) and System Picker screens for NeoCab HyperWheel
const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS, useRef: useRefS } = React;

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM MEDIA SHAPES — placeholder artwork rendered per platform
// ═══════════════════════════════════════════════════════════════════════════
function MediaShape({ shape, short, hue, big }) {
  // Common stroke / fill driven by hue
  const tint = `oklch(70% 0.20 ${hue})`;
  const tintDim = `oklch(38% 0.16 ${hue})`;

  switch (shape) {
    case 'cartridge':
      return (
        <svg className="ms" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`cg-${hue}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={tint} stopOpacity=".9"/>
              <stop offset="1" stopColor={tintDim} stopOpacity="1"/>
            </linearGradient>
          </defs>
          {/* cartridge body */}
          <path d="M30 30 L170 30 L170 36 L180 42 L180 200 L20 200 L20 42 L30 36 Z" fill={`url(#cg-${hue})`} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
          {/* top notch */}
          <rect x="60" y="20" width="80" height="14" fill="#08060f" stroke="rgba(255,255,255,.12)"/>
          {/* sticker label */}
          <rect x="40" y="74" width="120" height="92" fill="#fff3d4" opacity=".92"/>
          <rect x="44" y="78" width="112" height="20" fill="#08060f" opacity=".8"/>
          <text x="100" y="92" textAnchor="middle" fill="#fff3d4" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="3">{short}</text>
          <text x="100" y="138" textAnchor="middle" fill="#08060f" fontFamily="Russo One, sans-serif" fontSize="22" letterSpacing="1">CART</text>
          <text x="100" y="158" textAnchor="middle" fill="#08060f" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="2" opacity=".55">PCB · ROM-MASK</text>
          {/* contact slot */}
          <rect x="42" y="186" width="116" height="8" fill="#08060f"/>
          <g opacity=".5">
            {Array.from({length:20}).map((_,i)=>(
              <rect key={i} x={48+i*5.5} y="188" width="2" height="4" fill={tint}/>
            ))}
          </g>
        </svg>
      );
    case 'disc':
    case 'minidisc':
    case 'gd-rom':
      {
        const R = shape === 'minidisc' ? 80 : 92;
        const subLabel = shape === 'gd-rom' ? 'GD-ROM' : shape === 'minidisc' ? 'MINI-DVD' : 'CD-ROM';
        return (
          <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id={`dg-${hue}-${shape}`} cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#fff" stopOpacity=".05"/>
                <stop offset=".55" stopColor={tint} stopOpacity=".5"/>
                <stop offset=".75" stopColor={tintDim} stopOpacity=".95"/>
                <stop offset=".9" stopColor="#0a0810" stopOpacity="1"/>
              </radialGradient>
              <linearGradient id={`sheen-${hue}-${shape}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".22"/>
                <stop offset=".35" stopColor="#fff" stopOpacity="0"/>
                <stop offset=".6" stopColor={tint} stopOpacity=".22"/>
                <stop offset="1" stopColor="#fff" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={R} fill={`url(#dg-${hue}-${shape})`} stroke="rgba(255,255,255,.18)"/>
            <circle cx="100" cy="100" r={R} fill={`url(#sheen-${hue}-${shape})`}/>
            {/* concentric tracks */}
            {Array.from({length:6}).map((_,i)=>(
              <circle key={i} cx="100" cy="100" r={R - 8 - i*6} fill="none" stroke="rgba(255,255,255,.06)"/>
            ))}
            {/* center label */}
            <circle cx="100" cy="100" r="36" fill="#fff3d4"/>
            <text x="100" y="96" textAnchor="middle" fill="#08060f" fontFamily="Russo One, sans-serif" fontSize="18" letterSpacing="1">{short}</text>
            <text x="100" y="112" textAnchor="middle" fill="#08060f" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="2" opacity=".7">{subLabel}</text>
            {/* hub */}
            <circle cx="100" cy="100" r="12" fill="#08060f"/>
            <circle cx="100" cy="100" r="6" fill="#1a1626" stroke={tint} strokeWidth=".5"/>
          </svg>
        );
      }
    case 'umd':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`ug-${hue}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor={tint} stopOpacity=".75"/>
              <stop offset="1" stopColor={tintDim} stopOpacity=".95"/>
            </linearGradient>
          </defs>
          {/* shell */}
          <rect x="32" y="40" width="136" height="124" rx="14" fill={`url(#ug-${hue})`} stroke="rgba(255,255,255,.18)"/>
          {/* disc window */}
          <circle cx="100" cy="108" r="44" fill="#08060f" stroke="rgba(255,255,255,.18)"/>
          <circle cx="100" cy="108" r="42" fill="#1a1626"/>
          {Array.from({length:5}).map((_,i)=>(
            <circle key={i} cx="100" cy="108" r={40-i*6} fill="none" stroke={tint} strokeOpacity=".15"/>
          ))}
          <circle cx="100" cy="108" r="6" fill={tint}/>
          {/* label strip */}
          <rect x="40" y="48" width="120" height="22" fill="#fff3d4"/>
          <text x="100" y="63" textAnchor="middle" fill="#08060f" fontFamily="Russo One, sans-serif" fontSize="13" letterSpacing="3">{short} · UMD</text>
        </svg>
      );
    case 'chip':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`pg-${hue}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={tintDim} stopOpacity=".9"/>
              <stop offset="1" stopColor="#08060f" stopOpacity=".95"/>
            </linearGradient>
          </defs>
          {/* PCB */}
          <rect x="22" y="36" width="156" height="128" fill={`url(#pg-${hue})`} stroke="rgba(255,255,255,.16)"/>
          {/* solder dots grid */}
          {Array.from({length:6}).map((_,r)=>(
            Array.from({length:8}).map((_,c)=>(
              <circle key={`${r}-${c}`} cx={32+c*18} cy={48+r*18} r="1" fill={tint} opacity=".35"/>
            ))
          ))}
          {/* IC chip */}
          <rect x="56" y="74" width="88" height="52" fill="#08060f" stroke="rgba(255,255,255,.2)"/>
          {/* IC pins */}
          {Array.from({length:10}).map((_,i)=>(
            <g key={i}>
              <rect x={58+i*8.5} y="68" width="5" height="6" fill={tint} opacity=".7"/>
              <rect x={58+i*8.5} y="126" width="5" height="6" fill={tint} opacity=".7"/>
            </g>
          ))}
          <text x="100" y="98" textAnchor="middle" fill={tint} fontFamily="Russo One, sans-serif" fontSize="16" letterSpacing="2">{short}</text>
          <text x="100" y="114" textAnchor="middle" fill="#fff3d4" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="3" opacity=".7">CP-SYSTEM · PCB</text>
          {/* dot1 indicator */}
          <circle cx="64" cy="80" r="2" fill={tint}/>
          {/* edge connector */}
          <rect x="22" y="158" width="156" height="8" fill="#08060f"/>
          {Array.from({length:24}).map((_,i)=>(
            <rect key={i} x={28+i*6.4} y="160" width="2.5" height="4" fill={tint} opacity=".7"/>
          ))}
        </svg>
      );
    case 'star':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`stg-${hue}`} cx="50%" cy="50%" r="60%">
              <stop offset="0" stopColor="#fff" stopOpacity=".25"/>
              <stop offset="1" stopColor={tint} stopOpacity="1"/>
            </radialGradient>
          </defs>
          <polygon points="100,18 124,76 188,76 136,114 156,176 100,138 44,176 64,114 12,76 76,76"
                   fill={`url(#stg-${hue})`} stroke={tint} strokeWidth="1.5"/>
          <polygon points="100,52 114,90 154,90 122,114 134,156 100,130 66,156 78,114 46,90 86,90"
                   fill="none" stroke={tint} strokeOpacity=".4"/>
        </svg>
      );
    case 'clock':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="#08060f" stroke={tint} strokeWidth="3"/>
          {Array.from({length:12}).map((_,i)=>{
            const a = (i*30 - 90) * Math.PI/180;
            return <line key={i}
              x1={100+Math.cos(a)*70} y1={100+Math.sin(a)*70}
              x2={100+Math.cos(a)*78} y2={100+Math.sin(a)*78}
              stroke={tint} strokeWidth={i%3===0?3:1}/>;
          })}
          <line x1="100" y1="100" x2="100" y2="50" stroke="#fff3d4" strokeWidth="3"/>
          <line x1="100" y1="100" x2="140" y2="100" stroke={tint} strokeWidth="2"/>
          <circle cx="100" cy="100" r="4" fill={tint}/>
        </svg>
      );
    case 'shuffle':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke={tint} strokeWidth="6" strokeLinecap="round">
            <path d="M30 70 Q100 70 100 130 T170 130"/>
            <path d="M30 130 Q100 130 100 70 T170 70"/>
          </g>
          <polygon points="170,70 152,60 152,80" fill={tint}/>
          <polygon points="170,130 152,120 152,140" fill={tint}/>
        </svg>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME / MAIN MENU
// ═══════════════════════════════════════════════════════════════════════════
const MENU_ITEMS = [
  { id: 'play',     label: 'Play',       tag: 'select a system', icon: '▶'  },
  { id: 'favs',     label: 'Favorites',  tag: 'pinned titles',   icon: '★'  },
  { id: 'recent',   label: 'Recent',     tag: 'continue session',icon: '↻'  },
  { id: 'shuffle',  label: 'Shuffle',    tag: 'surprise me',     icon: '?'  },
  { id: 'settings', label: 'Settings',   tag: 'cabinet & theme', icon: '⚙'  },
];

function HomeScreen({ menuIndex, onSelect, totals }) {
  return (
    <div className="home" data-screen-label="Home · Main Menu">
      <div className="home-left">
        <div className="home-eyebrow">
          <span className="dot"></span>
          <span>SYSTEM ONLINE · CRT WARM · BUILD 0.7</span>
        </div>
        <div className="home-mark">
          <div className="home-mark-line one">NEO</div>
          <div className="home-mark-line two">CAB</div>
          <div className="home-mark-sub">HYPER<span className="amber">WHEEL</span> · ARCADE FRONTEND</div>
        </div>
        <div className="home-stats">
          <div className="home-stat">
            <div className="k">Total titles</div>
            <div className="v tab">{totals.titles.toLocaleString()}</div>
          </div>
          <div className="home-stat">
            <div className="k">Systems</div>
            <div className="v tab">{totals.systems}</div>
          </div>
          <div className="home-stat">
            <div className="k">Favorites</div>
            <div className="v tab">{totals.favorites}</div>
          </div>
          <div className="home-stat">
            <div className="k">Last session</div>
            <div className="v">TODAY 21:14</div>
          </div>
        </div>
        <div className="home-ticker">
          <span className="ttl">NOW SHOWING</span>
          <div className="home-ticker-track">
            <div className="home-ticker-track-inner">
              {[1,2].map(rep => (
                <React.Fragment key={rep}>
                  <span>STEEL RECON</span><span className="pip">◆</span>
                  <span>CHRONOTREK</span><span className="pip">◆</span>
                  <span>WOLVES OF GAROU</span><span className="pip">◆</span>
                  <span>METAL STEALTH</span><span className="pip">◆</span>
                  <span>SMASH ROYAL</span><span className="pip">◆</span>
                  <span>FROSTBROS</span><span className="pip">◆</span>
                  <span>FIGHTERS GLORY 98</span><span className="pip">◆</span>
                  <span>PIXEL PLUMBERS</span><span className="pip">◆</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="home-right">
        <div className="home-menu-head">
          <span className="line"></span>
          <span className="lbl">MAIN MENU</span>
          <span className="line"></span>
        </div>
        <div className="home-menu">
          {MENU_ITEMS.map((it, i) => (
            <button
              key={it.id}
              className={'menu-item' + (i === menuIndex ? ' active' : '')}
              onClick={() => onSelect(it.id, i)}
              tabIndex={-1}>
              <span className="mi-num">{String(i+1).padStart(2,'0')}</span>
              <span className="mi-icon">{it.icon}</span>
              <span className="mi-body">
                <span className="mi-label">{it.label}</span>
                <span className="mi-tag">{it.tag}</span>
              </span>
              {i === menuIndex && <span className="mi-arrow">▶</span>}
            </button>
          ))}
        </div>
        <div className="home-credits-strip">
          INSERT COIN · CREDITS <b>99</b> · FREE PLAY MODE
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PICKER — horizontal carousel
// ═══════════════════════════════════════════════════════════════════════════
function SystemPicker({ systems, index, onPick }) {
  const sys = systems[index];

  // visible cards: [-3, -2, -1, 0, +1, +2, +3]
  const visible = [-3, -2, -1, 0, 1, 2, 3].map(d => {
    const i = ((index + d) % systems.length + systems.length) % systems.length;
    return { sys: systems[i], i, d };
  });

  // small bottom rail showing the full list, scrolled to current
  const railRef = useRefS(null);
  useEffectS(() => {
    const el = railRef.current?.querySelector('.rail-item.active');
    if (el) el.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
  }, [index]);

  return (
    <div className="sysp" data-screen-label="Systems · Select Library">
      <div className="sysp-head">
        <div className="sysp-eyebrow">
          <span className="sq"></span>
          <span>SELECT SYSTEM</span>
          <span className="dim">·</span>
          <span className="dim">{systems.length} LIBRARIES</span>
        </div>
        <div className="sysp-title-wrap">
          <div className="sysp-system-kind">{sys.kind.toUpperCase()}</div>
          <div className="sysp-system-name">{sys.name.toUpperCase()}</div>
          <div className="sysp-system-tag">{sys.tag}</div>
        </div>
        <div className="sysp-counter">
          <div className="sysp-counter-v">{sys.count.toLocaleString()}</div>
          <div className="sysp-counter-k">{sys.kind === 'meta' ? 'entries' : 'titles'}</div>
        </div>
      </div>

      <div className="sysp-carousel">
        <div className="sysp-track">
          {visible.map(({ sys: s, i, d }) => {
            const abs = Math.abs(d);
            const cls = `sys-card depth-${abs}` + (d === 0 ? ' active' : '');
            const tx = d * 320; // px offset
            const scale = d === 0 ? 1 : (abs === 1 ? 0.78 : abs === 2 ? 0.6 : 0.46);
            const rotY = d * -16;
            const opacity = abs === 0 ? 1 : abs === 1 ? .88 : abs === 2 ? .55 : .25;
            const blur = abs === 0 ? 0 : abs === 1 ? .3 : abs === 2 ? 1.2 : 2.4;
            return (
              <div
                key={`${i}-${d}`}
                className={cls}
                onClick={() => onPick(i)}
                style={{
                  transform: `translateX(${tx}px) scale(${scale}) rotateY(${rotY}deg)`,
                  opacity,
                  filter: `blur(${blur}px)`,
                  zIndex: 100 - abs,
                  '--hue': s.hue,
                  '--hue2': s.hue2,
                }}>
                <div className="sys-card-bg"></div>
                <div className="sys-card-grid"></div>
                <div className="sys-card-kind">{s.kind === 'collection' ? '◆ COLLECTION' : s.kind === 'meta' ? '◇ LIST' : '■ PLATFORM'}</div>
                <div className="sys-card-media">
                  <MediaShape shape={s.shape} short={s.short} hue={s.hue}/>
                </div>
                <div className="sys-card-body">
                  <div className="sys-card-name">{s.name}</div>
                  <div className="sys-card-tag">{s.tag}</div>
                  <div className="sys-card-foot">
                    <span className="sys-card-count">{s.count.toLocaleString()}</span>
                    <span className="sys-card-count-k">{s.kind === 'meta' ? 'ITEMS' : 'TITLES'}</span>
                  </div>
                </div>
                {d === 0 && (
                  <>
                    <div className="sys-card-corners">
                      <span className="cc tl"></span><span className="cc tr"></span>
                      <span className="cc bl"></span><span className="cc br"></span>
                    </div>
                    <div className="sys-card-rays"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="sysp-pointer"></div>
      </div>

      <div className="sysp-rail-wrap">
        <div className="sysp-rail" ref={railRef}>
          {systems.map((s, i) => (
            <div
              key={s.id}
              className={'rail-item' + (i === index ? ' active' : '') + ' kind-' + s.kind}
              onClick={() => onPick(i)}
              style={{'--hue': s.hue}}>
              <span className="ri-short">{s.short}</span>
              <span className="ri-name">{s.name}</span>
              <span className="ri-count">{s.count}</span>
            </div>
          ))}
        </div>
        <div className="sysp-rail-fade left"></div>
        <div className="sysp-rail-fade right"></div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, SystemPicker, MENU_ITEMS, MediaShape });
