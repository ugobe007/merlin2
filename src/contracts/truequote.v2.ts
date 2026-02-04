/**
 * TRUEQUOTE V2 SEALED CONTRACT
 * ============================
 *
 * This file defines the immutable contract for Merlin quotes.
 * All types here are derived from the ACTUAL types in unifiedQuoteCalculator.ts
 * as of January 29, 2026.
 *
 * RULES:
 * 1. UI/Wizard only ever edits QuoteInputV2
 * 2. Everything else is engine output (read-only to callers)
 * 3. No calculation logic lives here - only type definitions
 * 4. Any field that affects math MUST be in the checksum
 *
 * @version 2.0.0
 * @date 2026-01-29
 */

import type { EquipmentBreakdown } from "@/utils/equipmentCalculations";

// =============================================================================
// VERSIONING - All versions that can change quote output
// =============================================================================

export interface QuoteVersions {
  /** This contract schema version */
  schemaVersion: "2.0.0";

  /** Calculation engine version (from package.json or git hash) */
  engineVersion: string;

  /** Pricing model version (when pricing rules last changed) */
  pricingModelVersion: string;

  /** Product catalog version (equipment SKUs/specs) */
  productCatalogVersion: string;

  /** Tariff rules version (demand charges, TOU, interconnect) */
  tariffRulesVersion: string;

  /** Assumptions pack version (losses, degradation, derates) */
  assumptionsPackVersion: string;

  /** Benchmark sources version (NREL ATB vintage, etc.) */
  benchmarkSourcesVersion: string;
}

// =============================================================================
// INPUT - Normalized user facts (UI edits these, nothing else)
// =============================================================================

/** Generator fuel types (matches unifiedQuoteCalculator.ts) */
export type GeneratorFuelType = "diesel" | "natural-gas" | "dual-fuel";

/** Fuel cell types (matches unifiedQuoteCalculator.ts) */
export type FuelCellType = "hydrogen" | "natural-gas-fc" | "solid-oxide";

/** Battery chemistry types (matches batteryDegradationService.ts) */
export type BatteryChemistry = "lfp" | "nmc" | "nca" | "flow-vrb" | "sodium-ion";

/** Grid connection types (matches unifiedQuoteCalculator.ts) */
export type GridConnection = "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive";

/** Load profile types for 8760 analysis */
export type LoadProfileType =
  | "commercial-office"
  | "commercial-retail"
  | "industrial"
  | "hotel"
  | "hospital"
  | "data-center"
  | "ev-charging"
  | "warehouse";

/**
 * ITC Configuration per IRA 2022.
 * Maps 1:1 to QuoteInput.itcConfig in unifiedQuoteCalculator.ts
 */
export interface ITCConfigInput {
  prevailingWage?: boolean;
  apprenticeship?: boolean;
  energyCommunity?: boolean | "coal-closure" | "brownfield" | "fossil-fuel-employment";
  domesticContent?: boolean;
  lowIncomeProject?: boolean | "located-in" | "serves";
}

/**
 * QuoteInputV2 - Normalized user facts only.
 *
 * EVERY field here is either:
 * - Explicitly provided by user, OR
 * - Will be recorded as an assumption if defaulted
 *
 * Maps 1:1 to QuoteInput in unifiedQuoteCalculator.ts
 */
export interface QuoteInputV2 {
  /** Unique identifier for this input set (for reproducibility) */
  readonly inputId: string;

  /** When this input was captured (ISO 8601) */
  readonly capturedAt: string;

  // ─────────────────────────────────────────────────────────────────────────
  // REQUIRED: System sizing (must be provided)
  // ─────────────────────────────────────────────────────────────────────────

  /** Storage power in MW (e.g., 2.5) */
  storageSizeMW: number;

  /** Duration in hours (e.g., 4) */
  durationHours: number;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Renewables & Generation
  // If undefined, will be recorded as assumption with value 0
  // ─────────────────────────────────────────────────────────────────────────

  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  generatorFuelType?: GeneratorFuelType;
  fuelCellMW?: number;
  fuelCellType?: FuelCellType;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Location & Rates
  // If undefined, triggers assumption recording
  // ─────────────────────────────────────────────────────────────────────────

  /** State or region name (e.g., "California") */
  location?: string;

