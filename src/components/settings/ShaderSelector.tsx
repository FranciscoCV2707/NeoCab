import React, { useCallback, useMemo, useState } from 'react';
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
    shaderParams,
    scanStats,
    lastRefreshedAt,
    isWatcherRunning,
    isLoading,
    isRefreshing,
    error,
    applyShader,
    applyPreset,
    setShaderParam,
    refreshShaders,
  } = useShaders();

  const [selectedTab, setSelectedTab] = useState<'presets' | 'shaders' | 'params'>('presets');
  const activeParameters = useMemo(() => currentShader?.parameters || [], [currentShader]);
  const lastRefreshLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString()
    : 'never';

  const handleApplyShader = useCallback(
    async (shaderName: string) => {
      await applyShader(shaderName);
      if (onShaderChange) {
        onShaderChange(shaderName);
      }
    },
    [applyShader, onShaderChange]
  );

  const handleApplyPreset = useCallback(async (presetName: string) => {
    await applyPreset(presetName);
  }, [applyPreset]);

  const handleParamChange = useCallback(async (paramName: string, value: number) => {
    await setShaderParam(paramName, value);
  }, [setShaderParam]);

  const handleRefreshShaders = useCallback(async () => {
    await refreshShaders();
  }, [refreshShaders]);

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
        <button
          className={`tab ${selectedTab === 'params' ? 'active' : ''}`}
          onClick={() => setSelectedTab('params')}
        >
          Params
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
              <span className="status">{currentPreset?.name === preset ? 'ON' : ''}</span>
            </button>
          ))}
        </div>
      )}

      {selectedTab === 'shaders' && (
        <>
          <div className="shader-refresh-bar">
            <button
              className="refresh-button"
              onClick={handleRefreshShaders}
              disabled={isLoading || isRefreshing}
              type="button"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <span className="refresh-meta">
              {scanStats
                ? `${scanStats.total_shaders} shaders, ${scanStats.invalid_shaders} ERR, ${scanStats.scan_duration_ms}ms, watcher ${isWatcherRunning ? 'ON' : 'OFF'}`
                : `Last scan: ${lastRefreshLabel}`}
            </span>
          </div>

          <div className="shaders-list">
            {isLoading && shaders.length === 0 ? (
              <div className="loading">Loading shaders...</div>
            ) : shaders.length > 0 ? (
              shaders.map(shader => (
                <button
                  key={shader.name}
                  className={`shader-button ${currentShader?.name === shader.name ? 'active' : ''} ${
                    shader.is_valid === false ? 'invalid' : ''
                  }`}
                  onClick={() => handleApplyShader(shader.name)}
                  disabled={isLoading || isRefreshing || shader.is_valid === false}
                >
                  <div className="shader-info">
                    <span className="shader-name">{shader.name}</span>
                    <span className="shader-desc">{shader.description}</span>
                    <span className="shader-type">{shader.type}</span>
                    {shader.is_valid === false && (
                      <span className="shader-error">
                        {(shader.validation_errors || []).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="status">
                    {shader.is_valid === false
                      ? 'ERR'
                      : currentShader?.name === shader.name
                        ? 'ON'
                        : ''}
                  </span>
                </button>
              ))
            ) : (
              <div className="no-shaders">No custom shaders found</div>
            )}
          </div>
        </>
      )}

      {selectedTab === 'params' && (
        <div className="params-list">
          {activeParameters.length > 0 ? (
            activeParameters.map(param => {
              const value = shaderParams[param.name] ?? param.default;

              return (
                <label key={param.name} className="param-control">
                  <span className="param-header">
                    <span className="param-name">{param.display_name}</span>
                    <span className="param-value">{value.toFixed(2)}</span>
                  </span>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step="0.05"
                    value={value}
                    disabled={isLoading}
                    onChange={event => handleParamChange(param.name, Number(event.target.value))}
                  />
                  <span className="param-range">
                    {param.min} - {param.max}
                  </span>
                </label>
              );
            })
          ) : (
            <div className="no-shaders">Select a shader to edit its parameters</div>
          )}
        </div>
      )}

      <div className="shader-info">
        <p>
          <strong>Current:</strong> {currentShader?.name || currentPreset?.name || 'Default'}
        </p>
      </div>
    </div>
  );
};

export default ShaderSelector;
