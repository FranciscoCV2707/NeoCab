import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface MediaStats {
  total_files: number;
  total_size: number;
  wheels_count: number;
  box_art_count: number;
  backgrounds_count: number;
  screenshots_count: number;
}

interface SystemMedia {
  system: string;
  wheels: number;
  box_art: number;
  backgrounds: number;
  screenshots: number;
  total_size: number;
}

interface UseMediaReturn {
  stats: MediaStats | null;
  systemMedia: SystemMedia | null;
  isLoading: boolean;
  error: string | null;
  scanMedia: () => Promise<void>;
  getStats: () => Promise<void>;
  getSystemMedia: (system: string) => Promise<void>;
  organizeMedia: (sourceDir: string) => Promise<number>;
  getMedia: (system: string, gameName: string, mediaType: string) => Promise<string | null>;
  importMedia: (sourcePath: string) => Promise<number>;
}

export const useMedia = (): UseMediaReturn => {
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [systemMedia, setSystemMedia] = useState<SystemMedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, context: string) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(`${context}: ${message}`);
    console.error(`[Media Hook] ${context}:`, err);
  }, []);

  const scanMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('scan_media');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        console.log('[Media Hook] Scan complete:', parsed.library);
      } else {
        handleError(parsed.error, 'Failed to scan media');
      }
    } catch (err) {
      handleError(err, 'Error scanning media');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const getStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('get_media_stats');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setStats(parsed.stats);
      } else {
        handleError(parsed.error, 'Failed to get media stats');
      }
    } catch (err) {
      handleError(err, 'Error getting media stats');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const getSystemMedia = useCallback(async (system: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('get_system_media', { system });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setSystemMedia({
          system: parsed.system,
          wheels: parsed.media.wheels,
          box_art: parsed.media.box_art,
          backgrounds: parsed.media.backgrounds,
          screenshots: parsed.media.screenshots,
          total_size: parsed.media.total_size,
        });
      } else {
        handleError(parsed.error, `Failed to get media for ${system}`);
      }
    } catch (err) {
      handleError(err, `Error getting media for ${system}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const organizeMedia = useCallback(async (sourceDir: string): Promise<number> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('organize_media', { source_dir: sourceDir });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        await getStats();
        return parsed.files_organized;
      } else {
        throw new Error(parsed.error);
      }
    } catch (err) {
      handleError(err, 'Error organizing media');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, getStats]);

  const getMedia = useCallback(async (system: string, gameName: string, mediaType: string): Promise<string | null> => {
    try {
      setError(null);
      const result = await invoke<string>('get_media', {
        system,
        game_name: gameName,
        media_type: mediaType,
      });
      const parsed = JSON.parse(result);
      if (parsed.success && parsed.exists) {
        return parsed.path;
      }
      return null;
    } catch (err) {
      handleError(err, `Error getting ${mediaType} for ${system}/${gameName}`);
      return null;
    }
  }, [handleError]);

  const importMedia = useCallback(async (sourcePath: string): Promise<number> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('import_media', { source_path: sourcePath });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        await getStats();
        return parsed.files_imported;
      } else {
        throw new Error(parsed.error);
      }
    } catch (err) {
      handleError(err, 'Error importing media');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, getStats]);

  // Load stats on mount
  useEffect(() => {
    getStats();
  }, [getStats]);

  return {
    stats,
    systemMedia,
    isLoading,
    error,
    scanMedia,
    getStats,
    getSystemMedia,
    organizeMedia,
    getMedia,
    importMedia,
  };
};

export default useMedia;
