use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::agreement_status::AgreementStatus;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Agreement {
    pub id: Uuid,
    pub creator_id: Uuid,
    pub participant_id: Uuid,
    pub status: String,
    pub current_version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Agreement {
    pub fn typed_status(&self) -> AgreementStatus {
        AgreementStatus::from_str_lossy(&self.status).unwrap_or(AgreementStatus::Pending)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AgreementVersion {
    pub id: Uuid,
    pub agreement_id: Uuid,
    pub version_number: i32,
    pub title: String,
    pub description: Option<String>,
    pub amount: Option<i64>,
    pub deadline: Option<DateTime<Utc>>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AgreementEvent {
    pub id: Uuid,
    pub agreement_id: Uuid,
    pub actor_id: Uuid,
    pub event_type: String,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateAgreementRequest {
    pub creator_id: Uuid,
    pub participant_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub amount: Option<i64>,
    pub deadline: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AgreementActionRequest {
    pub actor_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgreementDetailResponse {
    pub agreement: Agreement,
    pub current_version_detail: AgreementVersion,
    pub versions: Vec<AgreementVersion>,
    pub events: Vec<AgreementEvent>,
}
