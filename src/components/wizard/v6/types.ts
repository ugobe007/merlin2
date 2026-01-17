/**
 * MERLIN WIZARD V6 - Type Definitions
 * ====================================
 * All types in ONE place. No hunting.
 *
 * Created: December 28, 2025
 * Updated: January 2026 - Added IndustryInputs type support
 */

import type { TrueQuoteAuthenticatedResult } from "@/services/merlin";
import type { IndustryInputs } from "@/types/industryInputTypes";

// ============================================================================
// WIZARD STATE - Single source of truth
// ============================================================================

export interface WizardState {
  // Step 1: Location & Goals
  zipCode: string;
  state: string;
  city: string;
  goals: EnergyGoal[];
  solarData?: { sunHours: number; rating: string }; // Solar irradiance data for location
  country?: string;
  electricityRate?: number;
  currency?: string;

  // Business lookup (from Google Places API)
  businessName?: string;
  businessAddress?: string;
  businessPhotoUrl?: string;
  businessPlaceId?: string;
  detectedIndustry?: string;
  businessLat?: number;
  businessLng?: number;

  // Step 1: Weather data (for context display)
  weatherData?: {
    profile: string;
    extremes: string;
    avgTempF?: number;
    avgHighF?: number;
    avgLowF?: number;
    heatingDegreeDays?: number;
    coolingDegreeDays?: number;
    source: 'visual-crossing' | 'nws' | 'cache';
  };

  // Step 1: Savings Preview (ESTIMATES ONLY - not SSOT)
  savingsPreview?: SavingsPreviewEstimate;

  // ✅ NEW: Step 1 Teaser Preview (Jan 16, 2026)
  // Separate namespace from calculations (SSOT)
  // Shows "Sneak Peek" estimates before facility details collected
  teaserPreview?: TeaserPreview | null;
  teaserPreviewVersion?: string;       // "teaser-v1"
  teaserLastUpdatedAt?: string;        // ISO timestamp
  teaserIsEstimateOnly?: boolean;      // Always true (reminder flag)

  // Step 2: Industry
  industry: string;
  industryName: string;

  // Step 2: Business Size (determines questionnaire depth)
  businessSizeTier?: BusinessSizeTier;
  questionnaireDepth?: QuestionnaireDepth;

  // Step 3: Facility Details
  facilityDetails: FacilityDetails;

  // Step 4: Opportunities (upsells)
  opportunities: OpportunitySelections;

  // Step 5: Selected Power Level
  selectedPowerLevel: PowerLevel | null;

  // Step 4: Options selections
  selectedOptions?: string[];
  solarTier?: string | null;
  evTier?: string | null;
  generatorTier?: string | null; // ✅ ADDED: Persists generator selection (Jan 16, 2026)
  customSolarKw?: number;
  customEvL2?: number;
  customEvDcfc?: number;
  customEvUltraFast?: number; // Ultra-Fast chargers (250-350 kW)
  customGeneratorKw?: number;
  generatorFuel?: "natural-gas" | "diesel";

  // Enabled state flags (preserves values when toggled off)
  solarEnabled?: boolean;
  evEnabled?: boolean;
  generatorEnabled?: boolean;

  // Step 3: Use Case Data - industry-specific inputs
  // Uses typed IndustryInputs union for type safety
  useCaseData: {
    inputs: IndustryInputs | Record<string, unknown>;
    // Optional: room for metadata if needed later
    // meta?: Record<string, any>;
  };

  // ✅ SSOT-only: do not write estimates here.
  // Populated ONLY by Step5MagicFit TrueQuote results.
  // Never write MagicFit estimates or temporary calculations here.
  calculations: SystemCalculations | null;

  // ✅ Quote cache for idempotency
  quoteCache?: {
    fingerprint: string;
    result: TrueQuoteAuthenticatedResult | null;
    inFlightFingerprint?: string; // Prevent concurrent calls
  };

