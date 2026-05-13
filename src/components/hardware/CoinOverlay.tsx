import React, { useState, useEffect } from 'react';
import './CoinOverlay.css';

export interface CoinOverlayProps {
  visible: boolean;
  balance: number;
  coinsNeeded: number;
  isGameRunning: boolean;
  animateCoin?: boolean;
  remainingSeconds?: number;
  warnBefore?: number;
}

export const CoinOverlay: React.FC<CoinOverlayProps> = ({
  visible,
  balance,
  coinsNeeded,
  isGameRunning,
  animateCoin = false,
  remainingSeconds = 0,
  warnBefore = 30,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Check if should show warning
  useEffect(() => {
    if (isGameRunning && remainingSeconds > 0 && remainingSeconds <= warnBefore) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [remainingSeconds, warnBefore, isGameRunning]);

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
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="coin-overlay">
      {/* Time warning section (only when game is running) */}
      {isGameRunning && remainingSeconds > 0 && (
        <div className={`time-display ${showWarning ? 'warning' : ''}`}>
          <div className="time-label">Time Remaining</div>
          <div className="time-value">
            {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`}
          </div>
          {showWarning && (
            <div className="warning-indicator">
              ⚠️ Time Running Out!
            </div>
          )}
        </div>
      )}

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
