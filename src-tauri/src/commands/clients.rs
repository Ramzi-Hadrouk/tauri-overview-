use crate::error::AppError;
use crate::env::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

// SYNCED_WITH: src/domain/clients/rules.ts
const MAX_NAME_LENGTH: usize = 100;
// SYNCED_WITH: src/domain/clients/rules.ts
const PHONE_MIN_DIGITS: usize = 7;
// SYNCED_WITH: src/domain/clients/rules.ts
const PHONE_MAX_DIGITS: usize = 15;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Client {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientCreateData {
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientUpdateData {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub archived: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientFilters {
    pub query: Option<String>,
    pub archived: Option<bool>,
    pub page: Option<i64>,
    pub size: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResult {
    pub items: Vec<Client>,
    pub total: i64,
    pub page: i64,
    pub size: i64,
    pub total_pages: i64,
}

// SYNCED_WITH: src/domain/clients/rules.ts
fn validate_name(name: &str) -> Result<(), AppError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(AppError::Database("Name must not be empty".into()));
    }
    if trimmed.len() > MAX_NAME_LENGTH {
        return Err(AppError::Database(format!(
            "Name must be at most {} characters",
            MAX_NAME_LENGTH
        )));
    }
    Ok(())
}

// SYNCED_WITH: src/domain/clients/rules.ts
fn validate_email(email: &str) -> Result<(), AppError> {
    if !email_address::EmailAddress::is_valid(email) {
        return Err(AppError::Database("Invalid email format".into()));
    }
    Ok(())
}

// SYNCED_WITH: src/domain/clients/rules.ts
fn validate_phone(phone: &str) -> Result<(), AppError> {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() < PHONE_MIN_DIGITS || digits.len() > PHONE_MAX_DIGITS {
        return Err(AppError::Database(format!(
            "Phone must have between {} and {} digits",
            PHONE_MIN_DIGITS, PHONE_MAX_DIGITS,
        )));
    }
    Ok(())
}

fn get_client_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Client, AppError> {
    conn.query_row(
        "SELECT id, first_name, last_name, phone, email, archived, created_at, updated_at \
         FROM clients WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(Client {
                id: row.get(0)?,
                first_name: row.get(1)?,
                last_name: row.get(2)?,
                phone: row.get(3)?,
                email: row.get(4)?,
                archived: row.get::<_, i64>(5)? != 0,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => {
            AppError::NotFound("Client not found".into())
        }
        other => AppError::Database(other.to_string()),
    })
}

fn create_client_impl(
    conn: &rusqlite::Connection,
    data: ClientCreateData,
) -> Result<Client, AppError> {
    let first_name = data.first_name.trim().to_string();
    let last_name = data.last_name.trim().to_string();

    validate_name(&first_name)?;
    validate_name(&last_name)?;

    let phone: Option<String> = data
        .phone
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty());

    let email: Option<String> = data
        .email
        .map(|e| e.trim().to_string())
        .filter(|e| !e.is_empty());

    if let Some(ref e) = email {
        validate_email(e)?;
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM clients WHERE email = ?1",
            rusqlite::params![e],
            |row| row.get(0),
        )?;
        if exists {
            return Err(AppError::Database(
                "A client with this email already exists".into(),
            ));
        }
    }

    if let Some(ref p) = phone {
        validate_phone(p)?;
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    conn.execute(
        "INSERT INTO clients (id, first_name, last_name, phone, email, archived, created_at, updated_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?6)",
        rusqlite::params![id, first_name, last_name, phone, email, now],
    )?;

    Ok(Client {
        id,
        first_name,
        last_name,
        phone,
        email,
        archived: false,
        created_at: now,
        updated_at: now,
    })
}

