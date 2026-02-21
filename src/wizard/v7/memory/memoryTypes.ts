/**
 * Merlin Memory — Pure Types & Interfaces
 * ========================================
 * 
 * This file contains ONLY types, interfaces, and pure constants.
 * NO imports from merlinMemory.ts or truequoteValidator.ts.
 * 
 * Purpose: Break circular dependency between memory and validator.
 * 
 * Rule: If you need to import something here, it must be:
 *   ✅ A type-only import from external library
 *   ✅ A pure constant with no side effects
 *   ❌ NEVER import from ./merlinMemory or ./truequoteValidator
 * 
 * Created: Feb 20, 2026 (TDZ fix)
 */

// ============================================================================
// MEMORY SLOT TYPES
// ============================================================================

export type MemorySlotKey =
  | "location"
  | "goals"
  | "industry"
  | "business"
  | "profile"
  | "sizing"
  | "addOns"
  | "quote"
  | "weather"
  | "solar"
  | "financials"
  | "session";

export type EnergyGoal =
  | "lower_bills"
  | "backup_power"
  | "reduce_carbon"
  | "energy_independence"
  | "reduce_demand_charges";

/** Step 1 output: Where is this project? */
export interface MemoryLocation {
  zip: string;
  state?: string;
  city?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  utilityRate?: number;       // $/kWh from location intel
  demandCharge?: number;      // $/kW from location intel
  peakSunHours?: number;      // from location intel
}

/** Step 1 output: What does the user want? */
export interface MemoryGoals {
  selected: EnergyGoal[];
  confirmedAt: number;        // timestamp
}

/** Step 2 output: What industry? */
export interface MemoryIndustry {
  slug: string;               // canonical slug (e.g., "hotel", "data_center")
  label?: string;             // display name
  inferred: boolean;          // true if auto-detected from business name
  confidence?: number;        // inference confidence (0-1)
}

/** Step 2.5 output: Business info (optional) */
export interface MemoryBusiness {
  name?: string;
  address?: string;
  placeId?: string;
}

/** Step 3 output: Facility profile */
export interface MemoryProfile {
  answers: Record<string, unknown>;  // questionnaire answers
  peakLoadKW: number;                // calculated peak load
  avgLoadKW?: number;                // average load
  energyKWhPerDay?: number;          // daily energy
  dutyCycle?: number;                // duty cycle (0-1)
  contributors?: Record<string, number>; // kW contributors breakdown
}

/** Step 3 → pricing bridge: System sizing */
export interface MemorySizing {
  bessKWh: number;
  bessKW: number;
  durationHours: number;
  solarKW?: number;
  generatorKW?: number;
  windKW?: number;
}

/** Step 4 output: Add-on selections */
export interface MemoryAddOns {
  includeSolar: boolean;
  solarKW: number;
  includeGenerator: boolean;
  generatorKW: number;
  generatorFuelType?: string;
  includeWind: boolean;
  windKW: number;
  updatedAt: number;
}

/** Step 5/6 output: Quote result */
export interface MemoryQuote {
  peakLoadKW?: number;
  bessKWh?: number;
  bessMW?: number;
  capexUSD?: number;
  totalCost?: number;
  netCost?: number;
  annualSavingsUSD?: number;
  annualSavings?: number;
  paybackYears?: number;
  roiPercent?: number;
  npv?: number;
  irr?: number;
  tier?: "starter" | "recommended" | "beast";  // MagicFit selection
  generatedAt: number;
}

/** Weather & climate profile for the project site */
export interface MemoryWeather {
  profile?: string;             // "Hot & Humid", "Cold & Dry", "Temperate"
  extremes?: string;            // "Frequent heatwaves", "Harsh winters"
  avgTempF?: number;            // Annual average temperature (°F)
  avgHighF?: number;            // Average daily high (°F)
  avgLowF?: number;             // Average daily low (°F)
  heatingDegreeDays?: number;   // HDD (affects heating load sizing)
  coolingDegreeDays?: number;   // CDD (affects cooling load sizing)
  source?: "visual-crossing" | "nws" | "cache";
  fetchedAt: number;            // timestamp
}

