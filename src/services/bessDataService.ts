/**
 * BESS Data Service - Single Source of Truth
 * 
 * ✅ UPDATED: Now fetches pricing from database (pricing_configurations table)
 * Use getBESSFinancialInputs() to get database-driven defaults
 * 
 * Consolidates:
 * 1. Financial modeling (based on efinancialmodels.com BESS template)
 * 2. Use case energy profiles (hotels, car washes, retail, data centers, etc.)
 * 3. BESS sizing methodologies
 * 
 * Data sources:
 * - Database: pricing_configurations (bess_pricing_2025, power_electronics_2025, balance_of_plant_2025)
 * - efinancialmodels.com BESS Financial Model
 * - Energy Star Data Trends
 * - EIA Commercial Building Energy Consumption
 * - Industry case studies and research
 */

// ============================================================================
// 1. FINANCIAL MODELING CONSTANTS
// ============================================================================

export interface BESSFinancialInputs {
  // Project Details
  powerRatingMW: number;
  durationHours: number;
  systemAvailability: number; // %
  roundTripEfficiency: number; // %
  dailyCycles: number;
  degradationRate: number; // % per year
  projectLifetimeYears: number;
  
  // CAPEX
  batteryCostPerMWh: number; // $/MWh
  pcsCostPerMW: number; // $/MW (Power Conversion System)
  bomCostPerMW: number; // $/MW (Balance of Module)
  epcCostPerMW: number; // $/MW (Engineering, Procurement, Construction)
  interconnectionCostPerMW: number; // $/MW
  developmentCostPercent: number; // % of total CAPEX
  contingencyPercent: number; // % of total CAPEX
  
  // OPEX
  operationMaintenanceCostPerMWhPerYear: number; // $/MWh/year
  insurancePercentOfCapex: number; // % per year
  propertyTaxPercentOfCapex: number; // % per year
  landLeaseCostPerYear: number; // $/year
  
  // Revenue
  electricityRatePerMWh: number; // $/MWh
  demandChargePerMWPerMonth: number; // $/MW/month
  ancillaryServicesRevenuePerMWPerYear: number; // $/MW/year
  capacityPaymentPerMWPerYear: number; // $/MW/year
  priceEscalationRate: number; // % per year
  
  // Financing
  equityPercent: number; // %
  debtPercent: number; // %
  debtInterestRate: number; // %
  debtTermYears: number;
  itcTaxCredit: number; // % (Investment Tax Credit)
  taxRate: number; // %
  discountRate: number; // % (WACC)
}

/**
 * ⚠️ FALLBACK ONLY - Use getBESSFinancialInputs() to get database-driven values
 * These are only used if database fetch fails
 */
export const DEFAULT_BESS_FINANCIAL_INPUTS: BESSFinancialInputs = {
  // Project Details
  powerRatingMW: 1,
  durationHours: 4,
  systemAvailability: 95,
  roundTripEfficiency: 85,
  dailyCycles: 1.5,
  degradationRate: 2.5,
  projectLifetimeYears: 20,
  
  // CAPEX (2025 costs based on NREL ATB 2024) - FALLBACK VALUES
  batteryCostPerMWh: 250000, // $250k/MWh (declining) - Fallback
  pcsCostPerMW: 150000, // $150k/MW - Fallback
  bomCostPerMW: 100000, // $100k/MW - Fallback
  epcCostPerMW: 200000, // $200k/MW - Fallback
  interconnectionCostPerMW: 50000, // $50k/MW - Fallback
  developmentCostPercent: 5,
  contingencyPercent: 10,
  
  // OPEX - FALLBACK VALUES
  operationMaintenanceCostPerMWhPerYear: 15000, // $15k/MWh/year - Fallback
  insurancePercentOfCapex: 0.5,
  propertyTaxPercentOfCapex: 1.0,
  landLeaseCostPerYear: 50000,
  
  // Revenue - FALLBACK VALUES
  electricityRatePerMWh: 120, // $120/MWh average - Fallback
  demandChargePerMWPerMonth: 15000, // $15k/MW/month - Fallback
  ancillaryServicesRevenuePerMWPerYear: 50000, // $50k/MW/year - Fallback
  capacityPaymentPerMWPerYear: 30000, // $30k/MW/year - Fallback
  priceEscalationRate: 2.5,
  
  // Financing - FALLBACK VALUES
  equityPercent: 40,
  debtPercent: 60,
  debtInterestRate: 5.5,
  debtTermYears: 15,
  itcTaxCredit: 30, // 30% ITC - Fallback
  taxRate: 26,
  discountRate: 8
};

