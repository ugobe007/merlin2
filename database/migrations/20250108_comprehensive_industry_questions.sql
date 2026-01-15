-- =============================================================================
-- COMPREHENSIVE INDUSTRY QUESTIONS SEED
-- January 2025 - Ensures ALL industries have 16 questions
-- =============================================================================
-- 
-- This migration adds a standardized set of questions to all industries.
-- Each industry gets a primary industry-specific question plus 15 common questions.
--
-- Run this in Supabase SQL Editor to populate missing questions.
-- =============================================================================

-- First, let's check current question counts
DO $$
DECLARE
    v_rec RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT QUESTION COUNTS ===';
    FOR v_rec IN 
        SELECT uc.slug, uc.name, COUNT(cq.id) as q_count
        FROM use_cases uc
        LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
        WHERE uc.is_active = true
        GROUP BY uc.slug, uc.name
        ORDER BY q_count, uc.name
    LOOP
        RAISE NOTICE '% (%) - % questions', v_rec.name, v_rec.slug, v_rec.q_count;
    END LOOP;
END $$;

-- =============================================================================
-- COMMON QUESTIONS TEMPLATE
-- These are the 15 common questions that every industry should have
-- =============================================================================

-- Helper function to add standard questions to a use case
CREATE OR REPLACE FUNCTION add_standard_questions(v_use_case_id UUID, v_primary_field TEXT, v_primary_display_order INT)
RETURNS void AS $$
BEGIN
    -- Q2: Square footage (if not primary)
    IF v_primary_field != 'squareFeet' THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_use_case_id, 'Total facility square footage', 'squareFeet', 'number', '50000', 1000, 5000000, true, 'Total building square footage', v_primary_display_order + 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'squareFeet');
    END IF;

    -- Q3: Grid capacity
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
    SELECT v_use_case_id, 'Current grid connection capacity', 'gridCapacity', 'select', 'medium', true, 'Your electrical service size', 3, 'Power & Grid',
        '[{"value": "small", "label": "Under 200 kW", "description": "Small commercial service"},
          {"value": "medium", "label": "200-500 kW", "description": "Medium commercial service"},
          {"value": "large", "label": "500 kW - 2 MW", "description": "Large commercial service"},
          {"value": "utility", "label": "Over 2 MW", "description": "Utility-scale connection"}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'gridCapacity');

    -- Q4: Monthly electric bill
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
    SELECT v_use_case_id, 'Monthly electricity bill', 'monthlyElectricBill', 'select', '15000', true, 'Average monthly electricity cost', 4, 'Power & Grid',
        '[{"value": "3000", "label": "$1,000 - $5,000/mo"},
          {"value": "10000", "label": "$5,000 - $15,000/mo"},
          {"value": "25000", "label": "$15,000 - $35,000/mo"},
          {"value": "50000", "label": "$35,000 - $75,000/mo"},
          {"value": "100000", "label": "$75,000 - $150,000/mo"},
          {"value": "200000", "label": "Over $150,000/mo"}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'monthlyElectricBill');

    -- Q5: Operating hours
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Operating hours per day', 'operatingHours', 'number', '12', 4, 24, true, 'Hours facility is actively operating', 5, 'Operations'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'operatingHours');

    -- Q6: Peak demand
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
    SELECT v_use_case_id, 'Peak power demand', 'peakDemand', 'select', 'medium', false, 'Highest power draw during operations', 6, 'Power & Grid',
        '[{"value": "low", "label": "Low (under 100 kW)", "description": "Minimal equipment load"},
          {"value": "medium", "label": "Medium (100-500 kW)", "description": "Standard commercial operations"},
          {"value": "high", "label": "High (500 kW - 2 MW)", "description": "Heavy equipment or HVAC load"},
          {"value": "very_high", "label": "Very High (over 2 MW)", "description": "Industrial or data center level"}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'peakDemand');

    -- Q7: Equipment tier
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
    SELECT v_use_case_id, 'Equipment efficiency tier', 'equipmentTier', 'select', 'standard', false, 'Age and efficiency of major equipment', 7, 'Equipment',
        '[{"value": "legacy", "label": "Legacy (15+ years old)", "description": "Older, less efficient equipment"},
          {"value": "standard", "label": "Standard (5-15 years)", "description": "Average efficiency"},
          {"value": "modern", "label": "Modern (under 5 years)", "description": "High-efficiency equipment"},
          {"value": "premium", "label": "Premium/LEED", "description": "Best-in-class efficiency"}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'equipmentTier');

    -- Q8: HVAC type
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
    SELECT v_use_case_id, 'Primary HVAC system', 'hvacType', 'select', 'central_ac', false, 'Main heating and cooling system', 8, 'Equipment',
        '[{"value": "central_ac", "label": "Central AC/Heating"},
          {"value": "rooftop", "label": "Rooftop Units (RTUs)"},
          {"value": "chiller", "label": "Chiller System"},
          {"value": "split", "label": "Split Systems"},
          {"value": "vrf", "label": "VRF/Mini-Splits"}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'hvacType');

    -- Q9: Has existing solar
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Do you have existing solar?', 'hasExistingSolar', 'boolean', 'false', false, 'Solar panels currently installed', 9, 'Solar & Renewables'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'hasExistingSolar');

    -- Q10: Existing solar capacity
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation size (0 if none)', 10, 'Solar & Renewables'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'existingSolarKW');

    -- Q11: Interested in solar
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Interested in adding solar?', 'wantsSolar', 'boolean', 'true', false, 'We can size solar to offset your energy costs', 11, 'Solar & Renewables'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'wantsSolar');

    -- Q12: Has existing EV chargers
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Do you have EV charging stations?', 'hasExistingEV', 'boolean', 'false', false, 'EV chargers currently installed', 12, 'Solar & Renewables'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'hasExistingEV');

    -- Q13: Existing EV charger count
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Number of existing EV chargers', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current EV charging stations (0 if none)', 13, 'Solar & Renewables'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'existingEVChargers');

    -- Q14: Interested in EV charging
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', false, 'EV chargers for employees, visitors, or fleet', 14, 'Solar & Renewables'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'wantsEVCharging');

    -- Q15: Needs backup power
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name)
    SELECT v_use_case_id, 'Do you need backup power?', 'needsBackupPower', 'boolean', 'true', false, 'Battery backup for outages and critical loads', 15, 'Power & Grid'
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'needsBackupPower');

    -- Q16: Primary BESS application
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
    SELECT v_use_case_id, 'Primary energy goal', 'primaryBESSApplication', 'select', 'peak_shaving', true, 'Main use case for battery storage', 16, 'Goals',
        '[{"value": "peak_shaving", "label": "Peak Shaving", "icon": "📉", "description": "Reduce demand charges during peak hours"},
          {"value": "arbitrage", "label": "Energy Arbitrage", "icon": "💰", "description": "Buy low, use high - time-of-use optimization"},
          {"value": "resilience", "label": "Backup/Resilience", "icon": "🔋", "description": "Keep critical loads running during outages"},
          {"value": "renewable", "label": "Renewable Integration", "icon": "☀️", "description": "Maximize solar self-consumption"},
          {"value": "demand_response", "label": "Demand Response", "icon": "📊", "description": "Participate in utility programs for revenue"}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_use_case_id AND field_name = 'primaryBESSApplication');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ADD PRIMARY QUESTIONS FOR EACH INDUSTRY
