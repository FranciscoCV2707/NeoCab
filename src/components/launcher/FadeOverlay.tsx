import React, { useEffect, useState } from 'react';
import './FadeOverlay.css';

export interface FadeOverlayProps {
  isVisible: boolean;
  gameName?: string;
  message?: string;
  duration?: number;
  onFadeComplete?: () => void;
}

export const FadeOverlay: React.FC<FadeOverlayProps> = ({
  isVisible,
  gameName,
  message = 'Iniciando juego...',
  duration = 3000,
  onFadeComplete,
}) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setFadeOut(false);

      // Auto fade out after duration
      const timer = setTimeout(() => {
        setFadeOut(true);
        if (onFadeComplete) {
          setTimeout(onFadeComplete, 500); // Wait for fade animation
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onFadeComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fade-overlay ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <div className="fade-content">
        <div className="spinner"></div>
        <h2>{gameName || 'NeoCab'}</h2>
        <p>{message}</p>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default FadeOverlay;