/**
 * ✅ SINGLE SOURCE OF TRUTH: Fetch BESS financial inputs from database
 * Fetches from pricing_configurations table with fallback to defaults
 * 
 * @param systemSizeMWh - System size in MWh (affects battery cost tier)
 * @returns Promise<BESSFinancialInputs> - Database-driven or fallback values
 */
export async function getBESSFinancialInputs(systemSizeMWh: number = 4): Promise<BESSFinancialInputs> {
  try {
    const { useCaseService } = await import('./useCaseService');
    
    // Fetch all relevant pricing configs from database
    const [bessConfig, powerElecConfig, bopConfig] = await Promise.all([
      useCaseService.getPricingConfig('bess_pricing_2025'),
      useCaseService.getPricingConfig('power_electronics_2025'),
      useCaseService.getPricingConfig('balance_of_plant_2025')
    ]);
    
    // Determine battery cost per kWh based on system size (4-tier pricing)
    let batteryCostPerKWh = 450; // Default medium system
    if (bessConfig) {
      if (systemSizeMWh <= (bessConfig.smallSystemSizeMWh || 1)) {
        batteryCostPerKWh = bessConfig.smallSystemPerKWh || 580;
      } else if (systemSizeMWh <= (bessConfig.mediumSystemSizeMWh || 5)) {
        batteryCostPerKWh = bessConfig.mediumSystemPerKWh || 450;
      } else if (systemSizeMWh <= (bessConfig.largeSystemSizeMWh || 15)) {
        batteryCostPerKWh = bessConfig.mediumLargeSystemPerKWh || 350;
      } else {
        batteryCostPerKWh = bessConfig.largeSystemPerKWh || 280;
      }
    }
    
    // Convert $/kWh to $/MWh for this interface
    const batteryCostPerMWh = batteryCostPerKWh * 1000;
    
    // Calculate PCS cost from power electronics config
    const inverterPerKW = powerElecConfig?.inverterPerKW || 120;
    const pcsCostPerMW = inverterPerKW * 1000; // Convert to per MW
    
    // BOP/EPC percentages
    const bopPercent = bopConfig?.bopPercentage || 0.12;
    const epcPercent = bopConfig?.epcPercentage || 0.08;
    
    console.log('✅ [bessDataService] Using database-driven pricing:', {
      batteryCostPerMWh,
      pcsCostPerMW,
      dataSource: bessConfig ? 'database' : 'fallback'
    });
    
    return {
      ...DEFAULT_BESS_FINANCIAL_INPUTS,
      batteryCostPerMWh,
      pcsCostPerMW,
      bomCostPerMW: pcsCostPerMW * 0.67, // BOM typically ~67% of PCS
      epcCostPerMW: batteryCostPerMWh * epcPercent * 4, // EPC based on 4hr system
      roundTripEfficiency: (bessConfig?.roundTripEfficiency || 0.85) * 100,
      degradationRate: (bessConfig?.degradationRate || 0.02) * 100,
    };
  } catch (error) {
    console.warn('⚠️ [bessDataService] Using fallback pricing (database unavailable):', error);
    return DEFAULT_BESS_FINANCIAL_INPUTS;
  }
}

// ============================================================================
// 2. USE CASE ENERGY PROFILES
// ============================================================================

export interface UseCaseEnergyProfile {
  useCaseType: string;
  
  // Energy Consumption
  annualEnergyConsumptionkWh: number;
  peakDemandkW: number;
  averageDemandkW: number;
  loadFactor: number; // %
  
  // Demand Characteristics
  demandChargePercent: number; // % of total utility bill
  energyChargePercent: number; // % of total utility bill
  peakHoursStart: number; // hour (0-23)
  peakHoursEnd: number; // hour (0-23)
  peakDemandMonths: number[]; // months (1-12)
  
  // Operating Profile
  operatingHoursPerDay: number;
  operatingDaysPerWeek: number;
  seasonalityWeight: { [month: number]: number }; // 1.0 = average
  
  // BESS Opportunity
  peakShavingPotentialPercent: number; // % of peak demand
  demandChargeReductionPercent: number; // % savings
  energyArbitragePotentialPercent: number; // % savings
  backupPowerHoursRequired: number;
  
