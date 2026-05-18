import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MIGRATIONS,
  getMigrations,
  getMigration,
  getLatestVersion,
  type Migration,
  type MigrationResult,
  type RunMigrationOptions,
} from './migrations';

interface MigrationState {
  currentVersion: number;
  isRunning: boolean;
  lastError: string | null;
  appliedMigrations: MigrationResult[];
}

interface MigrationActions {
  initialize: () => void;
  runMigrations: (options?: RunMigrationOptions) => Promise<MigrationResult[]>;
  rollback: (targetVersion: number) => Promise<MigrationResult[]>;
  getPendingMigrations: () => Migration[];
  getAppliedVersions: () => number[];
}

const DB_VERSION_KEY = 'neocab_db_version';
const APPLIED_KEY = 'neocab_applied_migrations';

export const useMigrationStore = create<MigrationState & MigrationActions>()(
  persist(
    (set, get) => ({
      currentVersion: 0,
      isRunning: false,
      lastError: null,
      appliedMigrations: [],

      initialize: () => {
        const saved = localStorage.getItem(DB_VERSION_KEY);
        const version = saved ? parseInt(saved, 10) : 0;
        set({ currentVersion: version });
      },

      runMigrations: async (options = {}) => {
        const { currentVersion, isRunning } = get();
        if (isRunning) return [];

        set({ isRunning: true, lastError: null });

        const results: MigrationResult[] = [];
        const targetVersion = options.targetVersion ?? getLatestVersion();
        const direction = options.direction ?? 'up';

        try {
          if (direction === 'up') {
            const pending = getMigrations(currentVersion);
            const toApply = pending.filter((m) => m.version <= targetVersion);

            for (const migration of toApply) {
              if (options.dryRun) {
                results.push({
                  success: true,
                  migration,
                  appliedAt: Date.now(),
                });
              } else {
                const result = await applyMigration(migration);
                results.push(result);

                if (result.success) {
                  localStorage.setItem(DB_VERSION_KEY, String(migration.version));
                  set({ currentVersion: migration.version });
                } else {
                  break;
                }
              }
            }
          } else {
            const toRollback = MIGRATIONS.filter(
              (m) => m.version > targetVersion && m.version <= currentVersion
            ).reverse();

            for (const migration of toRollback) {
              if (options.dryRun) {
                results.push({
                  success: true,
                  migration,
                  appliedAt: Date.now(),
                });
              } else {
                const result = await revertMigration(migration);
                results.push(result);

                if (result.success) {
                  const newVersion = migration.version - 1;
                  localStorage.setItem(DB_VERSION_KEY, String(newVersion));
                  set({ currentVersion: newVersion });
                } else {
                  break;
                }
              }
            }
          }
        } catch (error) {
          set({ lastError: error instanceof Error ? error.message : String(error) });
        } finally {
          set({ isRunning: false });
        }

        set((state) => ({
          appliedMigrations: [...state.appliedMigrations, ...results],
        }));

        return results;
      },

      rollback: async (targetVersion) => {
        return get().runMigrations({ direction: 'down', targetVersion });
      },

      getPendingMigrations: () => {
        return getMigrations(get().currentVersion);
      },

      getAppliedVersions: () => {
        return get().appliedMigrations.map((r) => r.migration.version);
      },
    }),
    {
      name: 'neocab-migrations',
      partialize: (state) => ({
        currentVersion: state.currentVersion,
        appliedMigrations: state.appliedMigrations,
      }),
    }
  )
);

async function applyMigration(migration: Migration): Promise<MigrationResult> {
  return {
    success: true,
    migration,
    appliedAt: Date.now(),
  };
}

async function revertMigration(migration: Migration): Promise<MigrationResult> {
  return {
    success: true,
    migration,
    appliedAt: Date.now(),
  };
}