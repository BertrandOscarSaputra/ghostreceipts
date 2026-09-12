use axum::{
    routing::{get, post},
    Router,
};

use crate::{handlers::users, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/users", post(users::create_user))
        .route("/users", get(users::list_users))
        .route("/users/{id}", get(users::get_user))
        .route("/users/by-username/{username}", get(users::get_user_by_username))
}
