-- ========================================
-- ADD MISSING USE CASE CONFIGURATIONS
-- ========================================
-- Date: November 27, 2025
-- Purpose: Add database configurations for 12 use cases that currently only exist in code
-- ========================================

DO $$
DECLARE
    -- Use case IDs
    v_airport_id UUID;
    v_car_wash_id UUID;
    v_hospital_id UUID;
    v_college_id UUID;
    v_apartment_id UUID;
    v_government_id UUID;
    v_gas_station_id UUID;
    v_warehouse_id UUID;
    v_casino_id UUID;
    v_agricultural_id UUID;
    v_indoor_farm_id UUID;
    v_cold_storage_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ADDING USE CASE CONFIGURATIONS';
    RAISE NOTICE '========================================';
    
    -- ========================================
    -- 1. AIRPORT
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Airport',
        'airport',
        'Commercial airport with terminals, baggage handling, retail, and ground support',
        'institutional',
        'premium',
        true,
        11
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_airport_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_airport_id,
        'Regional Airport (5M passengers/year)',
        true,
        5000.00,  -- 5M passengers × 1.0 MW/million = 5 MW typical
        7500.00,  -- 1.5x peak factor
        4000.00,  -- Base load (lighting, HVAC always on)
        'constant',
        24.00,
        6.00,
        4.00,
        20.00,
        'high'
    );
    RAISE NOTICE '✅ Added Airport configuration';
    
    -- ========================================
    -- 2. CAR WASH
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Car Wash',
        'car-wash',
        'Automated car wash facility with pumps, vacuums, dryers, and lighting',
        'commercial',
        'free',
        true,
        12
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_car_wash_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_car_wash_id,
        'Standard Car Wash (3 bays)',
        true,
        150.00,   -- 3 bays × 50 kW/bay = 150 kW
        200.00,   -- Peak when all bays + vacuums active
        50.00,    -- Base load (lighting, control systems)
        'peaked',
        12.00,
        2.00,
        2.00,
        15.00,
        'medium'
    );
    RAISE NOTICE '✅ Added Car Wash configuration';
    
    -- ========================================
    -- 3. HOSPITAL
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Hospital',
        'hospital',
        'Healthcare facility with medical equipment, HVAC, emergency systems, and 24/7 operation',
        'institutional',
        'premium',
        true,
        13
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_hospital_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_hospital_id,
        'Community Hospital (200 beds)',
        true,
        1100.00,  -- 200 beds × 5.5 kW/bed = 1,100 kW
        1500.00,  -- Peak (surgery, diagnostics)
        900.00,   -- Base load (critical systems, HVAC)
        'constant',
        24.00,
        6.00,
        4.00,
        25.00,
        'high'
    );
    RAISE NOTICE '✅ Added Hospital configuration';
    
    -- ========================================
    -- 4. COLLEGE/UNIVERSITY
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'College & University',
        'college',
        'Higher education campus with classrooms, dorms, dining, labs, and recreational facilities',
        'institutional',
        'premium',
        true,
        14
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_college_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_college_id,
        'Medium University (15,000 students)',
        true,
        3000.00,  -- 15,000 students × 200W/student = 3,000 kW
        4500.00,  -- Peak during class hours
        1500.00,  -- Base load (dorms, security, minimal HVAC)
        'seasonal',
        16.00,
        4.00,
        4.00,
        20.00,
        'high'
    );
    RAISE NOTICE '✅ Added College/University configuration';
    
    -- ========================================
    -- 5. APARTMENT
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Apartment Complex',
        'apartment',
        'Multi-unit residential building with common areas, elevators, and amenities',
        'residential',
        'free',
        true,
        15
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_apartment_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_apartment_id,
        'Standard Apartment Complex (100 units)',
        true,
        150.00,   -- 100 units × 1.5 kW/unit = 150 kW
        250.00,   -- Peak evening hours (cooking, heating/cooling)
        80.00,    -- Base load (common areas, elevators)
        'peaked',
        14.00,
        3.00,
        3.00,
        15.00,
        'medium'
    );
    RAISE NOTICE '✅ Added Apartment configuration';
    
    -- ========================================
    -- 6. GOVERNMENT/PUBLIC BUILDING
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Government & Public Building',
        'government',
        'Municipal building with offices, public services, and security systems',
        'institutional',
        'premium',
        true,
        16
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_government_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_government_id,
        'Government Building (75,000 sq ft)',
        true,
        450.00,   -- 75k sq ft × 6 W/sq ft = 450 kW
        600.00,   -- Peak during business hours
        200.00,   -- Base load (security, minimal HVAC)
        'daytime_commercial',
        10.00,
        3.00,
        3.00,
        18.00,
        'high'
    );
    RAISE NOTICE '✅ Added Government configuration';
    
    -- ========================================
    -- 7. GAS STATION
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Gas Station',
        'gas-station',
        'Fuel station with dispensers, convenience store, and lighting',
        'commercial',
        'free',
        true,
        17
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_gas_station_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_gas_station_id,
        'Standard Gas Station (8 dispensers)',
        true,
        80.00,    -- 8 dispensers + convenience store + lighting
        120.00,   -- Peak when all pumps active + store busy
        40.00,    -- Base load (refrigeration, lighting)
        'constant',
        20.00,
        2.00,
        2.00,
        12.00,
        'medium'
    );
    RAISE NOTICE '✅ Added Gas Station configuration';
    
    -- ========================================
    -- 8. WAREHOUSE/LOGISTICS
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Warehouse & Logistics',
        'warehouse',
        'Distribution center with loading docks, conveyors, and climate control',
        'industrial',
        'premium',
        true,
        18
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_warehouse_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_warehouse_id,
        'Distribution Center (250,000 sq ft)',
        true,
        1750.00,  -- 250k sq ft × 7 W/sq ft = 1,750 kW
        2500.00,  -- Peak during shift changes
        1000.00,  -- Base load (refrigeration if cold storage section)
        'peaked',
        16.00,
        4.00,
        4.00,
        20.00,
        'high'
    );
    RAISE NOTICE '✅ Added Warehouse configuration';
    
    -- ========================================
    -- 9. CASINO
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Casino & Gaming',
        'casino',
        'Gaming facility with slot machines, table games, restaurants, and 24/7 HVAC',
        'commercial',
        'premium',
        true,
        19
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_casino_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_casino_id,
        'Casino (50,000 sq ft gaming floor)',
        true,
        750.00,   -- 50k sq ft × 15 W/sq ft = 750 kW
        1000.00,  -- Peak during busy hours
        600.00,   -- Base load (machines, HVAC 24/7)
        'constant',
        24.00,
        4.00,
        4.00,
        18.00,
        'medium'
    );
    RAISE NOTICE '✅ Added Casino configuration';
    
    -- ========================================
    -- 10. AGRICULTURAL
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Agricultural',
        'agricultural',
        'Farm with irrigation pumps, processing equipment, and storage facilities',
        'agricultural',
        'premium',
        true,
        20
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_agricultural_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_agricultural_id,
        'Irrigation Farm (1,000 acres)',
        true,
        2000.00,  -- 1,000 acres × 2 kW/acre = 2,000 kW
        3000.00,  -- Peak during irrigation season
        500.00,   -- Base load (processing, storage)
        'seasonal',
        12.00,
        6.00,
        6.00,
        25.00,
        'high'
    );
    RAISE NOTICE '✅ Added Agricultural configuration';
    
    -- ========================================
    -- 11. INDOOR FARM
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Indoor Farm',
        'indoor-farm',
        'Vertical farming with LED grow lights, climate control, and hydroponic systems',
        'agricultural',
        'premium',
        true,
        21
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_indoor_farm_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_indoor_farm_id,
        'Indoor Farm (50,000 sq ft, 40W/sq ft)',
        true,
        2000.00,  -- 50k sq ft × 40 W/sq ft = 2,000 kW
        2500.00,  -- Peak with all lights + HVAC
        1500.00,  -- Base load (minimum lighting cycle)
        'constant',
        18.00,
        6.00,
        6.00,
        30.00,
        'high'
    );
    RAISE NOTICE '✅ Added Indoor Farm configuration';
    
    -- ========================================
    -- 12. COLD STORAGE
    -- ========================================
    INSERT INTO use_cases (name, slug, description, category, required_tier, is_active, display_order)
    VALUES (
        'Cold Storage',
        'cold-storage',
        'Refrigerated warehouse with compressors, fans, and temperature control',
        'industrial',
        'premium',
        true,
        22
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO v_cold_storage_id;
    
    INSERT INTO use_case_configurations (
        use_case_id, config_name, is_default,
        typical_load_kw, peak_load_kw, base_load_kw,
        profile_type, daily_operating_hours,
        preferred_duration_hours, recommended_duration_hours,
        typical_savings_percent, demand_charge_sensitivity
    ) VALUES (
        v_cold_storage_id,
        'Cold Storage (50,000 cu ft)',
        true,
        50.00,    -- 50k cu ft × 1.0 W/cu ft = 50 kW
        75.00,    -- Peak during loading/unloading (door openings)
        40.00,    -- Base load (refrigeration always on)
        'constant',
        24.00,
        4.00,
        4.00,
        20.00,
        'high'
    );
    RAISE NOTICE '✅ Added Cold Storage configuration';
    
    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USE CASE CONFIGURATIONS COMPLETE';
    RAISE NOTICE '✅ Added 12 new use case configurations';
    RAISE NOTICE '✅ Total configurations now: 22';
    RAISE NOTICE '========================================';
    
END $$;
