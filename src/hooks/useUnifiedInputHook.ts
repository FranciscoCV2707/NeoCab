import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { InputAction, KeymapConfig, DEFAULT_KEYMAP, loadKeymap, saveKeymap, resetKeymap } from './useUnifiedInput';

interface UseUnifiedInputOptions {
  onAction: (action: InputAction) => void;
  enabled?: boolean;
  repeatDelay?: number;
}

export function useUnifiedInputConfig() {
  const keymapRef = useRef<KeymapConfig>(loadKeymap());

  const updateKeymap = useCallback((action: InputAction, keys: string[], type: 'keyboard' | 'gamepad') => {
    const updated = {
      ...keymapRef.current,
      [type]: { ...keymapRef.current[type], [action]: keys },
    };
    keymapRef.current = updated;
    saveKeymap(updated);
  }, []);

  const reset = useCallback(() => {
    resetKeymap();
    keymapRef.current = DEFAULT_KEYMAP;
  }, []);

  return { keymap: keymapRef.current, updateKeymap, resetKeymap: reset };
}

export function useUnifiedInput({ onAction, enabled = true, repeatDelay = 200 }: UseUnifiedInputOptions) {
  const keymap = useRef<KeymapConfig>(DEFAULT_KEYMAP);
  const lastActionTime = useRef<Map<string, number>>(new Map());
  const onActionRef = useRef(onAction);

  useEffect(() => {
    keymap.current = loadKeymap();
  }, []);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const findAction = useCallback((input: string): InputAction | null => {
    const km = keymap.current;
    for (const [action, keys] of Object.entries(km.keyboard)) {
      if (keys.includes(input)) return action as InputAction;
    }
    return null;
  }, []);

  const findGamepadAction = useCallback((input: string): InputAction | null => {
    const km = keymap.current;
    for (const [action, keys] of Object.entries(km.gamepad)) {
      if (keys.includes(input)) return action as InputAction;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const action = findAction(e.key);
      if (action) {
        e.preventDefault();
        onActionRef.current(action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, findAction]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(async () => {
      try {
        const result = await invoke<string>('get_input_state', {});
        const state = JSON.parse(result);

        if (state.axes) {
          const axes = state.axes as Record<string, number>;
          for (const [axisStr, value] of Object.entries(axes)) {
            const numAxis = parseInt(axisStr);
            if (value > 0.5) {
              if (numAxis === 0) triggerGP('left_stick_right');
              else if (numAxis === 1) triggerGP('left_stick_down');
              else if (numAxis === 2) triggerGP('right_stick_right');
              else if (numAxis === 3) triggerGP('right_stick_down');
            } else if (value < -0.5) {
              if (numAxis === 0) triggerGP('left_stick_left');
              else if (numAxis === 1) triggerGP('left_stick_up');
              else if (numAxis === 2) triggerGP('right_stick_left');
              else if (numAxis === 3) triggerGP('right_stick_up');
            }
          }
        }
      } catch {
        // Backend not ready
      }
    }, 16);

    return () => clearInterval(interval);

    function triggerGP(input: string) {
      const action = findGamepadAction(input);
      if (!action) return;
      const now = Date.now();
      const last = lastActionTime.current.get(action) || 0;
      if (now - last < repeatDelay) return;
      lastActionTime.current.set(action, now);
      onActionRef.current(action);
    }
  }, [enabled, findGamepadAction, repeatDelay]);
}
