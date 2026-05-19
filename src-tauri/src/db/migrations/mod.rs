use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use tracing::info;

const MIGRATIONS: &[(&str, &str)] = &[
    ("001_initial", include_str!("001_initial.sql")),
    (
        "002_tags_jukebox_safequit",
        include_str!("002_tags_jukebox_safequit.sql"),
    ),
    (
        "003_extended_media",
        include_str!("003_extended_media.sql"),
    ),
];

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Create migrations tracking table if not exists
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            checksum TEXT NOT NULL,
            applied_at TEXT DEFAULT (datetime('now'))
        )",
    )
    .execute(pool)
    .await?;

    // Get already applied migrations
    let applied: Vec<i32> = sqlx::query_scalar("SELECT version FROM _migrations ORDER BY version")
        .fetch_all(pool)
        .await?;

    for (i, (name, sql)) in MIGRATIONS.iter().enumerate() {
        let version = (i + 1) as i32;

        if applied.contains(&version) {
            info!("Migration {} ({}) already applied, skipping", version, name);
            continue;
        }

        let checksum = {
            let mut hasher = Sha256::new();
            hasher.update(sql.as_bytes());
            format!("{:x}", hasher.finalize())
        };

        info!("Applying migration {} ({})...", version, name);

        // Execute migration in a transaction
        let mut tx = pool.begin().await?;
        sqlx::query(sql).execute(&mut *tx).await?;

        sqlx::query("INSERT INTO _migrations (version, name, checksum) VALUES (?, ?, ?)")
            .bind(version)
            .bind(name)
            .bind(&checksum)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;

        info!("Migration {} ({}) applied successfully", version, name);
    }

    Ok(())
}
