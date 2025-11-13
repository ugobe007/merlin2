-- ============================================================================
-- USE CASE TEMPLATES & EQUIPMENT DATABASE SCHEMA
-- ============================================================================
-- Version: 2.2.0
-- Purpose: Migrate useCaseTemplates.ts to database for dynamic management
-- Date: November 13, 2025
-- ============================================================================

-- ============================================================================
-- TABLE 1: USE CASE TEMPLATES
-- ============================================================================
-- Stores all use case templates currently in /src/data/useCaseTemplates.ts
-- Enables dynamic template management without redeployment

CREATE TABLE IF NOT EXISTS use_case_templates (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10), -- Emoji icon (e.g., '🚗', '🏨', '🔋')
    image_url TEXT,
    category VARCHAR(50) DEFAULT 'commercial',
    
    -- Access Control
    required_tier VARCHAR(20) DEFAULT 'free' CHECK (required_tier IN ('free', 'semi_premium', 'premium', 'admin')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Power Profile (JSONB for flexibility)
    -- Structure: {
    --   "typicalLoadKw": number,
    --   "peakLoadKw": number,
    --   "profileType": "peaked" | "baseload" | "variable",
    --   "dailyOperatingHours": number,
    --   "peakHoursStart": "HH:MM",
    --   "peakHoursEnd": "HH:MM",
    --   "operatesWeekends": boolean,
    --   "seasonalVariation": number (multiplier, e.g., 1.2 = 20% increase)
    -- }
    power_profile JSONB NOT NULL,
    
    -- Financial Parameters (JSONB)
    -- Structure: {
    --   "demandChargeSensitivity": number (1.0-1.5),
    --   "energyCostMultiplier": number,
    --   "typicalSavingsPercent": number,
    --   "roiAdjustmentFactor": number,
    --   "peakDemandPenalty": number
    -- }
    financial_params JSONB NOT NULL,
    
    -- Solar Compatibility (JSONB) - NEW FIELD
    -- Structure: {
    --   "recommended": boolean,
    --   "value": "high" | "medium" | "low",
    --   "useCases": ["off-grid", "peak-shaving", "arbitrage", "backup"],
    --   "typicalSolarRatio": number (kW solar per kW BESS),
    --   "autonomyDays": number (default battery autonomy),
    --   "notes": string
    -- }
    solar_compatibility JSONB DEFAULT NULL,
    
    -- Custom Questions (JSONB Array)
    -- Structure: [{
    --   "id": string,
    --   "question": string,
    --   "type": "number" | "text" | "select" | "boolean",
    --   "options": string[] (for select type),
    --   "default": any,
    --   "unit": string,
    --   "impactType": "power_scaling" | "duration_adjustment" | "cost_modifier"
    -- }]
    custom_questions JSONB DEFAULT '[]'::jsonb,
    
    -- Recommended BESS Applications
    recommended_applications VARCHAR(50)[] DEFAULT '{}',
    -- Valid values: 'peak_shaving', 'demand_response', 'backup_power', 
    --               'arbitrage', 'load_leveling', 'microgrid', 'resiliency'
    
    -- Industry Standards & Data Sources (JSONB)
    -- Structure: {
    --   "nrel": string (NREL data reference),
    --   "ashrae": string (ASHRAE standard),
    --   "ieee": string (IEEE standard),
    --   "epri": string (EPRI database),
    --   "cbecs": string (DOE/EIA CBECS),
    --   "other": string[]
    -- }
    industry_standards JSONB DEFAULT '{}'::jsonb,
    
    -- Version Control
    version VARCHAR(10) DEFAULT '1.0.0',
    changelog TEXT,
    previous_version_id UUID REFERENCES use_case_templates(id),
    
    -- Admin Control
    created_by UUID REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Usage Analytics
    times_used INTEGER DEFAULT 0,
    times_saved INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    total_ratings INTEGER DEFAULT 0
);

