-- =============================================================================
-- QUICK FIX: Add Hotel Baseline Configuration
-- Run this in Supabase SQL Editor to fix the 2MW fallback issue
-- Date: November 11, 2025
-- =============================================================================

-- Step 1: Ensure hotel use case exists
INSERT INTO use_cases (slug, name, category, description, icon, required_tier, is_active, display_order)
VALUES 
    ('hotel', 'Hotel & Resort', 'commercial', 'Hotels, motels, resorts with guest rooms', '🏨', 'free', true, 10)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    is_active = true;

-- Step 2: Delete any existing hotel configurations first (to avoid duplicates)
DELETE FROM use_case_configurations
WHERE use_case_id IN (SELECT id FROM use_cases WHERE slug = 'hotel');

-- Step 3: Add hotel baseline configuration (440kW for 150 rooms = 2.93 kW/room)
INSERT INTO use_case_configurations (
    use_case_id,
    config_name,
    is_default,
    typical_load_kw,
    peak_load_kw,
    base_load_kw,
    profile_type,
    daily_operating_hours,
    load_factor,
    recommended_duration_hours,
    preferred_duration_hours,
    typical_savings_percent,
    demand_charge_sensitivity
)
SELECT 
    uc.id,
    'Standard Hotel (150 rooms)',
    true,               -- is_default
    440.0,              -- 440 kW baseline for 150 rooms (2.93 kW per room)
    550.0,              -- 25% peak factor
    350.0,              -- base load (80% of typical)
    'peaked',           -- Hotels have peak periods
    24,                 -- 24/7 operation
    0.80,               -- 80% load factor
    4.0,                -- recommended duration
    4.0,                -- preferred duration
    25.00,              -- 25% typical savings
    '1.25'              -- Sensitive to demand charges (stored as varchar)
FROM use_cases uc
WHERE uc.slug = 'hotel';

-- Step 4: Verify the configuration
SELECT 
    uc.slug,
    uc.name,
    ucc.config_name,
    ucc.typical_load_kw as baseline_kw,
    ucc.preferred_duration_hours as duration_hrs,
    ucc.load_factor,
    CASE 
        WHEN ucc.is_default THEN 'YES' 
        ELSE 'NO' 
    END as is_default
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id
WHERE uc.slug = 'hotel';
-- Expected output:
-- slug  | name           | config_name                  | baseline_kw | duration_hrs | load_factor | is_default
-- hotel | Hotel & Resort | Standard Hotel (150 rooms)   | 440         | 4            | 0.80        | YES

-- =============================================================================
-- HOW THE CALCULATION WILL WORK:
-- =============================================================================
-- 
-- baselineService.ts will query this data and calculate:
-- 
-- For 100-room hotel:
--   scale = 100 / 100 = 1.0
--   basePowerMW = (440 / 1000) * 1.0 = 0.44 MW
-- 
-- But we need: (440 kW / 150 rooms) * 100 rooms = 293 kW = 0.293 MW
-- 
-- The issue is that baselineService doesn't know 150 is the reference size!
-- We need to fix the calculation in baselineService.ts
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Hotel baseline configuration added!';
    RAISE NOTICE '⚠️  Note: baselineService.ts still needs scale calculation fix';
    RAISE NOTICE 'Current: (440 kW / 1000) * scale';
    RAISE NOTICE 'Needed: (440 kW / 150 rooms) * actual_rooms / 1000';
END $$;
