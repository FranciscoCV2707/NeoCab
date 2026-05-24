import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './NetworkPanel.css';

interface CabinetInfo {
    id: string;
    name: string;
    ip: string;
    port: number;
    is_master: boolean;
}

export const NetworkPanel: React.FC = () => {
    const [role, setRole] = useState<string>('Standalone');
    const [masterIp, setMasterIp] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [discoveredCabinets, setDiscoveredCabinets] = useState<CabinetInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const changeRole = async (newRole: string) => {
        setRole(newRole);
        try {
            await invoke('set_network_role', { role: newRole });
        } catch (err) {
            console.error('Failed to change role:', err);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const currentRole = await invoke<string>('get_network_role');
                setRole(currentRole);

                const ip = await invoke<string | null>('get_master_ip');
                setMasterIp(ip);

                const cabinets = await invoke<CabinetInfo[]>('list_discovered_cabinets');
                setDiscoveredCabinets(cabinets);
            } catch (err) {
                console.error('Failed to initialize network panel:', err);
                setError('Error al inicializar la red');
            } finally {
                setLoading(false);
            }
        };

        init();

        const interval = setInterval(async () => {
            try {
                const cabinets = await invoke<CabinetInfo[]>('list_discovered_cabinets');
                setDiscoveredCabinets(cabinets);
            } catch (err) {
                console.error('Failed to refresh cabinets:', err);
            }
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    const handleSyncNow = async () => {
        setSyncing(true);
        try {
            await invoke('sync_revenue_now');
            setLastSyncTime(new Date());
        } catch (err) {
            console.error('Failed to sync revenue:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        changeRole(e.target.value);
    };

    if (loading) {
        return <div className="network-panel"><p>Cargando configuración de red...</p></div>;
    }

    return (
        <div className="network-panel">
            <header className="panel-header">
                <h2>Red de Gabinetes</h2>
                <div className="role-selector">
                    <label>Modo de Red:</label>
                    <select value={role} onChange={handleRoleChange}>
                        <option value="Standalone">Independiente (Standalone)</option>
                        <option value="Master">Maestro (Master)</option>
                        <option value="Client">Cliente (Client)</option>
                    </select>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="cabinet-list-container">
                <h3>Gabinetes Detectados ({discoveredCabinets.length})</h3>
                {discoveredCabinets.length === 0 ? (
                    <div className="empty-state">
                        <p>Buscando otros gabinetes en la red local...</p>
                        <div className="loader"></div>
                    </div>
                ) : (
                    <table className="cabinet-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>IP</th>
                                <th>Puerto</th>
                                <th>Rol</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discoveredCabinets.map((cabinet: CabinetInfo) => (
                                <tr key={cabinet.id} className={cabinet.is_master ? 'master-row' : ''}>
                                    <td>{cabinet.name} {cabinet.is_master && <span className="badge">MASTER</span>}</td>
                                    <td>{cabinet.ip}</td>
                                    <td>{cabinet.port}</td>
                                    <td>{cabinet.is_master ? 'Master' : 'Client'}</td>
                                    <td>
                                        <span className="status-indicator online"></span>
                                        En línea
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {masterIp && role === 'Client' && (
                <div className="revenue-sync-section">
                    <h3>Sincronización de Recaudación</h3>
                    <div className="sync-info">
                        <p><strong>Maestro conectado:</strong> {masterIp}</p>
                        {lastSyncTime && (
                            <p><strong>Última sincronización:</strong> {lastSyncTime.toLocaleTimeString('es-ES')}</p>
                        )}
                        <button
                            className="sync-button"
                            onClick={handleSyncNow}
                            disabled={syncing}
                        >
                            {syncing ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
                        </button>
                    </div>
                    <p className="sync-note">
                        La recaudación se sincroniza automáticamente cada 5 minutos.
                        Puedes forzar una sincronización inmediata con el botón de arriba.
                    </p>
                </div>
            )}

            <div className="network-info">
                <p>
                    <strong>Nota:</strong> Los gabinetes se descubren automáticamente mediante mDNS (Zeroconf).
                    Asegúrate de que todos los equipos estén en la misma subred.
                </p>
            </div>
        </div>
    );
};
