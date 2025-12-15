/**
 * SCENARIO GENERATOR SERVICE
 * ==========================
 * 
 * Generates 3 configuration scenarios based on user inputs:
 * 1. SAVINGS - Best ROI, minimal investment
 * 2. BALANCED - Recommended, optimal value
 * 3. RESILIENT - Maximum capability, premium value
 * 
 * Each scenario varies:
 * - BESS size (kW/kWh)
 * - Solar integration
 * - Generator backup
 * - Duration hours
 * 
 * Uses industry load profiles and regional TOU schedules for accuracy.
 * 
 * December 2025
 */

import { calculateQuote, type QuoteResult } from './unifiedQuoteCalculator';
import { 
  getIndustryBESSRatio, 
  getIndustryLoadProfile,
  getRegionalTOUSchedule,
  calculateArbitrageSavings,
  type IndustryLoadProfile,
  type TOUSchedule,
} from '@/components/wizard/constants/wizardConstants';

// ============================================
// TYPES
// ============================================

export type ScenarioType = 'savings' | 'balanced' | 'resilient';

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  tagline: string;
  icon: string;
  bessMultiplier: number;      // Multiplier vs base BESS sizing
  durationHours: number;       // Battery duration
  includeSolar: boolean;       // Whether to include solar
  solarMultiplier: number;     // Solar size vs BESS size
  includeGenerator: boolean;   // Backup generator
  generatorMultiplier: number; // Generator size vs critical load
  priorityFocus: 'roi' | 'value' | 'capability';
}

export interface GeneratedScenario {
  type: ScenarioType;
  name: string;
  tagline: string;
  icon: string;
  isRecommended: boolean;
  
  // Configuration
  config: {
    bessKW: number;
    bessKWh: number;
    solarKW: number;
    generatorKW: number;
    durationHours: number;
  };
  
  // Costs
  costs: {
    totalProjectCost: number;
    netCost: number;          // After ITC
    taxCredit: number;
    equipmentCost: number;
    installationCost: number;
  };
  
  // Financial Metrics
  financials: {
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    npv?: number;
    irr?: number;
  };
  
  // Value Propositions
  benefits: string[];
  
  // Confidence & Sources
  confidence: number;         // 0-100
  confidenceReason: string;
}

export interface ScenarioGeneratorInput {
  // Facility
  peakDemandKW: number;
  industryType: string;
  state: string;
  electricityRate: number;
  
  // User Preferences
  goals: string[];            // 'cost-savings', 'backup-power', 'sustainability', etc.
  wantsSolar: boolean;
  wantsGenerator: boolean;
  
  // Optional overrides
  monthlyBill?: number;       // If user provided actual bill
  dailyKWh?: number;          // If we have actual consumption
}

export interface ScenarioGeneratorOutput {
  scenarios: GeneratedScenario[];
  recommendedIndex: number;   // Which scenario is recommended (0-2)
  inputSummary: {
    peakDemandKW: number;
    industryType: string;
    state: string;
    loadProfile: IndustryLoadProfile;
    touSchedule: TOUSchedule;
  };
  generatedAt: string;
}

// ============================================
// SCENARIO CONFIGURATIONS
// ============================================

const SCENARIO_CONFIGS: Record<ScenarioType, ScenarioConfig> = {
  savings: {
    type: 'savings',
    name: 'Cost Saver',
    tagline: 'Best ROI, minimal investment',
    icon: '💰',
    bessMultiplier: 0.75,       // 75% of recommended BESS
    durationHours: 2,           // Shorter duration for pure peak shaving
    includeSolar: false,        // No solar for pure savings focus
    solarMultiplier: 0,
    includeGenerator: false,
    generatorMultiplier: 0,
    priorityFocus: 'roi',
  },
  balanced: {
    type: 'balanced',
    name: 'Balanced',
    tagline: 'Recommended for most businesses',
    icon: '⚡',
    bessMultiplier: 1.0,        // 100% of recommended BESS
    durationHours: 4,           // Standard 4-hour duration
    includeSolar: true,         // Include solar if user wants
    solarMultiplier: 0.6,       // 60% of peak demand
    includeGenerator: false,
    generatorMultiplier: 0,
    priorityFocus: 'value',
  },
  resilient: {
    type: 'resilient',
    name: 'Resilient',
    tagline: 'Maximum backup & capability',
    icon: '🛡️',
    bessMultiplier: 1.4,        // 140% of recommended BESS
    durationHours: 6,           // Extended backup duration
    includeSolar: true,
    solarMultiplier: 0.8,       // Larger solar array
    includeGenerator: true,     // Include backup generator
    generatorMultiplier: 0.5,   // 50% of peak for critical load
    priorityFocus: 'capability',
  },
};

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

