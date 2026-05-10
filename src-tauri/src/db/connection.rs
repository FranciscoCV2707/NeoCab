use sqlx::sqlite::{SqlitePool, SqliteConnectOptions};
use std::str::FromStr;
use crate::error::Result;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(db_path: &str) -> Result<Self> {
        // Create database connection with WAL mode enabled
        let options = SqliteConnectOptions::from_str(db_path)?
            .create_if_missing(true);

        let pool = SqlitePool::connect_with(options).await?;

        // Initialize schema on first run
        let result = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='systems'"
        )
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

        if result == 0 {
            // Run migrations
            Self::init_schema(&pool).await?;
        }

        Ok(Self { pool })
    }

    async fn init_schema(pool: &SqlitePool) -> Result<()> {
        // Enable WAL mode and pragmas
        sqlx::query("PRAGMA journal_mode = WAL")
            .execute(pool)
            .await?;

        sqlx::query("PRAGMA synchronous = NORMAL")
            .execute(pool)
            .await?;

        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(pool)
            .await?;

        sqlx::query("PRAGMA cache_size = -8000")
            .execute(pool)
            .await?;

        // Create tables
        Self::create_tables(pool).await?;

        Ok(())
    }

    async fn create_tables(pool: &SqlitePool) -> Result<()> {
        // Systems table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS systems (
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
            )"
        )
        .execute(pool)
        .await?;

        // Emulators table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS emulators (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                name            TEXT NOT NULL UNIQUE,
                display_name    TEXT NOT NULL,
                executable_win  TEXT,
                executable_linux TEXT,
                executable_arm  TEXT,
                args_template   TEXT,
                extra_args      TEXT,
                min_os_win      TEXT DEFAULT '7',
                supported_arches TEXT DEFAULT '[\"x64\",\"x86\",\"arm64\"]',
                requires_bios   INTEGER DEFAULT 0,
                version         TEXT,
                enabled         INTEGER DEFAULT 1,
                created_at      TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Games table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS games (
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
                region          TEXT DEFAULT 'World',
                language        TEXT DEFAULT 'en',
                created_at      TEXT DEFAULT (datetime('now')),
                updated_at      TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Sessions table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS sessions (
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
            )"
        )
        .execute(pool)
        .await?;

        // Coin events table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS coin_events (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type  TEXT NOT NULL,
                amount      INTEGER NOT NULL DEFAULT 1,
                source      TEXT,
                game_id     INTEGER REFERENCES games(id),
                session_id  INTEGER REFERENCES sessions(id),
                timestamp   TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Profiles table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS profiles (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL UNIQUE,
                avatar_path TEXT,
                pin_hash    TEXT,
                role        TEXT DEFAULT 'player',
                created_at  TEXT DEFAULT (datetime('now')),
                last_login  TEXT
            )"
        )
        .execute(pool)
        .await?;

        // Input devices table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS input_devices (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                guid        TEXT NOT NULL UNIQUE,
                name        TEXT NOT NULL,
                vendor_id   INTEGER,
                product_id  INTEGER,
                device_type TEXT,
                profile_name TEXT DEFAULT 'default',
                created_at  TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Input mappings table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS input_mappings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_name TEXT NOT NULL,
                device_guid TEXT,
                action      TEXT NOT NULL,
                source      TEXT NOT NULL,
                game_id     INTEGER REFERENCES games(id),
                system_id   INTEGER REFERENCES systems(id),
                created_at  TEXT DEFAULT (datetime('now')),
                UNIQUE(profile_name, device_guid, action, game_id, system_id)
            )"
        )
        .execute(pool)
        .await?;

        // Achievements table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS achievements (
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
            )"
        )
        .execute(pool)
        .await?;

        // Save states table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS save_states (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id     INTEGER NOT NULL REFERENCES games(id),
                profile_id  INTEGER REFERENCES profiles(id),
                slot        INTEGER NOT NULL DEFAULT 0,
                save_path   TEXT NOT NULL,
                thumbnail   TEXT,
                description TEXT,
                play_time   INTEGER DEFAULT 0,
                created_at  TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Config table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS config (
                key     TEXT NOT NULL PRIMARY KEY,
                value   TEXT NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Analytics table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS analytics (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type  TEXT NOT NULL,
                payload     TEXT,
                timestamp   TEXT DEFAULT (datetime('now'))
            )"
        )
        .execute(pool)
        .await?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_games_system   ON games(system_id)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_games_title    ON games(sort_title)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(is_favorite)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_games_played   ON games(play_count DESC)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_sessions_game  ON sessions(game_id)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_sessions_date  ON sessions(started_at)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_coin_events_ts ON coin_events(timestamp)")
            .execute(pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_achievements_g ON achievements(game_id)")
            .execute(pool)
            .await?;

        Ok(())
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    // Config management methods
    pub async fn get_config(&self, key: &str) -> Result<Option<String>> {
        let value = sqlx::query_scalar::<_, String>(
            "SELECT value FROM config WHERE key = ?"
        )
        .bind(key)
        .fetch_optional(&self.pool)
        .await?;

        Ok(value)
    }

    pub async fn set_config(&self, key: &str, value: &str) -> Result<()> {
        sqlx::query(
            "INSERT INTO config (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value"
        )
        .bind(key)
        .bind(value)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_all_config(&self) -> Result<Vec<(String, String)>> {
        let rows = sqlx::query_as::<_, (String, String)>(
            "SELECT key, value FROM config ORDER BY key"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    // Game library methods
    pub async fn get_games_by_system(&self, system_id: i64) -> Result<Vec<crate::models::Game>> {
        let games = sqlx::query_as::<_, crate::models::Game>(
            "SELECT * FROM games WHERE system_id = ? ORDER BY sort_title"
        )
        .bind(system_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(games)
    }

    pub async fn insert_game(&self, game: &crate::models::Game) -> Result<i64> {
        let result = sqlx::query(
            "INSERT INTO games (title, sort_title, system_id, emulator_id, rom_path,
             filename, file_size, crc32, sha1, md5, description, year, developer,
             publisher, genre, region, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&game.title)
        .bind(&game.sort_title)
        .bind(game.system_id)
        .bind(game.emulator_id)
        .bind(&game.rom_path)
        .bind(&game.filename)
        .bind(game.file_size)
        .bind(&game.crc32)
        .bind(&game.sha1)
        .bind(&game.md5)
        .bind(&game.description)
        .bind(game.year)
        .bind(&game.developer)
        .bind(&game.publisher)
        .bind(&game.genre)
        .bind(&game.region)
        .bind(&game.language)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn get_systems(&self) -> Result<Vec<crate::models::System>> {
        let systems = sqlx::query_as::<_, crate::models::System>(
            "SELECT * FROM systems WHERE enabled = 1 ORDER BY sort_order"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(systems)
    }

    pub async fn get_emulator(&self, name: &str) -> Result<Option<crate::models::Emulator>> {
        let emu = sqlx::query_as::<_, crate::models::Emulator>(
            "SELECT * FROM emulators WHERE name = ? AND enabled = 1"
        )
        .bind(name)
        .fetch_optional(&self.pool)
        .await?;

        Ok(emu)
    }

    pub async fn get_game_by_crc32(&self, crc32: &str) -> Result<Option<crate::models::Game>> {
        let game = sqlx::query_as::<_, crate::models::Game>(
            "SELECT * FROM games WHERE crc32 = ?"
        )
        .bind(crc32)
        .fetch_optional(&self.pool)
        .await?;

        Ok(game)
    }

    pub async fn init_default_systems(&self) -> Result<()> {
        // Check if systems already exist
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM systems"
        )
        .fetch_one(&self.pool)
        .await?;

        if count > 0 {
            return Ok(());
        }

        // Insert default systems
        let systems = vec![
            ("nes", "Nintendo Entertainment System", "Classic", "Nintendo", 1983, 1995, "nes,zip", 0),
            ("snes", "Super Nintendo", "Classic", "Nintendo", 1990, 2003, "smc,sfc,zip", 0),
            ("genesis", "Genesis", "Sega", "Sega", 1988, 1997, "md,bin,zip", 0),
            ("mame", "Multiple Arcade Machine Emulator", "Arcade", "Multiple", 1996, 2024, "zip,7z", 0),
            ("gb", "Game Boy", "Handheld", "Nintendo", 1989, 2008, "gb,gbc,zip", 0),
            ("psx", "PlayStation 1", "Console", "Sony", 1994, 2006, "iso,cue,bin,zip", 0),
            ("n64", "Nintendo 64", "Console", "Nintendo", 1996, 2002, "z64,n64,zip", 0),
        ];

        for (i, (name, display, category, mfr, year_start, year_end, exts, sort_order)) in systems.iter().enumerate() {
            sqlx::query(
                "INSERT INTO systems (name, display_name, category, manufacturer, year_start, year_end, extensions, sort_order, enabled)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
            )
            .bind(name)
            .bind(display)
            .bind(category)
            .bind(mfr)
            .bind(year_start)
            .bind(year_end)
            .bind(exts)
            .bind(*sort_order + i as i64)
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    pub async fn log_coin_event(
        &self,
        event_type: &str,
        amount: i64,
        source: &str,
        game_id: Option<i64>,
    ) -> Result<()> {
        sqlx::query(
            "INSERT INTO coin_events (event_type, amount, source, game_id)
             VALUES (?, ?, ?, ?)"
        )
        .bind(event_type)
        .bind(amount)
        .bind(source)
        .bind(game_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_total_coin_earnings(&self) -> Result<i64> {
        let total: i64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(amount), 0) FROM coin_events WHERE event_type = 'inserted'"
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(total)
    }

    pub async fn get_coin_events(&self, limit: i64) -> Result<Vec<(String, i64, String)>> {
        let events = sqlx::query_as::<_, (String, i64, String)>(
            "SELECT event_type, amount, timestamp FROM coin_events
             ORDER BY timestamp DESC LIMIT ?"
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(events)
    }
}
