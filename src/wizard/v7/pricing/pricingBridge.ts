/**
 * PRICING BRIDGE (V7 SSOT Layer B)
 * ================================
 *
 * Created: February 3, 2026
 *
 * PURPOSE:
 * ========
 * This is the SINGLE bridge between load calculations (Layer A) and financial outputs.
 * Layer A: runContractQuote() → LoadProfile (physics + constraints, pricing-agnostic)
 * Layer B: runPricingQuote() → Financial metrics (pricing-frozen, SSOT-compliant)
 *
 * DOCTRINE:
 * - LoadProfile is deterministic + explainable (no pricing)
 * - Pricing is computed exactly ONCE from LoadProfile + PricingConfig
 * - All UI (Step 4, Advisor, Export) reads from the same PricingQuoteResult
 * - pricingSnapshotId anchors the freeze (no silent drift)
 *
 * SSOT CALLS:
 * - calculateQuote() from unifiedQuoteCalculator.ts (equipment + financials)
 * - calculateEquipmentBreakdown() for line-item breakdown
 * - calculateFinancialMetrics() for NPV/IRR/payback
 *
 * MOCK CONTROL (DEV/TEST ONLY):
 * - ?mockPricing=fail|slow|slow_timeout|ok
 * - localStorage.setItem("V7_MOCK_PRICING", "fail")
 */

import {
  calculateQuote,
  type QuoteInput,
  type QuoteResult,
} from "@/services/unifiedQuoteCalculator";
import type { EquipmentBreakdown } from "@/utils/equipmentCalculations";
import { getMockBehavior, delay, logMockMode } from "./mockPricingControl";
import { estimateITC } from "@/services/itcCalculator";
import { devLog, devWarn } from '../debug/devLog';

// ─── MARGIN POLICY ENGINE (Feb 2026) ───
// This is how Merlin makes money. Every quote must include margin.
import {
  applyMarginPolicy,
  type MarginPolicyInput,
  type MarginQuoteResult,
  type ProductClass,
} from "@/services/marginPolicyEngine";
import { supabase } from "@/services/supabaseClient";

// ============================================================================
// TYPES — Layer A (Load Profile)
// ============================================================================

/**
 * Output from runContractQuote() — physics + load profile only
 * This is the "Layer A" output that feeds into pricing.
 */
export interface ContractQuoteResult {
  /** Load profile from 16Q calculator */
  loadProfile: {
    baseLoadKW: number;
    peakLoadKW: number;
    energyKWhPerDay?: number;
  };

  /** Raw calculator output (industry-specific details) */
  raw?: unknown;

  /** Assumptions made by calculator */
  assumptions?: string[];

  /** Warnings about input quality */
  warnings?: string[];

  /** SSOT sizing hints (derived from industry or user config) */
  sizingHints: {
    /** BESS-to-peak ratio (e.g., 0.4 for peak shaving) */
    storageToPeakRatio: number;
    /** Duration hours (e.g., 4 for commercial) */
    durationHours: number;
    /** Source of sizing hints */
    source: "industry-default" | "user-config" | "template";
  };

  /** Inputs used for pricing (preserved for freeze) */
  inputsUsed: {
    electricityRate?: number;
    demandCharge?: number;
    location: {
      state?: string;
      zip?: string;
      city?: string;
    };
    industry: string;
    gridMode?: string;

    // System add-ons (Step 4 configuration → feeds into SSOT calculateQuote)
    solarMW?: number;
    generatorMW?: number;
    generatorFuelType?: "natural-gas" | "diesel" | "dual-fuel";
    windMW?: number;
  };
}

// ============================================================================
// TYPES — Layer B (Pricing)
// ============================================================================

/**
 * Configuration for pricing calculation
 */
export interface PricingConfig {
  /** Snapshot ID for pricing freeze (prevents silent drift) */
  snapshotId: string;

  /** Override sizing ratio (if user configured in Step 4) */
  storageToPeakRatioOverride?: number;

  /** Override duration (if user configured in Step 4) */
  durationHoursOverride?: number;

  /** Include advanced analysis (8760 + Monte Carlo) */
  includeAdvancedAnalysis?: boolean;
}

/**
 * Output from runPricingQuote() — financial metrics + breakdown
 */
export interface PricingQuoteData {
  /** Total CapEx (net of ITC) — THIS IS THE SELL PRICE (includes Merlin margin) */
  capexUSD: number;

  /** Total project cost BEFORE ITC (gross) — sell price before tax credit */
  grossCost: number;

