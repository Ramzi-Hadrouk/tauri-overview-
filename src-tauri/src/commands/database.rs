use crate::env::AppState;
use tauri::State;

#[tauri::command]
pub fn get_db_path(state: State<'_, AppState>) -> String {
    state.db_path().to_string_lossy().to_string()
}

#[tauri::command]
pub fn get_db_size(state: State<'_, AppState>) -> Result<u64, String> {
    let path = state.db_path();
    Ok(std::fs::metadata(path).map_err(|e| e.to_string())?.len())
}

#[tauri::command]
pub fn write_log(entry: serde_json::Value) -> Result<(), String> {
    tracing::info!(target: "ui", "{}", entry);
    Ok(())
}
