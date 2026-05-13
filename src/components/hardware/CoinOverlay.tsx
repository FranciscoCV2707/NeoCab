import React, { useState, useEffect } from 'react';
import './CoinOverlay.css';

export interface CoinOverlayProps {
  visible: boolean;
  balance: number;
  coinsNeeded: number;
  isGameRunning: boolean;
  animateCoin?: boolean;
}

export const CoinOverlay: React.FC<CoinOverlayProps> = ({
  visible,
  balance,
  coinsNeeded,
  isGameRunning,
  animateCoin = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (animateCoin) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [animateCoin]);

  if (!visible) return null;

  const canPlayGame = balance >= coinsNeeded;
  const progressPercent = Math.min((balance / coinsNeeded) * 100, 100);

  return (
    <div className="coin-overlay">
      <div className={`coin-display ${isAnimating ? 'animate-insert' : ''}`}>
        <div className="coin-amount">
          {balance}
        </div>
        <div className="coin-icon">💰</div>
      </div>

      {!isGameRunning && (
        <div className="coin-needed">
          <div className="label">Need {Math.max(0, coinsNeeded - balance)} more</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {canPlayGame && !isGameRunning && (
        <div className="coin-ready">
          ✓ Ready to play
        </div>
      )}
    </div>
  );
};
