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

import { calculateQuote, type QuoteInput, type QuoteResult } from "@/services/unifiedQuoteCalculator";
import type { EquipmentBreakdown } from "@/utils/equipmentCalculations";
import { getMockBehavior, delay, logMockMode } from "./mockPricingControl";

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
  /** Total CapEx (net of ITC) */
  capexUSD: number;

  /** Annual savings estimate */
  annualSavingsUSD: number;

  /** Simple payback years */
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
  "other": { ratio: 0.40, hours: 4 },
  "auto": { ratio: 0.40, hours: 4 },

  // Car wash: moderate demand spikes
  "car-wash": { ratio: 0.35, hours: 2 },
  "car_wash": { ratio: 0.35, hours: 2 },

  // Hotel: evening peak, overnight storage
  "hotel": { ratio: 0.40, hours: 4 },

  // EV Charging: high peak, short duration
  "ev-charging": { ratio: 0.60, hours: 2 },
  "ev_charging": { ratio: 0.60, hours: 2 },

  // Data center: critical load, long duration
  "datacenter": { ratio: 0.50, hours: 4 },
  "data_center": { ratio: 0.50, hours: 4 },

  // Hospital: critical, redundancy required
  "hospital": { ratio: 0.70, hours: 4 },
  "healthcare": { ratio: 0.70, hours: 4 },

  // Warehouse: low demand, cost optimization
  "warehouse": { ratio: 0.30, hours: 2 },

  // Retail: TOU arbitrage focused
  "retail": { ratio: 0.35, hours: 4 },

  // Manufacturing: demand charge focused
  "manufacturing": { ratio: 0.45, hours: 2 },

  // Gas station: EV + convenience store
  "gas-station": { ratio: 0.40, hours: 2 },

  // Airport: critical systems
  "airport": { ratio: 0.50, hours: 4 },

  // Casino: 24/7 operations
  "casino": { ratio: 0.45, hours: 4 },

  // Office: daytime peak shaving
  "office": { ratio: 0.35, hours: 4 },
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
      console.log(`🧪 [V7 Mock] Delaying pricing by ${mock.delayMs}ms (mode: ${mock.mode})`);
      await delay(mock.delayMs);
    }
    
    // Force failure if configured
    if (mock.shouldFail) {
      console.log(`🧪 [V7 Mock] Forcing pricing failure (mode: ${mock.mode})`);
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
  };

  // 4. Call SSOT calculator
  try {
    const quoteResult = await calculateQuote(quoteInput);

    // 5. Build notes from assumptions + warnings
    const notes: string[] = [
      ...(contract.assumptions ?? []),
      ...(contract.warnings ?? []).map((w) => `⚠️ ${w}`),
      `Sizing: ${ratio.toFixed(2)}x peak × ${hours}h = ${energyMWh.toFixed(2)} MWh`,
      `Pricing snapshot: ${config.snapshotId}`,
    ];

    // 6. Return unified result (success wrapper)
    return {
      ok: true as const,
      data: {
        capexUSD: quoteResult.costs.netCost,
        annualSavingsUSD: quoteResult.financials.annualSavings,
        roiYears: quoteResult.financials.paybackYears,
        breakdown: quoteResult.equipment,
        financials: quoteResult.financials,
        pricingSnapshotId: config.snapshotId,
        notes,
        sizing: {
          storageSizeMW,
          durationHours: hours,
          energyMWh,
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
    hash = ((hash << 5) - hash) + char;
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
// EXPORTS
// ============================================================================

export default runPricingQuote;
