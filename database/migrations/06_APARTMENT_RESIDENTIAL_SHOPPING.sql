-- =============================================================================
-- BATCH 5: APARTMENT, RESIDENTIAL, SHOPPING CENTER (10 questions each)
-- =============================================================================

-- APARTMENT (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of units', 'units', 'number', '100', 10, 1000, true, 'Total apartment units in building', 1 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '150000', 10000, 2000000, true, 'Total building floor space', 2 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of floors', 'floors', 'number', '10', 1, 100, true, 'Building stories', 3 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '500', 50, 10000, true, 'Maximum building power draw', 4 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have central HVAC?', 'hasCentralHVAC', 'boolean', 'true', NULL, NULL, false, 'Central vs individual unit HVAC', 5 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '4000', 0, 50000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers in parking', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current resident EV charging', 7 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'apartment';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'apartment';

-- RESIDENTIAL (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Home square footage', 'squareFeet', 'number', '2500', 500, 20000, true, 'Total living space', 1 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average monthly electric bill ($)', 'monthlyBill', 'number', '200', 50, 2000, true, 'Current utility costs', 2 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of occupants', 'occupants', 'number', '4', 1, 12, true, 'People living in home', 3 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have an electric vehicle?', 'hasEV', 'boolean', 'false', NULL, NULL, false, 'Current EV ownership', 4 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a pool or hot tub?', 'hasPool', 'boolean', 'false', NULL, NULL, false, 'Affects load profile', 5 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is backup power important?', 'needsBackup', 'boolean', 'true', NULL, NULL, false, 'Priority for outage protection', 6 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV charger level', 'existingEVChargers', 'number', '0', 0, 2, false, '0=None, 1=Level 1, 2=Level 2', 7 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 50, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'residential';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'residential';

-- SHOPPING CENTER (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total center square footage', 'squareFeet', 'number', '300000', 20000, 3000000, true, 'All tenant spaces combined', 1 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of tenant spaces', 'tenants', 'number', '50', 5, 500, true, 'Individual retail stores', 2 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '2000', 100, 50000, true, 'Maximum center power draw', 3 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of parking spaces', 'parkingSpaces', 'number', '1500', 100, 20000, true, 'Customer parking available', 4 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have anchor tenants?', 'hasAnchors', 'boolean', 'true', NULL, NULL, false, 'Large department or grocery stores', 5 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '15000', 0, 200000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers in parking', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current customer EV charging', 7 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'shopping-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'shopping-center';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('apartment', 'residential', 'shopping-center') GROUP BY uc.slug;
