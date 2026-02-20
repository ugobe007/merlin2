/**
 * COMPARISON MODE DATABASE MIGRATION
 * Allows users to save and compare multiple quote scenarios
 * Created: Feb 20, 2026
 */

-- ============================================================================
-- TABLE: saved_scenarios
-- Stores multiple quote configurations for side-by-side comparison
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- References auth.users.id (optional: anonymous comparisons allowed)
  session_id TEXT NOT NULL,  -- Client-generated session ID for anonymous users
  scenario_name TEXT NOT NULL,
  scenario_data JSONB NOT NULL,  -- Full wizard state snapshot
  quote_result JSONB,  -- Calculated quote result (cached)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_baseline BOOLEAN DEFAULT false,  -- First scenario = baseline
  tags TEXT[],  -- User-defined tags ['aggressive', 'conservative', etc.]
  notes TEXT,  -- User notes about this scenario
  
  -- Computed columns for quick comparison
  peak_kw NUMERIC(10, 2),
  kwh_capacity NUMERIC(10, 2),
  total_cost NUMERIC(12, 2),
  annual_savings NUMERIC(12, 2),
  payback_years NUMERIC(4, 1)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_user_id ON saved_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_session_id ON saved_scenarios(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_created_at ON saved_scenarios(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_is_baseline ON saved_scenarios(is_baseline) WHERE is_baseline = true;

-- ============================================================================
-- TABLE: comparison_sets
-- Groups scenarios into comparison sets for analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS comparison_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- References auth.users.id (optional)
  session_id TEXT NOT NULL,
  set_name TEXT NOT NULL,
  scenario_ids UUID[] NOT NULL,  -- Array of scenario IDs in this set
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_comparison_sets_user_id ON comparison_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_comparison_sets_session_id ON comparison_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_comparison_sets_created_at ON comparison_sets(created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE saved_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_sets ENABLE ROW LEVEL SECURITY;

-- saved_scenarios policies
CREATE POLICY "Users can view their own scenarios or by session_id"
  ON saved_scenarios FOR SELECT
  USING (
    auth.uid() = user_id 
    OR session_id = current_setting('app.session_id', true)
    OR user_id IS NULL
  );

CREATE POLICY "Users can create scenarios"
  ON saved_scenarios FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() IS NULL
  );

CREATE POLICY "Users can update their own scenarios"
  ON saved_scenarios FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND session_id = current_setting('app.session_id', true))
  );

CREATE POLICY "Users can delete their own scenarios"
  ON saved_scenarios FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND session_id = current_setting('app.session_id', true))
  );

-- comparison_sets policies
CREATE POLICY "Users can view their own comparison sets"
  ON comparison_sets FOR SELECT
  USING (
    auth.uid() = user_id 
    OR session_id = current_setting('app.session_id', true)
    OR user_id IS NULL
  );

CREATE POLICY "Users can create comparison sets"
  ON comparison_sets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() IS NULL
  );

CREATE POLICY "Users can update their own comparison sets"
  ON comparison_sets FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND session_id = current_setting('app.session_id', true))
  );

CREATE POLICY "Users can delete their own comparison sets"
  ON comparison_sets FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND session_id = current_setting('app.session_id', true))
  );

-- ============================================================================
-- CLEANUP FUNCTION
-- Delete old anonymous scenarios (>30 days)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_scenarios()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM saved_scenarios
  WHERE user_id IS NULL
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get scenario comparison metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_scenario_comparison(scenario_ids UUID[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  peak_kw NUMERIC,
  kwh_capacity NUMERIC,
  total_cost NUMERIC,
  annual_savings NUMERIC,
  payback_years NUMERIC,
  cost_per_kwh NUMERIC,
  savings_delta_pct NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH baseline AS (
    SELECT 
      annual_savings as baseline_savings
    FROM saved_scenarios
    WHERE id = scenario_ids[1]
    LIMIT 1
  )
  SELECT 
    s.id,
    s.scenario_name as name,
    s.peak_kw,
    s.kwh_capacity,
    s.total_cost,
    s.annual_savings,
    s.payback_years,
    CASE 
      WHEN s.kwh_capacity > 0 THEN s.total_cost / s.kwh_capacity
      ELSE 0
    END as cost_per_kwh,
    CASE 
      WHEN b.baseline_savings > 0 THEN 
        ((s.annual_savings - b.baseline_savings) / b.baseline_savings) * 100
      ELSE 0
    END as savings_delta_pct
  FROM saved_scenarios s
  CROSS JOIN baseline b
  WHERE s.id = ANY(scenario_ids)
  ORDER BY array_position(scenario_ids, s.id);
$$;

COMMENT ON FUNCTION get_scenario_comparison IS 'Returns comparison metrics for multiple scenarios';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
