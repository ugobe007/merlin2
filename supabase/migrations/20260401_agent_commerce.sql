-- ============================================================
-- MCP Agent Commerce Tables
-- merlin3 / Supabase project: fvmpmozybmtzjvikrctq
-- Run in Supabase SQL editor or via: supabase db push
-- ============================================================

-- API keys for agent-to-agent access to TrueQuote™ engine
CREATE TABLE IF NOT EXISTS mcp_api_keys (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash         TEXT        UNIQUE NOT NULL,        -- SHA-256 of raw key (never store raw)
  key_prefix       TEXT        NOT NULL,               -- First 14 chars for display ("mk_live_ab12cd")
  owner_name       TEXT        NOT NULL,
  owner_email      TEXT        NOT NULL,
  plan             TEXT        NOT NULL DEFAULT 'free'
                   CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  monthly_quota    INTEGER     NOT NULL DEFAULT 10,    -- max calls/month per plan
  usage_this_month INTEGER     NOT NULL DEFAULT 0,
  last_reset_at    TIMESTAMPTZ NOT NULL DEFAULT now(), -- used to detect month rollover
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Stripe integration (populate when agent upgrades)
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT
);

COMMENT ON TABLE mcp_api_keys IS
  'API keys for external AI agents to call the Merlin TrueQuote MCP server';

COMMENT ON COLUMN mcp_api_keys.key_hash IS
  'SHA-256 hash of the raw key. Raw key is returned once at creation and never stored.';

-- Per-call usage log for metering + analytics
CREATE TABLE IF NOT EXISTS mcp_usage_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id      UUID        NOT NULL REFERENCES mcp_api_keys(id) ON DELETE CASCADE,
  tool_name   TEXT        NOT NULL,
  industry    TEXT,
  location    TEXT,
  response_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mcp_usage_log IS
  'Per-tool-call log for MCP API key metering and audit';

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS mcp_api_keys_key_hash_idx
  ON mcp_api_keys (key_hash);

CREATE INDEX IF NOT EXISTS mcp_usage_log_key_id_idx
  ON mcp_usage_log (key_id);

CREATE INDEX IF NOT EXISTS mcp_usage_log_created_idx
  ON mcp_usage_log (created_at DESC);

CREATE INDEX IF NOT EXISTS mcp_usage_log_tool_idx
  ON mcp_usage_log (tool_name, created_at DESC);

-- ============================================================
-- RPC: atomic usage increment (avoids race conditions)
-- ============================================================

CREATE OR REPLACE FUNCTION increment_mcp_usage(p_key_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE mcp_api_keys
  SET usage_this_month = usage_this_month + 1
  WHERE id = p_key_id;
$$;

COMMENT ON FUNCTION increment_mcp_usage IS
  'Atomically increments usage_this_month for a given API key';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE mcp_api_keys   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_usage_log  ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- Anon key (used by MCP server) needs SELECT for key validation,
-- INSERT for key creation, PATCH for reset/increment.

-- Allow all operations via anon key (server-to-server; security is
-- enforced at the application layer via key_hash lookup).
DROP POLICY IF EXISTS "mcp_keys_all" ON mcp_api_keys;
CREATE POLICY "mcp_keys_all"
  ON mcp_api_keys FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "mcp_log_all" ON mcp_usage_log;
CREATE POLICY "mcp_log_all"
  ON mcp_usage_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VIEWS (optional convenience)
-- ============================================================

CREATE OR REPLACE VIEW mcp_usage_summary AS
SELECT
  k.id,
  k.key_prefix,
  k.owner_name,
  k.owner_email,
  k.plan,
  k.monthly_quota,
  k.usage_this_month,
  k.is_active,
  k.created_at,
  COUNT(l.id) AS total_calls_all_time,
  MAX(l.created_at) AS last_call_at
FROM mcp_api_keys k
LEFT JOIN mcp_usage_log l ON l.key_id = k.id
GROUP BY k.id;

COMMENT ON VIEW mcp_usage_summary IS
  'Aggregated usage stats per API key (admin use)';
