import React from 'react';
import { useGameTimeout } from '../../hooks/useGameTimeout';
import './TimeoutWarning.css';

interface TimeoutWarningProps {
  enabled?: boolean;
  warnBeforeSeconds?: number;
  autoClose?: boolean;
}

export const TimeoutWarning: React.FC<TimeoutWarningProps> = ({
  enabled = true,
  warnBeforeSeconds = 30,
  autoClose = true,
}) => {
  const timeout = useGameTimeout({
    enabled,
    warnBeforeSeconds,
    autoCloseOnTimeout: autoClose,
  });

  React.useEffect(() => {
    if (enabled) {
      timeout.startMonitoring();
    }
    return () => {
      timeout.stopMonitoring();
    };
  }, [enabled, timeout]);

  if (timeout.state === 'idle' || !timeout.isRunning) {
    return null;
  }

  const minutes = Math.floor(timeout.remainingSeconds / 60);
  const seconds = timeout.remainingSeconds % 60;

  return (
    <>
      {/* Normal timer display */}
      {timeout.state === 'running' && (
        <div className="timer-display">
          <div className="timer-value">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="timer-label">Tiempo restante</div>
        </div>
      )}

      {/* Warning overlay when time is running out */}
      {timeout.state === 'warning' && (
        <div className="timeout-warning-overlay">
          <div className="warning-content pulse">
            <div className="warning-icon">⏰</div>
            <div className="warning-title">¡TIEMPO AGOTÁNDOSE!</div>
            <div className="warning-time">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="warning-message">
              Quedan {timeout.remainingSeconds} segundos
            </div>
          </div>
        </div>
      )}

      {/* Expired overlay */}
      {timeout.state === 'expired' && (
        <div className="timeout-expired-overlay">
          <div className="expired-content fade-out">
            <div className="expired-icon">⏱️</div>
            <div className="expired-title">¡TIEMPO AGOTADO!</div>
            <div className="expired-message">El juego se cerrará automáticamente...</div>
          </div>
        </div>
      )}
    </>
  );
};
