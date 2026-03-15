/**
 * EL CAR WASH FLORIDA CAMPAIGN - QUOTE GENERATOR
 * ==============================================
 * Generates 5 professional quotes for El Car Wash locations in Florida
 * 
 * Campaign Strategy: Alpha partnership with PE-backed car wash operator
 * Target: Portfolio-wide energy transformation
 */

import { calculateUseCasePower } from '../src/services/useCasePowerCalculations';
import { calculateQuote } from '../src/services/unifiedQuoteCalculator';
import type { QuoteResult } from '../src/types/index';

// Florida El Car Wash Locations
const EL_CAR_WASH_SITES = [
  {
    name: "El Car Wash - Miami (Flagship)",
    address: "Multiple Miami locations",
    zipCode: "33101",
    state: "FL",
    bays: 6,
    tunnelLength: 120, // feet
    hasFullService: true,
    hasEVCharging: false,
    electricityRate: 0.122, // FPL commercial rate
    demandCharge: 18.50, // $/kW
  },
  {
    name: "El Car Wash - Fort Lauderdale",
    address: "Fort Lauderdale area",
    zipCode: "33301",
    state: "FL",
    bays: 5,
    tunnelLength: 100,
    hasFullService: true,
    hasEVCharging: false,
    electricityRate: 0.118,
    demandCharge: 17.80,
  },
  {
    name: "El Car Wash - Tampa",
    address: "Tampa metro",
    zipCode: "33602",
    state: "FL",
    bays: 4,
    tunnelLength: 100,
    hasFullService: false,
    hasEVCharging: false,
    electricityRate: 0.115,
    demandCharge: 16.50,
  },
  {
    name: "El Car Wash - Orlando",
    address: "Orlando area",
    zipCode: "32801",
    state: "FL",
    bays: 5,
    tunnelLength: 110,
    hasFullService: true,
    hasEVCharging: true, // Tourist area - good for EV
    electricityRate: 0.119,
    demandCharge: 17.20,
  },
  {
    name: "El Car Wash - Jacksonville",
    address: "Jacksonville metro",
    zipCode: "32202",
    state: "FL",
    bays: 4,
    tunnelLength: 90,
    hasFullService: false,
    hasEVCharging: false,
    electricityRate: 0.114,
    demandCharge: 16.00,
  },
];

// Quote configurations for each site
const QUOTE_CONFIGS = [
  {
    scenario: "Solar Only",
    description: "Solar carport for customer parking + demand reduction",
    includeSolar: true,
    includeBESS: false,
    includeGenerator: false,
    includeEV: false,
  },
  {
    scenario: "Solar + BESS (Base Case)",
    description: "Solar carport + battery storage for peak shaving",
    includeSolar: true,
    includeBESS: true,
    includeGenerator: false,
    includeEV: false,
  },
  {
    scenario: "Solar + BESS + Backup",
    description: "Full resilience with generator backup",
    includeSolar: true,
    includeBESS: true,
    includeGenerator: true,
    includeEV: false,
  },
  {
    scenario: "Solar + BESS + EV Hub",
    description: "Energy transformation + EV charging revenue",
    includeSolar: true,
    includeBESS: true,
    includeGenerator: false,
    includeEV: true,
  },
  {
    scenario: "Complete Package",
    description: "Solar + BESS + Generator + EV (Full portfolio solution)",
    includeSolar: true,
    includeBESS: true,
    includeGenerator: true,
    includeEV: true,
  },
];

interface GeneratedQuote {
  site: typeof EL_CAR_WASH_SITES[0];
  scenario: string;
  description: string;
  power: {
    peakLoadKW: number;
    solarKW: number;
    bessKWh: number;
    bessKW: number;
    generatorKW: number;
    evChargersL2: number;
    evChargersDCFC: number;
  };
  costs: {
    totalInvestment: number;
    bess: number;
    solar: number;
    generator: number;
    evCharging: number;
    epc: number;
  };
  financials: {
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
    npv: number;
    irr: number;
  };
  valueProps: string[];
}

async function calculateCarWashPower(site: typeof EL_CAR_WASH_SITES[0]) {
  // Use SSOT car wash power calculation
  const powerResult = calculateUseCasePower('car-wash', {
    bayCount: site.bays,
    washType: site.hasFullService ? 'fullService' : 'tunnel',
    hasDryingSystem: true,
    hasWaterReclamation: true,
    hasVacuumStations: true,
  });

  return powerResult.peakLoadKW;
}

