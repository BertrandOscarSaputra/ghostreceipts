# 👻 GhostReceipt

## Implementation Guide — Rust Backend + Web3

## 1. Project Overview

### Project Name

**GhostReceipt**

### Tagline

> A lightweight digital agreement system for informal work.

### Problem

Many informal agreements happen through chat applications, direct messages, or verbal conversations.

Examples include:

* Student freelancers working for clients
* Designers and developers doing small projects
* Student organizations hiring photographers or vendors
* Small businesses hiring temporary workers
* Friends collaborating on paid projects

The agreement may initially be clear, but over time the terms can change.

For example:

> "The price was originally Rp500,000."

Later:

> "We added another feature, so the price should be Rp650,000."

Or:

> "The deadline was extended."

These changes are often scattered across different chat messages, making it difficult to determine:

* What is the current agreement?
* Which version did both parties accept?
* What exactly changed?
* Did both parties agree to the revision?

---

## 2. Solution

GhostReceipt is a web application that allows two parties to:

1. Create an informal agreement
2. Invite another party
3. Accept or reject the agreement
4. Propose revisions
5. Compare agreement versions
6. Require mutual acceptance for important changes
7. Confirm agreement completion
8. Maintain a shared agreement state using blockchain

The main idea is:

> An agreement should not silently change after it has been accepted.

---

# 3. Core User Flow

```text
USER A
   │
   ▼
Creates Agreement
   │
   ▼
USER B Receives Invitation
   │
   ├── Reject
   │
   └── Accept
          │
          ▼
     AGREEMENT ACTIVE
          │
          ▼
     Revision Proposed
          │
          ▼
   REVISION PENDING
          │
          ▼
     Other Party Reviews
          │
     ┌────┴────┐
     │         │
 Reject      Accept
     │         │
     ▼         ▼
Previous    New Version
Version       Active
Remains
          │
          ▼
Completion Requested
          │
          ▼
Both Parties Confirm
          │
          ▼
👻 AGREEMENT COMPLETED
```

---

# 4. Technology Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* viem

## Backend

* Rust
* Axum
* Tokio
* SQLx
* PostgreSQL
* Serde

## Blockchain

* Solidity
* Foundry
* Ethereum-compatible testnet

## Optional Rust Web3 Integration

* Alloy

---

# 5. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Next.js        │
                         │                     │
                         │ Agreement UI        │
                         │ Revision Diff       │
                         │ Agreement Timeline  │
                         └──────────┬──────────┘
                                    │
                                    │ REST API
                                    ▼
                         ┌─────────────────────┐
                         │    Rust + Axum      │
                         │                     │
                         │ API Layer           │
                         │ Agreement Logic     │
                         │ State Machine       │
                         │ Revision Engine     │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼                                   ▼
       ┌─────────────────────┐             ┌─────────────────────┐
       │     PostgreSQL      │             │ Blockchain Service  │
       │                     │             │                     │
       │ Agreements          │             │ Contract Calls      │
       │ Versions            │             │ Event Sync          │
       │ Events              │             │ Transaction Status  │
       └─────────────────────┘             └──────────┬──────────┘
                                                       │
                                                       ▼
                                             ┌───────────────────┐
                                             │ Smart Contract    │
                                             │                   │
                                             │ Agreement State   │
                                             │ Mutual Approval   │
                                             └───────────────────┘
```

---

# 6. Monorepo Structure

```text
ghostreceipt/
│
├── frontend/
│   └── Next.js application
│
├── backend/
│   └── Rust + Axum application
│
├── contracts/
│   └── Solidity smart contracts
│
├── docker-compose.yml
│
└── README.md
```

---

# 7. Rust Backend Structure

```text
backend/
│
├── Cargo.toml
│
├── src/
│   │
│   ├── main.rs
│   │
│   ├── config/
│   │   └── mod.rs
│   │
│   ├── routes/
│   │   ├── mod.rs
│   │   └── agreements.rs
│   │
│   ├── handlers/
│   │   └── agreements.rs
│   │
│   ├── services/
│   │   ├── agreement_service.rs
│   │   ├── revision_service.rs
│   │   └── blockchain_service.rs
│   │
│   ├── models/
│   │   ├── agreement.rs
│   │   ├── agreement_status.rs
│   │   ├── revision.rs
│   │   └── user.rs
│   │
│   ├── repositories/
│   │   └── agreement_repository.rs
│   │
│   ├── errors/
│   │   └── mod.rs
│   │
│   └── state.rs
│
└── migrations/
```

The main principle is:

```text
Routes
   ↓
