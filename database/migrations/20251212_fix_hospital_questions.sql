-- ============================================================================
-- FIX HOSPITAL QUESTIONS - Add Industry-Specific Questions
-- December 12, 2025
-- 
-- Based on comprehensive Hospital specifications:
-- - Hospital size classification (Small/Community/Regional/Major/Academic)
-- - Bed count and critical load (85%)
-- - Major equipment categories (HVAC, medical, support, life safety)
-- - NEC 517, NFPA 99, and IEEE 446-1995 standards
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  -- Get hospital use case ID
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hospital' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Hospital use case not found!';
  END IF;
  
  -- Check current question count
  SELECT COUNT(*) INTO v_question_count 
  FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  RAISE NOTICE 'Hospital currently has % questions', v_question_count;
  
  -- Delete ALL existing questions to start fresh
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding hospital-specific questions';
  
  -- ============================================================================
  -- HOSPITAL SPECIFIC QUESTIONS
  -- ============================================================================
  
  -- 1. Hospital size classification
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Hospital size classification', 'hospitalSize', 'select', 'community', true, 'What type/size of hospital facility?', 1,
    '[
      {"label": "Small/Rural (25-100 beds)", "value": "small"},
      {"label": "Community (100-250 beds)", "value": "community"},
      {"label": "Regional (250-500 beds)", "value": "regional"},
      {"label": "Major Medical Center (500-1,000 beds)", "value": "major"},
      {"label": "Academic/Trauma Center (1,000+ beds)", "value": "academic"}
    ]'::jsonb);
  
  -- 2. Number of licensed beds
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of licensed beds', 'bedCount', 'select', '175', true, 'Total licensed bed capacity', 2,
    '[
      {"label": "25 - 50 beds", "value": "37"},
      {"label": "50 - 100 beds", "value": "75"},
      {"label": "100 - 175 beds", "value": "137"},
      {"label": "175 - 250 beds", "value": "212"},
      {"label": "250 - 375 beds", "value": "312"},
      {"label": "375 - 500 beds", "value": "437"},
      {"label": "500 - 750 beds", "value": "625"},
      {"label": "750 - 1,000 beds", "value": "875"},
      {"label": "Over 1,000 beds", "value": "1200"}
    ]'::jsonb);
  
  -- 3. Operating rooms (ORs)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Number of operating rooms', 'operatingRooms', 'select', '8', true, 'Surgical suites (high power, 100% critical)', 3,
    '[
      {"label": "1 - 3 ORs", "value": "2"},
      {"label": "4 - 8 ORs", "value": "6"},
      {"label": "9 - 15 ORs", "value": "12"},
      {"label": "16 - 25 ORs", "value": "20"},
      {"label": "Over 25 ORs", "value": "30"}
    ]'::jsonb);
  
  -- 4. ICU/CCU beds
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'ICU/CCU beds', 'icuBeds', 'select', '20', true, 'Intensive care and cardiac care units (100% critical)', 4,
    '[
      {"label": "5 - 10 beds", "value": "7"},
      {"label": "10 - 20 beds", "value": "15"},
      {"label": "20 - 40 beds", "value": "30"},
      {"label": "40 - 60 beds", "value": "50"},
      {"label": "Over 60 beds", "value": "75"}
    ]'::jsonb);
  
  -- 5. Imaging equipment
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Major imaging equipment', 'imagingEquipment', 'select', 'standard', true, 'MRI, CT, X-ray, and diagnostic imaging', 5,
    '[
      {"label": "Basic - X-ray only", "value": "basic"},
      {"label": "Standard - X-ray + 1 CT", "value": "standard"},
      {"label": "Advanced - X-ray + 2+ CT + 1 MRI", "value": "advanced"},
      {"label": "Comprehensive - Multiple CT/MRI + PET", "value": "comprehensive"},
      {"label": "Academic - Full diagnostic suite", "value": "academic"}
    ]'::jsonb);
  
  -- 6. Emergency department
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have an emergency department?', 'hasEmergencyDept', 'boolean', 'true', true, 'ED/trauma center (100% critical power)', 6);
  
  -- 7. Trauma center level (conditional)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Trauma center level', 'traumaCenterLevel', 'select', 'level2', false, 'ACS trauma designation (affects power criticality)', 7,
    '[
      {"label": "No trauma designation", "value": "none"},
      {"label": "Level III - Community", "value": "level3"},
      {"label": "Level II - Regional", "value": "level2"},
      {"label": "Level I - Academic/Tertiary", "value": "level1"}
    ]'::jsonb);
  
  -- 8. Central energy plant
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Central energy plant type', 'energyPlantType', 'select', 'electric_chiller', true, 'Primary HVAC system type', 8,
    '[
      {"label": "Electric chillers only", "value": "electric_chiller"},
      {"label": "Electric chillers + gas boilers", "value": "electric_gas"},
      {"label": "District heating/cooling", "value": "district"},
      {"label": "Combined heat & power (CHP)", "value": "chp"}
    ]'::jsonb);
  
  -- 9. On-site laboratory
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'On-site laboratory size', 'labSize', 'select', 'standard', true, 'Clinical and diagnostic lab facilities', 9,
    '[
      {"label": "Basic - Send-out only", "value": "basic"},
      {"label": "Standard - Core testing", "value": "standard"},
      {"label": "Advanced - Full service", "value": "advanced"},
      {"label": "Reference lab - Regional testing center", "value": "reference"}
    ]'::jsonb);
  
  -- 10. Pharmacy operations
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Pharmacy operations', 'pharmacyOperations', 'select', 'standard', false, 'Pharmacy and medication storage (refrigeration)', 10,
    '[
      {"label": "Basic - Dispensing only", "value": "basic"},
      {"label": "Standard - Compounding + refrigeration", "value": "standard"},
      {"label": "Advanced - IV compounding + cold storage", "value": "advanced"},
      {"label": "Specialty - Chemo/biologics cold chain", "value": "specialty"}
    ]'::jsonb);
  
  -- 11. Food service operations
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Food service operations', 'foodServiceType', 'select', 'full_kitchen', false, 'Kitchen and food preparation facilities', 11,
    '[
      {"label": "Minimal - Vending/microwaves only", "value": "minimal"},
      {"label": "Cafeteria - Serve and reheat", "value": "cafeteria"},
      {"label": "Full kitchen - Cook on-site", "value": "full_kitchen"},
      {"label": "Multiple kitchens - Campus-wide", "value": "multiple"}
    ]'::jsonb);
  
  -- 12. On-site laundry
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Do you have on-site laundry?', 'hasLaundry', 'boolean', 'true', false, 'On-site laundry (washers, dryers, steam)', 12);
  
  -- 13. Data center / IT infrastructure
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'IT infrastructure / data center', 'itInfrastructure', 'select', 'moderate', true, 'EMR, PACS, IT systems (100% critical)', 13,
    '[
      {"label": "Basic - Shared hosting", "value": "basic"},
      {"label": "Moderate - On-site servers", "value": "moderate"},
      {"label": "Extensive - Full data center", "value": "extensive"},
      {"label": "Enterprise - Redundant data centers", "value": "enterprise"}
    ]'::jsonb);
  
  -- 14. Monthly electric bill
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '150000', true, 'Total facility electricity cost', 14,
    '[
      {"label": "$25,000 - $75,000/month (small)", "value": "50000"},
      {"label": "$75,000 - $150,000/month (community)", "value": "112500"},
      {"label": "$150,000 - $300,000/month (regional)", "value": "225000"},
      {"label": "$300,000 - $600,000/month (major)", "value": "450000"},
      {"label": "Over $600,000/month (academic)", "value": "800000"}
    ]'::jsonb);
  
  -- 15. Monthly demand charges
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '60000', true, 'Peak demand portion of electric bill', 15,
    '[
      {"label": "$10,000 - $30,000/month", "value": "20000"},
      {"label": "$30,000 - $75,000/month", "value": "52500"},
      {"label": "$75,000 - $150,000/month", "value": "112500"},
      {"label": "$150,000 - $300,000/month", "value": "225000"},
      {"label": "Over $300,000/month", "value": "400000"}
    ]'::jsonb);
  
  -- 16. Existing generator capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing emergency generator capacity', 'existingGeneratorKW', 'select', '3000', true, 'Current backup generator size (NEC 517 required)', 16,
    '[
      {"label": "Under 1 MW", "value": "750"},
      {"label": "1 - 3 MW", "value": "2000"},
      {"label": "3 - 6 MW", "value": "4500"},
      {"label": "6 - 10 MW", "value": "8000"},
      {"label": "10 - 20 MW", "value": "15000"},
      {"label": "Over 20 MW", "value": "30000"}
    ]'::jsonb);
  
  -- 17. Existing solar capacity
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Rooftop or ground-mount solar already installed', 17,
    '[
      {"label": "None", "value": "0"},
      {"label": "100 - 500 kW", "value": "300"},
      {"label": "500 kW - 1 MW", "value": "750"},
      {"label": "1 - 3 MW", "value": "2000"},
      {"label": "Over 3 MW", "value": "5000"}
    ]'::jsonb);
  
  -- 18. Interested in solar
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
  VALUES (v_use_case_id, 'Interested in adding solar?', 'wantsSolar', 'boolean', 'true', false, 'Hospitals have excellent roof/parking area for solar', 18);
  
  -- 19. Primary BESS Application
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'backup_power', false, 'How will you primarily use battery storage?', 19,
    '[
      {"label": "Backup Power - Critical load protection (NEC 517)", "value": "backup_power"},
      {"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},
      {"label": "Microgrid - Renewable integration + backup", "value": "microgrid"},
      {"label": "Demand Response - Participate in utility programs", "value": "demand_response"},
      {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}
    ]'::jsonb);
  
  RAISE NOTICE 'Successfully added 19 hospital-specific questions';
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
WHERE uc.slug = 'hospital'
ORDER BY cq.display_order;
