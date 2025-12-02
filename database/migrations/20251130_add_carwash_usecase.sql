-- ========================================
-- ADD CAR WASH USE CASE TO DATABASE
-- ========================================
-- Date: November 30, 2025
-- Purpose: Create car wash use case entry for CarWashEnergy vertical
-- Domain: carwashenergy.com
-- ========================================

DO $$
DECLARE
    v_carwash_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ADDING CAR WASH USE CASE';
    RAISE NOTICE '========================================';
    
    -- ========================================
    -- INSERT USE CASE
    -- ========================================
    INSERT INTO use_cases (
        name, 
        slug, 
        description, 
        category, 
        required_tier, 
        is_active, 
        display_order,
        icon
    )
    VALUES (
        'Car Wash',
        'car-wash',
        'Automated car wash facility with tunnel systems, vacuums, dryers, water heating, and air compressors. Battery storage reduces peak demand from high-power equipment.',
        'commercial',
        'free',  -- Make it FREE tier for the vertical landing page
        true,
        12,
        '🚗'
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        required_tier = EXCLUDED.required_tier,
        is_active = EXCLUDED.is_active,
        icon = EXCLUDED.icon
    RETURNING id INTO v_carwash_id;
    
    RAISE NOTICE '✅ Car Wash use case ID: %', v_carwash_id;
    
    -- ========================================
    -- INSERT CONFIGURATIONS (Multiple Sizes)
    -- ========================================
    
    -- Small Car Wash (2-3 bays)
    INSERT INTO use_case_configurations (
        use_case_id, 
        config_name, 
        is_default,
        typical_load_kw, 
        peak_load_kw, 
        base_load_kw,
        profile_type, 
        daily_operating_hours,
        preferred_duration_hours, 
        recommended_duration_hours,
        typical_savings_percent, 
        demand_charge_sensitivity
    ) VALUES (
        v_carwash_id,
        'Small Car Wash (2-3 bays)',
        true,  -- Default configuration
        80.00,    -- 2-3 bays × typical load
        120.00,   -- Peak when all bays + vacuums + dryers active
        25.00,    -- Base load (lighting, controls, water heater standby)
        'peaked',
        12.00,    -- Typical operating hours
        2.00,     -- 2-hour duration for peak shaving
        2.00,
        35.00,    -- 35% typical savings
        'high'    -- Very sensitive to demand charges due to high peak loads
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Added Small Car Wash configuration';
    
    -- Medium Car Wash (4-6 bays)
    INSERT INTO use_case_configurations (
        use_case_id, 
        config_name, 
        is_default,
        typical_load_kw, 
        peak_load_kw, 
        base_load_kw,
        profile_type, 
        daily_operating_hours,
        preferred_duration_hours, 
        recommended_duration_hours,
        typical_savings_percent, 
        demand_charge_sensitivity
    ) VALUES (
        v_carwash_id,
        'Medium Car Wash (4-6 bays)',
        false,
        200.00,   -- 4-6 bays with full equipment
        300.00,   -- Peak load
        50.00,    -- Base load
        'peaked',
        14.00,    -- Extended hours for busy locations
        2.00,
        3.00,
        40.00,    -- 40% typical savings
        'high'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Added Medium Car Wash configuration';
    
    -- Large Car Wash / Express Tunnel (8+ bays)
    INSERT INTO use_case_configurations (
        use_case_id, 
        config_name, 
        is_default,
        typical_load_kw, 
        peak_load_kw, 
        base_load_kw,
        profile_type, 
        daily_operating_hours,
        preferred_duration_hours, 
        recommended_duration_hours,
        typical_savings_percent, 
        demand_charge_sensitivity
    ) VALUES (
        v_carwash_id,
        'Large Express Wash (8+ bays)',
        false,
        400.00,   -- 8+ bays with tunnel system
        600.00,   -- Peak with all equipment running
        100.00,   -- Larger base load
        'peaked',
        16.00,    -- Extended hours
        3.00,
        4.00,
        45.00,    -- 45% typical savings at scale
        'very_high'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Added Large Express Wash configuration';
    
    -- ========================================
    -- INSERT CUSTOM QUESTIONS
    -- ========================================
    
    -- Question 1: Number of bays
    INSERT INTO custom_questions (
        use_case_id,
        question_text,
        question_type,
        options,
        is_required,
        display_order,
        calculation_impact,
        placeholder,
        validation_rules
    ) VALUES (
        v_carwash_id,
        'How many wash bays does your facility have?',
        'number',
        NULL,
        true,
        1,
        'peak_load_kw',
        '4',
        '{"min": 1, "max": 20}'::jsonb
    )
    ON CONFLICT DO NOTHING;
    
    -- Question 2: Cars per day
    INSERT INTO custom_questions (
        use_case_id,
        question_text,
        question_type,
        options,
        is_required,
        display_order,
        calculation_impact,
        placeholder,
        validation_rules
    ) VALUES (
        v_carwash_id,
        'How many cars do you wash per day on average?',
        'number',
        NULL,
        true,
        2,
        'utilization_factor',
        '150',
        '{"min": 10, "max": 1000}'::jsonb
    )
    ON CONFLICT DO NOTHING;
    
    -- Question 3: Equipment type
    INSERT INTO custom_questions (
        use_case_id,
        question_text,
        question_type,
        options,
        is_required,
        display_order,
        calculation_impact,
        placeholder,
        validation_rules
    ) VALUES (
        v_carwash_id,
        'What equipment do you have?',
        'multiselect',
        '["High-speed dryers", "Vacuum stations", "Water heating", "Air compressors", "Conveyor system"]'::jsonb,
        true,
        3,
        'equipment_load',
        NULL,
        NULL
    )
    ON CONFLICT DO NOTHING;
    
    -- Question 4: Monthly bill
    INSERT INTO custom_questions (
        use_case_id,
        question_text,
        question_type,
        options,
        is_required,
        display_order,
        calculation_impact,
        placeholder,
        validation_rules
    ) VALUES (
        v_carwash_id,
        'What is your average monthly electric bill?',
        'number',
        NULL,
        false,
        4,
        'baseline_cost',
        '5000',
        '{"min": 500, "max": 100000}'::jsonb
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Added custom questions for Car Wash';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CAR WASH USE CASE ADDED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    
END $$;

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this to verify the insertion:
-- SELECT uc.name, uc.slug, uc.category, ucc.config_name, ucc.peak_load_kw
-- FROM use_cases uc
-- LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id
-- WHERE uc.slug = 'car-wash';
