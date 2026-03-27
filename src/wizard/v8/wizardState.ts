/**
 * =============================================================================
 * WIZARD V8 — STATE SPINE
 * =============================================================================
 *
 * DOCTRINE: One state object. One reducer. No secondary stores.
 *
 * V7 had three state buses (WizardState + merlinMemory + TrueQuoteTemp) that
 * drifted apart and caused the solar-bleed bug (867ce0c). V8 has exactly one.
 * Every value the wizard needs lives here, written once by its owning step.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EDITING POLICY FOR AI AGENTS (READ BEFORE TOUCHING ANY WIZARD FILE)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * RULE 1 — THE SPINE IS FROZEN
 *   You may add new fields to WizardState. You may NEVER remove or rename
 *   existing fields without updating every consumer. Renaming breaks silently.
 *
 * RULE 2 — ONE STATE BUS
 *   Do not write to sessionStorage, localStorage, or any pub/sub store
 *   from a wizard step. If you need to persist something across steps,
 *   add a field here. Cross-session persistence is a separate feature.
 *
 * RULE 3 — STEPS ARE PURE RENDERERS
 *   Step components (Step1V8.tsx through Step6V8.tsx) contain only JSX,
 *   local UI state (open/closed, mid-edit field values), and dispatch() calls.
 *   NO API calls. NO calculations. NO imports from other step files.
 *
 * RULE 4 — GOALS GUIDE, DATA DECIDES
 *   Goals (Step 4) adjust sizing weights — they do NOT set values.
 *   Values come from the four collected layers:
 *     · Step 1 (location)  → sun hours, utility rate, demand charge
 *     · Step 2 (industry)  → solar physical cap kW, critical load %
 *     · Step 3 (profile)   → base/peak load kW, EV chargers, generator intent
 *     · Step 4 (goal)      → sizing bias (save_more/save_most/full_power)
 *   BESS is always included — it is the core product.
 *   Solar is bounded by Steps 1×2 (sun quality × physical capacity).
 *   Generator is included when Step 3 intent warrants it or goal=full_power.
 *   There is no add-on panel in Step 6. No post-quote configuration.
 *
 * RULE 5 — PRICING RUNS ONCE
 *   calculateQuote() is called exactly once, during tier building (Step 4).
 *   Three tiers come from pure math scaling of that single result.
 *   No recalculation after SET_TIERS is dispatched.
 *
 * RULE 6 — ALL NUMBERS COME FROM SSOT
 *   calculateQuote()         → unifiedQuoteCalculator.ts
 *   calculateUseCasePower()  → useCasePowerCalculations.ts
 *   getFacilityConstraints() → useCasePowerCalculations.ts
 *   getCriticalLoadWithSource() → benchmarkSources.ts
 *
 * RULE 7 — NO NEW FILES WITHOUT A LAYER ASSIGNMENT
 *   Layer 1: wizardState.ts (this file — spine)
 *   Layer 2: useWizardV8.ts (hook — wires APIs and dispatches)
 *   Layer 3: steps/Step1V8.tsx … steps/Step6V8.tsx (pure renderers)
 *   Layer 4: WizardV8Page.tsx (shell — routes steps, bottom nav only)
 *   If your file doesn't fit a layer, extend an existing file.
 *
 * RULE 8 — SOLAR FEASIBILITY GATE
 *   Solar is included only when BOTH:
 *   (a) solarGrade is B- or better (peakSunHours ≥ 3.5)
 *   (b) solarPhysicalCapKW > 0 (industry/building can physically support it)
 *   Violation of either → solar excluded, note added to audit trail.
 *
 * =============================================================================
 */

import { hasStep35Addons } from "./addonIntent";

// ── Solar grade type ─────────────────────────────────────────────────────────
// Maps to gradeFromPSH() in wizardAPI.ts. Order matters for isSolarFeasible().
export type SolarGrade = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D";

/** Ordered from worst → best so indexOf comparisons work correctly */
const SOLAR_GRADE_ORDER: SolarGrade[] = ["D", "C", "C+", "B-", "B", "B+", "A-", "A"];

/**
 * Solar feasibility gate (Decision Log #8, March 2026)
 * B- = minimum viable grade (peakSunHours ≥ 3.5)
 * C+ and below = solar excluded from all tiers
 */
