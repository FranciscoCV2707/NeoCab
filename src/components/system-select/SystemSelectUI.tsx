import React, { useEffect, useState } from 'react';
import { HyperSpinWheel, WheelItem } from '../wheel';
import './SystemSelectUI.css';

export interface SystemInfo extends WheelItem {
  gameCount: number;
  lastPlayed?: string;
  totalPlaytime?: number;
}

interface SystemSelectUIProps {
  systems: SystemInfo[];
  onSystemSelect: (system: SystemInfo) => void;
  onBack?: () => void;
  showStats?: boolean;
}

/**
 * System selection screen with HyperSpin wheel
 * Main menu for selecting arcade system (MAME, PSX, N64, etc.)
 */
export const SystemSelectUI: React.FC<SystemSelectUIProps> = ({
  systems,
  onSystemSelect,
  onBack,
  showStats = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Convert systems to wheel items
  const wheelItems: WheelItem[] = systems.map((sys) => ({
    id: sys.id,
    name: sys.name,
    icon: sys.icon,
    color: sys.color,
  }));

  const handleConfirm = (item: WheelItem) => {
    const system = systems.find((s) => s.id === item.id);
    if (system) {
      onSystemSelect(system);
    }
  };

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    }
  };

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBackPress();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onBack]);

  return (
    <div className="system-select-ui">
      <div className="select-header">
        <h1 className="select-title">SELECT SYSTEM</h1>
        <div className="total-systems">
          {systems.length} Systems Available
        </div>
      </div>

      <div className="select-content">
        <HyperSpinWheel
          items={wheelItems}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onConfirm={handleConfirm}
          radius={140}
          itemSize={42}
          rotationSpeed={350}
          showLabels={true}
          animated={true}
        />

        {showStats && systems[selectedIndex] && (
          <div className="system-stats-panel">
            <div className="stat-card">
              <div className="stat-label">Games</div>
              <div className="stat-value">{systems[selectedIndex].gameCount}</div>
            </div>

            {systems[selectedIndex].lastPlayed && (
              <div className="stat-card">
                <div className="stat-label">Last Played</div>
                <div className="stat-value">{systems[selectedIndex].lastPlayed}</div>
              </div>
            )}

            {systems[selectedIndex].totalPlaytime !== undefined && (
              <div className="stat-card">
                <div className="stat-label">Total Time</div>
                <div className="stat-value">
                  {Math.floor(systems[selectedIndex].totalPlaytime! / 60)}h
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="select-footer">
        <div className="footer-info">
          <p className="info-text">← → Rotate Wheel</p>
          <p className="info-text">ENTER to Select System</p>
          <p className="info-text">ESC to Go Back</p>
        </div>
        <button className="back-button" onClick={handleBackPress}>
          ← BACK
        </button>
      </div>
    </div>
  );
};

export default SystemSelectUI;
