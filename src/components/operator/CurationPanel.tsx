import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from '../../stores/useNotificationStore';
import './CurationPanel.css';

export const CurationPanel: React.FC = () => {
    const [maxButtons, setMaxButtons] = useState<string>('any');
    const [joystickType, setJoystickType] = useState<string>('any');
    const [orientation, setOrientation] = useState<string>('any');

    const [controlsPath, setControlsPath] = useState<string>('');
    const [catverPath, setCatverPath] = useState<string>('');
    const [curationLoading, setCurationLoading] = useState<boolean>(false);
    const [curationResult, setCurationResult] = useState<string>('');

    const [datPath, setDatPath] = useState<string>('');
    const [importLoading, setImportLoading] = useState<boolean>(false);
    const [importedDats, setImportedDats] = useState<string[]>([]);
    const [selectedDat, setSelectedDat] = useState<string>('all');
    const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
    
    interface VerificationReport {
        total_verified: number;
        matched_roms: Array<{ game_title: string; rom_filename: string; local_path: string; crc32: string }>;
        mismatched_names: Array<{ game_title: string; expected_filename: string; actual_filename: string; local_path: string; crc32: string }>;
        missing_roms: Array<{ game_title: string; expected_filename: string; crc32: string }>;
    }
    const [report, setReport] = useState<VerificationReport | null>(null);

    useEffect(() => {
        loadCurationConfig();
        loadImportedDats();
    }, []);

    const loadImportedDats = async () => {
        try {
            const list = await invoke<string[]>('get_imported_dats');
            setImportedDats(list);
        } catch (err) {
            console.error('Failed to load imported DATs:', err);
        }
    };

    const handleImportDat = async () => {
        if (!datPath) {
            toast.error('Error', 'Debes especificar una ruta para el archivo DAT.');
            return;
        }
        setImportLoading(true);
        try {
            const count = await invoke<number>('import_dat_file', { datPath });
            toast.success('DAT Importado', `Se han importado ${count} registros correctamente.`);
            setDatPath('');
            await loadImportedDats();
        } catch (err) {
            console.error('Failed to import DAT file:', err);
            toast.error('Error de Importación', String(err));
        } finally {
            setImportLoading(false);
        }
    };

    const handleVerifyLibrary = async () => {
        setVerifyLoading(true);
        setReport(null);
        try {
            const result = await invoke<VerificationReport>('verify_library_against_dat', {
                datName: selectedDat === 'all' ? null : selectedDat
            });
            setReport(result);
            toast.success('Auditoría Completada', 'El escaneo contra el archivo DAT finalizó.');
        } catch (err) {
            console.error('Failed to verify library:', err);
            toast.error('Error de Verificación', String(err));
        } finally {
            setVerifyLoading(false);
        }
    };

    const loadCurationConfig = async () => {
        try {
            const btns = await invoke<string>('get_config', { key: 'curation_max_buttons' }).catch(() => 'any');
            const joy = await invoke<string>('get_config', { key: 'curation_joystick_type' }).catch(() => 'any');
            const orient = await invoke<string>('get_config', { key: 'curation_orientation' }).catch(() => 'any');

            const ctrlPath = await invoke<string>('get_config', { key: 'mame_controls_path' }).catch(() => '');
            const catPath = await invoke<string>('get_config', { key: 'mame_catver_path' }).catch(() => '');

            setMaxButtons(btns || 'any');
            setJoystickType(joy || 'any');
            setOrientation(orient || 'any');
            setControlsPath(ctrlPath || '');
            setCatverPath(catPath || '');
        } catch (err) {
            console.error('Failed to load curation configurations:', err);
        }
    };

    const handleSaveConstraints = async () => {
        try {
            await invoke('set_config', { key: 'curation_max_buttons', value: maxButtons });
            await invoke('set_config', { key: 'curation_joystick_type', value: joystickType });
            await invoke('set_config', { key: 'curation_orientation', value: orientation });
            
            await invoke('set_config', { key: 'mame_controls_path', value: controlsPath });
            await invoke('set_config', { key: 'mame_catver_path', value: catverPath });

            toast.success('Configuración Guardada', 'Las restricciones de cabina se han aplicado con éxito.');
        } catch (err) {
            console.error('Failed to save curation settings:', err);
            toast.error('Error', 'No se pudo guardar la configuración de curación.');
        }
    };

    const handleRunMameCuration = async () => {
        if (!controlsPath && !catverPath) {
            toast.error('Error', 'Debes especificar al menos la ruta de controls.dat o CatVer.ini');
            return;
        }
        setCurationLoading(true);
        setCurationResult('Procesando base de datos de juegos MAME...');
        try {
            const resultStr = await invoke<string>('curate_arcade_metadata', {
                controlsPath,
                catverPath
            });
            const result = JSON.parse(resultStr);
            if (result.success) {
                setCurationResult(result.message);
                toast.success('Curación Completada', result.message);
            } else {
                setCurationResult(`Error en curación: ${result.error}`);
            }
        } catch (err: any) {
            console.error('Failed to execute MAME curation:', err);
            setCurationResult(`Fallo en curación: ${err}`);
            toast.error('Fallo en Curación', String(err));
        } finally {
            setCurationLoading(false);
        }
    };

    return (
        <div className="curation-panel">
            <div className="panel-header">
                <h3>Curación & Restricciones de Hardware</h3>
            </div>

            <div className="curation-grid">
                <div className="curation-card">
                    <h4>Limitaciones del Panel de Control</h4>
                    <p className="hint">Filtra juegos según los controles físicos disponibles en la máquina.</p>
                    
                    <div className="input-group">
                        <label>Máximo de Botones por Jugador</label>
                        <select value={maxButtons} onChange={(e) => setMaxButtons(e.target.value)}>
                            <option value="any">Cualquiera (Sin límite)</option>
                            <option value="1">1 Botón</option>
                            <option value="2">2 Botones</option>
                            <option value="3">3 Botones</option>
                            <option value="4">4 Botones</option>
                            <option value="6">6 Botones</option>
                            <option value="8">8 Botones</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Direcciones del Joystick</label>
                        <select value={joystickType} onChange={(e) => setJoystickType(e.target.value)}>
                            <option value="any">Cualquiera (Sin límite)</option>
                            <option value="2-way">2 vías (ej. Pac-Man)</option>
                            <option value="4-way">4 vías</option>
                            <option value="8-way">8 vías (Estándar)</option>
                            <option value="analog">Analógico</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Orientación del Monitor</label>
                        <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                            <option value="any">Cualquiera</option>
                            <option value="horizontal">Horizontal (Landscape)</option>
                            <option value="vertical">Vertical (Portrait)</option>
                        </select>
                    </div>

                    <button className="save-btn" onClick={handleSaveConstraints}>
                        💾 Guardar Restricciones
                    </button>
                </div>

                <div className="curation-card">
                    <h4>Curador Automatizado MAME</h4>
                    <p className="hint">Importa catálogos MAME para categorizar juegos e identificar controles.</p>
                    
                    <div className="input-group">
                        <label>Ruta de controls.dat</label>
                        <input 
                            type="text" 
                            placeholder="C:\MAME\controls.dat"
                            value={controlsPath}
                            onChange={(e) => setControlsPath(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Ruta de CatVer.ini</label>
                        <input 
                            type="text" 
                            placeholder="C:\MAME\CatVer.ini"
                            value={catverPath}
                            onChange={(e) => setCatverPath(e.target.value)}
                        />
                    </div>

                    <div className="mame-action-group">
                        <button 
                            className={`run-btn ${curationLoading ? 'loading' : ''}`}
                            onClick={handleRunMameCuration}
                            disabled={curationLoading}
                        >
                            {curationLoading ? 'Procesando...' : '⚙️ Ejecutar Importación'}
                        </button>
                    </div>

                    {curationResult && (
                        <div className="curation-log">
                            <h5>Registro de Operación:</h5>
                            <pre>{curationResult}</pre>
                        </div>
                    )}
                </div>

                {/* DAT Import Card */}
                <div className="curation-card">
                    <h4>Importar Archivo DAT (Logiqx XML)</h4>
                    <p className="hint">Importa bases de datos de ROM sets oficiales para verificar tu librería.</p>
                    
                    <div className="input-group">
                        <label>Ruta del archivo DAT</label>
                        <input 
                            type="text" 
                            placeholder="C:\DATs\Nintendo - NES.dat"
                            value={datPath}
                            onChange={(e) => setDatPath(e.target.value)}
                        />
                    </div>

                    <button 
                        className={`run-btn ${importLoading ? 'loading' : ''}`} 
                        onClick={handleImportDat}
                        disabled={importLoading}
                    >
                        {importLoading ? 'Importando...' : '📥 Importar DAT'}
                    </button>
                </div>

                {/* DAT Scan Card */}
                <div className="curation-card">
                    <h4>Auditoría de ROMs contra DAT</h4>
                    <p className="hint">Compara los metadatos y hashes de tu librería contra los DATs importados.</p>

                    <div className="input-group">
                        <label>Seleccionar Base DAT</label>
                        <select value={selectedDat} onChange={(e) => setSelectedDat(e.target.value)}>
                            <option value="all">Todos los DATs Importados</option>
                            {importedDats.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        className={`run-btn ${verifyLoading ? 'loading' : ''}`} 
                        onClick={handleVerifyLibrary}
                        disabled={verifyLoading}
                    >
                        {verifyLoading ? 'Verificando...' : '🔍 Iniciar Auditoría'}
                    </button>

                    {report && (
                        <div className="verification-results">
                            <h5>Resultados de Auditoría:</h5>
                            <div className="results-summary">
                                <div className="result-metric">
                                    <span className="metric-label">Verificados:</span>
                                    <span className="metric-val">{report.total_verified}</span>
                                </div>
                                <div className="result-metric text-success">
                                    <span className="metric-label">Coinciden:</span>
                                    <span className="metric-val">{report.matched_roms.length}</span>
                                </div>
                                <div className="result-metric text-warning">
                                    <span className="metric-label">Nombres Incorrectos:</span>
                                    <span className="metric-val">{report.mismatched_names.length}</span>
                                </div>
                                <div className="result-metric text-danger">
                                    <span className="metric-label">Faltantes:</span>
                                    <span className="metric-val">{report.missing_roms.length}</span>
                                </div>
                            </div>
                            
                            {report.mismatched_names.length > 0 && (
                                <div className="result-section">
                                    <h6>Nombres Incorrectos (Arreglar Nombre de Archivo):</h6>
                                    <ul className="results-list">
                                        {report.mismatched_names.slice(0, 10).map((x, idx) => (
                                            <li key={idx}>
                                                <strong>{x.game_title}</strong>: Esperado <code>{x.expected_filename}</code> | Local <code>{x.actual_filename}</code>
                                            </li>
                                        ))}
                                        {report.mismatched_names.length > 10 && <li className="list-more">... y {report.mismatched_names.length - 10} más.</li>}
                                    </ul>
                                </div>
                            )}

                            {report.missing_roms.length > 0 && (
                                <div className="result-section">
                                    <h6>ROMs Faltantes en tu Set:</h6>
                                    <ul className="results-list">
                                        {report.missing_roms.slice(0, 10).map((x, idx) => (
                                            <li key={idx}>
                                                <strong>{x.game_title}</strong>: Falta <code>{x.expected_filename}</code> (CRC: {x.crc32})
                                            </li>
                                        ))}
                                        {report.missing_roms.length > 10 && <li className="list-more">... y {report.missing_roms.length - 10} más.</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
