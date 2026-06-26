use std::path::Path;
use sqlx::SqlitePool;
use crate::core::error::AppError;
use super::super::{
    domain::entities::{Item, UpdateItemInput},
    domain::errors::ItemError,
    domain::rules,
    domain::image_utils,
    repository::ItemRepository,
};

pub struct UpdateItemService<'a> {
    db: &'a SqlitePool,
    images_dir: &'a Path,
}

impl<'a> UpdateItemService<'a> {
    pub fn new(db: &'a SqlitePool, images_dir: &'a Path) -> Self {
        Self { db, images_dir }
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

        if name != existing.name && repo.exists_by_name(&name, Some(id)).await? {
            return Err(ItemError::AlreadyExists.into());
        }

        let description = data.description
            .map(|d| {
                let trimmed = d.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            })
            .unwrap_or(existing.description.clone());

        if let Some(ref sku) = data.sku {
            let trimmed = sku.trim();
            if !trimmed.is_empty() {
                rules::validate_sku(trimmed)
                    .map_err(|e| AppError::validation("sku", &e))?;
                if trimmed != existing.sku && repo.exists_by_sku(trimmed, Some(id)).await? {
                    return Err(ItemError::AlreadyExists.into());
                }
            }
        }

        let sku = data.sku
            .map(|s| s.trim().to_string())
            .unwrap_or(existing.sku.clone());

        let quantity = data.quantity.unwrap_or(existing.quantity);
        rules::validate_quantity(quantity)
            .map_err(|e| AppError::validation("quantity", &e))?;

        let price = data.price.unwrap_or(existing.price);
        rules::validate_price(price)
            .map_err(|e| AppError::validation("price", &e))?;

        let tags = data.tags
            .map(|t| t.trim().to_string())
            .unwrap_or(existing.tags.clone());

        if !tags.is_empty() {
            rules::validate_tags(&tags)
                .map_err(|e| AppError::validation("tags", &e))?;
        }

        let is_active = data.is_active.unwrap_or(existing.is_active);

        let image_path = match &data.image {
            None => existing.image_path.clone(),
            Some(uri) if uri.is_empty() => {
                if let Some(ref old) = existing.image_path {
                    image_utils::delete_image(self.images_dir, old);
                }
                None
            }
            Some(uri) if image_utils::is_data_uri(uri) => {
                if let Some(ref old) = existing.image_path {
                    image_utils::delete_image(self.images_dir, old);
                }
                Some(image_utils::save_image(self.images_dir, id, uri)?)
            }
            Some(_) => existing.image_path.clone(),
        };

        tracing::info!(target: "application", item_id = %id, item_name = %name, "updating item");

        let item = sqlx::query_as::<_, Item>(
            "UPDATE items SET name = ?, description = ?, sku = ?, quantity = ?, price = ?, tags = ?, image_path = ?, is_active = ?, updated_at = datetime('now')
             WHERE id = ?
             RETURNING id, name, description, sku, quantity, price, tags, image_path, is_active, created_at, updated_at"
        )
        .bind(&name)
        .bind(&description)
        .bind(&sku)
        .bind(quantity)
        .bind(price)
        .bind(&tags)
        .bind(&image_path)
        .bind(is_active)
        .bind(id)
        .fetch_optional(self.db)
        .await?
        .ok_or(ItemError::NotFound)?;

        Ok(item)
    }
}
