-- =============================================================================
-- BATCH 4: COLLEGE, COLD STORAGE, RETAIL (10 questions each)
-- =============================================================================

-- COLLEGE (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total campus square footage', 'squareFeet', 'number', '500000', 50000, 10000000, true, 'All buildings combined', 1 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of buildings', 'buildings', 'number', '20', 1, 200, true, 'Campus buildings served', 2 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Student enrollment', 'enrollment', 'number', '10000', 500, 100000, true, 'Total enrolled students', 3 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '5000', 200, 100000, true, 'Maximum campus power draw', 4 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have on-campus housing?', 'hasHousing', 'boolean', 'true', NULL, NULL, false, 'Dormitories affect 24/7 load', 5 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '25000', 0, 500000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers on campus', 'existingEVChargers', 'number', '0', 0, 500, false, 'Current EV charging stations', 7 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'college';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'college';

-- COLD STORAGE (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Cold storage square footage', 'squareFeet', 'number', '100000', 5000, 1000000, true, 'Total refrigerated space', 1 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Refrigeration load (kW)', 'refrigerationKW', 'number', '500', 50, 10000, true, 'Total compressor capacity', 2 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '800', 100, 15000, true, 'Maximum facility power draw', 3 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Storage temperature (°F)', 'storageTemp', 'number', '35', -20, 55, true, 'Primary storage temperature', 4 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have freezer storage?', 'hasFreezer', 'boolean', 'true', NULL, NULL, false, 'Sub-zero storage increases load', 5 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '8000', 0, 100000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers for fleet', 'existingEVChargers', 'number', '0', 0, 50, false, 'Current delivery fleet charging', 7 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'false', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'cold-storage';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'cold-storage';

-- RETAIL (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Store square footage', 'squareFeet', 'number', '50000', 1000, 500000, true, 'Total retail floor space', 1 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '200', 20, 5000, true, 'Maximum power draw during business', 2 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '12', 8, 24, true, 'Hours store is open', 3 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have refrigeration?', 'hasRefrigeration', 'boolean', 'false', NULL, NULL, false, 'Display coolers or freezers', 4 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of parking spaces', 'parkingSpaces', 'number', '200', 10, 5000, false, 'Customer parking available', 5 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '1500', 0, 30000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers in parking', 'existingEVChargers', 'number', '0', 0, 50, false, 'Current customer EV charging', 7 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'retail';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'retail';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('college', 'cold-storage', 'retail') GROUP BY uc.slug;
