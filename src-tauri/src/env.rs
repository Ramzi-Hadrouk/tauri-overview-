use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

/// Application state managed by Tauri.
/// Injected into every command via `tauri::State<AppState>`.
pub struct AppState {
    pub db_path: PathBuf,
    pub db: Mutex<Connection>,
}

impl AppState {
    /// Path to the database file.
    pub fn db_path(&self) -> &PathBuf {
        &self.db_path
    }

    /// Lock and return the database connection.
    pub fn db(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.db.lock().expect("db mutex poisoned")
    }
}

/// Static (non-db) configuration resolved from the environment at startup.
pub struct AppConfig;

impl AppConfig {
    /// Directory for application log files.
    pub fn log_dir() -> String {
        std::env::var("LOG_DIR").unwrap_or_else(|_| {
            dirs::data_dir()
                .map(|p| p.join("client-manager-desktop/logs").to_string_lossy().to_string())
                .unwrap_or_else(|| "./logs".into())
        })
    }

    /// Schema version of the current application build.
    pub fn app_schema_version() -> u32 {
        std::env::var("APP_SCHEMA_VERSION")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(2)
    }

    /// Minimum compatible DB schema version this app can open.
    pub fn min_compatible_schema_version() -> u32 {
        std::env::var("MIN_COMPATIBLE_SCHEMA_VERSION")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(1)
    }

    /// Whether the app is running in development mode.
    pub fn is_dev() -> bool {
        std::env::var("NODE_ENV").as_deref() != Ok("production")
    }

    /// Tracing-subscriber filter directive (RUST_LOG).
    pub fn rust_log() -> String {
        std::env::var("RUST_LOG").unwrap_or_else(|_| {
            "info,application=debug,backup=debug,database=debug,migration=debug,ipc=debug,ui=info".into()
        })
    }
}
