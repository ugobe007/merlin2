/**
 * SCENARIO GENERATOR SERVICE
 * ===========================
 *
 * Generates 3 configuration scenarios for BESS projects:
 * 1. Savings Optimized - Best ROI, minimal investment
 * 2. Balanced (Recommended) - Optimal balance of savings and resilience
 * 3. Resilient - Maximum value, longer backup, more solar
 *
 * Each scenario is a complete configuration with pricing and financials.
 *
 * Created: Dec 2025 - Phase 3 of Optimizer implementation
 */

import { calculateQuote, type QuoteResult } from "./unifiedQuoteCalculator";
// ⚠️ NOTE: calculateArbitrageSavings was removed from constants.ts (SSOT violation)
// This file is legacy/experimental and may need refactoring to use TrueQuote results
import {
  getIndustryBESSRatio,
  getIndustryLoadProfile,
  getRegionalTOUSchedule,
} from "@/components/wizard/v6/constants";

// ============================================
// TYPES
// ============================================

export type ScenarioType = "savings" | "balanced" | "resilient";

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  tagline: string;
  icon: string;
  color: string;

  // Equipment sizing
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  solarKW: number;
  generatorKW: number;

  // Calculated results
  quoteResult: QuoteResult | null;

  // Key metrics for display
  totalCost: number;
  netCost: number; // After incentives
  annualSavings: number;
  paybackYears: number;
  roi25Year: number;
  backupHours: number;

  // Confidence and notes
  confidenceScore: number; // 0-100
  highlights: string[]; // Key selling points
  tradeoffs: string[]; // What you give up
}

export interface ScenarioGeneratorInput {
  // Facility
  peakDemandKW: number;
  dailyKWh: number;
  industryType: string;

  // Location
  state: string;
  electricityRate: number;

  // User preferences
  goals: string[]; // ['cost-savings', 'backup-power', etc.]
  wantsSolar: boolean;
  wantsGenerator: boolean;

  // Grid status
  gridConnection: "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive";
}

export interface ScenarioGeneratorResult {
  scenarios: ScenarioConfig[];
  recommendedIndex: number; // Which scenario is best for this user
  recommendationReason: string;
  generatedAt: string;
}

// ============================================
// SCENARIO MULTIPLIERS
// ============================================

/**
 * Multipliers for each scenario type
 * Applied to the base industry BESS ratio
 */
const SCENARIO_MULTIPLIERS = {
  savings: {
    bessRatioMultiplier: 0.8, // 80% of standard - smaller system, faster payback
    durationMultiplier: 0.75, // 3hr instead of 4hr
    solarMultiplier: 0.5, // Less solar, focus on BESS ROI
    generatorMultiplier: 0, // No generator
  },
  balanced: {
    bessRatioMultiplier: 1.0, // Standard sizing
    durationMultiplier: 1.0, // 4hr standard
    solarMultiplier: 0.8, // Moderate solar if wanted
    generatorMultiplier: 0.5, // Half-size backup generator
  },
  resilient: {
    bessRatioMultiplier: 1.3, // 130% - larger system for more coverage
    durationMultiplier: 1.5, // 6hr extended backup
    solarMultiplier: 1.2, // More solar for energy independence
    generatorMultiplier: 1.0, // Full backup generator
  },
};

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

/**
 * Generate 3 configuration scenarios based on facility data and user preferences
 */
