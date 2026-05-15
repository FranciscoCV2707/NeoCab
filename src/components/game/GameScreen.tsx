import React from 'react';
import './GameScreen.css';

interface GameScreenProps {
  onBack?: () => void;
}

/**
 * Placeholder for GameScreen - currently handled by App.tsx views
 * TODO: Re-implement with wheel component when available
 */
export const GameScreen: React.FC<GameScreenProps> = ({ onBack }) => {
  return (
    <div className="game-screen">
      <div className="game-screen-placeholder">
        <h2>Game Screen</h2>
        <p>This view is currently handled by the main App component.</p>
        {onBack && (
          <button onClick={onBack} className="back-button">
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};
