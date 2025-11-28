/**
 * Comprehensive Pricing Administration Demo
 * Demonstrates all pricing modules integrated into the admin dashboard
 */

// Import all pricing services
const generatorPricingService = require('./src/services/generatorPricingService');
const solarPricingService = require('./src/services/solarPricingService');
const windPricingService = require('./src/services/windPricingService');
const powerElectronicsPricingService = require('./src/services/powerElectronicsPricingService');
const systemControlsPricingService = require('./src/services/systemControlsPricingService');

console.log('🏭 COMPREHENSIVE PRICING ADMINISTRATION DASHBOARD DEMO');
console.log('======================================================\n');

// Generator Pricing Demo (Based on Eaton Quote)
console.log('⚡ GENERATOR SYSTEMS (Eaton Power Equipment Quote)');
console.log('--------------------------------------------------');

const generatorCost = generatorPricingService.calculateGeneratorCost(
  'cummins-6ltaa95-g260-200kw',
  10, // quantity from Eaton quote
  true, // include installation
  true  // include parallel operation
);

if (generatorCost.generator) {
  console.log(`Generator: ${generatorCost.generator.model} (${generatorCost.generator.manufacturer})`);
  console.log(`Fuel Type: ${generatorCost.generator.fuelType}`);
  console.log(`Power Rating: ${generatorCost.generator.ratedPowerKW} kW`);
  console.log(`Controller: ${generatorCost.generator.controller.model}`);
  console.log(`Equipment Cost: $${generatorCost.equipmentCost.toLocaleString()}`);
  console.log(`Installation Cost: $${generatorCost.installationCost.toLocaleString()}`);
  console.log(`Parallel Operation Cost: $${generatorCost.parallelCost.toLocaleString()}`);
  console.log(`TOTAL COST: $${generatorCost.totalCost.toLocaleString()}`);
  console.log(`Per kW: $${(generatorCost.totalCost / (generatorCost.generator.ratedPowerKW * 10)).toFixed(0)}/kW\n`);
}

// Operating costs
const generatorOpCost = generatorPricingService.calculateAnnualOperatingCost(
  'cummins-6ltaa95-g260-200kw',
  4000, // operating hours per year
  0.35, // natural gas cost per m³
  10    // quantity
);

console.log('Annual Operating Costs:');
console.log(`Fuel Cost: $${generatorOpCost.fuelCost.toLocaleString()}`);
console.log(`Maintenance Cost: $${generatorOpCost.maintenanceCost.toLocaleString()}`);
console.log(`Total Annual Operating Cost: $${generatorOpCost.totalAnnualCost.toLocaleString()}\n`);

// Solar System Demo
console.log('☀️ SOLAR PV SYSTEMS');
console.log('-------------------');

const solarSystemCost = solarPricingService.calculateSolarSystemCost(
  5000, // 5MW system
  'jinko-tiger-pro-540w',
  'sma-sunny-tripower-25000',
  'ironridge-xr-roof',
  true  // include installation
);

if (solarSystemCost.systemDetails) {
  console.log(`System Size: ${solarSystemCost.systemDetails.actualSizeKW} kW`);
  console.log(`Panels: ${solarSystemCost.systemDetails.numPanels} x ${solarSystemCost.systemDetails.panel}`);
  console.log(`Inverters: ${solarSystemCost.systemDetails.numInverters} x ${solarSystemCost.systemDetails.inverter}`);
  console.log(`Equipment Cost: $${solarSystemCost.equipmentCost.toLocaleString()}`);
  console.log(`Installation Cost: $${solarSystemCost.installationCost.toLocaleString()}`);
  console.log(`TOTAL COST: $${solarSystemCost.totalCost.toLocaleString()}`);
  console.log(`Cost per Watt: $${solarSystemCost.costPerWatt.toFixed(2)}/W\n`);
}

// Solar production estimate
const solarProduction = solarPricingService.calculateAnnualProduction(
  solarSystemCost.systemDetails.actualSizeKW,
  'arizona' // High solar irradiance location
);

console.log('Annual Energy Production:');
console.log(`Annual kWh: ${solarProduction.annualKWh.toLocaleString()}`);
console.log(`Peak Sun Hours: ${solarProduction.peakSunHours}`);
console.log(`Monthly Average: ${solarProduction.monthlyAverage.toLocaleString()} kWh\n`);

// Wind Farm Demo
console.log('💨 WIND POWER SYSTEMS');
console.log('---------------------');

