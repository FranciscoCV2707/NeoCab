import { useEffect, useCallback, useRef } from 'react';

export type GamepadAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'CONFIRM' | 'BACK' | 'COIN';

interface UseGamepadOptions {
  onAction: (action: GamepadAction) => void;
  enabled?: boolean;
}

export const useGamepad = ({ onAction, enabled = true }: UseGamepadOptions) => {
  const requestRef = useRef<number>();
  const lastState = useRef<Record<string, boolean>>({});

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Use first gamepad

    if (gp) {
      const newState: Record<string, boolean> = {
        UP: gp.axes[1] < -0.5 || gp.buttons[12].pressed,
        DOWN: gp.axes[1] > 0.5 || gp.buttons[13].pressed,
        LEFT: gp.axes[0] < -0.5 || gp.buttons[14].pressed,
        RIGHT: gp.axes[0] > 0.5 || gp.buttons[15].pressed,
        CONFIRM: gp.buttons[0].pressed || gp.buttons[1].pressed, // A or B
        BACK: gp.buttons[2].pressed || gp.buttons[3].pressed, // X or Y
        COIN: gp.buttons[8].pressed || gp.buttons[9].pressed, // Select or Start
      };

      Object.keys(newState).forEach((key) => {
        const action = key as GamepadAction;
        if (newState[action] && !lastState.current[action]) {
          onAction(action);
        }
      });

      lastState.current = newState;
    }

    requestRef.current = requestAnimationFrame(pollGamepad);
  }, [onAction]);

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(pollGamepad);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled, pollGamepad]);
};
