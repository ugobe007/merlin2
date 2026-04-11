/**
 * =============================================================================
 * WIZARD V8 — STEP 4 SYNTHESIS ENGINE
 * =============================================================================
 *
 * Reads all four collected layers and synthesizes three quote tiers.
 *
 * CALLING CONTRACT:
 *   buildTiers(state) → Promise<[QuoteTier, QuoteTier, QuoteTier]>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FOUR-LAYER INFORMATION PYRAMID
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   Layer 1 (Step 1 — Location) informs:
 *     · How much usable sun is available (peakSunHours → sunFactor)
 *     · What electricity costs (utilityRate, demandCharge)
 *     · Solar grade gate: B- minimum (peakSunHours ≥ 3.5)
 *
 *   Layer 2 (Step 2 — Industry) informs:
 *     · How much solar the facility can physically host (solarPhysicalCapKW)
 *       Example: car wash = 60 kW (limited bay roof)
 *                hotel   = 225 kW (large flat roof)
 *                warehouse = 819 kW (massive roof area)
 *     · What % of load must stay on during outages (criticalLoadPct)
 *       Source: IEEE 446-1995 / NEC 517 / LADWP (benchmarkSources.ts)
 *
 *   Layer 3 (Step 3 — Profile) informs:
 *     · Actual power demand: baseLoadKW, peakLoadKW
 *       (EV charger load is ALREADY merged into these — not a separate add-on)
 *     · BESS application intent (step3Answers.primaryBESSApplication)
 *     · Generator need (step3Answers.generatorNeed)
 *
 *   Layer 4 (Step 4 — Goal) guides the weighting:
 *     · "save_more"  → smaller BESS, moderate solar, shorter duration
 *     · "save_most"  → balanced sizing for optimal NPV / ROI
 *     · "full_power" → larger BESS, max solar, generator always, longer duration
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SOLAR SIZING FORMULA
 *
 *   sunFactor      = max(0.40, clamp((peakSunHours − 2.5) / 2.0, 0, 1))
 *                    → floor 0.40 at PSH 2.5, 1.0 at PSH 4.5+
 *                    (addonSizing.ts SSOT — see sunFactor JSDoc there)
 *
 *   solarOptimalKW = solarPhysicalCapKW × sunFactor × goalPenetration
 *   solarFinalKW   = min(solarOptimalKW, solarPhysicalCapKW)   ← never exceed cap
 *
 *   NOTE: sunFactor is an ECONOMIC SIZING DECISION — NOT a production model.
 *   Annual kWh production uses: kW × PSH × 365 × 0.77 (NREL PR=0.77)
 *   See addonGuardrails.computeSolarValueAnalysis() for the production side.
 *
 *   Example — Phoenix (6.5 PSH) car wash (60 kW cap), save_most Recommended:
 *     sunFactor = 1.0 (clamped), penetration = 0.85 → solarKW = 51 kW
 *
 *   Example — Ann Arbor (3.8 PSH) hotel (225 kW cap), save_most Recommended:
 *     sunFactor = max(0.40, (3.8-2.5)/2.0) = 0.65, penetration = 0.85 → solarKW = 124 kW
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SSOT SOURCES (DO NOT INLINE THESE VALUES):
 *   getBESSSizingRatioWithSource()        → benchmarkSources.ts (IEEE/MDPI)
 *   getGeneratorReserveMarginWithSource() → benchmarkSources.ts (NEC/LADWP)
 *   calculateSystemCosts()                → pricingServiceV45.ts (V4.5 pricing SSOT)
 *   calculateAnnualSavings()              → pricingServiceV45.ts (V4.5 savings SSOT)
 *   calculateROI()                        → pricingServiceV45.ts (V4.5 ROI/NPV SSOT)
 *
 * NOTE: unifiedQuoteCalculator / centralizedCalculations are NO LONGER used for
 * financial outputs. All costs, savings, ITC, ROI, and NPV flow through
 * pricingServiceV45 for single-source-of-truth compliance.
 *
 * PROTECTED: Do not import from other step files. This is Layer 2 logic.
 * =============================================================================
 */

import {
  getBESSSizingRatioWithSource,
  getGeneratorReserveMarginWithSource,
  type BESSUseCase,
} from "@/services/benchmarkSources";
// V4.5 SSOT: All financial outputs (costs, savings, ITC, ROI, NPV) flow through
// pricingServiceV45. unifiedQuoteCalculator is no longer used for financials.
import {
  calculateSystemCosts,
  calculateAnnualSavings,
  calculateROI,
  EQUIPMENT_UNIT_COSTS,
} from "@/services/pricingServiceV45";
import { validateAddonConfig } from "@/services/addonGuardrails";
import { hasGeneratorIntent } from "./addonIntent";
import { CalculationValidator, type ValidationInput } from "@/services/calculationValidator";
import { selectOptimalPanel } from "@/services/solarPanelSelectionService";
import { selectOptimalBESS, type BESSSpec } from "@/services/bessSelectionService";
import type { QuoteResult } from "@/services/unifiedQuoteCalculator";
import type { WizardState, QuoteTier, TierLabel } from "./wizardState";
import type { HybridCoverage, HybridStrategy, PowerSourceDescriptor } from "./wizardState";

// Dev-only logging helper — compiled away in production bundles

const devLog = import.meta.env.DEV ? (...a: unknown[]) => console.log(...a) : () => undefined;

// =============================================================================
// GOAL GUIDANCE TABLE
//
// These values GUIDE the calculator. They express the sizing bias for each
// goal. They are multiplied against SSOT-derived base values — not used raw.
// Since Goals step removed (Phase 1), we always use "save_most" (balanced approach).
// =============================================================================

type GoalChoice = "save_more" | "save_most" | "full_power";

interface GoalGuidance {
  /** Fraction of physically/sun-viable solar to target per tier (0–1) */
  solarPenetration: { starter: number; recommended: number; complete: number };
  /** BESS storage duration hours per tier */
  durationHours: { starter: number; recommended: number; complete: number };
  /**
   * Generator inclusion policy:
   *   "always"       → included in all tiers (full_power goal)
   *   "if_critical"  → included when criticalLoadPct ≥ 0.50 or Step 3 says so
   *   "if_requested" → only included when Step 3 explicitly indicates need
   */
  generatorPolicy: "always" | "if_critical" | "if_requested";
  /** One-line audit note written into each QuoteTier.notes array */
  auditNote: string;
}

const GOAL_GUIDANCE: Record<GoalChoice, GoalGuidance> = {
  save_more: {
    // Smaller, cheaper, faster payback. Solar at moderate penetration.
    // Generator only if Step 3 asked for it (adds cost, slows payback).
    solarPenetration: { starter: 0.4, recommended: 0.7, complete: 1.0 },
    durationHours: { starter: 2, recommended: 2, complete: 2 },
    generatorPolicy: "if_requested",
    auditNote: "Goal: Save More — bias toward smaller system and fast payback.",
  },
  save_most: {
    // Balanced for optimal NPV. Solar at high penetration (best ROI driver).
    // Generator when critical loads are substantial (≥ 50%).
    // INDUSTRY NOTE: C2 (2h) is the commercial BESS standard. Extended coverage
    // comes from solar recharge between peaks + generator bridge — not raw battery hours.
    solarPenetration: { starter: 0.5, recommended: 0.85, complete: 1.0 },
    durationHours: { starter: 2, recommended: 2, complete: 2 },
    generatorPolicy: "if_critical",
    auditNote: "Goal: Save Most — bias toward optimal NPV and return on investment.",
  },
  full_power: {
    // Maximum resilience. Solar maxed out. Generator always. Long duration.
    // Complete tier gets 4h ONLY for explicit microgrid/island-mode use cases.
    solarPenetration: { starter: 0.6, recommended: 1.0, complete: 1.0 },
    durationHours: { starter: 2, recommended: 2, complete: 4 },
    generatorPolicy: "always",
    auditNote: "Goal: Full Power — bias toward maximum coverage and grid independence.",
  },
};

// =============================================================================
// TIER SCALE FACTORS
//
// BESS scales with tier (from MagicFit.ts TIER_CONFIG, March 2026).
// Solar and generator are bounded by physical limits — never scaled above cap.
// =============================================================================

const TIER_BESS_SCALE: Record<TierLabel, number> = {
  Starter: 0.55, // 55% of base (smaller, budget option)
  Recommended: 1.0, // 100% of base (optimal sizing)
  Complete: 1.5, // 150% of base (premium, longer duration)
};

// =============================================================================
// SOLAR SIZING — physics-bounded, sun-quality-adjusted, goal-weighted
// =============================================================================

