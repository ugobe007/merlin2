/**
 * DETERMINISTIC BADGE RESOLVER — Step 4 reads, doesn't decide.
 *
 * Input:  pricingStatus, templateMode, quote (envelope confidence + validation)
 * Output: { tier, label } — three possible values, no ambiguity.
 *
 * Extracted from Step6ResultsV7.tsx (Feb 2026 — bloat decomposition)
 */

import type { PricingStatus } from "@/wizard/v7/hooks/useWizardV7";

// ============================================================================
// BADGE TYPES & RESOLVER
// ============================================================================

export type BadgeTier = "truequote" | "estimate" | "load-only";
export type BadgeResult = { tier: BadgeTier; label: string };

export function resolveBadge(
  pricingStatus: PricingStatus,
  templateMode: "industry" | "fallback",
  quote: Record<string, unknown> | null
): BadgeResult {
  // Gate 1: Pricing not ready → Load Profile Only
  if (pricingStatus !== "ok" || !quote?.pricingComplete) {
    return { tier: "load-only", label: "Load Profile Only — Financial calculations pending" };
  }

  // Gate 2: Fallback template or confidence → Estimate
  if (templateMode === "fallback") {
    return { tier: "estimate", label: "Estimate — General facility model" };
  }
  const confidence = quote.confidence as Record<string, unknown> | undefined;
  if (confidence?.industry === "fallback") {
    return { tier: "estimate", label: "Estimate — General facility model" };
  }

  // Gate 3: TrueQuote validation present and meaningful
  const tqv = quote.trueQuoteValidation as Record<string, unknown> | undefined;
  if (tqv?.version === "v1") {
    const contributors = tqv.kWContributors as Record<string, number> | undefined;
    const nonZeroCount = contributors
      ? Object.values(contributors).filter((v) => typeof v === "number" && v > 0).length
      : 0;
    if (nonZeroCount >= 3) {
      return { tier: "truequote", label: "✓ TrueQuote™ Complete" };
    }
  }

  // Default: Estimate (safe — prefer under-claiming)
  return { tier: "estimate", label: "Estimate — Partial validation" };
}

// ============================================================================
// CONTRIBUTOR HELPERS — Pure display formatting for "Why this size?" drawer
// ============================================================================

export type ContributorEntry = { key: string; kW: number; pct: number };

export function getTopContributors(
  kWContributors: Record<string, number>,
  count: number
): ContributorEntry[] {
  const total = Object.values(kWContributors).reduce((s, v) => s + (v || 0), 0);
  if (total <= 0) return [];
  return Object.entries(kWContributors)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([key, kW]) => ({ key, kW, pct: kW / total }));
}

const CONTRIBUTOR_LABELS: Record<string, string> = {
  hvac: "HVAC",
  lighting: "Lighting",
  process: "Process Equipment",
  controls: "Controls & BMS",
  itLoad: "IT Load",
  cooling: "Cooling",
  charging: "EV Charging",
  other: "Other Loads",
};

export function formatContributorKey(key: string): string {
  return CONTRIBUTOR_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}
