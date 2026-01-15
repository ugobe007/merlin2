-- ============================================
-- QUESTION INPUT TYPE MIGRATION
-- Generated: 2026-01-14T20:39:13.562Z
-- ============================================
-- 
-- This migration updates custom_questions to use proper input types
-- based on the audit recommendations.
-- 
-- INPUT TYPES:
-- - range_buttons: Preset ranges for discrete counts
-- - slider: Continuous values with min/max/step
-- - multiselect: Checkbox grid for multiple selections
-- - select: Single choice (buttons ≤6, dropdown >6)
-- - toggle: Yes/No boolean
-- - number_input: Direct numeric entry
-- ============================================


-- AGRICULTURAL
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'farmAcres' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'totalAcres' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'irrigatedAcres' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

-- AIRPORT
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'terminalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'gateCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'terminalCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

-- APARTMENT
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-20","min":1,"max":20},{"label":"21-50","min":21,"max":50},{"label":"51-100","min":51,"max":100},{"label":"101-250","min":101,"max":250},{"label":"250+","min":251,"max":null}],"suffix":"units"}'::jsonb
WHERE field_name = 'totalUnits' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'buildingCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-20","min":1,"max":20},{"label":"21-50","min":21,"max":50},{"label":"51-100","min":51,"max":100},{"label":"101-250","min":101,"max":250},{"label":"250+","min":251,"max":null}],"suffix":"units"}'::jsonb
WHERE field_name = 'avgUnitSize' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-2","min":0,"max":2},{"label":"3-6","min":3,"max":6},{"label":"7-12","min":7,"max":12},{"label":"13-20","min":13,"max":20},{"label":"20+","min":21,"max":null}],"suffix":"elevators"}'::jsonb
WHERE field_name = 'elevatorCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-20","min":1,"max":20},{"label":"21-50","min":21,"max":50},{"label":"51-100","min":51,"max":100},{"label":"101-250","min":101,"max":250},{"label":"250+","min":251,"max":null}],"suffix":"units"}'::jsonb
WHERE field_name = 'unitCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

-- CAR-WASH
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-2","min":1,"max":2},{"label":"3-4","min":3,"max":4},{"label":"5-6","min":5,"max":6},{"label":"7-10","min":7,"max":10},{"label":"10+","min":11,"max":null}],"suffix":"bays"}'::jsonb
WHERE field_name = 'bayCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'tunnelLength' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'dailyVehicles' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'vacuumStations' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'siteSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'roofSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasNaturalGas' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1,"max":7,"step":1,"suffix":" days/week"}'::jsonb
WHERE field_name = 'daysPerWeek' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'evL2Count' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-4","min":0,"max":4},{"label":"5-10","min":5,"max":10},{"label":"11-20","min":11,"max":20},{"label":"21-40","min":21,"max":40},{"label":"40+","min":41,"max":null}],"suffix":"chargers (350 kW each)"}'::jsonb
WHERE field_name = 'evDcfcCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- CASINO
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'gamingFloorSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-25","min":1,"max":25},{"label":"26-75","min":26,"max":75},{"label":"76-150","min":76,"max":150},{"label":"151-300","min":151,"max":300},{"label":"300+","min":301,"max":null}],"suffix":"rooms"}'::jsonb
WHERE field_name = 'hotelRooms' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'slotMachines' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'tableGames' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-3","min":1,"max":3},{"label":"4-10","min":4,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"50+","min":51,"max":null}],"suffix":"floors"}'::jsonb
WHERE field_name = 'gamingFloorSize' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

-- COLD-STORAGE
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'storageCapacity' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'refrigeratedSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'storageVolume' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

-- COLLEGE
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'campusAcres' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'buildingCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'select',
  options = '{"options":[{"icon":"School","label":"Academic Buildings","value":"classrooms"},{"icon":"FlaskConical","label":"Research Labs","value":"labs"},{"icon":"Home","label":"Dormitories/Housing","value":"dorms"},{"icon":"UtensilsCrossed","label":"Dining Halls","value":"dining"},{"icon":"Dumbbell","label":"Athletic Facilities","value":"athletic"},{"icon":"Library","label":"Library","value":"library"},{"icon":"Briefcase","label":"Administrative","value":"admin"},{"icon":"Heart","label":"Health Center/Hospital","value":"medical"},{"icon":"Theater","label":"Performing Arts Center","value":"performing"},{"icon":"Server","label":"Data Center","value":"datacenter"}]}'::jsonb
WHERE field_name = 'facilityTypes' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'studentEnrollment' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'studentCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

-- DATA-CENTER
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-50","min":11,"max":50},{"label":"51-100","min":51,"max":100},{"label":"101-500","min":101,"max":500},{"label":"500+","min":501,"max":null}],"suffix":"racks"}'::jsonb
WHERE field_name = 'rackCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'whitespaceSquareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center');

