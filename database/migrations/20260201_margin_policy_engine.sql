-- ============================================================================
-- MARGIN POLICY ENGINE DATABASE TABLES
-- ============================================================================
-- 
-- This migration creates the database-backed configuration for the Margin 
-- Policy Engine. This allows admin-editable margin bands without code deploys.
--
-- @created 2026-02-01
-- @version 1.0.0
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: margin_policy_bands
-- Deal size → Margin % (scale discount curve)
-- ============================================================================
CREATE TABLE IF NOT EXISTS margin_policy_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id VARCHAR(50) NOT NULL UNIQUE,
    min_total NUMERIC(15,2) NOT NULL,
    max_total NUMERIC(15,2), -- NULL = no limit
    margin_min NUMERIC(5,4) NOT NULL,
    margin_max NUMERIC(5,4) NOT NULL,
    margin_target NUMERIC(5,4) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT margin_min_positive CHECK (margin_min >= 0),
    CONSTRAINT margin_max_positive CHECK (margin_max >= 0),
    CONSTRAINT margin_target_between CHECK (margin_target >= margin_min AND margin_target <= margin_max),
    CONSTRAINT min_less_than_max CHECK (max_total IS NULL OR min_total < max_total)
);

-- Seed default margin bands
INSERT INTO margin_policy_bands (band_id, min_total, max_total, margin_min, margin_max, margin_target, description) VALUES
    ('micro',      0,          500000,     0.18, 0.25, 0.20, 'Micro: <$500K'),
    ('small',      500000,     1500000,    0.15, 0.20, 0.18, 'Small: $500K-$1.5M'),
    ('small_plus', 1500000,    3000000,    0.10, 0.15, 0.12, 'Small+: $1.5M-$3M'),
    ('mid',        3000000,    5000000,    0.08, 0.12, 0.10, 'Mid: $3M-$5M'),
    ('mid_plus',   5000000,    10000000,   0.06, 0.09, 0.075, 'Mid+: $5M-$10M'),
    ('large',      10000000,   20000000,   0.04, 0.07, 0.055, 'Large: $10M-$20M'),
    ('enterprise', 20000000,   100000000,  0.02, 0.05, 0.035, 'Enterprise: $20M-$100M'),
    ('mega',       100000000,  NULL,       0.005, 0.02, 0.012, 'Mega: $100M+')
ON CONFLICT (band_id) DO UPDATE SET
    min_total = EXCLUDED.min_total,
    max_total = EXCLUDED.max_total,
    margin_min = EXCLUDED.margin_min,
    margin_max = EXCLUDED.margin_max,
    margin_target = EXCLUDED.margin_target,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- TABLE: margin_policy_products
-- Product-class margin multipliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS margin_policy_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_class VARCHAR(50) NOT NULL UNIQUE,
    margin_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    is_additive BOOLEAN DEFAULT false,
    fixed_adder NUMERIC(5,4), -- For labor/EPC (additive, not multiplicative)
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT margin_multiplier_positive CHECK (margin_multiplier > 0)
);

-- Seed default product margins
INSERT INTO margin_policy_products (product_class, margin_multiplier, is_additive, fixed_adder, description) VALUES
    ('bess',                 1.0,  false, NULL, 'BESS: Standard margin'),
    ('solar',                0.75, false, NULL, 'Solar: Commoditized, tighter margin'),
    ('wind',                 0.85, false, NULL, 'Wind: Slightly tighter margin'),
    ('generator',            0.90, false, NULL, 'Generator: Competitive market'),
    ('ev_charger',           1.1,  false, NULL, 'EV: Higher margin (install complexity)'),
    ('inverter_pcs',         0.85, false, NULL, 'Inverter: Tight margin, stable'),
    ('transformer',          0.90, false, NULL, 'Transformer: Moderate margin'),
    ('microgrid_controller', 1.2,  false, NULL, 'Microgrid: Higher complexity margin'),
    ('bms',                  1.0,  false, NULL, 'BMS: Standard margin'),
    ('scada',                1.15, false, NULL, 'SCADA: Software premium'),
    ('ems_software',         1.25, false, NULL, 'EMS: Software premium'),
    ('construction_labor',   1.0,  true,  0.15, 'Labor: 15% fixed adder'),
    ('engineering',          1.0,  true,  0.20, 'Engineering: 20% fixed adder')
