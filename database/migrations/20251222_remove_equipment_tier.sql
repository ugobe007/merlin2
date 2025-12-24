-- REMOVE LEGACY EQUIPMENT TIER QUESTIONS FROM ALL USE CASES
-- This script deletes 'equipmentTier' custom questions from all verticals
-- and removes any legacy references from migrations.

-- Remove 'equipmentTier' from car-wash
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');
-- Remove 'equipmentTier' from hotel
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');
-- Remove 'equipmentTier' from ev-charging
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');
-- Remove 'equipmentTier' from hospital
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
-- Remove 'equipmentTier' from office
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
-- Remove 'equipmentTier' from data-center
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');
-- Remove 'equipmentTier' from retail
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
-- Remove 'equipmentTier' from manufacturing
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
-- Remove 'equipmentTier' from warehouse
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
-- Remove 'equipmentTier' from shopping-center
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
-- Remove 'equipmentTier' from apartment
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
-- Remove 'equipmentTier' from residential
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
-- Remove 'equipmentTier' from gas-station
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
-- Remove 'equipmentTier' from airport
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
-- Remove 'equipmentTier' from casino
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
-- Remove 'equipmentTier' from government
DELETE FROM custom_questions WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

-- If you have other verticals, add similar DELETE statements for each.

-- Optionally, remove legacy columns from use_case_configurations if present:
-- ALTER TABLE use_case_configurations DROP COLUMN IF EXISTS equipment_tier;

-- Optionally, update seed/migration files to remove any 'equipmentTier' inserts.

-- End of script.
