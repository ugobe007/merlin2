-- ============================================================================
-- FIX EV CHARGING HUB QUESTIONS - Add Industry-Specific Questions
-- December 12, 2025
-- 
-- Based on comprehensive EV Charging Hub specifications:
-- - Hub size classification (Small/Medium/Super Site)
-- - Charger type mix (L2, 50kW, 150kW, 350kW, 1MW+)
-- - Connected load and peak demand
-- - Electrical infrastructure requirements
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  -- Get EV charging use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'ev-charging' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'EV charging use case not found!';
  END IF;
  
  -- Check current question count
  SELECT COUNT(*) INTO v_question_count 
  FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  RAISE NOTICE 'EV charging currently has % questions', v_question_count;
  
  -- Delete ALL existing questions to start fresh
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding EV charging-specific questions';
  
  -- ============================================================================
  -- EV CHARGING HUB SPECIFIC QUESTIONS
  -- ============================================================================
  
  -- 1. Hub size classification
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Hub size classification', 'hubSize', 'select', 'small', true, 'What size EV charging hub are you planning?', 1,
    '[
      {"label": "Small Hub (4-30 chargers, 0.5-6 MW)", "value": "small"},
      {"label": "Medium Hub (30-100 chargers, 6-20 MW)", "value": "medium"},
      {"label": "Super Site (100-300+ chargers, 20-60+ MW)", "value": "super"}
    ]'::jsonb);
  
  -- 2. Level 2 AC chargers (7-19 kW)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of Level 2 AC chargers (7-19 kW)', 'level2Chargers', 'select', '5', false, 'Slow charging for extended parking (4-8 hours)', 2,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 5 chargers", "value": "3"},
      {"label": "5 - 10 chargers", "value": "7"},
      {"label": "10 - 20 chargers", "value": "15"},
      {"label": "20 - 40 chargers", "value": "30"},
      {"label": "Over 40 chargers", "value": "50"}
    ]'::jsonb);
  
  -- 3. L3 Standard DCFC (50 kW)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of 50 kW DC fast chargers', 'dcfc50kwChargers', 'select', '4', false, 'Standard DCFC, 45-60 minute charge time', 3,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 5 chargers", "value": "3"},
      {"label": "5 - 10 chargers", "value": "7"},
      {"label": "10 - 20 chargers", "value": "15"},
      {"label": "20 - 40 chargers", "value": "30"},
      {"label": "Over 40 chargers", "value": "50"}
    ]'::jsonb);
  
  -- 4. L3 Fast DCFC (150 kW)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of 150 kW DC fast chargers', 'dcfc150kwChargers', 'select', '6', true, 'Fast DCFC, 15-25 minute charge time', 4,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 10 chargers", "value": "5"},
      {"label": "10 - 25 chargers", "value": "17"},
      {"label": "25 - 50 chargers", "value": "37"},
      {"label": "50 - 100 chargers", "value": "75"},
      {"label": "100 - 150 chargers", "value": "125"},
      {"label": "Over 150 chargers", "value": "175"}
    ]'::jsonb);
  
  -- 5. Ultra-Fast DCFC (350 kW)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of 350 kW ultra-fast chargers', 'dcfc350kwChargers', 'select', '2', false, 'Ultra-fast charging, 8-15 minute charge time', 5,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 5 chargers", "value": "3"},
      {"label": "5 - 15 chargers", "value": "10"},
      {"label": "15 - 40 chargers", "value": "27"},
      {"label": "40 - 80 chargers", "value": "60"},
      {"label": "80 - 150 chargers", "value": "115"},
      {"label": "Over 150 chargers", "value": "175"}
    ]'::jsonb);
  
  -- 6. Megawatt Charging (1 MW+ for heavy duty)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of megawatt chargers (1 MW+)', 'megawattChargers', 'select', '0', false, 'Heavy duty truck charging, 30-45 minute charge', 6,
    '[
      {"label": "None", "value": "0"},
      {"label": "1 - 2 chargers", "value": "1"},
      {"label": "2 - 5 chargers", "value": "3"},
      {"label": "5 - 10 chargers", "value": "7"},
      {"label": "10 - 20 chargers", "value": "15"},
      {"label": "20 - 30 chargers", "value": "25"},
      {"label": "Over 30 chargers", "value": "35"}
    ]'::jsonb);
  
  -- 7. Peak concurrent charging sessions
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Peak concurrent charging sessions', 'concurrentChargingSessions', 'select', '60', true, 'What % of chargers used simultaneously at peak?', 7,
    '[
      {"label": "30% - Light traffic", "value": "30"},
      {"label": "50% - Moderate traffic", "value": "50"},
      {"label": "60% - High traffic (default)", "value": "60"},
      {"label": "75% - Very high traffic", "value": "75"},
      {"label": "90% - Peak utilization", "value": "90"}
    ]'::jsonb);
  
  -- 8. Grid connection capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Current grid connection capacity', 'gridCapacityKW', 'select', '3000', true, 'Your facility''s electrical service size', 8,
    '[
      {"label": "Under 1 MW", "value": "750"},
      {"label": "1 - 3 MW", "value": "2000"},
      {"label": "3 - 6 MW", "value": "4500"},
      {"label": "6 - 10 MW", "value": "8000"},
      {"label": "10 - 20 MW", "value": "15000"},
      {"label": "20 - 40 MW", "value": "30000"},
      {"label": "Over 40 MW", "value": "50000"}
    ]'::jsonb);
  
  -- 9. Service voltage
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Utility service voltage', 'serviceVoltage', 'select', '12.47kv', false, 'Medium voltage utility connection', 9,
    '[
      {"label": "480V - Low voltage (small hub)", "value": "480v"},
      {"label": "4.16 kV - Medium voltage", "value": "4.16kv"},
      {"label": "12.47 kV - Medium voltage (standard)", "value": "12.47kv"},
      {"label": "13.8 kV - Medium voltage", "value": "13.8kv"},
      {"label": "34.5 kV - High voltage (large hub)", "value": "34.5kv"},
      {"label": "69 kV - High voltage (super site)", "value": "69kv"}
    ]'::jsonb);
  
  -- 10. Operating hours
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Operating hours', 'operatingHours', 'select', '24_7', true, 'When will charging be available?', 10,
    '[
      {"label": "Business hours (8am-6pm)", "value": "business"},
      {"label": "Extended hours (6am-10pm)", "value": "extended"},
      {"label": "24/7 Operations", "value": "24_7"}
    ]'::jsonb);
  
  -- 11. Monthly electric bill (estimate)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Estimated monthly electricity bill', 'monthlyElectricBill', 'select', '50000', false, 'Expected monthly electricity cost for hub', 11,
    '[
      {"label": "$5,000 - $15,000/month (small)", "value": "10000"},
      {"label": "$15,000 - $40,000/month", "value": "27500"},
      {"label": "$40,000 - $75,000/month (medium)", "value": "57500"},
      {"label": "$75,000 - $150,000/month", "value": "112500"},
      {"label": "$150,000 - $300,000/month (large)", "value": "225000"},
      {"label": "Over $300,000/month (super)", "value": "400000"}
    ]'::jsonb);
  
  -- 12. Monthly demand charges
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '20000', true, 'Peak demand portion of electric bill (critical for BESS ROI)', 12,
    '[
      {"label": "$2,000 - $7,500/month", "value": "5000"},
      {"label": "$7,500 - $15,000/month", "value": "11250"},
      {"label": "$15,000 - $30,000/month", "value": "22500"},
      {"label": "$30,000 - $60,000/month", "value": "45000"},
      {"label": "$60,000 - $120,000/month", "value": "90000"},
      {"label": "Over $120,000/month", "value": "150000"}
    ]'::jsonb);
  
  -- 13. Existing solar capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Solar carports or ground mount already installed', 13,
    '[
      {"label": "None", "value": "0"},
      {"label": "50 - 250 kW", "value": "150"},
      {"label": "250 - 500 kW", "value": "375"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 3 MW", "value": "2000"},
      {"label": "3 - 6 MW", "value": "4500"},
      {"label": "Over 6 MW", "value": "8000"}
    ]'::jsonb);
  
  -- 14. Wants solar carports
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Interested in solar carports?', 'wantsSolar', 'boolean', 'true', false, 'Solar carports provide shade + renewable energy', 14);
  
  -- 15. Has amenities (retail, food service, restrooms)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have amenities on-site?', 'hasAmenities', 'boolean', 'true', false, 'Retail, food service, restrooms, lounge (adds power load)', 15);
  
  -- 16. Primary BESS Application
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'How will you primarily use battery storage?', 16,
    '[
      {"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},
      {"label": "Load Balancing - Smooth charging demand spikes", "value": "load_balancing"},
      {"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},
      {"label": "Backup Power - Keep critical chargers online during outages", "value": "backup_power"},
      {"label": "Demand Response - Participate in utility programs", "value": "demand_response"},
      {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added 16 EV charging hub-specific questions';
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
WHERE uc.slug = 'ev-charging'
ORDER BY cq.display_order;
