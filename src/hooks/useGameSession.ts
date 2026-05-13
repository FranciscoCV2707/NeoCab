import { useEffect, useCallback } from 'react';
import { useTauri } from './useTauri';

interface GameSessionState {
  sessionId: number | null;
  startTime: number | null;
}

/**
 * Hook to manage game session lifecycle
 * Tracks when game is running and ends session when game closes
 */
export const useGameSession = () => {
  const tauri = useTauri();

  const endCurrentSession = useCallback(async () => {
    const sessionId = sessionStorage.getItem('currentGameSessionId');
    const startTime = sessionStorage.getItem('currentGameStartTime');

    if (sessionId && startTime) {
      try {
        const durationSec = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
        await tauri.endGameSession(parseInt(sessionId, 10), durationSec, true);
        console.log(`Session ${sessionId} ended (duration: ${durationSec}s)`);

        // Clear session storage
        sessionStorage.removeItem('currentGameSessionId');
        sessionStorage.removeItem('currentGameStartTime');
      } catch (err) {
        console.error('Error ending game session:', err);
      }
    }
  }, [tauri]);

  const stopGame = useCallback(async () => {
    try {
      await tauri.stopGameWithMonitoring();
      await endCurrentSession();
    } catch (err) {
      console.error('Error stopping game:', err);
    }
  }, [tauri, endCurrentSession]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const sessionId = sessionStorage.getItem('currentGameSessionId');
      if (sessionId) {
        // Prevent unload for a moment to allow cleanup
        e.preventDefault();
        e.returnValue = '';
        await endCurrentSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endCurrentSession]);

  return {
    endCurrentSession,
    stopGame,
  };
};

export default useGameSession;