/** Solar resource data for the project site */
export interface MemorySolar {
  peakSunHours?: number;        // PSH (hours/day)
  capacityFactor?: number;      // 0-1 (e.g., 0.21 for AZ)
  annualIrradiance?: number;    // kWh/m²/day
  grade?: string;               // "A", "A-", "B+", "B", "C"
  source?: "pvwatts" | "regional-estimate";
  // Production estimates (when solar is configured)
  annualProductionKWh?: number;
  monthlyProductionKWh?: number[];
  fetchedAt: number;
}

/** Full financial model output from SSOT calculator */
export interface MemoryFinancials {
  // Cost breakdown
  equipmentCost: number;
  installationCost: number;
  totalProjectCost: number;
  taxCredit: number;
  netCost: number;

  // Savings breakdown
  annualSavings: number;
  peakShavingSavings?: number;
  demandChargeSavings?: number;
  touArbitrageSavings?: number;
  solarSelfConsumptionSavings?: number;

  // Return metrics
  paybackYears: number;
  roi10Year: number;
  roi25Year: number;
  npv: number;
  irr: number;

  // ITC details (IRA 2022)
  itcRate?: number;             // 0.06 - 0.70
  itcAmount?: number;           // dollar amount

  // Degradation impact
  chemistry?: string;           // lfp, nmc, nca, etc.
  year10CapacityPct?: number;   // % capacity at year 10
  year25CapacityPct?: number;   // % capacity at year 25
  degradationImpactPct?: number; // NPV reduction %

  // Monte Carlo risk (if computed)
  npvP10?: number;
  npvP50?: number;
  npvP90?: number;
  probabilityPositiveNPV?: number;

  // Provenance
  pricingSnapshotId?: string;
  calculatedAt: number;
}

/** Session telemetry — analytics & user journey tracking */
export interface MemorySession {
  startedAt: number;            // session start timestamp
  stepHistory: Array<{
    step: string;
    enteredAt: number;
    exitedAt?: number;
  }>;
  totalStepsCompleted: number;
  quoteGenerations: number;     // how many times quote was recalculated
  addOnChanges: number;         // how many times add-ons were toggled
  lastActiveAt: number;         // last interaction timestamp
}

/** All memory slots — the complete "brain" of the wizard */
export interface MerlinMemorySlots {
  location: MemoryLocation;
  goals: MemoryGoals;
  industry: MemoryIndustry;
  business: MemoryBusiness;
  profile: MemoryProfile;
  sizing: MemorySizing;
  addOns: MemoryAddOns;
  quote: MemoryQuote;
  weather: MemoryWeather;
  solar: MemorySolar;
  financials: MemoryFinancials;
  session: MemorySession;
}

// ============================================================================
// TRUEQUOTE™ VALIDATOR TYPES
// ============================================================================

export type ViolationSeverity = "error" | "warning" | "info";

export type ViolationCategory =
  | "integrity"     // Missing/malformed data
  | "range"         // Value outside SSOT bounds
  | "consistency"   // Cross-slot mismatch
  | "compliance"    // Pricing/margin policy violation
  | "checksum";     // Tamper detection

export interface TrueQuoteViolation {
  id: string;
  slot: MemorySlotKey;
  field: string;
  severity: ViolationSeverity;
  category: ViolationCategory;
  message: string;
  expected?: string;
  actual?: string;
  source?: string;
}

export interface TrueQuoteReport {
  timestamp: number;
  sessionId: string;
  checksum: string;
  slotsFilled: MemorySlotKey[];
  slotsEmpty: MemorySlotKey[];
  violations: TrueQuoteViolation[];
  errorCount: number;
  warningCount: number;
  isCompliant: boolean;
  isTrueQuoteReady: boolean;
}
