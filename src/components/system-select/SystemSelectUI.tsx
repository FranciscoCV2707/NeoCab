import React, { useState } from 'react';
import './SystemSelectUI.css';

export interface SystemInfo {
  id: number;
  name: string;
  display_name: string;
  gameCount: number;
  lastPlayed?: string;
  totalPlaytime?: number;
  extensions?: string;
}

interface SystemSelectUIProps {
  systems: SystemInfo[];
  onSystemSelect: (system: SystemInfo) => void;
  onBack?: () => void;
  showStats?: boolean;
}

export const SystemSelectUI: React.FC<SystemSelectUIProps> = ({
  systems,
  onSystemSelect,
  onBack,
  showStats = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = () => {
    if (systems[selectedIndex]) {
      onSystemSelect(systems[selectedIndex]);
    }
  };

  return (
    <div className="system-select-ui">
      <div className="system-grid">
        {systems.map((system, index) => (
          <div
            key={system.id}
            className={`system-card ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => {
              setSelectedIndex(index);
              onSystemSelect(system);
            }}
          >
            <h3>{system.display_name}</h3>
            {showStats && (
              <div className="system-stats">
                <span>{system.gameCount} games</span>
                {system.lastPlayed && <span>Last: {system.lastPlayed}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      {onBack && (
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      )}
    </div>
  );
};
