-- Add additional questions for Airport and Hospital
-- These will make the questionnaires more comprehensive

DO $$
DECLARE 
    v_airport_id UUID;
    v_hospital_id UUID;
BEGIN
    -- Get use case IDs
    SELECT id INTO v_airport_id FROM use_cases WHERE slug = 'airport';
    SELECT id INTO v_hospital_id FROM use_cases WHERE slug = 'hospital';
    
    -- ============================================================
    -- AIRPORT - Add 4 more questions (total: 5 questions)
    -- ============================================================
    IF v_airport_id IS NOT NULL THEN
        -- Question 2: Terminal square footage
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, min_value, max_value,
            is_required, help_text, display_order
        ) VALUES (
            v_airport_id,
            'Total terminal square footage',
            'terminalSqFt',
            'number',
            '500000',
            '50000',
            '10000000',
            false,
            'Combined square footage of all terminals',
            2
        );
        
        -- Question 3: Number of gates
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, min_value, max_value,
            is_required, help_text, display_order
        ) VALUES (
            v_airport_id,
            'Number of aircraft gates',
            'gateCount',
            'number',
            '30',
            '5',
            '200',
            false,
            'Total number of aircraft gates/jetways',
            3
        );
        
        -- Question 4: Operating hours
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, min_value, max_value,
            is_required, help_text, display_order
        ) VALUES (
            v_airport_id,
            'Daily operating hours',
            'operatingHours',
            'number',
            '24',
            '12',
            '24',
            false,
            'Hours per day the airport operates',
            4
        );
        
        -- Question 5: Has ground power units
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, is_required, help_text, display_order, options
        ) VALUES (
            v_airport_id,
            'Ground power units (GPU) available?',
            'hasGroundPower',
            'select',
            'yes',
            false,
            'Do you provide ground power to parked aircraft?',
            5,
            ARRAY['yes', 'no', 'planned']
        );
        
        RAISE NOTICE 'Added 4 additional questions for Airport (total: 5)';
    END IF;
    
    -- ============================================================
    -- HOSPITAL - Add 6 more questions (total: 7 questions)
    -- ============================================================
    IF v_hospital_id IS NOT NULL THEN
        -- Question 2: Hospital square footage
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, min_value, max_value,
            is_required, help_text, display_order
        ) VALUES (
            v_hospital_id,
            'Total facility square footage',
            'facilitySqFt',
            'number',
            '150000',
            '10000',
            '5000000',
            false,
            'Total square footage of hospital facility',
            2
        );
        
        -- Question 3: Number of operating rooms
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, min_value, max_value,
            is_required, help_text, display_order
        ) VALUES (
            v_hospital_id,
            'Number of operating rooms',
            'operatingRooms',
            'number',
            '8',
            '1',
            '50',
            false,
            'Number of surgical operating rooms',
            3
        );
        
        -- Question 4: Has emergency department
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, is_required, help_text, display_order, options
        ) VALUES (
            v_hospital_id,
            'Emergency department type',
            'emergencyType',
            'select',
            'level_2',
            false,
            'What level trauma center do you operate?',
            4,
            ARRAY['level_1', 'level_2', 'level_3', 'none']
        );
        
        -- Question 5: Has imaging (MRI/CT)
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, is_required, help_text, display_order, options
        ) VALUES (
            v_hospital_id,
            'Advanced imaging equipment',
            'hasImaging',
            'select',
            'yes',
            false,
            'Do you have MRI, CT, or other high-power imaging equipment?',
            5,
            ARRAY['yes', 'no', 'planned']
        );
        
        -- Question 6: Backup power criticality
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, min_value, max_value,
            is_required, help_text, display_order
        ) VALUES (
            v_hospital_id,
            'Required backup duration (hours)',
            'backupDuration',
            'number',
            '8',
            '4',
            '96',
            false,
            'How many hours of backup power do you require for critical systems?',
            6
        );
        
        -- Question 7: Has data center
        INSERT INTO custom_questions (
            use_case_id, question_text, field_name, question_type,
            default_value, is_required, help_text, display_order, options
        ) VALUES (
            v_hospital_id,
            'On-site data center/IT infrastructure',
            'hasDataCenter',
            'select',
            'yes',
            false,
            'Do you have a dedicated data center or server room?',
            7,
            ARRAY['yes', 'no', 'cloud_only']
        );
        
        RAISE NOTICE 'Added 6 additional questions for Hospital (total: 7)';
    END IF;
    
END $$;
