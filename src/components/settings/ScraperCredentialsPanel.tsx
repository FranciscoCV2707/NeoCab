import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ScraperConfig {
    ss_dev_id: string;
    ss_dev_password: string;
    ss_user: string;
    ss_password: string;
    tgdb_api_key: string;
    ss_configured: boolean;
    tgdb_configured: boolean;
}

const PLACEHOLDER = '••••••••';

export const ScraperCredentialsPanel: React.FC = () => {
    const [config, setConfig] = useState<ScraperConfig>({
        ss_dev_id: '',
        ss_dev_password: '',
        ss_user: '',
        ss_password: '',
        tgdb_api_key: '',
        ss_configured: false,
        tgdb_configured: false,
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        invoke<ScraperConfig>('get_scraper_config')
            .then(setConfig)
            .catch(console.error);
    }, []);

    const handleChange = (field: keyof ScraperConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await invoke('save_scraper_config', {
                ssDevId: config.ss_dev_id,
                ssDevPassword: config.ss_dev_password,
                ssUser: config.ss_user,
                ssPassword: config.ss_password,
                tgdbApiKey: config.tgdb_api_key,
            });
            setMessage({ text: 'Credenciales guardadas correctamente.', ok: true });
            const updated = await invoke<ScraperConfig>('get_scraper_config');
            setConfig(updated);
        } catch (err) {
            setMessage({ text: String(err), ok: false });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="scraper-credentials-panel" style={{ maxWidth: 540 }}>
            <p style={{ marginBottom: 16, opacity: 0.7, fontSize: 13 }}>
                El scraper busca metadata e imágenes en este orden:<br />
                <strong>ScreenScraper</strong> → <strong>ArcadeDB</strong> (solo MAME, sin credenciales) → <strong>TheGamesDB</strong> → nombre del archivo.
            </p>

            <section style={{ marginBottom: 24 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    ScreenScraper
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: config.ss_configured ? '#2a5' : '#555' }}>
                        {config.ss_configured ? 'Configurado' : 'Sin configurar'}
                    </span>
                </h4>
                <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
                    Registro gratuito en screenscraper.fr — cubre más de 230.000 juegos con covers, videos y más.
                </p>
                <label>Dev ID (nombre de la app)</label>
                <input
                    type="text"
                    value={config.ss_dev_id}
                    onChange={handleChange('ss_dev_id')}
                    placeholder="MiAplicacion"
                    style={inputStyle}
                />
                <label>Dev Password</label>
                <input
                    type="password"
                    value={config.ss_dev_password}
                    onChange={handleChange('ss_dev_password')}
                    placeholder={config.ss_configured ? PLACEHOLDER : 'contraseña_dev'}
                    style={inputStyle}
                />
                <label>Usuario (cuenta personal)</label>
                <input
                    type="text"
                    value={config.ss_user}
                    onChange={handleChange('ss_user')}
                    placeholder="tu_usuario"
                    style={inputStyle}
                />
                <label>Contraseña personal</label>
                <input
                    type="password"
                    value={config.ss_password}
                    onChange={handleChange('ss_password')}
                    placeholder={config.ss_configured ? PLACEHOLDER : 'tu_contraseña'}
                    style={inputStyle}
                />
            </section>

            <section style={{ marginBottom: 24 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    TheGamesDB
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: config.tgdb_configured ? '#2a5' : '#555' }}>
                        {config.tgdb_configured ? 'Configurado' : 'Sin configurar'}
                    </span>
                </h4>
                <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
                    API key gratuita en thegamesdb.net — buen complemento para consolas.
                </p>
                <label>API Key</label>
                <input
                    type="password"
                    value={config.tgdb_api_key}
                    onChange={handleChange('tgdb_api_key')}
                    placeholder={config.tgdb_configured ? PLACEHOLDER : 'tu_api_key'}
                    style={inputStyle}
                />
            </section>

            {message && (
                <p style={{ color: message.ok ? '#4c4' : '#f66', marginBottom: 12, fontSize: 13 }}>
                    {message.text}
                </p>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 20px', cursor: saving ? 'wait' : 'pointer' }}
            >
                {saving ? 'Guardando…' : 'Guardar credenciales'}
            </button>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    marginBottom: 10,
    padding: '6px 8px',
    background: '#1a1a2e',
    border: '1px solid #444',
    borderRadius: 4,
    color: '#eee',
    fontSize: 13,
    boxSizing: 'border-box',
};
