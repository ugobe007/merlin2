/**
 * MERLIN ENERGY SYSTEM CONTRACTS
 * 
 * This file defines the data contracts between:
 * - Merlin (General Contractor / Orchestrator)
 * - TrueQuote (Prime Sub Contractor / Calculation Engine)
 * - Magic Fit (Sub/Sub Contractor / Optimization Engine)
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  MERLIN (Orchestrator)                      │
 * │  Collects inputs → Delegates to TrueQuote → Displays results│
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │               TRUEQUOTE (Calculation SSOT)                  │
 * │  Calculates → Delegates to MagicFit → Authenticates results │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                MAGIC FIT (Optimizer)                        │
 * │  Receives base calc → Generates 3 options → Returns proposal│
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Created: January 4, 2026
 * SSOT Version: 1.0
 */

import type { MarginRenderEnvelope } from "@/types/marginRenderEnvelope";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type Industry = 
  | 'hotel' | 'car_wash' | 'ev_charging' | 'manufacturing' 
  | 'data_center' | 'hospital' | 'retail' | 'office' 
  | 'college' | 'warehouse' | 'restaurant' | 'agriculture'
  | 'airport' | 'casino' | 'indoor_farm' | 'apartment'
  | 'cold_storage' | 'shopping_center' | 'government' | 'gas_station'
  | 'residential' | 'microgrid' | 'heavy_duty_truck_stop';

export type EnergyGoal = 
  | 'reduce_costs' | 'backup_power' | 'sustainability' 
  | 'grid_independence' | 'peak_shaving' | 'generate_revenue';

export type GeneratorFuel = 'natural-gas' | 'diesel';

export type BatteryChemistry = 'LFP' | 'NMC' | 'LTO';

export type SolarType = 'monocrystalline' | 'polycrystalline' | 'thin-film';

export type OptionTier = 'starter' | 'perfectFit' | 'beastMode';

// ============================================================================
// MERLIN REQUEST (Orchestrator → TrueQuote)
// ============================================================================

/**
 * MerlinRequest: Everything the orchestrator collects from the user
 * This is the ONLY input TrueQuote needs to generate a complete quote
 */
export interface MerlinRequest {
  // ─────────────────────────────────────────────────────────────
  // LOCATION (Step 1)
  // ─────────────────────────────────────────────────────────────
  location: {
    zipCode: string;           // US: "89052", International: ""
    country: string;           // "US", "MX", "DE", etc.
    state: string;             // "NV", "CA", or country code for international
    city?: string;             // Optional: "Las Vegas"
  };

  // ─────────────────────────────────────────────────────────────
  // GOALS (Step 1)
  // ─────────────────────────────────────────────────────────────
  goals: EnergyGoal[];         // Min 2 required

  // ─────────────────────────────────────────────────────────────
  // FACILITY (Step 2 + Step 3)
  // ─────────────────────────────────────────────────────────────
  facility: {
    industry: Industry;
    industryName: string;      // Display name: "Hotel & Hospitality"
    useCaseData: Record<string, any>;  // All questionnaire answers
  };

  // ─────────────────────────────────────────────────────────────
  // USER PREFERENCES (Step 4)
  // These override TrueQuote's recommendations
  // ─────────────────────────────────────────────────────────────
  preferences: {
    solar: {
      interested: boolean;
      customSizeKw?: number;   // User override, undefined = use TrueQuote recommendation
      type?: SolarType;
    };
    generator: {
      interested: boolean;
      customSizeKw?: number;   // User override
      fuelType?: GeneratorFuel;
    };
    ev: {
      interested: boolean;
      l2Count?: number;
      dcfcCount?: number;
      ultraFastCount?: number;
    };
    bess: {
      customPowerKw?: number;  // Usually not user-configurable, but allow override
      customEnergyKwh?: number;
      chemistry?: BatteryChemistry;
    };
  };

  // ─────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────
  requestId: string;           // Unique ID for tracking
  requestedAt: string;         // ISO timestamp
  version: string;             // Contract version: "1.0"
}

