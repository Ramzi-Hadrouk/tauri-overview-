#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

pub mod core;
pub mod config;
pub mod modules;
pub mod tracing_setup;

const DB_FILENAME: &str = "client-manager.db";

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

            tracing::info!(target: "application", "db_path = {}", db_path.display());

            let pool = tauri::async_runtime::block_on(async {
                config::database::initialize(&db_url).await
            })?;

            app.manage(config::database::AppState::new(pool, db_path.to_string_lossy().to_string()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Items
            modules::core_domain::items::commands::list_items,
            modules::core_domain::items::commands::get_item,
            modules::core_domain::items::commands::create_item,
            modules::core_domain::items::commands::update_item,
            modules::core_domain::items::commands::delete_item,
            // Backup
            modules::operations::backup::commands::create_backup,
            modules::operations::backup::commands::restore_backup,
            modules::operations::backup::commands::verify_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
