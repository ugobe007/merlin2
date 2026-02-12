/**
 * TRUEQUOTE™ VALIDATOR — Continuous Integrity & Compliance Engine
 * ================================================================
 * 
 * PURPOSE:
 *   Every time Merlin Memory is written, this validator runs a battery of checks
 *   to ensure the data meets TrueQuote™ standards:
 *     1. INTEGRITY — Required fields present, correct types, no NaN/Infinity
 *     2. RANGE — Values within SSOT-defined bounds (NREL, IRA, ASHRAE)
 *     3. CONSISTENCY — Cross-slot values agree (profile.peakLoadKW ≈ quote.peakLoadKW)
 *     4. COMPLIANCE — Pricing within margin policy floor/ceiling
 *     5. CHECKSUM — Tamper-evident hash of the full memory state
 * 
 * DESIGN:
 *   - Pure functions: no side effects, no async, no database calls
 *   - Returns structured violations (not throws)
 *   - Runs synchronously on every merlinMemory.set() call
 *   - Dev mode: console warnings + overlay badge
 *   - Prod mode: silent logging to telemetry
 * 
 * SSOT SOURCES:
 *   - NREL ATB 2024: BESS pricing $100-175/kWh
 *   - IRA 2022: ITC 6-70%
 *   - ASHRAE/CBECS: Peak demand 2-100+ W/sqft by industry
 *   - Margin Policy Engine: Floor $105/kWh, Ceiling $250/kWh
 *   - wizardConstants.ts: BESS_POWER_RATIOS, CRITICAL_LOAD_PERCENTAGES
 * 
 * Created: Feb 11, 2026
 */

import type {
  MerlinMemorySlots,
  MemorySlotKey,
  MemoryLocation,
  MemoryGoals,
  MemoryIndustry,
  MemoryProfile,
  MemorySizing,
  MemoryAddOns,
  MemoryQuote,
} from "./merlinMemory";

// ============================================================================
// VIOLATION TYPES
// ============================================================================

export type ViolationSeverity = "error" | "warning" | "info";

export type ViolationCategory =
  | "integrity"     // Missing/malformed data
  | "range"         // Value outside SSOT bounds
  | "consistency"   // Cross-slot mismatch
  | "compliance"    // Pricing/margin policy violation
  | "checksum";     // Tamper detection

export interface TrueQuoteViolation {
  id: string;                    // Unique violation ID (e.g., "LOC-001")
  slot: MemorySlotKey;           // Which memory slot
  field: string;                 // Which field (dot-notated)
  severity: ViolationSeverity;
  category: ViolationCategory;
  message: string;               // Human-readable description
  expected?: string;             // What was expected
  actual?: string;               // What was found
  source?: string;               // SSOT source (e.g., "NREL ATB 2024")
}

export interface TrueQuoteReport {
  timestamp: number;
  sessionId: string;
  checksum: string;              // SHA-like hash of memory state
  slotsFilled: MemorySlotKey[];
  slotsEmpty: MemorySlotKey[];
  violations: TrueQuoteViolation[];
  errorCount: number;
  warningCount: number;
  isCompliant: boolean;          // true if 0 errors
  isTrueQuoteReady: boolean;     // true if 0 errors + profile + quote present
}

// ============================================================================
// SSOT BOUNDS (from authoritative sources)
// ============================================================================

/** NREL ATB 2024 / Margin Policy Engine pricing bounds */
const PRICING_BOUNDS = {
  bess: {
    minPerKWh: 80,     // Aggressive utility-scale (BNEF 2025)
    maxPerKWh: 250,    // Fully installed with margin (Margin Policy ceiling)
    typicalPerKWh: { low: 100, high: 175 }, // NREL ATB 2024
    source: "NREL ATB 2024 + Margin Policy Engine",
  },
  solar: {
    minPerWatt: 0.50,  // Utility-scale modules only
    maxPerWatt: 2.00,  // Small commercial fully installed
    source: "NREL Cost Benchmark 2024",
  },
  generator: {
    minPerKW: 300,     // Economy diesel
    maxPerKW: 1500,    // Premium natural gas
    source: "NREL / RS Means 2024",
  },
} as const;