Handlers
   ↓
Services
   ↓
Repositories
   ↓
Database
```

Business logic should remain inside the service layer rather than inside HTTP handlers.

---

# 8. Create the Rust Backend

Create the project:

```bash
cargo new backend
cd backend
```

---

# 9. Cargo.toml Dependencies

A starting point:

```toml
[dependencies]
axum = "0.8"

tokio = { version = "1", features = ["full"] }

serde = { version = "1", features = ["derive"] }
serde_json = "1"

sqlx = {
    version = "0.8",
    features = [
        "runtime-tokio-rustls",
        "postgres",
        "uuid",
        "chrono",
        "migrate"
    ]
}

uuid = { version = "1", features = ["v4", "serde"] }

chrono = {
    version = "0.4",
    features = ["serde"]
}

tower-http = {
    version = "0.6",
    features = ["cors", "trace"]
}

thiserror = "2"

dotenvy = "0.15"
```

Blockchain dependencies can be added after the core application is working.

---

# 10. The Core Concept: Agreement State Machine

The most important part of GhostReceipt is the agreement lifecycle.

```text
PENDING
   │
   ├── Accept
   │       │
   │       ▼
   │     ACTIVE
   │
   └── Reject
           │
           ▼
        REJECTED
```

Once active:

```text
ACTIVE
   │
   ├── Propose Revision
   │        │
   │        ▼
   │ REVISION_PENDING
   │
   └── Request Completion
            │
            ▼
     COMPLETION_PENDING
```

The full lifecycle:

```text
PENDING
   │
   ▼
ACTIVE
   │
   ├───────────────┐
   │               │
   ▼               ▼
REVISION       COMPLETION
PENDING         PENDING
   │               │
   ▼               ▼
ACTIVE         COMPLETED
```

---

# 11. Agreement Status in Rust

```rust
use serde::{Deserialize, Serialize};

#[derive(
    Debug,
    Clone,
    Serialize,
    Deserialize,
    PartialEq
)]
pub enum AgreementStatus {
    Pending,
    Active,
    RevisionPending,
    CompletionPending,
    Completed,
    Rejected,
    Cancelled,
}
```

---

# 12. Define Agreement Actions

```rust
#[derive(Debug)]
pub enum AgreementAction {
    Accept,
    Reject,
    ProposeRevision,
    AcceptRevision,
    RejectRevision,
    RequestCompletion,
    ConfirmCompletion,
    Cancel,
}
```

---

# 13. Validate State Transitions

Each state should only allow certain actions.

```rust
impl AgreementStatus {
    pub fn can_perform(
        &self,
        action: &AgreementAction
    ) -> bool {
        matches!(
            (self, action),

            (
                AgreementStatus::Pending,
                AgreementAction::Accept
            )

            | (
                AgreementStatus::Pending,
                AgreementAction::Reject
            )

            | (
                AgreementStatus::Active,
                AgreementAction::ProposeRevision
            )

            | (
                AgreementStatus::Active,
                AgreementAction::RequestCompletion
            )

            | (
                AgreementStatus::RevisionPending,
                AgreementAction::AcceptRevision
            )

            | (
                AgreementStatus::RevisionPending,
                AgreementAction::RejectRevision
            )

            | (
                AgreementStatus::CompletionPending,
                AgreementAction::ConfirmCompletion
            )
        )
    }
}
```

This prevents invalid actions.

Example:

```text
Current Status:
COMPLETED

Action:
Propose Revision

Result:
❌ Invalid State Transition
```

This is one of the main reasons Rust is a good fit for GhostReceipt.

---

# 14. Database Design

GhostReceipt can start with four main tables.

---

## Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,

    username VARCHAR(100)
        UNIQUE NOT NULL,

    wallet_address VARCHAR(255)
        UNIQUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);
```

---

## Agreements

```sql
CREATE TABLE agreements (
    id UUID PRIMARY KEY,

    creator_id UUID NOT NULL
        REFERENCES users(id),

    participant_id UUID NOT NULL
        REFERENCES users(id),

    status VARCHAR(50)
        NOT NULL,

    current_version INTEGER
        NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);
```

The agreement table contains the current agreement state.

---

## Agreement Versions

