/**
 * Pricing Sanity Checker — Math Poison Detector (Feb 1, 2026)
 * 
 * DOCTRINE:
 * - Pricing failures NEVER block navigation
 * - Bad math (NaN/Infinity/negative totals) becomes visible warnings
 * - This is a firewall, not a validator
 * 
 * We don't need perfect domain knowledge — we just prevent garbage
 * from silently shipping to the user.
 */

export type PricingSanity = {
  ok: boolean;
  warnings: string[];
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Recursively scan an object for all numeric values
 */
function scanNumbers(
  obj: unknown,
  path = "",
  out: Array<{ path: string; value: number }> = []
): Array<{ path: string; value: number }> {
  if (obj === null || obj === undefined) return out;

  if (typeof obj === "number") {
    out.push({ path: path || "(root)", value: obj });
    return out;
  }

  if (Array.isArray(obj)) {
    obj.forEach((v, i) => scanNumbers(v, `${path}[${i}]`, out));
    return out;
  }

  if (typeof obj === "object") {
    for (const k of Object.keys(obj as Record<string, unknown>)) {
      scanNumbers((obj as Record<string, unknown>)[k], path ? `${path}.${k}` : k, out);
    }
  }

  return out;
}

/**
 * Defensive sanity checks that DO NOT throw.
 * 
 * Catches:
 * - NaN/Infinity anywhere in the quote
 * - Negative totals
 * - Zero where impossible (storage size, duration)
 * 
 * Returns warnings array instead of blocking.
 */
export function sanityCheckQuote(quote: unknown): PricingSanity {
  const warnings: string[] = [];

  if (!quote || typeof quote !== "object") {
    // Empty/null quote is fine — just nothing to check
    return { ok: true, warnings: [] };
  }

  const q = quote as Record<string, unknown>;

  // 1) Poison scan — find all NaN/Infinity values
  const nums = scanNumbers(q);
  for (const { path, value } of nums) {
    if (!isFiniteNumber(value)) {
      warnings.push(`Non-finite number at ${path}: ${value}`);
    }
  }

  // 2) Common totals — validate if present (tolerate missing)
  const totalCandidates = [
    q.totalCost,
    q.capexTotal,
    q.capexUSD,
    q.netCost,
    (q.pricing as Record<string, unknown>)?.total,
    (q.pricing as Record<string, unknown>)?.capex,
    (q.summary as Record<string, unknown>)?.total,
    (q.costs as Record<string, unknown>)?.total,
  ].filter((v) => v !== undefined);

  for (const t of totalCandidates) {
    if (typeof t === "number") {
      if (!Number.isFinite(t)) warnings.push("Total cost is not finite");
      if (t < 0) warnings.push("Total cost is negative");
    }
    if (typeof t === "string" && t.toLowerCase().includes("nan")) {
      warnings.push("Total cost contains NaN string");
    }
  }

  // 3) Sanity for key inputs (if included in quote)
  const mw =
    q.storageSizeMW ??
    q.powerMW ??
    (q.inputs as Record<string, unknown>)?.storageSizeMW ??
    (q.freeze as Record<string, unknown>)?.powerMW;

  const hrs =
    q.durationHours ??
    q.hours ??
    (q.inputs as Record<string, unknown>)?.durationHours ??
    (q.freeze as Record<string, unknown>)?.hours;

  if (mw !== undefined && typeof mw === "number" && mw <= 0) {
    warnings.push(`storageSizeMW is ${mw} (expected > 0)`);
  }
  if (hrs !== undefined && typeof hrs === "number" && hrs <= 0) {
    warnings.push(`durationHours is ${hrs} (expected > 0)`);
  }

  // 4) Annual savings sanity
  const savings =
    q.annualSavingsUSD ??
    q.annualSavings ??
    (q.financials as Record<string, unknown>)?.annualSavings;

  if (savings !== undefined && typeof savings === "number") {
    if (!Number.isFinite(savings)) warnings.push("Annual savings is not finite");
    // Negative savings CAN be valid (project loses money), but warn if extreme
    if (savings < -1_000_000_000) warnings.push("Annual savings is extremely negative");
  }

  // 5) ROI sanity
  const roi = q.roiYears ?? (q.financials as Record<string, unknown>)?.paybackYears;
  if (roi !== undefined && typeof roi === "number") {
    if (!Number.isFinite(roi)) warnings.push("ROI/payback is not finite");
    if (roi < 0) warnings.push("ROI/payback is negative");
    if (roi > 100) warnings.push("ROI/payback exceeds 100 years");
  }

  return { ok: warnings.length === 0, warnings };
}

// ============================================================================
// Display Hint Types — Pre-computed display-ready data for Step 4
// ============================================================================

export type ContributorDisplay = {
  key: string;
  label: string;
  kW: number;
  pct: number;
};

export type DisplayHints = {
  /** Top 3 kW contributors, sorted by kW descending, stable order */
  topContributors: ContributorDisplay[];
  /** Number of non-zero contributors */
  contributorCount: number;
  /** Total contributor kW (for sanity display) */
  contributorTotalKW: number;
  /** Fields that were null/NaN-sanitized (for policy signal) */
  sanitizedFields: string[];
};

// ============================================================================
// DisplayQuote — The TYPED contract between sanitizeQuoteForDisplay and Step 4
// ============================================================================

/** TrueQuote validation envelope (as consumed by Step 4) */
export type DisplayTrueQuoteValidation = {
  version: string;
  dutyCycle?: number;
  kWContributors?: Record<string, number>;
  kWContributorsTotalKW?: number;
  assumptions?: string[];
};

/** Confidence breakdown (as consumed by Step 4 badge resolver) */
export type DisplayConfidence = {
  location?: string;
  industry?: string;
  overall?: string;
};

/**
 * DisplayQuote — The ONLY type Step 4 should read from.
 *
 * CONTRACT:
 *   - All `number | null` fields: null means "not available" → render "—"
 *   - All optional fields: undefined means "not included in quote"
 *   - _displayHints is ALWAYS present after sanitization
 *   - trueQuoteValidation is optional (only present for TrueQuote-tier quotes)
 *
 * Step 4 MUST NOT cast `quote.foo as number` — use `quote.foo ?? null` instead.
 */
export type DisplayQuote = {
  // --- Pricing gate ---
  pricingComplete: boolean;

  // --- Primary engineering numbers (null = render "—") ---
  peakLoadKW: number | null;
  baseLoadKW: number | null;
  bessKWh: number | null;
  bessKW: number | null;
  durationHours: number | null;

  // --- Primary money numbers (null = render "—") ---
  capexUSD: number | null;
  grossCost: number | null;          // Total project cost BEFORE ITC
  itcAmount: number | null;          // ITC credit dollar amount
  itcRate: number | null;            // ITC rate applied (e.g. 0.30)
  annualSavingsUSD: number | null;
  roiYears: number | null;
  npv: number | null;
  irr: number | null;
  paybackYears: number | null;
  demandChargeSavings: number | null;

  // --- Optional system add-ons (0 = not included, null = unknown) ---
  solarKW: number | null;
  generatorKW: number | null;

  // --- Equipment cost breakdown for unit economics (Feb 2026) ---
  equipmentCosts: {
    batteryCost: number | null;
    batteryPerKWh: number | null;
    inverterCost: number | null;
    inverterPerKW: number | null;
    transformerCost: number | null;
    switchgearCost: number | null;
    solarCost: number | null;
    solarPerWatt: number | null;
    generatorCost: number | null;
    generatorPerKW: number | null;
    installationCost: number | null;
    totalEquipmentCost: number | null;
    allInPerKW: number | null;
    allInPerKWh: number | null;
  } | null;

  // --- Confidence + validation ---
  confidence: DisplayConfidence | null;
  trueQuoteValidation: DisplayTrueQuoteValidation | null;

  // --- Metadata ---
  notes: string[];
  missingInputs: string[];

  // --- Rich metadata from SSOT (Feb 2026) ---
  metadata?: {
    itcDetails?: {
      totalRate: number;
      baseRate: number;
      creditAmount: number;
      qualifications: {
        prevailingWage: boolean;
        energyCommunity: boolean;
        domesticContent: boolean;
        lowIncome: boolean;
      };
      source: string;
    };
    utilityRates?: {
      electricityRate: number;
      demandCharge: number;
      utilityName?: string;
      rateName?: string;
      source: string;
      confidence: string;
      zipCode?: string;
      state?: string;
    };
    degradation?: {
      chemistry: string;
      yearlyCapacityPct: number[];
      year10CapacityPct: number;
      year25CapacityPct: number;
      warrantyPeriod: number;
      expectedWarrantyCapacity: number;
      financialImpactPct: number;
      source: string;
    };
    solarProduction?: {
      annualProductionKWh: number;
      capacityFactorPct: number;
      source: string;
      arrayType?: string;
      state?: string;
      monthlyProductionKWh?: number[];
    };
    advancedAnalysis?: {
      hourlySimulation?: {
        annualSavings: number;
        touArbitrageSavings: number;
        peakShavingSavings: number;
        solarSelfConsumptionSavings: number;
        demandChargeSavings: number;
        equivalentCycles: number;
        capacityFactor: number;
        source: string;
      };
      riskAnalysis?: {
        npvP10: number;
        npvP50: number;
        npvP90: number;
        irrP10: number;
        irrP50: number;
        irrP90: number;
        paybackP10: number;
        paybackP50: number;
        paybackP90: number;
        probabilityPositiveNPV: number;
        valueAtRisk95: number;
        source: string;
      };
    };
  };

  // --- Display hints (always present after sanitization) ---
  _displayHints: DisplayHints;

  // --- Overflow bucket: upstream fields we don't model yet ---
  // Constrained to a named container so Step 4 can't accidentally
  // bypass the typed boundary via quote.randomField.
  _extra?: Record<string, unknown>;
};

// Stable contributor labels (display-only)
const CONTRIBUTOR_DISPLAY_LABELS: Record<string, string> = {
  hvac: "HVAC",
  lighting: "Lighting",
  process: "Process Equipment",
  controls: "Controls & BMS",
  itLoad: "IT Load",
  cooling: "Cooling",
  charging: "EV Charging",
  other: "Other Loads",
};

function labelContributor(key: string): string {
  return CONTRIBUTOR_DISPLAY_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

/**
 * Compute display-ready top-3 contributors from kWContributors map.
 * Pure function — sorted descending by kW, stable tiebreak by key name.
 */
function computeTopContributors(
  kWContributors: Record<string, number> | undefined,
  count: number
): { top: ContributorDisplay[]; total: number; nonZeroCount: number } {
  if (!kWContributors) return { top: [], total: 0, nonZeroCount: 0 };

  const entries = Object.entries(kWContributors)
    .filter(([, v]) => typeof v === "number" && Number.isFinite(v) && v > 0)
    .sort(([kA, a], [kB, b]) => b - a || kA.localeCompare(kB)); // Stable: by kW desc, then alpha

  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) return { top: [], total: 0, nonZeroCount: 0 };

  const top = entries.slice(0, count).map(([key, kW]) => ({
    key,
    label: labelContributor(key),
    kW,
    pct: kW / total,
  }));

  return { top, total, nonZeroCount: entries.length };
}

/**
 * Empty DisplayQuote — safe default when input is null/undefined.
 * Every field is null or empty, so Step 4 renders "—" everywhere.
 */
function emptyDisplayQuote(): DisplayQuote {
  return {
    pricingComplete: false,
    peakLoadKW: null,
    baseLoadKW: null,
    bessKWh: null,
    bessKW: null,
    durationHours: null,
    capexUSD: null,
    grossCost: null,
    itcAmount: null,
    itcRate: null,
    annualSavingsUSD: null,
    roiYears: null,
    npv: null,
    irr: null,
    paybackYears: null,
    demandChargeSavings: null,
    solarKW: null,
    generatorKW: null,
    equipmentCosts: null,
    confidence: null,
    trueQuoteValidation: null,
    notes: [],
    missingInputs: [],
    metadata: undefined,
    _displayHints: {
      topContributors: [],
      contributorCount: 0,
      contributorTotalKW: 0,
      sanitizedFields: [],
    },
  };
}

/**
 * Sanitize a quote object by replacing poison values with safe defaults.
 *
 * LAST-MILE CONTRACT (Move 7):
 *   1. No NaN/Infinity — replaced with null (renders as "—")
 *   2. No silent zeros — missing values become null, not 0
 *   3. Currency-safe — all USD fields are finite or null
 *   4. Stable contributor ordering — top3 pre-computed, sorted, stable tiebreak
 *   5. displayHints attached — Step 4 reads, doesn't compute
 */
export function sanitizeQuoteForDisplay(quote: unknown): DisplayQuote {
  if (!quote || typeof quote !== "object") {
    return emptyDisplayQuote();
  }

  const q = quote as Record<string, unknown>;
  const sanitized = { ...q };
  const sanitizedFields: string[] = [];

  // ── 1. Replace NaN/Infinity with null (displayable as "—") ──
  const nums = scanNumbers(q);
  for (const { path, value } of nums) {
    if (!isFiniteNumber(value)) {
      const parts = path.split(/\.|\[|\]/).filter(Boolean);
      let current: Record<string, unknown> = sanitized;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (current[key] && typeof current[key] === "object") {
          current = current[key] as Record<string, unknown>;
        }
      }
      const lastKey = parts[parts.length - 1];
      if (lastKey && current) {
        current[lastKey] = null;
        sanitizedFields.push(path);
      }
    }
  }

  // ── 2. Zero-guard: key fields that should NEVER be silent 0 ──
  // If a value is exactly 0 and it's a "must-have" field, set to null
  // so Step 4 renders "—" instead of "$0" or "0 kW"
  const noSilentZeroFields = [
    "capexUSD", "annualSavingsUSD", "roiYears", "npv",
    "paybackYears", "bessKWh", "bessKW", "peakLoadKW",
  ];
  for (const field of noSilentZeroFields) {
    if (sanitized[field] === 0) {
      sanitized[field] = null;
      sanitizedFields.push(field);
    }
  }

  // ── 3. Negative-guard: capex and savings should not be negative ──
  if (typeof sanitized.capexUSD === "number" && sanitized.capexUSD < 0) {
    sanitized.capexUSD = null;
    sanitizedFields.push("capexUSD(negative)");
  }

  // ── 4. Compute display hints (pre-computed, stable, Step 4 reads only) ──
  const tqv = sanitized.trueQuoteValidation as Record<string, unknown> | undefined;
  const kWContributors = tqv?.kWContributors as Record<string, number> | undefined;
  const { top, total, nonZeroCount } = computeTopContributors(kWContributors, 3);

  const displayHints: DisplayHints = {
    topContributors: top,
    contributorCount: nonZeroCount,
    contributorTotalKW: total,
    sanitizedFields,
  };

  // ── 5. Build typed DisplayQuote — known fields only, extras in _extra ──
  const KNOWN_KEYS = new Set<string>([
    "pricingComplete", "peakLoadKW", "baseLoadKW", "bessKWh", "bessKW",
    "durationHours", "capexUSD", "grossCost", "itcAmount", "itcRate",
    "annualSavingsUSD", "roiYears", "npv",
    "irr", "paybackYears", "demandChargeSavings", "solarKW", "generatorKW",
    "equipmentCosts",
    "confidence", "trueQuoteValidation", "notes", "missingInputs",
    "metadata",
    "_displayHints",
  ]);

  // Collect unmodeled upstream fields into _extra
  const extra: Record<string, unknown> = {};
  for (const key of Object.keys(sanitized)) {
    if (!KNOWN_KEYS.has(key)) {
      extra[key] = sanitized[key];
    }
  }

  const result: DisplayQuote = {
    pricingComplete: (sanitized.pricingComplete as boolean) ?? false,
    peakLoadKW: sanitized.peakLoadKW as number | null ?? null,
    baseLoadKW: sanitized.baseLoadKW as number | null ?? null,
    bessKWh: sanitized.bessKWh as number | null ?? null,
    bessKW: sanitized.bessKW as number | null ?? null,
    durationHours: sanitized.durationHours as number | null ?? null,
    capexUSD: sanitized.capexUSD as number | null ?? null,
    grossCost: sanitized.grossCost as number | null ?? null,
    itcAmount: sanitized.itcAmount as number | null ?? null,
    itcRate: sanitized.itcRate as number | null ?? null,
    annualSavingsUSD: sanitized.annualSavingsUSD as number | null ?? null,
    roiYears: sanitized.roiYears as number | null ?? null,
    npv: sanitized.npv as number | null ?? null,
    irr: sanitized.irr as number | null ?? null,
    paybackYears: sanitized.paybackYears as number | null ?? null,
    demandChargeSavings: sanitized.demandChargeSavings as number | null ?? null,
    solarKW: sanitized.solarKW as number | null ?? null,
    generatorKW: sanitized.generatorKW as number | null ?? null,
    equipmentCosts: sanitized.equipmentCosts
      ? (() => {
          const ec = sanitized.equipmentCosts as Record<string, unknown>;
          const safeNum = (v: unknown): number | null =>
            typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
          return {
            batteryCost: safeNum(ec.batteryCost),
            batteryPerKWh: safeNum(ec.batteryPerKWh),
            inverterCost: safeNum(ec.inverterCost),
            inverterPerKW: safeNum(ec.inverterPerKW),
            transformerCost: safeNum(ec.transformerCost),
            switchgearCost: safeNum(ec.switchgearCost),
            solarCost: safeNum(ec.solarCost),
            solarPerWatt: safeNum(ec.solarPerWatt),
            generatorCost: safeNum(ec.generatorCost),
            generatorPerKW: safeNum(ec.generatorPerKW),
            installationCost: safeNum(ec.installationCost),
            totalEquipmentCost: safeNum(ec.totalEquipmentCost),
            allInPerKW: safeNum(ec.allInPerKW),
            allInPerKWh: safeNum(ec.allInPerKWh),
          };
        })()
      : null,
    confidence: (sanitized.confidence as DisplayConfidence) ?? null,
    trueQuoteValidation: (sanitized.trueQuoteValidation as DisplayTrueQuoteValidation) ?? null,
    notes: Array.isArray(sanitized.notes) ? sanitized.notes as string[] : [],
    missingInputs: Array.isArray(sanitized.missingInputs) ? sanitized.missingInputs as string[] : [],
    // Rich metadata — passed through without sanitization (already typed upstream)
    metadata: sanitized.metadata as DisplayQuote["metadata"] ?? undefined,
    _displayHints: displayHints,
    _extra: Object.keys(extra).length > 0 ? extra : undefined,
  };

  return result;
}
