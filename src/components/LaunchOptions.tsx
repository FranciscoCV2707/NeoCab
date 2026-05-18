import { useState, useCallback, useMemo } from 'react';
import { useLaunch } from '../launch/useLaunchHook';
import { useTranslation } from '../i18n';
import type { LaunchStrategyType, LaunchContext } from '../launch/types';
import { STRATEGY_PRIORITIES } from '../launch/types';
import './LaunchOptions.css';

interface LaunchOptionsProps {
  game: {
    id: number;
    title: string;
    system_name: string;
    rom_path: string;
    emulator_id?: string;
  };
  onLaunch: (success: boolean) => void;
  onCancel: () => void;
}

const STRATEGY_LABELS: Record<LaunchStrategyType, string> = {
  chd_mount: 'Mount CHD (Daemon Tools)',
  chd_extract: 'Extract CHD',
  iso_mount: 'Mount ISO',
  cdi_mount: 'Mount CDI',
  zip_extract: 'Extract ZIP',
  direct: 'Direct Launch',
};

export function LaunchOptions({ game, onLaunch, onCancel }: LaunchOptionsProps) {
  const { t } = useTranslation();
  const {
    isLaunching,
    lastError,
    strategyConfigs,
    getAvailableStrategies,
    launchWith,
    setStrategyConfig,
    cancelLaunch,
  } = useLaunch();

  const [selectedStrategy, setSelectedStrategy] = useState<LaunchStrategyType>('direct');
  const [commandArgs, setCommandArgs] = useState('');

  const ctx = useMemo<LaunchContext>(() => ({
    gameId: game.id,
    gameTitle: game.title,
    systemName: game.system_name,
    romPath: game.rom_path,
    emulatorId: game.emulator_id || '',
    commandLineArgs: commandArgs ? commandArgs.split(' ').filter(Boolean) : undefined,
  }), [game.id, game.title, game.system_name, game.rom_path, game.emulator_id, commandArgs]);

  const availableStrategies = getAvailableStrategies(ctx);

  const handleLaunch = useCallback(async () => {
    const result = await launchWith(ctx, selectedStrategy);
    onLaunch(result.success);
  }, [ctx, selectedStrategy, launchWith, onLaunch]);

  const handleToggleStrategy = (strategy: LaunchStrategyType) => {
    setStrategyConfig(strategy, { enabled: !strategyConfigs[strategy].enabled });
  };

  return (
    <div className="launch-options">
      <div className="launch-header">
        <h3>{t('game.play')}: {game.title}</h3>
        <button className="launch-close" onClick={onCancel}>×</button>
      </div>

      <div className="launch-strategies">
        <h4>{t('filter.sort')}</h4>
        <div className="strategy-list">
          {availableStrategies.map((strategy) => (
            <label
              key={strategy}
              className={`strategy-item ${selectedStrategy === strategy ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="strategy"
                value={strategy}
                checked={selectedStrategy === strategy}
                onChange={() => setSelectedStrategy(strategy)}
              />
              <span className="strategy-name">{STRATEGY_LABELS[strategy]}</span>
              <span className="strategy-priority">#{STRATEGY_PRIORITIES[strategy]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="launch-advanced">
        <h4>{t('settings.arcade')}</h4>
        <div className="command-args">
          <label>
            Extra Args:
            <input
              type="text"
              value={commandArgs}
              onChange={(e) => setCommandArgs(e.target.value)}
              placeholder="-skip_warnings -window"
            />
          </label>
        </div>
      </div>

      <div className="launch-actions">
        {lastError && (
          <div className="launch-error">
            {lastError}
          </div>
        )}
        <div className="action-buttons">
          <button
            className="btn-cancel"
            onClick={cancelLaunch}
            disabled={!isLaunching}
          >
            {t('nav.cancel')}
          </button>
          <button
            className="btn-launch"
            onClick={handleLaunch}
            disabled={isLaunching}
          >
            {isLaunching ? t('menu.loading') : t('game.play')}
          </button>
        </div>
      </div>

      <div className="strategy-toggles">
        <h4>{t('operator.config')}</h4>
        {(Object.keys(strategyConfigs) as LaunchStrategyType[]).map((strategy) => (
          <label key={strategy} className="strategy-toggle">
            <input
              type="checkbox"
              checked={strategyConfigs[strategy].enabled}
              onChange={() => handleToggleStrategy(strategy)}
            />
            {STRATEGY_LABELS[strategy]}
          </label>
        ))}
      </div>
    </div>
  );
}