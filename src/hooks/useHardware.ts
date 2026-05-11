import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface HardwareStatus {
  arduino_enabled: boolean;
  gpio_enabled: boolean;
  platform: string;
}

export interface UseHardwareReturn {
  hardwareStatus: HardwareStatus | null;
  loading: boolean;
  error: string | null;
  gpioPins: number[];
  serialPorts: string[];
  isMonitoring: boolean;
  listGpioPins: () => Promise<void>;
  listSerialPorts: () => Promise<void>;
  testGpioPin: (pin: number) => Promise<boolean>;
  testArduino: (port: string, baudRate: number) => Promise<boolean>;
  calibrateCoinDetection: (debounceMs: number, pulseThresholdMs: number) => Promise<boolean>;
  startHardwareMonitoring: (type: 'gpio' | 'arduino', config: any) => Promise<boolean>;
  stopHardwareMonitoring: () => Promise<boolean>;
  loadHardwareStatus: () => Promise<void>;
}

export const useHardware = (): UseHardwareReturn => {
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [gpioPins, setGpioPins] = useState<number[]>([]);
  const [serialPorts, setSerialPorts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const loadHardwareStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<string>('get_hardware_status');
      const status = JSON.parse(result);
      setHardwareStatus(status);
    } catch (err) {
      setError(`Failed to load hardware status: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load status on mount
  useEffect(() => {
    loadHardwareStatus();
  }, [loadHardwareStatus]);

  const listGpioPins = useCallback(async () => {
    if (!hardwareStatus?.gpio_enabled) {
      setError('GPIO not enabled on this platform');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invoke<string>('list_gpio_pins');
      const data = JSON.parse(result);
      setGpioPins(data.available_pins);
    } catch (err) {
      setError(`Failed to list GPIO pins: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [hardwareStatus]);

  const listSerialPorts = useCallback(async () => {
    if (!hardwareStatus?.arduino_enabled) {
      setError('Arduino not enabled');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invoke<string>('list_serial_ports');
      const data = JSON.parse(result);
      setSerialPorts(data.ports);
    } catch (err) {
      setError(`Failed to list serial ports: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [hardwareStatus]);

  const testGpioPin = useCallback(async (pin: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<string>('test_gpio_pin', { gpioPin: pin });
      const data = JSON.parse(result);
      return data.success !== false;
    } catch (err) {
      setError(`GPIO test failed: ${err}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const testArduino = useCallback(async (port: string, baudRate: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<string>('test_arduino_connection', {
        portName: port,
        baudRate,
      });
      const data = JSON.parse(result);
      return data.success !== false;
    } catch (err) {
      setError(`Arduino test failed: ${err}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const calibrateCoinDetection = useCallback(
    async (debounceMs: number, pulseThresholdMs: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const result = await invoke<string>('calibrate_coin_detection', {
          debounceMs,
          pulseThresholdMs,
        });
        const data = JSON.parse(result);
        return data.success !== false;
      } catch (err) {
        setError(`Calibration failed: ${err}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const startHardwareMonitoring = useCallback(
    async (type: 'gpio' | 'arduino', config: any): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await invoke('start_hardware_monitoring', {
          hardware_type: type,
          gpio_pin: config.gpioPin,
          serial_port: config.serialPort,
          baud_rate: config.baudRate,
        });
        setIsMonitoring(true);
        return true;
      } catch (err) {
        setError(`Failed to start monitoring: ${err}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const stopHardwareMonitoring = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await invoke('stop_hardware_monitoring');
      setIsMonitoring(false);
      return true;
    } catch (err) {
      setError(`Failed to stop monitoring: ${err}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hardwareStatus,
    loading,
    error,
    gpioPins,
    serialPorts,
    isMonitoring,
    listGpioPins,
    listSerialPorts,
    testGpioPin,
    testArduino,
    calibrateCoinDetection,
    startHardwareMonitoring,
    stopHardwareMonitoring,
    loadHardwareStatus,
  };
};
