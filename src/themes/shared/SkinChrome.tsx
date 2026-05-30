import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SkinBackground } from './SkinBackground';
import './SkinChrome.css';

interface SkinChromeProps {
  /** Screen title shown in the marquee band, e.g. "OPERADOR". */
  title: string;
  /** Active theme display name, shown as the chrome subtitle. */
  themeName: string;
  /** Active skin id; drives per-skin chrome accents via `data-skin`. */
  skin?: string;
  onBack: () => void;
  children: ReactNode;
}

// Themed frame for full-screen panels (Operator / Settings) so they belong to
// the active skin instead of floating on black. All colors read the canonical
// --theme-* vars, so the chrome recolors live with the theme.
export function SkinChrome({ title, themeName, skin, onBack, children }: SkinChromeProps) {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(clock.getHours()).padStart(2, '0');
  const mm = String(clock.getMinutes()).padStart(2, '0');
  const ss = String(clock.getSeconds()).padStart(2, '0');

  return (
    <div className="sc-root" data-skin={skin ?? 'default'}>
      <div className="sc-bg"><SkinBackground skin={skin} /></div>
      <header className="sc-marquee">
        <button className="sc-back" onClick={onBack}>◂ Volver</button>
        <div className="sc-brand">
          <span className="sc-brand-neo">NEO</span><span className="sc-brand-cab">CAB</span>
          <span className="sc-brand-sub">{themeName.toUpperCase()}</span>
        </div>
        <div className="sc-title">{title}</div>
        <div className="sc-clock">{hh}:{mm}<span className="sc-clock-s">:{ss}</span></div>
      </header>
      <main className="sc-content">{children}</main>
    </div>
  );
}