function calculateSolarSize(peakLoadKW: number, aggressive: boolean = false): number {
  // Solar sizing: 70-100% of peak load (depending on roof/carport space)
  // Car washes have great carport opportunity (customer parking)
  const ratio = aggressive ? 0.90 : 0.75;
  return Math.round((peakLoadKW * ratio) / 10) * 10; // Round to 10kW
}

function calculateBESSSize(peakLoadKW: number): { kWh: number; kW: number } {
  // BESS sizing for car wash: 2.5-3 hours duration (peak shaving focus)
  const kW = Math.round((peakLoadKW * 0.6) / 10) * 10; // 60% of peak
  const kWh = kW * 2.5; // 2.5 hour duration
  return { kWh, kW };
}

function calculateGeneratorSize(peakLoadKW: number): number {
  // Generator: 1.25x critical load (keep wash operational during outages)
  const criticalLoadRatio = 0.75; // 75% of operations can continue
  return Math.round((peakLoadKW * criticalLoadRatio * 1.25) / 25) * 25; // Round to 25kW
}

async function generateQuote(
  site: typeof EL_CAR_WASH_SITES[0],
  config: typeof QUOTE_CONFIGS[0]
): Promise<GeneratedQuote> {
  // Calculate base power
  const peakLoadKW = await calculateCarWashPower(site);

  // Calculate system sizes based on configuration
  const solarKW = config.includeSolar ? calculateSolarSize(peakLoadKW, config.scenario.includes("Complete")) : 0;
  const bess = config.includeBESS ? calculateBESSSize(peakLoadKW) : { kWh: 0, kW: 0 };
  const generatorKW = config.includeGenerator ? calculateGeneratorSize(peakLoadKW) : 0;
  const evChargersL2 = config.includeEV ? 12 : 0;
  const evChargersDCFC = config.includeEV && site.hasEVCharging ? 4 : 0;

  // Generate quote using SSOT
  const quoteResult = await calculateQuote({
    storageSizeMW: bess.kW / 1000,
    durationHours: bess.kWh / (bess.kW || 1),
    location: site.state,
    zipCode: site.zipCode,
    electricityRate: site.electricityRate,
    useCase: 'car-wash',
    solarMW: solarKW / 1000,
    windMW: 0,
    generatorMW: generatorKW / 1000,
    generatorFuelType: 'natural-gas',
    gridConnection: 'on-grid',
    batteryChemistry: 'lfp',
    itcConfig: {
      baseRate: 0.30, // 30% ITC base
      prevailingWage: true, // PE will use union labor
      apprenticeship: true,
      energyCommunity: false, // Florida typically not energy community
      domesticContent: false, // Use realistic assumptions
      lowIncome: false,
    },
  });

  // Calculate EV charger costs (not in SSOT yet)
  const evChargingCost = (evChargersL2 * 4000) + (evChargersDCFC * 150000);

  // Build value props
  const valueProps: string[] = [];
  
  if (config.includeSolar) {
    const solarCoverage = Math.round((solarKW / peakLoadKW) * 100);
    valueProps.push(`${solarCoverage}% solar coverage via customer parking carport`);
    valueProps.push(`Brand differentiation: "Solar-Powered Car Wash"`);
  }
  
  if (config.includeBESS) {
    const demandSavings = bess.kW * site.demandCharge * 12 * 0.7; // 70% reduction
    valueProps.push(`$${Math.round(demandSavings / 1000)}K/year demand charge reduction`);
    valueProps.push(`<16ms instant backup power transfer`);
  }
  
  if (config.includeGenerator) {
    valueProps.push(`Continue operations during grid outages (competitive advantage)`);
    valueProps.push(`Natural gas generator: quieter, cleaner for customer experience`);
  }
  
  if (config.includeEV) {
    const evRevenue = (evChargersL2 * 3500) + (evChargersDCFC * 45000); // Annual revenue
    valueProps.push(`$${Math.round(evRevenue / 1000)}K/year EV charging revenue`);
    valueProps.push(`Destination charging attracts EV drivers (high-income demographic)`);
  }

  valueProps.push(`Hurricane-rated equipment (Florida wind-load certified)`);
  valueProps.push(`Turnkey installation by Florida solar carport specialists`);

  return {
    site,
    scenario: config.scenario,
    description: config.description,
    power: {
      peakLoadKW,
      solarKW,
      bessKWh: bess.kWh,
      bessKW: bess.kW,
      generatorKW,
      evChargersL2,
      evChargersDCFC,
    },
    costs: {
      totalInvestment: quoteResult.costs.totalProjectCost + evChargingCost,
      bess: quoteResult.equipment.bess.totalCost || 0,
      solar: quoteResult.equipment.solar.totalCost || 0,
      generator: quoteResult.equipment.generator.totalCost || 0,
      evCharging: evChargingCost,
      epc: quoteResult.costs.installationCost,
    },
    financials: {
      annualSavings: quoteResult.financials.annualSavings + (config.includeEV ? (evChargersL2 * 3500 + evChargersDCFC * 45000) : 0),
      paybackYears: quoteResult.financials.paybackYears,
      roi10Year: quoteResult.financials.roi10Year,
      npv: quoteResult.financials.npv || 0,
      irr: quoteResult.financials.irr || 0,
    },
    valueProps,
  };
}

