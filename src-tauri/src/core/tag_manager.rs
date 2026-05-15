use serde::{Serialize, Deserialize};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub game_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameTag {
    pub id: i64,
    pub name: String,
    pub color: String,
}

pub struct TagManager {
    db: std::sync::Arc<crate::db::Database>,
}

impl TagManager {
    pub fn new(db: std::sync::Arc<crate::db::Database>) -> Self {
        Self { db }
    }

    pub async fn list_tags(&self) -> Result<Vec<Tag>, String> {
        sqlx::query_as::<_, (i64, String, String, i64)>(
            "SELECT t.id, t.name, t.color, COUNT(gt.game_id) as game_count
             FROM tags t LEFT JOIN game_tags gt ON t.id = gt.tag_id
             GROUP BY t.id ORDER BY t.name"
        )
        .fetch_all(self.db.pool())
        .await
        .map(|rows| rows.into_iter().map(|(id, name, color, count)| Tag { id, name, color, game_count: count }).collect())
        .map_err(|e| e.to_string())
    }

    pub async fn create_tag(&self, name: &str, color: &str) -> Result<Tag, String> {
        sqlx::query("INSERT INTO tags (name, color) VALUES (?, ?)")
            .bind(name).bind(color)
            .execute(self.db.pool()).await
            .map_err(|e| e.to_string())?;

        let id = sqlx::query_scalar::<_, i64>("SELECT last_insert_rowid()")
            .fetch_one(self.db.pool()).await.map_err(|e| e.to_string())?;

        Ok(Tag { id, name: name.to_string(), color: color.to_string(), game_count: 0 })
    }

    pub async fn delete_tag(&self, tag_id: i64) -> Result<(), String> {
        sqlx::query("DELETE FROM game_tags WHERE tag_id = ?").bind(tag_id)
            .execute(self.db.pool()).await.map_err(|e| e.to_string())?;
        sqlx::query("DELETE FROM tags WHERE id = ?").bind(tag_id)
            .execute(self.db.pool()).await.map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn add_game_tag(&self, game_id: i64, tag_id: i64) -> Result<(), String> {
        sqlx::query("INSERT OR IGNORE INTO game_tags (game_id, tag_id) VALUES (?, ?)")
            .bind(game_id).bind(tag_id)
            .execute(self.db.pool()).await.map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn remove_game_tag(&self, game_id: i64, tag_id: i64) -> Result<(), String> {
        sqlx::query("DELETE FROM game_tags WHERE game_id = ? AND tag_id = ?")
            .bind(game_id).bind(tag_id)
            .execute(self.db.pool()).await.map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn get_game_tags(&self, game_id: i64) -> Result<Vec<GameTag>, String> {
        sqlx::query_as::<_, (i64, String, String)>(
            "SELECT t.id, t.name, t.color FROM tags t
             JOIN game_tags gt ON t.id = gt.tag_id
             WHERE gt.game_id = ? ORDER BY t.name"
        )
        .bind(game_id)
        .fetch_all(self.db.pool())
        .await
        .map(|rows| rows.into_iter().map(|(id, name, color)| GameTag { id, name, color }).collect())
        .map_err(|e| e.to_string())
    }
}
