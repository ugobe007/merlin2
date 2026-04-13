/**
 * =============================================================================
 * ADDON SIZING HELPERS — shared between Step3_5V8 (display) and WizardV8Page
 * (commit-to-state on Continue)
 *
 * These functions mirror exactly what Step3_5V8 shows the user so that when
 * WizardV8Page calls setAddonConfig({ solarKW, generatorKW }) on Continue, the
 * values persisted to state match what was displayed.
 *
 * SSOT RULE: All numeric constants must trace to benchmarkSources.ts (IEEE/MDPI/NEC).
 * Never hardcode benchmark values here — always call the source function.
 * =============================================================================
 */

import type { WizardState } from "./wizardState";
import { getGeneratorReserveMarginWithSource } from "@/services/benchmarkSources";

// ── NOTE: Solar density constant ─────────────────────────────────────────────
// Physical density is 15 W/sqft × usableRoofPercent (SOLAR_WATTS_PER_SQFT in
// useCasePowerCalculations.ts). useWizardV8.ts applies this to roofArea and
// stores the result in state.solarPhysicalCapKW — that value is the SSOT cap.
// We do NOT re-derive it here; getEffectiveSolarCapKW() simply reads it.

export type SolarScopeId = "roof_only" | "roof_canopy" | "maximum";
export type GeneratorScopeId = "essential" | "full" | "critical";

/** Scope → solar penetration fraction */
export const SOLAR_SCOPE_PENETRATION: Record<SolarScopeId, number> = {
  roof_only: 0.55,
  roof_canopy: 0.8,
  maximum: 1.0,
};

/**
 * Effective solar cap (kW) for Step 3.5 display.
 *
 * Always reads from solarPhysicalCapKW — which is computed by useWizardV8's
 * reactive useEffect (per-industry, roofArea-aware, roofType-aware for car_wash).
 * The old approach of re-computing from roofArea * 0.75 / 100 here was wrong:
 *   - It ignored roofType (the whole reason we added Vineet's model)
 *   - It ignored car_wash's vacuum canopy + carport contributions
 *   - It used 0.75 for all industries, conflicting with industry-specific factors
 */
export function getEffectiveSolarCapKW(state: WizardState): number {
  return state.solarPhysicalCapKW;
}

/**
 * Estimated solar capacity (kW installed) for a given scope at this site.
 *
 * Formula: physicalCap × sunFactor × scopePenetration
 *   — matches step4Logic.computeSolarKW exactly so display = committed = auto-calc.
 *
 *   - physicalCap:      solarPhysicalCapKW — roof area × usable% × 15 W/sqft (NREL)
 *   - sunFactor:        clamp((PSH − 2.5) / 2.0, 0, 1), floor 0.40 for viable sites
 *                       →0% at PSH 2.5, 50% at PSH 3.5, 100% at PSH 4.5+
 *   - scopePenetration: roof_only=0.55, roof_canopy=0.80, maximum=1.00
 *
 * ⚠️  sunFactor here is an ECONOMIC SIZING decision (how much of the physical cap
 *     to actually install given local sun economics), NOT a production calculation.
 *     Annual kWh production uses the NREL Performance Ratio model:
 *       annualKWh = installedKW × PSH × 365 × 0.77 (PR)
 *     See addonGuardrails.computeSolarValueAnalysis() for the production side.
 *
 * NOTE: sunFactor scales the DEPLOYED fraction of the physical cap. A site with
 * poor sun deploys a smaller fraction because economics won’t justify full buildout.
 * Returns 0 if cap ≤ 0 (no feasible roof) or PSH < 2.5 (unviable).
 * For PSH 2.5–4.5: sunFactor ramps 0→1; floor at 0.40 prevents near-zero
 * recommendations for borderline sites (Michigan, Pacific NW, etc.).
 */
export function estimateSolarKW(scope: SolarScopeId, state: WizardState): number {
  const cap = getEffectiveSolarCapKW(state);
  if (cap <= 0) return 0;
  const psh = state.intel?.peakSunHours ?? 4.5;
  if (psh < 2.5) return 0; // Truly unviable (Alaska winter avg)
  // Linear ramp 2.5→4.5 PSH → 0%→100%; floor at 40% for any viable site.
  // This prevents the old formula from crushing the recommendation to 1 kW
  // for moderate-sun states like Michigan (PSH ~4.0 GHI, ~3.1 system AC).
  const sunFactor = Math.max(0.4, Math.min(1.0, (psh - 2.5) / 2.0));
  const pen = SOLAR_SCOPE_PENETRATION[scope] ?? 0.8;
  // Matches step4Logic.computeSolarKW (both updated together).
  return Math.round(Math.min(cap * sunFactor * pen, cap));
}

