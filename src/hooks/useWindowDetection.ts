import { useState, useCallback } from 'react';

interface UseWindowDetectionState {
  emulatorWindowDetected: boolean;
  isMonitoring: boolean;
}

export const useWindowDetection = () => {
  const [state, setState] = useState<UseWindowDetectionState>({
    emulatorWindowDetected: false,
    isMonitoring: false,
  });

  const startMonitoringWindow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMonitoring: true,
      emulatorWindowDetected: false,
    }));

    // On web/Tauri, we can detect when the emulator window takes focus
    // This is a simplified version that monitors for window focus changes
    const handleWindowFocus = () => {
      // When game is running and window regains focus, emulator is visible
      setState((prev) => ({
        ...prev,
        emulatorWindowDetected: true,
      }));
    };

    const handleWindowBlur = () => {
      // When window loses focus, user might be in emulator
      // Don't hide overlay yet
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Also check periodically if the emulator is still running
    const checkInterval = setInterval(() => {
      // In a real implementation, this would check via Tauri command
      // if the emulator process is still alive
    }, 1000);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(checkInterval);
    };
  }, []);

  const stopMonitoringWindow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMonitoring: false,
      emulatorWindowDetected: false,
    }));
  }, []);

  return {
    ...state,
    startMonitoringWindow,
    stopMonitoringWindow,
  };
};
