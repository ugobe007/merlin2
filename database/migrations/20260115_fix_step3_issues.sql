-- =============================================================================
-- FIX STEP 3 ISSUES - January 15, 2026
-- Issues to fix:
-- 1. Cold storage showing duplicate questions (squareFootage + storageVolume)
-- 2. Apartment showing duplicate questions (unitCount + other)
-- 3. Restaurant missing from use_cases
-- 4. Car wash questions may be incomplete
-- =============================================================================

-- ============================================================================
-- 1. ADD RESTAURANT USE CASE (if not exists)
-- ============================================================================
DO $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- Check if restaurant exists
    SELECT id INTO v_restaurant_id FROM use_cases WHERE slug = 'restaurant' LIMIT 1;
    
    IF v_restaurant_id IS NULL THEN
        INSERT INTO use_cases (name, slug, description, icon, category, required_tier, is_active, display_order)
        VALUES (
            'Restaurant',
            'restaurant',
            'Restaurants have high energy demands from commercial kitchen equipment, HVAC, refrigeration, and lighting. BESS can reduce peak demand charges.',
            '🍽️',
            'commercial',
            'free',
            true,
            15
        )
        RETURNING id INTO v_restaurant_id;
        
        -- Add basic questions for restaurant
        INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
        VALUES 
            (v_restaurant_id, 'Restaurant size (square feet)?', 'squareFootage', 'number', '3000', 500, 50000, true, 'Total restaurant floor area including kitchen and dining', 1, 'essential'),
            (v_restaurant_id, 'Type of restaurant?', 'restaurantType', 'select', 'casual_dining', null, null, true, 'Restaurant service style affects equipment and energy use', 2, 'essential'),
            (v_restaurant_id, 'Number of seats?', 'seatCount', 'number', '80', 10, 500, true, 'Total seating capacity', 3, 'essential'),
            (v_restaurant_id, 'Average monthly electricity bill ($)?', 'averageMonthlyBill', 'number', '2500', 100, 50000, false, 'Helps estimate potential savings', 4, 'essential'),
            (v_restaurant_id, 'Operating hours per day?', 'operatingHours', 'number', '14', 6, 24, false, 'Total hours open per day', 5, 'standard'),
            (v_restaurant_id, 'Has walk-in freezer?', 'hasWalkInFreezer', 'boolean', 'true', null, null, false, 'Walk-in freezers add significant load', 6, 'standard'),
            (v_restaurant_id, 'Has commercial kitchen hood?', 'hasKitchenHood', 'boolean', 'true', null, null, false, 'Kitchen exhaust hoods require substantial power', 7, 'standard');
        
        -- Add options for restaurantType
        UPDATE custom_questions 
        SET options = '[
            {"value": "quick_service", "label": "Quick Service / Fast Food", "icon": "🍔", "description": "Counter service, drive-thru"},
            {"value": "fast_casual", "label": "Fast Casual", "icon": "🥗", "description": "Fresh prep, counter service"},
            {"value": "casual_dining", "label": "Casual Dining", "icon": "🍽️", "description": "Full service, family restaurants"},
            {"value": "fine_dining", "label": "Fine Dining", "icon": "🥂", "description": "Upscale, full service"},
            {"value": "bar_nightclub", "label": "Bar / Nightclub", "icon": "🍸", "description": "Entertainment focus"}
        ]'::jsonb
        WHERE field_name = 'restaurantType' AND use_case_id = v_restaurant_id;
        
        RAISE NOTICE '✅ Added Restaurant use case with questions';
    ELSE
        RAISE NOTICE '⏭️ Restaurant use case already exists (id: %)', v_restaurant_id;
    END IF;
END $$;

