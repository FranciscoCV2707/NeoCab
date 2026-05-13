import React from 'react';
import { useEmulatorDetection } from '../../hooks/useEmulatorDetection';
import './EmulatorStatus.css';

export const EmulatorStatus: React.FC = () => {
    const {
        emulators,
        loading,
        error,
        detectEmulators,
        getInstalledEmulators,
        getMissingEmulators,
    } = useEmulatorDetection();

    const installed = getInstalledEmulators();
    const missing = getMissingEmulators();

    if (loading) {
        return (
            <div className="emulator-status">
                <p>Detectando emuladores instalados...</p>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="emulator-status">
            <h3>Estado de Emuladores</h3>
            {error && <div className="error-message">{error}</div>}

            <div className="status-summary">
                <div className="summary-card">
                    <span className="count installed">{installed.length}</span>
                    <span className="label">Instalados</span>
                </div>
                <div className="summary-card">
                    <span className="count missing">{missing.length}</span>
                    <span className="label">Faltantes</span>
                </div>
                <div className="summary-card">
                    <span className="percentage">{Math.round((installed.length / emulators.size) * 100)}%</span>
                    <span className="label">Cobertura</span>
                </div>
            </div>

            {installed.length > 0 && (
                <div className="section installed-section">
                    <h4>✅ Emuladores Instalados ({installed.length})</h4>
                    <table className="emulator-table">
                        <tbody>
                            {installed.map((emu) => (
                                <tr key={emu.id}>
                                    <td className="name">{emu.name}</td>
                                    <td className="path">{emu.path || 'En PATH'}</td>
                                    <td className="status">
                                        <span className="badge installed-badge">✓ Listo</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {missing.length > 0 && (
                <div className="section missing-section">
                    <h4>⚠️ Emuladores Faltantes ({missing.length})</h4>
                    <p className="info">
                        Descarga e instala los siguientes emuladores para soportar más sistemas:
                    </p>
                    <div className="missing-list">
                        {missing.map((emu) => (
                            <div key={emu.id} className="missing-item">
                                <div className="emu-info">
                                    <span className="emu-name">{emu.name}</span>
                                    <span className="command">(comando: {emu.id})</span>
                                </div>
                                <a
                                    href="https://www.mamedev.org/" // TODO: dynamic URL from emu object
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="download-link"
                                >
                                    Descargar →
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={detectEmulators} className="refresh-button">
                🔄 Re-detectar Emuladores
            </button>

            {installed.length === 0 && missing.length > 0 && (
                <div className="warning-box">
                    <strong>⚠️ Advertencia:</strong> No se detectaron emuladores instalados.
                    NeoCab necesita al menos un emulador para funcionar correctamente.
                    Por favor, instala al menos MAME o RetroArch.
                </div>
            )}
        </div>
    );
};
