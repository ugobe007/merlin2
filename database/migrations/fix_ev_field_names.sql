-- ========================================
-- FIX EV CHARGING FIELD NAME ALIGNMENT
-- ========================================
-- Issue: Database has both field name conventions:
--   - COMPREHENSIVE_QUESTIONS.sql: level2Count, dcfastCount
--   - fix_ev_charging_questions.sql: numberOfLevel1Chargers, numberOfLevel2Chargers, numberOfDCFastChargers
-- 
-- Solution: Ensure Level 1 question exists with correct field name
-- Date: November 29, 2025
-- ========================================

DO $$
DECLARE
    ev_charging_id UUID;
BEGIN
    -- Get EV Charging use case ID
    SELECT id INTO ev_charging_id 
    FROM use_cases 
    WHERE slug = 'ev-charging'
    LIMIT 1;
    
    IF ev_charging_id IS NULL THEN
        RAISE EXCEPTION 'EV Charging use case not found!';
    END IF;
    
    RAISE NOTICE 'Found EV Charging use case: %', ev_charging_id;
    
    -- ========================================
    -- 1. ADD/UPDATE LEVEL 1 CHARGERS QUESTION
    -- ========================================
    -- Use 'level1Count' to match other field names (level2Count, dcfastCount)
    IF NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = ev_charging_id 
        AND (field_name = 'level1Count' OR field_name = 'numberOfLevel1Chargers')
    ) THEN
        INSERT INTO custom_questions (
            use_case_id,
            question_text,
            field_name,
            question_type,
            default_value,
            min_value,
            max_value,
            is_required,
            help_text,
            display_order
        ) VALUES (
            ev_charging_id,
            'Number of Level 1 chargers (120V residential)',
            'level1Count',  -- Match the naming convention of level2Count
            'number',
            '0',  -- Default 0 for Level 1 since less common in commercial
            0,
            200,
            false,
            'Level 1 chargers (1.4-1.9kW, residential 120V outlets)',
            0  -- First question
        );
        RAISE NOTICE '✅ Added Level 1 charger question with field_name=level1Count';
    ELSE
        -- Update existing question to use consistent field name
        UPDATE custom_questions
        SET field_name = 'level1Count',
            question_text = 'Number of Level 1 chargers (120V residential)',
            help_text = 'Level 1 chargers (1.4-1.9kW, residential 120V outlets)',
            display_order = 0
        WHERE use_case_id = ev_charging_id 
        AND (field_name = 'level1Count' OR field_name = 'numberOfLevel1Chargers');
        RAISE NOTICE '✅ Updated Level 1 charger question to use field_name=level1Count';
    END IF;
    
    -- ========================================
    -- 2. VERIFY DISPLAY ORDER IS CORRECT
    -- ========================================
    -- Ensure questions are ordered: Level 1, DC Fast, Level 2, then others
    UPDATE custom_questions
    SET display_order = 0
    WHERE use_case_id = ev_charging_id
    AND field_name = 'level1Count';
    
    UPDATE custom_questions
    SET display_order = 1
    WHERE use_case_id = ev_charging_id
    AND (field_name = 'dcfastCount' OR field_name = 'numberOfDCFastChargers');
    
    UPDATE custom_questions
    SET display_order = 2
    WHERE use_case_id = ev_charging_id
    AND (field_name = 'level2Count' OR field_name = 'numberOfLevel2Chargers');
    
    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EV CHARGING FIELD NAME FIX COMPLETE:';
    RAISE NOTICE '1. ✅ Level 1 charger question added/updated (level1Count)';
    RAISE NOTICE '2. ✅ Display order corrected (L1, DC Fast, L2)';
    RAISE NOTICE '========================================';
    
    -- Show current state
    RAISE NOTICE 'Current EV Charging questions:';
    FOR r IN 
        SELECT display_order, field_name, question_text 
        FROM custom_questions 
        WHERE use_case_id = ev_charging_id
        ORDER BY display_order
    LOOP
        RAISE NOTICE '  %: % (%)', r.display_order, r.field_name, r.question_text;
    END LOOP;
    
END $$;
