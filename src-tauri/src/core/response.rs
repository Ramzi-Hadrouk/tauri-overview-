use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct IpcResponse<T: TS> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct PaginatedData<T: TS> {
    pub items: Vec<T>,
    #[ts(type = "number")]
    pub total: u64,
    #[ts(type = "number")]
    pub page: u64,
    #[ts(type = "number")]
    pub size: u64,
    #[ts(type = "number")]
    pub pages: u64,
}

impl<T: Serialize + TS> IpcResponse<T> {
    pub fn success(data: T, message: &str) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data: Some(data),
        }
    }
}

impl IpcResponse<()> {
    pub fn empty(message: &str) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data: None,
        }
    }
}

pub fn paginated<T: Serialize + TS>(
    items: Vec<T>,
    total: u64,
    page: u64,
    size: u64,
    message: &str,
) -> IpcResponse<PaginatedData<T>> {
    let pages = if total == 0 { 0 } else { (total as f64 / size as f64).ceil() as u64 };
    IpcResponse::success(
        PaginatedData { items, total, page, size, pages },
        message,
    )
}
