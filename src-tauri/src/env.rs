pub struct AppConfig;

impl AppConfig {
    /// Path to the SQLite database file.
    pub fn db_path() -> String {
        std::env::var("DB_PATH").unwrap_or_else(|_| "./client-manager.db".into())
    }

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
