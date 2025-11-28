-- ========================================
-- ADD CUSTOM QUESTIONS FOR ALL MISSING USE CASES
-- ========================================
-- Date: November 27, 2025
-- Purpose: Add questionnaires for the 12 use cases that show "No additional information needed"
-- ========================================

DO $$
DECLARE
    v_use_case_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ADDING CUSTOM QUESTIONS';
    RAISE NOTICE '========================================';
    
    -- ========================================
    -- 1. CAR WASH
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Number of wash bays', 'bayCount', 'number', '3', 1, 20, true, 'Total number of car wash bays in your facility', 1);
        RAISE NOTICE '✅ Added Car Wash questions';
    END IF;
    
    -- ========================================
    -- 2. HOSPITAL
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hospital' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Number of beds', 'bedCount', 'number', '200', 10, 2000, true, 'Total licensed bed capacity', 1);
        RAISE NOTICE '✅ Added Hospital questions';
    END IF;
    
    -- ========================================
    -- 3. COLLEGE/UNIVERSITY
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'college' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Total student enrollment', 'studentCount', 'number', '15000', 500, 100000, true, 'Full-time equivalent students', 1);
        RAISE NOTICE '✅ Added College questions';
    END IF;
    
    -- ========================================
    -- 4. APARTMENT
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'apartment' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Number of units', 'unitCount', 'number', '100', 10, 1000, true, 'Total residential units in the complex', 1);
        RAISE NOTICE '✅ Added Apartment questions';
    END IF;
    
    -- ========================================
    -- 5. AIRPORT
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'airport' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Annual passengers (millions)', 'annualPassengers', 'number', '5', 0.5, 100, true, 'Total annual passenger traffic in millions', 1);
        RAISE NOTICE '✅ Added Airport questions';
    END IF;
    
    -- ========================================
    -- 6. GOVERNMENT/PUBLIC BUILDING
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'government' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Building size (sq ft)', 'buildingSqFt', 'number', '75000', 5000, 1000000, true, 'Total building square footage', 1);
        RAISE NOTICE '✅ Added Government Building questions';
    END IF;
    
    -- ========================================
    -- 7. GAS STATION
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'gas-station' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Number of fuel dispensers', 'dispenserCount', 'number', '8', 2, 32, true, 'Total number of fuel dispensers/pumps', 1);
        RAISE NOTICE '✅ Added Gas Station questions';
    END IF;
    
    -- ========================================
    -- 8. WAREHOUSE/LOGISTICS
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'warehouse' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Warehouse size (sq ft)', 'warehouseSqFt', 'number', '250000', 10000, 5000000, true, 'Total warehouse floor area', 1);
        RAISE NOTICE '✅ Added Warehouse questions';
    END IF;
    
    -- ========================================
    -- 9. CASINO
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'casino' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Gaming floor size (sq ft)', 'gamingFloorSize', 'number', '50000', 5000, 500000, true, 'Square footage of gaming floor area', 1);
        RAISE NOTICE '✅ Added Casino questions';
    END IF;
    
    -- ========================================
    -- 10. AGRICULTURAL
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'agricultural' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Farm size (acres)', 'farmSize', 'number', '1000', 10, 50000, true, 'Total acreage under cultivation or irrigation', 1);
        RAISE NOTICE '✅ Added Agricultural questions';
    END IF;
    
    -- ========================================
    -- 11. INDOOR FARM
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'indoor-farm' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Growing area (sq ft)', 'growingAreaSqFt', 'number', '50000', 1000, 500000, true, 'Total growing area with vertical farming', 1),
            (v_use_case_id, 'LED wattage per sq ft', 'ledWattagePerSqFt', 'number', '40', 20, 60, true, 'Average LED grow light wattage per square foot (typically 30-50W)', 2);
        RAISE NOTICE '✅ Added Indoor Farm questions';
    END IF;
    
    -- ========================================
    -- 12. COLD STORAGE
    -- ========================================
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
    
    IF v_use_case_id IS NOT NULL THEN
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
        VALUES 
            (v_use_case_id, 'Storage volume (cubic feet)', 'storageVolume', 'number', '50000', 5000, 5000000, true, 'Total refrigerated storage volume in cubic feet', 1);
        RAISE NOTICE '✅ Added Cold Storage questions';
    END IF;
    
    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CUSTOM QUESTIONS COMPLETE';
    RAISE NOTICE '✅ Added questions for 12 use cases';
    RAISE NOTICE '========================================';
    
END $$;
