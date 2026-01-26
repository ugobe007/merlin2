/**
 * BUILD STEP 3 SNAPSHOT - Creates the handoff object for Steps 4 & 5
 * Created: Jan 16, 2026
 * Updated: Jan 24, 2026 - Uses validateStep3Contract + adds deterministic peak estimate fallback
 *
 * This is the ONLY function that creates Step3Snapshot.
 * Steps 4 & 5 MUST use this snapshot, not raw wizardState.
 */

import type { WizardState } from "../types";
import type { Step3Snapshot } from "./step3Contract";
import { validateStep3Contract } from "./validateStep3Contract";

type Inputs = Record<string, unknown>;

// ============================================================================
// DEFENSIVE NUMBER PARSING
// ============================================================================

/**
 * Defensive number parser - strips $, commas, whitespace, units
 * Examples: "$4,200" → 4200, "16 hrs" → 16, "abc" → 0
 */
function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  
  // Strip: $, commas, whitespace, common units (kW, hrs, sqft, etc.)
  const cleaned = v
    .replace(/[$,\s]/g, "")
    .replace(/\b(kw|kva|hrs?|hours?|sqft|ft²|beds?|bays?|racks?)\b/gi, "")
    .trim();
  
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Clamp a number between min and max.
 * 
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value, or min if value is not finite
 * 
 * @example
 * clamp(0.02, 0.04, 0.60) → 0.04  // Too low
 * clamp(0.12, 0.04, 0.60) → 0.12  // Within range
 * clamp(0.75, 0.04, 0.60) → 0.60  // Too high
 * clamp(NaN, 0.04, 0.60) → 0.04   // Not finite
 */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// ============================================================================
// INDUSTRY TYPE NORMALIZATION
// ============================================================================

/**
 * Normalize industry type to prevent heuristic mismatches.
 * Maps synonyms and inconsistent formats to canonical slugs.
 */
function normalizeIndustry(raw: string): string {
  const t = (raw || "").toLowerCase().trim().replace(/[\s_-]+/g, "_");
  
  // Map synonyms to canonical forms
  const synonyms: Record<string, string> = {
    carwash: "car_wash",
    car_wash: "car_wash",
    datacenter: "data_center",
    data_center: "data_center",
    evcharging: "ev_charging",
    ev_charging: "ev_charging",
    truckstop: "truck_stop",
    truck_stop: "truck_stop",
  };
  
  return synonyms[t] || t;
}

/**
 * Multi-source industry type resolver.
 * Tries all possible locations where industry might be stored in WizardState.
 * Returns first non-empty string found, or empty string if none found.
 */
