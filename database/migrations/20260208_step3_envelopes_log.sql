-- ============================================================================
-- Step 3 Envelope Telemetry Log
-- Created: February 8, 2026 — Move 7
--
-- PURPOSE:
--   Signature-only persistence of Step 3 load profile envelopes.
--   One row per wizard run. No PII. No full quote data.
--
-- REVEALS:
--   - Which industries are estimate-heavy (low confidence)
--   - Policy code heatmap by industry (where do defaults dominate?)
--   - Regression detection before founder complaints
--   - Invariant failure trends
--
-- DOCTRINE:
--   - Signature queries only (Pillar 3)
--   - Never blocks UI (fire-and-forget insert)
--   - Append-only (no updates, no deletes in normal operation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS step3_envelopes_log (
  id              BIGSERIAL PRIMARY KEY,
  
  -- Identity
  trace_id        TEXT NOT NULL,
  session_id      TEXT,
  
  -- Attribution (nullable — service_role inserts may not have a user)
  user_id         UUID REFERENCES auth.users(id),
  
  -- Schema version (for migration safety + payload interpretation)
  schema_version  INTEGER NOT NULL DEFAULT 1,
  build_stamp     TEXT NOT NULL DEFAULT 'v7.1.0+move7',
  
  -- Industry context
  industry        TEXT NOT NULL,
  schema_key      TEXT NOT NULL,
  calculator_id   TEXT NOT NULL,
  template_key    TEXT NOT NULL,
  
  -- Load profile signature (rounded, no precision loss concerns)
  peak_kw         NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_kw          NUMERIC(10,2) NOT NULL DEFAULT 0,
  duty_cycle      NUMERIC(6,4) NOT NULL DEFAULT 0,
  energy_kwh_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  confidence      TEXT NOT NULL DEFAULT 'fallback',
  
  -- Quality signals
  invariants_all_passed BOOLEAN NOT NULL DEFAULT false,
  failed_invariant_keys TEXT[] DEFAULT '{}',
  missing_tier1_count   INTEGER NOT NULL DEFAULT 0,
  warning_count         INTEGER NOT NULL DEFAULT 0,
  
  -- Policy event summary (JSONB for flexible querying)
  policy_event_total    INTEGER NOT NULL DEFAULT 0,
  policy_event_counts   JSONB DEFAULT '{}',
  policy_event_max_severity TEXT DEFAULT 'none',
  
  -- Top contributors (JSONB array of {key, kW, share})
  top_contributors      JSONB DEFAULT '[]',
  contributor_count     INTEGER NOT NULL DEFAULT 0,
  
  -- Version stamps
  wizard_version  TEXT DEFAULT 'v7.1.0',
  
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for dashboard queries
-- ============================================================================

-- "Show me all hotel envelopes from last 7 days"
CREATE INDEX IF NOT EXISTS idx_step3_log_industry_created 
  ON step3_envelopes_log (industry, created_at DESC);

-- "Which industries have the most policy events?"
CREATE INDEX IF NOT EXISTS idx_step3_log_policy_total 
  ON step3_envelopes_log (policy_event_total DESC, industry);

-- "Find all runs with failed invariants"
CREATE INDEX IF NOT EXISTS idx_step3_log_invariants_failed 
  ON step3_envelopes_log (invariants_all_passed) 
  WHERE NOT invariants_all_passed;

-- "Heatmap: policy codes by industry" (GIN on JSONB)
CREATE INDEX IF NOT EXISTS idx_step3_log_policy_counts_gin 
  ON step3_envelopes_log USING GIN (policy_event_counts);

-- "Confidence distribution by industry"
CREATE INDEX IF NOT EXISTS idx_step3_log_confidence 
  ON step3_envelopes_log (confidence, industry);

-- "Show me all envelopes for a specific user"
CREATE INDEX IF NOT EXISTS idx_step3_log_user_id
  ON step3_envelopes_log (user_id)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE step3_envelopes_log ENABLE ROW LEVEL SECURITY;

-- NO INSERT POLICY: Inserts are server-only via service_role (bypasses RLS).
-- Client-side telemetry calls a server function / edge function that uses
-- service_role to insert. No browser client should insert directly.
-- The user_id column provides attribution without an INSERT policy.

-- Only admins can read (dashboard queries)
CREATE POLICY "step3_log_select_admin" ON step3_envelopes_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
        AND users.tier = 'ADMIN'
    )
  );

-- ============================================================================
-- Example dashboard queries (for reference)
-- ============================================================================

-- Industry confidence distribution (last 30 days):
-- SELECT industry, confidence, COUNT(*) as runs
-- FROM step3_envelopes_log
-- WHERE created_at > NOW() - INTERVAL '30 days'
-- GROUP BY industry, confidence
-- ORDER BY industry, runs DESC;

-- Policy code heatmap:
-- SELECT industry, key as policy_code, value::int as count
-- FROM step3_envelopes_log, jsonb_each(policy_event_counts)
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- ORDER BY count DESC;

-- Failed invariant trends:
-- SELECT industry, unnest(failed_invariant_keys) as failed_rule, COUNT(*)
-- FROM step3_envelopes_log
-- WHERE NOT invariants_all_passed
--   AND created_at > NOW() - INTERVAL '30 days'
-- GROUP BY industry, failed_rule
-- ORDER BY count DESC;