  // Sizing Recommendations
  recommendedPowerRatioMWperUnit: number; // MW per facility unit
  recommendedDurationHours: number;
  recommendedCyclesPerDay: number;
  
  // Cost Factors
  averageElectricityRatePerMWh: number;
  averageDemandChargePerMWPerMonth: number;
  
  // Data Sources
  dataSources: string[];
}

export const USE_CASE_ENERGY_PROFILES: { [key: string]: UseCaseEnergyProfile } = {
  'hotel': {
    useCaseType: 'hotel',
    
    // Energy Consumption (per room basis, scaled by number of rooms)
    // Source: Energy Star Data Trends + DoubleTree case study
    annualEnergyConsumptionkWh: 10950, // per room/year (30 kWh/room/day)
    peakDemandkW: 3.5, // per room (based on 70% occupancy)
    averageDemandkW: 1.25, // per room
    loadFactor: 36, // Hotels have low load factor due to high peaks
    
    // Demand Characteristics
    demandChargePercent: 40, // Demand charges ~40% of hotel utility bills
    energyChargePercent: 60,
    peakHoursStart: 17, // 5 PM
    peakHoursEnd: 22, // 10 PM
    peakDemandMonths: [6, 7, 8, 12, 1, 2], // Summer (AC) and Winter (heating)
    
    // Operating Profile
    operatingHoursPerDay: 24,
    operatingDaysPerWeek: 7,
    seasonalityWeight: {
      1: 1.15, 2: 1.10, 3: 0.95, 4: 0.90, 5: 0.95,
      6: 1.20, 7: 1.25, 8: 1.20, 9: 0.95, 10: 0.90, 11: 0.95, 12: 1.15
    },
    
    // BESS Opportunity
    peakShavingPotentialPercent: 30, // Can shave 30% of peak demand
    demandChargeReductionPercent: 25, // Save 25% on demand charges
    energyArbitragePotentialPercent: 15, // 15% savings from off-peak charging
    backupPowerHoursRequired: 4, // Emergency backup for critical systems
    
    // Sizing Recommendations (per 100 rooms)
    recommendedPowerRatioMWperUnit: 0.00293, // ~293kW per 100 rooms (0.293 MW)
    recommendedDurationHours: 4,
    recommendedCyclesPerDay: 1.5,
    
    // Cost Factors
    averageElectricityRatePerMWh: 130,
    averageDemandChargePerMWPerMonth: 15000,
    
    // Data Sources
    dataSources: [
      'Energy Star Data Trends Hotels 2015',
      'DoubleTree Dartford Case Study (40.01 kWh/room baseline)',
      'Spacewell Energy Management Study'
    ]
  },
  
  'datacenter': {
    useCaseType: 'datacenter',
    
    // Energy Consumption (per MW of IT load)
    // Source: DOE Data Centers, Pew Research 2025
    annualEnergyConsumptionkWh: 52560000, // per MW IT load (PUE 1.5, 90% utilization)
    peakDemandkW: 1500, // per MW IT load (includes cooling, PUE 1.5)
    averageDemandkW: 1350, // per MW IT load
    loadFactor: 90, // Data centers have very high load factor
    
    // Demand Characteristics
    demandChargePercent: 45, // Very high demand charges
    energyChargePercent: 55,
    peakHoursStart: 12, // Noon
    peakHoursEnd: 20, // 8 PM
    peakDemandMonths: [6, 7, 8], // Summer cooling loads
    
    // Operating Profile
    operatingHoursPerDay: 24,
    operatingDaysPerWeek: 7,
    seasonalityWeight: {
      1: 0.95, 2: 0.95, 3: 1.00, 4: 1.05, 5: 1.10,
      6: 1.15, 7: 1.20, 8: 1.15, 9: 1.10, 10: 1.05, 11: 1.00, 12: 0.95
    },
    
    // BESS Opportunity
    peakShavingPotentialPercent: 20, // Limited by uptime requirements
    demandChargeReductionPercent: 35, // Significant savings possible
    energyArbitragePotentialPercent: 20,
    backupPowerHoursRequired: 8, // Extended backup for Tier 3/4
    
    // Sizing Recommendations (per MW IT load)
    recommendedPowerRatioMWperUnit: 8.0, // 8 MW BESS per MW IT
    recommendedDurationHours: 6,
    recommendedCyclesPerDay: 1.0,
    
    // Cost Factors
    averageElectricityRatePerMWh: 110,
    averageDemandChargePerMWPerMonth: 20000,
    
    // Data Sources
    dataSources: [
      'DOE Energy Efficiency and Renewable Energy Data Centers',
      'Pew Research Data Center Energy Use 2025',
      'Uptime Institute Data Center Benchmarks'
    ]
  },
  
  'car-wash': {
    useCaseType: 'car-wash',
    
    // Energy Consumption (per bay)
    // Source: Car Wash Forum industry data
    annualEnergyConsumptionkWh: 175200, // per bay/year (480 kWh/day avg)
    peakDemandkW: 150, // per bay (motors, heaters, dryers)
    averageDemandkW: 55, // per bay
    loadFactor: 37, // High peak during wash cycles
    
    // Demand Characteristics
    demandChargePercent: 50, // Very high demand charges for motor loads
    energyChargePercent: 50,
    peakHoursStart: 10, // 10 AM
    peakHoursEnd: 18, // 6 PM
    peakDemandMonths: [4, 5, 6, 7, 8, 9], // Spring/Summer (peak season)
    
    // Operating Profile
    operatingHoursPerDay: 16,
    operatingDaysPerWeek: 7,
    seasonalityWeight: {
      1: 0.70, 2: 0.75, 3: 0.95, 4: 1.15, 5: 1.20,
      6: 1.25, 7: 1.20, 8: 1.15, 9: 1.10, 10: 0.95, 11: 0.80, 12: 0.70
    },
    
    // BESS Opportunity
    peakShavingPotentialPercent: 40, // Excellent opportunity - cyclical loads
    demandChargeReductionPercent: 45, // Major savings on demand charges
    energyArbitragePotentialPercent: 25,
    backupPowerHoursRequired: 2, // Minimal backup needed
    
    // Sizing Recommendations (per bay)
    recommendedPowerRatioMWperUnit: 0.267, // 267 kW per bay
    recommendedDurationHours: 3,
    recommendedCyclesPerDay: 2.0,
    
    // Cost Factors
    averageElectricityRatePerMWh: 120,
    averageDemandChargePerMWPerMonth: 18000,
    
    // Data Sources
    dataSources: [
      'Car Wash Forum Monthly Electric Bill Discussion',
      'International Carwash Association Benchmarks'
    ]
  },
  
  'retail': {
    useCaseType: 'retail',
    
    // Energy Consumption (per 1000 sq ft)
    // Source: Energy Star Data Trends Retail, EIA CBECS
    annualEnergyConsumptionkWh: 14600, // per 1000 sq ft/year (40 kWh/day)
    peakDemandkW: 5.5, // per 1000 sq ft
    averageDemandkW: 1.67, // per 1000 sq ft
    loadFactor: 30, // Retail has moderate load factor
    
    // Demand Characteristics
    demandChargePercent: 35,
    energyChargePercent: 65,
    peakHoursStart: 14, // 2 PM
    peakHoursEnd: 19, // 7 PM
    peakDemandMonths: [11, 12, 1], // Holiday season + winter heating
    
    // Operating Profile
    operatingHoursPerDay: 14,
    operatingDaysPerWeek: 7,
    seasonalityWeight: {
      1: 1.10, 2: 0.85, 3: 0.90, 4: 0.95, 5: 1.00,
      6: 1.05, 7: 1.05, 8: 1.00, 9: 0.95, 10: 1.10, 11: 1.25, 12: 1.30
    },
    
    // BESS Opportunity
    peakShavingPotentialPercent: 25,
    demandChargeReductionPercent: 20,
    energyArbitragePotentialPercent: 18,
    backupPowerHoursRequired: 3,
    
    // Sizing Recommendations (per 10,000 sq ft)
    recommendedPowerRatioMWperUnit: 0.055, // 55 kW per 10k sq ft
    recommendedDurationHours: 4,
    recommendedCyclesPerDay: 1.5,
    
    // Cost Factors
    averageElectricityRatePerMWh: 115,
    averageDemandChargePerMWPerMonth: 14000,
    
    // Data Sources
    dataSources: [
      'Energy Star Data Trends Retail 2015',
      'EIA Commercial Building Energy Consumption Survey',
      'ICSC Industry Benchmarking Report'
    ]
  },
  
  'vertical-farm': {
    useCaseType: 'vertical-farm',
    
    // Energy Consumption (per 1000 sq ft growing space)
    // Source: iFarm research
    annualEnergyConsumptionkWh: 438000, // per 1000 sq ft/year (1200 kWh/day)
    peakDemandkW: 150, // per 1000 sq ft (LED lighting dominant)
    averageDemandkW: 50, // per 1000 sq ft
    loadFactor: 33, // Lighting cycles create peaks
    
    // Demand Characteristics
    demandChargePercent: 30,
    energyChargePercent: 70, // Very high energy usage
    peakHoursStart: 6, // 6 AM (photoperiod start)
    peakHoursEnd: 22, // 10 PM
    peakDemandMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
    
    // Operating Profile
    operatingHoursPerDay: 24,
    operatingDaysPerWeek: 7,
    seasonalityWeight: {
      1: 1.00, 2: 1.00, 3: 1.00, 4: 1.00, 5: 1.00,
      6: 1.00, 7: 1.00, 8: 1.00, 9: 1.00, 10: 1.00, 11: 1.00, 12: 1.00
    },
    
    // BESS Opportunity
    peakShavingPotentialPercent: 35,
    demandChargeReductionPercent: 30,
    energyArbitragePotentialPercent: 40, // Excellent for time-shifting
    backupPowerHoursRequired: 12, // Protect growing cycles
    
    // Sizing Recommendations (per 10,000 sq ft)
    recommendedPowerRatioMWperUnit: 1.5, // 1.5 MW per 10k sq ft
    recommendedDurationHours: 12,
    recommendedCyclesPerDay: 1.0,
    
    // Cost Factors
    averageElectricityRatePerMWh: 140, // Very high due to volume
    averageDemandChargePerMWPerMonth: 16000,
    
    // Data Sources
    dataSources: [
      'iFarm Vertical Farm Energy Consumption Research',
      'Indoor Ag-Con Industry Data'
    ]
  }
};

