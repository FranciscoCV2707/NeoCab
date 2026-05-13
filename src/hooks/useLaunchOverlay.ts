import { useState, useCallback } from 'react';

export interface LaunchState {
  isVisible: boolean;
  gameName?: string;
  message?: string;
  duration?: number;
}

export const useLaunchOverlay = () => {
  const [state, setState] = useState<LaunchState>({
    isVisible: false,
  });

  const showLaunchOverlay = useCallback(
    (gameName: string, message: string = 'Iniciando juego...', duration: number = 3000) => {
      setState({
        isVisible: true,
        gameName,
        message,
        duration,
      });
    },
    []
  );

  const hideLaunchOverlay = useCallback(() => {
    setState({
      isVisible: false,
    });
  }, []);

  const completeLaunch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  return {
    ...state,
    showLaunchOverlay,
    hideLaunchOverlay,
    completeLaunch,
  };
};

export default useLaunchOverlay;
