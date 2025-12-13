-- ============================================================================
-- POPULATE MISSING QUESTIONS FOR USE CASES
-- December 11, 2025 (Updated December 12, 2025 - Changed to dropdowns)
-- 
-- This migration adds standard questions to use cases that have 0 questions:
--   - shopping-center, residential, retail, microgrid, apartment
--   - government, gas-station, casino, agricultural, indoor-farm
--
-- Questions are based on the successful hotel/hospital/office patterns.
-- NOW USES DROPDOWN SELECTS WITH RANGES instead of open numeric inputs.
-- ============================================================================

-- Helper function to get use case ID by slug
CREATE OR REPLACE FUNCTION get_use_case_id(slug_param TEXT) RETURNS UUID AS $$
  SELECT id FROM use_cases WHERE slug = slug_param LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================================
-- STANDARD QUESTIONS TEMPLATE (applies to all use cases)
-- These 20 questions cover facility size, energy, grid, generators, and BESS application
-- ALL NUMERIC FIELDS NOW USE DROPDOWN SELECTS WITH RANGES
-- ============================================================================

DO $$
DECLARE
  v_use_case_id UUID;
  v_slugs TEXT[] := ARRAY[
    'shopping-center', 'residential', 'retail', 'microgrid', 
    'apartment', 'government', 'gas-station', 'casino', 
    'agricultural', 'indoor-farm'
  ];
  v_slug TEXT;
  v_question_count INT;
