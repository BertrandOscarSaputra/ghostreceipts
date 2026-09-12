use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::user::{LoginRequest, RegisterRequest},
    services::user_service,
    state::AppState,
};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<impl IntoResponse, AppError> {
    let response = user_service::register_user(&state.db, payload).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let response = user_service::login_user(&state.db, payload).await?;
    Ok((StatusCode::OK, Json(response)))
}

pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid Authorization header format".to_string()))?;

    let claims = user_service::verify_token_claims(token)?;
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid user identifier in token".to_string()))?;

    let user = user_service::get_by_id(&state.db, user_id).await?;
    Ok((StatusCode::OK, Json(user)))
}
