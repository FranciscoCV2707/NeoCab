import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { CoinOverlay } from '../hardware/CoinOverlay';
import './GameRunningOverlay.css';

interface GameRunningOverlayProps {
  isRunning: boolean;
  gameId?: string;
  systemName?: string;
  durationSeconds?: number;
  coinsNeeded?: number;
  balance?: number;
  autoExit?: boolean;
  warnBeforeSeconds?: number;
  onGameEnded?: () => void;
  emulatorPID?: number | null;
}

export const GameRunningOverlay: React.FC<GameRunningOverlayProps> = ({
  isRunning,
  gameId: _gameId,
  systemName = 'ARCADE',
  durationSeconds = 180,
  coinsNeeded = 1,
  balance = 0,
  autoExit = true,
  warnBeforeSeconds = 30,
  onGameEnded,
  emulatorPID: _emulatorPID,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [gameStopped, setGameStopped] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      setTimeRemaining(durationSeconds);
      return;
    }
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onGameEnded) onGameEnded();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, durationSeconds, onGameEnded]);

  useEffect(() => {
    if (!isRunning || gameStopped) return;

    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      try {
        unlistenFn = await listen('emulator_exited', async () => {
          console.log('Emulator crash detected');
          setGameStopped(true);
          setTimeRemaining(0);
          if (onGameEnded) onGameEnded();
        });
      } catch (err) {
        console.error('Failed to setup emulator exit listener:', err);
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [isRunning, gameStopped, onGameEnded]);

  useEffect(() => {
    if (!isRunning || gameStopped) return;

    const checkInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0 && autoExit) {
          clearInterval(checkInterval);
          setGameStopped(true);
          if (onGameEnded) onGameEnded();
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isRunning, gameStopped, autoExit, onGameEnded]);

  if (!isRunning) return null;

  return (
    <div className="game-running-overlay">
      <CoinOverlay
        visible={true}
        balance={balance}
        coinsNeeded={coinsNeeded}
        isGameRunning={isRunning && !gameStopped}
        remainingSeconds={timeRemaining}
      />
      {timeRemaining <= warnBeforeSeconds && timeRemaining > 0 && (
        <div className={`timeout-warning ${timeRemaining <= 10 ? 'critical' : ''}`}>
          <div className="timer-value">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
          <div className="timer-label">Time remaining - {systemName}</div>
        </div>
      )}
    </div>
  );
};
