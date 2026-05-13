import React, { useEffect, useState } from 'react';
import './FadeOverlay.css';

interface FadeOverlayProps {
    visible: boolean;
    gameName?: string;
    systemName?: string;
    config?: {
        duration_ms: number;
        background_image: string;
        loading_text: string;
        show_logo: bool;
    };
}

export const FadeOverlay: React.FC<FadeOverlayProps> = ({ visible, gameName, systemName, config }) => {
    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500); // Wait for CSS transition
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <div className={`fade-overlay ${visible ? 'visible' : 'hidden'}`} style={{ 
            backgroundImage: config?.background_image ? `url(${config.background_image})` : 'none' 
        }}>
            <div className="fade-content">
                {config?.show_logo && <div className="fade-logo">NEOCAB</div>}
                
                <div className="fade-info">
                    <h2 className="game-name">{gameName ?? 'Iniciando Juego'}</h2>
                    <h3 className="system-name">{systemName ?? 'Arcade System'}</h3>
                </div>

                <div className="loading-container">
                    <div className="loading-bar"></div>
                    <p className="loading-text">{config?.loading_text ?? 'CARGANDO...'}</p>
                </div>
            </div>
        </div>
    );
};