export async function generateScenarios(
  input: ScenarioGeneratorInput
): Promise<ScenarioGeneratorResult> {
  console.log("🎯 [ScenarioGenerator] Generating 3 scenarios for:", input.industryType);

  // Get industry-specific parameters
  const baseRatio = getIndustryBESSRatio(input.industryType);
  const loadProfile = getIndustryLoadProfile(input.industryType);
  const _touSchedule = getRegionalTOUSchedule(input.state);
  void _touSchedule; // Explicitly mark as intentionally unused

  // ⚠️ LEGACY: Calculate arbitrage potential (simplified, non-SSOT)
  // This is a placeholder for legacy scenario generation.
  // For WizardV6, use TrueQuote results instead.
  const rateSpread = input.electricityRate * 0.3; // Assume 30% spread between peak/off-peak
  const annualSavings = input.dailyKWh * rateSpread * 365;
  const arbitrageResult = {
    annualSavings,
    touOverlapScore: 0.6, // Default TOU overlap score
  };

  console.log("📊 [ScenarioGenerator] Base parameters:", {
    peakDemandKW: input.peakDemandKW,
    dailyKWh: input.dailyKWh,
    baseRatio,
    loadProfile: loadProfile.peakLoadFactor,
    touOverlap: arbitrageResult.touOverlapScore,
  });

  // Generate all 3 scenarios
  const scenarios: ScenarioConfig[] = await Promise.all([
    generateSingleScenario(input, "savings", baseRatio, arbitrageResult),
    generateSingleScenario(input, "balanced", baseRatio, arbitrageResult),
    generateSingleScenario(input, "resilient", baseRatio, arbitrageResult),
  ]);

  // Determine which scenario to recommend based on user goals
  const { recommendedIndex, reason } = determineRecommendation(scenarios, input.goals);

  return {
    scenarios,
    recommendedIndex,
    recommendationReason: reason,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// SINGLE SCENARIO GENERATOR
// ============================================

async function generateSingleScenario(
  input: ScenarioGeneratorInput,
  type: ScenarioType,
  baseRatio: number,
  _arbitrageResult: { annualSavings: number; touOverlapScore: number }
): Promise<ScenarioConfig> {
  void _arbitrageResult; // Explicitly mark as intentionally unused
  const multipliers = SCENARIO_MULTIPLIERS[type];
  const metadata = getScenarioMetadata(type);

  // Calculate equipment sizes
  const bessRatio = baseRatio * multipliers.bessRatioMultiplier;
  const batteryKW = Math.round(input.peakDemandKW * bessRatio);
  const baseDuration = 4; // Standard 4-hour duration
  const durationHours = Math.round(baseDuration * multipliers.durationMultiplier);
  const batteryKWh = batteryKW * durationHours;

  // Solar sizing (if user wants it)
  let solarKW = 0;
  if (input.wantsSolar) {
    // Base solar at 60% of peak demand, adjusted by scenario
    solarKW = Math.round(input.peakDemandKW * 0.6 * multipliers.solarMultiplier);
  }

  // Generator sizing (if user wants it)
  let generatorKW = 0;
  if (input.wantsGenerator) {
    // Base generator at 50% of peak (critical loads)
    generatorKW = Math.round(input.peakDemandKW * 0.5 * multipliers.generatorMultiplier);
  }

  // Generate quote using SSOT
  let quoteResult: QuoteResult | null = null;
  try {
    quoteResult = await calculateQuote({
      storageSizeMW: Math.max(0.05, batteryKW / 1000),
      durationHours,
      location: input.state,
      electricityRate: input.electricityRate,
      useCase: input.industryType,
      solarMW: solarKW / 1000,
      generatorMW: generatorKW / 1000,
      generatorFuelType: "natural-gas",
      gridConnection: input.gridConnection,
    });
  } catch (error) {
    console.error(`[ScenarioGenerator] Failed to generate quote for ${type}:`, error);
  }

  // Extract key metrics
  const totalCost = quoteResult?.costs?.totalProjectCost || 0;
  const netCost = quoteResult?.costs?.netCost || totalCost * 0.7; // Assume 30% ITC
  const annualSavings = quoteResult?.financials?.annualSavings || 0;
  const paybackYears = quoteResult?.financials?.paybackYears || 0;
  const roi25Year = quoteResult?.financials?.roi25Year || 0;

  // Calculate backup hours (how long can BESS run critical loads)
  const criticalLoadKW = input.peakDemandKW * 0.5; // 50% is critical
  const backupHours = Math.round((batteryKWh / criticalLoadKW) * 10) / 10;

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(input, quoteResult);

  // Generate highlights and tradeoffs
  const { highlights, tradeoffs } = generateHighlightsAndTradeoffs(
    type,
    { batteryKW, batteryKWh, solarKW, generatorKW, durationHours },
    { totalCost, annualSavings, paybackYears, backupHours }
  );

  return {
    type,
    name: metadata.name,
    tagline: metadata.tagline,
    icon: metadata.icon,
    color: metadata.color,

    batteryKW,
    batteryKWh,
    durationHours,
    solarKW,
    generatorKW,

    quoteResult,

    totalCost,
    netCost,
    annualSavings,
    paybackYears,
    roi25Year,
    backupHours,

    confidenceScore,
    highlights,
    tradeoffs,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getScenarioMetadata(type: ScenarioType): {
  name: string;
  tagline: string;
  icon: string;
  color: string;
} {
  switch (type) {
    case "savings":
      return {
        name: "Savings Optimized",
        tagline: "Best ROI, fastest payback",
        icon: "💰",
        color: "emerald",
      };
    case "balanced":
      return {
        name: "Balanced",
        tagline: "Recommended for most businesses",
        icon: "⚡",
        color: "blue",
      };
    case "resilient":
      return {
        name: "Maximum Resilience",
        tagline: "Full protection, maximum value",
        icon: "🛡️",
        color: "purple",
      };
  }
}

function determineRecommendation(
  scenarios: ScenarioConfig[],
  goals: string[]
): { recommendedIndex: number; reason: string } {
  // Default to balanced (index 1)
  let recommendedIndex = 1;
  let reason = "Best balance of savings and reliability for your business";

  // Check user priorities
  const wantsCostSavings = goals.includes("cost-savings") || goals.includes("demand-management");
  const wantsBackup = goals.includes("backup-power") || goals.includes("grid-independence");
  const wantsSustainability = goals.includes("sustainability");

  if (wantsBackup && !wantsCostSavings) {
    // Prioritize resilience
    recommendedIndex = 2;
    reason = "Maximum protection based on your backup power priority";
  } else if (wantsCostSavings && !wantsBackup) {
    // Prioritize savings
    recommendedIndex = 0;
    reason = "Fastest payback based on your cost savings priority";
  } else if (wantsSustainability) {
    // Sustainability = more solar = resilient option
    recommendedIndex = 2;
    reason = "Maximum solar coverage for your sustainability goals";
  }

  // Override if one scenario has dramatically better payback
  const savingsPayback = scenarios[0].paybackYears;
  const balancedPayback = scenarios[1].paybackYears;

  if (savingsPayback > 0 && savingsPayback < balancedPayback * 0.7) {
    // Savings option is 30%+ faster payback
    recommendedIndex = 0;
    reason = `${Math.round((1 - savingsPayback / balancedPayback) * 100)}% faster payback with optimized sizing`;
  }

  return { recommendedIndex, reason };
}

function calculateConfidenceScore(
  input: ScenarioGeneratorInput,
  quoteResult: QuoteResult | null
): number {
  let score = 70; // Base confidence

  // Add points for having data
  if (input.dailyKWh > 0) score += 10;
  if (input.electricityRate > 0) score += 5;
  if (quoteResult?.financials?.annualSavings) score += 10;

  // Subtract for missing data
  if (!input.dailyKWh) score -= 15;

  return Math.min(95, Math.max(50, score));
}

function generateHighlightsAndTradeoffs(
  type: ScenarioType,
  equipment: {
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
    generatorKW: number;
    durationHours: number;
  },
  metrics: {
    totalCost: number;
    annualSavings: number;
    paybackYears: number;
    backupHours: number;
  }
): { highlights: string[]; tradeoffs: string[] } {
  const highlights: string[] = [];
  const tradeoffs: string[] = [];

  switch (type) {
    case "savings":
      highlights.push(`${metrics.paybackYears.toFixed(1)} year payback`);
      highlights.push("Lowest upfront investment");
      highlights.push("Focused on demand charge reduction");
      tradeoffs.push(`${equipment.durationHours}hr backup (shorter)`);
      tradeoffs.push("Minimal solar included");
      if (equipment.generatorKW === 0) tradeoffs.push("No backup generator");
      break;

    case "balanced":
      highlights.push("Best value for most businesses");
      highlights.push(`${metrics.backupHours}hr backup coverage`);
      highlights.push("Peak shaving + arbitrage");
      if (equipment.solarKW > 0) highlights.push(`${equipment.solarKW} kW solar included`);
      tradeoffs.push("Moderate upfront investment");
      break;

    case "resilient":
      highlights.push(`${metrics.backupHours}hr extended backup`);
      highlights.push("Maximum solar + storage");
      highlights.push("Full critical load coverage");
      if (equipment.generatorKW > 0) highlights.push("Backup generator included");
      tradeoffs.push("Higher upfront cost");
      tradeoffs.push("Longer payback period");
      break;
  }

  return { highlights, tradeoffs };
}

// ============================================
// UTILITY EXPORTS
// ============================================

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

export function formatPower(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${kw} kW`;
}

export function formatEnergy(kwh: number): string {
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(1)} MWh`;
  }
  return `${kwh} kWh`;
}
