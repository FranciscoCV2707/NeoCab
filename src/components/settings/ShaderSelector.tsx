import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './ShaderSelector.css';

interface ShaderSelectorProps {
  onShaderChange?: (shaderName: string) => void;
}

export const ShaderSelector: React.FC<ShaderSelectorProps> = ({ onShaderChange }) => {
  const [shaders, setShaders] = useState<string[]>([]);
  const [currentShader, setCurrentShader] = useState<string>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShaders();
  }, []);

  const loadShaders = async () => {
    try {
      const result = await invoke<string>('list_shaders');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setShaders(parsed.shaders || []);
      }
    } catch (err) {
      console.error('Failed to load shaders:', err);
    }
  };

  const handleApplyShader = async (shaderName: string) => {
    setLoading(true);
    try {
      await invoke('apply_shader', { name: shaderName });
      setCurrentShader(shaderName);
      if (onShaderChange) onShaderChange(shaderName);
    } catch (err) {
      console.error('Failed to apply shader:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shader-selector">
      <h3>Shader Selector</h3>
      {loading && <div className="loading">Loading...</div>}
      <div className="shader-list">
        <div
          className={`shader-item ${currentShader === 'none' ? 'active' : ''}`}
          onClick={() => handleApplyShader('none')}
        >
          <span>None</span>
        </div>
        {shaders.map(shader => (
          <div
            key={shader}
            className={`shader-item ${currentShader === shader ? 'active' : ''}`}
            onClick={() => handleApplyShader(shader)}
          >
            <span>{shader}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