/**
 * Estimated generator capacity (kW) for a given scope.
 *
 * essential: critical loads only — criticalLoadPct × peakLoadKW × NEC reserve margin
 * full:      entire facility + 10% headroom
 * critical:  full load + 35% headroom (data center / mission critical)
 *
 * SSOT: reserve margin comes from getGeneratorReserveMarginWithSource() in
 * benchmarkSources.ts (currently 1.25 — NEC 700/701/702 + IEEE 446).
 */
export function estimateGenKW(scope: GeneratorScopeId, state: WizardState): number {
  const { peakLoadKW, criticalLoadPct } = state;
  if (peakLoadKW <= 0) return 0;
  // Pull NEC reserve margin from SSOT — do not hardcode
  const { margin } = getGeneratorReserveMarginWithSource();
  if (scope === "essential") return Math.max(10, Math.round(peakLoadKW * criticalLoadPct * margin));
  if (scope === "critical") return Math.max(10, Math.round(peakLoadKW * 1.35));
  // "full" (default) — full facility + 10% headroom
  return Math.max(10, Math.round(peakLoadKW * 1.1));
}

/**
 * Industries that require a generator as part of the baseline system design —
 * not merely as an optional resilience add-on. The quote engine auto-includes
 * it in Step 3.5 and the ROI guardrail never strips it.
 *
 * GROUP 1 — Life-safety & code mandate
 *   hospital      — NEC 517 / NFPA 99: life-safety systems mandatory
 *   data_center   — Tier III/IV uptime standards: 100% IT load continuity
 *   airport       — FAA / TSA: critical operations + safety systems
 *   manufacturing — IEEE 446 Orange Book: process continuity & safety interlocks
 *
 * GROUP 2 — Heavy 24/7 continuous process load (operational necessity)
 *   truck_stop    — Loves/Pilot/Flying J: truck wash bays + DCFC banks + DEF
 *                   pumps all run 24/7; grid blip = revenue loss + safety risk
 *   cold_storage  — refrigeration compressors cannot tolerate interruption;
 *                   inventory loss from a single outage dwarfs generator cost
 *   logistics     — automated sortation, conveyor systems, freezer zones;
 *                   downtime is quantified per-minute in SLA contracts
 *   commercial_laundry — industrial washers/dryers run continuous cycles;
 *                   mid-cycle interruption damages linens + chemicals
 *
 * Note: car_wash is NOT in this set — it is high-automation but not 24/7
 * mission-critical; generator defaults to opt-in (not mandate).
 *
 * Also covers any facility whose critical load fraction ≥ 50% — see
 * industryRequiresGenerator() below.
 */
export const GENERATOR_DEFAULT_INDUSTRIES = new Set([
  // Life-safety / code mandate
  "hospital",
  "data_center",
  "data-center", // slug variant
  "airport",
  "manufacturing",
  // Heavy 24/7 continuous process load
  "truck_stop",
  "cold_storage",
  "logistics",
  "commercial_laundry",
]);

/**
 * Returns true when the industry mandates a generator as a baseline facility
 * requirement by code or operational necessity (not an optional add-on).
 *
 * Code mandates: hospital, data_center, airport, manufacturing
 * 24/7 continuous load: truck_stop, cold_storage, logistics, commercial_laundry
 *
 * Note: criticalLoadPct ≥ 50% is a POLICY trigger handled separately in
 * computeGeneratorKW (if_critical policy) — not a mandate override here.
 */
export function industryRequiresGenerator(industry?: string): boolean {
  return !!(industry && GENERATOR_DEFAULT_INDUSTRIES.has(industry));
}

/** Smart default generator scope based on grid reliability answer */
export function defaultGeneratorScope(state: WizardState): GeneratorScopeId {
  if (state.gridReliability === "unreliable") return "critical";
  if (state.gridReliability === "frequent-outages") return "full";
  return "essential";
}

/**
 * EV charger total demand kW for a given package.
 *
 * Industry-standard power ratings:
 *   Level 2: 7.2 kW (J1772 / SAE standard for commercial L2)
 *   DCFC:    50 kW  (standard DC Fast Charger, CHAdeMO/CCS Combo)
 *   HPC:     250 kW (high-power charging, Tesla V3 / Electrify America Hyper)
 *
 * The old code used 150 kW for DCFC which is only correct for high-power CCS
 * chargers like Electrify America (non-standard for most retail deployments).
 */
