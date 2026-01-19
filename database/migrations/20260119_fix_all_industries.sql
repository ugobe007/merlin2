-- ============================================================================
-- Migration: Fix ALL Industries - Complete Display Order Reorder
-- Date: January 19, 2026
-- Purpose: Fix duplicate display_order values for all 18 remaining industries
-- ============================================================================

-- ============================================================================
-- AGRICULTURAL (31 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Farm Basics' WHERE field_name = 'farmType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 2, section_name = 'Farm Basics' WHERE field_name = 'farmAcres' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 3, section_name = 'Farm Basics' WHERE field_name = 'totalAcres' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 4, section_name = 'Farm Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 5, section_name = 'Farm Basics' WHERE field_name = 'irrigatedAcres' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 6, section_name = 'Farm Basics' WHERE field_name = 'farmBuildings' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'irrigationType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'seasonalPattern' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'waterSource' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 14, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 21, section_name = 'Equipment' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 22, section_name = 'Equipment' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'gridReliability' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 36, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'agrivoltaicsInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');
UPDATE custom_questions SET display_order = 53, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'agricultural');

-- ============================================================================
-- AIRPORT (30 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Airport Basics' WHERE field_name = 'airportSize' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 2, section_name = 'Airport Basics' WHERE field_name = 'annualPassengers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 3, section_name = 'Airport Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 4, section_name = 'Airport Basics' WHERE field_name = 'terminalSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 5, section_name = 'Airport Basics' WHERE field_name = 'gateCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 6, section_name = 'Airport Basics' WHERE field_name = 'terminalCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'parkingSpaces' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'supportFacilities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'gseElectrification' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 14, section_name = 'Operations' WHERE field_name = 'publicEvChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 15, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 21, section_name = 'Equipment' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 22, section_name = 'Equipment' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'airport');

-- ============================================================================
-- APARTMENT (29 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Property Basics' WHERE field_name = 'buildingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 2, section_name = 'Property Basics' WHERE field_name = 'totalUnits' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 3, section_name = 'Property Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 4, section_name = 'Property Basics' WHERE field_name = 'buildingCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 5, section_name = 'Property Basics' WHERE field_name = 'avgUnitSize' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 11, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 12, section_name = 'Building Systems' WHERE field_name = 'elevatorCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 13, section_name = 'Building Systems' WHERE field_name = 'inUnitLaundry' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 14, section_name = 'Building Systems' WHERE field_name = 'meteringConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 15, section_name = 'Building Systems' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 21, section_name = 'Amenities' WHERE field_name = 'communityAmenities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 22, section_name = 'Amenities' WHERE field_name = 'commonAreaCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 23, section_name = 'Amenities' WHERE field_name = 'evChargingInterest' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 24, section_name = 'Amenities' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'apartment');

-- ============================================================================
-- CASINO (29 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Casino Basics' WHERE field_name = 'casinoType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 2, section_name = 'Casino Basics' WHERE field_name = 'gamingFloorSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 3, section_name = 'Casino Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 4, section_name = 'Casino Basics' WHERE field_name = 'totalSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 5, section_name = 'Casino Basics' WHERE field_name = 'hotelRooms' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'fbOutlets' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'entertainmentVenues' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 14, section_name = 'Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 21, section_name = 'Equipment' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'casino');

