import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LaunchScriptEditor } from './LaunchScriptEditor';
import './SystemManager.css';

interface SystemConfig {
  system: string;
  mode: 'arcade' | 'console' | 'timed_free';
  coins_per_time: number;
  max_time: number;
  show_overlay: boolean;
  warn_before: number;
  auto_exit: boolean;
  rom_path?: string;
  bios_path?: string;
  pre_launch_script?: string;
  post_launch_script?: string;
}

export const SystemManager: React.FC = () => {
  const [systems, setSystems] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [editingScripts, setEditingScripts] = useState<string | null>(null);
  const [showAddSystem, setShowAddSystem] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      setLoading(true);
      const result = await invoke<string>('get_all_system_configs');
      const parsed = JSON.parse(result) as SystemConfig[];
      setSystems(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to load systems: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async (config: SystemConfig) => {
    try {
      setLoading(true);
      await invoke<string>('save_system_config', {
        system: config.system,
        config,
      });
      setEditingSystem(null);
      loadSystems();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to save system: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSystem = async (systemName: string) => {
    if (!confirm(`¿Eliminar sistema "${systemName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setSystems(systems.filter((s) => s.system !== systemName));
      // Note: No delete command exists yet, would need to be implemented in backend
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete system: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSystem = async () => {
    if (!newSystemName.trim()) {
      setError('El nombre del sistema no puede estar vacío');
      return;
    }

    const newConfig: SystemConfig = {
      system: newSystemName,
      mode: 'arcade',
      coins_per_time: 180,
      max_time: 540,
      show_overlay: true,
      warn_before: 30,
      auto_exit: true,
      pre_launch_script: undefined,
      post_launch_script: undefined,
    };

    try {
      setLoading(true);
      await invoke<string>('save_system_config', {
        system: newSystemName,
        config: newConfig,
      });
      setNewSystemName('');
      setShowAddSystem(false);
      loadSystems();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to add system: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScripts = async (systemName: string, pre: string, post: string) => {
    try {
      setLoading(true);
      const system = systems.find((s) => s.system === systemName);
      if (system) {
        const updated: SystemConfig = {
          ...system,
          pre_launch_script: pre || undefined,
          post_launch_script: post || undefined,
        };
        await invoke<string>('save_system_config', {
          system: systemName,
          config: updated,
        });
        setEditingScripts(null);
        loadSystems();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to save scripts: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="system-manager">
      <div className="system-manager-header">
        <h3>🎮 Gestión de Sistemas</h3>
        <button
          className="btn-add-system"
          onClick={() => setShowAddSystem(!showAddSystem)}
          disabled={loading}
        >
          {showAddSystem ? '✕ Cancelar' : '+ Agregar Sistema'}
        </button>
      </div>

      {error && <div className="system-error">{error}</div>}

      {showAddSystem && (
        <div className="add-system-form">
          <input
            type="text"
            placeholder="Nombre del sistema (ej: MAME, SNES, PSX)"
            value={newSystemName}
            onChange={(e) => setNewSystemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddSystem();
            }}
          />
          <button onClick={handleAddSystem} disabled={loading || !newSystemName.trim()}>
            {loading ? 'Guardando...' : 'Crear Sistema'}
          </button>
        </div>
      )}

      {loading && !showAddSystem && <div className="system-loading">Cargando sistemas...</div>}

      <div className="systems-list">
        {systems.length === 0 ? (
          <div className="no-systems">No hay sistemas configurados. Agrega uno para comenzar.</div>
        ) : (
          systems.map((system) => (
            <div key={system.system} className="system-card">
              <div className="system-card-header">
                <h4>{system.system}</h4>
                <span className={`system-mode-badge mode-${system.mode}`}>{system.mode}</span>
              </div>

              {editingSystem === system.system ? (
                <SystemConfigEditor
                  config={system}
                  onSave={handleSaveSystem}
                  onCancel={() => setEditingSystem(null)}
                />
              ) : editingScripts === system.system ? (
                <LaunchScriptEditor
                  systemName={system.system}
                  preScript={system.pre_launch_script}
                  postScript={system.post_launch_script}
                  onSave={(pre, post) => handleSaveScripts(system.system, pre, post)}
                  onCancel={() => setEditingScripts(null)}
                />
              ) : (
                <div className="system-card-content">
                  <div className="system-stat">
                    <label>Monedas por tiempo:</label>
                    <span>{system.coins_per_time}s</span>
                  </div>
                  <div className="system-stat">
                    <label>Tiempo máximo:</label>
                    <span>{system.max_time}s</span>
                  </div>
                  <div className="system-stat">
                    <label>Ruta ROM:</label>
                    <span className="system-path">{system.rom_path || 'No configurada'}</span>
                  </div>
                  {(system.pre_launch_script || system.post_launch_script) && (
                    <div className="system-stat scripts-indicator">
                      <label>Scripts:</label>
                      <span className="script-badge">⚙️ Configurados</span>
                    </div>
                  )}
                  <div className="system-actions">
                    <button
                      className="btn-edit"
                      onClick={() => setEditingSystem(system.system)}
                      disabled={loading}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-scripts"
                      onClick={() => setEditingScripts(system.system)}
                      disabled={loading}
                    >
                      ⚙️ Scripts
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteSystem(system.system)}
                      disabled={loading}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface SystemConfigEditorProps {
  config: SystemConfig;
  onSave: (config: SystemConfig) => Promise<void>;
  onCancel: () => void;
}

const SystemConfigEditor: React.FC<SystemConfigEditorProps> = ({
  config,
  onSave,
  onCancel,
}) => {
  const [editedConfig, setEditedConfig] = useState(config);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedConfig);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="system-config-editor">
      <div className="config-section">
        <label>Modo de Juego:</label>
        <select
          value={editedConfig.mode}
          onChange={(e) =>
            setEditedConfig({ ...editedConfig, mode: e.target.value as any })
          }
        >
          <option value="arcade">Arcade (3 min)</option>
          <option value="console">Consola (5 min)</option>
          <option value="timed_free">Tiempo Libre (10 min)</option>
        </select>
      </div>

      <div className="config-section">
        <label>Ruta ROM:</label>
        <input
          type="text"
          value={editedConfig.rom_path || ''}
          onChange={(e) =>
            setEditedConfig({ ...editedConfig, rom_path: e.target.value || undefined })
          }
          placeholder="ej: C:\roms\mame o /home/user/roms/snes"
        />
      </div>

      <div className="config-section">
        <label>Ruta BIOS:</label>
        <input
          type="text"
          value={editedConfig.bios_path || ''}
          onChange={(e) =>
            setEditedConfig({ ...editedConfig, bios_path: e.target.value || undefined })
          }
          placeholder="ej: C:\bios o /home/user/.mame/bios"
        />
      </div>

      <div className="config-section">
        <label>
          <input
            type="checkbox"
            checked={editedConfig.auto_exit}
            onChange={(e) =>
              setEditedConfig({ ...editedConfig, auto_exit: e.target.checked })
            }
          />
          Auto-cerrar al salir del emulador
        </label>
      </div>

      <div className="config-actions">
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : '✓ Guardar'}
        </button>
        <button className="btn-cancel" onClick={onCancel} disabled={saving}>
          ✕ Cancelar
        </button>
      </div>
    </div>
  );
};