  // ⚠️ Estimates only: safe to show for preview, never export/commit as SSOT.
  // This is a "proposal/preview layer" for UX speed.
  // It must NEVER be stored in calculations (SSOT-only).
  // Once TrueQuote authenticates, MagicFit display should be frozen or hidden.
  // Type shape is intentionally different from SystemCalculations to prevent accidental assignment.
  magicFit?: MagicFitEstimateState;
}

// ============================================================================
// STEP 1: Location & Goals
// ============================================================================

export type EnergyGoal =
  | "reduce_costs"
  | "backup_power"
  | "sustainability"
  | "grid_independence" // NEW
  | "peak_shaving" // NEW
  | "generate_revenue"; // NEW (replaces ev_ready)

// ============================================================================
// STEP 1: Savings Preview (ESTIMATES ONLY)
// ============================================================================

/**
 * Savings Preview Estimate
 * 
 * ⚠️ IMPORTANT: This is NOT TrueQuote™ verified data!
 * - Based on industry averages and heuristics
 * - Used ONLY to show a "sneak peek" in Step 1
 * - Clearly labeled as "Estimate" in UI
 * - Real TrueQuote™ numbers calculated in Steps 4-6
 */
export interface SavingsPreviewEstimate {
  estimatedSavingsLow: number;
  estimatedSavingsHigh: number;
  peakShavingSavings: number;
  solarPotential: number;
  backupValue: number;
  isEstimate: true; // Always true - never SSOT
  disclaimer: string;
  generatedAt: number;
}

/**
 * Teaser Preview (Jan 16, 2026)
 * 
 * ⚠️ IMPORTANT: This is NOT TrueQuote™ verified data!
 * - Based on industry averages and rough heuristics
 * - Used ONLY to show "Sneak Peek" in Step 1 after address lookup
 * - Clearly labeled as "Estimate only — not TrueQuote Verified"
 * - Real TrueQuote™ numbers calculated in Step 5+
 */
export interface TeaserPreview {
  // Scenario 1: BESS + Solar (save money)
  solarBess: {
    annualSavings: number;        // $/year
    roiYears: number;             // payback years
    monthlyPayment: number;       // if financed
    systemSize: string;           // "500 kW battery + 250 kW solar"
    roiCapped: boolean;           // ⚠️ true if ROI hit safety cap (show qualitative instead)
    savingsCapped: boolean;       // ⚠️ true if savings below threshold (unreliable)
  };
  
  // Scenario 2: BESS + Generator (resilience)
  generatorBess: {
    annualSavings: number;        // $/year (from peak shaving)
    roiYears: number;             // payback years
    monthlyPayment: number;       // if financed
    systemSize: string;           // "500 kW battery + 300 kW generator"
    resilienceHours: number;      // hours of backup power
    roiCapped: boolean;           // ⚠️ true if ROI hit safety cap (show qualitative instead)
    savingsCapped: boolean;       // ⚠️ true if savings below threshold (unreliable)
  };
  
  // Transparency
  assumptions: string[];          // ["Based on 1.8M kWh/year", "State avg rate: $0.12/kWh"]
  disclaimer: string;             // Standard disclaimer text
  confidence: 'low' | 'medium' | 'high'; // Based on available data
  
  // Metadata
  createdAt: string;              // ISO timestamp
  version: string;                // "teaser-v1"
  teaserHash: string;             // Hash of inputs (prevents recompute churn)
}

// ============================================================================
// STEP 2: Business Size Tier
// ============================================================================

export type BusinessSizeTier = 'small' | 'medium' | 'large' | 'enterprise';
export type QuestionnaireDepth = 'minimal' | 'standard' | 'detailed';

/**
 * Business Size Options per Industry
 * Each industry has different size thresholds
 */
export interface BusinessSizeOption {
  tier: BusinessSizeTier;
  label: string;
  description: string;
  icon: string;
  questionnaireDepth: QuestionnaireDepth;
}

