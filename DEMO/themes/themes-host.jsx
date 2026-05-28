// themes-host.jsx — NeoCab theme pack host
// Boots straight into the active theme. Theme switching is reached
// from inside each theme's Settings → Themes screen.

const { useState: useStateApp, useEffect: useEffectApp, useCallback: useCallbackApp } = React;

// ─── theme-card mini preview SVGs ─────────────────────────────────────────
function ThemePreviewSVG({ kind, accent }) {
  switch (kind) {
    case 'horizontal-rail':
      return (
        <svg viewBox="0 0 200 125">
          <rect x="10" y="14" width="180" height="8" fill={accent} opacity=".4"/>
          <rect x="78" y="32" width="44" height="58" rx="3" fill={accent} opacity=".95"/>
          <rect x="82" y="80" width="36" height="4" fill="#000" opacity=".4"/>
          <rect x="30" y="42" width="34" height="44" rx="3" fill={accent} opacity=".3"/>
          <rect x="136" y="42" width="34" height="44" rx="3" fill={accent} opacity=".3"/>
          <rect x="10" y="102" width="180" height="10" fill="rgba(255,255,255,.06)"/>
          <circle cx="22" cy="107" r="2.5" fill={accent}/>
          <circle cx="34" cy="107" r="2.5" fill="#fff" opacity=".4"/>
          <circle cx="46" cy="107" r="2.5" fill="#fff" opacity=".4"/>
        </svg>
      );
    case 'crt-list':
      return (
        <svg viewBox="0 0 200 125">
          <rect x="6" y="6" width="115" height="113" fill="#020410" stroke={accent} strokeOpacity=".6"/>
          {Array.from({length:10}).map((_,i)=>(
            <rect key={i} x="12" y={14+i*9} width={90-i*2} height="2.2" fill={accent} opacity={i===3?1:.35}/>
          ))}
          <rect x="9" y="38" width="109" height="9" fill={accent} opacity=".22"/>
          <rect x="128" y="6" width="66" height="56" fill="#020410" stroke={accent} strokeOpacity=".6"/>
          <rect x="132" y="10" width="58" height="48" fill={accent} opacity=".22"/>
          <rect x="128" y="68" width="66" height="51" fill="#020410" stroke={accent} strokeOpacity=".3"/>
          {Array.from({length:5}).map((_,i)=>(
            <rect key={i} x="132" y={72+i*8} width={50-i*4} height="2" fill={accent} opacity=".5"/>
          ))}
          <g opacity=".22">
            {Array.from({length:40}).map((_,i)=>(
              <rect key={i} x="0" y={i*3} width="200" height="1" fill="#000"/>
            ))}
          </g>
        </svg>
      );
    case 'wheel-curve':
      return (
        <svg viewBox="0 0 200 125">
          <defs>
            <radialGradient id="wc-rg" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor={accent} stopOpacity=".4"/>
              <stop offset="1" stopColor="#000" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="200" height="125" fill="url(#wc-rg)"/>
          <rect x="14" y="38" width="80" height="20" fill={accent}/>
          <rect x="14" y="62" width="60" height="10" fill={accent} opacity=".5"/>
          <g transform="translate(140 62)">
            {[-2,-1,0,1,2].map(d => (
              <rect key={d} x={d*4-20+Math.abs(d)*3} y={d*16-8} width={40-Math.abs(d)*6} height={d===0?16:12}
                    fill={accent} opacity={1-Math.abs(d)*0.25} rx="2"/>
            ))}
          </g>
          <rect x="0" y="110" width="200" height="15" fill="rgba(0,0,0,.6)"/>
        </svg>
      );
    case 'angled-panels':
      return (
        <svg viewBox="0 0 200 125">
          <rect x="10" y="10" width="68" height="14" fill={accent} opacity=".9"/>
          <rect x="10" y="26" width="48" height="6" fill={accent} opacity=".5"/>
          <g transform="rotate(-8 100 65)">
            <rect x="60" y="36" width="80" height="56" fill="#04030a" stroke={accent} strokeOpacity=".7" strokeWidth="1"/>
            <rect x="64" y="40" width="72" height="48" fill={accent} opacity=".25"/>
          </g>
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={170-i*2} y={20+i*15} width={26-i*1.5} height="9" fill={accent} opacity={i===2?1:.35}/>
          ))}
          {[0,1,2,3].map(i => (
            <rect key={i} x={10+i*22} y="98" width="18" height="12" fill={accent} opacity=".4"/>
          ))}
        </svg>
      );
    case 'cinematic-wall':
      return (
        <svg viewBox="0 0 200 125">
          <defs>
            <linearGradient id="cw-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={accent} stopOpacity=".4"/>
              <stop offset="1" stopColor="#000" stopOpacity=".9"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="200" height="125" fill="url(#cw-bg)"/>
          <rect x="60" y="22" width="80" height="60" fill="#000" stroke={accent} strokeWidth="1.5"/>
          <rect x="63" y="25" width="74" height="54" fill={accent} opacity=".45"/>
          <g opacity=".5">
            <rect x="6" y="22" width="48" height="30" fill={accent} opacity=".7"/>
            <rect x="6" y="56" width="48" height="26" fill={accent} opacity=".5"/>
            <rect x="146" y="22" width="48" height="30" fill={accent} opacity=".7"/>
            <rect x="146" y="56" width="48" height="26" fill={accent} opacity=".5"/>
          </g>
          {[0,1,2,3,4,5].map(i => (
            <rect key={i} x={10+i*32} y="92" width="26" height="20" fill={accent} opacity={i===3?1:.3} rx="2"/>
          ))}
        </svg>
      );
    default:
      return null;
  }
}
window.ThemePreviewSVG = ThemePreviewSVG;

// ═══════════════════════════════════════════════════════════════════════════
// APP — host
// ═══════════════════════════════════════════════════════════════════════════
function App() {
  const themes = window.THEME_REGISTRY;
  const [activeId, setActiveId] = useStateApp('hyperrush');

  function ThemeMount() {
    if (activeId === 'batocera' && window.BatoceraTheme) return <window.BatoceraTheme onChangeTheme={setActiveId} />;
    if (activeId === 'operator' && window.OperatorTheme) return <window.OperatorTheme onChangeTheme={setActiveId} />;
    if (activeId === 'hyperrush' && window.HyperRushTheme) return <window.HyperRushTheme onChangeTheme={setActiveId} />;
    if (activeId === 'attractflux' && window.FluxTheme) return <window.FluxTheme onChangeTheme={setActiveId} />;
    if (activeId === 'neonwall' && window.NeonWallTheme) return <window.NeonWallTheme onChangeTheme={setActiveId} />;
    return <div style={{color:'#fff',padding:60,fontFamily:'monospace'}}>Theme "{activeId}" not loaded.</div>;
  }

  return <ThemeMount/>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