async function generateAllQuotes() {
  console.log('🚗 EL CAR WASH FLORIDA CAMPAIGN - QUOTE GENERATION');
  console.log('=' .repeat(70));
  console.log();

  const allQuotes: GeneratedQuote[] = [];

  // Generate 1 quote per site using "Base Case" scenario
  for (const site of EL_CAR_WASH_SITES) {
    console.log(`📍 Generating quote for: ${site.name}`);
    const baseConfig = QUOTE_CONFIGS[1]; // Solar + BESS (Base Case)
    const quote = await generateQuote(site, baseConfig);
    allQuotes.push(quote);
    
    console.log(`   ✓ Peak Load: ${quote.power.peakLoadKW} kW`);
    console.log(`   ✓ Solar: ${quote.power.solarKW} kW carport`);
    console.log(`   ✓ BESS: ${quote.power.bessKWh} kWh / ${quote.power.bessKW} kW`);
    console.log(`   ✓ Investment: $${Math.round(quote.costs.totalInvestment / 1000)}K`);
    console.log(`   ✓ Annual Savings: $${Math.round(quote.financials.annualSavings / 1000)}K`);
    console.log(`   ✓ Payback: ${quote.financials.paybackYears.toFixed(1)} years`);
    console.log();
  }

  // Generate alternate scenarios for flagship Miami location
  console.log('📊 Generating scenario analysis for Miami flagship...');
  const miamiSite = EL_CAR_WASH_SITES[0];
  
  for (const config of QUOTE_CONFIGS) {
    if (config.scenario === "Solar + BESS (Base Case)") continue; // Already generated
    
    console.log(`   Scenario: ${config.scenario}`);
    const quote = await generateQuote(miamiSite, config);
    allQuotes.push(quote);
    console.log(`      Investment: $${Math.round(quote.costs.totalInvestment / 1000)}K | Payback: ${quote.financials.paybackYears.toFixed(1)}yr | IRR: ${(quote.financials.irr * 100).toFixed(1)}%`);
  }

  console.log();
  console.log('=' .repeat(70));
  console.log(`✅ Generated ${allQuotes.length} quotes total`);
  console.log();

  return allQuotes;
}

