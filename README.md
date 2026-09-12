# 👻 GhostReceipt

> A lightweight digital agreement system for informal work.

GhostReceipt models informal two-party agreements as a controlled, deterministic state machine. Agreement terms cannot silently replace an active version, and important transitions require approval from the counterpart.

---

## 🏗️ Monorepo Architecture

```text
ghostreceipt/
├── backend/            # Rust + Axum + SQLx + Tokio + PostgreSQL REST API
├── frontend/           # Next.js 15 + TypeScript + Tailwind CSS + viem
├── contracts/          # Solidity smart contracts (Foundry)
├── docs/               # Implementation guide & architecture documentation
├── docker-compose.yml  # Local PostgreSQL container service
└── README.md
```

## 🚀 Quick Start

### 1. Prerequisites
- Rust 1.80+ (`cargo`)
- Node.js 20+ (`npm`)
- PostgreSQL 16+ or Docker

### 2. Database Setup
Start PostgreSQL via Docker:
```bash
docker compose up -d
```
Or use a local PostgreSQL instance and set `DATABASE_URL` in `.env`.

### 3. Backend (Rust)
```bash
cd backend
cp .env.example .env
cargo test     # Run state machine & diff unit tests
cargo run      # Starts Axum server at http://localhost:8080
```

### 4. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev    # Starts Next.js app at http://localhost:3000
```

---

## 📜 Agreement State Lifecycle

```text
       PENDING
       │     │
Accept │     │ Reject
       ▼     ▼
     ACTIVE  REJECTED
     │    │
     │    └── Request Completion ──► COMPLETION_PENDING ──► COMPLETED
     │
     └── Propose Revision ──► REVISION_PENDING ──► [Accept/Reject]
```
