#!/usr/bin/env node
/**
 * COMPREHENSIVE FIELD AUDIT - Compares DB fields vs WizardV6 power calculations
 * 
 * This script identifies:
 * 1. DB fields that exist but code DOES NOT read (missing from power calculations)
 * 2. Fields code expects but are NOT in DB (will cause undefined values)
 * 
 * TrueQuote™ Compliance: Every field must be properly read and used
 */

import { createClient } from '@supabase/supabase-js';

const url = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0';

const supabase = createClient(url, key);

// ==============================================================================
// WHAT WizardV6 ACTUALLY READS (extracted from estimatedPowerMetrics ~line 266-1400)
// ==============================================================================
const CODE_READS = {
  'hotel': [
    'roomCount', 'hotelCategory', 'floorCount', 'elevatorCount', 'efficientElevators',
    'poolType', 'hvacType', 'equipmentTier', 'operatingHours', 'exteriorLoads',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'hospital': [
    'bedCount', 'icuBeds', 'operatingRooms', 'buildingCount', 'imagingEquipment',
    'hvacType', 'equipmentTier', 'operatingHours', 'totalSqFt',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'data-center': [
    'itLoadKW', 'rackCount', 'currentPUE', 'tierLevel', 'dcType', 'freeCooling',
    'aisleContainment', 'whitespaceSquareFeet', 'squareFeet', 'generatorCapacity',
    'workloadTypes', 'powerInfrastructure', 'upsConfig', 'hvacType', 'equipmentTier',
    'operatingHours', 'needsBackupPower',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'car-wash': [
    'bayCount', 'facilityType', 'operatingModel', 'blowerType', 'waterHeaterType',
    'conveyorMotorType', 'equipmentTier', 'operatingHours', 'hasNaturalGas',
    'evL2Count', 'evDcfcCount',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'ev-charging': [
    'level2Count', 'level2', 'dcfc50Count', 'dcfcHighCount', 'dcFastCount',
    'ultraFastCount', 'dcfc350', 'megawattCount', 'mcsChargers',
    'hubType', 'serviceVoltage', 'gridCapacity', 'gridCapacityKW', 'operatingHours',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'manufacturing': [
    'manufacturingSqFt', 'facilitySqFt', 'manufacturingType', 'shiftsPerDay',
    'operatingHours', 'hvacType', 'equipmentTier', 'majorEquipment', 'powerFactor', 'evFleet',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'warehouse': [
    'warehouseSqFt', 'facilitySqFt', 'warehouseType', 'shiftsPerDay', 'automationLevel',
    'mheEquipment', 'fleetSize', 'hvacType', 'equipmentTier', 'lightingType', 'operatingHours',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'office': [
    'officeSqFt', 'totalSqFt', 'buildingSqFt', 'buildingClass', 'floorCount', 'elevatorCount',
    'operatingHours', 'lightingType', 'hvacType', 'equipmentTier', 'tenantTypes',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'retail': [
    'retailSqFt', 'storeSqFt', 'mallSqFt', 'glaSqFt', 'totalSqFt', 'retailType',
    'specialEquipment', 'refrigeration', 'operatingHours', 'parkingType', 'lightingType',
    'hvacType', 'equipmentTier', 'locationCount',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'shopping-center': [
    // Same as retail - treated same in code via includes('retail') || includes('shopping')
    'retailSqFt', 'storeSqFt', 'mallSqFt', 'glaSqFt', 'totalSqFt', 'retailType',
    'specialEquipment', 'refrigeration', 'operatingHours', 'parkingType', 'lightingType',
    'hvacType', 'equipmentTier', 'locationCount',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'college': [
    'studentPopulation', 'studentEnrollment', 'studentCount', 'totalSqFt', 'institutionType',
    'buildingCount', 'hvacAge', 'facilityTypes', 'evInfrastructure', 'operatingHours',
    'hvacType', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'airport': [
    'annualPassengers', 'terminalSqFt', 'gateCount', 'airportType', 'terminalCount',
    'publicEvChargers', 'operatingHours', 'hvacType', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'casino': [
    'gamingFloorSqFt', 'gamingFloorSize', 'totalSqFt', 'hotelRooms', 'slotMachines',
    'casinoType', 'operatingHours', 'parkingType', 'hvacType', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'restaurant': [
    'squareFootage', 'seatCount', 'restaurantType', 'operatingHours', 'hvacType',
    'hasOutdoorSeating', 'hasBarService', 'dishwasherType', 'kitchenEquipment',
    'primaryCookingEquipment', 'hasKitchenHood', 'hasCommercialKitchenHood',
    'hasWalkInFreezer', 'hasWalkInRefrigeration', 'hasWalkInCooler', 'refrigerationCount',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'apartment': [
    'totalUnits', 'homeSqFt', 'avgUnitSize', 'buildingCount', 'propertyType',
    'waterHeating', 'hvacType', 'elevatorCount', 'inUnitLaundry', 'communityAmenities',
    'evChargingInterest', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'residential': [
    // Same as apartment in code (industry.includes('apartment') || industry.includes('residential'))
    'totalUnits', 'homeSqFt', 'avgUnitSize', 'buildingCount', 'propertyType',
    'waterHeating', 'hvacType', 'elevatorCount', 'inUnitLaundry', 'communityAmenities',
    'evChargingInterest', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'cold-storage': [
    'refrigeratedSqFt', 'totalSqFt', 'palletCapacity', 'facilityType', 'productTypes',
    'refrigerationSystem', 'operatingHours', 'hvacType', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'gas-station': [
    'dispenserCount', 'storeSqFt', 'stationType', 'fuelTypes', 'refrigeration',
    'lightingType', 'operatingHours', 'hvacType', 'equipmentTier', 'existingEvCharging',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'government': [
    'totalSqFt', 'governmentSqFt', 'facilitySqFt', 'buildingCount', 'facilityType',
    'governmentLevel', 'fleetSize', 'operatingHours', 'lightingType', 'hvacType', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'indoor-farm': [
    'growingAreaSqFt', 'growingLevels', 'lightingLoadPercent', 'farmType', 'cropTypes',
    'automationLevel', 'lightingType', 'operatingSchedule', 'hvacType', 'equipmentTier',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'agricultural': [
    'totalAcres', 'irrigationType', 'farmType', 'majorEquipment', 'operatingHours',
    'equipmentTier', 'needsBackupPower',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
  'heavy_duty_truck_stop': [
    'peakDemandKW', 'mcsChargers', 'dcfc350', 'dcFastChargers', 'level2',
    'truckWashBays', 'serviceBays', 'hasShowers', 'hasLaundry', 'operatingHours',
    'existingSolarKW',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'hasExistingEV', 'existingEVChargers'
  ],
  'microgrid': [
    'sitePeakLoad', 'existingCapacity', 'criticalLoadPercent', 'connectedBuildings',
    'microgridScale', 'microgridApplication', 'primaryDriver', 'islandDuration',
    'plannedSolar', 'plannedStorage', 'existingStorage', 'squareFeet', 'criticalLoads',
    'hvacType', 'equipmentTier', 'operatingHours',
    // getExistingLoadAdjustment
    'hasExistingSolar', 'existingSolarKW', 'hasExistingEV', 'existingEVChargers'
  ],
};

async function run() {
  console.log('='.repeat(80));
  console.log('TRUEQUOTE™ FIELD COVERAGE AUDIT');
  console.log('='.repeat(80));
  console.log('');
  
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true);
  
  if (!useCases) {
    console.log('No use cases found');
    return;
  }
  
  const results = [];
  
  for (const uc of useCases.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('field_name')
      .eq('use_case_id', uc.id);
    
    const dbFields = new Set((questions || []).map(q => q.field_name));
    const codeReads = new Set(CODE_READS[uc.slug] || []);
    
    // Fields in DB but code doesn't read
    const missingFromCode = [...dbFields].filter(f => !codeReads.has(f));
    
    // Fields code expects but not in DB
    const missingFromDB = [...codeReads].filter(f => !dbFields.has(f));
    
    // Fields properly matched
    const matched = [...dbFields].filter(f => codeReads.has(f));
    
    const coverage = dbFields.size > 0 
      ? Math.round((matched.length / dbFields.size) * 100)
      : 0;
    
    results.push({
      slug: uc.slug,
      name: uc.name,
      dbCount: dbFields.size,
      codeCount: codeReads.size,
      matchedCount: matched.length,
      coverage,
      missingFromCode,
      missingFromDB,
    });
  }
  
  // Sort by coverage (ascending - worst first)
  results.sort((a, b) => a.coverage - b.coverage);
  
  console.log('');
  console.log('COVERAGE SUMMARY (sorted by worst coverage):');
  console.log('-'.repeat(80));
  console.log('');
  
  for (const r of results) {
    const emoji = r.coverage >= 90 ? '✅' : r.coverage >= 70 ? '⚠️' : '❌';
    console.log(`${emoji} ${r.slug.padEnd(25)} ${r.coverage}% coverage (${r.matchedCount}/${r.dbCount} DB fields)`);
    
    if (r.missingFromCode.length > 0) {
      console.log(`   ❌ DB fields NOT READ by code: ${r.missingFromCode.slice(0, 8).join(', ')}${r.missingFromCode.length > 8 ? '...' : ''}`);
    }
    if (r.missingFromDB.length > 0) {
      console.log(`   ⚠️ Code expects but NOT in DB: ${r.missingFromDB.join(', ')}`);
    }
    console.log('');
  }
  
  // Summary stats
  const avgCoverage = Math.round(results.reduce((sum, r) => sum + r.coverage, 0) / results.length);
  const below70 = results.filter(r => r.coverage < 70).length;
  const below90 = results.filter(r => r.coverage < 90 && r.coverage >= 70).length;
  const above90 = results.filter(r => r.coverage >= 90).length;
  
  console.log('');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Average Coverage: ${avgCoverage}%`);
  console.log(`❌ Below 70% (CRITICAL): ${below70} industries`);
  console.log(`⚠️ 70-89% (NEEDS WORK): ${below90} industries`);
  console.log(`✅ 90%+ (GOOD): ${above90} industries`);
  console.log('');
  
  // Detailed missing fields report
  console.log('');
  console.log('='.repeat(80));
  console.log('CRITICAL: DB FIELDS NOT BEING READ (by industry)');
  console.log('='.repeat(80));
  console.log('');
  
  for (const r of results.filter(r => r.missingFromCode.length > 0)) {
    console.log(`\n### ${r.slug} (${r.missingFromCode.length} fields missing) ###`);
    r.missingFromCode.forEach(f => console.log(`  - ${f}`));
  }
  
  // Energy-relevant fields that are likely important
  console.log('');
  console.log('='.repeat(80));
  console.log('HIGH-PRIORITY MISSING FIELDS (likely affect power calculation)');
  console.log('='.repeat(80));
  console.log('');
  
  const energyRelevant = ['sqFt', 'kW', 'capacity', 'count', 'charger', 'charging', 'load', 'demand', 'equipment', 'hvac', 'lighting'];
  
  for (const r of results) {
    const important = r.missingFromCode.filter(f => 
      energyRelevant.some(keyword => f.toLowerCase().includes(keyword))
    );
    if (important.length > 0) {
      console.log(`${r.slug}: ${important.join(', ')}`);
    }
  }
}

run().catch(console.error);