```sql
CREATE TABLE agreement_versions (
    id UUID PRIMARY KEY,

    agreement_id UUID NOT NULL
        REFERENCES agreements(id)
        ON DELETE CASCADE,

    version_number INTEGER NOT NULL,

    title TEXT NOT NULL,

    description TEXT,

    amount BIGINT,

    deadline TIMESTAMPTZ,

    created_by UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    UNIQUE (
        agreement_id,
        version_number
    )
);
```

Important principle:

> Never overwrite an accepted agreement version.

Every change creates a new version.

```text
Agreement #123

Version 1
├── Amount: Rp500,000
└── Deadline: September 20

Version 2
├── Amount: Rp650,000
└── Deadline: September 25
```

---

## Agreement Events

```sql
CREATE TABLE agreement_events (
    id UUID PRIMARY KEY,

    agreement_id UUID NOT NULL
        REFERENCES agreements(id)
        ON DELETE CASCADE,

    actor_id UUID NOT NULL
        REFERENCES users(id),

    event_type VARCHAR(100)
        NOT NULL,

    metadata JSONB,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);
```

Example events:

```text
AGREEMENT_CREATED

PARTICIPANT_ACCEPTED

PARTICIPANT_REJECTED

REVISION_PROPOSED

REVISION_ACCEPTED

REVISION_REJECTED

COMPLETION_REQUESTED

COMPLETION_CONFIRMED
```

These events can be displayed as a timeline.

---

# 15. Rust Agreement Model

```rust
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::models::agreement_status::AgreementStatus;

pub struct Agreement {
    pub id: Uuid,

    pub creator_id: Uuid,

    pub participant_id: Uuid,

    pub status: AgreementStatus,

    pub current_version: i32,

    pub created_at: DateTime<Utc>,

    pub updated_at: DateTime<Utc>,
}
```

---

# 16. API Design

Keep the API simple and predictable.

## Create Agreement

```text
POST /agreements
```

Request:

```json
{
  "participant_id": "uuid",
  "title": "Website Design",
  "description": "Landing page for coffee shop",
  "amount": 500000,
  "deadline": "2026-09-20T00:00:00Z"
}
```

---

## Get Agreement

```text
GET /agreements/:id
```

---

## Accept Agreement

```text
POST /agreements/:id/accept
```

---

## Reject Agreement

```text
POST /agreements/:id/reject
```

---

## Propose Revision

```text
POST /agreements/:id/revisions
```

Example:

```json
{
  "title": "Website Design",
  "description": "Landing page with mobile optimization",
  "amount": 650000,
  "deadline": "2026-09-25T00:00:00Z"
}
```

---

## Accept Revision

```text
POST /agreements/:id/revisions/:version/accept
```

---

## Reject Revision

```text
POST /agreements/:id/revisions/:version/reject
```

---

## Request Completion

```text
POST /agreements/:id/completion
```

---

## Confirm Completion

```text
POST /agreements/:id/completion/confirm
```

---

# 17. Application State

Create:

```text
src/state.rs
```

```rust
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}
```

---

# 18. Axum Application Setup

Example `main.rs`:

```rust
use axum::Router;
use sqlx::postgres::PgPoolOptions;

mod routes;
mod state;

use state::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url =
        std::env::var("DATABASE_URL")
            .expect("DATABASE_URL missing");

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Database connection failed");

    let state = AppState {
        db,
    };

    let app = Router::new()
        .merge(routes::agreements::router())
        .with_state(state);

    let listener =
        tokio::net::TcpListener::bind(
            "0.0.0.0:8080"
        )
        .await
        .unwrap();

    println!(
        "GhostReceipt backend running on port 8080"
    );

    axum::serve(listener, app)
        .await
        .unwrap();
}
```

---

# 19. Keep HTTP Handlers Thin

Example:

```rust
pub async fn create_agreement(
    State(state): State<AppState>,
    Json(payload): Json<CreateAgreementRequest>,
) -> Result<
    Json<AgreementResponse>,
    AppError
> {
    let agreement =
        agreement_service::create(
            &state.db,
            payload
        )
        .await?;

    Ok(Json(agreement))
}
```

The handler should not contain complex business logic.

The flow should be:

```text
HTTP Request
     │
     ▼
Handler
     │
     ▼
Agreement Service
     │
     ├── Validate Input
     │
     ├── Validate State
     │
     ├── Create Agreement
     │
     ├── Create Version
     │
     └── Create Event
            │
            ▼
        PostgreSQL
```

---

# 20. Implement Agreement Creation

When an agreement is created:

