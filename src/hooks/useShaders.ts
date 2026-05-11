import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
}

interface ShaderPreset {
  name: string;
  shader: string;
  parameters: Record<string, number>;
}

interface UseShaderReturn {
  shaders: ShaderInfo[];
  currentShader: ShaderInfo | null;
  presets: string[];
  currentPreset: ShaderPreset | null;
  isLoading: boolean;
  error: string | null;
  listShaders: () => Promise<void>;
  getShader: (name: string) => Promise<ShaderInfo | null>;
  getShaderPreset: (presetName: string) => Promise<ShaderPreset | null>;
  applyShader: (shaderName: string) => Promise<void>;
  applyPreset: (presetName: string) => Promise<void>;
  getDefaultShader: () => Promise<{ shader: string; preset: string }>;
}

export const useShaders = (): UseShaderReturn => {
  const [shaders, setShaders] = useState<ShaderInfo[]>([]);
  const [currentShader, setCurrentShader] = useState<ShaderInfo | null>(null);
  const [presets, setPresets] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<ShaderPreset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, context: string) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(`${context}: ${message}`);
    console.error(`[Shader Hook] ${context}:`, err);
  }, []);

  const listShaders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await invoke<string>('list_shaders');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setShaders(parsed.shaders || []);
      } else {
        handleError(parsed.error, 'Failed to list shaders');
      }
    } catch (err) {
      handleError(err, 'Error listing shaders');
    } finally {
      setIsLoading(false);
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
        const result = await invoke<string>('get_shader_preset', { preset_name: presetName });
        const parsed = JSON.parse(result);
        if (parsed.success) {
          const preset = parsed.preset;
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
        await getShader(shaderName);
      } catch (err) {
        handleError(err, `Error applying shader: ${shaderName}`);
      } finally {
        setIsLoading(false);
      }
    },
    [getShader, handleError]
  );

  const applyPreset = useCallback(
    async (presetName: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const preset = await getShaderPreset(presetName);
        if (preset) {
          await getShader(preset.shader);
        }
      } catch (err) {
        handleError(err, `Error applying preset: ${presetName}`);
      } finally {
        setIsLoading(false);
      }
    },
    [getShader, getShaderPreset, handleError]
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
    listShaders();
    listPresetsHelper();
    getDefaultShader();
  }, [listShaders, listPresetsHelper, getDefaultShader]);

  return {
    shaders,
    currentShader,
    presets,
    currentPreset,
    isLoading,
    error,
    listShaders,
    getShader,
    getShaderPreset,
    applyShader,
    applyPreset,
    getDefaultShader,
  };
};

export default useShaders;
