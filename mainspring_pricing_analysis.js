// Mainspring Linear Generator + BESS Pricing Analysis
// Based on VoloStar proposal for 250-unit apartments

const mainspringProposal = {
  systemSpecs: {
    designLoad: 500, // kVA (~475 kW @ PF 0.95)
    autonomyHours: 2, // battery only
    optionA: {
      description: "N+1 Resilience",
      mainspringGenerators: 3, // 3× ~230 kW = 690 kW total
      mainspringPowerKW: 690,
      bessEnergyMWh: 1.25, // 1250 kWh
      bessPowerKW: 600, // GFM PCS
      totalCost: 3843400
    },
    optionB: {
      description: "Lean Configuration", 
      mainspringGenerators: 2, // 2× ~230 kW = 460 kW total
      mainspringPowerKW: 460,
      bessEnergyMWh: 1.25, // 1250 kWh
      bessPowerKW: 600, // GFM PCS
      totalCost: 3128675
    },
    optionC: {
      description: "BESS-Forward",
      mainspringGenerators: 2, // 2× ~230 kW = 460 kW total
      mainspringPowerKW: 460,
      bessEnergyMWh: 1.5, // 1500 kWh
      bessPowerKW: 800, // GFM PCS
      totalCost: 3238400
    }
  },
  
  costBreakdown: {
    optionA: {
      mainspringGenerators: 1811250,
      bessBattery: 206250,
      pcsGFM: 90000,
      bosContainerHVACFireBMS: 74062,
      epcIntegration: 44438,
      chpHeatRecovery: 138000,
      mvInterconnection: 450000,
      lvParallelingATS: 250000,
      civilSite: 180000,
      engineeringStudies: 150000,
      commissioningTesting: 100000,
      subtotal: 3494000,
      contingency10Percent: 349400,
      total: 3843400
    },
    optionB: {
      mainspringGenerators: 1207500,
      bessBattery: 206250,
      pcsGFM: 90000,
      bosContainerHVACFireBMS: 74062,
      epcIntegration: 44438,
      chpHeatRecovery: 92000,
      mvInterconnection: 450000,
      lvParallelingATS: 250000,
      civilSite: 180000,
      engineeringStudies: 150000,
      commissioningTesting: 100000,
      subtotal: 2844250,
      contingency10Percent: 284425,
      total: 3128675
    },
    optionC: {
      mainspringGenerators: 1207500,
      bessBattery: 247500,
      pcsGFM: 120000,
      bosContainerHVACFireBMS: 91875,
      epcIntegration: 55125,
      chpHeatRecovery: 92000,
      mvInterconnection: 450000,
      lvParallelingATS: 250000,
      civilSite: 180000,
      engineeringStudies: 150000,
      commissioningTesting: 100000,
      subtotal: 2944000,
      contingency10Percent: 294400,
      total: 3238400
    }
  }
};

// Analysis functions
function analyzeBESSPricing() {
  console.log("=== MAINSPRING + BESS PRICING ANALYSIS ===\n");
  
  const options = ['optionA', 'optionB', 'optionC'];
  
  options.forEach(option => {
    const specs = mainspringProposal.systemSpecs[option];
    const costs = mainspringProposal.costBreakdown[option];
    
    // Calculate BESS pricing components
    const bessOnlyBatteryKWh = specs.bessEnergyMWh * 1000; // Convert to kWh
    const bessBatteryCostPerKWh = costs.bessBattery / bessOnlyBatteryKWh;
    
    // Calculate PCS cost per kW
    const pcsCostPerKW = costs.pcsGFM / specs.bessPowerKW;
    
    // Calculate Mainspring cost per kW
    const mainspringCostPerKW = costs.mainspringGenerators / specs.mainspringPowerKW;
    
    // Total BESS system cost (battery + PCS + BOS portion)
    const bessTotalSystemCost = costs.bessBattery + costs.pcsGFM + (costs.bosContainerHVACFireBMS * 0.6); // Assume 60% of BOS for BESS
    const bessSystemCostPerKWh = bessTotalSystemCost / bessOnlyBatteryKWh;
    
    console.log(`${option.toUpperCase()} - ${specs.description}:`);
    console.log(`  BESS Energy: ${specs.bessEnergyMWh} MWh (${bessOnlyBatteryKWh} kWh)`);
    console.log(`  BESS Power: ${specs.bessPowerKW} kW`);
    console.log(`  Battery Cost: $${costs.bessBattery}`);
    console.log(`  Battery $/kWh: $${bessBatteryCostPerKWh.toFixed(0)}`);
    console.log(`  PCS Cost: $${costs.pcsGFM} ($${pcsCostPerKW.toFixed(0)}/kW)`);
    console.log(`  BESS System $/kWh: $${bessSystemCostPerKWh.toFixed(0)} (includes battery + PCS + 60% BOS)`);
    console.log(`  Mainspring: ${specs.mainspringPowerKW} kW @ $${mainspringCostPerKW.toFixed(0)}/kW`);
    console.log(`  Total Project: $${costs.total.toLocaleString()}\n`);
  });
}

