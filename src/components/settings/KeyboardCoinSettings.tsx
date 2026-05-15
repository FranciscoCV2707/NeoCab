import React, { useState, useEffect } from 'react';
import './KeyboardCoinSettings.css';

interface KeyboardCoinSettingsProps {
  onConfigChange?: (config: {
    enabled: boolean;
    coinKey: string;
    coinAmount: number;
  }) => void;
}

export const KeyboardCoinSettings: React.FC<KeyboardCoinSettingsProps> = ({ onConfigChange }) => {
  const [enabled, setEnabled] = useState(false);
  const [coinKey, setCoinKey] = useState('5');
  const [coinAmount, setCoinAmount] = useState(1);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!isListening) return;
    const handler = (e: KeyboardEvent) => {
      setCoinKey(e.key);
      setIsListening(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isListening]);

  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({ enabled, coinKey, coinAmount });
    }
  }, [enabled, coinKey, coinAmount, onConfigChange]);

  return (
    <div className="keyboard-coin-settings">
      <h3>Keyboard Coin Input</h3>
      <div className="setting-row">
        <label>Enable Keyboard Coin</label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
      </div>
      <div className="setting-row">
        <label>Coin Key</label>
        <div className="key-input-row">
          <input
            type="text"
            value={coinKey}
            readOnly
            className="key-display"
          />
          <button
            onClick={() => setIsListening(true)}
            disabled={isListening}
          >
            {isListening ? 'Press a key...' : 'Change Key'}
          </button>
        </div>
      </div>
      <div className="setting-row">
        <label>Coins per Press</label>
        <input
          type="number"
          min={1}
          max={99}
          value={coinAmount}
          onChange={(e) => setCoinAmount(Number(e.target.value))}
        />
      </div>
    </div>
  );
};
