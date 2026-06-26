use sqlx::SqlitePool;
use crate::core::error::AppError;
use super::super::{
    domain::errors::ItemError,
    repository::ItemRepository,
};

pub struct DeleteItemService<'a> {
    db: &'a SqlitePool,
}

impl<'a> DeleteItemService<'a> {
    pub fn new(db: &'a SqlitePool) -> Self {
        Self { db }
    }

    pub async fn execute(&self, id: &str) -> Result<(), AppError> {
        let repo = ItemRepository::new(self.db);

        let existing = repo.get_by_id(id).await?
            .ok_or(ItemError::NotFound)?;

        tracing::info!(target: "application", item_id = %id, item_name = %existing.name, "deleting item");

        sqlx::query("UPDATE items SET is_active = 0, updated_at = datetime('now') WHERE id = ?")
            .bind(id)
            .execute(self.db)
            .await?;

        Ok(())
    }
}
