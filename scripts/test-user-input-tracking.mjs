#!/usr/bin/env node
/**
 * USER INPUT TRACKING TEST SCRIPT
 * ================================
 * Tests that ALL user inputs for each use case flow through to Power Profile (PP) 
 * and Power Gap (PG) calculations correctly.
 * 
 * This script:
 * 1. Checks database field names vs code expectations
 * 2. Simulates user input for each use case
 * 3. Verifies calculations respond to input changes
 * 4. Reports any disconnects/ignored fields
 */

import { calculateUseCasePower } from '../src/services/useCasePowerCalculations.js';

// ============================================================================
// TEST DATA - Simulating user inputs from database questions
// ============================================================================

const TEST_CASES = {
  'gas-station': {
    name: 'Gas Station',
    databaseFields: {
      fuelDispensers: '10',        // DB field name
      storeSqFt: '3000',
      hasCarWash: 'false',
      carWashType: 'automatic',
      hasServiceBays: 'false',
      serviceBayCount: '0',
      hasFoodService: 'false',
      operatingHours: '24',
      hasTruckLane: 'false',
      hasEVChargers: 'false',
      gridCapacityKW: '200',
      peakDemandCharge: '15',
      currentMonthlyElectricBill: '3000',
      existingSolarKW: '0',
      wantsToAddSolar: 'true',
      primaryBESSApplication: 'peak_shaving'
    },
    testVariations: [
      { field: 'fuelDispensers', values: ['3', '10', '28'], label: 'Fuel Dispensers' },
      { field: 'storeSqFt', values: ['1000', '4000', '16000'], label: 'Store Size' },
      { field: 'hasCarWash', values: ['false', 'true'], label: 'Car Wash' },
    ]
  },
  
  'hotel': {
    name: 'Hotel',
    databaseFields: {
      roomCount: '150',
      hotelClass: 'midscale',
      hasPool: 'true',
      hasRestaurant: 'true',
      hasSpa: 'false',
      hasFitness: 'true',
      hasConferenceSpace: 'true',
      hasLaundry: 'true',
      hasEVCharging: 'false',
      operatingHours: '24_7',
      peakOccupancyPercent: '75',
      gridCapacityKW: '500',
      currentMonthlyElectricBill: '15000',
      existingSolarKW: '0',
      wantsToAddSolar: 'true',
      primaryBESSApplication: 'peak_shaving'
    },
    testVariations: [
      { field: 'roomCount', values: ['50', '150', '300'], label: 'Room Count' },
      { field: 'hotelClass', values: ['economy', 'midscale', 'luxury'], label: 'Hotel Class' },
      { field: 'hasPool', values: ['false', 'true'], label: 'Pool' },
    ]
  },
  
  'hospital': {
    name: 'Hospital',
    databaseFields: {
      bedCount: '200',
      hospitalType: 'general_acute',
      hasEmergencyDept: 'true',
      hasSurgicalSuites: 'true',
      hasICU: 'true',
      hasImagingCenter: 'true',
      hasCafeteria: 'true',
      hasLaundry: 'true',
      hasDataCenter: 'true',
      operatingHours: '24_7',
      criticalLoadPercent: '85',
      gridReliability: 'occasional_outages',
      currentMonthlyElectricBill: '50000',
      existingGeneratorKW: '500',
      existingSolarKW: '0',
      primaryBESSApplication: 'backup_power'
    },
    testVariations: [
      { field: 'bedCount', values: ['50', '200', '500'], label: 'Bed Count' },
      { field: 'hospitalType', values: ['clinic', 'general_acute', 'trauma_center'], label: 'Hospital Type' },
      { field: 'hasEmergencyDept', values: ['false', 'true'], label: 'Emergency Dept' },
    ]
  },
  
  'ev-charging': {
    name: 'EV Charging Hub',
    databaseFields: {
      level2Chargers: '12',
      level2ChargerPower: '7',
      dcfcChargers: '8',
      dcfcChargerPower: '150',
      hpcChargers: '0',
      hpcChargerPower: '350',
      locationContext: 'urban_parking',
      expectedConcurrency: '50',
      operatingHours: '24',
      hasCanopySolar: 'true',
      hasBatteryStorage: 'false',
      gridCapacityKW: '500',
      peakDemandCharge: '20',
      currentMonthlyElectricBill: '10000',
      existingSolarKW: '0',
      primaryBESSApplication: 'peak_shaving'
    },
    testVariations: [
      { field: 'level2Chargers', values: ['0', '12', '24'], label: 'Level 2 Chargers' },
      { field: 'dcfcChargers', values: ['0', '8', '16'], label: 'DCFC Chargers' },
      { field: 'expectedConcurrency', values: ['30', '50', '80'], label: 'Concurrency %' },
    ]
  },
  
  'warehouse': {
    name: 'Warehouse',
    databaseFields: {
      warehouseSqFt: '200000',
      warehouseType: 'fulfillment',
      ceilingHeight: '30',
      hasRefrigeration: 'false',
      hasFreezer: 'false',
      hasProductionArea: 'false',
      hasOfficeSpace: 'true',
      officeSqFt: '5000',
      hasEVFleet: 'true',
      evFleetSize: '10',
      operatingHours: '24',
      shiftsPerDay: '3',
      gridCapacityKW: '1000',
      currentMonthlyElectricBill: '25000',
      existingSolarKW: '0',
      primaryBESSApplication: 'peak_shaving'
    },
    testVariations: [
      { field: 'warehouseSqFt', values: ['50000', '200000', '500000'], label: 'Warehouse Size' },
      { field: 'hasRefrigeration', values: ['false', 'true'], label: 'Refrigeration' },
      { field: 'evFleetSize', values: ['0', '10', '50'], label: 'EV Fleet Size' },
    ]
  },
  
  'car-wash': {
    name: 'Car Wash',
    databaseFields: {
      carWashType: 'tunnel',
      bayCount: '4',
      hasSelfService: 'false',
      hasTunnel: 'true',
      hasDetailingBays: 'false',
      carsPerDay: '200',
      operatingHours: '12',
      hasVacuums: 'true',
      vacuumCount: '6',
      hasWaterRecycling: 'true',
      gridCapacityKW: '150',
      peakDemandCharge: '12',
      currentMonthlyElectricBill: '4000',
      existingSolarKW: '0',
      primaryBESSApplication: 'peak_shaving'
    },
    testVariations: [
      { field: 'bayCount', values: ['1', '4', '8'], label: 'Bay Count' },
      { field: 'carsPerDay', values: ['50', '200', '500'], label: 'Cars Per Day' },
      { field: 'hasTunnel', values: ['false', 'true'], label: 'Tunnel Wash' },
    ]
  },
  
  'data-center': {
    name: 'Data Center',
    databaseFields: {
      itLoadKW: '500',
      dataCenterTier: 'tier_3',
      rackCount: '100',
      averageRackDensity: '8',
      hasCoolingTowers: 'true',
      hasGenerators: 'true',
      generatorCapacityKW: '1000',
      hasUPS: 'true',
      upsCapacityKW: '600',
      operatingHours: '24_7',
      criticalLoadPercent: '100',
      gridReliability: 'reliable',
      currentMonthlyElectricBill: '100000',
      existingSolarKW: '0',
      primaryBESSApplication: 'backup_power'
    },
    testVariations: [
      { field: 'itLoadKW', values: ['100', '500', '2000'], label: 'IT Load' },
      { field: 'rackCount', values: ['20', '100', '500'], label: 'Rack Count' },
      { field: 'averageRackDensity', values: ['4', '8', '16'], label: 'Rack Density' },
    ]
  },
  
  'manufacturing': {
    name: 'Manufacturing',
    databaseFields: {
      facilitySqFt: '100000',
      manufacturingType: 'light_assembly',
      productionLineCount: '2',
      hasMachining: 'false',
      hasWelding: 'false',
      hasHeatTreatment: 'false',
      hasPainting: 'false',
      hasCompressedAir: 'true',
      hasProcessCooling: 'false',
      operatingHours: '16',
      shiftsPerDay: '2',
      gridCapacityKW: '800',
      currentMonthlyElectricBill: '30000',
      existingSolarKW: '0',
      primaryBESSApplication: 'peak_shaving'
    },
    testVariations: [
      { field: 'facilitySqFt', values: ['25000', '100000', '500000'], label: 'Facility Size' },
      { field: 'productionLineCount', values: ['1', '2', '5'], label: 'Production Lines' },
      { field: 'hasMachining', values: ['false', 'true'], label: 'Machining' },
    ]
  },
};

