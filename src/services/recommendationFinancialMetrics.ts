/**
 * RECOMMENDATION FINANCIAL METRICS
 * ================================
 *
 * Calculates financial metrics (conservative and aggressive scenarios)
 * for opportunity recommendations in Step 3 Modal.
 *
 * Uses real-time calculations based on user inputs.
 */

import { calculateFinancialMetrics, type FinancialCalculationInput } from "./centralizedCalculations";
import { calculateDatabaseBaseline } from "./baselineService";
import type { RecommendationEngineInput, OpportunityRecommendation } from "./recommendationEngine";

export interface FinancialMetrics {
  conservative: {
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    npv?: number;
    initialInvestment: number;
  };
  aggressive: {
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    npv?: number;
    initialInvestment: number;
  };
}

export interface OpportunityFinancialMetrics {
  solar?: FinancialMetrics;
  generator?: FinancialMetrics;
  evCharging?: FinancialMetrics;
  bess?: FinancialMetrics; // Always included with other options
}

/**
 * Calculate financial metrics for all recommended opportunities
 */
export async function calculateRecommendationFinancials(
  input: RecommendationEngineInput,
  recommendations: OpportunityRecommendation
): Promise<OpportunityFinancialMetrics> {
  const results: OpportunityFinancialMetrics = {};

  // Get baseline calculation first
  const baseline = await calculateDatabaseBaseline(
    input.industry,
    1, // scale
    input.useCaseData
  );

  // Calculate BESS financials (always included)
  if (
    recommendations.solar.recommended ||
    recommendations.generator.recommended ||
    recommendations.evCharging.recommended
  ) {
    results.bess = await calculateBESSFinancials(input, baseline);
  }

  // Calculate Solar financials
  if (recommendations.solar.recommended && recommendations.solar.estimatedCapacityKW) {
    results.solar = await calculateSolarFinancials(
      input,
      baseline,
      recommendations.solar.estimatedCapacityKW
    );
  }

  // Calculate Generator financials
  if (recommendations.generator.recommended && recommendations.generator.estimatedCapacityKW) {
    results.generator = await calculateGeneratorFinancials(
      input,
      baseline,
      recommendations.generator.estimatedCapacityKW
    );
  }

  // Calculate EV Charging financials
  if (recommendations.evCharging.recommended && recommendations.evCharging.estimatedLoadKW) {
    results.evCharging = await calculateEVChargingFinancials(
      input,
      baseline,
      recommendations.evCharging.estimatedLoadKW
    );
  }

  return results;
}

/**
 * Calculate BESS financial metrics (conservative and aggressive)
 */
async function calculateBESSFinancials(
  input: RecommendationEngineInput,
  baseline: any
): Promise<FinancialMetrics> {
  const baseInput: FinancialCalculationInput = {
    storageSizeMW: baseline.powerMW || 0.5,
    durationHours: baseline.durationHrs || 4,
    electricityRate: input.electricityRate,
    location: input.state,
  };

  // Conservative scenario (pessimistic)
  const conservativeInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 0.85, // 15% lower rates
    priceEscalationRate: 0.01, // Lower escalation
  };

  // Aggressive scenario (optimistic)
  const aggressiveInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 1.2, // 20% higher rates
    priceEscalationRate: 0.03, // Higher escalation
  };

  const [conservative, aggressive] = await Promise.all([
    calculateFinancialMetrics(conservativeInput),
    calculateFinancialMetrics(aggressiveInput),
  ]);

  return {
    conservative: {
      annualSavings: conservative.annualSavings,
      paybackYears: conservative.paybackYears,
      roi10Year: conservative.roi10Year,
      roi25Year: conservative.roi25Year,
      npv: conservative.npv,
      initialInvestment: conservative.totalProjectCost,
    },
    aggressive: {
      annualSavings: aggressive.annualSavings,
      paybackYears: aggressive.paybackYears,
      roi10Year: aggressive.roi10Year,
      roi25Year: aggressive.roi25Year,
      npv: aggressive.npv,
      initialInvestment: aggressive.totalProjectCost,
    },
  };
}

/**
 * Calculate Solar financial metrics
 */
