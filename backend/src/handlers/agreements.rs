use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::{
        agreement::{AgreementActionRequest, CreateAgreementRequest, ListAgreementsQuery},
        revision::ProposeRevisionRequest,
    },
    services::agreement_service,
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct DiffQuery {
    pub from: Option<i32>,
    pub to: Option<i32>,
}

pub async fn get_agreement(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::get_detail(&state.db, id).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn list_agreements(
    State(state): State<AppState>,
    Query(query): Query<ListAgreementsQuery>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::list(&state.db, query.user_id).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn create_agreement(
    State(state): State<AppState>,
    Json(payload): Json<CreateAgreementRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::create(&state.db, payload).await?;
    Ok((StatusCode::CREATED, Json(result)))
}

pub async fn accept_agreement(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AgreementActionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::accept(&state.db, id, payload).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn reject_agreement(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AgreementActionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::reject(&state.db, id, payload).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn propose_revision(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ProposeRevisionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::propose_revision(&state.db, id, payload).await?;
    Ok((StatusCode::CREATED, Json(result)))
}

pub async fn accept_revision(
    State(state): State<AppState>,
    Path((id, version)): Path<(Uuid, i32)>,
    Json(payload): Json<AgreementActionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::accept_revision(&state.db, id, version, payload).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn reject_revision(
    State(state): State<AppState>,
    Path((id, version)): Path<(Uuid, i32)>,
    Json(payload): Json<AgreementActionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::reject_revision(&state.db, id, version, payload).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn request_completion(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AgreementActionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::request_completion(&state.db, id, payload).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn confirm_completion(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AgreementActionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::confirm_completion(&state.db, id, payload).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn get_diff(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(query): Query<DiffQuery>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::get_diff(&state.db, id, query.from, query.to).await?;
    Ok((StatusCode::OK, Json(result)))
}

pub async fn get_on_chain_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let result = agreement_service::get_on_chain_status(&state.db, id).await?;
    Ok((StatusCode::OK, Json(result)))
}
