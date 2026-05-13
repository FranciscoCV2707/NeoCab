import React from 'react';

interface ConfigureInputStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const ConfigureInputStep: React.FC<ConfigureInputStepProps> = ({ value, onChange }) => (
  <div className="setup-step">
    <h2>Configure Input</h2>
    <p>Select your input device type. Auto-detection will identify most controllers.</p>

    <div className="input-options">
      {[
        { id: 'auto', label: 'Auto-Detect', desc: 'Automatic detection (recommended)' },
        { id: 'keyboard', label: 'Keyboard', desc: 'Keyboard controls' },
        { id: 'xbox', label: 'Xbox Controller', desc: 'Xbox 360 / Xbox One' },
        { id: 'ps4', label: 'PlayStation 4', desc: 'PS4 DualShock' },
        { id: 'arcade', label: 'Arcade Stick', desc: 'Custom arcade sticks' },
      ].map(option => (
        <label key={option.id} className="input-radio">
          <input
            type="radio"
            name="input-device"
            value={option.id}
            checked={value === option.id}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="radio-content">
            <h3>{option.label}</h3>
            <p>{option.desc}</p>
          </div>
        </label>
      ))}
    </div>

    <div className="info-box">
      <h3>⌨️ Keyboard Controls (if selected)</h3>
      <ul>
        <li><code>↑↓←→</code> - Navigate</li>
        <li><code>Z</code> - Select/Start</li>
        <li><code>X</code> - Back/Cancel</li>
        <li><code>Esc</code> - Menu</li>
      </ul>
    </div>

    <div className="info-box">
      <p>You can reconfigure input anytime in Settings → Input Configuration</p>
    </div>
  </div>
);
