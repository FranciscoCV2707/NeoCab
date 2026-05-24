import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './PauseMenu.css';

interface PauseMenuProps {
    gameName: string;
    gameId: number;
    emulatorName: string;
    onClose: () => void;
    onExitGame: () => void;
}

interface MenuOption {
    id: string;
    label: string;
    icon: string;
}

interface SaveState {
    id: number;
    game_id: number;
    slot: number;
    save_path: string;
    description?: string;
    created_at?: string;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
    gameName,
    gameId,
    emulatorName,
    onClose,
    onExitGame,
}) => {
    const [activeMenu, setActiveMenu] = useState<'main' | 'save' | 'load' | 'shaders'>('main');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [saveStates, setSaveStates] = useState<Record<number, SaveState>>({});
    const [selectedShader, setSelectedShader] = useState<string>('arcade');

    const mainOptions = useMemo<MenuOption[]>(() => [
        { id: 'resume', label: 'REANUDAR', icon: '▶️' },
        { id: 'save', label: 'GUARDAR PARTIDA', icon: '💾' },
        { id: 'load', label: 'CARGAR PARTIDA', icon: '📂' },
        { id: 'shaders', label: 'AJUSTES VISUALES', icon: '📺' },
        { id: 'exit', label: 'SALIR AL MENÚ', icon: '🚪' }
    ], []);

    const shaderOptions = useMemo<MenuOption[]>(() => [
        { id: 'arcade', label: 'CRT ARCADE (Efecto Completo)', icon: '👾' },
        { id: 'light', label: 'CRT SUAVE (Curva Ligera)', icon: '📺' },
        { id: 'heavy', label: 'CRT FUERTE (Curva Pronunciada)', icon: '🎞️' },
        { id: 'none', label: 'SIN SHADER (Limpio)', icon: '🚫' }
    ], []);

    const fetchSaveStates = useCallback(async () => {
        if (!gameId) return;
        try {
            const states = await invoke<SaveState[]>("get_save_states", { gameId });
            const map: Record<number, SaveState> = {};
            states.forEach(state => {
                map[state.slot] = state;
            });
            setSaveStates(map);
        } catch (e) {
            console.error("Error loading save states:", e);
        }
    }, [gameId]);

    useEffect(() => {
        fetchSaveStates();
    }, [fetchSaveStates]);

    const handleSave = async (slot: number) => {
        try {
            const description = `Guardado automático - ${new Date().toLocaleString()}`;
            await invoke("save_game_state", {
                gameId,
                slot,
                description,
                emulatorName
            });
            await fetchSaveStates();
            setActiveMenu('main');
            setSelectedIndex(1); // Return focus to save option
        } catch (e) {
            console.error("Error saving game state:", e);
        }
    };

    const handleLoad = async (slot: number) => {
        if (!saveStates[slot]) return; // Empty slot
        try {
            await invoke("load_game_state", {
                gameId,
                slot,
                emulatorName
            });
            onClose(); // Resume game automatically after loading
        } catch (e) {
            console.error("Error loading game state:", e);
        }
    };

    const handleApplyShader = async (shaderId: string) => {
        try {
            setSelectedShader(shaderId);
            await invoke("apply_shader", { shaderName: shaderId });
            
            // Apply visual styling to document root for real-time feedback
            const root = document.documentElement;
            if (shaderId === 'arcade') {
                root.style.setProperty("--crt-curve", "0.06");
                root.style.setProperty("--scanlines", "1");
                root.style.setProperty("--glow-intensity", "0.5");
            } else if (shaderId === 'light') {
                root.style.setProperty("--crt-curve", "0.02");
                root.style.setProperty("--scanlines", "1");
                root.style.setProperty("--glow-intensity", "0.2");
            } else if (shaderId === 'heavy') {
                root.style.setProperty("--crt-curve", "0.1");
                root.style.setProperty("--scanlines", "1");
                root.style.setProperty("--glow-intensity", "0.8");
            } else {
                root.style.setProperty("--crt-curve", "0.0");
                root.style.setProperty("--scanlines", "0");
                root.style.setProperty("--glow-intensity", "0.0");
            }
            setActiveMenu('main');
            setSelectedIndex(3); // Return focus to shaders option
        } catch (e) {
            console.error("Error applying shader preset:", e);
        }
    };

    const handleSelect = useCallback(() => {
        if (activeMenu === 'main') {
            const option = mainOptions[selectedIndex];
            switch (option.id) {
                case 'resume': onClose(); break;
                case 'save':
                    setActiveMenu('save');
                    setSelectedIndex(0);
                    break;
                case 'load':
                    setActiveMenu('load');
                    setSelectedIndex(0);
                    break;
                case 'shaders':
                    setActiveMenu('shaders');
                    setSelectedIndex(0);
                    break;
                case 'exit': onExitGame(); break;
            }
        } else if (activeMenu === 'save') {
            handleSave(selectedIndex + 1);
        } else if (activeMenu === 'load') {
            handleLoad(selectedIndex + 1);
        } else if (activeMenu === 'shaders') {
            handleApplyShader(shaderOptions[selectedIndex].id);
        }
    }, [activeMenu, selectedIndex, mainOptions, shaderOptions, saveStates, onClose, onExitGame]);

    const handleBack = useCallback(() => {
        setActiveMenu('main');
        // Reset selected index based on where we came from
        if (activeMenu === 'save') setSelectedIndex(1);
        else if (activeMenu === 'load') setSelectedIndex(2);
        else if (activeMenu === 'shaders') setSelectedIndex(3);
    }, [activeMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            let maxOptions = mainOptions.length;
            if (activeMenu === 'save' || activeMenu === 'load') {
                maxOptions = 5;
            } else if (activeMenu === 'shaders') {
                maxOptions = shaderOptions.length;
            }

            if (e.key === 'ArrowUp') setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxOptions - 1));
            if (e.key === 'ArrowDown') setSelectedIndex(prev => (prev < maxOptions - 1 ? prev + 1 : 0));
            if (e.key === 'Enter') handleSelect();
            if (e.key === 'Escape') {
                if (activeMenu === 'main') {
                    onClose();
                } else {
                    handleBack();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMenu, selectedIndex, mainOptions.length, shaderOptions.length, handleSelect, handleBack, onClose]);

    return (
        <div className="pause-menu-overlay">
            <div className="pause-menu-content">
                <div className="pause-header">
                    <span className="pause-title">
                        {activeMenu === 'main' && 'PAUSA'}
                        {activeMenu === 'save' && 'GUARDAR PARTIDA'}
                        {activeMenu === 'load' && 'CARGAR PARTIDA'}
                        {activeMenu === 'shaders' && 'AJUSTES VISUALES'}
                    </span>
                    <h2 className="pause-game-name">{gameName}</h2>
                </div>

                <div className="pause-body">
                    {activeMenu === 'main' && (
                        <div className="pause-options">
                            {mainOptions.map((opt, index) => (
                                <div 
                                    key={opt.id}
                                    className={`pause-option ${index === selectedIndex ? 'active' : ''}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={handleSelect}
                                >
                                    <span className="option-icon">{opt.icon}</span>
                                    <span className="option-label">{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {(activeMenu === 'save' || activeMenu === 'load') && (
                        <div className="pause-slots">
                            {[1, 2, 3, 4, 5].map((slot, index) => {
                                const state = saveStates[slot];
                                const isEmpty = !state;
                                const isSelected = index === selectedIndex;
                                return (
                                    <div
                                        key={slot}
                                        className={`pause-slot-item ${isSelected ? 'active' : ''} ${isEmpty && activeMenu === 'load' ? 'disabled' : ''}`}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        onClick={handleSelect}
                                    >
                                        <div className="slot-number-badge">SLOT {slot}</div>
                                        <div className="slot-info">
                                            <span className="slot-description">
                                                {isEmpty ? 'Ranura vacía' : state.description || 'Sin descripción'}
                                            </span>
                                            {!isEmpty && state.created_at && (
                                                <span className="slot-date">
                                                    {new Date(state.created_at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="slot-status-icon">
                                            {isEmpty ? '➕' : '💾'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeMenu === 'shaders' && (
                        <div className="pause-options">
                            {shaderOptions.map((opt, index) => (
                                <div 
                                    key={opt.id}
                                    className={`pause-option ${index === selectedIndex ? 'active' : ''} ${selectedShader === opt.id ? 'selected-shader' : ''}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={handleSelect}
                                >
                                    <span className="option-icon">{opt.icon}</span>
                                    <div className="option-shader-info">
                                        <span className="option-label">{opt.label}</span>
                                    </div>
                                    {selectedShader === opt.id && <span className="active-badge">ACTIVO</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pause-footer">
                    {activeMenu === 'main' ? (
                        <p>Usa el Joystick para navegar • Pulsa Start para seleccionar</p>
                    ) : (
                        <p>Pulsa Atrás/Esc para volver al Menú Principal</p>
                    )}
                </div>
            </div>
        </div>
    );
};
