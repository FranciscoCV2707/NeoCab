import React, { useState } from 'react';
import { useShaders } from '../../hooks/useShaders';
import './ShaderSelector.css';

interface ShaderSelectorProps {
  onShaderChange?: (shaderName: string) => void;
}

export const ShaderSelector: React.FC<ShaderSelectorProps> = ({ onShaderChange }) => {
  const {
    shaders,
    presets,
    currentShader,
    currentPreset,
    isLoading,
    error,
    applyShader,
    applyPreset,
  } = useShaders();

  const [selectedTab, setSelectedTab] = useState<'presets' | 'shaders'>('presets');

  const handleApplyShader = async (shaderName: string) => {
    await applyShader(shaderName);
    if (onShaderChange) {
      onShaderChange(shaderName);
    }
  };

  const handleApplyPreset = async (presetName: string) => {
    await applyPreset(presetName);
  };

  return (
    <div className="shader-selector">
      <h3>CRT Shaders</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="shader-tabs">
        <button
          className={`tab ${selectedTab === 'presets' ? 'active' : ''}`}
          onClick={() => setSelectedTab('presets')}
        >
          Presets
        </button>
        <button
          className={`tab ${selectedTab === 'shaders' ? 'active' : ''}`}
          onClick={() => setSelectedTab('shaders')}
        >
          Custom
        </button>
      </div>

      {selectedTab === 'presets' && (
        <div className="presets-list">
          {presets.map(preset => (
            <button
              key={preset}
              className={`preset-button ${currentPreset?.name === preset ? 'active' : ''}`}
              onClick={() => handleApplyPreset(preset)}
              disabled={isLoading}
            >
              <span className="preset-name">{preset}</span>
              <span className="status">
                {currentPreset?.name === preset ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedTab === 'shaders' && (
        <div className="shaders-list">
          {isLoading ? (
            <div className="loading">Loading shaders...</div>
          ) : shaders.length > 0 ? (
            shaders.map(shader => (
              <button
                key={shader.name}
                className={`shader-button ${currentShader?.name === shader.name ? 'active' : ''}`}
                onClick={() => handleApplyShader(shader.name)}
                disabled={isLoading}
              >
                <div className="shader-info">
                  <span className="shader-name">{shader.name}</span>
                  <span className="shader-desc">{shader.description}</span>
                  <span className="shader-type">{shader.type}</span>
                </div>
                <span className="status">
                  {currentShader?.name === shader.name ? '✓' : ''}
                </span>
              </button>
            ))
          ) : (
            <div className="no-shaders">No custom shaders found</div>
          )}
        </div>
      )}

      <div className="shader-info">
        <p>
          <strong>Current:</strong> {currentShader?.name || currentPreset?.name || 'Default'}
        </p>
        <p className="info-text">
          Shaders emulate CRT monitor effects. Choose a preset for quick access or select a
          custom shader for more control.
        </p>
      </div>
    </div>
  );
};

export default ShaderSelector;
