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
 *
 * VERSION 1.1.1 - January 2026
 * - Added UPS Mode logic for when user opts out of solar AND generator
 * - BESS upsized to compensate for lack of on-site generation
 * - SSOT: Now uses DEFAULTS for generator/EV pricing
 */

import type {
  TrueQuoteBaseCalculation,
  MagicFitProposal,
  SystemOption,
  OptionTier,
  EnergyGoal,
} from "./contracts";
import { calculateFinancials } from "./calculators/financialCalculator";
import { DEFAULTS } from "./data/constants";

// Magic Fit version
const MAGIC_FIT_VERSION = "1.1.1";

// ═══════════════════════════════════════════════════════════════════════════
// USER PREFERENCES INTERFACE
// Passed from Step 4 selections
// ═══════════════════════════════════════════════════════════════════════════
export interface UserPreferences {
  solar: {
    interested: boolean; // User selected solar in Step 4
    customSizeKw?: number; // User override size
  };
  generator: {
    interested: boolean; // User selected generator in Step 4
    customSizeKw?: number;
    fuelType?: "diesel" | "natural-gas" | "propane";
  };
  ev: {
    interested: boolean;
  };
  hasNaturalGasLine?: boolean; // Affects generator fuel type recommendation
}

// ═══════════════════════════════════════════════════════════════════════════
// BESS UPSIZE MULTIPLIERS
// When user opts out of generation, we compensate with larger BESS
// ═══════════════════════════════════════════════════════════════════════════
const BESS_UPSIZE_CONFIG = {
  // User has BOTH solar and generator → standard sizing
  fullGeneration: {
    starter: 1.0,
    perfectFit: 1.0,
    beastMode: 1.0,
    durationMultiplier: 1.0, // Standard 2-4 hour duration
  },
  // User has solar ONLY (no generator) → moderate upsize for backup
  solarOnly: {
    starter: 1.15,
    perfectFit: 1.25,
    beastMode: 1.35,
    durationMultiplier: 1.5, // 3-6 hour duration
  },
  // User has generator ONLY (no solar) → slight upsize for peak shaving
  generatorOnly: {
    starter: 1.0,
    perfectFit: 1.1,
    beastMode: 1.2,
    durationMultiplier: 1.0,
  },
  // User has NEITHER solar nor generator → UPS MODE - significant upsize
  upsMode: {
    starter: 1.5, // 50% larger for basic grid backup
    perfectFit: 1.75, // 75% larger for extended backup
    beastMode: 2.0, // Double size for maximum independence
    durationMultiplier: 2.0, // 4-8 hour duration target
  },
};

// Tier configurations
const TIER_CONFIG: Record<
  OptionTier,
  {
    name: string;
    tagline: string;
    scale: number;
    description: string;
  }
> = {
  starter: {
    name: "Starter",
    tagline: "Essential savings",
    scale: 0.7,
    description: "Entry-level system focused on quick payback",
  },
  perfectFit: {
    name: "Perfect Fit",
    tagline: "Optimal balance",
    scale: 1.0,
    description: "Recommended system matching your facility needs",
  },
  beastMode: {
    name: "Beast Mode",
    tagline: "Maximum power",
    scale: 1.25,
    description: "Oversized for future growth and maximum independence",
  },
};

/**
 * Determine the generation scenario based on user preferences
 */
function getGenerationScenario(prefs: UserPreferences): keyof typeof BESS_UPSIZE_CONFIG {
  const hasSolar = prefs.solar.interested;
  const hasGenerator = prefs.generator.interested;

  if (hasSolar && hasGenerator) return "fullGeneration";
  if (hasSolar && !hasGenerator) return "solarOnly";
  if (!hasSolar && hasGenerator) return "generatorOnly";
  return "upsMode";
}

/**
 * Generate Magic Fit proposal with 3 optimized options
 *
 * @param baseCalc - Base calculation from TrueQuote
 * @param goals - User's energy goals
 * @param userPrefs - User's Step 4 selections (solar, generator, EV)
 * @returns MagicFitProposal to be authenticated by TrueQuote
 */
