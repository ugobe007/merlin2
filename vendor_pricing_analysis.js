/**
 * NEW VENDOR PRICING ANALYSIS
 * Dynapower MPS-125 & Sinexcel Systems + Great Power Quote
 */

console.log('='.repeat(80));
console.log('NEW VENDOR PRICING ANALYSIS');
console.log('='.repeat(80));

// DYNAPOWER MPS-125 SYSTEMS ANALYSIS
console.log('\n1. DYNAPOWER MPS-125 CABINET SYSTEMS:');
console.log('='.repeat(50));

const dynapowerSystems = [
  { model: 'DYN-MPS-125-1', kW: 125, kWh: 418, duration: 3.3, cost: 220000, notes: 'UL9540/9540A certified, air-cooled, grid-forming' },
  { model: 'DYN-MPS-125-2', kW: 250, kWh: 836, duration: 3.3, cost: 400000, notes: 'Parallel integrated pair' },
  { model: 'DYN-MPS-125-3', kW: 375, kWh: 1254, duration: 3.3, cost: 565000, notes: 'ComAp IN5500 hybrid controller' },
  { model: 'DYN-MPS-125-4', kW: 500, kWh: 1672, duration: 3.3, cost: 730000, notes: 'Base reference for 500 kW / 1.6 MWh class' },
  { model: 'DYN-MPS-125-5', kW: 625, kWh: 2090, duration: 3.3, cost: 895000, notes: 'Scalable hybrid' },
  { model: 'DYN-MPS-125-6', kW: 750, kWh: 2508, duration: 3.3, cost: 1050000, notes: '3 MW aggregate scalable' },
  { model: 'DYN-MPS-125-7', kW: 875, kWh: 2926, duration: 3.3, cost: 1210000, notes: 'Modular block system' },
  { model: 'DYN-MPS-125-8', kW: 1000, kWh: 3344, duration: 3.3, cost: 1360000, notes: 'Full 1 MW / 3.3 MWh package' }
];

dynapowerSystems.forEach(system => {
  const pricePerKWh = system.cost / system.kWh;
  const pricePerKW = system.cost / system.kW;
  console.log(`${system.model}: ${system.kW}kW/${system.kWh}kWh = $${pricePerKWh.toFixed(0)}/kWh | $${pricePerKW.toFixed(0)}/kW | $${(system.cost/1000).toFixed(0)}k total`);
});

// Calculate average Dynapower pricing
const avgDynapowerPerKWh = dynapowerSystems.reduce((sum, sys) => sum + (sys.cost / sys.kWh), 0) / dynapowerSystems.length;
console.log(`\nDynapower Average: $${avgDynapowerPerKWh.toFixed(0)}/kWh`);

// SINEXCEL SYSTEMS ANALYSIS
console.log('\n2. SINEXCEL CABINET SYSTEMS:');
console.log('='.repeat(50));

const sinexcelSystems = [
  { model: 'SXL-3M3', kW: 450, kWh: 1250, duration: 2.3, cost: 585000, notes: 'UL9540 certified, 480–690 V' },
  { model: 'SXL-4M4', kW: 600, kWh: 1670, duration: 2.4, cost: 710000, notes: 'ComAp IN5500 hybrid control' },
  { model: 'SXL-5M5', kW: 750, kWh: 2090, duration: 2.5, cost: 830000, notes: 'Off-grid capable' },
  { model: 'SXL-6M6', kW: 900, kWh: 2500, duration: 2.6, cost: 955000, notes: 'Advanced EMS (IN6000)' },
  { model: 'SXL-7M7', kW: 1050, kWh: 2920, duration: 2.6, cost: 1075000, notes: 'Scalable microgrid' },
  { model: 'SXL-8M8', kW: 1200, kWh: 3340, duration: 2.7, cost: 1200000, notes: 'Top-tier voltage flexibility' }
];

sinexcelSystems.forEach(system => {
  const pricePerKWh = system.cost / system.kWh;
  const pricePerKW = system.cost / system.kW;
  console.log(`${system.model}: ${system.kW}kW/${system.kWh}kWh = $${pricePerKWh.toFixed(0)}/kWh | $${pricePerKW.toFixed(0)}/kW | $${(system.cost/1000).toFixed(0)}k total`);
});

// Calculate average Sinexcel pricing
const avgSinexcelPerKWh = sinexcelSystems.reduce((sum, sys) => sum + (sys.cost / sys.kWh), 0) / sinexcelSystems.length;
console.log(`\nSinexcel Average: $${avgSinexcelPerKWh.toFixed(0)}/kWh`);

