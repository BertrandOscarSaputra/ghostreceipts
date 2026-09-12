use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::user::CreateUserRequest,
    services::user_service,
    state::AppState,
};

pub async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user = user_service::create_user(&state.db, payload).await?;
    Ok((StatusCode::CREATED, Json(user)))
}

pub async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let user = user_service::get_by_id(&state.db, id).await?;
    Ok((StatusCode::OK, Json(user)))
}

pub async fn get_user_by_username(
    State(state): State<AppState>,
    Path(username): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user = user_service::get_by_username(&state.db, &username).await?;
    Ok((StatusCode::OK, Json(user)))
}

pub async fn list_users(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let users = user_service::list_all(&state.db).await?;
    Ok((StatusCode::OK, Json(users)))
}