  /** Base cost (before margin) for internal reference */
  baseCost: number;

  /** ITC credit dollar amount */
  itcAmount: number;

  /** ITC rate applied (e.g. 0.30 = 30%) from IRA 2022 calculator */
  itcRate: number;

  /** Annual savings estimate */
  annualSavingsUSD: number;

  /** Simple payback years (based on sell price) */
  roiYears: number;

  /** Equipment line-item breakdown */
  breakdown: EquipmentBreakdown;

  /** Full financial metrics (NPV, IRR, etc.) */
  financials: QuoteResult["financials"];

  /** Pricing freeze anchor ID */
  pricingSnapshotId: string;

  /** Audit trail notes */
  notes: string[];

  /** System sizing used */
  sizing: {
    storageSizeMW: number;
    durationHours: number;
    energyMWh: number;
  };

  /** ─── MARGIN POLICY (Feb 2026) ─── */
  margin: {
    /** Sell price total (customer sees this) */
    sellPriceTotal: number;
    /** Base cost total (SSOT market cost) */
    baseCostTotal: number;
    /** Margin dollars (profit) */
    marginDollars: number;
    /** Blended margin percent */
    marginPercent: number;
    /** Margin band applied */
    marginBand: string;
    /** Policy version */
    policyVersion: string;
    /** Whether human review is needed */
    needsReview: boolean;
    /** Warnings from margin engine */
    warnings: string[];
  };
}

/**
 * Result wrapper for pricing calculation
 * Supports both success and error paths for non-blocking flow.
 */
export type PricingQuoteResult =
  | { ok: true; data: PricingQuoteData; error?: undefined }
  | { ok: false; error: string; data?: undefined };

// ============================================================================
// TYPES — Combined SSOT Object
// ============================================================================

/**
 * Unified quote SSOT for the entire wizard
 * Step 4, Advisor, Export all read from this single object.
 */
export interface WizardQuoteSSOT {
  /** Layer A: Load profile (always present if quote attempted) */
  contract: ContractQuoteResult | null;

  /** Layer B: Pricing (present when pricing completes) */
  pricing: PricingQuoteResult | null;

  /** FSM status */
  status: "idle" | "load-calculating" | "pricing" | "ready" | "error";

  /** Error message if status === "error" */
  error?: string;

  /** Timestamp of last computation */
  computedAt?: string;
}

// ============================================================================
// SIZING RATIOS (SSOT Defaults by Industry)
// ============================================================================

/**
 * Default BESS sizing ratios by industry
 * Source: NREL ATB 2024, industry practice
 *
 * storageToPeakRatio = BESS power (MW) / Peak load (MW)
 * durationHours = Energy storage hours
 */
const INDUSTRY_SIZING_DEFAULTS: Record<string, { ratio: number; hours: number }> = {
  // Commercial (default)
  other: { ratio: 0.4, hours: 4 },
  auto: { ratio: 0.4, hours: 4 },

  // Car wash: moderate demand spikes
  "car-wash": { ratio: 0.35, hours: 2 },
  car_wash: { ratio: 0.35, hours: 2 },

  // Hotel: evening peak, overnight storage
  hotel: { ratio: 0.4, hours: 4 },

  // EV Charging: high peak, short duration
  "ev-charging": { ratio: 0.6, hours: 2 },
  ev_charging: { ratio: 0.6, hours: 2 },

  // Data center: critical load, long duration
  datacenter: { ratio: 0.5, hours: 4 },
  data_center: { ratio: 0.5, hours: 4 },

  // Hospital: critical, redundancy required
  hospital: { ratio: 0.7, hours: 4 },
  healthcare: { ratio: 0.7, hours: 4 },

  // Warehouse: TOU arbitrage + peak shaving
  warehouse: { ratio: 0.3, hours: 4 },

  // Retail: TOU arbitrage focused
  retail: { ratio: 0.35, hours: 4 },

  // Manufacturing: NREL C&I standard + TOU arbitrage
  manufacturing: { ratio: 0.45, hours: 4 },

  // Gas station: EV + convenience store
  "gas-station": { ratio: 0.4, hours: 2 },

  // Truck stop: larger BESS for fleet charging + amenities
  "truck-stop": { ratio: 0.5, hours: 4 },

  // Airport: critical systems
  airport: { ratio: 0.5, hours: 4 },

  // Casino: 24/7 operations
  casino: { ratio: 0.45, hours: 4 },

  // Office: daytime peak shaving
  office: { ratio: 0.35, hours: 4 },

  // Restaurant: commercial load profile
  restaurant: { ratio: 0.4, hours: 4 },

  // College/University: campus operations
  college: { ratio: 0.4, hours: 4 },

  // Apartment: multifamily residential
  apartment: { ratio: 0.35, hours: 4 },

  // Residential: single-family
  residential: { ratio: 0.3, hours: 4 },

  // Cold storage: high continuous load
  "cold-storage": { ratio: 0.5, hours: 4 },

  // Indoor farm: grow lights + HVAC
  "indoor-farm": { ratio: 0.4, hours: 4 },

  // Agriculture: irrigation + processing
  agriculture: { ratio: 0.35, hours: 4 },

  // Government: office-like + critical ops
  government: { ratio: 0.4, hours: 4 },

  // Shopping center / mall: multi-tenant peak shaving
  "shopping-center": { ratio: 0.4, hours: 4 },
  shopping_center: { ratio: 0.4, hours: 4 },

  // Microgrid: islanding + resilience
  microgrid: { ratio: 0.6, hours: 4 },
  "micro-grid": { ratio: 0.6, hours: 4 },
};

