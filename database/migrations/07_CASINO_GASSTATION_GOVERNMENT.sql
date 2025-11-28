-- =============================================================================
-- BATCH 6: CASINO, GAS STATION, GOVERNMENT (10 questions each)
-- =============================================================================

-- CASINO (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Casino floor square footage', 'squareFeet', 'number', '100000', 10000, 1000000, true, 'Gaming and common areas', 1 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '5000', 500, 100000, true, 'Maximum facility power draw', 2 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of gaming machines', 'gamingMachines', 'number', '1000', 50, 10000, true, 'Slot machines and electronic games', 3 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '24', 12, 24, true, 'Hours casino is open', 4 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a hotel attached?', 'hasHotel', 'boolean', 'true', NULL, NULL, false, 'Integrated hotel resort', 5 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '50000', 0, 500000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers in parking', 'existingEVChargers', 'number', '0', 0, 200, false, 'Current guest EV charging', 7 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'casino';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'casino';

-- GAS STATION (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of fuel dispensers', 'fuelDispensers', 'number', '8', 2, 30, true, 'Gas pump positions', 1 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Convenience store square footage', 'storeSqFt', 'number', '3000', 500, 15000, true, 'Attached retail space', 2 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '100', 20, 1000, true, 'Maximum facility power draw', 3 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '24', 12, 24, true, 'Hours station is open', 4 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a car wash?', 'hasCarWash', 'boolean', 'false', NULL, NULL, false, 'Attached car wash increases load', 5 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '500', 0, 5000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers', 'existingEVChargers', 'number', '0', 0, 20, false, 'Current EV charging stations', 7 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 200, false, 'Current canopy solar (0 if none)', 9 FROM use_cases WHERE slug = 'gas-station';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar canopy?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'gas-station';

-- GOVERNMENT (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Building square footage', 'squareFeet', 'number', '100000', 5000, 2000000, true, 'Total facility space', 1 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of employees', 'employees', 'number', '200', 10, 10000, true, 'Staff working in facility', 2 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '500', 50, 20000, true, 'Maximum facility power draw', 3 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is this a critical facility?', 'isCritical', 'boolean', 'true', NULL, NULL, true, 'Emergency services, 911, etc.', 4 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '24', 4, 72, false, 'Hours of backup power needed', 5 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '5000', 0, 100000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers for fleet', 'existingEVChargers', 'number', '0', 0, 100, false, 'Current government fleet charging', 7 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 8 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'government';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'government';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('casino', 'gas-station', 'government') GROUP BY uc.slug;
