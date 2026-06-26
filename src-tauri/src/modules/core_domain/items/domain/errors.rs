use crate::core::error::AppError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ItemError {
    #[error("Item not found")]
    NotFound,
    #[error("Item already exists")]
    AlreadyExists,
    #[error("Validation error: {0}")]
    Validation(String),
}

impl From<ItemError> for AppError {
    fn from(e: ItemError) -> Self {
        match e {
            ItemError::NotFound => AppError::not_found("Item not found"),
            ItemError::AlreadyExists => AppError::conflict("Item already exists"),
            ItemError::Validation(msg) => AppError::validation("item", &msg),
        }
    }
}