/**
 * Get sizing defaults for an industry
 */
export function getSizingDefaults(industry: string): { ratio: number; hours: number } {
  const normalized = industry.toLowerCase().replace(/_/g, "-");
  return INDUSTRY_SIZING_DEFAULTS[normalized] ?? INDUSTRY_SIZING_DEFAULTS["other"];
}

// ============================================================================
// PRICING BRIDGE FUNCTION
// ============================================================================

/**
 * Run pricing calculation from load profile
 *
 * This is the SINGLE entry point for converting LoadProfile → Financial metrics.
 * All UI components read from the returned PricingQuoteResult.
 *
 * MOCK CONTROL (DEV ONLY):
 * - ?mockPricing=fail → Returns error immediately
 * - ?mockPricing=slow → Delays 3s (test race conditions)
 * - ?mockPricing=slow_timeout → Delays 20s (force timeout)
 *
 * @param contract - Layer A output (load profile + sizing hints)
 * @param config - Pricing configuration (snapshot ID, overrides)
 * @returns PricingQuoteResult with all financial metrics
 */
export async function runPricingQuote(
  contract: ContractQuoteResult,
  config: PricingConfig
): Promise<PricingQuoteResult> {
  // =========================================================================
  // MOCK CONTROL (DEV/TEST ONLY)
  // =========================================================================
  if (import.meta.env.DEV) {
    logMockMode();
    const mock = getMockBehavior();

    // Apply delay if configured
    if (mock.delayMs > 0) {
      devLog(`🧪 [V7 Mock] Delaying pricing by ${mock.delayMs}ms (mode: ${mock.mode})`);
      await delay(mock.delayMs);
    }

    // Force failure if configured
    if (mock.shouldFail) {
      devLog(`🧪 [V7 Mock] Forcing pricing failure (mode: ${mock.mode})`);
      return {
        ok: false as const,
        error: `Mock pricing failure (mode: ${mock.mode})`,
      };
    }
  }

  // =========================================================================
  // REAL PRICING LOGIC
  // =========================================================================

  // 1. Determine sizing (config override > contract hints)
  const ratio = config.storageToPeakRatioOverride ?? contract.sizingHints.storageToPeakRatio;
  const hours = config.durationHoursOverride ?? contract.sizingHints.durationHours;

  // 2. Calculate system size from load profile
  const peakKW = contract.loadProfile.peakLoadKW;
  const storageSizeMW = (peakKW / 1000) * ratio;
  const energyMWh = storageSizeMW * hours;

  // 3. Build SSOT quote input
  const quoteInput: QuoteInput = {
    storageSizeMW: Math.max(0.1, storageSizeMW), // Minimum 100 kW
    durationHours: hours,
    location: contract.inputsUsed.location.state,
    zipCode: contract.inputsUsed.location.zip,
    electricityRate: contract.inputsUsed.electricityRate,
    demandCharge: contract.inputsUsed.demandCharge,
    useCase: contract.inputsUsed.industry,
    gridConnection: mapGridMode(contract.inputsUsed.gridMode),
    includeAdvancedAnalysis: config.includeAdvancedAnalysis,
    // System add-ons (from Step 4 configuration)
    solarMW: contract.inputsUsed.solarMW,
    generatorMW: contract.inputsUsed.generatorMW,
    generatorFuelType: contract.inputsUsed.generatorFuelType,
    windMW: contract.inputsUsed.windMW,
  };

  // 4. Call SSOT calculator
  try {
    const quoteResult = await calculateQuote(quoteInput);

    // ═══════════════════════════════════════════════════════════════════════
    // 4b. APPLY MARGIN POLICY (Feb 2026)
    // This is how Merlin makes money. Every quote must include margin.
    // Market cost → Obtainable cost → Sell price (customer sees this)
    // ═══════════════════════════════════════════════════════════════════════
    const marginResult = applyMarginToQuote(quoteResult, energyMWh, {
      gridMode: contract.inputsUsed.gridMode,
    });

    // Adjust costs with margin applied
    const sellPriceTotal = marginResult.sellPriceTotal;
    const baseCostTotal = marginResult.baseCostTotal;

    // Dynamic ITC calculation per IRA 2022 (replaces hardcoded 0.30)
    const hasSolar = (contract.inputsUsed.solarMW ?? 0) > 0;
    const itcProjectType = hasSolar ? "hybrid" as const : "bess" as const;
    const itcEstimate = estimateITC(itcProjectType, sellPriceTotal, storageSizeMW, true);
    const itcRate = itcEstimate.totalRate;
    const itcAmount = sellPriceTotal * itcRate;
    const grossCost = sellPriceTotal;
    const netCost = grossCost - itcAmount;

    // 5. Build notes from assumptions + warnings
    const notes: string[] = [
      ...(contract.assumptions ?? []),
      ...(contract.warnings ?? []).map((w) => `⚠️ ${w}`),
      `Sizing: ${ratio.toFixed(2)}x peak × ${hours}h = ${energyMWh.toFixed(2)} MWh`,
      `Pricing snapshot: ${config.snapshotId}`,
      `Margin: ${marginResult.marginBandDescription} (${(marginResult.blendedMarginPercent * 100).toFixed(1)}%)`,
      `ITC: ${(itcRate * 100).toFixed(0)}% (${itcEstimate.notes.join('; ')})`,
    ];

    // Recalculate payback with sell price
    const annualSavings = quoteResult.financials.annualSavings;
    const adjustedPayback = annualSavings > 0 ? netCost / annualSavings : 99;

    // 6. Log margin audit (async, non-blocking)
    logMarginAudit(marginResult, config.snapshotId, contract.inputsUsed.industry).catch(() => {});

    // 7. Return unified result (success wrapper)
    return {
      ok: true as const,
      data: {
        capexUSD: netCost,
        grossCost,
        baseCost: baseCostTotal,
        itcAmount,
        itcRate,
        annualSavingsUSD: annualSavings,
        roiYears: Math.min(adjustedPayback, 99),
        breakdown: quoteResult.equipment,
        financials: quoteResult.financials,
        pricingSnapshotId: config.snapshotId,
        notes,
        sizing: {
          storageSizeMW,
          durationHours: hours,
          energyMWh,
        },
        margin: {
          sellPriceTotal: marginResult.sellPriceTotal,
          baseCostTotal: marginResult.baseCostTotal,
          marginDollars: marginResult.totalMarginDollars,
          marginPercent: marginResult.blendedMarginPercent,
          marginBand: marginResult.marginBandDescription,
          policyVersion: marginResult.policyVersion,
          needsReview: marginResult.needsHumanReview,
          warnings: marginResult.quoteLevelWarnings,
        },
      },
    };
  } catch (err) {
    // Return error wrapper (non-blocking)
    const errMsg = (err as { message?: string })?.message ?? "SSOT calculator failed";
    return {
      ok: false as const,
      error: errMsg,
    };
  }
}