-- ============================================================================
-- 2. FIX COLD STORAGE DUPLICATE QUESTIONS
-- Remove storageVolume if squareFootage exists (they're redundant)
-- Keep squareFootage as the standard sizing question
-- ============================================================================
DO $$
DECLARE
    v_cold_storage_id UUID;
    v_has_sqft BOOLEAN;
    v_has_volume BOOLEAN;
BEGIN
    SELECT id INTO v_cold_storage_id FROM use_cases WHERE slug = 'cold-storage' LIMIT 1;
    
    IF v_cold_storage_id IS NOT NULL THEN
        -- Check what questions exist
        SELECT EXISTS(SELECT 1 FROM custom_questions WHERE use_case_id = v_cold_storage_id AND field_name = 'squareFootage') INTO v_has_sqft;
        SELECT EXISTS(SELECT 1 FROM custom_questions WHERE use_case_id = v_cold_storage_id AND field_name = 'storageVolume') INTO v_has_volume;
        
        IF v_has_sqft AND v_has_volume THEN
            -- Remove storageVolume, keep squareFootage (more standard)
            DELETE FROM custom_questions 
            WHERE use_case_id = v_cold_storage_id AND field_name = 'storageVolume';
            RAISE NOTICE '✅ Removed duplicate storageVolume question from cold-storage';
        ELSIF v_has_volume AND NOT v_has_sqft THEN
            -- Rename storageVolume to squareFootage to standardize
            UPDATE custom_questions 
            SET field_name = 'squareFootage',
                question_text = 'Cold storage facility size (square feet)?'
            WHERE use_case_id = v_cold_storage_id AND field_name = 'storageVolume';
            RAISE NOTICE '✅ Renamed storageVolume to squareFootage in cold-storage';
        ELSE
            RAISE NOTICE '⏭️ Cold storage questions look OK (sqft: %, volume: %)', v_has_sqft, v_has_volume;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 3. FIX APARTMENT DUPLICATE QUESTIONS
-- Check for duplicate unit count questions
-- ============================================================================
DO $$
DECLARE
    v_apartment_id UUID;
    v_dup_count INTEGER;
BEGIN
    SELECT id INTO v_apartment_id FROM use_cases WHERE slug = 'apartment' LIMIT 1;
    
    IF v_apartment_id IS NOT NULL THEN
        -- Count questions that ask about units
        SELECT COUNT(*) INTO v_dup_count 
        FROM custom_questions 
        WHERE use_case_id = v_apartment_id 
        AND (field_name LIKE '%unit%' OR question_text ILIKE '%unit%' OR question_text ILIKE '%apartment%');
        
        IF v_dup_count > 1 THEN
            -- Keep only the first unitCount question, remove others
            DELETE FROM custom_questions 
            WHERE id IN (
                SELECT id FROM custom_questions 
                WHERE use_case_id = v_apartment_id 
                AND field_name LIKE '%unit%'
                ORDER BY display_order
                OFFSET 1  -- Skip the first one
            );
            RAISE NOTICE '✅ Removed % duplicate unit questions from apartment', v_dup_count - 1;
        ELSE
            RAISE NOTICE '⏭️ Apartment questions look OK (unit-related: %)', v_dup_count;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. VERIFY CAR WASH HAS ENOUGH QUESTIONS
-- ============================================================================
DO $$
DECLARE
    v_car_wash_id UUID;
    v_question_count INTEGER;
BEGIN
    SELECT id INTO v_car_wash_id FROM use_cases WHERE slug = 'car-wash' LIMIT 1;
    
    IF v_car_wash_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_question_count 
        FROM custom_questions WHERE use_case_id = v_car_wash_id;
        
        IF v_question_count < 5 THEN
            RAISE NOTICE '⚠️ Car wash only has % questions - needs more!', v_question_count;
            
            -- Add essential questions if missing
            INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
            SELECT v_car_wash_id, 'Type of car wash?', 'carWashType', 'select', 'express_tunnel', null, null, true, 'Type of wash operation', 1, 'essential'
            WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_car_wash_id AND field_name = 'carWashType');
            
            INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
            SELECT v_car_wash_id, 'Number of wash bays?', 'bayCount', 'number', '3', 1, 20, true, 'Total number of car wash bays', 2, 'essential'
            WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_car_wash_id AND field_name = 'bayCount');
            
            INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
            SELECT v_car_wash_id, 'Average daily vehicles?', 'dailyVehicles', 'number', '100', 10, 500, true, 'Average vehicles washed per day', 3, 'essential'
            WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_car_wash_id AND field_name = 'dailyVehicles');
            
            INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
            SELECT v_car_wash_id, 'Average monthly electricity bill ($)?', 'averageMonthlyBill', 'number', '3000', 100, 50000, false, 'Helps estimate potential savings', 4, 'essential'
            WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_car_wash_id AND field_name = 'averageMonthlyBill');
            
            INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
            SELECT v_car_wash_id, 'Number of vacuum stations?', 'vacuumStations', 'number', '6', 0, 20, false, 'Self-service vacuum islands', 5, 'standard'
            WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_car_wash_id AND field_name = 'vacuumStations');
            
            INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order, question_tier)
            SELECT v_car_wash_id, 'Operating hours per day?', 'operatingHours', 'number', '12', 6, 24, false, 'Hours open per day', 6, 'standard'
            WHERE NOT EXISTS (SELECT 1 FROM custom_questions WHERE use_case_id = v_car_wash_id AND field_name = 'operatingHours');
            
            -- Add options for carWashType
            UPDATE custom_questions 
            SET options = '[
                {"value": "iba", "label": "In-Bay Automatic", "icon": "🚗", "description": "Vehicle stationary, machine moves"},
                {"value": "express_tunnel", "label": "Express Tunnel", "icon": "🏎️", "description": "High-speed conveyor, 80-180 feet"},
                {"value": "mini_tunnel", "label": "Mini-Tunnel", "icon": "🚙", "description": "Shorter conveyor under 60 feet"},
                {"value": "self_serve", "label": "Self-Serve Bay", "icon": "🧽", "description": "Customer washes with wand"},
                {"value": "full_service", "label": "Full Service", "icon": "✨", "description": "Tunnel + interior cleaning"}
            ]'::jsonb
            WHERE field_name = 'carWashType' AND use_case_id = v_car_wash_id;
            
            RAISE NOTICE '✅ Added missing car wash questions';
        ELSE
            RAISE NOTICE '✅ Car wash has % questions', v_question_count;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 5. ENSURE ALL QUESTIONS HAVE question_tier SET
-- Default unset questions to 'essential' so they always show
-- ============================================================================
UPDATE custom_questions 
SET question_tier = 'essential'
WHERE question_tier IS NULL;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3 FIXES COMPLETE';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '  - Restaurant use case added (if missing)';
    RAISE NOTICE '  - Cold storage duplicate questions fixed';
    RAISE NOTICE '  - Apartment duplicate questions fixed';
    RAISE NOTICE '  - Car wash questions verified/added';
    RAISE NOTICE '  - All questions have question_tier set';
    RAISE NOTICE '========================================';
END $$;
