/// Application configuration resolved from the environment at startup.
pub struct AppConfig;

impl AppConfig {
    pub fn log_dir() -> String {
        std::env::var("LOG_DIR").unwrap_or_else(|_| {
            dirs::data_dir()
                .map(|p| p.join("client-manager-desktop/logs").to_string_lossy().to_string())
                .unwrap_or_else(|| "./logs".into())
        })
    }

    pub fn app_schema_version() -> u32 {
        std::env::var("APP_SCHEMA_VERSION")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(2)
    }

    pub fn min_compatible_schema_version() -> u32 {
        std::env::var("MIN_COMPATIBLE_SCHEMA_VERSION")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(1)
    }

    pub fn is_dev() -> bool {
        std::env::var("NODE_ENV").as_deref() != Ok("production")
    }

    pub fn rust_log() -> String {
        std::env::var("RUST_LOG").unwrap_or_else(|_| {
            "info,application=debug,backup=debug,database=debug,migration=debug,ipc=debug,ui=info".into()
        })
    }
}
