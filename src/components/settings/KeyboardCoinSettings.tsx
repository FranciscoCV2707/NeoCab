import React, { useState } from 'react';
import { useKeyboardCoinInput } from '../../hooks/useKeyboardCoinInput';
import './KeyboardCoinSettings.css';

interface KeyboardCoinSettingsProps {
  onConfigChange?: (config: {
    enabled: boolean;
    coinKey: string;
    coinAmount: number;
  }) => void;
}

export const KeyboardCoinSettings: React.FC<KeyboardCoinSettingsProps> = ({
  onConfigChange,
}) => {
  const { config, updateConfig, lastCoinAdded, error } =
    useKeyboardCoinInput();
  const [listeningForKey, setListeningForKey] = useState(false);
  const [tempKey, setTempKey] = useState<string | null>(null);

  const handleEnableToggle = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    updateConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleCoinAmountChange = (amount: number) => {
    const newConfig = { ...config, coinAmount: Math.max(1, amount) };
    updateConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleStartListening = () => {
    setListeningForKey('');
    setTempKey(null);
    setListeningForKey(true);
  };

  const handleKeyCapture = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const key = e.key;

    if (key === 'Escape') {
      setListeningForKey(false);
      setTempKey(null);
      return;
    }

    setTempKey(key);
  };

  const handleConfirmKey = () => {
    if (tempKey) {
      const newConfig = { ...config, coinKey: tempKey };
      updateConfig(newConfig);
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
    }
    setListeningForKey(false);
    setTempKey(null);
  };

  const handleCancelKey = () => {
    setListeningForKey(false);
    setTempKey(null);
  };

  return (
    <div className="keyboard-coin-settings">
      <h3 className="settings-title">Keyboard Coin Input</h3>

      <div className="settings-group">
        <div className="setting-row">
          <label className="setting-label">Enable Keyboard Coins</label>
          <input
            type="checkbox"
            className="setting-checkbox"
            checked={config.enabled}
            onChange={handleEnableToggle}
          />
        </div>

        {config.enabled && (
          <>
            <div className="setting-row">
              <label className="setting-label">Coin Key</label>
              {!listeningForKey ? (
                <div className="key-display">
                  <span className="key-value">{config.coinKey}</span>
                  <button
                    className="key-button"
                    onClick={handleStartListening}
                  >
                    Change Key
                  </button>
                </div>
              ) : (
                <div className="key-listener">
                  <div className="listener-message">
                    Press a key to assign as coin input
                    {tempKey && (
                      <span className="temp-key">
                        {' '}
                        (Pressed: <strong>{tempKey}</strong>)
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    autoFocus
                    onKeyDown={handleKeyCapture}
                    onBlur={() => setListeningForKey(false)}
                    style={{ display: 'none' }}
                  />
                  <div className="listener-buttons">
                    <button
                      className="confirm-button"
                      onClick={handleConfirmKey}
                      disabled={!tempKey}
                    >
                      Confirm
                    </button>
                    <button
                      className="cancel-button"
                      onClick={handleCancelKey}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="setting-row">
              <label className="setting-label">Coins per Press</label>
              <div className="amount-control">
                <button
                  className="amount-button"
                  onClick={() => handleCoinAmountChange(config.coinAmount - 1)}
                  disabled={config.coinAmount <= 1}
                >
                  −
                </button>
                <span className="amount-value">{config.coinAmount}</span>
                <button
                  className="amount-button"
                  onClick={() => handleCoinAmountChange(config.coinAmount + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {lastCoinAdded && (
              <div className="coin-added-indicator">
                ✓ Coin added!
              </div>
            )}
          </>
        )}

        {error && <div className="setting-error">{error}</div>}
      </div>

      <div className="settings-info">
        <p>Press the configured key to add coins during gameplay.</p>
        <p className="info-small">
          Default key is <strong>5</strong> (common arcade coin key).
        </p>
      </div>
    </div>
  );
};

export default KeyboardCoinSettings;
