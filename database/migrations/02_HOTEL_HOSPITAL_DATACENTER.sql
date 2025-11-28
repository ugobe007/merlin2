-- =============================================================================
-- BATCH 1: HOTEL, HOSPITAL, DATA CENTER (10 questions each)
-- =============================================================================

-- HOTEL & HOTEL-HOSPITALITY (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of guest rooms', 'roomCount', 'number', '150', 10, 2000, true, 'Total guest rooms', 1 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total building square footage', 'squareFeet', 'number', '100000', 10000, 1000000, true, 'Total interior space', 2 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '500', 50, 10000, true, 'Utility service entrance capacity', 3 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Average monthly electricity bill ($)', 'monthlyElectricBill', 'number', '25000', 1000, 500000, true, 'Average monthly electric cost', 4 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a restaurant/kitchen?', 'hasRestaurant', 'boolean', 'true', NULL, NULL, false, 'Commercial kitchens add significant load', 5 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have a pool/spa?', 'hasPool', 'boolean', 'true', NULL, NULL, false, 'Pools require pumps and heaters', 6 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have on-site laundry?', 'hasLaundry', 'boolean', 'true', NULL, NULL, false, 'Commercial laundry is energy-intensive', 7 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 2000, false, 'Current solar installation (0 if none)', 8 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 9 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you need backup power for life safety?', 'needsBackupPower', 'boolean', 'true', NULL, NULL, false, 'Emergency lighting, fire systems, elevators', 10 FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality');

-- HOSPITAL (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of patient beds', 'bedCount', 'number', '200', 10, 2000, true, 'Licensed bed capacity', 1 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total facility square footage', 'squareFeet', 'number', '300000', 50000, 5000000, true, 'Total building area', 2 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '3000', 500, 50000, true, 'Main electrical service', 3 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of operating rooms', 'operatingRooms', 'number', '10', 1, 50, true, 'Surgical suites require uninterruptible power', 4 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have MRI/CT equipment?', 'hasImaging', 'boolean', 'true', NULL, NULL, false, 'Imaging requires 50-150kW per unit', 5 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of ICU beds', 'icuBeds', 'number', '20', 0, 200, false, 'ICU requires highest power reliability', 6 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required backup duration (hours)', 'backupHours', 'number', '24', 4, 96, true, 'How long must critical systems run on backup?', 7 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have existing generators?', 'hasGenerators', 'boolean', 'true', NULL, NULL, false, 'BESS can supplement generators', 8 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 5000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'hospital';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'hospital';

-- DATA CENTER (10 questions)
INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Total IT load (kW)', 'itLoadKW', 'number', '2000', 100, 100000, true, 'Total server/network power draw', 1 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Number of server racks', 'rackCount', 'number', '100', 10, 5000, true, 'Total equipment racks', 2 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Facility square footage', 'squareFeet', 'number', '50000', 5000, 1000000, true, 'Total data hall and support space', 3 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Grid connection capacity (kW)', 'gridCapacityKW', 'number', '5000', 500, 200000, true, 'Utility service entrance rating', 4 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Target PUE', 'pueTarget', 'number', '1.4', 1.1, 2.5, false, 'Power Usage Effectiveness (lower=better)', 5 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required uptime tier (1-4)', 'uptimeTier', 'number', '3', 1, 4, true, 'Tier 3=99.98%, Tier 4=99.99%', 6 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Required UPS runtime (minutes)', 'upsRuntimeMin', 'number', '15', 5, 60, true, 'Battery backup before generator starts', 7 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Do you have existing UPS?', 'hasUPS', 'boolean', 'true', NULL, NULL, false, 'Current battery backup infrastructure', 8 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Existing solar capacity (kW)', 'existingSolarKW', 'number', '0', 0, 10000, false, 'Current solar installation (0 if none)', 9 FROM use_cases WHERE slug = 'data-center';

INSERT INTO custom_questions (use_case_id, question_text, field_name, question_type, default_value, min_value, max_value, is_required, help_text, display_order)
SELECT id, 'Are you interested in adding solar?', 'wantsSolar', 'boolean', 'true', NULL, NULL, false, 'We will size solar in a later step', 10 FROM use_cases WHERE slug = 'data-center';

-- Verify
SELECT uc.slug, COUNT(cq.id) as questions FROM use_cases uc LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id WHERE uc.slug IN ('hotel', 'hotel-hospitality', 'hospital', 'data-center') GROUP BY uc.slug;
