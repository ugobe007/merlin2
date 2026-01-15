-- ============================================================================
-- QUESTION TIERS ASSIGNMENT
-- ============================================================================
-- Created: January 14, 2026
-- Purpose: Tag existing questions with tiers for dynamic questionnaire depth
-- 
-- Tier Definitions:
-- - essential: Always shown to ALL users (8-10 questions per industry)
-- - standard: Shown to medium+ businesses (adds 6-8 more questions)
-- - detailed: Shown to large+ businesses (adds 6-10 more questions)
--
-- Question Priority:
-- 1. Essential = Questions needed for basic BESS sizing (peak demand, usage)
-- 2. Standard = Questions that improve accuracy (amenities, operating hours)
-- 3. Detailed = Questions for fine-tuning (specific equipment, growth plans)
--
-- SSOT Compliant: This only affects wizard UI display, not calculations
-- ============================================================================

-- ============================================================================
-- HOTEL QUESTION TIERS
-- ============================================================================
-- Essential: roomCount, hotelCategory, averageMonthlyBill, peakDemandKw
-- Standard: hasPool, hasRestaurant, hasConferenceRooms, operatingHours
-- Detailed: hasSpa, hasFitness, hasLaundry, evChargingInterest, growthPlans

UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel') 
AND field_name IN (
  'roomCount',
  'hotelCategory',
  'hotelClass',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel') 
AND field_name IN (
  'hasPool',
  'hasRestaurant',
  'hasConferenceRooms',
  'operatingHours',
  'occupancyRate',
  'numberOfFloors',
  'numberOfElevators',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hotel') 
AND field_name IN (
  'hasSpa',
  'hasFitnessCenter',
  'hasLaundry',
  'hasKitchen',
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- CAR WASH QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash') 
AND field_name IN (
  'bayCount',
  'washType',
  'carWashType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash') 
AND field_name IN (
  'operatingHours',
  'carsPerDay',
  'hasVacuums',
  'hasDetailBays',
  'waterReclamation',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'car-wash') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'hasConvenienceStore',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- EV CHARGING QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging') 
AND field_name IN (
  'level2Chargers',
  'dcfcChargers',
  'totalChargers',
  'chargingStationType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging') 
AND field_name IN (
  'operatingHours',
  'utilizationRate',
  'ultraFastChargers',
  'existingGeneration',
  'gridConnection',
  'utilityTariff'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'ev-charging') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'fleetChargingNeeds',
  'vehicleToGridInterest',
  'rooftopSqFt'
);

-- ============================================================================
-- DATA CENTER QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center') 
AND field_name IN (
  'squareFootage',
  'rackCount',
  'tierLevel',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center') 
AND field_name IN (
  'operatingHours',
  'pue',
  'coolingType',
  'redundancyLevel',
  'upsCapacity',
  'gridConnection'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'data-center') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'sustainabilityGoals',
  'microgridInterest',
  'rooftopSqFt'
);

-- ============================================================================
-- MANUFACTURING QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing') 
AND field_name IN (
  'squareFootage',
  'manufacturingType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing') 
AND field_name IN (
  'operatingHours',
  'shiftsPerDay',
  'heavyEquipment',
  'compressedAir',
  'processHeat',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'criticalProcesses',
  'shutdownCost',
  'rooftopSqFt'
);

-- ============================================================================
-- HOSPITAL QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital') 
AND field_name IN (
  'bedCount',
  'hospitalType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital') 
AND field_name IN (
  'operatingHours',
  'hasEmergencyDept',
  'hasSurgicalSuites',
  'hasImagingCenter',
  'criticalLoadPercent',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'jcahoCompliance',
  'emergencyPreparednessLevel',
  'rooftopSqFt'
);

-- ============================================================================
-- RETAIL QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail') 
AND field_name IN (
  'squareFootage',
  'retailType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail') 
AND field_name IN (
  'operatingHours',
  'hasRefrigeration',
  'lightingType',
  'hvacType',
  'peakSeasons'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- WAREHOUSE QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse') 
AND field_name IN (
  'squareFootage',
  'warehouseType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse') 
AND field_name IN (
  'operatingHours',
  'hasColdStorage',
  'coldStoragePercent',
  'hasAutomation',
  'forklifts',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt',
  'fleetVehicles'
);

-- ============================================================================
-- OFFICE QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office') 
AND field_name IN (
  'squareFootage',
  'officeType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office') 
AND field_name IN (
  'operatingHours',
  'numberOfFloors',
  'numberOfElevators',
  'dataCenter',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'office') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt',
  'tenantCount'
);

-- ============================================================================
-- RESTAURANT QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'restaurant') 
AND field_name IN (
  'squareFootage',
  'restaurantType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'restaurant') 
AND field_name IN (
  'operatingHours',
  'seatingCapacity',
  'hasWalkInCooler',
  'kitchenEquipment',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'restaurant') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- COLLEGE QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'college') 
AND field_name IN (
  'studentCount',
  'campusType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'college') 
AND field_name IN (
  'operatingHours',
  'buildingCount',
  'hasResidenceHalls',
  'hasSportsComplexes',
  'hasResearchLabs',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'college') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'sustainabilityGoals',
  'microgridInterest'
);

-- ============================================================================
-- TRUCK STOP QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop') 
AND field_name IN (
  'parkingSpaces',
  'truckStopType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop') 
AND field_name IN (
  'operatingHours',
  'fuelPumps',
  'hasConvenienceStore',
  'hasRestaurant',
  'hasShowers',
  'hasScaleHouse'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop') 
AND field_name IN (
  'evChargingInterest',
  'truckEvCharging',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- AGRICULTURE / INDOOR FARM QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id IN (
  SELECT id FROM use_cases WHERE slug IN ('agricultural', 'indoor-farm')
) 
AND field_name IN (
  'acres',
  'farmType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id IN (
  SELECT id FROM use_cases WHERE slug IN ('agricultural', 'indoor-farm')
) 
AND field_name IN (
  'operatingHours',
  'hasIrrigation',
  'hasColdStorage',
  'hasGreenhouses',
  'processingEquipment'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id IN (
  SELECT id FROM use_cases WHERE slug IN ('agricultural', 'indoor-farm')
) 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'wellPumps',
  'livestockCount'
);

-- ============================================================================
-- GAS STATION QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station') 
AND field_name IN (
  'fuelPumps',
  'gasStationType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station') 
AND field_name IN (
  'operatingHours',
  'hasConvenienceStore',
  'hasCarWash',
  'hasQuickService',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- APARTMENT QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment') 
AND field_name IN (
  'unitCount',
  'buildingType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment') 
AND field_name IN (
  'operatingHours',
  'numberOfFloors',
  'hasPool',
  'hasGym',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- SHOPPING CENTER / MALL QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center') 
AND field_name IN (
  'squareFootage',
  'mallType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center') 
AND field_name IN (
  'operatingHours',
  'tenantCount',
  'hasAnchorStores',
  'hasRefrigeration',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- AIRPORT QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport') 
AND field_name IN (
  'annualPassengers',
  'airportType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport') 
AND field_name IN (
  'operatingHours',
  'numberOfTerminals',
  'numberOfGates',
  'hasHotels',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'microgridInterest'
);

-- ============================================================================
-- CASINO QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino') 
AND field_name IN (
  'gamingFloorSqft',
  'casinoType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino') 
AND field_name IN (
  'operatingHours',
  'hasHotel',
  'hasRestaurants',
  'hasEntertainmentVenues',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- GOVERNMENT QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'government') 
AND field_name IN (
  'squareFootage',
  'facilityType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'government') 
AND field_name IN (
  'operatingHours',
  'numberOfBuildings',
  'hasDataCenter',
  'criticalOperations',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'government') 
AND field_name IN (
  'evChargingInterest',
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'sustainabilityMandate',
  'microgridInterest'
);

-- ============================================================================
-- MICROGRID QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid') 
AND field_name IN (
  'siteType',
  'loadMW',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid') 
AND field_name IN (
  'operatingHours',
  'islandingCapability',
  'existingSolar',
  'existingWind',
  'criticalLoadPercent'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'frequencyRegulation',
  'ancillaryServices'
);

-- ============================================================================
-- RESIDENTIAL QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential') 
AND field_name IN (
  'squareFootage',
  'homeType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential') 
AND field_name IN (
  'hasPool',
  'hasEV',
  'hasHotTub',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'wholehomeBackup',
  'rooftopSqFt'
);

-- ============================================================================
-- COLD STORAGE QUESTION TIERS
-- ============================================================================
UPDATE custom_questions SET question_tier = 'essential' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage') 
AND field_name IN (
  'squareFootage',
  'storageType',
  'averageMonthlyBill',
  'peakDemandKw',
  'estimatedAnnualKwh',
  'existingGeneration',
  'primaryBESSApplication'
);

UPDATE custom_questions SET question_tier = 'standard' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage') 
AND field_name IN (
  'operatingHours',
  'temperatureZones',
  'freezerPercent',
  'coolerPercent',
  'hvacType'
);

UPDATE custom_questions SET question_tier = 'detailed' 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage') 
AND field_name IN (
  'solarInterest',
  'generatorInterest',
  'gridReliability',
  'expansionPlans',
  'rooftopSqFt'
);

-- ============================================================================
-- SET REMAINING UNTAGGED QUESTIONS TO STANDARD
-- ============================================================================
UPDATE custom_questions 
SET question_tier = 'standard' 
WHERE question_tier IS NULL OR question_tier = '';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  essential_count INTEGER;
  standard_count INTEGER;
  detailed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO essential_count FROM custom_questions WHERE question_tier = 'essential';
  SELECT COUNT(*) INTO standard_count FROM custom_questions WHERE question_tier = 'standard';
  SELECT COUNT(*) INTO detailed_count FROM custom_questions WHERE question_tier = 'detailed';
  
  RAISE NOTICE '✅ Question tiers assigned:';
  RAISE NOTICE '   Essential: % questions', essential_count;
  RAISE NOTICE '   Standard: % questions', standard_count;
  RAISE NOTICE '   Detailed: % questions', detailed_count;
END $$;

-- ============================================================================
-- CREATE INDEX FOR TIER FILTERING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_custom_questions_tier 
ON custom_questions(question_tier) WHERE question_tier IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_custom_questions_use_case_tier 
ON custom_questions(use_case_id, question_tier);
