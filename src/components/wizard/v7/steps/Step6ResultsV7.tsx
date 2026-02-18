import React, { useMemo, useState, useCallback } from "react";
import {
  Battery,
  Sun,
  Zap,
  Fuel,
  TrendingUp,
  MapPin,
  Building2,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Check,
  Lock,
  BarChart3,
  LineChart,
  FileText,
  Bookmark,
} from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
} from "@/wizard/v7/hooks/useWizardV7";
import { sanitizeQuoteForDisplay, type DisplayQuote } from "@/wizard/v7/utils/pricingSanity";
import { buildV7ExportData } from "@/utils/buildV7ExportData";
import { exportQuoteAsPDF, exportQuoteAsWord, exportQuoteAsExcel } from "@/utils/quoteExportUtils";
import {
  trackQuoteGenerated,
  peekQuotaRemaining,
  isUserAuthenticated,
  getEffectiveTier,
} from "@/services/subscriptionService";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import TrueQuoteModal from "@/components/shared/TrueQuoteModal";
import { getIndustryMeta } from "@/wizard/v7/industryMeta";
import { Shield } from "lucide-react";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";
import { useMerlinData } from "@/wizard/v7/memory";
import TrueQuoteFinancialModal from "../shared/TrueQuoteFinancialModal";
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";

type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    resetSession: () => void;
    goToStep: (step: WizardStep) => Promise<void>;
    // Phase 6: Pricing retry (non-blocking)
    retryPricing?: () => Promise<{ ok: boolean; error?: string }>;
    // Phase 7: Template retry (upgrade fallback → industry)
    retryTemplate?: () => Promise<void>;
    // Phase 8: System add-ons (solar/generator/wind)
    recalculateWithAddOns?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
  };
};