-- EV-CHARGING
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-5","min":0,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"31-50","min":31,"max":50},{"label":"50+","min":51,"max":null}],"suffix":"chargers (19.2 kW each)"}'::jsonb
WHERE field_name = 'level2Count' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-4","min":0,"max":4},{"label":"5-10","min":5,"max":10},{"label":"11-20","min":11,"max":20},{"label":"21-40","min":21,"max":40},{"label":"40+","min":41,"max":null}],"suffix":"chargers (350 kW each)"}'::jsonb
WHERE field_name = 'dcfc50Count' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-4","min":0,"max":4},{"label":"5-10","min":5,"max":10},{"label":"11-20","min":11,"max":20},{"label":"21-40","min":21,"max":40},{"label":"40+","min":41,"max":null}],"suffix":"chargers (350 kW each)"}'::jsonb
WHERE field_name = 'dcfcHighCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'megawattCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'siteSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":500,"max":100000,"step":500,"suffix":" $/mo"}'::jsonb
WHERE field_name = 'monthlyBill' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'dcFastCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'ultraFastCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- GAS-STATION
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'dispenserCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'storeSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'fuelPositions' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

-- GOVERNMENT
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'governmentSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'buildingCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'buildingSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'facilitySqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

-- HEAVY_DUTY_TRUCK_STOP
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-2","min":1,"max":2},{"label":"3-4","min":3,"max":4},{"label":"5-8","min":5,"max":8},{"label":"8+","min":9,"max":null}],"suffix":"chargers (1,250 kW each)"}'::jsonb
WHERE field_name = 'mcsChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-4","min":0,"max":4},{"label":"5-10","min":5,"max":10},{"label":"11-20","min":11,"max":20},{"label":"21-40","min":21,"max":40},{"label":"40+","min":41,"max":null}],"suffix":"chargers (350 kW each)"}'::jsonb
WHERE field_name = 'dcfc350' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-5","min":0,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"31-50","min":31,"max":50},{"label":"50+","min":51,"max":null}],"suffix":"chargers (19.2 kW each)"}'::jsonb
WHERE field_name = 'level2' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-2","min":1,"max":2},{"label":"3-4","min":3,"max":4},{"label":"5-6","min":5,"max":6},{"label":"7-10","min":7,"max":10},{"label":"10+","min":11,"max":null}],"suffix":"bays"}'::jsonb
WHERE field_name = 'serviceBays' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-2","min":1,"max":2},{"label":"3-4","min":3,"max":4},{"label":"5-6","min":5,"max":6},{"label":"7-10","min":7,"max":10},{"label":"10+","min":11,"max":null}],"suffix":"bays"}'::jsonb
WHERE field_name = 'truckWashBays' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-50","min":0,"max":50},{"label":"51-100","min":51,"max":100},{"label":"101-200","min":101,"max":200},{"label":"201-400","min":201,"max":400},{"label":"400+","min":401,"max":null}],"suffix":"seats"}'::jsonb
WHERE field_name = 'restaurantSeats' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasShowers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasLaundry' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0.5,"max":20,"step":0.5,"suffix":" acres"}'::jsonb
WHERE field_name = 'parkingLotAcres' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":50,"max":5000,"step":50,"suffix":" kW"}'::jsonb
WHERE field_name = 'peakDemandKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

-- HOSPITAL
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-50","min":1,"max":50},{"label":"51-150","min":51,"max":150},{"label":"151-300","min":151,"max":300},{"label":"301-500","min":301,"max":500},{"label":"500+","min":501,"max":null}],"suffix":"beds"}'::jsonb
WHERE field_name = 'bedCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"51-100","min":51,"max":100},{"label":"100+","min":101,"max":null}]}'::jsonb
WHERE field_name = 'buildingCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-25","min":1,"max":25},{"label":"26-75","min":26,"max":75},{"label":"76-150","min":76,"max":150},{"label":"151-300","min":151,"max":300},{"label":"300+","min":301,"max":null}],"suffix":"rooms"}'::jsonb
WHERE field_name = 'operatingRooms' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-50","min":1,"max":50},{"label":"51-150","min":51,"max":150},{"label":"151-300","min":151,"max":300},{"label":"301-500","min":301,"max":500},{"label":"500+","min":501,"max":null}],"suffix":"beds"}'::jsonb
WHERE field_name = 'icuBeds' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

