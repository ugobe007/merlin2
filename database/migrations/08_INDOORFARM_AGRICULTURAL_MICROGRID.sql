-- =============================================================================
-- BATCH 7: INDOOR FARM, AGRICULTURAL, MICROGRID (10 questions each)
-- =============================================================================

-- INDOOR FARM (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Growing area square footage', 'squareFeet', 'number', '50000', 1000, 500000, true, 'Total cultivation space', 1 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Lighting load (kW)', 'lightingKW', 'number', '500', 50, 10000, true, 'LED/HPS grow lights power', 2 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'HVAC load (kW)', 'hvacKW', 'number', '200', 20, 5000, true, 'Climate control power', 3 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '800', 100, 20000, true, 'Maximum facility power draw', 4 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily light hours', 'lightHours', 'number', '18', 12, 24, false, 'Hours grow lights operate daily', 5 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '10000', 0, 200000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers for fleet', 'existingEVChargers', 'number', '0', 0, 20, false, 'Current delivery vehicle charging', 7 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'indoor-farm';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'indoor-farm';

-- AGRICULTURAL (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Farm acreage', 'acreage', 'number', '500', 10, 10000, true, 'Total irrigated acres', 1 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Irrigation pump load (kW)', 'pumpKW', 'number', '200', 20, 5000, true, 'Water pumping capacity', 2 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '300', 30, 10000, true, 'Maximum farm power draw', 3 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have cold storage?', 'hasColdStorage', 'boolean', 'false', NULL, NULL, false, 'Refrigerated produce storage', 4 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have processing equipment?', 'hasProcessing', 'boolean', 'false', NULL, NULL, false, 'On-site packing or processing', 5 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '2000', 0, 50000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers for equipment', 'existingEVChargers', 'number', '0', 0, 20, false, 'Electric vehicle/equipment charging', 7 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'agricultural';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'agricultural';

-- MICROGRID (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total site load (kW)', 'siteLoadKW', 'number', '1000', 50, 100000, true, 'Combined peak demand of all facilities', 1 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of buildings/facilities', 'buildings', 'number', '5', 1, 100, true, 'Facilities in microgrid', 2 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '2000', 100, 500000, true, 'Utility interconnection limit', 3 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required island duration (hours)', 'islandHours', 'number', '24', 4, 168, true, 'Hours of grid-independent operation', 4 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is islanding capability required?', 'needsIslanding', 'boolean', 'true', NULL, NULL, true, 'Must operate independent of grid', 5 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '20000', 0, 500000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers on site', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current EV charging infrastructure', 7 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 50000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'microgrid';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'microgrid';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('indoor-farm', 'agricultural', 'microgrid') GROUP BY uc.slug;
