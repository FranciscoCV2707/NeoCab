import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './OperatorPanel.css';

interface CabinetStats {
    id: string;
    name: string;
    ip: string;
    total_revenue: number;
    total_sessions: number;
    total_roms: number;
    last_sync: Date;
    is_online: boolean;
}

export const MasterDashboard: React.FC = () => {
    const [cabinets, setCabinets] = useState<CabinetStats[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMasterStats();
        const interval = setInterval(loadMasterStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadMasterStats = async () => {
        try {
            const discoveredCabinets = await invoke<any[]>('list_discovered_cabinets');

            let totalRev = 0;
            let totalSess = 0;

            const cabinetStatsPromises = discoveredCabinets.map(async (cabinet) => {
                try {
                    // Try to get stats from this cabinet's API
                    const response = await fetch(`http://${cabinet.ip}:${cabinet.port}/api/revenue/summary`);
                    const data = await response.json();

                    totalRev += data.total_revenue || 0;
                    totalSess += data.total_sessions || 0;

                    return {
                        id: cabinet.id,
                        name: cabinet.name,
                        ip: cabinet.ip,
                        total_revenue: data.total_revenue || 0,
                        total_sessions: data.total_sessions || 0,
                        total_roms: data.total_roms || 0,
                        last_sync: new Date(),
                        is_online: true,
                    };
                } catch (err) {
                    return {
                        id: cabinet.id,
                        name: cabinet.name,
                        ip: cabinet.ip,
                        total_revenue: 0,
                        total_sessions: 0,
                        total_roms: 0,
                        last_sync: new Date(),
                        is_online: false,
                    };
                }
            });

            const stats = await Promise.all(cabinetStatsPromises);
            setCabinets(stats);
            setTotalRevenue(totalRev);
            setTotalSessions(totalSess);
        } catch (err) {
            console.error('Failed to load master stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="tab-pane"><p>Cargando datos de gabinetes...</p></div>;
    }

    return (
        <div className="tab-pane">
            <h3>Panel Maestro - Estadísticas Consolidadas</h3>

            <div className="master-summary">
                <div className="summary-card">
                    <label>Recaudación Total Red</label>
                    <div className="summary-value">${totalRevenue.toFixed(2)}</div>
                </div>
                <div className="summary-card">
                    <label>Sesiones Totales</label>
                    <div className="summary-value">{totalSessions}</div>
                </div>
                <div className="summary-card">
                    <label>Gabinetes en Línea</label>
                    <div className="summary-value">
                        {cabinets.filter(c => c.is_online).length}/{cabinets.length}
                    </div>
                </div>
            </div>

            <h4>Detalle por Gabinete</h4>
            {cabinets.length === 0 ? (
                <p className="empty-state">No hay gabinetes detectados en la red.</p>
            ) : (
                <table className="cabinet-stats-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>IP</th>
                            <th>Recaudación</th>
                            <th>Sesiones</th>
                            <th>ROMs</th>
                            <th>Estado</th>
                            <th>Última Sincronización</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cabinets.map((cabinet) => (
                            <tr key={cabinet.id} className={!cabinet.is_online ? 'offline' : ''}>
                                <td>{cabinet.name}</td>
                                <td>{cabinet.ip}</td>
                                <td>${cabinet.total_revenue.toFixed(2)}</td>
                                <td>{cabinet.total_sessions}</td>
                                <td>{cabinet.total_roms}</td>
                                <td>
                                    <span className={`status-badge ${cabinet.is_online ? 'online' : 'offline'}`}>
                                        {cabinet.is_online ? '🟢 En línea' : '🔴 Desconectado'}
                                    </span>
                                </td>
                                <td>{cabinet.last_sync.toLocaleTimeString('es-ES')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button onClick={loadMasterStats} className="refresh-button">
                🔄 Actualizar Ahora
            </button>
        </div>
    );
};