function compareWithCurrentPricing() {
  console.log("=== COMPARISON WITH CURRENT MERLIN PRICING ===\n");
  
  // Current Merlin pricing structure (size-weighted)
  const merlinPricing = {
    smallSystem2MWh: 155, // $/kWh
    largeSystem15MWh: 105, // $/kWh floor
  };
  
  function calculateMerlinPrice(capacityMWh) {
    if (capacityMWh >= 15) return merlinPricing.largeSystem15MWh;
    if (capacityMWh <= 2) return merlinPricing.smallSystem2MWh;
    
    // Linear interpolation
    const sizeDelta = 15 - 2; // 13 MWh range
    const priceDelta = 155 - 105; // $50/kWh range
    const capacityRatio = (capacityMWh - 2) / sizeDelta;
    return 155 - (priceDelta * capacityRatio);
  }
  
  const options = ['optionA', 'optionB', 'optionC'];
  options.forEach(option => {
    const specs = mainspringProposal.systemSpecs[option];
    const costs = mainspringProposal.costBreakdown[option];
    
    const mainspringBessKWh = specs.bessEnergyMWh * 1000;
    const mainspringBatteryCostPerKWh = costs.bessBattery / mainspringBessKWh;
    
    const merlinPrice = calculateMerlinPrice(specs.bessEnergyMWh);
    const merlinBatteryCost = mainspringBessKWh * merlinPrice;
    
    console.log(`${option.toUpperCase()} Comparison:`);
    console.log(`  Mainspring Battery: $${costs.bessBattery.toLocaleString()} ($${mainspringBatteryCostPerKWh.toFixed(0)}/kWh)`);
    console.log(`  Merlin Current: $${merlinBatteryCost.toLocaleString()} ($${merlinPrice.toFixed(0)}/kWh)`);
    console.log(`  Difference: ${(mainspringBatteryCostPerKWh / merlinPrice * 100 - 100).toFixed(1)}% ${mainspringBatteryCostPerKWh > merlinPrice ? 'higher' : 'lower'}\n`);
  });
}

function hybridSystemAnalysis() {
  console.log("=== HYBRID SYSTEM (MAINSPRING + BESS) INSIGHTS ===\n");
  
  const options = ['optionA', 'optionB', 'optionC'];
  // Calculate blended $/kWh for the entire hybrid system
  options.forEach(option => {
    const specs = mainspringProposal.systemSpecs[option];
    const costs = mainspringProposal.costBreakdown[option];
    
    // Estimate equivalent energy for Mainspring (assuming 8-hour run capability)
    const mainspringEquivEnergyMWh = specs.mainspringPowerKW / 1000 * 8; // 8 hours runtime
    const totalEquivEnergyMWh = specs.bessEnergyMWh + mainspringEquivEnergyMWh;
    
    // Energy-related costs (batteries + generators + fuel system)
    const energySystemCosts = costs.mainspringGenerators + costs.bessBattery + costs.chpHeatRecovery;
    const blendedEnergyPerKWh = energySystemCosts / (totalEquivEnergyMWh * 1000);
    
    console.log(`${option.toUpperCase()} Hybrid Analysis:`);
    console.log(`  BESS Energy: ${specs.bessEnergyMWh} MWh`);
    console.log(`  Mainspring Equiv Energy: ${mainspringEquivEnergyMWh.toFixed(1)} MWh (8-hr runtime)`);
    console.log(`  Total Hybrid Energy: ${totalEquivEnergyMWh.toFixed(1)} MWh`);
    console.log(`  Hybrid Energy Cost: $${energySystemCosts.toLocaleString()}`);
    console.log(`  Blended $/kWh: $${blendedEnergyPerKWh.toFixed(0)}`);
    console.log(`  Value Proposition: Fast response (BESS) + long duration (Mainspring)\n`);
  });
}

function pricingRecommendations() {
  console.log("=== PRICING RECOMMENDATIONS FOR MERLIN ===\n");
  
  console.log("1. BESS Standalone Pricing:");
  console.log("   - Small systems (1-2 MWh): $155-165/kWh (consistent with Mainspring $165/kWh)");
  console.log("   - Mid systems (2-15 MWh): $105-155/kWh (linear interpolation)");
  console.log("   - Large systems (15+ MWh): $105/kWh (floor pricing)");
  
  console.log("\n2. Hybrid System Options:");
  console.log("   - Add Mainspring linear generators as premium option");
  console.log("   - Position as microgrid/resilience upgrade");
  console.log("   - Pricing: $2,600-3,900/kW for linear generators");
  
  console.log("\n3. System Sizing Validation:");
  console.log("   - Mainspring data confirms our size-based pricing approach");
  console.log("   - Small systems (1-2 MWh) require premium pricing due to:");
  console.log("     * Higher integration costs");
  console.log("     * Specialized components (GFM inverters)");
  console.log("     * Custom engineering");
  
  console.log("\n4. Market Positioning:");
  console.log("   - Pure BESS: Fast response, grid services");
  console.log("   - Hybrid: Extended autonomy, microgrid capability");
  console.log("   - Linear generators: Clean backup, fuel-flexible");
}

// Run analysis
analyzeBESSPricing();
compareWithCurrentPricing();
hybridSystemAnalysis();
pricingRecommendations();