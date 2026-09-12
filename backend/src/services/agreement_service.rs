use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::{
        agreement::{
            AgreementActionRequest, AgreementDetailResponse, AgreementSummary,
            CreateAgreementRequest, OnChainStatusResponse,
        },
        agreement_status::{AgreementAction, AgreementStatus},
        revision::{AgreementDiff, ProposeRevisionRequest},
    },
    repositories::agreement_repository,
    services::blockchain_service,
};

pub async fn get_detail(pool: &PgPool, agreement_id: Uuid) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Agreement {} not found", agreement_id)))?;

    let current_version_detail = agreement_repository::find_version(pool, agreement_id, agreement.current_version)
        .await?
        .ok_or_else(|| AppError::Internal("Current agreement version missing".to_string()))?;

    let versions = agreement_repository::find_all_versions(pool, agreement_id).await?;
    let events = agreement_repository::find_all_events(pool, agreement_id).await?;

    Ok(AgreementDetailResponse {
        agreement,
        current_version_detail,
        versions,
        events,
    })
}

pub async fn create(
    pool: &PgPool,
    payload: CreateAgreementRequest,
) -> Result<AgreementDetailResponse, AppError> {
    if payload.title.trim().is_empty() {
        return Err(AppError::BadRequest("Agreement title is required".to_string()));
    }

    let agreement_id = Uuid::new_v4();
    let on_chain_id = blockchain_service::compute_on_chain_id(agreement_id);
    let tx_hash = blockchain_service::generate_tx_hash("AGREEMENT_CREATED", agreement_id, 1);

    agreement_repository::create_agreement_with_version(
        pool,
        agreement_id,
        payload.creator_id,
        payload.participant_id,
        &payload.title,
        payload.description.as_deref(),
        payload.amount,
        payload.deadline,
        Some(&on_chain_id),
        Some(&tx_hash),
    )
    .await?;

    get_detail(pool, agreement_id).await
}

pub async fn accept(
    pool: &PgPool,
    agreement_id: Uuid,
    req: AgreementActionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::Accept) {
        return Err(AppError::InvalidState(format!(
            "Cannot accept agreement in {:?} status",
            current_status
        )));
    }

    if req.actor_id != agreement.participant_id {
        return Err(AppError::Unauthorized(
            "Only the designated participant can accept the agreement".to_string(),
        ));
    }

    let next_status = current_status
        .next_status(&AgreementAction::Accept)
        .map_err(|e| AppError::InvalidState(e.to_string()))?;

    let tx_hash = blockchain_service::generate_tx_hash("PARTICIPANT_ACCEPTED", agreement_id, agreement.current_version);
    agreement_repository::update_status_and_tx(pool, agreement_id, next_status, Some(&tx_hash)).await?;
    agreement_repository::create_event(pool, agreement_id, req.actor_id, "PARTICIPANT_ACCEPTED", None, Some(&tx_hash)).await?;

    get_detail(pool, agreement_id).await
}

pub async fn reject(
    pool: &PgPool,
    agreement_id: Uuid,
    req: AgreementActionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::Reject) {
        return Err(AppError::InvalidState(format!(
            "Cannot reject agreement in {:?} status",
            current_status
        )));
    }

    if req.actor_id != agreement.participant_id {
        return Err(AppError::Unauthorized(
            "Only the designated participant can reject the agreement".to_string(),
        ));
    }

    let next_status = current_status
        .next_status(&AgreementAction::Reject)
        .map_err(|e| AppError::InvalidState(e.to_string()))?;

    let tx_hash = blockchain_service::generate_tx_hash("PARTICIPANT_REJECTED", agreement_id, agreement.current_version);
    agreement_repository::update_status_and_tx(pool, agreement_id, next_status, Some(&tx_hash)).await?;
    agreement_repository::create_event(pool, agreement_id, req.actor_id, "PARTICIPANT_REJECTED", None, Some(&tx_hash)).await?;

    get_detail(pool, agreement_id).await
}

pub async fn propose_revision(
    pool: &PgPool,
    agreement_id: Uuid,
    req: ProposeRevisionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::ProposeRevision) {
        return Err(AppError::InvalidState(format!(
            "Cannot propose revision in {:?} status",
            current_status
        )));
    }

    let is_participant = req.actor_id == agreement.creator_id || req.actor_id == agreement.participant_id;
    if !is_participant {
        return Err(AppError::Unauthorized(
            "Only participants can propose revisions".to_string(),
        ));
    }

    let new_version = agreement.current_version + 1;
    let tx_hash = blockchain_service::generate_tx_hash("REVISION_PROPOSED", agreement_id, new_version);

    agreement_repository::create_revision_version(
        pool,
        agreement_id,
        new_version,
        &req.title,
        req.description.as_deref(),
        req.amount,
        req.deadline,
        req.actor_id,
        Some(&tx_hash),
    )
    .await?;

    get_detail(pool, agreement_id).await
}

pub async fn accept_revision(
    pool: &PgPool,
    agreement_id: Uuid,
    version: i32,
    req: AgreementActionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::AcceptRevision) {
        return Err(AppError::InvalidState(format!(
            "Cannot accept revision in {:?} status",
            current_status
        )));
    }

    let target_version = agreement_repository::find_version(pool, agreement_id, version)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Version {} not found", version)))?;

    // Mutual consent: the proposer cannot accept their own revision
    if req.actor_id == target_version.created_by {
        return Err(AppError::BadRequest(
            "Mutual consent required: You cannot accept your own proposed revision".to_string(),
        ));
    }

    let is_participant = req.actor_id == agreement.creator_id || req.actor_id == agreement.participant_id;
    if !is_participant {
        return Err(AppError::Unauthorized("Not a party to this agreement".to_string()));
    }

    let tx_hash = blockchain_service::generate_tx_hash("REVISION_ACCEPTED", agreement_id, version);
    agreement_repository::accept_revision_version(pool, agreement_id, version, req.actor_id, Some(&tx_hash)).await?;

    get_detail(pool, agreement_id).await
}