export function isSolarFeasible(grade: SolarGrade | null): boolean {
  if (!grade) return false;
  return SOLAR_GRADE_ORDER.indexOf(grade) >= SOLAR_GRADE_ORDER.indexOf("B-");
}

// ── Domain types ─────────────────────────────────────────────────────────────

export type WizardStep = 0 | 1 | 2 | 3 | 3.5 | 4 | 5 | 6;

// Step mapping:
// 0 = Mode selection
// 1 = Location + addon preferences
// 2 = Industry selection
// 3 = Questionnaire (industry-specific)
// 3.5 = Addon configuration (conditional - only if wantsSolar/wantsEV/wantsGenerator)
// 4 = MagicFit (3 tiers: STARTER/PERFECT FIT/BEAST MODE)
// 5 = Quote results + export

export type IndustrySlug =
  | "hotel"
  | "car_wash"
  | "ev_charging"
  | "office"
  | "retail"
  | "restaurant"
  | "warehouse"
  | "manufacturing"
  | "data_center"
  | "hospital"
  | "healthcare"
  | "gas_station"
  | "truck_stop"
  | "apartment"
  | "cold_storage"
  | "college"
  | "government"
  | "airport"
  | "casino"
  | "microgrid"
  | "residential"
  | "agricultural"
  | "shopping_center"
  | "indoor_farm"
  | "fitness_center"
  | "gym"
  | "other";

export type TierLabel = "Starter" | "Recommended" | "Complete";
export type EVChargerType = "l2" | "dcfc" | "hpc";

/** API fetch lifecycle — shared across all three intel calls */
export type FetchStatus = "idle" | "fetching" | "ready" | "error";

// ── Location & Intel ─────────────────────────────────────────────────────────

export interface LocationData {
  zip: string;
  city: string;
  state: string; // 2-letter, e.g. "NV"
  formattedAddress: string;
  lat?: number;
  lng?: number;
}

export interface BusinessData {
  name: string;
  address?: string; // Optional street address
  website?: string; // Optional website URL
  description?: string; // Optional Google business summary
  photoAttributionName?: string; // Required Google photo attribution display name
  photoAttributionUri?: string; // Required Google photo attribution link
  estimatedRoofSpaceSqFt?: number; // Industry-based roof space estimate
  detectedIndustry: IndustrySlug | null;
  confidence: number; // 0-1 confidence score
  // Google Places API data
  placeId?: string; // Google Places ID
  formattedAddress?: string; // Full formatted address from Google
  photoUrl?: string; // Business photo from Google Places
  lat?: number; // Latitude
  lng?: number; // Longitude
}

export interface LocationIntel {
  // Utility (from fetchUtility)
  utilityRate: number; // $/kWh, e.g. 0.10
  demandCharge: number; // $/kW/month, e.g. 10.00
  utilityProvider: string; // "NV Energy"
  // TOU rate data (from utilityRateService hasTOU flag)
  hasTOU: boolean; // true when utility offers Time-of-Use rates (enables BESS arbitrage)
  peakRate?: number; // $/kWh peak rate (for TOU arbitrage spread calc); defaults to utilityRate + 0.05
  // Solar (from fetchSolar → NREL PVWatts or regional fallback)
  solarGrade: SolarGrade; // "B+"
  solarFeasible: boolean; // computed: grade >= B-  (THRESHOLD B-)
  peakSunHours: number; // 4.9
  // Climate (from fetchWeather)
  weatherRisk: string; // "Low" | "Moderate" | "High" | or raw risk string
  weatherProfile: string; // "Hot & Dry"
  avgTempF: number; // 75
}

// ── Quote tier ───────────────────────────────────────────────────────────────

