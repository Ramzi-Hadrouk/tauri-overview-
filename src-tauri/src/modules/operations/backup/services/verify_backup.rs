use sqlx::SqlitePool;
use crate::core::error::AppError;

pub struct VerifyBackupService;

impl VerifyBackupService {
    pub async fn execute(path: &str) -> Result<bool, AppError> {
        let url = format!("sqlite:{}?mode=ro", path);
        let pool = SqlitePool::connect(&url)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;

        let status: String = sqlx::query_scalar::<_, String>("PRAGMA integrity_check")
            .fetch_one(&pool)
            .await?;

        pool.close().await;
        Ok(status == "ok")
    }
}
