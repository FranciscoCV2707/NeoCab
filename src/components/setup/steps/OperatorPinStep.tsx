import React, { useState } from 'react';

interface OperatorPinStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const OperatorPinStep: React.FC<OperatorPinStepProps> = ({ value, onChange }) => {
  const [showPin, setShowPin] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange(input);
  };

  const isValid = value.length === 4 && /^\d+$/.test(value);

  return (
    <div className="setup-step">
      <h2>Operator PIN</h2>
      <p>
        Set a 4-digit PIN for operator access. This protects sensitive settings and earnings
        reports.
      </p>

      <div className="input-group">
        <label>Operator PIN (4 digits)</label>
        <div className="pin-input-wrapper">
          <input
            type={showPin ? 'text' : 'password'}
            value={value}
            onChange={handleInputChange}
            placeholder="0000"
            maxLength={4}
            className={`pin-input ${isValid ? 'valid' : ''}`}
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowPin(!showPin)}
          >
            {showPin ? '🙈' : '👁️'}
          </button>
        </div>
        {isValid && <div className="input-success">✓ Valid PIN</div>}
      </div>

      <div className="pin-keypad">
        <p>Quick PIN entry:</p>
        <div className="keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
            <button
              key={num}
              className="keypad-button"
              onClick={() => {
                const newPin = (value + num.toString()).slice(-4);
                onChange(newPin);
              }}
            >
              {num}
            </button>
          ))}
          <button
            className="keypad-button clear"
            onClick={() => onChange(value.slice(0, -1))}
          >
            ← Clear
          </button>
        </div>
      </div>

      <div className="info-box">
        <h3>🔐 Security Tips</h3>
        <ul>
          <li>Don&apos;t use obvious numbers (0000, 1111, 1234)</li>
          <li>Choose something you can remember</li>
          <li>You can reset this PIN from the system terminal</li>
          <li>Access operator panel with: Menu → Operator (requires PIN)</li>
        </ul>
      </div>
    </div>
  );
};