// ============================================================================
// TRUEQUOTE BASE CALCULATION (Internal - TrueQuote's work)
// ============================================================================

/**
 * TrueQuoteBaseCalculation: The raw calculation before Magic Fit optimization
 * This represents TrueQuote's engineering recommendation
 */
export interface TrueQuoteBaseCalculation {
  // ─────────────────────────────────────────────────────────────
  // LOAD ANALYSIS
  // ─────────────────────────────────────────────────────────────
  load: {
    peakDemandKW: number;      // Maximum power draw
    annualConsumptionKWh: number;
    averageDailyKWh: number;
    loadProfile: 'flat' | 'peaky' | 'seasonal';
  };

  // ─────────────────────────────────────────────────────────────
  // BESS RECOMMENDATION
  // ─────────────────────────────────────────────────────────────
  bess: {
    powerKW: number;
    energyKWh: number;
    durationHours: number;     // energyKWh / powerKW
    chemistry: BatteryChemistry;
    efficiency: number;        // 0.85-0.95
    warrantyYears: number;
    estimatedCost: number;
    costPerKwh: number;
  };

  // ─────────────────────────────────────────────────────────────
  // SOLAR RECOMMENDATION
  // ─────────────────────────────────────────────────────────────
  solar: {
    recommended: boolean;
    capacityKW: number;          // Final recommended size (respects roof constraint)
    type: SolarType;
    annualProductionKWh: number;
    capacityFactor: number;      // 0.15-0.25 typical
    estimatedCost: number;
    costPerWatt: number;
    roofAreaSqFt: number;        // Required area for capacityKW
    // NEW: Roof constraint fields (Jan 6, 2026)
    idealCapacityKW: number;     // What we'd recommend without roof limits
    maxRoofCapacityKW: number;   // Max that physically fits on roof
    solarGapKW: number;          // Shortfall: idealCapacityKW - maxRoofCapacityKW
    isRoofConstrained: boolean;  // True if roof limits the system
  };

  // ─────────────────────────────────────────────────────────────
  // GENERATOR RECOMMENDATION
  // ─────────────────────────────────────────────────────────────
  generator: {
    recommended: boolean;
    reason?: string;           // "High-risk weather zone", "Critical facility"
    capacityKW: number;
    fuelType: GeneratorFuel;
    runtimeHours: number;      // At full load with standard tank
    estimatedCost: number;
  };

  // ─────────────────────────────────────────────────────────────
  // EV CHARGING RECOMMENDATION
  // ─────────────────────────────────────────────────────────────
  ev: {
    recommended: boolean;
    l2Count: number;
    l2PowerKW: number;         // Per charger
    dcfcCount: number;
    dcfcPowerKW: number;
    ultraFastCount: number;
    ultraFastPowerKW: number;
    totalPowerKW: number;
    estimatedCost: number;
  };

  // ─────────────────────────────────────────────────────────────
  // UTILITY & LOCATION DATA
  // ─────────────────────────────────────────────────────────────
  utility: {
    name: string;
    rate: number;              // $/kWh
    demandCharge: number;      // $/kW
    hasTOU: boolean;           // Time of Use pricing
    peakRate?: number;
    offPeakRate?: number;
  };

  location: {
    sunHoursPerDay: number;
    solarRating: 'A' | 'B' | 'C' | 'D';
    climateZone: string;
    isHighRiskWeather: boolean;  // Hurricane, tornado prone
    weatherRiskReason?: string;
  };

  // ─────────────────────────────────────────────────────────────
  // BASE FINANCIALS (before Magic Fit adjustments)
  // ─────────────────────────────────────────────────────────────
  financials: {
    totalEquipmentCost: number;
    installationCost: number;
    totalInvestment: number;
    federalITC: number;
    federalITCRate: number;    // 0.30 = 30%
    estimatedStateIncentives: number;
    netCost: number;
    annualSavings: number;
    simplePaybackYears: number;
    tenYearROI: number;
    twentyFiveYearNPV: number;
  };
}

