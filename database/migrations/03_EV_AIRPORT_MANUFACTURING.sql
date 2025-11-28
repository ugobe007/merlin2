-- =============================================================================
-- BATCH 2: EV CHARGING, AIRPORT, MANUFACTURING (10 questions each)
-- =============================================================================

-- EV CHARGING (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of DC fast chargers (150-350kW)', 'dcfastCount', 'number', '4', 0, 50, true, 'High-speed DC charging stations', 1 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of Level 2 chargers (7-22kW)', 'level2Count', 'number', '8', 0, 100, false, 'Standard AC charging stations', 2 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '500', 50, 10000, true, 'Available utility service capacity', 3 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is grid upgrade needed?', 'needsGridUpgrade', 'boolean', 'false', NULL, NULL, false, 'Does site need transformer upgrade?', 4 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Expected daily charging sessions', 'dailySessions', 'number', '50', 10, 500, false, 'Average vehicles charged per day', 5 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average charge time (minutes)', 'avgChargeTime', 'number', '30', 10, 120, false, 'Typical session duration', 6 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Demand charges ($/kW)', 'demandChargeRate', 'number', '15', 0, 50, false, 'Peak demand charge from utility', 7 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Operating hours per day', 'operatingHours', 'number', '24', 8, 24, false, 'Hours station is accessible', 8 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'ev-charging';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar canopies?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'ev-charging';

-- AIRPORT (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Annual passengers (millions)', 'annualPassengers', 'number', '10', 0.5, 100, true, 'Total passengers per year', 1 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Terminal square footage', 'terminalSqFt', 'number', '500000', 50000, 10000000, true, 'All terminal buildings combined', 2 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of gates', 'gateCount', 'number', '40', 5, 200, true, 'Aircraft boarding gates', 3 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (MW)', 'gridCapacityMW', 'number', '20', 1, 200, true, 'Main utility service capacity', 4 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '8', 2, 48, true, 'Critical systems backup requirement', 5 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing EV chargers', 'existingEVChargers', 'number', '0', 0, 500, false, 'Current EV charging stations', 6 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding EV charging?', 'wantsEVCharging', 'boolean', 'true', NULL, NULL, false, 'We will size EV in a later step', 7 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 20000, false, 'Current solar installation (0 if none)', 8 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 9 FROM use_cases WHERE slug = 'airport';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have ground power at gates?', 'hasGroundPower', 'boolean', 'true', NULL, NULL, false, '400Hz power for aircraft at gates', 10 FROM use_cases WHERE slug = 'airport';

-- MANUFACTURING (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Facility square footage', 'squareFeet', 'number', '200000', 10000, 5000000, true, 'Total manufacturing floor space', 1 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Peak electrical demand (kW)', 'peakDemandKW', 'number', '3000', 100, 100000, true, 'Maximum power draw during production', 2 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '5000', 200, 200000, true, 'Utility transformer capacity', 3 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Production shifts per day', 'shiftsPerDay', 'number', '2', 1, 3, true, 'Operating shifts (affects load profile)', 4 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have large motors/compressors?', 'hasLargeMotors', 'boolean', 'true', NULL, NULL, false, 'High-inrush equipment affects sizing', 5 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Monthly demand charges ($)', 'monthlyDemandCharges', 'number', '15000', 0, 500000, false, 'Peak demand portion of electric bill', 6 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Is power quality critical?', 'powerQualityCritical', 'boolean', 'true', NULL, NULL, false, 'Sensitive equipment requiring clean power', 7 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation (0 if none)', 8 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 9 FROM use_cases WHERE slug = 'manufacturing';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you need backup power?', 'needsBackupPower', 'boolean', 'true', NULL, NULL, false, 'Critical production continuity', 10 FROM use_cases WHERE slug = 'manufacturing';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('ev-charging', 'airport', 'manufacturing') GROUP BY uc.slug;
