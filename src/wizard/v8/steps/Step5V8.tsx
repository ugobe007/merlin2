/**
 * WIZARD V8 — STEP 5: QUOTE RESULTS (COMPLETE V7 PARITY)
 *
 * Full V7 feature parity:
 * - TrueQuote™ gold badge (clickable) → opens financial modal
 * - PDF/Word/Excel export buttons with lead capture gate
 * - ProQuote™ upsell banner
 * - Detailed equipment & financial breakdown
 * - Hero savings display
 * - System specs stats bar
 */

import React, { useState, useCallback } from "react";
import type { WizardState, WizardActions } from "../wizardState";
import {
  Battery,
  Sun,
  Zap,
  Fuel,
  TrendingUp,
  MapPin,
  Building2,
  Sparkles,
  RefreshCw,
  Shield,
  Download,
  FileText,
  Bookmark,
  X,
  Mail,
} from "lucide-react";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";
import TrueQuoteFinancialModal from "@/components/wizard/v7/shared/TrueQuoteFinancialModal";
import { buildV8ExportData } from "../utils/buildV8ExportData";
import { exportQuoteAsPDF, exportQuoteAsWord, exportQuoteAsExcel } from "@/utils/quoteExportUtils";
import {
  isUserAuthenticated,
  peekQuotaRemaining,
  trackQuoteGenerated,
} from "@/services/subscriptionService";
import { supabase } from "@/services/supabaseClient";
import { formatCurrency } from "@/services/internationalService";
import { getRecommendedInstallers, type RecommendedInstaller } from "@/services/installerService";

// Removed unused DARK color constants

function fmt$(n: number | null | undefined, countryCode?: string): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  try {
    return formatCurrency(n, countryCode || "US");
  } catch {
    return `$${Math.round(n)}`;
  }
}

function fmtNum(n: number | null | undefined, fallback = "—"): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return fallback;
  return String(Math.round(n));
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