ON CONFLICT (product_class) DO UPDATE SET
    margin_multiplier = EXCLUDED.margin_multiplier,
    is_additive = EXCLUDED.is_additive,
    fixed_adder = EXCLUDED.fixed_adder,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- TABLE: margin_policy_risk_adjusters
-- Risk/complexity margin adjusters
-- ============================================================================
CREATE TABLE IF NOT EXISTS margin_policy_risk_adjusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_level VARCHAR(50) NOT NULL UNIQUE,
    margin_add_percent NUMERIC(5,4) NOT NULL DEFAULT 0,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default risk adjusters
INSERT INTO margin_policy_risk_adjusters (risk_level, margin_add_percent, description) VALUES
    ('standard',        0,    'Standard commercial project'),
    ('elevated',        0.02, 'Elevated: Data center, critical loads'),
    ('high_complexity', 0.04, 'High: Microgrid islanding, N+1, hospital')
ON CONFLICT (risk_level) DO UPDATE SET
    margin_add_percent = EXCLUDED.margin_add_percent,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- TABLE: margin_policy_segment_adjusters
-- Customer segment margin adjusters
-- ============================================================================
CREATE TABLE IF NOT EXISTS margin_policy_segment_adjusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment VARCHAR(50) NOT NULL UNIQUE,
    margin_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT segment_multiplier_positive CHECK (margin_multiplier > 0)
);

-- Seed default segment adjusters
INSERT INTO margin_policy_segment_adjusters (segment, margin_multiplier, description) VALUES
    ('direct',      1.0,  'Direct customer: Standard margin'),
    ('epc_partner', 0.85, 'EPC Partner: 15% margin share'),
    ('strategic',   0.90, 'Strategic account: 10% discount'),
    ('government',  0.80, 'Government: 20% discount')
ON CONFLICT (segment) DO UPDATE SET
    margin_multiplier = EXCLUDED.margin_multiplier,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- TABLE: margin_policy_price_guards
-- Floor/ceiling guards per product class
-- ============================================================================
CREATE TABLE IF NOT EXISTS margin_policy_price_guards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_class VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'per_kWh', 'per_kW', 'per_W', 'per_unit', 'flat'
    floor_price NUMERIC(15,2) NOT NULL,
    ceiling_price NUMERIC(15,2) NOT NULL,
    last_market_price NUMERIC(15,2),
    market_source VARCHAR(255),
    as_of_date DATE,
    region VARCHAR(50) DEFAULT 'north-america',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT floor_less_than_ceiling CHECK (floor_price < ceiling_price),
    CONSTRAINT market_between_floor_ceiling CHECK (
        last_market_price IS NULL OR 
        (last_market_price >= floor_price AND last_market_price <= ceiling_price)
    ),
    UNIQUE (product_class, unit, region)
);

-- Seed default price guards
INSERT INTO margin_policy_price_guards (product_class, unit, floor_price, ceiling_price, last_market_price, market_source, as_of_date) VALUES
    ('bess',          'per_kWh',  100,   250,    125,   'NREL ATB 2024',        '2025-12-01'),
    ('solar',         'per_W',    0.55,  1.50,   0.85,  'NREL Cost Benchmark',  '2025-12-01'),
    ('inverter_pcs',  'per_kW',   60,    180,    95,    'NREL ATB 2024',        '2025-12-01'),
    ('generator',     'per_kW',   400,   1200,   700,   'Industry pricing',     '2025-12-01'),
    ('ev_charger',    'per_unit', 5000,  150000, 35000, 'Industry pricing',     '2025-12-01'),
    ('transformer',   'per_kVA',  35,    100,    55,    'Industry pricing',     '2025-12-01'),
    ('bms',           'per_unit', 8000,  40000,  15000, 'Industry pricing',     '2025-12-01'),
    ('scada',         'flat',     20000, 150000, 45000, 'Industry pricing',     '2025-12-01')