-- Indexes for Performance
CREATE INDEX idx_use_case_templates_slug ON use_case_templates(slug);
CREATE INDEX idx_use_case_templates_category ON use_case_templates(category);
CREATE INDEX idx_use_case_templates_active ON use_case_templates(is_active);
CREATE INDEX idx_use_case_templates_tier ON use_case_templates(required_tier);
CREATE INDEX idx_use_case_templates_display ON use_case_templates(display_order);
CREATE INDEX idx_use_case_templates_usage ON use_case_templates(times_used DESC);

-- Full-Text Search on Name & Description
CREATE INDEX idx_use_case_templates_search ON use_case_templates USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Comments
COMMENT ON TABLE use_case_templates IS 'Use case templates for BESS quote builder - migrated from useCaseTemplates.ts';
COMMENT ON COLUMN use_case_templates.power_profile IS 'Equipment power profiles and operating characteristics (JSONB)';
COMMENT ON COLUMN use_case_templates.financial_params IS 'Financial modeling parameters for ROI calculations (JSONB)';
COMMENT ON COLUMN use_case_templates.solar_compatibility IS 'Solar integration compatibility and recommendations (JSONB)';
COMMENT ON COLUMN use_case_templates.custom_questions IS 'Facility-specific configuration questions (JSONB array)';


-- ============================================================================
-- TABLE 2: EQUIPMENT DATABASE
-- ============================================================================
-- Stores equipment items for each use case template
-- Replaces the equipment array in useCaseTemplates.ts

CREATE TABLE IF NOT EXISTS equipment_database (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship to Use Case Template
    use_case_template_id UUID NOT NULL REFERENCES use_case_templates(id) ON DELETE CASCADE,
    
    -- Equipment Details
    name VARCHAR(255) NOT NULL,
    power_kw DECIMAL(10,3) NOT NULL CHECK (power_kw >= 0),
    duty_cycle DECIMAL(4,3) NOT NULL CHECK (duty_cycle >= 0 AND duty_cycle <= 1),
    description TEXT,
    
    -- Data Validation & Sources
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    data_source VARCHAR(500), 
    -- Example: "EPRI: 20-30kW per bay", "ASHRAE 90.1 Standard", "DOE CBECS data"
    validation_notes TEXT,
    
    -- Equipment Category (for grouping)
    category VARCHAR(50),
    -- Examples: 'HVAC', 'Lighting', 'Kitchen', 'Medical Equipment', 'IT'
    
    -- Display Settings
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    show_in_ui BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_use_case ON equipment_database(use_case_template_id);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment_database(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_database(category);
CREATE INDEX IF NOT EXISTS idx_equipment_display ON equipment_database(use_case_template_id, display_order);

-- Comments
COMMENT ON TABLE equipment_database IS 'Equipment power profiles for use case templates - one record per equipment item';
COMMENT ON COLUMN equipment_database.duty_cycle IS 'Equipment duty cycle: 0.0 (never on) to 1.0 (always on)';
COMMENT ON COLUMN equipment_database.data_source IS 'Industry standard or research source validating power rating';


-- ============================================================================
-- TABLE 3: ENHANCE SAVED_PROJECTS TABLE
-- ============================================================================
-- Add foreign key to use_case_templates for better tracking

-- Add new column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_projects' 
        AND column_name = 'use_case_template_id'
    ) THEN
        ALTER TABLE saved_projects 
        ADD COLUMN use_case_template_id UUID REFERENCES use_case_templates(id);
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_saved_projects_template ON saved_projects(use_case_template_id);

-- Add columns for better analytics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_projects' 
        AND column_name = 'template_version'
    ) THEN
        ALTER TABLE saved_projects 
        ADD COLUMN template_version VARCHAR(10) DEFAULT '1.0.0';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_projects' 
        AND column_name = 'calculation_version'
    ) THEN
        ALTER TABLE saved_projects 
        ADD COLUMN calculation_version VARCHAR(10) DEFAULT '2.1.0';
    END IF;
END $$;