export function generateMagicFitProposal(
  baseCalc: TrueQuoteBaseCalculation,
  goals: EnergyGoal[],
  userPrefs?: UserPreferences // NEW: Optional to maintain backward compatibility
): MagicFitProposal {
  console.log("✨ Magic Fit v1.1: Generating optimized options");
  console.log("✨ Magic Fit: User goals:", goals);
  console.log("✨ Magic Fit: Base calculation:", {
    peakDemandKW: baseCalc.load.peakDemandKW,
    bessKWh: baseCalc.bess.energyKWh,
    solarKW: baseCalc.solar.capacityKW,
  });

  // Default preferences if not provided (backward compatibility)
  const prefs: UserPreferences = userPrefs || {
    solar: { interested: baseCalc.solar.recommended },
    generator: { interested: baseCalc.generator.recommended },
    ev: { interested: baseCalc.ev.recommended },
  };

  // Determine generation scenario
  const scenario = getGenerationScenario(prefs);
  const bessConfig = BESS_UPSIZE_CONFIG[scenario];

  console.log("✨ Magic Fit: Generation scenario:", scenario);
  console.log("✨ Magic Fit: BESS upsize config:", bessConfig);

  // Adjust scales based on goals
  const adjustedScales = adjustScalesForGoals(goals);

  // Generate each option with user preferences considered
  const starter = createOption(
    "starter",
    baseCalc,
    goals,
    adjustedScales.starter,
    prefs,
    bessConfig
  );
  const perfectFit = createOption(
    "perfectFit",
    baseCalc,
    goals,
    adjustedScales.perfectFit,
    prefs,
    bessConfig
  );
  const beastMode = createOption(
    "beastMode",
    baseCalc,
    goals,
    adjustedScales.beastMode,
    prefs,
    bessConfig
  );

  const proposal: MagicFitProposal = {
    starter,
    perfectFit,
    beastMode,
    optimizedFor: goals,
    methodology: buildMethodologyDescription(goals, adjustedScales, scenario),
    generatedAt: new Date().toISOString(),
    magicFitVersion: MAGIC_FIT_VERSION,
  };

  console.log("✨ Magic Fit: Proposal generated", {
    scenario,
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
  if (goals.includes("backup_power")) {
    starterScale += 0.05;
    perfectScale += 0.1;
    beastScale += 0.15;
  }

  // Grid independence → significantly increase sizes
  if (goals.includes("grid_independence")) {
    starterScale += 0.1;
    perfectScale += 0.15;
    beastScale += 0.25;
  }

  // Cost reduction focus → keep starter lean
  if (goals.includes("reduce_costs")) {
    starterScale = Math.max(0.6, starterScale - 0.05);
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
  scale: number,
  prefs: UserPreferences,
  bessConfig: typeof BESS_UPSIZE_CONFIG.fullGeneration
): SystemOption {
  const config = TIER_CONFIG[tier];
  const notes: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // BESS Sizing - NOW WITH UPS MODE LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  // Get the upsize multiplier for this tier
  const bessUpsizeMultiplier = bessConfig[tier];

  // Calculate base BESS with scale AND upsize multiplier
  let bessKWh = Math.round(base.bess.energyKWh * scale * bessUpsizeMultiplier);
  let bessKW = Math.round(base.bess.powerKW * scale * bessUpsizeMultiplier);

  // Round to standard sizes
  bessKWh = roundToNearest(bessKWh, 100);
  bessKW = roundToNearest(bessKW, 50);

  // Ensure minimum viable size
  bessKWh = Math.max(100, bessKWh);
  bessKW = Math.max(50, bessKW);

  // Calculate duration based on scenario
  const targetDuration = base.bess.durationHours * bessConfig.durationMultiplier;

  // Adjust kWh to meet duration target if needed, BUT respect 250% max limit
  const minKWhForDuration = bessKW * targetDuration;
  const maxAllowedKWh = Math.round(base.bess.energyKWh * 2.5); // 250% max per validator

  if (bessKWh < minKWhForDuration) {
    // Try to meet duration, but cap at 250% of base
    bessKWh = Math.min(roundToNearest(minKWhForDuration, 100), maxAllowedKWh);
  }

  // Final safety check: never exceed 250% of base
  bessKWh = Math.min(bessKWh, maxAllowedKWh);

  // Add note about UPS mode if applicable
  if (bessUpsizeMultiplier > 1.0) {
    const scenario =
      !prefs.solar.interested && !prefs.generator.interested
        ? "UPS Mode"
        : !prefs.generator.interested
          ? "No Generator"
          : "Standard";
    notes.push(
      `BESS: ${bessKWh} kWh (${scenario} - ${Math.round(bessUpsizeMultiplier * 100)}% sized)`
    );
  } else {
    notes.push(`BESS: ${Math.round(scale * 100)}% of recommended (${bessKWh} kWh)`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Solar Sizing - ONLY IF USER INTERESTED
  // ═══════════════════════════════════════════════════════════════════════════
  let solarKW = 0;
  let carportSolarKW = 0;
  let includeSolar = prefs.solar.interested && base.solar.recommended;
  let includeCarport = false;

  // Boost solar for sustainability goal (only if user wants solar)
  let solarScale = scale;
  if (goals.includes("sustainability") && prefs.solar.interested) {
    solarScale += 0.1;
    includeSolar = true;
  }

  if (includeSolar && base.solar.capacityKW > 0) {
    // User custom size takes precedence
    if (prefs.solar.customSizeKw && prefs.solar.customSizeKw > 0) {
      solarKW = prefs.solar.customSizeKw;
      notes.push(`Solar: ${solarKW} kW (user specified)`);
    } else {
      // Calculate desired solar based on scale
      const desiredSolarKW = Math.round(
        (base.solar.idealCapacityKW || base.solar.capacityKW) * solarScale
      );

      // Get max roof capacity (from new fields)
      const maxRoofKW = base.solar.maxRoofCapacityKW || base.solar.capacityKW;
      const isRoofConstrained = base.solar.isRoofConstrained || false;

      // ROOF CONSTRAINT LOGIC
      if (isRoofConstrained) {
        if (tier === "starter") {
          solarKW = Math.min(desiredSolarKW, maxRoofKW);
          solarKW = roundToNearest(solarKW, 25);
          solarKW = Math.max(25, solarKW);
          notes.push(`Solar: ${solarKW} kW (roof only, constrained)`);
        } else if (tier === "perfectFit") {
          solarKW = maxRoofKW;
          const gap = (base.solar.idealCapacityKW || base.solar.capacityKW) - maxRoofKW;
          if (gap > 0) {
            carportSolarKW = roundToNearest(gap * 0.5, 25);
            includeCarport = carportSolarKW >= 25;
          }
          solarKW = roundToNearest(solarKW, 25);
          if (includeCarport) {
            notes.push(`Solar: ${solarKW} kW roof + ${carportSolarKW} kW carport`);
          } else {
            notes.push(`Solar: ${solarKW} kW (roof max)`);
          }
        } else if (tier === "beastMode") {
          solarKW = maxRoofKW;
          const gap = desiredSolarKW - maxRoofKW;
          if (gap > 0) {
            carportSolarKW = roundToNearest(gap, 25);
            includeCarport = carportSolarKW >= 25;
          }
          solarKW = roundToNearest(solarKW, 25);
          if (includeCarport) {
            notes.push(`Solar: ${solarKW} kW roof + ${carportSolarKW} kW carport (full coverage)`);
          } else {
            notes.push(`Solar: ${solarKW} kW (roof max)`);
          }
        }
      } else {
        solarKW = roundToNearest(desiredSolarKW, 25);
        solarKW = Math.max(25, solarKW);
        notes.push(`Solar: ${solarKW} kW array`);
      }
    }
  } else if (!prefs.solar.interested) {
    notes.push("Solar: Not selected by user");
  }

  const totalSolarKW = solarKW + carportSolarKW;

  // ═══════════════════════════════════════════════════════════════════════════
  // Generator Sizing - ONLY IF USER INTERESTED
  // ═══════════════════════════════════════════════════════════════════════════
  let generatorKW = 0;
  const includeGenerator = prefs.generator.interested;
  let generatorFuelType = base.generator.fuelType;

  // Determine fuel type based on user's natural gas availability
  if (prefs.hasNaturalGasLine) {
    generatorFuelType = "natural-gas";
  } else if (
    prefs.generator.fuelType &&
    (prefs.generator.fuelType === "diesel" || prefs.generator.fuelType === "natural-gas")
  ) {
    generatorFuelType = prefs.generator.fuelType;
  }

  // Beast mode in high-risk areas - suggest generator even if not selected
  if (tier === "beastMode" && base.location.isHighRiskWeather && !prefs.generator.interested) {
    // Add a note but don't force it
    notes.push("⚠️ High-risk weather zone - consider adding generator");
  }

  if (includeGenerator) {
    if (prefs.generator.customSizeKw && prefs.generator.customSizeKw > 0) {
      generatorKW = prefs.generator.customSizeKw;
      notes.push(`Generator: ${generatorKW} kW ${generatorFuelType} (user specified)`);
    } else if (base.generator.capacityKW > 0) {
      generatorKW = Math.round(base.generator.capacityKW * scale);
      generatorKW = roundToStandardGeneratorSize(generatorKW);
      notes.push(`Generator: ${generatorKW} kW ${generatorFuelType}`);
    } else {
      // Default to 50% of BESS power if no base recommendation
      generatorKW = Math.round(bessKW * 0.5);
      generatorKW = roundToStandardGeneratorSize(generatorKW);
      notes.push(`Generator: ${generatorKW} kW ${generatorFuelType}`);
    }
  } else if (!prefs.generator.interested) {
    notes.push("Generator: Not selected by user");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EV Charging - ONLY IF USER INTERESTED
  // ═══════════════════════════════════════════════════════════════════════════
  let includeEV = prefs.ev.interested && base.ev.recommended;
  let l2Count = 0,
    dcfcCount = 0,
    ultraFastCount = 0,
    evTotalPower = 0;

  // Only include EV in Perfect Fit and Beast Mode by default
  if (tier === "starter" && !goals.includes("generate_revenue")) {
    includeEV = false;
  }

  if (includeEV) {
    const evScale = tier === "starter" ? 0.5 : tier === "perfectFit" ? 1.0 : 1.5;
    l2Count = Math.round(base.ev.l2Count * evScale);
    dcfcCount = Math.round(base.ev.dcfcCount * evScale);
    ultraFastCount = Math.round(base.ev.ultraFastCount * evScale);
    evTotalPower = l2Count * 19.2 + dcfcCount * 150 + ultraFastCount * 350;

    if (l2Count + dcfcCount + ultraFastCount > 0) {
      notes.push(`EV: ${l2Count + dcfcCount + ultraFastCount} chargers`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Financial Calculations
  // ═══════════════════════════════════════════════════════════════════════════
  const roofSolarCost = solarKW * (base.solar.costPerWatt * 1000);
  const carportSolarCost = carportSolarKW * (base.solar.costPerWatt * 1000 * 1.15);
  const totalSolarCost = roofSolarCost + carportSolarCost;

  // SSOT: Use DEFAULTS for generator cost based on fuel type
  const generatorCostPerKW = generatorFuelType === 'diesel' 
    ? DEFAULTS.Generator.dieselCostPerKW 
    : DEFAULTS.Generator.natgasCostPerKW;

  const financials = calculateFinancials({
    bessCost: bessKWh * base.bess.costPerKwh,
    solarCost: totalSolarCost,
    generatorCost: generatorKW * generatorCostPerKW,
    evCost: l2Count * DEFAULTS.EV.l2Cost + dcfcCount * DEFAULTS.EV.dcfcCost + ultraFastCount * DEFAULTS.EV.ultraFastCost,
    bessKW,
    bessKWh,
    solarKW: totalSolarKW,
    solarAnnualKWh: totalSolarKW * 1500,
    generatorKW,
    electricityRate: base.utility.rate,
    demandCharge: base.utility.demandCharge,
    state: base.location.climateZone,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Coverage Metrics
  // ═══════════════════════════════════════════════════════════════════════════
  const energyCoveragePercent = Math.min(150, Math.round(scale * 100));
  const backupHours =
    base.load.peakDemandKW > 0
      ? Math.round((bessKWh / (base.load.peakDemandKW * 0.5)) * 10) / 10
      : 0;
  const peakShavingPercent = 25;

  // ═══════════════════════════════════════════════════════════════════════════
  // UPS Mode Rationale (if applicable)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!prefs.solar.interested && !prefs.generator.interested) {
    notes.push(
      `⚡ UPS Mode: BESS sized for ${backupHours.toFixed(1)} hours backup without on-site generation`
    );
  }

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
      included: includeSolar && totalSolarKW > 0,
      capacityKW: solarKW,
      carportCapacityKW: carportSolarKW,
      totalCapacityKW: totalSolarKW,
      type: base.solar.type,
      annualProductionKWh: Math.round(
        totalSolarKW * (base.solar.annualProductionKWh / Math.max(1, base.solar.capacityKW))
      ),
      estimatedCost: Math.round(totalSolarCost),
      isRoofConstrained: base.solar.isRoofConstrained || false,
      maxRoofCapacityKW: base.solar.maxRoofCapacityKW || solarKW,
      includesCarport: includeCarport,
    },
    generator: {
      included: generatorKW > 0,
      capacityKW: generatorKW,
      fuelType: generatorFuelType,
    },
    ev: {
      included: includeEV && l2Count + dcfcCount + ultraFastCount > 0,
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
  scales: Record<OptionTier, number>,
  scenario: keyof typeof BESS_UPSIZE_CONFIG
): string {
  const goalDescriptions: Record<EnergyGoal, string> = {
    reduce_costs: "cost optimization",
    backup_power: "backup duration",
    sustainability: "solar coverage",
    grid_independence: "self-sufficiency",
    peak_shaving: "demand reduction",
    generate_revenue: "revenue potential",
  };

  const prioritizedGoals = goals.map((g) => goalDescriptions[g]).filter(Boolean);

  const scenarioDescriptions: Record<keyof typeof BESS_UPSIZE_CONFIG, string> = {
    fullGeneration: "Full on-site generation (solar + generator)",
    solarOnly: "Solar only - BESS upsized for backup",
    generatorOnly: "Generator only - BESS for peak shaving",
    upsMode: "UPS Mode - Grid-connected with extended BESS backup",
  };

  return (
    `Options optimized for ${prioritizedGoals.join(", ")}. ` +
    `Configuration: ${scenarioDescriptions[scenario]}. ` +
    `Scales: Starter ${Math.round(scales.starter * 100)}%, ` +
    `Perfect Fit ${Math.round(scales.perfectFit * 100)}%, ` +
    `Beast Mode ${Math.round(scales.beastMode * 100)}%.`
  );
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
  const standardSizes = [
    50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 750, 1000, 1250, 1500, 2000, 2500,
    3000, 4000, 5000,
  ];

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
    errors.push("Starter BESS should be smaller than Perfect Fit");
  }
  if (proposal.perfectFit.bess.energyKWh >= proposal.beastMode.bess.energyKWh) {
    errors.push("Perfect Fit BESS should be smaller than Beast Mode");
  }

  // Check that costs are properly ordered
  if (proposal.starter.financials.netCost >= proposal.perfectFit.financials.netCost) {
    errors.push("Starter cost should be less than Perfect Fit");
  }
  if (proposal.perfectFit.financials.netCost >= proposal.beastMode.financials.netCost) {
    errors.push("Perfect Fit cost should be less than Beast Mode");
  }

  // Check for negative values
  for (const tier of ["starter", "perfectFit", "beastMode"] as const) {
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
