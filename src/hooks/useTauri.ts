import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * Custom hook for Tauri command invocation
 * Provides type-safe access to backend commands
 */
export const useTauri = () => {
  // System commands
  const listEmulators = useCallback(async () => {
    return invoke<any[]>('list_emulators');
  }, []);

  const listGames = useCallback(async (system: string) => {
    return invoke<any[]>('list_games', { system });
  }, []);

  const scanRoms = useCallback(async () => {
    return invoke<void>('scan_roms');
  }, []);

  // Game launch
  const launchGame = useCallback(async (gameId: string, system: string) => {
    return invoke<void>('launch_game', { gameId, system });
  }, []);

  const stopGame = useCallback(async () => {
    return invoke<void>('stop_game');
  }, []);

  const getRecommendedEmulator = useCallback(async (system: string) => {
    return invoke<string>('get_recommended_emulator', { system });
  }, []);

  // Coin system
  const getCoinBalance = useCallback(async () => {
    return invoke<number>('get_coin_balance');
  }, []);

  const addCoins = useCallback(async (amount: number) => {
    return invoke<void>('add_coins', { amount });
  }, []);

  // Timer
  const startTimer = useCallback(async (durationMs: number) => {
    return invoke<void>('start_timer', { durationMs });
  }, []);

  const pauseTimer = useCallback(async () => {
    return invoke<void>('pause_timer');
  }, []);

  const resumeTimer = useCallback(async () => {
    return invoke<void>('resume_timer');
  }, []);

  const stopTimer = useCallback(async () => {
    return invoke<void>('stop_timer');
  }, []);

  const getTimerStatus = useCallback(async () => {
    return invoke<any>('get_timer_status');
  }, []);

  // Config
  const getConfig = useCallback(async () => {
    return invoke<any>('get_config');
  }, []);

  const setConfig = useCallback(async (key: string, value: any) => {
    return invoke<void>('set_config', { key, value });
  }, []);

  // Theme
  const setTheme = useCallback(async (name: string) => {
    return invoke<void>('set_theme', { name });
  }, []);

  const getCurrentTheme = useCallback(async () => {
    return invoke<string>('get_current_theme');
  }, []);

  const getThemeCss = useCallback(async (name: string) => {
    return invoke<string>('get_theme_css', { name });
  }, []);

  const listAvailableThemes = useCallback(async () => {
    return invoke<string[]>('list_available_themes');
  }, []);

  // System info
  const getSystemInfo = useCallback(async () => {
    return invoke<any>('get_system_info');
  }, []);

  // Session management
  const createGameSession = useCallback(async (gameId: number, coinsUsed: number) => {
    return invoke<number>('create_game_session', { game_id: gameId, coins_used: coinsUsed });
  }, []);

  const endGameSession = useCallback(async (sessionId: number, durationSec: number, completed: boolean) => {
    return invoke<string>('end_game_session', { session_id: sessionId, duration_sec: durationSec, completed });
  }, []);

  const getRecentSessions = useCallback(async (limit: number = 10) => {
    return invoke<string>('get_recent_sessions', { limit });
  }, []);

  // Launch monitoring with crash detection
  const launchGameWithMonitoring = useCallback(async (gameId: number, emulatorName: string) => {
    return invoke<string>('launch_game_with_monitoring', { game_id: gameId, emulator_name: emulatorName });
  }, []);

  // Launch with pre/post scripts
  const launchGameWithScripts = useCallback(async (
    gameId: number,
    emulatorName: string,
    preScript?: string,
    postScript?: string
  ) => {
    return invoke<string>('launch_game_with_scripts', {
      game_id: gameId,
      emulator_name: emulatorName,
      pre_script: preScript || null,
      post_script: postScript || null,
    });
  }, []);

  const stopGameWithMonitoring = useCallback(async () => {
    return invoke<string>('stop_game_with_monitoring');
  }, []);

  return {
    // System
    listEmulators,
    listGames,
    scanRoms,
    // Game launch
    launchGame,
    stopGame,
    getRecommendedEmulator,
    launchGameWithMonitoring,
    launchGameWithScripts,
    stopGameWithMonitoring,
    // Sessions
    createGameSession,
    endGameSession,
    getRecentSessions,
    // Coins
    getCoinBalance,
    addCoins,
    // Timer
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getTimerStatus,
    // Config
    getConfig,
    setConfig,
    // Theme
    setTheme,
    getCurrentTheme,
    getThemeCss,
    listAvailableThemes,
    // System
    getSystemInfo,
  };
};

export default useTauri;
