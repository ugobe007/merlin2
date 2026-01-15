-- ============================================================================
-- BUSINESS SIZE TIERS MIGRATION
-- ============================================================================
-- Created: January 14, 2026
-- Purpose: Add business size tiers table for dynamic questionnaire depth
--          Supports conversational wizard flow with adaptive question count
-- 
-- This enables:
-- - Dynamic questionnaire length based on business size
-- - Appropriate question depth (minimal for small, detailed for enterprise)
-- - Validation of user inputs against typical ranges
-- - Better UX by respecting user's time
--
-- SSOT Compliant: These thresholds inform wizard behavior, not calculations
-- ============================================================================

-- ============================================================================
-- CREATE BUSINESS SIZE TIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_size_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Industry reference
  industry_slug TEXT NOT NULL,
  
  -- Tier identification
  tier TEXT NOT NULL CHECK (tier IN ('small', 'medium', 'large', 'enterprise')),
  tier_name TEXT NOT NULL,  -- Display name: "Small Hotel", "Medium-Size Hotel", etc.
  
  -- Size thresholds
  size_field TEXT NOT NULL,  -- Which field to check: 'roomCount', 'squareFootage', 'bayCount'
  min_value INTEGER,         -- NULL = no minimum (e.g., 0 for small tier)
  max_value INTEGER,         -- NULL = no maximum (e.g., for enterprise tier)
  
  -- Questionnaire behavior
  questionnaire_depth TEXT DEFAULT 'standard' CHECK (questionnaire_depth IN ('minimal', 'standard', 'detailed')),
  target_question_count INTEGER DEFAULT 15,  -- Target number of questions to show
  
  -- Display
  description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(industry_slug, tier)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_business_size_tiers_industry ON business_size_tiers(industry_slug);
CREATE INDEX IF NOT EXISTS idx_business_size_tiers_active ON business_size_tiers(is_active) WHERE is_active = true;

