import React, { useState } from 'react';

interface RomDirectoryStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const RomDirectoryStep: React.FC<RomDirectoryStepProps> = ({ value, onChange }) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setError(null);
  };

  const suggestedPaths = [
    'C:\\ROMs',
    'C:\\Games\\ROMs',
    '/home/user/roms',
    '/mnt/external/games',
  ];

  return (
    <div className="setup-step">
      <h2>ROM Directory</h2>

      <div className="step-content">
        <p>
          Where are your game ROM files located? NeoCab will scan this directory and organize
          games by system.
        </p>

        <div className="input-group">
          <label>Directory Path</label>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder="e.g., C:\ROMs or /home/user/roms"
            className="path-input"
          />
          {error && <div className="input-error">{error}</div>}
        </div>

        <div className="info-box">
          <h3>📁 Directory Structure</h3>
          <p>NeoCab expects ROMs organized by system:</p>
          <pre>
{`ROMs/
├── MAME/
│   ├── pacman.zip
│   ├── donkeykong.zip
│   └── ...
├── NES/
│   ├── mario.nes
│   ├── zelda.nes
│   └── ...
├── SNES/
│   ├── kirby.smc
│   └── ...
└── ...`}
          </pre>
        </div>

        <div className="info-box">
          <h3>💾 Supported Systems</h3>
          <p>MAME, NES, SNES, Genesis, Game Boy, PlayStation 1, Nintendo 64, and more</p>
        </div>

        <div className="suggested-paths">
          <h3>Suggested Paths</h3>
          {suggestedPaths.map((path, idx) => (
            <button
              key={idx}
              className="path-suggestion"
              onClick={() => onChange(path)}
            >
              {path}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