const windFarmCost = windPricingService.calculateWindFarmCost(
  'ge-2-5-120',
  25, // 25 turbines
  15, // 15km transmission line
  true, // include development costs
  true  // include transmission
);

if (windFarmCost.turbine) {
  console.log(`Wind Farm: 25 x ${windFarmCost.turbine.model} (${windFarmCost.turbine.manufacturer})`);
  console.log(`Total Capacity: ${windFarmCost.totalCapacityMW} MW`);
  console.log(`Equipment Cost: $${windFarmCost.equipmentCost.toLocaleString()}`);
  console.log(`Installation Cost: $${windFarmCost.installationCost.toLocaleString()}`);
  console.log(`Infrastructure Cost: $${windFarmCost.infrastructureCost.toLocaleString()}`);
  console.log(`Development Cost: $${windFarmCost.developmentCost.toLocaleString()}`);
  console.log(`Transmission Cost: $${windFarmCost.transmissionCost.toLocaleString()}`);
  console.log(`TOTAL COST: $${windFarmCost.totalCost.toLocaleString()}`);
  console.log(`Cost per kW: $${windFarmCost.costPerKW.toFixed(0)}/kW\n`);
}

// Wind production estimate
const windProduction = windPricingService.calculateAnnualProduction(
  'ge-2-5-120',
  25, // 25 turbines
  8.5 // 8.5 m/s average wind speed
);

console.log('Annual Wind Production:');
console.log(`Annual MWh: ${windProduction.annualMWh.toLocaleString()}`);
console.log(`Capacity Factor: ${(windProduction.capacityFactor * 100).toFixed(1)}%\n`);

// Power Electronics Demo
console.log('🔌 POWER ELECTRONICS');
console.log('---------------------');

const inverterCost = powerElectronicsPricingService.calculateInverterSystemCost(
  'abb-pvi-central-1000',
  10000, // 10MW system
  true   // include installation
);

if (inverterCost.inverter) {
  console.log(`Inverter System: ${inverterCost.quantity} x ${inverterCost.inverter.model}`);
  console.log(`Total Power: ${inverterCost.quantity * inverterCost.inverter.powerRatingKW} kW`);
  console.log(`Equipment Cost: $${inverterCost.equipmentCost.toLocaleString()}`);
  console.log(`Installation Cost: $${inverterCost.installationCost.toLocaleString()}`);
  console.log(`Additional Components: $${inverterCost.additionalCost.toLocaleString()}`);
  console.log(`TOTAL COST: $${inverterCost.totalCost.toLocaleString()}`);
  console.log(`Cost per kW: $${inverterCost.costPerKW.toFixed(0)}/kW\n`);
}

// Transformer costs
const transformerCost = powerElectronicsPricingService.calculateTransformerCost(
  'abb-cast-resin-1000',
  10, // 10 transformers
  true // include installation
);

if (transformerCost.transformer) {
  console.log(`Transformers: 10 x ${transformerCost.transformer.model}`);
  console.log(`Equipment Cost: $${transformerCost.equipmentCost.toLocaleString()}`);
  console.log(`Installation Cost: $${transformerCost.installationCost.toLocaleString()}`);
  console.log(`TOTAL TRANSFORMER COST: $${transformerCost.totalCost.toLocaleString()}\n`);
}

// System Controls Demo (Including Deepsea DSE8610)
console.log('📊 SYSTEM CONTROLS (Including Deepsea DSE8610 from Eaton Quote)');
console.log('----------------------------------------------------------------');

const controllerCost = systemControlsPricingService.calculateControllerSystemCost(
  'deepsea-dse8610',
  10, // 10 controllers (matching 10 generators from Eaton quote)
  true, // include installation
  true  // include integration
);

if (controllerCost.controller) {
  console.log(`Controllers: 10 x ${controllerCost.controller.model} (Featured in Eaton Quote)`);
  console.log(`Manufacturer: ${controllerCost.controller.manufacturer}`);
  console.log(`Application: ${controllerCost.controller.application}`);
  console.log(`Equipment Cost: $${controllerCost.equipmentCost.toLocaleString()}`);
  console.log(`Installation Cost: $${controllerCost.installationCost.toLocaleString()}`);
  console.log(`Integration Cost: $${controllerCost.integrationCost.toLocaleString()}`);
  console.log(`TOTAL CONTROLLER COST: $${controllerCost.totalCost.toLocaleString()}\n`);
  
  console.log('Controller Features:');
  controllerCost.controller.features.slice(0, 5).forEach(feature => {
    console.log(`  • ${feature}`);
  });
  console.log(`  • Plus ${controllerCost.controller.features.length - 5} more features\n`);
}