  /** 5-digit US zip code for dynamic rate lookup */
  zipCode?: string;

  /** Electricity rate in $/kWh (if provided, overrides lookup) */
  electricityRate?: number;

  /** Demand charge in $/kW (if provided, overrides lookup) */
  demandCharge?: number;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Grid & Use Case
  // ─────────────────────────────────────────────────────────────────────────

  gridConnection?: GridConnection;
  useCase?: string;

  /** Industry-specific data (passed through to equipment calc) */
  industryData?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: ITC Configuration (IRA 2022)
  // ─────────────────────────────────────────────────────────────────────────

  itcConfig?: ITCConfigInput;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Battery Technology
  // ─────────────────────────────────────────────────────────────────────────

  batteryChemistry?: BatteryChemistry;
  cyclesPerYear?: number;
  averageDoD?: number;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Solar Production Override
  // ─────────────────────────────────────────────────────────────────────────

  /** If provided, skips PVWatts/regional estimate */
  annualSolarProductionKWh?: number;

  // ─────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Advanced Analysis Flags
  // ─────────────────────────────────────────────────────────────────────────

  includeAdvancedAnalysis?: boolean;
  loadProfileType?: LoadProfileType;
  peakDemandKW?: number;
  annualLoadKWh?: number;
}

// =============================================================================
// ASSUMPTIONS - Everything inferred/defaulted (recorded, not hidden)
// =============================================================================

/** Confidence level for an assumption */
export type AssumptionConfidence = "high" | "medium" | "low";

/** Source of an assumption value */
export type AssumptionSource =
  | "manual"      // User provided explicitly
  | "lookup"      // Dynamic lookup (EIA, NREL API, etc.)
  | "cache"       // Cached from previous lookup
  | "default"     // Hardcoded default
  | "inferred"    // Calculated from other inputs
  | "calculated"  // Deterministically computed from other values (e.g., oversizeFactor = actual / nominal)
  | "benchmark";  // From NREL/PNNL/DOE benchmark

/** A single recorded assumption */
export interface RecordedAssumption<T = number> {
  value: T;
  source: AssumptionSource;
  confidence: AssumptionConfidence;
  reason?: string;
  sourceDetail?: string; // e.g., "NREL ATB 2024", "EIA October 2024"
}

/** Warning codes for low-confidence or missing data */
export type AssumptionWarningCode =
  | "MISSING_LOAD_ANCHOR"
  | "FALLBACK_RATE"
  | "INFERRED_DEMAND_CHARGE"
  | "DEFAULT_ITC_ASSUMED"
  | "NO_ZIP_CODE"
  | "RATE_LOOKUP_FAILED"
  | "DEGRADATION_ESTIMATED"
  | "SOLAR_PRODUCTION_ESTIMATED"
  | "LOAD_PROFILE_GENERIC";

/** Warning impact level */
export type WarningImpact = "low" | "medium" | "high";

/** A recorded warning about assumptions */
export interface AssumptionWarning {
  code: AssumptionWarningCode;
  message: string;
  impact: WarningImpact;
  affectedFields: string[];
}

/**
 * QuoteAssumptionsV2 - All inferred/defaulted values with provenance.
 *
 * Every value that wasn't explicitly provided by the user is recorded here.
 */
export interface QuoteAssumptionsV2 {
  // ─────────────────────────────────────────────────────────────────────────
  // Rate Assumptions
  // ─────────────────────────────────────────────────────────────────────────

  electricityRate: RecordedAssumption<number>;
  demandCharge: RecordedAssumption<number>;
  utilityName?: RecordedAssumption<string>;
  rateSchedule?: RecordedAssumption<string>;

  // ─────────────────────────────────────────────────────────────────────────
  // ITC Assumptions
  // ─────────────────────────────────────────────────────────────────────────

  itcRate: RecordedAssumption<number>;
  itcPrevailingWageAssumed: RecordedAssumption<boolean>;
  itcEnergyCommunityClaimed: RecordedAssumption<boolean>;
  itcDomesticContentClaimed: RecordedAssumption<boolean>;
  itcLowIncomeClaimed: RecordedAssumption<boolean>;

  // ─────────────────────────────────────────────────────────────────────────
  // Battery/Degradation Assumptions
  // ─────────────────────────────────────────────────────────────────────────

