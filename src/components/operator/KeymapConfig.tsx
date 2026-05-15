import { useState, useCallback, useRef } from 'react';
import { InputAction, KeymapConfig, DEFAULT_KEYMAP, loadKeymap, saveKeymap } from '../../hooks/useUnifiedInput';
import './KeymapConfig.css';

const ACTION_LABELS: Record<InputAction, string> = {
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  confirm: 'Confirm',
  back: 'Back',
  coin: 'Insert Coin',
  start: 'Start Game',
  pause: 'Pause',
  quick_save: 'Quick Save',
  quick_load: 'Quick Load',
  screenshot: 'Screenshot',
  toggle_menu: 'Toggle Menu',
  page_up: 'Page Up',
  page_down: 'Page Down',
};

export default function KeymapConfigPanel() {
  const [keymap, setKeymap] = useState<KeymapConfig>(loadKeymap);
  const [recording, setRecording] = useState<{ action: InputAction; type: 'keyboard' | 'gamepad' } | null>(null);
  const [activeTab, setActiveTab] = useState<'keyboard' | 'gamepad'>('keyboard');
  const recordingRef = useRef(false);

  const handleStartRecording = useCallback((action: InputAction, type: 'keyboard' | 'gamepad') => {
    setRecording({ action, type });
    recordingRef.current = true;

    if (type === 'keyboard') {
      const handler = (e: KeyboardEvent) => {
        e.preventDefault();
        if (!recordingRef.current) return;
        const current = keymap[type][action] || [];
        const updated = [...current.filter((k: string) => k !== e.key), e.key];
        const newKeymap = { ...keymap, [type]: { ...keymap[type], [action]: updated } };
        setKeymap(newKeymap);
        saveKeymap(newKeymap);
        recordingRef.current = false;
        setRecording(null);
        window.removeEventListener('keydown', handler);
      };
      window.addEventListener('keydown', handler);
    }
  }, [keymap]);

  const handleRemoveKey = useCallback((action: InputAction, type: 'keyboard' | 'gamepad', key: string) => {
    const current = keymap[type][action] || [];
    const updated = current.filter((k: string) => k !== key);
    const newKeymap = { ...keymap, [type]: { ...keymap[type], [action]: updated } };
    setKeymap(newKeymap);
    saveKeymap(newKeymap);
  }, [keymap]);

  const handleReset = useCallback(() => {
    setKeymap(DEFAULT_KEYMAP);
    localStorage.removeItem('neocab_keymap');
  }, []);

  const actions = Object.keys(ACTION_LABELS) as InputAction[];

  return (
    <div className="keymap-config">
      <div className="keymap-header">
        <h2>Input Configuration</h2>
        <div className="keymap-tabs">
          <button
            className={activeTab === 'keyboard' ? 'active' : ''}
            onClick={() => setActiveTab('keyboard')}
          >
            Keyboard
          </button>
          <button
            className={activeTab === 'gamepad' ? 'active' : ''}
            onClick={() => setActiveTab('gamepad')}
          >
            Gamepad
          </button>
        </div>
      </div>

      <div className="keymap-list">
        {actions.map(action => (
          <div key={action} className="keymap-row">
            <span className="keymap-label">{ACTION_LABELS[action]}</span>
            <div className="keymap-keys">
              {(keymap[activeTab][action] || []).map((key: string) => (
                <span key={key} className="key-badge">
                  {key}
                  <button
                    className="key-remove"
                    onClick={() => handleRemoveKey(action, activeTab, key)}
                  >
                    x
                  </button>
                </span>
              ))}
              <button
                className={`key-add ${recording?.action === action && recording?.type === activeTab ? 'recording' : ''}`}
                onClick={() => handleStartRecording(action, activeTab)}
              >
                {recording?.action === action && recording?.type === activeTab ? '...' : '+'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="keymap-footer">
        <button className="btn-reset" onClick={handleReset}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
