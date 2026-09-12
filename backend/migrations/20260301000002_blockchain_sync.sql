-- GhostReceipt Blockchain Synchronization Migration

ALTER TABLE agreements
ADD COLUMN IF NOT EXISTS on_chain_id VARCHAR(66),
ADD COLUMN IF NOT EXISTS on_chain_tx_hash VARCHAR(66);

ALTER TABLE agreement_events
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(66);

CREATE INDEX IF NOT EXISTS idx_agreements_on_chain_id ON agreements(on_chain_id);
CREATE INDEX IF NOT EXISTS idx_agreement_events_tx_hash ON agreement_events(tx_hash);
