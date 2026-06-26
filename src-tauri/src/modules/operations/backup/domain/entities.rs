use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct BackupResult {
    pub path: String,
    #[ts(type = "number")]
    pub size: u64,
}
