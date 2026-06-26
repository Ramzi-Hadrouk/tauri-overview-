use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub db: SqlitePool,
    pub db_path: Arc<Mutex<String>>,
}

impl AppState {
    pub fn new(db: SqlitePool, db_path: String) -> Self {
        Self { db, db_path: Arc::new(Mutex::new(db_path)) }
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
