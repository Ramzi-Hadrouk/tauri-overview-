use crate::core::error::AppError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BackupError {
    #[error("Integrity check failed")]
    Integrity(String),
    #[error("Path validation failed")]
    PathValidation(String),
    #[error("IO error: {0}")]
    Io(String),
}

impl From<BackupError> for AppError {
    fn from(e: BackupError) -> Self {
        match e {
            BackupError::Integrity(msg) => AppError::internal(&msg),
            BackupError::PathValidation(msg) => AppError::validation("path", &msg),
            BackupError::Io(msg) => AppError::internal(&msg),
        }
    }
}
