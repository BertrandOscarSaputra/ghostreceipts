use sqlx::PgPool;
use uuid::Uuid;

use crate::models::user::User;

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, wallet_address, created_at
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
        SELECT id, username, wallet_address, created_at
        FROM users
        WHERE LOWER(username) = LOWER($1)
        "#,
    )
    .bind(username)
    .fetch_optional(pool)
    .await
}

pub async fn create_user(
    pool: &PgPool,
    id: Uuid,
    username: &str,
    wallet_address: Option<&str>,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, username, wallet_address)
        VALUES ($1, $2, $3)
        RETURNING id, username, wallet_address, created_at
        "#,
    )
    .bind(id)
    .bind(username)
    .bind(wallet_address)
    .fetch_one(pool)
    .await
}

pub async fn find_all(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, username, wallet_address, created_at
        FROM users
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
}
