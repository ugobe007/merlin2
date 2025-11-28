-- ========================================
-- FIX EV CHARGING QUESTIONS
-- ========================================
-- Issue: Missing Level 1 chargers, grid connection questions
-- Date: November 27, 2025
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
    -- 1. ADD LEVEL 1 CHARGERS (Residential)
    -- ========================================
    IF NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'numberOfLevel1Chargers'
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
            'Number of Level 1 chargers (120V)',
            'numberOfLevel1Chargers',
            'number',
            '0',
            0,
            200,
            false,
            'Level 1 chargers (1.4-1.9kW, residential 120V)',
            0
        );
        RAISE NOTICE 'Added Level 1 charger question';
    ELSE
        UPDATE custom_questions
        SET question_text = 'Number of Level 1 chargers (120V)',
            help_text = 'Level 1 chargers (1.4-1.9kW, residential 120V)',
            display_order = 0
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'numberOfLevel1Chargers';
        RAISE NOTICE 'Updated Level 1 charger question';
    END IF;
    
    -- ========================================
    -- 2. UPDATE DISPLAY ORDER (Move to top)
    -- ========================================
    
    -- Update DC Fast chargers (keep at position 1, update help text)
    UPDATE custom_questions
    SET help_text = 'DC fast chargers (50-350kW, commercial typically 150kW)'
    WHERE use_case_id = ev_charging_id
    AND field_name = 'numberOfDCFastChargers';
    
    -- Update Level 2 chargers (keep at position 2, update help text)
    UPDATE custom_questions
    SET help_text = 'Level 2 chargers (7-19.2kW, commercial typically 19.2kW)'
    WHERE use_case_id = ev_charging_id
    AND field_name = 'numberOfLevel2Chargers';
    
    -- Push existing questions down to make room for new ones
    UPDATE custom_questions
    SET display_order = display_order + 3
    WHERE use_case_id = ev_charging_id
    AND display_order >= 3;
    
    RAISE NOTICE 'Updated display order for existing questions';
    
    -- ========================================
    -- 3. ADD GRID CONNECTION QUESTION
    -- ========================================
    IF NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'gridConnection'
    ) THEN
        INSERT INTO custom_questions (
            use_case_id,
            question_text,
            field_name,
            question_type,
            default_value,
            is_required,
            help_text,
            display_order,
            options
        ) VALUES (
            ev_charging_id,
            'What is your grid connection status?',
            'gridConnection',
            'select',
            'reliable',
            true,
            'Grid reliability affects whether solar/wind generation is required',
            3,
            jsonb_build_array(
                jsonb_build_object('value', 'reliable', 'label', 'Reliable Grid (99%+ uptime)'),
                jsonb_build_object('value', 'limited', 'label', 'Limited Capacity Grid'),
                jsonb_build_object('value', 'unreliable', 'label', 'Unreliable Grid (frequent outages)'),
                jsonb_build_object('value', 'off_grid', 'label', 'Off-Grid (no grid connection)'),
                jsonb_build_object('value', 'microgrid', 'label', 'Microgrid (islanding capable)')
            )
        );
        RAISE NOTICE 'Added grid connection question';
    ELSE
        UPDATE custom_questions
        SET question_text = 'What is your grid connection status?',
            help_text = 'Grid reliability affects whether solar/wind generation is required',
            display_order = 3,
            options = jsonb_build_array(
                jsonb_build_object('value', 'reliable', 'label', 'Reliable Grid (99%+ uptime)'),
                jsonb_build_object('value', 'limited', 'label', 'Limited Capacity Grid'),
                jsonb_build_object('value', 'unreliable', 'label', 'Unreliable Grid (frequent outages)'),
                jsonb_build_object('value', 'off_grid', 'label', 'Off-Grid (no grid connection)'),
                jsonb_build_object('value', 'microgrid', 'label', 'Microgrid (islanding capable)')
            )
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'gridConnection';
        RAISE NOTICE 'Updated grid connection question';
    END IF;
    
    -- ========================================
    -- 4. ADD GRID CAPACITY QUESTION
    -- ========================================
    IF NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'gridCapacity'
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
            'Grid connection capacity (kW)',
            'gridCapacity',
            'number',
            '0',
            0,
            100000,
            false,
            'Maximum power available from grid (0 = unlimited). If limited, we will recommend solar/wind to fill the gap.',
            4
        );
        RAISE NOTICE 'Added grid capacity question';
    ELSE
        UPDATE custom_questions
        SET question_text = 'Grid connection capacity (kW)',
            help_text = 'Maximum power available from grid (0 = unlimited). If limited, we will recommend solar/wind to fill the gap.',
            display_order = 4
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'gridCapacity';
        RAISE NOTICE 'Updated grid capacity question';
    END IF;
    
    -- ========================================
    -- 5. ADD PEAK CONCURRENCY QUESTION
    -- ========================================
    IF NOT EXISTS (
        SELECT 1 FROM custom_questions 
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'peakConcurrency'
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
            'Peak concurrency factor (%)',
            'peakConcurrency',
            'number',
            '70',
            50,
            100,
            false,
            'Percentage of chargers expected to be active simultaneously during peak (typical: 70%)',
            5
        );
        RAISE NOTICE 'Added peak concurrency question';
    ELSE
        UPDATE custom_questions
        SET question_text = 'Peak concurrency factor (%)',
            help_text = 'Percentage of chargers expected to be active simultaneously during peak (typical: 70%)',
            display_order = 5
        WHERE use_case_id = ev_charging_id 
        AND field_name = 'peakConcurrency';
        RAISE NOTICE 'Updated peak concurrency question';
    END IF;
    
    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EV CHARGING QUESTIONS UPDATED:';
    RAISE NOTICE '1. ✅ Added Level 1 chargers (1.4-1.9kW)';
    RAISE NOTICE '2. ✅ Updated DC Fast help text (150kW)';
    RAISE NOTICE '3. ✅ Updated Level 2 help text (19.2kW)';
    RAISE NOTICE '4. ✅ Added grid connection dropdown';
    RAISE NOTICE '5. ✅ Added grid capacity input';
    RAISE NOTICE '6. ✅ Added peak concurrency factor';
    RAISE NOTICE '========================================';
    
END $$;