function StatItem({ icon, label, value, accent }: StatItemProps) {
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

interface Props {
  state: WizardState;
  actions: WizardActions;
}

export default function Step5V8({ state, actions }: Props) {
  // ═══════════════════════════════════════════════════════════════════════
  // 🔧 HOOKS - MUST BE CALLED FIRST BEFORE ANY CONDITIONAL RETURNS
  // ═══════════════════════════════════════════════════════════════════════

  // Modal states
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showProQuoteModal, setShowProQuoteModal] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "word" | "excel" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Installer recommendations
  const [installers, setInstallers] = useState<RecommendedInstaller[]>([]);
  const [loadingInstallers, setLoadingInstallers] = useState(false);

  // ── LEAD CAPTURE GATE ────────────────────────────────────────────
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<"pdf" | "word" | "excel" | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(() => {
    return isUserAuthenticated() || sessionStorage.getItem("merlin_lead_captured") === "true";
  });
  const [leadForm, setLeadForm] = useState({ name: "", email: "", company: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // ── ALL CALLBACKS AND EFFECTS (MUST BE BEFORE EARLY RETURN) ────
  const handleLeadSubmit = useCallback(async () => {
    if (!leadForm.email || !leadForm.name) return;
    setLeadSubmitting(true);
    try {
      await supabase.from("leads").insert([
        {
          name: leadForm.name,
          email: leadForm.email,
          company: leadForm.company || null,
          source: `wizard-v8-${state.industry || "unknown"}`,
          format: pendingFormat || "pdf",
        },
      ]);
    } catch {
      // Don't block UX on lead capture failure
    }
    setLeadCaptured(true);
    sessionStorage.setItem("merlin_lead_captured", "true");
    setShowLeadGate(false);
    setLeadSubmitting(false);
  }, [leadForm, pendingFormat, state.industry]);

  const handleSkipLead = useCallback(() => {
    setLeadCaptured(true);
    sessionStorage.setItem("merlin_lead_captured", "true");
    setShowLeadGate(false);
  }, []);

  // Export handler with real export integration
  const handleExport = useCallback(
    async (format: "pdf" | "word" | "excel", bypassLeadGate = false) => {
      setExportError(null);

      // ── LEAD CAPTURE GATE: Show form before first export for guests ──
      if (!bypassLeadGate && !leadCaptured && !isUserAuthenticated()) {
        setPendingFormat(format);
        setShowLeadGate(true);
        return;
      }

      // ── QUOTA CHECK: Only exports count as "delivered quotes" ──
      const quota = peekQuotaRemaining("quote");
      if (!quota.allowed) {
        setExportError(
          `You've used all ${quota.limit} free quote exports this session. Sign up for more!`
        );
        return;
      }

      setExportingFormat(format);

      try {
        const data = buildV8ExportData(state);

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
        trackQuoteGenerated();
      } catch (err) {
        setExportError(`Export failed — ${(err as Error).message || "please try again"}`);
      } finally {
        setExportingFormat(null);
      }
    },
    [state, leadCaptured]
  );

  // ── SOCIAL MEDIA SHARING (needs tier data from below, so this will be moved after validation) ────
  // This will be moved after tier validation

  // ═══════════════════════════════════════════════════════════════════════
  // 📊 STATE VALIDATION AND DATA EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════

  const { tiers, selectedTierIndex, location, industry } = state;
  const tier = tiers && selectedTierIndex !== null ? tiers[selectedTierIndex] : undefined;
  const countryCode = state.countryCode || state.country || "US";

  // Debug logging (dev only, runs once on mount)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        "[Step5V8] Mounted with tier:",
        tier ? `${tier.label} - ${tier.bessKW}kW` : "none"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-trigger pending export after lead capture completes ──
  React.useEffect(() => {
    if (leadCaptured && pendingFormat && !showLeadGate && !exportingFormat) {
      const fmt = pendingFormat;
      setPendingFormat(null);
      handleExport(fmt, true);
    }
  }, [leadCaptured, pendingFormat, showLeadGate, exportingFormat, handleExport]);

  // ── Fetch recommended installers based on location and project type ──
  // Only fetch once when state code and tier data become available
  React.useEffect(() => {
    const stateCode = location?.state;

    if (!stateCode || !tier || loadingInstallers || installers.length > 0) {
      // Skip if: no location, no tier, already loading, or already have results
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[Step5V8] Fetching installers for state:", stateCode);
    }

    let mounted = true;
    setLoadingInstallers(true);

    async function fetchInstallers() {
      try {
        // Guard: ensure tier exists
        if (!tier) {
          console.warn("[Step5V8] No tier selected, skipping installer fetch");
          return;
        }

        // Determine installer type based on system configuration
        let installerType: "solar" | "bess" | "ev_charging" | "generator" = "bess";
        if (tier.solarKW > 0 && tier.bessKWh > 0) {
          installerType = "solar"; // Solar+Storage projects get solar installers
        } else if (tier.solarKW > 0) {
          installerType = "solar";
        } else if (tier.generatorKW > 0) {
          installerType = "generator";
        } else if (tier.evChargerKW > 0) {
          installerType = "ev_charging";
        }

        const projectSizeKW = tier.solarKW || tier.bessKW || tier.bessKWh / 4 || 500;

        if (import.meta.env.DEV) {
          console.log("[Step5V8] Fetching installers:", { installerType, projectSizeKW });
        }

        const results = await getRecommendedInstallers(
          stateCode || "CA",
          installerType,
          projectSizeKW
        );

        if (mounted) {
          if (import.meta.env.DEV) {
            console.log("[Step5V8] Installer results:", results);
          }
          setInstallers(results);
          setLoadingInstallers(false);
        }
      } catch (error) {
        if (mounted) {
          console.error("[Step5V8] Failed to fetch installers:", error);
          setInstallers([]);
          setLoadingInstallers(false);
        }
      }
    }

    fetchInstallers();

    return () => {
      mounted = false;
    };
    // Only trigger when location.state or tier changes (not on every render)
    // installers.length and loadingInstallers are checked inside effect to prevent refetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state, tier?.bessKW, tier?.solarKW]);

  // ═══════════════════════════════════════════════════════════════════════
  // 🚫 EARLY RETURN CHECK - ONLY AFTER ALL HOOKS
  // ═══════════════════════════════════════════════════════════════════════

  if (!tier) {
    console.error("[Step5V8] No tier data available!", { tiers, selectedTierIndex });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl">⚠️ No tier data available</div>
          <button
            onClick={() => actions.goToStep(5)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            ← Back to Configuration
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 📊 FORMATTING HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  const locationLine = location ? [location.city, location.state].filter(Boolean).join(", ") : "";

  const quoteRef = `MQ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${location?.zip?.slice(0, 4) ?? '0000'}`;
  const quoteDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-4">
      {/* ================================================================
          HEADER — Document-style quote header
      ================================================================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
              Quote Ref:
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400/80">{quoteRef}</span>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] text-slate-500">{quoteDate}</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="capitalize">
              {industry?.replace(/_/g, " ") || "Facility"} Energy System
            </span>
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{locationLine || "—"}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowFinancialModal(true)}
            className="h-8 px-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] text-amber-400/80 hover:bg-amber-500/[0.10] font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3 h-3" />
            TrueQuote™
          </button>
        </div>
      </div>

      {/* ================================================================
          HERO SAVINGS — Big number, compelling
      ================================================================ */}
      {tier.annualSavings > 0 && (
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            boxShadow:
              "0 0 0 1px rgba(52,211,153,0.14), 0 0 50px rgba(52,211,153,0.12), 0 8px 32px rgba(0,0,0,0.35)",
          }}
        >
          <div className="absolute inset-0" style={{ background: "rgba(52,211,153,0.025)" }} />

          <div
            className="relative p-8 rounded-xl"
            style={{
              border: "2px solid rgba(52,211,153,0.40)",
              background: "rgba(52,211,153,0.03)",
            }}
          >
            <div className="text-center">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4"
                style={{
                  background: "rgba(62,207,142,0.10)",
                  border: "1px solid rgba(62,207,142,0.28)",
                }}
              >
                <span className="text-[#3ECF8E] font-semibold text-xs uppercase tracking-wider">
                  Projected Annual Savings
                </span>
              </div>
              <div
                className="text-5xl md:text-6xl font-bold text-[#3ECF8E] leading-none"
              >
                {fmt$(tier.annualSavings, countryCode)}
              </div>
              <div className="text-lg text-slate-400 mt-1.5">per year</div>

              {/* ROI snapshot below hero */}
              <div className="mt-5 inline-flex items-center gap-4 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <TrendingUp className="w-4 h-4 text-[#3ECF8E]" />
                <span className="text-sm text-slate-300">
                  Payback in{" "}
                  <strong className="text-[#3ECF8E]">{Math.round(tier.paybackYears)} years</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-sm text-slate-300">
                  10yr ROI <strong className="text-[#3ECF8E]">{tier.roi10Year.toFixed(0)}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          STATS BAR — Key metrics at a glance
      ================================================================ */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2 border-b border-white/[0.06]">
        <StatItem
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Base"
          value={`${fmtNum(state.baseLoadKW)} kW`}
          accent="text-amber-400"
        />
        <StatItem
          icon={<Battery className="w-3.5 h-3.5" />}
          label="BESS"
          value={`${fmtNum(tier.bessKWh)} kWh`}
          accent="text-violet-400"
        />
        <StatItem
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Duration"
          value={`${fmtNum(tier.durationHours)} hrs`}
          accent="text-blue-400"
        />
        {tier.solarKW > 0 && (
          <StatItem
            icon={<Sun className="w-3.5 h-3.5" />}
            label="Solar"
            value={`${fmtNum(tier.solarKW)} kW`}
            accent="text-yellow-400"
          />
        )}
        {tier.generatorKW > 0 && (
          <StatItem
            icon={<Fuel className="w-3.5 h-3.5" />}
            label="Gen"
            value={`${fmtNum(tier.generatorKW)} kW`}
            accent="text-red-400"
          />
        )}
      </div>

      {/* ================================================================
          EQUIPMENT & FINANCIAL SUMMARY — Horizontal layout
      ================================================================ */}
      <div className="border border-white/[0.06] rounded-lg overflow-hidden space-y-0">
        {/* Equipment — horizontal row */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-3">
            <Battery className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Equipment
            </span>
          </div>

          {/* Horizontal badge row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Battery className="w-3.5 h-3.5 text-violet-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Battery</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {fmtNum(tier.bessKWh)} kWh
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Duration
                </span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {fmtNum(tier.durationHours)} hrs
                </span>
              </div>
            </div>

            {tier.solarKW > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Solar</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(tier.solarKW)} kW
                  </span>
                </div>
              </div>
            )}

            {tier.generatorKW > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Generator
                  </span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(tier.generatorKW)} kW
                  </span>
                </div>
              </div>
            )}

            {tier.evChargerKW > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    EV Charging
                  </span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(tier.evChargerKW)} kW
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial — tighter grouped layout */}
        <div className="p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Financials
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Shield className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-bold text-[10px]">TrueQuote™</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.82))] p-5 shadow-[0_0_32px_rgba(16,185,129,0.12)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-[0.28em]">
                      Net Investment
                    </div>
                    <div className="mt-2 text-4xl font-black text-white tracking-tight tabular-nums">
                      {fmt$(tier.netCost, countryCode)}
                    </div>
                    <div className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                      After federal incentives, this is the capital required to put the full system
                      in service.
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Annual Benefit
                    </div>
                    <div className="mt-1 text-xl font-bold text-emerald-400 tabular-nums">
                      {fmt$(tier.annualSavings, countryCode)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Upfront Cost
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white tabular-nums">
                    {fmt$(tier.grossCost, countryCode)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Full installed project value before credits
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">
                    Federal ITC
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-400 tabular-nums">
                    −{fmt$(tier.itcAmount, countryCode)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-200/70">
                    {Math.round(tier.itcRate * 100)}% tax credit applied
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      10-Year Projection
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      Expected cumulative benefit over the first decade
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400 tracking-tight tabular-nums">
                      {fmt$(tier.annualSavings * 10, countryCode)}
                    </div>
                    <div className="text-xs text-slate-500">gross savings outlook</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Payback Window
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-black text-white tabular-nums">
                      {Math.round(tier.paybackYears)}
                    </span>
                    <span className="pb-1 text-sm font-semibold text-slate-400">years</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                      style={{
                        width: `${Math.max(12, Math.min(100, 100 - tier.paybackYears * 7))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    10-Year ROI
                  </div>
                  <div className="mt-2 text-3xl font-black text-emerald-400 tabular-nums">
                    {tier.roi10Year.toFixed(0)}%
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Return relative to post-incentive project cost
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    25-Year NPV
                  </div>
                  <div
                    className={`mt-2 text-3xl font-black tabular-nums ${tier.npv >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {fmt$(tier.npv, countryCode)}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Long-term value after discounting future savings
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowFinancialModal(true)}
                className="w-full rounded-2xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(15,23,42,0.85))] px-4 py-4 text-left hover:border-amber-400/35 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(15,23,42,0.92))] transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/80">
                      Deep Dive
                    </div>
                    <div className="mt-1 text-base font-bold text-amber-300">
                      Open the 10-year financial story
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      Cash flow, incentives, payback curve, and full projection
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          RECOMMENDED INSTALLERS
      ================================================================ */}
      {location?.state && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Certified Installers — {location?.state || "Your Area"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Top-rated contractors for your project size
              </p>
            </div>
          </div>

          {loadingInstallers ? (
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="ml-2 text-xs text-slate-400">Loading installers...</span>
            </div>
          ) : installers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">
                No installers found for {location.state}. We're expanding our network!
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Contact us to add recommended installers in your area.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-2.5 sm:grid-cols-3 mb-3">
                {installers.map((installer, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-emerald-500/25 hover:bg-emerald-500/[0.03] transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-emerald-400/70">
                            #{installer.rank}
                          </span>
                          {installer.tier === 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase">
                              Tier 1
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-100 leading-tight">
                          {installer.company_name}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400">
                      {installer.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">📞</span>
                          <a
                            href={`tel:${installer.phone}`}
                              className="hover:text-emerald-400 transition-colors"
                            >
                              {installer.phone}
                            </a>
                          </div>
                        )}
                        {installer.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">✉️</span>
                            <a
                              href={`mailto:${installer.email}`}
                              className="hover:text-emerald-400 transition-colors truncate"
                            >
                              {installer.email}
                            </a>
                          </div>
                        )}
                        {installer.website && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">🌐</span>
                            <a
                              href={installer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-emerald-400 transition-colors truncate"
                            >
                              {installer.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}

                    {installer.recommendation_reason && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                          {installer.recommendation_reason}
                        </p>
                      </div>
                    )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const emails = installers
                    .map((i) => i.email)
                    .filter(Boolean)
                    .join(",");
                  const subject = encodeURIComponent(
                    `Quote Request - ${industry?.replace(/_/g, " ")} Energy System`
                  );
                  const body = encodeURIComponent(
                    `Hi,\n\nI received a quote from Merlin BESS and would like to request bids from your company.\n\n` +
                      `Project Details:\n` +
                      `- Location: ${location?.city || location?.state || "TBD"}\n` +
                      `- System Size: ${tier ? fmtNum(tier.bessKWh) : "TBD"} kWh storage` +
                      `${tier && tier.solarKW > 0 ? ` + ${fmtNum(tier.solarKW)} kW solar` : ""}\n` +
                      `- Estimated Investment: ${tier ? fmt$(tier.netCost, countryCode) : "TBD"}\n\n` +
                      `Please contact me to discuss this project.\n\n` +
                      `Thank you!`
                  );
                  window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 group"
              >
                <Mail className="w-4 h-4" />
                Request Bids from {installers.length} Installer{installers.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      )}

      {/* ================================================================
          EXPORT / DOWNLOAD — PDF, Word, Excel
      ================================================================ */}
      <div className="rounded-xl border-2 border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.03] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-[#3ECF8E]" />
              <div className="text-lg font-bold text-slate-100 tracking-tight">Download Quote</div>
            </div>
            <p className="text-sm text-slate-400">
              Detailed breakdown with equipment specs, financials & methodology
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {(["pdf", "word", "excel"] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => handleExport(format)}
                disabled={exportingFormat !== null}
                className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border-2 border-[#3ECF8E]/30 bg-[#3ECF8E]/[0.06] hover:border-[#3ECF8E]/50 hover:bg-[#3ECF8E]/[0.10] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingFormat === format ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin text-[#3ECF8E]" />
                    <span className="text-sm font-semibold text-[#3ECF8E]">...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-[#3ECF8E]" />
                    <span className="text-sm font-semibold text-[#3ECF8E]">
                      {format.toUpperCase()}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Export error */}
        {exportError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            {exportError}
          </div>
        )}
      </div>

      {/* ================================================================
          LEAD CAPTURE MODAL
      ================================================================ */}
      {showLeadGate && (
        <div
          className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-5"
          onClick={() => setShowLeadGate(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLeadGate(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-[#3ECF8E]" />
              <h2 className="text-xl font-bold text-slate-100">Get Your Quote</h2>
            </div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Enter your details to download your {pendingFormat?.toUpperCase()} quote. We'll save
              it to your account so you can access it anytime.
            </p>

            <div className="flex flex-col gap-3.5 mb-5">
              <input
                type="text"
                placeholder="Your name *"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30"
              />
              <input
                type="email"
                placeholder="Email address *"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={leadForm.company}
                onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                className="px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLeadSubmit}
                disabled={!leadForm.name || !leadForm.email || leadSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#3ECF8E] text-slate-900 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3ECF8E]/90 transition-colors"
              >
                {leadSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Get Quote
                  </>
                )}
              </button>
              <button
                onClick={handleSkipLead}
                className="px-5 py-3 rounded-lg border border-slate-700 text-slate-400 font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

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
          TRUEQUOTE™ FINANCIAL PROJECTION MODAL (V7 comprehensive version)
      ================================================================ */}
      <TrueQuoteFinancialModal
        isOpen={showFinancialModal}
        onClose={() => setShowFinancialModal(false)}
        totalInvestment={tier.grossCost}
        federalITC={tier.grossCost - tier.netCost}
        netInvestment={tier.netCost}
        annualSavings={tier.annualSavings}
        bessKWh={tier.bessKWh}
        solarKW={tier.solarKW}
        industry={state.industry || undefined}
        location={
          state.location?.city && state.location?.state
            ? `${state.location.city}, ${state.location.state}`
            : undefined
        }
      />

      {/* ================================================================
          PROQUOTE™ MODAL (placeholder)
      ================================================================ */}
      {showProQuoteModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProQuoteModal(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full border-2 border-[#3ECF8E]/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src={badgeProQuoteIcon} alt="ProQuote" className="w-12 h-12" />
              <div>
                <h3 className="text-xl font-bold text-[#3ECF8E]">ProQuote™</h3>
                <p className="text-sm text-slate-400">Full engineering control</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                ProQuote gives you access to advanced features:
              </p>
              <ul className="space-y-2">
                {[
                  "Custom equipment selection and sizing",
                  "Fuel cell and hydrogen integration",
                  "Advanced financial modeling (DCF, IRR, NPV)",
                  "Bank-ready Word/Excel exports",
                  "Detailed engineering specifications",
                  "Vendor comparison tools",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-[#3ECF8E] mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  window.location.href = "/pro-quote";
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#3ECF8E] text-slate-900 font-bold hover:bg-[#2aad70] transition-colors"
              >
                Open ProQuote™
              </button>
              <button
                onClick={() => setShowProQuoteModal(false)}
                className="px-6 py-2.5 rounded-lg border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.06] text-slate-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