function readIndustryType(state: WizardState): string {
  const anyState = state as any;

  // Prefer explicit canonical fields (add as you discover them)
  const candidates: unknown[] = [
    // common patterns
    anyState.industryType,
    anyState.industrySlug,
    anyState.selectedIndustry,
    anyState.detectedIndustry,

    // if industry is an object
    anyState.industry?.type,
    anyState.industry?.slug,
    anyState.industry?.id,

    // if industry is a string
    typeof anyState.industry === "string" ? anyState.industry : "",

    // sometimes stored under useCase
    anyState.useCaseData?.slug,
    anyState.useCaseData?.useCaseSlug,
    anyState.useCaseData?.useCase?.slug,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

// ============================================================================
// PEAK DEMAND ESTIMATOR (Pure, Clamped, Unit-Safe)
// ============================================================================

/**
 * Get smart minimum peak kW floor based on tier and industry.
 * Prevents over-estimation of small sites while maintaining safety net.
 */
function getMinimumPeakKW(industryType: string, tier?: string): number {
  const industry = normalizeIndustry(industryType);
  
  // High-power industries have higher minimums
  if (industry.includes("car") && industry.includes("wash")) return 50;
  if (industry.includes("data") && industry.includes("center")) return 50;
  if (industry.includes("hospital")) return 100;
  if (industry.includes("manufacturing")) return 75;
  
  // Tier-aware minimums for general commercial
  if (tier === "small") return 10;
  if (tier === "medium") return 25;
  if (tier === "large") return 100;
  if (tier === "enterprise") return 500;
  
  // Conservative default for unknown
  return 25;
}

/**
 * Minimal peak estimator for Step 3 contract output.
 * 
 * INVARIANTS:
 * - Never returns 0, NaN, or Infinity
 * - Clamped to [tier/industry-aware minimum, 500000] kW
 * - Pure function (no side effects, no Step 5 dependency)
 * - Defensive parsing (handles "$4,200", "16 hrs", etc.)
 * 
 * Priority:
 * 1) User-provided peakDemandKW
 * 2) Bill-based estimate (clamped rates/hours/LF)
 * 3) Industry heuristic anchors (rooms/bays/racks/beds/sqft)
 * 4) Tier fallback (always returns valid number)
 */
function estimatePeakDemandKW(
  industryType: string,
  inputs: Inputs,
  tier?: string
): number {
  const MIN_PEAK = getMinimumPeakKW(industryType, tier);
  const MAX_PEAK = 500000; // kW (500 MW)
  
  // 1) Direct peak input
  const directPeak = toNum(inputs.peakDemandKW ?? inputs.peakDemand ?? inputs.peakDemandKw);
  if (directPeak > MIN_PEAK && directPeak < MAX_PEAK) {
    return Math.round(directPeak);
  }
  
  // 2) Bill-based estimate (with clamped parameters)
  const monthlyBill = toNum(inputs.monthlyElectricBill ?? inputs.averageMonthlyBill ?? inputs.monthlyBill);
  if (monthlyBill > 50) {
    const rate = clamp(toNum(inputs.electricityRate) || 0.12, 0.04, 0.60);
    const hoursPerMonth = clamp(730, 200, 744);
    const loadFactor = clamp(0.4, 0.15, 0.8);
    
    const billEst = Math.round(monthlyBill / rate / hoursPerMonth / loadFactor);
    if (billEst >= MIN_PEAK && billEst <= MAX_PEAK) {
      return billEst;
    }
  }
  
  // 3) Industry heuristics (normalized)
  const industry = normalizeIndustry(industryType);
  const rooms = toNum(inputs.roomCount ?? inputs.numberOfRooms);
  const bays = toNum(inputs.bayCount ?? inputs.bays);
  const racks = toNum(inputs.rackCount ?? inputs.numberOfRacks);
  const beds = toNum(inputs.bedCount ?? inputs.numberOfBeds);
  const sqft = toNum(inputs.squareFootage ?? inputs.squareFeet ?? inputs.totalSqFt ?? inputs.facilitySqFt);
  
  let heuristic = 0;
  
  if (industry.includes("hotel") && rooms > 0) {
    // 2.5 kW/room baseline (lighting, HVAC, outlets)
    heuristic = Math.max(MIN_PEAK, Math.round(rooms * 2.5));
  } else if (industry.includes("car") && industry.includes("wash") && bays > 0) {
    // Car wash type-specific power estimates
    const carWashType = String(inputs.carWashType || inputs.facilityType || "").toLowerCase();
    
    let kWPerBay = 50; // Default mid-range
    
    if (carWashType.includes("self") && carWashType.includes("serve")) {
      // Self-serve: Low power (pressure washers, coin ops)
      kWPerBay = 12;
    } else if (carWashType.includes("express") || carWashType.includes("tunnel")) {
      // Express tunnel: High power (conveyors, dryers, blowers, heaters)
      // Base load + per-bay increment
      const baseLoad = 150; // Tunnel equipment
      const bayIncrement = 30; // Additional per wash bay
      heuristic = Math.max(MIN_PEAK, Math.round(baseLoad + (bays * bayIncrement)));
    } else if (carWashType.includes("in") && carWashType.includes("bay")) {
      // In-bay automatic: Medium-high power (automated arms, dryers)
      kWPerBay = 40;
    } else if (carWashType.includes("auto") || carWashType.includes("full")) {
      // Generic automatic/full-service: Medium-high
      kWPerBay = 45;
    }
    
    // Apply per-bay estimate if not tunnel (tunnel handled above)
    if (heuristic === 0) {
      heuristic = Math.max(MIN_PEAK, Math.round(bays * kWPerBay));
    }
  } else if (industry.includes("data") && industry.includes("center") && racks > 0) {
    // 7 kW/rack baseline (IT load only, not cooling)
    heuristic = Math.max(MIN_PEAK, Math.round(racks * 7));
  } else if (industry.includes("hospital") && beds > 0) {
    // 8 kW/bed baseline (medical equipment, lighting, HVAC)
    heuristic = Math.max(MIN_PEAK, Math.round(beds * 8));
  } else if (industry.includes("truck") && industry.includes("stop")) {
    const pumps = toNum(inputs.fuelPumpCount);
    if (pumps > 0) {
      // 15 kW/pump + base facility load
      heuristic = Math.max(MIN_PEAK, Math.round(pumps * 15 + 100));
    }
  } else if (industry.includes("ev") && industry.includes("charging")) {
    const dcfc = toNum(inputs.dcfcChargerCount ?? inputs.dcfcChargers);
    if (dcfc > 0) {
      // 150 kW/DCFC (assuming simultaneous charging)
      heuristic = Math.max(MIN_PEAK, Math.round(dcfc * 150));
    }
  }
  
  if (heuristic >= MIN_PEAK && heuristic <= MAX_PEAK) {
    return heuristic;
  }
  
  // 3b) Generic square footage fallback
  if (sqft > 0) {
    // 12 W/sqft baseline for commercial (ASHRAE 90.1)
    const sqftEst = Math.max(MIN_PEAK, Math.round(sqft * 0.012));
    if (sqftEst <= MAX_PEAK) {
      return sqftEst;
    }
  }
  
  // 4) Tier fallback (always valid)
  const tierDefaults: Record<string, number> = {
    small: 100,
    medium: 500,
    large: 2000,
    enterprise: 10000
  };
  
  return tierDefaults[tier || "medium"] || 500;
}

export function buildStep3Snapshot(state: WizardState): Step3Snapshot {
  // ✅ SSOT: Use the canonical contract validator for missing/confidence
  const validation = validateStep3Contract(state);
  const { missing, completenessPct, confidencePct } = validation;

  const inputs = (state.useCaseData?.inputs || {}) as Inputs;

  // Extract location data
  const location = {
    zipCode: state.zipCode || "",
    state: state.state || "",
    city: state.city || "",
    electricityRate: state.electricityRate ?? state.calculations?.base?.utilityRate ?? 0.12,
  };

  // ✅ FIX (Jan 25, 2026): Multi-source industry resolver + safe fallback
  const rawIndustry = readIndustryType(state);
  const industryType = normalizeIndustry(rawIndustry);

  // If still empty, choose a safe non-empty sentinel (so downstream never bricks)
  const safeIndustryType = industryType || normalizeIndustry(state.detectedIndustry || "unknown");

  const industry = {
    type: safeIndustryType,
    name: state.industryName || safeIndustryType,
    tier: state.businessSizeTier,
  };

  // Keep validator missing list honest
  if (!industryType) {
    if (!missing.includes("industry.type")) missing.push("industry.type");
  }

  // Extract facility data (spread first, normalize second)
  const facility = {
    ...(inputs as Record<string, unknown>),
    operatingHours: toNum(inputs.operatingHours) || undefined,
    squareFeet: toNum(inputs.squareFootage ?? inputs.squareFeet ?? inputs.totalSqFt ?? inputs.facilitySqFt) || undefined,
    roomCount: toNum(inputs.roomCount) || undefined,
    bayCount: toNum(inputs.bayCount ?? inputs.bays) || undefined,
    rackCount: toNum(inputs.rackCount) || undefined,
    bedCount: toNum(inputs.bedCount) || undefined,
  };

  // Extract existing infrastructure (prefer Step 3 inputs if present; fallback to state custom overrides)
  const existingInfrastructure = {
    solarKW: toNum(inputs.existingSolarKW) || toNum(state.customSolarKw) || undefined,
    generatorKW: toNum(inputs.generatorCapacityKW) || toNum(state.customGeneratorKw) || undefined,
    evChargers: inputs.existingEVChargers ?? {
      L2: { count: state.customEvL2 || 0, powerKW: 7.2 },
      DCFC: { count: state.customEvDcfc || 0, powerKW: 150 },
    },
  };

  // Extract goals
  const goals = {
    primaryGoal: (state.goals || [])[0] || "",
    selectedOptions: state.selectedOptions || [],
    goals: state.goals || [],
  };

  // ✅ FIX: peak must exist even before Step 5 (pure estimator, no state.calculations dependency)
  const peakFromCalcs = toNum(state.calculations?.base?.peakDemandKW);
  const estimatedPeakKW = peakFromCalcs > 0 
    ? peakFromCalcs 
    : estimatePeakDemandKW(industryType, inputs, state.businessSizeTier);

  const baseBuildingLoadKW =
    toNum(state.calculations?.base?.baseBuildingLoadKW) > 0
      ? toNum(state.calculations?.base?.baseBuildingLoadKW)
      : Math.round(estimatedPeakKW * 0.7); // baseline proxy

  const operatingHours = toNum(inputs.operatingHours) || undefined;

  const loadProfile = {
    baseBuildingLoadKW,
    totalPeakDemandKW: estimatedPeakKW,
    operatingHours,
  };

  // Calculated values Step 4/5 can rely on
  const recommendedBatteryKW = Math.round(estimatedPeakKW * 0.4);
  const recommendedBatteryKWh = Math.round(recommendedBatteryKW * 4);

  const calculated = {
    baseBuildingLoadKW,
    totalPeakDemandKW: estimatedPeakKW,
    recommendedBatteryKW,
    recommendedBatteryKWh,
    recommendedBackupHours: 4,
    existingEVLoadKW: toNum(inputs.existingEVLoadKW) || undefined,
    newEVLoadKW: toNum(inputs.newEVLoadKW) || undefined,
    annualConsumptionKWh: state.calculations?.base?.annualConsumptionKWh,
  };

  const snapshot: Step3Snapshot = {
    location,
    industry,
    facility,
    existingInfrastructure,
    goals,
    useCaseData: (state.useCaseData || {}) as Record<string, unknown>,

    missing,
    completenessPct,
    confidencePct,

    loadProfile,
    calculated,
  };

  // ✅ DEV ASSERTIONS: Prove "cannot lie"
  if (process.env.NODE_ENV === "development") {
    const it = snapshot.industry.type?.trim() || "";
    if (!it || it === "unknown") {
      console.warn(
        "⚠️ Step3Snapshot: industry.type is empty or 'unknown' (",
        it,
        "). User may return from Step 2 or Step 2 failed to commit.",
        snapshot
      );
    }
    if (snapshot.loadProfile.totalPeakDemandKW <= 0) {
      console.error("❌ Step3Snapshot invariant violated: loadProfile.totalPeakDemandKW <= 0", snapshot);
    }
    if (snapshot.calculated.totalPeakDemandKW <= 0) {
      console.error("❌ Step3Snapshot invariant violated: calculated.totalPeakDemandKW <= 0", snapshot);
    }
    if (!Number.isFinite(snapshot.loadProfile.totalPeakDemandKW)) {
      console.error("❌ Step3Snapshot invariant violated: totalPeakDemandKW is not finite", snapshot);
    }
  }

  // ✅ PRODUCTION SAFETY: Soft fail with warnings (should never happen, but defense in depth)
  if (snapshot.loadProfile.totalPeakDemandKW <= 0 || !Number.isFinite(snapshot.loadProfile.totalPeakDemandKW)) {
    const fallbackPeak = getMinimumPeakKW(industryType, state.businessSizeTier);
    snapshot.loadProfile.totalPeakDemandKW = fallbackPeak;
    snapshot.calculated.totalPeakDemandKW = fallbackPeak;
    snapshot.calculated.recommendedBatteryKW = Math.round(fallbackPeak * 0.4);
    snapshot.calculated.recommendedBatteryKWh = Math.round(snapshot.calculated.recommendedBatteryKW * 4);
    snapshot.confidencePct = Math.min(snapshot.confidencePct, 40); // Cap confidence on fallback
    snapshot.warnings = [...(snapshot.warnings || []), "peak_fallback_applied"];
  }

  return snapshot;
}

// ✅ EXPORTED FOR TESTING: Lock behavior with unit tests
export { toNum, clamp, normalizeIndustry, getMinimumPeakKW, estimatePeakDemandKW };