export interface QuoteTier {
  label: TierLabel;
  // Sizing
  bessKWh: number;
  bessKW: number;
  solarKW: number; // 0 when not feasible or goal doesn't include solar
  generatorKW: number; // always > 0 (all tiers include generator)
  generatorFuelType?: "diesel" | "natural-gas" | "dual-fuel"; // Fuel type from Step 3.5
  evChargerKW: number; // 0 if no EV configured
  durationHours: number;
  // Costs (sell prices — margin already applied via Margin Policy Engine)
  grossCost: number; // before ITC
  itcRate: number; // IRA 2022 dynamic (0.06 – 0.70)
  itcAmount: number;
  netCost: number; // grossCost − itcAmount
  // Financial outcomes (V4.5 honest TCO)
  grossAnnualSavings: number; // before reserves deduction
  annualReserves: number; // insurance, inverter replacement, degradation (V4.5)
  annualSavings: number; // NET savings (gross - reserves) for honest payback
  evRevenuePerYear: number; // subset of grossAnnualSavings (for display isolation)
  paybackYears: number;
  roi10Year: number; // percent, e.g. 185.0
  npv: number;
  // Margin policy (V4.5 transparency)
  marginBandId: string; // e.g., "micro", "small", "medium"
  blendedMarginPercent: number; // effective margin applied (e.g., 14.2)
  /** Equipment subtotal (before site work, contingency, Merlin fee) — used by
   *  CalculationValidator for Supabase audit + alert pipeline. */
  equipmentSubtotal?: number;
  /** Installation & field labor (concrete, trenching, commissioning, solar crew) — Additional Costs */
  installationLaborCost?: number;
  /** Total project cost = equipment quote + installation labor — true ROI/NPV investment basis */
  totalProjectCost?: number;
  // TrueQuote™ audit trail
  notes: string[];
  /**
   * ROI Guardrail — set when payback exceeded the tier target and the system
   * was automatically adjusted to bring it within range.
   * applied=true  → equipment was changed (generator removed, BESS scaled down)
   * applied=false → payback is still high but no auto-fix was possible (info only)
   */
  guardrail?: {
    applied: boolean;
    originalPaybackYears: number;
    adjustedPaybackYears: number;
    removedComponents: string[];
    reason: string;
  };
}

// ── Wizard state (the spine) ─────────────────────────────────────────────────

export interface WizardState {
  // ── Navigation ──────────────────────────────────────────────────────────
  step: WizardStep;

  // ── Step 1: Location ─────────────────────────────────────────────────────
  // Written by Step 1. Read by all subsequent steps (rate, grade, climate).
  locationRaw: string; // raw input while user types
  country: string; // Country code for international support (e.g., "US", "CA", "GB")
  countryCode: string; // ISO country code (same as country for now)
  location: LocationData | null;
  locationStatus: FetchStatus; // geocode API status
  business: BusinessData | null; // Business name + detected industry
  intel: LocationIntel | null;
  intelStatus: {
    utility: FetchStatus;
    solar: FetchStatus;
    weather: FetchStatus;
  };
  gridReliability: "reliable" | "occasional-outages" | "frequent-outages" | "unreliable" | null;

  // ── Step 2: Industry ─────────────────────────────────────────────────────
  // Written by Step 2. Meta derived immediately from industry slug.
  industry: IndustrySlug | null;
  solarPhysicalCapKW: number; // getFacilityConstraints().totalRealisticSolarKW
  criticalLoadPct: number; // getCriticalLoadWithSource() — IEEE 446 / NEC

  // ── Step 3: Infrastructure Profile ──────────────────────────────────────
  // Written by Step 3. baseLoadKW is the Layer A power profile result.
  step3Answers: Record<string, unknown>;
  evChargers: { type: EVChargerType; count: number } | null;
  baseLoadKW: number; // calculateUseCasePower() avg load
  peakLoadKW: number; // calculateUseCasePower() peak (used for sizing)
  criticalLoadKW: number; // Critical loads only (for generator sizing in non-critical facilities)
  evRevenuePerYear: number; // evChargingCalculations.ts, 0 when no EV

  // ── Step 1: Add-on Preferences (asked upfront for optimization) ─────────
  wantsSolar: boolean; // User wants solar in their quote
  wantsEVCharging: boolean; // User wants EV charging in their quote
  wantsGenerator: boolean; // User wants backup generator

  // ── Step 4: Add-on Configuration (shown if any addon flags are true) ─────
  solarKW: number; // Solar array size in kW
  generatorKW: number; // Generator capacity in kW
  generatorFuelType: "diesel" | "natural-gas" | "dual-fuel";
  level2Chargers: number; // Count of Level 2 EV chargers (7-22 kW)
  dcfcChargers: number; // Count of DC Fast Chargers (50-150 kW)
  hpcChargers: number; // Count of High Power Chargers (250-350 kW)

