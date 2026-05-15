import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface ThemeInfo {
  name: string;
  author: string;
  version: string;
  description?: string;
  preview_path?: string;
}

export interface ThemeData {
  name: string;
  author: string;
  version: string;
  description?: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  layout: {
    system_view: string;
    game_view: string;
    wheel_style: string;
    transition: string;
    animation_speed: number;
    easing: string;
  };
  media: Record<string, any>;
  sounds: Record<string, string>;
  effects: {
    scanlines: boolean;
    crt_curve: number;
    glow_intensity: number;
    shadow_enabled: boolean;
  };
  wheel?: Record<string, any>;
}

interface UseThemeReturn {
  themes: ThemeInfo[];
  currentTheme: ThemeData | null;
  isLoading: boolean;
  error: string | null;
  listThemes: () => Promise<void>;
  getCurrentTheme: () => Promise<void>;
  loadTheme: (name: string) => Promise<void>;
  saveCustomTheme: (theme: ThemeData) => Promise<string>;
  exportTheme: (name: string) => Promise<string>;
  importTheme: (path: string) => Promise<string>;
  applyTheme: (name: string) => Promise<void>;
}

export const useTheme = (): UseThemeReturn => {
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, context: string) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(`${context}: ${message}`);
    console.error(`[Theme Hook] ${context}:`, err);
  }, []);

  const listThemes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('list_themes');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setThemes(parsed.themes || []);
      } else {
        handleError(parsed.error, 'Failed to list themes');
      }
    } catch (err) {
      handleError(err, 'Error listing themes');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const getCurrentTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('get_current_theme');
      const parsed = JSON.parse(result);
      setCurrentTheme(parsed);
    } catch (err) {
      handleError(err, 'Error getting current theme');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const loadTheme = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('load_theme', { name });
      const parsed = JSON.parse(result);
      if (parsed.success && parsed.theme) {
        setCurrentTheme(parsed.theme);
      } else {
        handleError(parsed.error, `Failed to load theme: ${name}`);
      }
    } catch (err) {
      handleError(err, `Error loading theme: ${name}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const saveCustomTheme = useCallback(async (theme: ThemeData): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      const themeJson = JSON.stringify(theme);
      const result = await invoke<string>('save_custom_theme', { theme: themeJson });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setCurrentTheme(theme);
        await listThemes();
        return parsed.theme_name || theme.name;
      } else {
        throw new Error(parsed.error);
      }
    } catch (err) {
      handleError(err, 'Error saving custom theme');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, listThemes]);

  const exportTheme = useCallback(async (name: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('export_theme', { name });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        return parsed.export_path;
      } else {
        throw new Error(parsed.error);
      }
    } catch (err) {
      handleError(err, `Error exporting theme: ${name}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const importTheme = useCallback(async (path: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('import_theme', { path });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        await listThemes();
        return parsed.theme_name;
      } else {
        throw new Error(parsed.error);
      }
    } catch (err) {
      handleError(err, `Error importing theme from: ${path}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, listThemes]);

  const applyTheme = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('apply_theme', { name });
      const parsed = JSON.parse(result);
      if (!parsed.success) {
        throw new Error(parsed.error);
      }
      await getCurrentTheme();
    } catch (err) {
      handleError(err, `Error applying theme: ${name}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, getCurrentTheme]);

  // Load current theme on mount
  useEffect(() => {
    getCurrentTheme();
  }, [getCurrentTheme]);

  return {
    themes,
    currentTheme,
    isLoading,
    error,
    listThemes,
    getCurrentTheme,
    loadTheme,
    saveCustomTheme,
    exportTheme,
    importTheme,
    applyTheme,
  };
};

export default useTheme;
