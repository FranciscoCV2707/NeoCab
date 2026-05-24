import { useEffect, useState } from 'react';
import type { Widget, ScreenLayout } from '../types/layout';
import type { Theme } from '../stores/useThemeStore';

interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

interface ScreenRendererProps {
  layout: ScreenLayout;
  theme: Theme;
  systems?: System[];
  focusedIndex?: number;
  onSelect?: (idx: number) => void;
}

const SYSTEM_COLORS: Record<string, string> = {
  mame: '#ff6b00', nes: '#e60012', snes: '#6b3fa0', genesis: '#0060c0',
  psx: '#003087', gb: '#8bac0f', gba: '#4a68d8', n64: '#008000',
  arcade: '#ff006e', default: '#888888',
};

function ClockWidget() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', fontSize:'clamp(10px,2.5vw,20px)', color:'var(--text,#fff)', opacity:0.85 }}>
      {time}
    </div>
  );
}

function CreditsWidget() {
  let credits = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (window as any).__neocab_coin_store;
    credits = store?.getState?.()?.credits ?? 0;
  } catch { /* no store yet */ }
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:'clamp(9px,2vw,16px)', color:'var(--accent,#00ffcc)' }}>
      <span>♦</span><span>{credits}</span>
    </div>
  );
}

interface SystemWheelProps {
  style: string;
  systems: System[];
  focusedIndex: number;
  onSelect: (idx: number) => void;
  theme: Theme;
}

