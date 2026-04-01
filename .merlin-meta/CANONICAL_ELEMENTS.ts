/**
 * MERLIN CANONICAL ELEMENTS
 * =========================
 * This file is the TypeScript-enforced source of truth for all
 * Merlin domain concepts. Import from here instead of using
 * string literals anywhere in the codebase.
 *
 * Authority: .merlin-meta/CONSTITUTION.md
 * Policy: POLICY-001, POLICY-006
 */

// ============================================================
// CANONICAL INDUSTRY VERTICALS
// ============================================================

export const CANONICAL_INDUSTRIES = [
  'car-wash',
  'hotel',
  'data-center',
  'ev-charging',
  'restaurant',
  'office',
  'warehouse',
  'manufacturing',
  'university',
  'hospital',
  'agriculture',
  'retail',
  'grocery',
  'brewery',
  'government',
  'multi-family',
  'self-storage',
  'telecom',
] as const;

export type CanonicalIndustry = typeof CANONICAL_INDUSTRIES[number];

// ============================================================
// CANONICAL SYSTEM SIZES (MW)
// ============================================================

export const CANONICAL_STORAGE_SIZES_MW = [
  0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0
] as const;

export const CANONICAL_DURATION_HOURS = [1, 2, 4, 6, 8, 12] as const;

// ============================================================
// CANONICAL FINANCIAL METRICS
// ============================================================

export interface CanonicalQuoteOutput {
  /** Total installed cost in USD */
  totalCostDollars: number;
  /** Annual savings in USD/year */
  annualSavingsDollars: number;
  /** Simple payback period in years */
  paybackYears: number;
  /** 25-year Net Present Value in USD */
  npvDollars: number;
  /** Internal Rate of Return as decimal (e.g., 0.12 = 12%) */
  irrDecimal: number;
  /** Levelized Cost of Energy in $/kWh */
  lcoePerKwh: number;
  /** ITC credit amount in USD */
  itcCreditDollars: number;
  /** Annual CO2 avoided in metric tons */
  co2AvoidedTons: number;
  /** System confidence score 0-100 */
  confidenceScore: number;
  /** Version of benchmark data used */
  benchmarkVersion: string;
  /** Calculation timestamp */
  calculatedAt: string;
}

// ============================================================
// NON-VIOLATABLE POLICY IDENTIFIERS
// ============================================================

export const POLICIES = {
  SSOT: 'POLICY-001',
  NO_BYPASSED_VALIDATION: 'POLICY-002',
  NO_CLIENT_SIDE_KEYS: 'POLICY-003',
  PII_ENCRYPTION: 'POLICY-004',
  VALIDATED_OUTPUT: 'POLICY-005',
  TYPESCRIPT_STRICT: 'POLICY-006',
  COMPONENT_PURITY: 'POLICY-007',
  TEST_COVERAGE: 'POLICY-008',
  FEATURE_FLAGS: 'POLICY-009',
  NO_DIRECT_DB: 'POLICY-010',
  DEGRADATION_MODEL: 'POLICY-011',
  REAL_UTILITY_RATES: 'POLICY-012',
  UNCERTAINTY_DISCLOSURE: 'POLICY-013',
  CURRENT_ITC: 'POLICY-014',
  CONSERVATIVE_PROJECTIONS: 'POLICY-015',
  PROGRESSIVE_WIZARD: 'POLICY-016',
  HUMAN_ERRORS: 'POLICY-017',
  LOADING_STATES: 'POLICY-018',
  MOBILE_FIRST: 'POLICY-019',
  ACCESSIBILITY: 'POLICY-020',
} as const;

export type PolicyId = typeof POLICIES[keyof typeof POLICIES];

// ============================================================
// CANONICAL AUTHORITATIVE DATA SOURCES
// ============================================================

export const AUTHORITATIVE_SOURCES = {
  NREL_ATB_2024: {
    name: 'NREL Annual Technology Baseline 2024',
    url: 'https://atb.nrel.gov/',
    category: 'cost',
  },
  NREL_STOREFAST: {
    name: 'NREL StoreFAST Model',
    url: 'https://www.nrel.gov/docs/fy23osti/85878.pdf',
    category: 'bess-cost',
  },
  DOE_SANDIA: {
    name: 'DOE/Sandia BESS Cost Projection',
    url: 'https://www.sandia.gov/ess/',
    category: 'bess-cost',
  },
  EIA_COMMERCIAL_RATES: {
    name: 'EIA Commercial Electricity Rates',
    url: 'https://www.eia.gov/electricity/data/browser/',
    category: 'utility-rates',
  },
  PVWATTS: {
    name: 'NREL PVWatts Calculator',
    url: 'https://pvwatts.nrel.gov/',
    category: 'solar',
  },
  IRS_ITC: {
    name: 'IRS Investment Tax Credit (IRA 2022)',
    url: 'https://www.irs.gov/credits-deductions/businesses/investment-tax-credit',
    category: 'tax',
  },
} as const;

// ============================================================
// CANONICAL AGENT AUTHORIZATION LEVELS
// ============================================================

export enum AgentAuthLevel {
  READ_ONLY = 0,
  SAFE_WRITES = 1,
  SUPERVISED_WRITES = 2,
  FULL_ACCESS = 3, // HUMAN ONLY
}

// Files that require FULL_ACCESS (Level 3) to modify
export const PROTECTED_FILES = [
  'src/services/unifiedQuoteCalculator.ts',
  'src/services/benchmarkSources.ts',
  'src/services/pricingServiceV45.ts',
  'src/services/calculationConstants.ts',
  '.merlin-meta/CONSTITUTION.md',
  '.merlin-meta/CANONICAL_ELEMENTS.ts',
] as const;

