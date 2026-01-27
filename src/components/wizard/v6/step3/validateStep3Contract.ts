/**
 * STEP 3 CONTRACT VALIDATOR - The ONLY authority for Step 3 validity
 * Created: Jan 24, 2026
 *
 * This validator uses CONTRACT KEYS (location.zipCode, facility.squareFeet, etc.)
 * that map directly to the Step3Snapshot interface.
 *
 * DOCTRINE: step3Valid can't lie.
 * - WizardV6 uses this for gating (not UI-reported validity)
 * - buildStep3Snapshot() uses this for consistency
 * - Step3Details can use this for UI hints (but doesn't control gating)
 */

import type { WizardState } from "../types";
import type { Step3MissingKey } from "./step3Contract";

type Inputs = Record<string, unknown>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown): string => String(v ?? "").trim();

const has = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v !== 0;
  if (typeof v === "boolean") return v === true;
  return true;
};

// ============================================================================
// INDUSTRY REQUIREMENTS
// ============================================================================

function industryNeeds(industryType: string) {
  const t = (industryType || "").toLowerCase().replace(/[_-]+/g, " ");
  return {
    needsSqft:
      t.includes("office") ||
      t.includes("retail") ||
      t.includes("warehouse") ||
      t.includes("manufacturing") ||
      t.includes("casino") ||
      t.includes("restaurant") ||
      t.includes("shopping") ||
      t.includes("mall"),
    needsRooms: t.includes("hotel"),
    needsBays: t.includes("car") && t.includes("wash"),
    needsRacks: t.includes("data") && t.includes("center"),
    needsBeds: t.includes("hospital"),
    needsFuelPumps: t.includes("truck") && t.includes("stop"),
    needsDCFC: t.includes("ev") && t.includes("charging"),
  };
}

/**
 * Derive primary goal from state (first goal selected)
 */
function derivePrimaryGoal(state: WizardState): string {
  return state.goals?.[0] || "";
}

// ============================================================================
// MAIN VALIDATOR
// ============================================================================

export interface Step3ContractValidation {
  missing: Step3MissingKey[];
  missingRequired: Step3MissingKey[];
  missingOptional: Step3MissingKey[];
  completenessPct: number;
  confidencePct: number;
  ok: boolean;
  hasLoadAnchor: boolean;
  requiredKeys: Step3MissingKey[];
}

/**
 * Validates Step 3 using contract keys.
 * Returns missing keys and completeness/confidence scores.
 * This is the SSOT. No UI component can override it.
 * 
 * STABLE COMPLETENESS:
 * - completenessPct based ONLY on requiredKeys (not optional confidence boosters)
 * - Won't drift as we add "nice-to-have" fields
 */