/**
 * Compute solar capacity for a given tier.
 *
 * Returns 0 when solar is not feasible (grade < B-, PSH < 3.5).
 * Never exceeds solarPhysicalCapKW regardless of goal.
 *
 * When the user sets solarScope in Step 3.5 ("roof_only" | "roof_canopy" |
 * "maximum"), that scope replaces the goal-guided penetration fraction. The
 * sun-quality factor and physical cap still apply. Tier scaling shifts the
 * scope baseline ±25% for Starter/Complete:
 *   roof_only  → 0.55 base  (Starter 0.41, Recommended 0.55, Complete 0.60)
 *   roof_canopy→ 0.80 base  (Starter 0.60, Recommended 0.80, Complete 0.88)
 *   maximum    → 1.00 base  (Starter 0.75, Recommended 1.00, Complete 1.00)
 */
function computeSolarKW(state: WizardState, goal: GoalChoice, tierLabel: TierLabel): number {
  const { intel, solarPhysicalCapKW, step3Answers } = state;

  // Hard gate: location must be solar-viable and industry must have roof/land
  if (!intel || !intel.solarFeasible || solarPhysicalCapKW <= 0) return 0;

  // Sun quality factor: ramps 2.5→4.5 PSH → 0%→100%; floor at 40% for any viable site.
  // This prevents near-zero recommendations for moderate-sun states (Michigan, Pacific NW).
  // Matches addonSizing.ts estimateSolarKW — update both together.
  const sunFactor = Math.max(0.4, Math.min(1.0, (intel.peakSunHours - 2.5) / 2.0));

  const solarScope = step3Answers?.solarScope as string | undefined;
  let penetration: number;

  if (solarScope === "roof_only" || solarScope === "roof_canopy" || solarScope === "maximum") {
    // Scope-driven penetration (Step 3.5 intent overrides goal)
    const scopeBase = solarScope === "roof_only" ? 0.55 : solarScope === "maximum" ? 1.0 : 0.8;
    const tierMult = tierLabel === "Starter" ? 0.75 : tierLabel === "Complete" ? 1.1 : 1.0;
    penetration = Math.min(scopeBase * tierMult, 1.0);
  } else {
    // Goal-guided penetration (Step 3.5 not visited or scope not set)
    const guidance = GOAL_GUIDANCE[goal];
    penetration =
      tierLabel === "Starter"
        ? guidance.solarPenetration.starter
        : tierLabel === "Recommended"
          ? guidance.solarPenetration.recommended
          : guidance.solarPenetration.complete;
  }

  // Physics-bounded result: cap × sun quality × penetration
  const rawKW = solarPhysicalCapKW * sunFactor * penetration;
  return Math.round(Math.min(rawKW, solarPhysicalCapKW));
}

// =============================================================================
// GENERATOR SIZING — critical-load-driven, goal-and-intent-gated
// =============================================================================

/**
 * Compute generator capacity for a given tier.
 *
 * Returns 0 when goal policy + intent do not warrant a generator.
 *
 * Base size: criticalLoadPct × peakLoadKW × reserveMargin (1.25, NEC/LADWP)
 *
 * When the user sets generatorScope in Step 3.5, that scope overrides the
 * criticalLoadPct-based default and forces inclusion:
 *   "essential"  → criticalLoadKW × 1.25  (NEC margin on critical circuits)
 *   "full"       → peakLoadKW × 1.10      (full facility + 10% headroom)
 *   "critical"   → peakLoadKW × 1.35      (mission-critical headroom)
 * Tier scaling still applies on top of the scope base.
 */
function computeGeneratorKW(state: WizardState, goal: GoalChoice, tierLabel: TierLabel): number {
  const { peakLoadKW, criticalLoadPct, step3Answers, wantsGenerator } = state;
  const guidance = GOAL_GUIDANCE[goal];

  // Step 3.5 explicit scope (takes priority over Step 3 generatorNeed)
  const generatorScope = step3Answers?.generatorScope as string | undefined;

  // Step 3 generatorNeed fallback
  const generatorNeed = (step3Answers?.generatorNeed as string | undefined) ?? "none";

  // Explicit Step 3.5 toggle: if user turned it ON, always include regardless of policy
  const explicitlyEnabled =
    wantsGenerator === true ||
    generatorScope === "essential" ||
    generatorScope === "full" ||
    generatorScope === "critical";

  // Goal-policy gating (used when Step 3.5 was not visited)
  const includeByPolicy =
    guidance.generatorPolicy === "always" ||
    (guidance.generatorPolicy === "if_critical" &&
      (criticalLoadPct >= 0.5 ||
        generatorNeed === "full_backup" ||
        generatorNeed === "resilience")) ||
    (guidance.generatorPolicy === "if_requested" &&
      (generatorNeed === "partial" ||
        generatorNeed === "full_backup" ||
        generatorNeed === "resilience"));

  const includeGenerator = explicitlyEnabled || includeByPolicy;
  if (!includeGenerator) return 0;

  // Starter tier: skip unless explicitly requested (cost-focused goal)
  if (tierLabel === "Starter" && !explicitlyEnabled && guidance.generatorPolicy !== "always") {
    if (generatorNeed === "none" || generatorNeed === "ups") return 0;
  }

  // Base power: scope-driven when available, else criticalLoad-based
  let basePowerKW: number;
  if (generatorScope === "essential") {
    // Critical circuits only: criticalLoadPct of peak × NEC margin
    const { margin } = getGeneratorReserveMarginWithSource();
    basePowerKW = peakLoadKW * criticalLoadPct * margin;
  } else if (generatorScope === "critical") {
    // Mission critical: full peak + 35% headroom (UPS/data-center class)
    basePowerKW = peakLoadKW * 1.35;
  } else if (generatorScope === "full") {
    // Full facility: full peak + 10% headroom
    basePowerKW = peakLoadKW * 1.1;
  } else {
    // Goal/policy default: criticalLoad fraction × NEC margin
    const { margin } = getGeneratorReserveMarginWithSource();
    basePowerKW = peakLoadKW * criticalLoadPct * margin;
  }

  // Tier scaling: Complete gets additional headroom, Starter is trimmed
  const tierScale = tierLabel === "Complete" ? 1.25 : tierLabel === "Starter" ? 0.8 : 1.0;

  return Math.max(10, Math.round(basePowerKW * tierScale));
}

// =============================================================================
// BESS SIZING — application-driven (Step 3), goal-weighted, always included
// =============================================================================

/** Map Step 3 primaryBESSApplication answers to benchmarkSources BESSUseCase */
const APPLICATION_TO_BESS_USE_CASE: Record<string, BESSUseCase> = {
  peak_shaving: "peak_shaving", // ratio: 0.40 (IEEE 4538388, MDPI 11(8):2048)
  backup_power: "resilience", // ratio: 0.70 (IEEE 446-1995 Orange Book)
  energy_arbitrage: "arbitrage", // ratio: 0.50 (industry practice)
  demand_response: "peak_shaving", // DR uses similar sizing to peak shaving
  load_shifting: "arbitrage",
  resilience: "resilience",
  stacked: "peak_shaving", // multi-use defaults to peak shaving ratio
};

/** Infer BESS application from goal when Step 3 answer not yet captured */
function inferApplicationFromGoal(goal: GoalChoice): string {
  if (goal === "full_power") return "resilience";
  return "peak_shaving"; // save_more and save_most both default to peak shaving
}

// =============================================================================
// HYBRID COVERAGE ALGORITHM — Dynamic Power Source Architecture
// =============================================================================
//
// PRINCIPLE: BESS is always the anchor. Power sources are enumerated dynamically.
// No source is assumed or preferred — each self-describes its contribution.
// New sources (wind, nuclear, hydrogen) extend PowerSourceDescriptor without
// changing the algorithm.
//
// RECHARGE THRESHOLD: ≥ 50% of bessKWh recharged between AM and PM demand peaks
// → 2h battery covers BOTH daily demand windows (4h effective coverage)
//
// OUTAGE BRIDGE: whichever source has the longest outageBridgeHours wins.
//   Solar:          0h  (weather-dependent, not dispatchable)
//   Rotary gen:     24h (standard diesel/NG fuel tank before refuel decision)
//   Linear gen:     72h (smaller, efficient, more fuel-friendly; 3-day endurance)
// =============================================================================

const NREL_PR = 0.77; // NREL performance ratio for solar production
const MIDDAY_FRACTION = 0.6; // ~60% of daily solar falls in 10am–4pm window
const OVERNIGHT_HOURS = 8; // Off-peak recharge window: 10pm–6am

/**
 * Build the list of active power sources from sized system components.
 * Each descriptor is self-contained — the coverage algorithm never special-cases
 * a specific technology; it aggregates descriptors generically.
 */
