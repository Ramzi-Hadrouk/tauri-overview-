use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub is_active: bool,
    pub created_at: String,
}
