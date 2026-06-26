use crate::core::error::AppError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum OrderError {
    #[error("Order not found")]
    NotFound,
    #[error("Item not found")]
    ItemNotFound,
}

impl From<OrderError> for AppError {
    fn from(e: OrderError) -> Self {
        match e {
            OrderError::NotFound => AppError::not_found("Order not found"),
            OrderError::ItemNotFound => AppError::not_found("Referenced item not found"),
        }
    }
}
