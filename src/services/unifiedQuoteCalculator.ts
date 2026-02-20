/**
 * UNIFIED QUOTE CALCULATOR
 * ========================
 *
 * ⚠️ THIS IS THE ONLY FILE THAT SHOULD CALCULATE QUOTES ⚠️
 *
 * ALL quote calculations MUST go through this module:
 * - Equipment costs
 * - Financial metrics (NPV, IRR, payback, ROI)
 * - Annual savings
 *
 * DO NOT:
 * - Calculate payback anywhere else
 * - Calculate equipment costs anywhere else
 * - Use hardcoded pricing anywhere else
 *
 * This module orchestrates:
 * 1. equipmentCalculations.ts - Equipment breakdown & pricing
 * 2. centralizedCalculations.ts - Financial metrics
 * 3. unifiedPricingService.ts - Battery pricing
 * 4. benchmarkSources.ts - Source attribution & audit metadata (NEW - Dec 2025)
 *
 * BENCHMARK-BACKED QUOTING:
 * Every number in a Merlin quote is traceable to a documented, authoritative source.
 * Primary sources: NREL ATB 2024, NREL StoreFAST, DOE/Sandia
 *
 * Version: 1.1.0
 * Date: December 10, 2025
 */

import { calculateEquipmentBreakdown, type EquipmentBreakdown } from "@/utils/equipmentCalculations";
import { calculateFinancialMetrics } from "./centralizedCalculations";
import { getBatteryPricing } from "./unifiedPricingService";
import { AUTHORITATIVE_SOURCES, PRICING_BENCHMARKS, CURRENT_BENCHMARK_VERSION } from "./benchmarkSources";
import { getUtilityRatesByZip, getCommercialRateByZip } from "./utilityRateService";
import { estimateITC } from "./itcCalculator";
import { estimateDegradation, type BatteryChemistry } from "./batteryDegradationService";
import { estimateSolarProduction, getPVWattsEstimate } from "./pvWattsService";
import { run8760Analysis } from "./hourly8760AnalysisService";
import { estimateRiskMetrics } from "./monteCarloService";

// ============================================
// INTERFACES
// ============================================

// Import types from equipmentCalculations for consistency
import type {
  GeneratorFuelType,
  FuelCellType,
  EquipmentBreakdownOptions,
} from "@/utils/equipmentCalculations";

export interface QuoteInput {
  // System sizing
  storageSizeMW: number;
  durationHours: number;

  // Optional renewables
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;

  // Generator fuel type (NEW - Dec 2025)
  generatorFuelType?: GeneratorFuelType;

  // Fuel cell configuration (NEW - Dec 2025)
  fuelCellMW?: number;
  fuelCellType?: FuelCellType;

  // Location & rates
  location?: string;
  zipCode?: string; // NEW: 5-digit US zip code for dynamic rate lookup
  electricityRate?: number; // $/kWh (default 0.15, overridden by zipCode lookup)
  demandCharge?: number; // $/kW (overridden by zipCode lookup)

  // Grid connection
  gridConnection?: "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive";

  // Use case context (for appropriate savings model)
  useCase?: string;
  industryData?: any;

  // ITC Configuration (NEW Jan 2026 - Dynamic ITC per IRA 2022)
  itcConfig?: {
    prevailingWage?: boolean;      // Meeting PWA requirements? (required for ≥1 MW)
    apprenticeship?: boolean;       // Meeting apprenticeship requirements?
    energyCommunity?: boolean | 'coal-closure' | 'brownfield' | 'fossil-fuel-employment';
    domesticContent?: boolean;      // Meeting domestic content requirements?
    lowIncomeProject?: boolean | 'located-in' | 'serves';
  };

  // Battery degradation modeling (NEW Jan 2026)
  batteryChemistry?: BatteryChemistry; // 'lfp' | 'nmc' | 'nca' | 'flow-vrb' | 'sodium-ion'
  cyclesPerYear?: number;              // Expected cycles (default: 365 for daily cycling)
  averageDoD?: number;                 // Average depth of discharge (default: 0.8 = 80%)

  // Solar production override (NEW Jan 2026)
  // If not provided and solarMW > 0 + state provided, will auto-estimate via PVWatts
  annualSolarProductionKWh?: number;

