use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{
    agreement::{Agreement, AgreementEvent, AgreementVersion},
    agreement_status::AgreementStatus,
};

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Agreement>, sqlx::Error> {
    sqlx::query_as::<_, Agreement>(
        r#"
        SELECT id, creator_id, participant_id, status, current_version, created_at, updated_at
        FROM agreements
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn find_version(
    pool: &PgPool,
    agreement_id: Uuid,
    version_number: i32,
) -> Result<Option<AgreementVersion>, sqlx::Error> {
    sqlx::query_as::<_, AgreementVersion>(
        r#"
        SELECT id, agreement_id, version_number, title, description, amount, deadline, created_by, created_at
        FROM agreement_versions
        WHERE agreement_id = $1 AND version_number = $2
        "#,
    )
    .bind(agreement_id)
    .bind(version_number)
    .fetch_optional(pool)
    .await
}

pub async fn find_all_versions(
    pool: &PgPool,
    agreement_id: Uuid,
) -> Result<Vec<AgreementVersion>, sqlx::Error> {
    sqlx::query_as::<_, AgreementVersion>(
        r#"
        SELECT id, agreement_id, version_number, title, description, amount, deadline, created_by, created_at
        FROM agreement_versions
        WHERE agreement_id = $1
        ORDER BY version_number ASC
        "#,
    )
    .bind(agreement_id)
    .fetch_all(pool)
    .await
}

pub async fn find_all_events(
    pool: &PgPool,
    agreement_id: Uuid,
) -> Result<Vec<AgreementEvent>, sqlx::Error> {
    sqlx::query_as::<_, AgreementEvent>(
        r#"
        SELECT id, agreement_id, actor_id, event_type, metadata, created_at
        FROM agreement_events
        WHERE agreement_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(agreement_id)
    .fetch_all(pool)
    .await
}

pub async fn create_agreement_with_version(
    pool: &PgPool,
    agreement_id: Uuid,
    creator_id: Uuid,
    participant_id: Uuid,
    title: &str,
    description: Option<&str>,
    amount: Option<i64>,
    deadline: Option<chrono::DateTime<chrono::Utc>>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"
        INSERT INTO agreements (id, creator_id, participant_id, status, current_version)
        VALUES ($1, $2, $3, $4, 1)
        "#,
    )
    .bind(agreement_id)
    .bind(creator_id)
    .bind(participant_id)
    .bind(AgreementStatus::Pending.as_str())
    .execute(&mut *tx)
    .await?;

    let version_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO agreement_versions (id, agreement_id, version_number, title, description, amount, deadline, created_by)
        VALUES ($1, $2, 1, $3, $4, $5, $6, $7)
        "#,
    )
    .bind(version_id)
    .bind(agreement_id)
    .bind(title)
    .bind(description)
    .bind(amount)
    .bind(deadline)
    .bind(creator_id)
    .execute(&mut *tx)
    .await?;

    let event_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO agreement_events (id, agreement_id, actor_id, event_type, metadata)
        VALUES ($1, $2, $3, 'AGREEMENT_CREATED', NULL)
        "#,
    )
    .bind(event_id)
    .bind(agreement_id)
    .bind(creator_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn update_status(
    pool: &PgPool,
    agreement_id: Uuid,
    status: AgreementStatus,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE agreements
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(status.as_str())
    .bind(agreement_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn create_revision_version(
    pool: &PgPool,
    agreement_id: Uuid,
    new_version_number: i32,
    title: &str,
    description: Option<&str>,
    amount: Option<i64>,
    deadline: Option<chrono::DateTime<chrono::Utc>>,
    actor_id: Uuid,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    let version_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO agreement_versions (id, agreement_id, version_number, title, description, amount, deadline, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
    )
    .bind(version_id)
    .bind(agreement_id)
    .bind(new_version_number)
    .bind(title)
    .bind(description)
    .bind(amount)
    .bind(deadline)
    .bind(actor_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        UPDATE agreements
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(AgreementStatus::RevisionPending.as_str())
    .bind(agreement_id)
    .execute(&mut *tx)
    .await?;

    let event_id = Uuid::new_v4();
    let meta = serde_json::json!({ "version": new_version_number });
    sqlx::query(
        r#"
        INSERT INTO agreement_events (id, agreement_id, actor_id, event_type, metadata)
        VALUES ($1, $2, $3, 'REVISION_PROPOSED', $4)
        "#,
    )
    .bind(event_id)
    .bind(agreement_id)
    .bind(actor_id)
    .bind(meta)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn accept_revision_version(
    pool: &PgPool,
    agreement_id: Uuid,
    new_version_number: i32,
    actor_id: Uuid,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"
        UPDATE agreements
        SET status = $1, current_version = $2, updated_at = NOW()
        WHERE id = $3
        "#,
    )
    .bind(AgreementStatus::Active.as_str())
    .bind(new_version_number)
    .bind(agreement_id)
    .execute(&mut *tx)
    .await?;

    let event_id = Uuid::new_v4();
    let meta = serde_json::json!({ "version": new_version_number });
    sqlx::query(
        r#"
        INSERT INTO agreement_events (id, agreement_id, actor_id, event_type, metadata)
        VALUES ($1, $2, $3, 'REVISION_ACCEPTED', $4)
        "#,
    )
    .bind(event_id)
    .bind(agreement_id)
    .bind(actor_id)
    .bind(meta)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn create_event(
    pool: &PgPool,
    agreement_id: Uuid,
    actor_id: Uuid,
    event_type: &str,
    metadata: Option<serde_json::Value>,
) -> Result<(), sqlx::Error> {
    let event_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO agreement_events (id, agreement_id, actor_id, event_type, metadata)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(event_id)
    .bind(agreement_id)
    .bind(actor_id)
    .bind(event_type)
    .bind(metadata)
    .execute(pool)
    .await?;
    Ok(())
}