pub async fn reject_revision(
    pool: &PgPool,
    agreement_id: Uuid,
    version: i32,
    req: AgreementActionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::RejectRevision) {
        return Err(AppError::InvalidState(format!(
            "Cannot reject revision in {:?} status",
            current_status
        )));
    }

    let target_version = agreement_repository::find_version(pool, agreement_id, version)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Version {} not found", version)))?;

    if req.actor_id == target_version.created_by {
        return Err(AppError::BadRequest(
            "Cannot reject your own proposed revision; proposal remains open or cancel it".to_string(),
        ));
    }

    let tx_hash = blockchain_service::generate_tx_hash("REVISION_REJECTED", agreement_id, version);
    agreement_repository::update_status_and_tx(pool, agreement_id, AgreementStatus::Active, Some(&tx_hash)).await?;
    let meta = serde_json::json!({ "rejected_version": version });
    agreement_repository::create_event(pool, agreement_id, req.actor_id, "REVISION_REJECTED", Some(meta), Some(&tx_hash)).await?;

    get_detail(pool, agreement_id).await
}

pub async fn request_completion(
    pool: &PgPool,
    agreement_id: Uuid,
    req: AgreementActionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::RequestCompletion) {
        return Err(AppError::InvalidState(format!(
            "Cannot request completion in {:?} status",
            current_status
        )));
    }

    let is_participant = req.actor_id == agreement.creator_id || req.actor_id == agreement.participant_id;
    if !is_participant {
        return Err(AppError::Unauthorized("Not a party to this agreement".to_string()));
    }

    let tx_hash = blockchain_service::generate_tx_hash("COMPLETION_REQUESTED", agreement_id, agreement.current_version);
    agreement_repository::update_status_and_tx(pool, agreement_id, AgreementStatus::CompletionPending, Some(&tx_hash)).await?;
    agreement_repository::create_event(pool, agreement_id, req.actor_id, "COMPLETION_REQUESTED", None, Some(&tx_hash)).await?;

    get_detail(pool, agreement_id).await
}

pub async fn confirm_completion(
    pool: &PgPool,
    agreement_id: Uuid,
    req: AgreementActionRequest,
) -> Result<AgreementDetailResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let current_status = agreement.typed_status();
    if !current_status.can_perform(&AgreementAction::ConfirmCompletion) {
        return Err(AppError::InvalidState(format!(
            "Cannot confirm completion in {:?} status",
            current_status
        )));
    }

    let is_participant = req.actor_id == agreement.creator_id || req.actor_id == agreement.participant_id;
    if !is_participant {
        return Err(AppError::Unauthorized("Not a party to this agreement".to_string()));
    }

    let tx_hash = blockchain_service::generate_tx_hash("COMPLETION_CONFIRMED", agreement_id, agreement.current_version);
    agreement_repository::update_status_and_tx(pool, agreement_id, AgreementStatus::Completed, Some(&tx_hash)).await?;
    agreement_repository::create_event(pool, agreement_id, req.actor_id, "COMPLETION_CONFIRMED", None, Some(&tx_hash)).await?;

    get_detail(pool, agreement_id).await
}

pub async fn get_diff(
    pool: &PgPool,
    agreement_id: Uuid,
    from_version: Option<i32>,
    to_version: Option<i32>,
) -> Result<AgreementDiff, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Agreement not found".to_string()))?;

    let to_v_num = to_version.unwrap_or(agreement.current_version);
    let from_v_num = from_version.unwrap_or_else(|| (to_v_num - 1).max(1));

    let from_v = agreement_repository::find_version(pool, agreement_id, from_v_num)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Version {} not found", from_v_num)))?;

    let to_v = agreement_repository::find_version(pool, agreement_id, to_v_num)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Version {} not found", to_v_num)))?;

    Ok(AgreementDiff::compute(
        from_v.version_number,
        &from_v.title,
        from_v.description.as_deref(),
        from_v.amount,
        from_v.deadline,
        to_v.version_number,
        &to_v.title,
        to_v.description.as_deref(),
        to_v.amount,
        to_v.deadline,
    ))
}

pub async fn list(pool: &PgPool, user_id: Option<Uuid>) -> Result<Vec<AgreementSummary>, AppError> {
    let list = match user_id {
        Some(uid) => agreement_repository::list_by_user(pool, uid).await?,
        None => agreement_repository::list_all(pool).await?,
    };
    Ok(list)
}

pub async fn get_on_chain_status(
    pool: &PgPool,
    agreement_id: Uuid,
) -> Result<OnChainStatusResponse, AppError> {
    let agreement = agreement_repository::find_by_id(pool, agreement_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Agreement {} not found", agreement_id)))?;

    let on_chain_id = agreement
        .on_chain_id
        .unwrap_or_else(|| blockchain_service::compute_on_chain_id(agreement_id));

    let events = agreement_repository::find_all_events(pool, agreement_id).await?;

    Ok(blockchain_service::build_on_chain_status(
        agreement_id,
        &on_chain_id,
        agreement.current_version,
        &agreement.status,
        &events,
    ))
}
