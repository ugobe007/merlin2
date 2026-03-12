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
 *   sunFactor      = clamp((peakSunHours − 3.0) / 2.5, 0, 1)
 *                    → 1.0 at 5.5 PSH (A−), 0.32 at 3.8 PSH (Ann Arbor), etc.
 *
 *   solarOptimalKW = solarPhysicalCapKW × sunFactor × goalPenetration
 *   solarFinalKW   = min(solarOptimalKW, solarPhysicalCapKW)   ← never exceed cap
 *
 *   Example — Phoenix (6.5 PSH) car wash (60 kW cap), save_most Recommended:
 *     sunFactor = 1.0 (clamped), penetration = 0.85 → solarKW = 51 kW
 *
 *   Example — Ann Arbor (3.8 PSH) hotel (225 kW cap), save_most Recommended:
 *     sunFactor = 0.32, penetration = 0.85 → solarKW = 61 kW
 *     (Large roof can't overcome poor sun quality)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SSOT SOURCES (DO NOT INLINE THESE VALUES):
 *   getBESSSizingRatioWithSource()        → benchmarkSources.ts (IEEE/MDPI)
 *   getGeneratorReserveMarginWithSource() → benchmarkSources.ts (NEC/LADWP)
 *   calculateQuote()                      → unifiedQuoteCalculator.ts (NREL ATB)
 *
 * PROTECTED: Do not import from other step files. This is Layer 2 logic.
 * =============================================================================
 */

import { calculateQuote } from "@/services/unifiedQuoteCalculator";
import {
  getBESSSizingRatioWithSource,
  getGeneratorReserveMarginWithSource,
  type BESSUseCase,
} from "@/services/benchmarkSources";
import { applyMarginPolicy } from "@/services/marginPolicyEngine";
import { hasGeneratorIntent } from "./addonIntent";
import type {
  WizardState,
  QuoteTier,
  TierLabel,
} from "./wizardState";

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
    solarPenetration: { starter: 0.40, recommended: 0.70, complete: 1.00 },
    durationHours:    { starter: 2,    recommended: 3,    complete: 4   },
    generatorPolicy:  "if_requested",
    auditNote:        "Goal: Save More — bias toward smaller system and fast payback.",
  },
  save_most: {
    // Balanced for optimal NPV. Solar at high penetration (best ROI driver).
    // Generator when critical loads are substantial (≥ 50%).
    solarPenetration: { starter: 0.50, recommended: 0.85, complete: 1.00 },
    durationHours:    { starter: 2,    recommended: 4,    complete: 6   },
    generatorPolicy:  "if_critical",
    auditNote:        "Goal: Save Most — bias toward optimal NPV and return on investment.",
  },
  full_power: {
    // Maximum resilience. Solar maxed out. Generator always. Long duration.
    solarPenetration: { starter: 0.60, recommended: 1.00, complete: 1.00 },
    durationHours:    { starter: 4,    recommended: 6,    complete: 8   },
    generatorPolicy:  "always",
    auditNote:        "Goal: Full Power — bias toward maximum coverage and grid independence.",
  },
};

// =============================================================================
// TIER SCALE FACTORS
//
// BESS scales with tier (from MagicFit.ts TIER_CONFIG, March 2026).
// Solar and generator are bounded by physical limits — never scaled above cap.
// =============================================================================

const TIER_BESS_SCALE: Record<TierLabel, number> = {
  Starter:     0.55,  // 55% of base (smaller, budget option)
  Recommended: 1.00,  // 100% of base (optimal sizing)
  Complete:    1.50,  // 150% of base (premium, longer duration)
};

// =============================================================================
// SOLAR SIZING — physics-bounded, sun-quality-adjusted, goal-weighted
// =============================================================================

/**
 * Compute solar capacity for a given tier.
 *
 * Returns 0 when solar is not feasible (grade < B-, PSH < 3.5).
 * Never exceeds solarPhysicalCapKW regardless of goal.
 */
