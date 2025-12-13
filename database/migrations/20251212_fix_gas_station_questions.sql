-- ============================================================================
-- FIX GAS STATION QUESTIONS - Add Industry-Specific Questions
-- December 12, 2025
-- 
-- Replace generic questions with gas station specific questions:
-- - Number of fuel dispensers (with dropdown ranges)
-- - Convenience store square footage (with dropdown ranges)
-- - Car wash on-site (boolean)
-- - Service bay / mechanic shop (boolean)
-- - Food service / hot food (boolean)
-- - Number of EV chargers (with dropdown ranges)
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  -- Get gas station use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'gas-station' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Gas station use case not found!';
  END IF;
  
  -- Check current question count
  SELECT COUNT(*) INTO v_question_count 
  FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  RAISE NOTICE 'Gas station currently has % questions', v_question_count;
  
  -- Delete ALL existing gas station questions to start fresh
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding gas station-specific questions';
  
  -- ============================================================================
  -- GAS STATION SPECIFIC QUESTIONS
  -- ============================================================================
  
  -- 1. Number of fuel dispensers (DROPDOWN)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of fuel dispensers', 'fuelDispensers', 'select', '10', true, 'Total gas/diesel pump positions at your station', 1,
    '[
      {"label": "2 - 4 dispensers (Small station)", "value": "3"},
      {"label": "5 - 8 dispensers (Standard)", "value": "6"},
      {"label": "8 - 12 dispensers (Large)", "value": "10"},
      {"label": "12 - 16 dispensers (Travel center)", "value": "14"},
      {"label": "16 - 24 dispensers (Mega station)", "value": "20"},
      {"label": "24 - 32 dispensers (Truck stop)", "value": "28"},
      {"label": "Over 32 dispensers", "value": "36"}
    ]'::jsonb);
  
  -- 2. Convenience store square footage (DROPDOWN)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Convenience store square footage', 'storeSqFt', 'select', '3000', true, 'Size of attached retail/c-store space', 2,
    '[
      {"label": "500 - 1,500 sq ft (Kiosk)", "value": "1000"},
      {"label": "1,500 - 3,000 sq ft (Small)", "value": "2250"},
      {"label": "3,000 - 5,000 sq ft (Standard)", "value": "4000"},
      {"label": "5,000 - 8,000 sq ft (Large)", "value": "6500"},
      {"label": "8,000 - 12,000 sq ft (Super store)", "value": "10000"},
      {"label": "12,000 - 20,000 sq ft (Travel center)", "value": "16000"},
      {"label": "Over 20,000 sq ft", "value": "25000"}
    ]'::jsonb);
  
  -- 3. Has car wash on-site
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have a car wash on-site?', 'hasCarWash', 'boolean', 'false', false, 'Car wash adds significant power demand (pumps, dryers, heaters)', 3);
  
  -- 4. Car wash type (conditional on hasCarWash)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Car wash type', 'carWashType', 'select', 'automatic', false, 'What type of car wash facility?', 4,
    '[
      {"label": "Self-Service Bays", "value": "self-service"},
      {"label": "Automatic In-Bay", "value": "automatic"},
      {"label": "Conveyor Tunnel", "value": "tunnel"},
      {"label": "Multiple Types", "value": "multiple"}
    ]'::jsonb);
  
  -- 5. Has service bays / mechanic shop
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have service bays or a mechanic shop?', 'hasServiceBays', 'boolean', 'false', false, 'Service bays add power needs for lifts, tools, and compressors', 5);
  
  -- 6. Number of service bays (conditional)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of service bays', 'serviceBayCount', 'select', '0', false, 'How many service/mechanic bays?', 6,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 2 bays", "value": "1"},
      {"label": "3 - 4 bays", "value": "3"},
      {"label": "5 - 8 bays", "value": "6"},
      {"label": "Over 8 bays", "value": "10"}
    ]'::jsonb);
  
  -- 7. Has food service / hot food
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have food service or hot food?', 'hasFoodService', 'boolean', 'false', false, 'Kitchen equipment (ovens, grills, warmers) increases power demand', 7);
  
  -- 8. Operating hours
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Operating hours', 'operatingHours', 'select', '24_7', true, 'When is your station open?', 8,
    '[
      {"label": "Standard (6am-10pm)", "value": "standard"},
      {"label": "Extended (5am-midnight)", "value": "extended"},
      {"label": "24/7 Operations", "value": "24_7"}
    ]'::jsonb);
  
  -- 9. Monthly electric bill (DROPDOWN)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '8000', true, 'Your typical monthly electricity cost', 9,
    '[
      {"label": "$1,000 - $3,000/month", "value": "2000"},
      {"label": "$3,000 - $5,000/month", "value": "4000"},
      {"label": "$5,000 - $10,000/month", "value": "7500"},
      {"label": "$10,000 - $20,000/month", "value": "15000"},
      {"label": "$20,000 - $40,000/month", "value": "30000"},
      {"label": "$40,000 - $75,000/month", "value": "57500"},
      {"label": "Over $75,000/month", "value": "100000"}
    ]'::jsonb);
  
  -- 10. Monthly demand charges (DROPDOWN)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '1500', false, 'Peak demand portion of your electric bill', 10,
    '[
      {"label": "None / Not sure", "value": "0"},
      {"label": "$100 - $500/month", "value": "300"},
      {"label": "$500 - $1,500/month", "value": "1000"},
      {"label": "$1,500 - $3,000/month", "value": "2250"},
      {"label": "$3,000 - $7,500/month", "value": "5250"},
      {"label": "$7,500 - $15,000/month", "value": "11250"},
      {"label": "Over $15,000/month", "value": "20000"}
    ]'::jsonb);
  
  -- 11. Grid connection capacity (DROPDOWN)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Grid connection capacity', 'gridCapacityKW', 'select', '200', true, 'Your facility''s electrical service size', 11,
    '[
      {"label": "50 - 100 kW", "value": "75"},
      {"label": "100 - 200 kW", "value": "150"},
      {"label": "200 - 400 kW", "value": "300"},
      {"label": "400 - 600 kW", "value": "500"},
      {"label": "600 kW - 1 MW", "value": "800"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "Over 2 MW", "value": "3000"}
    ]'::jsonb);
  
  -- 12. Existing EV chargers
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of existing EV chargers', 'existingEVChargers', 'select', '0', false, 'Current EV charging stations at your location', 12,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 2 chargers", "value": "1"},
      {"label": "3 - 4 chargers", "value": "3"},
      {"label": "5 - 8 chargers", "value": "6"},
      {"label": "9 - 16 chargers", "value": "12"},
      {"label": "Over 16 chargers", "value": "20"}
    ]'::jsonb);
  
  -- 13. Wants more EV charging
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Are you interested in adding more EV charging?', 'wantsMoreEVCharging', 'boolean', 'true', false, 'We can help you size and price EV charging infrastructure', 13);
  
  -- 14. Existing solar capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Solar canopy or rooftop solar already installed', 14,
    '[
      {"label": "None", "value": "0"},
      {"label": "10 - 50 kW", "value": "30"},
      {"label": "50 - 100 kW", "value": "75"},
      {"label": "100 - 250 kW", "value": "175"},
      {"label": "250 - 500 kW", "value": "375"},
      {"label": "Over 500 kW", "value": "750"}
    ]'::jsonb);
  
  -- 15. Wants solar
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Are you interested in adding solar canopy?', 'wantsSolar', 'boolean', 'true', false, 'Solar canopy over pump islands can offset electricity costs', 15);
  
  -- 16. Primary BESS Application
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'How will you primarily use battery storage?', 16,
    '[
      {"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},
      {"label": "Energy Arbitrage - Buy low, sell/use high", "value": "energy_arbitrage"},
      {"label": "Backup Power - Critical load protection", "value": "backup_power"},
      {"label": "EV Charging Support - Buffer for high-power charging", "value": "ev_charging_support"},
      {"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},
      {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added 16 gas station-specific questions';
END $$;

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================

SELECT 
  uc.name as use_case,
  cq.display_order,
  cq.question_text,
  cq.field_name,
  cq.question_type,
  CASE 
    WHEN cq.options IS NOT NULL THEN jsonb_array_length(cq.options)::text || ' options'
    ELSE 'N/A'
  END as option_count
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.slug = 'gas-station'
ORDER BY cq.display_order;
