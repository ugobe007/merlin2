/**
 * MAGIC FIT - SYSTEM OPTIMIZER
 * Sub/Sub Contractor to TrueQuote Engine
 * 
 * Responsibilities:
 * 1. Receive base calculation from TrueQuote
 * 2. Generate 3 optimized options (Starter, Perfect Fit, Beast Mode)
 * 3. Submit proposal back to TrueQuote for authentication
 * 
 * IMPORTANT: Magic Fit CANNOT present results directly to user.
 * All results must be authenticated by TrueQuote first.
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type {
  MerlinRequest,
  TrueQuoteBaseCalculation,
  MagicFitProposal,
  SystemOption,
  OptionTier,
  EnergyGoal,
} from './contracts';
import { calculateFinancials } from './calculators/financialCalculator';

// Magic Fit version
const MAGIC_FIT_VERSION = '1.0.0';

// Tier configurations
const TIER_CONFIG: Record<OptionTier, {
  name: string;
  tagline: string;
  scale: number;
  description: string;
}> = {
  starter: {
    name: 'Starter',
    tagline: 'Essential savings',
    scale: 0.70,
    description: 'Entry-level system focused on quick payback',
  },
  perfectFit: {
    name: 'Perfect Fit',
    tagline: 'Optimal balance',
    scale: 1.00,
    description: 'Recommended system matching your facility needs',
  },
  beastMode: {
    name: 'Beast Mode',
    tagline: 'Maximum power',
    scale: 1.25,
    description: 'Oversized for future growth and maximum independence',
  },
};

/**
 * Generate Magic Fit proposal with 3 optimized options
 * 
 * @param baseCalc - Base calculation from TrueQuote
 * @param goals - User's energy goals
 * @returns MagicFitProposal to be authenticated by TrueQuote
 */
export function generateMagicFitProposal(
  baseCalc: TrueQuoteBaseCalculation,
  goals: EnergyGoal[]
): MagicFitProposal {
  console.log('✨ Magic Fit: Generating optimized options');
  console.log('✨ Magic Fit: User goals:', goals);
  console.log('✨ Magic Fit: Base calculation:', {
    peakDemandKW: baseCalc.load.peakDemandKW,
    bessKWh: baseCalc.bess.energyKWh,
    solarKW: baseCalc.solar.capacityKW,
  });

  // Adjust scales based on goals
  const adjustedScales = adjustScalesForGoals(goals);

  // Generate each option
  const starter = createOption('starter', baseCalc, goals, adjustedScales.starter);
  const perfectFit = createOption('perfectFit', baseCalc, goals, adjustedScales.perfectFit);
  const beastMode = createOption('beastMode', baseCalc, goals, adjustedScales.beastMode);

  const proposal: MagicFitProposal = {
    starter,
    perfectFit,
    beastMode,
    optimizedFor: goals,
    methodology: buildMethodologyDescription(goals, adjustedScales),
    generatedAt: new Date().toISOString(),
    magicFitVersion: MAGIC_FIT_VERSION,
  };

  console.log('✨ Magic Fit: Proposal generated', {
    starter: { bessKWh: starter.bess.energyKWh, netCost: starter.financials.netCost },
    perfectFit: { bessKWh: perfectFit.bess.energyKWh, netCost: perfectFit.financials.netCost },
    beastMode: { bessKWh: beastMode.bess.energyKWh, netCost: beastMode.financials.netCost },
  });

  return proposal;
}

/**
 * Adjust tier scales based on user goals
 */
function adjustScalesForGoals(goals: EnergyGoal[]): Record<OptionTier, number> {
  let starterScale = TIER_CONFIG.starter.scale;
  let perfectScale = TIER_CONFIG.perfectFit.scale;
  let beastScale = TIER_CONFIG.beastMode.scale;

  // Backup power goal → increase all sizes
  if (goals.includes('backup_power')) {
    starterScale += 0.05;
    perfectScale += 0.10;
    beastScale += 0.15;
  }

  // Grid independence → significantly increase sizes
  if (goals.includes('grid_independence')) {
    starterScale += 0.10;
    perfectScale += 0.15;
    beastScale += 0.25;
  }

  // Cost reduction focus → keep starter lean
  if (goals.includes('reduce_costs')) {
    starterScale = Math.max(0.60, starterScale - 0.05);
  }

  // Sustainability → boost solar in all tiers (handled in createOption)

  return {
    starter: starterScale,
    perfectFit: perfectScale,
    beastMode: beastScale,
  };
}

