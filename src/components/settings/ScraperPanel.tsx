import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface ScraperConfig {
    ss_dev_id: string;
    ss_dev_password: string;
    ss_user: string;
    ss_password: string;
    tgdb_api_key: string;
    ss_configured: boolean;
    tgdb_configured: boolean;
    use_screenscraper: boolean;
    use_arcadedb: boolean;
    use_tgdb: boolean;
}

interface SystemEntry {
    id: number;
    name: string;
    display_name?: string | null;
}

interface ScrapeProgressEvent {
    current: number;
    total: number;
    title: string;
}

const PLACEHOLDER = '••••••••';

export const ScraperPanel: React.FC = () => {
    const [config, setConfig] = useState<ScraperConfig>({
        ss_dev_id: '', ss_dev_password: '', ss_user: '', ss_password: '',
        tgdb_api_key: '', ss_configured: false, tgdb_configured: false,
        use_screenscraper: true, use_arcadedb: true, use_tgdb: true,
    });
    const [systems, setSystems] = useState<SystemEntry[]>([]);
    const [selectedSystem, setSelectedSystem] = useState('');
    const [onlyMissing, setOnlyMissing] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number; title: string } | null>(null);
    const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [scrapeMsg, setScrapeMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const unlisten = useRef<(() => void) | null>(null);

    useEffect(() => {
        invoke<ScraperConfig>('get_scraper_config').then(setConfig).catch(console.error);
        invoke<SystemEntry[]>('list_systems').then(list => {
            setSystems(list);
            if (list.length > 0) setSelectedSystem(list[0].name);
        }).catch(console.error);
        return () => { unlisten.current?.(); };
    }, []);

    const field =
        (key: keyof ScraperConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
            setConfig(prev => ({ ...prev, [key]: e.target.value }));

    const toggle = (key: 'use_screenscraper' | 'use_arcadedb' | 'use_tgdb') =>
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            await invoke('save_scraper_config', {
                ssDevId: config.ss_dev_id,
                ssDevPassword: config.ss_dev_password,
                ssUser: config.ss_user,
                ssPassword: config.ss_password,
                tgdbApiKey: config.tgdb_api_key,
                useScreenscraper: config.use_screenscraper,
                useArcadedb: config.use_arcadedb,
                useTgdb: config.use_tgdb,
            });
            setSaveMsg({ text: 'Configuración guardada.', ok: true });
            const updated = await invoke<ScraperConfig>('get_scraper_config');
            setConfig(updated);
        } catch (err) {
            setSaveMsg({ text: String(err), ok: false });
        } finally {
            setSaving(false);
        }
    };

    const handleScrape = async () => {
        if (!selectedSystem) return;
        setScraping(true);
        setProgress({ current: 0, total: 0, title: 'Iniciando…' });
        setScrapeMsg(null);

        unlisten.current = await listen<ScrapeProgressEvent>('scrape_progress', ev => {
            setProgress({ current: ev.payload.current, total: ev.payload.total, title: ev.payload.title });
        });

        try {
            const raw = await invoke<string>('scrape_all', {
                systemName: selectedSystem,
                onlyMissing,
            });
            const res = JSON.parse(raw);
            const msg = res.cancelled
                ? `Cancelado. ${res.scraped}/${res.total} completados.`
                : `Listo: ${res.scraped}/${res.total} juegos. Errores: ${res.errors ?? 0}`;
            setScrapeMsg({ text: msg, ok: !res.cancelled });
        } catch (err) {
            setScrapeMsg({ text: String(err), ok: false });
        } finally {
            unlisten.current?.();
            unlisten.current = null;
            setScraping(false);
            setProgress(null);
        }
    };

    const handleCancel = () => invoke('cancel_scraping').catch(console.error);

    const pct = progress && progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
        <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* ── Providers ── */}
            <section>
                <h4 style={styles.sectionTitle}>Proveedores</h4>
                <p style={styles.hint}>
                    El scraper prueba cada proveedor activo en orden: ScreenScraper → ArcadeDB → TheGamesDB.
                    Desactiva los que no uses para saltarlos.
                </p>

                {/* ScreenScraper */}
                <ProviderCard
                    enabled={config.use_screenscraper}
                    onToggle={() => toggle('use_screenscraper')}
                    name="ScreenScraper"
                    statusLabel={config.ss_configured ? 'Configurado' : 'Sin credenciales'}
                    statusOk={config.ss_configured}
                    description="screenscraper.fr — +230 000 juegos, covers, videos, marquees, bezels."
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        <Field label="Dev ID" value={config.ss_dev_id} onChange={field('ss_dev_id')} placeholder="NombreDeApp" />
                        <Field label="Dev Password" type="password" value={config.ss_dev_password} onChange={field('ss_dev_password')} placeholder={config.ss_configured ? PLACEHOLDER : ''} />
                        <Field label="Usuario" value={config.ss_user} onChange={field('ss_user')} placeholder="tu_usuario" />
                        <Field label="Contraseña" type="password" value={config.ss_password} onChange={field('ss_password')} placeholder={config.ss_configured ? PLACEHOLDER : ''} />
                    </div>
                </ProviderCard>

                {/* ArcadeDB */}
                <ProviderCard
                    enabled={config.use_arcadedb}
                    onToggle={() => toggle('use_arcadedb')}
                    name="ArcadeDB"
                    statusLabel="Solo MAME · Sin credenciales"
                    statusOk={true}
                    description="adb.arcadeitalia.net — base de datos local para juegos arcade MAME. No requiere cuenta."
                />

                {/* TheGamesDB */}
                <ProviderCard
                    enabled={config.use_tgdb}
                    onToggle={() => toggle('use_tgdb')}
                    name="TheGamesDB"
                    statusLabel={config.tgdb_configured ? 'Configurado' : 'Sin API key'}
                    statusOk={config.tgdb_configured}
                    description="thegamesdb.net — API key gratuita, buena cobertura de consolas domésticas."
                >
                    <div style={{ marginTop: 10 }}>
                        <Field label="API Key" type="password" value={config.tgdb_api_key} onChange={field('tgdb_api_key')} placeholder={config.tgdb_configured ? PLACEHOLDER : 'tu_api_key'} />
                    </div>
                </ProviderCard>

                {saveMsg && <p style={{ color: saveMsg.ok ? '#4c4' : '#f66', fontSize: 12, margin: '6px 0' }}>{saveMsg.text}</p>}
                <button onClick={handleSave} disabled={saving} style={styles.btn}>
                    {saving ? 'Guardando…' : 'Guardar configuración'}
                </button>
            </section>

            {/* ── Run scraping ── */}
            <section>
                <h4 style={styles.sectionTitle}>Ejecutar scraping</h4>
                <p style={styles.hint}>
                    Busca metadata e imágenes para los juegos del sistema elegido y los guarda en la base de datos.
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                    <select
                        value={selectedSystem}
                        onChange={e => setSelectedSystem(e.target.value)}
                        disabled={scraping}
                        style={{ ...styles.input, flex: 1, minWidth: 160 }}
                    >
                        {systems.length === 0 && <option value="">Cargando sistemas…</option>}
                        {systems.map(s => (
                            <option key={s.id} value={s.name}>
                                {s.display_name ?? s.name}
                            </option>
                        ))}
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={onlyMissing}
                            onChange={e => setOnlyMissing(e.target.checked)}
                            disabled={scraping}
                        />
                        Solo sin metadata
                    </label>
                </div>

                {progress && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ height: 6, background: '#2a2a3e', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#4af', borderRadius: 3, transition: 'width 0.25s' }} />
                        </div>
                        <p style={{ fontSize: 11, opacity: 0.65 }}>
                            {progress.current}/{progress.total} — {progress.title}
                        </p>
                    </div>
                )}

                {scrapeMsg && <p style={{ color: scrapeMsg.ok ? '#4c4' : '#f66', fontSize: 12, margin: '6px 0' }}>{scrapeMsg.text}</p>}

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleScrape} disabled={scraping || !selectedSystem} style={styles.btn}>
                        {scraping ? 'Scrapeando…' : 'Iniciar scraping'}
                    </button>
                    {scraping && (
                        <button onClick={handleCancel} style={{ ...styles.btn, background: '#5a2020', borderColor: '#f66' }}>
                            Cancelar
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const ProviderCard: React.FC<{
    enabled: boolean;
    onToggle: () => void;
    name: string;
    statusLabel: string;
    statusOk: boolean;
    description: string;
    children?: React.ReactNode;
}> = ({ enabled, onToggle, name, statusLabel, statusOk, description, children }) => (
    <div style={{
        border: `1px solid ${enabled ? '#3a6' : '#3a3a4e'}`,
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 10,
        opacity: enabled ? 1 : 0.55,
        transition: 'opacity 0.2s, border-color 0.2s',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <input type="checkbox" checked={enabled} onChange={onToggle} />
                {name}
            </label>
            <span style={{
                fontSize: 11, padding: '2px 7px', borderRadius: 10,
                background: statusOk ? '#1a4' : '#444', color: '#eee',
            }}>
                {statusLabel}
            </span>
        </div>
        <p style={styles.hint}>{description}</p>
        {enabled && children}
    </div>
);

const Field: React.FC<{
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label style={{ display: 'block', fontSize: 11, opacity: 0.55, marginBottom: 2 }}>{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} />
    </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
    sectionTitle: { marginBottom: 6, fontSize: 15 } as React.CSSProperties,
    hint: { fontSize: 12, opacity: 0.55, marginBottom: 6 } as React.CSSProperties,
    input: {
        display: 'block', width: '100%', padding: '5px 8px',
        background: '#1a1a2e', border: '1px solid #444', borderRadius: 4,
        color: '#eee', fontSize: 12, boxSizing: 'border-box',
    } as React.CSSProperties,
    btn: {
        padding: '7px 18px', cursor: 'pointer', borderRadius: 4,
        background: '#1e3a5a', border: '1px solid #4af', color: '#eee', fontSize: 13,
    } as React.CSSProperties,
};
