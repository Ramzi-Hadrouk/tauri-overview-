use sqlx::SqlitePool;
use crate::core::error::AppError;
use super::domain::entities::Item;

const ALL_COLUMNS: &str = "id, name, description, sku, quantity, price, tags, image_path, is_active, created_at, updated_at";

pub struct ItemRepository<'a> {
    db: &'a SqlitePool,
}

impl<'a> ItemRepository<'a> {
    pub fn new(db: &'a SqlitePool) -> Self {
        Self { db }
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Item>, AppError> {
        let item = sqlx::query_as::<_, Item>(
            &format!("SELECT {} FROM items WHERE id = ?", ALL_COLUMNS)
        )
        .bind(id)
        .fetch_optional(self.db)
        .await?;
        Ok(item)
    }

    pub async fn list_paginated(&self, page: u64, size: u64) -> Result<(Vec<Item>, u64), AppError> {
        let offset = (page - 1) * size;
        let items = sqlx::query_as::<_, Item>(
            &format!(
                "SELECT {} FROM items
                 WHERE is_active = true ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ALL_COLUMNS
            )
        )
        .bind(size as i64)
        .bind(offset as i64)
        .fetch_all(self.db)
        .await?;

        let total: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM items WHERE is_active = true"
        )
        .fetch_one(self.db)
        .await?;

        Ok((items, total as u64))
    }

    pub async fn exists_by_name(&self, name: &str) -> Result<bool, AppError> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM items WHERE LOWER(name) = LOWER(?)"
        )
        .bind(name)
        .fetch_one(self.db)
        .await?;
        Ok(count > 0)
    }

    pub async fn exists_by_sku(&self, sku: &str) -> Result<bool, AppError> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM items WHERE LOWER(sku) = LOWER(?) AND sku != ''"
        )
        .bind(sku)
        .fetch_one(self.db)
        .await?;
        Ok(count > 0)
    }
}
