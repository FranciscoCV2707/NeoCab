import React, { useEffect, useState } from 'react';
import { CoinOverlay } from '../hardware/CoinOverlay';
import { useTimer } from '../../hooks/useTimer';
import { invoke } from '@tauri-apps/api/core';
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
}

export const GameRunningOverlay: React.FC<GameRunningOverlayProps> = ({
  isRunning,
  gameId = '',
  systemName = 'ARCADE',
  durationSeconds = 180,
  coinsNeeded = 1,
  balance = 0,
  autoExit = true,
  warnBeforeSeconds = 30,
  onGameEnded,
}) => {
  const { status, startTimer, stopTimer, checkTimeout, isGameRunning } =
    useTimer();
  const [lastCheckTimeout, setLastCheckTimeout] = useState(0);
  const [gameStopped, setGameStopped] = useState(false);

  // Start timer when game is running
  useEffect(() => {
    if (isRunning && !isGameRunning) {
      startTimer(durationSeconds);
    }
  }, [isRunning, isGameRunning, durationSeconds, startTimer]);

  // Check timeout periodically while game is running
  useEffect(() => {
    if (!isRunning || gameStopped) {
      return;
    }

    const checkTimeoutInterval = setInterval(async () => {
      try {
        const emulator = systemName.toLowerCase();
        const stopped = await checkTimeout(emulator, autoExit);

        if (stopped) {
          setGameStopped(true);
          await stopTimer();
          if (onGameEnded) {
            onGameEnded();
          }
        }
      } catch (err) {
        console.error('Error checking timeout:', err);
      }
    }, 1000); // Check every second for timeout

    return () => clearInterval(checkTimeoutInterval);
  }, [
    isRunning,
    gameStopped,
    systemName,
    autoExit,
    checkTimeout,
    stopTimer,
    onGameEnded,
  ]);

  if (!isRunning) return null;

  return (
    <div className="game-running-overlay">
      <CoinOverlay
        visible={true}
        balance={balance}
        coinsNeeded={coinsNeeded}
        isGameRunning={isRunning && !gameStopped}
        remainingSeconds={status?.remaining_seconds || 0}
        warnBefore={warnBeforeSeconds}
      />
    </div>
  );
};

export default GameRunningOverlay;
