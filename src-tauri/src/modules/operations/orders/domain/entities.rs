use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct Order {
    pub id: String,
    pub item_id: String,
    #[ts(type = "number")]
    pub quantity: i64,
    pub status: String,
    pub created_at: String,
}