  batteryChemistry: RecordedAssumption<BatteryChemistry>;
  cyclesPerYear: RecordedAssumption<number>;
  averageDoD: RecordedAssumption<number>;
  roundTripEfficiency: RecordedAssumption<number>;
  calendarDegradationRate: RecordedAssumption<number>;
  cycleDegradationRate: RecordedAssumption<number>;

  // ─────────────────────────────────────────────────────────────────────────
  // Financial Assumptions
  // ─────────────────────────────────────────────────────────────────────────

  discountRate: RecordedAssumption<number>;
  projectLifeYears: RecordedAssumption<number>;
  inflationRate: RecordedAssumption<number>;
  electricityEscalationRate: RecordedAssumption<number>;

  // ─────────────────────────────────────────────────────────────────────────
  // Generation Assumptions (when not provided)
  // ─────────────────────────────────────────────────────────────────────────

  solarMW: RecordedAssumption<number>;
  windMW: RecordedAssumption<number>;
  generatorMW: RecordedAssumption<number>;
  generatorFuelType: RecordedAssumption<GeneratorFuelType>;

  // ─────────────────────────────────────────────────────────────────────────
  // Solar Production Assumptions (when estimated)
  // ─────────────────────────────────────────────────────────────────────────

  solarCapacityFactor?: RecordedAssumption<number>;
  annualSolarProductionKWh?: RecordedAssumption<number>;

  // ─────────────────────────────────────────────────────────────────────────
  // Grid Assumptions
  // ─────────────────────────────────────────────────────────────────────────

  gridConnection: RecordedAssumption<GridConnection>;

  // ─────────────────────────────────────────────────────────────────────────
  // SIZING ASSUMPTIONS (NEW - Jan 2026)
  // These explain why actual_kWh may differ from nominal (MW × hours × 1000)
  // ─────────────────────────────────────────────────────────────────────────

  sizing: {
    /** Nominal energy requested: storageSizeMW × durationHours × 1000 */
    nominalKWh: RecordedAssumption<number>;

    /** Actual battery capacity selected */
    actualKWh: RecordedAssumption<number>;

    /** Overall oversize factor: actual / nominal */
    oversizeFactor: RecordedAssumption<number>;

    /**
     * Decomposition of the oversize factor (all factors multiply together).
     * Each factor defaults to 1.0 if not applicable.
     */
    oversizeDecomposition: {
      /** Modular unit granularity factor (e.g., Tesla Megapack = 11.5 MWh increments) */
      modularUnitFactor: RecordedAssumption<number>;

      /** DoD margin (usable vs nameplate): nameplate / usable capacity */
      dodFactor: RecordedAssumption<number>;

      /** Reserve margin for grid services or warranty compliance */
      reserveFactor: RecordedAssumption<number>;

      /** Round-trip efficiency derate (if accounted in sizing) */
      rteFactor: RecordedAssumption<number>;

      /** End-of-life capacity sizing (size for year N capacity, not BOL) */
      eolCapacityFactor: RecordedAssumption<number>;

      /** Temperature/auxiliary losses factor */
      auxLossesFactor: RecordedAssumption<number>;
    };

    /** Is this a small system (< 1 MW)? Small systems use exact sizing. */
    isSmallSystem: RecordedAssumption<boolean>;

    /** Sizing mode: "continuous" = exact, "modular" = vendor SKU units */
    sizingMode: RecordedAssumption<"continuous" | "modular">;

    /** Modular unit size (only when sizingMode = "modular") */
    modularUnitMWh?: RecordedAssumption<number>;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Warnings
  // ─────────────────────────────────────────────────────────────────────────

  warnings: AssumptionWarning[];
}

// =============================================================================
// CONFIG - Bill of Materials / SKU selection + Pricing Snapshot
// =============================================================================

/** Equipment category */
export type EquipmentCategory =
  | "bess"
  | "pcs"
  | "transformer"
  | "ems"
  | "solar"
  | "wind"
  | "generator"
  | "fuel-cell"
  | "switchgear"
  | "enclosure"
  | "ev-charger"
  | "bos";

/**
 * Unit basis for pricing - makes audit trail unambiguous.
 * - per_kWh: Priced by energy capacity (continuous sizing)
 * - per_kW: Priced by power capacity
 * - per_module: Priced by discrete vendor module (modular sizing)
 * - per_unit: Priced by quantity (inverters, transformers)
 * - lump_sum: Fixed price regardless of size
 */
export type UnitBasis = "per_kWh" | "per_kW" | "per_module" | "per_unit" | "lump_sum";

/** A line item in the quote config */
export interface QuoteConfigLineItem {
  sku: string;
  category: EquipmentCategory;
  description: string;
  