function formatQuoteExport(quotes: GeneratedQuote[]): string {
  let output = '';
  
  output += '# EL CAR WASH FLORIDA - ENERGY TRANSFORMATION QUOTES\n';
  output += '## Alpha Partnership Campaign | March 2026\n\n';
  output += '---\n\n';

  // Portfolio-level summary
  const totalInvestment = quotes.filter(q => q.scenario === "Solar + BESS (Base Case)")
    .reduce((sum, q) => sum + q.costs.totalInvestment, 0);
  const totalAnnualSavings = quotes.filter(q => q.scenario === "Solar + BESS (Base Case)")
    .reduce((sum, q) => sum + q.financials.annualSavings, 0);
  const avgPayback = quotes.filter(q => q.scenario === "Solar + BESS (Base Case)")
    .reduce((sum, q) => sum + q.financials.paybackYears, 0) / 5;

  output += '## PORTFOLIO-WIDE OPPORTUNITY (5 Sites, Base Case)\n\n';
  output += `**Total Investment:** $${(totalInvestment / 1000000).toFixed(2)}M\n`;
  output += `**Annual Savings:** $${Math.round(totalAnnualSavings / 1000)}K\n`;
  output += `**Average Payback:** ${avgPayback.toFixed(1)} years\n`;
  output += `**10-Year ROI:** ${Math.round((totalAnnualSavings * 10 / totalInvestment) * 100)}%\n\n`;
  output += '---\n\n';

  // Individual site quotes
  for (const quote of quotes) {
    output += `## ${quote.site.name}\n`;
    output += `**Scenario:** ${quote.scenario}\n`;
    output += `**Description:** ${quote.description}\n\n`;
    
    output += '### System Configuration\n';
    output += `- **Peak Load:** ${quote.power.peakLoadKW} kW\n`;
    if (quote.power.solarKW > 0) {
      output += `- **Solar Carport:** ${quote.power.solarKW} kW DC\n`;
    }
    if (quote.power.bessKW > 0) {
      output += `- **Battery Storage:** ${quote.power.bessKWh} kWh / ${quote.power.bessKW} kW (${(quote.power.bessKWh / quote.power.bessKW).toFixed(1)}hr duration)\n`;
    }
    if (quote.power.generatorKW > 0) {
      output += `- **Backup Generator:** ${quote.power.generatorKW} kW (natural gas)\n`;
    }
    if (quote.power.evChargersL2 > 0 || quote.power.evChargersDCFC > 0) {
      output += `- **EV Charging:** ${quote.power.evChargersL2} Level 2 (7.2kW) + ${quote.power.evChargersDCFC} DCFC (150kW)\n`;
    }
    output += '\n';

    output += '### Investment Breakdown\n';
    output += `- **Total Investment:** $${Math.round(quote.costs.totalInvestment / 1000)}K\n`;
    if (quote.costs.bess > 0) {
      output += `  - Battery Storage: $${Math.round(quote.costs.bess / 1000)}K\n`;
    }
    if (quote.costs.solar > 0) {
      output += `  - Solar Carport: $${Math.round(quote.costs.solar / 1000)}K\n`;
    }
    if (quote.costs.generator > 0) {
      output += `  - Generator: $${Math.round(quote.costs.generator / 1000)}K\n`;
    }
    if (quote.costs.evCharging > 0) {
      output += `  - EV Charging: $${Math.round(quote.costs.evCharging / 1000)}K\n`;
    }
    output += `  - EPC & Installation: $${Math.round(quote.costs.epc / 1000)}K\n`;
    output += '\n';

    output += '### Financial Performance\n';
    output += `- **Annual Savings:** $${Math.round(quote.financials.annualSavings / 1000)}K\n`;
    output += `- **Simple Payback:** ${quote.financials.paybackYears.toFixed(1)} years\n`;
    output += `- **10-Year ROI:** ${Math.round(quote.financials.roi10Year)}%\n`;
    if (quote.financials.npv > 0) {
      output += `- **Net Present Value (NPV):** $${Math.round(quote.financials.npv / 1000)}K\n`;
    }
    if (quote.financials.irr > 0) {
      output += `- **Internal Rate of Return (IRR):** ${(quote.financials.irr * 100).toFixed(1)}%\n`;
    }
    output += '\n';

    output += '### Key Value Propositions\n';
    for (const prop of quote.valueProps) {
      output += `- ${prop}\n`;
    }
    output += '\n';
    output += '---\n\n';
  }

  output += '## NEXT STEPS\n\n';
  output += '1. **Site Assessment:** Walk 1-2 flagship locations with EPC partner\n';
  output += '2. **Utility Coordination:** Confirm interconnection requirements with FPL\n';
  output += '3. **Structural Engineering:** Verify carport foundation requirements\n';
  output += '4. **Financial Modeling:** PE-grade cash flow models for investment committee\n';
  output += '5. **Alpha Site Selection:** Choose pilot location for portfolio rollout\n\n';

  output += '## RECOMMENDED EPC PARTNERS (FLORIDA SOLAR CARPORT SPECIALISTS)\n\n';
  output += '**Tier 1 (Most Qualified)**\n';
  output += '- Advanced Green Technologies — Carport engineering + fabrication + install\n';
  output += '- Solar Source — Self-performs, turnkey, energy storage integration\n';
  output += '- Compass Solar Energy — Government/commercial carport experience\n\n';
  output += '**Tier 2 (Backup)**\n';
  output += '- Payoli Solar Energy — Proven Florida carport projects (Miami, Coral Gables)\n';
  output += '- Sunlight Solar — Commercial solar + storage scope\n\n';

  return output;
}

// Run quote generation
generateAllQuotes()
  .then(quotes => {
    const exportText = formatQuoteExport(quotes);
    
    // Write to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '..', 'EL_CAR_WASH_FLORIDA_QUOTES.md');
    fs.writeFileSync(outputPath, exportText);
    
    console.log(`📄 Quote export saved to: EL_CAR_WASH_FLORIDA_QUOTES.md`);
    console.log();
    console.log('🎯 CAMPAIGN READY');
    console.log('   Next: Review quotes → Contact EPC partners → Schedule site walks');
  })
  .catch(error => {
    console.error('❌ Error generating quotes:', error);
    process.exit(1);
  });
