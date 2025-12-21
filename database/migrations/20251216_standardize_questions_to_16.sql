-- =============================================================================
-- STANDARDIZE CUSTOM QUESTIONS TO 16-18 QUESTIONS
-- December 16, 2025
-- 
-- Goal: All use cases should have 16-18 standard questions
-- Extra questions (>18) should be marked as "advanced" for collapsible sections
-- 
-- Standard 16-Question Template:
-- 1. Industry-specific primary (roomCount, bedCount, bayCount, etc.)
-- 2. Square footage
-- 3. Grid capacity
-- 4. Monthly electric bill
-- 5. Operating hours
-- 6. Peak demand (optional, some industries calculate from other fields)
-- 7. Facility subtype (if applicable)
-- 8. Equipment tier
-- 9. Has existing solar
-- 10. Existing solar capacity (kW)
-- 11. Wants solar
-- 12. Has existing EV charging
-- 13. Existing EV chargers count
-- 14. Wants EV charging
-- 15. Needs backup power
-- 16. Primary BESS application / Energy goals
-- 
-- Advanced Questions (17-18+): Industry-specific detailed questions
-- =============================================================================

-- Add a new column to mark advanced questions (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_questions' 
        AND column_name = 'is_advanced'
    ) THEN
        ALTER TABLE custom_questions ADD COLUMN is_advanced BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_advanced column to custom_questions';
    ELSE
        RAISE NOTICE 'Column is_advanced already exists';
    END IF;
END $$;

-- =============================================================================
-- STEP 1: IDENTIFY AND MARK ADVANCED QUESTIONS
-- Keep advanced questions for: data-center, hospital (they make sense)
-- Mark as advanced for: agricultural, casino, ev-charging, gas-station, 
--                       government, indoor-farm, microgrid, residential, 
--                       retail, shopping-center (18 questions = 2 advanced)
-- Remove/consolidate extra for: manufacturing (21 → 18), warehouse (19 → 18)
-- =============================================================================

-- =============================================================================
-- STEP 1B: MARK ADVANCED QUESTIONS (CORRECTED)
-- =============================================================================

-- Data Center: Keep questions 1-18 as standard, mark 19-21 as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center')
  AND display_order >= 19;

-- Hospital: Keep questions 1-18 as standard, mark 19-22 as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital')
  AND display_order >= 19;

-- Manufacturing: Keep questions 1-18 as standard, mark 19-21 as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing')
  AND display_order >= 19;

-- Warehouse: Keep questions 1-18 as standard, mark 19+ as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse')
  AND display_order >= 19;

-- Use cases with exactly 18 questions: Keep 1-16 as standard, mark 17-18 as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id IN (
    SELECT id FROM use_cases WHERE slug IN (
        'agricultural', 'casino', 'ev-charging', 'gas-station', 
        'government', 'indoor-farm', 'microgrid', 'residential', 
        'retail', 'shopping-center', 'car-wash'
    )
)
  AND display_order >= 17
  AND is_advanced IS NOT true; -- Only update if not already marked

-- =============================================================================
-- STEP 2: FILL MISSING QUESTIONS FOR USE CASES WITH < 16 QUESTIONS
-- =============================================================================

-- APARTMENT (has 10, needs 6 more)
DO $$
DECLARE
    v_apartment_id UUID;
BEGIN
    SELECT id INTO v_apartment_id FROM use_cases WHERE slug = 'apartment' LIMIT 1;
    
    IF v_apartment_id IS NOT NULL THEN
        -- Check and add missing questions
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_apartment_id, 'Operating hours per day', 'operatingHours', 'number', '24', 8, 24, false, 'Hours of active operations', 11, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_apartment_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_apartment_id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 12, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_apartment_id AND field_name = 'existingSolarKW');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_apartment_id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'false', false, 'We will size solar in a later step', 13, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_apartment_id AND field_name = 'wantsSolar');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_apartment_id, 'Existing EV charging stations', 'existingEVChargers', 'number', '0', 0, 100, false, 'Current EV charging stations', 14, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_apartment_id AND field_name = 'existingEVChargers');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_apartment_id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', false, 'We will size EV charging in a later step', 15, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_apartment_id AND field_name = 'wantsEVCharging');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_apartment_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false, 
               '["peak_shaving", "arbitrage", "resilience", "microgrid"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_apartment_id AND field_name = 'primaryBESSApplication');
        
        RAISE NOTICE 'Added missing questions for apartment';
    END IF;
