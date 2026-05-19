import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface EmulatorInfo {
  id: string;
  name: string;
  default_exe: string;
  systems: string[];
  configured_path: string;
  path_exists: boolean;
}

export const EmulatorSetupPanel: React.FC = () => {
  const [emulators, setEmulators] = useState<EmulatorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [detecting, setDetecting] = useState<string | null>(null);
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    loadEmulators();
  }, []);

  const loadEmulators = async () => {
    try {
      const result = await invoke<{ emulators: EmulatorInfo[] }>('get_emulator_info_list');
      setEmulators(result.emulators);
      const initial: Record<string, string> = {};
      result.emulators.forEach(e => { initial[e.id] = e.configured_path; });
      setPaths(initial);
    } catch (err) {
      console.error('Failed to load emulators:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePath = async (id: string) => {
    setSaving(id);
    try {
      await invoke('set_emulator_path', { id, path: paths[id] ?? '' });
      setStatus(`Guardado: ${id}`);
      await loadEmulators();
    } catch (err) {
      setStatus(`Error al guardar: ${err}`);
    } finally {
      setSaving(null);
    }
  };

  const browsePath = async (id: string) => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Ejecutable', extensions: ['exe'] }],
      });
      if (selected && typeof selected === 'string') {
        setPaths(prev => ({ ...prev, [id]: selected }));
      }
    } catch {
      // Dialog cancelled
    }
  };

  const detectPath = async (id: string) => {
    setDetecting(id);
    try {
      const found = await invoke<string>('detect_emulator_path', { id });
      if (found) {
        setPaths(prev => ({ ...prev, [id]: found }));
        setStatus(`Detectado: ${found}`);
      } else {
        setStatus(`No se encontro ${id} automaticamente`);
      }
    } catch (err) {
      setStatus(`Error al detectar: ${err}`);
    } finally {
      setDetecting(null);
    }
  };

  const clearPath = async (id: string) => {
    setPaths(prev => ({ ...prev, [id]: '' }));
    await invoke('set_emulator_path', { id, path: '' }).catch(() => {});
    await loadEmulators();
  };

  if (loading) return <div className="tab-pane"><p>Cargando emuladores...</p></div>;

  return (
    <div className="tab-pane">
      <p style={{ opacity: 0.7, marginBottom: 20, fontSize: 13 }}>
        Configura la ruta al ejecutable de cada emulador. Si el emulador esta en el PATH del
        sistema o en una carpeta estandar, usa <strong>Detectar</strong>. Usa <strong>Examinar</strong> para
        buscarlo manualmente. Deja vacio para usar el nombre por defecto (debe estar en PATH).
      </p>

      {status && (
        <div
          className="status-bar"
          style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6, fontSize: 13 }}
          onClick={() => setStatus(null)}
        >
          {status} <span style={{ opacity: 0.4, marginLeft: 8, cursor: 'pointer' }}>x</span>
        </div>
      )}

      <div className="emulator-grid">
        {emulators.map(emu => {
          const currentPath = paths[emu.id] ?? '';
          const isDirty = currentPath !== emu.configured_path;
          const statusColor = emu.path_exists
            ? 'var(--success, #4caf50)'
            : currentPath
            ? 'var(--warning, #ff9800)'
            : 'var(--text-muted, #666)';

          return (
            <div key={emu.id} className="emulator-card">
              <div className="emulator-card-header">
                <span className="emulator-name">{emu.name}</span>
                <span
                  className="emulator-status-dot"
                  style={{ background: statusColor }}
                  title={
                    emu.path_exists
                      ? 'Ejecutable encontrado'
                      : currentPath
                      ? 'Ruta configurada pero no verificada'
                      : 'Sin configurar (usa nombre por defecto)'
                  }
                />
              </div>

              <div className="emulator-systems">
                {emu.systems.map(s => (
                  <span key={s} className="system-tag">{s}</span>
                ))}
              </div>

              <div style={{ fontSize: 11, opacity: 0.45, marginBottom: 8 }}>
                Por defecto: {emu.default_exe}
              </div>

              <div className="emulator-path-row">
                <input
                  type="text"
                  className="path-input"
                  value={currentPath}
                  placeholder={`(usar ${emu.default_exe} del PATH)`}
                  onChange={e => setPaths(prev => ({ ...prev, [emu.id]: e.target.value }))}
                />
                <button
                  className="path-btn"
                  title="Buscar archivo"
                  onClick={() => browsePath(emu.id)}
                >
                  ...
                </button>
              </div>

              <div className="emulator-actions">
                <button
                  className="action-btn detect-btn"
                  onClick={() => detectPath(emu.id)}
                  disabled={detecting === emu.id}
                >
                  {detecting === emu.id ? 'Buscando...' : 'Detectar'}
                </button>
                {currentPath && (
                  <button
                    className="action-btn clear-btn"
                    onClick={() => clearPath(emu.id)}
                    title="Eliminar ruta configurada"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  className="action-btn save-btn"
                  onClick={() => savePath(emu.id)}
                  disabled={saving === emu.id || !isDirty}
                  style={{ marginLeft: 'auto' }}
                >
                  {saving === emu.id ? 'Guardando...' : isDirty ? 'Guardar *' : 'Guardado'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