  /** Number of units (modules, devices, or 1 for lump_sum/per_kWh) */
  quantity: number;
  
  /** Cost per unit (interpretation depends on unitBasis) */
  unitCost: number;
  
  /** Total cost = quantity × unitCost (or unitQuantity × unitRate) */
  extendedCost: number;
  
  /** Source of pricing data */
  costSource: string;
  
  /** Margin rule applied */
  marginRule: string;
  
  /** Benchmark ID for source attribution */
  benchmarkId?: string;
  
  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Pricing transparency fields (Jan 2026)
  // Makes audit trail unambiguous regardless of sizing mode
  // ─────────────────────────────────────────────────────────────────────────
  
  /** How this line item is priced */
  unitBasis: UnitBasis;
  
  /** Actual quantity in basis units (kWh, kW, modules, etc.) */
  unitQuantity: number;
  
  /** Rate per basis unit ($/kWh, $/kW, $/module) */
  unitRate: number;
}

/** Pricing snapshot frozen at quote time */
export interface PricingSnapshot {
  /** When this snapshot was frozen (ISO 8601) */
  frozenAt: string;

  /** Catalog version (equipment SKUs) */
  catalogVersion: string;

  /** Margin rules version */
  marginRulesVersion: string;

  /** Shipping rules version */
  shippingRulesVersion: string;

  /** Tax/tariff rules version */
  taxRulesVersion: string;

  /** Currency */
  currency: "USD";
}

/**
 * SizingPolicySnapshot - Frozen sizing configuration at quote generation.
 * This is the "how we selected battery capacity" truth, not an assumption.
 */
export interface SizingPolicySnapshot {
  /** Sizing mode: "continuous" = exact, "modular" = vendor SKU units */
  mode: "continuous" | "modular";

  /** Module identifier (only when mode = "modular") */
  moduleId?: string;

  /** Module power capacity (only when mode = "modular") */
  unitPowerMW?: number;

  /** Module energy capacity (only when mode = "modular") */
  unitEnergyMWh?: number;

  /** Rounding rule for modular sizing */
  rounding: "ceil" | "round" | "floor";

  /** Threshold below which continuous sizing is always used (MW) */
  continuousThresholdMW: number;

  /** Manufacturer name (only when mode = "modular") */
  manufacturer?: string;

  /** Module model name (only when mode = "modular") */
  model?: string;
}

/**
 * QuoteConfigV2 - Bill of Materials and pricing selection.
 */
export interface QuoteConfigV2 {
  /** Unique identifier for this configuration */
  readonly configId: string;

  /** Selected products/equipment */
  lineItems: QuoteConfigLineItem[];

  /** Pricing snapshot (frozen at quote generation) */
  pricingSnapshot: PricingSnapshot;

  /** Sizing policy snapshot (frozen at quote generation) */
  sizingPolicySnapshot: SizingPolicySnapshot;

  /** System category determined by sizing */
  systemCategory: "residential" | "commercial" | "utility";
}

// =============================================================================
// OUTPUTS - Computed costs and financials (never edited directly)
// =============================================================================

/**
 * QuoteCostsV2 - Cost breakdown.
 * Maps 1:1 to QuoteResult.costs in unifiedQuoteCalculator.ts
 * Extended with margin policy fields for Steps 4/5/6 consumption.
 */
export interface QuoteCostsV2 {
  equipmentCost: number;
  installationCost: number;
  totalProjectCost: number;
  taxCredit: number;
  netCost: number;
  
