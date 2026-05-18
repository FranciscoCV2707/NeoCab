import React, { useState, useEffect, useCallback } from 'react';
import './HardwareCalibration.css';
import { invoke } from '@tauri-apps/api/core';

export interface HardwareConfig {
  hardwareType: 'none' | 'gpio' | 'arduino';
  gpioPin?: number;
  serialPort?: string;
  baudRate?: number;
  debounceMs?: number;
  pulseThresholdMs?: number;
}

export interface HardwareCalibrationProps {
  onConfigChange: (config: HardwareConfig) => void;
  initialConfig?: HardwareConfig;
}

export const HardwareCalibration: React.FC<HardwareCalibrationProps> = ({
  onConfigChange,
  initialConfig,
}) => {
  const [config, setConfig] = useState<HardwareConfig>(
    initialConfig || { hardwareType: 'none' }
  );
  const [gpioPins, setGpioPins] = useState<number[]>([]);
  const [serialPorts, setSerialPorts] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<{
    arduino_enabled: boolean;
    gpio_enabled: boolean;
  } | null>(null);

  const loadHardwareStatus = async () => {
    try {
      const result = await invoke<string>('get_hardware_status');
      const status = JSON.parse(result);
      setHardwareStatus(status);
      return status;
    } catch (err) {
      console.error('Failed to load hardware status:', err);
      return null;
    }
  };

  const loadAvailableHardware = useCallback(async (status: { arduino_enabled: boolean; gpio_enabled: boolean } | null) => {
    if (!status) return;
    try {
      if (status.gpio_enabled) {
        const result = await invoke<string>('list_gpio_pins');
        const data = JSON.parse(result);
        setGpioPins(data.available_pins);
      }

      if (status.arduino_enabled) {
        const result = await invoke<string>('list_serial_ports');
        const data = JSON.parse(result);
        setSerialPorts(data.ports);
      }
    } catch (err) {
      console.error('Failed to load hardware:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const status = await loadHardwareStatus();
      if (status) {
        await loadAvailableHardware(status);
      }
    };
    loadData();
  }, [loadAvailableHardware]);

  const handleHardwareTypeChange = (type: 'none' | 'gpio' | 'arduino') => {
    const newConfig = { ...config, hardwareType: type };
    setConfig(newConfig);
    onConfigChange(newConfig);
    setTestResult(null);
    setError(null);
  };

  const handleGpioPinChange = (pin: number) => {
    const newConfig = { ...config, gpioPin: pin };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleSerialPortChange = (port: string) => {
    const newConfig = { ...config, serialPort: port };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleBaudRateChange = (rate: number) => {
    const newConfig = { ...config, baudRate: rate };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleDebounceChange = (ms: number) => {
    const newConfig = { ...config, debounceMs: ms };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handlePulseThresholdChange = (ms: number) => {
    const newConfig = { ...config, pulseThresholdMs: ms };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const testGpio = async () => {
    if (!config.gpioPin) {
      setError('Please select a GPIO pin');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await invoke<string>('test_gpio_pin', {
        gpioPin: config.gpioPin,
      });
      const data = JSON.parse(result);
      if (data.success) {
        setTestResult('GPIO pin test passed');
      } else {
        setError(data.message || 'GPIO pin test failed');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setTesting(false);
    }
  };

  const testArduino = async () => {
    if (!config.serialPort) {
      setError('Please select a serial port');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await invoke<string>('test_arduino_connection', {
        portName: config.serialPort,
        baudRate: config.baudRate || 9600,
      });
      const data = JSON.parse(result);
      if (data.success) {
        setTestResult('Arduino connection test passed');
      } else {
        setError(data.message || 'Arduino test failed');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="hardware-calibration">
      <h2>Hardware Configuration</h2>

      {!hardwareStatus ? (
        <div className="loading">Loading hardware status...</div>
      ) : (
        <>
          <div className="hardware-type-selector">
            <h3>Select Hardware Type</h3>
            <div className="button-group">
              <button
                className={`hw-btn ${config.hardwareType === 'none' ? 'active' : ''}`}
                onClick={() => handleHardwareTypeChange('none')}
              >
                No Hardware
              </button>

              {hardwareStatus.gpio_enabled && (
                <button
                  className={`hw-btn ${config.hardwareType === 'gpio' ? 'active' : ''}`}
                  onClick={() => handleHardwareTypeChange('gpio')}
                >
                  GPIO (RPi)
                </button>
              )}

              {hardwareStatus.arduino_enabled && (
                <button
                  className={`hw-btn ${config.hardwareType === 'arduino' ? 'active' : ''}`}
                  onClick={() => handleHardwareTypeChange('arduino')}
                >
                  Arduino
                </button>
              )}
            </div>
          </div>

          {config.hardwareType === 'gpio' && (
            <div className="hardware-config gpio-config">
              <h3>GPIO Configuration</h3>

              <div className="form-group">
                <label>GPIO Pin</label>
                <select
                  value={config.gpioPin || ''}
                  onChange={(e) => handleGpioPinChange(Number(e.target.value))}
                >
                  <option value="">Select GPIO Pin</option>
                  {gpioPins.map((pin) => (
                    <option key={pin} value={pin}>
                      GPIO {pin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Debounce (ms): {config.debounceMs || 20}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={config.debounceMs || 20}
                  onChange={(e) => handleDebounceChange(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>
                  Pulse Threshold (ms): {config.pulseThresholdMs || 100}
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={config.pulseThresholdMs || 100}
                  onChange={(e) => handlePulseThresholdChange(Number(e.target.value))}
                />
              </div>

              <button
                className="test-btn"
                onClick={testGpio}
                disabled={testing || !config.gpioPin}
              >
                {testing ? 'Testing...' : 'Test GPIO Pin'}
              </button>
            </div>
          )}

          {config.hardwareType === 'arduino' && (
            <div className="hardware-config arduino-config">
              <h3>Arduino Configuration</h3>

              <div className="form-group">
                <label>Serial Port</label>
                <select
                  value={config.serialPort || ''}
                  onChange={(e) => handleSerialPortChange(e.target.value)}
                >
                  <option value="">Select Serial Port</option>
                  {serialPorts.map((port) => (
                    <option key={port} value={port}>
                      {port}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Baud Rate</label>
                <select
                  value={config.baudRate || 9600}
                  onChange={(e) => handleBaudRateChange(Number(e.target.value))}
                >
                  <option value="9600">9600</option>
                  <option value="14400">14400</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="57600">57600</option>
                  <option value="115200">115200</option>
                </select>
              </div>

              <button
                className="test-btn"
                onClick={testArduino}
                disabled={testing || !config.serialPort}
              >
                {testing ? 'Testing...' : 'Test Arduino Connection'}
              </button>
            </div>
          )}

          {testResult && <div className="test-result success">{testResult}</div>}
          {error && <div className="test-result error">{error}</div>}
        </>
      )}
    </div>
  );
};
