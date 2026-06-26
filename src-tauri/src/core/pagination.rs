/// Shared pagination helpers.
/// Defaults are consistent with the frontend pagination constants.

pub const DEFAULT_PAGE: u64 = 1;
pub const DEFAULT_SIZE: u64 = 20;
pub const MAX_SIZE: u64 = 100;

/// Normalize page and size parameters with sensible defaults and bounds.
pub fn normalize(page: Option<u64>, size: Option<u64>) -> (u64, u64) {
    let page = page.unwrap_or(DEFAULT_PAGE).max(1);
    let size = size.unwrap_or(DEFAULT_SIZE).clamp(1, MAX_SIZE);
    (page, size)
}
