use crate::config::app::AppConfig;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use tracing_appender::rolling;

pub fn init_tracing() {
    let log_dir = AppConfig::log_dir();

    let file_appender = rolling::daily(&log_dir, "app.log");
    let (file_writer, guard) = tracing_appender::non_blocking(file_appender);
    std::mem::forget(guard);

    let filter = EnvFilter::new(&AppConfig::rust_log());

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
