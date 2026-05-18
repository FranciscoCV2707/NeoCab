import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from '../../i18n';
import './PluginsPanel.css';

interface Plugin {
    name: string;
    author: string | null;
    version: string | null;
    description: string | null;
    enabled: boolean;
    hooks: string[];
}

export const PluginsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

    useEffect(() => {
        loadPlugins();
    }, []);

    const loadPlugins = async () => {
        setLoading(true);
        try {
            const result = await invoke<string>('plugin_list');
            const data = JSON.parse(result);
            setPlugins(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load plugins:', err);
            setPlugins([]);
        } finally {
            setLoading(false);
        }
    };

    const togglePlugin = async (name: string, enabled: boolean) => {
        try {
            await invoke('plugin_set_enabled', { name, enabled: !enabled });
            setPlugins(prev => prev.map(p => p.name === name ? { ...p, enabled: !enabled } : p));
        } catch (err) {
            console.error('Failed to toggle plugin:', err);
        }
    };

    const deletePlugin = async (name: string) => {
        if (!confirm(`Delete plugin "${name}"?`)) return;
        try {
            await invoke('plugin_delete', { name });
            setPlugins(prev => prev.filter(p => p.name !== name));
            if (selectedPlugin?.name === name) setSelectedPlugin(null);
        } catch (err) {
            console.error('Failed to delete plugin:', err);
        }
    };

    const discoverPlugins = async () => {
        try {
            await invoke('plugin_discover');
            await loadPlugins();
        } catch (err) {
            console.error('Failed to discover plugins:', err);
        }
    };

    if (loading) {
        return <div className="plugins-panel"><p>Cargando plugins...</p></div>;
    }

    return (
        <div className="plugins-panel">
            <div className="panel-header">
                <h3>Plugins Lua</h3>
                <button className="discover-btn" onClick={discoverPlugins}>🔍 Descubrir</button>
            </div>

            {plugins.length === 0 ? (
                <div className="empty-state">
                    <p>No hay plugins instalados.</p>
                    <p className="hint">Coloca archivos .lua en la carpeta data/plugins/</p>
                </div>
            ) : (
                <div className="plugins-list">
                    {plugins.map(plugin => (
                        <div
                            key={plugin.name}
                            className={`plugin-card ${selectedPlugin?.name === plugin.name ? 'selected' : ''}`}
                            onClick={() => setSelectedPlugin(plugin)}
                        >
                            <div className="plugin-icon">📜</div>
                            <div className="plugin-info">
                                <span className="plugin-name">{plugin.name}</span>
                                {plugin.author && <span className="plugin-author">by {plugin.author}</span>}
                                {plugin.version && <span className="plugin-version">v{plugin.version}</span>}
                            </div>
                            <div className="plugin-toggle">
                                <button
                                    className={`toggle-btn ${plugin.enabled ? 'enabled' : 'disabled'}`}
                                    onClick={(e) => { e.stopPropagation(); togglePlugin(plugin.name, plugin.enabled); }}
                                >
                                    {plugin.enabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPlugin && (
                <div className="plugin-details">
                    <h4>Detalles: {selectedPlugin.name}</h4>
                    <div className="detail-row">
                        <label>Autor:</label>
                        <span>{selectedPlugin.author || 'Desconocido'}</span>
                    </div>
                    <div className="detail-row">
                        <label>Versión:</label>
                        <span>{selectedPlugin.version || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <label>Descripción:</label>
                        <span>{selectedPlugin.description || 'Sin descripción'}</span>
                    </div>
                    <div className="detail-row">
                        <label>Hooks:</label>
                        <span>{selectedPlugin.hooks.length > 0 ? selectedPlugin.hooks.join(', ') : 'Ninguno'}</span>
                    </div>
                    <div className="detail-buttons">
                        <button onClick={() => deletePlugin(selectedPlugin.name)} className="delete-btn">Eliminar</button>
                        <button onClick={() => setSelectedPlugin(null)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};