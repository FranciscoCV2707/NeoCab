import { useCallback } from 'react';
import { useLaunchStore } from '../stores/useLaunchStore';
import type { LaunchContext, LaunchStrategyType, MountInfo } from './types';

export function useLaunch() {
  const {
    activeContext,
    activeStrategy,
    isLaunching,
    isMounting,
    mountProgress,
    lastLaunchResult,
    lastError,
    strategyConfigs,
    launch,
    launchWithStrategy,
    mountImage,
    unmountImage,
    setStrategyConfig,
    cancelLaunch,
    clearError,
  } = useLaunchStore();

  const launchGame = useCallback(
    async (ctx: LaunchContext): Promise<LaunchContext | null> => {
      const result = await launch(ctx);
      return result.success ? ctx : null;
    },
    [launch]
  );

  const launchWith = useCallback(
    async (ctx: LaunchContext, strategy: LaunchStrategyType) => {
      return launchWithStrategy(ctx, strategy);
    },
    [launchWithStrategy]
  );

  const mountAndLaunch = useCallback(
    async (ctx: LaunchContext) => {
      if (ctx.mediaType === 'iso' || ctx.mediaType === 'cdi' || ctx.mediaType === 'chd') {
        const mountInfo = await mountImage(ctx.romPath);
        if (mountInfo) {
          const updatedCtx: LaunchContext = {
            ...ctx,
            romPath: mountInfo.mountPoint || mountInfo.extractedTo || ctx.romPath,
          };
          return launch(updatedCtx);
        }
      }
      return launch(ctx);
    },
    [mountImage, launch]
  );

  const getAvailableStrategies = useCallback(
    (ctx: LaunchContext): LaunchStrategyType[] => {
      const romType = ctx.mediaType || 'unknown';
      const strategies: LaunchStrategyType[] = [];

      if (romType === 'chd') {
        strategies.push('chd_mount', 'chd_extract');
      } else if (romType === 'iso') {
        strategies.push('iso_mount');
      } else if (romType === 'cdi') {
        strategies.push('cdi_mount');
      } else if (romType === 'zip') {
        strategies.push('zip_extract');
      }

      strategies.push('direct');

      return strategies.filter(
        (s) => strategyConfigs[s]?.enabled && strategyConfigs[s]?.priority < 1000
      );
    },
    [strategyConfigs]
  );

  return {
    activeContext,
    activeStrategy,
    isLaunching,
    isMounting,
    mountProgress,
    lastLaunchResult,
    lastError,
    strategyConfigs,
    launchGame,
    launchWith,
    mountAndLaunch,
    getAvailableStrategies,
    mountImage,
    unmountImage,
    setStrategyConfig,
    cancelLaunch,
    clearError,
  };
}

export { detectRomType, detectMultipleDisks } from './types';