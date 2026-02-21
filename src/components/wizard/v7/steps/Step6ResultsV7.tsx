import React, { useMemo, useState } from "react";
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
  DollarSign,
  Layers,
} from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
} from "@/wizard/v7/hooks/useWizardV7";
import { sanitizeQuoteForDisplay, type DisplayQuote } from "@/wizard/v7/utils/pricingSanity";
import { getEffectiveTier } from "@/services/subscriptionService";
import TrueQuoteModal from "@/components/shared/TrueQuoteModal";
import { getIndustryMeta } from "@/wizard/v7/industryMeta";
import { Shield } from "lucide-react";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";
import { useMerlinData } from "@/wizard/v7/memory";
import TrueQuoteFinancialModal from "../shared/TrueQuoteFinancialModal";
import ProQuoteHowItWorksModal from "@/components/shared/ProQuoteHowItWorksModal";

// Extracted child components (Feb 2026 — bloat decomposition)
import { resolveBadge, getTopContributors, formatContributorKey } from "../shared/badgeResolver";
import AdvisorRecommendations from "../shared/AdvisorRecommendations";
import ExportBar from "../shared/ExportBar";
import ProTeaserPanels from "../shared/ProTeaserPanels";
import AdvancedAnalyticsPanels from "../shared/AdvancedAnalyticsPanels";
import ScenarioComparison from "../shared/ScenarioComparison";
import QuoteCharts from "../shared/QuoteCharts";

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