ON CONFLICT (product_class, unit, region) DO UPDATE SET
    floor_price = EXCLUDED.floor_price,
    ceiling_price = EXCLUDED.ceiling_price,
    last_market_price = EXCLUDED.last_market_price,
    market_source = EXCLUDED.market_source,
    as_of_date = EXCLUDED.as_of_date,
    updated_at = NOW();

-- ============================================================================
-- TABLE: margin_audit_log
-- Audit trail for margin policy applications
-- ============================================================================
CREATE TABLE IF NOT EXISTS margin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID, -- Link to saved_quotes if applicable
    total_base_cost NUMERIC(15,2) NOT NULL,
    total_sell_price NUMERIC(15,2) NOT NULL,
    total_margin_dollars NUMERIC(15,2) NOT NULL,
    blended_margin_percent NUMERIC(5,4) NOT NULL,
    margin_band_id VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50),
    customer_segment VARCHAR(50),
    clamp_events JSONB DEFAULT '[]',
    line_items JSONB DEFAULT '[]',
    policy_version VARCHAR(20) NOT NULL,
    pricing_as_of DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_quote FOREIGN KEY (quote_id) REFERENCES saved_quotes(id) ON DELETE SET NULL
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_margin_audit_created ON margin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_margin_audit_band ON margin_audit_log(margin_band_id);

-- ============================================================================
-- RLS POLICIES (if using Supabase)
-- ============================================================================

-- Enable RLS
ALTER TABLE margin_policy_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_policy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_policy_risk_adjusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_policy_segment_adjusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_policy_price_guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read for policy tables (needed for quoting)
CREATE POLICY "Public read margin bands" ON margin_policy_bands FOR SELECT USING (true);
CREATE POLICY "Public read margin products" ON margin_policy_products FOR SELECT USING (true);
CREATE POLICY "Public read risk adjusters" ON margin_policy_risk_adjusters FOR SELECT USING (true);
CREATE POLICY "Public read segment adjusters" ON margin_policy_segment_adjusters FOR SELECT USING (true);
CREATE POLICY "Public read price guards" ON margin_policy_price_guards FOR SELECT USING (true);

-- Admin-only write for policy tables (based on user role)
-- Note: Adjust these policies based on your auth setup
-- Using separate policies for SELECT/INSERT/UPDATE/DELETE since FOR ALL with USING doesn't work for INSERT