  // ── Step 4: MagicFit Tiers ───────────────────────────────────────────────
  // 3 configurations optimized for savings (STARTER/PERFECT FIT/BEAST MODE)
  tiersStatus: FetchStatus;
  tiers: [QuoteTier, QuoteTier, QuoteTier] | null;
  selectedTierIndex: 0 | 1 | 2 | null; // User must select, no pre-selection

  // ── System ───────────────────────────────────────────────────────────────
  isBusy: boolean;
  busyLabel: string;
  error: { code: string; message: string } | null;
}

// ── Intents (down from 44 in V7 to 18) ──────────────────────────────────────

export type WizardIntent =
  // Step 1
  | { type: "SET_LOCATION_RAW"; value: string }
  | { type: "SET_LOCATION"; location: LocationData }
  | { type: "SET_LOCATION_STATUS"; status: FetchStatus }
  | { type: "CLEAR_LOCATION" }
  | {
      type: "SET_GRID_RELIABILITY";
      reliability: "reliable" | "occasional-outages" | "frequent-outages" | "unreliable";
    }
  | { type: "SET_BUSINESS"; business: BusinessData | null }
  | { type: "SET_BUSINESS_ADDRESS"; address: string }
  | { type: "CONFIRM_BUSINESS" } // Confirms business and advances
  | {
      type: "PATCH_INTEL";
      patch: Partial<LocationIntel> & {
        utilityStatus?: FetchStatus;
        solarStatus?: FetchStatus;
        weatherStatus?: FetchStatus;
      };
    }
  // Step 2
  | { type: "SET_INDUSTRY"; slug: IndustrySlug }
  | {
      type: "SET_INDUSTRY_META";
      solarPhysicalCapKW: number;
      criticalLoadPct: number;
    }
  // Step 3
  | { type: "SET_ANSWER"; key: string; value: unknown }
  | { type: "SET_EV_CHARGERS"; chargers: WizardState["evChargers"] }
  | { type: "SET_ADDON_PREFERENCE"; addon: "solar" | "ev" | "generator"; value: boolean }
  | {
      type: "SET_ADDON_CONFIG";
      config: Partial<{
        solarKW: number;
        generatorKW: number;
        generatorFuelType: "diesel" | "natural-gas" | "dual-fuel";
        level2Chargers: number;
        dcfcChargers: number;
        hpcChargers: number;
      }>;
    }
  | {
      type: "SET_BASE_LOAD";
      baseLoadKW: number;
      peakLoadKW: number;
      criticalLoadKW?: number; // For non-critical facilities (car wash, retail, office)
      evRevenuePerYear?: number;
    }
  // Step 4: MagicFit
  | { type: "SET_TIERS_STATUS"; status: FetchStatus }
  | { type: "SET_TIERS"; tiers: [QuoteTier, QuoteTier, QuoteTier] }
  // Step 5
  | { type: "SELECT_TIER"; index: 0 | 1 | 2 }
  // Navigation
  | { type: "GO_TO_STEP"; step: WizardStep }
  | { type: "GO_BACK" }
  // System
  | { type: "SET_BUSY"; isBusy: boolean; label?: string }
  | { type: "SET_ERROR"; code: string; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

// ── Factory ───────────────────────────────────────────────────────────────────

export function initialState(): WizardState {
  return {
    step: 0, // Start at Step 0 (Mode Selection)
    locationRaw: "",
    country: "US", // Default to US
    countryCode: "US", // Default to US
    location: null,
    locationStatus: "idle",
    business: null,
    intel: null,
    intelStatus: { utility: "idle", solar: "idle", weather: "idle" },
    gridReliability: null,
    industry: null,
    solarPhysicalCapKW: 0,
    criticalLoadPct: 0.4, // default: 40% (retail/general commercial)
    step3Answers: {},
    evChargers: null,
    baseLoadKW: 0,
    peakLoadKW: 0,
    criticalLoadKW: 0, // Critical loads for generator sizing
    evRevenuePerYear: 0,
    wantsSolar: false,
    wantsEVCharging: false,
    wantsGenerator: false,
    // Addon config defaults (Step 3.5)
    solarKW: 0,
    generatorKW: 0,
    generatorFuelType: "diesel",
    level2Chargers: 0,
    dcfcChargers: 0,
    hpcChargers: 0,
    tiersStatus: "idle",
    tiers: null,
    selectedTierIndex: null, // No pre-selection - user must choose
    isBusy: false,
    busyLabel: "",
    error: null,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function emptyIntel(): LocationIntel {
  return {
    utilityRate: 0,
    demandCharge: 0,
    utilityProvider: "",
    hasTOU: false,
    peakRate: undefined,
    solarGrade: "C",
    solarFeasible: false,
    peakSunHours: 0,
    weatherRisk: "",
    weatherProfile: "",
    avgTempF: 0,
  };
}

function resetEnergyProfileState(): Pick<
  WizardState,
  | "step3Answers"
  | "evChargers"
  | "baseLoadKW"
  | "peakLoadKW"
  | "criticalLoadKW"
  | "evRevenuePerYear"
  | "solarKW"
  | "generatorKW"
  | "generatorFuelType"
  | "level2Chargers"
  | "dcfcChargers"
  | "hpcChargers"
  | "tiersStatus"
  | "tiers"
  | "selectedTierIndex"
> {
  return {
    step3Answers: {},
    evChargers: null,
    baseLoadKW: 0,
    peakLoadKW: 0,
    criticalLoadKW: 0,
    evRevenuePerYear: 0,
    solarKW: 0,
    generatorKW: 0,
    generatorFuelType: "diesel",
    level2Chargers: 0,
    dcfcChargers: 0,
    hpcChargers: 0,
    tiersStatus: "idle",
    tiers: null,
    selectedTierIndex: null,
  };
}

export function reducer(state: WizardState, intent: WizardIntent): WizardState {
  switch (intent.type) {
    // ── Step 1 ───────────────────────────────────────────────────────────

    case "SET_LOCATION_RAW":
      return { ...state, locationRaw: intent.value };

    case "SET_LOCATION":
      return {
        ...state,
        location: intent.location,
        locationStatus: "ready",
      };

    case "SET_LOCATION_STATUS":
      return { ...state, locationStatus: intent.status };

    case "CLEAR_LOCATION":
      return {
        ...state,
        locationRaw: "",
        location: null,
        locationStatus: "idle",
        business: null,
        intel: null,
        intelStatus: { utility: "idle", solar: "idle", weather: "idle" },
        gridReliability: null,
        error: null,
      };

    case "SET_GRID_RELIABILITY": {
      // Auto-enable generator if grid is unreliable or has frequent outages
      const autoEnableGenerator =
        intent.reliability === "unreliable" || intent.reliability === "frequent-outages";
      return {
        ...state,
        gridReliability: intent.reliability,
        wantsGenerator: autoEnableGenerator || state.wantsGenerator, // Enable if unreliable, preserve manual selection
      };
    }

    case "SET_BUSINESS":
      return { ...state, business: intent.business };

    case "SET_BUSINESS_ADDRESS":
      return {
        ...state,
        business: state.business ? { ...state.business, address: intent.address } : null,
      };

    case "CONFIRM_BUSINESS": {
      // Auto-skip to Step 3 if industry detected with confidence >= 0.75
      const hasIndustry =
        state.business?.detectedIndustry && (state.business?.confidence ?? 0) >= 0.75;
      const nextStep = hasIndustry ? 3 : 2;

      // Skip to Step 3 (questionnaire) if industry detected, else Step 2 (industry selection)
      return {
        ...state,
        ...(hasIndustry ? resetEnergyProfileState() : {}),
        step: nextStep as WizardStep,
        industry: hasIndustry ? (state.business?.detectedIndustry ?? null) : state.industry,
      };
    }

    case "PATCH_INTEL": {
      const { utilityStatus, solarStatus, weatherStatus, ...intelFields } = intent.patch;
      const newIntelStatus = {
        utility: utilityStatus ?? state.intelStatus.utility,
        solar: solarStatus ?? state.intelStatus.solar,
        weather: weatherStatus ?? state.intelStatus.weather,
      };
      // Merge into existing intel (or create empty baseline)
      const base = state.intel ?? emptyIntel();
      const newIntel: LocationIntel = { ...base, ...intelFields };
      // Derive solarFeasible whenever solarGrade changes
      if (intelFields.solarGrade !== undefined) {
        newIntel.solarFeasible = isSolarFeasible(intelFields.solarGrade as SolarGrade);
      }
      return { ...state, intel: newIntel, intelStatus: newIntelStatus };
    }

    // ── Step 2 ───────────────────────────────────────────────────────────

    case "SET_INDUSTRY":
      return {
        ...state,
        ...resetEnergyProfileState(),
        industry: intent.slug,
      };

    case "SET_INDUSTRY_META":
      return {
        ...state,
        solarPhysicalCapKW: intent.solarPhysicalCapKW,
        criticalLoadPct: intent.criticalLoadPct,
      };

    // ── Step 3 ───────────────────────────────────────────────────────────

    case "SET_ANSWER":
      return {
        ...state,
        step3Answers: { ...state.step3Answers, [intent.key]: intent.value },
      };

    case "SET_EV_CHARGERS":
      return { ...state, evChargers: intent.chargers };

    case "SET_ADDON_PREFERENCE":
      return {
        ...state,
        wantsSolar: intent.addon === "solar" ? intent.value : state.wantsSolar,
        wantsEVCharging: intent.addon === "ev" ? intent.value : state.wantsEVCharging,
        wantsGenerator: intent.addon === "generator" ? intent.value : state.wantsGenerator,
      };

    case "SET_ADDON_CONFIG":
      return {
        ...state,
        ...intent.config,
      };

    case "SET_BASE_LOAD":
      return {
        ...state,
        baseLoadKW: intent.baseLoadKW,
        peakLoadKW: intent.peakLoadKW,
        criticalLoadKW: intent.criticalLoadKW ?? state.peakLoadKW, // Default to full load if no critical load
        evRevenuePerYear: intent.evRevenuePerYear ?? state.evRevenuePerYear,
      };

    // ── Step 4: MagicFit ─────────────────────────────────────────────────

    case "SET_TIERS_STATUS":
      return { ...state, tiersStatus: intent.status };

    case "SET_TIERS":
      // Auto-select the middle "Recommended" tier (index 1) when tiers first become
      // ready. User can still change it — this just ensures Step 5 is never blank.
      return {
        ...state,
        tiers: intent.tiers,
        tiersStatus: "ready",
        selectedTierIndex: state.selectedTierIndex ?? 1,
      };

    // ── Step 5 ───────────────────────────────────────────────────────────

    case "SELECT_TIER":
      return { ...state, selectedTierIndex: intent.index };

    // ── Navigation ───────────────────────────────────────────────────────

    case "GO_TO_STEP":
      return { ...state, step: intent.step, error: null };

    case "GO_BACK": {
      const _has35 = hasStep35Addons(
        state.wantsSolar,
        state.wantsEVCharging,
        state.wantsGenerator,
        state.step3Answers,
        state.intel?.solarFeasible ?? false,
        state.solarPhysicalCapKW
      );
      // Step 4 = Add-ons (Step3_5V8). Going back from Add-ons always returns to
      // Profile (step 3). Step 3.5 is kept as a fallback identity for safety but
      // should never be the active step — WizardV8Page has no renderer for it.
      const prev: WizardStep =
        state.step === 6
          ? 5
          : state.step === 5
            ? 4
            : state.step === 4
              ? 3 // Add-ons → Profile (not 3.5 — no renderer)
              : state.step === 3.5
                ? 3 // safety: 3.5 → Profile
                : state.step === 3
                  ? 2
                  : state.step === 2
                    ? 1
                    : state.step === 1
                      ? 0
                      : 0;
      return { ...state, step: prev };
    }

    // ── System ───────────────────────────────────────────────────────────

    case "SET_BUSY":
      return { ...state, isBusy: intent.isBusy, busyLabel: intent.label ?? "" };

    case "SET_ERROR":
      return {
        ...state,
        error: { code: intent.code, message: intent.message },
        isBusy: false,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "RESET":
      return initialState();

    default:
      return state;
  }
}

// ── Action types (shared with all step components) ───────────────────────────
// Defined here (not in useWizardV8.ts) so steps can import from wizardState
// without creating a circular dependency through the hook.

export interface WizardActions {
  // Step 1
  setLocationRaw: (value: string) => void;
  submitLocation: (countryCode?: string) => Promise<void>;
  clearLocation: () => void;
  setGridReliability: (
    reliability: "reliable" | "occasional-outages" | "frequent-outages" | "unreliable"
  ) => void;
  setBusiness: (
    name: string,
    placesData?: {
      address?: string;
      website?: string;
      description?: string;
      photoAttributionName?: string;
      photoAttributionUri?: string;
      placeId?: string;
      formattedAddress?: string;
      photoUrl?: string;
      lat?: number;
      lng?: number;
    }
  ) => void;
  setBusinessAddress: (address: string) => void;
  confirmBusiness: () => void;
  // Step 2
  setIndustry: (slug: IndustrySlug) => void;
  // Step 3
  setAnswer: (key: string, value: unknown) => void;
  setAddonPreference: (addon: "solar" | "ev" | "generator", value: boolean) => void;
  setAddonConfig: (
    config: Partial<{
      solarKW: number;
      generatorKW: number;
      generatorFuelType: "diesel" | "natural-gas" | "dual-fuel";
      level2Chargers: number;
      dcfcChargers: number;
      hpcChargers: number;
    }>
  ) => void;
  setEVChargers: (chargers: WizardState["evChargers"]) => void;
  setBaseLoad: (baseLoadKW: number, peakLoadKW: number, evRevenuePerYear?: number) => void;
  // Step 4: MagicFit
  setTiers: (tiers: [QuoteTier, QuoteTier, QuoteTier]) => void;
  setTiersStatus: (status: WizardState["tiersStatus"]) => void;
  selectTier: (index: 0 | 1 | 2) => void;
  // Navigation
  goToStep: (step: WizardStep) => void;
  goBack: () => void;
  reset: () => void;
  // System
  clearError: () => void;
}

// ── UX Policy (contract for Step UI authors) ─────────────────────────────────
//
// "Teach Through Revelation" doctrine:
// Each step teaches by showing REAL DATA specific to this user's facility.
// Never use bullet lists, instructions, or explainer copy on a step.
// The data IS the instruction.
//
// maxCopyBlocks = max number of non-data text passages per step.
// revealTrigger = what causes the step's primary content to appear.
// advisorVoice  = one sentence from Merlin — references real data, not generic.

export const UX_POLICY = {
  step1: {
    headline: "Where is your facility?",
    subheadline: null,
    maxCopyBlocks: 0,
    revealTrigger: "validZip", // show intel cards on 5-digit ZIP
    progressiveReveal: ["utility", "solar", "weather"] as const,
    advisorVoice: null, // no advisor on step 1 — cards speak for themselves
    continueLabel: "Confirm Location →",
  },
  step2: {
    headline: "What type of facility?",
    subheadline: null,
    maxCopyBlocks: 0,
    revealTrigger: "pageLoad", // cards show immediately
    advisorVoice: "{industry} facilities in {state} typically need {typicalBESS}.",
    continueLabel: "Continue →",
  },
  step3: {
    headline: "Tell us about your operation",
    subheadline: null,
    maxCopyBlocks: 0,
    revealTrigger: "firstAnswer", // live power gauge activates on first answer
    advisorVoice: "Your estimated peak: {peakLoadKW} kW",
    questionHelper: "One-line tooltip per question (why we ask).",
    continueLabel: "Build my quote →",
  },
  step4: {
    headline: "What's your energy priority?",
    subheadline: "We've pre-built three outcomes from your profile.",
    maxCopyBlocks: 1, // subheadline counts as 1
    revealTrigger: "pageLoad",
    advisorVoice:
      "For a {industry} in {city}, {state} with {solarGrade} solar, we recommend Save Most.",
    continueLabel: null, // goal card tap IS the continue
  },
  step5: {
    headline: null, // tier cards ARE the headline
    subheadline: null,
    maxCopyBlocks: 0,
    revealTrigger: "immediate", // tiers are pre-built, render on mount
    advisorVoice:
      "Based on your profile, the Recommended tier fits {percentOfFacilities}% of {industry} facilities.",
    continueLabel: "This is my quote →",
  },
  step6: {
    headline: "Your TrueQuote™",
    subheadline: "Every number is traceable to an authoritative source.",
    maxCopyBlocks: 1,
    revealTrigger: "immediate",
    advisorVoice: null,
    continueLabel: null,
  },
} as const;