BEGIN
  FOREACH v_slug IN ARRAY v_slugs
  LOOP
    -- Get use case ID
    SELECT id INTO v_use_case_id FROM use_cases WHERE slug = v_slug;
    
    IF v_use_case_id IS NULL THEN
      RAISE NOTICE 'Skipping % - use case not found', v_slug;
      CONTINUE;
    END IF;
    
    -- Check if already has questions
    SELECT COUNT(*) INTO v_question_count 
    FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    IF v_question_count > 5 THEN
      RAISE NOTICE 'Skipping % - already has % questions', v_slug, v_question_count;
      CONTINUE;
    END IF;
    
    RAISE NOTICE 'Adding questions to %', v_slug;
    
    -- Delete any existing questions to start fresh
    DELETE FROM custom_questions WHERE use_case_id = v_use_case_id;
    
    -- 1. Square footage (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Total building square footage', 'squareFeet', 'select', '50000', true, 'Total conditioned floor area', 1,
      '[{"label": "1,000 - 5,000 sq ft", "value": "3000"}, {"label": "5,000 - 15,000 sq ft", "value": "10000"}, {"label": "15,000 - 30,000 sq ft", "value": "22500"}, {"label": "30,000 - 75,000 sq ft", "value": "52500"}, {"label": "75,000 - 150,000 sq ft", "value": "112500"}, {"label": "150,000 - 300,000 sq ft", "value": "225000"}, {"label": "300,000 - 500,000 sq ft", "value": "400000"}, {"label": "500,000 - 1 million sq ft", "value": "750000"}, {"label": "Over 1 million sq ft", "value": "1500000"}]'::jsonb);
    
    -- 2. Monthly electric bill (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Average monthly electricity bill', 'monthlyElectricBill', 'select', '15000', true, 'Your typical monthly electricity cost', 2,
      '[{"label": "$1,000 - $5,000/month", "value": "3000"}, {"label": "$5,000 - $10,000/month", "value": "7500"}, {"label": "$10,000 - $25,000/month", "value": "17500"}, {"label": "$25,000 - $50,000/month", "value": "37500"}, {"label": "$50,000 - $100,000/month", "value": "75000"}, {"label": "$100,000 - $250,000/month", "value": "175000"}, {"label": "$250,000 - $500,000/month", "value": "375000"}, {"label": "Over $500,000/month", "value": "500000"}]'::jsonb);
    
    -- 3. Monthly demand charges (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Monthly demand charges', 'monthlyDemandCharges', 'select', '3000', false, 'Peak demand portion of electric bill', 3,
      '[{"label": "None / Not sure", "value": "0"}, {"label": "$100 - $500/month", "value": "300"}, {"label": "$500 - $1,500/month", "value": "1000"}, {"label": "$1,500 - $3,000/month", "value": "2250"}, {"label": "$3,000 - $7,500/month", "value": "5250"}, {"label": "$7,500 - $15,000/month", "value": "11250"}, {"label": "$15,000 - $30,000/month", "value": "22500"}, {"label": "Over $30,000/month", "value": "50000"}]'::jsonb);
    
    -- 4. Operating hours (already a select - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Operating hours', 'operatingHours', 'select', 'extended', false, 'When is your facility typically operating?', 4, 
      '[{"label": "Standard (8am-6pm)", "value": "standard"}, {"label": "Extended (6am-10pm)", "value": "extended"}, {"label": "24/7 Operations", "value": "24_7"}]'::jsonb);
    
    -- 5. Grid savings goal (already a select - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Primary Goal for Grid Strategy', 'gridSavingsGoal', 'select', 'cost_reduction', false, 'What is your primary motivation for your grid strategy?', 5,
      '[{"label": "Cost Reduction - Lower electricity bills", "value": "cost_reduction"}, {"label": "Avoid Grid Fees - Reduce connection charges", "value": "avoid_grid_fees"}, {"label": "Energy Independence - Self-sufficiency", "value": "energy_independence"}, {"label": "Resilience - Backup power priority", "value": "resilience"}, {"label": "Carbon Reduction - Environmental goals", "value": "carbon_reduction"}, {"label": "Grid Export Revenue - Sell power back", "value": "grid_export"}]'::jsonb);
    
    -- 6. Primary BESS Application (already a select - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Primary BESS Application', 'primaryBESSApplication', 'select', 'peak_shaving', false, 'How will you primarily use your battery storage system?', 6,
      '[{"label": "Peak Shaving - Reduce demand charges during peak periods", "value": "peak_shaving"}, {"label": "Energy Arbitrage - Buy low, sell/use high", "value": "energy_arbitrage"}, {"label": "Backup Power - Critical load protection", "value": "backup_power"}, {"label": "Demand Response - Utility DR programs", "value": "demand_response"}, {"label": "Renewable Integration - Maximize solar/wind", "value": "renewable_integration"}, {"label": "Load Shifting - Off-peak consumption", "value": "load_shifting"}, {"label": "Frequency Regulation - Grid services", "value": "frequency_regulation"}, {"label": "Multiple Applications - Stacked benefits", "value": "stacked"}]'::jsonb);
    
    -- 7. Grid connection capacity (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Grid connection capacity', 'gridCapacityKW', 'select', '500', true, 'Your facility''s maximum grid import capacity', 7,
      '[{"label": "50 - 100 kW", "value": "75"}, {"label": "100 - 250 kW", "value": "175"}, {"label": "250 - 500 kW", "value": "375"}, {"label": "500 kW - 1 MW", "value": "750"}, {"label": "1 - 2 MW", "value": "1500"}, {"label": "2 - 5 MW", "value": "3500"}, {"label": "5 - 10 MW", "value": "7500"}, {"label": "Over 10 MW", "value": "15000"}]'::jsonb);
    
    -- 8. Grid reliability issues (already a select - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Grid Reliability Issues', 'gridReliabilityIssues', 'select', 'none', false, 'Do you experience power quality or outage issues?', 8,
      '[{"label": "None - Reliable grid", "value": "none"}, {"label": "Occasional outages (1-2/year)", "value": "occasional"}, {"label": "Frequent outages (monthly)", "value": "frequent"}, {"label": "Voltage issues", "value": "voltage"}, {"label": "Both outages and voltage", "value": "both"}]'::jsonb);
    
    -- 9. Existing solar (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Existing solar capacity', 'existingSolarKW', 'select', '0', false, 'If you have solar panels installed, select the capacity', 9,
      '[{"label": "None", "value": "0"}, {"label": "1 - 25 kW", "value": "13"}, {"label": "25 - 50 kW", "value": "38"}, {"label": "50 - 100 kW", "value": "75"}, {"label": "100 - 250 kW", "value": "175"}, {"label": "250 - 500 kW", "value": "375"}, {"label": "500 kW - 1 MW", "value": "750"}, {"label": "Over 1 MW", "value": "1500"}]'::jsonb);
    
    -- 10. Wants solar (boolean - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
    VALUES (v_use_case_id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', false, 'Would you like us to include solar in your quote?', 10);
    
    -- 11. Needs backup power (boolean - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
    VALUES (v_use_case_id, 'Do you need backup power for critical loads?', 'needsBackupPower', 'boolean', 'false', false, 'Is uninterrupted power critical for your operations?', 11);
    
    -- 12. Annual outage hours (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Estimated Annual Outage Hours', 'annualOutageHours', 'select', '0', false, 'How many hours of outages do you experience per year?', 12,
      '[{"label": "None", "value": "0"}, {"label": "1 - 4 hours/year", "value": "2"}, {"label": "4 - 12 hours/year", "value": "8"}, {"label": "12 - 24 hours/year", "value": "18"}, {"label": "24 - 72 hours/year", "value": "48"}, {"label": "72 - 168 hours/year", "value": "120"}, {"label": "Over 168 hours/year (1+ week)", "value": "250"}]'::jsonb);
    
    -- 13. Grid import limit (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Grid Import Limit', 'gridImportLimit', 'select', '0', false, 'Maximum allowed grid import (0 = no limit)', 13,
      '[{"label": "No limit", "value": "0"}, {"label": "100 - 250 kW", "value": "175"}, {"label": "250 - 500 kW", "value": "375"}, {"label": "500 kW - 1 MW", "value": "750"}, {"label": "1 - 2 MW", "value": "1500"}, {"label": "2 - 5 MW", "value": "3500"}, {"label": "5 - 10 MW", "value": "7500"}, {"label": "Over 10 MW", "value": "15000"}]'::jsonb);
    
    -- 14. Annual grid fees (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Annual Grid Connection Fees', 'annualGridFees', 'select', '0', false, 'Fixed annual fees for grid connection', 14,
      '[{"label": "None / Included in bill", "value": "0"}, {"label": "$1,000 - $5,000/year", "value": "3000"}, {"label": "$5,000 - $15,000/year", "value": "10000"}, {"label": "$15,000 - $50,000/year", "value": "32500"}, {"label": "$50,000 - $100,000/year", "value": "75000"}, {"label": "Over $100,000/year", "value": "150000"}]'::jsonb);
    
    -- 15. Off-grid reason (already a select - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Why are you considering off-grid or microgrid?', 'offGridReason', 'select', 'not_considering', false, 'If interested in grid independence, what''s the main reason?', 15,
      '[{"label": "Not considering", "value": "not_considering"}, {"label": "Cost savings", "value": "cost"}, {"label": "Reliability concerns", "value": "reliability"}, {"label": "Remote location", "value": "remote"}, {"label": "Sustainability goals", "value": "sustainability"}, {"label": "Energy independence", "value": "independence"}]'::jsonb);
    
    -- 16. Has EV charging (boolean - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
    VALUES (v_use_case_id, 'Do you have or plan to add EV charging?', 'hasEVCharging', 'boolean', 'false', false, 'EV chargers can significantly impact your power needs', 16);
    
    -- 17. Existing generator (boolean - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
    VALUES (v_use_case_id, 'Do you have an existing backup generator?', 'hasExistingGenerator', 'boolean', 'false', false, 'Existing generators can be integrated with BESS for hybrid backup', 17);
    
    -- 18. Existing generator capacity (DROPDOWN with ranges)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Existing generator capacity', 'existingGeneratorKW', 'select', '0', false, 'Total backup generator capacity if you have one', 18,
      '[{"label": "None", "value": "0"}, {"label": "10 - 50 kW", "value": "30"}, {"label": "50 - 100 kW", "value": "75"}, {"label": "100 - 250 kW", "value": "175"}, {"label": "250 - 500 kW", "value": "375"}, {"label": "500 kW - 1 MW", "value": "750"}, {"label": "1 - 2 MW", "value": "1500"}, {"label": "Over 2 MW", "value": "3000"}]'::jsonb);
    
    -- 19. Generator fuel type (already a select - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order, options)
    VALUES (v_use_case_id, 'Generator fuel type', 'generatorFuelType', 'select', 'natural-gas', false, 'What fuel does your generator use (or prefer for new)?', 19,
      '[{"label": "Natural Gas", "value": "natural-gas"}, {"label": "Diesel", "value": "diesel"}, {"label": "Dual Fuel (Gas/Diesel)", "value": "dual-fuel"}, {"label": "Propane/LPG", "value": "propane"}, {"label": "No Generator", "value": "none"}]'::jsonb);
    
    -- 20. Wants generator quote (boolean - keep as is)
    INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, is_required, help_text, display_order)
    VALUES (v_use_case_id, 'Include backup generator in quote?', 'wantsGenerator', 'boolean', 'false', false, 'Would you like us to quote a backup generator alongside BESS?', 20);
    
    RAISE NOTICE 'Added 20 standard questions to %', v_slug;
  END LOOP;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS get_use_case_id(TEXT);

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================

SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count,
  COUNT(CASE WHEN cq.question_type = 'select' THEN 1 END) as dropdown_count,
  COUNT(CASE WHEN cq.question_type = 'number' THEN 1 END) as number_count,
  COUNT(CASE WHEN cq.question_type = 'boolean' THEN 1 END) as boolean_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON cq.use_case_id = uc.id
WHERE uc.is_active = true
GROUP BY uc.id, uc.slug, uc.name
ORDER BY question_count, uc.slug;
