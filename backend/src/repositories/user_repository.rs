use sqlx::PgPool;
use uuid::Uuid;

use crate::models::user::User;

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, wallet_address, created_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, wallet_address, created_at
        FROM users
        WHERE LOWER(username) = LOWER($1)
        "#,
    )
    .bind(username)
    .fetch_optional(pool)
    .await
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, wallet_address, created_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn find_by_identifier(pool: &PgPool, identifier: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, wallet_address, created_at
        FROM users
        WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($1))
        "#,
    )
    .bind(identifier)
    .fetch_optional(pool)
    .await
}

pub async fn create_user(
    pool: &PgPool,
    id: Uuid,
    username: &str,
    email: Option<&str>,
    password_hash: Option<&str>,
    wallet_address: Option<&str>,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, username, email, password_hash, wallet_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, password_hash, wallet_address, created_at
        "#,
    )
    .bind(id)
    .bind(username)
    .bind(email)
    .bind(password_hash)
    .bind(wallet_address)
    .fetch_one(pool)
    .await
}

pub async fn find_all(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, email, password_hash, wallet_address, created_at
        FROM users
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
}
