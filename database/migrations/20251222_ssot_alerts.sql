-- SSOT Alerts Table
-- Stores all SSOT validation alerts for audit and monitoring
-- Created: December 22, 2025

CREATE TABLE IF NOT EXISTS ssot_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning')),
  score INTEGER NOT NULL,
  use_case TEXT,
  location TEXT,
  errors TEXT[] DEFAULT '{}',
  session_id TEXT,
  
  -- Notification tracking
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  slack_sent BOOLEAN DEFAULT FALSE,
  
  -- Resolution tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ssot_alerts_created_at ON ssot_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssot_alerts_type ON ssot_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_ssot_alerts_unresolved ON ssot_alerts(resolved) WHERE resolved = FALSE;

-- RLS Policies
ALTER TABLE ssot_alerts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the app (for logging alerts)
CREATE POLICY "Allow insert for all" ON ssot_alerts
  FOR INSERT WITH CHECK (true);

-- Allow select for authenticated users (admins viewing alerts)
CREATE POLICY "Allow select for all" ON ssot_alerts
  FOR SELECT USING (true);

-- Allow update for resolution
CREATE POLICY "Allow update for all" ON ssot_alerts
  FOR UPDATE USING (true);

-- View for unresolved alerts (for dashboard)
CREATE OR REPLACE VIEW unresolved_ssot_alerts AS
SELECT 
  id,
  created_at,
  alert_type,
  score,
  use_case,
  location,
  errors,
  session_id,
  CASE 
    WHEN alert_type = 'critical' THEN '🚨 CRITICAL'
    ELSE '⚠️ WARNING'
  END as severity_label,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago
FROM ssot_alerts
WHERE resolved = FALSE
ORDER BY 
  CASE alert_type WHEN 'critical' THEN 0 ELSE 1 END,
  created_at DESC;

-- View for alert statistics
CREATE OR REPLACE VIEW ssot_alert_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE alert_type = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE alert_type = 'warning') as warning_count,
  AVG(score) as avg_score,
  MIN(score) as min_score
FROM ssot_alerts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

COMMENT ON TABLE ssot_alerts IS 'Stores SSOT validation alerts when calculations fail benchmark checks';
