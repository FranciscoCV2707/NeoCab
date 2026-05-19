import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from '../../i18n';
import './KioskSettingsPanel.css';

interface KioskInfo {
    kiosk: boolean;
    autoboot_system: string | null;
    autoboot_delay: number;
    disable_settings: boolean;
    disable_shutdown: boolean;
    disable_reboot: boolean;
    disable_appclose: boolean;
    disable_suspend: boolean;
}

const SYSTEMS = ['mame', 'nes', 'snes', 'genesis', 'psx', 'n64', 'gba', 'gb', 'saturn', 'dreamcast'];

export const KioskSettingsPanel: React.FC = () => {
    useTranslation();
    const [config, setConfig] = useState<KioskInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const result = await invoke<string>('get_kiosk_config');
            const data = typeof result === 'string' ? JSON.parse(result) : result;
            setConfig(data);
        } catch (err) {
            console.error('Failed to load kiosk config:', err);
            setConfig({
                kiosk: false,
                autoboot_system: null,
                autoboot_delay: 30,
                disable_settings: false,
                disable_shutdown: false,
                disable_reboot: false,
                disable_appclose: false,
                disable_suspend: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        if (!config) return;
        setSaving(true);
        setMessage('');
        try {
            await invoke('save_kiosk_config', { config });
            setMessage('Configuración guardada');
        } catch (err) {
            console.error('Failed to save kiosk config:', err);
            setMessage('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (key: keyof KioskInfo, value: any) => {
        if (!config) return;
        setConfig({ ...config, [key]: value });
    };

    if (loading) {
        return <div className="kiosk-panel"><p>Cargando configuración...</p></div>;
    }

    return (
        <div className="kiosk-panel">
            <div className="panel-header">
                <h3>Configuración Kiosk</h3>
                {message && <span className="message">{message}</span>}
            </div>

            <div className="config-section">
                <h4>Modo Kiosk</h4>
                <div className="toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={config?.kiosk ?? false}
                            onChange={(e) => updateConfig('kiosk', e.target.checked)}
                        />
                        Habilitar modo kiosk
                    </label>
                    <span className="hint">Desactiva los botones de control del operador</span>
                </div>
            </div>

            <div className="config-section">
                <h4>Autoboot</h4>
                <div className="field">
                    <label>Sistema para autoboot</label>
                    <select
                        value={config?.autoboot_system ?? ''}
                        onChange={(e) => updateConfig('autoboot_system', e.target.value || null)}
                    >
                        <option value="">Ninguno</option>
                        {SYSTEMS.map(sys => (
                            <option key={sys} value={sys}>{sys.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Delay (segundos)</label>
                    <input
                        type="number"
                        min={5}
                        max={300}
                        value={config?.autoboot_delay ?? 30}
                        onChange={(e) => updateConfig('autoboot_delay', parseInt(e.target.value) || 30)}
                    />
                </div>
            </div>

            <div className="config-section">
                <h4>Restricciones</h4>
                <div className="toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={config?.disable_settings ?? false}
                            onChange={(e) => updateConfig('disable_settings', e.target.checked)}
                        />
                        Desactivar acceso a Settings
                    </label>
                </div>
                <div className="toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={config?.disable_shutdown ?? false}
                            onChange={(e) => updateConfig('disable_shutdown', e.target.checked)}
                        />
                        Desactivar Apagar
                    </label>
                </div>
                <div className="toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={config?.disable_reboot ?? false}
                            onChange={(e) => updateConfig('disable_reboot', e.target.checked)}
                        />
                        Desactivar Reiniciar
                    </label>
                </div>
                <div className="toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={config?.disable_appclose ?? false}
                            onChange={(e) => updateConfig('disable_appclose', e.target.checked)}
                        />
                        Desactivar Cerrar App
                    </label>
                </div>
                <div className="toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={config?.disable_suspend ?? false}
                            onChange={(e) => updateConfig('disable_suspend', e.target.checked)}
                        />
                        Desactivar Suspender
                    </label>
                </div>
            </div>

            <div className="config-buttons">
                <button onClick={saveConfig} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
                <button onClick={loadConfig} className="secondary">
                    Recargar
                </button>
            </div>
        </div>
    );
};