import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface ShaderParam {
  name: string;
  display_name: string;
  type: string;
  min: number;
  max: number;
  default: number;
}

interface ShaderInfo {
  name: string;
  description: string;
  type: string;
  parameters_count: number;
  parameters?: ShaderParam[];
  is_valid?: boolean;
  validation_errors?: string[];
}

interface ShaderPreset {
  name: string;
  shader: string;
  parameters: Record<string, number>;
}

interface ShaderScanStats {
  total_shaders: number;
  custom_shaders: number;
  invalid_shaders: number;
  scan_duration_ms: number;
  custom_shaders_path: string;
}

interface UseShaderReturn {
  shaders: ShaderInfo[];
  currentShader: ShaderInfo | null;
  presets: string[];
  currentPreset: ShaderPreset | null;
  shaderParams: Record<string, number>;
  scanStats: ShaderScanStats | null;
  lastRefreshedAt: number | null;
  isWatcherRunning: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  listShaders: () => Promise<void>;
  refreshShaders: () => Promise<void>;
  startShaderWatcher: () => Promise<void>;
  stopShaderWatcher: () => Promise<void>;
  getShader: (name: string) => Promise<ShaderInfo | null>;
  getShaderPreset: (presetName: string) => Promise<ShaderPreset | null>;
  applyShader: (shaderName: string) => Promise<void>;
  applyPreset: (presetName: string) => Promise<void>;
  validateShader: (shaderName: string) => Promise<{ valid: boolean; errors: string[] }>;
  getShaderParams: () => Promise<Record<string, number>>;
  setShaderParam: (paramName: string, value: number) => Promise<void>;
  getDefaultShader: () => Promise<{ shader: string; preset: string }>;
}

