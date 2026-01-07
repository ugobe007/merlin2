-- ============================================================================
-- ADD HEAVY DUTY TRUCK STOP / TRAVEL CENTER INDUSTRY
-- January 6, 2026
-- 
-- IMPORTANT: Industrial-Utility Thinking Required
-- For Merlin Energy, analyzing the energy load of a site like Love's Travel Stops
-- requires a shift from traditional commercial real estate thinking to 
-- "Industrial-Utility" thinking.
-- 
-- In 2026, these sites are NO LONGER just gas stations; they are HIGH-VOLTAGE NODES.
-- A single flagship Love's location now operates with an electrical demand profile
-- comparable to a small manufacturing plant or a high-density data center.
-- 
-- EQUIPMENT & ENERGY LOAD BREAKDOWN:
-- 1. EV Infrastructure: 2x MCS (1,250 kW each) + 10x DCFC (350 kW) = 2,500-5,000 kW
--    - Extreme Spikes: Rapid ramp-up (0 to Max in <2 secs)
-- 2. Maintenance (Speedco): 100HP Air Compressors, Industrial HVAC, Lifts = 150-350 kW
--    - Heavy Inductive: High inrush current during motor starts
-- 3. Truck Wash: High-pressure pumps, 150kW Blow-dryers = 200-400 kW
--    - Intermittent: High demand during 15-min cycles
-- 4. QSR (Food Court): 10+ Fryers, Walk-in Freezers, Pizza Ovens = 150-300 kW
--    - Constant Baseline: Thermal loads with midday/evening peaks
-- 5. Building / Lot: 100-ton HVAC, LED Pole Lighting (50+ poles) = 100-200 kW
--    - Seasonal/Diurnal: Lighting 100% on at night; HVAC peaks at 3 PM
-- 6. Fueling Islands: Diesel/DEF Pumps, Canopy Lighting = 40-80 kW
--    - Near-Constant: High duty cycle 24/7
-- 
-- CRITICAL SIZING FACTORS:
-- - 1.25x Continuous Load Rule (NEC 2023): EV chargers & lighting running 3+ hours
--   must be calculated at 125% of nameplate for service sizing
-- - Thermal Management (Parasitic Load): 2MWh battery system or 5MW transformer
--   generates massive heat. Desert locations (AZ/NV/TX) add 15-30 kW cooling load
-- - Diversity Factor: For "Truck Charging Hubs," industry moving toward 0.8-0.9,
--   assuming during peak transit hours, nearly all stalls occupied simultaneously
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if truck stop already exists
  SELECT id INTO v_existing_id FROM use_cases WHERE slug = 'heavy_duty_truck_stop' LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    RAISE NOTICE 'Truck Stop use case already exists with ID: %', v_existing_id;
    v_use_case_id := v_existing_id;
  ELSE
    -- Insert truck stop use case
    INSERT INTO use_cases (
      name, 
      slug, 
      description, 
      category, 
      required_tier, 
      is_active, 
      display_order
    )
    VALUES (
      'Heavy Duty Truck Stop / Travel Center',
      'heavy_duty_truck_stop',
      'HIGH-VOLTAGE NODES - Industrial-Utility thinking required. Not gas stations—electrical demand profiles comparable to small manufacturing plants or high-density data centers. Extreme demand from MW-class EV charging (MCS/DCFC), heavy inductive loads (Speedco maintenance), and 24/7 hospitality operations. Love''s Travel Stops, Pilot Flying J, TA/Petro, TravelCenters of America.',
      'commercial',
      'free',
      true,
      25  -- Display order (adjust if needed)
    )
    RETURNING id INTO v_use_case_id;
    
    RAISE NOTICE '✅ Created Truck Stop use case with ID: %', v_use_case_id;
  END IF;
  
  -- ============================================================================
  -- DELETE EXISTING QUESTIONS (if any) TO START FRESH
  -- ============================================================================
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted any existing questions, adding truck stop-specific questions';
  
  -- ============================================================================
  -- TRUCK STOP SPECIFIC QUESTIONS (10 questions)
  -- ============================================================================
  
  -- 1. MCS Chargers (Megawatt Charging System for Semi Trucks)
  -- CRITICAL: These charge at 1,250 kW each with 0-2 second ramp time!
  -- NEC 2023 requires 125% continuous load calculation (1,562.5 kW per charger)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'MCS Chargers (1,250 kW each)',
    'mcsChargers',
    'number',
    '2',
    true,
    'Megawatt Charging System for Semi Trucks (Tesla Semi, Nikola, etc.). Extreme spike loads - ramp from 0 to max in <2 seconds. NEC 2023 requires 125% continuous load calculation.',
    1
  );
  
  -- 2. DC Fast Chargers (350 kW for Class 8 Trucks & RVs)
  -- High diversity factor (0.85) during peak transit hours
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'DC Fast Chargers (350 kW each)',
    'dcfc350',
    'number',
    '10',
    true,
    'For Class 8 Trucks & RVs. 85% diversity factor during peak hours - very high simultaneous usage. 5-second ramp time.',
    2
  );
  
  -- 3. Level 2 Chargers (19.2 kW for Passenger Vehicles)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'Level 2 Chargers (19.2 kW each)',
    'level2',
    'number',
    '20',
    true,
    'For Passenger Vehicles',
    3
  );
  
  -- 4. Service Bays (Speedco maintenance facility)
  -- Heavy inductive loads: 100HP air compressors (6x inrush!), lifts, welding
  -- Average 60 kW per bay (compressors: 74.6 kW, lifts: 25 kW, HVAC: 50 kW, welding: 30 kW)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'Service Bays (Speedco)',
    'serviceBays',
    'number',
    '6',
    true,
    'Maintenance facility bays. Heavy inductive loads with extreme inrush current (6x for compressors!). Size BESS to handle simultaneous motor starts. Average 60 kW per bay (150-350 kW range).',
    4
  );
  
  -- 5. Truck Wash Bays
  -- Intermittent but intense: 50kW pumps (4x inrush), 150kW blower dryers
  -- 300 kW per tunnel average (200-400 kW range), 15-min cycle duration
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'Truck Wash Bays',
    'truckWashBays',
    'number',
    '2',
    false,
    'Truck wash tunnels. Intermittent but intense load - 300 kW per tunnel (high-pressure pumps: 50kW with 4x inrush, 150kW blower dryers). High demand during 15-min cycles, then idle.',
    5
  );
  
  -- 6. Restaurant Seats
  -- QSR/Food Court: 1.5 kW per seat (10+ fryers at 15kW, walk-in freezers at 30kW, pizza ovens at 25kW)
  -- Constant baseline (150-300 kW) with midday/evening peaks during meal rushes
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'Restaurant Seats',
    'restaurantSeats',
    'number',
    '150',
    false,
    'Food court / QSR capacity. 1.5 kW per seat (commercial fryers: 15kW each, walk-in freezers: 30kW, pizza ovens: 25kW). Constant baseline (150-300 kW) with meal rush peaks.',
    6
  );
  
  -- 7. Shower Facilities (Yes/No)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Shower Facilities?',
    'hasShowers',
    'select',
    'true',
    false,
    'Shower facilities add 60 kW constant load',
    7,
    '[
      {"label": "Yes", "value": "true"},
      {"label": "No", "value": "false"}
    ]'::jsonb
  );
  
  -- 8. Laundry Facilities (Yes/No)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Laundry Facilities?',
    'hasLaundry',
    'select',
    'true',
    false,
    'Laundry facilities add 70 kW constant load',
    8,
    '[
      {"label": "Yes", "value": "true"},
      {"label": "No", "value": "false"}
    ]'::jsonb
  );
  
  -- 9. Parking Lot Size (acres)
  -- LED pole lighting: 2 kW per pole, ~50 poles for large lots
  -- 10 kW per acre for lighting load (100% on at night, 0% during day)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'Parking Lot Size',
    'parkingLotAcres',
    'number',
    '5',
    false,
    'Parking lot acreage. LED pole lighting: 2 kW per pole (typically 50 poles for large lots). 10 kW per acre lighting load. 100% on at night, 0% during day.',
    9
  );
  
  -- 10. Climate Zone (affects HVAC and thermal management)
  -- CRITICAL: Hot zones (desert locations) add 30 kW parasitic load for battery/transformer cooling
  -- 2MWh battery system or 5MW transformer bank generates massive heat
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Climate Zone',
    'climateZone',
    'select',
    'moderate',
    true,
    'CRITICAL for thermal management. Hot zones (AZ/NV/TX/FL) add 30 kW parasitic load for battery system & transformer cooling. 2MWh BESS or 5MW transformer generates massive heat requiring active cooling.',
    10,
    '[
      {"label": "Hot (AZ, NV, TX, FL)", "value": "hot"},
      {"label": "Moderate (CA, NC, GA)", "value": "moderate"},
      {"label": "Cold (MN, WI, NY)", "value": "cold"}
    ]'::jsonb
  );
  
  RAISE NOTICE '✅ Successfully added 10 truck stop-specific questions';
  
  -- ============================================================================
  -- STANDARD PROFESSIONAL FACILITY QUESTIONS (11-18)
  -- ============================================================================
  
  -- 11. Total facility square footage
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Total facility square footage',
    'squareFeet',
    'select',
    '75000',
    true,
    'Total building area including QSR, maintenance, retail',
    11,
    '[
      {"label": "10,000 - 25,000 sq ft", "value": "17500"},
      {"label": "25,000 - 50,000 sq ft", "value": "37500"},
      {"label": "50,000 - 100,000 sq ft", "value": "75000"},
      {"label": "100,000 - 200,000 sq ft", "value": "150000"},
      {"label": "200,000 - 400,000 sq ft", "value": "300000"},
      {"label": "Over 400,000 sq ft", "value": "500000"}
    ]'::jsonb
  );
  
  -- 12. Monthly electric bill
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Average monthly electricity bill',
    'monthlyElectricBill',
    'select',
    '50000',
    true,
    'Total facility electricity cost (high-voltage loads drive significant bills)',
    12,
    '[
      {"label": "$10,000 - $25,000/month", "value": "17500"},
      {"label": "$25,000 - $50,000/month", "value": "37500"},
      {"label": "$50,000 - $100,000/month", "value": "75000"},
      {"label": "$100,000 - $200,000/month", "value": "150000"},
      {"label": "$200,000 - $400,000/month", "value": "300000"},
      {"label": "Over $400,000/month", "value": "500000"}
    ]'::jsonb
  );
  
  -- 13. Monthly demand charges
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Monthly demand charges',
    'monthlyDemandCharges',
    'select',
    '25000',
    true,
    'Peak demand portion of electric bill (EV charging creates extreme demand charges)',
    13,
    '[
      {"label": "$5,000 - $15,000/month", "value": "10000"},
      {"label": "$15,000 - $30,000/month", "value": "22500"},
      {"label": "$30,000 - $60,000/month", "value": "45000"},
      {"label": "$60,000 - $120,000/month", "value": "90000"},
      {"label": "$120,000 - $200,000/month", "value": "160000"},
      {"label": "Over $200,000/month", "value": "300000"}
    ]'::jsonb
  );
  
  -- 14. Estimated peak demand (if known)
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Estimated peak demand',
    'peakDemandKW',
    'select',
    '4000',
    false,
    'Maximum instantaneous power demand (if you have this data from utility bills)',
    14,
    '[
      {"label": "500 - 1,000 kW", "value": "750"},
      {"label": "1,000 - 2,000 kW", "value": "1500"},
      {"label": "2,000 - 3,500 kW", "value": "2750"},
      {"label": "3,500 - 5,000 kW", "value": "4250"},
      {"label": "5,000 - 7,500 kW", "value": "6250"},
      {"label": "7,500 - 10,000 kW", "value": "8750"},
      {"label": "Over 10,000 kW", "value": "12000"}
    ]'::jsonb
  );
  
  -- 15. Grid connection capacity
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Grid connection capacity',
    'gridCapacityKW',
    'select',
    '5000',
    true,
    'Your facility''s electrical service size (critical for high-voltage EV infrastructure)',
    15,
    '[
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "2 - 4 MW", "value": "3000"},
      {"label": "4 - 6 MW", "value": "5000"},
      {"label": "6 - 10 MW", "value": "8000"},
      {"label": "Over 10 MW", "value": "12000"}
    ]'::jsonb
  );
  
  -- 16. Operating hours
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Operating hours',
    'operatingHours',
    'select',
    '24_7',
    true,
    'Hours of active operations (most travel centers operate 24/7)',
    16,
    '[
      {"label": "24/7 Operations", "value": "24_7"},
      {"label": "20 hours/day (4am - 12am)", "value": "20"},
      {"label": "18 hours/day (6am - 12am)", "value": "18"},
      {"label": "16 hours/day (6am - 10pm)", "value": "16"}
    ]'::jsonb
  );
  
  -- 17. Existing solar capacity
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Existing solar capacity',
    'existingSolarKW',
    'select',
    '0',
    false,
    'Rooftop solar already installed (travel centers have excellent roof space)',
    17,
    '[
      {"label": "None", "value": "0"},
      {"label": "100 - 500 kW", "value": "300"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "2 - 5 MW", "value": "3500"},
      {"label": "Over 5 MW", "value": "6000"}
    ]'::jsonb
  );
  
  -- 18. Interested in adding solar
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order
  )
  VALUES (
    v_use_case_id,
    'Interested in adding rooftop solar?',
    'wantsSolar',
    'boolean',
    'true',
    false,
    'Travel centers have excellent roof space and can offset significant EV charging loads',
    18
  );
  
  -- 19. Backup power requirements
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Backup power requirements',
    'backupRequirements',
    'select',
    'important',
    false,
    'How critical is backup power for your operations?',
    19,
    '[
      {"label": "Mission Critical - 24/7 operations cannot lose power", "value": "critical"},
      {"label": "Important - Minimize downtime (8+ hour backup)", "value": "important"},
      {"label": "Nice to have - Occasional outages OK (4 hour backup)", "value": "nice_to_have"},
      {"label": "Have existing generator backup", "value": "has_generator"},
      {"label": "Not a priority", "value": "not_priority"}
    ]'::jsonb
  );
  
  -- 20. Primary BESS Application / Energy Goals
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type, 
    default_value, is_required, help_text, display_order, options
  )
  VALUES (
    v_use_case_id,
    'Primary energy goals',
    'primaryBESSApplication',
    'select',
    'peak_shaving',
    false,
    'How will you primarily use battery storage? (Travel centers benefit from multiple applications)',
    20,
    '[
      {"label": "Peak Shaving - Reduce demand charges from EV charging", "value": "peak_shaving"},
      {"label": "Energy Arbitrage - Buy low, use high (24/7 operations)", "value": "energy_arbitrage"},
      {"label": "Backup Power - Critical systems during outages", "value": "backup_power"},
      {"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},
      {"label": "Load Shifting - Move EV charging to off-peak rates", "value": "load_shifting"},
      {"label": "Multiple Applications - Stacked benefits (recommended)", "value": "stacked"}
    ]'::jsonb
  );
  
  RAISE NOTICE '✅ Successfully added 20 professional questions (10 industry-specific + 10 standard facility)';
  
  -- ============================================================================
  -- ADD DEFAULT USE CASE CONFIGURATION
  -- ============================================================================
  
  -- Insert default configuration if it doesn't exist
  -- Includes "Travel Center Curve" load profile combining Commuter + Logistics + Hospitality peaks
  INSERT INTO use_case_configurations (
    use_case_id,
    config_name,
    is_default,
    typical_load_kw,
    peak_load_kw,
    base_load_kw,
    profile_type,
    daily_operating_hours,
    annual_operating_days,
    preferred_duration_hours,
    recommended_duration_hours,
    typical_savings_percent,
    demand_charge_sensitivity,
    energy_arbitrage_potential,
    load_profile_data,
    diversity_factor
  )
  SELECT 
    v_use_case_id,
    'Standard Truck Stop / Travel Center',
    true,
    3500.00,  -- Typical load: 3.5 MW (mid-range of EV infrastructure 2.5-5MW + other loads)
    5000.00,  -- Peak load: 5 MW (maximum EV charging surge + HVAC peak at 3 PM)
    500.00,   -- Base load: 500 kW (refrigeration, building lighting, constant loads)
    'peaked', -- Travel Center Curve profile (unique combination of 3 peak types)
    24.00,    -- 24/7 operations
    365,      -- Year-round
    4.00,     -- Preferred: 4 hours for demand charge management
    6.00,     -- Recommended: 6 hours for UPS mode / extended backup
    25.00,    -- Typical savings: 25% (high demand charges from EV infrastructure)
    'high',   -- High demand charge sensitivity (MW-class charging = high demand charges)
    'high',   -- High arbitrage potential (24/7 operations, multiple peak windows)
    -- Travel Center Curve: Daily load profile combining Commuter + Logistics + Hospitality peaks
    '{
      "profileName": "Travel Center Curve",
      "description": "Combines Commuter Peaks (Passenger EVs) + Logistics Peaks (Heavy Trucks) + Hospitality Peaks (Food/Showers)",
      "hourlyLoadFactors": [
        {"hour": 0, "loadFactor": 0.30, "strategy": "bess_charging", "primaryDrivers": ["lot_lighting", "refrigeration", "overnight_idling"]},
        {"hour": 1, "loadFactor": 0.28, "strategy": "bess_charging", "primaryDrivers": ["lot_lighting", "refrigeration"]},
        {"hour": 2, "loadFactor": 0.27, "strategy": "bess_charging", "primaryDrivers": ["lot_lighting", "refrigeration"]},
        {"hour": 3, "loadFactor": 0.29, "strategy": "bess_charging", "primaryDrivers": ["lot_lighting", "refrigeration", "early_truckers"]},
        {"hour": 4, "loadFactor": 0.35, "strategy": "bess_charging", "primaryDrivers": ["lot_lighting", "refrigeration", "early_morning_prep"]},
        {"hour": 5, "loadFactor": 0.42, "strategy": "transition", "primaryDrivers": ["breakfast_prep", "early_commuters"]},
        {"hour": 6, "loadFactor": 0.68, "strategy": "peak_shaving", "primaryDrivers": ["breakfast_rush", "commuter_dcfc", "showers"]},
        {"hour": 7, "loadFactor": 0.82, "strategy": "peak_shaving", "primaryDrivers": ["breakfast_peak", "heavy_ev_charging", "maintenance_opens"]},
        {"hour": 8, "loadFactor": 0.79, "strategy": "peak_shaving", "primaryDrivers": ["post_breakfast", "continued_charging"]},
        {"hour": 9, "loadFactor": 0.65, "strategy": "peak_shaving", "primaryDrivers": ["mid_morning", "light_charging"]},
        {"hour": 10, "loadFactor": 0.75, "strategy": "max_discharge", "primaryDrivers": ["lunch_prep", "truck_charging_surge"]},
        {"hour": 11, "loadFactor": 0.92, "strategy": "max_discharge", "primaryDrivers": ["lunch_rush", "mcs_charging", "hvac_ramp"]},
        {"hour": 12, "loadFactor": 1.00, "strategy": "max_discharge", "primaryDrivers": ["peak_lunch", "max_mcs_usage", "truck_wash"]},
        {"hour": 13, "loadFactor": 0.95, "strategy": "max_discharge", "primaryDrivers": ["continued_lunch", "charging_peak"]},
        {"hour": 14, "loadFactor": 0.88, "strategy": "max_discharge", "primaryDrivers": ["post_lunch", "maintenance_peak"]},
        {"hour": 15, "loadFactor": 0.85, "strategy": "hybrid_solar_bess", "primaryDrivers": ["hvac_peak", "commuter_return", "dinner_prep"]},
        {"hour": 16, "loadFactor": 0.83, "strategy": "hybrid_solar_bess", "primaryDrivers": ["commuter_charging", "early_dinner"]},
        {"hour": 17, "loadFactor": 0.88, "strategy": "hybrid_solar_bess", "primaryDrivers": ["dinner_rush", "evening_charging"]},
        {"hour": 18, "loadFactor": 0.92, "strategy": "hybrid_solar_bess", "primaryDrivers": ["dinner_peak", "evening_truck_surge"]},
        {"hour": 19, "loadFactor": 0.78, "strategy": "hybrid_solar_bess", "primaryDrivers": ["post_dinner", "lot_lighting_on"]},
        {"hour": 20, "loadFactor": 0.62, "strategy": "arbitrage", "primaryDrivers": ["evening_operations", "lot_lighting"]},
        {"hour": 21, "loadFactor": 0.55, "strategy": "arbitrage", "primaryDrivers": ["late_night_food", "maintenance_closes"]},
        {"hour": 22, "loadFactor": 0.48, "strategy": "arbitrage", "primaryDrivers": ["late_operations", "lot_lighting"]},
        {"hour": 23, "loadFactor": 0.38, "strategy": "arbitrage", "primaryDrivers": ["overnight_prep", "lot_lighting"]}
      ],
      "criticalSizingFactors": {
        "continuousLoadMultiplier": 1.25,
        "notes": "NEC 2023: EV chargers & lighting running 3+ hours must be calculated at 125% of nameplate",
        "thermalManagement": {
          "batterySystemCooling": {"per2MWhBattery": 15, "desertLocations": 30},
          "transformerCooling": {"per5MWTransformer": 20}
        },
        "diversityFactor": 0.85,
        "diversityFactorNotes": "Industry moving toward 0.8-0.9 for Truck Charging Hubs - assume 85% of stalls occupied at peak",
        "powerFactor": {"target": 0.95, "typical": 0.85, "inductiveEquipment": 0.80},
        "inrushProtection": {
          "compressors": 6.0,
          "hvac": 4.0,
          "pumps": 4.0,
          "notes": "Size BESS and breakers to handle simultaneous motor starts"
        }
      },
      "equipmentBreakdown": {
        "evInfrastructure": {"typicalKw": 2500, "peakKw": 5000, "profile": "extreme_spikes"},
        "maintenance": {"typicalKw": 150, "peakKw": 350, "profile": "heavy_inductive"},
        "truckWash": {"typicalKw": 200, "peakKw": 400, "profile": "intermittent"},
        "foodService": {"typicalKw": 150, "peakKw": 300, "profile": "constant_baseline"},
        "buildingLot": {"typicalKw": 100, "peakKw": 200, "profile": "seasonal_diurnal"},
        "fuelingIslands": {"typicalKw": 40, "peakKw": 80, "profile": "near_constant"}
      }
    }'::jsonb,
    0.85  -- Diversity Factor: 0.85 (85% - high diversity due to peak transit hours)
  WHERE NOT EXISTS (
    SELECT 1 FROM use_case_configurations 
    WHERE use_case_id = v_use_case_id AND is_default = true
  );
  
  RAISE NOTICE '✅ Added default use case configuration';
END $$;

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================

SELECT 
  uc.name as use_case,
  uc.slug,
  cq.display_order,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as option_count,
  cq.help_text
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'heavy_duty_truck_stop'
ORDER BY cq.display_order;
