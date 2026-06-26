pub const MAX_NAME_LENGTH: usize = 100;
pub const MAX_SKU_LENGTH: usize = 50;
pub const MAX_TAGS_LENGTH: usize = 500;

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

pub fn validate_sku(sku: &str) -> Result<(), String> {
    let trimmed = sku.trim();
    if trimmed.len() > MAX_SKU_LENGTH {
        return Err(format!("SKU must be at most {} characters", MAX_SKU_LENGTH));
    }
    Ok(())
}

pub fn validate_price(price: f64) -> Result<(), String> {
    if price < 0.0 {
        return Err("Price must not be negative".into());
    }
    Ok(())
}

pub fn validate_quantity(quantity: i32) -> Result<(), String> {
    if quantity < 0 {
        return Err("Quantity must not be negative".into());
    }
    Ok(())
}

pub fn validate_tags(tags: &str) -> Result<(), String> {
    let trimmed = tags.trim();
    if trimmed.len() > MAX_TAGS_LENGTH {
        return Err(format!("Tags must be at most {} characters", MAX_TAGS_LENGTH));
    }
    Ok(())
}
