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
} from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
} from "@/wizard/v7/hooks/useWizardV7";
import { DEFAULT_ADD_ONS } from "@/wizard/v7/hooks/useWizardV7";
import { sanitizeQuoteForDisplay, type DisplayQuote, type DisplayHints } from "@/wizard/v7/utils/pricingSanity";
import { buildV7ExportData } from "@/utils/buildV7ExportData";
import { exportQuoteAsPDF, exportQuoteAsWord, exportQuoteAsExcel } from "@/utils/quoteExportUtils";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import { getIndustryMeta } from "@/wizard/v7/industryMeta";
import { SystemAddOnsCards } from "./SystemAddOnsCards";

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

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** Stat pill — instrument readout (illuminated stroke + glow) */
function StatPill({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  // Map accent class to a glow color for the border
  const glowMap: Record<string, string> = {
    "text-amber-400": "shadow-amber-500/20 border-amber-500/20",
    "text-violet-400": "shadow-violet-500/20 border-violet-500/20",
    "text-blue-400": "shadow-blue-500/20 border-blue-500/20",
    "text-yellow-400": "shadow-yellow-500/20 border-yellow-500/20",
    "text-red-400": "shadow-red-500/20 border-red-500/20",
    "text-emerald-400": "shadow-emerald-500/20 border-emerald-500/20",
  };
  const glow = glowMap[accent ?? ""] ?? "shadow-slate-500/10 border-white/[0.06]";

  return (
    <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.03] border min-w-[120px] shadow-[0_0_12px] transition-shadow hover:shadow-[0_0_18px] ${glow}`}>
      <div className={accent || "text-slate-400"}>{icon}</div>
      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-[0.08em]">{label}</div>
      <div className="text-base font-black text-slate-100 tabular-nums tracking-tight">{value}</div>
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

function resolveBadge(
  pricingStatus: PricingStatus,
  templateMode: "industry" | "fallback",
  quote: Record<string, unknown> | null,
): BadgeResult {
  // Gate 1: Pricing not ready → Load Profile Only
  if (pricingStatus !== "ok" || !quote?.pricingComplete) {
    return { tier: "load-only", label: "⚠️ Load Profile Only — Financial calculations pending" };
  }

  // Gate 2: Fallback template or confidence → Estimate
  if (templateMode === "fallback") {
    return { tier: "estimate", label: "📊 Estimate — General facility model" };
  }
  const confidence = quote.confidence as Record<string, unknown> | undefined;
  if (confidence?.industry === "fallback") {
    return { tier: "estimate", label: "📊 Estimate — General facility model" };
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
  return { tier: "estimate", label: "📊 Estimate — Partial validation" };
}

// ============================================================================
// CONTRIBUTOR HELPERS — Pure display formatting for "Why this size?" drawer
// ============================================================================

type ContributorEntry = { key: string; kW: number; pct: number };

function getTopContributors(
  kWContributors: Record<string, number>,
  count: number,
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

export default function Step4ResultsV7({ state, actions }: Props) {
  // ============================================================================
  // PHASE 6: PRICING STATUS (non-blocking)
  // ============================================================================
  const pricingStatus: PricingStatus = state.pricingStatus ?? "idle";
  const pricingWarnings: string[] = state.pricingWarnings ?? [];
  const pricingError: string | null = state.pricingError ?? null;

  // Raw quote from state (may contain poison: NaN, Infinity, negative)
  const quoteRaw = state.quote ?? null;

  // Sanitized quote — poison values replaced with null for safe rendering
  // Returns typed DisplayQuote (Move 8 contract)
  const quote: DisplayQuote = useMemo(
    () => sanitizeQuoteForDisplay(quoteRaw),
    [quoteRaw]
  );

  const locLine = useMemo(() => {
    if (!state.location) return "—";
    const parts = [state.location.city, state.location.state, state.location.postalCode].filter(
      Boolean
    );
    return parts.length ? parts.join(", ") : state.location.formattedAddress;
  }, [state.location]);

  const quoteReady = pricingStatus === "ok" && !!quoteRaw;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ================================================================
          HEADER — Industry + Location + Navigation
      ================================================================ */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{getIndustryMeta(state.industry).label}</span>
            <span className="text-slate-600">•</span>
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{locLine}</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Your Energy Quote
          </h1>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={actions.goBack}
            className="h-9 px-3.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] font-bold text-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={actions.resetSession}
            className="h-9 px-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] text-red-400 hover:bg-red-500/[0.12] font-bold text-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* ================================================================
          QUOTE RESULTS — Show immediately (no add-ons gate)
      ================================================================ */}

      {/* ================================================================
          PARTIAL RESULTS / FALLBACK / STATUS BANNERS — Kept from original
      ================================================================ */}
      {quote?.isProvisional && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 text-sm">Provisional Results</div>
              <p className="text-amber-200/70 text-xs mt-1">
                {quote.missingInputs?.length
                  ? `${quote.missingInputs.length} inputs missing — using defaults. `
                  : "Some inputs missing — using defaults. "}
                Results may not reflect your actual load profile.
                <button onClick={() => actions.goToStep?.("profile")} className="ml-1.5 underline font-bold text-amber-300 hover:text-amber-200">
                  Complete Step 3 →
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {state.templateMode === "fallback" && (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.05] p-4">
          <div className="font-bold text-blue-300 text-sm">📋 Estimate Mode</div>
          <p className="text-blue-200/70 text-xs mt-1.5">
            Using a general facility model. Numbers are directionally correct but won't carry TrueQuote™ attribution.
          </p>
          {actions.retryTemplate && (
            <button onClick={() => void actions.retryTemplate?.()} disabled={state.busy}
              className="mt-2.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 font-bold text-xs hover:bg-blue-500/[0.15] disabled:opacity-40 transition-colors">
              {state.busy ? "Retrying…" : "Retry industry profile →"}
            </button>
          )}
        </div>
      )}

      {/* Pricing status banners */}
      {pricingStatus === "pending" && (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.04] p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <div>
            <span className="font-bold text-blue-300 text-sm">Calculating quote…</span>
            <span className="text-blue-200/60 text-xs ml-2">This won't block navigation</span>
          </div>
        </div>
      )}

      {pricingStatus === "error" && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4">
          <div className="font-bold text-red-300 text-sm mb-1.5">🚨 Pricing engine error</div>
          <pre className="text-red-300/70 text-xs font-mono whitespace-pre-wrap">{pricingError || "Unknown error"}</pre>
          {actions.retryPricing && (
            <button onClick={() => actions.retryPricing?.()} className="mt-2.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 font-bold text-xs hover:bg-red-500/[0.15] transition-colors">
              🔄 Retry pricing
            </button>
          )}
        </div>
      )}

      {pricingStatus === "timed_out" && (
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-4">
          <div className="font-bold text-orange-300 text-sm">⏱️ Pricing timed out</div>
          <p className="text-orange-200/70 text-xs mt-1.5">Your load profile is still available below.</p>
          {actions.retryPricing && (
            <button onClick={() => actions.retryPricing?.()} className="mt-2.5 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 font-bold text-xs hover:bg-orange-500/[0.15] transition-colors">
              🔄 Retry pricing
            </button>
          )}
        </div>
      )}

      {pricingStatus === "ok" && pricingWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
          <div className="font-bold text-amber-300 text-sm">⚠️ Warnings detected</div>
          <ul className="mt-1.5 pl-4 text-amber-200/70 text-xs list-disc space-y-0.5">
            {pricingWarnings.slice(0, 5).map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* ================================================================
          HERO SAVINGS — Big number, compelling
      ================================================================ */}
      {quoteReady && quote.annualSavingsUSD != null && Number(quote.annualSavingsUSD) > 0 && (
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-cyan-600/15 to-purple-600/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.25),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.15),transparent_50%)]" />

          <div className="relative p-8 border border-emerald-500/25 rounded-3xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">Projected Annual Savings</span>
              </div>
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent leading-none">
                {fmtUSD(quote.annualSavingsUSD as number | null)}
              </div>
              <div className="text-lg text-slate-400 mt-1.5">per year</div>

              {/* ROI snapshot below hero */}
              {quote.roiYears != null && Number(quote.roiYears) > 0 && (
                <div className="mt-5 inline-flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">
                    Payback in <strong className="text-emerald-300">{parseFloat(Number(quote.roiYears).toFixed(1))} years</strong>
                  </span>
                  {quote.irr != null && (() => {
                    const raw = Number(quote.irr);
                    if (!Number.isFinite(raw)) return null;
                    const pct = raw > 1 ? raw : raw * 100;
                    if (pct > 200 || pct <= 0) return null;
                    return (
                      <>
                        <span className="text-slate-600">|</span>
                        <span className="text-sm text-slate-300">
                          IRR <strong className="text-purple-300">{pct.toFixed(1)}%</strong>
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
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatPill
            icon={<Zap className="w-4 h-4" />}
            label="Peak Load"
            value={quote.peakLoadKW ? `${fmtNum(Math.round(quote.peakLoadKW))} kW` : "—"}
            accent="text-amber-400"
          />
          <StatPill
            icon={<Battery className="w-4 h-4" />}
            label="BESS"
            value={quote.bessKWh ? `${fmtNum(Math.round(quote.bessKWh))} kWh` : "—"}
            accent="text-violet-400"
          />
          <StatPill
            icon={<Zap className="w-4 h-4" />}
            label="Duration"
            value={quote.durationHours ? `${fmtNum(quote.durationHours)} hrs` : "—"}
            accent="text-blue-400"
          />
          {(quote.solarKW as number) > 0 && (
            <StatPill
              icon={<Sun className="w-4 h-4" />}
              label="Solar"
              value={`${fmtNum(Math.round(quote.solarKW as number))} kW`}
              accent="text-yellow-400"
            />
          )}
          {(quote.generatorKW as number) > 0 && (
            <StatPill
              icon={<Fuel className="w-4 h-4" />}
              label="Generator"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equipment Card */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Battery className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Equipment Summary</h3>
            </div>
            <div className="space-y-2.5">
              {quote.bessKWh != null && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔋</span>
                    <span className="text-sm text-slate-300">Battery Storage</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{fmtNum(Math.round(quote.bessKWh))} kWh</div>
                    {quote.bessKW != null && <div className="text-xs text-slate-500">{fmtNum(Math.round(quote.bessKW))} kW</div>}
                  </div>
                </div>
              )}
              {quote.durationHours != null && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏱️</span>
                    <span className="text-sm text-slate-300">Duration</span>
                  </div>
                  <div className="text-sm font-bold text-white">{fmtNum(quote.durationHours)} hours</div>
                </div>
              )}
              {(quote.solarKW as number) > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">☀️</span>
                    <span className="text-sm text-slate-300">Solar Array</span>
                  </div>
                  <div className="text-sm font-bold text-white">{fmtNum(Math.round(quote.solarKW as number))} kW</div>
                </div>
              )}
              {(quote.generatorKW as number) > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm text-slate-300">Backup Generator</span>
                  </div>
                  <div className="text-sm font-bold text-white">{fmtNum(Math.round(quote.generatorKW as number))} kW</div>
                </div>
              )}
              {/* Load profile */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm text-slate-300">Peak Demand</span>
                </div>
                <div className="text-sm font-bold text-white">{quote.peakLoadKW ? `${fmtNum(Math.round(quote.peakLoadKW))} kW` : "—"}</div>
              </div>
            </div>
          </Card>

          {/* Financial Card */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Financial Summary</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span className="text-sm text-slate-300">Total Investment</span>
                <span className="text-sm font-bold text-white">{fmtUSD(quote.capexUSD as number | null)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span className="text-sm text-slate-300">Annual Savings</span>
                <span className="text-sm font-bold text-emerald-400">{fmtUSD(quote.annualSavingsUSD as number | null)}</span>
              </div>
              {quote.demandChargeSavings != null && Number(quote.demandChargeSavings) > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-sm text-slate-300">Demand Charge Savings</span>
                  <span className="text-sm font-bold text-cyan-400">{fmtUSD(quote.demandChargeSavings as number | null)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <span className="text-sm text-slate-300">Simple Payback</span>
                <span className="text-sm font-bold text-white">
                  {quote.roiYears != null && Number(quote.roiYears) > 0 ? `${parseFloat(Number(quote.roiYears).toFixed(1))} years` : "—"}
                </span>
              </div>
              {quote.npv != null && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-sm text-slate-300">NPV (25yr)</span>
                  <span className="text-sm font-bold text-purple-300">{fmtUSD(quote.npv as number | null)}</span>
                </div>
              )}
              {quote.irr != null && (
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-sm text-slate-300">IRR</span>
                  <span className="text-sm font-bold text-purple-300">{(() => {
                    const raw = Number(quote.irr);
                    if (!Number.isFinite(raw)) return "—";
                    const pct = raw > 1 ? raw : raw * 100;
                    if (pct > 200) return ">200%";
                    return `${pct.toFixed(1)}%`;
                  })()}</span>
                </div>
              )}
              {quote.paybackYears != null && Number(quote.paybackYears) > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-300">Discounted Payback</span>
                  <span className="text-sm font-bold text-white">{parseFloat(Number(quote.paybackYears).toFixed(1))} years</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ================================================================
          TRUEQUOTE™ STATUS BADGE — Deterministic from envelope fields
          Rule: Step 4 renders, it doesn't decide.
          Badge = f(pricingStatus, templateMode, confidence, trueQuoteValidation)
      ================================================================ */}
      {(() => {
        const badge = resolveBadge(pricingStatus, state.templateMode, quote);
        const badgeStyles: Record<string, string> = {
          truequote: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
          estimate: "bg-blue-500/10 border-blue-500/25 text-blue-400",
          "load-only": "bg-amber-500/10 border-amber-500/25 text-amber-400",
        };
        return (
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${badgeStyles[badge.tier]}`}>
              {badge.label}
            </div>
          </div>
        );
      })()}

      {/* ================================================================
          WHY THIS SIZE? — Trust accelerator
          PREFERS _displayHints (pre-computed by sanitizer, stable ordering)
          FALLS BACK to getTopContributors if hints missing
          Reads quote.trueQuoteValidation (sealed envelope data)
      ================================================================ */}
      {quoteReady && quote.trueQuoteValidation?.kWContributors && (() => {
        // Graceful degradation: prefer _displayHints (stable, sanitized), fall back to live computation
        const hints = quote._displayHints;
        const contributors = hints?.topContributors?.length > 0
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
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Top Load Contributors</div>
                <div className="space-y-1.5">
                  {contributors.map((c) => (
                    <div key={c.key} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300 capitalize">{formatContributorKey(c.key)}</span>
                          <span className="text-xs font-bold text-slate-200 tabular-nums">{fmtNum(Math.round(c.kW))} kW</span>
                        </div>
                        {/* Proportion bar */}
                        <div className="mt-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-blue-500/60"
                            style={{ width: `${Math.min(c.pct * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">{Math.round(c.pct * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key assumptions from validation envelope */}
              {quote.trueQuoteValidation?.assumptions && quote.trueQuoteValidation.assumptions.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Key Assumptions</div>
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
            {quote.notes.map((n: string, i: number) => <li key={i}>{n}</li>)}
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
          onRecalculate={async (addOns) => {
            if (actions.recalculateWithAddOns) {
              return await actions.recalculateWithAddOns(addOns);
            }
            return { ok: true };
          }}
        />
      )}

      {/* ================================================================
          EXPORT / DOWNLOAD — TrueQuote™ branded exports
          Available whenever we have at least a load profile (Layer A)
      ================================================================ */}
      {quote && quote.peakLoadKW != null && <ExportBar state={state} />}
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

type RecommendationType = "power-gap" | "solar-opportunity" | "ev-revenue" | "resilience" | "cost-savings";

interface Recommendation {
  type: RecommendationType;
  icon: string;
  title: string;
  description: string;
  accent: string; // Tailwind border/bg color class
}

function getAdvisorRecommendations(
  state: WizardV7State,
  quote: DisplayQuote,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const peakKW = quote.peakLoadKW ?? 0;
  const bessKW = quote.bessKW ?? 0;
  const hasSolar = (quote.solarKW as number) > 0;
  const hasGenerator = (quote.generatorKW as number) > 0;
  const goals = state.goals ?? [];

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
    const stateAbbr = state.location?.state ?? "";
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
  const isEVIndustry = state.industry === "ev_charging" || state.industry === "ev-charging";
  if (!isEVIndustry) {
    const hasCustomerTraffic = ["hotel", "retail", "shopping-center", "car_wash", "car-wash", "restaurant", "gas_station", "gas-station", "casino"].includes(state.industry ?? "");
    if (hasCustomerTraffic) {
      recs.push({
        type: "ev-revenue",
        icon: "🔌",
        title: "Add EV charging as a revenue source",
        description: "Your facility type sees regular customer traffic. Adding EV chargers creates a new revenue stream while your BESS handles peak demand from charging sessions — keeping your demand charges low.",
        accent: "cyan",
      });
    }
  }

  // 4. Resilience — if goals mention backup/resilience and no generator
  const wantsResilience = goals.some(g => 
    typeof g === "string" && (g.toLowerCase().includes("backup") || g.toLowerCase().includes("resilien") || g.toLowerCase().includes("outage"))
  );
  if (wantsResilience && !hasGenerator) {
    recs.push({
      type: "resilience",
      icon: "🛡️",
      title: "Strengthen your backup power",
      description: "You mentioned power resilience as a goal. Adding a backup generator alongside your BESS ensures uninterrupted operations during extended outages beyond your battery duration.",
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
  amber:   { border: "border-amber-500/25",   bg: "bg-amber-500/[0.06]",   text: "text-amber-300",   glow: "shadow-amber-500/10" },
  yellow:  { border: "border-yellow-500/25",  bg: "bg-yellow-500/[0.06]",  text: "text-yellow-300",  glow: "shadow-yellow-500/10" },
  cyan:    { border: "border-cyan-500/25",    bg: "bg-cyan-500/[0.06]",    text: "text-cyan-300",    glow: "shadow-cyan-500/10" },
  red:     { border: "border-red-500/25",     bg: "bg-red-500/[0.06]",     text: "text-red-300",     glow: "shadow-red-500/10" },
  emerald: { border: "border-emerald-500/25", bg: "bg-emerald-500/[0.06]", text: "text-emerald-300", glow: "shadow-emerald-500/10" },
};

function AdvisorRecommendations({
  state,
  quote,
  pricingStatus,
  onRecalculate,
}: {
  state: WizardV7State;
  quote: DisplayQuote;
  pricingStatus: PricingStatus;
  onRecalculate: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
}) {
  const recommendations = useMemo(
    () => getAdvisorRecommendations(state, quote),
    [state, quote]
  );

  const [expanded, setExpanded] = useState(true);

  if (recommendations.length === 0) {
    // No recommendations — just show the add-ons panel for manual config
    return (
      <SystemAddOnsCards
        state={state}
        currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
        onRecalculate={onRecalculate}
        pricingStatus={pricingStatus}
        showGenerateButton={false}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Advisor header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full"
      >
        <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/[0.08] to-blue-500/[0.06] p-4 flex items-center justify-between hover:from-purple-500/[0.12] hover:to-blue-500/[0.08] transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
              🧙‍♂️
            </div>
            <div className="text-left">
              <div className="font-black text-sm text-purple-200">
                Merlin's Recommendations
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {recommendations.length} suggestion{recommendations.length !== 1 ? "s" : ""} to optimize your project
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
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
                className={`rounded-xl border ${style.border} ${style.bg} p-4 shadow-[0_0_15px] ${style.glow} transition-all hover:shadow-[0_0_20px]`}
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

          {/* Configure add-ons CTA */}
          <div className="pt-1">
            <SystemAddOnsCards
              state={state}
              currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
              onRecalculate={onRecalculate}
              pricingStatus={pricingStatus}
              showGenerateButton={false}
            />
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

function ExportBar({ state }: { state: WizardV7State }) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExporting(format);
      setError(null);

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
    { format: "pdf", icon: "📄", label: "PDF" },
    { format: "word", icon: "📝", label: "Word" },
    { format: "excel", icon: "📊", label: "Excel" },
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "rgba(232,235,243,0.95)" }}>Download Quote</div>
          <div style={{ fontSize: 12, color: "rgba(232,235,243,0.5)", marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isTrueQuote
              ? <><TrueQuoteBadgeCanonical showTooltip={false} /><span>includes kW breakdown, confidence score & methodology</span></>
              : hasPricing
                ? <span style={{ color: "rgba(232,235,243,0.6)" }}>📊 Estimate — includes financial projections</span>
                : <span style={{ color: "rgba(232,235,243,0.5)" }}>📋 Load profile only — pricing pending</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {buttons.map(({ format, icon, label }) => (
            <button
              key={format}
              type="button"
              onClick={() => void handleExport(format)}
              disabled={exporting !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid rgba(79,140,255,0.3)",
                background:
                  exporting === format ? "rgba(79,140,255,0.2)" : "rgba(79,140,255,0.08)",
                color: exporting !== null && exporting !== format ? "rgba(232,235,243,0.3)" : "rgba(79,140,255,0.9)",
                cursor: exporting !== null ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 13,
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
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
    </Card>
  );
}
