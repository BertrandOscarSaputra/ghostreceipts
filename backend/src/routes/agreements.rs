use axum::{
    routing::{get, post},
    Router,
};

use crate::{handlers::agreements, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/agreements", post(agreements::create_agreement))
        .route("/agreements/{id}", get(agreements::get_agreement))
        .route("/agreements/{id}/accept", post(agreements::accept_agreement))
        .route("/agreements/{id}/reject", post(agreements::reject_agreement))
        .route("/agreements/{id}/revisions", post(agreements::propose_revision))
        .route(
            "/agreements/{id}/revisions/{version}/accept",
            post(agreements::accept_revision),
        )
        .route(
            "/agreements/{id}/revisions/{version}/reject",
            post(agreements::reject_revision),
        )
        .route(
            "/agreements/{id}/completion",
            post(agreements::request_completion),
        )
        .route(
            "/agreements/{id}/completion/confirm",
            post(agreements::confirm_completion),
        )
        .route("/agreements/{id}/diff", get(agreements::get_diff))
}
