import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/core';
import { CoinOverlay } from '../hardware/CoinOverlay';
import { useTimer } from '../../hooks/useTimer';
import { useGameSession } from '../../hooks/useGameSession';
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
  const { status, startTimer, stopTimer, checkTimeout, isGameRunning } =
    useTimer();
  const { endCurrentSession } = useGameSession();
  const [gameStopped, setGameStopped] = useState(false);

  // Start timer when game is running
  useEffect(() => {
    if (isRunning && !isGameRunning) {
      startTimer(durationSeconds);
    }
  }, [isRunning, isGameRunning, durationSeconds, startTimer]);

  // Setup emulator exit listener (crash detection)
  useEffect(() => {
    if (!isRunning || gameStopped) {
      return;
    }

    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      try {
        unlistenFn = await listen('emulator_exited', async (event: any) => {
          console.log('Emulator crash detected:', event.payload);
          setGameStopped(true);
          await stopTimer();
          await endCurrentSession();
          if (onGameEnded) {
            onGameEnded();
          }
        });
      } catch (err) {
        console.error('Failed to setup emulator exit listener:', err);
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [isRunning, gameStopped, stopTimer, onGameEnded, endCurrentSession]);

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
          await endCurrentSession();
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
    endCurrentSession,
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
