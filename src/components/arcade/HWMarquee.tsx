import { useEffect, useState } from 'react';
import { System, Game } from '../../stores/types';

interface HWMarqueeProps {
  currentView: string;
  focusedSystem?: System;
  focusedGame?: Game;
  totalGames: number;
  totalSystems: number;
}

export function HWMarquee({ currentView, focusedSystem, focusedGame, totalGames, totalSystems }: HWMarqueeProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const sysName = (() => {
    if (currentView === 'menu') return 'NEOCAB · HYPER­Wheel';
    if (currentView === 'systems') return 'SELECT SYSTEM';
    if (focusedSystem) return focusedSystem.display_name;
    return 'NEOCAB';
  })();

  const sysMeta = (() => {
    if (currentView === 'menu') return `${totalSystems} PLATAFORMAS · ${totalGames.toLocaleString()} JUEGOS`;
    if (currentView === 'systems') return `${totalSystems} LIBRARIES`;
    if (focusedGame) return `${focusedGame.year ?? ''} · ${focusedGame.genre ?? ''}`;
    return '';
  })();

  const statLabel = (() => {
    if (currentView === 'games' && focusedGame) return (focusedGame.play_count ?? 0).toString().padStart(4,'0');
    return totalGames.toLocaleString();
  })();
  const statKey = currentView === 'games' ? 'JUGADAS' : 'TÍTULOS';

  return (
    <div className="hw-marquee">
      {/* Brand */}
      <div className="hw-brand">
        <div className="hw-brand-mark">NC</div>
        <div className="hw-brand-info">
          <div className="hw-brand-name">NEOCAB</div>
          <div className="hw-brand-tag">ARCADE OS</div>
        </div>
      </div>

      {/* Center: system name + meta */}
      <div className="hw-system-tag">
        <div className="hw-system-name">{sysName}</div>
        {sysMeta && (
          <div className="hw-system-meta">
            <span>{sysMeta}</span>
          </div>
        )}
      </div>

      {/* Right: time + stats + online dot */}
      <div className="hw-status">
        <div className="hw-status-block">
          <div className="hw-status-v tab">{time}</div>
          <div className="hw-status-k">HORA LOCAL</div>
        </div>
        <div className="hw-status-block">
          <div className="hw-status-v tab">{statLabel}</div>
          <div className="hw-status-k">{statKey}</div>
        </div>
        <div className="hw-status-led">
          <span className="dot" />
          <span>ONLINE</span>
        </div>
      </div>
    </div>
  );
}