-- ============================================================================
-- COLD-STORAGE (32 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'facilityType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'storageCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'refrigeratedSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'palletCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 6, section_name = 'Facility Basics' WHERE field_name = 'tempZones' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'blastFreezing' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'dockConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 21, section_name = 'Refrigeration' WHERE field_name = 'refrigerationSystem' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 22, section_name = 'Refrigeration' WHERE field_name = 'compressorConfig' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 23, section_name = 'Refrigeration' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 24, section_name = 'Refrigeration' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'cold-storage');

-- ============================================================================
-- COLLEGE (32 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Campus Basics' WHERE field_name = 'campusType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 2, section_name = 'Campus Basics' WHERE field_name = 'studentPopulation' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 3, section_name = 'Campus Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 4, section_name = 'Campus Basics' WHERE field_name = 'campusAcres' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 5, section_name = 'Campus Basics' WHERE field_name = 'buildingCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 6, section_name = 'Campus Basics' WHERE field_name = 'totalSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 11, section_name = 'Building Systems' WHERE field_name = 'hvacAge' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 12, section_name = 'Building Systems' WHERE field_name = 'centralPlant' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 13, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 14, section_name = 'Building Systems' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 15, section_name = 'Building Systems' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 21, section_name = 'Critical Facilities' WHERE field_name = 'criticalFacilities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 22, section_name = 'Critical Facilities' WHERE field_name = 'backupPowerStatus' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityCommitments' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'college');

-- ============================================================================
-- GAS-STATION (29 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Station Basics' WHERE field_name = 'stationType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 2, section_name = 'Station Basics' WHERE field_name = 'dispenserCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 3, section_name = 'Station Basics' WHERE field_name = 'storeSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 4, section_name = 'Station Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 5, section_name = 'Station Basics' WHERE field_name = 'fuelPositions' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 6, section_name = 'Station Basics' WHERE field_name = 'fuelTypes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'additionalServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'refrigeration' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'lightingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 14, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 15, section_name = 'Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 16, section_name = 'Operations' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 21, section_name = 'EV Charging' WHERE field_name = 'existingEvCharging' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'gas-station');

-- ============================================================================
-- GOVERNMENT (30 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'facilityType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'governmentSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'governmentLevel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'totalSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 6, section_name = 'Facility Basics' WHERE field_name = 'buildingCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'fleetSize' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'lightingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityMandates' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'government');

-- ============================================================================
-- HEAVY_DUTY_TRUCK_STOP (22 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Station Basics' WHERE field_name = 'stationType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 2, section_name = 'Station Basics' WHERE field_name = 'parkingSpaces' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 3, section_name = 'Station Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 4, section_name = 'Station Basics' WHERE field_name = 'fuelLanes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 11, section_name = 'Amenities' WHERE field_name = 'hasShowers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 12, section_name = 'Amenities' WHERE field_name = 'hasLaundry' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 13, section_name = 'Amenities' WHERE field_name = 'driverAmenities' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 14, section_name = 'Amenities' WHERE field_name = 'foodOptions' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 21, section_name = 'Operations' WHERE field_name = 'alternativeFuels' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 22, section_name = 'Operations' WHERE field_name = 'climateZone' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 23, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 24, section_name = 'Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 25, section_name = 'Operations' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'heavy_duty_truck_stop');

-- ============================================================================
-- HOSPITAL (30 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Hospital Basics' WHERE field_name = 'hospitalType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 2, section_name = 'Hospital Basics' WHERE field_name = 'bedCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 3, section_name = 'Hospital Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 4, section_name = 'Hospital Basics' WHERE field_name = 'totalSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 5, section_name = 'Hospital Basics' WHERE field_name = 'buildingCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 11, section_name = 'Medical Operations' WHERE field_name = 'operatingRooms' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 12, section_name = 'Medical Operations' WHERE field_name = 'imagingEquipment' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 13, section_name = 'Medical Operations' WHERE field_name = 'dataCenter' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 14, section_name = 'Medical Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 23, section_name = 'Building Systems' WHERE field_name = 'generatorCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 24, section_name = 'Building Systems' WHERE field_name = 'generatorRuntime' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'hospital');

-- ============================================================================
-- INDOOR-FARM (29 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Farm Basics' WHERE field_name = 'farmType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 2, section_name = 'Farm Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 3, section_name = 'Farm Basics' WHERE field_name = 'growingLevels' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 4, section_name = 'Farm Basics' WHERE field_name = 'cropTypes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 5, section_name = 'Farm Basics' WHERE field_name = 'growingMethod' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 11, section_name = 'Growing Operations' WHERE field_name = 'photoperiod' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 12, section_name = 'Growing Operations' WHERE field_name = 'climateControl' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 13, section_name = 'Growing Operations' WHERE field_name = 'operatingSchedule' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 14, section_name = 'Growing Operations' WHERE field_name = 'automationLevel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 15, section_name = 'Growing Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 21, section_name = 'Equipment' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 22, section_name = 'Equipment' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'indoor-farm');

-- ============================================================================
-- MANUFACTURING (30 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'manufacturingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'manufacturingSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'shiftsPerDay' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'daysPerWeek' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 21, section_name = 'Equipment' WHERE field_name = 'compressedAir' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 22, section_name = 'Equipment' WHERE field_name = 'powerQualitySensitivity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 23, section_name = 'Equipment' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 24, section_name = 'Equipment' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'demandChargePercent' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 36, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'existingGeneration' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'generatorCoverage' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 46, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'evFleet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');
UPDATE custom_questions SET display_order = 53, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'manufacturing');

-- ============================================================================
-- MICROGRID (32 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Microgrid Basics' WHERE field_name = 'microgridScale' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 2, section_name = 'Microgrid Basics' WHERE field_name = 'microgridApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 3, section_name = 'Microgrid Basics' WHERE field_name = 'sitePeakLoad' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 4, section_name = 'Microgrid Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 5, section_name = 'Microgrid Basics' WHERE field_name = 'connectedBuildings' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 6, section_name = 'Microgrid Basics' WHERE field_name = 'primaryDriver' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 11, section_name = 'Existing Generation' WHERE field_name = 'existingGeneration' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 12, section_name = 'Existing Generation' WHERE field_name = 'existingCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 13, section_name = 'Existing Generation' WHERE field_name = 'existingStorage' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 21, section_name = 'Grid & Operations' WHERE field_name = 'gridConnection' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 22, section_name = 'Grid & Operations' WHERE field_name = 'criticalLoads' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 23, section_name = 'Grid & Operations' WHERE field_name = 'criticalLoadPercent' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 24, section_name = 'Grid & Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 25, section_name = 'Grid & Operations' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 26, section_name = 'Grid & Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 41, section_name = 'Planned Additions' WHERE field_name = 'plannedSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 42, section_name = 'Planned Additions' WHERE field_name = 'plannedStorage' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 51, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 52, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 53, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 54, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 61, section_name = 'Goals' WHERE field_name = 'gridServices' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 62, section_name = 'Goals' WHERE field_name = 'utilityPrograms' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');
UPDATE custom_questions SET display_order = 63, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'microgrid');

-- ============================================================================
-- OFFICE (29 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Building Basics' WHERE field_name = 'buildingClass' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 2, section_name = 'Building Basics' WHERE field_name = 'officeSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 3, section_name = 'Building Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 4, section_name = 'Building Basics' WHERE field_name = 'floorCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 5, section_name = 'Building Basics' WHERE field_name = 'buildingAge' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'occupancyRate' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'lightingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 23, section_name = 'Building Systems' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'office');

-- ============================================================================
-- RESIDENTIAL (24 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Home Basics' WHERE field_name = 'homeType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 2, section_name = 'Home Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 3, section_name = 'Home Basics' WHERE field_name = 'bedrooms' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 11, section_name = 'Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 12, section_name = 'Systems' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 13, section_name = 'Systems' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 21, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 22, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 23, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 24, section_name = 'Energy & Power' WHERE field_name = 'gridCapacityKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 25, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 31, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 32, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 33, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 34, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 41, section_name = 'Goals' WHERE field_name = 'gridSavingsGoal' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');
UPDATE custom_questions SET display_order = 42, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'residential');

-- ============================================================================
-- RETAIL (28 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Store Basics' WHERE field_name = 'retailType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 2, section_name = 'Store Basics' WHERE field_name = 'retailSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 3, section_name = 'Store Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 4, section_name = 'Store Basics' WHERE field_name = 'locationCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 5, section_name = 'Store Basics' WHERE field_name = 'buildingOwnership' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'refrigeration' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'lightingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'retail');

-- ============================================================================
-- SHOPPING-CENTER (31 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Property Basics' WHERE field_name = 'propertyType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 2, section_name = 'Property Basics' WHERE field_name = 'mallSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 3, section_name = 'Property Basics' WHERE field_name = 'glaSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 4, section_name = 'Property Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 5, section_name = 'Property Basics' WHERE field_name = 'tenantCount' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 6, section_name = 'Property Basics' WHERE field_name = 'anchorTypes' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'parkingSpaces' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'lightingType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'shopping-center');

-- ============================================================================
-- WAREHOUSE (30 questions)
-- ============================================================================
UPDATE custom_questions SET display_order = 1, section_name = 'Facility Basics' WHERE field_name = 'warehouseType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 2, section_name = 'Facility Basics' WHERE field_name = 'warehouseSqFt' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 3, section_name = 'Facility Basics' WHERE field_name = 'squareFeet' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 4, section_name = 'Facility Basics' WHERE field_name = 'clearHeight' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 5, section_name = 'Facility Basics' WHERE field_name = 'dockDoors' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 11, section_name = 'Operations' WHERE field_name = 'shiftsPerDay' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 12, section_name = 'Operations' WHERE field_name = 'operatingHours' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 13, section_name = 'Operations' WHERE field_name = 'tempZones' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 14, section_name = 'Operations' WHERE field_name = 'automationLevel' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 15, section_name = 'Operations' WHERE field_name = 'mheEquipment' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 16, section_name = 'Operations' WHERE field_name = 'fleetSize' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 21, section_name = 'Building Systems' WHERE field_name = 'hvacType' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 22, section_name = 'Building Systems' WHERE field_name = 'equipmentTier' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 31, section_name = 'Energy & Power' WHERE field_name = 'monthlyElectricBill' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 32, section_name = 'Energy & Power' WHERE field_name = 'monthlyEnergyCost' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 33, section_name = 'Energy & Power' WHERE field_name = 'peakDemand' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 34, section_name = 'Energy & Power' WHERE field_name = 'gridCapacity' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 35, section_name = 'Energy & Power' WHERE field_name = 'needsBackupPower' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 41, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingSolar' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 42, section_name = 'Existing Infrastructure' WHERE field_name = 'existingSolarKW' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 43, section_name = 'Existing Infrastructure' WHERE field_name = 'hasExistingEV' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 44, section_name = 'Existing Infrastructure' WHERE field_name = 'existingEVChargers' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 45, section_name = 'Existing Infrastructure' WHERE field_name = 'existingInfrastructure' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 51, section_name = 'Goals' WHERE field_name = 'sustainabilityGoals' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');
UPDATE custom_questions SET display_order = 52, section_name = 'Goals' WHERE field_name = 'primaryBESSApplication' AND use_case_id = (SELECT id FROM use_cases WHERE slug = 'warehouse');

-- ============================================================================
-- FINAL VERIFICATION: Check all 23 industries
-- ============================================================================
SELECT 
    uc.slug,
    COUNT(*) as total_questions,
    COUNT(DISTINCT cq.display_order) as unique_orders,
    CASE WHEN COUNT(*) = COUNT(DISTINCT cq.display_order) THEN '✅ OK' ELSE '⚠️ DUPLICATES' END as status
FROM custom_questions cq
JOIN use_cases uc ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.slug
ORDER BY uc.slug;
