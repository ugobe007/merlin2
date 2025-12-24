-- ═══════════════════════════════════════════════════════════════════════════════
-- CALCULATION AUDIT LOG TABLE
-- Created: December 22, 2025
-- 
-- Purpose: Track all quote calculations for SSOT compliance monitoring
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create the calculation audit log table
CREATE TABLE IF NOT EXISTS calculation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Link to quote if saved
  quote_id UUID REFERENCES saved_quotes(id) ON DELETE SET NULL,
  
  -- User/session tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Validation result
  validation_result JSONB NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  score INTEGER NOT NULL DEFAULT 100,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  
  -- Input parameters used
  inputs JSONB NOT NULL,
  
  -- Output values calculated
  outputs JSONB NOT NULL,
  
  -- Metadata
  validator_version TEXT DEFAULT '1.0.0',
  environment TEXT DEFAULT 'production'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON calculation_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_is_valid ON calculation_audit_log(is_valid);
CREATE INDEX IF NOT EXISTS idx_audit_log_score ON calculation_audit_log(score);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON calculation_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON calculation_audit_log(session_id);

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_audit_log_inputs_use_case 
  ON calculation_audit_log((inputs->>'useCase'));

-- Enable RLS
ALTER TABLE calculation_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read all, users can read their own
CREATE POLICY "Admins can read all audit logs" ON calculation_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tier = 'ADMIN'
    )
  );

CREATE POLICY "Users can read their own audit logs" ON calculation_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Insert policy: Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert audit logs" ON calculation_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DAILY VALIDATION SUMMARY VIEW
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW calculation_validation_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_validations,
  COUNT(*) FILTER (WHERE is_valid) as valid_count,
  COUNT(*) FILTER (WHERE NOT is_valid) as invalid_count,
  ROUND(AVG(score)::numeric, 1) as avg_score,
  ROUND(
    (COUNT(*) FILTER (WHERE is_valid)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 
    1
  ) as compliance_rate,
  ROUND(AVG(warnings_count)::numeric, 1) as avg_warnings,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT inputs->>'useCase') as use_cases_tested
FROM calculation_audit_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ANOMALY DETECTION VIEW
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW calculation_anomalies AS
SELECT 
  id,
  created_at,
  inputs->>'useCase' as use_case,
  inputs->>'storageSizeMW' as storage_mw,
  inputs->>'location' as location,
  outputs->>'equipmentCost' as equipment_cost,
  outputs->>'totalProjectCost' as total_cost,
  outputs->>'paybackYears' as payback_years,
  score,
  warnings_count,
  validation_result->'warnings' as warnings
FROM calculation_audit_log
WHERE NOT is_valid 
   OR score < 70
   OR warnings_count > 3
ORDER BY created_at DESC
LIMIT 100;

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE calculation_audit_log IS 
  'Audit log for all quote calculations - tracks SSOT compliance';

COMMENT ON VIEW calculation_validation_summary IS 
  'Daily summary of calculation validation metrics';

COMMENT ON VIEW calculation_anomalies IS 
  'Recent calculations that failed validation or have low scores';
