use axum::{
    routing::{get, post},
    Router,
};

use crate::{handlers::auth, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .route("/auth/me", get(auth::get_me))
}
