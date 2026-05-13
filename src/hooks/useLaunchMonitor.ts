import { useState, useCallback, useEffect } from 'react';
import { invoke, listen, UnlistenFn } from '@tauri-apps/api/core';

interface UseLaunchMonitorState {
  isLaunching: boolean;
  isGameRunning: boolean;
  emulatorPID: number | null;
  error: string | null;
}

export const useLaunchMonitor = () => {
  const [state, setState] = useState<UseLaunchMonitorState>({
    isLaunching: false,
    isGameRunning: false,
    emulatorPID: null,
    error: null,
  });

  const [unlistenFns, setUnlistenFns] = useState<UnlistenFn[]>([]);

  // Setup event listeners
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Listen for emulator exit event
        const unlistenExit = await listen('emulator_exited', (event: any) => {
          console.log('Emulator exited:', event.payload);
          setState((prev) => ({
            ...prev,
            isGameRunning: false,
            isLaunching: false,
            emulatorPID: null,
          }));
        });

        // Listen for emulator started event
        const unlistenStart = await listen('emulator_started', (event: any) => {
          console.log('Emulator started:', event.payload);
          setState((prev) => ({
            ...prev,
            isLaunching: false,
            isGameRunning: true,
            emulatorPID: event.payload.pid,
          }));
        });

        setUnlistenFns([unlistenExit, unlistenStart]);
      } catch (err) {
        console.error('Failed to setup listeners:', err);
      }
    };

    setupListeners();

    return () => {
      unlistenFns.forEach((fn) => fn());
    };
  }, []);

  const startLaunchMonitoring = useCallback(async (gameId: i64, emulatorName: string) => {
    setState((prev) => ({
      ...prev,
      isLaunching: true,
      error: null,
    }));

    try {
      await invoke('launch_game_with_monitoring', { gameId, emulatorName });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        isLaunching: false,
        error: errorMsg,
      }));
    }
  }, []);

  const stopGameMonitoring = useCallback(async () => {
    try {
      await invoke('stop_game_with_monitoring');
      setState((prev) => ({
        ...prev,
        isGameRunning: false,
        isLaunching: false,
        emulatorPID: null,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        error: errorMsg,
      }));
    }
  }, []);

  return {
    ...state,
    startLaunchMonitoring,
    stopGameMonitoring,
  };
};
