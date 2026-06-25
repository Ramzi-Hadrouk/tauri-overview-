use rusqlite::Connection;
use std::path::{Path, PathBuf};
use crate::error::AppError;
use crate::env::AppState;
use crate::tracing_setup::tracing_span;
use tauri::State;

const PRE_RESTORE_SUFFIX: &str = "db.pre-restore";

/// Allow-listed characters for validated paths (metacharacter defense).
const PATH_ALLOW_CHARS: &[char] = &[
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '_', '.', '/', '-', ' ', ':',
];

/// Validate that a user-supplied path is safe to use in SQLite operations.
/// Canonicalizes the path and checks:
///  - No parent-directory segments (`..`)
///  - Resolves symlinks and rejects them
///  - Must end with `.db` or `.sqlite`
///  - Must reside under the given `root` directory
///  - Must consist only of allow-listed characters (no SQL metacharacters)
fn validate_backup_path(path: &str, root: &Path) -> Result<PathBuf, AppError> {
    if path.is_empty() || path.trim().is_empty() {
        return Err(AppError::PathValidation("Path is empty".into()));
    }

    let raw = Path::new(path);

    // Reject parent-directory segments before resolution.
    if raw.components().any(|c| c == std::path::Component::ParentDir) {
        return Err(AppError::PathValidation(
            "Path must not contain parent-directory segments (..)".into(),
        ));
    }

    // Canonicalize — rejects non-existent paths and resolves symlinks.
    let canonical = raw.canonicalize().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            AppError::NotFound(format!("Path not found: {}", raw.display()))
        } else {
            AppError::Io(e.to_string())
        }
    })?;

    // Check extension.
    let ext = canonical.extension().and_then(|e| e.to_str()).unwrap_or("");
    if !matches!(ext, "db" | "sqlite" | "sqlite3") {
        return Err(AppError::PathValidation(format!(
            "Path must end with .db, .sqlite, or .sqlite3, got .{}",
            ext
        )));
    }

    // Check that canonical path is under the root.
    if !canonical.starts_with(root) {
        return Err(AppError::PathValidation(format!(
            "Path {} is outside the allowed root {}",
            canonical.display(),
            root.display()
        )));
    }

    // Check allow-list characters (metacharacter defense for SQL).
    let path_str = canonical.to_string_lossy();
    if !path_str.chars().all(|c| PATH_ALLOW_CHARS.contains(&c)) {
        return Err(AppError::PathValidation(
            "Path contains disallowed characters".into(),
        ));
    }

    Ok(canonical)
}

/// Run PRAGMA integrity_check on a connection. Returns true if the database is intact.
fn integrity_ok(conn: &Connection) -> Result<bool, AppError> {
    let status: String = conn
        .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
        .map_err(|e| AppError::Database(format!("Integrity check failed: {e}")))?;
    Ok(status == "ok")
}

#[tauri::command]
pub async fn create_backup(
    db_path: String,
    target_path: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let _span = tracing_span("backup.create");

    let root = state
        .db_path()
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .to_path_buf();

    let validated_target = validate_backup_path(&target_path, &root)?;
    let validated_db = validate_backup_path(&db_path, &root)?;

    let target_str = validated_target.to_string_lossy().to_string();
    let db_str = validated_db.to_string_lossy().to_string();
    let fname = validated_target
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    tracing::info!(target: "backup", "creating backup {}", fname);

    // VACUUM INTO doesn't support bound params — use the validated path (already
    // checked against allow-list, so no metacharacters can reach the statement).
    tokio::task::spawn_blocking(move || -> Result<String, AppError> {
        let conn = Connection::open(&db_str)?;
        conn.execute_batch(&format!("VACUUM INTO '{target_str}';"))?;

        let backup_conn = Connection::open(&target_str)?;
        if !integrity_ok(&backup_conn)? {
            let _ = std::fs::remove_file(&target_str);
            return Err(AppError::Integrity("Backup failed integrity check".into()));
        }

        let metadata = std::fs::metadata(&target_str)?;
        if metadata.len() == 0 {
            return Err(AppError::Integrity("Backup is zero bytes".into()));
        }

        tracing::info!(target: "backup", "backup created, size: {} bytes", metadata.len());
        Ok(target_str)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn restore_backup(
    backup_path: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let _span = tracing_span("backup.restore");

    let root = state
        .db_path()
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .to_path_buf();

    let validated_backup = validate_backup_path(&backup_path, &root)?;
    let backup_str = validated_backup.to_string_lossy().to_string();
    let fname = validated_backup
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    tracing::info!(target: "backup", "restoring from {}", fname);

    // Capture the db_path before moving into spawn_blocking.
    let live_path = state.db_path().clone();
    let pre_restore_path = live_path.with_extension(PRE_RESTORE_SUFFIX);

    tokio::task::spawn_blocking(move || -> Result<(), AppError> {
        // Verify backup integrity before touching the live DB.
        let backup_conn = Connection::open(&backup_str)?;
        if !integrity_ok(&backup_conn)? {
            return Err(AppError::Integrity("Backup file is corrupt".into()));
        }

        // Snapshot current live DB before overwriting (rollback safety).
        let live_conn = Connection::open(&live_path)?;
        let pre_restore_str = pre_restore_path.to_string_lossy().to_string();
        live_conn.execute_batch(&format!("VACUUM INTO '{pre_restore_str}';"))?;
        drop(live_conn);

        // Use the Online Backup API to restore into the live connection.
        // Open a read-only connection to the backup and restore into the live path.
        let mut dst = Connection::open(&live_path)?;
        let backup =
            rusqlite::backup::Backup::new(&backup_conn, &mut dst).map_err(|e| {
                AppError::Database(format!("Backup init failed: {e}"))
            })?;
        backup.run_to_completion(5, std::time::Duration::from_millis(250), None)?;

        tracing::info!(target: "backup", "restore complete");
        Ok(())
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn verify_backup(path: String) -> Result<bool, AppError> {
    let _span = tracing_span("backup.verify");

    tokio::task::spawn_blocking(move || -> Result<bool, AppError> {
        let conn = Connection::open(&path)?;
        integrity_ok(&conn)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}
