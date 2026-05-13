import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface EmulatorInfo {
  name: string;
  id: string;
  installed: boolean;
  path?: string;
  version?: string;
}

export const useEmulatorDetection = () => {
  const [emulators, setEmulators] = useState<Map<string, EmulatorInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectEmulators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoke<string>('detect_emulators');
      const parsed = JSON.parse(result);

      const emulatorsMap = new Map<string, EmulatorInfo>();
      for (const [id, info] of Object.entries(parsed)) {
        emulatorsMap.set(id, info as EmulatorInfo);
      }

      setEmulators(emulatorsMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to detect emulators: ${message}`);
      setEmulators(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    detectEmulators();
  }, [detectEmulators]);

  const getInstalledEmulators = useCallback(() => {
    return Array.from(emulators.values()).filter((e) => e.installed);
  }, [emulators]);

  const getMissingEmulators = useCallback(() => {
    return Array.from(emulators.values()).filter((e) => !e.installed);
  }, [emulators]);

  const getEmulatorInfo = useCallback(
    (id: string) => {
      return emulators.get(id);
    },
    [emulators]
  );

  const getDownloadUrl = useCallback((emulatorsIds: string[]) => {
    const urls: { [key: string]: string } = {
      mame: 'https://www.mamedev.org/',
      retroarch: 'https://www.retroarch.com/',
      pcsx2: 'https://pcsx2.net/',
      dolphin: 'https://dolphin-emu.org/',
      cemu: 'https://cemu.info/',
      rpcs3: 'https://rpcs3.net/',
    };

    return emulatorsIds
      .map((id) => ({
        id,
        url: urls[id] || null,
      }))
      .filter((item) => item.url !== null);
  }, []);

  return {
    emulators,
    loading,
    error,
    detectEmulators,
    getInstalledEmulators,
    getMissingEmulators,
    getEmulatorInfo,
    getDownloadUrl,
  };
};