/**
 * Generate 3 configuration scenarios based on user inputs
 */
export async function generateScenarios(
  input: ScenarioGeneratorInput
): Promise<ScenarioGeneratorOutput> {
  const { peakDemandKW, industryType, state, electricityRate, goals, wantsSolar, wantsGenerator } = input;
  
  // Get industry-specific data
  const industryBESSRatio = getIndustryBESSRatio(industryType);
  const loadProfile = getIndustryLoadProfile(industryType);
  const touSchedule = getRegionalTOUSchedule(state);
  
  // Calculate base BESS size using industry-specific ratio
  const baseBESSKW = Math.round(peakDemandKW * industryBESSRatio);
  
  // Calculate daily energy (estimated from peak)
  const dailyKWh = input.dailyKWh || Math.round(peakDemandKW * 24 * 0.4); // 40% avg load factor
  
  // Generate each scenario
  const scenarioPromises = Object.values(SCENARIO_CONFIGS).map(async (config) => {
    return generateSingleScenario(config, {
      baseBESSKW,
      peakDemandKW,
      dailyKWh,
      industryType,
      state,
      electricityRate,
      goals,
      wantsSolar,
      wantsGenerator,
      loadProfile,
      touSchedule,
    });
  });
  
  const scenarios = await Promise.all(scenarioPromises);
  
  // Determine recommended scenario based on user goals
  const recommendedIndex = determineRecommendedScenario(scenarios, goals);
  scenarios[recommendedIndex].isRecommended = true;
  
  return {
    scenarios,
    recommendedIndex,
    inputSummary: {
      peakDemandKW,
      industryType,
      state,
      loadProfile,
      touSchedule,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// SINGLE SCENARIO GENERATOR
// ============================================

interface SingleScenarioInput {
  baseBESSKW: number;
  peakDemandKW: number;
  dailyKWh: number;
  industryType: string;
  state: string;
  electricityRate: number;
  goals: string[];
  wantsSolar: boolean;
  wantsGenerator: boolean;
  loadProfile: IndustryLoadProfile;
  touSchedule: TOUSchedule;
}

async function generateSingleScenario(
  config: ScenarioConfig,
  input: SingleScenarioInput
): Promise<GeneratedScenario> {
  const {
    baseBESSKW,
    peakDemandKW,
    dailyKWh,
    industryType,
    state,
    electricityRate,
    goals,
    wantsSolar,
    wantsGenerator,
    loadProfile,
    touSchedule,
  } = input;
  
  // Calculate scenario-specific sizing
  const bessKW = Math.round(baseBESSKW * config.bessMultiplier);
  const bessKWh = bessKW * config.durationHours;
  
  // Solar: Only if user wants it AND scenario includes it
  const includeSolar = wantsSolar && config.includeSolar;
  const solarKW = includeSolar ? Math.round(peakDemandKW * config.solarMultiplier) : 0;
  
  // Generator: Only if user wants it OR scenario requires it (resilient)
  const includeGenerator = (wantsGenerator || config.includeGenerator) && config.type === 'resilient';
  const generatorKW = includeGenerator ? Math.round(peakDemandKW * config.generatorMultiplier) : 0;
  
  // Generate quote using SSOT
  let quoteResult: QuoteResult | null = null;
  try {
    quoteResult = await calculateQuote({
      storageSizeMW: bessKW / 1000,
      durationHours: config.durationHours,
      location: state,
      electricityRate,
      useCase: industryType,
      solarMW: solarKW / 1000,
      generatorMW: generatorKW / 1000,
      generatorFuelType: 'natural-gas',
      gridConnection: 'on-grid',
    });
  } catch (error) {
    console.error(`[ScenarioGenerator] Failed to calculate quote for ${config.type}:`, error);
  }
  
  // Extract costs from quote result or estimate
  const totalProjectCost = quoteResult?.costs.totalProjectCost || estimateCost(bessKWh, solarKW, generatorKW);
  const taxCredit = quoteResult?.costs.taxCredit || Math.round(totalProjectCost * 0.30);
  const netCost = quoteResult?.costs.netCost || totalProjectCost - taxCredit;
  const equipmentCost = quoteResult?.costs.equipmentCost || Math.round(totalProjectCost * 0.80);
  const installationCost = quoteResult?.costs.installationCost || Math.round(totalProjectCost * 0.20);
  
  // Calculate arbitrage savings using new function
  const arbitrageData = calculateArbitrageSavings(dailyKWh, industryType, state, electricityRate);
  
  // Financial metrics
  const annualSavings = quoteResult?.financials.annualSavings || calculateEstimatedSavings(
    bessKW, 
    solarKW, 
    electricityRate, 
    arbitrageData.monthlySavings
  );
  const paybackYears = quoteResult?.financials.paybackYears || (netCost / annualSavings);
  const roi10Year = quoteResult?.financials.roi10Year || ((annualSavings * 10 - netCost) / netCost * 100);
  const roi25Year = quoteResult?.financials.roi25Year || ((annualSavings * 25 - netCost) / netCost * 100);
  
  // Generate benefits based on scenario type
  const benefits = generateBenefits(config, {
    annualSavings,
    paybackYears,
    bessKWh,
    solarKW,
    generatorKW,
    loadProfile,
    touSchedule,
    arbitrageData,
  });
  
  // Calculate confidence score
  const { confidence, reason } = calculateConfidence(input, config, quoteResult !== null);
  
  return {
    type: config.type,
    name: config.name,
    tagline: config.tagline,
    icon: config.icon,
    isRecommended: false, // Set later in main function
    
    config: {
      bessKW,
      bessKWh,
      solarKW,
      generatorKW,
      durationHours: config.durationHours,
    },
    
    costs: {
      totalProjectCost,
      netCost,
      taxCredit,
      equipmentCost,
      installationCost,
    },
    
    financials: {
      annualSavings,
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi10Year: Math.round(roi10Year),
      roi25Year: Math.round(roi25Year),
      npv: quoteResult?.financials.npv,
      irr: quoteResult?.financials.irr,
    },
    
    benefits,
    confidence,
    confidenceReason: reason,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Estimate cost when quote calculation fails
 */
function estimateCost(bessKWh: number, solarKW: number, generatorKW: number): number {
  // BESS: $125/kWh (Dec 2025 market)
  const bessCost = bessKWh * 125;
  // Solar: $0.85/W commercial
  const solarCost = solarKW * 850;
  // Generator: $700/kW natural gas
  const generatorCost = generatorKW * 700;
  // Installation: 20% of equipment
  const installationCost = (bessCost + solarCost + generatorCost) * 0.20;
  
  return Math.round(bessCost + solarCost + generatorCost + installationCost);
}

/**
 * Estimate annual savings when quote calculation fails
 */
function calculateEstimatedSavings(
  bessKW: number,
  solarKW: number,
  electricityRate: number,
  monthlyArbitrage: number
): number {
  // Demand charge savings: BESS kW × $15/kW × 12 months
  const demandSavings = bessKW * 15 * 12;
  // Arbitrage savings: from TOU calculation
  const arbitrageSavings = monthlyArbitrage * 12;
  // Solar savings: kW × 5 peak hours × 365 × rate × 0.25 (self-consumption factor)
  const solarSavings = solarKW * 5 * 365 * electricityRate * 0.25;
  
  return Math.round(demandSavings + arbitrageSavings + solarSavings);
}

/**
 * Generate benefit statements for a scenario
 */
function generateBenefits(
  config: ScenarioConfig,
  data: {
    annualSavings: number;
    paybackYears: number;
    bessKWh: number;
    solarKW: number;
    generatorKW: number;
    loadProfile: IndustryLoadProfile;
    touSchedule: TOUSchedule;
    arbitrageData: ReturnType<typeof calculateArbitrageSavings>;
  }
): string[] {
  const benefits: string[] = [];
  
  switch (config.type) {
    case 'savings':
      benefits.push(`Fastest payback at ${data.paybackYears.toFixed(1)} years`);
      benefits.push(`Save $${Math.round(data.annualSavings / 1000)}K+ per year on demand charges`);
      benefits.push('Lowest upfront investment');
      benefits.push('Pure peak shaving focus');
      break;
      
    case 'balanced':
      benefits.push('Optimal balance of cost and capability');
      benefits.push(`${data.bessKWh} kWh covers 4 hours of backup`);
      if (data.solarKW > 0) {
        benefits.push(`${data.solarKW} kW solar reduces grid dependence`);
      }
      benefits.push(`${Math.round(data.arbitrageData.touOverlapScore * 100)}% TOU rate optimization`);
      break;
      
    case 'resilient':
      benefits.push(`Extended ${config.durationHours}-hour backup capability`);
      benefits.push(`${data.bessKWh} kWh handles extended outages`);
      if (data.generatorKW > 0) {
        benefits.push(`${data.generatorKW} kW generator for unlimited runtime`);
      }
      benefits.push('Maximum energy independence');
      break;
  }
  
  return benefits;
}

/**
 * Determine which scenario to recommend based on user goals
 */
function determineRecommendedScenario(
  scenarios: GeneratedScenario[],
  goals: string[]
): number {
  // Default to balanced (index 1)
  let recommendedIndex = 1;
  
  // Check for specific goal priorities
  if (goals.includes('backup-power') || goals.includes('grid-independence')) {
    // Prioritize resilience
    recommendedIndex = 2;
  } else if (goals.includes('cost-savings') && !goals.includes('sustainability')) {
    // Pure cost focus - check if savings scenario has significantly better ROI
    const savingsPayback = scenarios[0].financials.paybackYears;
    const balancedPayback = scenarios[1].financials.paybackYears;
    
    // Only recommend savings if payback is 20%+ faster
    if (savingsPayback < balancedPayback * 0.8) {
      recommendedIndex = 0;
    }
  } else if (goals.includes('sustainability')) {
    // Sustainability goals benefit from solar in balanced/resilient
    recommendedIndex = scenarios[1].config.solarKW > 0 ? 1 : 2;
  }
  
  return recommendedIndex;
}

/**
 * Calculate confidence score for a scenario
 */
function calculateConfidence(
  input: SingleScenarioInput,
  config: ScenarioConfig,
  quoteCalculated: boolean
): { confidence: number; reason: string } {
  let confidence = 70; // Base confidence
  const reasons: string[] = [];
  
  // Boost confidence if quote calculation succeeded
  if (quoteCalculated) {
    confidence += 15;
    reasons.push('SSOT quote calculated');
  }
  
  // Boost if we have actual bill data
  if (input.dailyKWh && input.dailyKWh > 0) {
    confidence += 10;
    reasons.push('actual consumption data');
  }
  
  // Regional TOU data available
  if (input.touSchedule.peakRateMultiplier > 1.0) {
    confidence += 5;
    reasons.push('regional TOU rates');
  }
  
  // Cap at 95% (never 100% without site assessment)
  confidence = Math.min(confidence, 95);
  
  const reason = reasons.length > 0 
    ? `Based on ${reasons.join(', ')}`
    : 'Based on industry benchmarks';
  
  return { confidence, reason };
}

// ============================================
// EXPORTS
// ============================================

export {
  SCENARIO_CONFIGS,
  generateSingleScenario,
};
