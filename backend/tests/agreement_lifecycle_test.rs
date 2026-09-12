use backend::{
    models::{
        agreement::{AgreementActionRequest, CreateAgreementRequest},
        revision::{PriceTrend, ProposeRevisionRequest},
        user::CreateUserRequest,
    },
    services::{agreement_service, user_service},
};
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

#[tokio::test]
async fn test_full_agreement_lifecycle_and_revision() {
    dotenvy::dotenv().ok();
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:Hazard123!@localhost:5432/ghostreceipt".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to test database");

    // 1. Create Users (Alice = Freelancer, Bob = Client)
    let unique_suffix = Uuid::new_v4().to_string()[..8].to_string();
    let alice = user_service::create_user(
        &pool,
        CreateUserRequest {
            username: format!("alice_{}", unique_suffix),
            wallet_address: Some(format!("0xAlice{}", unique_suffix)),
        },
    )
    .await
    .expect("Failed to create Alice");

    let bob = user_service::create_user(
        &pool,
        CreateUserRequest {
            username: format!("bob_{}", unique_suffix),
            wallet_address: Some(format!("0xBob{}", unique_suffix)),
        },
    )
    .await
    .expect("Failed to create Bob");

    // 2. Alice creates an agreement with Bob (Rp 500,000, Status: Pending, Version: 1)
    let agreement_detail = agreement_service::create(
        &pool,
        CreateAgreementRequest {
            creator_id: alice.id,
            participant_id: bob.id,
            title: "Website Design".to_string(),
            description: Some("Landing page for coffee shop".to_string()),
            amount: Some(500_000),
            deadline: None,
        },
    )
    .await
    .expect("Failed to create agreement");

    let agreement_id = agreement_detail.agreement.id;
    assert_eq!(agreement_detail.agreement.status, "Pending");
    assert_eq!(agreement_detail.agreement.current_version, 1);
    assert_eq!(agreement_detail.current_version_detail.title, "Website Design");
    assert_eq!(agreement_detail.current_version_detail.amount, Some(500_000));
    assert_eq!(agreement_detail.events.len(), 1);
    assert_eq!(agreement_detail.events[0].event_type, "AGREEMENT_CREATED");

    // 3. Bob accepts the agreement -> transitions to Active
    let accepted = agreement_service::accept(
        &pool,
        agreement_id,
        AgreementActionRequest { actor_id: bob.id },
    )
    .await
    .expect("Bob should accept agreement");

    assert_eq!(accepted.agreement.status, "Active");
    assert_eq!(accepted.events.len(), 2);
    assert_eq!(accepted.events[1].event_type, "PARTICIPANT_ACCEPTED");

    // 4. Alice proposes revision (amount increases to 650,000)
    let revised = agreement_service::propose_revision(
        &pool,
        agreement_id,
        ProposeRevisionRequest {
            actor_id: alice.id,
            title: "Website Design + Mobile Optimization".to_string(),
            description: Some("Landing page with mobile optimization".to_string()),
            amount: Some(650_000),
            deadline: None,
        },
    )
    .await
    .expect("Alice proposes revision");

    assert_eq!(revised.agreement.status, "RevisionPending");
    assert_eq!(revised.agreement.current_version, 1); // Current accepted version remains 1!
    assert_eq!(revised.versions.len(), 2); // Version 2 now exists in append-only history
    assert_eq!(revised.events.len(), 3);
    assert_eq!(revised.events[2].event_type, "REVISION_PROPOSED");

    // 5. Deterministic "What Changed?" Diff Engine
    let diff = agreement_service::get_diff(&pool, agreement_id, Some(1), Some(2))
        .await
        .expect("Failed to get diff");

    assert!(diff.has_changes);
    assert_eq!(diff.from_version, 1);
    assert_eq!(diff.to_version, 2);
    assert_eq!(diff.price_trend, PriceTrend::Increased);
    let amount_diff = diff.amount.expect("Amount should differ");
    assert_eq!(amount_diff.old, Some(500_000));
    assert_eq!(amount_diff.new, Some(650_000));

    // 6. Mutual Consent Check: Alice attempts to accept her own revision -> MUST FAIL!
    let self_accept = agreement_service::accept_revision(
        &pool,
        agreement_id,
        2,
        AgreementActionRequest { actor_id: alice.id },
    )
    .await;
    assert!(self_accept.is_err(), "Proposer must NOT be able to accept own revision");

    // 7. Bob accepts the revision -> transitions back to Active on Version 2
    let accepted_revision = agreement_service::accept_revision(
        &pool,
        agreement_id,
        2,
        AgreementActionRequest { actor_id: bob.id },
    )
    .await
    .expect("Bob accepts revision");

    assert_eq!(accepted_revision.agreement.status, "Active");
    assert_eq!(accepted_revision.agreement.current_version, 2);
    assert_eq!(accepted_revision.current_version_detail.amount, Some(650_000));
    assert_eq!(accepted_revision.events.len(), 4);
    assert_eq!(accepted_revision.events[3].event_type, "REVISION_ACCEPTED");

    // 8. Alice requests completion -> transitions to CompletionPending
    let completion_requested = agreement_service::request_completion(
        &pool,
        agreement_id,
        AgreementActionRequest { actor_id: alice.id },
    )
    .await
    .expect("Alice requests completion");

    assert_eq!(completion_requested.agreement.status, "CompletionPending");
    assert_eq!(completion_requested.events.len(), 5);
    assert_eq!(completion_requested.events[4].event_type, "COMPLETION_REQUESTED");

    // 9. Bob confirms completion -> transitions to Completed
    let completed = agreement_service::confirm_completion(
        &pool,
        agreement_id,
        AgreementActionRequest { actor_id: bob.id },
    )
    .await
    .expect("Bob confirms completion");

    assert_eq!(completed.agreement.status, "Completed");
    assert_eq!(completed.events.len(), 6);
    assert_eq!(completed.events[5].event_type, "COMPLETION_CONFIRMED");

    // 10. Dashboard listing verification
    let alice_agreements = agreement_service::list(&pool, Some(alice.id))
        .await
        .expect("List for Alice");
    assert!(alice_agreements.iter().any(|a| a.id == agreement_id && a.current_version == 2));
}
