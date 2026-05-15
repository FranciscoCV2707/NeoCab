CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#888888',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_tags (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, tag_id)
);

CREATE TABLE IF NOT EXISTS jukebox_playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration_sec INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    last_played TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS safe_quit_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emulator TEXT NOT NULL,
    game_pattern TEXT,
    monitor_type TEXT NOT NULL DEFAULT 'timeout',
    timeout_seconds INTEGER DEFAULT 120,
    action TEXT NOT NULL DEFAULT 'ShowAttract',
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_game_tags_game ON game_tags(game_id);
CREATE INDEX IF NOT EXISTS idx_game_tags_tag ON game_tags(tag_id);