// Badge resolver, contributor helpers: imported from ../shared/badgeResolver

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

  // Badge tier resolution — deterministic, used for badge display decisions
  const _badgeResult = useMemo(
    () =>
      resolveBadge(
        pricingStatus,
        (state.templateMode as "industry" | "fallback") ?? "industry",
        quote as unknown as Record<string, unknown>
      ),
    [pricingStatus, state.templateMode, quote]
  );

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
          {/* Equipment — horizontal badges */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-3">
              <Battery className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Equipment
              </span>
            </div>

            {/* Horizontal badge row */}
            <div className="flex flex-wrap items-center gap-3">
              {quote.bessKWh != null && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Battery className="w-3.5 h-3.5 text-violet-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Battery
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtNum(Math.round(quote.bessKWh))} kWh
                    </span>
                  </div>
                </div>
              )}

              {quote.durationHours != null && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Duration
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtNum(quote.durationHours)} hrs
                    </span>
                  </div>
                </div>
              )}

              {(quote.solarKW as number) > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Solar
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtNum(Math.round(quote.solarKW as number))} kW
                    </span>
                  </div>
                </div>
              )}

              {(quote.generatorKW as number) > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Zap className="w-3.5 h-3.5 text-red-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Generator
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtNum(Math.round(quote.generatorKW as number))} kW
                    </span>
                  </div>
                </div>
              )}

              {quote.peakLoadKW && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Peak
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtNum(Math.round(quote.peakLoadKW))} kW
                    </span>
                  </div>
                </div>
              )}
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
          UNIT ECONOMICS — $/kW and $/kWh ground truth
      ================================================================ */}
      {quoteReady &&
        quote.equipmentCosts &&
        (quote.equipmentCosts.allInPerKWh || quote.equipmentCosts.allInPerKW) && (
          <div className="border border-white/[0.06] rounded-lg overflow-hidden">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider">
                  Unit Economics
                </span>
                <span className="ml-auto text-[10px] text-slate-600 font-medium">Ground Truth</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quote.equipmentCosts.allInPerKWh && (
                  <div className="bg-white/[0.02] rounded-md p-2.5">
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                      All-In $/kWh
                    </div>
                    <div className="text-lg font-bold text-white tabular-nums">
                      {fmtUSD(quote.equipmentCosts.allInPerKWh)}
                      <span className="text-xs text-slate-500 font-normal ml-0.5">/kWh</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Total project ÷ energy capacity
                    </div>
                  </div>
                )}
                {quote.equipmentCosts.allInPerKW && (
                  <div className="bg-white/[0.02] rounded-md p-2.5">
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                      All-In $/kW
                    </div>
                    <div className="text-lg font-bold text-white tabular-nums">
                      {fmtUSD(quote.equipmentCosts.allInPerKW)}
                      <span className="text-xs text-slate-500 font-normal ml-0.5">/kW</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Total project ÷ power rating
                    </div>
                  </div>
                )}
              </div>
              {/* Component-level unit costs */}
              {(quote.equipmentCosts.batteryPerKWh || quote.equipmentCosts.solarPerWatt) && (
                <div className="mt-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {quote.equipmentCosts.batteryPerKWh && (
                      <span className="text-[11px] text-slate-400">
                        Battery:{" "}
                        <span className="font-semibold text-slate-300">
                          {fmtUSD(quote.equipmentCosts.batteryPerKWh)}/kWh
                        </span>
                      </span>
                    )}
                    {quote.equipmentCosts.inverterPerKW && (
                      <span className="text-[11px] text-slate-400">
                        PCS:{" "}
                        <span className="font-semibold text-slate-300">
                          {fmtUSD(quote.equipmentCosts.inverterPerKW)}/kW
                        </span>
                      </span>
                    )}
                    {quote.equipmentCosts.solarPerWatt && (
                      <span className="text-[11px] text-slate-400">
                        Solar:{" "}
                        <span className="font-semibold text-slate-300">
                          ${Number(quote.equipmentCosts.solarPerWatt).toFixed(2)}/W
                        </span>
                      </span>
                    )}
                    {quote.equipmentCosts.generatorPerKW && (
                      <span className="text-[11px] text-slate-400">
                        Gen:{" "}
                        <span className="font-semibold text-slate-300">
                          {fmtUSD(quote.equipmentCosts.generatorPerKW)}/kW
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ================================================================
          EQUIPMENT COST BREAKDOWN — Component-level detail
      ================================================================ */}
      {quoteReady && quote.equipmentCosts && quote.equipmentCosts.totalEquipmentCost && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1.5 font-semibold">
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Equipment Cost Breakdown
          </summary>
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="divide-y divide-white/[0.04]">
              {quote.equipmentCosts.batteryCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-slate-300">Battery Storage</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtUSD(quote.equipmentCosts.batteryCost)}
                    </span>
                    {quote.equipmentCosts.batteryPerKWh && (
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        ({fmtUSD(quote.equipmentCosts.batteryPerKWh)}/kWh)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {quote.equipmentCosts.inverterCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-slate-300">Inverter / PCS</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtUSD(quote.equipmentCosts.inverterCost)}
                    </span>
                    {quote.equipmentCosts.inverterPerKW && (
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        ({fmtUSD(quote.equipmentCosts.inverterPerKW)}/kW)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {quote.equipmentCosts.transformerCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-slate-300">Transformer</span>
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtUSD(quote.equipmentCosts.transformerCost)}
                  </span>
                </div>
              )}
              {quote.equipmentCosts.switchgearCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs text-slate-300">Switchgear</span>
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtUSD(quote.equipmentCosts.switchgearCost)}
                  </span>
                </div>
              )}
              {quote.equipmentCosts.solarCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-slate-300">Solar Array</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtUSD(quote.equipmentCosts.solarCost)}
                    </span>
                    {quote.equipmentCosts.solarPerWatt && (
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        (${Number(quote.equipmentCosts.solarPerWatt).toFixed(2)}/W)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {quote.equipmentCosts.generatorCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs text-slate-300">Backup Generator</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white tabular-nums">
                      {fmtUSD(quote.equipmentCosts.generatorCost)}
                    </span>
                    {quote.equipmentCosts.generatorPerKW && (
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        ({fmtUSD(quote.equipmentCosts.generatorPerKW)}/kW)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {quote.equipmentCosts.installationCost != null && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-300">Installation / BOS / EPC</span>
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtUSD(quote.equipmentCosts.installationCost)}
                  </span>
                </div>
              )}
              {/* Total line */}
              <div className="flex items-center justify-between py-2 pt-3">
                <span className="text-xs font-semibold text-slate-200">Base Equipment Total</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {fmtUSD(quote.equipmentCosts.totalEquipmentCost)}
                </span>
              </div>
            </div>
          </div>
        </details>
      )}

      {/* ================================================================
          ADVANCED ANALYTICS — Degradation, ITC, Rates, 8760, Risk
          Surfaces rich metadata from unifiedQuoteCalculator (Feb 2026)
      ================================================================ */}
      {quoteReady && quote.metadata && (
        <AdvancedAnalyticsPanels
          metadata={quote.metadata}
          hasSolar={(quote.solarKW as number) > 0}
        />
      )}

      {/* ================================================================
          SCENARIO COMPARISON — Conservative / Balanced / Aggressive
      ================================================================ */}
      {quoteReady && <ScenarioComparison quote={quote} />}

      {/* ================================================================
          FINANCIAL CHARTS — Cash flow, Risk bands, Solar, Degradation
      ================================================================ */}
      {quoteReady && <QuoteCharts quote={quote} />}

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
        getEffectiveTier() !== "business" && <ProTeaserPanels />}

      {/* ================================================================
          PROQUOTE™ UPSELL — Merlin is the salesman
      ================================================================ */}
      <div className="rounded-xl border-2 border-white/[0.08] bg-white/[0.03] p-4 sm:p-6 hover:border-white/[0.12] transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          <div className="shrink-0 hidden sm:block">
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
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border-2 border-[#3ECF8E]/30 bg-[#3ECF8E]/[0.06] hover:border-[#3ECF8E]/50 hover:bg-[#3ECF8E]/[0.12] transition-all w-full sm:w-auto sm:shrink-0 group"
          >
            <Sparkles className="w-4 h-4 text-[#3ECF8E]" />
            <span className="text-sm font-bold text-[#3ECF8E] tracking-wide">Open ProQuote™</span>
          </button>
        </div>
      </div>

      {/* ================================================================
          VENDOR / EPC PORTAL CTA — Bring vendors into the platform
      ================================================================ */}
      <div className="rounded-xl border-2 border-blue-500/[0.12] bg-blue-500/[0.03] p-4 sm:p-6 hover:border-blue-500/[0.20] transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-500/10 items-center justify-center hidden sm:flex">
            <Building2 className="w-7 h-7 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-1">
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
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border-2 border-blue-400/30 bg-blue-400/[0.06] hover:border-blue-400/50 hover:bg-blue-400/[0.12] transition-all w-full sm:w-auto sm:shrink-0 group no-underline"
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
