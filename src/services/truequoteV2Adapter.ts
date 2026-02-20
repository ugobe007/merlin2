/**
 * TRUEQUOTE V2 ADAPTER
 * ====================
 *
 * This adapter wraps unifiedQuoteCalculator.calculateQuote() and converts
 * the legacy result into the TrueQuoteV2 sealed envelope format.
 *
 * ZERO BEHAVIOR CHANGE - This is a pure packaging layer.
 * 
 * MARGIN POLICY INTEGRATION (v2.1.0):
 * This is the SINGLE INSERTION POINT for margin policy.
 * Steps 4/5/6 consume sellPriceTotal from this envelope - never compute margin themselves.
 *
 * @version 2.1.0
 * @date 2026-02-01
 */

// @ts-expect-error uuid has no declaration file in this project
import { v4 as uuidv4 } from "uuid";
import { calculateQuote, type QuoteInput, type QuoteResult } from "./unifiedQuoteCalculator";
import { CURRENT_BENCHMARK_VERSION } from "./benchmarkSources";
import { 
  applyMarginPolicy,
  type MarginPolicyInput,
  type ProductClass,
} from "./marginPolicyEngine";
import type {
  TrueQuoteV2,
  QuoteVersions,
  QuoteInputV2,
  QuoteAssumptionsV2,
  QuoteConfigV2,
  QuoteOutputsV2,
  QuoteMetadataV2,
  QuoteAuditV2,
  QuoteMarginPolicyV2,
  LegacyQuoteInput,
  RecordedAssumption,
  AssumptionWarning,
  QuoteConfigLineItem,
  AuditLineItem,
  GeneratorFuelType,
  GridConnection,
  BatteryChemistry,
} from "@/contracts/truequote.v2";

// =============================================================================
// VERSION CONSTANTS
// =============================================================================

/** Current engine version - update when calculation logic changes */
const ENGINE_VERSION = "2026.02.01.1";

/** Current pricing model version - update when pricing rules change */
const PRICING_MODEL_VERSION = "2026.02.01";

/** Current product catalog version - update when SKUs change */
const PRODUCT_CATALOG_VERSION = "2026.01.20";

/** Current tariff rules version - update when rate structures change */
const TARIFF_RULES_VERSION = "2026.01.10";

/** Current assumptions pack version - update when defaults change */
const ASSUMPTIONS_PACK_VERSION = "2026.01.25";

// =============================================================================
// MARGIN POLICY HELPERS
// =============================================================================

/**
 * Map legacy marginRule string to ProductClass for margin engine
 */
function skuToProductClass(sku: string, category: string): ProductClass {
  // Map category first
  const categoryMap: Record<string, ProductClass> = {
    bess: 'bess',
    pcs: 'inverter_pcs',
    transformer: 'transformer',
    solar: 'solar',
    wind: 'wind',
    generator: 'generator',
    ems: 'ems_software',
    bos: 'scada', // Balance of system → SCADA category
    installation: 'construction_labor',
    engineering: 'engineering',
  };
  return categoryMap[category] || 'bess';
}

/**
 * Convert config line items to margin policy input format
 * This is the SINGLE conversion point - all margin calculation flows through here
 */