function computeSolarKW(
  state: WizardState,
  goal: GoalChoice,
  tierLabel: TierLabel
): number {
  const { intel, solarPhysicalCapKW } = state;

  // Hard gate: location must be solar-viable and industry must have roof/land
  if (!intel || !intel.solarFeasible || solarPhysicalCapKW <= 0) return 0;

  // Sun quality factor: normalized to 5.5 PSH (A− = excellent reference)
  // At 3.0 PSH → 0 (just below viable), at 5.5+ PSH → 1.0 (clamped)
  // Formula: clamp((PSH − 3.0) / 2.5, 0, 1)
  const sunFactor = Math.max(0, Math.min(1.0, (intel.peakSunHours - 3.0) / 2.5));

  // Goal-guided penetration fraction for this tier
  const guidance = GOAL_GUIDANCE[goal];
  const penetration =
    tierLabel === "Starter"     ? guidance.solarPenetration.starter     :
    tierLabel === "Recommended" ? guidance.solarPenetration.recommended :
                                  guidance.solarPenetration.complete;

  // Physics-bounded result: cap × sun quality × goal weight
  const rawKW = solarPhysicalCapKW * sunFactor * penetration;
  return Math.round(Math.min(rawKW, solarPhysicalCapKW));
}

// =============================================================================
// GENERATOR SIZING — critical-load-driven, goal-and-intent-gated
// =============================================================================

/**
 * Compute generator capacity for a given tier.
 *
 * Returns 0 when the goal policy and Step 3 intent together do not warrant
 * including a generator.
 *
 * Base size: criticalLoadPct × peakLoadKW × reserveMargin (1.25, NEC/LADWP)
 * Source: getGeneratorReserveMarginWithSource() → benchmarkSources.ts
 */
function computeGeneratorKW(
  state: WizardState,
  goal: GoalChoice,
  tierLabel: TierLabel
): number {
  const { peakLoadKW, criticalLoadPct, step3Answers } = state;
  const guidance = GOAL_GUIDANCE[goal];

  // Read Step 3 intent. Values captured when Step 3 is built:
  //   "none"         → user doesn't want a generator
  //   "ups"          → small UPS-class backup only (handled by BESS alone)
  //   "partial"      → generator for critical circuits
  //   "full_backup"  → full facility backup
  //   "resilience"   → resilience + potential revenue (demand response)
  const generatorNeed =
    (step3Answers.generatorNeed as string | undefined) ?? "none";

  // Determine inclusion based on policy × intent
  const includeGenerator =
    guidance.generatorPolicy === "always" ||
    (guidance.generatorPolicy === "if_critical" &&
      (criticalLoadPct >= 0.50 || generatorNeed === "full_backup" || generatorNeed === "resilience")) ||
    (guidance.generatorPolicy === "if_requested" &&
      (generatorNeed === "partial" || generatorNeed === "full_backup" || generatorNeed === "resilience"));

  if (!includeGenerator) return 0;

  // Starter tier: reduce generator for save_more / save_most goals (cost focus)
  if (tierLabel === "Starter" && guidance.generatorPolicy !== "always") {
    // Only include in Starter if explicitly requested in Step 3
    if (generatorNeed === "none" || generatorNeed === "ups") return 0;
  }

  // Base size: critical load fraction of peak × NEC reserve margin
  const { margin } = getGeneratorReserveMarginWithSource(); // 1.25
  const basePowerKW = peakLoadKW * criticalLoadPct * margin;

  // Tier scaling for generator: Complete gets additional headroom
  const tierScale =
    tierLabel === "Complete"    ? 1.25 :
    tierLabel === "Starter"     ? 0.80 :
                                  1.00;

  return Math.max(10, Math.round(basePowerKW * tierScale));
}

// =============================================================================
// BESS SIZING — application-driven (Step 3), goal-weighted, always included
// =============================================================================