-- ============================================================================
-- HOTEL SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('hotel', 'small', 'Small Hotel', 'roomCount', 1, 50, 'minimal', 8, 'Boutique hotels, B&Bs, small inns (1-50 rooms)', 1),
('hotel', 'medium', 'Medium Hotel', 'roomCount', 51, 150, 'standard', 15, 'Standard hotels, limited service (51-150 rooms)', 2),
('hotel', 'large', 'Large Hotel', 'roomCount', 151, 400, 'detailed', 22, 'Full-service hotels, resorts (151-400 rooms)', 3),
('hotel', 'enterprise', 'Resort / Casino Hotel', 'roomCount', 401, NULL, 'detailed', 27, 'Casino resorts, convention hotels (400+ rooms)', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- CAR WASH SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('car_wash', 'small', 'Single Location', 'bayCount', 1, 4, 'minimal', 8, 'Single location, 1-4 bays or 1 tunnel', 1),
('car_wash', 'medium', 'Multi-Bay Operation', 'bayCount', 5, 8, 'standard', 12, 'Multi-bay or single high-volume tunnel', 2),
('car_wash', 'large', 'Multi-Location', 'bayCount', 9, 20, 'detailed', 18, 'Multiple locations, regional chain', 3),
('car_wash', 'enterprise', 'Regional Chain', 'bayCount', 21, NULL, 'detailed', 22, 'Large regional or national chain', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- EV CHARGING SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('ev_charging', 'small', 'Small Station', 'totalChargers', 1, 8, 'minimal', 10, 'Destination charging, small public site', 1),
('ev_charging', 'medium', 'Medium Station', 'totalChargers', 9, 24, 'standard', 15, 'Standard public charging station', 2),
('ev_charging', 'large', 'Large Station', 'totalChargers', 25, 50, 'detailed', 20, 'Highway corridor, fleet depot', 3),
('ev_charging', 'enterprise', 'Charging Hub', 'totalChargers', 51, NULL, 'detailed', 25, 'Mega charging hub, large fleet operation', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- DATA CENTER SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('data_center', 'small', 'Edge / Small DC', 'squareFootage', 500, 5000, 'minimal', 10, 'Edge facility, server room', 1),
('data_center', 'medium', 'Enterprise DC', 'squareFootage', 5001, 50000, 'standard', 16, 'Enterprise or small colocation', 2),
('data_center', 'large', 'Large Colocation', 'squareFootage', 50001, 200000, 'detailed', 22, 'Large colocation facility', 3),
('data_center', 'enterprise', 'Hyperscale', 'squareFootage', 200001, NULL, 'detailed', 27, 'Hyperscale cloud facility', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- MANUFACTURING SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('manufacturing', 'small', 'Small Facility', 'squareFootage', 5000, 30000, 'minimal', 10, 'Small workshop, light manufacturing', 1),
('manufacturing', 'medium', 'Medium Facility', 'squareFootage', 30001, 100000, 'standard', 16, 'Standard manufacturing plant', 2),
('manufacturing', 'large', 'Large Plant', 'squareFootage', 100001, 500000, 'detailed', 22, 'Large manufacturing facility', 3),
('manufacturing', 'enterprise', 'Mega Facility', 'squareFootage', 500001, NULL, 'detailed', 27, 'Automotive plant, mega facility', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- HOSPITAL SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('hospital', 'small', 'Critical Access', 'bedCount', 1, 25, 'minimal', 10, 'Critical access, rural hospital', 1),
('hospital', 'medium', 'Community Hospital', 'bedCount', 26, 150, 'standard', 16, 'Community hospital', 2),
('hospital', 'large', 'Regional Medical', 'bedCount', 151, 400, 'detailed', 22, 'Regional medical center', 3),
('hospital', 'enterprise', 'Academic Medical', 'bedCount', 401, NULL, 'detailed', 27, 'Academic medical center, large system', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- RETAIL SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('retail', 'small', 'Small Store', 'squareFootage', 1000, 10000, 'minimal', 8, 'Small retail, boutique', 1),
('retail', 'medium', 'Medium Store', 'squareFootage', 10001, 50000, 'standard', 14, 'Standard retail store', 2),
('retail', 'large', 'Big Box', 'squareFootage', 50001, 150000, 'detailed', 20, 'Big box retailer', 3),
('retail', 'enterprise', 'Shopping Center', 'squareFootage', 150001, NULL, 'detailed', 25, 'Shopping center, mall', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- WAREHOUSE SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('warehouse', 'small', 'Small Warehouse', 'squareFootage', 10000, 50000, 'minimal', 8, 'Small storage, local distribution', 1),
('warehouse', 'medium', 'Medium DC', 'squareFootage', 50001, 200000, 'standard', 14, 'Regional distribution center', 2),
('warehouse', 'large', 'Large DC', 'squareFootage', 200001, 750000, 'detailed', 20, 'Large fulfillment center', 3),
('warehouse', 'enterprise', 'Mega Fulfillment', 'squareFootage', 750001, NULL, 'detailed', 25, 'Mega fulfillment, Amazon-scale', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- OFFICE SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('office', 'small', 'Small Office', 'squareFootage', 2000, 20000, 'minimal', 8, 'Small office, professional services', 1),
('office', 'medium', 'Medium Office', 'squareFootage', 20001, 100000, 'standard', 14, 'Mid-size office building', 2),
('office', 'large', 'Large Office', 'squareFootage', 100001, 500000, 'detailed', 20, 'Large office tower', 3),
('office', 'enterprise', 'Corporate Campus', 'squareFootage', 500001, NULL, 'detailed', 25, 'Corporate campus, multiple buildings', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- RESTAURANT SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('restaurant', 'small', 'Single Location', 'squareFootage', 1000, 3000, 'minimal', 8, 'Single restaurant location', 1),
('restaurant', 'medium', 'Multi-Unit', 'squareFootage', 3001, 6000, 'standard', 12, 'Multiple locations, regional', 2),
('restaurant', 'large', 'Regional Chain', 'squareFootage', 6001, 10000, 'detailed', 16, 'Regional restaurant chain', 3),
('restaurant', 'enterprise', 'National Chain', 'squareFootage', 10001, NULL, 'detailed', 20, 'National chain, franchisee', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- COLLEGE SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('college', 'small', 'Small College', 'studentCount', 500, 3000, 'minimal', 10, 'Small college, community college', 1),
('college', 'medium', 'Medium University', 'studentCount', 3001, 15000, 'standard', 16, 'Medium-size university', 2),
('college', 'large', 'Large University', 'studentCount', 15001, 40000, 'detailed', 22, 'Large state university', 3),
('college', 'enterprise', 'Mega University', 'studentCount', 40001, NULL, 'detailed', 27, 'Major research university', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- TRUCK STOP SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('heavy_duty_truck_stop', 'small', 'Basic Stop', 'parkingSpaces', 10, 30, 'minimal', 8, 'Basic truck stop, fuel only', 1),
('heavy_duty_truck_stop', 'medium', 'Travel Center', 'parkingSpaces', 31, 100, 'standard', 14, 'Travel center with amenities', 2),
('heavy_duty_truck_stop', 'large', 'Large Plaza', 'parkingSpaces', 101, 250, 'detailed', 18, 'Large travel plaza, full service', 3),
('heavy_duty_truck_stop', 'enterprise', 'Mega Hub', 'parkingSpaces', 251, NULL, 'detailed', 22, 'Major trucking hub, EV charging', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- AGRICULTURE SIZE TIERS
-- ============================================================================
INSERT INTO business_size_tiers (industry_slug, tier, tier_name, size_field, min_value, max_value, questionnaire_depth, target_question_count, description, display_order) VALUES
('agriculture', 'small', 'Small Farm', 'acres', 50, 500, 'minimal', 8, 'Small family farm', 1),
('agriculture', 'medium', 'Medium Farm', 'acres', 501, 2000, 'standard', 14, 'Medium commercial farm', 2),
('agriculture', 'large', 'Large Farm', 'acres', 2001, 10000, 'detailed', 18, 'Large agricultural operation', 3),
('agriculture', 'enterprise', 'Agribusiness', 'acres', 10001, NULL, 'detailed', 22, 'Major agribusiness operation', 4)
ON CONFLICT (industry_slug, tier) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  min_value = EXCLUDED.min_value,
  max_value = EXCLUDED.max_value,
  questionnaire_depth = EXCLUDED.questionnaire_depth,
  target_question_count = EXCLUDED.target_question_count,
  updated_at = NOW();

-- ============================================================================
-- ADD QUESTION_TIER COLUMN TO CUSTOM_QUESTIONS
-- ============================================================================
-- This enables filtering questions by tier (essential, standard, detailed)

ALTER TABLE custom_questions 
ADD COLUMN IF NOT EXISTS question_tier TEXT DEFAULT 'standard' 
  CHECK (question_tier IN ('essential', 'standard', 'detailed'));

-- Add comment
COMMENT ON COLUMN custom_questions.question_tier IS 'Question tier for dynamic questionnaire: essential (always shown), standard (medium+ businesses), detailed (large+ businesses)';

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_business_size_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_size_tiers_updated_at_trigger ON business_size_tiers;
CREATE TRIGGER business_size_tiers_updated_at_trigger
  BEFORE UPDATE ON business_size_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_business_size_tiers_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Get Business Size Tier
-- ============================================================================
CREATE OR REPLACE FUNCTION get_business_size_tier(
  p_industry_slug TEXT,
  p_size_value INTEGER
) RETURNS TABLE (
  tier TEXT,
  tier_name TEXT,
  questionnaire_depth TEXT,
  target_question_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bst.tier,
    bst.tier_name,
    bst.questionnaire_depth,
    bst.target_question_count
  FROM business_size_tiers bst
  WHERE bst.industry_slug = p_industry_slug
    AND bst.is_active = true
    AND (bst.min_value IS NULL OR p_size_value >= bst.min_value)
    AND (bst.max_value IS NULL OR p_size_value <= bst.max_value)
  ORDER BY bst.display_order DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  tier_count INTEGER;
  industry_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tier_count FROM business_size_tiers;
  SELECT COUNT(DISTINCT industry_slug) INTO industry_count FROM business_size_tiers;
  RAISE NOTICE '✅ Created business_size_tiers table with % tiers across % industries', tier_count, industry_count;
END $$;
