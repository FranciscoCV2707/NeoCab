import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ConfigSource,
  ConfigValue,
  GameConfig,
  SystemConfig,
  GlobalConfig,
  ResolvedConfig,
  PRIORITY,
} from './types';

interface ConfigState {
  global: GlobalConfig;
  systems: Record<string, SystemConfig>;
  games: Record<number, GameConfig>;
  runtimeOverrides: Record<string, unknown>;
}

interface ConfigActions {
  setGlobal: (key: string, value: unknown) => void;
  setSystemOverride: (system: string, key: string, value: unknown) => void;
  setGameOverride: (gameId: number, key: string, value: unknown) => void;
  clearSystemOverride: (system: string, key: string) => void;
  clearGameOverride: (gameId: number, key: string) => void;
  setRuntimeOverride: (key: string, value: unknown) => void;
  clearRuntimeOverride: (key: string) => void;
  resolve: (gameId: number, systemName: string) => ConfigResolverInstance;
}

const PRIORITY_ORDER: Record<ConfigSource, number> = {
  global: 0,
  system: 50,
  game: 100,
  runtime: 200,
};

class ConfigResolverInstance implements ResolvedConfig {
  constructor(
    private global: GlobalConfig,
    private systems: Record<string, SystemConfig>,
    private games: Record<number, GameConfig>,
    private runtimeOverrides: Record<string, unknown>,
    private gameId: number,
    private systemName: string
  ) {}

  get<T>(key: string): T | undefined {
    const values = this.getAllValues(key);
    return values[0]?.value as T | undefined;
  }

  getWithDefault<T>(key: string, defaultValue: T): T {
    return this.get<T>(key) ?? defaultValue;
  }

  sourceOf(key: string): ConfigSource {
    const values = this.getAllValues(key);
    return values[0]?.source || 'global';
  }

  allKeys(): string[] {
    const keys = new Set<string>();
    Object.keys(this.global.defaults).forEach((k) => keys.add(k));
    Object.keys(this.runtimeOverrides).forEach((k) => keys.add(k));
    return Array.from(keys);
  }

  private getAllValues(key: string): ConfigValue[] {
    const values: ConfigValue[] = [];

    if (this.runtimeOverrides[key] !== undefined) {
      values.push({
        value: this.runtimeOverrides[key],
        source: 'runtime',
        priority: PRIORITY_ORDER.runtime,
        key,
      });
    }

    const gameConfig = this.games[this.gameId];
    if (gameConfig?.overrides[key] !== undefined) {
      values.push({
        value: gameConfig.overrides[key],
        source: 'game',
        priority: PRIORITY_ORDER.game,
        key,
      });
    }

    const systemConfig = this.systems[this.systemName];
    if (systemConfig?.overrides[key] !== undefined) {
      values.push({
        value: systemConfig.overrides[key],
        source: 'system',
        priority: PRIORITY_ORDER.system,
        key,
      });
    }

    if (this.global.defaults[key] !== undefined) {
      values.push({
        value: this.global.defaults[key],
        source: 'global',
        priority: PRIORITY_ORDER.global,
        key,
      });
    }

    return values.sort((a, b) => b.priority - a.priority);
  }
}

const defaultConfig: ConfigState = {
  global: {
    defaults: {
      theme: 'default',
      language: 'en',
      volume: 80,
      fullscreen: true,
      scanlines: false,
      vsync: true,
    },
  },
  systems: {},
  games: {},
  runtimeOverrides: {},
};

export const useConfigStore = create<ConfigState & ConfigActions>()(
  persist(
    (set, get) => ({
      ...defaultConfig,

      setGlobal: (key, value) =>
        set((state) => ({
          global: {
            ...state.global,
            defaults: { ...state.global.defaults, [key]: value },
          },
        })),

      setSystemOverride: (system, key, value) =>
        set((state) => ({
          systems: {
            ...state.systems,
            [system]: {
              systemName: system,
              overrides: {
                ...state.systems[system]?.overrides,
                [key]: value,
              },
            },
          },
        })),

      setGameOverride: (gameId, key, value) =>
        set((state) => ({
          games: {
            ...state.games,
            [gameId]: {
              gameId,
              overrides: {
                ...state.games[gameId]?.overrides,
                [key]: value,
              },
            },
          },
        })),

      clearSystemOverride: (system, key) =>
        set((state) => {
          const systemConfig = state.systems[system];
          if (!systemConfig) return state;
          const { [key]: _, ...rest } = systemConfig.overrides;
          return {
            systems: {
              ...state.systems,
              [system]: { systemName: system, overrides: rest },
            },
          };
        }),

      clearGameOverride: (gameId, key) =>
        set((state) => {
          const gameConfig = state.games[gameId];
          if (!gameConfig) return state;
          const { [key]: _, ...rest } = gameConfig.overrides;
          return {
            games: {
              ...state.games,
              [gameId]: { gameId, overrides: rest },
            },
          };
        }),

      setRuntimeOverride: (key, value) =>
        set((state) => ({
          runtimeOverrides: { ...state.runtimeOverrides, [key]: value },
        })),

      clearRuntimeOverride: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.runtimeOverrides;
          return { runtimeOverrides: rest };
        }),

      resolve: (gameId, systemName) => {
        const { global, systems, games, runtimeOverrides } = get();
        return new ConfigResolverInstance(global, systems, games, runtimeOverrides, gameId, systemName);
      },
    }),
    {
      name: 'neocab-config',
    }
  )
);