function buildPowerSources(
  solarKW: number,
  generatorKW: number,
  generatorFuelType: string,
  linearGeneratorKW: number,
  bessKWh: number,
  baseLoadKW: number,
  peakSunHours: number
): PowerSourceDescriptor[] {
  const sources: PowerSourceDescriptor[] = [];

  // ── Solar ────────────────────────────────────────────────────────────────
  // Variable daytime source. Best for midday BESS recharge between demand peaks.
  // Cannot guarantee outage coverage (weather + day/night constraint).
  if (solarKW > 0) {
    const dailyKWh = solarKW * peakSunHours * NREL_PR;
    const middayKWh = dailyKWh * MIDDAY_FRACTION;
    const middayWindowHours = Math.min(peakSunHours * MIDDAY_FRACTION, 5.0); // 3–5h
    const baseLoadMiddayKWh = baseLoadKW * middayWindowHours;
    const netRechargeKWh = Math.max(0, Math.round(middayKWh - baseLoadMiddayKWh));

    sources.push({
      type: "solar",
      profile: "variable_daytime",
      kW: solarKW,
      label: `${solarKW} kW Solar`,
      canRechargeBESS: netRechargeKWh > 0,
      dailyRechargeKWh: netRechargeKWh,
      dailyRechargeWindowHours: middayWindowHours,
      canBridgeOutage: false, // Weather-dependent; can't guarantee dispatch
      outageBridgeHours: 0,
    });
  }

  // ── Rotary Generator (diesel / natural-gas / dual-fuel) ─────────────────
  // Dispatchable, fuel-limited. Primary role: outage bridge after BESS depletes.
  // Secondary role: off-peak trickle charge (30% load, overnight) when site has
  // high critical load requirement and no linear gen.
  if (generatorKW > 0) {
    // Off-peak trickle: 30% rated power during overnight window (before AM peak)
    const trickleKW = generatorKW * 0.3;
    const genRechargeKWh = Math.min(Math.round(trickleKW * OVERNIGHT_HOURS), bessKWh);

    sources.push({
      type: "generator",
      profile: "dispatchable",
      kW: generatorKW,
      label: `${generatorKW} kW ${fuelLabel(generatorFuelType)} Generator`,
      canRechargeBESS: true, // Can run off-peak at partial load to top up BESS
      dailyRechargeKWh: genRechargeKWh,
      dailyRechargeWindowHours: OVERNIGHT_HOURS,
      canBridgeOutage: true,
      outageBridgeHours: 24, // Standard fuel endurance (before refuel decision)
      fuelType: generatorFuelType as PowerSourceDescriptor["fuelType"],
    });
  }

  // ── Linear Generator ─────────────────────────────────────────────────────
  // Continuous baseload operation — no rotational losses, ~20% more fuel-efficient
  // than rotary at partial load. Ideal role: keep BESS topped up 24/7.
  // Smaller unit (5–100 kW); not sized for full facility peak, sized for BESS charging.
  // Extended fuel endurance: 72h (3 days) before refuel — better than rotary.
  if (linearGeneratorKW > 0) {
    // Runs at rated capacity; serves base load first, remainder charges BESS
    const dailyOutputKWh = Math.round(linearGeneratorKW * 24 * 0.9); // 90% uptime
    const baseLoadDailyKWh = baseLoadKW * 24;
    const netLinearChargeKWh = Math.max(
      0,
      Math.min(Math.round(dailyOutputKWh - baseLoadDailyKWh), bessKWh)
    );

    sources.push({
      type: "linear_generator",
      profile: "continuous_baseload",
      kW: linearGeneratorKW,
      label: `${linearGeneratorKW} kW Linear Generator`,
      canRechargeBESS: true,
      dailyRechargeKWh: netLinearChargeKWh,
      dailyRechargeWindowHours: 24, // Runs continuously
      canBridgeOutage: true,
      outageBridgeHours: 72, // 3-day fuel endurance (efficient partial-load)
    });
  }

  // Future slots: wind, nuclear, hydrogen — implement PowerSourceDescriptor and push here.
  // The coverage algorithm below requires no changes.

  return sources;
}

/** Human-readable fuel type label */
function fuelLabel(fuelType: string): string {
  if (fuelType === "natural-gas") return "Natural Gas";
  if (fuelType === "dual-fuel") return "Dual-Fuel";
  return "Diesel";
}

/**
 * Compute hybrid BESS coverage dynamically across all active power sources.
 *
 * Does NOT special-case any technology. Coverage aggregates across whatever
 * sources are present. Strategy label emerges from the active source set.
 *
 * Algorithm:
 *   1. Build PowerSourceDescriptor[] from sized components
 *   2. Sum daily recharge kWh across all sources → recharge %
 *   3. If ≥ 50% recharge: BESS covers both daily peaks → 4h effective
 *   4. Outage bridge = max(outageBridgeHours) across bridge-capable sources
 *   5. Strategy label from source type set (not hardcoded rules)
 */
function computeHybridCoverage(
  bessKW: number,
  bessKWh: number,
  solarKW: number,
  generatorKW: number,
  generatorFuelType: string,
  linearGeneratorKW: number,
  baseLoadKW: number,
  criticalLoadKW: number,
  peakSunHours: number
): HybridCoverage {
  const bessSpecHours = 2 as const;
  void bessKW; // power rating already used in upstream BESS sizing
  void criticalLoadKW; // reserved for future fuel consumption model

  // ── Step 1: enumerate active power sources ────────────────────────────────
  const activeSources = buildPowerSources(
    solarKW,
    generatorKW,
    generatorFuelType,
    linearGeneratorKW,
    bessKWh,
    baseLoadKW,
    peakSunHours
  );

  // ── Step 2: aggregate recharge capacity ───────────────────────────────────
  const totalDailyRechargeKWh = activeSources.reduce(
    (sum, s) => sum + (s.canRechargeBESS ? s.dailyRechargeKWh : 0),
    0
  );
  const totalRechargePercent =
    bessKWh > 0 ? Math.min(100, Math.round((totalDailyRechargeKWh / bessKWh) * 100)) : 0;

  // ── Step 3: can we cover both daily demand peaks? ─────────────────────────
  // ≥ 50% recharge between peaks enables the evening discharge cycle
  const handlesBothDailyPeaks = activeSources.length > 0 && totalRechargePercent >= 50;
  const dailyPeakCoverageHours: 2 | 4 = handlesBothDailyPeaks ? 4 : 2;

  // ── Step 4: outage bridge ─────────────────────────────────────────────────
  // BESS provides 2h; best bridge-capable source extends beyond that
  const bridgeSources = activeSources.filter((s) => s.canBridgeOutage);
  const outageBridgeHours =
    bridgeSources.length > 0
      ? Math.max(...bridgeSources.map((s) => s.outageBridgeHours))
      : bessSpecHours;

  // ── Step 5: strategy emerges from active source types ────────────────────
  const activeTypes = new Set(activeSources.map((s) => s.type));
  const hasSolar = activeTypes.has("solar");
  const hasAnyGen = activeTypes.has("generator") || activeTypes.has("linear_generator");
  const strategy: HybridStrategy =
    activeSources.length === 0
      ? "bess_only"
      : hasSolar && hasAnyGen
        ? "full_hybrid"
        : hasSolar
          ? "solar_boost"
          : "gen_extend";

  // ── Step 6: plain-language summary ───────────────────────────────────────
  const sourceNames = activeSources.map((s) => s.label).join(" + ");
  let coverageSummary: string;
  if (strategy === "bess_only") {
    coverageSummary = `2h on-demand battery — optimized for demand charge reduction`;
  } else if (strategy === "full_hybrid") {
    coverageSummary = handlesBothDailyPeaks
      ? `${sourceNames} recharges battery between peaks — covers AM & PM demand + ${outageBridgeHours}h outage bridge`
      : `${sourceNames} — ${totalRechargePercent}% daily recharge + ${outageBridgeHours}h outage bridge`;
  } else if (strategy === "solar_boost") {
    coverageSummary = handlesBothDailyPeaks
      ? `${sourceNames} recharges battery midday — covers morning AND evening demand peaks`
      : `${sourceNames} offset (${totalRechargePercent}% midday recharge) + 2h battery`;
  } else {
    // gen_extend
    coverageSummary = `2h battery → ${sourceNames} bridges for ${outageBridgeHours}h outage coverage`;
  }

  return {
    bessSpecHours,
    activeSources,
    totalDailyRechargeKWh: Math.round(totalDailyRechargeKWh),
    totalRechargePercent,
    handlesBothDailyPeaks,
    dailyPeakCoverageHours,
    outageBridgeHours,
    strategy,
    coverageSummary,
  };
}

/**
 * Compute BESS power (kW) and energy (kWh) for a given tier.
 * Ratio source: getBESSSizingRatioWithSource() → IEEE/MDPI benchmarks.
 */