// Files that require SUPERVISED_WRITES (Level 2) to modify
export const SUPERVISED_FILES = [
  'src/services/itcCalculator.ts',
  'src/services/centralizedCalculations.ts',
  'src/services/validationSchemaService.ts',
  'src/services/utilityRateService.ts',
  'src/services/batteryDegradationService.ts',
] as const;

// ============================================================
// CANONICAL MERLIN PRODUCT LINES
// ============================================================

export const MERLIN_PRODUCTS = {
  MERLIN_PRO: {
    id: 'merlin-pro',
    name: 'Merlin Pro',
    description: 'Advanced BESS quote builder for energy professionals',
    targetUsers: ['EPC', 'Integrator', 'Battery Company', 'Engineering Firm'],
    pricingTiers: [
      { name: 'Starter', monthlyUsd: 299, quotesPerMonth: 50 },
      { name: 'Professional', monthlyUsd: 599, quotesPerMonth: 200 },
      { name: 'Enterprise', monthlyUsd: 999, quotesPerMonth: -1 }, // unlimited
    ],
  },
  SMB_VERTICALS: {
    id: 'smb-verticals',
    name: 'SMB Verticals',
    description: 'Industry-specific lead generation sites',
    revenueModel: 'cost-per-lead',
    leadPriceRangeUsd: [50, 500],
  },
  PARTNER_API: {
    id: 'partner-api',
    name: 'Merlin Partner API',
    description: 'White-label TrueQuote API for battery manufacturers',
    status: 'planned',
  },
} as const;

// ============================================================
// CANONICAL BESS BATTERY CHEMISTRIES
// ============================================================

export const BATTERY_CHEMISTRIES = {
  LFP: {
    id: 'lfp',
    name: 'Lithium Iron Phosphate',
    cycleLifeYears: 15,
    roundTripEfficiency: 0.92,
    calendarLifeYears: 20,
    safetyRating: 'high',
    preferredFor: ['commercial', 'utility-scale'],
  },
  NMC: {
    id: 'nmc',
    name: 'Nickel Manganese Cobalt',
    cycleLifeYears: 10,
    roundTripEfficiency: 0.95,
    calendarLifeYears: 15,
    safetyRating: 'medium',
    preferredFor: ['high-power-applications'],
  },
  LFMP: {
    id: 'lfmp',
    name: 'Lithium Iron Manganese Phosphate',
    cycleLifeYears: 18,
    roundTripEfficiency: 0.93,
    calendarLifeYears: 22,
    safetyRating: 'high',
    preferredFor: ['long-duration', 'commercial'],
  },
} as const;

export type BatteryChemistryId = keyof typeof BATTERY_CHEMISTRIES;

// ============================================================
// CANONICAL USE CASE APPLICATIONS
// ============================================================

export const USE_CASE_APPLICATIONS = [
  'peak-shaving',
  'demand-charge-reduction',
  'time-of-use-arbitrage',
  'backup-power',
  'solar-self-consumption',
  'frequency-regulation',
  'voltage-support',
  'microgrid',
  'ev-charging-support',
  'load-shifting',
] as const;

export type UseCaseApplication = typeof USE_CASE_APPLICATIONS[number];

// ============================================================
// RUNTIME POLICY ENFORCEMENT
// ============================================================

/**
 * Runtime check: Ensure a calculation result meets minimum validity criteria.
 * Throws if the result would violate POLICY-005 (validated output).
 */
export function assertValidQuoteOutput(output: Partial<CanonicalQuoteOutput>): void {
  const errors: string[] = [];

  if (output.totalCostDollars !== undefined && output.totalCostDollars <= 0) {
    errors.push(`[${POLICIES.VALIDATED_OUTPUT}] Total cost must be positive`);
  }

  if (output.paybackYears !== undefined && (output.paybackYears < 0 || output.paybackYears > 50)) {
    errors.push(`[${POLICIES.VALIDATED_OUTPUT}] Payback period out of range: ${output.paybackYears} years`);
  }

  if (output.irrDecimal !== undefined && (output.irrDecimal < -1 || output.irrDecimal > 2)) {
    errors.push(`[${POLICIES.VALIDATED_OUTPUT}] IRR out of valid range: ${output.irrDecimal}`);
  }

  if (output.confidenceScore !== undefined && (output.confidenceScore < 0 || output.confidenceScore > 100)) {
    errors.push(`[${POLICIES.VALIDATED_OUTPUT}] Confidence score must be 0-100`);
  }

  if (!output.benchmarkVersion) {
    errors.push(`[${POLICIES.VALIDATED_OUTPUT}] benchmarkVersion is required for audit trail`);
  }

  if (errors.length > 0) {
    throw new Error(`Merlin Policy Violation:\n${errors.join('\n')}`);
  }
}

/**
 * Runtime check: Ensure a value came from an authorized source.
 * Violations are logged and reported to the agent health system.
 */
export function assertAuthorizedSource(
  sourceKey: keyof typeof AUTHORITATIVE_SOURCES,
  value: number,
  description: string
): void {
  const source = AUTHORITATIVE_SOURCES[sourceKey];
  if (!source) {
    throw new Error(`[${POLICIES.SSOT}] Unknown source: ${sourceKey}. Must be one of: ${Object.keys(AUTHORITATIVE_SOURCES).join(', ')}`);
  }
  // Log for audit trail (non-throwing)
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Merlin Audit] ${description} = ${value} (source: ${source.name})`);
  }
}

// Export a type guard for canonical industries
export function isCanonicalIndustry(value: string): value is CanonicalIndustry {
  return (CANONICAL_INDUSTRIES as readonly string[]).includes(value);
}
