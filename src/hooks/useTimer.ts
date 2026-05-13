import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface TimerStatus {
  state: string;
  elapsed_seconds: number;
  remaining_seconds: number;
  total_seconds: number;
  percentage: number;
  is_overtime: boolean;
  started_at: string | null;
}

interface UseTimerReturn {
  status: TimerStatus | null;
  isGameRunning: boolean;
  error: string | null;
  startTimer: (durationSeconds: number) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  getStatus: () => Promise<TimerStatus | null>;
  checkTimeout: (emulator: string, autoExit: boolean) => Promise<boolean>;
}

export const useTimer = (): UseTimerReturn => {
  const [status, setStatus] = useState<TimerStatus | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleError = useCallback((err: any, context: string) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(`${context}: ${message}`);
    console.error(`[Timer Hook] ${context}:`, err);
  }, []);

  const getStatus = useCallback(async (): Promise<TimerStatus | null> => {
    try {
      setError(null);
      const resultStr = await invoke<string>('get_timer_status');
      if (resultStr) {
        const result = JSON.parse(resultStr);
        if (result.success) {
          const status: TimerStatus = {
            state: result.state,
            elapsed_seconds: result.elapsed_seconds,
            remaining_seconds: result.remaining_seconds,
            total_seconds: result.total_seconds,
            percentage: result.percentage,
            is_overtime: result.is_overtime,
            started_at: result.started_at,
          };
          setStatus(status);
          return status;
        }
      }
      return null;
    } catch (err) {
      handleError(err, 'Failed to get timer status');
      return null;
    }
  }, [handleError]);

  const startTimer = useCallback(
    async (durationSeconds: number) => {
      try {
        setError(null);
        const resultStr = await invoke<string>('start_timer', {
          duration_seconds: durationSeconds,
        });
        const result = JSON.parse(resultStr);
        if (result.success) {
          // Fetch full status after starting
          await getStatus();
          setIsGameRunning(true);
        }
      } catch (err) {
        handleError(err, 'Failed to start timer');
      }
    },
    [handleError, getStatus]
  );

  const pauseTimer = useCallback(async () => {
    try {
      setError(null);
      const resultStr = await invoke<string>('pause_timer');
      const result = JSON.parse(resultStr);
      if (result.success) {
        await getStatus();
      }
    } catch (err) {
      handleError(err, 'Failed to pause timer');
    }
  }, [handleError, getStatus]);

  const resumeTimer = useCallback(async () => {
    try {
      setError(null);
      const resultStr = await invoke<string>('resume_timer');
      const result = JSON.parse(resultStr);
      if (result.success) {
        await getStatus();
      }
    } catch (err) {
      handleError(err, 'Failed to resume timer');
    }
  }, [handleError, getStatus]);

  const stopTimer = useCallback(async () => {
    try {
      setError(null);
      const resultStr = await invoke<string>('stop_timer');
      const result = JSON.parse(resultStr);
      if (result.success) {
        await getStatus();
        setIsGameRunning(false);
      }
    } catch (err) {
      handleError(err, 'Failed to stop timer');
    }
  }, [handleError, getStatus]);

  const checkTimeout = useCallback(
    async (emulator: string, autoExit: boolean): Promise<boolean> => {
      try {
        setError(null);
        const result = await invoke<any>('check_timer_timeout', {
          emulator,
          auto_exit: autoExit,
        });

        if (result) {
          const timeUp = result.time_up === true || result.remaining_seconds <= 0;
          if (timeUp) {
            setIsGameRunning(false);
          }
          if (result.remaining_seconds !== undefined) {
            setStatus((prev) =>
              prev
                ? {
                    ...prev,
                    remaining_seconds: result.remaining_seconds,
                  }
                : null
            );
          }
          return result.stopped === true;
        }
        return false;
      } catch (err) {
        handleError(err, 'Failed to check timer timeout');
        return false;
      }
    },
    [handleError]
  );

  // Start timeout check loop when game is running
  useEffect(() => {
    if (!isGameRunning) {
      if (timeoutCheckIntervalRef.current) {
        clearInterval(timeoutCheckIntervalRef.current);
        timeoutCheckIntervalRef.current = null;
      }
      return;
    }

    // Check every 500ms while game is running
    timeoutCheckIntervalRef.current = setInterval(async () => {
      await getStatus();
    }, 500);

    return () => {
      if (timeoutCheckIntervalRef.current) {
        clearInterval(timeoutCheckIntervalRef.current);
        timeoutCheckIntervalRef.current = null;
      }
    };
  }, [isGameRunning, getStatus]);

  return {
    status,
    isGameRunning,
    error,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getStatus,
    checkTimeout,
  };
};

export default useTimer;
