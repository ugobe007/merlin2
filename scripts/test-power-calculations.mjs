#!/usr/bin/env node
/**
 * TEST: Verify power calculations for all industries
 * 
 * This script simulates the estimatedPowerMetrics useMemo from WizardV6.tsx
 * with sample inputs for each industry to verify power calculations work.
 * 
 * Run with: node scripts/test-power-calculations.mjs
 */

// =============================================================================
// SIMULATED POWER CALCULATION (matches WizardV6.tsx)
// =============================================================================

function calculatePower(industry, inputs) {
  let estimatedPeakKW = 0;

  if (industry.includes('hotel')) {
    const rooms = Number(inputs.roomCount || inputs.numberOfRooms || 150);
    const hotelClass = String(inputs.hotelCategory || inputs.hotelClass || 'midscale');
    const kWPerRoom = hotelClass.includes('luxury') ? 4 : hotelClass.includes('upscale') ? 3 : 2;
    estimatedPeakKW = rooms * kWPerRoom * 0.75;
  }
  else if (industry.includes('hospital')) {
    const beds = Number(inputs.bedCount || inputs.numberOfBeds || 200);
    const icuBeds = Number(inputs.icuBeds || 0);
    const operatingRooms = Number(inputs.operatingRooms || 0);
    estimatedPeakKW = (beds * 7.5 + icuBeds * 3 + operatingRooms * 50) * 0.85;
  }
  else if (industry.includes('data') && industry.includes('center')) {
    const itLoadKW = Number(inputs.itLoadKW || inputs.totalITLoad || 5000);
    const pue = Number(inputs.currentPUE || inputs.pue || 1.5);
    const rackCount = Number(inputs.rackCount || 0);
    const calculatedItLoad = itLoadKW > 0 ? itLoadKW : (rackCount * 5);
    estimatedPeakKW = calculatedItLoad * pue;
  }
  else if (industry.includes('car') && industry.includes('wash')) {
    const bays = Number(inputs.bayCount || inputs.numberOfBays || 4);
    const washType = String(inputs.facilityType || inputs.washType || 'automatic');
    const kWPerBay = washType.includes('tunnel') ? 80 : washType.includes('automatic') ? 50 : 30;
    estimatedPeakKW = bays * kWPerBay;
  }
  else if (industry.includes('ev') || industry.includes('charging')) {
    const l2 = Number(inputs.level2Count || inputs.level2Chargers || 12);
    const dcfc50 = Number(inputs.dcfc50Count || 0);
    const dcfcHigh = Number(inputs.dcfcHighCount || 0);
    const dcfc = Number(inputs.dcfcChargers || dcfc50 + dcfcHigh || 8);
    const ultraFast = Number(inputs.ultraFastCount || 0);
    const megawatt = Number(inputs.megawattCount || 0);
    const hpc = Number(inputs.hpcChargers || ultraFast || 0);
    estimatedPeakKW = (l2 * 7.2 + dcfc * 150 + hpc * 350 + megawatt * 1000) * 0.6;
  }
  else if (industry.includes('restaurant')) {
    const sqft = Number(inputs.squareFootage || 3000);
    const seats = Number(inputs.seatCount || 80);
    let basePeakKW = sqft * 0.05;
    
    const cookingEquipment = inputs.kitchenEquipment || inputs.primaryCookingEquipment;
    const equipmentArray = Array.isArray(cookingEquipment) 
      ? cookingEquipment 
      : typeof cookingEquipment === 'string' 
        ? cookingEquipment.split(',') 
        : [];
    
    const equipmentPower = {
      'gas_range': 15, 'electric_range': 25, 'fryers': 20,
      'flat_griddle': 15, 'pizza_oven': 30, 'convection_oven': 12,
      'commercial_oven': 20, 'grill': 15, 'steamer': 10,
    };
    
    equipmentArray.forEach(eq => {
      const key = eq.toLowerCase().replace(/[^a-z_]/g, '_');
      basePeakKW += equipmentPower[key] || 10;
    });
    
    if (inputs.hasKitchenHood) basePeakKW += 8;
    if (inputs.hasWalkInFreezer) basePeakKW += 6;
    if (inputs.hasWalkInCooler) basePeakKW += 4;
    
    const refrigCount = Number(inputs.refrigerationCount || 0);
    if (refrigCount > 0) basePeakKW += refrigCount * 3;
    
    const seatMultiplier = seats > 150 ? 1.3 : seats > 75 ? 1.1 : 1.0;
    estimatedPeakKW = basePeakKW * seatMultiplier * 0.8;
  }
  else if (industry.includes('cold') && industry.includes('storage')) {
    const sqft = Number(inputs.refrigeratedSqFt || inputs.totalSqFt || 50000);
    estimatedPeakKW = sqft * 0.04;
  }
  else if (industry.includes('gas') && industry.includes('station')) {
    const dispensers = Number(inputs.dispenserCount || 8);
    const storeSqFt = Number(inputs.storeSqFt || 2000);
    estimatedPeakKW = dispensers * 2 + storeSqFt * 0.02;
  }
  else if (industry.includes('indoor') && industry.includes('farm')) {
    const sqft = Number(inputs.growingAreaSqFt || 20000);
    const levels = Number(inputs.growingLevels || 1);
    const lightingPct = Number(inputs.lightingLoadPercent || 70) / 100;
    estimatedPeakKW = sqft * levels * 0.06 * (1 + lightingPct);
  }
  else if (industry.includes('truck') && industry.includes('stop')) {
    if (inputs.peakDemandKW) {
      estimatedPeakKW = Number(inputs.peakDemandKW);
    } else {
      const mcsChargers = Number(inputs.mcsChargers || 0);
      const l2Chargers = Number(inputs.level2 || 0);
      const truckWash = Number(inputs.truckWashBays || 0);
      const serviceBays = Number(inputs.serviceBays || 0);
      estimatedPeakKW = mcsChargers * 1000 + l2Chargers * 7.2 + truckWash * 100 + serviceBays * 20;
    }
  }
  else if (industry.includes('microgrid')) {
    const sitePeakLoad = Number(inputs.sitePeakLoad || 0);
    const existingCapacity = Number(inputs.existingCapacity || 0);
    estimatedPeakKW = sitePeakLoad > 0 ? sitePeakLoad : existingCapacity > 0 ? existingCapacity : 500;
  }
  else if (industry.includes('agricult')) {
    const acres = Number(inputs.totalAcres || 100);
    const hasIrrigation = inputs.irrigationType && inputs.irrigationType !== 'none';
    estimatedPeakKW = acres * (hasIrrigation ? 0.5 : 0.2);
  }
  else if (industry.includes('government')) {
    const sqft = Number(inputs.totalSqFt || inputs.governmentSqFt || 100000);
    estimatedPeakKW = sqft * 0.015;
  }
  else {
    estimatedPeakKW = 500; // Fallback
  }

  return Math.max(50, Math.round(estimatedPeakKW));
}

