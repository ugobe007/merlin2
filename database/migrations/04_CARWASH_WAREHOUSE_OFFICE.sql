-- =============================================================================
-- BATCH 3: CAR WASH, WAREHOUSE, OFFICE (10 questions each)
-- =============================================================================

-- CAR WASH (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of wash bays', 'washBays', 'number', '4', 1, 20, true, 'Tunnel or individual wash bays', 1 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak power demand (kW)', 'peakDemandKW', 'number', '150', 30, 500, true, 'Maximum power during peak operations', 2 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Daily vehicles washed', 'dailyVehicles', 'number', '200', 50, 2000, true, 'Average cars per day', 3 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '12', 6, 24, true, 'Hours open for business', 4 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have vacuum stations?', 'hasVacuums', 'boolean', 'true', NULL, NULL, false, 'Self-service vacuum area', 5 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '800', 0, 10000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers', 'existingEVChargers', 'number', '0', 0, 20, false, 'Current EV charging stations', 7 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 500, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'car-wash';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'car-wash';

-- WAREHOUSE (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Warehouse square footage', 'squareFeet', 'number', '200000', 10000, 2000000, true, 'Total warehouse floor space', 1 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '500', 50, 10000, true, 'Maximum power draw during operations', 2 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of loading docks', 'loadingDocks', 'number', '20', 2, 200, true, 'Truck loading/unloading positions', 3 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '16', 8, 24, true, 'Hours of active operations', 4 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of electric forklifts', 'electricForklifts', 'number', '10', 0, 100, false, 'Battery-powered material handling', 5 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '5000', 0, 100000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers for fleet', 'existingEVChargers', 'number', '0', 0, 100, false, 'Current EV charging for delivery fleet', 7 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current rooftop solar (0 if none)', 9 FROM use_cases WHERE slug = 'warehouse';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'warehouse';

-- OFFICE (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Office building square footage', 'squareFeet', 'number', '100000', 5000, 2000000, true, 'Total office floor space', 1 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of floors', 'floors', 'number', '5', 1, 100, true, 'Building stories', 2 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '400', 20, 10000, true, 'Maximum power draw during business hours', 3 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of employees', 'employees', 'number', '250', 10, 10000, true, 'Typical daily occupancy', 4 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '12', 8, 24, false, 'Hours building is occupied', 5 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '3000', 0, 50000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers in parking', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current employee/visitor EV charging', 7 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'office';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'office';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('car-wash', 'warehouse', 'office') GROUP BY uc.slug;
