// src-tauri/src/commands/backup.rs
use rusqlite::Connection;
use std::path::PathBuf;
use crate::error::AppError;
use crate::tracing_setup::tracing_span;

#[tauri::command]
pub fn create_backup(db_path: String, target_path: String) -> Result<String, AppError> {
    let _span = tracing_span("backup.create");
    tracing::info!(target: "backup", "creating backup", from = %db_path, to = %target_path);

    if !std::path::Path::new(&db_path).exists() {
        return Err(AppError::NotFound(format!("Database not found: {}", db_path)));
    }

    let conn = Connection::open(&db_path)
        .map_err(|e| AppError::Database(format!("Open source failed: {e}")))?;

    conn.execute_batch(&format!("VACUUM INTO '{}';", target_path.replace('\'', "''")))
        .map_err(|e| AppError::Database(format!("VACUUM INTO failed: {e}")))?;

    // Integrity check on the resulting file
    let backup_conn = Connection::open(&target_path)
        .map_err(|e| AppError::Database(format!("Open backup failed: {e}")))?;
    let ok: i64 = backup_conn
        .query_row("PRAGMA integrity_check;", [], |row| {
            let v: String = row.get(0)?;
            Ok(if v == "ok" { 1 } else { 0 })
        })
        .map_err(|e| AppError::Database(format!("Integrity check failed: {e}")))?;

    if ok != 1 {
        let _ = std::fs::remove_file(&target_path);
        return Err(AppError::Integrity("Backup failed integrity check".into()));
    }

    let metadata = std::fs::metadata(&target_path)
        .map_err(|e| AppError::Io(format!("Stat backup: {e}")))?;
    if metadata.len() == 0 {
        return Err(AppError::Integrity("Backup is zero bytes".into()));
    }

    tracing::info!(target: "backup", "backup created", size_bytes = metadata.len());
    Ok(target_path)
}

#[tauri::command]
pub fn restore_backup(backup_path: String, target_path: String) -> Result<(), AppError> {
    let _span = tracing_span("backup.restore");

    if !std::path::Path::new(&backup_path).exists() {
        return Err(AppError::NotFound(format!("Backup not found: {}", backup_path)));
    }

    // Verify backup before overwriting live DB
    let conn = Connection::open(&backup_path)
        .map_err(|e| AppError::Database(format!("Open backup: {e}")))?;
    let status: String = conn
        .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
        .map_err(|e| AppError::Database(format!("Integrity check: {e}")))?;
    if status != "ok" {
        return Err(AppError::Integrity(format!("Backup corrupt: {status}")));
    }

    // Snapshot current live DB before overwriting (rollback safety)
    let pre_restore = PathBuf::from(&target_path).with_extension("db.pre-restore");
    conn.execute_batch(&format!(
        "VACUUM INTO '{}';",
        pre_restore.to_string_lossy().replace('\'', "''")
    ))
    .map_err(|e| AppError::Database(format!("Pre-restore snapshot: {e}")))?;

    if let Some(parent) = std::path::Path::new(&target_path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::Io(format!("mkdir: {e}")))?;
    }
    std::fs::copy(&backup_path, &target_path)
        .map_err(|e| AppError::Io(format!("Restore copy: {e}")))?;

    tracing::info!(target: "backup", "restore complete");
    Ok(())
}

#[tauri::command]
pub fn verify_backup(path: String) -> Result<bool, AppError> {
    let conn = Connection::open(&path)
        .map_err(|e| AppError::Database(format!("Open: {e}")))?;
    let status: String = conn
        .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
        .map_err(|e| AppError::Database(format!("Integrity check: {e}")))?;
    Ok(status == "ok")
}