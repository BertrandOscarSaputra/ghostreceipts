use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::user::{CreateUserRequest, User},
    repositories::user_repository,
};

pub async fn create_user(pool: &PgPool, payload: CreateUserRequest) -> Result<User, AppError> {
    let username = payload.username.trim();
    if username.is_empty() {
        return Err(AppError::BadRequest("Username is required".to_string()));
    }

    if let Some(_existing) = user_repository::find_by_username(pool, username).await? {
        return Err(AppError::BadRequest(format!(
            "Username '{}' is already taken",
            username
        )));
    }

    let id = Uuid::new_v4();
    let user = user_repository::create_user(
        pool,
        id,
        username,
        payload.wallet_address.as_deref(),
    )
    .await?;

    Ok(user)
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<User, AppError> {
    user_repository::find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("User {} not found", id)))
}

pub async fn get_by_username(pool: &PgPool, username: &str) -> Result<User, AppError> {
    user_repository::find_by_username(pool, username.trim())
        .await?
        .ok_or_else(|| AppError::NotFound(format!("User '{}' not found", username)))
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<User>, AppError> {
    let users = user_repository::find_all(pool).await?;
    Ok(users)
}
