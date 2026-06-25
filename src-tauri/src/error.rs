use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error("IO error: {0}")]         Io(String),
    #[error("Database error: {0}")]   Database(String),
    #[error("Integrity check: {0}")] Integrity(String),
    #[error("Not found: {0}")]       NotFound(String),
    #[error("Path validation: {0}")]  PathValidation(String),
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Database(e.to_string())
    }
}
