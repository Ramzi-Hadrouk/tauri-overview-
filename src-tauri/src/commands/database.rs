//src-tauri/src/commands/database.rs
use std::env;

#[tauri::command]
pub fn get_db_path() -> String {
    env::var("DB_PATH").unwrap_or_else(|_| "./client-manager.db".into())
}

#[tauri::command]
pub fn get_db_size() -> Result<u64, String> {
    let path = env::var("DB_PATH").map_err(|e| e.to_string())?;
    Ok(std::fs::metadata(&path).map_err(|e| e.to_string())?.len())
}

#[tauri::command]
pub fn write_log(entry: serde_json::Value) -> Result<(), String> {
    tracing::info!(target: "ui", "{}", entry);
    Ok(())
}
