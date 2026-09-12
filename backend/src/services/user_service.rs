use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::user::{AuthResponse, Claims, CreateUserRequest, LoginRequest, RegisterRequest, User},
    repositories::user_repository,
};

const JWT_SECRET: &str = "ghostreceipt_jwt_secret_key_2026_sepolia";

pub fn get_jwt_secret() -> Vec<u8> {
    std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| JWT_SECRET.to_string())
        .into_bytes()
}

pub fn generate_token(user: &User) -> Result<String, AppError> {
    let now = Utc::now().timestamp() as usize;
    let exp = now + (7 * 24 * 60 * 60); // 7 days

    let claims = Claims {
        sub: user.id.to_string(),
        username: user.username.clone(),
        exp,
        iat: now,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&get_jwt_secret()),
    )
    .map_err(|e| AppError::Internal(format!("Failed to generate auth token: {}", e)))
}

pub fn verify_token_claims(token: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(&get_jwt_secret()),
        &Validation::default(),
    )
    .map_err(|_| AppError::Unauthorized("Invalid or expired session token".to_string()))?;

    Ok(token_data.claims)
}

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
        payload.email.as_deref(),
        None,
        payload.wallet_address.as_deref(),
    )
    .await?;

    Ok(user)
}

pub async fn register_user(pool: &PgPool, payload: RegisterRequest) -> Result<AuthResponse, AppError> {
    let username = payload.username.trim();
    if username.len() < 3 {
        return Err(AppError::BadRequest(
            "Username must be at least 3 characters long".to_string(),
        ));
    }

    if payload.password.len() < 6 {
        return Err(AppError::BadRequest(
            "Password must be at least 6 characters long".to_string(),
        ));
    }

    if user_repository::find_by_username(pool, username).await?.is_some() {
        return Err(AppError::BadRequest(format!(
            "Username '{}' is already registered",
            username
        )));
    }

    if let Some(ref email) = payload.email {
        let clean_email = email.trim();
        if !clean_email.is_empty() && user_repository::find_by_email(pool, clean_email).await?.is_some() {
            return Err(AppError::BadRequest(format!(
                "Email '{}' is already registered",
                clean_email
            )));
        }
    }

    let password_hash = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?;

    let id = Uuid::new_v4();
    let email_ref = payload.email.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    
    let user = user_repository::create_user(
        pool,
        id,
        username,
        email_ref,
        Some(&password_hash),
        payload.wallet_address.as_deref(),
    )
    .await?;

    let token = generate_token(&user)?;

    Ok(AuthResponse { user, token })
}

pub async fn login_user(pool: &PgPool, payload: LoginRequest) -> Result<AuthResponse, AppError> {
    let identifier = payload.identifier.trim();
    if identifier.is_empty() {
        return Err(AppError::BadRequest("Username or email is required".to_string()));
    }

    let user = user_repository::find_by_identifier(pool, identifier)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid username/email or password".to_string()))?;

    let password_valid = match &user.password_hash {
        Some(hash) => bcrypt::verify(&payload.password, hash).unwrap_or(false),
        None => {
            // Legacy / demo accounts created without password: allow login with "password123"
            payload.password == "password123" || payload.password == user.username
        }
    };

    if !password_valid {
        return Err(AppError::Unauthorized("Invalid username/email or password".to_string()));
    }

    let token = generate_token(&user)?;

    Ok(AuthResponse { user, token })
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_generation_and_verification() {
        let user = User {
            id: Uuid::new_v4(),
            username: "alice_tester".to_string(),
            email: Some("alice@test.com".to_string()),
            password_hash: None,
            wallet_address: None,
            created_at: Utc::now(),
        };

        let token = generate_token(&user).expect("Should generate token");
        assert!(!token.is_empty());

        let claims = verify_token_claims(&token).expect("Should verify claims");
        assert_eq!(claims.sub, user.id.to_string());
        assert_eq!(claims.username, user.username);
    }

    #[test]
    fn test_password_hashing() {
        let password = "my_secure_password_123";
        let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).expect("Should hash");
        assert!(bcrypt::verify(password, &hash).expect("Should verify"));
        assert!(!bcrypt::verify("wrong_password", &hash).expect("Should fail wrong password"));
    }
}