-- =============================================================================

-- HOTEL
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'hotel' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Number of guest rooms', 'roomCount', 'number', '150', 10, 2000, true, 'Total guest rooms in the hotel', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'roomCount');
        PERFORM add_standard_questions(v_id, 'roomCount', 1);
        RAISE NOTICE '✅ Hotel questions added/updated';
    END IF;
END $$;

-- CAR WASH
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'car-wash' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Number of wash bays/tunnels', 'bayCount', 'number', '3', 1, 10, true, 'Total wash bays or tunnel lines', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'bayCount');
        PERFORM add_standard_questions(v_id, 'bayCount', 1);
        RAISE NOTICE '✅ Car Wash questions added/updated';
    END IF;
END $$;

-- HOSPITAL
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'hospital' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Number of licensed beds', 'bedCount', 'number', '200', 10, 2000, true, 'Total licensed bed capacity', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'bedCount');
        PERFORM add_standard_questions(v_id, 'bedCount', 1);
        RAISE NOTICE '✅ Hospital questions added/updated';
    END IF;
END $$;

-- DATA CENTER
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'data-center' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
        SELECT v_id, 'Data center tier level', 'tierLevel', 'select', 'tier3', true, 'Uptime Institute tier classification', 1, 'Facility Basics',
            '[{"value": "tier1", "label": "Tier I (99.671% uptime)"},
              {"value": "tier2", "label": "Tier II (99.741% uptime)"},
              {"value": "tier3", "label": "Tier III (99.982% uptime)"},
              {"value": "tier4", "label": "Tier IV (99.995% uptime)"}]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'tierLevel');
        PERFORM add_standard_questions(v_id, 'tierLevel', 1);
        RAISE NOTICE '✅ Data Center questions added/updated';
    END IF;