/** Peak demand bounds by industry (W/sqft or kW/unit) — from ASHRAE/CBECS */
const PEAK_LOAD_BOUNDS: Record<string, { min: number; max: number; unit: string; source: string }> = {
  hotel:          { min: 10,    max: 2000,    unit: "kW",  source: "ASHRAE 90.1 / CBECS" },
  hospital:       { min: 100,   max: 15000,   unit: "kW",  source: "IEEE 446-1995" },
  data_center:    { min: 50,    max: 100000,  unit: "kW",  source: "Uptime Institute Tier III/IV" },
  office:         { min: 20,    max: 5000,    unit: "kW",  source: "ASHRAE / CBECS" },
  car_wash:       { min: 10,    max: 500,     unit: "kW",  source: "Industry practice" },
  ev_charging:    { min: 7,     max: 10000,   unit: "kW",  source: "SAE J1772 / CCS" },
  warehouse:      { min: 20,    max: 3000,    unit: "kW",  source: "CBECS 2018" },
  manufacturing:  { min: 50,    max: 50000,   unit: "kW",  source: "EIA MECS" },
  retail:         { min: 15,    max: 2000,    unit: "kW",  source: "CBECS 2018" },
  restaurant:     { min: 20,    max: 500,     unit: "kW",  source: "Energy Star" },
  gas_station:    { min: 10,    max: 300,     unit: "kW",  source: "Industry practice" },
  residential:    { min: 2,     max: 50,      unit: "kW",  source: "EIA RECS" },
  apartment:      { min: 20,    max: 3000,    unit: "kW",  source: "ASHRAE / RECS" },
  college:        { min: 100,   max: 20000,   unit: "kW",  source: "ASHRAE / CBECS" },
  airport:        { min: 500,   max: 100000,  unit: "kW",  source: "FAA / CBECS" },
  casino:         { min: 100,   max: 15000,   unit: "kW",  source: "ASHRAE / Industry" },
  shopping_center:{ min: 50,    max: 10000,   unit: "kW",  source: "ICSC / CBECS" },
  cold_storage:   { min: 50,    max: 5000,    unit: "kW",  source: "ASHRAE / IARW" },
  indoor_farm:    { min: 50,    max: 5000,    unit: "kW",  source: "USDA / Industry" },
  microgrid:      { min: 50,    max: 50000,   unit: "kW",  source: "NREL Microgrid Standards" },
};

/** Financial metric sanity bounds */
const FINANCIAL_BOUNDS = {
  paybackYears: { min: 1, max: 30, source: "Industry practice" },
  irr:          { min: -0.10, max: 0.60, source: "Project finance norms" },
  npv:          { min: -50_000_000, max: 500_000_000, source: "Utility-scale bounds" },
  annualSavings:{ min: 0, max: 50_000_000, source: "Utility-scale bounds" },
  capex:        { min: 1_000, max: 500_000_000, source: "Resi to utility-scale" },
} as const;

/** BESS sizing ratios — from IEEE / NREL / Industry */
const SIZING_BOUNDS = {
  durationHours: { min: 0.5, max: 12, source: "NREL ATB 2024" },
  bessKWh:       { min: 5, max: 2_000_000, source: "Residential to utility" },
  bessKW:        { min: 1, max: 500_000, source: "Residential to utility" },
  storageToPeakRatio: { min: 0.1, max: 4.0, source: "IEEE 4538388 / Industry" },
} as const;

/** Valid US state abbreviations */
const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC","PR","GU","VI","AS","MP",
]);

/** Valid energy goals */
const VALID_GOALS = new Set([
  "lower_bills", "backup_power", "reduce_carbon",
  "energy_independence", "reduce_demand_charges",
]);

// ============================================================================
// CHECKSUM
// ============================================================================

/**
 * Generate a fast, deterministic checksum of memory state.
 * Not cryptographic — just for tamper/drift detection.
 */
