import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './EmulatorStatus.css';

interface EmulatorInfo {
  name: string;
  path?: string;
  installed: boolean;
}

export const EmulatorStatus: React.FC = () => {
  const [emulators, setEmulators] = useState<EmulatorInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectEmulators();
  }, []);

  const detectEmulators = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<string>('detect_emulators');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setEmulators(parsed.emulators || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect emulators');
    } finally {
      setLoading(false);
    }
  };

  const installed = emulators.filter(e => e.installed);
  const missing = emulators.filter(e => !e.installed);

  return (
    <div className="emulator-status">
      <h3>Emulator Status</h3>
      {error && <div className="error">{error}</div>}
      <button onClick={detectEmulators} disabled={loading}>
        {loading ? 'Detecting...' : 'Detect Emulators'}
      </button>
      <div className="emulator-list">
        <h4>Installed ({installed.length})</h4>
        {installed.map((emu) => (
          <div key={emu.name} className="emulator-item installed">
            <span className="emulator-name">{emu.name}</span>
            <span className="emulator-path">{emu.path}</span>
          </div>
        ))}
        <h4>Missing ({missing.length})</h4>
        {missing.map((emu) => (
          <div key={emu.name} className="emulator-item missing">
            <span className="emulator-name">{emu.name}</span>
            <span>Not found</span>
          </div>
        ))}
      </div>
    </div>
  );
};