```text
Create Agreement Request
        │
        ▼
Create Agreement
Status = PENDING
        │
        ▼
Create Version 1
        │
        ▼
Create AGREEMENT_CREATED Event
        │
        ▼
Return Agreement
```

The second party can then accept or reject it.

---

# 21. Implement Revision Logic

This is the most important GhostReceipt feature.

Current agreement:

```text
VERSION 1

Amount:
Rp500,000

Deadline:
September 20

Scope:
Landing Page
```

One party proposes:

```text
VERSION 2

Amount:
Rp650,000

Deadline:
September 25

Scope:
Landing Page + Mobile Optimization
```

Backend flow:

```text
ACTIVE AGREEMENT
       │
       ▼
User Proposes Revision
       │
       ▼
Create New Version
       │
       ▼
Status = REVISION_PENDING
       │
       ▼
Other User Reviews Revision
```

---

## Example Revision Service

```rust
pub async fn propose_revision(
    db: &PgPool,
    agreement_id: Uuid,
    actor_id: Uuid,
    request: RevisionRequest,
) -> Result<(), AppError> {

    let agreement =
        repository::find_by_id(
            db,
            agreement_id
        )
        .await?;

    if agreement.status
        != AgreementStatus::Active
    {
        return Err(
            AppError::InvalidState
        );
    }

    let is_participant =
        actor_id == agreement.creator_id
        ||
        actor_id == agreement.participant_id;

    if !is_participant {
        return Err(
            AppError::Unauthorized
        );
    }

    repository::create_next_version(
        db,
        agreement_id,
        request
    )
    .await?;

    repository::update_status(
        db,
        agreement_id,
        AgreementStatus::RevisionPending
    )
    .await?;

    repository::create_event(
        db,
        agreement_id,
        actor_id,
        "REVISION_PROPOSED"
    )
    .await?;

    Ok(())
}
```

---

# 22. Build the "What Changed?" Feature

This should be one of the main features shown in the demo.

Version 1:

```text
Amount: Rp500,000

Deadline:
September 20

Scope:
Landing Page
```

Version 2:

```text
Amount: Rp650,000

Deadline:
September 25

Scope:
Landing Page + Mobile Optimization
```

API response:

```json
{
  "amount": {
    "old": 500000,
    "new": 650000
  },
  "deadline": {
    "old": "2026-09-20",
    "new": "2026-09-25"
  },
  "description": {
    "old": "Landing Page",
    "new": "Landing Page + Mobile Optimization"
  }
}
```

The frontend can display:

```text
WHAT CHANGED?

💰 Amount

Rp500,000
    ↓
Rp650,000


📅 Deadline

September 20
    ↓
September 25


📝 Scope

Landing Page
    ↓
Landing Page + Mobile Optimization
```

Use deterministic comparison logic rather than AI.

This makes the result:

* Predictable
* Easier to test
* Easier to explain

---

# 23. Blockchain Integration Strategy

Do not start with blockchain.

Build in this order.

## Phase 1

```text
Rust Backend
+
PostgreSQL
+
Agreement State Machine
+
Version History
+
Revision System
```

Make sure this works first.

---

## Phase 2

Add:

```text
Smart Contract
+
Blockchain Transactions
+
Event Synchronization
```

---

# 24. Smart Contract Responsibilities

The smart contract should remain intentionally small.

Do not store:

* Full service descriptions
* Private information
* Detailed agreement text

The smart contract should primarily manage:

```text
Agreement ID

Party A

Party B

Current Version

Agreement Status
```

---

# 25. Smart Contract State

Example:

```solidity
enum Status {
    Pending,
    Active,
    RevisionPending,
    CompletionPending,
    Completed
}
```

Functions:

```text
createAgreement()

acceptAgreement()

rejectAgreement()

proposeRevision()

acceptRevision()

rejectRevision()

requestCompletion()

confirmCompletion()
```

The blockchain should manage the shared state.

---

# 26. Why PostgreSQL and Blockchain?

This is an important question that judges may ask.

## PostgreSQL

Stores detailed application data:

```text
Service description

Amount

Deadline

Revision details

Private metadata

Agreement timeline
```

## Blockchain

Manages shared state:

```text
Agreement participants

Current agreement state

Current version

Mutual approvals

Important state transitions
```

The architecture principle is:

> PostgreSQL stores detailed private application data, while blockchain acts as a neutral shared state machine for actions that require mutual approval and should not be unilaterally changed.

---

# 27. Smart Contract and Backend Relationship

