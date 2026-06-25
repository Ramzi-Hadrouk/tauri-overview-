// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub mod error;
pub mod commands;
pub mod env;
pub mod tracing_setup;

const DB_FILENAME: &str = "client-manager.db";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_setup::init_tracing();
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().map_err(|e| {
                Box::new(std::io::Error::new(std::io::ErrorKind::NotFound, e))
            })?;
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join(DB_FILENAME);
            tracing::info!(target: "application", "db_path = {}", db_path.display());

            let conn = Connection::open(&db_path)?;
            conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;")?;

            app.manage(env::AppState {
                db_path,
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::backup::create_backup,
            commands::backup::restore_backup,
            commands::backup::verify_backup,
            commands::database::get_db_path,
            commands::database::get_db_size,
            commands::database::write_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
