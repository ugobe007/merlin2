-- ============================================================================
-- ADD GRID CONNECTION & MICROGRID OPTIONS TO DATA CENTER
-- December 13, 2025
-- 
-- Add critical questions for off-grid and microgrid data center configurations:
-- - Grid connection status (on-grid, limited, off-grid)
-- - Microgrid mode (for renewable integration + islanding)
-- - Backup power requirements
-- - Generation requirements
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_existing_count INT;
BEGIN
  SELECT id INTO v_use_case_id FROM use_cases WHERE slug = 'data-center' LIMIT 1;
  
  IF v_use_case_id IS NULL THEN
    RAISE EXCEPTION 'Data center use case not found!';
  END IF;
  
  -- ============================================================================
  -- 1. Add Grid Connection Status Question
  -- ============================================================================
  
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'gridConnectionStatus';
  
  IF v_existing_count = 0 THEN
    -- Get max display_order to append at end
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    SELECT v_use_case_id, 
           'Grid connection status', 
           'gridConnectionStatus', 
           'select', 
           'on_grid_reliable', 
           true, 
           'Utility grid availability and reliability', 
           (SELECT COALESCE(MAX(display_order), 0) + 1 FROM custom_questions WHERE use_case_id = v_use_case_id),
           '[
             {"label": "On-Grid (Reliable) - Utility power available 99.9%+ uptime", "value": "on_grid_reliable"},
             {"label": "Limited Grid - Frequent outages (< 99% uptime)", "value": "limited_grid"},
             {"label": "Unreliable Grid - Regular brownouts/blackouts", "value": "unreliable_grid"},
             {"label": "Off-Grid - No utility connection available", "value": "off_grid"},
             {"label": "Microgrid - Hybrid with renewable generation", "value": "microgrid"}
           ]'::jsonb;
    RAISE NOTICE '✅ Added grid connection status question';
  ELSE
    RAISE NOTICE '⚠️ Grid connection status question already exists, skipping';
  END IF;
  
  -- ============================================================================
  -- 2. Add Backup Power Duration Question
  -- ============================================================================
  
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'backupDurationTarget';
  
  IF v_existing_count = 0 THEN
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    SELECT v_use_case_id, 
           'Required backup duration', 
           'backupDurationTarget', 
           'select', 
           '4_hours', 
           true, 
           'Hours of full load operation during grid outage', 
           (SELECT COALESCE(MAX(display_order), 0) + 1 FROM custom_questions WHERE use_case_id = v_use_case_id),
           '[
             {"label": "15 minutes - UPS ride-through only (Tier I/II)", "value": "15_minutes"},
             {"label": "2 hours - Short duration backup", "value": "2_hours"},
             {"label": "4 hours - Standard data center (Tier III)", "value": "4_hours"},
             {"label": "6 hours - Extended backup (Tier IV)", "value": "6_hours"},
             {"label": "8 hours - Off-grid/microgrid minimum", "value": "8_hours"},
             {"label": "12 hours - Remote/critical facilities", "value": "12_hours"},
             {"label": "24+ hours - Full islanding capability", "value": "24_hours"}
           ]'::jsonb;
    RAISE NOTICE '✅ Added backup duration question';
  ELSE
    RAISE NOTICE '⚠️ Backup duration question already exists, skipping';
  END IF;
  
  -- ============================================================================
  -- 3. Add Generation Type Question (for off-grid/microgrid)
  -- ============================================================================
  
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'generationType';
  
  IF v_existing_count = 0 THEN
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    SELECT v_use_case_id, 
           'Primary generation source', 
           'generationType', 
           'select', 
           'diesel_generator', 
           false, 
           'For off-grid or microgrid configurations', 
           (SELECT COALESCE(MAX(display_order), 0) + 1 FROM custom_questions WHERE use_case_id = v_use_case_id),
           '[
             {"label": "None - Grid-tied only", "value": "none"},
             {"label": "Diesel Generator - Traditional backup", "value": "diesel_generator"},
             {"label": "Natural Gas Generator - Lower emissions", "value": "natural_gas_generator"},
             {"label": "Dual-Fuel Generator - Diesel + natural gas", "value": "dual_fuel_generator"},
             {"label": "Solar PV - Renewable energy", "value": "solar_pv"},
             {"label": "Solar + Battery Microgrid", "value": "solar_battery"},
             {"label": "Solar + Generator Hybrid", "value": "solar_generator"},
             {"label": "Fuel Cell - Hydrogen or natural gas", "value": "fuel_cell"},
             {"label": "Full Microgrid - Solar + Battery + Generator", "value": "full_microgrid"}
           ]'::jsonb;
    RAISE NOTICE '✅ Added generation type question';
  ELSE
    RAISE NOTICE '⚠️ Generation type question already exists, skipping';
  END IF;
  
  -- ============================================================================
  -- 4. Add Renewable Capacity Question (for microgrid)
  -- ============================================================================
  
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'solarCapacityMW';
  
  IF v_existing_count = 0 THEN
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    SELECT v_use_case_id, 
           'Solar PV capacity (if applicable)', 
           'solarCapacityMW', 
           'select', 
           '0', 
           false, 
           'Solar generation for microgrid or renewable integration', 
           (SELECT COALESCE(MAX(display_order), 0) + 1 FROM custom_questions WHERE use_case_id = v_use_case_id),
           '[
             {"label": "None - No solar", "value": "0"},
             {"label": "Partial - 25-50% coverage (2-5 MW)", "value": "3"},
             {"label": "Substantial - 50-75% coverage (5-15 MW)", "value": "10"},
             {"label": "Majority - 75-100% coverage (15-30 MW)", "value": "20"},
             {"label": "Oversized - 100%+ for export/storage (30-50 MW)", "value": "40"},
             {"label": "Hyperscale - 50+ MW", "value": "75"}
           ]'::jsonb;
    RAISE NOTICE '✅ Added solar capacity question';
  ELSE
    RAISE NOTICE '⚠️ Solar capacity question already exists, skipping';
  END IF;
  
  -- ============================================================================
  -- 5. Add Generator Sizing Question (for off-grid/backup)
  -- ============================================================================
  
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'generatorSizingStrategy';
  
  IF v_existing_count = 0 THEN
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    SELECT v_use_case_id, 
           'Generator sizing strategy', 
           'generatorSizingStrategy', 
           'select', 
           'n_plus_1', 
           false, 
           'Redundancy level for generator capacity', 
           (SELECT COALESCE(MAX(display_order), 0) + 1 FROM custom_questions WHERE use_case_id = v_use_case_id),
           '[
             {"label": "N - Match full load (no redundancy)", "value": "n"},
             {"label": "N+1 - One extra unit for redundancy (Tier III)", "value": "n_plus_1"},
             {"label": "2N - Full dual redundancy (Tier IV)", "value": "2n"},
             {"label": "2N+1 - Dual + extra (Hyperscale)", "value": "2n_plus_1"},
             {"label": "Auto - Calculate based on tier", "value": "auto"}
           ]'::jsonb;
    RAISE NOTICE '✅ Added generator sizing strategy question';
  ELSE
    RAISE NOTICE '⚠️ Generator sizing strategy question already exists, skipping';
  END IF;
  
  -- ============================================================================
  -- 6. Update Primary BESS Application Options (if exists)
  -- ============================================================================
  
  SELECT COUNT(*) INTO v_existing_count 
  FROM custom_questions 
  WHERE use_case_id = v_use_case_id AND field_name = 'primaryBESSApplication';
  
  IF v_existing_count > 0 THEN
    UPDATE custom_questions
    SET options = '[
      {"label": "UPS Ride-Through - 15 min bridge to generator (Standard)", "value": "ups_ride_through"},
      {"label": "Peak Shaving - Reduce demand charges (N/A for off-grid)", "value": "peak_shaving"},
      {"label": "Backup Power - Extended outage protection (4-8 hours)", "value": "backup_power"},
      {"label": "Load Leveling - Smooth renewable generation variability", "value": "load_leveling"},
      {"label": "Microgrid - Full islanding with solar/generator", "value": "microgrid"},
      {"label": "Frequency Regulation - Grid services revenue", "value": "frequency_regulation"}
    ]'::jsonb
    WHERE use_case_id = v_use_case_id AND field_name = 'primaryBESSApplication';
    RAISE NOTICE '✅ Updated BESS application options for data center context';
  END IF;
  
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Successfully added data center grid/microgrid questions';
  RAISE NOTICE '====================================================================';
END $$;
