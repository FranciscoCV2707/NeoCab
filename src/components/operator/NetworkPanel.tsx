import React from 'react';
import { useNetwork, NetworkRole } from '../../hooks/useNetwork';
import './NetworkPanel.css';

export const NetworkPanel: React.FC = () => {
    const { discoveredCabinets, role, changeRole, loading, error } = useNetwork();

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        changeRole(e.target.value as NetworkRole);
    };

    return (
        <div className="network-panel">
            <header className="panel-header">
                <h2>Red de Gabinetes</h2>
                <div className="role-selector">
                    <label>Modo de Red:</label>
                    <select value={role} onChange={handleRoleChange} disabled={loading}>
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
                            {discoveredCabinets.map((cabinet) => (
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

            <div className="network-info">
                <p>
                    <strong>Nota:</strong> Los gabinetes se descubren automáticamente mediante mDNS (Zeroconf). 
                    Asegúrate de que todos los equipos estén en la misma subred.
                </p>
            </div>
        </div>
    );
};
