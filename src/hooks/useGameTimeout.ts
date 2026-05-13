import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UseGameTimeoutConfig {
  enabled?: boolean;
  warnBeforeSeconds?: number;
  autoCloseOnTimeout?: boolean;
}

interface UseGameTimeoutState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  isExpired: boolean;
  shouldWarn: boolean;
  state: 'idle' | 'running' | 'warning' | 'expired';
}

export const useGameTimeout = (config: UseGameTimeoutConfig = {}) => {
  const {
    enabled = true,
    warnBeforeSeconds = 30,
    autoCloseOnTimeout = true,
  } = config;

  const [timeoutState, setTimeoutState] = useState<UseGameTimeoutState>({
    isRunning: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    isExpired: false,
    shouldWarn: false,
    state: 'idle',
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimeoutMonitoring = useCallback(async () => {
    if (!enabled) return;

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Poll timer status every 500ms
    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusStr = await invoke<string>('get_timer_status');
        const status = JSON.parse(statusStr);

        const isRunning = status.state === 'running';
        const remaining = Math.max(0, status.remaining_seconds);
        const isExpired = remaining === 0 && isRunning === false;
        const shouldWarn = remaining > 0 && remaining <= warnBeforeSeconds;

        let newState: UseGameTimeoutState['state'];
        if (isExpired) {
          newState = 'expired';
        } else if (shouldWarn) {
          newState = 'warning';
        } else if (isRunning) {
          newState = 'running';
        } else {
          newState = 'idle';
        }

        setTimeoutState({
          isRunning,
          remainingSeconds: remaining,
          totalSeconds: status.total_seconds,
          isExpired,
          shouldWarn,
          state: newState,
        });

        // Auto-close if timeout expired
        if (isExpired && autoCloseOnTimeout) {
          await invoke('stop_game');
          clearInterval(pollIntervalRef.current!);
        }
      } catch (err) {
        console.error('Failed to check timer status:', err);
      }
    }, 500);
  }, [enabled, warnBeforeSeconds, autoCloseOnTimeout]);

  const stopTimeoutMonitoring = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimeoutMonitoring();
    };
  }, [stopTimeoutMonitoring]);

  return {
    ...timeoutState,
    startMonitoring: startTimeoutMonitoring,
    stopMonitoring: stopTimeoutMonitoring,
  };
};
