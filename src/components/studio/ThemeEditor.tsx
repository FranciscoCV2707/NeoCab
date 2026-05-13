import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './ThemeEditor.css';

interface ThemeElement {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    rotation: number;
    type: 'video' | 'image' | 'wheel' | 'text';
    content?: string;
}

interface ThemeConfig {
    background: string;
    elements: ThemeElement[];
    sounds: {
        navigation: string;
        select: string;
        back: string;
    };
}

export const ThemeEditor: React.FC = () => {
    const [config, setConfig] = useState<ThemeConfig>({
        background: '',
        elements: [
            { id: 'video_box', name: 'Video Preview', x: 10, y: 10, width: 40, height: 40, opacity: 1, rotation: 0, type: 'video' },
            { id: 'wheel_box', name: 'Game Wheel', x: 60, y: 0, width: 40, height: 100, opacity: 1, rotation: 0, type: 'wheel' },
        ],
        sounds: {
            navigation: 'nav.wav',
            select: 'select.wav',
            back: 'back.wav'
        }
    });

    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = (id: string) => {
        setSelectedElementId(id);
        isDragging.current = true;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !selectedElementId || !stageRef.current) return;

        const stage = stageRef.current.getBoundingClientRect();
        const x = ((e.clientX - stage.left) / stage.width) * 100;
        const y = ((e.clientY - stage.top) / stage.height) * 100;

        updateElement(selectedElementId, { x, y });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const updateElement = (id: string, updates: Partial<ThemeElement>) => {
        setConfig(prev => ({
            ...prev,
            elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
        }));
    };

    const selectedElement = config.elements.find(el => el.id === selectedElementId);

    const saveTheme = async () => {
        try {
            await invoke('save_theme_config', { config });
            alert('¡Tema guardado con éxito!');
        } catch (err) {
            console.error('Error saving theme:', err);
        }
    };

    return (
        <div className="studio-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <div className="studio-stage">
                <div 
                    ref={stageRef}
                    className="stage-canvas"
                    style={{ backgroundImage: `url(${config.background})` }}
                >
                    {config.elements.map(el => (
                        <div
                            key={el.id}
                            className={`draggable-element ${selectedElementId === el.id ? 'active' : ''}`}
                            style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                width: `${el.width}%`,
                                height: `${el.height}%`,
                                opacity: el.opacity,
                                transform: `rotate(${el.rotation}deg)`,
                                background: el.type === 'video' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.05)'
                            }}
                            onMouseDown={() => handleMouseDown(el.id)}
                        >
                            <span className="element-label">{el.name}</span>
                            {el.type === 'video' && <div className="video-placeholder">📺 VIDEO AREA</div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="studio-sidebar">
                <div className="studio-header">
                    <h2>Studio</h2>
                    <button className="save-button" onClick={saveTheme}>GUARDAR</button>
                </div>

                <div className="property-group">
                    <h4>Capas (Layers)</h4>
                    <div className="layer-list">
                        {config.elements.map(el => (
                            <div 
                                key={el.id} 
                                className={`layer-item ${selectedElementId === el.id ? 'active' : ''}`}
                                onClick={() => setSelectedElementId(el.id)}
                            >
                                {el.name}
                            </div>
                        ))}
                    </div>
                </div>

                {selectedElement && (
                    <div className="property-group">
                        <h4>Propiedades: {selectedElement.name}</h4>
                        
                        <div className="input-row">
                            <label>Ancho (%)</label>
                            <input 
                                type="range" min="1" max="100" 
                                value={selectedElement.width} 
                                onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                            />
                            <span>{selectedElement.width}%</span>
                        </div>

                        <div className="input-row">
                            <label>Alto (%)</label>
                            <input 
                                type="range" min="1" max="100" 
                                value={selectedElement.height} 
                                onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                            />
                            <span>{selectedElement.height}%</span>
                        </div>

                        <div className="input-row">
                            <label>Rotación</label>
                            <input 
                                type="range" min="-180" max="180" 
                                value={selectedElement.rotation} 
                                onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                            />
                            <span>{selectedElement.rotation}°</span>
                        </div>

                        <div className="input-row">
                            <label>Opacidad</label>
                            <input 
                                type="range" min="0" max="1" step="0.1"
                                value={selectedElement.opacity} 
                                onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                            />
                            <span>{selectedElement.opacity}</span>
                        </div>
                    </div>
                )}

                <div className="property-group">
                    <h4>Configuración de Carga (Fade)</h4>
                    <div className="input-row">
                        <label>Habilitar Fade</label>
                        <input 
                            type="checkbox" 
                            checked={config.fade.enabled} 
                            onChange={(e) => setConfig(prev => ({ ...prev, fade: { ...prev.fade, enabled: e.target.checked } }))}
                        />
                    </div>
                    <div className="input-row">
                        <label>Duración (ms)</label>
                        <input 
                            type="number" 
                            value={config.fade.duration_ms} 
                            onChange={(e) => setConfig(prev => ({ ...prev, fade: { ...prev.fade, duration_ms: Number(e.target.value) } }))}
                        />
                    </div>
                    <div className="input-row">
                        <label>Texto de Carga</label>
                        <input 
                            type="text" 
                            value={config.fade.loading_text} 
                            onChange={(e) => setConfig(prev => ({ ...prev, fade: { ...prev.fade, loading_text: e.target.value } }))}
                            style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '4px', borderRadius: '4px', flex: 1 }}
                        />
                    </div>
                </div>

                <div className="property-group">
                    <h4>Gestión de Bezels (Marcos)</h4>
                    <div className="input-row">
                        <label>Habilitar Bezels</label>
                        <input 
                            type="checkbox" 
                            checked={config.bezel?.enabled} 
                            onChange={(e) => setConfig(prev => ({ ...prev, bezel: { ...prev.bezel, enabled: e.target.checked } }))}
                        />
                    </div>
                    <div className="input-row">
                        <label>Opacidad</label>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={config.bezel?.opacity} 
                            onChange={(e) => setConfig(prev => ({ ...prev, bezel: { ...prev.bezel, opacity: Number(e.target.value) } }))}
                        />
                    </div>
                </div>

                <div className="property-group">
                    <h4>Sonidos del Sistema</h4>
                    <div className="input-row">
                        <label>Navegación</label>
                        <input type="text" value={config.sounds.navigation} readOnly />
                    </div>
                    <div className="input-row">
                        <label>Selección</label>
                        <input type="text" value={config.sounds.select} readOnly />
                    </div>
                </div>
            </div>
        </div>
    );
};