export const EV_KW = {
  l2: 7.2,
  dcfc: 50,
  hpc: 250,
} as const;

/**
 * Canonical EV package charger counts — SSOT shared by Step3_5V8 (display)
 * and WizardV8Page (commit-to-state). Never define these counts anywhere else.
 *
 * Revenue estimates (approximate, for display only — not a financial guarantee):
 *   pkg_basic:  4 L2 (employee/visitor only) — ~$7,200/yr
 *   pkg_pro:    6 L2 + 2 DCFC (public + fast charging) — ~$34,800/yr
 *   pkg_fleet:  6 L2 + 4 DCFC (fleet depot / high-traffic) — ~$58,800/yr
 *
 * Legacy scope aliases (small/medium/large) kept for backward compatibility with
 * old state that may have been saved before pkg_ IDs were introduced.
 */
export const EV_PACKAGE_COUNTS = {
  // Current package IDs
  pkg_basic: { l2: 4, dcfc: 0 },
  pkg_pro: { l2: 6, dcfc: 2 },
  pkg_fleet: { l2: 6, dcfc: 4 },
  // Legacy scope IDs (backward compat)
  small: { l2: 4, dcfc: 0 },
  medium: { l2: 8, dcfc: 2 },
  large: { l2: 12, dcfc: 4 },
} as const;

export type EVPackageId = keyof typeof EV_PACKAGE_COUNTS;