function SystemWheelWidget({ style, systems, focusedIndex, onSelect, theme }: SystemWheelProps) {
  const primary = theme.colors.primary ?? '#ff6b00';
  const surface = theme.colors.surface ?? '#1a1a1a';
  const border  = theme.colors.border  ?? '#ff6b00';
  const text    = theme.colors.text    ?? '#fff';
  const bg      = theme.colors.background ?? '#0a0a0a';

  if (style === 'grid') {
    return (
      <div style={{ width:'100%', height:'100%', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))', gap:8, overflowY:'auto', padding:8 }}>
        {systems.map((sys, i) => {
          const focused = i === focusedIndex;
          const color = SYSTEM_COLORS[sys.name.toLowerCase()] ?? SYSTEM_COLORS.default;
          return (
            <button key={sys.id} onClick={() => onSelect(i)} style={{
              padding:'8px 4px', borderRadius:6, cursor:'pointer',
              border:`2px solid ${focused ? primary : border}`,
              background: focused ? `${primary}22` : surface,
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              boxShadow: focused ? `0 0 12px ${primary}88` : 'none',
              transition:'all 0.2s',
            }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background: focused ? primary : color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color: focused ? bg : text }}>
                {sys.display_name.charAt(0)}
              </div>
              <span style={{ fontSize:9, color: focused ? primary : text, fontWeight:600 }}>{sys.display_name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (style === 'list') {
    return (
      <div style={{ width:'100%', height:'100%', overflowY:'auto' }}>
        {systems.map((sys, i) => {
          const focused = i === focusedIndex;
          const color = SYSTEM_COLORS[sys.name.toLowerCase()] ?? SYSTEM_COLORS.default;
          return (
            <button key={sys.id} onClick={() => onSelect(i)} style={{
              display:'flex', alignItems:'center', gap:8,
              width:'100%', padding:'7px 12px',
              background: focused ? `${primary}22` : 'transparent',
              borderLeft:`3px solid ${focused ? primary : 'transparent'}`,
              border:'none', cursor:'pointer', textAlign:'left',
              color: focused ? primary : text,
              transition:'all 0.15s',
            }}>
              <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background: focused ? primary : color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color: focused ? bg : text }}>
                {sys.display_name.charAt(0)}
              </div>
              <span style={{ fontSize:12, fontWeight: focused ? 700 : 400 }}>{sys.display_name}</span>
              {focused && <span style={{ marginLeft:'auto', fontSize:10, color:theme.colors.accent }}>▶</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // default: carousel
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
      {systems.map((sys, i) => {
        const dist = i - focusedIndex;
        const scale = Math.max(0.3, 1 - Math.abs(dist) * 0.18);
        const opacity = Math.max(0.1, 1 - Math.abs(dist) * 0.3);
        const tx = dist * 90;
        const focused = dist === 0;
        const color = SYSTEM_COLORS[sys.name.toLowerCase()] ?? SYSTEM_COLORS.default;
        return (
          <button key={sys.id} onClick={() => onSelect(i)} style={{
            position:'absolute',
            transform:`translateX(${tx}px) scale(${scale})`,
            opacity, zIndex: focused ? 5 : Math.max(0, 3 - Math.abs(dist)),
            transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            background: focused ? `linear-gradient(135deg, ${surface}, ${bg})` : surface,
            border:`2px solid ${focused ? primary : border}`,
            borderRadius:10, width:80, height:96,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
            cursor:'pointer',
            boxShadow: focused ? `0 0 20px ${primary}66` : 'none',
          }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background: focused ? primary : color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color: focused ? bg : text }}>
              {sys.display_name.charAt(0)}
            </div>
            <span style={{ fontSize:9, color: focused ? primary : text, fontWeight: focused ? 700 : 400, textAlign:'center', maxWidth:72, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {sys.display_name}
            </span>
            {focused && <div style={{ position:'absolute', inset:-4, border:`2px solid ${primary}`, borderRadius:12, opacity:0.4, pointerEvents:'none' }} />}
          </button>
        );
      })}
    </div>
  );
}

interface WidgetRendererProps {
  widget: Widget;
  theme: Theme;
  systems: System[];
  focusedIndex: number;
  onSelect: (idx: number) => void;
}

function WidgetRenderer({ widget, theme, systems, focusedIndex, onSelect }: WidgetRendererProps) {
  const { type, config } = widget;
  const focused = systems[focusedIndex];

  switch (type) {
    case 'background': {
      const bg = theme.background;
      let bgStyle: React.CSSProperties = { background: theme.colors.background ?? '#0a0a0a' };
      if (bg?.type === 'gradient' && bg.gradient) bgStyle = { background: bg.gradient };
      else if (bg?.type === 'image' && bg.image) bgStyle = { background: `url(${bg.image}) center/cover no-repeat` };
      else if (bg?.color) bgStyle = { background: bg.color };
      return (
        <div style={{ width:'100%', height:'100%', ...bgStyle, filter: bg?.blur ? `blur(${bg.blur}px)` : undefined }}>
          {bg?.overlay_color && (
            <div style={{ position:'absolute', inset:0, background: bg.overlay_color, pointerEvents:'none' }} />
          )}
        </div>
      );
    }

    case 'system-wheel':
      return (
        <SystemWheelWidget
          style={(config.style as string) ?? 'carousel'}
          systems={systems}
          focusedIndex={focusedIndex}
          onSelect={onSelect}
          theme={theme}
        />
      );

    case 'system-logo': {
      const usePng = config.use_png as boolean;
      const color = SYSTEM_COLORS[focused?.name?.toLowerCase()] ?? SYSTEM_COLORS.default;
      if (usePng && focused) {
        return (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img
              src={`assets/systems/${focused.name}.png`}
              alt={focused.display_name}
              style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        );
      }
      return (
        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:'clamp(24px,6vw,64px)', fontWeight:900, color, textShadow:`0 0 20px ${color}`, fontFamily: theme.fonts.title ?? 'Impact', letterSpacing:4 }}>
            {focused ? (config.fallback === 'text' ? focused.display_name : focused.display_name.charAt(0)) : '?'}
          </div>
        </div>
      );
    }

    case 'clock':
      return <ClockWidget />;

    case 'credits':
      return <CreditsWidget />;

    case 'session-timer':
      return (
        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(9px,2vw,16px)', color:`var(--warning,${theme.colors.warning ?? '#ffcc00'})` }}>
          ⏱ —:——
        </div>
      );

    case 'text-label': {
      const fontKey = (config.font as string) ?? 'ui';
      const fontFamily = theme.fonts[fontKey] ?? theme.fonts.ui ?? 'Arial';
      return (
        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily, fontSize: (config.size as number) ?? 16, color: (config.color as string) ?? theme.colors.text ?? '#fff', padding:'2px 4px', wordBreak:'break-word', textAlign:'center' }}>
          {(config.text as string) ?? ''}
        </div>
      );
    }

    case 'image':
      return (
        <div style={{ width:'100%', height:'100%', overflow:'hidden' }}>
          <img src={(config.src as string) ?? ''} alt="" style={{ width:'100%', height:'100%', objectFit: (config.fit as 'contain'|'cover'|'fill') ?? 'contain' }} />
        </div>
      );

    case 'game-list':
    case 'game-preview':
    case 'game-info':
      return (
        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#555', fontSize:11, border:'1px dashed #333', borderRadius:4 }}>
          {type}
        </div>
      );

    default:
      return null;
  }
}

export function ScreenRenderer({ layout, theme, systems = [], focusedIndex = 0, onSelect }: ScreenRendererProps) {
  const handleSelect = onSelect ?? (() => {});
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      {layout.widgets
        .filter(w => w.visible)
        .sort((a, b) => a.z - b.z)
        .map(w => (
          <div key={w.id} style={{
            position:'absolute',
            left:`${w.x}%`,
            top:`${w.y}%`,
            width:`${w.w}%`,
            height:`${w.h}%`,
            zIndex: w.z,
          }}>
            <WidgetRenderer
              widget={w}
              theme={theme}
              systems={systems}
              focusedIndex={focusedIndex}
              onSelect={handleSelect}
            />
          </div>
        ))}
    </div>
  );
}
