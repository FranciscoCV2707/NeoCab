import { invoke } from '@tauri-apps/api/core';

export type ScriptLanguage = 'lua' | 'javascript' | 'python';

export interface Script {
  id: string;
  name: string;
  description: string;
  language: ScriptLanguage;
  code: string;
  enabled: boolean;
  autorun: boolean;
  trigger?: ScriptTrigger;
  createdAt: number;
  updatedAt: number;
}

export interface ScriptTrigger {
  type: 'event' | 'schedule' | 'hotkey';
  event?: string;
  schedule?: string;
  hotkey?: string;
}

export interface ScriptContext {
  gameId?: number;
  gameTitle?: string;
  systemName?: string;
  sessionId?: string;
  timestamp: number;
}

export interface ScriptResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
}

export interface SystemInfo {
  os: string;
  version: string;
  hostname: string;
  uptime: number;
  memoryUsed: number;
  memoryTotal: number;
}

export interface ScriptAPI {
  neocab: {
    launch: (gameId: number) => Promise<boolean>;
    insertCoin: () => Promise<boolean>;
    setVolume: (volume: number) => void;
    getVolume: () => number;
    setTheme: (themeName: string) => void;
    getTheme: () => string;
    log: (message: string) => void;
    notify: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    playSound: (soundId: string) => void;
    getConfig: (key: string) => Promise<unknown>;
    setConfig: (key: string, value: unknown) => void;
    getSystemInfo: () => SystemInfo;
    exit: () => void;
  };
  json: {
    encode: (value: unknown) => string;
    decode: (str: string) => unknown;
  };
}

export const SCRIPT_PERMISSIONS = {
  filesystem: false,
  network: false,
  shell: false,
  process: false,
} as const;

export type ScriptPermission = keyof typeof SCRIPT_PERMISSIONS;

export function checkPermission(permission: ScriptPermission): boolean {
  return SCRIPT_PERMISSIONS[permission];
}

export function createSafeScriptAPI(_context: ScriptContext): ScriptAPI {
  return {
    neocab: {
      launch: async (gameId) => {
        try {
          await invoke('launch_game', { gameId });
          return true;
        } catch {
          return false;
        }
      },
      insertCoin: async () => {
        try {
          await invoke('session_insert_coin', {});
          return true;
        } catch {
          return false;
        }
      },
      setVolume: (volume) => {
        invoke('config_set', { key: 'volume', value: volume }).catch(() => {});
      },
      getVolume: () => 80,
      setTheme: (themeName) => {
        invoke('set_theme', { themeName }).catch(() => {});
      },
      getTheme: () => 'default',
      log: (message) => {
        console.log(`[Script] ${message}`);
      },
      notify: (title, message, type = 'info') => {
        invoke('show_notification', { title, message, type }).catch(() => {});
      },
      playSound: (soundId) => {
        invoke('play_sound', { soundId }).catch(() => {});
      },
      getConfig: async (key) => {
        try {
          return await invoke('config_get', { key });
        } catch {
          return null;
        }
      },
      setConfig: (key, value) => {
        invoke('config_set', { key, value }).catch(() => {});
      },
      getSystemInfo: () => ({
        os: 'Windows',
        version: '1.0',
        hostname: 'NeoCab',
        uptime: 0,
        memoryUsed: 0,
        memoryTotal: 0,
      }),
      exit: () => {
        invoke('exit_app', {}).catch(() => {});
      },
    },
    json: {
      encode: (value) => JSON.stringify(value),
      decode: (str) => JSON.parse(str),
    },
  };
}