END $$;

-- CAR-WASH (has 11, needs 5 more)
DO $$
DECLARE
    v_carwash_id UUID;
BEGIN
    SELECT id INTO v_carwash_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
    
    IF v_carwash_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_carwash_id, 'Peak power demand (kW)', 'peakDemandKW', 'number', '150', 30, 500, false, 'Maximum power during peak operations', 5, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'peakDemandKW');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_carwash_id, 'Operating hours per day', 'operatingHours', 'number', '12', 6, 24, false, 'Hours open for business', 6, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_carwash_id, 'Do you have vacuum stations?', 'hasVacuums', 'boolean', 'true', false, 'Self-service vacuum area', 7, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'hasVacuums');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_carwash_id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '800', 0, 10000, false, 'Peak demand portion of electric bill', 8, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'monthlyDemandCharges');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_carwash_id, 'Existing EV charging stations', 'existingEVChargers', 'number', '0', 0, 20, false, 'Current EV charging stations', 12, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'existingEVChargers');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_carwash_id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', false, 'We will size EV charging in a later step', 13, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'wantsEVCharging');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_carwash_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false,
               '["peak_shaving", "arbitrage", "resilience"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_carwash_id AND field_name = 'primaryBESSApplication');
        
        RAISE NOTICE 'Added missing questions for car-wash';
    END IF;
END $$;

-- Update display_order for car-wash to ensure proper ordering
UPDATE custom_questions
SET display_order = CASE field_name
    WHEN 'washBays' THEN 1
    WHEN 'squareFeet' THEN 2
    WHEN 'gridCapacityKW' THEN 3
    WHEN 'dailyVehicles' THEN 4
    WHEN 'peakDemandKW' THEN 5
    WHEN 'operatingHours' THEN 6
    WHEN 'hasVacuums' THEN 7
    WHEN 'monthlyDemandCharges' THEN 8
    WHEN 'facilitySubtype' THEN 9
    WHEN 'equipmentTier' THEN 10
    WHEN 'existingSolarKW' THEN 11
    WHEN 'wantsSolar' THEN 12
    WHEN 'existingEVChargers' THEN 13
    WHEN 'wantsEVCharging' THEN 14
    WHEN 'hasDryers' THEN 15
    WHEN 'primaryBESSApplication' THEN 16
    ELSE display_order
END
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- COLD-STORAGE (has 11, needs 5 more)
DO $$
DECLARE
    v_coldstorage_id UUID;
BEGIN
    SELECT id INTO v_coldstorage_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
    
    IF v_coldstorage_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_coldstorage_id, 'Operating hours per day', 'operatingHours', 'number', '24', 8, 24, false, 'Hours of active operations', 6, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_coldstorage_id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 12, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'existingSolarKW');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_coldstorage_id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'false', false, 'We will size solar in a later step', 13, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'wantsSolar');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_coldstorage_id, 'Existing EV charging stations', 'existingEVChargers', 'number', '0', 0, 50, false, 'Current EV charging stations for fleet vehicles', 14, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'existingEVChargers');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_coldstorage_id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', false, 'We will size EV charging in a later step', 15, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'wantsEVCharging');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_coldstorage_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false,
               '["peak_shaving", "arbitrage", "resilience"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_coldstorage_id AND field_name = 'primaryBESSApplication');
        
        RAISE NOTICE 'Added missing questions for cold-storage';
    END IF;
