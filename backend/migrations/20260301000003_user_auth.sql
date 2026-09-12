-- GhostReceipt User Authentication Migration
-- Adds email and password_hash to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
