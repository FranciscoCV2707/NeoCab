-- NeoCab Database Schema - Initial Migration
-- Optimized for arcade cabinet with coin/timer system

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -8000;

-- Systems (arcade, console, handheld, computer)
CREATE TABLE IF NOT EXISTS systems (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category    TEXT NOT NULL,
    manufacturer TEXT,
    year_start  INTEGER,
    year_end    INTEGER,
    extensions  TEXT NOT NULL,
    bios_path   TEXT,
    roms_path   TEXT,
    enabled     INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 999,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Emulators (MAME, RetroArch, Dolphin, etc)
CREATE TABLE IF NOT EXISTS emulators (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    executable_win  TEXT,
    executable_linux TEXT,
    executable_arm  TEXT,
    args_template   TEXT,
    extra_args      TEXT,
    min_os_win      TEXT DEFAULT "7",
    supported_arches TEXT DEFAULT '["x64","x86","arm64"]',
    requires_bios   INTEGER DEFAULT 0,
    version         TEXT,
    enabled         INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Games library
CREATE TABLE IF NOT EXISTS games (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    sort_title      TEXT,
    system_id       INTEGER NOT NULL REFERENCES systems(id),
    emulator_id     INTEGER REFERENCES emulators(id),
    rom_path        TEXT NOT NULL,
    filename        TEXT,
    file_size       INTEGER,
    crc32           TEXT,
    sha1            TEXT,
    md5             TEXT,
    description     TEXT,
    year            INTEGER,
    developer       TEXT,
    publisher       TEXT,
    genre           TEXT,
    players         INTEGER DEFAULT 1,
    rating          REAL DEFAULT 0.0,
    rating_count    INTEGER DEFAULT 0,
    play_count      INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,
    last_played     TEXT,
    is_favorite     INTEGER DEFAULT 0,
    is_hidden       INTEGER DEFAULT 0,
    has_save_state  INTEGER DEFAULT 0,
    image_path      TEXT,
    marquee_path    TEXT,
    video_path      TEXT,
    external_id     TEXT,
    region          TEXT DEFAULT "World",
    language        TEXT DEFAULT "en",
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- Game sessions (for tracking coin/timer usage)
CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         INTEGER NOT NULL REFERENCES games(id),
    profile_id      INTEGER REFERENCES profiles(id),
    started_at      TEXT NOT NULL,
    ended_at        TEXT,
    duration_sec    INTEGER DEFAULT 0,
    coins_used      INTEGER DEFAULT 0,
    coins_inserted  INTEGER DEFAULT 0,
    completed       INTEGER DEFAULT 0,
    notes           TEXT
);

-- Coin events for tracking currency
CREATE TABLE IF NOT EXISTS coin_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,
    amount      INTEGER NOT NULL DEFAULT 1,
    source      TEXT,
    game_id     INTEGER REFERENCES games(id),
    session_id  INTEGER REFERENCES sessions(id),
    timestamp   TEXT DEFAULT (datetime('now'))
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    avatar_path TEXT,
    pin_hash    TEXT,
    role        TEXT DEFAULT "player",
    created_at  TEXT DEFAULT (datetime('now')),
    last_login  TEXT
);

-- Input devices (gamepads, arcade sticks, etc)
CREATE TABLE IF NOT EXISTS input_devices (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guid        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    vendor_id   INTEGER,
    product_id  INTEGER,
    device_type TEXT,
    profile_name TEXT DEFAULT "default",
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Input key mappings
CREATE TABLE IF NOT EXISTS input_mappings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT NOT NULL,
    device_guid TEXT,
    action      TEXT NOT NULL,
    source      TEXT NOT NULL,
    game_id     INTEGER REFERENCES games(id),
    system_id   INTEGER REFERENCES systems(id),
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(profile_name, device_guid, action, game_id, system_id)
);

-- Achievements (RetroAchievements support)
CREATE TABLE IF NOT EXISTS achievements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         INTEGER NOT NULL REFERENCES games(id),
    profile_id      INTEGER REFERENCES profiles(id),
    ra_id           INTEGER,
    title           TEXT NOT NULL,
    description     TEXT,
    badge_path      TEXT,
    points          INTEGER DEFAULT 0,
    unlocked        INTEGER DEFAULT 0,
    unlocked_at     TEXT,
    hardcore        INTEGER DEFAULT 0
);

-- Save states
CREATE TABLE IF NOT EXISTS save_states (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id     INTEGER NOT NULL REFERENCES games(id),
    profile_id  INTEGER REFERENCES profiles(id),
    slot        INTEGER NOT NULL DEFAULT 0,
    save_path   TEXT NOT NULL,
    thumbnail   TEXT,
    description TEXT,
    play_time   INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- General configuration
CREATE TABLE IF NOT EXISTS config (
    key     TEXT NOT NULL PRIMARY KEY,
    value   TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Analytics and events
CREATE TABLE IF NOT EXISTS analytics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,
    payload     TEXT,
    timestamp   TEXT DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_games_system   ON games(system_id);
CREATE INDEX IF NOT EXISTS idx_games_title    ON games(sort_title);
CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(is_favorite);
CREATE INDEX IF NOT EXISTS idx_games_played   ON games(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_game  ON sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date  ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_coin_events_ts ON coin_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_achievements_g ON achievements(game_id);