// ============================================================================
// MAGIC FIT PROPOSAL (MagicFit → TrueQuote for approval)
// ============================================================================

/**
 * SystemOption: A single configuration option (Starter, Perfect Fit, Beast Mode)
 */
export interface SystemOption {
  tier: OptionTier;
  name: string;                // "Starter", "Perfect Fit", "Beast Mode"
  tagline: string;             // "Essential savings", "Optimal balance", "Maximum power"
  
  // System Configuration
  bess: {
    powerKW: number;
    energyKWh: number;
    chemistry: BatteryChemistry;
  };
  solar: {
    included: boolean;
    capacityKW: number;                    // Roof solar only
    carportCapacityKW?: number;            // NEW: Carport solar (optional)
    totalCapacityKW?: number;             // NEW: Total (roof + carport)
    type?: SolarType;                      // NEW: Panel type
    annualProductionKWh?: number;          // NEW: Annual production
    estimatedCost?: number;                // NEW: Cost estimate
    // NEW: Roof constraint info for UI
    isRoofConstrained?: boolean;
    maxRoofCapacityKW?: number;
    includesCarport?: boolean;
  };
  generator: {
    included: boolean;
    capacityKW: number;
    fuelType: GeneratorFuel;
  };
  ev: {
    included: boolean;
    l2Count: number;
    dcfcCount: number;
    ultraFastCount: number;
    totalPowerKW: number;
  };

  // Financials for this option
  financials: {
    totalInvestment: number;
    federalITC: number;
    stateIncentives: number;
    netCost: number;
    annualSavings: number;
    paybackYears: number;
    tenYearROI: number;
    monthlyPayment?: number;   // If financing available
  };

  // Coverage metrics
  coverage: {
    energyCoveragePercent: number;   // How much of load this covers
    backupHours: number;             // Hours of backup power
    peakShavingPercent: number;      // Demand charge reduction
  };

  // Why Magic Fit chose these numbers
  optimizationNotes: string[];
}

/**
 * MagicFitProposal: What Magic Fit submits to TrueQuote for authentication
 */
export interface MagicFitProposal {
  // The 3 options
  starter: SystemOption;
  perfectFit: SystemOption;
  beastMode: SystemOption;

  // What the user's goals were (for context)
  optimizedFor: EnergyGoal[];

  // Magic Fit's reasoning
  methodology: string;         // Brief explanation of optimization approach
  
  // Metadata
  generatedAt: string;
  magicFitVersion: string;
}

// ============================================================================
// TRUEQUOTE AUTHENTICATED RESULT (TrueQuote → Merlin)
// ============================================================================

/**
 * AuthenticatedSystemOption: A SystemOption that TrueQuote has verified
 */
export interface AuthenticatedSystemOption extends SystemOption {
  // TrueQuote verification stamp
  verified: true;
  verificationDetails: {
    bessValid: boolean;
    solarValid: boolean;
    generatorValid: boolean;
    financialsValid: boolean;
    roiAccurate: boolean;
  };
  // Margin policy envelope (added Feb 2026)
  marginRender?: MarginRenderEnvelope;
}

/**
 * TrueQuoteAuthenticatedResult: The final output Merlin displays to the user
 * 
 * This is the ONLY data structure the UI should use for displaying quotes.
 * It has been calculated by TrueQuote and verified for accuracy.
 */
export interface TrueQuoteAuthenticatedResult {
  // ─────────────────────────────────────────────────────────────
  // VERIFICATION (TrueQuote's seal of approval)
  // ─────────────────────────────────────────────────────────────
  verification: {
    verified: boolean;
    verifiedAt: string;        // ISO timestamp
    verificationHash: string;  // SHA-256 of the result for integrity
    trueQuoteVersion: string;  // Engine version
    expiresAt: string;         // Quote valid until (e.g., 30 days)
  };