function computeBESSSizing(
  state: WizardState,
  goal: GoalChoice,
  tierLabel: TierLabel,
  _solarKW: number = 0,
  _generatorKW: number = 0
): { bessKW: number; bessKWh: number; durationHours: number } {
  // Use peakLoadKW as sizing basis. Fall back to baseLoadKW if peak not yet set.
  const effectivePeakKW = state.peakLoadKW > 0 ? state.peakLoadKW : state.baseLoadKW;

  // Validation: warn if load data is suspiciously low or missing
  if (effectivePeakKW <= 0) {
    console.error(
      `❌ [BESS Sizing] Invalid effectivePeakKW (${effectivePeakKW}). Using fallback default sizing.`
    );
    const bessKW = 50; // Fallback sizing when no load data available
    const durationHours = GOAL_GUIDANCE[goal].durationHours.recommended;
    return {
      bessKW,
      bessKWh: Math.round(bessKW * durationHours),
      durationHours,
    };
  }

  devLog(
    `🔋 [BESS Sizing] effectivePeakKW=${effectivePeakKW}, state.peakLoadKW=${state.peakLoadKW}, state.baseLoadKW=${state.baseLoadKW}`
  );

  // Application from Step 3 (or inferred from goal if not yet answered)
  const application =
    (state.step3Answers.primaryBESSApplication as string | undefined) ??
    inferApplicationFromGoal(goal);

  const bessUseCase: BESSUseCase = APPLICATION_TO_BESS_USE_CASE[application] ?? "peak_shaving";

  // SSOT sizing ratio (IEEE/MDPI benchmark)
  const { ratio } = getBESSSizingRatioWithSource(bessUseCase);

  // BESS power: peak × ratio × tier scale
  const rawBessKW = effectivePeakKW * ratio * TIER_BESS_SCALE[tierLabel];
  const bessKW = Math.max(75, Math.round(rawBessKW)); // 75 kW commercial minimum floor

  // Duration from goal guidance
  const guidance = GOAL_GUIDANCE[goal];
  const durationHours =
    tierLabel === "Starter"
      ? guidance.durationHours.starter
      : tierLabel === "Recommended"
        ? guidance.durationHours.recommended
        : guidance.durationHours.complete;

  const bessKWh = Math.round(bessKW * durationHours);

  return {
    bessKW,
    bessKWh,
    durationHours,
  };
}

// =============================================================================
// EV CHARGER KW — display field only (load already merged into peakLoadKW)
// =============================================================================

const EV_KW_BY_TYPE: Record<string, number> = {
  l2: 7.2, // Level 2 standard (7.2 kW, J1772 / SAE)
  dcfc: 50, // DC Fast Charger (50 kW — standard CCS Combo / CHAdeMO for retail)
  hpc: 250, // High Power Charger (250 kW — Tesla V3 / Electrify America Hyper)
};

/**
 * Total EV charger capacity in kW.
 * NOTE: This load is already incorporated into peakLoadKW via Step 3's
 * setBaseLoad() call. This field is for display isolation in the quote only.
 */
function computeEVChargerKW(state: WizardState): number {
  // EV is opt-in — return 0 unless user explicitly enabled it
  if (!state.wantsEVCharging) return 0;

  // Check for Step 3.5 EV charger configuration (level2Chargers + dcfcChargers + hpcChargers)
  const stateWithEV = state as WizardState & {
    level2Chargers?: number;
    dcfcChargers?: number;
    hpcChargers?: number;
  };
  const level2 = stateWithEV.level2Chargers ?? 0;
  const dcfc = stateWithEV.dcfcChargers ?? 0;
  const hpc = stateWithEV.hpcChargers ?? 0;

  if (level2 > 0 || dcfc > 0 || hpc > 0) {
    // Level 2: 7.2 kW each, DCFC: 50 kW each (CCS/CHAdeMO), HPC: 250 kW each (Tesla V3 / EA)
    return Math.round(level2 * 7.2 + dcfc * 50 + hpc * 250);
  }

  // Fallback to old evChargers object format
  if (!state.evChargers) return 0;
  const kWPerUnit = EV_KW_BY_TYPE[state.evChargers.type] ?? 7.2;
  return Math.round(state.evChargers.count * kWPerUnit);
}

// =============================================================================
// BUILD ONE TIER — uses pricingServiceV45 as single SSOT for costs, savings, ROI, and NPV.
// All financial outputs are traceable to benchmarkSources.ts constants.
// This function is synchronous (no network calls).
// =============================================================================

