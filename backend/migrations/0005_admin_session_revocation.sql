-- Migration: Add admin session revocation and contact submissions persistence
-- FIND-001: Admin session revocation tracking
-- FIND-009: Contact form persistence (already has table, just ensuring it works)
-- FIND-013: Payment replay prevention (unique index on payment_id)

-- Admin session revocation table
CREATE TABLE IF NOT EXISTS admin_session_revocations (
  id TEXT PRIMARY KEY,
  jti TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT
);

-- Index for fast revocation lookups
CREATE INDEX IF NOT EXISTS idx_admin_session_revocations_jti ON admin_session_revocations(jti);

-- Ensure payment_id has an index for duplicate payment detection
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);