/** Map Step 3 primaryBESSApplication answers to benchmarkSources BESSUseCase */
const APPLICATION_TO_BESS_USE_CASE: Record<string, BESSUseCase> = {
  peak_shaving:     "peak_shaving",  // ratio: 0.40 (IEEE 4538388, MDPI 11(8):2048)
  backup_power:     "resilience",    // ratio: 0.70 (IEEE 446-1995 Orange Book)
  energy_arbitrage: "arbitrage",     // ratio: 0.50 (industry practice)
  demand_response:  "peak_shaving",  // DR uses similar sizing to peak shaving
  load_shifting:    "arbitrage",
  resilience:       "resilience",
  stacked:          "peak_shaving",  // multi-use defaults to peak shaving ratio
};

/** Infer BESS application from goal when Step 3 answer not yet captured */
function inferApplicationFromGoal(goal: GoalChoice): string {
  if (goal === "full_power") return "resilience";
  return "peak_shaving"; // save_more and save_most both default to peak shaving
}

/**
 * Compute BESS power (kW) and energy (kWh) for a given tier.
 *
 * BESS is ALWAYS included — it is the core product.
 * Ratio source: getBESSSizingRatioWithSource() → IEEE/MDPI benchmarks.
 */
function computeBESSSizing(
  state: WizardState,
  goal: GoalChoice,
  tierLabel: TierLabel,
  solarKW: number = 0,
  generatorKW: number = 0
): { bessKW: number; bessKWh: number; durationHours: number } {
  // Use peakLoadKW as sizing basis. Fall back to baseLoadKW if peak not yet set.
  const effectivePeakKW =
    state.peakLoadKW > 0 ? state.peakLoadKW : state.baseLoadKW;

  console.log(`🔋 [BESS Sizing] effectivePeakKW=${effectivePeakKW}, state.peakLoadKW=${state.peakLoadKW}, state.baseLoadKW=${state.baseLoadKW}`);

  // Application from Step 3 (or inferred from goal if not yet answered)
  const application =
    (state.step3Answers.primaryBESSApplication as string | undefined) ??
    inferApplicationFromGoal(goal);

  const bessUseCase: BESSUseCase =
    APPLICATION_TO_BESS_USE_CASE[application] ?? "peak_shaving";

  // SSOT sizing ratio (IEEE/MDPI benchmark)
  const { ratio } = getBESSSizingRatioWithSource(bessUseCase);

  // BESS power: peak × ratio × tier scale
  const bessKW = Math.max(
    75, // minimum 75 kW system (ensures adequate sizing for medium/large retail)
    Math.round(effectivePeakKW * ratio * TIER_BESS_SCALE[tierLabel])
  );

  // Duration from goal guidance
  const guidance = GOAL_GUIDANCE[goal];
  const durationHours =
    tierLabel === "Starter"     ? guidance.durationHours.starter     :
    tierLabel === "Recommended" ? guidance.durationHours.recommended :
                                  guidance.durationHours.complete;

  return {
    bessKW,
    bessKWh: Math.round(bessKW * durationHours),
    durationHours,
  };
}

// =============================================================================
// EV CHARGER KW — display field only (load already merged into peakLoadKW)
// =============================================================================

const EV_KW_BY_TYPE: Record<string, number> = {
  l2:   7.2,   // Level 2 standard (7.2 kW)
  dcfc: 150,   // DC Fast Charger (150 kW typical)
  hpc:  250,   // High Power Charger (250 kW)
};

/**
 * Total EV charger capacity in kW.
 * NOTE: This load is already incorporated into peakLoadKW via Step 3's
 * setBaseLoad() call. This field is for display isolation in the quote only.
 */
