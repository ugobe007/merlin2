/**
 * =============================================================================
 * ADDON SIZING HELPERS — shared between Step3_5V8 (display) and WizardV8Page
 * (commit-to-state on Continue)
 *
 * These functions mirror exactly what Step3_5V8 shows the user so that when
 * WizardV8Page calls setAddonConfig({ solarKW, generatorKW }) on Continue, the
 * values persisted to state match what was displayed.
 * =============================================================================
 */

import type { WizardState } from "./wizardState";

// ── Constants (single source of truth) ────────────────────────────────────────

/** sq ft per kW installed (standard 400W panel ~40 sqft panel area +
 *  racking / wiring / row spacing losses → effective 100 sqft per installed kW AC) */
export const SQFT_PER_KW = 100;

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
 * Estimated solar generation (kW AC) for a given scope at this site.
 *
 * Formula: physicalCap × sunQualityFactor × scopePenetration
 *   - physicalCap: from solarPhysicalCapKW (authoritative, per-industry)
 *   - sunQualityFactor: normalized 3.0→0, 5.5+→1.0 (linear interpolation)
 *   - scopePenetration: roof_only=0.55, roof_canopy=0.80, maximum=1.00
 */
export function estimateSolarKW(scope: SolarScopeId, state: WizardState): number {
  const cap = getEffectiveSolarCapKW(state);
  if (cap <= 0) return 0;
  const psh = state.intel?.peakSunHours ?? 4.5;
  const sunFactor = Math.max(0, Math.min(1.0, (psh - 3.0) / 2.5));
  const pen = SOLAR_SCOPE_PENETRATION[scope] ?? 0.80;
  return Math.round(cap * (0.7 + sunFactor * 0.3) * pen);
}

/**
 * Estimated generator capacity (kW) for a given scope.
 *
 * essential: critical loads only (criticalLoadPct × peakLoadKW × 1.25)
 * full:      entire facility + 10% headroom
 * critical:  full load + 35% headroom (data center / mission critical)
 */
export function estimateGenKW(scope: GeneratorScopeId, state: WizardState): number {
  const { peakLoadKW, criticalLoadPct } = state;
  if (peakLoadKW <= 0) return 0;
  if (scope === "essential") return Math.max(10, Math.round(peakLoadKW * criticalLoadPct * 1.25));
  if (scope === "critical")  return Math.max(10, Math.round(peakLoadKW * 1.35));
  // "full" (default)
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

export function computeEVPackageKW(l2Count: number, dcfcCount: number, hpcCount = 0): number {
  return Math.round(l2Count * EV_KW.l2 + dcfcCount * EV_KW.dcfc + hpcCount * EV_KW.hpc);
}
