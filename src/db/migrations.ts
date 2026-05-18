export interface Migration {
  version: number;
  name: string;
  description: string;
  up: string;
  down: string;
  appliedAt?: number;
}

export interface MigrationResult {
  success: boolean;
  migration: Migration;
  error?: string;
  appliedAt: number;
}

export interface MigrationState {
  currentVersion: number;
  latestVersion: number;
  pendingMigrations: Migration[];
  appliedMigrations: MigrationResult[];
  isRunning: boolean;
}

export type MigrationDirection = 'up' | 'down';

export interface RunMigrationOptions {
  direction?: MigrationDirection;
  targetVersion?: number;
  dryRun?: boolean;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    description: 'Create initial database schema',
    up: `
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        system_name TEXT NOT NULL,
        rom_path TEXT,
        emulator_id TEXT,
        is_favorite INTEGER DEFAULT 0,
        play_count INTEGER DEFAULT 0,
        last_played TEXT,
        rating REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER DEFAULT 0,
        coins_inserted INTEGER DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id)
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        source TEXT DEFAULT 'global'
      );

      CREATE INDEX idx_games_system ON games(system_name);
      CREATE INDEX idx_games_favorite ON games(is_favorite);
      CREATE INDEX idx_sessions_game ON sessions(game_id);
    `,
    down: `
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS config;
      DROP TABLE IF EXISTS systems;
      DROP TABLE IF EXISTS games;
    `,
  },
  {
    version: 2,
    name: 'add_tags',
    description: 'Add tags support to games',
    up: `
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_tags (
        game_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (game_id, tag_id),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `,
    down: `
      DROP TABLE IF EXISTS game_tags;
      DROP TABLE IF EXISTS tags;
    `,
  },
  {
    version: 3,
    name: 'add_media_paths',
    description: 'Add media path columns to games',
    up: `
      ALTER TABLE games ADD COLUMN image_path TEXT;
      ALTER TABLE games ADD COLUMN marquee_path TEXT;
      ALTER TABLE games ADD COLUMN video_path TEXT;
      ALTER TABLE games ADD COLUMN wheel_path TEXT;
      ALTER TABLE games ADD COLUMN box_path TEXT;
    `,
    down: `
      -- SQLite doesn't support DROP COLUMN easily, would need recreate table
      -- For now, this is a one-way migration
    `,
  },
  {
    version: 4,
    name: 'add_themes',
    description: 'Create themes table',
    up: `
      CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        author TEXT,
        version TEXT,
        description TEXT,
        preview_path TEXT,
        is_active INTEGER DEFAULT 0,
        is_builtin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `
      DROP TABLE IF EXISTS themes;
    `,
  },
  {
    version: 5,
    name: 'add_achievements',
    description: 'Add achievements support',
    up: `
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        unlocked_at TEXT,
        badge_path TEXT,
        points INTEGER DEFAULT 0,
        rare INTEGER DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
      );

      CREATE INDEX idx_achievements_game ON achievements(game_id);
    `,
    down: `
      DROP TABLE IF EXISTS achievements;
    `,
  },
];

export function getMigrations(version: number): Migration[] {
  return MIGRATIONS.filter((m) => m.version > version);
}

export function getMigration(version: number): Migration | undefined {
  return MIGRATIONS.find((m) => m.version === version);
}

export function getLatestVersion(): number {
  return Math.max(...MIGRATIONS.map((m) => m.version));
}