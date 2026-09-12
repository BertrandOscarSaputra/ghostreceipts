use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    #[serde(skip_serializing)]
    pub password_hash: Option<String>,
    pub wallet_address: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: Option<String>,
    pub wallet_address: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub wallet_address: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginRequest {
    pub identifier: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub user: User,
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub exp: usize,
    pub iat: usize,
}
