import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from '../../i18n';
import { toast } from '../../stores/useNotificationStore';
import './ConfigInjectorPanel.css';

interface InjectorInfo {
  name: string;
  display_name: string;
}

interface EmulatorConfig {
  video?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  input?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
}

export function ConfigInjectorPanel() {
  const { t } = useTranslation();
  const [injectors, setInjectors] = useState<InjectorInfo[]>([]);
  const [selectedInjector, setSelectedInjector] = useState<string | null>(null);
  const [emulatorPath, setEmulatorPath] = useState('');
  const [config, setConfig] = useState<EmulatorConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInjectors();
  }, []);

  const loadInjectors = async () => {
    try {
      const result = await invoke<InjectorInfo[]>('list_config_injectors');
      setInjectors(result);
    } catch (e) {
      console.error('Failed to load injectors:', e);
    }
  };

  const handleDetect = useCallback(async () => {
    if (!emulatorPath.trim()) {
      toast.error('Error', 'Please enter an emulator path');
      return;
    }

    setLoading(true);
    try {
      const result = await invoke<string>('detect_config_injector', { emulatorPath });
      const data = JSON.parse(result);
      if (data.found) {
        setSelectedInjector(data.name);
        toast.success('Detected', `${data.display_name} detected`);
      } else {
        toast.error('Not found', 'No config injector found for this emulator');
      }
    } catch (e) {
      toast.error('Error', String(e));
    } finally {
      setLoading(false);
    }
  }, [emulatorPath]);

  const handleReadConfig = useCallback(async () => {
    if (!selectedInjector || !emulatorPath.trim()) return;

    setLoading(true);
    try {
      const result = await invoke<string>('read_emulator_config', {
        emulatorPath,
        configDir: null,
      });
      setConfig(JSON.parse(result));
    } catch (e) {
      toast.error('Error', String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedInjector, emulatorPath]);

  const handleInject = useCallback(async () => {
    if (!selectedInjector || !config) return;

    setSaving(true);
    try {
      await invoke('inject_emulator_config', {
        emulatorPath,
        configDir: null,
        settingsJson: JSON.stringify(config),
      });
      toast.success('Success', 'Configuration injected successfully');
    } catch (e) {
      toast.error('Error', String(e));
    } finally {
      setSaving(false);
    }
  }, [selectedInjector, emulatorPath, config]);

  return (
    <div className="config-injector-panel">
      <div className="panel-header">
        <h3>{t('config_injector.title') || 'Emulator Configuration'}</h3>
      </div>

      <div className="injector-selector">
        <label>{t('config_injector.select_injector') || 'Select Emulator'}</label>
        <select
          value={selectedInjector || ''}
          onChange={(e) => setSelectedInjector(e.target.value || null)}
        >
          <option value="">-- {t('config_injector.select') || 'Select'} --</option>
          {injectors.map((inj) => (
            <option key={inj.name} value={inj.name}>
              {inj.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="emulator-path">
        <label>{t('config_injector.emulator_path') || 'Emulator Path'}</label>
        <div className="path-input">
          <input
            type="text"
            value={emulatorPath}
            onChange={(e) => setEmulatorPath(e.target.value)}
            placeholder={t('config_injector.path_placeholder') || 'C:\\path\\to\\emulator.exe'}
          />
          <button onClick={handleDetect} disabled={loading}>
            {loading ? '...' : t('config_injector.detect') || 'Detect'}
          </button>
        </div>
      </div>

      {selectedInjector && (
        <div className="config-actions">
          <button onClick={handleReadConfig} disabled={loading || !emulatorPath.trim()}>
            {loading ? '...' : t('config_injector.read_config') || 'Read Current Config'}
          </button>
        </div>
      )}

      {config && (
        <div className="config-editor">
          <h4>{t('config_injector.current_config') || 'Current Configuration'}</h4>
          <div className="config-sections">
            {config.video && (
              <div className="config-section">
                <h5>{t('config_injector.video') || 'Video'}</h5>
                <pre>{JSON.stringify(config.video, null, 2)}</pre>
              </div>
            )}
            {config.audio && (
              <div className="config-section">
                <h5>{t('config_injector.audio') || 'Audio'}</h5>
                <pre>{JSON.stringify(config.audio, null, 2)}</pre>
              </div>
            )}
            {config.input && (
              <div className="config-section">
                <h5>{t('config_injector.input') || 'Input'}</h5>
                <pre>{JSON.stringify(config.input, null, 2)}</pre>
              </div>
            )}
            {config.advanced && (
              <div className="config-section">
                <h5>{t('config_injector.advanced') || 'Advanced'}</h5>
                <pre>{JSON.stringify(config.advanced, null, 2)}</pre>
              </div>
            )}
          </div>
          <button className="inject-btn" onClick={handleInject} disabled={saving}>
            {saving ? '...' : t('config_injector.inject') || 'Inject Configuration'}
          </button>
        </div>
      )}
    </div>
  );
}