use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub db: Arc<Mutex<SqlitePool>>,
    pub db_path: String,
}

impl AppState {
    pub fn new(db: SqlitePool, db_path: String) -> Self {
        Self { db: Arc::new(Mutex::new(db)), db_path }
    }

    pub async fn reconnect(&self) -> Result<(), sqlx::Error> {
        let url = format!("sqlite:{}?mode=rwc", self.db_path);
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&url)
            .await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        let mut guard = self.db.lock().await;
        *guard = pool;
        Ok(())
    }
}

pub async fn initialize(url: &str) -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(url)
        .await?;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