END $$;

-- EV CHARGING
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'ev-charging' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
        SELECT v_id, 'Hub size classification', 'hubSize', 'select', 'medium', true, 'Total charging capacity planned', 1, 'Facility Basics',
            '[{"value": "small", "label": "Small Hub (4-30 chargers)"},
              {"value": "medium", "label": "Medium Hub (30-100 chargers)"},
              {"value": "super", "label": "Super Site (100+ chargers)"}]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'hubSize');
        PERFORM add_standard_questions(v_id, 'hubSize', 1);
        RAISE NOTICE '✅ EV Charging questions added/updated';
    END IF;
END $$;

-- MANUFACTURING
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'manufacturing' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Manufacturing floor area (sq ft)', 'manufacturingSqFt', 'number', '100000', 5000, 2000000, true, 'Total manufacturing/production floor space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'manufacturingSqFt');
        PERFORM add_standard_questions(v_id, 'manufacturingSqFt', 1);
        RAISE NOTICE '✅ Manufacturing questions added/updated';
    END IF;
END $$;

-- WAREHOUSE
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'warehouse' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Warehouse floor area (sq ft)', 'warehouseSqFt', 'number', '250000', 10000, 5000000, true, 'Total warehouse floor space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'warehouseSqFt');
        PERFORM add_standard_questions(v_id, 'warehouseSqFt', 1);
        RAISE NOTICE '✅ Warehouse questions added/updated';
    END IF;
END $$;

-- OFFICE
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'office' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Total office space (sq ft)', 'officeSqFt', 'number', '75000', 5000, 1000000, true, 'Total rentable office square footage', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'officeSqFt');
        PERFORM add_standard_questions(v_id, 'officeSqFt', 1);
        RAISE NOTICE '✅ Office questions added/updated';
    END IF;
END $$;

-- RETAIL
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'retail' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Retail floor area (sq ft)', 'retailSqFt', 'number', '50000', 2000, 500000, true, 'Total retail floor space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'retailSqFt');
        PERFORM add_standard_questions(v_id, 'retailSqFt', 1);
        RAISE NOTICE '✅ Retail questions added/updated';
    END IF;
END $$;

-- COLLEGE
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'college' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Student enrollment', 'studentCount', 'number', '15000', 500, 100000, true, 'Total full-time equivalent students', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'studentCount');
        PERFORM add_standard_questions(v_id, 'studentCount', 1);
        RAISE NOTICE '✅ College questions added/updated';
    END IF;
END $$;

-- APARTMENT
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'apartment' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Number of residential units', 'unitCount', 'number', '100', 10, 1000, true, 'Total units in the complex', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'unitCount');
        PERFORM add_standard_questions(v_id, 'unitCount', 1);
        RAISE NOTICE '✅ Apartment questions added/updated';
    END IF;
END $$;

-- AIRPORT
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'airport' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Annual passengers (millions)', 'annualPassengers', 'number', '5', 0.5, 100, true, 'Total annual passenger traffic', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'annualPassengers');
        PERFORM add_standard_questions(v_id, 'annualPassengers', 1);
        RAISE NOTICE '✅ Airport questions added/updated';
    END IF;
END $$;

-- GOVERNMENT
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'government' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Building square footage', 'governmentSqFt', 'number', '75000', 5000, 1000000, true, 'Total building floor space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'governmentSqFt');
        PERFORM add_standard_questions(v_id, 'governmentSqFt', 1);
        RAISE NOTICE '✅ Government questions added/updated';
    END IF;
END $$;