/** Stat item — compact inline readout with no card chrome */
function StatItem({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={accent || "text-slate-500"}>{icon}</span>
      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-100 tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Safe USD formatter — handles null/undefined/NaN/Infinity
 * The sanitizer may have stripped poison values to null
 */
function fmtUSD(n?: number | null): string {
  if (n === null || n === undefined) return "—";
  if (!Number.isFinite(n)) return "—"; // Catches NaN and Infinity
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

/**
 * Safe number formatter for non-currency values
 */
function fmtNum(n?: number | null, fallback = "—"): string {
  if (n === null || n === undefined) return fallback;
  if (!Number.isFinite(n)) return fallback;
  return String(n);
}

// ============================================================================
// DETERMINISTIC BADGE RESOLVER — Step 4 reads, doesn't decide.
//
// Input:  pricingStatus, templateMode, quote (envelope confidence + validation)
// Output: { tier, label } — three possible values, no ambiguity.
//
// Decision tree:
//   1. Pricing not "ok" → Load Profile Only
//   2. fallback template OR fallback confidence → Estimate
//   3. trueQuoteValidation present + version "v1" + ≥3 contributors → TrueQuote
//   4. Else → Estimate (safe default)
// ============================================================================

type BadgeTier = "truequote" | "estimate" | "load-only";
type BadgeResult = { tier: BadgeTier; label: string };

function _resolveBadge(
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

type ContributorEntry = { key: string; kW: number; pct: number };

function getTopContributors(
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

function formatContributorKey(key: string): string {
  return CONTRIBUTOR_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

export default function Step6ResultsV7({ state, actions }: Props) {
  // ============================================================================
  // MERLIN MEMORY — canonical cross-step data reads
  // ============================================================================
  const data = useMerlinData(state);

  // ============================================================================
  // PHASE 6: PRICING STATUS (non-blocking — UI-ephemeral, stays on reducer)
  // Step 6 is now a PURE QUOTE DISPLAY — add-ons configured in Step 4 Options
  // ============================================================================
  const pricingStatus: PricingStatus = state.pricingStatus ?? "idle";
  const pricingWarnings: string[] = state.pricingWarnings ?? [];
  const pricingError: string | null = state.pricingError ?? null;

  // Raw quote from state (may contain poison: NaN, Infinity, negative)
  const quoteRaw = state.quote ?? null;

  // Sanitized quote — poison values replaced with null for safe rendering
  // Returns typed DisplayQuote (Move 8 contract)
  const quote: DisplayQuote = useMemo(() => sanitizeQuoteForDisplay(quoteRaw), [quoteRaw]);

  const locLine = useMemo(() => {
    if (!data.location.city && !data.location.state && !data.location.zip) return "—";
    const parts = [data.location.city, data.location.state, data.location.zip].filter(Boolean);
    return parts.length ? parts.join(", ") : (state.location?.formattedAddress ?? "—");
  }, [data.location, state.location?.formattedAddress]);

  const quoteReady = pricingStatus === "ok" && !!quoteRaw;

  // TrueQuote™ Financial Projection modal state
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  // TrueQuote™ explainer modal state
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  // ProQuote™ upsell modal state
  const [showProQuoteModal, setShowProQuoteModal] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ================================================================
          HEADER — Industry + Location + Navigation
      ================================================================ */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {getIndustryMeta(data.industry).label as string}
            </span>
            <span className="text-slate-600">•</span>
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{locLine}</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[#3ECF8E]" />
            Your Energy Quote
          </h1>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={actions.goBack}
            className="h-9 px-3.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.06] font-medium text-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={actions.resetSession}
            className="h-9 px-3.5 rounded-lg border border-red-500/20 bg-red-500/[0.08] text-red-400 hover:bg-red-500/[0.12] font-medium text-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* ================================================================
          TRUEQUOTE™ GOLD BADGE — Always visible at top, opens financial modal
      ================================================================ */}
      <button
        type="button"
        onClick={() => setShowFinancialModal(true)}
        className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-400/50 hover:bg-amber-500/[0.08] transition-all duration-300 cursor-pointer"
        aria-label="Open TrueQuote financial summary"
      >
        <div className="shrink-0">
          <img
            src={badgeGoldIcon}
            alt="TrueQuote Verified"
            className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl font-bold text-amber-400 tracking-tight">TrueQuote™</span>
            <span className="text-xs font-semibold text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Verified
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-snug">
            Every number is sourced. Click to view full financial projection, ROI analysis, and
            payback timeline.
          </p>
        </div>
        <div className="shrink-0 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* ================================================================
          QUOTE RESULTS — Full quote display (add-ons configured in Step 4)
      ================================================================ */}

      {/* ================================================================
          PARTIAL RESULTS / FALLBACK / STATUS BANNERS
      ================================================================ */}
      {!!(quote?._extra as Record<string, unknown>)?.isProvisional && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 text-sm">Provisional Results</div>
              <p className="text-amber-200/70 text-xs mt-1">
                {quote.missingInputs?.length
                  ? `${quote.missingInputs.length} inputs missing — using defaults. `
                  : "Some inputs missing — using defaults. "}
                Results may not reflect your actual load profile.
                <button
                  onClick={() => actions.goToStep?.("profile")}
                  className="ml-1.5 underline font-bold text-amber-300 hover:text-amber-200"
                >
                  Complete Step 3 →
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {state.templateMode === "fallback" && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] p-4">
          <div className="font-semibold text-blue-300 text-sm">Estimate Mode</div>
          <p className="text-blue-200/70 text-xs mt-1.5">
            Using a general facility model. Numbers are directionally correct but won't carry
            TrueQuote™ attribution.
          </p>
          {actions.retryTemplate && (
            <button
              onClick={() => void actions.retryTemplate?.()}
              disabled={state.isBusy}
              className="mt-2.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 font-bold text-xs hover:bg-blue-500/[0.15] disabled:opacity-40 transition-colors"
            >
              {state.isBusy ? "Retrying\u2026" : "Retry industry profile \u2192"}
            </button>
          )}
        </div>
      )}

      {/* Pricing status banners */}
      {pricingStatus === "pending" && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.04] p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <div>
            <span className="font-semibold text-blue-300 text-sm">Calculating quote…</span>
            <span className="text-blue-200/60 text-xs ml-2">This won't block navigation</span>
          </div>
        </div>
      )}

      {pricingStatus === "error" && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4">
          <div className="font-semibold text-red-300 text-sm mb-1.5">Pricing engine error</div>
          <pre className="text-red-300/70 text-xs font-mono whitespace-pre-wrap">
            {pricingError || "Unknown error"}
          </pre>
          {actions.retryPricing && (
            <button
              onClick={() => actions.retryPricing?.()}
              className="mt-2.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 font-bold text-xs hover:bg-red-500/[0.15] transition-colors"
            >
              Retry pricing
            </button>
          )}
        </div>
      )}

      {pricingStatus === "timed_out" && (
        <div className="rounded-xl border border-orange-500/25 bg-orange-500/[0.06] p-4">
          <div className="font-semibold text-orange-300 text-sm">Pricing timed out</div>
          <p className="text-orange-200/70 text-xs mt-1.5">
            Your load profile is still available below.
          </p>
          {actions.retryPricing && (
            <button
              onClick={() => actions.retryPricing?.()}
              className="mt-2.5 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 font-bold text-xs hover:bg-orange-500/[0.15] transition-colors"
            >
              Retry pricing
            </button>
          )}
        </div>
      )}

      {pricingStatus === "ok" && pricingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <div className="font-semibold text-amber-300 text-sm">Warnings detected</div>
          <ul className="mt-1.5 pl-4 text-amber-200/70 text-xs list-disc space-y-0.5">
            {pricingWarnings.slice(0, 5).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ================================================================
          HERO SAVINGS — Big number, compelling
      ================================================================ */}
      {quoteReady && quote.annualSavingsUSD != null && Number(quote.annualSavingsUSD) > 0 && (
        <div className="relative rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.02]" />

          <div className="relative p-8 border border-[#3ECF8E]/20 rounded-xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 mb-4">
                <div className="w-2 h-2 bg-[#3ECF8E] rounded-full animate-pulse" />
                <span className="text-[#3ECF8E] font-semibold text-xs uppercase tracking-wider">
                  Projected Annual Savings
                </span>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-[#3ECF8E] leading-none">
                {fmtUSD(quote.annualSavingsUSD as number | null)}
              </div>
              <div className="text-lg text-slate-400 mt-1.5">per year</div>

              {/* ROI snapshot below hero */}
              {quote.roiYears != null && Number(quote.roiYears) > 0 && (
                <div className="mt-5 inline-flex items-center gap-4 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <TrendingUp className="w-4 h-4 text-[#3ECF8E]" />
                  <span className="text-sm text-slate-300">
                    Payback in{" "}
                    <strong className="text-[#3ECF8E]">
                      {parseFloat(Number(quote.roiYears).toFixed(1))} years
                    </strong>
                  </span>
                  {quote.irr != null &&
                    (() => {
                      const raw = Number(quote.irr);
                      if (!Number.isFinite(raw)) return null;
                      const pct = raw > 1 ? raw : raw * 100;
                      if (pct > 200 || pct <= 0) return null;
                      return (
                        <>
                          <span className="text-slate-600">|</span>
                          <span className="text-sm text-slate-300">
                            IRR <strong className="text-[#3ECF8E]">{pct.toFixed(1)}%</strong>
                          </span>
                        </>
                      );
                    })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          STATS BAR — Key metrics at a glance
      ================================================================ */}
      {quoteReady && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2 border-b border-white/[0.06]">
          <StatItem
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Peak"
            value={quote.peakLoadKW ? `${fmtNum(Math.round(quote.peakLoadKW))} kW` : "—"}
            accent="text-amber-400"
          />
          <StatItem
            icon={<Battery className="w-3.5 h-3.5" />}
            label="BESS"
            value={quote.bessKWh ? `${fmtNum(Math.round(quote.bessKWh))} kWh` : "—"}
            accent="text-violet-400"
          />
          <StatItem
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Duration"
            value={quote.durationHours ? `${fmtNum(quote.durationHours)} hrs` : "—"}
            accent="text-blue-400"
          />
          {(quote.solarKW as number) > 0 && (
            <StatItem
              icon={<Sun className="w-3.5 h-3.5" />}
              label="Solar"
              value={`${fmtNum(Math.round(quote.solarKW as number))} kW`}
              accent="text-yellow-400"
            />
          )}
          {(quote.generatorKW as number) > 0 && (
            <StatItem
              icon={<Fuel className="w-3.5 h-3.5" />}
              label="Gen"
              value={`${fmtNum(Math.round(quote.generatorKW as number))} kW`}
              accent="text-red-400"
            />
          )}
        </div>
      )}

      {/* ================================================================
          EQUIPMENT & FINANCIAL SUMMARY — Clean two-column layout
      ================================================================ */}
      {quoteReady && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/[0.06] rounded-lg overflow-hidden">
          {/* Equipment — left column */}
          <div className="p-3 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-2">
              <Battery className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Equipment
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {quote.bessKWh != null && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-xs text-slate-400">Battery Storage</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(Math.round(quote.bessKWh))} kWh
                    {quote.bessKW != null && (
                      <span className="text-slate-500 font-medium ml-1.5">
                        {fmtNum(Math.round(quote.bessKW))} kW
                      </span>
                    )}
                  </span>
                </div>
              )}
              {quote.durationHours != null && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-xs text-slate-400">Duration</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(quote.durationHours)} hours
                  </span>
                </div>
              )}
              {(quote.solarKW as number) > 0 && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-xs text-slate-400">Solar Array</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(Math.round(quote.solarKW as number))} kW
                  </span>
                </div>
              )}
              {(quote.generatorKW as number) > 0 && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-xs text-slate-400">Backup Generator</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(Math.round(quote.generatorKW as number))} kW
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-xs text-slate-400">Peak Demand</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {quote.peakLoadKW ? `${fmtNum(Math.round(quote.peakLoadKW))} kW` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Financial — right column */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Financials
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <Shield className="w-3 h-3 text-amber-500" />
                <span className="text-amber-400 font-bold">TrueQuote™</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-slate-400">Total Investment</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {fmtUSD((quote.grossCost ?? quote.capexUSD) as number | null)}
                </span>
              </div>
              {/* Federal ITC — use actual itcAmount from calculator, not hardcoded 30% */}
              {(quote.grossCost ?? quote.capexUSD) != null &&
                Number(quote.grossCost ?? quote.capexUSD) > 0 && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-xs text-slate-400">
                      Federal ITC (
                      {quote.itcRate != null
                        ? `${Math.round(Number(quote.itcRate) * 100)}%`
                        : "30%"}
                      )
                    </span>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">
                      −
                      {fmtUSD(
                        quote.itcAmount != null
                          ? Number(quote.itcAmount)
                          : Number(quote.grossCost ?? quote.capexUSD ?? 0) * 0.3
                      )}
                    </span>
                  </div>
                )}
              {/* Net cost after ITC — capexUSD IS already net of ITC */}
              {quote.capexUSD != null && Number(quote.capexUSD) > 0 && (
                <div className="flex justify-between py-1.5 bg-white/[0.02] -mx-3 px-3">
                  <span className="text-xs font-semibold text-slate-200">Net Cost</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtUSD(quote.capexUSD as number | null)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-slate-400">Annual Savings</span>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">
                  {fmtUSD(quote.annualSavingsUSD as number | null)}
                </span>
              </div>
              {quote.demandChargeSavings != null && Number(quote.demandChargeSavings) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-slate-400">Demand Charge Savings</span>
                  <span className="text-xs font-bold text-cyan-400 tabular-nums">
                    {fmtUSD(quote.demandChargeSavings as number | null)}
                  </span>
                </div>
              )}
              {/* Monthly savings for quick reference */}
              {quote.annualSavingsUSD != null && Number(quote.annualSavingsUSD) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-slate-400">Monthly Savings</span>
                  <span className="text-xs font-bold text-slate-300 tabular-nums">
                    {fmtUSD(Number(quote.annualSavingsUSD) / 12)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-slate-400">Simple Payback</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {quote.roiYears != null && Number(quote.roiYears) > 0
                    ? `${parseFloat(Number(quote.roiYears).toFixed(1))} years`
                    : "—"}
                </span>
              </div>
              {quote.npv != null && (
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-slate-400">NPV (25yr)</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${Number(quote.npv) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {fmtUSD(quote.npv as number | null)}
                  </span>
                </div>
              )}
              {quote.irr != null && (
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-slate-400">IRR</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${(() => {
                      const raw = Number(quote.irr);
                      const pct = raw > 1 ? raw : raw * 100;
                      return pct >= 8 ? "text-emerald-400" : "text-amber-400";
                    })()}`}
                  >
                    {(() => {
                      const raw = Number(quote.irr);
                      if (!Number.isFinite(raw)) return "—";
                      const pct = raw > 1 ? raw : raw * 100;
                      if (pct > 200) return ">200%";
                      return `${pct.toFixed(1)}%`;
                    })()}
                  </span>
                </div>
              )}
              {quote.paybackYears != null && Number(quote.paybackYears) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-slate-400">Discounted Payback</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {parseFloat(Number(quote.paybackYears).toFixed(1))} years
                  </span>
                </div>
              )}
              {/* 10yr cumulative savings */}
              {quote.annualSavingsUSD != null && Number(quote.annualSavingsUSD) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-slate-400">10yr Cumulative Savings</span>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums">
                    {fmtUSD(Number(quote.annualSavingsUSD) * 10)}
                  </span>
                </div>
              )}
            </div>

            {/* Financial projection CTA */}
            {(quote.grossCost ?? quote.capexUSD) != null &&
              Number(quote.grossCost ?? quote.capexUSD) > 0 &&
              quote.annualSavingsUSD != null &&
              Number(quote.annualSavingsUSD) > 0 && (
                <button
                  onClick={() => setShowFinancialModal(true)}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-md border border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] transition-all group"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300" />
                  <span className="text-[11px] font-semibold text-amber-400 group-hover:text-amber-300">
                    View 10-Year Financial Projection
                  </span>
                </button>
              )}
          </div>
        </div>
      )}

      {/* TrueQuote badge moved to top (after savings hero) — see above */}

      {/* ================================================================
          WHY THIS SIZE? — Trust accelerator
          PREFERS _displayHints (pre-computed by sanitizer, stable ordering)
          FALLS BACK to getTopContributors if hints missing
          Reads quote.trueQuoteValidation (sealed envelope data)
      ================================================================ */}
      {quoteReady &&
        quote.trueQuoteValidation?.kWContributors &&
        (() => {
          // Graceful degradation: prefer _displayHints (stable, sanitized), fall back to live computation
          const hints = quote._displayHints;
          const contributors =
            hints?.topContributors?.length > 0
              ? hints.topContributors.map((c) => ({ key: c.key, kW: c.kW, pct: c.pct }))
              : getTopContributors(quote.trueQuoteValidation!.kWContributors!, 3);

          if (contributors.length === 0) return null;

          return (
            <details className="group">
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1.5 font-semibold">
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                Why this size?
              </summary>
              <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                {/* Top kW contributors */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Top Load Contributors
                  </div>
                  <div className="space-y-1.5">
                    {contributors.map((c) => (
                      <div key={c.key} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-300 capitalize">
                              {formatContributorKey(c.key)}
                            </span>
                            <span className="text-xs font-bold text-slate-200 tabular-nums">
                              {fmtNum(Math.round(c.kW))} kW
                            </span>
                          </div>
                          {/* Proportion bar */}
                          <div className="mt-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#3ECF8E]/40"
                              style={{ width: `${Math.min(c.pct * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
                          {Math.round(c.pct * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key assumptions from validation envelope */}
                {quote.trueQuoteValidation?.assumptions &&
                  quote.trueQuoteValidation.assumptions.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Key Assumptions
                      </div>
                      <ul className="space-y-1">
                        {quote.trueQuoteValidation.assumptions.slice(0, 5).map((a, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                            <span className="text-slate-600 mt-0.5">ⓘ</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </details>
          );
        })()}

      {/* Notes (collapsed by default) */}
      {quoteReady && quote.notes?.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            Notes & Assumptions ({quote.notes.length})
          </summary>
          <ul className="mt-2 pl-5 text-xs text-slate-500 list-disc space-y-0.5">
            {quote.notes.map((n: string, i: number) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </details>
      )}

      {/* ================================================================
          MERLIN ADVISOR — Contextual recommendations based on quote
          Shows AFTER the quote so user sees their numbers first,
          then gets intelligent suggestions to improve their project.
      ================================================================ */}
      {quoteReady && quote.peakLoadKW != null && (
        <AdvisorRecommendations
          state={state}
          quote={quote}
          pricingStatus={pricingStatus}
          actions={{ goToStep: actions.goToStep }}
        />
      )}

      {/* ================================================================
          PRO TEASER PANELS — Blurred previews of advanced analytics
          Only shown for guests / free-tier users to drive upgrades.
      ================================================================ */}
      {quoteReady &&
        quote.peakLoadKW != null &&
        getEffectiveTier() !== "advanced" &&
        getEffectiveTier() !== "business" && (
          <div className="space-y-0">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-amber-400/70" />
              <span className="text-sm font-semibold text-white/60 tracking-wide uppercase">
                Advanced Analytics — Pro & Above
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Monte Carlo Risk Analysis */}
              <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-amber-500/20 transition-all">
                {/* Blurred placeholder */}
                <div className="select-none pointer-events-none">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-bold text-white/80">Monte Carlo Risk</span>
                  </div>
                  <div className="space-y-2 blur-[6px]">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">P10 (conservative)</span>
                      <span className="text-red-400 font-mono">$1.2M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">P50 (expected)</span>
                      <span className="text-emerald-400 font-mono">$2.4M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">P90 (optimistic)</span>
                      <span className="text-emerald-400 font-mono">$3.1M</span>
                    </div>
                    <div className="h-16 mt-2 bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-emerald-500/5 rounded-lg" />
                  </div>
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/90 via-transparent to-transparent flex items-end justify-center pb-4">
                  <a
                    href="/pricing"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all no-underline"
                  >
                    <Lock className="w-3 h-3" />
                    Unlock with Pro
                  </a>
                </div>
              </div>

              {/* 10-Year Cash Flow Projection */}
              <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="select-none pointer-events-none">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <LineChart className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm font-bold text-white/80">10-Year Cash Flow</span>
                  </div>
                  <div className="space-y-2 blur-[6px]">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Yr 1 net cash flow</span>
                      <span className="text-emerald-400 font-mono">$86,400</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Cumulative yr 5</span>
                      <span className="text-emerald-400 font-mono">$432,000</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Cumulative yr 10</span>
                      <span className="text-emerald-400 font-mono">$864,000</span>
                    </div>
                    <div className="h-16 mt-2 bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-emerald-500/10 rounded-lg" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/90 via-transparent to-transparent flex items-end justify-center pb-4">
                  <a
                    href="/pricing"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all no-underline"
                  >
                    <Lock className="w-3 h-3" />
                    Unlock with Pro
                  </a>
                </div>
              </div>

              {/* Bank-Ready Financial Model */}
              <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="select-none pointer-events-none">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-white/80">Bank-Ready Model</span>
                  </div>
                  <div className="space-y-2 blur-[6px]">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Levered IRR</span>
                      <span className="text-emerald-400 font-mono">14.2%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">DSCR (min)</span>
                      <span className="text-emerald-400 font-mono">1.35x</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">MACRS benefit</span>
                      <span className="text-emerald-400 font-mono">$285,000</span>
                    </div>
                    <div className="h-16 mt-2 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-indigo-500/10 rounded-lg" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/90 via-transparent to-transparent flex items-end justify-center pb-4">
                  <a
                    href="/pricing"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all no-underline"
                  >
                    <Lock className="w-3 h-3" />
                    Unlock with Pro
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ================================================================
          PROQUOTE™ UPSELL — Merlin is the salesman
      ================================================================ */}
      <div className="rounded-xl border-2 border-white/[0.08] bg-white/[0.03] p-6 hover:border-white/[0.12] transition-all">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <img src={badgeProQuoteIcon} alt="ProQuote" className="w-14 h-14 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-slate-100 tracking-tight">
              Want to go deeper?
            </div>
            <div className="text-sm text-slate-400 mt-1 leading-relaxed">
              ProQuote™ gives you full engineering control — custom equipment, fuel cells, financial
              modeling, and bank-ready exports.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProQuoteModal(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-[#3ECF8E]/30 bg-[#3ECF8E]/[0.06] hover:border-[#3ECF8E]/50 hover:bg-[#3ECF8E]/[0.12] transition-all shrink-0 group"
          >
            <Sparkles className="w-4 h-4 text-[#3ECF8E]" />
            <span className="text-sm font-bold text-[#3ECF8E] tracking-wide">Open ProQuote™</span>
          </button>
        </div>
      </div>

      {/* ================================================================
          VENDOR / EPC PORTAL CTA — Bring vendors into the platform
      ================================================================ */}
      <div className="rounded-xl border-2 border-blue-500/[0.12] bg-blue-500/[0.03] p-6 hover:border-blue-500/[0.20] transition-all">
        <div className="flex items-center gap-5">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-base font-bold text-slate-100 tracking-tight">
                Are you a vendor or EPC?
              </span>
              <span className="text-[10px] font-semibold text-blue-300 px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20">
                NREL · IRA · IEEE
              </span>
            </div>
            <div className="text-sm text-slate-400 leading-relaxed">
              Build NREL-compliant proposals for your customers — every number sourced, bank-ready
              exports, your brand.
            </div>
          </div>
          <a
            href="/vendor"
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-blue-400/30 bg-blue-400/[0.06] hover:border-blue-400/50 hover:bg-blue-400/[0.12] transition-all shrink-0 group no-underline"
          >
            <span className="text-sm font-bold text-blue-400 tracking-wide">Build a Quote →</span>
          </a>
        </div>
      </div>

      {/* ================================================================
          EXPORT / DOWNLOAD — TrueQuote™ branded exports
          Available whenever we have at least a load profile (Layer A)
      ================================================================ */}
      {quote && quote.peakLoadKW != null && (
        <ExportBar state={state} onTrueQuoteClick={() => setShowFinancialModal(true)} />
      )}

      {/* ================================================================
          PROQUOTE™ EXPLAINER MODAL
      ================================================================ */}
      <ProQuoteHowItWorksModal
        isOpen={showProQuoteModal}
        onClose={() => setShowProQuoteModal(false)}
        onOpenProQuote={() => {
          setShowProQuoteModal(false);
          window.location.href = "/quote-builder";
        }}
      />

      {/* ================================================================
          TRUEQUOTE™ EXPLAINER MODAL
      ================================================================ */}
      <TrueQuoteModal isOpen={showTrueQuoteModal} onClose={() => setShowTrueQuoteModal(false)} />

      {/* ================================================================
          TRUEQUOTE™ FINANCIAL PROJECTION MODAL
      ================================================================ */}
      <TrueQuoteFinancialModal
        isOpen={showFinancialModal}
        onClose={() => setShowFinancialModal(false)}
        totalInvestment={Number(quote.grossCost ?? quote.capexUSD ?? 0)}
        federalITC={
          Number(quote.itcAmount ?? 0) ||
          Number(quote.grossCost ?? quote.capexUSD ?? 0) * (Number(quote.itcRate) || 0.3)
        }
        netInvestment={Number(quote.capexUSD ?? 0)}
        annualSavings={Number(quote.annualSavingsUSD ?? 0)}
        bessKWh={Number(quote.bessKWh ?? 0) || undefined}
        solarKW={Number(quote.solarKW ?? 0) || undefined}
        industry={data.industry || undefined}
        location={locLine !== "—" ? locLine : undefined}
      />
    </div>
  );
}

// ============================================================================
// ADVISOR RECOMMENDATIONS — Contextual intelligence BELOW the quote
//
// Analyzes the quote and provides smart suggestions:
// 1. Power gap → suggest generators or solar
// 2. Revenue opportunity → suggest EV charging
// 3. Location advantage → suggest solar based on irradiance
// 4. Resilience → suggest backup generation
//
// Each recommendation includes a reason and an action to configure it.
// ============================================================================

type RecommendationType =
  | "power-gap"
  | "solar-opportunity"
  | "ev-revenue"
  | "resilience"
  | "cost-savings";

interface Recommendation {
  type: RecommendationType;
  icon: string;
  title: string;
  description: string;
  accent: string; // Tailwind border/bg color class
}

function getAdvisorRecommendations(state: WizardV7State, quote: DisplayQuote): Recommendation[] {
  const recs: Recommendation[] = [];
  const peakKW = quote.peakLoadKW ?? 0;
  const bessKW = quote.bessKW ?? 0;
  const hasSolar = (quote.solarKW as number) > 0;
  const hasGenerator = (quote.generatorKW as number) > 0;
  const goals = state.goals ?? []; // Note: state.goals used here since getAdvisorRecommendations is standalone fn

  // 1. Power gap — BESS doesn't cover full peak load
  if (peakKW > 0 && bessKW > 0 && bessKW < peakKW * 0.9 && !hasGenerator && !hasSolar) {
    recs.push({
      type: "power-gap",
      icon: "⚡",
      title: "Close your power gap",
      description: `Your facility peaks at ${Math.round(peakKW)} kW but your BESS covers ${Math.round(bessKW)} kW. Adding solar panels or a backup generator would help meet your full power needs and improve resilience.`,
      accent: "amber",
    });
  }

  // 2. Solar opportunity — no solar configured yet
  if (!hasSolar) {
    const stateAbbr = state.location?.state ?? ""; // state.location used in standalone fn (accepts WizardV7State)
    const highSolarStates = ["CA", "AZ", "NV", "NM", "TX", "FL", "CO", "UT", "HI"];
    const isHighSolar = highSolarStates.includes(stateAbbr);

    recs.push({
      type: "solar-opportunity",
      icon: "☀️",
      title: isHighSolar
        ? `Your area in ${stateAbbr} is great for solar`
        : "Add solar to offset daytime load",
      description: isHighSolar
        ? `${stateAbbr} receives excellent solar irradiance. Adding a solar array could offset significant daytime energy consumption and pair perfectly with your battery storage for 24/7 savings.`
        : "A solar array paired with your battery storage can offset daytime energy costs and increase your return on investment through energy arbitrage.",
      accent: "yellow",
    });
  }

  // 3. EV charging revenue — if not already an EV industry
  // Note: state.industry used here since getAdvisorRecommendations is a standalone function accepting WizardV7State
  const isEVIndustry =
    state.industry === "ev_charging" || (state.industry as string) === "ev-charging";
  if (!isEVIndustry) {
    const hasCustomerTraffic = [
      "hotel",
      "retail",
      "shopping-center",
      "car_wash",
      "car-wash",
      "restaurant",
      "gas_station",
      "gas-station",
      "casino",
    ].includes(state.industry ?? "");
    if (hasCustomerTraffic) {
      recs.push({
        type: "ev-revenue",
        icon: "🔌",
        title: "Add EV charging as a revenue source",
        description:
          "Your facility type sees regular customer traffic. Adding EV chargers creates a new revenue stream while your BESS handles peak demand from charging sessions — keeping your demand charges low.",
        accent: "cyan",
      });
    }
  }

  // 4. Resilience — if goals mention backup/resilience and no generator
  const wantsResilience = goals.some(
    (g) =>
      typeof g === "string" &&
      (g.toLowerCase().includes("backup") ||
        g.toLowerCase().includes("resilien") ||
        g.toLowerCase().includes("outage"))
  );
  if (wantsResilience && !hasGenerator) {
    recs.push({
      type: "resilience",
      icon: "🛡️",
      title: "Strengthen your backup power",
      description:
        "You mentioned power resilience as a goal. Adding a backup generator alongside your BESS ensures uninterrupted operations during extended outages beyond your battery duration.",
      accent: "red",
    });
  }

  // 5. Cost savings — if payback seems high, suggest improvements
  const payback = Number(quote.roiYears);
  if (Number.isFinite(payback) && payback > 8 && !hasSolar) {
    recs.push({
      type: "cost-savings",
      icon: "📉",
      title: "Improve your payback period",
      description: `Your current payback is ~${Math.round(payback)} years. Adding solar generation can significantly reduce grid electricity costs and accelerate your return on investment.`,
      accent: "emerald",
    });
  }

  return recs;
}

const ACCENT_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  amber: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    text: "text-amber-300",
    glow: "shadow-amber-500/10",
  },
  yellow: {
    border: "border-yellow-500/25",
    bg: "bg-yellow-500/[0.06]",
    text: "text-yellow-300",
    glow: "shadow-yellow-500/10",
  },
  cyan: {
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/[0.06]",
    text: "text-cyan-300",
    glow: "shadow-cyan-500/10",
  },
  red: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.06]",
    text: "text-red-300",
    glow: "shadow-red-500/10",
  },
  emerald: {
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.06]",
    text: "text-emerald-300",
    glow: "shadow-emerald-500/10",
  },
};

function AdvisorRecommendations({
  state,
  quote,
  actions,
}: {
  state: WizardV7State;
  quote: DisplayQuote;
  pricingStatus: PricingStatus;
  actions: { goToStep?: (step: WizardStep) => Promise<void> };
  onRecalculate?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
}) {
  const recommendations = useMemo(() => getAdvisorRecommendations(state, quote), [state, quote]);

  const [expanded, setExpanded] = useState(true);

  if (recommendations.length === 0) {
    // No recommendations — show a positive message
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-sm text-emerald-200">System Looks Great</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Your configuration is well-optimized for your facility's needs.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Advisor header */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#3ECF8E]" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-slate-200">Merlin's Recommendations</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {recommendations.length} suggestion{recommendations.length !== 1 ? "s" : ""} to
                optimize your project
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Recommendation cards */}
      {expanded && (
        <div className="space-y-3 pl-2">
          {recommendations.map((rec) => {
            const style = ACCENT_STYLES[rec.accent] ?? ACCENT_STYLES.amber;
            return (
              <div
                key={rec.type}
                className={`rounded-xl border ${style.border} ${style.bg} p-4 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${style.text}`}>{rec.title}</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tip: Go back to Options step to reconfigure */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => actions.goToStep?.("options")}
              className="text-xs text-[#3ECF8E] hover:text-[#3ECF8E]/80 underline underline-offset-2 transition-colors font-medium"
            >
              ← Configure add-ons in Options step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT BAR — Download PDF / Word / Excel
// ============================================================================

type ExportFormat = "pdf" | "word" | "excel";

function ExportBar({
  state,
  onTrueQuoteClick,
}: {
  state: WizardV7State;
  onTrueQuoteClick?: () => void;
}) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_quotaBlocked, setQuotaBlocked] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setError(null);
      setQuotaBlocked(false);
      setShowSavePrompt(false);

      // ── QUOTA CHECK: Only exports count as "delivered quotes" ──
      const quota = peekQuotaRemaining("quote");
      if (!quota.allowed) {
        setQuotaBlocked(true);
        setError(
          `You've used all ${quota.limit} free quote exports this session. Sign up for more!`
        );
        return;
      }

      setExporting(format);

      try {
        const data = buildV7ExportData(state);

        switch (format) {
          case "pdf":
            await exportQuoteAsPDF(data);
            break;
          case "word":
            await exportQuoteAsWord(data);
            break;
          case "excel":
            await exportQuoteAsExcel(data);
            break;
        }

        // ✅ Track AFTER successful export — this is a "delivered quote"
        const result = trackQuoteGenerated();
        if (!result.allowed) {
          console.info("[QuotaTracking] Export allowed but quota now exhausted:", result);
        }

        // ✅ Show save prompt for guests / free-tier users after export
        if (!isUserAuthenticated()) {
          setShowSavePrompt(true);
        }
      } catch (err) {
        console.error(`Export ${format} failed:`, err);
        setError(`Export failed — ${(err as Error).message || "please try again"}`);
      } finally {
        setExporting(null);
      }
    },
    [state]
  );

  const hasPricing = state.quote?.pricingComplete;
  const isTrueQuote =
    hasPricing &&
    state.templateMode !== "fallback" &&
    state.quote?.confidence?.industry !== "fallback";

  const buttons: { format: ExportFormat; icon: string; label: string }[] = [
    { format: "pdf", icon: "↓", label: "PDF" },
    { format: "word", icon: "↓", label: "Word" },
    { format: "excel", icon: "↓", label: "Excel" },
  ];

  return (
    <div className="rounded-xl border-2 border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.03] p-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "rgba(232,235,243,0.95)",
              letterSpacing: "-0.01em",
            }}
          >
            Download Quote
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(232,235,243,0.55)",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {isTrueQuote ? (
              <>
                <TrueQuoteBadgeCanonical showTooltip={false} onClick={onTrueQuoteClick} />
                <span>kW breakdown, confidence score &amp; methodology included</span>
              </>
            ) : hasPricing ? (
              <span style={{ color: "rgba(232,235,243,0.6)" }}>
                Estimate — includes financial projections
              </span>
            ) : (
              <span style={{ color: "rgba(232,235,243,0.5)" }}>
                Load profile only — pricing pending
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {buttons.map(({ format, icon, label }) => (
            <button
              key={format}
              type="button"
              onClick={() => void handleExport(format)}
              disabled={exporting !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                padding: "0 20px",
                borderRadius: 12,
                border: "2px solid rgba(62,207,142,0.30)",
                background:
                  exporting === format ? "rgba(62,207,142,0.15)" : "rgba(62,207,142,0.06)",
                color:
                  exporting !== null && exporting !== format
                    ? "rgba(232,235,243,0.3)"
                    : "rgba(62,207,142,0.9)",
                cursor: exporting !== null ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 15,
                transition: "all 0.15s",
              }}
            >
              <span>{exporting === format ? "⏳" : icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "rgba(239,68,68,0.9)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* ── SAVE PROMPT: Appears after successful export for unauthenticated users ── */}
      {showSavePrompt && (
        <div className="mt-3 rounded-xl border border-[#3ECF8E]/25 bg-[#3ECF8E]/[0.04] p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4 text-[#3ECF8E]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#3ECF8E]">
                Save this quote to your account
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Create a free account to save, revisit, and compare your BESS quotes anytime.
              </div>
            </div>
            <a
              href="/signup"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 text-[#3ECF8E] text-sm font-bold hover:bg-[#3ECF8E]/20 hover:border-[#3ECF8E]/40 transition-all no-underline"
            >
              Sign Up Free →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