// ============================================================================
// 3. BESS SIZING METHODOLOGIES
// ============================================================================

export interface BESSSizingParameters {
  // Input Parameters
  peakDemandkW: number;
  averageDemandkW: number;
  dailyEnergyConsumptionkWh: number;
  peakDemandReductionTargetPercent: number;
  backupHoursRequired: number;
  
  // Sizing Outputs
  recommendedPowerMW: number;
  recommendedCapacityMWh: number;
  recommendedDurationHours: number;
  dcSize: string;
  roundTripEfficiency: number;
}

/**
 * Calculate optimal BESS size based on use case and objectives
 * Methodology from: https://ampowr.com/how-to-size-battery-energy-storage-system/
 */
export function calculateBESSSize(params: {
  peakDemandkW: number;
  averageDemandkW: number;
  dailyEnergyConsumptionkWh: number;
  useCase: string;
  primaryObjective: 'peak-shaving' | 'backup' | 'arbitrage' | 'all';
}): BESSSizingParameters {
  const { peakDemandkW, averageDemandkW, dailyEnergyConsumptionkWh, useCase, primaryObjective } = params;
  
  // Get use case profile
  const profile = USE_CASE_ENERGY_PROFILES[useCase] || USE_CASE_ENERGY_PROFILES['retail'];
  
  let recommendedPowerMW: number;
  let recommendedDurationHours: number;
  
  switch (primaryObjective) {
    case 'peak-shaving':
      // Size for peak demand reduction
      recommendedPowerMW = (peakDemandkW * profile.peakShavingPotentialPercent / 100) / 1000;
      recommendedDurationHours = profile.recommendedDurationHours;
      break;
      
    case 'backup':
      // Size for backup power requirements
      recommendedPowerMW = (averageDemandkW * 1.2) / 1000; // 120% of average for safety
      recommendedDurationHours = profile.backupPowerHoursRequired;
      break;
      
    case 'arbitrage':
      // Size for energy time-shifting
      recommendedPowerMW = (peakDemandkW * 0.6) / 1000; // 60% of peak
      recommendedDurationHours = 6; // Standard arbitrage window
      break;
      
    case 'all':
    default:
      // Balanced approach
      recommendedPowerMW = (peakDemandkW * 0.4) / 1000;
      recommendedDurationHours = 4;
      break;
  }
  
  const recommendedCapacityMWh = recommendedPowerMW * recommendedDurationHours;
  
  return {
    peakDemandkW,
    averageDemandkW,
    dailyEnergyConsumptionkWh,
    peakDemandReductionTargetPercent: profile.peakShavingPotentialPercent,
    backupHoursRequired: profile.backupPowerHoursRequired,
    recommendedPowerMW,
    recommendedCapacityMWh,
    recommendedDurationHours,
    dcSize: `${(recommendedPowerMW * 1.15).toFixed(2)} MW`, // Add 15% for DC oversizing
    roundTripEfficiency: 85
  };
}

