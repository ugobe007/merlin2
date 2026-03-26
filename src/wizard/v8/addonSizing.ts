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
  roof_only:   0.55,
  roof_canopy: 0.80,
  maximum:     1.00,
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
  const sunFactor = Math.max(0.40, Math.min(1.0, (psh - 2.5) / 2.0));
  const pen = SOLAR_SCOPE_PENETRATION[scope] ?? 0.80;
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
  if (scope === "critical")  return Math.max(10, Math.round(peakLoadKW * 1.35));
  // "full" (default) — full facility + 10% headroom
  return Math.max(10, Math.round(peakLoadKW * 1.10));
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
  l2:   7.2,
  dcfc: 50,
  hpc:  250,
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
  pkg_basic: { l2: 4,  dcfc: 0 },
  pkg_pro:   { l2: 6,  dcfc: 2 },
  pkg_fleet: { l2: 6,  dcfc: 4 },
  // Legacy scope IDs (backward compat)
  small:     { l2: 4,  dcfc: 0 },
  medium:    { l2: 8,  dcfc: 2 },
  large:     { l2: 12, dcfc: 4 },
} as const;

export type EVPackageId = keyof typeof EV_PACKAGE_COUNTS;

export function computeEVPackageKW(l2Count: number, dcfcCount: number, hpcCount = 0): number {
  return Math.round(l2Count * EV_KW.l2 + dcfcCount * EV_KW.dcfc + hpcCount * EV_KW.hpc);
}