/**
 * Map grid mode from V7 internal format to SSOT format
 */
function mapGridMode(
  mode?: string
): "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive" | undefined {
  if (!mode) return "on-grid";
  const normalized = mode.toLowerCase().replace(/_/g, "-");
  if (normalized === "grid-tied" || normalized === "on-grid") return "on-grid";
  if (normalized === "islanded" || normalized === "off-grid") return "off-grid";
  if (normalized === "hybrid" || normalized === "limited") return "limited";
  return "on-grid";
}

// ============================================================================
// SNAPSHOT ID GENERATOR — DETERMINISTIC (Model 1)
// ============================================================================

/**
 * Generate a DETERMINISTIC pricing snapshot ID.
 *
 * MODEL: Same inputs → same snapshot ID.
 *
 * This allows:
 * - Equality check to infer "same freeze" without deep compare
 * - Replay/forensics from ID alone
 * - UI label: "Pricing Snapshot" (not "Quote Run")
 *
 * If you need a per-run trace ID, use sessionId or requestKey separately.
 *
 * @param inputs - The inputs that define the pricing snapshot
 * @returns Deterministic snapshot ID (same inputs → same ID)
 */
export function generatePricingSnapshotId(inputs: {
  peakLoadKW: number;
  storageToPeakRatio: number;
  durationHours: number;
  industry: string;
  state?: string;
  electricityRate?: number;
}): string {
  // Round to reduce floating-point variance
  const keyParts = [
    Math.round(inputs.peakLoadKW * 10), // 1 decimal precision
    Math.round(inputs.storageToPeakRatio * 100), // 2 decimal precision
    inputs.durationHours,
    inputs.industry.toLowerCase(),
    inputs.state?.toUpperCase() ?? "XX",
    Math.round((inputs.electricityRate ?? 0.12) * 1000), // 3 decimal precision
  ];

  // Simple deterministic hash
  const str = keyParts.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Format: snap_<hash>_<date> (date for human readability, hash for determinism)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `snap_${Math.abs(hash).toString(36)}_${dateStr}`;
}

