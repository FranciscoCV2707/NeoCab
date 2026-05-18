export type ConfigSource = 'global' | 'system' | 'game' | 'runtime';

export interface ConfigValue<T = unknown> {
  value: T;
  source: ConfigSource;
  priority: number;
  key: string;
}

export interface GameConfig {
  gameId: number;
  overrides: Record<string, unknown>;
}

export interface SystemConfig {
  systemName: string;
  overrides: Record<string, unknown>;
}

export interface GlobalConfig {
  defaults: Record<string, unknown>;
}

export interface ResolvedConfig {
  get<T>(key: string): T | undefined;
  getWithDefault<T>(key: string, defaultValue: T): T;
  sourceOf(key: string): ConfigSource;
  allKeys(): string[];
}

export interface ConfigResolver {
  global: GlobalConfig;
  systems: Map<string, SystemConfig>;
  games: Map<number, GameConfig>;
  resolve(gameId: number, systemName: string): ResolvedConfig;
  setGameOverride(gameId: number, key: string, value: unknown): void;
  setSystemOverride(systemName: string, key: string, value: unknown): void;
  clearGameOverride(gameId: number, key: string): void;
  clearSystemOverride(systemName: string, key: string): void;
}

export const PRIORITY: Record<ConfigSource, number> = {
  global: 0,
  system: 50,
  game: 100,
  runtime: 200,
};