use serde::{Deserialize, Serialize};
use ts_rs::TS;
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize, TS, Error)]
#[ts(export, export_to = "../bindings/")]
#[error("[{code}] {message}")]
pub struct AppError {
    pub code: String,
    pub message: String,
    pub field: Option<String>,
}

impl AppError {
    pub fn not_found(message: &str) -> Self {
        Self { code: "not_found".into(), message: message.into(), field: None }
    }
    pub fn conflict(message: &str) -> Self {
        Self { code: "conflict".into(), message: message.into(), field: None }
    }
    pub fn forbidden(message: &str) -> Self {
        Self { code: "forbidden".into(), message: message.into(), field: None }
    }
    pub fn validation(field: &str, message: &str) -> Self {
        Self { code: "validation_error".into(), message: message.into(), field: Some(field.into()) }
    }
    pub fn internal(message: &str) -> Self {
        Self { code: "internal_error".into(), message: message.into(), field: None }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::internal(&e.to_string())
    }
}
