import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import './SessionOverlay.css';

interface SessionOverlayProps {
  visible: boolean;
  systemName: string;
  onSessionExpired?: () => void;
}

export const SessionOverlay: React.FC<SessionOverlayProps> = ({
  visible,
  systemName,
  onSessionExpired,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const unlistenWarning = listen('timer_warning', () => {
      setShowWarning(true);
    });

    const unlistenExpired = listen('time_expired', () => {
      setShowExpired(true);
      onSessionExpired?.();
    });

    const unlistenStarted = listen('session_started', () => {
      setShowWarning(false);
      setShowExpired(false);
    });

    const interval = setInterval(async () => {
      try {
        const result = await invoke<string>('session_get_status');
        const parsed = JSON.parse(result);
        if (parsed.success) {
          setStatus(parsed.status);
        }
      } catch (err) {
        console.error('Failed to get session status:', err);
      }
    }, 1000);

    return () => {
      unlistenWarning.then((f: () => void) => f());
      unlistenExpired.then((f: () => void) => f());
      unlistenStarted.then((f: () => void) => f());
      clearInterval(interval);
    };
  }, [visible, onSessionExpired]);

  if (!visible || !status) return null;
  if (status.mode === 'unlimited') return null;

  const minutes = Math.floor(status.remaining_seconds / 60);
  const seconds = status.remaining_seconds % 60;
  const percentage = status.total_seconds > 0
    ? (status.remaining_seconds / status.total_seconds) * 100
    : 100;

  const isLow = status.remaining_seconds <= 60;
  const isCritical = status.remaining_seconds <= 15;

  return (
    <div className={`session-overlay ${isCritical ? 'critical' : isLow ? 'warning' : ''}`}>
      <div className="session-info">
        {status.mode === 'arcade' && (
          <div className="session-credits">
            <span className="credit-icon">🪙</span>
            <span className="credit-count">{status.credits}</span>
            <span className="credit-label">CREDITS</span>
          </div>
        )}

        <div className="session-timer">
          <div className="timer-display">
            <span className="timer-minutes">{minutes.toString().padStart(2, '0')}</span>
            <span className="timer-separator">:</span>
            <span className="timer-seconds">{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div className="timer-bar">
            <div
              className="timer-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="timer-label">{systemName}</div>
        </div>
      </div>

      {showWarning && (
        <div className="session-warning animate-blink">
          INSERT COINS TO CONTINUE!
        </div>
      )}

      {showExpired && (
        <div className="session-expired">
          <div className="expired-title">GAME OVER</div>
          <div className="expired-subtitle">Insert coins to continue playing</div>
        </div>
      )}
    </div>
  );
};

export default SessionOverlay;