function buildOneTier(
  state: WizardState,
  goal: GoalChoice,
  tierLabel: TierLabel,
  baseNotes: string[],
  solarPricePerWatt: number = EQUIPMENT_UNIT_COSTS.solar.pricePerWatt,
  bessSpec?: BESSSpec
): QuoteTier {
  const {
    intel,
    location: _location,
    industry: _industry,
    evRevenuePerYear,
    solarKW,
    generatorKW,
    generatorFuelType,
  } = state;

  // Step 3.5 visited flag: when set, the user explicitly toggled each addon.
  // Gate solar/generator on their explicit choices; when not visited, fall back
  // to goal-policy + hasGeneratorIntent (original behavior preserved).
  const step35Visited = Boolean(state.step3Answers?.step3_5Visited);
  const generatorEnabled = step35Visited
    ? state.wantsGenerator || hasGeneratorIntent(state.step3Answers)
    : state.wantsGenerator || hasGeneratorIntent(state.step3Answers);

  // Tier scaling for configured addons (user values from Step 3.5 = Recommended baseline)
  const tierAddonScale = tierLabel === "Starter" ? 0.7 : tierLabel === "Complete" ? 1.3 : 1.0;

  // Solar: if Step 3.5 visited and user said no solar → hard zero.
  // Otherwise use user-configured kW (legacy path) or auto-calculate via computeSolarKW
  // (which now reads solarScope from step3Answers for scope-based penetration).
  const userExplicitlyDeclinedSolar = step35Visited && !state.wantsSolar;
  const userConfiguredSolar = state.wantsSolar && solarKW > 0;
  const finalSolarKW = userExplicitlyDeclinedSolar
    ? 0
    : userConfiguredSolar
      ? Math.min(Math.round(solarKW * tierAddonScale), state.solarPhysicalCapKW)
      : computeSolarKW(state, goal, tierLabel);

  // Generator: auto-calculate via computeGeneratorKW which reads generatorScope.
  const userConfiguredGenerator = generatorEnabled && generatorKW > 0;
  const finalGenKW = userConfiguredGenerator
    ? Math.round(generatorKW * tierAddonScale)
    : computeGeneratorKW(state, goal, tierLabel);

  const { bessKW, bessKWh, durationHours } = computeBESSSizing(
    state,
    goal,
    tierLabel,
    finalSolarKW,
    finalGenKW
  );
  const evChargerKW = computeEVChargerKW(state);

  // ── Hybrid Coverage ──────────────────────────────────────────────────────
  // Always computed — data is available once BESS + solar + gen are sized.
  const hybridCoverage = computeHybridCoverage(
    bessKW,
    bessKWh,
    finalSolarKW,
    finalGenKW,
    state.generatorFuelType ?? "diesel",
    state.linearGeneratorKW ?? 0,
    state.baseLoadKW,
    state.peakLoadKW * state.criticalLoadPct,
    intel?.peakSunHours ?? 5.0
  );

  // Build EV charger details for notes
  const stateWithEV = state as WizardState & {
    level2Chargers?: number;
    dcfcChargers?: number;
    hpcChargers?: number;
  };
  const level2 = stateWithEV.level2Chargers ?? 0;
  const dcfc = stateWithEV.dcfcChargers ?? 0;
  const hpc = stateWithEV.hpcChargers ?? 0;
  const evChargerDetails =
    level2 > 0 || dcfc > 0 || hpc > 0
      ? `${level2} Level 2 (${(level2 * 7.2).toFixed(0)} kW) + ${dcfc} DCFC (${dcfc * 50} kW) + ${hpc} HPC (${hpc * 250} kW)`
      : state.evChargers
        ? `${state.evChargers.count} × ${state.evChargers.type.toUpperCase()}`
        : "";

  // ── V4.5 SSOT PRICING ──────────────────────────────────────────────────
  // calculateSystemCosts is the single source of truth for all equipment costs.
  // Includes: BESS, solar, generator (fuel-type aware), EV chargers,
  // site engineering, 7.5% contingency, tiered Merlin fee, and correct ITC
  // (30% on solar + BESS only per IRA 2022 — generator/EV/Merlin fee ineligible).
  // EV charger cost fallback: if old evChargers format is set but structured counts are all 0,
  // convert to structured counts so calculateSystemCosts prices them correctly.
  let costLevel2 = level2;
  let costDcfc = dcfc;
  let costHpc = hpc;
  if (costLevel2 === 0 && costDcfc === 0 && costHpc === 0 && (state.evChargers?.count ?? 0) > 0) {
    const t = state.evChargers!.type;
    if (t === "l2") costLevel2 = state.evChargers!.count;
    else if (t === "dcfc") costDcfc = state.evChargers!.count;
    else if (t === "hpc") costHpc = state.evChargers!.count;
    else costLevel2 = state.evChargers!.count; // fallback to L2
  }

  // Panel upgrade cost from electrical assessment (from PanelAssessmentModal in Step 3.5)
  const stateWithPanel = state as WizardState & { panelUpgradeCost?: number };
  const panelUpgradeCost = stateWithPanel.panelUpgradeCost ?? 0;

  const v45Costs = calculateSystemCosts({
    solarKW: finalSolarKW,
    bessKW,
    bessKWh,
    generatorKW: finalGenKW,
    generatorFuelType: generatorFuelType || "diesel",
    level2Chargers: costLevel2,
    dcfcChargers: costDcfc,
    hpcChargers: costHpc,
    solarPricePerWattOverride:
      solarPricePerWatt !== EQUIPMENT_UNIT_COSTS.solar.pricePerWatt ? solarPricePerWatt : undefined,
    // BESS supplier DB overrides — scale from product unit price to system price
    // bessSpec.effectivePricePerKwh is the pack $/kWh from the DB product.
    // We only pass the override when a real (non-fallback) product is selected.
    bessPackPricePerKWhOverride:
      bessSpec && !bessSpec.isFallback ? bessSpec.effectivePricePerKwh : undefined,
    bessInverterPricePerKWOverride:
      bessSpec && !bessSpec.isFallback ? bessSpec.pricePerKw : undefined,
  });

  // ── V4.5 SSOT SAVINGS ──────────────────────────────────────────────────
  // calculateAnnualSavings uses real project inputs (electricity rate, demand
  // charge, sun hours) — NOT the generic MW multipliers in centralizedCalculations.
  // EV charging revenue is captured here via evChargers count parameter.
  const electricityRate = intel?.utilityRate ?? 0.15;
  // Industry-specific demand charge fallback: hospitals carry $20-25/kW commercial
  // tariffs by default (large critical-care load requires firm capacity reservation).
  // All other industries default to $15/kW (typical mid-market commercial).
  const demandCharge = intel?.demandCharge ?? (state.industry === "hospital" ? 20 : 15);
  const sunHoursPerDay = intel?.peakSunHours ?? 5;
  const evChargerCount = level2 + dcfc + hpc;

  const v45Savings = calculateAnnualSavings(
    {
      bessKW,
      bessKWh,
      solarKW: finalSolarKW,
      generatorKW: finalGenKW,
      evChargers: evChargerCount,
      l2Chargers: level2,
      dcfcChargers: dcfc,
      hpcChargers: hpc,
      electricityRate,
      demandCharge,
      sunHoursPerDay,
      cyclesPerYear: 250,
      // Use real TOU data from utility lookup (utilityRateService hasTOU flag)
      // Peak rate: if no peakRate in intel, estimate peak = base + $0.05/kWh spread
      hasTOU: intel?.hasTOU ?? false,
      peakRate: intel?.peakRate ?? electricityRate + 0.05,
      industry: state.industry ?? undefined,
    },
    finalSolarKW
  );

  // ── Assemble QuoteTier ──────────────────────────────────────────────────
  const itcRate = 0.3; // Federal ITC base rate (IRA 2022); applied to solar+BESS only
  // Panel upgrade cost: added to gross cost (not ITC-eligible — electrical service work)
  const grossCost = v45Costs.totalInvestment + panelUpgradeCost;
  const itcAmount = v45Costs.federalITC; // 30% of full §48 basis: solar+labor, BESS, site engineering, contingency, installation labor
  const netCost = v45Costs.netInvestment + panelUpgradeCost; // totalProjectCost − itcAmount + panel upgrade (not ITC eligible)

  // ── Addon guardrails: sizing checks + audit notes for TrueQuote ────────
  // validateAddonConfig runs all three guardrails (solar NREL, EV NEC/SAE, generator IEEE 446)
  // and returns per-technology audit notes + any warnings for the quote.
  // evInfrastructureCost is already included in v45Costs (pricingServiceV45 v4.5.1) —
  // this call is for audit trail notes and warnings only.
  const addonValidation = validateAddonConfig({
    solarInstalledKW: finalSolarKW,
    solarPhysicalCapKW: state.solarPhysicalCapKW,
    peakSunHours: sunHoursPerDay,
    utilityRate: electricityRate,
    l2Count: costLevel2,
    dcfcCount: costDcfc,
    hpcCount: costHpc,
    generatorKW: finalGenKW,
    criticalLoadKW: state.peakLoadKW * state.criticalLoadPct,
    fuelType: (generatorFuelType || "diesel") as "diesel" | "natural-gas" | "dual-fuel",
  });

  // V4.5 honest TCO: gross = BESS + solar + EV revenue; net = gross − reserves
  // EV revenue already included in v45Savings.evChargingRevenue — do not double-add.
  // evRevenuePerYear from state is kept additive for backward compatibility but
  // v45Savings is the primary source; sum only if evRevenuePerYear came from a
  // different evChargers source (e.g., wizard state.evChargers legacy path).
  const grossAnnualSavings =
    evChargerCount > 0
      ? v45Savings.grossAnnualSavings // evChargers already counted in v45Savings
      : v45Savings.grossAnnualSavings + evRevenuePerYear; // legacy ev path

  const annualReserves = v45Savings.annualReserves; // from ANNUAL_RESERVES.total(solarKW)
  const annualSavings = grossAnnualSavings - annualReserves;

  // ── V4.5 SSOT ROI / NPV ────────────────────────────────────────────────
  // calculateROI uses pricingServiceV45 net cost + v45 savings for consistency.
  // Pass energySavingsOnly so calculateROI can produce a dual payback:
  //   paybackYears          = all-in (energy cost reductions + EV revenue)
  //   paybackYearsEnergyOnly = energy savings alone (no EV revenue contribution)
  const energySavingsNet = Math.max(0, v45Savings.energySavings - annualReserves);
  const v45ROI = calculateROI(
    netCost,
    annualSavings,
    0.05,
    energySavingsNet > 0 ? energySavingsNet : undefined
  );
  const paybackYears = v45ROI.paybackYears;
  const roi10Year = v45ROI.roi10Year;

  // Map v45 equipment subtotal to a margin band label for transparency
  const equipSubtotal = v45Costs.equipmentSubtotal;
  const marginBandId =
    equipSubtotal < 200_000 ? "micro" : equipSubtotal < 800_000 ? "small" : "medium";
  const blendedMarginPercent = v45Costs.merlinFees.effectiveMargin * 100;

  // Audit trail notes for this tier
  const tierNotes: string[] = [
    ...baseNotes,
    GOAL_GUIDANCE[goal].auditNote,
    `Tier: ${tierLabel} (BESS scale ${TIER_BESS_SCALE[tierLabel]}×)`,
    `BESS: ${bessKW} kW / ${bessKWh} kWh (${durationHours}h C2 spec — hybrid coverage: ${hybridCoverage.coverageSummary})`,
    finalSolarKW > 0
      ? `Solar: ${finalSolarKW} kW AC${userConfiguredSolar ? ` (user selected ${solarKW} kW, scaled ${Math.round(tierAddonScale * 100)}% for ${tierLabel})` : ` (${intel?.peakSunHours.toFixed(1)} PSH × ${finalSolarKW}/${state.solarPhysicalCapKW} kW cap)`}`
      : `Solar: excluded (${intel?.solarFeasible ? "physical cap = 0" : `grade ${intel?.solarGrade ?? "unknown"} < B-`})`,
    finalGenKW > 0
      ? `Generator: ${finalGenKW} kW${userConfiguredGenerator ? ` (user selected ${generatorKW} kW ${generatorFuelType}, scaled ${Math.round(tierAddonScale * 100)}% for ${tierLabel})` : ` (${(state.criticalLoadPct * 100).toFixed(0)}% critical load × 1.25 reserve)`}`
      : `Generator: excluded (policy: ${GOAL_GUIDANCE[goal].generatorPolicy}, need: ${state.step3Answers.generatorNeed ?? "none"})`,
    evChargerKW > 0
      ? `EV chargers: ${evChargerKW} kW (${evChargerDetails}, already in base load)`
      : "EV chargers: none",
    `Savings model: V4.5 (pricingServiceV45.calculateAnnualSavings) — demand charge reduction + solar generation + EV revenue`,
    `Savings inputs: rate=$${electricityRate}/kWh, demand=$${demandCharge}/kW, sun=${sunHoursPerDay.toFixed(1)}h/day`,
    `Pricing: V4.5 model (pricingServiceV45) — equipment quote (no labor) + 7.5% contingency + Merlin AI services. Installation labor ($${Math.round(v45Costs.installationLaborCost).toLocaleString()}) billed separately.`,
    `ITC: 30% on full installed cost = $${Math.round(itcAmount).toLocaleString()} (solar equip+labor + BESS + site engineering + installation per IRA 2022 Sec 48)`, // Addon guardrail audit notes (addonGuardrails.ts — NREL, NEC, IEEE 446)
    ...(addonValidation.solarAuditNote ? [`📐 ${addonValidation.solarAuditNote}`] : []),
    ...(addonValidation.evAuditNote ? [`⚡ ${addonValidation.evAuditNote}`] : []),
    ...(addonValidation.generatorAuditNote ? [`🔋 ${addonValidation.generatorAuditNote}`] : []),
    // EV electrical infrastructure cost (if any)
    ...(v45Costs.evInfrastructureCost > 0
      ? [
          `⚡ EV infrastructure: $${v45Costs.evInfrastructureCost.toLocaleString()} (480V service, conduit, transformer — NEC Art. 625/230)`,
        ]
      : []),
    // Panel upgrade from electrical assessment
    ...(panelUpgradeCost > 0
      ? [`🔌 Panel upgrade (assessed): $${panelUpgradeCost.toLocaleString()} — not ITC-eligible`]
      : []),
    // Warnings from all guardrails
    ...addonValidation.allWarnings.map((w) => `⚠️  ${w}`),
  ];

  return {
    label: tierLabel,
    bessKWh,
    bessKW,
    solarKW: finalSolarKW,
    generatorKW: finalGenKW,
    evChargerKW,
    durationHours,
    hybridCoverage,
    grossCost,
    itcRate,
    itcAmount,
    netCost,
    // ITC basis breakdown — explains what the 30% applies to (§48 eligible costs only)
    itcBasisBreakdown: {
      solarEligible: Math.round(v45Costs.solarCost + v45Costs.solarLaborCost),
      bessEligible: Math.round(v45Costs.bessCost),
      siteEligible: Math.round(
        v45Costs.siteEngineering +
          v45Costs.constructionContingency +
          (v45Costs.installationLaborCost - v45Costs.solarLaborCost) // non-solar field labor
      ),
      totalEligible: Math.round(itcAmount / itcRate), // back-calculated from itcAmount for exact match
      generatorCost: Math.round(v45Costs.generatorCost),
      evChargingCost: Math.round(v45Costs.evChargingCost + v45Costs.evInfrastructureCost),
    },
    // V4.5 honest TCO: persist both gross and net savings
    grossAnnualSavings,
    annualReserves,
    annualSavings, // NET savings (gross - reserves)
    // Use v45Savings.evChargingRevenue when EV chargers are configured (Step 3.5 path sets
    // dcfcChargers/level2Chargers directly — state.evRevenuePerYear stays 0 in that flow).
    evRevenuePerYear: evChargerCount > 0 ? v45Savings.evChargingRevenue : evRevenuePerYear,
    energySavings: v45Savings.energySavings,
    demandChargeSavings: v45Savings.demandChargeSavings,
    dcfcDemandPenalty: v45Savings.dcfcDemandPenalty,
    paybackYears,
    paybackYearsEnergyOnly: v45ROI.paybackYearsEnergyOnly,
    roi10Year,
    npv: v45ROI.npv25Year, // 25-year NPV, 5% discount rate (pricingServiceV45.calculateROI)
    // V4.5 margin transparency (from pricingServiceV45 tiered Merlin fee)
    marginBandId,
    blendedMarginPercent,
    // Exposed for CalculationValidator background audit (not displayed in UI)
    equipmentSubtotal: v45Costs.equipmentSubtotal,
    installationLaborCost: v45Costs.installationLaborCost,
    totalProjectCost: v45Costs.totalProjectCost,
    notes: tierNotes,
    generatorFuelType: state.generatorFuelType,
    linearGeneratorKW: state.linearGeneratorKW ?? 0,
  };
}

