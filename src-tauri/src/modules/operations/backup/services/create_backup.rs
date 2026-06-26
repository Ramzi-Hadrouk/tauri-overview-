use sqlx::SqlitePool;
use std::path::Path;
use crate::core::error::AppError;
use super::super::domain::path_utils;

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
        let validated_target = path_utils::validate_create_path(target_path)?;
        let validated_db = path_utils::validate_path(self.db_path, self.root)?;

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

        if !path_utils::integrity_ok(&backup_pool).await? {
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
