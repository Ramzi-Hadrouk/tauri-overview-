use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use crate::core::error::AppError;
use super::super::domain::errors::BackupError;

const PRE_RESTORE_SUFFIX: &str = "db.pre-restore";

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

pub struct RestoreBackupService<'a> {
    db: &'a SqlitePool,
    live_db_path: &'a Path,
    root: &'a Path,
}

impl<'a> RestoreBackupService<'a> {
    pub fn new(db: &'a SqlitePool, live_db_path: &'a Path, root: &'a Path) -> Self {
        Self { db, live_db_path, root }
    }

    pub async fn execute(&self, backup_path: &str) -> Result<(), AppError> {
        let validated_backup = validate_path(backup_path, self.root)?;
        let backup_str = validated_backup.to_string_lossy().to_string();
        let fname = validated_backup.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        tracing::info!(target: "backup", "restoring from {}", fname);

        let backup_url = format!("sqlite:{}?mode=ro", &backup_str);
        let backup_pool = sqlx::SqlitePool::connect(&backup_url)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        if !integrity_ok(&backup_pool).await? {
            backup_pool.close().await;
            return Err(AppError::internal("Backup file is corrupt"));
        }

        backup_pool.close().await;

        // Snapshot current live DB
        let pre_restore_path = self.live_db_path.with_extension(PRE_RESTORE_SUFFIX);
        let pre_restore_str = pre_restore_path.to_string_lossy().to_string();
        let snapshot_sql = format!("VACUUM INTO '{}';", pre_restore_str.replace('\'', "''"));
        sqlx::query(&snapshot_sql)
            .execute(self.db)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        // Close live pool, copy backup over live, then the caller will reopen the pool
        self.db.close().await;

        std::fs::copy(&backup_str, &self.live_db_path)
            .map_err(|e| AppError::internal(&e.to_string()))?;

        tracing::info!(target: "backup", "restore complete — pool closed, db file replaced");
        Ok(())
    }
}
