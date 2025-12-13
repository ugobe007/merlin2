-- ============================================================================
-- FIX WAREHOUSE QUESTIONS - Add Industry-Specific Questions
-- December 12, 2025
-- 
-- Based on comprehensive Warehouse specifications:
-- - Size classification (Small/Medium/Large/Mega/Cold Storage)
-- - Material handling, HVAC/refrigeration, lighting/IT
-- - Critical load 35% (60% for cold storage)
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  -- Get warehouse use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'warehouse' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Warehouse use case not found!';
  END IF;
  
  -- Check current question count
  SELECT COUNT(*) INTO v_question_count 
  FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  RAISE NOTICE 'Warehouse currently has % questions', v_question_count;
  
  -- Delete ALL existing questions to start fresh
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding warehouse-specific questions';
  
  -- ============================================================================
  -- WAREHOUSE SPECIFIC QUESTIONS
  -- ============================================================================
  
  -- 1. Warehouse size classification
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Warehouse size classification', 'warehouseSize', 'select', 'medium', true, 'What size warehouse facility?', 1,
    '[
      {"label": "Small (25k-100k sq ft)", "value": "small"},
      {"label": "Medium (100k-300k sq ft)", "value": "medium"},
      {"label": "Large (300k-750k sq ft)", "value": "large"},
      {"label": "Mega (750k-1.5M+ sq ft)", "value": "mega"}
    ]'::jsonb);
  
  -- 2. Total square footage
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Total warehouse square footage', 'warehouseSqFt', 'select', '200000', true, 'Total building area under roof', 2,
    '[
      {"label": "25,000 - 60,000 sq ft", "value": "42500"},
      {"label": "60,000 - 100,000 sq ft", "value": "80000"},
      {"label": "100,000 - 200,000 sq ft", "value": "150000"},
      {"label": "200,000 - 300,000 sq ft", "value": "250000"},
      {"label": "300,000 - 500,000 sq ft", "value": "400000"},
      {"label": "500,000 - 750,000 sq ft", "value": "625000"},
      {"label": "750,000 - 1,000,000 sq ft", "value": "875000"},
      {"label": "Over 1,000,000 sq ft", "value": "1250000"}
    ]'::jsonb);
  
  -- 3. Warehouse type / specialization
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Warehouse type / specialization', 'warehouseType', 'select', 'distribution', true, 'Primary warehouse function', 3,
    '[
      {"label": "Distribution Center - General storage & shipping", "value": "distribution"},
      {"label": "Fulfillment Center - E-commerce & rapid shipping", "value": "fulfillment"},
      {"label": "Cold Storage - Refrigerated/frozen goods", "value": "cold_storage"},
      {"label": "Food & Beverage - Temperature-controlled", "value": "food_beverage"},
      {"label": "Cross-Dock - Minimal storage, high throughput", "value": "cross_dock"},
      {"label": "Manufacturing Storage - Raw materials & WIP", "value": "manufacturing_storage"}
    ]'::jsonb);
  
  -- 4. Ceiling height
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Clear ceiling height', 'ceilingHeight', 'select', '32', false, 'Clear height to lowest obstruction (affects lighting load)', 4,
    '[
      {"label": "18 - 24 feet", "value": "21"},
      {"label": "24 - 32 feet (standard)", "value": "28"},
      {"label": "32 - 40 feet", "value": "36"},
      {"label": "Over 40 feet", "value": "45"}
    ]'::jsonb);
  
  -- 5. Material handling systems
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Material handling systems', 'materialHandling', 'select', 'moderate', true, 'Conveyors, sortation, automation level', 5,
    '[
      {"label": "Manual - Forklifts only", "value": "manual"},
      {"label": "Basic - Forklifts + pallet jacks", "value": "basic"},
      {"label": "Moderate - Conveyors + sortation", "value": "moderate"},
      {"label": "Advanced - Automated storage/retrieval", "value": "advanced"},
      {"label": "Highly automated - Robotics & AS/RS", "value": "highly_automated"}
    ]'::jsonb);
  
  -- 6. Forklift fleet size
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Electric forklift fleet size', 'forkliftCount', 'select', '15', false, 'Number of electric forklifts requiring charging', 6,
    '[
      {"label": "1 - 5 forklifts", "value": "3"},
      {"label": "5 - 15 forklifts", "value": "10"},
      {"label": "15 - 30 forklifts", "value": "22"},
      {"label": "30 - 50 forklifts", "value": "40"},
      {"label": "Over 50 forklifts", "value": "65"}
    ]'::jsonb);
  
  -- 7. Refrigeration / freezer space
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Refrigerated/freezer space', 'coldStorageSqFt', 'select', '0', false, 'Temperature-controlled storage area (adds 50-100% power)', 7,
    '[
      {"label": "None", "value": "0"},
      {"label": "10% - 25% of facility", "value": "10000"},
      {"label": "25% - 50% of facility", "value": "35000"},
      {"label": "50% - 75% of facility", "value": "60000"},
      {"label": "75% - 100% (dedicated cold storage)", "value": "85000"}
    ]'::jsonb);
  
  -- 8. Dock doors / loading bays
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of dock doors', 'dockDoors', 'select', '20', false, 'Loading bays with dock levelers, lights, fans', 8,
    '[
      {"label": "1 - 10 doors", "value": "5"},
      {"label": "10 - 25 doors", "value": "17"},
      {"label": "25 - 50 doors", "value": "37"},
      {"label": "50 - 100 doors", "value": "75"},
      {"label": "Over 100 doors", "value": "125"}
    ]'::jsonb);
  
  -- 9. Operating hours
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Operating hours', 'operatingHours', 'select', '2_shift', true, 'When is the warehouse operational?', 9,
    '[
      {"label": "1 Shift (8 hours/day)", "value": "1_shift"},
      {"label": "2 Shifts (16 hours/day)", "value": "2_shift"},
      {"label": "3 Shifts (24 hours/day)", "value": "3_shift"},
      {"label": "24/7 Operations", "value": "24_7"}
    ]'::jsonb);
  
  -- 10. Office/admin space
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Office/admin space', 'officeSqFt', 'select', '5000', false, 'Climate-controlled office area', 10,
    '[
      {"label": "Under 2,000 sq ft", "value": "1500"},
      {"label": "2,000 - 5,000 sq ft", "value": "3500"},
      {"label": "5,000 - 10,000 sq ft", "value": "7500"},
      {"label": "10,000 - 20,000 sq ft", "value": "15000"},
      {"label": "Over 20,000 sq ft", "value": "25000"}
    ]'::jsonb);
  
  -- 11. IT/WMS systems
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'IT infrastructure / WMS', 'itInfrastructure', 'select', 'standard', true, 'Warehouse management system and IT equipment', 11,
    '[
      {"label": "Basic - Minimal IT", "value": "basic"},
      {"label": "Standard - WMS + servers", "value": "standard"},
      {"label": "Advanced - Full IT suite + automation controls", "value": "advanced"},
      {"label": "Enterprise - On-site data center", "value": "enterprise"}
    ]'::jsonb);
  
  -- 12. Monthly electric bill
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '30000', true, 'Total facility electricity cost', 12,
    '[
      {"label": "$5,000 - $15,000/month (small)", "value": "10000"},
      {"label": "$15,000 - $40,000/month (medium)", "value": "27500"},
      {"label": "$40,000 - $75,000/month (large)", "value": "57500"},
      {"label": "$75,000 - $150,000/month (mega)", "value": "112500"},
      {"label": "$150,000 - $300,000/month (cold storage)", "value": "225000"},
      {"label": "Over $300,000/month", "value": "400000"}
    ]'::jsonb);
  
  -- 13. Monthly demand charges
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '12000', true, 'Peak demand portion of electric bill', 13,
    '[
      {"label": "$1,000 - $5,000/month", "value": "3000"},
      {"label": "$5,000 - $15,000/month", "value": "10000"},
      {"label": "$15,000 - $30,000/month", "value": "22500"},
      {"label": "$30,000 - $60,000/month", "value": "45000"},
      {"label": "Over $60,000/month", "value": "80000"}
    ]'::jsonb);
  
  -- 14. Grid connection capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Grid connection capacity', 'gridCapacityKW', 'select', '800', true, 'Your facility''s electrical service size', 14,
    '[
      {"label": "Under 200 kW", "value": "150"},
      {"label": "200 - 500 kW", "value": "350"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "2 - 4 MW", "value": "3000"},
      {"label": "Over 4 MW", "value": "6000"}
    ]'::jsonb);
  
  -- 15. Existing solar capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Rooftop solar already installed', 15,
    '[
      {"label": "None", "value": "0"},
      {"label": "50 - 250 kW", "value": "150"},
      {"label": "250 - 500 kW", "value": "375"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 2 MW", "value": "1500"},
      {"label": "Over 2 MW", "value": "3000"}
    ]'::jsonb);
  
  -- 16. Interested in solar
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Interested in adding rooftop solar?', 'wantsSolar', 'boolean', 'true', false, 'Warehouses have excellent roof space for solar', 16);
  
  -- 17. Primary BESS Application
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'How will you primarily use battery storage?', 17,
    '[
      {"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},
      {"label": "Energy Arbitrage - Buy low, use high", "value": "energy_arbitrage"},
      {"label": "Backup Power - Critical systems during outages", "value": "backup_power"},
      {"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},
      {"label": "Load Shifting - Move consumption to off-peak", "value": "load_shifting"},
      {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added 17 warehouse-specific questions';
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
WHERE uc.slug = 'warehouse'
ORDER BY cq.display_order;
