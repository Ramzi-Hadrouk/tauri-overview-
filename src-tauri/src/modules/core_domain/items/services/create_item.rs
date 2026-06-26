use std::path::Path;
use sqlx::SqlitePool;
use crate::core::error::AppError;
use super::super::{
    domain::entities::{CreateItemInput, Item},
    domain::errors::ItemError,
    domain::rules,
    domain::image_utils,
    repository::ItemRepository,
};

pub struct CreateItemService<'a> {
    db: &'a SqlitePool,
    images_dir: &'a Path,
}

impl<'a> CreateItemService<'a> {
    pub fn new(db: &'a SqlitePool, images_dir: &'a Path) -> Self {
        Self { db, images_dir }
    }

    pub async fn execute(&self, data: CreateItemInput) -> Result<Item, AppError> {
        let trimmed_name = data.name.trim().to_string();
        rules::validate_name(&trimmed_name)
            .map_err(|e| AppError::validation("name", &e))?;

        let trimmed_sku = data.sku.unwrap_or_default().trim().to_string();
        if !trimmed_sku.is_empty() {
            rules::validate_sku(&trimmed_sku)
                .map_err(|e| AppError::validation("sku", &e))?;
        }

        rules::validate_price(data.price)
            .map_err(|e| AppError::validation("price", &e))?;

        rules::validate_quantity(data.quantity)
            .map_err(|e| AppError::validation("quantity", &e))?;

        let trimmed_tags = data.tags.unwrap_or_default().trim().to_string();
        if !trimmed_tags.is_empty() {
            rules::validate_tags(&trimmed_tags)
                .map_err(|e| AppError::validation("tags", &e))?;
        }

        let repo = ItemRepository::new(self.db);

        if repo.exists_by_name(&trimmed_name).await? {
            return Err(ItemError::AlreadyExists.into());
        }

        if !trimmed_sku.is_empty() && repo.exists_by_sku(&trimmed_sku).await? {
            return Err(ItemError::AlreadyExists.into());
        }

        let description = data.description
            .map(|d| d.trim().to_string())
            .filter(|d| !d.is_empty());

        let id = uuid::Uuid::new_v4().to_string();

        let sku = if trimmed_sku.is_empty() {
            format!("SKU-{}", &id[..8].to_uppercase())
        } else {
            trimmed_sku
        };

        let image_path = data.image
            .filter(|i| !i.is_empty())
            .map(|uri| image_utils::save_image(self.images_dir, &id, &uri))
            .transpose()?;

        tracing::info!(target: "application", item_name = %trimmed_name, sku = %sku, "creating item");

        let item = sqlx::query_as::<_, Item>(
            "INSERT INTO items (id, name, description, sku, quantity, price, tags, image_path, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
             RETURNING id, name, description, sku, quantity, price, tags, image_path, is_active, created_at, updated_at"
        )
        .bind(&id)
        .bind(&trimmed_name)
        .bind(&description)
        .bind(&sku)
        .bind(data.quantity)
        .bind(data.price)
        .bind(&trimmed_tags)
        .bind(&image_path)
        .fetch_one(self.db)
        .await?;

        Ok(item)
    }
}