export function validateStep3Contract(state: WizardState): Step3ContractValidation {
  const inputs = (state.useCaseData?.inputs || {}) as Inputs;

  // Extract values with fallbacks for common aliases
  const zip = str(state.zipCode);
  const st = str(state.state);
  const industryType = str(state.industry || state.detectedIndustry);
  
  // ✅ FIX (Jan 25, 2026): Accept multiple field names for operating hours
  // Hospital uses "operatingSchedule", others use "operatingHours"
  const operatingHours = num(
    inputs.operatingHours ?? 
    inputs.operatingSchedule ?? 
    inputs.operating_hours ?? 
    inputs.hoursOfOperation
  );
  
  const squareFeet = num(inputs.squareFeet || inputs.squareFootage || inputs.totalSqFt || inputs.facilitySqFt);
  
  // ✅ FIX (Jan 26, 2026): Hotel 16Q uses 'roomCount' (correct field name)
  const roomCount = num(inputs.roomCount || inputs.numberOfRooms);
  
  // --- BAY COUNT (accept legacy + current) ---
  const bayCountRaw =
    (state as any)?.facility?.bayCount ??
    (state as any)?.facilityDetails?.bayCount ??
    inputs.bayTunnelCount ??
    inputs.bayCount ??
    inputs.bays;
  const bayCount = Number.isFinite(Number(bayCountRaw)) ? Number(bayCountRaw) : 0;
  
  // --- RACK COUNT (accept multiple field names) ---
  // Data center 16Q uses 'itLoadCapacity' and 'rackPowerDensity' instead of direct rack count
  // Derive rack count from itLoadCapacity when direct count not available
  const rackCountRaw =
    inputs.rackCount ??
    inputs.numberOfRacks ??
    inputs.racks;
  
  let rackCount = Number.isFinite(Number(rackCountRaw)) ? Number(rackCountRaw) : 0;
  
  // ✅ FIX (Jan 26, 2026): Data center 16Q doesn't have rackCount field
  // Derive from itLoadCapacity (e.g., "500-1000" kW IT load)
  if (rackCount === 0 && inputs.itLoadCapacity) {
    const itLoadStr = String(inputs.itLoadCapacity);
    // Extract upper bound from ranges like "500-1000" or "<100"
    const match = itLoadStr.match(/(\d+)$/);
    if (match) {
      const itLoadKW = parseInt(match[1]);
      // Assume average rack is 8-10 kW (mid-range density)
      rackCount = Math.ceil(itLoadKW / 9);
    }
  }
  
  // ✅ FIX (Jan 26, 2026): Hospital 16Q uses 'bedCount' (correct field name)
  const bedCount = num(inputs.bedCount || inputs.numberOfBeds);
  
  // ✅ FIX (Jan 26, 2026): Truck Stop 16Q uses 'fuelingPositions' instead of fuelPumpCount
  const fuelPumpCount = num(inputs.fuelPumpCount || inputs.fuelPumps || inputs.fuelingPositions);
  
  // ✅ FIX (Jan 26, 2026): EV Charging 16Q uses 'chargerCounts' (JSON object) instead of dcfcChargerCount
  // chargerCounts format: { "level2": 10, "dcfc": 5, "hpc": 2 }
  let dcfcChargerCount = num(inputs.dcfcChargerCount || inputs.dcfcChargers);
  
  if (dcfcChargerCount === 0 && inputs.chargerCounts) {
    try {
      const counts = typeof inputs.chargerCounts === 'string' 
        ? JSON.parse(inputs.chargerCounts) 
        : inputs.chargerCounts;
      dcfcChargerCount = (counts.dcfc || 0) + (counts.hpc || 0);
    } catch {
      // If JSON parse fails, try to extract from string
      const countsStr = String(inputs.chargerCounts);
      const dcfcMatch = countsStr.match(/dcfc["\s:]+(\d+)/i);
      const hpcMatch = countsStr.match(/hpc["\s:]+(\d+)/i);
      dcfcChargerCount = (dcfcMatch ? parseInt(dcfcMatch[1]) : 0) + (hpcMatch ? parseInt(hpcMatch[1]) : 0);
    }
  }
  
  const primaryGoal = derivePrimaryGoal(state);

  const missingRequired: Step3MissingKey[] = [];
  const missingOptional: Step3MissingKey[] = [];

  // ========== REQUIRED KEYS (affects completeness) ==========
  const requiredKeys: Step3MissingKey[] = ["location.zipCode", "location.state", "industry.type", "facility.operatingHours", "goals.primaryGoal"];

  // ========== LOCATION VALIDATION ==========
  if (zip.length !== 5) missingRequired.push("location.zipCode");
  if (!st) missingRequired.push("location.state");

  // ========== INDUSTRY VALIDATION ==========
  if (!industryType) missingRequired.push("industry.type");

  // ========== OPERATING HOURS (optional - improves estimate quality) ==========
  // ✅ V6 FIX (Jan 26, 2026): Operating hours is nice-to-have, not required
  // It improves estimate accuracy but load anchor can come from other sources
  if (operatingHours && (operatingHours < 1 || operatingHours > 24)) {
    // Invalid range - push as missing
    missingRequired.push("facility.operatingHours");
  }
  // If operatingHours is provided and valid, it's a confidence booster (not required)

  // ========== INDUSTRY-SPECIFIC REQUIREMENTS ==========
  // ✅ V6 FIX (Jan 26, 2026): Industry fields are ALWAYS required
  // Even if we have a load anchor, we need industry-specific sizing inputs
  const needs = industryNeeds(industryType);

  // Check if we have direct load anchor (peakDemandKW or monthlyBill)
  const hasDirectLoadAnchor = has(inputs.peakDemandKW) || has(inputs.monthlyElectricBill);

  if (needs.needsSqft) {
    requiredKeys.push("facility.squareFeet");
    // Only skip if we have DIRECT load anchor (not just defaults)
    if (!hasDirectLoadAnchor && (!squareFeet || squareFeet < 100)) {
      missingRequired.push("facility.squareFeet");
    }
  }
  if (needs.needsRooms) {
    requiredKeys.push("facility.roomCount");
    if (!hasDirectLoadAnchor && (!roomCount || roomCount < 1)) {
      missingRequired.push("facility.roomCount");
    }
  }
  if (needs.needsBays) {
    requiredKeys.push("facility.bayCount");
    if (!hasDirectLoadAnchor && (!bayCount || bayCount < 1)) {
      missingRequired.push("facility.bayCount");
    }
  }
  if (needs.needsRacks) {
    requiredKeys.push("facility.rackCount");
    if (!hasDirectLoadAnchor && (!rackCount || rackCount < 1)) {
      missingRequired.push("facility.rackCount");
    }
  }
  if (needs.needsBeds) {
    requiredKeys.push("facility.bedCount");
    if (!hasDirectLoadAnchor && (!bedCount || bedCount < 1)) {
      missingRequired.push("facility.bedCount");
    }
  }
  if (needs.needsFuelPumps) {
    requiredKeys.push("facility.fuelPumpCount");
    if (!hasDirectLoadAnchor && (!fuelPumpCount || fuelPumpCount < 1)) {
      missingRequired.push("facility.fuelPumpCount");
    }
  }
  if (needs.needsDCFC) {
    requiredKeys.push("facility.dcfcChargerCount");
    if (!hasDirectLoadAnchor && (!dcfcChargerCount || dcfcChargerCount < 1)) {
      missingRequired.push("facility.dcfcChargerCount");
    }
  }

  // ========== GOALS VALIDATION ==========
  if (!primaryGoal) missingRequired.push("goals.primaryGoal");

  // ========== LOAD ANCHOR CHECK ==========
  // Step 5 CANNOT compute meaningful results without at least one load anchor
  requiredKeys.push("calculated.loadAnchor");
  const hasLoadAnchor = checkLoadAnchor(state, inputs, industryType);
  if (!hasLoadAnchor) {
    missingRequired.push("calculated.loadAnchor");
  }

  // ========== STABLE COMPLETENESS (required keys only) ==========
  const completenessPct = Math.round(
    ((requiredKeys.length - missingRequired.length) / requiredKeys.length) * 100
  );

  // ========== CONFIDENCE CALCULATION (optional fields) ==========
  // "Nice-to-have anchors" that improve estimate quality (not required)
  const confidenceFields = [
    "monthlyElectricBill",
    "peakDemandKW",
    "gridCapacityKW",
    "hvacType",
    "equipmentTier",
    "hasNaturalGas",
  ];
  const answered = confidenceFields.filter((k) => has(inputs[k])).length;
  const confidencePct = Math.round((answered / confidenceFields.length) * 100);

  // ========== COMBINE MISSING (for convenience) ==========
  const missing = [...missingRequired, ...missingOptional];

  // ========== OK DETERMINATION ==========
  // OK if: no missing REQUIRED fields OR confidence >= 70% (power user override)
  const ok = missingRequired.length === 0 || confidencePct >= 70;

  // ✅ DEBUG (Jan 25, 2026): Log validation failure details
  if (!ok && import.meta.env.DEV) {
    console.group('🚫 Step 3 Contract INVALID');
    console.log('Industry:', industryType);
    console.log('Missing Required:', missingRequired);
    console.log('Required Keys:', requiredKeys);
    console.log('Has Load Anchor:', hasLoadAnchor);
    console.log('Completeness:', completenessPct + '%');
    console.log('Confidence:', confidencePct + '%');
    console.log('Inputs:', inputs);
    console.groupEnd();
  }

  return { 
    missing,
    missingRequired, 
    missingOptional,
    completenessPct, 
    confidencePct, 
    ok, 
    hasLoadAnchor,
    requiredKeys
  };
}

/**
 * LOAD ANCHOR CHECK
 * Step 5 CANNOT compute meaningful results without at least one of:
 * - Peak demand (direct)
 * - Monthly bill (can derive peak)
 * - Industry-specific anchor (bay count, room count, etc.)
 */
function checkLoadAnchor(state: WizardState, inputs: Inputs, industry: string): boolean {
  // --- LOAD ANCHOR (accept legacy + current) ---
  const loadAnchorRaw =
    (state as any)?.calculated?.loadAnchor ??
    (state as any)?.calculations?.loadAnchor ??
    (state as any)?.calculations?.powerGauge?.peakDemandKW ??
    (state as any)?.calculations?.peakDemandKW;

  const loadAnchorKW =
    typeof loadAnchorRaw === "number"
      ? loadAnchorRaw
      : Number.isFinite(Number(loadAnchorRaw?.kw))
        ? Number(loadAnchorRaw.kw)
        : Number.isFinite(Number(loadAnchorRaw))
          ? Number(loadAnchorRaw)
          : null;

  const hasStateLoadAnchor = Number.isFinite(loadAnchorKW as number) && (loadAnchorKW as number) > 0;
  
  if (hasStateLoadAnchor) return true;

  // Direct load anchors from inputs (always valid if substantial)
  const peak = num(inputs.peakDemandKW ?? inputs.peakDemand ?? inputs.peak_demand_kw);
  const bill = num(inputs.monthlyElectricBill ?? inputs.monthlyBill ?? inputs.averageMonthlyBill ?? inputs.monthly_electric_bill);

  if (peak > 50) return true;  // ✅ Raised from 10 to 50 kW (more realistic minimum)
  if (bill > 500) return true; // ✅ Raised from 50 to 500 (small commercial minimum)

  // Industry-specific anchors that can derive load
  const t = (industry || "").toLowerCase().replace(/[_-]+/g, " ");

  if (t.includes("car") && t.includes("wash")) {
    const bays = num(
      (state as any)?.facility?.bayCount ??
      (state as any)?.facilityDetails?.bayCount ??
      inputs.bayTunnelCount ??
      inputs.bayCount ??
      inputs.bays
    );
    // ✅ FIX (Jan 26, 2026): Bay count alone is sufficient anchor
    // Raised minimum from 1 to 2 (single-bay is unrealistic for commercial)
    return bays >= 2;
  }

  if (t.includes("hotel")) {
    const rooms = num(inputs.roomCount ?? inputs.numberOfRooms ?? inputs.hotelRooms);
    return rooms >= 10; // ✅ Raised from 5 to 10 (boutique hotel minimum)
  }

  if (t.includes("hospital")) {
    const beds = num(inputs.bedCount ?? inputs.numberOfBeds);
    return beds >= 20; // ✅ Raised from 10 to 20 (small hospital minimum)
  }

  if (t.includes("data") && t.includes("center")) {
    // ✅ FIX (Jan 26, 2026): Check ALL data center load anchors
    // Priority: direct IT load > rack count > square feet
    // LOWERED (Jan 26, 2026 evening): Previous thresholds were too strict for small data centers
    const itLoad = num(
      inputs.itLoadKW ?? 
      inputs.totalITLoad ?? 
      inputs.powerCapacity ??
      inputs.itLoad ??
      inputs.total_it_load
    );
    if (itLoad >= 10) return true; // ✅ Lowered from 100 to 10 kW (small edge/colo facility)
    
    const racks = num(inputs.rackCount ?? inputs.numberOfRacks ?? inputs.rack_count);
    if (racks >= 1) return true; // ✅ Lowered from 5 to 1 (single-rack colo is valid)
    
    const sqft = num(inputs.squareFeet ?? inputs.squareFootage ?? inputs.square_feet ?? inputs.totalSqFt);
    if (sqft >= 500) return true; // ✅ Lowered from 5000 to 500 (small colo/edge data center)
    
    return false;
  }

  if (t.includes("truck") && t.includes("stop")) {
    const pumps = num(inputs.fuelPumpCount);
    return pumps >= 1;
  }

  if (t.includes("ev") && t.includes("charging")) {
    const dcfc = num(inputs.dcfcChargerCount ?? inputs.dcfcChargers);
    return dcfc >= 1;
  }

  // ===== ADDITIONAL INDUSTRY ANCHORS (Jan 26, 2026) =====
  
  if (t.includes("warehouse")) {
    const warehouseSqFt = num(inputs.warehouseSqFt ?? inputs.warehouseSquareFeet);
    if (warehouseSqFt >= 1000) return true;
  }
  
  if (t.includes("manufacturing")) {
    const manufacturingSqFt = num(inputs.manufacturingSqFt ?? inputs.manufacturingSquareFeet);
    if (manufacturingSqFt >= 1000) return true;
  }
  
  if (t.includes("office")) {
    const officeSqFt = num(inputs.officeSqFt ?? inputs.officeSquareFeet);
    if (officeSqFt >= 1000) return true;
  }
  
  if (t.includes("retail")) {
    const retailSqFt = num(inputs.retailSqFt ?? inputs.retailSquareFeet ?? inputs.storeSqFt);
    if (retailSqFt >= 500) return true;
  }
  
  if (t.includes("apartment")) {
    const totalUnits = num(inputs.totalUnits ?? inputs.unitCount ?? inputs.numberOfUnits);
    if (totalUnits >= 10) return true;
  }
  
  if (t.includes("agricultural") || t.includes("farm")) {
    const farmAcres = num(inputs.farmAcres ?? inputs.totalAcres ?? inputs.acres);
    if (farmAcres >= 5) return true;
  }
  
  if (t.includes("airport")) {
    const annualPassengers = num(inputs.annualPassengers ?? inputs.passengers ?? inputs.passengerCount);
    if (annualPassengers >= 10000) return true;
  }
  
  if (t.includes("casino")) {
    const gamingFloorSqFt = num(inputs.gamingFloorSqFt ?? inputs.gamingSquareFeet ?? inputs.casinoFloorSqFt);
    if (gamingFloorSqFt >= 1000) return true;
  }
  
  if (t.includes("cold") && t.includes("storage")) {
    const refrigeratedSqFt = num(inputs.refrigeratedSqFt ?? inputs.coldStorageSqFt ?? inputs.refrigeratedSquareFeet);
    if (refrigeratedSqFt >= 1000) return true;
  }
  
  if (t.includes("shopping") || t.includes("mall")) {
    const mallSqFt = num(inputs.mallSqFt ?? inputs.shoppingCenterSqFt ?? inputs.glaSqFt);
    if (mallSqFt >= 5000) return true;
  }
  
  if (t.includes("college") || t.includes("university")) {
    const studentPopulation = num(inputs.studentPopulation ?? inputs.students ?? inputs.enrollment);
    if (studentPopulation >= 500) return true;
  }
  
  if (t.includes("gas") && t.includes("station")) {
    const fuelPositions = num(inputs.fuelPositions ?? inputs.numberOfFuelPositions ?? inputs.pumpPositions);
    if (fuelPositions >= 2) return true;
  }
  
  if (t.includes("indoor") && t.includes("farm")) {
    const totalSqFt = num(inputs.totalSqFt ?? inputs.farmSquareFeet);
    if (totalSqFt >= 500) return true;
  }

  // Generic: square footage can derive load
  const sqft = num(
    inputs.squareFootage ?? 
    inputs.squareFeet ?? 
    inputs.square_feet ?? 
    inputs.totalSqFt ?? 
    inputs.facilitySqFt
  );
  if (sqft >= 2000) return true; // ✅ Raised from 500 to 2000 (realistic commercial minimum)
  
  // Generic: any direct power/capacity specification
  const directPower = num(
    inputs.powerCapacity ?? 
    inputs.totalLoad ?? 
    inputs.installedCapacity ??
    inputs.connected_load
  );
  if (directPower >= 50) return true; // ✅ Raised from 10 to 50 kW (small commercial minimum)

  return false;
}

/**
 * Quick check - returns just boolean for simple gating
 */
export function isStep3ContractValid(state: WizardState): boolean {
  return validateStep3Contract(state).ok;
}