END $$;

-- COLLEGE (has 11, needs 5 more)
DO $$
DECLARE
    v_college_id UUID;
BEGIN
    SELECT id INTO v_college_id FROM use_cases WHERE slug = 'college' LIMIT 1;
    
    IF v_college_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Operating hours per day', 'operatingHours', 'number', '16', 8, 24, false, 'Hours of active operations', 6, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation (0 if none)', 12, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'existingSolarKW');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'false', false, 'We will size solar in a later step', 13, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'wantsSolar');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Existing EV charging stations', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current EV charging stations on campus', 14, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'existingEVChargers');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', false, 'We will size EV charging in a later step', 15, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'wantsEVCharging');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_college_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false,
               '["peak_shaving", "arbitrage", "resilience", "microgrid"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'primaryBESSApplication');
        
        -- Add one more question to reach 16 (needs backup power)
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_college_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for labs, research facilities, and critical infrastructure', 17, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_college_id AND field_name = 'needsBackupPower');
        
        RAISE NOTICE 'Added missing questions for college';
    END IF;
END $$;

-- OFFICE (has 12, needs 4 more)
DO $$
DECLARE
    v_office_id UUID;
BEGIN
    SELECT id INTO v_office_id FROM use_cases WHERE slug = 'office' LIMIT 1;
    
    IF v_office_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_office_id, 'Operating hours per day', 'operatingHours', 'number', '10', 4, 24, false, 'Hours of active operations', 6, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_office_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_office_id, 'Existing EV charging stations', 'existingEVChargers', 'number', '0', 0, 100, false, 'Current EV charging stations', 14, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_office_id AND field_name = 'existingEVChargers');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_office_id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', false, 'We will size EV charging in a later step', 15, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_office_id AND field_name = 'wantsEVCharging');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_office_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false,
               '["peak_shaving", "arbitrage", "resilience"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_office_id AND field_name = 'primaryBESSApplication');
        
        -- Add one more question to reach 16 (needs backup power)
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced)
        SELECT v_office_id, 'Do you need backup power for critical systems?', 'needsBackupPower', 'boolean', 'false', false, 'Backup power for servers, elevators, and essential systems', 17, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_office_id AND field_name = 'needsBackupPower');
        
        RAISE NOTICE 'Added missing questions for office';
    END IF;
END $$;

-- AIRPORT (has 14, needs 2 more)
DO $$
DECLARE
    v_airport_id UUID;
BEGIN
    SELECT id INTO v_airport_id FROM use_cases WHERE slug = 'airport' LIMIT 1;
    
    IF v_airport_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_airport_id, 'Operating hours per day', 'operatingHours', 'number', '24', 12, 24, false, 'Hours of active operations', 7, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_airport_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_airport_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false,
               '["peak_shaving", "arbitrage", "resilience", "microgrid"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_airport_id AND field_name = 'primaryBESSApplication');
        
        RAISE NOTICE 'Added missing questions for airport';
    END IF;
END $$;

-- HOTEL (has 14, needs 2 more)
DO $$
DECLARE
    v_hotel_id UUID;
BEGIN
    SELECT id INTO v_hotel_id FROM use_cases WHERE slug = 'hotel' LIMIT 1;
    
    IF v_hotel_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, is_advanced)
        SELECT v_hotel_id, 'Operating hours per day', 'operatingHours', 'number', '24', 12, 24, false, 'Hours of active operations', 7, false
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'operatingHours');
        
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
        SELECT v_hotel_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'Main use case for battery storage', 16, false,
               '["peak_shaving", "arbitrage", "resilience"]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_hotel_id AND field_name = 'primaryBESSApplication');
        
        RAISE NOTICE 'Added missing questions for hotel';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: HANDLE MANUFACTURING AND WAREHOUSE EXTRA QUESTIONS
