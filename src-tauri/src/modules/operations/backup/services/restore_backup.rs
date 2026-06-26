use sqlx::SqlitePool;
use std::path::Path;
use crate::core::error::AppError;
use super::super::domain::path_utils;

const PRE_RESTORE_SUFFIX: &str = "db.pre-restore";

pub struct RestoreBackupService<'a> {
    db: &'a SqlitePool,
    live_db_path: &'a Path,
}

impl<'a> RestoreBackupService<'a> {
    pub fn new(db: &'a SqlitePool, live_db_path: &'a Path) -> Self {
        Self { db, live_db_path }
    }

    pub async fn execute(&self, backup_path: &str) -> Result<(), AppError> {
        let validated_backup = path_utils::validate_create_path(backup_path)?;
        if !validated_backup.exists() {
            return Err(AppError::validation("backup_path", &format!("File not found: {}", validated_backup.display())));
        }
        let backup_str = validated_backup.to_string_lossy().to_string();
        let fname = validated_backup.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        tracing::info!(target: "backup", "restoring from {}", fname);

        let backup_url = format!("sqlite:{}?mode=ro", &backup_str);
        let backup_pool = sqlx::SqlitePool::connect(&backup_url)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        if !path_utils::integrity_ok(&backup_pool).await? {
            backup_pool.close().await;
            return Err(AppError::internal("Backup file is corrupt"));
        }

        backup_pool.close().await;

        // Snapshot current live DB before replacing
        let pre_restore_path = self.live_db_path.with_extension(PRE_RESTORE_SUFFIX);
        let pre_restore_str = pre_restore_path.to_string_lossy().to_string();
        let snapshot_sql = format!("VACUUM INTO '{}';", pre_restore_str.replace('\'', "''"));
        sqlx::query(&snapshot_sql)
            .execute(self.db)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        // Close the old pool connections before replacing the file
        self.db.close().await;

        std::fs::copy(&backup_str, &self.live_db_path)
            .map_err(|e| AppError::internal(&e.to_string()))?;

        tracing::info!(target: "backup", "db file replaced");
        Ok(())
    }
}
