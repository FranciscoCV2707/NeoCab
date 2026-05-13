import React from 'react';

interface MediaDirectoryStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const MediaDirectoryStep: React.FC<MediaDirectoryStepProps> = ({ value, onChange }) => (
  <div className="setup-step">
    <h2>Media Directory</h2>
    <p>
      Where should NeoCab store wheel images, box art, and backgrounds? This follows HyperSpin
      structure.
    </p>
    <div className="input-group">
      <label>Media Directory</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., ./media or C:\Media"
      />
    </div>
    <div className="info-box">
      <h3>📸 HyperSpin Structure</h3>
      <pre>
{`media/
├── MAME/
│   └── Images/
│       ├── Wheel/
│       ├── Boxes/
│       └── Backgrounds/
├── NES/
│   └── Images/
│       └── ...`}
      </pre>
    </div>
  </div>
);