// =============================================================================
// TEST CASES
// =============================================================================

const testCases = [
  {
    name: 'Hotel - Luxury 200 rooms',
    industry: 'hotel',
    inputs: { roomCount: 200, hotelCategory: 'luxury' },
    expectedRange: [500, 700],
  },
  {
    name: 'Hospital - 300 beds, 10 ICU, 5 OR',
    industry: 'hospital',
    inputs: { bedCount: 300, icuBeds: 10, operatingRooms: 5 },
    expectedRange: [2000, 2500],
  },
  {
    name: 'Data Center - 2000 kW IT, PUE 1.4',
    industry: 'data-center',
    inputs: { itLoadKW: 2000, currentPUE: 1.4 },
    expectedRange: [2700, 2900],
  },
  {
    name: 'Car Wash - 6 bay tunnel',
    industry: 'car-wash',
    inputs: { bayCount: 6, facilityType: 'tunnel' },
    expectedRange: [450, 500],
  },
  {
    name: 'EV Charging - 20 L2, 10 DCFC, 2 MCS',
    industry: 'ev-charging',
    inputs: { level2Count: 20, dcfc50Count: 10, megawattCount: 2 },
    expectedRange: [2000, 2200],
  },
  {
    name: 'Restaurant - 5000 sqft, 120 seats, full kitchen',
    industry: 'restaurant',
    inputs: { 
      squareFootage: 5000, 
      seatCount: 120, 
      kitchenEquipment: ['electric_range', 'fryers', 'pizza_oven'],
      hasKitchenHood: true,
      hasWalkInFreezer: true,
    },
    expectedRange: [250, 350],
  },
  {
    name: 'Cold Storage - 80,000 sqft',
    industry: 'cold-storage',
    inputs: { refrigeratedSqFt: 80000 },
    expectedRange: [3000, 3500],
  },
  {
    name: 'Gas Station - 16 dispensers, 3000 sqft store',
    industry: 'gas-station',
    inputs: { dispenserCount: 16, storeSqFt: 3000 },
    expectedRange: [80, 120],
  },
  {
    name: 'Indoor Farm - 30,000 sqft, 3 levels',
    industry: 'indoor-farm',
    inputs: { growingAreaSqFt: 30000, growingLevels: 3, lightingLoadPercent: 70 },
    expectedRange: [8000, 10000],
  },
  {
    name: 'Truck Stop - 4 MCS, 10 L2, 2 wash bays',
    industry: 'heavy_duty_truck_stop',
    inputs: { mcsChargers: 4, level2: 10, truckWashBays: 2, serviceBays: 5 },
    expectedRange: [4300, 4500],
  },
  {
    name: 'Microgrid - 1500 kW site load',
    industry: 'microgrid',
    inputs: { sitePeakLoad: 1500 },
    expectedRange: [1400, 1600],
  },
  {
    name: 'Agricultural - 500 acres with irrigation',
    industry: 'agricultural',
    inputs: { totalAcres: 500, irrigationType: 'drip' },
    expectedRange: [200, 300],
  },
  {
    name: 'Government - 200,000 sqft',
    industry: 'government',
    inputs: { totalSqFt: 200000 },
    expectedRange: [2800, 3200],
  },
];

// =============================================================================
// RUN TESTS
// =============================================================================

console.log('═'.repeat(80));
console.log('🔌 POWER CALCULATION TESTS');
console.log('   Simulating WizardV6.tsx estimatedPowerMetrics useMemo');
console.log('═'.repeat(80));
console.log('');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = calculatePower(tc.industry, tc.inputs);
  const [min, max] = tc.expectedRange;
  const inRange = result >= min && result <= max;

  if (inRange) {
    console.log(`✅ ${tc.name}`);
    console.log(`   Result: ${result} kW (expected ${min}-${max} kW)`);
    passed++;
  } else {
    console.log(`❌ ${tc.name}`);
    console.log(`   Result: ${result} kW (expected ${min}-${max} kW)`);
    console.log(`   Inputs:`, tc.inputs);
    failed++;
  }
  console.log('');
}

console.log('─'.repeat(80));
console.log(`📊 RESULTS: ${passed}/${testCases.length} tests passed`);
if (failed > 0) {
  console.log(`⚠️  ${failed} tests failed - check calculations`);
  process.exit(1);
} else {
  console.log('✅ All power calculations working correctly!');
  process.exit(0);
}