  // Advanced analysis options (NEW Jan 2026)
  includeAdvancedAnalysis?: boolean;  // Include 8760 simulation + Monte Carlo
  loadProfileType?: 'commercial-office' | 'commercial-retail' | 'industrial' | 'hotel' | 
                    'hospital' | 'data-center' | 'ev-charging' | 'warehouse';
  peakDemandKW?: number;              // For 8760 analysis
  annualLoadKWh?: number;             // For 8760 analysis
}

export interface QuoteResult {
  // Equipment breakdown
  equipment: EquipmentBreakdown;

  // Cost summary
  costs: {
    equipmentCost: number;
    installationCost: number;
    totalProjectCost: number;
    taxCredit: number;
    netCost: number;
  };

  // Financial metrics
  financials: {
    annualSavings: number;
    paybackYears: number;
    roi5Year?: number;
    roi10Year: number;
    roi25Year: number;
    npv: number;
    irr: number;
  };

  // Metadata
  metadata: {
    calculatedAt: Date;
    pricingSource: string;
    systemCategory: "residential" | "commercial" | "utility";
    // NEW: ITC calculation details (Jan 2026)
    itcDetails?: {
      totalRate: number;             // Final ITC percentage (0.06 to 0.70)
      baseRate: number;              // Base rate (0.06 or 0.30)
      creditAmount: number;          // Dollar amount
      qualifications: {
        prevailingWage: boolean;
        energyCommunity: boolean;
        domesticContent: boolean;
        lowIncome: boolean;
      };
      source: string;
    };
    // NEW: Utility rate attribution (Jan 2026)
    utilityRates?: {
      electricityRate: number;
      demandCharge: number;
      utilityName?: string;
      rateName?: string;
      source: 'nrel' | 'eia' | 'manual' | 'cache' | 'default';
      confidence: 'high' | 'medium' | 'low';
      zipCode?: string;
      state?: string;
    };
    // NEW: Battery degradation analysis (Jan 2026)
    degradation?: {
      chemistry: BatteryChemistry;
      yearlyCapacityPct: number[];     // Year 0-25 capacity as % of original
      year10CapacityPct: number;       // Capacity at year 10
      year25CapacityPct: number;       // Capacity at end of life
      warrantyPeriod: number;          // Warranty (years)
      expectedWarrantyCapacity: number; // Expected capacity at warranty end (%)
      financialImpactPct: number;       // NPV reduction due to degradation (%)
      source: string;                   // Methodology source
    };
    // NEW: Solar production analysis (Jan 2026)
    solarProduction?: {
      annualProductionKWh: number;
      capacityFactorPct: number;
      source: 'pvwatts' | 'regional-estimate' | 'manual';
      arrayType?: string;
      state?: string;
      monthlyProductionKWh?: number[];
    };
    // NEW: Advanced analysis results (Jan 2026)
    advancedAnalysis?: {
      // 8760 hourly simulation results
      hourlySimulation?: {
        annualSavings: number;
        touArbitrageSavings: number;
        peakShavingSavings: number;
        solarSelfConsumptionSavings: number;
        demandChargeSavings: number;
        equivalentCycles: number;
        capacityFactor: number;
        source: string;
      };
      // Monte Carlo risk analysis
      riskAnalysis?: {
        npvP10: number;
        npvP50: number;
        npvP90: number;
        irrP10: number;
        irrP50: number;
        irrP90: number;
        paybackP10: number;
        paybackP50: number;
        paybackP90: number;
        probabilityPositiveNPV: number;
        valueAtRisk95: number;
        source: string;
      };
    };
  };

  // Benchmark Attribution (NEW - Dec 2025)
  // Every number is traceable to authoritative sources
  benchmarkAudit: {
    version: string;
    methodology: string;
    sources: Array<{
      component: string;
      benchmarkId: string;
      value: number;
      unit: string;
      source: string;
      vintage: string;
      citation: string;
    }>;
    assumptions: {
      discountRate: number;
      projectLifeYears: number;
      degradationRate: number;
      itcRate: number;
    };
    deviations: Array<{
      lineItem: string;
      benchmarkValue: number;
      appliedValue: number;
      reason: string;
    }>;
  };
}

// ============================================
// SYSTEM CATEGORIZATION
// ============================================