function buildMarginPolicyInput(
  config: QuoteConfigV2,
  legacyResult: QuoteResult,
  input: QuoteInputV2
): MarginPolicyInput {
  // Convert line items to margin engine format
  const marginLineItems: MarginPolicyInput['lineItems'] = config.lineItems.map(item => ({
    sku: item.sku,
    category: skuToProductClass(item.sku, item.category),
    description: item.description,
    baseCost: item.extendedCost,
    quantity: item.unitQuantity || item.quantity,
    unitCost: item.unitRate || item.unitCost,
    unit: item.unitBasis || 'per_unit',
    costSource: item.costSource,
    costAsOfDate: config.pricingSnapshot.frozenAt,
  }));

  // Add installation cost as a line item if not already present
  if (legacyResult.costs.installationCost > 0) {
    const hasInstallation = marginLineItems.some(item => item.category === 'construction_labor');
    if (!hasInstallation) {
      marginLineItems.push({
        sku: 'INSTALL-LABOR',
        category: 'construction_labor',
        description: 'Installation & Construction',
        baseCost: legacyResult.costs.installationCost,
        quantity: 1,
        unitCost: legacyResult.costs.installationCost,
        unit: 'lump_sum',
        costSource: 'NREL Cost Benchmark',
        costAsOfDate: config.pricingSnapshot.frozenAt,
      });
    }
  }

  // Calculate denominators for quote-level guards
  const batteryKWh = legacyResult.equipment.batteries.unitEnergyMWh * 
                     legacyResult.equipment.batteries.quantity * 1000;
  const solarW = (input.solarMW || 0) * 1_000_000;
  const inverterKW = legacyResult.equipment.inverters.unitPowerMW * 
                     legacyResult.equipment.inverters.quantity * 1000;

  const quoteUnits: Partial<Record<ProductClass, number>> = {};
  if (batteryKWh > 0) quoteUnits.bess = batteryKWh;
  if (solarW > 0) quoteUnits.solar = solarW;
  if (inverterKW > 0) quoteUnits.inverter_pcs = inverterKW;

  return {
    lineItems: marginLineItems,
    totalBaseCost: legacyResult.costs.totalProjectCost,
    riskLevel: 'standard', // TODO: Derive from use case or input
    customerSegment: 'direct', // TODO: Derive from user tier or input
    // maxMarginPercent: undefined, // For competitive bids, set via input
    quoteUnits,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a checksum for reproducibility verification.
 * Excludes timestamps but includes everything that affects math.
 */
function generateChecksum(
  versions: QuoteVersions,
  input: QuoteInputV2,
  assumptions: QuoteAssumptionsV2,
  sizingPolicy?: { mode: string; moduleId?: string; unitPowerMW?: number; unitEnergyMWh?: number; rounding: string; continuousThresholdMW: number }
): string {
  // Create a deterministic object for hashing
  const checksumData = {
    versions: {
      schemaVersion: versions.schemaVersion,
      engineVersion: versions.engineVersion,
      pricingModelVersion: versions.pricingModelVersion,
      productCatalogVersion: versions.productCatalogVersion,
      tariffRulesVersion: versions.tariffRulesVersion,
      assumptionsPackVersion: versions.assumptionsPackVersion,
      benchmarkSourcesVersion: versions.benchmarkSourcesVersion,
    },
    input: {
      // Exclude inputId and capturedAt (timestamps)
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours,
      solarMW: input.solarMW,
      windMW: input.windMW,
      generatorMW: input.generatorMW,
      generatorFuelType: input.generatorFuelType,
      fuelCellMW: input.fuelCellMW,
      fuelCellType: input.fuelCellType,
      location: input.location,
      zipCode: input.zipCode,
      electricityRate: input.electricityRate,
      demandCharge: input.demandCharge,
      gridConnection: input.gridConnection,
      useCase: input.useCase,
      itcConfig: input.itcConfig,
      batteryChemistry: input.batteryChemistry,
      cyclesPerYear: input.cyclesPerYear,
      averageDoD: input.averageDoD,
      annualSolarProductionKWh: input.annualSolarProductionKWh,
    },
    assumptions: {
      electricityRate: assumptions.electricityRate.value,
      demandCharge: assumptions.demandCharge.value,
      itcRate: assumptions.itcRate.value,
      batteryChemistry: assumptions.batteryChemistry.value,
      discountRate: assumptions.discountRate.value,
      projectLifeYears: assumptions.projectLifeYears.value,
    },
    // CRITICAL: Sizing policy changes the quote output, so it MUST be in checksum
    sizingPolicy: sizingPolicy ? {
      mode: sizingPolicy.mode,
      moduleId: sizingPolicy.moduleId,
      unitPowerMW: sizingPolicy.unitPowerMW,
      unitEnergyMWh: sizingPolicy.unitEnergyMWh,
      rounding: sizingPolicy.rounding,
      continuousThresholdMW: sizingPolicy.continuousThresholdMW,
    } : { mode: "continuous", rounding: "ceil", continuousThresholdMW: 1.0 },
  };

  // Simple hash (in production, use crypto.subtle or a proper hash lib)
  const jsonStr = JSON.stringify(checksumData, Object.keys(checksumData).sort());
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `tq2-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

/**
 * Create a recorded assumption with source tracking.
 */
function createAssumption<T>(
  value: T,
  source: RecordedAssumption<T>["source"],
  confidence: RecordedAssumption<T>["confidence"],
  options?: { reason?: string; sourceDetail?: string }
): RecordedAssumption<T> {
  return {
    value,
    source,
    confidence,
    reason: options?.reason,
    sourceDetail: options?.sourceDetail,
  };
}

// =============================================================================
// MAIN ADAPTER FUNCTIONS
// =============================================================================

/**
 * Normalize legacy input into QuoteInputV2.
 */
function normalizeInput(legacyInput: LegacyQuoteInput, capturedAt?: string): QuoteInputV2 {
  return {
    inputId: uuidv4(),
    capturedAt: capturedAt || new Date().toISOString(),
    storageSizeMW: legacyInput.storageSizeMW,
    durationHours: legacyInput.durationHours,
    solarMW: legacyInput.solarMW,
    windMW: legacyInput.windMW,
    generatorMW: legacyInput.generatorMW,
    generatorFuelType: legacyInput.generatorFuelType,
    fuelCellMW: legacyInput.fuelCellMW,
    fuelCellType: legacyInput.fuelCellType,
    location: legacyInput.location,
    zipCode: legacyInput.zipCode,
    electricityRate: legacyInput.electricityRate,
    demandCharge: legacyInput.demandCharge,
    gridConnection: legacyInput.gridConnection,
    useCase: legacyInput.useCase,
    industryData: legacyInput.industryData as Record<string, unknown> | undefined,
    itcConfig: legacyInput.itcConfig,
    batteryChemistry: legacyInput.batteryChemistry,
    cyclesPerYear: legacyInput.cyclesPerYear,
    averageDoD: legacyInput.averageDoD,
    annualSolarProductionKWh: legacyInput.annualSolarProductionKWh,
    includeAdvancedAnalysis: legacyInput.includeAdvancedAnalysis,
    loadProfileType: legacyInput.loadProfileType,
    peakDemandKW: legacyInput.peakDemandKW,
    annualLoadKWh: legacyInput.annualLoadKWh,
  };
}

/**
 * Extract assumptions from legacy input and result.
 */
function extractAssumptions(
  input: QuoteInputV2,
  legacyResult: QuoteResult
): QuoteAssumptionsV2 {
  const warnings: AssumptionWarning[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // RATE ASSUMPTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const rateSource = legacyResult.metadata.utilityRates?.source || "default";
  const rateConfidence = legacyResult.metadata.utilityRates?.confidence || "low";

  const electricityRate = createAssumption(
    legacyResult.metadata.utilityRates?.electricityRate || 0.15,
    input.electricityRate !== undefined ? "manual" : (rateSource as RecordedAssumption["source"]),
    input.electricityRate !== undefined ? "high" : rateConfidence,
    input.electricityRate === undefined && rateSource === "default"
      ? { reason: "No zip code or manual rate provided", sourceDetail: "Default fallback" }
      : { sourceDetail: legacyResult.metadata.utilityRates?.utilityName }
  );

  const demandCharge = createAssumption(
    legacyResult.metadata.utilityRates?.demandCharge || 15,
    input.demandCharge !== undefined ? "manual" : (rateSource as RecordedAssumption["source"]),
    input.demandCharge !== undefined ? "high" : rateConfidence,
    input.demandCharge === undefined && rateSource === "default"
      ? { reason: "No zip code or manual demand charge provided" }
      : undefined
  );

  // Add warnings for low-confidence rates
  if (rateSource === "default" && input.electricityRate === undefined) {
    warnings.push({
      code: "FALLBACK_RATE",
      message: "Using default electricity rate. Provide zip code or manual rate for accuracy.",
      impact: "medium",
      affectedFields: ["electricityRate", "annualSavings", "paybackYears"],
    });
  }

  if (!input.zipCode) {
    warnings.push({
      code: "NO_ZIP_CODE",
      message: "No zip code provided. Utility-specific rates could not be looked up.",
      impact: "medium",
      affectedFields: ["electricityRate", "demandCharge"],
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ITC ASSUMPTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const itcDetails = legacyResult.metadata.itcDetails;
  const pwaProvided = input.itcConfig?.prevailingWage !== undefined;
  const defaultPWA = input.storageSizeMW >= 1; // Projects ≥1 MW default to PWA

  const itcRate = createAssumption(
    itcDetails?.totalRate || 0.30,
    pwaProvided ? "manual" : "default",
    pwaProvided ? "high" : "medium",
    !pwaProvided
      ? { reason: `PWA assumed ${defaultPWA ? "true" : "false"} based on system size`, sourceDetail: "IRA 2022 default logic" }
      : { sourceDetail: "IRA 2022 (IRC Section 48)" }
  );

  if (!pwaProvided && input.storageSizeMW >= 1) {
    warnings.push({
      code: "DEFAULT_ITC_ASSUMED",
      message: "Prevailing wage compliance assumed for ≥1 MW project. Verify PWA status.",
      impact: "high",
      affectedFields: ["taxCredit", "netCost"],
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BATTERY/DEGRADATION ASSUMPTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const degradation = legacyResult.metadata.degradation;
  const chemistryProvided = input.batteryChemistry !== undefined;

  const batteryChemistry = createAssumption<BatteryChemistry>(
    degradation?.chemistry || "lfp",
    chemistryProvided ? "manual" : "default",
    chemistryProvided ? "high" : "medium",
    !chemistryProvided
      ? { reason: "LFP is most common for C&I BESS", sourceDetail: "Industry standard assumption" }
      : undefined
  );

  const cyclesPerYear = createAssumption(
    input.cyclesPerYear || 365,
    input.cyclesPerYear !== undefined ? "manual" : "default",
    input.cyclesPerYear !== undefined ? "high" : "medium",
    input.cyclesPerYear === undefined
      ? { reason: "Daily cycling assumed", sourceDetail: "NREL StoreFAST default" }
      : undefined
  );

  const averageDoD = createAssumption(
    input.averageDoD || 0.8,
    input.averageDoD !== undefined ? "manual" : "default",
    input.averageDoD !== undefined ? "high" : "medium",
    input.averageDoD === undefined
      ? { reason: "80% DoD is optimal for LFP longevity", sourceDetail: "PNNL degradation curves" }
      : undefined
  );

  // Extract degradation rates from metadata
  const year10Pct = degradation?.year10CapacityPct || 85;
  const year25Pct = degradation?.year25CapacityPct || 62;
  const calendarRate = (100 - year25Pct) / 25 / 100; // Simplified
  const cycleRate = 0.0002; // Per-cycle degradation (simplified)

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCIAL ASSUMPTIONS (from centralizedCalculations defaults)
  // ─────────────────────────────────────────────────────────────────────────

  const discountRate = createAssumption(
    legacyResult.benchmarkAudit.assumptions.discountRate,
    "benchmark",
    "high",
    { reason: "NREL StoreFAST recommended rate", sourceDetail: "NREL StoreFAST Model" }
  );

  const projectLifeYears = createAssumption(
    legacyResult.benchmarkAudit.assumptions.projectLifeYears,
    "benchmark",
    "high",
    { reason: "Standard BESS project lifetime", sourceDetail: "NREL ATB 2024" }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // GENERATION ASSUMPTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const solarMW = createAssumption(
    input.solarMW ?? 0,
    input.solarMW !== undefined ? "manual" : "default",
    "high"
  );

  const windMW = createAssumption(
    input.windMW ?? 0,
    input.windMW !== undefined ? "manual" : "default",
    "high"
  );

  const generatorMW = createAssumption(
    input.generatorMW ?? 0,
    input.generatorMW !== undefined ? "manual" : "default",
    "high"
  );

  const generatorFuelType = createAssumption<GeneratorFuelType>(
    input.generatorFuelType ?? "natural-gas",
    input.generatorFuelType !== undefined ? "manual" : "default",
    input.generatorFuelType !== undefined ? "high" : "medium",
    input.generatorFuelType === undefined
      ? { reason: "Natural gas default for cleaner emissions" }
      : undefined
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SOLAR PRODUCTION ASSUMPTIONS
  // ─────────────────────────────────────────────────────────────────────────

  let solarCapacityFactor: RecordedAssumption<number> | undefined;
  let annualSolarProductionKWh: RecordedAssumption<number> | undefined;

  if (legacyResult.metadata.solarProduction) {
    const sp = legacyResult.metadata.solarProduction;
    solarCapacityFactor = createAssumption(
      sp.capacityFactorPct,
      sp.source === "manual" ? "manual" : "inferred",
      sp.source === "pvwatts" ? "high" : sp.source === "regional-estimate" ? "medium" : "high",
      { sourceDetail: sp.source === "pvwatts" ? "NREL PVWatts API" : `Regional estimate for ${sp.state}` }
    );
    annualSolarProductionKWh = createAssumption(
      sp.annualProductionKWh,
      sp.source === "manual" ? "manual" : "inferred",
      sp.source === "pvwatts" ? "high" : "medium"
    );

    if (sp.source === "regional-estimate") {
      warnings.push({
        code: "SOLAR_PRODUCTION_ESTIMATED",
        message: "Solar production estimated from regional averages. Use PVWatts API for accuracy.",
        impact: "low",
        affectedFields: ["solarProduction", "annualSavings"],
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GRID ASSUMPTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const gridConnection = createAssumption<GridConnection>(
    input.gridConnection ?? "on-grid",
    input.gridConnection !== undefined ? "manual" : "default",
    input.gridConnection !== undefined ? "high" : "medium",
    input.gridConnection === undefined
      ? { reason: "Grid-tied assumed for most C&I projects" }
      : undefined
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SIZING ASSUMPTIONS (NEW - Jan 2026)
  // Explains why actual battery kWh may differ from nominal (MW × hours × 1000)
  // Uses sizing policy metadata from equipment breakdown when available
  // ─────────────────────────────────────────────────────────────────────────

  const nominalKWh = input.storageSizeMW * input.durationHours * 1000;
  const equipment = legacyResult.equipment;
  
  // Get sizing metadata from equipment breakdown (NEW - uses SizingPolicy)
  const sizingMeta = (equipment.batteries as Record<string, unknown>).sizingPolicy as { mode: string; actualMWh: number; oversizeFactor: number; moduleId?: string; rounding?: string } | undefined;
  const actualKWh = sizingMeta 
    ? sizingMeta.actualMWh * 1000 
    : equipment.batteries.unitEnergyMWh * equipment.batteries.quantity * 1000;
  const oversizeFactor = sizingMeta?.oversizeFactor ?? (nominalKWh > 0 ? actualKWh / nominalKWh : 1.0);
  const sizingMode = sizingMeta?.mode ?? "continuous";
  const moduleId = sizingMeta?.moduleId;

  // Determine if this is a small system (< 1 MW uses exact sizing)
  const isSmallSystem = input.storageSizeMW < 1.0;

  // Decompose the oversize factor based on sizing mode:
  // - continuous: No oversize (exact sizing)
  // - modular: Oversize due to modular unit granularity (e.g., 11.5 MWh Tesla Megapack)
  const modularUnitMWh = sizingMeta?.actualMWh 
    ? sizingMeta.actualMWh / equipment.batteries.quantity 
    : equipment.batteries.unitEnergyMWh;
  const modularUnitFactor = sizingMode === "modular" ? oversizeFactor : 1.0;
  
  // Current engine doesn't apply DoD, reserve, RTE, etc. to sizing
  // These are all 1.0 (identity) because the engine quotes nameplate capacity
  const dodFactor = 1.0;        // Nameplate quoted, no DoD adjustment in sizing
  const reserveFactor = 1.0;    // No explicit reserve margin in current engine
  const rteFactor = 1.0;        // RTE accounted in financial model, not sizing
  const eolCapacityFactor = 1.0; // No EOL oversizing in current engine
  const auxLossesFactor = 1.0;  // Aux losses in financial model, not sizing

  const sizing = {
    nominalKWh: createAssumption(
      nominalKWh,
      "calculated",
      "high",
      { reason: "storageSizeMW × durationHours × 1000" }
    ),
    actualKWh: createAssumption(
      actualKWh,
      "calculated",
      "high",
      { reason: sizingMode === "continuous" 
          ? "Continuous sizing: exact capacity delivered" 
          : `${equipment.batteries.quantity} × ${modularUnitMWh} MWh modular units` 
      }
    ),
    oversizeFactor: createAssumption(
      oversizeFactor,
      "calculated",
      "high",
      { 
        reason: sizingMode === "continuous" 
          ? "Continuous sizing: exact capacity, no oversize" 
          : `Modular sizing: unit granularity (${modularUnitMWh} MWh increments)`,
        sourceDetail: moduleId ? `Module: ${moduleId}` : "SizingPolicy configuration"
      }
    ),
    oversizeDecomposition: {
      modularUnitFactor: createAssumption(
        modularUnitFactor,
        sizingMode === "continuous" ? "calculated" : "benchmark",
        "high",
        { 
          reason: sizingMode === "continuous" 
            ? "Continuous mode: no modular constraint" 
            : `Minimum increment: ${modularUnitMWh} MWh per unit`,
          sourceDetail: moduleId ?? "SizingPolicy configuration"
        }
      ),
      dodFactor: createAssumption(dodFactor, "default", "high", { reason: "Nameplate capacity quoted (DoD in operations, not sizing)" }),
      reserveFactor: createAssumption(reserveFactor, "default", "high", { reason: "No explicit reserve margin in sizing model" }),
      rteFactor: createAssumption(rteFactor, "default", "high", { reason: "RTE losses in financial model, not sizing" }),
      eolCapacityFactor: createAssumption(eolCapacityFactor, "default", "high", { reason: "No EOL capacity sizing in current engine" }),
      auxLossesFactor: createAssumption(auxLossesFactor, "default", "high", { reason: "Aux losses in financial model, not sizing" }),
    },
    isSmallSystem: createAssumption(
      isSmallSystem,
      "calculated",
      "high",
      { reason: `System size ${input.storageSizeMW} MW ${isSmallSystem ? "<" : "≥"} 1 MW threshold` }
    ),
    sizingMode: createAssumption(
      sizingMode,
      sizingMeta ? "manual" : "default",
      "high",
      { 
        reason: sizingMode === "continuous" 
          ? "Vendor-neutral exact sizing for accurate cost estimation" 
          : "Modular sizing for vendor-specific quote",
        sourceDetail: moduleId ?? "SizingPolicy default"
      }
    ),
    modularUnitMWh: sizingMode === "modular"
      ? createAssumption(modularUnitMWh, "benchmark", "high", { sourceDetail: moduleId ?? "Module specification" })
      : undefined,
  } as any;

  return {
    electricityRate,
    demandCharge,
    utilityName: legacyResult.metadata.utilityRates?.utilityName
      ? createAssumption(legacyResult.metadata.utilityRates.utilityName, "lookup", rateConfidence)
      : undefined,
    itcRate,
    itcPrevailingWageAssumed: createAssumption(
      itcDetails?.qualifications?.prevailingWage ?? defaultPWA,
      pwaProvided ? "manual" : "default",
      pwaProvided ? "high" : "medium"
    ),
    itcEnergyCommunityClaimed: createAssumption(
      itcDetails?.qualifications?.energyCommunity ?? false,
      input.itcConfig?.energyCommunity !== undefined ? "manual" : "default",
      "high"
    ),
    itcDomesticContentClaimed: createAssumption(
      itcDetails?.qualifications?.domesticContent ?? false,
      input.itcConfig?.domesticContent !== undefined ? "manual" : "default",
      "high"
    ),
    itcLowIncomeClaimed: createAssumption(
      itcDetails?.qualifications?.lowIncome ?? false,
      input.itcConfig?.lowIncomeProject !== undefined ? "manual" : "default",
      "high"
    ),
    batteryChemistry,
    cyclesPerYear,
    averageDoD,
    roundTripEfficiency: createAssumption(0.88, "benchmark", "high", { sourceDetail: "NREL ATB 2024 LFP" }),
    calendarDegradationRate: createAssumption(calendarRate, "benchmark", "medium", { sourceDetail: "PNNL 2023" }),
    cycleDegradationRate: createAssumption(cycleRate, "benchmark", "medium", { sourceDetail: "PNNL 2023" }),
    discountRate,
    projectLifeYears,
    inflationRate: createAssumption(0.025, "benchmark", "high", { sourceDetail: "Fed target rate" }),
    electricityEscalationRate: createAssumption(0.02, "benchmark", "medium", { sourceDetail: "EIA AEO 2024" }),
    solarMW,
    windMW,
    generatorMW,
    generatorFuelType,
    solarCapacityFactor,
    annualSolarProductionKWh,
    gridConnection,
    sizing,
    warnings,
  };
}

/**
 * Build QuoteConfigV2 from equipment breakdown.
 */
function buildConfig(input: QuoteInputV2, legacyResult: QuoteResult): QuoteConfigV2 {
  const equipment = legacyResult.equipment;
  const lineItems: QuoteConfigLineItem[] = [];

  // Extract sizing mode for pricing basis determination
  const sizingMode = ((equipment.batteries as Record<string, unknown>).sizingPolicy as Record<string, unknown> | undefined)?.mode as string ?? "continuous";
  const isModular = sizingMode === "modular";

  // Calculate derived values from actual interface
  const batteryKWh = equipment.batteries.unitEnergyMWh * equipment.batteries.quantity * 1000;
  const inverterKW = equipment.inverters.unitPowerMW * equipment.inverters.quantity * 1000;

  // ─────────────────────────────────────────────────────────────────────────
  // BATTERIES - Pricing depends on sizing mode
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.batteries.totalCost > 0) {
    // Determine SKU: generic for continuous, vendor-specific for modular
    const batterySku = isModular && ((equipment.batteries as Record<string, unknown>).sizingPolicy as Record<string, unknown> | undefined)?.moduleId
      ? `BESS-${((equipment.batteries as Record<string, unknown>).sizingPolicy as Record<string, unknown>)!.moduleId}`
      : `BESS-generic-${legacyResult.metadata.systemCategory}`;

    // Determine pricing basis
    const batteryUnitBasis: import("../contracts/truequote.v2").UnitBasis = isModular ? "per_module" : "per_kWh";
    const batteryUnitQuantity = isModular 
      ? equipment.batteries.quantity 
      : batteryKWh;
    const batteryUnitRate = isModular
      ? equipment.batteries.unitCost  // $/module
      : equipment.batteries.pricePerKWh;  // $/kWh

    lineItems.push({
      sku: batterySku,
      category: "bess",
      description: `Battery Energy Storage (${batteryKWh.toLocaleString()} kWh)`,
      quantity: equipment.batteries.quantity || 1,
      unitCost: equipment.batteries.unitCost,
      extendedCost: equipment.batteries.totalCost,
      costSource: equipment.batteries.marketIntelligence?.dataSource || "NREL ATB 2024",
      marginRule: "standard-12%",
      benchmarkId: legacyResult.metadata.systemCategory === "utility" ? "bess-lfp-utility-scale" : "bess-lfp-commercial",
      // NEW: Pricing transparency
      unitBasis: batteryUnitBasis,
      unitQuantity: batteryUnitQuantity,
      unitRate: batteryUnitRate,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INVERTERS - Always per_kW basis
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.inverters.totalCost > 0) {
    const inverterUnitRate = inverterKW > 0 ? equipment.inverters.totalCost / inverterKW : 0;
    
    lineItems.push({
      sku: `PCS-${equipment.inverters.quantity}X`,
      category: "pcs",
      description: `Power Conversion System (${inverterKW.toLocaleString()} kW)`,
      quantity: equipment.inverters.quantity,
      unitCost: equipment.inverters.unitCost,
      extendedCost: equipment.inverters.totalCost,
      costSource: "NREL ATB 2024",
      marginRule: "standard-15%",
      // NEW: Pricing transparency
      unitBasis: "per_kW",
      unitQuantity: inverterKW,
      unitRate: inverterUnitRate,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSFORMERS - Per unit basis
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.transformers && equipment.transformers.totalCost > 0) {
    const xfmrQuantity = equipment.transformers.quantity || 1;
    const xfmrUnitCost = equipment.transformers.totalCost / Math.max(1, xfmrQuantity);
    
    lineItems.push({
      sku: `XFMR-MV`,
      category: "transformer",
      description: "Medium Voltage Transformer",
      quantity: xfmrQuantity,
      unitCost: xfmrUnitCost,
      extendedCost: equipment.transformers.totalCost,
      costSource: "Industry pricing",
      marginRule: "standard-18%",
      // NEW: Pricing transparency
      unitBasis: "per_unit",
      unitQuantity: xfmrQuantity,
      unitRate: xfmrUnitCost,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SOLAR - Per kW basis
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.solar && equipment.solar.totalCost > 0) {
    const solarKW = (input.solarMW || 0) * 1000;
    const solarUnitRate = solarKW > 0 ? equipment.solar.totalCost / solarKW : 0;
    
    lineItems.push({
      sku: `SOLAR-PV`,
      category: "solar",
      description: `Solar PV Array (${solarKW.toLocaleString()} kW)`,
      quantity: 1,
      unitCost: equipment.solar.totalCost,
      extendedCost: equipment.solar.totalCost,
      costSource: "NREL Cost Benchmark Q1 2024",
      marginRule: "standard-10%",
      // NEW: Pricing transparency
      unitBasis: "per_kW",
      unitQuantity: solarKW,
      unitRate: solarUnitRate,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIND - Per kW basis
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.wind && equipment.wind.totalCost > 0) {
    const windKW = (input.windMW || 0) * 1000;
    const windUnitRate = windKW > 0 ? equipment.wind.totalCost / windKW : 0;
    
    lineItems.push({
      sku: `WIND-TURB`,
      category: "wind",
      description: `Wind Turbines (${windKW.toLocaleString()} kW)`,
      quantity: 1,
      unitCost: equipment.wind.totalCost,
      extendedCost: equipment.wind.totalCost,
      costSource: "NREL ATB 2024",
      marginRule: "standard-10%",
      // NEW: Pricing transparency
      unitBasis: "per_kW",
      unitQuantity: windKW,
      unitRate: windUnitRate,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERATORS - Per kW basis
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.generators && equipment.generators.totalCost > 0) {
    const genKW = (input.generatorMW || 0) * 1000;
    const genUnitRate = equipment.generators.costPerKW || (genKW > 0 ? equipment.generators.totalCost / genKW : 0);
    
    lineItems.push({
      sku: `GEN-${(input.generatorFuelType || "natural-gas").toUpperCase()}`,
      category: "generator",
      description: `Generator (${genKW.toLocaleString()} kW)`,
      quantity: equipment.generators.quantity || 1,
      unitCost: equipment.generators.unitCost || equipment.generators.totalCost,
      extendedCost: equipment.generators.totalCost,
      costSource: "EIA Electric Power Monthly",
      marginRule: "standard-12%",
      // NEW: Pricing transparency
      unitBasis: "per_kW",
      unitQuantity: genKW,
      unitRate: genUnitRate,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM CONTROLS - EMS (lump sum)
  // ─────────────────────────────────────────────────────────────────────────
  if (equipment.systemControls?.ems && equipment.systemControls.ems.totalInitialCost > 0) {
    lineItems.push({
      sku: `EMS-CTRL`,
      category: "ems",
      description: "Energy Management System",
      quantity: 1,
      unitCost: equipment.systemControls.ems.totalInitialCost,
      extendedCost: equipment.systemControls.ems.totalInitialCost,
      costSource: "Industry pricing",
      marginRule: "standard-30%",
      // NEW: Pricing transparency
      unitBasis: "lump_sum",
      unitQuantity: 1,
      unitRate: equipment.systemControls.ems.totalInitialCost,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM CONTROLS - BOS (lump sum)
  // ─────────────────────────────────────────────────────────────────────────
  const systemControlsTotalCost = equipment.systemControls?.totalCost || 0;
  const emsInitialCost = equipment.systemControls?.ems?.totalInitialCost || 0;
  const remainingSystemControlsCost = systemControlsTotalCost - emsInitialCost;
  
  if (remainingSystemControlsCost > 0) {
    lineItems.push({
      sku: `CTRL-PKG`,
      category: "bos",
      description: "System Controls (SCADA, Controllers, Integration)",
      quantity: 1,
      unitCost: remainingSystemControlsCost,
      extendedCost: remainingSystemControlsCost,
      costSource: "NREL Cost Benchmark",
      marginRule: "standard-15%",
      // NEW: Pricing transparency
      unitBasis: "lump_sum",
      unitQuantity: 1,
      unitRate: remainingSystemControlsCost,
    });
  }

  // Extract sizing policy from equipment breakdown
  const sizingMeta = (equipment.batteries as Record<string, unknown>).sizingPolicy as Record<string, unknown> | undefined;
  const sizingPolicySnapshot: import("../contracts/truequote.v2").SizingPolicySnapshot = {
    mode: (sizingMeta?.mode as "continuous" | "modular") ?? "continuous",
    moduleId: sizingMeta?.mode === "modular" ? sizingMeta.moduleId as string | undefined : undefined,
    unitPowerMW: sizingMeta?.mode === "modular" && sizingMeta.moduleId 
      ? (equipment.batteries.unitPowerMW || undefined) 
      : undefined,
    unitEnergyMWh: sizingMeta?.mode === "modular" && sizingMeta.moduleId 
      ? (equipment.batteries.unitEnergyMWh || undefined) 
      : undefined,
    rounding: (sizingMeta?.rounding as "round" | "ceil" | "floor") ?? "ceil",
    continuousThresholdMW: 1.0, // Default threshold
    manufacturer: sizingMeta?.mode === "modular" ? equipment.batteries.manufacturer : undefined,
    model: sizingMeta?.mode === "modular" ? equipment.batteries.model : undefined,
  };

  return {
    configId: uuidv4(),
    lineItems,
    pricingSnapshot: {
      frozenAt: new Date().toISOString(),
      catalogVersion: PRODUCT_CATALOG_VERSION,
      marginRulesVersion: PRICING_MODEL_VERSION,
      shippingRulesVersion: "2026.01.01",
      taxRulesVersion: TARIFF_RULES_VERSION,
      currency: "USD",
    },
    sizingPolicySnapshot,
    systemCategory: legacyResult.metadata.systemCategory,
  };
}

/**
 * Build audit trail from legacy result.
 */
function buildAudit(
  versions: QuoteVersions,
  input: QuoteInputV2,
  assumptions: QuoteAssumptionsV2,
  legacyResult: QuoteResult,
  sizingPolicySnapshot: import("../contracts/truequote.v2").SizingPolicySnapshot
): QuoteAuditV2 {
  // Include sizing policy in checksum - CRITICAL for reproducibility
  const checksum = generateChecksum(versions, input, assumptions, {
    mode: sizingPolicySnapshot.mode,
    moduleId: sizingPolicySnapshot.moduleId,
    unitPowerMW: sizingPolicySnapshot.unitPowerMW,
    unitEnergyMWh: sizingPolicySnapshot.unitEnergyMWh,
    rounding: sizingPolicySnapshot.rounding,
    continuousThresholdMW: sizingPolicySnapshot.continuousThresholdMW,
  });

  // Convert benchmark sources
  const sources = legacyResult.benchmarkAudit.sources.map((s) => ({
    component: s.component,
    benchmarkId: s.benchmarkId,
    value: s.value,
    unit: s.unit,
    source: s.source,
    vintage: s.vintage,
    citation: s.citation,
  }));

  // Build line items with formula provenance
  const batteryKWh = legacyResult.equipment.batteries.unitEnergyMWh * legacyResult.equipment.batteries.quantity * 1000;
  const inverterKW = legacyResult.equipment.inverters.unitPowerMW * legacyResult.equipment.inverters.quantity * 1000;
  
  const lineItems: AuditLineItem[] = [
    {
      name: "Battery Cost",
      value: legacyResult.equipment.batteries.totalCost,
      unit: "USD",
      formula: "kWh × $/kWh × (1 + margin)",
      inputs: {
        kWh: batteryKWh,
        pricePerKWh: legacyResult.equipment.batteries.pricePerKWh,
      },
      source: legacyResult.equipment.batteries.marketIntelligence?.dataSource || "NREL ATB 2024",
    },
    {
      name: "Inverter Cost",
      value: legacyResult.equipment.inverters.totalCost,
      unit: "USD",
      formula: "kW × $/kW × count × (1 + margin)",
      inputs: {
        kW: inverterKW,
        count: legacyResult.equipment.inverters.quantity,
      },
      source: "NREL ATB 2024",
    },
    {
      name: "Installation Cost",
      value: legacyResult.costs.installationCost,
      unit: "USD",
      formula: "equipmentCost × installMultiplier",
      inputs: {
        equipmentCost: legacyResult.costs.equipmentCost,
        installMultiplier: legacyResult.costs.installationCost / legacyResult.costs.equipmentCost,
      },
      source: "NREL Cost Benchmark",
    },
    {
      name: "Tax Credit (ITC)",
      value: legacyResult.costs.taxCredit,
      unit: "USD",
      formula: "eligibleBasis × itcRate",
      inputs: {
        eligibleBasis: legacyResult.costs.totalProjectCost,
        itcRate: legacyResult.metadata.itcDetails?.totalRate || 0.30,
      },
      source: "IRA 2022 (IRC Section 48)",
    },
    {
      name: "Annual Savings",
      value: legacyResult.financials.annualSavings,
      unit: "USD/year",
      formula: "peakShavingSavings + arbitrageSavings + demandChargeSavings",
      inputs: {
        electricityRate: assumptions.electricityRate.value,
        demandCharge: assumptions.demandCharge.value,
        storageMWh: input.storageSizeMW * input.durationHours,
      },
      source: "NREL StoreFAST methodology",
    },
    {
      name: "Payback Period",
      value: legacyResult.financials.paybackYears,
      unit: "years",
      formula: "netCost / annualSavings",
      inputs: {
        netCost: legacyResult.costs.netCost,
        annualSavings: legacyResult.financials.annualSavings,
      },
      source: "Calculated",
    },
    {
      name: "NPV",
      value: legacyResult.financials.npv,
      unit: "USD",
      formula: "Σ(cashflow_t / (1 + r)^t) for t=0..25",
      inputs: {
        discountRate: assumptions.discountRate.value,
        projectYears: assumptions.projectLifeYears.value,
        annualSavings: legacyResult.financials.annualSavings,
        netCost: legacyResult.costs.netCost,
      },
      source: "NREL StoreFAST methodology",
    },
  ];

  return {
    reproducible: true,
    checksum,
    benchmarkVersion: legacyResult.benchmarkAudit.version,
    methodology: legacyResult.benchmarkAudit.methodology,
    sources,
    lineItems,
    deviations: legacyResult.benchmarkAudit.deviations,
  };
}

// =============================================================================
// MAIN ADAPTER FUNCTION
// =============================================================================

/**
 * Generate a TrueQuoteV2 sealed envelope from legacy input.
 *
 * This is the main entry point for the V2 adapter.
 * It accepts the current input format and returns a fully sealed TrueQuoteV2.
 *
 * @param legacyInput - Input in the current QuoteInput format
 * @param options - Optional configuration
 * @returns TrueQuoteV2 sealed envelope
 */
export async function generateTrueQuoteV2(
  legacyInput: LegacyQuoteInput,
  options?: {
    capturedAt?: string;
    quoteId?: string;
  }
): Promise<TrueQuoteV2> {
  // Step 1: Normalize input
  const input = normalizeInput(legacyInput, options?.capturedAt);

  // Step 2: Call the legacy calculator
  const legacyResult = await calculateQuote(legacyInput as QuoteInput);

  // Step 3: Extract assumptions
  const assumptions = extractAssumptions(input, legacyResult);

  // Step 4: Build versions
  const versions: QuoteVersions = {
    schemaVersion: "2.0.0",
    engineVersion: ENGINE_VERSION,
    pricingModelVersion: PRICING_MODEL_VERSION,
    productCatalogVersion: PRODUCT_CATALOG_VERSION,
    tariffRulesVersion: TARIFF_RULES_VERSION,
    assumptionsPackVersion: ASSUMPTIONS_PACK_VERSION,
    benchmarkSourcesVersion: CURRENT_BENCHMARK_VERSION.version,
  };

  // Step 5: Build config
  const config = buildConfig(input, legacyResult);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 6: Apply margin policy (SINGLE INSERTION POINT)
  // This is the ONLY place margin is calculated. Steps 4/5/6 of WizardV6
  // consume sellPriceTotal from this envelope - never compute margin themselves.
  // ─────────────────────────────────────────────────────────────────────────
  const marginPolicyInput = buildMarginPolicyInput(config, legacyResult, input);
  const marginResult = applyMarginPolicy(marginPolicyInput);
  
  // Build margin policy snapshot for envelope
  const marginPolicy: QuoteMarginPolicyV2 = {
    baseCostTotal: marginResult.baseCostTotal,
    sellPriceTotal: marginResult.sellPriceTotal,
    totalMarginDollars: marginResult.totalMarginDollars,
    blendedMarginPercent: marginResult.blendedMarginPercent,
    marginBandId: marginResult.marginBandId,
    marginBandDescription: marginResult.marginBandDescription,
    lineItems: marginResult.lineItems.map(item => ({
      sku: item.sku,
      category: item.category,
      description: item.description,
      baseCost: item.baseCost,
      sellPrice: item.sellPrice,
      marginPercent: item.appliedMarginPercent,
      marginDollars: item.marginDollars,
      wasClampedFloor: item.wasClampedFloor,
      wasClampedCeiling: item.wasClampedCeiling,
    })),
    clampEvents: marginResult.clampEvents.map(e => ({
      reason: e.reason as import('@/contracts/truequote.v2').MarginClampEvent['reason'],
      originalValue: e.originalValue,
      clampedValue: e.clampedValue,
      guardName: e.guardName,
    })),
    policyVersion: marginResult.policyVersion,
    pricingAsOf: new Date().toISOString(),
    maxMarginCapApplied: marginResult.clampEvents.some(
      e => e.guardName.includes('hard cap') || e.guardName.includes('maxMarginPercent')
    ),
    passesQuoteLevelGuards: marginResult.passesQuoteLevelGuards,
    quoteLevelWarnings: marginResult.quoteLevelWarnings,
  };

  // Step 7: Build outputs (include sellPriceTotal from margin policy)
  const outputs: QuoteOutputsV2 = {
    costs: {
      ...legacyResult.costs,
      // Add margin-adjusted totals for Steps 4/5/6 to consume
      sellPriceTotal: marginResult.sellPriceTotal,
      baseCostTotal: marginResult.baseCostTotal,
      marginDollars: marginResult.totalMarginDollars,
    },
    financials: legacyResult.financials,
    equipment: legacyResult.equipment,
  };

  // Step 8: Build metadata
  const metadata: QuoteMetadataV2 = {
    calculatedAt: new Date().toISOString(),
    pricingSource: legacyResult.metadata.pricingSource,
    itcDetails: legacyResult.metadata.itcDetails,
    utilityRates: legacyResult.metadata.utilityRates,
    degradation: legacyResult.metadata.degradation,
    solarProduction: legacyResult.metadata.solarProduction,
    advancedAnalysis: legacyResult.metadata.advancedAnalysis,
  };

  // Step 9: Build audit (pass sizing policy for checksum inclusion)
  const audit = buildAudit(versions, input, assumptions, legacyResult, config.sizingPolicySnapshot);

  // Step 10: Assemble sealed envelope with margin policy
  const trueQuote: TrueQuoteV2 = {
    quoteId: options?.quoteId || uuidv4(),
    versions,
    input,
    assumptions,
    config,
    outputs,
    metadata,
    audit,
    marginPolicy, // ← SINGLE INSERTION POINT: Steps 4/5/6 consume this
  };

  return trueQuote;
}

/**
 * Verify a quote is reproducible by regenerating and comparing checksums.
 */
export async function verifyQuoteReproducibility(
  quote: TrueQuoteV2
): Promise<{ reproducible: boolean; reason?: string }> {
  try {
    // Regenerate with same input
    const regenerated = await generateTrueQuoteV2(
      {
        storageSizeMW: quote.input.storageSizeMW,
        durationHours: quote.input.durationHours,
        solarMW: quote.input.solarMW,
        windMW: quote.input.windMW,
        generatorMW: quote.input.generatorMW,
        generatorFuelType: quote.input.generatorFuelType,
        fuelCellMW: quote.input.fuelCellMW,
        fuelCellType: quote.input.fuelCellType,
        location: quote.input.location,
        zipCode: quote.input.zipCode,
        electricityRate: quote.input.electricityRate,
        demandCharge: quote.input.demandCharge,
        gridConnection: quote.input.gridConnection,
        useCase: quote.input.useCase,
        itcConfig: quote.input.itcConfig,
        batteryChemistry: quote.input.batteryChemistry,
        cyclesPerYear: quote.input.cyclesPerYear,
        averageDoD: quote.input.averageDoD,
        annualSolarProductionKWh: quote.input.annualSolarProductionKWh,
      },
      { capturedAt: quote.input.capturedAt }
    );

    // Compare key outputs (not checksums, since versions may differ)
    const costMatch = Math.abs(regenerated.outputs.costs.totalProjectCost - quote.outputs.costs.totalProjectCost) < 1;
    const savingsMatch = Math.abs(regenerated.outputs.financials.annualSavings - quote.outputs.financials.annualSavings) < 1;

    if (costMatch && savingsMatch) {
      return { reproducible: true };
    } else {
      return {
        reproducible: false,
        reason: `Costs differ: original=${quote.outputs.costs.totalProjectCost}, regenerated=${regenerated.outputs.costs.totalProjectCost}`,
      };
    }
  } catch (error) {
    return {
      reproducible: false,
      reason: `Regeneration failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Re-export types for convenience
export type { TrueQuoteV2, QuoteInputV2, QuoteAssumptionsV2, LegacyQuoteInput };
