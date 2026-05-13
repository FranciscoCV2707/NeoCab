import { useEffect, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface KeyboardCoinConfig {
  enabled: boolean;
  coinKey: string;
  coinAmount: number;
}

interface UseKeyboardCoinInputReturn {
  config: KeyboardCoinConfig;
  updateConfig: (config: Partial<KeyboardCoinConfig>) => void;
  lastCoinAdded: number | null;
  error: string | null;
}

export const useKeyboardCoinInput = (
  initialConfig: KeyboardCoinConfig = {
    enabled: false,
    coinKey: '5',
    coinAmount: 1,
  }
): UseKeyboardCoinInputReturn => {
  const [config, setConfig] = useState<KeyboardCoinConfig>(initialConfig);
  const [lastCoinAdded, setLastCoinAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const updateConfig = useCallback((updates: Partial<KeyboardCoinConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCoinKeyPress = useCallback(async () => {
    if (!config.enabled) return;

    try {
      setError(null);
      const resultStr = await invoke<string>('add_coins_via_key', {
        amount: config.coinAmount,
      });
      const result = JSON.parse(resultStr);

      if (result.success) {
        setLastCoinAdded(Date.now());
        // Reset after 500ms
        setTimeout(() => setLastCoinAdded(null), 500);
      } else {
        setError(result.error || 'Failed to add coins');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to add coins: ${message}`);
    }
  }, [config.enabled, config.coinAmount]);

  useEffect(() => {
    if (!config.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process the configured key, avoid duplicates by debouncing
      if (event.key === config.coinKey) {
        // Prevent key event from propagating to other listeners
        event.preventDefault();

        // Debounce to avoid multiple rapid coin additions
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        const timer = setTimeout(() => {
          handleCoinKeyPress();
        }, 100);

        setDebounceTimer(timer);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [config.coinKey, config.enabled, handleCoinKeyPress, debounceTimer]);

  return {
    config,
    updateConfig,
    lastCoinAdded,
    error,
  };
};

export default useKeyboardCoinInput;
