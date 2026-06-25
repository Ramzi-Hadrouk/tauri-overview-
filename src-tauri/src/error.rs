// src-tauri/src/error.rs
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("IO error: {0}")]         Io(String),
    #[error("Database error: {0}")]   Database(String),
    #[error("Integrity check: {0}")] Integrity(String),
    #[error("Not found: {0}")]       NotFound(String),
    #[error("Unexpected: {0}")]      Unexpected(String),
}

#[derive(Serialize)]
struct SerializedError { code: String, message: String }

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let code = match self {
            AppError::Io(_)         => "IO",
            AppError::Database(_)   => "DATABASE",
            AppError::Integrity(_)  => "INTEGRITY",
            AppError::NotFound(_)   => "NOT_FOUND",
            AppError::Unexpected(_) => "UNEXPECTED",
        };
        SerializedError { code: code.into(), message: self.to_string() }.serialize(s)
    }
}
