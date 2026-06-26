pub const MAX_NAME_LENGTH: usize = 100;

pub fn validate_name(name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Name must not be empty".into());
    }
    if trimmed.len() > MAX_NAME_LENGTH {
        return Err(format!("Name must be at most {} characters", MAX_NAME_LENGTH));
    }
    Ok(())
}

pub fn can_activate_item(is_active: bool) -> bool {
    is_active
}