-- Comments
COMMENT ON COLUMN saved_projects.use_case_template_id IS 'Foreign key to use_case_templates - tracks which template was used';
COMMENT ON COLUMN saved_projects.template_version IS 'Version of use case template at time of project creation';
COMMENT ON COLUMN saved_projects.calculation_version IS 'Version of calculation engine used for results';


-- ============================================================================
-- TABLE 4: ENHANCE CALCULATION_CACHE TABLE
-- ============================================================================
-- Add indexes for better cache performance

CREATE INDEX IF NOT EXISTS idx_calculation_cache_type ON calculation_cache(calculation_type);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_expires ON calculation_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_created ON calculation_cache(created_at DESC);

-- Add cleanup function to remove expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM calculation_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION cleanup_expired_cache IS 'Removes expired calculation cache entries - run via cron job';


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE use_case_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_database ENABLE ROW LEVEL SECURITY;

-- Public Read Access for Active Templates
CREATE POLICY "use_case_templates_public_read"
    ON use_case_templates
    FOR SELECT
    USING (is_active = true);

-- Admin Full Access
CREATE POLICY "use_case_templates_admin_all"
    ON use_case_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.settings->>'role' = 'admin'
        )
    );

-- Public Read Access for Equipment
CREATE POLICY "equipment_database_public_read"
    ON equipment_database
    FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM use_case_templates
            WHERE use_case_templates.id = equipment_database.use_case_template_id
            AND use_case_templates.is_active = true
        )
    );

