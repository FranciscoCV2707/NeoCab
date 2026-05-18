import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './SessionConfig.css';

interface SessionConfigProps {
  systemName?: string;
}

export const SessionConfig: React.FC<SessionConfigProps> = ({ systemName }) => {
  const [mode, setMode] = useState('timed');
  const [arcadeConfig, setArcadeConfig] = useState({
    coins_per_credit: 1,
    time_per_credit_minutes: 3,
    max_credits: 99,
    free_play: false,
    continue_cost: 1,
    max_continues: 5,
  });
  const [timedConfig, setTimedConfig] = useState({
    minutes_per_credit: 5,
    max_time_minutes: 60,
    warning_at_minutes: 2,
    pause_allowed: true,
    pause_limit_minutes: 5,
    pause_max_count: 3,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await invoke<string>('session_get_config');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setMode(parsed.config.mode);
        setArcadeConfig(parsed.config.arcade);
        setTimedConfig(parsed.config.timed);
      }
    } catch (err) {
      console.error('Failed to load session config:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const config = {
        mode,
        arcade: arcadeConfig,
        timed: timedConfig,
      };
      await invoke('session_set_config', { config: JSON.stringify(config) });
      setMessage('Configuration saved successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(`Error: ${message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleApplyToSystem = async () => {
    if (!systemName) {
      setMessage('No system selected');
      return;
    }
    try {
      await invoke('session_set_system_mode', { systemName });
      setMessage(`Mode applied to ${systemName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(`Error: ${message}`);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="session-config">
      <h3>Session Configuration</h3>
      {message && <div className={`session-message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</div>}

      <div className="config-section">
        <h4>Game Mode</h4>
        <div className="mode-selector">
          {[
            { key: 'arcade', label: 'Arcade (Credits)', desc: 'Insert coins to play' },
            { key: 'timed', label: 'Timed', desc: 'Credits give time' },
            { key: 'unlimited', label: 'Unlimited', desc: 'No restrictions' },
            { key: 'token', label: 'Token', desc: 'Token-based system' },
          ].map(m => (
            <button
              key={m.key}
              className={`mode-option ${mode === m.key ? 'active' : ''}`}
              onClick={() => setMode(m.key)}
            >
              <span className="mode-label">{m.label}</span>
              <span className="mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'arcade' && (
        <div className="config-section">
          <h4>Arcade Settings</h4>
          <div className="setting-row">
            <label>Coins per Credit</label>
            <input
              type="number"
              min={1}
              max={10}
              value={arcadeConfig.coins_per_credit}
              onChange={(e) => setArcadeConfig(prev => ({ ...prev, coins_per_credit: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row">
            <label>Time per Credit (minutes)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={arcadeConfig.time_per_credit_minutes}
              onChange={(e) => setArcadeConfig(prev => ({ ...prev, time_per_credit_minutes: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row">
            <label>Max Credits</label>
            <input
              type="number"
              min={1}
              max={999}
              value={arcadeConfig.max_credits}
              onChange={(e) => setArcadeConfig(prev => ({ ...prev, max_credits: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row toggle">
            <label>Free Play</label>
            <input
              type="checkbox"
              checked={arcadeConfig.free_play}
              onChange={(e) => setArcadeConfig(prev => ({ ...prev, free_play: e.target.checked }))}
            />
          </div>
          <div className="setting-row">
            <label>Continue Cost</label>
            <input
              type="number"
              min={1}
              max={10}
              value={arcadeConfig.continue_cost}
              onChange={(e) => setArcadeConfig(prev => ({ ...prev, continue_cost: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row">
            <label>Max Continues</label>
            <input
              type="number"
              min={0}
              max={20}
              value={arcadeConfig.max_continues}
              onChange={(e) => setArcadeConfig(prev => ({ ...prev, max_continues: Number(e.target.value) }))}
            />
          </div>
        </div>
      )}

      {mode === 'timed' && (
        <div className="config-section">
          <h4>Timed Settings</h4>
          <div className="setting-row">
            <label>Minutes per Credit</label>
            <input
              type="number"
              min={1}
              max={120}
              value={timedConfig.minutes_per_credit}
              onChange={(e) => setTimedConfig(prev => ({ ...prev, minutes_per_credit: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row">
            <label>Max Time (minutes)</label>
            <input
              type="number"
              min={5}
              max={240}
              value={timedConfig.max_time_minutes}
              onChange={(e) => setTimedConfig(prev => ({ ...prev, max_time_minutes: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row">
            <label>Warning at (minutes)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={timedConfig.warning_at_minutes}
              onChange={(e) => setTimedConfig(prev => ({ ...prev, warning_at_minutes: Number(e.target.value) }))}
            />
          </div>
          <div className="setting-row toggle">
            <label>Pause Allowed</label>
            <input
              type="checkbox"
              checked={timedConfig.pause_allowed}
              onChange={(e) => setTimedConfig(prev => ({ ...prev, pause_allowed: e.target.checked }))}
            />
          </div>
          {timedConfig.pause_allowed && (
            <>
              <div className="setting-row">
                <label>Pause Limit (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={timedConfig.pause_limit_minutes}
                  onChange={(e) => setTimedConfig(prev => ({ ...prev, pause_limit_minutes: Number(e.target.value) }))}
                />
              </div>
              <div className="setting-row">
                <label>Max Pauses</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={timedConfig.pause_max_count}
                  onChange={(e) => setTimedConfig(prev => ({ ...prev, pause_max_count: Number(e.target.value) }))}
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className="config-actions">
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {systemName && (
          <button className="btn-apply" onClick={handleApplyToSystem}>
            Apply to {systemName}
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionConfig;