  // Margin policy fields (from marginPolicyEngine.ts)
  // Steps 4/5/6 should consume these - never compute margin themselves
  sellPriceTotal?: number;     // Total sell price after margin
  baseCostTotal?: number;      // Total base cost before margin
  marginDollars?: number;      // Total margin in dollars
}

/**
 * QuoteFinancialsV2 - Financial metrics.
 * Maps 1:1 to QuoteResult.financials in unifiedQuoteCalculator.ts
 */
export interface QuoteFinancialsV2 {
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  roi25Year: number;
  npv: number;
  irr: number;
}

/**
 * QuoteOutputsV2 - All computed values.
 */
export interface QuoteOutputsV2 {
  costs: QuoteCostsV2;
  financials: QuoteFinancialsV2;

  /** Full equipment breakdown (from equipmentCalculations.ts) */
  equipment: EquipmentBreakdown;
}

// =============================================================================
// AUDIT - Line item provenance + reproducibility
// =============================================================================

/** A line item with formula provenance */
export interface AuditLineItem {
  name: string;
  value: number;
  unit: string;
  formula: string;
  inputs: Record<string, number | string>;
  source: string;
  benchmarkId?: string;
}

/** Deviation from benchmark */
export interface AuditDeviation {
  lineItem: string;
  benchmarkValue: number;
  appliedValue: number;
  reason: string;
}

/** Benchmark source citation */
export interface AuditBenchmarkSource {
  component: string;
  benchmarkId: string;
  value: number;
  unit: string;
  source: string;
  vintage: string;
  citation: string;
}

/**
 * QuoteAuditV2 - Full audit trail for reproducibility.
 */
export interface QuoteAuditV2 {
  /** Can this exact quote be regenerated from (versions + input + assumptions)? */
  reproducible: boolean;

  /** Hash of (versions + input + assumptions + configSnapshot) - excludes timestamps */
  checksum: string;

  /** Benchmark version used */
  benchmarkVersion: string;

  /** Methodology description */
  methodology: string;

  /** Benchmark sources used */
  sources: AuditBenchmarkSource[];

  /** Line items with formula provenance */
  lineItems: AuditLineItem[];

  /** Deviations from benchmarks */
  deviations: AuditDeviation[];
}

// =============================================================================
// METADATA - Quote-level metadata
// =============================================================================

/**
 * QuoteMetadataV2 - Quote-level information.
 */
export interface QuoteMetadataV2 {
  /** When the quote was calculated (ISO 8601) */
  calculatedAt: string;

  /** Primary pricing data source */
  pricingSource: string;

  /** ITC calculation details (if applicable) */
  itcDetails?: {
    totalRate: number;
    baseRate: number;
    creditAmount: number;
    qualifications: {
      prevailingWage: boolean;
      energyCommunity: boolean;
      domesticContent: boolean;
      lowIncome: boolean;
    };
    source: string;
  };

  /** Utility rate attribution */
  utilityRates?: {
    electricityRate: number;
    demandCharge: number;
    utilityName?: string;
    rateName?: string;
    source: "nrel" | "eia" | "manual" | "cache" | "default";
    confidence: AssumptionConfidence;
    zipCode?: string;
    state?: string;
  };

  /** Battery degradation analysis */
  degradation?: {
    chemistry: BatteryChemistry;
    yearlyCapacityPct: number[];
    year10CapacityPct: number;
    year25CapacityPct: number;
    warrantyPeriod: number;
    expectedWarrantyCapacity: number;
    financialImpactPct: number;
    source: string;
  };

  /** Solar production analysis */
  solarProduction?: {
    annualProductionKWh: number;
    capacityFactorPct: number;
    source: "pvwatts" | "regional-estimate" | "manual";
    arrayType?: string;
    state?: string;
  };

  /** Advanced analysis results (8760 + Monte Carlo) */
  advancedAnalysis?: {
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
}

// =============================================================================
// TRUEQUOTE V2 - The sealed envelope
// =============================================================================

/**
 * TrueQuoteV2 - The complete, sealed quote envelope.
 *
 * This is the ONLY type that should be returned from the quote engine.
 * It contains everything needed to:
 * - Display the quote to users
 * - Reproduce the quote later
 * - Audit every number back to its source
 * - Detect drift between engine versions
 */
export interface TrueQuoteV2 {
  /** Unique quote identifier */
  readonly quoteId: string;

  /** All version identifiers */
  readonly versions: QuoteVersions;

  /** Normalized user inputs (what the user provided) */
  readonly input: QuoteInputV2;