-- Manufacturing: 21 questions → consolidate to 18 (mark 3 as advanced/remove duplicates)
-- Warehouse: 19 questions → consolidate to 18 (mark 1 as advanced)
-- =============================================================================

-- MANUFACTURING: Mark questions 19-21 as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing')
  AND display_order > 18;

-- WAREHOUSE: Mark question 19 as advanced
UPDATE custom_questions
SET is_advanced = true
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse')
  AND display_order > 18;

-- =============================================================================
-- STEP 4: ENSURE ALL USE CASES HAVE PRIMARYBESSAPPLICATION (if missing)
-- =============================================================================

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, is_advanced, options)
SELECT 
    uc.id,
    'Primary energy goal',
    'primaryBESSApplication',
    'select',
    'peak_shaving',
    false,
    'Main use case for battery storage',
    16,
    false,
    CASE 
        WHEN uc.slug IN ('data-center', 'hospital', 'airport', 'college', 'microgrid') 
        THEN '["peak_shaving", "arbitrage", "resilience", "microgrid"]'::jsonb
        ELSE '["peak_shaving", "arbitrage", "resilience"]'::jsonb
    END
FROM use_cases uc
WHERE uc.is_active = true
  AND NOT EXISTS (
      SELECT 1 FROM custom_questions cq 
      WHERE cq.use_case_id = uc.id 
      AND cq.field_name = 'primaryBESSApplication'
  );

-- =============================================================================
-- STEP 5: FINAL VALIDATION - REORDER ALL QUESTIONS TO ENSURE PROPER SEQUENCING
-- =============================================================================

-- This ensures display_order is sequential and advanced questions come after standard ones
DO $$
DECLARE
    v_use_case RECORD;
    v_standard_count INT;
    v_advanced_count INT;
    v_max_standard_order INT;
BEGIN
    FOR v_use_case IN SELECT id, slug FROM use_cases WHERE is_active = true
    LOOP
        -- Count standard vs advanced questions
        SELECT COUNT(*) INTO v_standard_count
        FROM custom_questions
        WHERE use_case_id = v_use_case.id 
          AND (is_advanced = false OR is_advanced IS NULL);
        
        SELECT COUNT(*) INTO v_advanced_count
        FROM custom_questions
        WHERE use_case_id = v_use_case.id 
          AND is_advanced = true;
        
        -- Get max display_order for standard questions
        SELECT COALESCE(MAX(display_order), 0) INTO v_max_standard_order
        FROM custom_questions
        WHERE use_case_id = v_use_case.id
          AND (is_advanced = false OR is_advanced IS NULL);
        
        -- Reorder standard questions (1 to v_standard_count)
        UPDATE custom_questions
        SET display_order = subq.new_order
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, field_name) as new_order
            FROM custom_questions
            WHERE use_case_id = v_use_case.id
              AND (is_advanced = false OR is_advanced IS NULL)
        ) subq
        WHERE custom_questions.id = subq.id;
        
        -- Reorder advanced questions (start after standard questions)
        UPDATE custom_questions
        SET display_order = subq.new_order
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, field_name) + v_max_standard_order as new_order
            FROM custom_questions
            WHERE use_case_id = v_use_case.id
              AND is_advanced = true
        ) subq
        WHERE custom_questions.id = subq.id;
        
        RAISE NOTICE 'Reordered questions for %: % standard (orders 1-%), % advanced (orders %+)', 
            v_use_case.slug, v_standard_count, v_standard_count, v_advanced_count, v_max_standard_order + 1;
    END LOOP;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT 
    uc.slug,
    uc.name,
    COUNT(CASE WHEN cq.is_advanced = false OR cq.is_advanced IS NULL THEN 1 END) as standard_questions,
    COUNT(CASE WHEN cq.is_advanced = true THEN 1 END) as advanced_questions,
    COUNT(cq.id) as total_questions
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY uc.slug;

