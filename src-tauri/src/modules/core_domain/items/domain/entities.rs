use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct Item {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub sku: String,
    pub quantity: i32,
    #[ts(type = "number")]
    pub price: f64,
    pub tags: String,
    pub image_path: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct CreateItemInput {
    pub name: String,
    pub description: Option<String>,
    pub sku: Option<String>,
    pub quantity: i32,
    #[ts(type = "number")]
    pub price: f64,
    pub tags: Option<String>,
    pub image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct UpdateItemInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sku: Option<String>,
    pub quantity: Option<i32>,
    pub price: Option<f64>,
    pub tags: Option<String>,
    pub image: Option<String>,
    pub is_active: Option<bool>,
}