// =============================================================================
// BACKGROUND VALIDATION — Layer 3 (CalculationValidator: Supabase audit + alerts)
// =============================================================================

/**
 * Fire-and-forget wrapper around CalculationValidator.validateQuote().
 * Uses the Recommended tier as the representative quote for audit purposes.
 * Never blocks buildTiers() — all I/O (Supabase, email/SMS) happens async.
 * Hard-capped at 5s so a slow/broken Supabase connection can never stall the quote page.
 */
async function runV8ValidationBackground(state: WizardState, tier: QuoteTier): Promise<void> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("validation timeout")), 5000)
  );
  try {
    const inputs: ValidationInput = {
      storageSizeMW: tier.bessKW / 1000,
      durationHours: tier.durationHours,
      solarMW: tier.solarKW > 0 ? tier.solarKW / 1000 : undefined,
      generatorMW: tier.generatorKW > 0 ? tier.generatorKW / 1000 : undefined,
      location: state.location ? `${state.location.city}, ${state.location.state}` : "unknown",
      useCase: state.industry ?? "default",
      electricityRate: state.intel?.utilityRate ?? 0.12,
    };

    // Adapt QuoteTier → QuoteResult shape.
    // BESS pack cost = pack-only (cells + BMS + thermal + enclosure), NO PCS/inverter.
    // This keeps the validator's $/kWh check aligned with pack-only guardrails.
    const bessPackCost = Math.round(
      tier.bessKWh *
        (tier.selectedBESS?.effectivePricePerKwh ?? EQUIPMENT_UNIT_COSTS.bess.pricePerKWh) // DB price or SSOT $350/kWh
    );
    const solarCost =
      tier.solarKW > 0
        ? Math.round(
            tier.solarKW *
              1000 *
              (tier.selectedPanel?.effectivePricePerWatt ?? EQUIPMENT_UNIT_COSTS.solar.pricePerWatt)
          ) // $/W from supplier DB or SSOT fallback
        : 0;

    const quoteResult = {
      equipment: {
        batteries: bessPackCost > 0 ? { totalCost: bessPackCost } : undefined,
        solar: solarCost > 0 ? { totalCost: solarCost } : undefined,
      },
      costs: {
        equipmentCost: tier.equipmentSubtotal ?? Math.round(tier.grossCost * 0.74),
        installationCost: tier.installationLaborCost ?? 0,
        totalProjectCost: tier.totalProjectCost ?? tier.grossCost,
        taxCredit: tier.itcAmount,
        netCost: tier.netCost,
      },
      financials: {
        annualSavings: tier.annualSavings,
        paybackYears: tier.paybackYears,
        roi10Year: tier.roi10Year,
        roi25Year: 0,
        npv: tier.npv,
        irr: 0,
      },
    } as unknown as QuoteResult;

    await Promise.race([
      CalculationValidator.validateQuote(quoteResult, inputs, {
        logToDatabase: true,
        sessionId: `v8-${state.location?.zip ?? "unknown"}-${Date.now()}`,
      }),
      timeout,
    ]);
  } catch (err) {
    // Never let background validation crash the wizard
    devLog("[V8 CalculationValidator] Background validation error (non-fatal):", err);
  }
}

// =============================================================================
// ROI GUARDRAIL — prevents unrealistically long-payback quotes
// =============================================================================

/**
 * Maximum acceptable payback years by tier.
 * Beyond these thresholds the guardrail kicks in and attempts to auto-fix the
 * configuration by removing zero-savings-contribution equipment (generator first).
 *
 * Why these targets?
 *   Starter:     fastest payback orientation — customers expect < 6 yr
 *   Recommended: most common sales target — 5–7 yr is the industry sweet spot
 *   Complete:    premium system — slightly longer acceptable, but ≤ 9 yr
 */
const PAYBACK_TARGETS: Record<TierLabel, number> = {
  Starter: 6,
  Recommended: 7,
  Complete: 9,
};

/**
 * Rebuild a tier's financials with the generator zeroed out.
 * The generator contributes $0 to annual savings in the model
 * (its value is resilience/insurance, not energy cost reduction).
 * This is the primary lever to bring payback within target.
 */
