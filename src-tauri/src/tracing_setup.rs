// src-tauri/src/tracing_setup.rs
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use tracing_appender::rolling;

pub fn init_tracing() {
    let log_dir = std::env::var("LOG_DIR").unwrap_or_else(|_| {
        dirs::data_dir()
            .map(|p| p.join("client-manager-desktop/logs").to_string_lossy().to_string())
            .unwrap_or_else(|| "./logs".into())
    });

    let file_appender = rolling::daily(&log_dir, "app.log");
    let (file_writer, guard) = tracing_appender::non_blocking(file_appender);
    std::mem::forget(guard); // Keep alive for app lifetime

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        EnvFilter::new("info,application=debug,backup=debug,database=debug,migration=debug,ipc=debug,ui=info")
    });

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(false).with_writer(std::io::stdout))
        .with(fmt::layer().json().with_writer(file_writer))
        .init();

    tracing::info!(target: "application", "tracing initialized");
}

pub fn tracing_span(name: &str) -> tracing::Span {
    tracing::info_span!("operation", name = name)
}