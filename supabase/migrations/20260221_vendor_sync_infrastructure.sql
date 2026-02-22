-- Vendor Pricing Sync Infrastructure
-- Created: February 21, 2026
-- Purpose: Support automated vendor pricing sync via Supabase Edge Function

-- ============================================================================
-- Table: vendor_sync_log
-- Logs all vendor pricing sync operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('pricing', 'products', 'vendors')),
  products_synced INTEGER NOT NULL DEFAULT 0,
  products_total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed')),
  log_data JSONB,
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_sync_log_synced_at ON vendor_sync_log(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_sync_log_sync_type ON vendor_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_vendor_sync_log_status ON vendor_sync_log(status);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE vendor_sync_log IS 'Logs all automated vendor pricing sync operations';
COMMENT ON COLUMN vendor_sync_log.sync_type IS 'Type of sync: pricing, products, or vendors';
COMMENT ON COLUMN vendor_sync_log.products_synced IS 'Number of products successfully synced';
COMMENT ON COLUMN vendor_sync_log.products_total IS 'Total number of products processed';
COMMENT ON COLUMN vendor_sync_log.status IS 'Sync status: completed, partial, or failed';
COMMENT ON COLUMN vendor_sync_log.log_data IS 'Detailed sync log with per-product status';
COMMENT ON COLUMN vendor_sync_log.error_message IS 'Error message if sync failed';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE vendor_sync_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert sync logs (for Edge Function)
CREATE POLICY "Service role can insert sync logs"
  ON vendor_sync_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can view all sync logs
CREATE POLICY "Service role can view all sync logs"
  ON vendor_sync_log
  FOR SELECT
  TO service_role
  USING (true);

-- Authenticated users can view sync logs (read-only for monitoring)
CREATE POLICY "Authenticated users can view sync logs"
  ON vendor_sync_log
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT ON vendor_sync_log TO authenticated;
GRANT ALL ON vendor_sync_log TO service_role;