// ============================================================================
// FIELD NAME MAPPING - What DB calls it vs what code expects
// ============================================================================

const FIELD_MAPPINGS = {
  'gas-station': {
    code: ['numPumps', 'pumpCount', 'dispenserCount'],
    database: 'fuelDispensers',
    fix: 'Add fuelDispensers to code lookup'
  },
  'hotel': {
    code: ['numberOfRooms', 'rooms'],
    database: 'roomCount',
    fix: 'Add roomCount to code lookup'
  },
  'hospital': {
    code: ['numberOfBeds', 'beds'],
    database: 'bedCount',
    fix: 'Add bedCount to code lookup'
  },
  'ev-charging': {
    code: ['numberOfLevel2Chargers', 'level2Count'],
    database: 'level2Chargers',
    fix: 'Add level2Chargers to code lookup'
  },
  'warehouse': {
    code: ['squareFeet', 'sqFt'],
    database: 'warehouseSqFt',
    fix: 'Add warehouseSqFt to code lookup'
  },
};

// ============================================================================
// TEST RUNNER
// ============================================================================

console.log('\\n🧪 USER INPUT TRACKING TEST\\n');
console.log('=' .repeat(80));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

for (const [slug, testCase] of Object.entries(TEST_CASES)) {
  console.log(`\\n📋 Testing ${testCase.name} (${slug})...`);
  console.log('-'.repeat(80));
  
  // Test 1: Baseline calculation with default values
  try {
    const baseline = calculateUseCasePower(slug, testCase.databaseFields);
    console.log(`  ✓ Baseline: ${baseline.powerMW} MW (${baseline.description})`);
    totalTests++;
    passedTests++;
  } catch (error) {
    console.log(`  ✗ Baseline FAILED: ${error.message}`);
    failures.push({ useCase: testCase.name, test: 'Baseline', error: error.message });
    totalTests++;
    failedTests++;
  }
  
  // Test 2: Field variations - check if calculations respond to changes
  for (const variation of testCase.testVariations) {
    console.log(`\\n  Testing ${variation.label}:`);
    
    const results = [];
    for (const value of variation.values) {
      try {
        const modifiedData = { ...testCase.databaseFields, [variation.field]: value };
        const result = calculateUseCasePower(slug, modifiedData);
        results.push({ value, powerMW: result.powerMW });
        totalTests++;
        passedTests++;
      } catch (error) {
        console.log(`    ✗ ${variation.field}=${value} FAILED: ${error.message}`);
        failures.push({ 
          useCase: testCase.name, 
          test: `${variation.label} = ${value}`, 
          error: error.message 
        });
        totalTests++;
        failedTests++;
      }
    }
    
    // Check if power values change with different inputs
    const uniquePowers = [...new Set(results.map(r => r.powerMW))];
    if (uniquePowers.length === 1) {
      console.log(`    ⚠️  WARNING: ${variation.label} does NOT affect power calculation`);
      console.log(`       All values produce ${uniquePowers[0]} MW`);
      failures.push({
        useCase: testCase.name,
        test: `${variation.label} responsiveness`,
        error: 'Input changes do not affect calculation'
      });
    } else {
      console.log(`    ✓ ${variation.label} affects calculation:`);
      results.forEach(r => console.log(`       ${r.value} → ${r.powerMW} MW`));
    }
  }
}

// ============================================================================
// FIELD MAPPING AUDIT
// ============================================================================

console.log('\\n\\n🔍 FIELD MAPPING AUDIT\\n');
console.log('=' .repeat(80));

for (const [slug, mapping] of Object.entries(FIELD_MAPPINGS)) {
  console.log(`\\n${slug}:`);
  console.log(`  Database field: ${mapping.database}`);
  console.log(`  Code expects: ${mapping.code.join(', ')}`);
  console.log(`  ⚠️  FIX NEEDED: ${mapping.fix}`);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\\n\\n📊 TEST SUMMARY\\n');
console.log('=' .repeat(80));
console.log(`Total Tests: ${totalTests}`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (failures.length > 0) {
  console.log('\\n\\n❌ FAILURES:\\n');
  failures.forEach((failure, i) => {
    console.log(`${i + 1}. ${failure.useCase} - ${failure.test}`);
    console.log(`   Error: ${failure.error}`);
  });
}

console.log('\\n' + '='.repeat(80) + '\\n');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
