#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

pub mod core;
pub mod config;
pub mod modules;
pub mod tracing_setup;

const DB_FILENAME: &str = "client-manager.db";
const CURRENT_SCHEMA_VERSION: u32 = 3;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_setup::init_tracing();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().map_err(|e| {
                Box::new(std::io::Error::new(std::io::ErrorKind::NotFound, e))
            })?;
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join(DB_FILENAME);
            let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
            let db_path_str = db_path.to_string_lossy().to_string();

            tracing::info!(target: "application", "db_path = {}", db_path_str);

            let pool = tauri::async_runtime::block_on(async {
                config::database::initialize(&db_url).await
            })?;

            let min_compat = config::app::AppConfig::min_compatible_schema_version();
            let version: String = tauri::async_runtime::block_on(async {
                sqlx::query_scalar(
                    "SELECT value FROM schema_meta WHERE key = 'schema_version'"
                )
                .fetch_optional(&pool)
                .await
            })
            .map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)))?
            .unwrap_or_else(|| "0".into());

            let db_version: u32 = version.parse().unwrap_or(0);
            if db_version < min_compat {
                let msg = format!(
                    "Database schema version {} is below minimum compatible version {}. Please migrate your database.",
                    db_version, min_compat
                );
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, msg)));
            }

            tauri::async_runtime::block_on(async {
                sqlx::query(
                    "INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', ?)"
                )
                .bind(CURRENT_SCHEMA_VERSION.to_string())
                .execute(&pool)
                .await
            })
            .map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

            app.manage(config::database::AppState::new(pool, db_path_str));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Items
            modules::core_domain::items::commands::list_items,
            modules::core_domain::items::commands::get_item,
            modules::core_domain::items::commands::create_item,
            modules::core_domain::items::commands::update_item,
            modules::core_domain::items::commands::delete_item,
            modules::core_domain::items::commands::get_item_image,
            // Backup
            modules::operations::backup::commands::create_backup,
            modules::operations::backup::commands::restore_backup,
            modules::operations::backup::commands::verify_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