  // ─────────────────────────────────────────────────────────────
  // QUOTE ID (for tracking & retrieval)
  // ─────────────────────────────────────────────────────────────
  quoteId: string;             // Unique quote identifier: "MQ-ABC123"
  requestId: string;           // Links back to MerlinRequest

  // ─────────────────────────────────────────────────────────────
  // BASE CALCULATION (for reference/debugging)
  // ─────────────────────────────────────────────────────────────
  baseCalculation: TrueQuoteBaseCalculation;

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATED OPTIONS (Magic Fit's work, TrueQuote approved)
  // ─────────────────────────────────────────────────────────────
  options: {
    starter: AuthenticatedSystemOption;
    perfectFit: AuthenticatedSystemOption;
    beastMode: AuthenticatedSystemOption;
  };

  // ─────────────────────────────────────────────────────────────
  // INCENTIVES (TrueQuote calculated - single source of truth)
  // ─────────────────────────────────────────────────────────────
  incentives: {
    federal: {
      itcAmount: number;
      itcRate: number;         // 0.30 = 30%
      itcEligibleCost: number; // What the ITC applies to (BESS + Solar only)
    };
    state: {
      totalAmount: number;
      programs: Array<{
        name: string;
        amount: number;
        type: 'rebate' | 'tax_credit' | 'grant';
      }>;
    };
    utility: {
      totalAmount: number;
      programs: Array<{
        name: string;
        amount: number;
        type: string;
      }>;
    };
    totalIncentives: number;
  };

  // ─────────────────────────────────────────────────────────────
  // FACILITY SUMMARY (echo back what we calculated for)
  // ─────────────────────────────────────────────────────────────
  facility: {
    industry: Industry;
    industryName: string;
    location: string;          // "Las Vegas, NV"
    peakDemandKW: number;
    annualConsumptionKWh: number;
  };

  // ─────────────────────────────────────────────────────────────
  // WARNINGS & NOTES
  // ─────────────────────────────────────────────────────────────
  warnings: Array<{
    type: 'info' | 'warning' | 'critical';
    message: string;
    field?: string;            // Which field this relates to
  }>;

  notes: string[];             // General notes about the quote
}

// ============================================================================
// REJECTION RESPONSE (when TrueQuote rejects Magic Fit's proposal)
// ============================================================================

export interface TrueQuoteRejection {
  rejected: true;
  reason: string;
  details: Array<{
    option: OptionTier;
    field: string;
    expected: string;
    received: string;
  }>;
  suggestion: string;          // How to fix
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAuthenticated(
  result: TrueQuoteAuthenticatedResult | TrueQuoteRejection
): result is TrueQuoteAuthenticatedResult {
  return 'verification' in result && result.verification.verified === true;
}

export function isRejected(
  result: TrueQuoteAuthenticatedResult | TrueQuoteRejection
): result is TrueQuoteRejection {
  return 'rejected' in result && result.rejected === true;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new MerlinRequest with defaults
 */
export function createMerlinRequest(partial: Partial<MerlinRequest> = {}): MerlinRequest {
  return {
    location: {
      zipCode: '',
      country: 'US',
      state: '',
      city: '',
      ...partial.location,
    },
    goals: partial.goals || [],
    facility: {
      industry: 'hotel',
      industryName: 'Hotel & Hospitality',
      useCaseData: {},
      ...partial.facility,
    },
    preferences: {
      solar: { interested: false, ...partial.preferences?.solar },
      generator: { interested: false, ...partial.preferences?.generator },
      ev: { interested: false, ...partial.preferences?.ev },
      bess: { ...partial.preferences?.bess },
    },
    requestId: partial.requestId || `MR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    requestedAt: partial.requestedAt || new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Generate a quote ID
 */
export function generateQuoteId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
  let id = 'MQ-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Generate verification hash
 */
export function generateVerificationHash(data: any): string {
  // Simple hash for now - in production use crypto.subtle.digest
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
