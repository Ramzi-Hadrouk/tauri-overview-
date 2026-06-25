use crate::env::AppConfig;

#[tauri::command]
pub fn get_db_path() -> String {
    AppConfig::db_path()
}

#[tauri::command]
pub fn get_db_size() -> Result<u64, String> {
    let path = AppConfig::db_path();
    Ok(std::fs::metadata(&path).map_err(|e| e.to_string())?.len())
}

#[tauri::command]
pub fn write_log(entry: serde_json::Value) -> Result<(), String> {
    tracing::info!(target: "ui", "{}", entry);
    Ok(())
}
