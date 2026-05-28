interface MediaShapeProps {
  shape: string;
  hue: number;
  short: string;
}

export function MediaShape({ shape, hue, short }: MediaShapeProps) {
  const tint    = `oklch(70% 0.20 ${hue})`;
  const tintDim = `oklch(38% 0.16 ${hue})`;
  const id      = `${shape}-${hue}`;

  switch (shape) {
    case 'cartridge':
      return (
        <svg className="ms" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`cg-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={tint} stopOpacity=".9"/>
              <stop offset="1" stopColor={tintDim} stopOpacity="1"/>
            </linearGradient>
          </defs>
          <path d="M30 30 L170 30 L170 36 L180 42 L180 200 L20 200 L20 42 L30 36 Z" fill={`url(#cg-${id})`} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
          <rect x="60" y="20" width="80" height="14" fill="#08060f" stroke="rgba(255,255,255,.12)"/>
          <rect x="40" y="74" width="120" height="92" fill="#fff3d4" opacity=".92"/>
          <rect x="44" y="78" width="112" height="20" fill="#08060f" opacity=".8"/>
          <text x="100" y="92" textAnchor="middle" fill="#fff3d4" fontFamily="JetBrains Mono,monospace" fontSize="11" letterSpacing="3">{short}</text>
          <text x="100" y="138" textAnchor="middle" fill="#08060f" fontFamily="Russo One,sans-serif" fontSize="22" letterSpacing="1">CART</text>
          <text x="100" y="158" textAnchor="middle" fill="#08060f" fontFamily="JetBrains Mono,monospace" fontSize="8" letterSpacing="2" opacity=".55">PCB · ROM-MASK</text>
          <rect x="42" y="186" width="116" height="8" fill="#08060f"/>
          <g opacity=".5">
            {Array.from({length:20}).map((_,i) => (
              <rect key={i} x={48+i*5.5} y="188" width="2" height="4" fill={tint}/>
            ))}
          </g>
        </svg>
      );

    case 'disc':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`dg-${id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff" stopOpacity=".05"/>
              <stop offset=".55" stopColor={tint} stopOpacity=".5"/>
              <stop offset=".75" stopColor={tintDim} stopOpacity=".95"/>
              <stop offset=".9" stopColor="#0a0810" stopOpacity="1"/>
            </radialGradient>
            <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".22"/>
              <stop offset=".35" stopColor="#fff" stopOpacity="0"/>
              <stop offset=".6" stopColor={tint} stopOpacity=".22"/>
              <stop offset="1" stopColor="#fff" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill={`url(#dg-${id})`} stroke="rgba(255,255,255,.18)"/>
          <circle cx="100" cy="100" r="92" fill={`url(#sheen-${id})`}/>
          {Array.from({length:6}).map((_,i) => (
            <circle key={i} cx="100" cy="100" r={84-i*6} fill="none" stroke="rgba(255,255,255,.06)"/>
          ))}
          <circle cx="100" cy="100" r="36" fill="#fff3d4"/>
          <text x="100" y="96" textAnchor="middle" fill="#08060f" fontFamily="Russo One,sans-serif" fontSize="18" letterSpacing="1">{short}</text>
          <text x="100" y="112" textAnchor="middle" fill="#08060f" fontFamily="JetBrains Mono,monospace" fontSize="7" letterSpacing="2" opacity=".7">CD-ROM</text>
          <circle cx="100" cy="100" r="12" fill="#08060f"/>
          <circle cx="100" cy="100" r="6" fill="#1a1626" stroke={tint} strokeWidth=".5"/>
        </svg>
      );

    case 'chip':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`pg-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={tintDim} stopOpacity=".9"/>
              <stop offset="1" stopColor="#08060f" stopOpacity=".95"/>
            </linearGradient>
          </defs>
          <rect x="22" y="36" width="156" height="128" fill={`url(#pg-${id})`} stroke="rgba(255,255,255,.16)"/>
          {Array.from({length:6}).map((_,r) =>
            Array.from({length:8}).map((_,c) => (
              <circle key={`${r}-${c}`} cx={32+c*18} cy={48+r*18} r="1" fill={tint} opacity=".35"/>
            ))
          )}
          <rect x="56" y="74" width="88" height="52" fill="#08060f" stroke="rgba(255,255,255,.2)"/>
          {Array.from({length:10}).map((_,i) => (
            <g key={i}>
              <rect x={58+i*8.5} y="68" width="5" height="6" fill={tint} opacity=".7"/>
              <rect x={58+i*8.5} y="126" width="5" height="6" fill={tint} opacity=".7"/>
            </g>
          ))}
          <text x="100" y="98" textAnchor="middle" fill={tint} fontFamily="Russo One,sans-serif" fontSize="16" letterSpacing="2">{short}</text>
          <text x="100" y="114" textAnchor="middle" fill="#fff3d4" fontFamily="JetBrains Mono,monospace" fontSize="7" letterSpacing="3" opacity=".7">CP-SYSTEM · PCB</text>
          <circle cx="64" cy="80" r="2" fill={tint}/>
          <rect x="22" y="158" width="156" height="8" fill="#08060f"/>
          {Array.from({length:24}).map((_,i) => (
            <rect key={i} x={28+i*6.4} y="160" width="2.5" height="4" fill={tint} opacity=".7"/>
          ))}
        </svg>
      );

    case 'umd':
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`ug-${id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor={tint} stopOpacity=".75"/>
              <stop offset="1" stopColor={tintDim} stopOpacity=".95"/>
            </linearGradient>
          </defs>
          <rect x="32" y="40" width="136" height="124" rx="14" fill={`url(#ug-${id})`} stroke="rgba(255,255,255,.18)"/>
          <circle cx="100" cy="108" r="44" fill="#08060f" stroke="rgba(255,255,255,.18)"/>
          <circle cx="100" cy="108" r="42" fill="#1a1626"/>
          {Array.from({length:5}).map((_,i) => (
            <circle key={i} cx="100" cy="108" r={40-i*6} fill="none" stroke={tint} strokeOpacity=".15"/>
          ))}
          <circle cx="100" cy="108" r="6" fill={tint}/>
          <rect x="40" y="48" width="120" height="22" fill="#fff3d4"/>
          <text x="100" y="63" textAnchor="middle" fill="#08060f" fontFamily="Russo One,sans-serif" fontSize="13" letterSpacing="3">{short} · UMD</text>
        </svg>
      );

    default:
      return (
        <svg className="ms" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="160" height="160" rx="12" fill={tint} fillOpacity=".15" stroke={tint} strokeWidth="2"/>
          <text x="100" y="115" textAnchor="middle" fill={tint} fontFamily="Russo One,sans-serif" fontSize="72" letterSpacing="-2">{short.charAt(0)}</text>
        </svg>
      );
  }
}

export function getSystemShape(name: string): string {
  const n = name.toLowerCase();
  if (['mame','arcade','fba','cps','neogeo'].some(k => n.includes(k))) return 'chip';
  if (['psx','ps1','ps2','saturn','dreamcast','dc','pce'].some(k => n.includes(k))) return 'disc';
  if (['psp'].some(k => n.includes(k))) return 'umd';
  return 'cartridge';
}

export function getSystemHue(name: string): [number, number] {
  const n = name.toLowerCase();
  if (n.includes('mame') || n.includes('arcade')) return [35, 195];
  if (n.includes('neogeo') || n.includes('neo geo')) return [22, 202];
  if (n.includes('snes') || n.includes('super')) return [300, 120];
  if (n.includes('nes') && !n.includes('snes')) return [5, 165];
  if (n.includes('psx') || n.includes('ps1') || n.includes('playstation')) return [240, 60];
  if (n.includes('ps2')) return [220, 40];
  if (n.includes('n64') || n.includes('nintendo64')) return [130, 310];
  if (n.includes('genesis') || n.includes('megadrive')) return [210, 30];
  if (n.includes('gba')) return [200, 20];
  if (n.includes('gb') && !n.includes('gba')) return [160, 340];
  if (n.includes('dreamcast') || n === 'dc') return [200, 20];
  if (n.includes('saturn')) return [260, 80];
  if (n.includes('atari')) return [45, 225];
  if (n.includes('psp')) return [30, 210];
  return [35, 195];
}
