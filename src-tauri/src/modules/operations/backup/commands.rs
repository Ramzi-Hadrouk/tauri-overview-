use std::path::Path;
use tauri::State;
use crate::core::error::AppError;
use crate::core::response::IpcResponse;
use crate::config::database::AppState;
use super::services::{
    create_backup::CreateBackupService,
    restore_backup::RestoreBackupService,
    verify_backup::VerifyBackupService,
};
use super::domain::path_utils;

#[tauri::command]
pub async fn create_backup(
    target_path: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<String>, AppError> {
    let db_path = Path::new(&state.db_path);
    let root = db_path.parent().unwrap_or_else(|| Path::new("."));

    let db = state.db.lock().await;
    let service = CreateBackupService::new(&db, &state.db_path, root);
    let path = service.execute(&target_path).await?;
    Ok(IpcResponse::success(path, "Backup created successfully"))
}

#[tauri::command]
pub async fn restore_backup(
    backup_path: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<()>, AppError> {
    let live_path = Path::new(&state.db_path).to_path_buf();
    let root = live_path.parent()
        .unwrap_or_else(|| Path::new("."))
        .to_path_buf();

    let db = state.db.lock().await;
    let service = RestoreBackupService::new(&db, &live_path, &root);
    service.execute(&backup_path).await?;
    drop(db);

    state.reconnect().await.map_err(|e| AppError::internal(&e.to_string()))?;
    tracing::info!(target: "backup", "restore complete — pool reconnected");
    Ok(IpcResponse::empty("Backup restored successfully"))
}

#[tauri::command]
pub async fn verify_backup(
    path: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<bool>, AppError> {
    let db_path = Path::new(&state.db_path);
    let root = db_path.parent().unwrap_or_else(|| Path::new("."));
    let validated = path_utils::validate_path(&path, root)?;
    let valid = VerifyBackupService::execute(&validated.to_string_lossy()).await?;
    Ok(IpcResponse::success(valid, "Backup verification complete"))
}
