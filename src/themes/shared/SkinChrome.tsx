import type { ReactNode } from 'react';
import { SkinBackground } from './SkinBackground';
import { SkinMarquee } from './SkinMarquee';
import './SkinChrome.css';

interface SkinChromeProps {
  /** Screen title shown in the marquee band, e.g. "OPERADOR". */
  title: string;
  /** Active skin id; selects the real per-skin background + marquee. */
  skin?: string;
  onBack: () => void;
  children: ReactNode;
}

// Themed frame for full-screen panels (Operator / Settings) so they belong to
// the active skin instead of floating on black: real skin background behind,
// real skin marquee on top, with a floating Back control.
export function SkinChrome({ title, skin, onBack, children }: SkinChromeProps) {
  return (
    <div className="sc-root" data-skin={skin ?? 'default'}>
      <div className="sc-bg"><SkinBackground skin={skin} /></div>
      <header className="sc-marqueebar">
        <SkinMarquee skin={skin} title={title} />
        <button className="sc-back" onClick={onBack}>◂ Volver</button>
      </header>
      <main className="sc-content">{children}</main>
    </div>
  );
}