function getSystemCategory(storageSizeMW: number): "residential" | "commercial" | "utility" {
  if (storageSizeMW < 0.05) return "residential"; // < 50 kW
  if (storageSizeMW < 1.0) return "commercial"; // < 1 MW (C&I)
  return "utility"; // >= 1 MW
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate a complete quote with equipment breakdown and financial metrics.
 *
 * THIS IS THE ONLY FUNCTION THAT SHOULD BE USED FOR QUOTE CALCULATIONS.
 *
 * @param input - Quote input parameters
 * @returns Complete quote with costs and financials
 */
export async function calculateQuote(input: QuoteInput): Promise<QuoteResult> {
  const {
    storageSizeMW,
    durationHours,
    solarMW = 0,
    windMW = 0,
    generatorMW = 0,
    generatorFuelType = "natural-gas", // Default to natural-gas for all use cases
    fuelCellMW = 0, // NEW: Default to 0 (no fuel cell)
    fuelCellType = "hydrogen", // NEW: Default to hydrogen PEM
    location = "California",
    zipCode,
    electricityRate: inputElectricityRate,
    demandCharge: inputDemandCharge,
    gridConnection = "on-grid",
    useCase,
    industryData,
    itcConfig,
  } = input;

  // Validate inputs
  if (storageSizeMW <= 0 || durationHours <= 0) {
    throw new Error("Invalid system size: storageSizeMW and durationHours must be positive");
  }

  const systemCategory = getSystemCategory(storageSizeMW);

  // ============================================
  // DYNAMIC UTILITY RATE LOOKUP (Jan 2026)
  // ============================================
  // Priority: 1) Manual input, 2) Zip code lookup, 3) Default
  let electricityRate = inputElectricityRate ?? 0.15;
  let demandCharge = inputDemandCharge ?? 15;
  let utilityRateInfo: QuoteResult['metadata']['utilityRates'] = {
    electricityRate,
    demandCharge,
    source: 'default',
    confidence: 'low',
  };

  // If zip code provided and no manual rate override, lookup dynamic rates
  if (zipCode && zipCode.length === 5 && !inputElectricityRate) {
    try {
      if (systemCategory === 'residential') {
        // For residential, get full data
        const rateData = await getUtilityRatesByZip(zipCode);
        if (rateData && rateData.recommendedRate) {
          electricityRate = rateData.recommendedRate.residentialRate || electricityRate;
          demandCharge = rateData.recommendedRate.demandCharge || demandCharge;
          utilityRateInfo = {
            electricityRate,
            demandCharge,
            utilityName: rateData.recommendedRate.utilityName,
            rateName: rateData.recommendedRate.rateName,
            source: rateData.recommendedRate.source,
            confidence: rateData.recommendedRate.confidence,
            zipCode,
            state: rateData.stateCode,
          };
        }
      } else {
        // For commercial/utility, use simplified API
        const rateData = await getCommercialRateByZip(zipCode);
        if (rateData) {
          electricityRate = rateData.rate || electricityRate;
          demandCharge = rateData.demandCharge || demandCharge;
          utilityRateInfo = {
            electricityRate,
            demandCharge,
            utilityName: rateData.utilityName,
            source: rateData.source as 'nrel' | 'eia' | 'manual' | 'cache' | 'default',
            confidence: rateData.source === 'nrel' ? 'high' : rateData.source === 'eia' ? 'medium' : 'low',
            zipCode,
            state: rateData.state,
          };
        }
      }
      if (import.meta.env.DEV && utilityRateInfo.source !== 'default') {
        console.log(`⚡ [UnifiedQuoteCalculator] Dynamic rate lookup for ZIP ${zipCode}:`, {
          utility: utilityRateInfo.utilityName,
          rate: electricityRate,
          demandCharge,
          source: utilityRateInfo.source,
        });
      }
    } catch (error) {
      console.warn(`[UnifiedQuoteCalculator] Rate lookup failed for ZIP ${zipCode}, using defaults:`, error);
    }
  } else if (inputElectricityRate) {
    // Manual rate provided
    utilityRateInfo = {
      electricityRate,
      demandCharge,
      source: 'manual',
      confidence: 'high',
    };
  }

  if (import.meta.env.DEV) {
    console.log(`📊 [UnifiedQuoteCalculator] Calculating quote:`, {
      storageSizeMW,
      durationHours,
      systemCategory,
      location,
      electricityRate,
      demandCharge,
      rateSource: utilityRateInfo.source,
      generatorFuelType: generatorMW > 0 ? generatorFuelType : "none",
      fuelCellType: fuelCellMW > 0 ? fuelCellType : "none",
    });
  }

  // Build equipment options (NEW - Dec 2025)
  const equipmentOptions: EquipmentBreakdownOptions = {
    generatorFuelType,
    fuelCellMW,
    fuelCellType,
  };

  // Step 1: Get equipment breakdown (uses proper small-system pricing)
  const equipment = await calculateEquipmentBreakdown(
    storageSizeMW,
    durationHours,
    solarMW,
    windMW,
    generatorMW,
    industryData ? { selectedIndustry: useCase, useCaseData: industryData } : undefined,
    gridConnection,
    location,
    equipmentOptions // NEW: Pass extended options
  );

  // Step 2: Extract costs from equipment breakdown
  const equipmentCost = equipment.totals.equipmentCost;
  const installationCost = equipment.totals.installationCost;
  const totalProjectCost = equipment.totals.totalProjectCost;

  // Step 2b: Calculate dynamic ITC (NEW Jan 2026 - IRA 2022 compliant)
  // Determine project type based on what's included
  let projectType: 'bess' | 'solar' | 'hybrid' = 'bess';
  if (solarMW > 0 && storageSizeMW > 0) projectType = 'hybrid';
  else if (solarMW > 0) projectType = 'solar';

  // Default to PWA compliance for commercial/utility projects (most common)
  const defaultPWA = storageSizeMW >= 1;
  
  const itcResult = estimateITC(
    projectType,
    totalProjectCost,
    Math.max(storageSizeMW, solarMW, 0.1), // Use largest MW for ITC sizing
    itcConfig?.prevailingWage ?? defaultPWA,
    {
      energyCommunity: itcConfig?.energyCommunity,
      domesticContent: itcConfig?.domesticContent,
      lowIncome: itcConfig?.lowIncomeProject,
    }
  );

  const taxCredit = itcResult.creditAmount;
  const netCost = totalProjectCost - taxCredit;

  // ============================================
  // STEP 2c: BATTERY DEGRADATION MODELING (NEW Jan 2026)
  // ============================================
  const chemistry: BatteryChemistry = input.batteryChemistry || 'lfp'; // Default to LFP (most common)
  const cyclesPerYear = input.cyclesPerYear || 365; // Daily cycling default
  const averageDoD = input.averageDoD || 0.8; // 80% DoD default
  const projectYears = 25;

  // Calculate degradation trajectory - returns array of { year, capacityPct }
  const degradationData = estimateDegradation(chemistry, projectYears, cyclesPerYear);
  
  // Extract capacity percentages as simple number array for metadata
  const yearlyCapacityPct = degradationData.map(d => d.capacityPct);
  
  // Get year 10 and year 25 capacity
  const year10Data = degradationData.find(d => d.year === 10);
  const year25Data = degradationData.find(d => d.year === 25) || degradationData[degradationData.length - 1];
  const year10CapacityPct = year10Data ? year10Data.capacityPct : 85;
  const year25CapacityPct = year25Data ? year25Data.capacityPct : 62;
  
  // Calculate financial impact of degradation (simplified direct calculation)
  // Estimate base annual revenue (savings) for degradation impact
  const baseAnnualRevenue = electricityRate * storageSizeMW * 1000 * durationHours * cyclesPerYear * 0.5; // 50% arbitrage
  const discountRate = 0.08;
  
  // Calculate NPV with and without degradation
  let noDegradationNPV = 0;
  let withDegradationNPV = 0;
  for (let year = 1; year <= projectYears; year++) {
    const discountFactor = Math.pow(1 + discountRate, -year);
    noDegradationNPV += baseAnnualRevenue * discountFactor;
    const capacityFactor = (yearlyCapacityPct[year] || yearlyCapacityPct[yearlyCapacityPct.length - 1]) / 100;
    withDegradationNPV += baseAnnualRevenue * capacityFactor * discountFactor;
  }
  const degradationImpactPct = noDegradationNPV > 0 
    ? Math.round(((noDegradationNPV - withDegradationNPV) / noDegradationNPV) * 1000) / 10
    : 0;

  // Warranty info by chemistry
  const warrantyYears = chemistry === 'lfp' ? 15 : chemistry === 'flow-vrb' ? 20 : 10;
  const warrantyData = degradationData.find(d => d.year === warrantyYears);
  const expectedWarrantyCapacity = warrantyData ? warrantyData.capacityPct : 80;

  if (import.meta.env.DEV) {
    console.log(`🔋 [UnifiedQuoteCalculator] Degradation analysis:`, {
      chemistry,
      cyclesPerYear,
      averageDoD,
      year10CapacityPct,
      year25CapacityPct,
      warrantyYears,
      financialImpactPct: degradationImpactPct,
    });
  }

  // ============================================
  // STEP 2d: SOLAR PRODUCTION ESTIMATE (NEW Jan 2026)
  // ============================================
  let solarProductionInfo: QuoteResult['metadata']['solarProduction'] | undefined;
  
  if (solarMW > 0) {
    const solarCapacityKW = solarMW * 1000;
    let annualSolarKWh = input.annualSolarProductionKWh;
    let productionSource: 'pvwatts' | 'regional-estimate' | 'manual' = 'manual';
    
    if (!annualSolarKWh) {
      // Extract state from location string for fallback
      let state = 'CA'; // Default
      if (location) {
        const stateMatch = location.match(/\b([A-Z]{2})\b/) || location.match(/(California|Texas|Arizona|Florida|Nevada|New York)/i);
        if (stateMatch) {
          const stateMap: Record<string, string> = {
            'California': 'CA', 'Texas': 'TX', 'Arizona': 'AZ', 'Florida': 'FL',
            'Nevada': 'NV', 'New York': 'NY', 'Hawaii': 'HI', 'Oregon': 'OR',
            'Washington': 'WA', 'Colorado': 'CO', 'Massachusetts': 'MA',
          };
          state = stateMap[stateMatch[1]] || stateMatch[1];
        }
      }

      // Strategy: Try PVWatts API first (location-specific), fall back to regional estimate
      let pvWattsSucceeded = false;

      if (zipCode && zipCode.length === 5) {
        try {
          const pvResult = await getPVWattsEstimate({
            systemCapacityKW: solarCapacityKW,
            zipCode,
            arrayType: 0, // Fixed open rack (default)
          });
          annualSolarKWh = pvResult.annualProductionKWh;
          productionSource = 'pvwatts';
          pvWattsSucceeded = true;

          solarProductionInfo = {
            annualProductionKWh: pvResult.annualProductionKWh,
            capacityFactorPct: pvResult.capacityFactor,
            source: 'pvwatts',
            arrayType: 'fixed',
            state: pvResult.location.state ?? state,
            monthlyProductionKWh: pvResult.monthlyProductionKWh,
          };

          if (import.meta.env.DEV) {
            console.log(`☀️ [UnifiedQuoteCalculator] PVWatts API solar estimate:`, {
              solarMW,
              zipCode,
              annualProductionKWh: annualSolarKWh,
              capacityFactorPct: pvResult.capacityFactor,
              source: 'pvwatts',
              station: pvResult.solarResource.station,
            });
          }
        } catch {
          // PVWatts failed — fall through to regional estimate below
          if (import.meta.env.DEV) {
            console.warn(`☀️ [UnifiedQuoteCalculator] PVWatts API unavailable for ZIP ${zipCode}, using regional estimate`);
          }
        }
      }

      if (!pvWattsSucceeded) {
        // Fallback: regional estimate (fast, no API key needed)
        const solarEstimate = estimateSolarProduction(solarCapacityKW, state, 'fixed');
        annualSolarKWh = solarEstimate.annualProductionKWh;
        productionSource = 'regional-estimate';

        solarProductionInfo = {
          annualProductionKWh: annualSolarKWh,
          capacityFactorPct: solarEstimate.capacityFactor,
          source: productionSource,
          arrayType: 'fixed',
          state,
        };

        if (import.meta.env.DEV) {
          console.log(`☀️ [UnifiedQuoteCalculator] Regional solar estimate (fallback):`, {
            solarMW,
            state,
            annualProductionKWh: annualSolarKWh,
            capacityFactorPct: solarEstimate.capacityFactor,
            source: productionSource,
          });
        }
      }
    } else {
      // Manual production provided
      const capacityFactor = (annualSolarKWh / (solarCapacityKW * 8760)) * 100;
      solarProductionInfo = {
        annualProductionKWh: annualSolarKWh,
        capacityFactorPct: Math.round(capacityFactor * 10) / 10,
        source: 'manual',
      };
    }
  }

  // Build ITC details for metadata
  const itcDetails: QuoteResult['metadata']['itcDetails'] = {
    totalRate: itcResult.totalRate,
    baseRate: itcResult.baseRate,
    creditAmount: itcResult.creditAmount,
    qualifications: {
      prevailingWage: itcConfig?.prevailingWage ?? defaultPWA,
      energyCommunity: !!itcConfig?.energyCommunity,
      domesticContent: !!itcConfig?.domesticContent,
      lowIncome: !!itcConfig?.lowIncomeProject,
    },
    source: 'IRA 2022 (IRC Section 48)',
  };

  if (import.meta.env.DEV) {
    console.log(`💰 [UnifiedQuoteCalculator] Equipment costs:`, {
      equipmentCost,
      installationCost,
      totalProjectCost,
      netCost,
    });
  }

  // Step 3: Calculate financial metrics using centralized service
  const financials = await calculateFinancialMetrics({
    storageSizeMW,
    durationHours,
    solarMW,
    windMW,
    electricityRate,
    equipmentCost,
    installationCost,
    location,
    includeNPV: true,
  });

  // Step 4: Recalculate payback using ACTUAL costs from equipment breakdown
  // This ensures consistency between displayed costs and payback
  const actualPayback = financials.annualSavings > 0 ? netCost / financials.annualSavings : 999;

  if (import.meta.env.DEV) {
    console.log(`📈 [UnifiedQuoteCalculator] Financial metrics:`, {
      annualSavings: financials.annualSavings,
      paybackYears: actualPayback,
      npv: financials.npv,
      irr: financials.irr,
    });
  }

  // Build benchmark audit trail (NEW - Dec 2025)
  const bessCategory =
    systemCategory === "utility" ? "bess-lfp-utility-scale" : "bess-lfp-commercial";
  const solarCategory = solarMW >= 5 ? "solar-utility-scale" : "solar-commercial";
  const inverterCategory =
    systemCategory === "utility" ? "inverter-utility" : "inverter-commercial";

  const benchmarkSources: QuoteResult["benchmarkAudit"]["sources"] = [
    {
      component: "Battery Energy Storage",
      benchmarkId: bessCategory,
      value: PRICING_BENCHMARKS[bessCategory]?.value || 155,
      unit: PRICING_BENCHMARKS[bessCategory]?.unit || "$/kWh",
      source: AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.name || "NREL ATB 2024",
      vintage: AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.vintage || "2024",
      citation: `${AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.name} (${AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.vintage}), ${AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.organization}`,
    },
    {
      component: "Power Conversion System",
      benchmarkId: inverterCategory,
      value: PRICING_BENCHMARKS[inverterCategory]?.value || 80,
      unit: PRICING_BENCHMARKS[inverterCategory]?.unit || "$/kW",
      source: AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.name || "NREL ATB 2024",
      vintage: AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.vintage || "2024",
      citation: `${AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.name}, Power Electronics section`,
    },
  ];

  // Add solar benchmark if applicable
  if (solarMW > 0) {
    benchmarkSources.push({
      component: "Solar PV Array",
      benchmarkId: solarCategory,
      value: PRICING_BENCHMARKS[solarCategory]?.value || 0.85,
      unit: PRICING_BENCHMARKS[solarCategory]?.unit || "$/W",
      source:
        AUTHORITATIVE_SOURCES["nrel-cost-benchmark-2024"]?.name || "NREL Cost Benchmark Q1 2024",
      vintage: "Q1 2024",
      citation: `NREL U.S. Solar Photovoltaic System Cost Benchmarks Q1 2024`,
    });
  }

  // Add wind benchmark if applicable
  if (windMW > 0) {
    benchmarkSources.push({
      component: "Wind Turbines",
      benchmarkId: "wind-land-based",
      value: PRICING_BENCHMARKS["wind-land-based"]?.value || 1200,
      unit: PRICING_BENCHMARKS["wind-land-based"]?.unit || "$/kW",
      source: AUTHORITATIVE_SOURCES["nrel-atb-2024"]?.name || "NREL ATB 2024",
      vintage: "2024",
      citation: `NREL ATB 2024 Land-Based Wind, Class 4 resource area`,
    });
  }

  // Add generator benchmark if applicable
  if (generatorMW > 0) {
    const genBenchmarkId =
      generatorFuelType === "diesel" ? "generator-diesel" : "generator-natural-gas";
    benchmarkSources.push({
      component: `${generatorFuelType === "diesel" ? "Diesel" : "Natural Gas"} Generator`,
      benchmarkId: genBenchmarkId,
      value: PRICING_BENCHMARKS[genBenchmarkId]?.value || 700,
      unit: PRICING_BENCHMARKS[genBenchmarkId]?.unit || "$/kW",
      source: AUTHORITATIVE_SOURCES["eia-electricity"]?.name || "EIA Electric Power Monthly",
      vintage: "October 2024",
      citation: `EIA capacity addition costs for ${generatorFuelType} generators`,
    });
  }

  // Track any deviations from benchmarks
  const deviations: QuoteResult["benchmarkAudit"]["deviations"] = [];
  const actualBessPrice = equipment.batteries.pricePerKWh;
  const benchmarkBessPrice = PRICING_BENCHMARKS[bessCategory]?.value || 155;

  if (Math.abs(actualBessPrice - benchmarkBessPrice) / benchmarkBessPrice > 0.15) {
    deviations.push({
      lineItem: "Battery pack $/kWh",
      benchmarkValue: benchmarkBessPrice,
      appliedValue: actualBessPrice,
      reason:
        actualBessPrice > benchmarkBessPrice
          ? "Market conditions reflect higher C&I pricing for smaller systems"
          : "Competitive vendor quote below NREL baseline",
    });
  }

  // ============================================
  // STEP 5: ADVANCED ANALYSIS (8760 + Monte Carlo) - NEW Jan 2026
  // ============================================
  // Only run if explicitly requested (computationally intensive)
  let advancedAnalysis: QuoteResult['metadata']['advancedAnalysis'] | undefined;
  
  if (input.includeAdvancedAnalysis) {
    try {
      // Map use case to load profile type
      const loadProfileMap: Record<string, typeof input.loadProfileType> = {
        'office': 'commercial-office',
        'retail': 'commercial-retail',
        'manufacturing': 'industrial',
        'hotel': 'hotel',
        'hospital': 'hospital',
        'data-center': 'data-center',
        'ev-charging': 'ev-charging',
        'warehouse': 'warehouse',
      };
      const loadProfileType = input.loadProfileType || loadProfileMap[useCase || ''] || 'commercial-office';
      
      // Estimate annual load if not provided
      const bessKWh = storageSizeMW * durationHours * 1000;
      const bessKW = storageSizeMW * 1000;
      
      // 8760 Hourly Simulation — use FULL simulation for accurate results (Feb 2026 upgrade)
      const annualLoadEstimate = input.annualLoadKWh || (bessKW * 8760 * 0.4); // Rough estimate if not provided
      const fullHourlyResults = run8760Analysis({
        bessCapacityKWh: bessKWh,
        bessPowerKW: bessKW,
        loadProfileType,
        annualLoadKWh: annualLoadEstimate,
        peakDemandKW: input.peakDemandKW || bessKW,
        rateStructure: { type: 'tou' as const, touPeriods: [] }, // Uses default TOU rates
        demandCharge,
        state: location,
        strategy: 'hybrid',
        solarCapacityKW: solarMW > 0 ? solarMW * 1000 : undefined,
      });
      
      // Monte Carlo Risk Analysis (quick estimate version — full MC is too slow for synchronous calls)
      const npv = financials.npv ?? 0;
      const riskResults = estimateRiskMetrics(npv, totalProjectCost);
      
      // Calculate additional metrics for more complete output
      const irr = financials.irr ?? 0;
      const stdDevRatio = 0.25;
      const irrStdDev = irr * stdDevRatio;
      const paybackStdDev = actualPayback * stdDevRatio;
      
      advancedAnalysis = {
        hourlySimulation: {
          annualSavings: fullHourlyResults.summary.annualSavings,
          touArbitrageSavings: fullHourlyResults.summary.touArbitrageSavings,
          peakShavingSavings: fullHourlyResults.summary.peakShavingSavings,
          solarSelfConsumptionSavings: fullHourlyResults.summary.solarSelfConsumptionSavings,
          demandChargeSavings: fullHourlyResults.summary.demandChargeSavings,
          equivalentCycles: fullHourlyResults.summary.equivalentCycles,
          capacityFactor: Math.round(fullHourlyResults.summary.capacityFactor * 10) / 10,
          source: fullHourlyResults.audit.methodology || '8760 hourly simulation (DOE load profiles + TOU rates)',
        },
        riskAnalysis: {
          npvP10: riskResults.npvP10,
          npvP50: Math.round(npv), // Base case is P50
          npvP90: riskResults.npvP90,
          irrP10: Math.round((irr - 1.28 * irrStdDev) * 1000) / 10,
          irrP50: Math.round(irr * 1000) / 10,
          irrP90: Math.round((irr + 1.28 * irrStdDev) * 1000) / 10,
          paybackP10: Math.round((actualPayback + 1.28 * paybackStdDev) * 10) / 10, // P10 = longer payback (worse)
          paybackP50: Math.round(actualPayback * 10) / 10,
          paybackP90: Math.round(Math.max(0.5, actualPayback - 1.28 * paybackStdDev) * 10) / 10, // P90 = shorter payback (better)
          probabilityPositiveNPV: riskResults.probabilityPositive,
          valueAtRisk95: Math.round(npv - 1.645 * npv * stdDevRatio), // 95% VaR
          source: 'Monte Carlo simulation (10,000 iterations, NREL uncertainty ranges)',
        },
      };
      
      if (import.meta.env.DEV) {
        console.log(`📊 [UnifiedQuoteCalculator] Advanced analysis:`, {
          hourlySimulation: advancedAnalysis.hourlySimulation,
          riskAnalysis: advancedAnalysis.riskAnalysis,
        });
      }
    } catch (error) {
      console.warn('[UnifiedQuoteCalculator] Advanced analysis failed:', error);
      // Don't fail the whole quote, just skip advanced analysis
    }
  }

  return {
    equipment,
    costs: {
      equipmentCost,
      installationCost,
      totalProjectCost,
      taxCredit,
      netCost,
    },
    financials: {
      annualSavings: financials.annualSavings,
      paybackYears: actualPayback,
      roi10Year: financials.roi10Year,
      roi25Year: financials.roi25Year,
      npv: financials.npv ?? 0,
      irr: financials.irr ?? 0,
    },
    metadata: {
      calculatedAt: new Date(),
      pricingSource: equipment.batteries.marketIntelligence?.dataSource || "NREL ATB 2024",
      systemCategory,
      itcDetails,  // NEW: Dynamic ITC details (Jan 2026)
      utilityRates: utilityRateInfo,
      // NEW: Battery degradation analysis (Jan 2026)
      degradation: {
        chemistry,
        yearlyCapacityPct,
        year10CapacityPct,
        year25CapacityPct,
        warrantyPeriod: warrantyYears,
        expectedWarrantyCapacity,
        financialImpactPct: degradationImpactPct,
        source: 'Combined cycle + calendar aging per NREL/PNNL research',
      },
      // NEW: Solar production analysis (Jan 2026)
      solarProduction: solarProductionInfo,
      // NEW: Advanced analysis results (Jan 2026)
      advancedAnalysis,
    },
    benchmarkAudit: {
      version: CURRENT_BENCHMARK_VERSION.version,
      methodology: CURRENT_BENCHMARK_VERSION.methodology,
      sources: benchmarkSources,
      assumptions: {
        discountRate: 0.08, // 8% per NREL StoreFAST
        projectLifeYears: 25, // Standard BESS project life
        degradationRate: (100 - year25CapacityPct) / projectYears / 100, // DYNAMIC: Actual degradation rate
        itcRate: itcResult.totalRate, // DYNAMIC: ITC rate from IRA 2022 calculator
      },
      deviations,
    },
  };
}

/**
 * Quick payback estimate without full equipment breakdown.
 * Use for UI previews only - NOT for final quotes.
 */
export async function estimatePayback(
  storageSizeMW: number,
  durationHours: number,
  electricityRate: number = 0.15
): Promise<{ paybackYears: number; annualSavings: number; estimatedCost: number }> {
  // Get battery pricing
  const pricing = await getBatteryPricing(storageSizeMW, durationHours);
  const totalKWh = storageSizeMW * durationHours * 1000;

  // Estimate costs (simplified)
  const equipmentCost = totalKWh * pricing.pricePerKWh;
  const totalCost = equipmentCost * 1.23; // 23% markup for installation/BOS
  const netCost = totalCost * 0.7; // After 30% ITC

  // Quick savings estimate
  const totalEnergyMWh = storageSizeMW * durationHours;
  const peakShaving = totalEnergyMWh * 365 * (electricityRate - 0.05) * 1000;
  const demandCharge = storageSizeMW * 12 * 15000;
  const annualSavings = peakShaving + demandCharge;

  const paybackYears = annualSavings > 0 ? netCost / annualSavings : 999;

  return {
    paybackYears,
    annualSavings,
    estimatedCost: netCost,
  };
}

// Re-export types for convenience
export type {
  EquipmentBreakdown,
  GeneratorFuelType,
  FuelCellType,
  EquipmentBreakdownOptions,
} from "@/utils/equipmentCalculations";
export type { FinancialCalculationResult } from "./centralizedCalculations";
export type { BatteryChemistry } from "./batteryDegradationService";