-- HOTEL
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-25","min":1,"max":25},{"label":"26-75","min":26,"max":75},{"label":"76-150","min":76,"max":150},{"label":"151-300","min":151,"max":300},{"label":"300+","min":301,"max":null}],"suffix":"rooms"}'::jsonb
WHERE field_name = 'roomCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":1000,"step":10}'::jsonb
WHERE field_name = 'occupancyRate' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-3","min":1,"max":3},{"label":"4-10","min":4,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"50+","min":51,"max":null}],"suffix":"floors"}'::jsonb
WHERE field_name = 'floorCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-2","min":0,"max":2},{"label":"3-6","min":3,"max":6},{"label":"7-12","min":7,"max":12},{"label":"13-20","min":13,"max":20},{"label":"20+","min":21,"max":null}],"suffix":"elevators"}'::jsonb
WHERE field_name = 'elevatorCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-2","min":0,"max":2},{"label":"3-6","min":3,"max":6},{"label":"7-12","min":7,"max":12},{"label":"13-20","min":13,"max":20},{"label":"20+","min":21,"max":null}],"suffix":"elevators"}'::jsonb
WHERE field_name = 'efficientElevators' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'rooftopSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

UPDATE custom_questions 
SET 
  question_type = 'multiselect',
  options = '{"options":[{"icon":"❌","label":"No Spa","value":"none","energyKwh":0},{"icon":"💆","label":"Basic Spa (Massage)","value":"basic","energyKwh":12000},{"icon":"🧖","label":"Full Spa","value":"full","energyKwh":35000},{"icon":"♨️","label":"Resort Spa + Sauna","value":"resort","energyKwh":65000}]}'::jsonb
WHERE field_name = 'spaServices' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel');

-- INDOOR-FARM
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'growingAreaSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-3","min":1,"max":3},{"label":"4-10","min":4,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"50+","min":51,"max":null}],"suffix":"floors"}'::jsonb
WHERE field_name = 'growingLevels' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

-- MANUFACTURING
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'manufacturingSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'facilitySqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1,"max":7,"step":1,"suffix":" days/week"}'::jsonb
WHERE field_name = 'daysPerWeek' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

-- MICROGRID
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-3","min":1,"max":3},{"label":"4-8","min":4,"max":8},{"label":"9-15","min":9,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"buildings"}'::jsonb
WHERE field_name = 'connectedBuildings' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'islandDuration' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

-- OFFICE
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'officeSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-3","min":1,"max":3},{"label":"4-10","min":4,"max":10},{"label":"11-25","min":11,"max":25},{"label":"26-50","min":26,"max":50},{"label":"50+","min":51,"max":null}],"suffix":"floors"}'::jsonb
WHERE field_name = 'floorCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0-2","min":0,"max":2},{"label":"3-6","min":3,"max":6},{"label":"7-12","min":7,"max":12},{"label":"13-20","min":13,"max":20},{"label":"20+","min":21,"max":null}],"suffix":"elevators"}'::jsonb
WHERE field_name = 'elevatorCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'buildingSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

-- RESIDENTIAL
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'homeSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasEVCharging' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

-- RETAIL
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'retailSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'storeSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1,"max":7,"step":1,"suffix":" days/week"}'::jsonb
WHERE field_name = 'daysPerWeek' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

-- SHOPPING-CENTER
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'mallSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'glaSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-10","min":1,"max":10},{"label":"11-30","min":11,"max":30},{"label":"31-75","min":31,"max":75},{"label":"76-150","min":76,"max":150},{"label":"150+","min":151,"max":null}],"suffix":"tenants"}'::jsonb
WHERE field_name = 'tenantCount' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'totalSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'retailSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

-- WAREHOUSE
-- ========================================

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'facilitySqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"31-60","min":31,"max":60},{"label":"60+","min":61,"max":null}],"suffix":"docks"}'::jsonb
WHERE field_name = 'dockDoors' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":6,"max":24,"step":1,"suffix":" hrs/day"}'::jsonb
WHERE field_name = 'operatingHours' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1,"max":7,"step":1,"suffix":" days/week"}'::jsonb
WHERE field_name = 'daysPerWeek' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingSolar' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":0,"max":500,"step":10,"suffix":" kW"}'::jsonb
WHERE field_name = 'existingSolarKW' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'hasExistingEV' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'range_buttons',
  options = '{"ranges":[{"label":"0","min":0,"max":0},{"label":"1-5","min":1,"max":5},{"label":"6-15","min":6,"max":15},{"label":"16-30","min":16,"max":30},{"label":"30+","min":31,"max":null}],"suffix":"chargers"}'::jsonb
WHERE field_name = 'existingEVChargers' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'toggle',
  options = 'null'::jsonb
WHERE field_name = 'needsBackupPower' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'warehouseSqFt' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

UPDATE custom_questions 
SET 
  question_type = 'slider',
  options = '{"min":1000,"max":500000,"step":1000,"suffix":" sq ft"}'::jsonb
WHERE field_name = 'squareFeet' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
