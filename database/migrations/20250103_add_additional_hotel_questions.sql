-- =============================================================================
-- ADD ADDITIONAL HOTEL QUESTIONS
-- =============================================================================
-- After removing solar/EV questions, we have room to add more valuable questions
-- that impact BESS sizing and savings calculations.
--
-- Date: January 3, 2025
-- =============================================================================

DO $$
DECLARE
  v_hotel_id UUID;
  v_max_display_order INTEGER;
BEGIN
  -- Get hotel use case ID
  SELECT id INTO v_hotel_id 
  FROM use_cases 
  WHERE slug = 'hotel' 
  LIMIT 1;

  IF v_hotel_id IS NULL THEN
    RAISE NOTICE 'Hotel use case not found. Skipping migration.';
    RETURN;
  END IF;

  -- Get the highest display_order to append new questions
  SELECT COALESCE(MAX(display_order), 0) INTO v_max_display_order
  FROM custom_questions
  WHERE use_case_id = v_hotel_id;

  -- ============================================================================
  -- Q1: ELEVATOR COUNT (affects base load significantly)
  -- ============================================================================
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type,
    default_value, is_required, help_text, display_order, options,
    metadata
  ) VALUES (
    v_hotel_id,
    'How many elevators does your property have?',
    'elevatorCount',
    'number',
    '2',
    true,
    'Elevators are significant loads - each passenger elevator adds ~15-25 kW. Service elevators add ~10-15 kW.',
    v_max_display_order + 1,
    '[]'::jsonb,
    '{"impact_type": "power_add", "power_per_elevator_kw": 20}'::jsonb
  );

  -- ============================================================================
  -- Q2: BUILDING AGE (affects efficiency - older buildings use 15-30% more)
  -- ============================================================================
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type,
    default_value, is_required, help_text, display_order, options,
    metadata
  ) VALUES (
    v_hotel_id,
    'When was the building constructed?',
    'buildingAge',
    'select',
    'modern',
    true,
    'Older buildings typically have less efficient HVAC and lighting systems, increasing energy consumption by 15-30%.',
    v_max_display_order + 2,
    '[
      {"value": "new", "label": "New (built in last 5 years)", "description": "Most efficient systems", "factor": 0.85},
      {"value": "modern", "label": "Modern (5-15 years old)", "description": "Baseline efficiency", "factor": 1.0},
      {"value": "older", "label": "Older (15-30 years old)", "description": "Some efficiency loss", "factor": 1.15},
      {"value": "historic", "label": "Historic (30+ years old)", "description": "Significant efficiency loss", "factor": 1.3}
    ]'::jsonb,
    '{"impact_type": "efficiency_factor"}'::jsonb
  );

  -- ============================================================================
  -- Q3: GRID CONNECTION CAPACITY (critical for BESS sizing)
  -- ============================================================================
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type,
    default_value, is_required, help_text, display_order, options,
    metadata
  ) VALUES (
    v_hotel_id,
    'What is your current electrical service capacity?',
    'gridConnectionKW',
    'select',
    '500',
    true,
    'Your utility service size determines maximum power draw. BESS can help reduce peak demand below this limit.',
    v_max_display_order + 3,
    '[
      {"value": "200", "label": "200 kW", "description": "Small property"},
      {"value": "400", "label": "400 kW", "description": "Medium property"},
      {"value": "500", "label": "500 kW", "description": "Standard mid-size hotel"},
      {"value": "750", "label": "750 kW", "description": "Large hotel"},
      {"value": "1000", "label": "1,000 kW (1 MW)", "description": "Very large hotel/resort"},
      {"value": "2000", "label": "2,000 kW (2 MW)", "description": "Resort or multiple buildings"},
      {"value": "5000", "label": "5,000 kW (5 MW)", "description": "Large resort complex"}
    ]'::jsonb,
    '{"impact_type": "sizing_constraint", "unit": "kW"}'::jsonb
  );

  -- ============================================================================
  -- Q4: PEAK DEMAND TIMES (affects BESS strategy)
  -- ============================================================================
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type,
    default_value, is_required, help_text, display_order, options,
    metadata
  ) VALUES (
    v_hotel_id,
    'When do you typically see your highest electricity demand?',
    'peakDemandTimes',
    'select',
    'evening',
    true,
    'Understanding peak times helps optimize BESS charging/discharging strategy. Hotels typically peak during evening hours (5-10 PM) when guests return.',
    v_max_display_order + 4,
    '[
      {"value": "morning", "label": "Morning (6 AM - 12 PM)", "description": "Breakfast rush, check-outs"},
      {"value": "afternoon", "label": "Afternoon (12 PM - 5 PM)", "description": "Check-ins, events"},
      {"value": "evening", "label": "Evening (5 PM - 10 PM)", "description": "Dinner, guest activity (most common)"},
      {"value": "night", "label": "Night (10 PM - 6 AM)", "description": "Late-night operations"},
      {"value": "all_day", "label": "Consistent throughout day", "description": "24/7 operations"}
    ]'::jsonb,
    '{"impact_type": "strategy_optimization"}'::jsonb
  );

  -- ============================================================================
  -- Q5: HVAC SYSTEM TYPE (affects load profile)
  -- ============================================================================
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type,
    default_value, is_required, help_text, display_order, options,
    metadata
  ) VALUES (
    v_hotel_id,
    'What type of HVAC system does your property use?',
    'hvacSystemType',
    'select',
    'central',
    true,
    'Central systems are more efficient but create larger peak loads. Individual units provide more flexibility.',
    v_max_display_order + 5,
    '[
      {"value": "central", "label": "Central HVAC system", "description": "Single large system for entire building", "power_factor": 1.0},
      {"value": "individual", "label": "Individual room units (PTAC/PTHP)", "description": "Each room has its own unit", "power_factor": 1.1},
      {"value": "mixed", "label": "Mixed (central + individual)", "description": "Common areas central, rooms individual", "power_factor": 1.05},
      {"value": "vrf", "label": "VRF (Variable Refrigerant Flow)", "description": "Modern efficient system", "power_factor": 0.9},
      {"value": "unknown", "label": "Not sure", "description": "Will use industry average", "power_factor": 1.0}
    ]'::jsonb,
    '{"impact_type": "load_factor"}'::jsonb
  );

  -- ============================================================================
  -- Q6: UTILITY RATE STRUCTURE (critical for savings calculation)
  -- ============================================================================
  INSERT INTO custom_questions (
    use_case_id, question_text, field_name, question_type,
    default_value, is_required, help_text, display_order, options,
    metadata
  ) VALUES (
    v_hotel_id,
    'What is your primary utility rate structure?',
    'utilityRateStructure',
    'select',
    'demand_charge',
    true,
    'Demand charges make up ~40% of hotel utility bills. BESS provides the most value for demand charge rates.',
    v_max_display_order + 6,
    '[
      {"value": "demand_charge", "label": "Demand Charge Rate", "description": "Charged based on peak kW usage (most common)", "savings_potential": "high"},
      {"value": "time_of_use", "label": "Time-of-Use (TOU)", "description": "Different rates for peak/off-peak hours", "savings_potential": "high"},
      {"value": "tiered", "label": "Tiered Rate", "description": "Rate increases with usage", "savings_potential": "medium"},
      {"value": "flat", "label": "Flat Rate", "description": "Same rate all day", "savings_potential": "low"},
      {"value": "unknown", "label": "Not sure", "description": "Will use industry average", "savings_potential": "medium"}
    ]'::jsonb,
    '{"impact_type": "savings_calculation"}'::jsonb
  );

  RAISE NOTICE '✅ Added 6 additional hotel questions (elevator count, building age, grid capacity, peak times, HVAC type, utility rate structure)';

END $$;

-- Verify the new questions were added
SELECT 
  field_name,
  question_text,
  question_type,
  display_order,
  is_required
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel')
AND field_name IN ('elevatorCount', 'buildingAge', 'gridConnectionKW', 'peakDemandTimes', 'hvacSystemType', 'utilityRateStructure')
ORDER BY display_order;

-- Show total question count
SELECT 
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE metadata->>'is_advanced' = 'true') as advanced_questions,
  COUNT(*) FILTER (WHERE metadata->>'is_advanced' != 'true' OR metadata->>'is_advanced' IS NULL) as main_questions
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