export const useShaders = (): UseShaderReturn => {
  const [shaders, setShaders] = useState<ShaderInfo[]>([]);
  const [currentShader, setCurrentShader] = useState<ShaderInfo | null>(null);
  const [presets, setPresets] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<ShaderPreset | null>(null);
  const [shaderParams, setShaderParams] = useState<Record<string, number>>({});
  const [scanStats, setScanStats] = useState<ShaderScanStats | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [isWatcherRunning, setIsWatcherRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, context: string) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(`${context}: ${message}`);
    console.error(`[Shader Hook] ${context}:`, err);
  }, []);

  const loadShaders = useCallback(async (
    command: 'list_shaders' | 'rescan_shaders',
    mode: 'initial' | 'refresh'
  ) => {
    try {
      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const result = await invoke<string>(command);
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setShaders(parsed.shaders || []);
        setScanStats(parsed.scan_stats || null);
        setLastRefreshedAt(Date.now());
      } else {
        handleError(parsed.error, 'Failed to list shaders');
      }
    } catch (err) {
      handleError(err, 'Error listing shaders');
    } finally {
      if (mode === 'initial') {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [handleError]);

  const listShaders = useCallback(async () => {
    await loadShaders('list_shaders', 'initial');
  }, [loadShaders]);

  const refreshShaders = useCallback(async () => {
    await loadShaders('rescan_shaders', 'refresh');
  }, [loadShaders]);

  const startShaderWatcher = useCallback(async () => {
    try {
      setError(null);
      const result = await invoke<string>('start_shader_watcher');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setIsWatcherRunning(Boolean(parsed.running));
      } else {
        handleError(parsed.error, 'Failed to start shader watcher');
      }
    } catch (err) {
      handleError(err, 'Error starting shader watcher');
    }
  }, [handleError]);

  const stopShaderWatcher = useCallback(async () => {
    try {
      const result = await invoke<string>('stop_shader_watcher');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setIsWatcherRunning(Boolean(parsed.running));
      } else {
        handleError(parsed.error, 'Failed to stop shader watcher');
      }
    } catch (err) {
      handleError(err, 'Error stopping shader watcher');
    }
  }, [handleError]);

  const getShader = useCallback(
    async (name: string): Promise<ShaderInfo | null> => {
      try {
        setError(null);
        const result = await invoke<string>('get_shader', { name });
        const parsed = JSON.parse(result);
        if (parsed.success) {
          const shaderInfo: ShaderInfo = {
            name: parsed.shader.name,
            description: parsed.shader.description,
            type: parsed.shader.type,
            parameters_count: parsed.shader.parameters.length,
            parameters: parsed.shader.parameters || [],
            is_valid: parsed.shader.is_valid,
            validation_errors: parsed.shader.validation_errors || [],
          };
          setCurrentShader(shaderInfo);
          return shaderInfo;
        } else {
          handleError(parsed.error, `Failed to get shader: ${name}`);
          return null;
        }
      } catch (err) {
        handleError(err, `Error getting shader: ${name}`);
        return null;
      }
    },
    [handleError]
  );

  const listPresetsHelper = useCallback(async () => {
    try {
      setError(null);
      const result = await invoke<string>('list_shader_presets');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        const presetNames = parsed.presets.map((p: any) => p.name);
        setPresets(presetNames);
      } else {
        handleError(parsed.error, 'Failed to list presets');
      }
    } catch (err) {
      handleError(err, 'Error listing presets');
    }
  }, [handleError]);

  const getShaderPreset = useCallback(
    async (presetName: string): Promise<ShaderPreset | null> => {
      try {
        setError(null);
        const result = await invoke<string>('get_shader_preset', { presetName });
        const parsed = JSON.parse(result);
        if (parsed.success) {
          const preset = { ...parsed.preset, name: presetName };
          setCurrentPreset(preset);
          return preset;
        } else {
          handleError(parsed.error, `Failed to get preset: ${presetName}`);
          return null;
        }
      } catch (err) {
        handleError(err, `Error getting preset: ${presetName}`);
        return null;
      }
    },
    [handleError]
  );

  const applyShader = useCallback(
    async (shaderName: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const shader = await getShader(shaderName);
        if (!shader) {
          await getShader('CRT - Geom');
        }
      } catch (err) {
        handleError(err, `Error applying shader: ${shaderName}`);
        await getShader('CRT - Geom');
      } finally {
        setIsLoading(false);
      }
    },
    [getShader, handleError]
  );

  const validateShader = useCallback(
    async (shaderName: string): Promise<{ valid: boolean; errors: string[] }> => {
      try {
        setError(null);
        const result = await invoke<string>('validate_shader', { name: shaderName });
        const parsed = JSON.parse(result);
        if (parsed.success) {
          return { valid: parsed.valid, errors: parsed.errors || [] };
        }

        handleError(parsed.error, `Failed to validate shader: ${shaderName}`);
        return { valid: false, errors: [String(parsed.error)] };
      } catch (err) {
        handleError(err, `Error validating shader: ${shaderName}`);
        return { valid: false, errors: [String(err)] };
      }
    },
    [handleError]
  );

  const applyPreset = useCallback(
    async (presetName: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const preset = await getShaderPreset(presetName);
        if (preset) {
          await getShader(preset.shader);
          setShaderParams(current => ({ ...current, ...preset.parameters }));
        }
      } catch (err) {
        handleError(err, `Error applying preset: ${presetName}`);
      } finally {
        setIsLoading(false);
      }
    },
    [getShader, getShaderPreset, handleError]
  );

  const getShaderParams = useCallback(async (): Promise<Record<string, number>> => {
    try {
      setError(null);
      const result = await invoke<string>('get_shader_params');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        const params = parsed.parameters || {};
        setShaderParams(params);
        return params;
      }

      handleError(parsed.error, 'Failed to get shader parameters');
      return {};
    } catch (err) {
      handleError(err, 'Error getting shader parameters');
      return {};
    }
  }, [handleError]);

  const setShaderParam = useCallback(
    async (paramName: string, value: number) => {
      try {
        setError(null);
        const result = await invoke<string>('set_shader_param', {
          paramName,
          value,
        });
        const parsed = JSON.parse(result);
        if (parsed.success) {
          setShaderParams(parsed.parameters || {});
        } else {
          handleError(parsed.error, `Failed to set shader parameter: ${paramName}`);
        }
      } catch (err) {
        handleError(err, `Error setting shader parameter: ${paramName}`);
      }
    },
    [handleError]
  );

  const getDefaultShader = useCallback(async () => {
    try {
      setError(null);
      const result = await invoke<string>('get_default_shader');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        return { shader: parsed.shader, preset: parsed.preset };
      } else {
        handleError(parsed.error, 'Failed to get default shader');
        return { shader: 'CRT - Geom', preset: 'arcade' };
      }
    } catch (err) {
      handleError(err, 'Error getting default shader');
      return { shader: 'CRT - Geom', preset: 'arcade' };
    }
  }, [handleError]);

  // Initialize shaders on mount
  useEffect(() => {
    const initializeShaders = async () => {
      await listShaders();
      await listPresetsHelper();
      await getShaderParams();
      const defaultShader = await getDefaultShader();
      await getShaderPreset(defaultShader.preset);
      await getShader(defaultShader.shader);
    };

    initializeShaders();
  }, [
    listShaders,
    listPresetsHelper,
    getShaderParams,
    getDefaultShader,
    getShaderPreset,
    getShader,
  ]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let isDisposed = false;

    const initializeWatcher = async () => {
      try {
        await startShaderWatcher();
        const stopListening = await listen('shader://changed', () => {
          refreshShaders();
        });

        if (isDisposed) {
          stopListening();
        } else {
          unlisten = stopListening;
        }
      } catch (err) {
        handleError(err, 'Error initializing shader watcher');
      }
    };

    initializeWatcher();

    return () => {
      isDisposed = true;
      if (unlisten) {
        unlisten();
      }
      void stopShaderWatcher();
    };
  }, [handleError, refreshShaders, startShaderWatcher, stopShaderWatcher]);

  return {
    shaders,
    currentShader,
    presets,
    currentPreset,
    shaderParams,
    scanStats,
    lastRefreshedAt,
    isWatcherRunning,
    isLoading,
    isRefreshing,
    error,
    listShaders,
    refreshShaders,
    startShaderWatcher,
    stopShaderWatcher,
    getShader,
    getShaderPreset,
    applyShader,
    applyPreset,
    validateShader,
    getShaderParams,
    setShaderParam,
    getDefaultShader,
  };
};

export default useShaders;
