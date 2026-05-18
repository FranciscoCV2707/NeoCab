import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  LaunchContext,
  LaunchResult,
  LaunchStrategyType,
  StrategyConfig,
  MountInfo,
} from '../launch/types';
import { DEFAULT_STRATEGY_CONFIG, detectRomType } from '../launch/types';

interface LaunchState {
  activeContext: LaunchContext | null;
  activeStrategy: LaunchStrategyType | null;
  isLaunching: boolean;
  isMounting: boolean;
  mountProgress: { current: number; total: number; file: string };
  lastLaunchResult: LaunchResult | null;
  lastError: string | null;
  strategyConfigs: Record<LaunchStrategyType, StrategyConfig>;
}

interface LaunchActions {
  launch: (ctx: LaunchContext) => Promise<LaunchResult>;
  launchWithStrategy: (ctx: LaunchContext, strategy: LaunchStrategyType) => Promise<LaunchResult>;
  mountImage: (imagePath: string, mountPoint?: string) => Promise<MountInfo | null>;
  unmountImage: (mountInfo: MountInfo) => Promise<boolean>;
  setStrategyConfig: (strategy: LaunchStrategyType, config: Partial<StrategyConfig>) => void;
  cancelLaunch: () => void;
  clearError: () => void;
}

function autoSelectStrategy(ctx: LaunchContext): LaunchStrategyType {
  const romType = detectRomType(ctx.romPath);

  switch (romType) {
    case 'chd':
      return 'chd_mount';
    case 'iso':
      return 'iso_mount';
    case 'cdi':
      return 'cdi_mount';
    case 'zip':
      return 'zip_extract';
    default:
      return 'direct';
  }
}

export const useLaunchStore = create<LaunchState & LaunchActions>((set, get) => ({
  activeContext: null,
  activeStrategy: null,
  isLaunching: false,
  isMounting: false,
  mountProgress: { current: 0, total: 0, file: '' },
  lastLaunchResult: null,
  lastError: null,
  strategyConfigs: {
    chd_mount: DEFAULT_STRATEGY_CONFIG.chd_mount!,
    chd_extract: DEFAULT_STRATEGY_CONFIG.chd_extract!,
    iso_mount: DEFAULT_STRATEGY_CONFIG.iso_mount!,
    cdi_mount: DEFAULT_STRATEGY_CONFIG.cdi_mount!,
    zip_extract: DEFAULT_STRATEGY_CONFIG.zip_extract!,
    direct: DEFAULT_STRATEGY_CONFIG.direct!,
  },

  launch: async (ctx) => {
    const strategy = autoSelectStrategy(ctx);
    return get().launchWithStrategy(ctx, strategy);
  },

  launchWithStrategy: async (ctx, strategy) => {
    set({
      isLaunching: true,
      activeContext: ctx,
      activeStrategy: strategy,
      lastError: null,
      lastLaunchResult: null,
    });

    try {
      const result = await invoke<string>('launch_game_with_strategy', {
        context: ctx,
        strategy,
      });

      const launchResult: LaunchResult = JSON.parse(result);

      set({
        isLaunching: false,
        lastLaunchResult: launchResult,
      });

      return launchResult;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      const failedResult: LaunchResult = {
        success: false,
        error,
        strategyUsed: strategy,
      };

      set({
        isLaunching: false,
        lastError: error,
        lastLaunchResult: failedResult,
      });

      return failedResult;
    }
  },

  mountImage: async (imagePath, mountPoint) => {
    set({ isMounting: true, lastError: null });

    try {
      const romType = detectRomType(imagePath);

      if (romType === 'zip') {
        set({
          isMounting: false,
          lastError: 'ZIP files cannot be mounted, use extract strategy',
        });
        return null;
      }

      const result = await invoke<string>('mount_image', {
        imagePath,
        mountPoint,
      });

      const mountInfo: MountInfo = JSON.parse(result);

      set({ isMounting: false });
      return mountInfo;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      set({
        isMounting: false,
        lastError: error,
      });
      return null;
    }
  },

  unmountImage: async (mountInfo) => {
    try {
      await invoke<string>('unmount_image', { mountInfo });
      return true;
    } catch {
      return false;
    }
  },

  setStrategyConfig: (strategy, config) => {
    set((state) => ({
      strategyConfigs: {
        ...state.strategyConfigs,
        [strategy]: { ...state.strategyConfigs[strategy], ...config },
      },
    }));
  },

  cancelLaunch: () => {
    set({ isLaunching: false, activeContext: null, activeStrategy: null });
  },

  clearError: () => set({ lastError: null }),
}));

export { detectRomType, detectMultipleDisks } from '../launch/types';