fn update_client_impl(
    conn: &rusqlite::Connection,
    id: &str,
    data: ClientUpdateData,
) -> Result<Client, AppError> {
    let existing = get_client_by_id(conn, id)?;

    let first_name = data
        .first_name
        .map(|v| v.trim().to_string())
        .unwrap_or(existing.first_name);
    let last_name = data
        .last_name
        .map(|v| v.trim().to_string())
        .unwrap_or(existing.last_name);
    let phone = data
        .phone
        .map(|v| {
            let trimmed = v.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        })
        .unwrap_or(existing.phone);
    let email = data
        .email
        .map(|v| {
            let trimmed = v.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        })
        .unwrap_or(existing.email);
    let archived = data.archived.unwrap_or(existing.archived);

    validate_name(&first_name)?;
    validate_name(&last_name)?;

    if let Some(ref e) = email {
        validate_email(e)?;
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM clients WHERE email = ?1 AND id != ?2",
            rusqlite::params![e, id],
            |row| row.get(0),
        )?;
        if exists {
            return Err(AppError::Database(
                "A client with this email already exists".into(),
            ));
        }
    }

    if let Some(ref p) = phone {
        validate_phone(p)?;
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    conn.execute(
        "UPDATE clients SET first_name = ?1, last_name = ?2, phone = ?3, email = ?4, \
         archived = ?5, updated_at = ?6 WHERE id = ?7",
        rusqlite::params![first_name, last_name, phone, email, archived as i64, now, id],
    )?;

    Ok(Client {
        id: id.to_string(),
        first_name,
        last_name,
        phone,
        email,
        archived,
        created_at: existing.created_at,
        updated_at: now,
    })
}

fn delete_client_impl(conn: &rusqlite::Connection, id: &str) -> Result<(), AppError> {
    let _ = get_client_by_id(conn, id)?;
    conn.execute("DELETE FROM clients WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

fn search_clients_impl(
    conn: &rusqlite::Connection,
    filters: ClientFilters,
) -> Result<PaginatedResult, AppError> {
    let page = filters.page.unwrap_or(1).max(1);
    let size = filters.size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * size;

    let sort_column = match filters.sort_by.as_deref() {
        Some("createdAt") => "created_at",
        _ => "last_name",
    };
    let sort_direction = match filters.sort_dir.as_deref() {
        Some("desc") => "DESC",
        _ => "ASC",
    };

    let like_pattern = filters
        .query
        .filter(|q| !q.is_empty())
        .map(|q| format!("%{}%", q));

    let where_clause =
        "WHERE (?1 IS NULL OR first_name LIKE ?1 OR last_name LIKE ?1 OR email LIKE ?1 OR phone LIKE ?1) \
         AND (?2 IS NULL OR archived = ?2)";

    let count_sql = format!("SELECT COUNT(*) FROM clients {}", where_clause);
    let total: i64 = conn.query_row(
        &count_sql,
        rusqlite::params![like_pattern, filters.archived],
        |row| row.get(0),
    )?;

    let data_sql = format!(
        "SELECT id, first_name, last_name, phone, email, archived, created_at, updated_at \
         FROM clients {} ORDER BY {} {} LIMIT ?3 OFFSET ?4",
        where_clause, sort_column, sort_direction,
    );

    let mut stmt = conn.prepare(&data_sql)?;
    let items = stmt
        .query_map(
            rusqlite::params![like_pattern, filters.archived, size, offset],
            |row| {
                Ok(Client {
                    id: row.get(0)?,
                    first_name: row.get(1)?,
                    last_name: row.get(2)?,
                    phone: row.get(3)?,
                    email: row.get(4)?,
                    archived: row.get::<_, i64>(5)? != 0,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            },
        )?
        .collect::<Result<Vec<_>, _>>()?;

    let total_pages = if total == 0 { 0 } else { ((total - 1) / size) + 1 };

    Ok(PaginatedResult {
        items,
        total,
        page,
        size,
        total_pages,
    })
}

#[tauri::command]
pub async fn get_client(id: String, state: State<'_, AppState>) -> Result<Client, AppError> {
    let db_path = state.db_path().to_string_lossy().to_string();
    tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&db_path)?;
        get_client_by_id(&conn, &id)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn search_clients(
    filters: ClientFilters,
    state: State<'_, AppState>,
) -> Result<PaginatedResult, AppError> {
    let db_path = state.db_path().to_string_lossy().to_string();
    tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&db_path)?;
        search_clients_impl(&conn, filters)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn create_client(
    data: ClientCreateData,
    state: State<'_, AppState>,
) -> Result<Client, AppError> {
    let db_path = state.db_path().to_string_lossy().to_string();
    tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&db_path)?;
        create_client_impl(&conn, data)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn update_client(
    id: String,
    data: ClientUpdateData,
    state: State<'_, AppState>,
) -> Result<Client, AppError> {
    let db_path = state.db_path().to_string_lossy().to_string();
    tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&db_path)?;
        update_client_impl(&conn, &id, data)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn delete_client(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let db_path = state.db_path().to_string_lossy().to_string();
    tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&db_path)?;
        delete_client_impl(&conn, &id)
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?
}