-- margin_policy_bands admin write
CREATE POLICY "Admin insert margin bands" ON margin_policy_bands FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin update margin bands" ON margin_policy_bands FOR UPDATE 
    USING (auth.jwt() ->> 'user_role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin delete margin bands" ON margin_policy_bands FOR DELETE 
    USING (auth.jwt() ->> 'user_role' = 'admin');

-- margin_policy_products admin write
CREATE POLICY "Admin insert margin products" ON margin_policy_products FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin update margin products" ON margin_policy_products FOR UPDATE 
    USING (auth.jwt() ->> 'user_role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin delete margin products" ON margin_policy_products FOR DELETE 
    USING (auth.jwt() ->> 'user_role' = 'admin');

-- margin_policy_risk_adjusters admin write
CREATE POLICY "Admin insert risk adjusters" ON margin_policy_risk_adjusters FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin update risk adjusters" ON margin_policy_risk_adjusters FOR UPDATE 
    USING (auth.jwt() ->> 'user_role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin delete risk adjusters" ON margin_policy_risk_adjusters FOR DELETE 
    USING (auth.jwt() ->> 'user_role' = 'admin');

-- margin_policy_segment_adjusters admin write
CREATE POLICY "Admin insert segment adjusters" ON margin_policy_segment_adjusters FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin update segment adjusters" ON margin_policy_segment_adjusters FOR UPDATE 
    USING (auth.jwt() ->> 'user_role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin delete segment adjusters" ON margin_policy_segment_adjusters FOR DELETE 
    USING (auth.jwt() ->> 'user_role' = 'admin');

-- margin_policy_price_guards admin write
CREATE POLICY "Admin insert price guards" ON margin_policy_price_guards FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin update price guards" ON margin_policy_price_guards FOR UPDATE 
    USING (auth.jwt() ->> 'user_role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
CREATE POLICY "Admin delete price guards" ON margin_policy_price_guards FOR DELETE 
    USING (auth.jwt() ->> 'user_role' = 'admin');

-- Audit log: users can read their own quotes' audit entries
CREATE POLICY "Users read own audit" ON margin_audit_log FOR SELECT 
    USING (
        quote_id IN (
            SELECT id FROM saved_quotes WHERE user_id = auth.uid()
        )
        OR auth.jwt() ->> 'user_role' = 'admin'
    );

-- Service role can insert audit entries (FOR INSERT uses WITH CHECK, not USING)
CREATE POLICY "Service insert audit" ON margin_audit_log FOR INSERT 
    WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get margin band for a deal size
CREATE OR REPLACE FUNCTION get_margin_band(p_total_base_cost NUMERIC)
RETURNS TABLE (
    band_id VARCHAR,
    min_total NUMERIC,
    max_total NUMERIC,
    margin_min NUMERIC,
    margin_max NUMERIC,
    margin_target NUMERIC,
    description VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mpb.band_id,
        mpb.min_total,
        mpb.max_total,
        mpb.margin_min,
        mpb.margin_max,
        mpb.margin_target,
        mpb.description
    FROM margin_policy_bands mpb
    WHERE mpb.is_active = true
      AND mpb.min_total <= p_total_base_cost
      AND (mpb.max_total IS NULL OR mpb.max_total > p_total_base_cost)
    ORDER BY mpb.min_total DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to log margin policy application
CREATE OR REPLACE FUNCTION log_margin_application(
    p_quote_id UUID,
    p_total_base_cost NUMERIC,
    p_total_sell_price NUMERIC,
    p_margin_band_id VARCHAR,
    p_risk_level VARCHAR,
    p_customer_segment VARCHAR,
    p_clamp_events JSONB,
    p_line_items JSONB,
    p_policy_version VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO margin_audit_log (
        quote_id,
        total_base_cost,
        total_sell_price,
        total_margin_dollars,
        blended_margin_percent,
        margin_band_id,
        risk_level,
        customer_segment,
        clamp_events,
        line_items,
        policy_version,
        pricing_as_of
    ) VALUES (
        p_quote_id,
        p_total_base_cost,
        p_total_sell_price,
        p_total_sell_price - p_total_base_cost,
        CASE WHEN p_total_base_cost > 0 
             THEN (p_total_sell_price - p_total_base_cost) / p_total_base_cost 
             ELSE 0 END,
        p_margin_band_id,
        p_risk_level,
        p_customer_segment,
        p_clamp_events,
        p_line_items,
        p_policy_version,
        CURRENT_DATE
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE margin_policy_bands IS 'Deal size → margin % scale discount curve (admin editable)';
COMMENT ON TABLE margin_policy_products IS 'Product-class margin multipliers (BESS vs Solar vs EV)';
COMMENT ON TABLE margin_policy_risk_adjusters IS 'Risk/complexity margin adders';
COMMENT ON TABLE margin_policy_segment_adjusters IS 'Customer segment margin adjusters (EPC partner, government)';
COMMENT ON TABLE margin_policy_price_guards IS 'Floor/ceiling price guards per product class';
COMMENT ON TABLE margin_audit_log IS 'Audit trail for all margin policy applications';

COMMENT ON FUNCTION get_margin_band IS 'Get the appropriate margin band for a given deal size';
COMMENT ON FUNCTION log_margin_application IS 'Log a margin policy application for audit purposes';
