use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use crate::core::error::AppError;
use super::super::domain::errors::BackupError;

const PATH_ALLOW_CHARS: &[char] = &[
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '_', '.', '/', '-', ' ', ':',
];

fn validate_path(path: &str, root: &Path) -> Result<PathBuf, BackupError> {
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

async fn integrity_ok(db: &SqlitePool) -> Result<bool, AppError> {
    let status: String = sqlx::query_scalar::<_, String>("PRAGMA integrity_check")
        .fetch_one(db)
        .await?;
    Ok(status == "ok")
}

pub struct CreateBackupService<'a> {
    db: &'a SqlitePool,
    db_path: &'a str,
    root: &'a Path,
}

impl<'a> CreateBackupService<'a> {
    pub fn new(db: &'a SqlitePool, db_path: &'a str, root: &'a Path) -> Self {
        Self { db, db_path, root }
    }

    pub async fn execute(&self, target_path: &str) -> Result<String, AppError> {
        let validated_target = validate_path(target_path, self.root)?;
        let validated_db = validate_path(self.db_path, self.root)?;

        let target_str = validated_target.to_string_lossy().to_string();
        let _db_str = validated_db.to_string_lossy().to_string();
        let fname = validated_target.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        tracing::info!(target: "backup", "creating backup {}", fname);

        // VACUUM INTO with validated path (already checked allow-list — safe from injection)
        let vacuum_sql = format!("VACUUM INTO '{}';", target_str.replace('\'', "''"));
        sqlx::query(&vacuum_sql)
            .execute(self.db)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        // Verify the backup
        let backup_url = format!("sqlite:{}?mode=rwc", &target_str);
        let backup_pool = sqlx::SqlitePool::connect(&backup_url)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        if !integrity_ok(&backup_pool).await? {
            let _ = std::fs::remove_file(&target_str);
            return Err(AppError::internal("Backup failed integrity check"));
        }

        let metadata = std::fs::metadata(&target_str)
            .map_err(|e| AppError::internal(&e.to_string()))?;

        if metadata.len() == 0 {
            return Err(AppError::internal("Backup is zero bytes"));
        }

        backup_pool.close().await;

        tracing::info!(target: "backup", "backup created, size: {} bytes", metadata.len());
        Ok(target_str)
    }
}