```text
                 Rust Backend
                      │
                      │
                      ▼
              Agreement Service
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
      PostgreSQL            Smart Contract
           │                     │
           │                     │
           ▼                     ▼
    Agreement Details      Shared State
    Version Details        Mutual Approval
    Private Data           State Changes
```

---

# 28. MVP Development Plan

## Day 1 — Rust Foundation

```text
✓ Setup Axum

✓ Setup PostgreSQL

✓ Setup SQLx

✓ Create migrations

✓ Create agreement

✓ Get agreement
```

---

## Day 2 — Core Agreement Logic

```text
✓ Agreement acceptance

✓ Agreement rejection

✓ State machine

✓ Agreement events

✓ Timeline
```

---

## Day 3 — Revision System

```text
✓ Create new agreement version

✓ Revision pending state

✓ Accept revision

✓ Reject revision

✓ What Changed comparison
```

---

## Day 4 — Blockchain

```text
✓ Create Solidity contract

✓ Deploy locally

✓ Connect agreement states

✓ Test smart contract

✓ Record important transitions
```

---

## Day 5 — Frontend and Polish

```text
✓ Agreement dashboard

✓ Agreement detail page

✓ What Changed UI

✓ Agreement timeline

✓ Error handling

✓ Demo preparation

✓ README
```

---

# 29. Recommended MVP Features

## Must Have

```text
✓ Create Agreement

✓ Invite Second Party

✓ Accept Agreement

✓ Reject Agreement

✓ Agreement Status

✓ Propose Revision

✓ Version History

✓ What Changed

✓ Accept Revision

✓ Reject Revision

✓ Completion Confirmation
```

## Nice to Have

```text
○ AI Agreement Extraction

○ Notifications

○ Agreement Templates

○ PDF Export

○ Escrow Payments

○ Dispute Resolution
```

Avoid adding these until the MVP works.

---

# 30. Optional AI Feature

AI can be used to transform natural language into structured agreement fields.

Example input:

> "I'll build a website for your coffee shop for 2 million rupiah. You need to provide the content before September 15, and I'll deliver the website by September 30."

AI extracts:

```text
Service:
Website Development

Amount:
Rp2,000,000

Client Responsibility:
Provide content before September 15

Developer Deadline:
September 30
```

The user must review and confirm everything before the agreement is created.

AI should assist users, not control agreement logic.

---

# 31. Demo Scenario

Use a realistic example.

## Step 1

A freelance developer creates an agreement:

```text
Service:
Website Design

Amount:
Rp500,000

Deadline:
September 20
```

---

## Step 2

The client accepts.

```text
STATUS

● ACTIVE
```

---

## Step 3

The client requests additional features.

The developer proposes a revision.

```text
Amount:

Rp500,000
    ↓
Rp650,000


Deadline:

September 20
    ↓
September 25
```

---

## Step 4

The client sees:

```text
WHAT CHANGED?

💰 Price Increased

📅 Deadline Extended

📝 Scope Updated
```

The client accepts.

```text
VERSION 2 ACTIVE
```

---

## Step 5

The developer requests completion.

The client confirms.

```text
👻 GHOST RECEIPT COMPLETED
```

---

# 32. Main Technical Story

The strongest technical explanation of GhostReceipt is not:

> "We used blockchain."

Instead:

> "We modeled an informal two-party agreement as a controlled state machine. Agreement terms cannot silently replace an active version, and important transitions require approval from the appropriate party."

Blockchain then becomes the shared coordination layer:

> "The smart contract acts as a neutral coordinator for the shared agreement state."

---

# 33. Final Project Scope

The final architecture should focus on:

```text
Niche Problem
      +
Rust Backend
      +
Type-Safe Domain Logic
      +
Agreement State Machine
      +
Version History
      +
Mutual Revision Approval
      +
Blockchain Shared State
```

---

# 34. Final Recommendation

Prioritize the application logic before adding advanced Web3 features.

The ideal development order is:

```text
1. Database

        ↓

2. Rust Domain Model

        ↓

3. Agreement State Machine

        ↓

4. REST API

        ↓

5. Revision System

        ↓

6. What Changed

        ↓

7. Smart Contract

        ↓

8. Frontend Polish
```

The strongest part of GhostReceipt is the combination of:

> **A real niche problem + Rust backend learning + controlled state transitions + versioned agreements + mutual approval + blockchain coordination.**

Do not make the project complicated by adding too many technologies. A small application with a reliable agreement workflow and a clearly justified blockchain component will be significantly stronger for the hackathon than a large application with many unfinished features.