function computeEVChargerKW(state: WizardState): number {
  // Check for Step 3.5 EV charger configuration (level2Chargers + dcfcChargers)
  const stateWithEV = state as WizardState & { level2Chargers?: number; dcfcChargers?: number };
  const level2 = stateWithEV.level2Chargers ?? 0;
  const dcfc = stateWithEV.dcfcChargers ?? 0;
  
  if (level2 > 0 || dcfc > 0) {
    // Level 2: 7.2 kW each, DCFC: 150 kW each
    return Math.round((level2 * 7.2) + (dcfc * 150));
  }
  
  // Fallback to old evChargers object format
  if (!state.evChargers) return 0;
  const kWPerUnit = EV_KW_BY_TYPE[state.evChargers.type] ?? 7.2;
  return Math.round(state.evChargers.count * kWPerUnit);
}

// =============================================================================
// BUILD ONE TIER — calls calculateQuote() SSOT for a single tier
// =============================================================================

async function buildOneTier(
  state: WizardState,
  goal: GoalChoice,
  tierLabel: TierLabel,
  baseNotes: string[]
): Promise<QuoteTier> {
  const { intel, location, industry, evRevenuePerYear, solarKW, generatorKW, generatorFuelType } = state;
  const generatorEnabled = state.wantsGenerator || hasGeneratorIntent(state.step3Answers);

  // Tier scaling for configured addons (user values from Step 3.5 = Recommended baseline)
  const tierAddonScale = tierLabel === 'Starter' ? 0.70 : tierLabel === 'Complete' ? 1.30 : 1.00;

  // Scale configured addon values per tier, or compute defaults if not configured
  // User's Step 3.5 selections become the "Recommended" (100%) baseline
  const finalSolarKW = (state.wantsSolar && solarKW > 0) 
    ? Math.round(solarKW * tierAddonScale) 
    : computeSolarKW(state, goal, tierLabel);
  
  const finalGenKW = (generatorEnabled && generatorKW > 0) 
    ? Math.round(generatorKW * tierAddonScale) 
    : computeGeneratorKW(state, goal, tierLabel);
  
  const { bessKW, bessKWh, durationHours } = computeBESSSizing(state, goal, tierLabel, finalSolarKW, finalGenKW);
  const evChargerKW      = computeEVChargerKW(state);
  
  // Build EV charger details for notes
  const stateWithEV = state as WizardState & { level2Chargers?: number; dcfcChargers?: number };
  const level2 = stateWithEV.level2Chargers ?? 0;
  const dcfc = stateWithEV.dcfcChargers ?? 0;
  const evChargerDetails = level2 > 0 || dcfc > 0
    ? `${level2} Level 2 (${(level2 * 7.2).toFixed(0)} kW) + ${dcfc} DCFC (${dcfc * 150} kW)`
    : state.evChargers
    ? `${state.evChargers.count} × ${state.evChargers.type.toUpperCase()}`
    : '';

  // ── Call SSOT (calculateQuote) ──────────────────────────────────────────
  const result = await calculateQuote({
    storageSizeMW:     Math.max(0.01, bessKW / 1000),
    durationHours,
    solarMW:           finalSolarKW / 1000,
    generatorMW:       finalGenKW / 1000,
    generatorFuelType: generatorFuelType || "natural-gas",  // Use configured fuel type
    electricityRate:   intel?.utilityRate  ?? 0.15,
    demandCharge:      intel?.demandCharge ?? 15,
    zipCode:           location?.zip,
    location:          location?.state     ?? "CA",
    useCase:           industry            ?? "office",
    gridConnection:    "on-grid",
    // ITC: assume prevailing wage compliance (standard for commercial BESS ≥ 1 MW)
    itcConfig: {
      prevailingWage:  true,
      apprenticeship:  true,
    },
  });

  // ── Apply Margin Policy (CRITICAL FOR COMMERCIALIZATION) ────────────────
  const withMargin = applyMarginPolicy({
    lineItems: [
      {
        sku: 'bess-equipment',
        category: 'bess',
        description: 'Battery Energy Storage System',
        baseCost: result.costs.equipmentCost,
        quantity: 1,
        unitCost: result.costs.equipmentCost,
        unit: 'system',
        costSource: 'NREL ATB 2024',
      },
      {
        sku: 'bess-installation',
        category: 'construction_labor',
        description: 'Installation & Soft Costs',
        baseCost: result.costs.installationCost,
        quantity: 1,
        unitCost: result.costs.installationCost,
        unit: 'system',
        costSource: 'NREL ATB 2024',
      },
    ],
    totalBaseCost: result.costs.totalProjectCost,
    riskLevel: 'standard',
    customerSegment: 'direct',
  });

  // ── Assemble QuoteTier ──────────────────────────────────────────────────
  const itcRate   = result.metadata.itcDetails?.totalRate ?? 0.30;
  const grossCost = withMargin.sellPriceTotal;  // USE SELL PRICE (not base cost)
  const itcAmount = grossCost * itcRate;
  const netCost   = grossCost - itcAmount;

  // EV revenue (money from selling charging service) is additive to SSOT savings.
  // It is NOT in result.financials.annualSavings — that covers energy cost savings only.
  const annualSavings = result.financials.annualSavings + evRevenuePerYear;

  // Audit trail notes for this tier
  const tierNotes: string[] = [
    ...baseNotes,
    GOAL_GUIDANCE[goal].auditNote,
    `Tier: ${tierLabel} (BESS scale ${TIER_BESS_SCALE[tierLabel]}×)`,
    `BESS: ${bessKW} kW / ${bessKWh} kWh (${durationHours}h duration)`,
    finalSolarKW > 0
      ? `Solar: ${finalSolarKW} kW AC${state.wantsSolar && solarKW > 0 ? " (user configured)" : ` (${intel?.peakSunHours.toFixed(1)} PSH × ${finalSolarKW}/${state.solarPhysicalCapKW} kW cap)`}`
      : `Solar: excluded (${intel?.solarFeasible ? "physical cap = 0" : `grade ${intel?.solarGrade ?? "unknown"} < B-`})`,
    finalGenKW > 0
      ? `Generator: ${finalGenKW} kW${generatorEnabled && generatorKW > 0 ? ` (user configured, ${generatorFuelType})` : ` (${(state.criticalLoadPct * 100).toFixed(0)}% critical load × 1.25 reserve)`}`
      : `Generator: excluded (policy: ${GOAL_GUIDANCE[goal].generatorPolicy}, need: ${state.step3Answers.generatorNeed ?? "none"})`,
    evChargerKW > 0
      ? `EV chargers: ${evChargerKW} kW (${evChargerDetails}, already in base load)`
      : "EV chargers: none",
  ];

  return {
    label:            tierLabel,
    bessKWh,
    bessKW,
    solarKW:          finalSolarKW,
    generatorKW:      finalGenKW,
    evChargerKW,
    durationHours,
    grossCost,
    itcRate,
    itcAmount,
    netCost,
    annualSavings,
    evRevenuePerYear,
    paybackYears:     result.financials.paybackYears,
    roi10Year:        result.financials.roi10Year,
    npv:              result.financials.npv,
    notes:            tierNotes,
  };
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
export async function buildTiers(
  state: WizardState
): Promise<[QuoteTier, QuoteTier, QuoteTier]> {
  console.log('[buildTiers] Called with state:', {
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
    console.error('[buildTiers] baseLoadKW invalid:', state.baseLoadKW);
    throw new Error("buildTiers: baseLoadKW must be > 0. Ensure Step 3 is complete.");
  }
  if (!state.location) {
    console.error('[buildTiers] location missing');
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

  // Run all three tiers in parallel (each makes one calculateQuote() call)
  const [starter, recommended, complete] = await Promise.all([
    buildOneTier(state, goal, "Starter",     baseNotes),
    buildOneTier(state, goal, "Recommended", baseNotes),
    buildOneTier(state, goal, "Complete",    baseNotes),
  ]);

  return [starter, recommended, complete];
}
