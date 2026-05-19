import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NetworkPanel } from './NetworkPanel';
import { LogViewer } from './LogViewer';
import { AuditPanel } from './AuditPanel';
import { SafeQuitRulesPanel } from './SafeQuitRules';
import { SessionConfig } from './SessionConfig';
import { PluginsPanel } from './PluginsPanel';
import { KioskSettingsPanel } from './KioskSettingsPanel';
import './OperatorPanel.css';

type TabType = 'statistics' | 'network' | 'logs' | 'audit' | 'sessions' | 'safequit' | 'plugins' | 'kiosk' | 'help';

interface OperatorPanelProps {
    onBack: () => void;
}

export const OperatorPanel: React.FC<OperatorPanelProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<TabType>('statistics');

    return (
        <div className="operator-panel">
            <nav className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('statistics')}
                >
                    📊 Estadísticas
                </button>
                <button
                    className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    🪙 Sesiones
                </button>
                <button
                    className={`tab-button ${activeTab === 'network' ? 'active' : ''}`}
                    onClick={() => setActiveTab('network')}
                >
                    🌐 Red
                </button>
                <button
                    className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📋 Registros
                </button>
                <button
                    className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    🔍 Auditoría
                </button>
                <button
                    className={`tab-button ${activeTab === 'safequit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('safequit')}
                >
                    🛡️ Safe Quit
                </button>
                <button
                    className={`tab-button ${activeTab === 'plugins' ? 'active' : ''}`}
                    onClick={() => setActiveTab('plugins')}
                >
                    📜 Plugins
                </button>
                <button
                    className={`tab-button ${activeTab === 'kiosk' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kiosk')}
                >
                    📺 Kiosk
                </button>
                <button
                    className={`tab-button manual-button ${activeTab === 'help' ? 'active' : ''}`}
                    onClick={() => setActiveTab('help')}
                >
                    ? Ayuda
                </button>
                <button className="tab-button manual-button" onClick={onBack}>
                    Volver
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'statistics' && <StatisticsTab />}
                {activeTab === 'sessions' && <SessionConfig />}
                {activeTab === 'network' && <NetworkPanel />}
                {activeTab === 'logs' && <LogViewer />}
                {activeTab === 'audit' && <AuditPanel />}
                {activeTab === 'safequit' && <SafeQuitRulesPanel />}
                {activeTab === 'plugins' && <PluginsPanel />}
                {activeTab === 'kiosk' && <KioskSettingsPanel />}
                {activeTab === 'help' && <HelpPanel />}
            </div>
        </div>
    );
};

const StatisticsTab: React.FC = () => {
    interface StatsData {
        earnings?: number;
        total_revenue?: number;
        sessions?: number;
        total_sessions?: number;
        health?: string;
        database_status?: string;
        total_roms?: number;
        total_playtime?: number;
        average_playtime?: number;
        total_systems?: number;
        coins_inserted?: number;
    }
    const [stats, setStats] = React.useState<StatsData | null>(null);
    const [sessionStats, setSessionStats] = React.useState<StatsData | null>(null);
    const [systemHealth, setSystemHealth] = React.useState<StatsData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [earnings, sessions, health] = await Promise.all([
                invoke('get_operator_stats'),
                invoke('get_session_stats'),
                invoke('get_system_health'),
            ]);

            const earningsData = typeof earnings === 'string' ? JSON.parse(earnings) : earnings;
            const sessionsData = typeof sessions === 'string' ? JSON.parse(sessions) : sessions;
            const healthData = typeof health === 'string' ? JSON.parse(health) : health;

            setStats(earningsData);
            setSessionStats(sessionsData);
            setSystemHealth(healthData);
        } catch (err) {
            console.error('Failed to load statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="tab-pane"><p>Cargando estadísticas...</p></div>;
    }

    return (
        <div className="tab-pane">
            <h3>Estadísticas del Gabinete</h3>
            <div className="stats-grid">
                <div className="stat-card">
                    <label>Recaudación Total</label>
                    <div className="stat-value">
                        ${stats?.total_revenue?.toFixed(2) ?? '0.00'}
                    </div>
                </div>
                <div className="stat-card">
                    <label>Monedas Insertadas</label>
                    <div className="stat-value">
                        {stats?.coins_inserted ?? 0}
                    </div>
                </div>
                <div className="stat-card">
                    <label>Juegos Jugados</label>
                    <div className="stat-value">
                        {sessionStats?.total_sessions ?? 0}
                    </div>
                </div>
                <div className="stat-card">
                    <label>ROMs en Sistema</label>
                    <div className="stat-value">
                        {systemHealth?.total_roms ?? 0}
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <h4>Tiempo de Juego</h4>
                <div className="stat-row">
                    <span>Total: {sessionStats?.total_playtime ?? 0}h</span>
                    <span>Promedio: {sessionStats?.average_playtime ?? 0}h</span>
                </div>
            </div>

            <div className="stats-section">
                <h4>Salud del Sistema</h4>
                <div className="stat-row">
                    <span>Sistemas: {systemHealth?.total_systems ?? 0}</span>
                    <span>Base de datos: {systemHealth?.database_status ?? 'OK'}</span>
                </div>
            </div>

            <button onClick={loadStats} className="refresh-button">
                Actualizar
            </button>
        </div>
    );
};