/**
 * Calculate financial returns for a BESS project
 * Based on efinancialmodels.com BESS Financial Model structure
 * 
 * @deprecated ⚠️ DO NOT USE - This function is deprecated and will be removed in v2.0
 * 
 * Use `calculateFinancialMetrics()` from `centralizedCalculations.ts` instead!
 * The centralized service provides:
 * - Database-driven constants (not hardcoded)
 * - NPV/IRR calculations with proper degradation modeling
 * - Sensitivity and risk analysis
 * - Monte Carlo simulations
 * 
 * @example
 * // ❌ DEPRECATED - DO NOT USE:
 * import { calculateBESSFinancials } from './bessDataService';
 * const result = calculateBESSFinancials(inputs);
 * 
 * // ✅ USE THIS INSTEAD:
 * import { calculateFinancialMetrics } from './centralizedCalculations';
 * const result = await calculateFinancialMetrics({
 *   storageSizeMW: inputs.powerRatingMW,
 *   durationHours: inputs.durationHours,
 *   electricityRate: inputs.electricityRatePerMWh / 1000,
 *   location: 'your-location',
 *   includeNPV: true
 * });
 */
export function calculateBESSFinancials(inputs: BESSFinancialInputs): {
  capex: number;
  annualOpex: number;
  annualRevenue: number;
  netPresentValue: number;
  internalRateOfReturn: number;
  paybackYears: number;
  levelizedCostOfStorage: number;
} {
  // DEPRECATION WARNING - Always show in console
  console.warn(
    '⚠️ DEPRECATED: calculateBESSFinancials() is deprecated and will be removed in v2.0.\n' +
    '📍 Location: src/services/bessDataService.ts\n' +
    '✅ Use: calculateFinancialMetrics() from src/services/centralizedCalculations.ts\n' +
    '📚 See: CALCULATION_FILES_AUDIT.md for migration guide'
  );
  
  const { powerRatingMW, durationHours } = inputs;
  const capacityMWh = powerRatingMW * durationHours;
  
  // Calculate CAPEX
  const batteryCost = capacityMWh * inputs.batteryCostPerMWh;
  const pcsCost = powerRatingMW * inputs.pcsCostPerMW;
  const bomCost = powerRatingMW * inputs.bomCostPerMW;
  const epcCost = powerRatingMW * inputs.epcCostPerMW;
  const interconnectionCost = powerRatingMW * inputs.interconnectionCostPerMW;
  
  const subtotalCapex = batteryCost + pcsCost + bomCost + epcCost + interconnectionCost;
  const developmentCost = subtotalCapex * (inputs.developmentCostPercent / 100);
  const contingencyCost = subtotalCapex * (inputs.contingencyPercent / 100);
  
  const totalCapex = subtotalCapex + developmentCost + contingencyCost;
  const itcAmount = totalCapex * (inputs.itcTaxCredit / 100);
  const netCapex = totalCapex - itcAmount;
  
  // Calculate Annual OPEX
  const omCost = capacityMWh * inputs.operationMaintenanceCostPerMWhPerYear;
  const insuranceCost = totalCapex * (inputs.insurancePercentOfCapex / 100);
  const propertyTaxCost = totalCapex * (inputs.propertyTaxPercentOfCapex / 100);
  const annualOpex = omCost + insuranceCost + propertyTaxCost + inputs.landLeaseCostPerYear;
  
  // Calculate Annual Revenue
  const annualEnergyMWh = powerRatingMW * inputs.dailyCycles * 365 * (inputs.systemAvailability / 100);
  const energyRevenue = annualEnergyMWh * inputs.electricityRatePerMWh * (inputs.roundTripEfficiency / 100);
  const demandChargeRevenue = powerRatingMW * inputs.demandChargePerMWPerMonth * 12;
  const ancillaryRevenue = powerRatingMW * inputs.ancillaryServicesRevenuePerMWPerYear;
  const capacityRevenue = powerRatingMW * inputs.capacityPaymentPerMWPerYear;
  
  const annualRevenue = energyRevenue + demandChargeRevenue + ancillaryRevenue + capacityRevenue;
  
  // Simple NPV calculation (can be enhanced with year-by-year degradation)
  const annualCashFlow = annualRevenue - annualOpex;
  let npv = -netCapex;
  for (let year = 1; year <= inputs.projectLifetimeYears; year++) {
    const degradationFactor = Math.pow(1 - inputs.degradationRate / 100, year - 1);
    const yearRevenue = annualRevenue * degradationFactor * Math.pow(1 + inputs.priceEscalationRate / 100, year - 1);
    const yearCashFlow = yearRevenue - annualOpex;
    npv += yearCashFlow / Math.pow(1 + inputs.discountRate / 100, year);
  }
  
  // Simple IRR approximation (actual calculation requires iterative solving)
  const totalCashFlows = annualCashFlow * inputs.projectLifetimeYears;
  const approximateIRR = ((totalCashFlows / netCapex) - 1) / inputs.projectLifetimeYears * 100;
  
  // Payback period
  const paybackYears = netCapex / annualCashFlow;
  
  // Levelized Cost of Storage (LCOS)
  const totalLifetimeCosts = netCapex + (annualOpex * inputs.projectLifetimeYears);
  const totalLifetimeEnergyMWh = annualEnergyMWh * inputs.projectLifetimeYears;
  const lcos = totalLifetimeCosts / totalLifetimeEnergyMWh;
  
  return {
    capex: totalCapex,
    annualOpex,
    annualRevenue,
    netPresentValue: npv,
    internalRateOfReturn: approximateIRR,
    paybackYears,
    levelizedCostOfStorage: lcos
  };
}

