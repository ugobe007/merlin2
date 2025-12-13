-- ============================================================================
-- FIX MANUFACTURING QUESTIONS - Add Industry-Specific Questions
-- December 12, 2025
-- 
-- Based on comprehensive Manufacturing specifications:
-- - Size classification (Small/Medium/Large/Heavy Industrial)
-- - Industry-specific profiles (Food/Auto/Electronics/Metals/Plastics/Pharma/Chemical)
-- - Production equipment, process systems, facility systems
-- - Critical load 60% (varies by industry)
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  -- Get manufacturing use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'manufacturing' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Manufacturing use case not found!';
  END IF;
  
  -- Check current question count
  SELECT COUNT(*) INTO v_question_count 
  FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  RAISE NOTICE 'Manufacturing currently has % questions', v_question_count;
  
  -- Delete ALL existing questions to start fresh
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding manufacturing-specific questions';
  
  -- ============================================================================
  -- MANUFACTURING SPECIFIC QUESTIONS
  -- ============================================================================
  
  -- 1. Manufacturing size classification
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Facility size classification', 'manufacturingSize', 'select', 'medium', true, 'What size manufacturing facility?', 1,
    '[
      {"label": "Small (10k-50k sq ft)", "value": "small"},
      {"label": "Medium (50k-200k sq ft)", "value": "medium"},
      {"label": "Large (200k-500k sq ft)", "value": "large"},
      {"label": "Heavy Industrial (500k+ sq ft)", "value": "heavy"}
    ]'::jsonb);
  
  -- 2. Total facility square footage
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Total facility square footage', 'squareFootage', 'select', '125000', true, 'Total manufacturing floor area', 2,
    '[
      {"label": "10,000 - 30,000 sq ft", "value": "20000"},
      {"label": "30,000 - 75,000 sq ft", "value": "52500"},
      {"label": "75,000 - 150,000 sq ft", "value": "112500"},
      {"label": "150,000 - 250,000 sq ft", "value": "200000"},
      {"label": "250,000 - 400,000 sq ft", "value": "325000"},
      {"label": "400,000 - 600,000 sq ft", "value": "500000"},
      {"label": "Over 600,000 sq ft", "value": "800000"}
    ]'::jsonb);
  
  -- 3. Industry type / specialization
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Industry type / specialization', 'industryType', 'select', 'general', true, 'What type of manufacturing?', 3,
    '[
      {"label": "Food & Beverage - High load, FDA compliance", "value": "food_beverage"},
      {"label": "Automotive - Very high load, welding/paint", "value": "automotive"},
      {"label": "Electronics - Medium load, clean rooms", "value": "electronics"},
      {"label": "Metals/Fabrication - Very high load, arc furnaces", "value": "metals"},
      {"label": "Plastics - High load, injection molding", "value": "plastics"},
      {"label": "Pharmaceutical - Medium load, HVAC critical", "value": "pharmaceutical"},
      {"label": "Chemical - High load, process control", "value": "chemical"},
      {"label": "General Manufacturing - Mixed operations", "value": "general"}
    ]'::jsonb);
  
  -- 4. Primary production equipment
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary production equipment', 'productionEquipment', 'select', 'cnc_machining', true, 'Main manufacturing processes', 4,
    '[
      {"label": "CNC/Machine Tools", "value": "cnc_machining"},
      {"label": "Welding Systems", "value": "welding"},
      {"label": "Injection Molding", "value": "injection_molding"},
      {"label": "Assembly Lines", "value": "assembly"},
      {"label": "Stamping/Press", "value": "stamping"},
      {"label": "Ovens/Furnaces", "value": "ovens_furnaces"},
      {"label": "Extrusion", "value": "extrusion"},
      {"label": "Mixed Equipment", "value": "mixed"}
    ]'::jsonb);
  
  -- 5. Process heating/cooling
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Process heating/cooling requirements', 'processHeatingCooling', 'select', 'moderate', true, 'Temperature control for manufacturing', 5,
    '[
      {"label": "Minimal - Ambient temperature OK", "value": "minimal"},
      {"label": "Moderate - Some process cooling", "value": "moderate"},
      {"label": "Significant - Chillers + cooling towers", "value": "significant"},
      {"label": "Heavy - Industrial refrigeration", "value": "heavy"},
      {"label": "Critical - Pharma/food-grade temperature control", "value": "critical"}
    ]'::jsonb);
  
  -- 6. Compressed air systems
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Compressed air system size', 'compressedAirSize', 'select', 'standard', true, 'Air compressor capacity', 6,
    '[
      {"label": "Minimal - Shop air only", "value": "minimal"},
      {"label": "Standard - Production tools + automation", "value": "standard"},
      {"label": "Large - Heavy pneumatic systems", "value": "large"},
      {"label": "Very large - Plant-wide high-pressure air", "value": "very_large"}
    ]'::jsonb);
  
  -- 7. Clean room / controlled environment
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Clean room / controlled environment', 'cleanRoomArea', 'select', '0', false, 'ISO clean room or controlled manufacturing area', 7,
    '[
      {"label": "None", "value": "0"},
      {"label": "Under 5,000 sq ft", "value": "2500"},
      {"label": "5,000 - 15,000 sq ft", "value": "10000"},
      {"label": "15,000 - 40,000 sq ft", "value": "27500"},
      {"label": "Over 40,000 sq ft", "value": "60000"}
    ]'::jsonb);
  
  -- 8. Paint booth / coating operations
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have paint booth or coating operations?', 'hasPaintBooth', 'boolean', 'false', false, 'Paint booths (spray, cure ovens, ventilation)', 8);
  
  -- 9. Welding operations
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Welding operations scale', 'weldingScale', 'select', 'none', false, 'Arc welding, spot welding, robotic welding', 9,
    '[
      {"label": "None", "value": "none"},
      {"label": "Light - Manual welding stations", "value": "light"},
      {"label": "Moderate - Multiple welding bays", "value": "moderate"},
      {"label": "Heavy - Robotic welding lines", "value": "heavy"},
      {"label": "Very heavy - High-current arc welding", "value": "very_heavy"}
    ]'::jsonb);
  
  -- 10. Material handling / overhead cranes
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Material handling equipment', 'materialHandling', 'select', 'moderate', true, 'Cranes, conveyors, hoists, forklifts', 10,
    '[
      {"label": "Basic - Forklifts only", "value": "basic"},
      {"label": "Moderate - Forklifts + conveyors", "value": "moderate"},
      {"label": "Advanced - Overhead cranes + automated", "value": "advanced"},
      {"label": "Heavy industrial - Large cranes + extensive automation", "value": "heavy"}
    ]'::jsonb);
  
  -- 11. Operating schedule
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Operating schedule', 'operatingSchedule', 'select', '2_shift', true, 'When does production run?', 11,
    '[
      {"label": "1 Shift (8 hours/day, 5 days)", "value": "1_shift"},
      {"label": "2 Shifts (16 hours/day, 5 days)", "value": "2_shift"},
      {"label": "2 Shifts (16 hours/day, 6-7 days)", "value": "2_shift_full"},
      {"label": "3 Shifts (24 hours/day, 5 days)", "value": "3_shift"},
      {"label": "24/7 Continuous Operations", "value": "24_7"}
    ]'::jsonb);
  
  -- 12. Power quality requirements
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Power quality requirements', 'powerQuality', 'select', 'standard', true, 'Sensitivity to voltage sags, harmonics, outages', 12,
    '[
      {"label": "Standard - Basic equipment", "value": "standard"},
      {"label": "High - CNC, robotics, automation", "value": "high"},
      {"label": "Very high - Electronics, precision machining", "value": "very_high"},
      {"label": "Critical - Pharma, semiconductors, clean rooms", "value": "critical"}
    ]'::jsonb);
  
  -- 13. Monthly electric bill
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '50000', true, 'Total facility electricity cost', 13,
    '[
      {"label": "$10,000 - $30,000/month (small)", "value": "20000"},
      {"label": "$30,000 - $75,000/month (medium)", "value": "52500"},
      {"label": "$75,000 - $150,000/month (large)", "value": "112500"},
      {"label": "$150,000 - $300,000/month", "value": "225000"},
      {"label": "$300,000 - $600,000/month (heavy)", "value": "450000"},
      {"label": "Over $600,000/month", "value": "800000"}
    ]'::jsonb);
  
  -- 14. Monthly demand charges
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '20000', true, 'Peak demand portion of electric bill', 14,
    '[
      {"label": "$3,000 - $10,000/month", "value": "6500"},
      {"label": "$10,000 - $25,000/month", "value": "17500"},
      {"label": "$25,000 - $50,000/month", "value": "37500"},
      {"label": "$50,000 - $100,000/month", "value": "75000"},
      {"label": "Over $100,000/month", "value": "150000"}
    ]'::jsonb);
  
  -- 15. Grid connection capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Grid connection capacity', 'gridCapacityKW', 'select', '2000', true, 'Your facility''s electrical service size', 15,
    '[
      {"label": "Under 500 kW", "value": "350"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "2 - 4 MW", "value": "3000"},
      {"label": "4 - 8 MW", "value": "6000"},
      {"label": "8 - 15 MW", "value": "11500"},
      {"label": "Over 15 MW", "value": "20000"}
    ]'::jsonb);
  
  -- 16. Existing generator capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing emergency generator', 'existingGeneratorKW', 'select', '500', false, 'Backup generator for critical systems', 16,
    '[
      {"label": "None", "value": "0"},
      {"label": "Under 250 kW", "value": "150"},
      {"label": "250 - 500 kW", "value": "375"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "Over 2 MW", "value": "3000"}
    ]'::jsonb);
  
  -- 17. Existing solar capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Rooftop or ground-mount solar already installed', 17,
    '[
      {"label": "None", "value": "0"},
      {"label": "50 - 250 kW", "value": "150"},
      {"label": "250 - 500 kW", "value": "375"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 3 MW", "value": "2000"},
      {"label": "Over 3 MW", "value": "5000"}
    ]'::jsonb);
  
  -- 18. Interested in solar
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Interested in adding solar?', 'wantsSolar', 'boolean', 'true', false, 'Manufacturing facilities have good roof/land for solar', 18);
  
  -- 19. Primary BESS Application
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'How will you primarily use battery storage?', 19,
    '[
      {"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},
      {"label": "Energy Arbitrage - Buy low, use high", "value": "energy_arbitrage"},
      {"label": "Power Quality - Ride-through voltage sags", "value": "power_quality"},
      {"label": "Backup Power - Critical process continuity", "value": "backup_power"},
      {"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},
      {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added 19 manufacturing-specific questions';
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
WHERE uc.slug = 'manufacturing'
ORDER BY cq.display_order;
