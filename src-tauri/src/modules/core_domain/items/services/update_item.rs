use sqlx::SqlitePool;
use crate::core::error::AppError;
use super::super::{
    domain::entities::{Item, UpdateItemInput},
    domain::errors::ItemError,
    domain::rules,
    repository::ItemRepository,
};

pub struct UpdateItemService<'a> {
    db: &'a SqlitePool,
}

impl<'a> UpdateItemService<'a> {
    pub fn new(db: &'a SqlitePool) -> Self {
        Self { db }
    }

    pub async fn execute(&self, id: &str, data: UpdateItemInput) -> Result<Item, AppError> {
        let repo = ItemRepository::new(self.db);

        let existing = repo.get_by_id(id).await?
            .ok_or(ItemError::NotFound)?;

        let name = data.name
            .map(|n| n.trim().to_string())
            .unwrap_or(existing.name.clone());

        rules::validate_name(&name)
            .map_err(|e| AppError::validation("name", &e))?;

        if name != existing.name && repo.exists_by_name(&name).await? {
            return Err(ItemError::AlreadyExists.into());
        }

        let description = data.description
            .map(|d| {
                let trimmed = d.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            })
            .unwrap_or(existing.description.clone());

        let is_active = data.is_active.unwrap_or(existing.is_active);

        let item = sqlx::query_as::<_, Item>(
            "UPDATE items SET name = ?, description = ?, is_active = ?, updated_at = datetime('now')
             WHERE id = ?
             RETURNING id, name, description, is_active, created_at, updated_at"
        )
        .bind(&name)
        .bind(&description)
        .bind(is_active)
        .bind(id)
        .fetch_optional(self.db)
        .await?
        .ok_or(ItemError::NotFound)?;

        Ok(item)
    }
}
