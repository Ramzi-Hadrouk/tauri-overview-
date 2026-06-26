use crate::config::database::AppState;
use crate::core::error::AppError;

/// Check if the current user has the given permission.
/// Placeholder implementation — extend with real RBAC when needed.
pub async fn require_permission(
    _state: &AppState,
    _permission: &str,
) -> Result<(), AppError> {
    Ok(())
}