export function computeEVPackageKW(l2Count: number, dcfcCount: number, hpcCount = 0): number {
  return Math.round(l2Count * EV_KW.l2 + dcfcCount * EV_KW.dcfc + hpcCount * EV_KW.hpc);
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry-aware solar panel tier recommendation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Industries where premium high-efficiency panels are strongly recommended
 * on EXISTING sites (fixed footprint, space-constrained relative to load).
 *
 *   car_wash      — 4,000–8,000 sqft roof, very high energy density
 *   restaurant    — 2,000–5,000 sqft roof, enormous kitchen/HVAC load
 *   ev_charging   — canopy footprint is fixed; max kW from fixed area
 *   gas_station   — small canopy + store footprint, high fuel-station load
 *   apartment     — shared roof split across many units; $/unit improves with density
 *   gym           — mid-size roof + HVAC-heavy load during peak class hours
 *   fitness_center — same profile as gym
 *   hospital      — massive 24/7 load; roof area is limited vs energy demand
 *   healthcare    — same profile as hospital
 *   casino        — extreme 24/7 load density on a fixed entertainment footprint
 *   data_center   — immense power draw, purpose-built roof rarely exceeds load
 *   indoor_farm   — intensive lighting/HVAC load in constrained grow-space roof
 *   hotel         — mid-rise or high-rise; roof area modest vs HVAC + guest load
 *   residential   — small residential roof; every W/sqft directly improves offset
 */
export const PREMIUM_PANEL_INDUSTRIES = new Set([
  "car_wash",
  "restaurant",
  "ev_charging",
  "gas_station",
  "apartment",
  "gym",
  "fitness_center",
  "hospital",
  "healthcare",
  "casino",
  "data_center",
  "indoor_farm",
  "hotel",
  "residential",
]);

/**
 * Industries where standard (best $/kWh) panels are the right call.
 *
 * Criteria: roof or land area comfortably exceeds load — efficiency gain
 * does not justify the premium-panel cost delta.
 *
 *   warehouse     — 50,000–200,000 sqft with modest operational loads
 *   cold_storage  — large refrigerated roof, flat baseload
 *   manufacturing — abundant roof; savings come from BESS demand shaving
 *   truck_stop    — large canopy coverage, fuel-centric baseload
 *   airport       — massive terminal / hangar roof, moderate load density
 *   college       — sprawling campus; standard panels fill acres efficiently
 *   government    — large public facilities with abundant roof
 *   shopping_center — mall-scale roof, diverse tenant load, volume wins
 *   agricultural  — vast land; ground-mount volume at standard cost
 *   retail        — medium box-store roof, moderate load
 *   office        — standard commercial roof, workday-only peaks
 *   microgrid     — system topology, not a facility type — default standard
 *   other         — catch-all fallback
 */
export const STANDARD_PANEL_INDUSTRIES = new Set([
  "warehouse",
  "cold_storage",
  "manufacturing",
  "truck_stop",
  "airport",
  "college",
  "government",
  "shopping_center",
  "agricultural",
  "retail",
  "office",
  "microgrid",
  "other",
]);

/**
 * Returns the recommended solar panel tier for an industry.
 *
 * - "premium"  → space-constrained: every W/sqft matters
 * - "standard" → space-abundant: cheapest approved panel wins
 *
 * projectType override:
 *   "greenfield" → always standard. You're designing the footprint from scratch,
 *                  so there is no space constraint — optimize for cost.
 *   "existing"   → normal industry logic applies (roof is fixed).
 *   undefined    → normal industry logic (conservative default).
 */
export function industryPanelTier(
  industry?: string,
  projectType?: "existing" | "greenfield"
): "standard" | "premium" {
  if (!industry) return "standard";
  // Greenfield: designer controls footprint — space constraint doesn't apply.
  if (projectType === "greenfield") return "standard";
  if (PREMIUM_PANEL_INDUSTRIES.has(industry)) return "premium";
  return "standard";
}

/**
 * One-line rationale string shown in the Panel Grade selector UI.
 * Explains WHY Merlin pre-selected this tier for the chosen industry.
 */
export function industryPanelTierReason(
  industry?: string,
  projectType?: "existing" | "greenfield"
): string | null {
  if (!industry) return null;

  // Greenfield override — explain the logic
  if (projectType === "greenfield") {
    return "Greenfield build — design the roof/canopy size to fit the load, so standard panels optimize cost.";
  }

  if (PREMIUM_PANEL_INDUSTRIES.has(industry)) {
    const reasons: Record<string, string> = {
      car_wash:      "Small roof (4–8K sqft) + high load — every W/sqft counts.",
      restaurant:    "Tiny roof (2–5K sqft) + kitchen/HVAC load — max density needed.",
      ev_charging:   "Canopy footprint is fixed — higher wattage = more kW offset.",
      gas_station:   "Small canopy + store roof — premium packs more kW into tight footprint.",
      apartment:     "Shared roof across units — premium panels improve per-unit ROI.",
      gym:           "Mid-size roof + HVAC peaks — premium boosts class-time offset.",
      fitness_center:"Mid-size roof + HVAC peaks — premium boosts class-time offset.",
      hospital:      "Massive 24/7 load on limited roof — premium closes the gap.",
      healthcare:    "High clinical load density — premium squeezes more kW from limited roof.",
      casino:        "Extreme 24/7 load on fixed entertainment footprint — premium maximizes offset.",
      data_center:   "Immense power draw, modest roof — premium captures every available kW.",
      indoor_farm:   "Intensive grow-lights + HVAC on a constrained roof — premium is the right call.",
      hotel:         "Mid-rise roof vs. HVAC + guest load — premium improves energy offset meaningfully.",
      residential:   "Small roof — premium panels fit more capacity in limited residential area.",
    };
    return reasons[industry] ?? "Space-constrained roof — premium panels maximize capacity.";
  }

  if (STANDARD_PANEL_INDUSTRIES.has(industry)) {
    const reasons: Record<string, string> = {
      warehouse:       "Vast roof, low load — standard panels fill the need at best $/kWh.",
      cold_storage:    "Large roof, flat refrigeration load — volume standard panels win.",
      manufacturing:   "Abundant roof — savings come from BESS demand shaving, not panel grade.",
      truck_stop:      "Large canopy coverage — standard panels maximize kWh at lowest cost.",
      airport:         "Massive terminal roof — standard panels generate volume offset efficiently.",
      college:         "Sprawling campus roof — standard panels at volume deliver best $/kWh.",
      government:      "Large public-facility roof — standard panels optimize taxpayer ROI.",
      shopping_center: "Mall-scale roof — standard panels fill it cost-effectively.",
      agricultural:    "Vast land for ground-mount — standard panels dominate on $/kWh.",
      retail:          "Medium box-store roof — standard panels are the right cost call.",
      office:          "Standard commercial roof, workday peaks — standard panels optimize ROI.",
      microgrid:       "System design handles offset — standard panels cost-optimize generation.",
      other:           "Roof space appears abundant — standard panels deliver best $/kWh.",
    };
    return reasons[industry] ?? "Roof space is abundant — standard panels deliver best $/kWh.";
  }

  return null;
}