// GREAT POWER LARGE SCALE QUOTE ANALYSIS
console.log('\n3. GREAT POWER LARGE SCALE QUOTE (400MWh):');
console.log('='.repeat(50));

const greatPowerQuote = {
  batteries: {
    product: 'Great Power UltraMax 5000',
    totalCost: 30000000,
    totalKWh: 400000,
    pricePerKWh: 30000000 / 400000
  },
  inverters: {
    product: 'Sineng 5000 with 34.5kV transformers', 
    totalCost: 11600000,
    units: 40,
    pricePerUnit: 11600000 / 40
  },
  totalSystem: {
    cost: 41600000,
    capacity: 400000,
    pricePerKWh: 41600000 / 400000
  }
};

console.log(`Battery Systems: $${greatPowerQuote.batteries.pricePerKWh}/kWh (UltraMax 5000)`);
console.log(`Inverter Systems: $${(greatPowerQuote.inverters.pricePerUnit/1000).toFixed(0)}k per 5MW inverter skid`);
console.log(`Total System: $${greatPowerQuote.totalSystem.pricePerKWh}/kWh (400MWh utility-scale)`);

// COMPREHENSIVE PRICING ANALYSIS
console.log('\n4. COMPARATIVE PRICING ANALYSIS:');
console.log('='.repeat(50));

console.log('CABINET-SIZE SYSTEMS (< 1MW):');
const cabinetSystems = [...dynapowerSystems.filter(s => s.kW < 1000), ...sinexcelSystems.filter(s => s.kW < 1000)];
const avgCabinetPrice = cabinetSystems.reduce((sum, sys) => sum + (sys.cost / sys.kWh), 0) / cabinetSystems.length;
console.log(`Average Cabinet Price: $${avgCabinetPrice.toFixed(0)}/kWh`);
console.log(`Range: $${Math.min(...cabinetSystems.map(s => s.cost / s.kWh)).toFixed(0)} - $${Math.max(...cabinetSystems.map(s => s.cost / s.kWh)).toFixed(0)}/kWh`);

console.log('\nMID-SIZE SYSTEMS (1-5MW):');
const midSizeSystems = [...dynapowerSystems.filter(s => s.kW >= 1000), ...sinexcelSystems.filter(s => s.kW >= 1000)];
if (midSizeSystems.length > 0) {
  const avgMidSizePrice = midSizeSystems.reduce((sum, sys) => sum + (sys.cost / sys.kWh), 0) / midSizeSystems.length;
  console.log(`Average Mid-Size Price: $${avgMidSizePrice.toFixed(0)}/kWh`);
  console.log(`Range: $${Math.min(...midSizeSystems.map(s => s.cost / s.kWh)).toFixed(0)} - $${Math.max(...midSizeSystems.map(s => s.cost / s.kWh)).toFixed(0)}/kWh`);
}

console.log('\nUTILITY-SCALE SYSTEMS (100+MWh):');
console.log(`Great Power UltraMax: $${greatPowerQuote.batteries.pricePerKWh}/kWh (battery-only)`);
console.log(`Complete System: $${greatPowerQuote.totalSystem.pricePerKWh}/kWh (with inverters)`);

// RECOMMENDATIONS FOR PRICING UPDATE
console.log('\n5. RECOMMENDED PRICING UPDATES:');
console.log('='.repeat(50));

console.log('CURRENT SYSTEM vs NEW MARKET DATA:');
console.log(`Cabinet Size (<1MW): Current $155/kWh → Market Average $${avgCabinetPrice.toFixed(0)}/kWh`);
console.log(`Mid Size (1-3MW): Current $135/kWh → Consider updating based on 1MW+ data`);
console.log(`Container (3+MW): Current $125/kWh → Great Power shows $75-104/kWh for utility scale`);

console.log('\nKEY INSIGHTS:');
console.log('• Dynapower: Premium cabinet systems, UL certified, grid-forming capability');
console.log('• Sinexcel: Competitive cabinet pricing, advanced EMS options');
console.log('• Great Power: Ultra-competitive utility-scale pricing');
console.log('• Cabinet systems: Higher $/kWh due to integration & certification');
console.log('• Utility-scale: Significantly lower $/kWh due to economies of scale');

console.log('\n✅ ANALYSIS COMPLETE - Ready for pricing system integration');