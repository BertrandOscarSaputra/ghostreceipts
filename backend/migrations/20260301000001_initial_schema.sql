-- GhostReceipt Initial Schema Migration
-- Designed following supabase-postgres-best-practices

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    wallet_address VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    participant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agreements_creator_id ON agreements(creator_id);
CREATE INDEX IF NOT EXISTS idx_agreements_participant_id ON agreements(participant_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);

-- Agreement Versions table
CREATE TABLE IF NOT EXISTS agreement_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount BIGINT,
    deadline TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agreement_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_agreement_versions_agreement_id ON agreement_versions(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_created_by ON agreement_versions(created_by);

-- Agreement Events table (Timeline)
CREATE TABLE IF NOT EXISTS agreement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agreement_events_agreement_id ON agreement_events(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_events_actor_id ON agreement_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_agreement_events_created_at ON agreement_events(created_at);
