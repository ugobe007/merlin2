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

/**
 * Sanitize a quote object by replacing poison values with safe defaults.
 * Use this when you need to render something even if math is broken.
 */
export function sanitizeQuoteForDisplay(quote: unknown): Record<string, unknown> {
  if (!quote || typeof quote !== "object") {
    return {};
  }

  const q = quote as Record<string, unknown>;
  const sanitized = { ...q };

  // Replace NaN/Infinity with null (displayable as "—" or "N/A")
  const nums = scanNumbers(q);
  for (const { path, value } of nums) {
    if (!isFiniteNumber(value)) {
      // Navigate to the path and replace
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
      }
    }
  }

  return sanitized;
}