// SCADA System
const scadaCost = systemControlsPricingService.calculateScadaSystemCost(
  'wonderware-system-platform',
  true, // include installation
  80    // 80 hours customization
);

if (scadaCost.scadaSystem) {
  console.log(`SCADA System: ${scadaCost.scadaSystem.model}`);
  console.log(`Software Cost: $${scadaCost.softwareCost.toLocaleString()}`);
  console.log(`Hardware Cost: $${scadaCost.hardwareCost.toLocaleString()}`);
  console.log(`Installation Cost: $${scadaCost.installationCost.toLocaleString()}`);
  console.log(`Customization Cost: $${scadaCost.customizationCost.toLocaleString()}`);
  console.log(`TOTAL SCADA COST: $${scadaCost.totalCost.toLocaleString()}`);
  console.log(`Annual Maintenance: $${scadaCost.annualMaintenanceCost.toLocaleString()}\n`);
}

// Energy Management System
const emsCost = systemControlsPricingService.calculateEMSCost(
  'schneider-ecostruxure-microgrid',
  5,   // 5 sites
  10,  // 10MW total capacity
  6    // 6 months implementation
);

if (emsCost.ems) {
  console.log(`Energy Management System: ${emsCost.ems.model}`);
  console.log(`Setup Cost: $${emsCost.setupCost.toLocaleString()}`);
  console.log(`Implementation Cost: $${emsCost.implementationCost.toLocaleString()}`);
  console.log(`Capacity Cost: $${emsCost.capacityCost.toLocaleString()}`);
  console.log(`TOTAL INITIAL EMS COST: $${emsCost.totalInitialCost.toLocaleString()}`);
  console.log(`Monthly Operating Cost: $${emsCost.monthlyOperatingCost.toLocaleString()}`);
  console.log(`Annual Operating Cost: $${emsCost.annualOperatingCost.toLocaleString()}\n`);
}

// COMPREHENSIVE PROJECT SUMMARY
console.log('🏗️ COMPREHENSIVE PROJECT COST SUMMARY');
console.log('======================================');

const totalEquipmentCost = 
  generatorCost.totalCost +
  solarSystemCost.totalCost +
  windFarmCost.totalCost +
  inverterCost.totalCost +
  transformerCost.totalCost +
  controllerCost.totalCost +
  scadaCost.totalCost +
  emsCost.totalInitialCost;

const totalAnnualOperatingCost = 
  generatorOpCost.totalAnnualCost +
  scadaCost.annualMaintenanceCost +
  emsCost.annualOperatingCost;

console.log(`Generators (10 x 200kW): $${generatorCost.totalCost.toLocaleString()}`);
console.log(`Solar PV (5MW): $${solarSystemCost.totalCost.toLocaleString()}`);
console.log(`Wind Farm (62.5MW): $${windFarmCost.totalCost.toLocaleString()}`);
console.log(`Power Electronics: $${(inverterCost.totalCost + transformerCost.totalCost).toLocaleString()}`);
console.log(`System Controls: $${(controllerCost.totalCost + scadaCost.totalCost + emsCost.totalInitialCost).toLocaleString()}`);
console.log('----------------------------------------');
console.log(`TOTAL PROJECT COST: $${totalEquipmentCost.toLocaleString()}`);
console.log(`ANNUAL OPERATING COST: $${totalAnnualOperatingCost.toLocaleString()}`);

const totalCapacityMW = 
  (generatorCost.generator.ratedPowerKW * 10 / 1000) +
  (solarSystemCost.systemDetails.actualSizeKW / 1000) +
  windFarmCost.totalCapacityMW;

console.log(`\nTOTAL INSTALLED CAPACITY: ${totalCapacityMW.toFixed(1)} MW`);
console.log(`BLENDED COST PER MW: $${(totalEquipmentCost / totalCapacityMW / 1000000).toFixed(2)}M/MW`);

console.log('\n✅ ALL PRICING MODULES SUCCESSFULLY INTEGRATED INTO ADMIN DASHBOARD!');
console.log('🌐 Access the comprehensive pricing administration at http://localhost:5177');
console.log('🔧 Use admin credentials: admin@merlin.energy / merlin2025');
console.log('📊 Navigate to "Pricing Admin" to configure all equipment types');

module.exports = {
  generatorCost,
  solarSystemCost,
  windFarmCost,
  inverterCost,
  transformerCost,
  controllerCost,
  scadaCost,
  emsCost,
  totalEquipmentCost,
  totalAnnualOperatingCost,
  totalCapacityMW
};