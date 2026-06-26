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

#[tauri::command]
pub async fn create_backup(
    db_path: String,
    target_path: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<String>, AppError> {
    let root = Path::new(&db_path)
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .to_path_buf();

    let db_path_str = state.db_path.lock().await.clone();
    let service = CreateBackupService::new(
        &state.db,
        &db_path_str,
        &root,
    );
    let path = service.execute(&target_path).await?;
    Ok(IpcResponse::success(path, "Backup created successfully"))
}

#[tauri::command]
pub async fn restore_backup(
    backup_path: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<()>, AppError> {
    let db_path_str = state.db_path.lock().await.clone();
    let live_path = Path::new(&db_path_str).to_path_buf();
    let root = live_path.parent()
        .unwrap_or_else(|| Path::new("."))
        .to_path_buf();

    let service = RestoreBackupService::new(
        &state.db,
        &live_path,
        &root,
    );
    service.execute(&backup_path).await?;
    Ok(IpcResponse::empty("Backup restored. Reload the app to see changes."))
}

#[tauri::command]
pub async fn verify_backup(path: String) -> Result<IpcResponse<bool>, AppError> {
    let valid = VerifyBackupService::execute(&path).await?;
    Ok(IpcResponse::success(valid, "Backup verification complete"))
}
