/**
 * magicFitScenarios.ts
 * 
 * Service for generating Magic Fit™ scenarios - three pre-optimized
 * configurations based on user inputs:
 * 
 * 1. ESSENTIALS - BESS only, fastest payback
 * 2. BALANCED - BESS + Solar + Generator (Merlin's recommendation)
 * 3. MAX SAVINGS - Full stack, maximum long-term savings
 * 
 * Uses SSOT: gridSynkBESSCalculator + compareConfigFinancials
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import { calculateBESS } from './gridSynkBESSCalculator';
import { calculateFinancialsSync } from './compareConfigFinancials';
import type { 
  ScenarioConfig, 
  ScenarioInputs, 
  ScenarioComparison,
  ScenarioType 
} from '@/types/magicFit';

// ============================================================================
// SCENARIO GENERATION
// ============================================================================

/**
 * Generate three Magic Fit™ scenarios based on facility inputs
 * 
 * @param inputs - Peak demand, location, rates, application type
 * @returns Array of three optimized scenario configurations
 */
export function generateMagicFitScenarios(inputs: ScenarioInputs): ScenarioConfig[] {
  const { 
    peakDemandKW, 
    state, 
    electricityRate, 
    demandChargePerKW, 
    primaryApplication 
  } = inputs;
  
  const scenarios: ScenarioConfig[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: ESSENTIALS (BESS Only)
  // Target: Budget-conscious, fastest payback
  // ═══════════════════════════════════════════════════════════════════════════
  
  const essentialsBESS = calculateBESS({
    peakDemandKW,
    durationHours: 4,
    application: 'peak-shaving', // Optimized for demand charge reduction
  });
  
  const essentialsFinancials = calculateFinancialsSync({
    batteryKW: essentialsBESS.batteryKW,
    batteryKWh: essentialsBESS.batteryKWh,
    solarKW: 0,
    windKW: 0,
    generatorKW: 0,
    state,
    electricityRate,
    demandChargePerKW,
  });
  
  scenarios.push({
    type: 'essentials',
    name: 'Essentials',
    tagline: 'BESS Only - Fastest Payback',
    icon: '🛡️',
    isRecommended: false,
    equipment: {
      batteryKW: essentialsBESS.batteryKW,
      batteryKWh: essentialsBESS.batteryKWh,
      durationHours: 4,
      solarKW: 0,
      windKW: 0,
      generatorKW: 0,
    },
    financials: {
      netInvestment: essentialsFinancials.netInvestment,
      annualSavings: essentialsFinancials.annualSavings,
      paybackYears: essentialsFinancials.paybackYears,
      roi25Year: essentialsFinancials.roi25Year,
      backupHours: 4,
    },
    highlights: [
      'Fastest payback period',
      'Lowest upfront investment',
      'Peak shaving savings',
    ],
    reasoning: 'Optimized for fastest ROI through demand charge reduction only.',
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: BALANCED (BESS + Solar + Generator)
  // Target: Best overall ROI, Merlin's recommendation
  // ═══════════════════════════════════════════════════════════════════════════
  
  const balancedBESS = calculateBESS({
    peakDemandKW,
    durationHours: 4,
    application: 'backup', // Sized for backup + peak shaving
  });
  
  const balancedSolarKW = Math.round(peakDemandKW * 0.5);   // 50% of peak
  const balancedGeneratorKW = Math.round(peakDemandKW * 0.27); // ~27% for backup
  
  const balancedFinancials = calculateFinancialsSync({
    batteryKW: balancedBESS.batteryKW,
    batteryKWh: balancedBESS.batteryKWh,
    solarKW: balancedSolarKW,
    windKW: 0,
    generatorKW: balancedGeneratorKW,
    state,
    electricityRate,
    demandChargePerKW,
  });
  
  scenarios.push({
    type: 'balanced',
    name: 'Balanced',
    tagline: 'BESS + Solar - Best ROI',
    icon: '⚖️',
    isRecommended: true, // MERLIN'S PICK
    equipment: {
      batteryKW: balancedBESS.batteryKW,
      batteryKWh: balancedBESS.batteryKWh,
      durationHours: 4,
      solarKW: balancedSolarKW,
      windKW: 0,
      generatorKW: balancedGeneratorKW,
    },
    financials: {
      netInvestment: balancedFinancials.netInvestment,
      annualSavings: balancedFinancials.annualSavings,
      paybackYears: balancedFinancials.paybackYears,
      roi25Year: balancedFinancials.roi25Year,
      backupHours: 4,
    },
    highlights: [
      'Best overall ROI',
      'Solar + backup power',
      "Merlin's recommendation",
    ],
    reasoning: 'Balanced approach maximizing ROI while providing backup power and solar generation.',
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: MAX SAVINGS (Full Stack)
  // Target: Maximum long-term savings, grid independence
  // ═══════════════════════════════════════════════════════════════════════════
  
  const maxBESS = calculateBESS({
    peakDemandKW,
    durationHours: 6, // Longer duration for more independence
    application: 'grid-independence',
  });
  
  const maxSolarKW = Math.round(peakDemandKW * 0.8);     // 80% of peak
  const maxWindKW = Math.round(peakDemandKW * 0.1);      // 10% wind
  const maxGeneratorKW = Math.round(peakDemandKW * 0.36); // 36% for extended backup
  
  const maxFinancials = calculateFinancialsSync({
    batteryKW: maxBESS.batteryKW,
    batteryKWh: maxBESS.batteryKWh,
    solarKW: maxSolarKW,
    windKW: maxWindKW,
    generatorKW: maxGeneratorKW,
    state,
    electricityRate,
    demandChargePerKW,
  });
  
  scenarios.push({
    type: 'max-savings',
    name: 'Maximum Savings',
    tagline: 'Full Stack - Max Long-Term',
    icon: '🚀',
    isRecommended: false,
    equipment: {
      batteryKW: maxBESS.batteryKW,
      batteryKWh: maxBESS.batteryKWh,
      durationHours: 6,
      solarKW: maxSolarKW,
      windKW: maxWindKW,
      generatorKW: maxGeneratorKW,
    },
    financials: {
      netInvestment: maxFinancials.netInvestment,
      annualSavings: maxFinancials.annualSavings,
      paybackYears: maxFinancials.paybackYears,
      roi25Year: maxFinancials.roi25Year,
      backupHours: 6,
    },
    highlights: [
      'Maximum long-term savings',
      'Near grid independence',
      'Full renewable stack',
    ],
    reasoning: 'Maximum savings configuration with full renewable energy stack for long-term ROI.',
  });
  
  return scenarios;
}

// ============================================================================
// SCENARIO COMPARISON HELPERS
// ============================================================================

/**
 * Compare scenarios to determine which wins in each category
 * Used to display badges like "Lowest Cost", "Fastest Payback", etc.
 */
export function getScenarioComparison(scenarios: ScenarioConfig[]): ScenarioComparison {
  const sorted = {
    byCost: [...scenarios].sort((a, b) => 
      a.financials.netInvestment - b.financials.netInvestment
    ),
    byPayback: [...scenarios].sort((a, b) => 
      a.financials.paybackYears - b.financials.paybackYears
    ),
    bySavings: [...scenarios].sort((a, b) => 
      b.financials.annualSavings - a.financials.annualSavings
    ),
    byROI: [...scenarios].sort((a, b) => 
      b.financials.roi25Year - a.financials.roi25Year
    ),
  };
  
  return {
    lowestCost: sorted.byCost[0].type,
    fastestPayback: sorted.byPayback[0].type,
    highestSavings: sorted.bySavings[0].type,
    bestROI: sorted.byROI[0].type,
  };
}

/**
 * Get a single scenario by type
 */
export function getScenarioByType(
  scenarios: ScenarioConfig[], 
  type: ScenarioType
): ScenarioConfig | undefined {
  return scenarios.find(s => s.type === type);
}

/**
 * Get the recommended scenario (always "balanced")
 */
export function getRecommendedScenario(scenarios: ScenarioConfig[]): ScenarioConfig {
  return scenarios.find(s => s.isRecommended) || scenarios[1]; // Default to balanced
}

// ============================================================================
// SCENARIO SIZING RATIOS (from spec)
// ============================================================================

export const SCENARIO_SIZING_RATIOS = {
  essentials: {
    bessRatio: 0.40,        // 40% of peak demand
    duration: 4,            // 4-hour system
    solarRatio: 0,          // No solar
    windRatio: 0,           // No wind
    generatorRatio: 0,      // No generator
    target: 'budget',
  },
  balanced: {
    bessRatio: 0.70,        // 70% of peak demand
    duration: 4,            // 4-hour system
    solarRatio: 0.50,       // 50% of peak
    windRatio: 0,           // No wind
    generatorRatio: 0.27,   // 27% for backup
    target: 'roi',
  },
  'max-savings': {
    bessRatio: 1.00,        // 100% of peak demand
    duration: 6,            // 6-hour system
    solarRatio: 0.80,       // 80% of peak
    windRatio: 0.10,        // 10% wind
    generatorRatio: 0.36,   // 36% for extended backup
    target: 'savings',
  },
} as const;

/**
 * Get human-readable scenario description
 */
export function getScenarioDescription(type: ScenarioType): string {
  const descriptions: Record<ScenarioType, string> = {
    'essentials': 'Battery storage only, optimized for fastest return on investment through peak shaving.',
    'balanced': 'Comprehensive solution with battery, solar, and backup generator for optimal ROI.',
    'max-savings': 'Full renewable energy stack designed for maximum long-term savings and grid independence.',
  };
  return descriptions[type];
}