-- GAS STATION
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'gas-station' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Number of fuel dispensers', 'dispenserCount', 'number', '8', 2, 32, true, 'Total fuel dispensers/pumps', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'dispenserCount');
        PERFORM add_standard_questions(v_id, 'dispenserCount', 1);
        RAISE NOTICE '✅ Gas Station questions added/updated';
    END IF;
END $$;

-- CASINO
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'casino' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Gaming floor size (sq ft)', 'gamingFloorSqFt', 'number', '75000', 5000, 500000, true, 'Total gaming floor area', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'gamingFloorSqFt');
        PERFORM add_standard_questions(v_id, 'gamingFloorSqFt', 1);
        RAISE NOTICE '✅ Casino questions added/updated';
    END IF;
END $$;

-- AGRICULTURAL
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'agricultural' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Farm size (acres)', 'farmAcres', 'number', '500', 10, 50000, true, 'Total acreage under cultivation', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'farmAcres');
        PERFORM add_standard_questions(v_id, 'farmAcres', 1);
        RAISE NOTICE '✅ Agricultural questions added/updated';
    END IF;
END $$;

-- INDOOR FARM
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'indoor-farm' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Growing area (sq ft)', 'growingAreaSqFt', 'number', '50000', 1000, 500000, true, 'Total vertical farming grow space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'growingAreaSqFt');
        PERFORM add_standard_questions(v_id, 'growingAreaSqFt', 1);
        RAISE NOTICE '✅ Indoor Farm questions added/updated';
    END IF;
END $$;

-- COLD STORAGE
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'cold-storage' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Cold storage capacity (cubic ft)', 'storageCapacity', 'number', '100000', 5000, 2000000, true, 'Total refrigerated storage volume', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'storageCapacity');
        PERFORM add_standard_questions(v_id, 'storageCapacity', 1);
        RAISE NOTICE '✅ Cold Storage questions added/updated';
    END IF;
END $$;

-- SHOPPING CENTER
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'shopping-center' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Gross leasable area (sq ft)', 'mallSqFt', 'number', '500000', 50000, 3000000, true, 'Total leasable retail space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'mallSqFt');
        PERFORM add_standard_questions(v_id, 'mallSqFt', 1);
        RAISE NOTICE '✅ Shopping Center questions added/updated';
    END IF;
END $$;

-- RESIDENTIAL
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'residential' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, section_name)
        SELECT v_id, 'Home square footage', 'homeSqFt', 'number', '2500', 500, 20000, true, 'Total living space', 1, 'Facility Basics'
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'homeSqFt');
        PERFORM add_standard_questions(v_id, 'homeSqFt', 1);
        RAISE NOTICE '✅ Residential questions added/updated';
    END IF;
END $$;

-- MICROGRID
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM use_cases WHERE slug = 'microgrid' AND is_active = true;
    IF v_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, section_name, options)
        SELECT v_id, 'Microgrid scale', 'microgridScale', 'select', 'community', true, 'Size and scope of the microgrid', 1, 'Facility Basics',
            '[{"value": "campus", "label": "Campus Microgrid (1-10 MW)"},
              {"value": "community", "label": "Community Microgrid (10-50 MW)"},
              {"value": "utility", "label": "Utility-Scale Microgrid (50+ MW)"}]'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_id AND field_name = 'microgridScale');
        PERFORM add_standard_questions(v_id, 'microgridScale', 1);
        RAISE NOTICE '✅ Microgrid questions added/updated';
    END IF;
END $$;

-- =============================================================================
-- FINAL VALIDATION
-- =============================================================================

-- Show final question counts
DO $$
DECLARE
    v_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL QUESTION COUNTS ===';
    FOR v_rec IN 
        SELECT uc.slug, uc.name, COUNT(cq.id) as q_count
        FROM use_cases uc
        LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
        WHERE uc.is_active = true
        GROUP BY uc.slug, uc.name
        ORDER BY q_count DESC, uc.name
    LOOP
        IF v_rec.q_count >= 16 THEN
            RAISE NOTICE '✅ % - % questions', v_rec.name, v_rec.q_count;
        ELSE
            RAISE NOTICE '⚠️ % - % questions (needs more)', v_rec.name, v_rec.q_count;
        END IF;
    END LOOP;
END $$;

-- Cleanup
DROP FUNCTION IF EXISTS add_standard_questions(UUID, TEXT, INT);
