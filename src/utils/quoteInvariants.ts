// src/utils/quoteInvariants.ts
/**
 * TrueQuote Invariant Checks (DEV-only, non-blocking)
 * ===================================================
 * 
 * Purpose:
 * - Detect unit mismatches (kW vs MW, hours vs minutes, hp vs kW)
 * - Catch configuration bugs (baseLoad > peakLoad, negative values)
 * - Validate financial sanity (no negative capex, ROI, etc.)
 * 
 * These run in DEV mode only and attach to QuoteOutput.invariantIssues.
 * They do NOT block navigation - they light up problems in debug panel.
 * 
 * Created: February 3, 2026
 */

export type QuoteInvariantIssue = {
  code: string;
  message: string;
  severity: "warn" | "error";
  data?: Record<string, unknown>;
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Check load profile invariants
 * 
 * Catches:
 * - Missing base/peak load
 * - NaN/Infinity values
 * - Negative kW (unit bug)
 * - Base > Peak (logic bug)
 * - Unusually high values (unit mismatch: hp treated as kW, MW as kW, etc.)
 */
export function checkLoadInvariants(load: {
  baseLoadKW?: number | null;
  peakLoadKW?: number | null;
  energyKWhPerDay?: number | null;
}): QuoteInvariantIssue[] {
  const issues: QuoteInvariantIssue[] = [];
  const base = load.baseLoadKW ?? null;
  const peak = load.peakLoadKW ?? null;
  const kwh = load.energyKWhPerDay ?? null;

  // Critical errors (missing/invalid data)
  if (base == null || peak == null) {
    issues.push({
      severity: "error",
      code: "LOAD_MISSING",
      message: "Load profile missing base/peak.",
      data: { base, peak },
    });
    return issues;
  }

  if (!isFiniteNumber(base) || !isFiniteNumber(peak)) {
    issues.push({
      severity: "error",
      code: "LOAD_NAN",
      message: "Load profile contains NaN/Infinity.",
      data: { base, peak },
    });
  }

  if (base < 0 || peak < 0) {
    issues.push({
      severity: "error",
      code: "LOAD_NEGATIVE",
      message: "Negative kW in load profile (unit/config bug).",
      data: { base, peak },
    });
  }

  if (base > peak) {
    issues.push({
      severity: "error",
      code: "BASE_GT_PEAK",
      message: "Base load exceeds peak load (logic bug).",
      data: { base, peak },
    });
  }

  if (kwh != null && isFiniteNumber(kwh) && kwh < 0) {
    issues.push({
      severity: "error",
      code: "KWH_NEGATIVE",
      message: "Negative kWh/day (logic bug).",
      data: { kwh },
    });
  }

  // Soft sanity warnings (tune per industry later)
  if (peak > 5000) {
    issues.push({
      severity: "warn",
      code: "PEAK_HUGE",
      message: "Peak load > 5,000 kW (>5 MW). Possible unit mismatch (hp→kW or MW→kW).",
      data: { peak },
    });
  }

  if (kwh != null && isFiniteNumber(kwh) && kwh > 200000) {
    issues.push({
      severity: "warn",
      code: "KWH_HUGE",
      message: "Energy/day > 200,000 kWh. Check throughput/unit conversion.",
      data: { kwh },
    });
  }

  // Ratio sanity: if base is > 90% of peak, might indicate missing diversity or wrong load factor
  if (isFiniteNumber(base) && isFiniteNumber(peak) && peak > 0 && base / peak > 0.9) {
    issues.push({
      severity: "warn",
      code: "LOAD_FACTOR_HIGH",
      message: "Base load is >90% of peak. Check load diversity assumptions.",
      data: { base, peak, ratio: (base / peak).toFixed(2) },
    });
  }

  return issues;
}

/**
 * Check pricing/financial invariants
 * 
 * Catches:
 * - NaN/Infinity in financial metrics
 * - Negative capex (impossible)
 * - Negative ROI years (logic bug)
 * - Negative savings (warning - might be valid but suspicious)
 */
export function checkPricingInvariants(fin: {
  capexUSD?: number | null;
  annualSavingsUSD?: number | null;
  roiYears?: number | null;
  npvUSD?: number | null;
  irrPct?: number | null;
}): QuoteInvariantIssue[] {
  const issues: QuoteInvariantIssue[] = [];

  // Check for NaN/Infinity in any metric
  for (const [k, v] of Object.entries(fin)) {
    if (v == null) continue;
    if (!isFiniteNumber(v)) {
      issues.push({
        severity: "error",
        code: "FIN_NAN",
        message: `Financial metric ${k} is NaN/Infinity`,
        data: { [k]: v },
      });
    }
  }

  const { capexUSD, annualSavingsUSD, roiYears, npvUSD: _npvUSD, irrPct } = fin;

  // Critical errors
  if (capexUSD != null && isFiniteNumber(capexUSD) && capexUSD < 0) {
    issues.push({ 
      severity: "error", 
      code: "CAPEX_NEG", 
      message: "CapEx is negative (impossible).", 
      data: { capexUSD } 
    });
  }

  if (roiYears != null && isFiniteNumber(roiYears) && roiYears < 0) {
    issues.push({ 
      severity: "error", 
      code: "ROI_NEG", 
      message: "ROI years is negative (logic bug).", 
      data: { roiYears } 
    });
  }

  // Warnings (suspicious but not impossible)
  if (annualSavingsUSD != null && isFiniteNumber(annualSavingsUSD) && annualSavingsUSD < 0) {
    issues.push({ 
      severity: "warn", 
      code: "SAVINGS_NEG", 
      message: "Annual savings is negative. Check electricity rate or demand charges.", 
      data: { annualSavingsUSD } 
    });
  }

  if (roiYears != null && isFiniteNumber(roiYears) && roiYears > 50) {
    issues.push({ 
      severity: "warn", 
      code: "ROI_LONG", 
      message: "ROI > 50 years. Project likely not viable.", 
      data: { roiYears } 
    });
  }

  if (irrPct != null && isFiniteNumber(irrPct) && irrPct < 0) {
    issues.push({ 
      severity: "warn", 
      code: "IRR_NEG", 
      message: "IRR is negative. Check savings assumptions.", 
      data: { irrPct } 
    });
  }

  return issues;
}

/**
 * Format invariant issues for display (debug panel, logs)
 */
export function formatInvariantIssues(issues: QuoteInvariantIssue[]): string {
  if (issues.length === 0) return "✅ All invariants OK";
  
  return issues.map(i => {
    const icon = i.severity === "error" ? "❌" : "⚠️";
    return `${icon} ${i.code}: ${i.message}`;
  }).join("\n");
}

/**
 * Count issues by severity (for quick checks)
 */
export function countIssues(issues: QuoteInvariantIssue[]): { errors: number; warnings: number } {
  return {
    errors: issues.filter(i => i.severity === "error").length,
    warnings: issues.filter(i => i.severity === "warn").length,
  };
}