/**
 * Create a single system option
 */
function createOption(
  tier: OptionTier,
  base: TrueQuoteBaseCalculation,
  goals: EnergyGoal[],
  scale: number
): SystemOption {
  const config = TIER_CONFIG[tier];
  const notes: string[] = [];

  // ─────────────────────────────────────────────────────────────
  // BESS Sizing
  // ─────────────────────────────────────────────────────────────
  let bessKWh = Math.round(base.bess.energyKWh * scale);
  let bessKW = Math.round(base.bess.powerKW * scale);

  // Round to standard sizes
  bessKWh = roundToNearest(bessKWh, 100);
  bessKW = roundToNearest(bessKW, 50);

  // Ensure minimum viable size
  bessKWh = Math.max(100, bessKWh);
  bessKW = Math.max(50, bessKW);

  notes.push(`BESS: ${Math.round(scale * 100)}% of recommended (${bessKWh} kWh)`);

  // ─────────────────────────────────────────────────────────────
  // Solar Sizing
  // ─────────────────────────────────────────────────────────────
  let solarKW = 0;
  let includeSolar = base.solar.recommended;

  // Boost solar for sustainability goal
  let solarScale = scale;
  if (goals.includes('sustainability')) {
    solarScale += 0.10;
    includeSolar = true;
  }

  if (includeSolar && base.solar.capacityKW > 0) {
    solarKW = Math.round(base.solar.capacityKW * solarScale);
    solarKW = roundToNearest(solarKW, 25);
    solarKW = Math.max(25, solarKW);
    notes.push(`Solar: ${solarKW} kW array`);
  }

  // ─────────────────────────────────────────────────────────────
  // Generator Sizing
  // ─────────────────────────────────────────────────────────────
  let generatorKW = 0;
  let includeGenerator = base.generator.recommended;

  // Beast mode in high-risk areas always includes generator
  if (tier === 'beastMode' && base.location.isHighRiskWeather) {
    includeGenerator = true;
  }

  // Backup power goal → include generator in all tiers
  if (goals.includes('backup_power') && tier !== 'starter') {
    includeGenerator = true;
  }

  if (includeGenerator) {
    if (base.generator.capacityKW > 0) {
      generatorKW = Math.round(base.generator.capacityKW * scale);
    } else {
      // Default to 50% of BESS power if no base recommendation
      generatorKW = Math.round(bessKW * 0.5);
    }
    generatorKW = roundToStandardGeneratorSize(generatorKW);
    notes.push(`Generator: ${generatorKW} kW ${base.generator.fuelType}`);
  }

  // ─────────────────────────────────────────────────────────────
  // EV Charging
  // ─────────────────────────────────────────────────────────────
  let includeEV = base.ev.recommended;
  let l2Count = 0, dcfcCount = 0, ultraFastCount = 0, evTotalPower = 0;

  // Only include EV in Perfect Fit and Beast Mode by default
  if (tier === 'starter' && !goals.includes('generate_revenue')) {
    includeEV = false;
  }

  if (includeEV) {
    const evScale = tier === 'starter' ? 0.5 : tier === 'perfectFit' ? 1.0 : 1.5;
    l2Count = Math.round(base.ev.l2Count * evScale);
    dcfcCount = Math.round(base.ev.dcfcCount * evScale);
    ultraFastCount = Math.round(base.ev.ultraFastCount * evScale);
    evTotalPower = l2Count * 19.2 + dcfcCount * 150 + ultraFastCount * 350;

    if (l2Count + dcfcCount + ultraFastCount > 0) {
      notes.push(`EV: ${l2Count + dcfcCount + ultraFastCount} chargers`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Financial Calculations
  // ─────────────────────────────────────────────────────────────
  const financials = calculateFinancials({
    bessCost: bessKWh * base.bess.costPerKwh,
    solarCost: solarKW * (base.solar.costPerWatt * 1000),
    generatorCost: generatorKW * 800, // $800/kW average
    evCost: l2Count * 6000 + dcfcCount * 75000 + ultraFastCount * 150000,
    bessKW,
    bessKWh,
    solarKW,
    solarAnnualKWh: solarKW * 1500, // Approximate production
    generatorKW,
    electricityRate: base.utility.rate,
    demandCharge: base.utility.demandCharge,
    state: base.location.climateZone,
  });

  // ─────────────────────────────────────────────────────────────
  // Coverage Metrics
  // ─────────────────────────────────────────────────────────────
  const energyCoveragePercent = Math.min(150, Math.round(scale * 100));
  const backupHours = base.load.peakDemandKW > 0
    ? Math.round((bessKWh / (base.load.peakDemandKW * 0.5)) * 10) / 10
    : 0;
  const peakShavingPercent = 25; // Standard assumption

  return {
    tier,
    name: config.name,
    tagline: config.tagline,
    bess: {
      powerKW: bessKW,
      energyKWh: bessKWh,
      chemistry: base.bess.chemistry,
    },
    solar: {
      included: solarKW > 0,
      capacityKW: solarKW,
    },
    generator: {
      included: generatorKW > 0,
      capacityKW: generatorKW,
      fuelType: base.generator.fuelType,
    },
    ev: {
      included: includeEV && (l2Count + dcfcCount + ultraFastCount) > 0,
      l2Count,
      dcfcCount,
      ultraFastCount,
      totalPowerKW: Math.round(evTotalPower),
    },
    financials: {
      totalInvestment: financials.totalInvestment,
      federalITC: financials.federalITC,
      stateIncentives: financials.estimatedStateIncentives,
      netCost: financials.netCost,
      annualSavings: financials.annualSavings,
      paybackYears: financials.simplePaybackYears,
      tenYearROI: financials.tenYearROI,
    },
    coverage: {
      energyCoveragePercent,
      backupHours,
      peakShavingPercent,
    },
    optimizationNotes: notes,
  };
}

/**
 * Build methodology description
 */
function buildMethodologyDescription(
  goals: EnergyGoal[],
  scales: Record<OptionTier, number>
): string {
  const goalDescriptions: Record<EnergyGoal, string> = {
    reduce_costs: 'cost optimization',
    backup_power: 'backup duration',
    sustainability: 'solar coverage',
    grid_independence: 'self-sufficiency',
    peak_shaving: 'demand reduction',
    generate_revenue: 'revenue potential',
  };

  const prioritizedGoals = goals.map(g => goalDescriptions[g]).filter(Boolean);
  
  return `Options optimized for ${prioritizedGoals.join(', ')}. ` +
    `Scales: Starter ${Math.round(scales.starter * 100)}%, ` +
    `Perfect Fit ${Math.round(scales.perfectFit * 100)}%, ` +
    `Beast Mode ${Math.round(scales.beastMode * 100)}%.`;
}

/**
 * Round to nearest increment
 */
function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

/**
 * Round to standard generator sizes
 */
function roundToStandardGeneratorSize(kw: number): number {
  const standardSizes = [50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 
                        600, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000];
  
  let closest = standardSizes[0];
  let minDiff = Math.abs(kw - closest);
  
  for (const size of standardSizes) {
    const diff = Math.abs(kw - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  
  return closest;
}

/**
 * Validate Magic Fit proposal internally before submission
 */
export function validateProposalInternal(proposal: MagicFitProposal): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check that options are properly ordered by scale
  if (proposal.starter.bess.energyKWh >= proposal.perfectFit.bess.energyKWh) {
    errors.push('Starter BESS should be smaller than Perfect Fit');
  }
  if (proposal.perfectFit.bess.energyKWh >= proposal.beastMode.bess.energyKWh) {
    errors.push('Perfect Fit BESS should be smaller than Beast Mode');
  }

  // Check that costs are properly ordered
  if (proposal.starter.financials.netCost >= proposal.perfectFit.financials.netCost) {
    errors.push('Starter cost should be less than Perfect Fit');
  }
  if (proposal.perfectFit.financials.netCost >= proposal.beastMode.financials.netCost) {
    errors.push('Perfect Fit cost should be less than Beast Mode');
  }

  // Check for negative values
  for (const tier of ['starter', 'perfectFit', 'beastMode'] as const) {
    const opt = proposal[tier];
    if (opt.financials.netCost < 0) {
      errors.push(`${tier} has negative net cost`);
    }
    if (opt.financials.annualSavings < 0) {
      errors.push(`${tier} has negative savings`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
