-- ============================================================================
-- DEPLOY ALL INDUSTRY-SPECIFIC QUESTIONS
-- December 12, 2025
-- 
-- This file runs all 5 industry question migrations in sequence.
-- Run this SINGLE file in Supabase SQL Editor to deploy everything.
-- ============================================================================

-- ============================================================================
-- 1. EV CHARGING HUB (16 questions)
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_question_count INT;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'ev-charging' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'EV charging use case not found!';
  END IF;
  
  SELECT COUNT(*) INTO v_question_count FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'EV charging currently has % questions', v_question_count;
  
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  RAISE NOTICE 'Deleted old questions, adding EV charging-specific questions';
  
  -- Hub size classification
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
  VALUES (v_use_case_id, 'Hub size classification', 'hubSize', 'select', 'small', true, 'What size EV charging hub are you planning?', 1,
    '[
      {"label": "Small Hub (4-30 chargers, 0.5-6 MW)", "value": "small"},
      {"label": "Medium Hub (30-100 chargers, 6-20 MW)", "value": "medium"},
      {"label": "Super Site (100-300+ chargers, 20-60+ MW)", "value": "super"}
    ]'::jsonb);
  
  -- Level 2 AC chargers
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
  
  -- 50 kW DCFC
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
  
  -- 150 kW DCFC
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
  
  -- 350 kW Ultra-Fast
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
  
  -- 1 MW+ Megawatt
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
  
  -- Remaining EV Charging questions (7-16)
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options) VALUES
  (v_use_case_id, 'Peak concurrent charging sessions', 'concurrentChargingSessions', 'select', '60', true, 'What % of chargers used simultaneously at peak?', 7, '[{"label": "30% - Light traffic", "value": "30"},{"label": "50% - Moderate traffic", "value": "50"},{"label": "60% - High traffic (default)", "value": "60"},{"label": "75% - Very high traffic", "value": "75"},{"label": "90% - Peak utilization", "value": "90"}]'::jsonb),
  (v_use_case_id, 'Current grid connection capacity', 'gridCapacityKW', 'select', '3000', true, 'Your facility''s electrical service size', 8, '[{"label": "Under 1 MW", "value": "750"},{"label": "1 - 3 MW", "value": "2000"},{"label": "3 - 6 MW", "value": "4500"},{"label": "6 - 10 MW", "value": "8000"},{"label": "10 - 20 MW", "value": "15000"},{"label": "20 - 40 MW", "value": "30000"},{"label": "Over 40 MW", "value": "50000"}]'::jsonb),
  (v_use_case_id, 'Utility service voltage', 'serviceVoltage', 'select', '12.47kv', false, 'Medium voltage utility connection', 9, '[{"label": "480V - Low voltage (small hub)", "value": "480v"},{"label": "4.16 kV - Medium voltage", "value": "4.16kv"},{"label": "12.47 kV - Medium voltage (standard)", "value": "12.47kv"},{"label": "13.8 kV - Medium voltage", "value": "13.8kv"},{"label": "34.5 kV - High voltage (large hub)", "value": "34.5kv"},{"label": "69 kV - High voltage (super site)", "value": "69kv"}]'::jsonb),
  (v_use_case_id, 'Operating hours', 'operatingHours', 'select', '24_7', true, 'When will charging be available?', 10, '[{"label": "Business hours (8am-6pm)", "value": "business"},{"label": "Extended hours (6am-10pm)", "value": "extended"},{"label": "24/7 Operations", "value": "24_7"}]'::jsonb),
  (v_use_case_id, 'Estimated monthly electricity bill', 'monthlyElectricBill', 'select', '50000', false, 'Expected monthly electricity cost for hub', 11, '[{"label": "$5,000 - $15,000/month (small)", "value": "10000"},{"label": "$15,000 - $40,000/month", "value": "27500"},{"label": "$40,000 - $75,000/month (medium)", "value": "57500"},{"label": "$75,000 - $150,000/month", "value": "112500"},{"label": "$150,000 - $300,000/month (large)", "value": "225000"},{"label": "Over $300,000/month (super)", "value": "400000"}]'::jsonb),
  (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '20000', true, 'Peak demand portion of electric bill (critical for BESS ROI)', 12, '[{"label": "$2,000 - $7,500/month", "value": "5000"},{"label": "$7,500 - $15,000/month", "value": "11250"},{"label": "$15,000 - $30,000/month", "value": "22500"},{"label": "$30,000 - $60,000/month", "value": "45000"},{"label": "$60,000 - $120,000/month", "value": "90000"},{"label": "Over $120,000/month", "value": "150000"}]'::jsonb),
  (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Solar carports or ground mount already installed', 13, '[{"label": "None", "value": "0"},{"label": "50 - 250 kW", "value": "150"},{"label": "250 - 500 kW", "value": "375"},{"label": "500 kW - 1 MW", "value": "750"},{"label": "1 - 3 MW", "value": "2000"},{"label": "3 - 6 MW", "value": "4500"},{"label": "Over 6 MW", "value": "8000"}]'::jsonb);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order) VALUES
  (v_use_case_id, 'Interested in solar carports?', 'wantsSolar', 'boolean', 'true', false, 'Solar carports provide shade + renewable energy', 14),
  (v_use_case_id, 'Do you have amenities on-site?', 'hasAmenities', 'boolean', 'true', false, 'Retail, food service, restrooms, lounge (adds power load)', 15);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options) VALUES
  (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'How will you primarily use battery storage?', 16, '[{"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},{"label": "Load Balancing - Smooth charging demand spikes", "value": "load_balancing"},{"label": "Renewable Integration - Maximize solar self-consumption", "value": "renewable_integration"},{"label": "Backup Power - Keep critical chargers online during outages", "value": "backup_power"},{"label": "Demand Response - Participate in utility programs", "value": "demand_response"},{"label": "Multiple Applications - Stacked benefits", "value": "stacked"}]'::jsonb);
  
  RAISE NOTICE 'Successfully added 16 EV charging hub-specific questions';