export function generateChecksum(slots: Partial<MerlinMemorySlots>): string {
  const str = JSON.stringify(slots, Object.keys(slots).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  // Convert to hex, ensure positive
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `tq_${hex}`;
}

// ============================================================================
// SLOT VALIDATORS
// ============================================================================

function validateLocation(loc: MemoryLocation, v: TrueQuoteViolation[]): void {
  // ZIP code format
  if (!loc.zip || !/^\d{5}(-\d{4})?$/.test(loc.zip)) {
    v.push({
      id: "LOC-001", slot: "location", field: "zip",
      severity: "error", category: "integrity",
      message: "ZIP code must be 5 digits (or 5+4 format)",
      expected: "12345 or 12345-6789", actual: loc.zip || "(empty)",
    });
  }

  // State abbreviation
  if (loc.state && !US_STATES.has(loc.state.toUpperCase())) {
    v.push({
      id: "LOC-002", slot: "location", field: "state",
      severity: "warning", category: "integrity",
      message: `Unrecognized state abbreviation: ${loc.state}`,
      expected: "2-letter US state code", actual: loc.state,
    });
  }

  // Utility rate range
  if (loc.utilityRate != null) {
    if (isNaN(loc.utilityRate) || loc.utilityRate < 0) {
      v.push({
        id: "LOC-003", slot: "location", field: "utilityRate",
        severity: "error", category: "integrity",
        message: "Utility rate cannot be negative or NaN",
        actual: String(loc.utilityRate),
      });
    } else if (loc.utilityRate < 0.03 || loc.utilityRate > 0.80) {
      v.push({
        id: "LOC-004", slot: "location", field: "utilityRate",
        severity: "warning", category: "range",
        message: `Utility rate $${loc.utilityRate}/kWh is outside typical US range`,
        expected: "$0.03-$0.80/kWh", actual: `$${loc.utilityRate}/kWh`,
        source: "EIA State Average Rates 2024",
      });
    }
  }

  // Demand charge range
  if (loc.demandCharge != null) {
    if (isNaN(loc.demandCharge) || loc.demandCharge < 0) {
      v.push({
        id: "LOC-005", slot: "location", field: "demandCharge",
        severity: "error", category: "integrity",
        message: "Demand charge cannot be negative or NaN",
        actual: String(loc.demandCharge),
      });
    } else if (loc.demandCharge > 100) {
      v.push({
        id: "LOC-006", slot: "location", field: "demandCharge",
        severity: "warning", category: "range",
        message: `Demand charge $${loc.demandCharge}/kW is unusually high`,
        expected: "$0-$100/kW", actual: `$${loc.demandCharge}/kW`,
        source: "EIA / OpenEI rate data",
      });
    }
  }

  // Coordinates sanity (US bounding box)
  if (loc.lat != null && loc.lng != null) {
    if (loc.lat < 17 || loc.lat > 72 || loc.lng < -180 || loc.lng > -60) {
      v.push({
        id: "LOC-007", slot: "location", field: "lat/lng",
        severity: "warning", category: "range",
        message: "Coordinates outside US bounding box",
        expected: "lat 17-72, lng -180 to -60",
        actual: `${loc.lat}, ${loc.lng}`,
      });
    }
  }
}

function validateGoals(goals: MemoryGoals, v: TrueQuoteViolation[]): void {
  if (!goals.selected || !Array.isArray(goals.selected) || goals.selected.length === 0) {
    v.push({
      id: "GOAL-001", slot: "goals", field: "selected",
      severity: "error", category: "integrity",
      message: "At least one energy goal must be selected",
    });
  } else {
    for (const goal of goals.selected) {
      if (!VALID_GOALS.has(goal)) {
        v.push({
          id: "GOAL-002", slot: "goals", field: `selected[${goal}]`,
          severity: "warning", category: "integrity",
          message: `Unknown goal type: "${goal}"`,
          expected: [...VALID_GOALS].join(", "),
          actual: goal,
        });
      }
    }
  }

  if (!goals.confirmedAt || goals.confirmedAt <= 0) {
    v.push({
      id: "GOAL-003", slot: "goals", field: "confirmedAt",
      severity: "warning", category: "integrity",
      message: "Goals confirmation timestamp missing or invalid",
    });
  }
}

function validateIndustry(industry: MemoryIndustry, v: TrueQuoteViolation[]): void {
  if (!industry.slug || industry.slug.trim() === "") {
    v.push({
      id: "IND-001", slot: "industry", field: "slug",
      severity: "error", category: "integrity",
      message: "Industry slug is required",
    });
  }

  if (industry.inferred && (industry.confidence == null || industry.confidence < 0 || industry.confidence > 1)) {
    v.push({
      id: "IND-002", slot: "industry", field: "confidence",
      severity: "warning", category: "integrity",
      message: "Inferred industry should have confidence between 0 and 1",
      expected: "0.0 - 1.0", actual: String(industry.confidence),
    });
  }

  if (industry.inferred && industry.confidence != null && industry.confidence < 0.5) {
    v.push({
      id: "IND-003", slot: "industry", field: "confidence",
      severity: "warning", category: "range",
      message: `Low industry inference confidence: ${(industry.confidence * 100).toFixed(0)}%`,
      expected: "≥50%", actual: `${(industry.confidence * 100).toFixed(0)}%`,
    });
  }
}

function validateProfile(profile: MemoryProfile, industry: MemoryIndustry | null, v: TrueQuoteViolation[]): void {
  // Peak load must be positive
  if (profile.peakLoadKW == null || isNaN(profile.peakLoadKW) || profile.peakLoadKW <= 0) {
    v.push({
      id: "PROF-001", slot: "profile", field: "peakLoadKW",
      severity: "error", category: "integrity",
      message: "Peak load must be a positive number",
      actual: String(profile.peakLoadKW),
    });
    return; // Can't do range checks without valid peak
  }

  // Industry-specific peak load range check
  if (industry?.slug) {
    const slug = industry.slug.replace(/-/g, "_");
    const bounds = PEAK_LOAD_BOUNDS[slug];
    if (bounds) {
      if (profile.peakLoadKW < bounds.min || profile.peakLoadKW > bounds.max) {
        v.push({
          id: "PROF-002", slot: "profile", field: "peakLoadKW",
          severity: "warning", category: "range",
          message: `Peak load ${profile.peakLoadKW.toFixed(0)} kW is outside ${industry.slug} industry range`,
          expected: `${bounds.min}-${bounds.max} kW`,
          actual: `${profile.peakLoadKW.toFixed(0)} kW`,
          source: bounds.source,
        });
      }
    }
  }

  // Duty cycle bounds
  if (profile.dutyCycle != null) {
    if (profile.dutyCycle < 0 || profile.dutyCycle > 1) {
      v.push({
        id: "PROF-003", slot: "profile", field: "dutyCycle",
        severity: "error", category: "range",
        message: "Duty cycle must be between 0 and 1",
        expected: "0.0 - 1.0", actual: String(profile.dutyCycle),
      });
    }
  }

  // Contributor sum should approximately match peak load
  if (profile.contributors && profile.peakLoadKW > 0) {
    const contributorSum = Object.values(profile.contributors).reduce((a, b) => a + b, 0);
    const drift = Math.abs(contributorSum - profile.peakLoadKW) / profile.peakLoadKW;
    if (drift > 0.15) {
      v.push({
        id: "PROF-004", slot: "profile", field: "contributors",
        severity: "warning", category: "consistency",
        message: `Contributor sum ${contributorSum.toFixed(0)} kW drifts ${(drift * 100).toFixed(1)}% from peak load ${profile.peakLoadKW.toFixed(0)} kW`,
        expected: `Within 15% of ${profile.peakLoadKW.toFixed(0)} kW`,
        actual: `${contributorSum.toFixed(0)} kW (${(drift * 100).toFixed(1)}% drift)`,
        source: "TrueQuote™ contributor integrity rule",
      });
    }
  }

  // Answers should not be empty
  if (!profile.answers || Object.keys(profile.answers).length === 0) {
    v.push({
      id: "PROF-005", slot: "profile", field: "answers",
      severity: "warning", category: "integrity",
      message: "Profile has no questionnaire answers recorded",
    });
  }
}

function validateSizing(sizing: MemorySizing, profile: MemoryProfile | null, v: TrueQuoteViolation[]): void {
  // BESS kWh range
  if (sizing.bessKWh != null) {
    if (isNaN(sizing.bessKWh) || sizing.bessKWh < 0) {
      v.push({
        id: "SIZE-001", slot: "sizing", field: "bessKWh",
        severity: "error", category: "integrity",
        message: "BESS capacity cannot be negative or NaN",
        actual: String(sizing.bessKWh),
      });
    } else if (sizing.bessKWh < SIZING_BOUNDS.bessKWh.min || sizing.bessKWh > SIZING_BOUNDS.bessKWh.max) {
      v.push({
        id: "SIZE-002", slot: "sizing", field: "bessKWh",
        severity: "warning", category: "range",
        message: `BESS ${sizing.bessKWh} kWh outside typical range`,
        expected: `${SIZING_BOUNDS.bessKWh.min}-${SIZING_BOUNDS.bessKWh.max} kWh`,
        actual: `${sizing.bessKWh} kWh`,
        source: SIZING_BOUNDS.bessKWh.source,
      });
    }
  }

  // Duration hours
  if (sizing.durationHours != null) {
    if (sizing.durationHours < SIZING_BOUNDS.durationHours.min || sizing.durationHours > SIZING_BOUNDS.durationHours.max) {
      v.push({
        id: "SIZE-003", slot: "sizing", field: "durationHours",
        severity: "warning", category: "range",
        message: `Duration ${sizing.durationHours}h outside typical range`,
        expected: `${SIZING_BOUNDS.durationHours.min}-${SIZING_BOUNDS.durationHours.max} hours`,
        actual: `${sizing.durationHours}h`,
        source: SIZING_BOUNDS.durationHours.source,
      });
    }
  }

  // Duration × power should ≈ energy
  if (sizing.bessKW > 0 && sizing.durationHours > 0 && sizing.bessKWh > 0) {
    const expectedKWh = sizing.bessKW * sizing.durationHours;
    const drift = Math.abs(expectedKWh - sizing.bessKWh) / sizing.bessKWh;
    if (drift > 0.10) {
      v.push({
        id: "SIZE-004", slot: "sizing", field: "bessKWh",
        severity: "warning", category: "consistency",
        message: `BESS kW × duration (${expectedKWh.toFixed(0)} kWh) doesn't match stored kWh (${sizing.bessKWh.toFixed(0)} kWh)`,
        expected: `${expectedKWh.toFixed(0)} kWh (${sizing.bessKW} kW × ${sizing.durationHours}h)`,
        actual: `${sizing.bessKWh.toFixed(0)} kWh (${(drift * 100).toFixed(1)}% drift)`,
        source: "Physics: Energy = Power × Time",
      });
    }
  }

  // Storage-to-peak ratio check (if profile available)
  if (profile?.peakLoadKW && profile.peakLoadKW > 0 && sizing.bessKW > 0) {
    const ratio = sizing.bessKW / profile.peakLoadKW;
    if (ratio < SIZING_BOUNDS.storageToPeakRatio.min || ratio > SIZING_BOUNDS.storageToPeakRatio.max) {
      v.push({
        id: "SIZE-005", slot: "sizing", field: "bessKW",
        severity: "warning", category: "range",
        message: `BESS/peak ratio ${ratio.toFixed(2)} outside typical range`,
        expected: `${SIZING_BOUNDS.storageToPeakRatio.min}-${SIZING_BOUNDS.storageToPeakRatio.max}`,
        actual: `${ratio.toFixed(2)} (${sizing.bessKW} kW / ${profile.peakLoadKW.toFixed(0)} kW peak)`,
        source: SIZING_BOUNDS.storageToPeakRatio.source,
      });
    }
  }
}

function validateAddOns(addOns: MemoryAddOns, v: TrueQuoteViolation[]): void {
  // Solar: if enabled, kW must be positive
  if (addOns.includeSolar && (addOns.solarKW == null || addOns.solarKW <= 0)) {
    v.push({
      id: "ADD-001", slot: "addOns", field: "solarKW",
      severity: "warning", category: "integrity",
      message: "Solar enabled but kW is zero or missing",
    });
  }

  // Generator: if enabled, kW must be positive
  if (addOns.includeGenerator && (addOns.generatorKW == null || addOns.generatorKW <= 0)) {
    v.push({
      id: "ADD-002", slot: "addOns", field: "generatorKW",
      severity: "warning", category: "integrity",
      message: "Generator enabled but kW is zero or missing",
    });
  }

  // Wind: if enabled, kW must be positive
  if (addOns.includeWind && (addOns.windKW == null || addOns.windKW <= 0)) {
    v.push({
      id: "ADD-003", slot: "addOns", field: "windKW",
      severity: "warning", category: "integrity",
      message: "Wind enabled but kW is zero or missing",
    });
  }

  // NaN guard on all numeric fields
  for (const [field, val] of Object.entries({ solarKW: addOns.solarKW, generatorKW: addOns.generatorKW, windKW: addOns.windKW })) {
    if (val != null && (isNaN(val) || !isFinite(val))) {
      v.push({
        id: `ADD-NAN-${field}`, slot: "addOns", field,
        severity: "error", category: "integrity",
        message: `${field} is NaN or Infinity`,
        actual: String(val),
      });
    }
  }
}

function validateQuote(quote: MemoryQuote, profile: MemoryProfile | null, sizing: MemorySizing | null, v: TrueQuoteViolation[]): void {
  // Peak load consistency with profile
  if (quote.peakLoadKW != null && profile?.peakLoadKW != null && profile.peakLoadKW > 0) {
    const drift = Math.abs(quote.peakLoadKW - profile.peakLoadKW) / profile.peakLoadKW;
    if (drift > 0.20) {
      v.push({
        id: "QUO-001", slot: "quote", field: "peakLoadKW",
        severity: "warning", category: "consistency",
        message: `Quote peak load ${quote.peakLoadKW?.toFixed(0)} kW drifts ${(drift * 100).toFixed(1)}% from profile ${profile.peakLoadKW.toFixed(0)} kW`,
        expected: `Within 20% of profile: ${profile.peakLoadKW.toFixed(0)} kW`,
        actual: `${quote.peakLoadKW?.toFixed(0)} kW`,
        source: "TrueQuote™ cross-slot consistency",
      });
    }
  }

  // BESS sizing consistency
  if (quote.bessKWh != null && sizing?.bessKWh != null && sizing.bessKWh > 0) {
    const drift = Math.abs(quote.bessKWh - sizing.bessKWh) / sizing.bessKWh;
    if (drift > 0.15) {
      v.push({
        id: "QUO-002", slot: "quote", field: "bessKWh",
        severity: "warning", category: "consistency",
        message: `Quote BESS ${quote.bessKWh?.toFixed(0)} kWh drifts from sizing ${sizing.bessKWh.toFixed(0)} kWh`,
        expected: `Within 15% of sizing: ${sizing.bessKWh.toFixed(0)} kWh`,
        actual: `${quote.bessKWh?.toFixed(0)} kWh`,
        source: "TrueQuote™ cross-slot consistency",
      });
    }
  }

  // CAPEX reasonableness ($/kWh check)
  if (quote.capexUSD != null && quote.bessKWh != null && quote.bessKWh > 0) {
    const perKWh = quote.capexUSD / quote.bessKWh;
    if (perKWh < PRICING_BOUNDS.bess.minPerKWh || perKWh > PRICING_BOUNDS.bess.maxPerKWh) {
      v.push({
        id: "QUO-003", slot: "quote", field: "capexUSD",
        severity: "warning", category: "compliance",
        message: `BESS $/kWh = $${perKWh.toFixed(0)} is outside SSOT bounds`,
        expected: `$${PRICING_BOUNDS.bess.minPerKWh}-$${PRICING_BOUNDS.bess.maxPerKWh}/kWh`,
        actual: `$${perKWh.toFixed(0)}/kWh ($${quote.capexUSD.toLocaleString()} / ${quote.bessKWh.toFixed(0)} kWh)`,
        source: PRICING_BOUNDS.bess.source,
      });
    }
  }

  // Payback years sanity
  if (quote.paybackYears != null) {
    if (isNaN(quote.paybackYears) || !isFinite(quote.paybackYears)) {
      v.push({
        id: "QUO-004", slot: "quote", field: "paybackYears",
        severity: "error", category: "integrity",
        message: "Payback years is NaN or Infinity",
        actual: String(quote.paybackYears),
      });
    } else if (quote.paybackYears < FINANCIAL_BOUNDS.paybackYears.min || quote.paybackYears > FINANCIAL_BOUNDS.paybackYears.max) {
      v.push({
        id: "QUO-005", slot: "quote", field: "paybackYears",
        severity: "warning", category: "range",
        message: `Payback ${quote.paybackYears.toFixed(1)} years outside typical range`,
        expected: `${FINANCIAL_BOUNDS.paybackYears.min}-${FINANCIAL_BOUNDS.paybackYears.max} years`,
        actual: `${quote.paybackYears.toFixed(1)} years`,
        source: FINANCIAL_BOUNDS.paybackYears.source,
      });
    }
  }

  // IRR sanity
  if (quote.irr != null) {
    if (isNaN(quote.irr) || !isFinite(quote.irr)) {
      v.push({
        id: "QUO-006", slot: "quote", field: "irr",
        severity: "error", category: "integrity",
        message: "IRR is NaN or Infinity",
        actual: String(quote.irr),
      });
    } else if (quote.irr < FINANCIAL_BOUNDS.irr.min || quote.irr > FINANCIAL_BOUNDS.irr.max) {
      v.push({
        id: "QUO-007", slot: "quote", field: "irr",
        severity: "warning", category: "range",
        message: `IRR ${(quote.irr * 100).toFixed(1)}% outside typical range`,
        expected: `${(FINANCIAL_BOUNDS.irr.min * 100).toFixed(0)}% to ${(FINANCIAL_BOUNDS.irr.max * 100).toFixed(0)}%`,
        actual: `${(quote.irr * 100).toFixed(1)}%`,
        source: FINANCIAL_BOUNDS.irr.source,
      });
    }
  }

  // Annual savings should be positive
  const savings = quote.annualSavingsUSD ?? quote.annualSavings;
  if (savings != null && savings < 0) {
    v.push({
      id: "QUO-008", slot: "quote", field: "annualSavings",
      severity: "warning", category: "range",
      message: "Annual savings is negative — verify inputs",
      actual: `$${savings.toLocaleString()}`,
      source: "TrueQuote™ sanity check",
    });
  }

  // Payback should be consistent with capex/savings
  if (quote.paybackYears != null && savings != null && savings > 0) {
    const cost = quote.totalCost ?? quote.capexUSD ?? 0;
    if (cost > 0) {
      const simplePayback = cost / savings;
      const drift = Math.abs(simplePayback - quote.paybackYears) / simplePayback;
      if (drift > 0.50) {
        v.push({
          id: "QUO-009", slot: "quote", field: "paybackYears",
          severity: "info", category: "consistency",
          message: `Reported payback ${quote.paybackYears.toFixed(1)}y differs from simple calc ${simplePayback.toFixed(1)}y — may include ITC, degradation, or TVM adjustments`,
          expected: `≈${simplePayback.toFixed(1)} years (simple cost/savings)`,
          actual: `${quote.paybackYears.toFixed(1)} years`,
          source: "TrueQuote™ cross-check",
        });
      }
    }
  }

  // NaN guard on all numeric fields
  const numericFields: [string, unknown][] = [
    ["capexUSD", quote.capexUSD],
    ["totalCost", quote.totalCost],
    ["netCost", quote.netCost],
    ["annualSavingsUSD", quote.annualSavingsUSD],
    ["annualSavings", quote.annualSavings],
    ["npv", quote.npv],
    ["bessKWh", quote.bessKWh],
    ["bessMW", quote.bessMW],
  ];
  for (const [field, val] of numericFields) {
    if (val != null && typeof val === "number" && (isNaN(val) || !isFinite(val))) {
      v.push({
        id: `QUO-NAN-${field}`, slot: "quote", field,
        severity: "error", category: "integrity",
        message: `${field} is NaN or Infinity`,
        actual: String(val),
      });
    }
  }
}

// ============================================================================
// MAIN VALIDATION ENTRY POINT
// ============================================================================

/**
 * Run the full TrueQuote™ validation suite against current memory state.
 * Pure function — no side effects.
 */
export function validateMemory(
  slots: Partial<MerlinMemorySlots>,
  sessionId: string,
): TrueQuoteReport {
  const violations: TrueQuoteViolation[] = [];

  const ALL_KEYS: MemorySlotKey[] = ["location", "goals", "industry", "business", "profile", "sizing", "addOns", "quote"];
  const filled = ALL_KEYS.filter(k => slots[k] != null);
  const empty = ALL_KEYS.filter(k => slots[k] == null);

  // Run per-slot validators
  if (slots.location)  validateLocation(slots.location, violations);
  if (slots.goals)     validateGoals(slots.goals, violations);
  if (slots.industry)  validateIndustry(slots.industry, violations);
  if (slots.profile)   validateProfile(slots.profile, slots.industry ?? null, violations);
  if (slots.sizing)    validateSizing(slots.sizing, slots.profile ?? null, violations);
  if (slots.addOns)    validateAddOns(slots.addOns, violations);
  if (slots.quote)     validateQuote(slots.quote, slots.profile ?? null, slots.sizing ?? null, violations);

  const errorCount = violations.filter(v => v.severity === "error").length;
  const warningCount = violations.filter(v => v.severity === "warning").length;

  return {
    timestamp: Date.now(),
    sessionId,
    checksum: generateChecksum(slots),
    slotsFilled: filled,
    slotsEmpty: empty,
    violations,
    errorCount,
    warningCount,
    isCompliant: errorCount === 0,
    isTrueQuoteReady: errorCount === 0 && slots.profile != null && slots.quote != null,
  };
}

/**
 * Quick single-slot validation (for hot-path writes).
 * Only validates the slot that changed + cross-slot consistency.
 */
export function validateSlot<K extends MemorySlotKey>(
  key: K,
  value: MerlinMemorySlots[K],
  allSlots: Partial<MerlinMemorySlots>,
): TrueQuoteViolation[] {
  const violations: TrueQuoteViolation[] = [];

  switch (key) {
    case "location":
      validateLocation(value as MemoryLocation, violations);
      break;
    case "goals":
      validateGoals(value as MemoryGoals, violations);
      break;
    case "industry":
      validateIndustry(value as MemoryIndustry, violations);
      break;
    case "profile":
      validateProfile(value as MemoryProfile, (allSlots.industry as MemoryIndustry) ?? null, violations);
      break;
    case "sizing":
      validateSizing(value as MemorySizing, (allSlots.profile as MemoryProfile) ?? null, violations);
      break;
    case "addOns":
      validateAddOns(value as MemoryAddOns, violations);
      break;
    case "quote":
      validateQuote(
        value as MemoryQuote,
        (allSlots.profile as MemoryProfile) ?? null,
        (allSlots.sizing as MemorySizing) ?? null,
        violations,
      );
      break;
  }

  return violations;
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/** Format violations into a compact console-ready string */
export function formatViolations(violations: TrueQuoteViolation[]): string {
  if (violations.length === 0) return "✅ TrueQuote™ — All checks passed";

  const lines = violations.map(v => {
    const icon = v.severity === "error" ? "🔴" : v.severity === "warning" ? "🟡" : "🔵";
    const src = v.source ? ` (${v.source})` : "";
    return `${icon} [${v.id}] ${v.message}${src}`;
  });

  const errors = violations.filter(v => v.severity === "error").length;
  const warnings = violations.filter(v => v.severity === "warning").length;
  const header = errors > 0
    ? `🔴 TrueQuote™ — ${errors} error(s), ${warnings} warning(s)`
    : `🟡 TrueQuote™ — ${warnings} warning(s)`;

  return [header, ...lines].join("\n");
}

/** Get a compliance badge label for UI display */
export function getComplianceBadge(report: TrueQuoteReport): {
  label: string;
  color: "green" | "amber" | "red";
  tooltip: string;
} {
  if (report.isTrueQuoteReady) {
    return {
      label: "TrueQuote™ Verified",
      color: "green",
      tooltip: `All ${report.slotsFilled.length} data slots validated. Checksum: ${report.checksum}`,
    };
  }
  if (report.isCompliant) {
    return {
      label: "TrueQuote™ Partial",
      color: "amber",
      tooltip: `${report.slotsFilled.length}/${report.slotsFilled.length + report.slotsEmpty.length} slots filled. ${report.warningCount} warning(s).`,
    };
  }
  return {
    label: "TrueQuote™ Issues",
    color: "red",
    tooltip: `${report.errorCount} error(s), ${report.warningCount} warning(s). Data integrity check failed.`,
  };
}