function recalcWithoutGenerator(tier: QuoteTier, state: WizardState): QuoteTier {
  const electricityRate = state.intel?.utilityRate ?? 0.15;
  const demandCharge = state.intel?.demandCharge ?? 15;
  const sunHoursPerDay = state.intel?.peakSunHours ?? 5;

  const stateWithEV = state as WizardState & {
    level2Chargers?: number;
    dcfcChargers?: number;
    hpcChargers?: number;
  };
  const l2 = stateWithEV.level2Chargers ?? 0;
  const dcfc = stateWithEV.dcfcChargers ?? 0;
  const hpc = stateWithEV.hpcChargers ?? 0;
  const evChargerCount = l2 + dcfc + hpc;

  const newCosts = calculateSystemCosts({
    solarKW: tier.solarKW,
    bessKW: tier.bessKW,
    bessKWh: tier.bessKWh,
    generatorKW: 0, // ← generator removed
    generatorFuelType: "diesel",
    level2Chargers: l2,
    dcfcChargers: dcfc,
    hpcChargers: hpc,
    solarPricePerWattOverride: tier.selectedPanel?.effectivePricePerWatt,
  });

  const newSavings = calculateAnnualSavings(
    {
      bessKW: tier.bessKW,
      bessKWh: tier.bessKWh,
      solarKW: tier.solarKW,
      generatorKW: 0,
      evChargers: evChargerCount,
      l2Chargers: l2,
      dcfcChargers: dcfc,
      hpcChargers: hpc,
      electricityRate,
      demandCharge,
      sunHoursPerDay,
      cyclesPerYear: 250,
      hasTOU: state.intel?.hasTOU ?? false,
      peakRate: state.intel?.peakRate ?? electricityRate + 0.05,
      industry: state.industry ?? undefined,
    },
    tier.solarKW
  );

  const newGrossAnnualSavings =
    evChargerCount > 0
      ? newSavings.grossAnnualSavings
      : newSavings.grossAnnualSavings + tier.evRevenuePerYear;
  const newAnnualSavings = newGrossAnnualSavings - newSavings.annualReserves;
  const newEnergySavingsNet = Math.max(0, newSavings.energySavings - newSavings.annualReserves);
  const newROI = calculateROI(
    newCosts.netInvestment,
    newAnnualSavings,
    0.05,
    newEnergySavingsNet > 0 ? newEnergySavingsNet : undefined
  );

  return {
    ...tier,
    generatorKW: 0,
    grossCost: newCosts.totalInvestment,
    itcAmount: newCosts.federalITC,
    netCost: newCosts.netInvestment,
    grossAnnualSavings: newGrossAnnualSavings,
    annualReserves: newSavings.annualReserves,
    annualSavings: newAnnualSavings,
    energySavings: newSavings.energySavings,
    dcfcDemandPenalty: newSavings.dcfcDemandPenalty,
    paybackYears: newROI.paybackYears,
    paybackYearsEnergyOnly: newROI.paybackYearsEnergyOnly,
    roi10Year: newROI.roi10Year,
    npv: newROI.npv25Year,
    equipmentSubtotal: newCosts.equipmentSubtotal,
    installationLaborCost: newCosts.installationLaborCost,
    totalProjectCost: newCosts.totalProjectCost,
    notes: [
      ...tier.notes,
      `[ROI Guardrail] Generator removed: was ${tier.generatorKW} kW, saved $${(tier.grossCost - newCosts.totalInvestment).toLocaleString("en-US", { maximumFractionDigits: 0 })} in project cost, payback improved ${tier.paybackYears.toFixed(1)} → ${newROI.paybackYears.toFixed(1)} yr`,
    ],
  };
}

/**
 * Rebuild a tier's financials with BESS scaled to the commercial minimum
 * (75 kW / 150 kWh, 2-hour duration). Applied as Step 2 of the guardrail
 * cascade when removing the generator alone was insufficient or there was
 * no generator to remove (e.g. limited-solar/low-rate locations).
 */
function _recalcWithMinBESS(tier: QuoteTier, state: WizardState): QuoteTier {
  const MIN_BESS_KW = 75;
  const MIN_BESS_KWH = 150; // 75 kW × 2-hour duration

  if (tier.bessKW <= MIN_BESS_KW) return tier; // already at or below minimum

  const electricityRate = state.intel?.utilityRate ?? 0.15;
  const demandCharge = state.intel?.demandCharge ?? 15;
  const sunHoursPerDay = state.intel?.peakSunHours ?? 5;

  const stateWithEV = state as WizardState & {
    level2Chargers?: number;
    dcfcChargers?: number;
    hpcChargers?: number;
  };
  const l2 = stateWithEV.level2Chargers ?? 0;
  const dcfc = stateWithEV.dcfcChargers ?? 0;
  const hpc = stateWithEV.hpcChargers ?? 0;
  const evChargerCount = l2 + dcfc + hpc;

  const newCosts = calculateSystemCosts({
    solarKW: tier.solarKW,
    bessKW: MIN_BESS_KW,
    bessKWh: MIN_BESS_KWH,
    generatorKW: tier.generatorKW,
    generatorFuelType: "diesel",
    level2Chargers: l2,
    dcfcChargers: dcfc,
    hpcChargers: hpc,
    solarPricePerWattOverride: tier.selectedPanel?.effectivePricePerWatt,
  });

  const newSavings = calculateAnnualSavings(
    {
      bessKW: MIN_BESS_KW,
      bessKWh: MIN_BESS_KWH,
      solarKW: tier.solarKW,
      generatorKW: tier.generatorKW,
      evChargers: evChargerCount,
      l2Chargers: l2,
      dcfcChargers: dcfc,
      hpcChargers: hpc,
      electricityRate,
      demandCharge,
      sunHoursPerDay,
      cyclesPerYear: 250,
      hasTOU: state.intel?.hasTOU ?? false,
      peakRate: state.intel?.peakRate ?? electricityRate + 0.05,
      industry: state.industry ?? undefined,
    },
    tier.solarKW
  );

  const newGrossAnnualSavings =
    evChargerCount > 0
      ? newSavings.grossAnnualSavings
      : newSavings.grossAnnualSavings + tier.evRevenuePerYear;
  const newAnnualSavings = newGrossAnnualSavings - newSavings.annualReserves;
  const minBessEnergySavingsNet = Math.max(0, newSavings.energySavings - newSavings.annualReserves);
  const newROI = calculateROI(
    newCosts.netInvestment,
    newAnnualSavings,
    0.05,
    minBessEnergySavingsNet > 0 ? minBessEnergySavingsNet : undefined
  );

  return {
    ...tier,
    bessKW: MIN_BESS_KW,
    bessKWh: MIN_BESS_KWH,
    grossCost: newCosts.totalInvestment,
    itcAmount: newCosts.federalITC,
    netCost: newCosts.netInvestment,
    grossAnnualSavings: newGrossAnnualSavings,
    annualReserves: newSavings.annualReserves,
    annualSavings: newAnnualSavings,
    energySavings: newSavings.energySavings,
    dcfcDemandPenalty: newSavings.dcfcDemandPenalty,
    paybackYears: newROI.paybackYears,
    paybackYearsEnergyOnly: newROI.paybackYearsEnergyOnly,
    roi10Year: newROI.roi10Year,
    npv: newROI.npv25Year,
    equipmentSubtotal: newCosts.equipmentSubtotal,
    installationLaborCost: newCosts.installationLaborCost,
    totalProjectCost: newCosts.totalProjectCost,
    notes: [
      ...tier.notes,
      `[ROI Guardrail] BESS right-sized to minimum viable (${MIN_BESS_KW} kW / ${MIN_BESS_KWH} kWh, ` +
        `was ${tier.bessKW} kW / ${tier.bessKWh} kWh): project cost reduced by ` +
        `$${(tier.grossCost - newCosts.totalInvestment).toLocaleString("en-US", { maximumFractionDigits: 0 })}, ` +
        `payback improved ${tier.paybackYears.toFixed(1)} → ${newROI.paybackYears.toFixed(1)} yr`,
    ],
  };
}

/**
 * Apply ROI payback guardrail to a built tier.
 *
 * Cascade (applied in order until payback ≤ target):
 *   1. Remove generator — zero annual savings contribution, high upfront cost
 *   2. Scale BESS to minimum viable (75 kW / 150 kWh) if still over target
 *
 * Sets tier.guardrail with metadata so the UI can surface what changed and why.
 * Never throws — if nothing can be done, guardrail.applied = false + reason.
 */
