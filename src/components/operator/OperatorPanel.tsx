import React, { useState } from 'react';
import { NetworkPanel } from './NetworkPanel';
import { LogViewer } from './LogViewer';
import './OperatorPanel.css';

type TabType = 'statistics' | 'network' | 'settings' | 'logs';

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
                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Configuración
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'statistics' && <StatisticsTab />}
                {activeTab === 'network' && <NetworkPanel />}
                {activeTab === 'logs' && <LogViewer />}
                {activeTab === 'settings' && <SettingsTab />}
            </div>
        </div>
    );
};

const StatisticsTab: React.FC = () => {
    return (
        <div className="tab-pane">
            <h3>Estadísticas del Gabinete</h3>
            <div className="stats-grid">
                <div className="stat-card">
                    <label>Recaudación Total</label>
                    <div className="stat-value">$0.00</div>
                </div>
                <div className="stat-card">
                    <label>Monedas Insertadas</label>
                    <div className="stat-value">0</div>
                </div>
                <div className="stat-card">
                    <label>Juegos Jugados</label>
                    <div className="stat-value">0</div>
                </div>
                <div className="stat-card">
                    <label>Sesiones Activas</label>
                    <div className="stat-value">0</div>
                </div>
            </div>
        </div>
    );
};

const SettingsTab: React.FC = () => {
    return (
        <div className="tab-pane">
            <h3>Configuración del Operador</h3>
            <div className="settings-section">
                <p>Opciones de configuración disponibles próximamente.</p>
            </div>
        </div>
    );
};
