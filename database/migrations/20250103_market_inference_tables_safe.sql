-- ============================================================================
-- MARKET INFERENCE TABLES - SAFE VERSION (IDEMPOTENT)
-- Stores market analysis results and pricing update approvals
-- Created: January 3, 2025
-- Updated: Safe version that handles existing objects
-- ============================================================================

-- Market Inferences Table
CREATE TABLE IF NOT EXISTS market_inferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Analysis metadata
    analysis_date DATE UNIQUE NOT NULL,
    overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('bullish', 'bearish', 'neutral')),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    data_points_analyzed INTEGER DEFAULT 0,
    sources TEXT[] DEFAULT '{}',
    ml_model_version VARCHAR(50),
    
    -- Analysis results (stored as JSONB)
    market_trends JSONB DEFAULT '[]',
    bess_configurations JSONB DEFAULT '[]',
    decision_indicators JSONB DEFAULT '[]',
    emerging_opportunities JSONB DEFAULT '[]',
    industry_adoption JSONB DEFAULT '[]',
    
    -- Pricing update flags
    requires_pricing_update BOOLEAN DEFAULT false,
    pricing_update_recommendations JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing Update Approvals Table
CREATE TABLE IF NOT EXISTS pricing_update_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to inference
    inference_id UUID REFERENCES market_inferences(id) ON DELETE CASCADE,
    
    -- Recommendation details
    component VARCHAR(100) NOT NULL, -- e.g., "bess_kwh", "solar_watt"
    current_value DECIMAL(12,2) NOT NULL,
    recommended_value DECIMAL(12,2) NOT NULL,
    change_percent DECIMAL(6,2) NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    evidence JSONB DEFAULT '[]',
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    
    -- Approval workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Application
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_value DECIMAL(12,2), -- Actual value applied (may differ from recommended)
    applied_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing indexes if they exist (safe re-run)
DROP INDEX IF EXISTS idx_market_inferences_date;
DROP INDEX IF EXISTS idx_market_inferences_sentiment;
DROP INDEX IF EXISTS idx_market_inferences_pricing_update;
DROP INDEX IF EXISTS idx_pricing_approvals_inference;
DROP INDEX IF EXISTS idx_pricing_approvals_status;
DROP INDEX IF EXISTS idx_pricing_approvals_component;
DROP INDEX IF EXISTS idx_pricing_approvals_urgency;

-- Create indexes
CREATE INDEX idx_market_inferences_date ON market_inferences(analysis_date DESC);
CREATE INDEX idx_market_inferences_sentiment ON market_inferences(overall_sentiment);
CREATE INDEX idx_market_inferences_pricing_update ON market_inferences(requires_pricing_update) WHERE requires_pricing_update = true;

CREATE INDEX idx_pricing_approvals_inference ON pricing_update_approvals(inference_id);
CREATE INDEX idx_pricing_approvals_status ON pricing_update_approvals(status);
CREATE INDEX idx_pricing_approvals_component ON pricing_update_approvals(component);
CREATE INDEX idx_pricing_approvals_urgency ON pricing_update_approvals(urgency) WHERE status = 'pending';

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_market_inferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS market_inferences_updated ON market_inferences;
CREATE TRIGGER market_inferences_updated
    BEFORE UPDATE ON market_inferences
    FOR EACH ROW
    EXECUTE FUNCTION update_market_inferences_timestamp();

DROP TRIGGER IF EXISTS pricing_approvals_updated ON pricing_update_approvals;
CREATE TRIGGER pricing_approvals_updated
    BEFORE UPDATE ON pricing_update_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_market_inferences_timestamp();

-- RLS Policies (drop first if they exist for safe re-run)
ALTER TABLE market_inferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "market_inferences_select" ON market_inferences;
DROP POLICY IF EXISTS "market_inferences_admin_all" ON market_inferences;
CREATE POLICY "market_inferences_select" ON market_inferences FOR SELECT USING (true);
CREATE POLICY "market_inferences_admin_all" ON market_inferences FOR ALL 
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

ALTER TABLE pricing_update_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pricing_approvals_select" ON pricing_update_approvals;
DROP POLICY IF EXISTS "pricing_approvals_admin_all" ON pricing_update_approvals;
CREATE POLICY "pricing_approvals_select" ON pricing_update_approvals FOR SELECT USING (true);
CREATE POLICY "pricing_approvals_admin_all" ON pricing_update_approvals FOR ALL 
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Comments
COMMENT ON TABLE market_inferences IS 'Stores market inference analysis results from market signals, news, and installations';
COMMENT ON TABLE pricing_update_approvals IS 'Tracks pricing update recommendations and approval workflow';