async function calculateSolarFinancials(
  input: RecommendationEngineInput,
  baseline: any,
  solarCapacityKW: number
): Promise<FinancialMetrics> {
  const solarMW = solarCapacityKW / 1000;

  const baseInput: FinancialCalculationInput = {
    storageSizeMW: baseline.powerMW || 0.5,
    durationHours: baseline.durationHrs || 4,
    solarMW,
    electricityRate: input.electricityRate,
    location: input.state,
  };

  // Conservative scenario
  const conservativeInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 0.85,
    solarMW: solarMW * 0.9, // 10% lower production
    priceEscalationRate: 0.01,
  };

  // Aggressive scenario
  const aggressiveInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 1.2,
    solarMW: solarMW * 1.1, // 10% higher production
    priceEscalationRate: 0.03,
  };

  const [conservative, aggressive] = await Promise.all([
    calculateFinancialMetrics(conservativeInput),
    calculateFinancialMetrics(aggressiveInput),
  ]);

  return {
    conservative: {
      annualSavings: conservative.annualSavings,
      paybackYears: conservative.paybackYears,
      roi10Year: conservative.roi10Year,
      roi25Year: conservative.roi25Year,
      npv: conservative.npv,
      initialInvestment: conservative.totalProjectCost,
    },
    aggressive: {
      annualSavings: aggressive.annualSavings,
      paybackYears: aggressive.paybackYears,
      roi10Year: aggressive.roi10Year,
      roi25Year: aggressive.roi25Year,
      npv: aggressive.npv,
      initialInvestment: aggressive.totalProjectCost,
    },
  };
}

/**
 * Calculate Generator financial metrics
 */
async function calculateGeneratorFinancials(
  input: RecommendationEngineInput,
  baseline: any,
  generatorCapacityKW: number
): Promise<FinancialMetrics> {
  const generatorMW = generatorCapacityKW / 1000;

  const baseInput: FinancialCalculationInput = {
    storageSizeMW: baseline.powerMW || 0.5,
    durationHours: baseline.durationHrs || 4,
    generatorMW,
    electricityRate: input.electricityRate,
    location: input.state,
  };

  // Conservative scenario (lower fuel costs, more usage)
  const conservativeInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 0.85,
    priceEscalationRate: 0.01,
  };

  // Aggressive scenario (higher grid rates = more generator value)
  const aggressiveInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 1.2,
    priceEscalationRate: 0.03,
  };

  const [conservative, aggressive] = await Promise.all([
    calculateFinancialMetrics(conservativeInput),
    calculateFinancialMetrics(aggressiveInput),
  ]);

  return {
    conservative: {
      annualSavings: conservative.annualSavings,
      paybackYears: conservative.paybackYears,
      roi10Year: conservative.roi10Year,
      roi25Year: conservative.roi25Year,
      npv: conservative.npv,
      initialInvestment: conservative.totalProjectCost,
    },
    aggressive: {
      annualSavings: aggressive.annualSavings,
      paybackYears: aggressive.paybackYears,
      roi10Year: aggressive.roi10Year,
      roi25Year: aggressive.roi25Year,
      npv: aggressive.npv,
      initialInvestment: aggressive.totalProjectCost,
    },
  };
}

/**
 * Calculate EV Charging financial metrics
 */
async function calculateEVChargingFinancials(
  input: RecommendationEngineInput,
  baseline: any,
  evLoadKW: number
): Promise<FinancialMetrics> {
  // EV charging savings come from demand charge management and arbitrage
  // This is a simplified calculation - real implementation would use EV-specific calculations

  const baseInput: FinancialCalculationInput = {
    storageSizeMW: baseline.powerMW || 0.5,
    durationHours: baseline.durationHrs || 4,
    electricityRate: input.electricityRate,
    location: input.state,
  };

  // Conservative scenario
  const conservativeInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 0.85,
    priceEscalationRate: 0.01,
  };

  // Aggressive scenario
  const aggressiveInput: FinancialCalculationInput = {
    ...baseInput,
    electricityRate: baseInput.electricityRate * 1.2,
    priceEscalationRate: 0.03,
  };

  const [conservative, aggressive] = await Promise.all([
    calculateFinancialMetrics(conservativeInput),
    calculateFinancialMetrics(aggressiveInput),
  ]);

  // Adjust for EV charging specific savings (demand charge management)
  const evSavingsMultiplier = 1.2; // EV charging provides additional savings through peak shaving

  return {
    conservative: {
      annualSavings: conservative.annualSavings * evSavingsMultiplier,
      paybackYears: conservative.paybackYears * 0.9, // Slightly better payback
      roi10Year: conservative.roi10Year * 1.1,
      roi25Year: conservative.roi25Year * 1.1,
      npv: conservative.npv ? conservative.npv * 1.1 : undefined,
      initialInvestment: conservative.totalProjectCost,
    },
    aggressive: {
      annualSavings: aggressive.annualSavings * evSavingsMultiplier,
      paybackYears: aggressive.paybackYears * 0.85,
      roi10Year: aggressive.roi10Year * 1.15,
      roi25Year: aggressive.roi25Year * 1.15,
      npv: aggressive.npv ? aggressive.npv * 1.15 : undefined,
      initialInvestment: aggressive.totalProjectCost,
    },
  };
}
