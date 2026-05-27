-- GLAMO Nepal — RLS Fix Migration
-- Apply via: supabase db push or MCP apply_migration

-- ============================================
-- 1. Audit Logs — Enable RLS + Admin Read Policy
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read audit_logs" ON audit_logs
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- 2. Orders — Tighten read policy (admin only)
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;

CREATE POLICY "Admin can read orders" ON orders
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- 3. Order Items — Tighten read policy
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read order items" ON order_items;

CREATE POLICY "Admin can read order items" ON order_items
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- 4. Request Logs (rate-limit tracking table)
-- ============================================

CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_ip_endpoint ON request_logs(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);

ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON request_logs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