// ============================================================================
// 4. INTEGRATED RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate comprehensive BESS recommendation for a specific use case
 */
export function generateBESSRecommendation(params: {
  useCase: string;
  facilitySize: number; // Units depend on use case (rooms, sq ft, bays, etc.)
  location: string;
  electricityRate?: number;
  demandCharge?: number;
  objective?: 'peak-shaving' | 'backup' | 'arbitrage' | 'all';
}): {
  sizing: BESSSizingParameters;
  financials: ReturnType<typeof calculateBESSFinancials>;
  profile: UseCaseEnergyProfile;
  insights: string[];
} {
  const { useCase, facilitySize, electricityRate, demandCharge, objective = 'all' } = params;
  
  // Get use case profile
  const profile = USE_CASE_ENERGY_PROFILES[useCase] || USE_CASE_ENERGY_PROFILES['retail'];
  
  // Calculate facility energy characteristics
  const peakDemandkW = facilitySize * profile.peakDemandkW;
  const averageDemandkW = facilitySize * profile.averageDemandkW;
  const dailyEnergyConsumptionkWh = (facilitySize * profile.annualEnergyConsumptionkWh) / 365;
  
  // Calculate BESS sizing
  const sizing = calculateBESSSize({
    peakDemandkW,
    averageDemandkW,
    dailyEnergyConsumptionkWh,
    useCase,
    primaryObjective: objective
  });
  
  // Calculate financials
  const financialInputs: BESSFinancialInputs = {
    ...DEFAULT_BESS_FINANCIAL_INPUTS,
    powerRatingMW: sizing.recommendedPowerMW,
    durationHours: sizing.recommendedDurationHours,
    electricityRatePerMWh: electricityRate || profile.averageElectricityRatePerMWh,
    demandChargePerMWPerMonth: demandCharge || profile.averageDemandChargePerMWPerMonth
  };
  
  const financials = calculateBESSFinancials(financialInputs);
  
  // Generate insights
  const insights = [
    `Peak shaving potential: ${profile.peakShavingPotentialPercent}% reduction (${(peakDemandkW * profile.peakShavingPotentialPercent / 100 / 1000).toFixed(2)} MW)`,
    `Estimated demand charge savings: ${profile.demandChargeReductionPercent}% ($${(profile.averageDemandChargePerMWPerMonth * 12 * sizing.recommendedPowerMW * profile.demandChargeReductionPercent / 100).toLocaleString()}/year)`,
    `Energy arbitrage opportunity: ${profile.energyArbitragePotentialPercent}% savings`,
    `Recommended backup duration: ${profile.backupPowerHoursRequired} hours`,
    `System payback: ${financials.paybackYears.toFixed(1)} years`,
    `NPV over ${financialInputs.projectLifetimeYears} years: $${financials.netPresentValue.toLocaleString()}`
  ];
  
  return {
    sizing,
    financials,
    profile,
    insights
  };
}
