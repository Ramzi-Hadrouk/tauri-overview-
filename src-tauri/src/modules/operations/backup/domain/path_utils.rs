use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use crate::core::error::AppError;
use super::errors::BackupError;

pub const PATH_ALLOW_CHARS: &[char] = &[
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '_', '.', '/', '-', ' ', ':',
];

pub fn validate_path(path: &str, root: &Path) -> Result<PathBuf, BackupError> {
    if path.trim().is_empty() {
        return Err(BackupError::PathValidation("Path is empty".into()));
    }

    let raw = Path::new(path);
    if raw.components().any(|c| c == std::path::Component::ParentDir) {
        return Err(BackupError::PathValidation(
            "Path must not contain parent-directory segments (..)".into(),
        ));
    }

    let canonical = raw.canonicalize().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            BackupError::PathValidation(format!("Path not found: {}", raw.display()))
        } else {
            BackupError::Io(e.to_string())
        }
    })?;

    let ext = canonical.extension().and_then(|e| e.to_str()).unwrap_or("");
    if !matches!(ext, "db" | "sqlite" | "sqlite3") {
        return Err(BackupError::PathValidation(format!(
            "Path must end with .db, .sqlite, or .sqlite3, got .{}", ext
        )));
    }

    if !canonical.starts_with(root) {
        return Err(BackupError::PathValidation(format!(
            "Path {} is outside the allowed root {}", canonical.display(), root.display()
        )));
    }

    let path_str = canonical.to_string_lossy();
    if !path_str.chars().all(|c| PATH_ALLOW_CHARS.contains(&c)) {
        return Err(BackupError::PathValidation(
            "Path contains disallowed characters".into(),
        ));
    }

    Ok(canonical)
}

/// Validates a path for creating a new backup file.
/// Unlike `validate_path`, the file does not need to exist yet,
/// and the path is not restricted to a root directory (the OS file
/// dialog is trusted to constrain user choice).
pub fn validate_create_path(path: &str) -> Result<PathBuf, BackupError> {
    if path.trim().is_empty() {
        return Err(BackupError::PathValidation("Path is empty".into()));
    }

    let raw = Path::new(path);
    if raw.components().any(|c| c == std::path::Component::ParentDir) {
        return Err(BackupError::PathValidation(
            "Path must not contain parent-directory segments (..)".into(),
        ));
    }

    let ext = raw.extension().and_then(|e| e.to_str()).unwrap_or("");
    if !matches!(ext, "db" | "sqlite" | "sqlite3") {
        return Err(BackupError::PathValidation(format!(
            "Path must end with .db, .sqlite, or .sqlite3, got .{}", ext
        )));
    }

    let path_str = raw.to_string_lossy();
    if !path_str.chars().all(|c| PATH_ALLOW_CHARS.contains(&c)) {
        return Err(BackupError::PathValidation(
            "Path contains disallowed characters".into(),
        ));
    }

    Ok(raw.to_path_buf())
}

pub async fn integrity_ok(db: &SqlitePool) -> Result<bool, AppError> {
    let status: String = sqlx::query_scalar::<_, String>("PRAGMA integrity_check")
        .fetch_one(db)
        .await?;
    Ok(status == "ok")
}