// NOTE: ENERGY_GOALS array is now defined in Step1Location.tsx
// This export is kept for backward compatibility but may be deprecated
export const ENERGY_GOALS: { id: EnergyGoal; label: string; icon: string }[] = [
  { id: "reduce_costs", label: "Reduce Energy Costs", icon: "💰" },
  { id: "backup_power", label: "Backup Power Protection", icon: "🔋" },
  { id: "sustainability", label: "Sustainability / Net Zero", icon: "🌱" },
  { id: "grid_independence", label: "Grid Independence", icon: "🏠" },
  { id: "peak_shaving", label: "Peak Shaving", icon: "⚡" },
  { id: "generate_revenue", label: "Generate Revenue", icon: "💵" },
];

// ============================================================================
// STEP 2: Industry
// ============================================================================

export interface IndustryOption {
  slug: string;
  name: string;
  icon: string;
  description: string;
  image?: string;
}

export const INDUSTRIES: IndustryOption[] = [
  {
    slug: "hotel",
    name: "Hotel / Hospitality",
    icon: "🏨",
    description: "Hotels, resorts, motels",
  },
  { slug: "car_wash", name: "Car Wash", icon: "🚗", description: "Tunnel, express, full-service" },
  {
    slug: "ev_charging",
    name: "EV Charging Hub",
    icon: "⚡",
    description: "Charging stations, fleet depots",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "🏭",
    description: "Factories, industrial facilities",
  },
  { slug: "data_center", name: "Data Center", icon: "💾", description: "Server farms, colocation" },
  {
    slug: "hospital",
    name: "Hospital / Healthcare",
    icon: "🏥",
    description: "Hospitals, clinics, labs",
  },
  {
    slug: "retail",
    name: "Retail / Commercial",
    icon: "🏪",
    description: "Stores, shopping centers",
  },
  {
    slug: "office",
    name: "Office Building",
    icon: "🏢",
    description: "Corporate offices, coworking",
  },
  { slug: "college", name: "College / University", icon: "🎓", description: "Campus facilities" },
  {
    slug: "warehouse",
    name: "Warehouse / Logistics",
    icon: "📦",
    description: "Distribution centers",
  },
  { slug: "restaurant", name: "Restaurant", icon: "🍽️", description: "Restaurants, food service" },
  { slug: "agriculture", name: "Agriculture", icon: "🌾", description: "Farms, indoor growing" },
];

// ============================================================================
// STEP 3: Facility Details
// ============================================================================

export interface FacilityDetails {
  // Common to all industries
  squareFootage: number;
  operatingHours: number; // hours per day
  operatingDays: number; // days per week
  gridConnectionKW: number; // existing grid connection

  // Industry-specific (optional)
  roomCount?: number; // Hotels
  tunnelCount?: number; // Car Wash
  chargerCount?: number; // EV Charging
  rackCount?: number; // Data Center
  bedCount?: number; // Hospital

  // For solar sizing
  rooftopSquareFootage?: number;
  parkingSquareFootage?: number;
}

// ============================================================================
// STEP 4: Opportunities (The Upsell)
// ============================================================================

export interface OpportunitySelections {
  wantsSolar: boolean;
  wantsEV: boolean;
  wantsGenerator: boolean;
}

export interface OpportunityInfo {
  id: keyof OpportunitySelections;
  name: string;
  icon: string;
  description: string;
  benefit: string;
}

// ============================================================================
// STEP 5: Power Levels (Magic Fit)
// ============================================================================

export type PowerLevel = "starter" | "perfect_fit" | "beast_mode";

export interface PowerLevelConfig {
  id: PowerLevel;
  name: string;
  tagline: string;
  multiplier: number; // Applied to base calculation
  durationHours: number;
  color: string;
  recommended?: boolean;
}

export const POWER_LEVELS: PowerLevelConfig[] = [
  {
    id: "starter",
    name: "STARTER",
    tagline: "Smart & efficient",
    multiplier: 0.7,
    durationHours: 3,
    color: "cyan",
  },
  {
    id: "perfect_fit",
    name: "PERFECT FIT",
    tagline: "Merlin's pick ⭐",
    multiplier: 1.0,
    durationHours: 4,
    color: "purple",
    recommended: true,
  },
  {
    id: "beast_mode",
    name: "BEAST MODE",
    tagline: "Maximum savings",
    multiplier: 1.5,
    durationHours: 6,
    color: "orange",
  },
];

