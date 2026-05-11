import React from 'react';

interface SystemsStepProps {
  selectedSystems: string[];
  onChange: (systems: string[]) => void;
}

const SYSTEMS = [
  { id: 'mame', name: 'MAME', description: '700+ arcade games' },
  { id: 'nes', name: 'Nintendo NES', description: 'NES/Famicom' },
  { id: 'snes', name: 'Super NES', description: 'SNES/Famicom' },
  { id: 'genesis', name: 'Sega Genesis', description: 'Genesis/Mega Drive' },
  { id: 'gbc', name: 'Game Boy Color', description: 'GBC/GB/SGB' },
  { id: 'ps1', name: 'PlayStation 1', description: 'PS1/PSX' },
  { id: 'n64', name: 'Nintendo 64', description: 'N64' },
];

export const SystemsStep: React.FC<SystemsStepProps> = ({ selectedSystems, onChange }) => {
  const toggle = (systemId: string) => {
    if (selectedSystems.includes(systemId)) {
      onChange(selectedSystems.filter(id => id !== systemId));
    } else {
      onChange([...selectedSystems, systemId]);
    }
  };

  return (
    <div className="setup-step">
      <h2>Select Systems</h2>
      <p>Which emulator systems would you like to enable? You can change this later.</p>

      <div className="systems-grid">
        {SYSTEMS.map(system => (
          <label key={system.id} className="system-checkbox">
            <input
              type="checkbox"
              checked={selectedSystems.includes(system.id)}
              onChange={() => toggle(system.id)}
            />
            <div className="checkbox-content">
              <h3>{system.name}</h3>
              <p>{system.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="info-box">
        <p>
          <strong>Note:</strong> At least one system must be selected. Selected: {selectedSystems.length}
        </p>
      </div>
    </div>
  );
};
