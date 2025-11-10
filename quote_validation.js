// Quick validation test of the user's quote against our corrected pricing system

// Since this is a CommonJS environment, we'll simulate the calculations
console.log('QUOTE VALIDATION ANALYSIS');
console.log('Based on NREL ATB 2024 and market data integration');
console.log('='.repeat(50));

// User's project specifications
const projectSpec = {
  storageSizeMW: 6.2,
  durationHours: 2, // 12.4MWh / 6.2MW = 2 hours
  solarMW: 0,
  windMW: 0, 
  generatorMW: 0,
  industryData: {
    selectedIndustry: 'ev-charging',
    useCaseData: {
      level2Chargers: 25,
      level2Power: 11, // kW each
      dcFastChargers: 100,
      dcFastPower: 150 // kW each
    }
  },
  gridConnection: 'on-grid',
  location: 'California'
};

console.log('=== QUOTE VALIDATION ANALYSIS ===');
console.log(`Project: ${projectSpec.storageSizeMW}MW / ${projectSpec.storageSizeMW * 2}MWh BESS + EV Charging`);
console.log(`Location: ${projectSpec.location}`);
console.log('');

// Calculate with our corrected pricing system
const equipmentBreakdown = calculateEquipmentBreakdown(
  projectSpec.storageSizeMW,
  2, // duration hours
  0, // solarMW
  0, // windMW
  0, // generatorMW
  projectSpec.industryData,
  'on-grid',
  projectSpec.location
);

console.log('=== USER\'S QUOTE vs OUR CALCULATIONS ===');

// BESS System Comparison
console.log('1. BESS SYSTEM:');
console.log(`   User Quote: $7.85M`);
console.log(`   Our Calc:   $${(equipmentBreakdown.batteries.totalCost / 1000000).toFixed(2)}M`);
console.log(`   Difference: ${((7.85 - equipmentBreakdown.batteries.totalCost/1000000) / 7.85 * 100).toFixed(1)}%`);
console.log('');

// Power Conversion Comparison
console.log('2. POWER CONVERSION:');
console.log(`   User Quote: $1.13M`);
console.log(`   Our Calc:   $${(equipmentBreakdown.inverters.totalCost / 1000000).toFixed(2)}M`);
console.log(`   Difference: ${((1.13 - equipmentBreakdown.inverters.totalCost/1000000) / 1.13 * 100).toFixed(1)}%`);
console.log('');

// MV Equipment Comparison  
console.log('3. MV EQUIPMENT:');
const mvEquipmentTotal = equipmentBreakdown.transformers.totalCost + equipmentBreakdown.switchgear.totalCost;
console.log(`   User Quote: $0.70M`);
console.log(`   Our Calc:   $${(mvEquipmentTotal / 1000000).toFixed(2)}M`);
console.log(`   Difference: ${((0.70 - mvEquipmentTotal/1000000) / 0.70 * 100).toFixed(1)}%`);
console.log('');

// EV Charging Infrastructure Comparison
console.log('4. EV CHARGING INFRASTRUCTURE:');
console.log(`   User Quote: $5.20M (25 Level 2 + 100 DC Fast)`);
if (equipmentBreakdown.evChargers) {
  console.log(`   Our Calc:   $${(equipmentBreakdown.evChargers.totalChargingCost / 1000000).toFixed(2)}M`);
  console.log(`   Difference: ${((5.20 - equipmentBreakdown.evChargers.totalChargingCost/1000000) / 5.20 * 100).toFixed(1)}%`);
  console.log(`   Level 2:    ${projectSpec.industryData.useCaseData.level2Chargers} x $${(equipmentBreakdown.evChargers.level2Chargers.unitCost/1000).toFixed(0)}k = $${(equipmentBreakdown.evChargers.level2Chargers.totalCost/1000000).toFixed(2)}M`);
  console.log(`   DC Fast:    ${projectSpec.industryData.useCaseData.dcFastChargers} x $${(equipmentBreakdown.evChargers.dcFastChargers.unitCost/1000).toFixed(0)}k = $${(equipmentBreakdown.evChargers.dcFastChargers.totalCost/1000000).toFixed(2)}M`);
} else {
  console.log(`   Our Calc:   ERROR - EV chargers not calculated`);
}
console.log('');

// Installation/BOP Comparison
console.log('5. BALANCE OF PLANT:');
console.log(`   User Quote: $4.76M`);
console.log(`   Our Calc:   $${(equipmentBreakdown.installation.totalInstallation / 1000000).toFixed(2)}M`);
console.log(`   Difference: ${((4.76 - equipmentBreakdown.installation.totalInstallation/1000000) / 4.76 * 100).toFixed(1)}%`);
console.log('');

// Total Equipment Cost
const ourTotalEquipment = equipmentBreakdown.totals.totalProjectCost;
console.log('6. TOTAL PROJECT COST:');
console.log(`   User Quote: $5.91M (seems low given component costs)`);
console.log(`   Our Calc:   $${(ourTotalEquipment / 1000000).toFixed(2)}M`);
console.log(`   Difference: ${((5.91 - ourTotalEquipment/1000000) / 5.91 * 100).toFixed(1)}%`);
console.log('');

console.log('=== ANALYSIS SUMMARY ===');

// Financial metrics validation
const annualSavings = 1709; // $1709k per year from user
const netCost = 4.14; // $4.14M after ITC
const payback = netCost * 1000 / annualSavings;

console.log(`Annual Savings: $${annualSavings}k/year`);
console.log(`Net Cost (after ITC): $${netCost}M`);
console.log(`Calculated Payback: ${payback.toFixed(1)} years`);
console.log(`User Stated Payback: 2.4 years`);
console.log(`Payback Verification: ${Math.abs(payback - 2.4) < 0.1 ? 'CORRECT' : 'INCORRECT'}`);
console.log('');

console.log('=== MAJOR ISSUES IDENTIFIED ===');
console.log('1. Total project cost inconsistency - component costs sum to more than total');
console.log('2. EV charging costs need validation against market rates');
console.log('3. BESS pricing should be verified against NREL ATB 2024 standards');
console.log('4. Balance of plant costs seem high relative to equipment costs');