-- Admin Full Access for Equipment
CREATE POLICY "equipment_database_admin_all"
    ON equipment_database
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.settings->>'role' = 'admin'
        )
    );


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get Use Case with Equipment
CREATE OR REPLACE FUNCTION get_use_case_with_equipment(template_slug VARCHAR)
RETURNS TABLE (
    template_id UUID,
    template_name VARCHAR,
    template_data JSONB,
    equipment JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uct.id,
        uct.name,
        jsonb_build_object(
            'slug', uct.slug,
            'name', uct.name,
            'description', uct.description,
            'icon', uct.icon,
            'image_url', uct.image_url,
            'category', uct.category,
            'power_profile', uct.power_profile,
            'financial_params', uct.financial_params,
            'solar_compatibility', uct.solar_compatibility,
            'custom_questions', uct.custom_questions,
            'recommended_applications', uct.recommended_applications,
            'industry_standards', uct.industry_standards,
            'version', uct.version
        ) as template_data,
        jsonb_agg(
            jsonb_build_object(
                'id', eq.id,
                'name', eq.name,
                'powerKw', eq.power_kw,
                'dutyCycle', eq.duty_cycle,
                'description', eq.description,
                'category', eq.category,
                'dataSource', eq.data_source
            ) ORDER BY eq.display_order
        ) as equipment
    FROM use_case_templates uct
    LEFT JOIN equipment_database eq ON eq.use_case_template_id = uct.id AND eq.is_active = true
    WHERE uct.slug = template_slug
    AND uct.is_active = true
    GROUP BY uct.id, uct.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_use_case_with_equipment IS 'Fetches use case template with all equipment in single query';


-- Function: Update Template Usage Stats
CREATE OR REPLACE FUNCTION increment_template_usage(template_slug VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE use_case_templates
    SET times_used = times_used + 1,
        updated_at = NOW()
    WHERE slug = template_slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_template_usage IS 'Increments times_used counter when template is used';


-- Function: Add Template Rating
CREATE OR REPLACE FUNCTION add_template_rating(
    template_slug VARCHAR,
    rating_value DECIMAL(3,2)
)
RETURNS VOID AS $$
BEGIN
    UPDATE use_case_templates
    SET 
        total_ratings = total_ratings + 1,
        avg_rating = ((avg_rating * total_ratings) + rating_value) / (total_ratings + 1),
        updated_at = NOW()
    WHERE slug = template_slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_template_rating IS 'Updates average rating for a template';


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_use_case_templates_updated_at
    BEFORE UPDATE ON use_case_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_database_updated_at
    BEFORE UPDATE ON equipment_database
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active Templates with Equipment Count
CREATE OR REPLACE VIEW v_use_case_templates_summary AS
SELECT 
    uct.id,
    uct.slug,
    uct.name,
    uct.description,
    uct.icon,
    uct.category,
    uct.required_tier,
    uct.display_order,
    uct.version,
    COUNT(eq.id) as equipment_count,
    uct.times_used,
    uct.times_saved,
    uct.avg_rating,
    uct.total_ratings,
    uct.created_at,
    uct.updated_at
FROM use_case_templates uct
LEFT JOIN equipment_database eq ON eq.use_case_template_id = uct.id AND eq.is_active = true
WHERE uct.is_active = true
GROUP BY uct.id
ORDER BY uct.display_order;

COMMENT ON VIEW v_use_case_templates_summary IS 'Summary view of active templates with equipment counts';


-- View: Popular Templates
CREATE OR REPLACE VIEW v_popular_use_cases AS
SELECT 
    slug,
    name,
    category,
    times_used,
    times_saved,
    avg_rating,
    (times_used * 0.5 + times_saved * 1.0 + avg_rating * 10) as popularity_score
FROM use_case_templates
WHERE is_active = true
ORDER BY popularity_score DESC
LIMIT 10;

COMMENT ON VIEW v_popular_use_cases IS 'Top 10 most popular use case templates';


-- ============================================================================
-- SEED DATA (Optional - run after migration)
-- ============================================================================

-- This will be populated by the migration service from useCaseTemplates.ts
-- Example structure for reference:

/*
INSERT INTO use_case_templates (
    slug, name, description, icon, category, required_tier,
    power_profile, financial_params, custom_questions,
    recommended_applications, display_order, version
) VALUES (
    'car-wash',
    'Car Wash',
    'Car washes have high peak demand from wash bays, water heaters, and vacuum systems. BESS can significantly reduce demand charges.',
    '🚗',
    'commercial',
    'free',
    '{
        "typicalLoadKw": 38,
        "peakLoadKw": 53,
        "profileType": "peaked",
        "dailyOperatingHours": 12,
        "peakHoursStart": "10:00",
        "peakHoursEnd": "18:00",
        "operatesWeekends": true,
        "seasonalVariation": 1.2
    }'::jsonb,
    '{
        "demandChargeSensitivity": 1.3,
        "energyCostMultiplier": 1.0,
        "typicalSavingsPercent": 25,
        "roiAdjustmentFactor": 0.95,
        "peakDemandPenalty": 1.2
    }'::jsonb,
    '[
        {
            "id": "num_bays",
            "question": "How many wash bays do you have?",
            "type": "number",
            "default": 4,
            "unit": "bays",
            "impactType": "power_scaling"
        }
    ]'::jsonb,
    ARRAY['peak_shaving', 'demand_response'],
    1,
    '1.0.0'
);
*/


-- ============================================================================
-- GRANTS (Adjust based on your security model)
-- ============================================================================

-- Grant read access to authenticated users
GRANT SELECT ON use_case_templates TO authenticated;
GRANT SELECT ON equipment_database TO authenticated;
GRANT SELECT ON v_use_case_templates_summary TO authenticated;
GRANT SELECT ON v_popular_use_cases TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_use_case_with_equipment TO authenticated;
GRANT EXECUTE ON FUNCTION increment_template_usage TO authenticated;
GRANT EXECUTE ON FUNCTION add_template_rating TO authenticated;


-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Use Case Templates & Equipment Database schema created successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '   1. Run migration service to populate from useCaseTemplates.ts';
    RAISE NOTICE '   2. Verify data with: SELECT * FROM v_use_case_templates_summary;';
    RAISE NOTICE '   3. Update frontend to use dataIntegrationService.ts';
    RAISE NOTICE '   4. Test with: SELECT * FROM get_use_case_with_equipment(''car-wash'');';
END $$;
