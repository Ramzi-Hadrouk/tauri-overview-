use std::path::Path;
use base64::Engine;
use crate::core::error::AppError;

pub fn is_data_uri(s: &str) -> bool {
    s.starts_with("data:")
}

pub fn save_image(images_dir: &Path, id: &str, data_uri: &str) -> Result<String, AppError> {
    let (ext, bytes) = parse_data_uri(data_uri)?;
    let filename = format!("{}.{}", id, ext);
    let dest = images_dir.join(&filename);
    std::fs::create_dir_all(dest.parent().unwrap())
        .map_err(|e| AppError::internal(&format!("Failed to create images dir: {}", e)))?;
    std::fs::write(&dest, bytes)
        .map_err(|e| AppError::internal(&format!("Failed to write image: {}", e)))?;
    Ok(filename)
}

pub fn delete_image(images_dir: &Path, filename: &str) {
    let path = images_dir.join(filename);
    let _ = std::fs::remove_file(&path);
}

fn parse_data_uri(uri: &str) -> Result<(String, Vec<u8>), AppError> {
    let body = uri.split(',').nth(1)
        .ok_or_else(|| AppError::validation("image", "Invalid data URI"))?;

    let header = uri.split(',').next().unwrap_or("");
    let ext = if header.contains("png") {
        "png"
    } else if header.contains("gif") {
        "gif"
    } else if header.contains("webp") {
        "webp"
    } else if header.contains("bmp") {
        "bmp"
    } else {
        "jpg"
    };

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(body)
        .map_err(|e| AppError::validation("image", &format!("Invalid base64: {}", e)))?;

    Ok((ext.to_string(), bytes))
}
