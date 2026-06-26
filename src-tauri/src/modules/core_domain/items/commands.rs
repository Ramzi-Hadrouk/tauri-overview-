use tauri::State;
use crate::core::{
    error::AppError,
    response::{IpcResponse, paginated},
    pagination,
    permissions::require_permission,
};
use crate::config::database::AppState;
use super::{
    domain::entities::{Item, CreateItemInput, UpdateItemInput},
    repository::ItemRepository,
    services::{
        create_item::CreateItemService,
        update_item::UpdateItemService,
        delete_item::DeleteItemService,
    },
};

#[tauri::command]
pub async fn list_items(
    page: Option<u64>,
    size: Option<u64>,
    state: State<'_, AppState>,
) -> Result<IpcResponse<crate::core::response::PaginatedData<Item>>, AppError> {
    require_permission(&state, "items:read").await?;
    let (page, size) = pagination::normalize(page, size);
    let db = state.db.lock().await;
    let repo = ItemRepository::new(&db);
    let (items, total) = repo.list_paginated(page, size).await?;
    Ok(paginated(items, total, page, size, "Items retrieved successfully"))
}

#[tauri::command]
pub async fn get_item(
    id: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<Item>, AppError> {
    require_permission(&state, "items:read").await?;
    let db = state.db.lock().await;
    let repo = ItemRepository::new(&db);
    let item = repo.get_by_id(&id).await?
        .ok_or_else(|| AppError::not_found("Item not found"))?;
    Ok(IpcResponse::success(item, "Item retrieved successfully"))
}

#[tauri::command]
pub async fn create_item(
    data: CreateItemInput,
    state: State<'_, AppState>,
) -> Result<IpcResponse<Item>, AppError> {
    require_permission(&state, "items:create").await?;
    let db = state.db.lock().await;
    let service = CreateItemService::new(&db);
    let item = service.execute(data).await?;
    Ok(IpcResponse::success(item, "Item created successfully"))
}

#[tauri::command]
pub async fn update_item(
    id: String,
    data: UpdateItemInput,
    state: State<'_, AppState>,
) -> Result<IpcResponse<Item>, AppError> {
    require_permission(&state, "items:update").await?;
    let db = state.db.lock().await;
    let service = UpdateItemService::new(&db);
    let item = service.execute(&id, data).await?;
    Ok(IpcResponse::success(item, "Item updated successfully"))
}

#[tauri::command]
pub async fn delete_item(
    id: String,
    state: State<'_, AppState>,
) -> Result<IpcResponse<()>, AppError> {
    require_permission(&state, "items:delete").await?;
    let db = state.db.lock().await;
    let service = DeleteItemService::new(&db);
    service.execute(&id).await?;
    Ok(IpcResponse::empty("Item deleted successfully"))
}
