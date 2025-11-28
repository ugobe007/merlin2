-- =============================================================================
-- FIX: Update ALL field names to match SmartWizardV2 expectations
-- Run AFTER all batches to correct field name mismatches
-- This ensures useCaseData.fieldName works in the wizard calculations
-- =============================================================================

-- =============================================================================
-- BATCH 7 FIXES: Indoor Farm, Agricultural
-- =============================================================================

-- indoor-farm: 'squareFeet' → 'growingAreaSqFt'
UPDATE custom_questions 
SET field_name = 'growingAreaSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

-- indoor-farm: 'lightingKW' → 'ledWattagePerSqFt' (different calculation!)
-- SmartWizard: growingAreaSqFt × ledWattagePerSqFt / 1,000,000 = MW
UPDATE custom_questions 
SET 
  question_text = 'LED wattage per sq ft',
  field_name = 'ledWattagePerSqFt',
  default_value = '40',
  min_value = 20,
  max_value = 80,
  help_text = 'Typical: 30-50 W/sqft for leafy greens, 40-60 W/sqft for fruiting plants'
WHERE field_name = 'lightingKW' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

-- agricultural: 'acreage' → 'farmSize'  
UPDATE custom_questions 
SET field_name = 'farmSize'
WHERE field_name = 'acreage' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

-- =============================================================================
-- BATCH 4 FIXES: College, Cold Storage, Retail
-- =============================================================================

-- college: 'enrollment' → 'studentCount'
UPDATE custom_questions 
SET field_name = 'studentCount'
WHERE field_name = 'enrollment' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

-- cold-storage: 'squareFeet' → 'storageVolume' (wizard expects cubic feet!)
UPDATE custom_questions 
SET 
  question_text = 'Cold storage volume (cubic feet)',
  field_name = 'storageVolume',
  default_value = '50000',
  min_value = 1000,
  max_value = 5000000,
  help_text = 'Total refrigerated volume in cubic feet'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

-- retail: 'squareFeet' → 'retailSqFt'
UPDATE custom_questions 
SET field_name = 'retailSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

-- =============================================================================
-- BATCH 5 FIXES: Apartment, Residential, Shopping Center
-- =============================================================================

-- apartment: 'units' → 'unitCount'
UPDATE custom_questions 
SET field_name = 'unitCount'
WHERE field_name = 'units' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

-- residential: 'squareFeet' → 'homeSqFt'
UPDATE custom_questions 
SET field_name = 'homeSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

-- shopping-center: 'squareFeet' → 'retailSqFt' (wizard uses same field as retail)
UPDATE custom_questions 
SET field_name = 'retailSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

-- shopping-center: 'tenants' is fine, but let's keep it

-- =============================================================================
-- BATCH 6 FIXES: Casino, Gas Station, Government
-- =============================================================================

-- casino: 'squareFeet' → 'gamingFloorSize'
UPDATE custom_questions 
SET field_name = 'gamingFloorSize'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

-- gas-station: 'fuelDispensers' → 'dispenserCount'
UPDATE custom_questions 
SET field_name = 'dispenserCount'
WHERE field_name = 'fuelDispensers' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

-- government: 'squareFeet' → 'buildingSqFt'
UPDATE custom_questions 
SET field_name = 'buildingSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

-- =============================================================================
-- BATCH 3 FIXES: Car Wash, Warehouse, Office
-- =============================================================================

-- car-wash: 'washBays' → 'bayCount'
UPDATE custom_questions 
SET field_name = 'bayCount'
WHERE field_name = 'washBays' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash');

-- warehouse: 'squareFeet' → 'warehouseSqFt'
UPDATE custom_questions 
SET field_name = 'warehouseSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

-- office: 'squareFeet' → 'officeSqFt'
UPDATE custom_questions 
SET field_name = 'officeSqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

-- =============================================================================
-- BATCH 2 FIXES: EV Charging, Airport, Manufacturing
-- =============================================================================

-- ev-charging: 'dcfastCount' → should map properly (check existing)
-- The wizard expects: numberOfLevel2Chargers, numberOfDCFastChargers
UPDATE custom_questions 
SET field_name = 'numberOfDCFastChargers'
WHERE field_name = 'dcfastCount' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

UPDATE custom_questions 
SET field_name = 'numberOfLevel2Chargers'
WHERE field_name = 'level2Count' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging');

-- manufacturing: 'squareFeet' → 'facilitySqFt'
UPDATE custom_questions 
SET field_name = 'facilitySqFt'
WHERE field_name = 'squareFeet' 
AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

-- airport: 'annualPassengers' is correct! ✓

-- =============================================================================
-- BATCH 1 FIXES: Hotel, Hospital, Data Center
-- =============================================================================

-- hotel/hotel-hospitality: wizard expects 'roomCount'
UPDATE custom_questions 
SET field_name = 'roomCount'
WHERE field_name = 'rooms' 
AND use_case_id IN (SELECT id FROM use_cases WHERE slug IN ('hotel', 'hotel-hospitality'));

-- hospital: wizard expects 'bedCount' - should be correct already

-- data-center: wizard expects 'rackCount' or 'itLoadKW'
-- Check if we need to rename

-- =============================================================================
-- VERIFY ALL CRITICAL FIELD MAPPINGS
-- =============================================================================
SELECT 
  uc.slug,
  cq.field_name,
  cq.display_order,
  cq.question_text
FROM custom_questions cq
JOIN use_cases uc ON cq.use_case_id = uc.id
WHERE cq.display_order <= 4
ORDER BY uc.slug, cq.display_order;
