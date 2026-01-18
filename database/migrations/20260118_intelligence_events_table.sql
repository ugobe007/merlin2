-- =====================================================
-- Intelligence Events Table - ML Training Data
-- =====================================================
-- Created: January 18, 2026
-- Purpose: Capture all user interactions with intelligence
--          layer for ML model training and improvement
-- 
-- Event Types:
--   - zip_lookup: User enters ZIP code
--   - business_detection: Business name/address lookup
--   - goal_selection: User selects energy goals
--   - industry_inference: AI infers industry from business name
--   - value_teaser_view: User sees peer benchmark data
--   - weather_impact_view: User sees climate impact
--   - grid_stress_view: User sees grid stress index
-- =====================================================

CREATE TABLE IF NOT EXISTS intelligence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_type TEXT NOT NULL,  -- 'zip_lookup', 'business_detection', 'goal_selection', etc.
  event_category TEXT NOT NULL,  -- 'location', 'business', 'goals', 'industry'
  
  -- User context
  user_session_id TEXT,  -- Anonymous session tracking (no PII)
  wizard_step INTEGER NOT NULL DEFAULT 1,  -- Which wizard step triggered event
  
  -- Input data (what user provided)
  input_data JSONB NOT NULL,  -- { zip: '89101', businessName: 'Tesla Gigafactory', etc. }
  
  -- Output data (what AI returned)
  output_data JSONB NOT NULL,  -- { state: 'NV', city: 'Las Vegas', industry: 'manufacturing', etc. }
  
  -- Confidence & quality metrics
  confidence NUMERIC,  -- 0-1 range for AI confidence score
  was_correct BOOLEAN,  -- User feedback: was this inference correct? (null if no feedback yet)
  correction_value TEXT,  -- If was_correct=false, what was the correct value?
  
  -- Performance tracking
  processing_time_ms INTEGER,  -- How long did the AI take to respond?
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,  -- Browser/device info (for segmentation)
  ip_hash TEXT  -- Hashed IP (for abuse detection, not tracking)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_intelligence_events_type ON intelligence_events(event_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_events_category ON intelligence_events(event_category);
CREATE INDEX IF NOT EXISTS idx_intelligence_events_session ON intelligence_events(user_session_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_events_created ON intelligence_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_events_confidence ON intelligence_events(confidence) WHERE confidence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_events_feedback ON intelligence_events(was_correct) WHERE was_correct IS NOT NULL;

-- Row-level security (RLS) policies
ALTER TABLE intelligence_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for event logging)
CREATE POLICY "Allow anonymous event logging"
  ON intelligence_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view their own session events
CREATE POLICY "Users can view their session events"
  ON intelligence_events
  FOR SELECT
  TO authenticated
  USING (user_session_id = current_setting('app.user_session_id', true));

-- Admin full access (CONDITIONAL - only if users table exists with tier column)
-- If users table doesn't exist yet, this policy will be skipped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'tier'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins have full access"
      ON intelligence_events
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id::text = auth.uid()::text
          AND users.tier = ''ADMIN''
        )
      )';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE intelligence_events IS 'Captures all user interactions with intelligence layer for ML training and model improvement. No PII stored - uses anonymous session IDs.';
COMMENT ON COLUMN intelligence_events.input_data IS 'User-provided data (ZIP, business name, etc.) - sanitized, no PII';
COMMENT ON COLUMN intelligence_events.output_data IS 'AI-generated outputs (inferred industry, climate zone, grid stress, etc.)';
COMMENT ON COLUMN intelligence_events.was_correct IS 'User feedback on AI accuracy - null if no feedback yet, true/false if validated';
COMMENT ON COLUMN intelligence_events.correction_value IS 'If AI was wrong, what was the correct value? Used for retraining.';
