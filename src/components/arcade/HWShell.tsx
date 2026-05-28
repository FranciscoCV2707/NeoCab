import { useEffect } from 'react';
import { System, Game } from '../../stores/types';
import { getSystemHue } from './MediaShape';
import { HWMarquee } from './HWMarquee';
import { HWHomeScreen } from './HWHomeScreen';
import { HWSystemPicker } from './HWSystemPicker';
import { HWGameWheel } from './HWGameWheel';
import './hyperwheel.css';

interface HWShellProps {
  currentView: string;
  systems: System[];
  games: Game[];
  focusedIndex: number;
  selectedSystem: System | null;
  loading: boolean;
  scanProgress: string;
  onSelectSystem: (system: System) => void;
  onPlayGame: (game: Game) => void;
  onBack: () => void;
  onShowSystems: () => void;
  onShowOperator: () => void;
  onShowSettings: () => void;
  onScanROMs: () => void;
}

export function HWShell({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading, scanProgress,
  onSelectSystem, onPlayGame, onBack, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
}: HWShellProps) {
  // Update --hue/--hue2 on focus change
  useEffect(() => {
    const root = document.querySelector('.hw-cabinet') as HTMLElement | null;
    if (!root) return;
    let hue = 35, hue2 = 195;
    if (currentView === 'systems' && systems[focusedIndex]) {
      [hue, hue2] = getSystemHue(systems[focusedIndex].name);
    } else if ((currentView === 'games') && selectedSystem) {
      [hue, hue2] = getSystemHue(selectedSystem.name);
    }
    root.style.setProperty('--hue',  String(hue));
    root.style.setProperty('--hue2', String(hue2));
  }, [currentView, focusedIndex, systems, selectedSystem]);

  const focusedSystem = currentView === 'systems' ? systems[focusedIndex] : (selectedSystem ?? undefined);
  const focusedGame   = currentView === 'games'   ? games[focusedIndex]   : undefined;

  const renderScreen = () => {
    switch (currentView) {
      case 'menu':
        return (
          <HWHomeScreen
            totalGames={games.length}
            totalSystems={systems.length}
            onPlay={onShowSystems}
            onOperator={onShowOperator}
            onSettings={onShowSettings}
            onScan={onScanROMs}
            loading={loading}
            scanProgress={scanProgress}
            focusedIndex={focusedIndex}
          />
        );
      case 'systems':
        return (
          <HWSystemPicker
            systems={systems}
            focusedIndex={focusedIndex}
            onSelect={onSelectSystem}
            onBack={onBack}
          />
        );
      case 'games':
        if (!selectedSystem) return null;
        return (
          <HWGameWheel
            system={selectedSystem}
            games={games}
            focusedIndex={focusedIndex}
            onPlay={onPlayGame}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  const hints = (() => {
    if (currentView === 'menu')    return [{ color:'green',  b:'A', label:'CONFIRMAR' }, { color:'red', b:'B', label:'SALIR' }];
    if (currentView === 'systems') return [{ color:'green',  b:'A', label:'SELECCIONAR' }, { color:'red', b:'B', label:'VOLVER' }];
    if (currentView === 'games')   return [{ color:'green',  b:'A', label:'JUGAR' }, { color:'red', b:'B', label:'VOLVER' }, { color:'yellow', b:'C', label:'FAVORITO' }];
    return [];
  })();

  return (
    <div className="hw-cabinet">
      {/* Bg layers */}
      <div className="hw-bg">
        <div className="hw-bg-grid" />
      </div>

      {/* FX overlays */}
      <div className="hw-fx-scanlines" />
      <div className="hw-fx-vignette" />
      <div className="hw-fx-noise" />

      {/* Layout */}
      <HWMarquee
        currentView={currentView}
        focusedSystem={focusedSystem}
        focusedGame={focusedGame}
        totalGames={games.length}
        totalSystems={systems.length}
      />

      <div className="hw-main">
        {renderScreen()}
      </div>

      {/* Controls bar */}
      <div className="hw-controls">
        <div className="hw-joystick">
          <div className="hw-joy-stick" />
          <span>NAVEGAR</span>
        </div>
        <div className="hw-btn-hints">
          {hints.map(h => (
            <div key={h.b} className="hw-btn-hint">
              <button className={`hw-arcade-btn ${h.color}`} tabIndex={-1}>{h.b}</button>
              <div className="lbl">
                <b>{h.label}</b>
                <span>{h.color === 'green' ? 'CONFIRMAR' : h.color === 'red' ? 'CANCELAR' : 'ACCIÓN'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