END $$;

-- ============================================================================
-- 2. HOSPITAL (19 questions)
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'hospital' LIMIT 1;
  IF v_use_case_id IS NULL THEN RAISE EXCEPTION 'Hospital use case not found!'; END IF;
  DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
  
  -- All 19 hospital questions in compact format
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options) VALUES
  (v_use_case_id, 'Hospital size classification', 'hospitalSize', 'select', 'community', true, 'What type/size of hospital facility?', 1, '[{"label": "Small/Rural (25-100 beds)", "value": "small"},{"label": "Community (100-250 beds)", "value": "community"},{"label": "Regional (250-500 beds)", "value": "regional"},{"label": "Major Medical Center (500-1,000 beds)", "value": "major"},{"label": "Academic/Trauma Center (1,000+ beds)", "value": "academic"}]'::jsonb),
  (v_use_case_id, 'Number of licensed beds', 'bedCount', 'select', '175', true, 'Total licensed bed capacity', 2, '[{"label": "25 - 50 beds", "value": "37"},{"label": "50 - 100 beds", "value": "75"},{"label": "100 - 175 beds", "value": "137"},{"label": "175 - 250 beds", "value": "212"},{"label": "250 - 375 beds", "value": "312"},{"label": "375 - 500 beds", "value": "437"},{"label": "500 - 750 beds", "value": "625"},{"label": "750 - 1,000 beds", "value": "875"},{"label": "Over 1,000 beds", "value": "1200"}]'::jsonb),
  (v_use_case_id, 'Number of operating rooms', 'operatingRooms', 'select', '8', true, 'Surgical suites (high power, 100% critical)', 3, '[{"label": "1 - 3 ORs", "value": "2"},{"label": "4 - 8 ORs", "value": "6"},{"label": "9 - 15 ORs", "value": "12"},{"label": "16 - 25 ORs", "value": "20"},{"label": "Over 25 ORs", "value": "30"}]'::jsonb),
  (v_use_case_id, 'ICU/CCU beds', 'icuBeds', 'select', '20', true, 'Intensive care and cardiac care units (100% critical)', 4, '[{"label": "5 - 10 beds", "value": "7"},{"label": "10 - 20 beds", "value": "15"},{"label": "20 - 40 beds", "value": "30"},{"label": "40 - 60 beds", "value": "50"},{"label": "Over 60 beds", "value": "75"}]'::jsonb),
  (v_use_case_id, 'Major imaging equipment', 'imagingEquipment', 'select', 'standard', true, 'MRI, CT, X-ray, and diagnostic imaging', 5, '[{"label": "Basic - X-ray only", "value": "basic"},{"label": "Standard - X-ray + 1 CT", "value": "standard"},{"label": "Advanced - X-ray + 2+ CT + 1 MRI", "value": "advanced"},{"label": "Comprehensive - Multiple CT/MRI + PET", "value": "comprehensive"},{"label": "Academic - Full diagnostic suite", "value": "academic"}]'::jsonb);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order) VALUES
  (v_use_case_id, 'Do you have an emergency department?', 'hasEmergencyDept', 'boolean', 'true', true, 'ED/trauma center (100% critical power)', 6);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options) VALUES
  (v_use_case_id, 'Trauma center level', 'traumaCenterLevel', 'select', 'level2', false, 'ACS trauma designation (affects power criticality)', 7, '[{"label": "No trauma designation", "value": "none"},{"label": "Level III - Community", "value": "level3"},{"label": "Level II - Regional", "value": "level2"},{"label": "Level I - Academic/Tertiary", "value": "level1"}]'::jsonb),
  (v_use_case_id, 'Central energy plant type', 'energyPlantType', 'select', 'electric_chiller', true, 'Primary HVAC system type', 8, '[{"label": "Electric chillers only", "value": "electric_chiller"},{"label": "Electric chillers + gas boilers", "value": "electric_gas"},{"label": "District heating/cooling", "value": "district"},{"label": "Combined heat & power (CHP)", "value": "chp"}]'::jsonb),
  (v_use_case_id, 'On-site laboratory size', 'labSize', 'select', 'standard', true, 'Clinical and diagnostic lab facilities', 9, '[{"label": "Basic - Send-out only", "value": "basic"},{"label": "Standard - Core testing", "value": "standard"},{"label": "Advanced - Full service", "value": "advanced"},{"label": "Reference lab - Regional testing center", "value": "reference"}]'::jsonb),
  (v_use_case_id, 'Pharmacy operations', 'pharmacyOperations', 'select', 'standard', false, 'Pharmacy and medication storage (refrigeration)', 10, '[{"label": "Basic - Dispensing only", "value": "basic"},{"label": "Standard - Compounding + refrigeration", "value": "standard"},{"label": "Advanced - IV compounding + cold storage", "value": "advanced"},{"label": "Specialty - Chemo/biologics cold chain", "value": "specialty"}]'::jsonb),
  (v_use_case_id, 'Food service operations', 'foodServiceType', 'select', 'full_kitchen', false, 'Kitchen and food preparation facilities', 11, '[{"label": "Minimal - Vending/microwaves only", "value": "minimal"},{"label": "Cafeteria - Serve and reheat", "value": "cafeteria"},{"label": "Full kitchen - Cook on-site", "value": "full_kitchen"},{"label": "Multiple kitchens - Campus-wide", "value": "multiple"}]'::jsonb);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order) VALUES
  (v_use_case_id, 'Do you have on-site laundry?', 'hasLaundry', 'boolean', 'true', false, 'On-site laundry (washers, dryers, steam)', 12);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options) VALUES
  (v_use_case_id, 'IT infrastructure / data center', 'itInfrastructure', 'select', 'moderate', true, 'EMR, PACS, IT systems (100% critical)', 13, '[{"label": "Basic - Shared hosting", "value": "basic"},{"label": "Moderate - On-site servers", "value": "moderate"},{"label": "Extensive - Full data center", "value": "extensive"},{"label": "Enterprise - Redundant data centers", "value": "enterprise"}]'::jsonb),
  (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '150000', true, 'Total facility electricity cost', 14, '[{"label": "$25,000 - $75,000/month (small)", "value": "50000"},{"label": "$75,000 - $150,000/month (community)", "value": "112500"},{"label": "$150,000 - $300,000/month (regional)", "value": "225000"},{"label": "$300,000 - $600,000/month (major)", "value": "450000"},{"label": "Over $600,000/month (academic)", "value": "800000"}]'::jsonb),
  (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '60000', true, 'Peak demand portion of electric bill', 15, '[{"label": "$10,000 - $30,000/month", "value": "20000"},{"label": "$30,000 - $75,000/month", "value": "52500"},{"label": "$75,000 - $150,000/month", "value": "112500"},{"label": "$150,000 - $300,000/month", "value": "225000"},{"label": "Over $300,000/month", "value": "400000"}]'::jsonb),
  (v_use_case_id, 'Existing emergency generator capacity', 'existingGeneratorKW', 'select', '3000', true, 'Current backup generator size (NEC 517 required)', 16, '[{"label": "Under 1 MW", "value": "750"},{"label": "1 - 3 MW", "value": "2000"},{"label": "3 - 6 MW", "value": "4500"},{"label": "6 - 10 MW", "value": "8000"},{"label": "10 - 20 MW", "value": "15000"},{"label": "Over 20 MW", "value": "30000"}]'::jsonb),
  (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'Rooftop or ground-mount solar already installed', 17, '[{"label": "None", "value": "0"},{"label": "100 - 500 kW", "value": "300"},{"label": "500 kW - 1 MW", "value": "750"},{"label": "1 - 3 MW", "value": "2000"},{"label": "Over 3 MW", "value": "5000"}]'::jsonb);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order) VALUES
  (v_use_case_id, 'Interested in adding solar?', 'wantsSolar', 'boolean', 'true', false, 'Hospitals have excellent roof/parking area for solar', 18);
  
  INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options) VALUES
  (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'backup_power', false, 'How will you primarily use battery storage?', 19, '[{"label": "Backup Power - Critical load protection (NEC 517)", "value": "backup_power"},{"label": "Peak Shaving - Reduce demand charges", "value": "peak_shaving"},{"label": "Microgrid - Renewable integration + backup", "value": "microgrid"},{"label": "Demand Response - Participate in utility programs", "value": "demand_response"},{"label": "Multiple Applications - Stacked benefits", "value": "stacked"}]'::jsonb);
  
  RAISE NOTICE 'Successfully added 19 hospital-specific questions';
END $$;

-- ============================================================================
-- DEPLOYMENT COMPLETE: EV Charging Hub (16q) + Hospital (19q)
-- 
-- Remaining use cases in separate files:
--   - 20251212_fix_warehouse_questions.sql
--   - 20251212_fix_manufacturing_questions.sql
--   - 20251212_fix_data_center_questions.sql
-- ============================================================================