  /** Recorded assumptions (what the engine inferred/defaulted) */
  readonly assumptions: QuoteAssumptionsV2;

  /** Bill of materials and pricing configuration */
  readonly config: QuoteConfigV2;

  /** Computed outputs (costs, financials, equipment) - BASE COSTS from SSOT */
  readonly outputs: QuoteOutputsV2;

  /** 
   * Margin policy results - SELL PRICES for customer quotes
   * This is the commercial layer that transforms base costs into sell prices.
   * Steps 4/5/6 should render sellPriceTotal, NOT outputs.costs.totalProjectCost
   */
  readonly marginPolicy: QuoteMarginPolicyV2;

  /** Quote-level metadata */
  readonly metadata: QuoteMetadataV2;

  /** Full audit trail */
  readonly audit: QuoteAuditV2;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/** Input to the V2 adapter (accepts legacy format) */
export type LegacyQuoteInput = {
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  generatorFuelType?: GeneratorFuelType;
  fuelCellMW?: number;
  fuelCellType?: FuelCellType;
  location?: string;
  zipCode?: string;
  electricityRate?: number;
  demandCharge?: number;
  gridConnection?: GridConnection;
  useCase?: string;
  industryData?: unknown;
  itcConfig?: ITCConfigInput;
  batteryChemistry?: BatteryChemistry;
  cyclesPerYear?: number;
  averageDoD?: number;
  annualSolarProductionKWh?: number;
  includeAdvancedAnalysis?: boolean;
  loadProfileType?: LoadProfileType;
  peakDemandKW?: number;
  annualLoadKWh?: number;
};

// =============================================================================
// MARGIN POLICY - Commercial layer for sell pricing
// =============================================================================

/**
 * Margin policy line item (per-item sell price info)
 */
export interface MarginLineItemV2 {
  sku: string;
  category: string;
  description: string;
  baseCost: number;
  sellPrice: number;
  marginPercent: number;
  marginDollars: number;
  wasClampedFloor: boolean;
  wasClampedCeiling: boolean;
}

/**
 * Margin clamp event (for audit trail)
 */
export interface MarginClampEvent {
  reason: 'unit_floor' | 'unit_ceiling' | 'margin_floor' | 'margin_ceiling';
  originalValue: number;
  clampedValue: number;
  guardName: string;
}

/**
 * QuoteMarginPolicyV2 - Commercial margin layer results.
 * This is how Merlin makes money while keeping quotes realistic.
 */
export interface QuoteMarginPolicyV2 {
  /** Total base cost from TrueQuote SSOT */
  baseCostTotal: number;
  
  /** Total sell price (base + margin) */
  sellPriceTotal: number;
  
  /** Total margin in dollars */
  totalMarginDollars: number;
  
  /** Blended margin percentage across all line items */
  blendedMarginPercent: number;
  
  /** Margin band selected (based on deal size) */
  marginBandId: string;
  marginBandDescription: string;
  
  /** Line items with sell prices */
  lineItems: MarginLineItemV2[];
  
  /** Clamp events for audit */
  clampEvents: MarginClampEvent[];
  
  /** Whether max margin cap was applied (for competitive bids) */
  maxMarginCapApplied: boolean;
  
  /** Original margin before cap (if maxMarginCapApplied) */
  originalMarginPercent?: number;
  
  /** Policy version used */
  policyVersion: string;
  
  /** Pricing as-of date */
  pricingAsOf: string;
  
  /** Whether quote passes all sanity guards */
  passesQuoteLevelGuards: boolean;
  
  /** Warning messages (if any guards failed) */
  quoteLevelWarnings: string[];
}

/** Result type for invariant tests */
export interface InvariantResult {
  name: string;
  passed: boolean;
  message?: string;
  expected?: unknown;
  actual?: unknown;
}

/** Golden quote fixture for testing */
export interface GoldenQuoteFixture {
  id: string;
  name: string;
  description: string;
  industry: string;
  input: QuoteInputV2;
  expectedRanges: {
    totalProjectCost: { min: number; max: number };
    netCost: { min: number; max: number };
    paybackYears: { min: number; max: number };
    annualSavings: { min: number; max: number };
    npv: { min: number; max: number };
  };
  expectedWarnings?: AssumptionWarningCode[];
}
