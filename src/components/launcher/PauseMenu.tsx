import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './PauseMenu.css';

interface PauseMenuProps {
    gameName: string;
    onClose: () => void;
    onExitGame: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ gameName, onClose, onExitGame }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const options = [
        { id: 'resume', label: 'REANUDAR', icon: '▶️' },
        { id: 'save', label: 'GUARDAR PARTIDA', icon: '💾' },
        { id: 'load', label: 'CARGAR PARTIDA', icon: '📂' },
        { id: 'shaders', label: 'AJUSTES VISUALES', icon: '📺' },
        { id: 'exit', label: 'SALIR AL MENÚ', icon: '🚪' }
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
            if (e.key === 'ArrowDown') setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
            if (e.key === 'Enter') handleSelect();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex]);

    const handleSelect = () => {
        const option = options[selectedIndex];
        switch (option.id) {
            case 'resume': onClose(); break;
            case 'exit': onExitGame(); break;
            // Add other cases as we implement them
            default: console.log(`Selected: ${option.label}`);
        }
    };

    return (
        <div className="pause-menu-overlay">
            <div className="pause-menu-content">
                <div className="pause-header">
                    <span className="pause-title">PAUSA</span>
                    <h2 className="pause-game-name">{gameName}</h2>
                </div>

                <div className="pause-options">
                    {options.map((opt, index) => (
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

                <div className="pause-footer">
                    <p>Usa el Joystick para navegar • Pulsa Start para seleccionar</p>
                </div>
            </div>
        </div>
    );
};
