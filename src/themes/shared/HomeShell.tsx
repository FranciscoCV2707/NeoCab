// shared/HomeShell.tsx — shared home panel used by NeonWall, Flux, and optionally others.
// Each skin wraps this in its own layout/sizing via the className prop.

import React from 'react';
import { ARCADE_MENU } from './menu';

export interface HomeShellProps {
  className?: string;
  activeIndex: number;
  onSelect: (id: string) => void;
  totals: { titles: number; systems: number; favorites: number };
  themeName: string;
  themeTag: string;
}

export function HomeShell({ className, activeIndex, onSelect, totals, themeName, themeTag }: HomeShellProps) {
  return (
    <div className={className} data-screen-label="Home · Main Menu">
      <div className="nc-home-left">
        <div className="nc-eyebrow">
          <span className="nc-dot" />
          <span>SYSTEM ONLINE · CRT WARM · BUILD 0.7</span>
        </div>

        <div className="nc-wordmark">
          <div className="nc-wordmark-l1">NEO</div>
          <div className="nc-wordmark-l2">CAB</div>
          <div className="nc-wordmark-sub">
            {themeName.toUpperCase()} <span className="nc-amber">·</span> {themeTag.toUpperCase()}
          </div>
        </div>

        <div className="nc-stats">
          <div className="nc-stat"><div className="nc-k">Total titles</div><div className="nc-v">{totals.titles.toLocaleString()}</div></div>
          <div className="nc-stat"><div className="nc-k">Systems</div><div className="nc-v">{totals.systems}</div></div>
          <div className="nc-stat"><div className="nc-k">Favorites</div><div className="nc-v">{totals.favorites}</div></div>
          <div className="nc-stat"><div className="nc-k">Last session</div><div className="nc-v">TODAY 21:14</div></div>
        </div>

        <div className="nc-ticker">
          <span className="nc-ticker-lbl">NOW SHOWING</span>
          <div className="nc-ticker-track">
            <div className="nc-ticker-inner">
              {['METAL SLUG', 'KOF 98', 'STREET FIGHTER II', 'SNOW BROS', 'FINAL FIGHT', 'GAROU MOTW', 'MARVEL VS CAPCOM', 'CADILLACS'].map((t, i) => (
                <React.Fragment key={i}>
                  <span>{t}</span>
                  <span className="nc-ticker-pip">◆</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="nc-home-right">
        <div className="nc-menu-head">
          <span className="nc-menu-head-line" />
          <span className="nc-menu-head-lbl">MAIN MENU</span>
          <span className="nc-menu-head-line" />
        </div>
        <div className="nc-menu">
          {ARCADE_MENU.map((it, i) => (
            <button
              key={it.id}
              className={'nc-menu-item' + (i === activeIndex ? ' is-active' : '')}
              onClick={() => onSelect(it.id)}
              tabIndex={-1}
            >
              <span className="nc-mi-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="nc-mi-icon">{it.icon}</span>
              <span className="nc-mi-body">
                <span className="nc-mi-label">{it.label}</span>
                <span className="nc-mi-tag">{it.sub}</span>
              </span>
              {i === activeIndex && <span className="nc-mi-arrow">▶</span>}
            </button>
          ))}
        </div>
        <div className="nc-credits">
          INSERT COIN · CREDITS <b>99</b> · FREEPLAY ON
        </div>
      </div>
    </div>
  );
}