function applyPaybackGuardrail(tier: QuoteTier, state: WizardState): QuoteTier {
  const target = PAYBACK_TARGETS[tier.label as TierLabel];

  // No guardrail needed — already within target or payback is infinite (no savings)
  if (!Number.isFinite(tier.paybackYears) || tier.paybackYears <= target) {
    return tier;
  }

  const originalPayback = tier.paybackYears;
  const removedComponents: string[] = [];
  let adjusted = tier;

  // ── Step 1: Remove generator (only when NOT explicitly required) ────────────
  // Generator adds $0 to annual energy savings. Its cost is pure resilience spend.
  // However, we do NOT auto-remove it when:
  //   a) The user explicitly requested it (wantsGenerator = true)
  //   b) The facility has high critical loads (criticalLoadPct ≥ 50%) — safety requirement
  //   c) The generator need was explicitly stated as full_backup or resilience
  //   d) The industry is "hospital" — NEC 517 / NFPA 99 mandates backup power for
  //      healthcare occupancies. Removing it would produce a code-violating design.
  //      Hospitals account for the generator cost via avoided downtime savings credit.
  // In those cases the generator is a necessity, not an optional ROI lever.
  const generatorIsExplicitlyNeeded =
    state.wantsGenerator === true ||
    state.criticalLoadPct >= 0.5 ||
    state.step3Answers?.generatorNeed === "full_backup" ||
    state.step3Answers?.generatorNeed === "resilience" ||
    state.industry === "hospital";

  if (adjusted.generatorKW > 0 && !generatorIsExplicitlyNeeded) {
    const noGen = recalcWithoutGenerator(adjusted, state);
    // Accept if it strictly improves payback (even if still over target)
    if (noGen.paybackYears < adjusted.paybackYears) {
      const genCostSaved = Math.round(adjusted.grossCost - noGen.grossCost);
      removedComponents.push(
        `Generator (${tier.generatorKW} kW) — removed to improve ROI. ` +
          `Added $${genCostSaved.toLocaleString("en-US")} to project cost with $0 annual savings contribution. ` +
          `It can be re-added in Step 3.5 as a resilience investment.`
      );
      adjusted = noGen;
    }
  }

  // ── Step 2: BESS downsize — DISABLED ────────────────────────────────────────
  // The BESS is load-sized: peakLoadKW × ratio × TIER_SCALE. Auto-downsizing to
  // the 75 kW floor when a large load (EV, data center, hotel) legitimately
  // requires a bigger BESS produces incorrect quotes. Payback may be longer for
  // large systems — that's honest. Surface a warning note instead of altering
  // the system design.
  //
  // (Kept for reference — re-enable only for very small/low-rate edge cases)
  // if (adjusted.paybackYears > target && adjusted.bessKW > 75) {
  //   const minBESS = recalcWithMinBESS(adjusted, state);
  //   if (minBESS.paybackYears < adjusted.paybackYears) { ... }
  // }

  // Build the guardrail metadata
  const utilityRateCents = Math.round((state.intel?.utilityRate ?? 0.15) * 100);
  const guardrail: QuoteTier["guardrail"] =
    removedComponents.length > 0
      ? {
          applied: true,
          originalPaybackYears: originalPayback,
          adjustedPaybackYears: adjusted.paybackYears,
          removedComponents,
          reason:
            `This configuration's payback was ${originalPayback.toFixed(0)} years — above the ` +
            `${target}-year target for the ${tier.label} tier. Merlin automatically adjusted ` +
            `the scope to improve ROI. You can restore any item in Step 3.5.`,
        }
      : {
          applied: false,
          originalPaybackYears: originalPayback,
          adjustedPaybackYears: originalPayback,
          removedComponents: [],
          reason:
            `Payback of ${originalPayback.toFixed(0)} years exceeds the ${target}-year target. ` +
            `At your local rate of ${utilityRateCents}¢/kWh, savings from demand charge reduction ` +
            `and solar are limited for this configuration. To improve ROI: (1) add more solar ` +
            `capacity in Step 3.5 — solar has the best per-kW savings at this location; (2) verify ` +
            `your utility rate with your provider — some commercial accounts qualify for ` +
            `demand-response programs that significantly improve BESS economics.`,
        };

  return { ...adjusted, guardrail };
}

// =============================================================================
// EXPORTED: buildTiers — the only function callers should use
// =============================================================================

/**
 * Build all three quote tiers from the collected wizard state.
 *
 * Calls calculateQuote() exactly 3 times in parallel — once per tier.
 * Each tier is a distinct, independently-priced configuration, not a
 * linear scaling of a single output.
 *
 * @param state - Full WizardState. Must have baseLoadKW > 0 and goalChoice set.
 * @returns Promise resolving to [Starter, Recommended, Complete]
 *
 * @throws If goalChoice is null or baseLoadKW has not been established.
 */
export async function buildTiers(state: WizardState): Promise<[QuoteTier, QuoteTier, QuoteTier]> {
  devLog("[buildTiers] Called with state:", {
    baseLoadKW: state.baseLoadKW,
    peakLoadKW: state.peakLoadKW,
    location: state.location,
    industry: state.industry,
    intel: state.intel,
    solarPhysicalCapKW: state.solarPhysicalCapKW,
    criticalLoadPct: state.criticalLoadPct,
    wantsSolar: state.wantsSolar,
    wantsGenerator: state.wantsGenerator,
    wantsEVCharging: state.wantsEVCharging,
  });

  // Since Goals removed, always use "save_most" (balanced/recommended approach)
  const goal = "save_most";

  if (state.baseLoadKW <= 0) {
    console.error("[buildTiers] baseLoadKW invalid:", state.baseLoadKW);
    throw new Error("buildTiers: baseLoadKW must be > 0. Ensure Step 3 is complete.");
  }
  if (!state.location) {
    console.error("[buildTiers] location missing");
    throw new Error("buildTiers: location must be set. Ensure Step 1 is complete.");
  }

  // Shared notes for all three tiers (provenance trail)
  const baseNotes: string[] = [
    `Industry: ${state.industry ?? "unknown"}`,
    `Location: ${state.location.city}, ${state.location.state} (${state.location.zip})`,
    `Peak load: ${state.peakLoadKW} kW, Base load: ${state.baseLoadKW} kW`,
    `Utility: ${state.intel?.utilityProvider ?? "unknown"} @ $${(state.intel?.utilityRate ?? 0).toFixed(3)}/kWh, $${(state.intel?.demandCharge ?? 0).toFixed(0)}/kW demand`,
    `Solar grade: ${state.intel?.solarGrade ?? "unknown"} (${state.intel?.peakSunHours?.toFixed(1) ?? "?"} PSH) | Physical cap: ${state.solarPhysicalCapKW} kW`,
    `Critical load: ${(state.criticalLoadPct * 100).toFixed(0)}% of peak`,
  ];

  // buildOneTier is synchronous (pricingServiceV45 only, no network calls).
  // buildTiers remains async for backwards compatibility with all callers.
  // applyPaybackGuardrail runs after each tier to enforce 5–7 yr payback targets.

  // ── PARALLEL DB LOOKUPS — solar panel + BESS product ──────────────────────
  // Both queries are async (vendor_products DB). Run in parallel for performance.
  // Falls back to SSOT silently when no approved products exist.

  // Estimate BESS sizing for the recommended tier so selection targets the right
  // unit size. Use the recommended-tier computed BESS sizing.
  const { bessKW: estKW, bessKWh: estKWh } = computeBESSSizing(state, goal, "Recommended", 0, 0);

  const [selectedPanelFull, selectedBESSFull] = await Promise.all([
    state.wantsSolar
      ? selectOptimalPanel(
          state.location.state,
          undefined,
          (state as WizardState & { solarPanelTier?: string }).solarPanelTier
        )
      : (await import("@/services/solarPanelSelectionService")).SSOT_FALLBACK_PANEL,
    estKWh > 0
      ? selectOptimalBESS(estKWh, estKW)
      : (await import("@/services/bessSelectionService")).SSOT_FALLBACK_BESS,
  ]);

  // Compact panel info stored on each tier (full SolarPanelSpec not serialised to WizardState)
  const panelForTier = selectedPanelFull.isFallback
    ? undefined
    : {
        manufacturer: selectedPanelFull.manufacturer,
        model: selectedPanelFull.model,
        wattPeak: selectedPanelFull.wattPeak,
        efficiencyPct: selectedPanelFull.efficiencyPct,
        effectivePricePerWatt: selectedPanelFull.effectivePricePerWatt,
        tariffAdderPct: selectedPanelFull.tariffAdderPct,
        countryOfOrigin: selectedPanelFull.countryOfOrigin,
        isFallback: false,
      };

  // Compact BESS info stored on each tier (full BESSSpec not serialised to WizardState)
  const bessForTier = selectedBESSFull.isFallback
    ? undefined
    : {
        manufacturer: selectedBESSFull.manufacturer,
        model: selectedBESSFull.model,
        chemistry: selectedBESSFull.chemistry,
        capacityKwh: selectedBESSFull.capacityKwh,
        powerKw: selectedBESSFull.powerKw,
        effectivePricePerKwh: selectedBESSFull.effectivePricePerKwh,
        roundtripEfficiencyPct: selectedBESSFull.roundtripEfficiencyPct,
        cycleLife: selectedBESSFull.cycleLife,
        warrantyYears: selectedBESSFull.warrantyYears,
        leadTimeWeeks: selectedBESSFull.leadTimeWeeks,
        isFallback: false,
      };

  // Effective $/W from supplier DB (or SSOT fallback $1.00/W)
  const solarPricePerWatt = selectedPanelFull.effectivePricePerWatt;

  const starter = applyPaybackGuardrail(
    buildOneTier(state, goal, "Starter", baseNotes, solarPricePerWatt, selectedBESSFull),
    state
  );
  starter.selectedPanel = panelForTier;
  starter.selectedBESS = bessForTier;

  const recommended = applyPaybackGuardrail(
    buildOneTier(state, goal, "Recommended", baseNotes, solarPricePerWatt, selectedBESSFull),
    state
  );
  recommended.selectedPanel = panelForTier;
  recommended.selectedBESS = bessForTier;

  const complete = applyPaybackGuardrail(
    buildOneTier(state, goal, "Complete", baseNotes, solarPricePerWatt, selectedBESSFull),
    state
  );
  complete.selectedPanel = panelForTier;
  complete.selectedBESS = bessForTier;

  // Layer 3 validation: fire-and-forget Supabase audit + email/SMS alerts.
  // Uses the Recommended tier as the representative quote.
  // Never blocks or throws — failures are logged silently.
  void runV8ValidationBackground(state, recommended);

  return [starter, recommended, complete];
}
