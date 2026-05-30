import { useEffect, useState } from 'react';
// Standalone marquee/header band of each skin, extracted as a reusable piece
// (same pattern as SkinBackground). Renders the skin's real brand bar with a
// screen title injected; keeps an internal live clock. CSS is pulled in by
// SkinBackground; importing here too keeps the piece usable on its own.
import '../hyperrush/hyperrush.css';
import '../neonwall/neonwall.css';
import '../flux/flux.css';
import '../batocera/batocera.css';
import '../operator/operator.css';

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function SkinMarquee({ skin, title }: { skin?: string; title: string }) {
  const t = useClock();
  const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  const hms = `${hhmm}:${String(t.getSeconds()).padStart(2, '0')}`;
  const T = title.toUpperCase();

  switch (skin) {
    case 'hyperrush':
    case 'hyperwheel':
      return (
        <div className={`theme-hyperrush${skin === 'hyperwheel' ? ' hr-variant-wheel' : ''}`}>
          <div className="hr-marquee">
            <div className="hr-brand">
              <div className="hr-brand-mark">N</div>
              <div>
                <div className="hr-brand-name">NEOCAB</div>
                <div className="hr-brand-tag">{skin === 'hyperwheel' ? 'HYPERWHEEL · v2.2' : 'HYPERRUSH · v2.2'}</div>
              </div>
            </div>
            <div className="hr-marquee-title">
              <div className="hr-marquee-headline">{T}</div>
              <div className="hr-marquee-meta">{hms}</div>
            </div>
          </div>
        </div>
      );
    case 'neonwall':
      return (
        <div className="theme-neonwall">
          <div className="nw-top">
            <div className="nw-brand">
              <div className="nw-brand-mark">N</div>
              <div>
                <div className="nw-brand-name">NEOCAB</div>
                <div className="nw-brand-sub">{T}</div>
              </div>
            </div>
            <div className="nw-time">
              <span className="led" /><span>LIVE</span>
              <span style={{ opacity: .5 }}>·</span>
              <b>{hhmm}</b>
            </div>
          </div>
        </div>
      );
    case 'batocera':
      return (
        <div className="theme-batocera">
          <div className="bat-header">
            <div className="bat-header-left">
              <div className="bat-brand">
                <span className="bat-brand-dot" />
                <span>NEOCAB</span>
              </div>
              <div className="bat-section"><b>{T}</b></div>
            </div>
            <div className="bat-header-right">
              <div className="bat-pill accent">CABINET MODE</div>
              <div className="bat-pill"><span>{hhmm}</span></div>
            </div>
          </div>
        </div>
      );
    case 'operator':
      return (
        <div className="theme-operator">
          <div className="op-topbar">
            <div className="seg"><b>ADV-OP</b><span className="sep">·</span>v2.2</div>
            <div className="seg"><span className="sep">│</span>{T}</div>
            <div className="seg" style={{ marginLeft: 'auto' }}>{hhmm}<span className="blink" /></div>
          </div>
        </div>
      );
    case 'flux':
    default:
      // Flux (and unknown skins) have no top bar — synthesize one from --theme-*.
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px',
          borderBottom: '2px solid var(--theme-accent, #c084fc)',
          background: 'linear-gradient(180deg, var(--theme-surface, #1a1a2e) 0%, transparent 100%)',
          color: 'var(--theme-text, #eee)', fontFamily: 'inherit',
        }}>
          <span style={{ fontWeight: 900, letterSpacing: 1 }}>
            NEO<span style={{ color: 'var(--theme-accent, #c084fc)' }}>CAB</span>
          </span>
          <span style={{ marginLeft: 'auto', fontWeight: 800, letterSpacing: 4, color: 'var(--theme-accent, #c084fc)' }}>{T}</span>
          <b style={{ fontVariantNumeric: 'tabular-nums' }}>{hhmm}</b>
        </div>
      );
  }
}
