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

        if repo.get_by_id(id).await?.is_none() {
            return Err(ItemError::NotFound.into());
        }

        sqlx::query("DELETE FROM items WHERE id = ?")
            .bind(id)
            .execute(self.db)
            .await?;

        Ok(())
    }
}