const HelpPanel: React.FC = () => (
    <div className="tab-pane" style={{ maxWidth: 700, lineHeight: 1.7 }}>
        <h3>Ayuda del Panel de Operador</h3>

        <section style={{ marginBottom: 24 }}>
            <h4>Secciones de este panel</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                    {[
                        ['Estadísticas', 'Recaudación, monedas insertadas, tiempo de juego y salud del sistema.'],
                        ['Sesiones', 'Configura el modo de juego (monedas/tiempo) por sistema.'],
                        ['Red', 'Estado de la red y opciones de conectividad.'],
                        ['Registros', 'Logs de eventos del sistema para depuración.'],
                        ['Auditoría', 'Historial de operaciones y cambios de configuración.'],
                        ['Safe Quit', 'Reglas de cierre seguro de emuladores (tiempo máximo, alertas).'],
                        ['Plugins', 'Extensiones activas en el sistema.'],
                        ['Kiosk', 'Modo kiosco: pantalla completa, PIN, restricciones de acceso.'],
                    ].map(([tab, desc]) => (
                        <tr key={tab} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '6px 12px 6px 0', fontWeight: 600, whiteSpace: 'nowrap', color: '#4af' }}>{tab}</td>
                            <td style={{ padding: '6px 0', opacity: 0.8 }}>{desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

        <section style={{ marginBottom: 24 }}>
            <h4>Cómo configurar el scraper</h4>
            <ol style={{ paddingLeft: 20, fontSize: 13, opacity: 0.85 }}>
                <li>Ve a <strong>Configuración → Scraper</strong> desde el menú principal.</li>
                <li>Activa los proveedores que quieras usar (ScreenScraper, ArcadeDB, TheGamesDB).</li>
                <li>Introduce las credenciales correspondientes (ver registros gratuitos en cada sitio).</li>
                <li>Guarda la configuración y luego selecciona el sistema a scrapear.</li>
                <li>Pulsa <strong>Iniciar scraping</strong> — el progreso se mostrará en tiempo real.</li>
            </ol>
        </section>

        <section style={{ marginBottom: 24 }}>
            <h4>Cómo importar ROMs</h4>
            <ol style={{ paddingLeft: 20, fontSize: 13, opacity: 0.85 }}>
                <li>Coloca tus ROMs en subcarpetas por sistema dentro del directorio de ROMs configurado.</li>
                <li>Desde el menú principal usa <strong>Escanear ROMs</strong>.</li>
                <li>NeoCab detectará automáticamente el sistema por extensión de archivo.</li>
                <li>También puedes importar desde EmulationStation, HyperSpin o LaunchBox via <em>Importar biblioteca</em>.</li>
            </ol>
        </section>

        <section>
            <h4>Problemas frecuentes</h4>
            <ul style={{ paddingLeft: 20, fontSize: 13, opacity: 0.85 }}>
                <li><strong>El scraper no encuentra juegos</strong> — Verifica que las credenciales de ScreenScraper sean correctas. ArcadeDB solo cubre juegos MAME.</li>
                <li><strong>Los juegos no aparecen</strong> — Revisa que la carpeta de ROMs esté bien configurada y ejecuta Escanear ROMs.</li>
                <li><strong>El emulador no arranca</strong> — Comprueba que el ejecutable del emulador esté configurado en Ajustes → Sistemas.</li>
                <li><strong>Sin imagen/video</strong> — Ejecuta el scraper para descargar artwork. Las imágenes se guardan en <code>./media/</code>.</li>
            </ul>
        </section>
    </div>
);

