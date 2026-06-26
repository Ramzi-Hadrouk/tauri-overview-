use sqlx::SqlitePool;
use crate::core::error::AppError;
use super::super::{
    domain::entities::{Item, CreateItemInput},
    domain::errors::ItemError,
    domain::rules,
    repository::ItemRepository,
};

pub struct CreateItemService<'a> {
    db: &'a SqlitePool,
}

impl<'a> CreateItemService<'a> {
    pub fn new(db: &'a SqlitePool) -> Self {
        Self { db }
    }

    pub async fn execute(&self, data: CreateItemInput) -> Result<Item, AppError> {
        let trimmed_name = data.name.trim().to_string();
        rules::validate_name(&trimmed_name)
            .map_err(|e| AppError::validation("name", &e))?;

        let repo = ItemRepository::new(self.db);

        if repo.exists_by_name(&trimmed_name).await? {
            return Err(ItemError::AlreadyExists.into());
        }

        let description = data.description
            .map(|d| d.trim().to_string())
            .filter(|d| !d.is_empty());

        let id = uuid::Uuid::new_v4().to_string();

        tracing::info!(target: "application", item_name = %trimmed_name, "creating item");

        let item = sqlx::query_as::<_, Item>(
            "INSERT INTO items (id, name, description, is_active, created_at, updated_at)
             VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
             RETURNING id, name, description, is_active, created_at, updated_at"
        )
        .bind(&id)
        .bind(&trimmed_name)
        .bind(&description)
        .fetch_one(self.db)
        .await?;

        Ok(item)
    }
}
