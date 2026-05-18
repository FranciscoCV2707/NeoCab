import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NetworkPanel } from './NetworkPanel';
import { LogViewer } from './LogViewer';
import { AuditPanel } from './AuditPanel';
import { SafeQuitRulesPanel } from './SafeQuitRules';
import { SystemManager } from '../settings/SystemManager';
import { ThemeEditor } from '../studio/ThemeEditor';
import { InputWizard } from './InputWizard';
import KeymapConfigPanel from './KeymapConfig';
import { SessionConfig } from './SessionConfig';
import { PluginsPanel } from './PluginsPanel';
import { KioskSettingsPanel } from './KioskSettingsPanel';
import './OperatorPanel.css';

type TabType = 'statistics' | 'network' | 'logs' | 'audit' | 'settings' | 'input' | 'studio' | 'keymap' | 'sessions' | 'safequit' | 'plugins' | 'kiosk';

export const OperatorPanel: React.FC = () => {
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
                    className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
                    onClick={() => setActiveTab('input')}
                >
                    🕹️ Controles
                </button>
                <button
                    className={`tab-button ${activeTab === 'keymap' ? 'active' : ''}`}
                    onClick={() => setActiveTab('keymap')}
                >
                    ⌨️ Keymap
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
                    className={`tab-button ${activeTab === 'studio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('studio')}
                >
                    🎨 Studio
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
                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Configuración
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
                    className="tab-button manual-button"
                    onClick={() => window.open('https://github.com/PakoCaballero/NeoCab/wiki', '_blank')}
                >
                    📖 Manual
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'statistics' && <StatisticsTab />}
                {activeTab === 'input' && <InputWizard />}
                {activeTab === 'keymap' && <KeymapConfigPanel />}
                {activeTab === 'sessions' && <SessionConfig />}
                {activeTab === 'network' && <NetworkPanel />}
                {activeTab === 'studio' && <ThemeEditor />}
                {activeTab === 'logs' && <LogViewer />}
                {activeTab === 'audit' && <AuditPanel />}
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'safequit' && <SafeQuitRulesPanel />}
                {activeTab === 'plugins' && <PluginsPanel />}
                {activeTab === 'kiosk' && <KioskSettingsPanel />}
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
                🔄 Actualizar
            </button>
        </div>
    );
};

const SettingsTab: React.FC = () => {
    return (
        <div className="tab-pane">
            <h3>Configuración del Sistema</h3>
            <SystemManager />
        </div>
    );
};