// ============================================================================
// CALCULATIONS - Base vs Selected Split
// ============================================================================

/**
 * Base calculations (SSOT from TrueQuote baseCalculation)
 * These values never change once computed and should never be overwritten by tier selection.
 */
export interface CalculationsBase {
  // SSOT (TrueQuote baseCalculation)
  annualConsumptionKWh: number;
  peakDemandKW: number;
  baseBuildingLoadKW?: number; // ✅ ADDED: Real base load if available (Jan 16, 2026)

  utilityName?: string;
  utilityRate?: number;
  demandCharge?: number;
  hasTOU?: boolean;

  quoteId?: string;
  pricingSources?: string[];
  quoteInputHash?: string; // ✅ ADDED: Drift detection (Jan 16, 2026)
}

/**
 * Selected tier calculations
 * These values change when the user selects a different tier (starter/perfect_fit/beast_mode).
 */
export interface CalculationsSelected {
  // Tier-selected system sizing
  bessKW: number;
  bessKWh: number;

  solarKW: number;
  evChargers: number;
  generatorKW: number;

  // Financials (tier)
  totalInvestment: number;
  annualSavings: number;
  paybackYears: number;
  tenYearROI: number;

  federalITC: number;
  federalITCRate?: number;
  netInvestment: number;
}

/**
 * System Calculations - Nested structure to prevent base values from being overwritten
 */
export interface SystemCalculations {
  base: CalculationsBase;
  selected: CalculationsSelected;
}

// ============================================================================
// MAGICFIT ESTIMATE STATE (temporary, non-SSOT)
// ============================================================================

/**
 * MagicFit Estimate State
 *
 * ⚠️ This is intentionally a different shape from SystemCalculations
 * to prevent accidental assignment or mixing with SSOT data.
 *
 * MagicFit outputs are:
 * - Temporary estimates for UX preview
 * - Labeled as "Estimate" in UI
 * - Never exported or used for final quotes
 * - Replaced by TrueQuote results in Step 5
 */
export interface MagicFitEstimateState {
  fingerprint: string; // Fingerprint of inputs used for MagicFit
  scenarios: Array<{
    type: "essentials" | "balanced" | "max-savings";
    name: string;
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
    generatorKW: number;
    estimatedCost: number;
    estimatedSavings: number;
    estimatedPayback: number;
  }>;
  selectedType?: "essentials" | "balanced" | "max-savings";
  isEstimate: true; // Always true - MagicFit is never SSOT
  generatedAt: number; // Timestamp
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export const INITIAL_WIZARD_STATE: WizardState = {
  zipCode: "",
  state: "",
  city: "",
  goals: [],
  industry: "",
  industryName: "",
  facilityDetails: {
    squareFootage: 0,
    operatingHours: 12,
    operatingDays: 7,
    gridConnectionKW: 0,
  },
  opportunities: {
    wantsSolar: false,
    wantsEV: false,
    wantsGenerator: false,
  },
  selectedPowerLevel: null,
  selectedOptions: ["solar"],
  solarTier: "recommended",
  evTier: null,
  useCaseData: { inputs: {} },
  calculations: null,
  quoteCache: undefined,
  magicFit: undefined, // MagicFit proposals are optional (temporary, non-SSOT)
};
// STEP DEFINITIONS
// ============================================================================

export interface StepDefinition {
  number: number;
  name: string;
  path: string;
}

export const WIZARD_STEPS: StepDefinition[] = [
  { number: 1, name: "Location", path: "location" },
  { number: 2, name: "Industry", path: "industry" },
  { number: 3, name: "Details", path: "details" },
  { number: 4, name: "Options", path: "options" },
  { number: 5, name: "System", path: "system" },
  { number: 6, name: "Quote", path: "quote" },
];
