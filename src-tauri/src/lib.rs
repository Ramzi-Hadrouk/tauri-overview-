// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod error;
pub mod commands;
pub mod tracing_setup;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tracing_setup::init_tracing();
  tauri::Builder::default()
    .setup(|app| {
      let app_dir = app.path().app_data_dir().expect("app_data_dir");
      std::fs::create_dir_all(&app_dir).expect("create app_data_dir");
      let db_path = app_dir.join("client-manager.db");
      std::env::set_var("DB_PATH", db_path.to_string_lossy().to_string());
      tracing::info!(target: "application", "db_path = {}", db_path.display());
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