/**
 * Generate a per-run trace ID (for logging/debugging, not freeze equality)
 */
export function generatePricingRunId(): string {
  const now = new Date();
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const rand = Math.random().toString(16).slice(2, 6);
  return `run_${time}_${rand}`;
}

// ============================================================================
// MARGIN HELPERS — Build line items from SSOT quote and apply margin
// ============================================================================

/**
 * Build margin policy line items from SSOT QuoteResult equipment breakdown
 * and apply the margin policy engine.
 */
export function applyMarginToQuote(
  quoteResult: QuoteResult,
  energyMWh: number,
  context?: {
    /** Grid reliability from wizard state — maps to risk level */
    gridMode?: string;
    /** User segment from auth — 'epc_partner', 'government', 'direct' */
    customerSegment?: string;
  }
): MarginQuoteResult {
  const eq = quoteResult.equipment;
  const lineItems: MarginPolicyInput["lineItems"] = [];

  // ─── Battery (BESS) ───
  if (eq.batteries && eq.batteries.totalCost > 0) {
    lineItems.push({
      sku: "bess-battery-pack",
      category: "bess" as ProductClass,
      description: `Battery Storage (${(energyMWh * 1000).toFixed(0)} kWh)`,
      baseCost: eq.batteries.totalCost,
      quantity: energyMWh * 1000, // kWh
      unitCost: eq.batteries.totalCost / Math.max(1, energyMWh * 1000),
      unit: "kWh",
      costSource: "SSOT unifiedQuoteCalculator",
    });
  }

  // ─── Inverter/PCS ───
  if (eq.inverters && eq.inverters.totalCost > 0) {
    const invQty = eq.inverters.quantity || 1;
    const invKW = (eq.inverters.unitPowerMW || 0) * 1000;
    lineItems.push({
      sku: "inverter-pcs",
      category: "inverter_pcs" as ProductClass,
      description: `Inverter/PCS (${invQty} × ${invKW.toFixed(0)} kW)`,
      baseCost: eq.inverters.totalCost,
      quantity: invQty,
      unitCost: eq.inverters.unitCost || eq.inverters.totalCost,
      unit: "unit",
      costSource: "SSOT equipmentCalculations",
    });
  }

  // ─── Transformer ───
  if (eq.transformers && eq.transformers.totalCost > 0) {
    const xfmrMVA = eq.transformers.unitPowerMVA || 0;
    lineItems.push({
      sku: "transformer",
      category: "transformer" as ProductClass,
      description: `Transformer (${(xfmrMVA * 1000).toFixed(0)} kVA)`,
      baseCost: eq.transformers.totalCost,
      quantity: eq.transformers.quantity || 1,
      unitCost: eq.transformers.unitCost || eq.transformers.totalCost,
      unit: "unit",
      costSource: "SSOT equipmentCalculations",
    });
  }

  // ─── Switchgear ───
  if (eq.switchgear && eq.switchgear.totalCost > 0) {
    lineItems.push({
      sku: "switchgear",
      category: "bess" as ProductClass, // No switchgear ProductClass, use bess
      description: `Switchgear (${eq.switchgear.type || "MV"})`,
      baseCost: eq.switchgear.totalCost,
      quantity: eq.switchgear.quantity || 1,
      unitCost: eq.switchgear.unitCost || eq.switchgear.totalCost,
      unit: "unit",
      costSource: "SSOT equipmentCalculations",
    });
  }

  // ─── Solar ───
  if (eq.solar && eq.solar.totalCost > 0) {
    const solarMW = eq.solar.totalMW || 0;
    lineItems.push({
      sku: "solar-array",
      category: "solar" as ProductClass,
      description: `Solar Array (${solarMW.toFixed(2)} MW)`,
      baseCost: eq.solar.totalCost,
      quantity: solarMW * 1_000_000, // Watts
      unitCost: eq.solar.totalCost / Math.max(1, solarMW * 1_000_000),
      unit: "W",
      costSource: "SSOT equipmentCalculations",
    });
  }

  // ─── Generator ───
  if (eq.generators && eq.generators.totalCost > 0) {
    const genMW = eq.generators.unitPowerMW || 0;
    lineItems.push({
      sku: "generator",
      category: "generator" as ProductClass,
      description: `Generator (${genMW.toFixed(2)} MW, ${eq.generators.fuelType || "natural-gas"})`,
      baseCost: eq.generators.totalCost,
      quantity: genMW * 1000, // kW
      unitCost: eq.generators.costPerKW || eq.generators.totalCost / Math.max(1, genMW * 1000),
      unit: "kW",
      costSource: "SSOT equipmentCalculations",
    });
  }

  // ─── Installation / Labor (from costs) ───
  const installationCost = quoteResult.costs.installationCost || 0;
  if (installationCost > 0) {
    lineItems.push({
      sku: "installation-labor",
      category: "construction_labor" as ProductClass,
      description: "Installation & Commissioning",
      baseCost: installationCost,
      quantity: 1,
      unitCost: installationCost,
      unit: "project",
      costSource: "SSOT unifiedQuoteCalculator",
    });
  }

  // If no line items were built (edge case), create a single BESS catch-all
  if (lineItems.length === 0) {
    lineItems.push({
      sku: "bess-system-complete",
      category: "bess" as ProductClass,
      description: "Complete BESS System",
      baseCost: quoteResult.costs.totalProjectCost,
      quantity: energyMWh * 1000,
      unitCost: quoteResult.costs.totalProjectCost / Math.max(1, energyMWh * 1000),
      unit: "kWh",
      costSource: "SSOT unifiedQuoteCalculator (fallback)",
    });
  }

  const totalBaseCost = lineItems.reduce((sum, item) => sum + item.baseCost, 0);

  // Apply margin policy
  // Risk level: derived from grid mode (off-grid/islanded = higher risk)
  const riskLevel = (() => {
    const grid = context?.gridMode?.toLowerCase().replace(/_/g, "-") ?? "";
    if (grid === "off-grid" || grid === "islanded") return "high_complexity" as const;
    if (grid === "limited" || grid === "hybrid") return "elevated" as const;
    return "standard" as const;
  })();

  // Customer segment: from user profile or default to 'direct'
  const customerSegment = (context?.customerSegment ?? "direct") as
    | "direct" | "epc_partner" | "government" | "strategic";

  const marginInput: MarginPolicyInput = {
    lineItems,
    totalBaseCost,
    riskLevel,
    customerSegment,
    quoteUnits: {
      bess: energyMWh * 1000, // kWh for quote-level guards
    },
  };

  return applyMarginPolicy(marginInput);
}

/**
 * Log margin application to audit trail (async, non-blocking)
 * Writes to margin_audit_log table for compliance tracking.
 */
async function logMarginAudit(
  result: MarginQuoteResult,
  snapshotId: string,
  industry: string
): Promise<void> {
  try {
    // margin_audit_log may not be in generated Supabase types yet — use rpc or cast
    await (supabase as any).from("margin_audit_log").insert({
      snapshot_id: snapshotId,
      industry,
      base_cost_total: result.baseCostTotal,
      sell_price_total: result.sellPriceTotal,
      margin_dollars: result.totalMarginDollars,
      margin_percent: result.blendedMarginPercent,
      margin_band_id: result.marginBandId,
      policy_version: result.policyVersion,
      line_item_count: result.lineItems.length,
      clamp_events: result.clampEvents.length,
      needs_review: result.needsHumanReview,
      warnings: result.quoteLevelWarnings,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking — log failure but don't break the quote
    devWarn("[MarginAudit] Failed to log audit:", (err as Error)?.message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default runPricingQuote;
