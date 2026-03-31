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
  Check,
  X,
  Mail,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Landmark,
  ExternalLink,
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
import type { Json } from "@/types/database.types";
import AuthModal from "@/components/AuthModal";
import { formatCurrency } from "@/services/internationalService";
import { getRecommendedInstallers, type RecommendedInstaller } from "@/services/installerService";
import { panelCount } from "@/services/solarPanelSelectionService";
import BessSpecSheet from "@/components/BessSpecSheet";
import {
  getMatchedFinancingOptions,
  calcMonthlyPayment,
  type FinancingOption,
} from "@/services/financingOptionsService";

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

// ── State-specific incentive data ────────────────────────────────────────────
interface StateIncentive {
  name: string;
  description: string;
  /** Estimated dollar value string, e.g. "$250–$400/kWh" or "varies" */
  value: string;
  url?: string;
}

const STATE_INCENTIVES: Record<string, StateIncentive[]> = {
  CA: [
    {
      name: "SGIP Storage Rebate",
      description: "Self-Generation Incentive Program — commercial BESS rebate",
      value: "$250–$400/kWh",
      url: "https://www.cpuc.ca.gov/sgip",
    },
    {
      name: "ITC Adder (Energy Community)",
      description: "Additional 10% ITC if site is in a qualified energy community",
      value: "+10% ITC",
    },
  ],
  MA: [
    {
      name: "SMART Solar Tariff",
      description: "Solar Massachusetts Renewable Target — per-kWh production incentive",
      value: "up to $0.17/kWh",
      url: "https://www.mass.gov/smart",
    },
    {
      name: "Mass Save® Battery Rebate",
      description: "Commercial battery storage rebate through Mass Save program",
      value: "varies by utility",
      url: "https://www.masssave.com",
    },
  ],
  NY: [
    {
      name: "NY-Sun Commercial Incentive",
      description: "NYSERDA commercial solar incentive per installed watt",
      value: "$0.20–$0.50/W",
      url: "https://www.nyserda.ny.gov/ny-sun",
    },
    {
      name: "Inflation Reduction Act Adder",
      description: "Low-income community / energy community ITC adder",
      value: "+10–20% ITC",
    },
  ],
  NJ: [
    {
      name: "SuSI Solar Incentive",
      description: "Successor Solar Incentive (TRECs) — tradeable renewable energy credits",
      value: "~$90/yr per kW",
      url: "https://www.njcleanenergy.com",
    },
    {
      name: "NJCEP Storage Incentive",
      description: "NJ Clean Energy Program commercial storage rebates",
      value: "contact utility",
    },
  ],
  TX: [
    {
      name: "Bonus Depreciation (MACRS)",
      description: "5-year accelerated depreciation for commercial energy property",
      value: "up to 60% yr 1",
    },
    {
      name: "Demand Response Rebate",
      description: "Utility-specific demand response credits (CPS/Austin/Oncor)",
      value: "varies by utility",
    },
  ],
  CO: [
    {
      name: "Colorado Solar & Storage Credit",
      description: "State income tax credit for commercial solar installations",
      value: "varies",
      url: "https://energyoffice.colorado.gov",
    },
  ],
  MD: [
    {
      name: "Maryland CleanEnergy Incentive",
      description: "CleanEnergy Incentive for energy storage and solar",
      value: "varies",
      url: "https://energy.maryland.gov",
    },
  ],
  CT: [
    {
      name: "CT Green Bank Commercial PACE",
      description: "C-PACE financing for commercial solar and storage",
      value: "100% financed",
      url: "https://ctgreenbank.com",
    },
  ],
  IL: [
    {
      name: "Illinois Shines (ILSFA)",
      description: "Adjustable block program solar renewable energy credits",
      value: "~$0.07/kWh",
      url: "https://illinoisshines.com",
    },
  ],
  MN: [
    {
      name: "Made in Minnesota Solar Incentive",
      description: "Per-kWh production incentive for MN-made equipment",
      value: "$0.07–$0.14/kWh",
    },
  ],
  AZ: [
    {
      name: "AZ Solar Equipment Sales Tax Exemption",
      description: "100% sales tax exemption on qualifying solar equipment",
      value: "sales tax exempt",
    },
  ],
  NV: [
    {
      name: "Nevada Property Tax Abatement",
      description: "Property tax abatement for commercial solar + storage",
      value: "55% for 10 yrs",
    },
  ],
  OR: [
    {
      name: "Oregon Solar + Storage Rebate",
      description: "Residential and commercial rebate program",
      value: "up to $5,000",
      url: "https://www.oregon.gov/energy",
    },
  ],
  WA: [
    {
      name: "WA Sales/Use Tax Exemption",
      description: "Sales and use tax exemption for solar energy equipment",
      value: "sales tax exempt",
    },
  ],
};

/**
 * Returns any known state-level incentives for a given 2-letter state code.
 * Returns an empty array for states not in the map.
 */
function getStateIncentives(stateCode: string | undefined): StateIncentive[] {
  if (!stateCode) return [];
  return STATE_INCENTIVES[stateCode.toUpperCase()] ?? [];
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
  const [showDataSourcesModal, setShowDataSourcesModal] = useState(false);
  const [showProQuoteModal, setShowProQuoteModal] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "word" | "excel" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Installer recommendations
  const [installers, setInstallers] = useState<RecommendedInstaller[]>([]);
  const [loadingInstallers, setLoadingInstallers] = useState(false);
  const [showTechSpecs, setShowTechSpecs] = useState(false);
  const [expandedFinancingId, setExpandedFinancingId] = useState<string | null>(null);

  // ── LEAD CAPTURE GATE ────────────────────────────────────────────
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<"pdf" | "word" | "excel" | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(() => {
    return isUserAuthenticated() || sessionStorage.getItem("merlin_lead_captured") === "true";
  });
  const [leadForm, setLeadForm] = useState({ name: "", email: "", company: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // ── SAVE QUOTE STATE ───────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(() => isUserAuthenticated());
  const [quoteSaved, setQuoteSaved] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // ── SAVE QUOTE TO ACCOUNT ──────────────────────────────────────────────
  const saveQuoteToAccount = useCallback(async () => {
    if (quoteSaved || savingQuote) return;
    setSavingQuote(true);
    setSaveError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("Sign in to save quotes to your account");
        return;
      }
      const exportData = buildV8ExportData(state);
      const tierData =
        state.tiers && state.selectedTierIndex !== null
          ? state.tiers[state.selectedTierIndex]
          : null;
      const cityState = [state.location?.city, state.location?.state].filter(Boolean).join(", ");
      const quoteName = [
        state.industry?.replace(/_/g, " "),
        cityState || null,
        new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ]
        .filter(Boolean)
        .join(" · ");
      const { error } = await supabase.from("saved_quotes").insert({
        user_id: user.id,
        quote_name: quoteName,
        system_configuration: exportData as unknown as Json,
        annual_savings: tierData?.annualSavings ?? null,
        payback_years: tierData?.paybackYears ?? null,
        duration_hours: tierData?.durationHours ?? null,
        solar_mw: tierData?.solarKW ? tierData.solarKW / 1000 : null,
        storage_mw: tierData?.bessKW ? tierData.bessKW / 1000 : null,
        total_cost: tierData?.grossCost ?? null,
        location: cityState || null,
      });
      if (error) throw error;
      setQuoteSaved(true);
    } catch (err) {
      setSaveError((err as Error).message || "Failed to save quote");
    } finally {
      setSavingQuote(false);
    }
  }, [state, quoteSaved, savingQuote]);

  // ── NAVIGATE TO RFP PAGE ────────────────────────────────────────────
  // Serialises quote context into sessionStorage and navigates to /build-rfp.
  // The BuildRFPPage reads this context and prefills all form fields — no
  // upload or re-entry needed.
  const openRfpPage = useCallback(() => {
    const tierData =
      state.tiers && state.selectedTierIndex !== null ? state.tiers[state.selectedTierIndex] : null;
    const ctx = {
      industry: state.industry ?? "unknown",
      location: {
        city: state.location?.city ?? undefined,
        state: state.location?.state ?? undefined,
        country: state.countryCode ?? "US",
      },
      countryCode: state.countryCode ?? "US",
      tier: {
        bessKW: tierData?.bessKW ?? 0,
        bessKWh: tierData?.bessKWh ?? 0,
        durationHours: tierData?.durationHours ?? 2,
        solarKW: tierData?.solarKW ?? 0,
        generatorKW: tierData?.generatorKW ?? 0,
        selectedBESS: tierData?.selectedBESS
          ? {
              chemistry: tierData.selectedBESS.chemistry ?? undefined,
              make: tierData.selectedBESS.manufacturer ?? undefined,
              model: tierData.selectedBESS.model ?? undefined,
            }
          : undefined,
        netCost: tierData?.netCost ?? 0,
        paybackYears: tierData?.paybackYears ?? undefined,
      },
    };
    sessionStorage.setItem("merlin_rfp_context", JSON.stringify(ctx));
    window.location.href = "/build-rfp";
  }, [state]);

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

  const quoteRef = `MQ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${location?.zip?.slice(0, 4) ?? "0000"}`;
  const quoteDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
            <span>
              {(industry?.replace(/_/g, " ") || "Facility")
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}{" "}
              Energy System
            </span>
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{locationLine || "—"}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowDataSourcesModal(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 12,
              background: "linear-gradient(145deg, rgba(28,18,4,0.92) 0%, rgba(18,12,2,0.96) 100%)",
              border: "1.5px solid rgba(245,158,11,0.45)",
              boxShadow: "0 0 22px rgba(245,158,11,0.10), inset 0 1px 0 rgba(245,158,11,0.08)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              WebkitFontSmoothing: "antialiased",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,158,11,0.70)";
              e.currentTarget.style.boxShadow =
                "0 0 32px rgba(245,158,11,0.22), inset 0 1px 0 rgba(245,158,11,0.14)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,158,11,0.45)";
              e.currentTarget.style.boxShadow =
                "0 0 22px rgba(245,158,11,0.10), inset 0 1px 0 rgba(245,158,11,0.08)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg
                width="16"
                height="18"
                viewBox="0 0 20 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M10 1L2 4.5V10C2 14.97 5.42 19.6 10 21C14.58 19.6 18 14.97 18 10V4.5L10 1Z"
                  fill="rgba(245,158,11,0.15)"
                  stroke="#F2C14F"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 11L9.5 13.5L14 8.5"
                  stroke="#3ECF8E"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{ fontSize: 14, fontWeight: 800, color: "#F5F0E8", letterSpacing: "0.01em" }}
              >
                TrueQuote™
              </span>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 30%, #FFDFA3, #F2C14F 60%, #B8892F 100%)",
                  boxShadow: "0 0 7px rgba(242,193,79,0.55)",
                  flexShrink: 0,
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="5.5"
                  fill="rgba(62,207,142,0.15)"
                  stroke="#3ECF8E"
                  strokeWidth="1"
                />
                <path
                  d="M3.5 6L5.5 8L8.5 4"
                  stroke="#3ECF8E"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.40)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Verified Pricing
              </span>
            </div>
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
              <div className="text-5xl md:text-6xl font-bold text-[#3ECF8E] leading-none">
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
                  10yr ROI{" "}
                  <strong className={tier.roi10Year >= 0 ? "text-[#3ECF8E]" : "text-red-400"}>
                    {tier.roi10Year.toFixed(0)}%
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          ROI GUARDRAIL BANNER — shown when payback was auto-adjusted
      ================================================================ */}
      {tier.guardrail?.applied && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: "rgba(245, 158, 11, 0.15)" }}
            >
              <span className="text-base">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-amber-300">ROI Guardrail Applied</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#FCD34D",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  AUTO-OPTIMIZED
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                This configuration was adjusted from a{" "}
                <span className="text-amber-300 font-semibold">
                  {Math.round(tier.guardrail.originalPaybackYears)}-year payback
                </span>{" "}
                to{" "}
                <span className="text-emerald-400 font-semibold">
                  {tier.guardrail.adjustedPaybackYears.toFixed(1)} years
                </span>{" "}
                by removing equipment that adds project cost without contributing to annual energy
                savings.
              </p>
              {tier.guardrail.removedComponents.length > 0 && (
                <div className="space-y-1">
                  {tier.guardrail.removedComponents.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-2">
                Resilience equipment (generator, extended backup) can be added back in Step 3.5 —
                they'll be presented as a separate resilience investment with their own cost
                breakdown.
              </p>
            </div>
          </div>
        </div>
      )}

      {tier.guardrail && !tier.guardrail.applied && tier.guardrail.originalPaybackYears > 7 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.22)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: "rgba(245, 158, 11, 0.12)" }}
            >
              <span className="text-base">⚡</span>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300 mb-1">ROI Review</p>
              <p className="text-xs text-slate-400 leading-relaxed">{tier.guardrail.reason}</p>
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
          value={`${fmtNum(tier.durationHours)}h spec${
            tier.hybridCoverage && tier.hybridCoverage.dailyPeakCoverageHours > 2
              ? ` · ${tier.hybridCoverage.dailyPeakCoverageHours}h effective`
              : ""
          }`}
          accent="text-blue-400"
        />
        {tier.solarKW > 0 && (
          <StatItem
            icon={<Sun className="w-3.5 h-3.5" />}
            label="Solar"
            value={`${fmtNum(tier.solarKW)} kW${
              tier.selectedPanel && !tier.selectedPanel.isFallback
                ? ` · ${tier.selectedPanel.wattPeak}W`
                : ""
            }`}
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
            <div className="inline-flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Battery className="w-3.5 h-3.5 text-violet-400 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Battery</span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {fmtNum(tier.bessKWh)} kWh
                </span>
                {tier.selectedBESS && !tier.selectedBESS.isFallback && (
                  <>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {tier.selectedBESS.manufacturer} {tier.selectedBESS.model}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {tier.selectedBESS.chemistry} · {tier.selectedBESS.roundtripEfficiencyPct}%
                      RTE
                      {" · "}
                      {tier.selectedBESS.cycleLife?.toLocaleString()} cycles
                    </span>
                    <span className="text-[10px] text-violet-400 leading-tight">
                      ${tier.selectedBESS.effectivePricePerKwh.toFixed(0)}/kWh ·{" "}
                      {tier.selectedBESS.warrantyYears}yr warranty
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Battery Spec
                </span>
                <span className="text-xs font-bold text-white tabular-nums">
                  {fmtNum(tier.durationHours)}h C2 spec
                </span>
                {tier.hybridCoverage && tier.hybridCoverage.strategy !== "bess_only" && (
                  <span className="text-[10px] text-emerald-400 leading-tight mt-0.5">
                    {tier.hybridCoverage.dailyPeakCoverageHours}h effective daily
                  </span>
                )}
              </div>
            </div>

            {tier.solarKW > 0 && (
              <div className="inline-flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Sun className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Solar</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {fmtNum(tier.solarKW)} kW
                  </span>
                  {tier.selectedPanel && !tier.selectedPanel.isFallback && (
                    <>
                      <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {tier.selectedPanel.manufacturer} {tier.selectedPanel.model}
                        {" · "}
                        {tier.selectedPanel.wattPeak}W · {tier.selectedPanel.efficiencyPct}% eff.
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        {panelCount(tier.solarKW, {
                          wattPeak: tier.selectedPanel.wattPeak,
                          areaSqft: 21.5,
                          efficiencyPct: tier.selectedPanel.efficiencyPct,
                          panelType: "monocrystalline",
                          pricePerWatt: tier.selectedPanel.effectivePricePerWatt,
                          tariffAdderPct: tier.selectedPanel.tariffAdderPct,
                          effectivePricePerWatt: tier.selectedPanel.effectivePricePerWatt,
                          countryOfOrigin: tier.selectedPanel.countryOfOrigin,
                          id: "",
                          vendorId: "",
                          manufacturer: tier.selectedPanel.manufacturer,
                          model: tier.selectedPanel.model,
                          leadTimeWeeks: 8,
                          warrantyYears: 25,
                          degradationPctYr: 0.5,
                          score: 0,
                          isFallback: false,
                        } as import("@/services/solarPanelSelectionService").SolarPanelSpec)}{" "}
                        panels est.
                      </span>
                      {tier.selectedPanel.tariffAdderPct > 0 && (
                        <span className="text-[10px] text-amber-400 leading-tight mt-0.5">
                          ⚠ ~{tier.selectedPanel.tariffAdderPct}% tariff (
                          {tier.selectedPanel.countryOfOrigin} origin)
                        </span>
                      )}
                    </>
                  )}
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

        {/* ── MERLIN HYBRID ADVANTAGE ─────────────────────────────────────
            Shows how BESS + Solar + Generator combine for extended coverage.
            Only visible when system has solar or generator (not BESS-only).
        ──────────────────────────────────────────────────────────────────── */}
        {tier.hybridCoverage && tier.hybridCoverage.strategy !== "bess_only" && (
          <div className="p-4 border-b border-white/[0.06] bg-gradient-to-r from-emerald-950/40 to-slate-900/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs">⚡</span>
              </div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Merlin Hybrid Advantage
              </span>
              <span className="ml-auto text-[10px] text-slate-500">
                2h C2 spec · extended via hybridization
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* BESS spec */}
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5 text-center">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  Battery
                </div>
                <div className="text-sm font-bold text-white">2h spec</div>
                <div className="text-[10px] text-slate-500 mt-0.5">C2 industry std</div>
              </div>

              {/* Daily peak coverage */}
              <div
                className={`rounded-lg border p-2.5 text-center ${
                  tier.hybridCoverage.handlesBothDailyPeaks
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-800/40 border-white/[0.06]"
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  Daily Peaks
                </div>
                <div
                  className={`text-sm font-bold ${tier.hybridCoverage.handlesBothDailyPeaks ? "text-emerald-300" : "text-white"}`}
                >
                  {tier.hybridCoverage.dailyPeakCoverageHours}h covered
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {tier.hybridCoverage.handlesBothDailyPeaks
                    ? "☀️ solar recharges midday"
                    : "morning peak only"}
                </div>
              </div>

              {/* Outage bridge */}
              <div
                className={`rounded-lg border p-2.5 text-center ${
                  tier.hybridCoverage.outageBridgeHours >= 24
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-slate-800/40 border-white/[0.06]"
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  Outage Bridge
                </div>
                <div
                  className={`text-sm font-bold ${tier.hybridCoverage.outageBridgeHours >= 24 ? "text-amber-300" : "text-white"}`}
                >
                  {tier.hybridCoverage.outageBridgeHours}h
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {tier.hybridCoverage.outageBridgeHours >= 24
                    ? "🔌 gen bridges after BESS"
                    : "battery only"}
                </div>
              </div>
            </div>

            {/* Coverage summary */}
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {tier.hybridCoverage.coverageSummary}
                {tier.hybridCoverage.totalRechargePercent > 0 && (
                  <span className="text-slate-500">
                    {" "}
                    · Combined recharge: {tier.hybridCoverage.totalRechargePercent}% of battery
                    capacity/day ({tier.hybridCoverage.totalDailyRechargeKWh} kWh from{" "}
                    {tier.hybridCoverage.activeSources.map((s) => s.label).join(" + ")})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

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
                    {tier.itcBasisBreakdown ? (
                      <>
                        <span className="font-medium">
                          {Math.round(tier.itcRate * 100)}% ×{" "}
                          {fmt$(tier.itcBasisBreakdown.totalEligible, countryCode)} eligible basis
                        </span>
                        <div className="mt-2 space-y-0.5 text-[11px] text-emerald-200/60">
                          {tier.itcBasisBreakdown.solarEligible > 0 && (
                            <div className="flex justify-between">
                              <span>Solar (equip + labor)</span>
                              <span>{fmt$(tier.itcBasisBreakdown.solarEligible, countryCode)}</span>
                            </div>
                          )}
                          {tier.itcBasisBreakdown.bessEligible > 0 && (
                            <div className="flex justify-between">
                              <span>BESS</span>
                              <span>{fmt$(tier.itcBasisBreakdown.bessEligible, countryCode)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Site / Installation</span>
                            <span>{fmt$(tier.itcBasisBreakdown.siteEligible, countryCode)}</span>
                          </div>
                          {(tier.itcBasisBreakdown.generatorCost > 0 ||
                            tier.itcBasisBreakdown.evChargingCost > 0) && (
                            <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 text-[10px] text-emerald-300/40">
                              Not §48-eligible:
                              {tier.itcBasisBreakdown.generatorCost > 0 &&
                                ` Generator ${fmt$(tier.itcBasisBreakdown.generatorCost, countryCode)}`}
                              {tier.itcBasisBreakdown.generatorCost > 0 &&
                                tier.itcBasisBreakdown.evChargingCost > 0 &&
                                " · "}
                              {tier.itcBasisBreakdown.evChargingCost > 0 &&
                                `EV chargers ${fmt$(tier.itcBasisBreakdown.evChargingCost, countryCode)}`}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <span>{Math.round(tier.itcRate * 100)}% tax credit applied</span>
                    )}
                  </div>
                </div>
              </div>

              {/* State-specific incentives — shown only when location has known state credits */}
              {(() => {
                const stateCode = location?.state;
                const incentives = getStateIncentives(stateCode);
                if (!stateCode || incentives.length === 0) return null;
                return (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">
                        {stateCode} State Incentives
                      </div>
                      <span className="text-[10px] text-cyan-400/50 font-medium">
                        — may stack with Federal ITC
                      </span>
                    </div>
                    <div className="space-y-2">
                      {incentives.map((inc) => (
                        <div key={inc.name} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {inc.url ? (
                                <a
                                  href={inc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-cyan-400 transition-colors"
                                >
                                  {inc.name} ↗
                                </a>
                              ) : (
                                inc.name
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                              {inc.description}
                            </div>
                          </div>
                          <div className="shrink-0 text-xs font-bold text-cyan-400 tabular-nums text-right">
                            {inc.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-cyan-500/10 text-[10px] text-slate-600">
                      Consult your installer for current program availability and qualification
                      requirements.
                    </div>
                  </div>
                );
              })()}

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
                        width: `${Math.max(5, Math.min(95, Math.round((1 - tier.paybackYears / 25) * 100)))}%`,
                      }}
                    />
                  </div>
                  {/* Payback drivers — shown when payback > 8 yrs to explain what's adding cost */}
                  {tier.paybackYears > 8 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 mb-1">
                        What's driving payback
                      </div>
                      {tier.generatorKW > 0 && (
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <span className="text-amber-400 mt-0.5 shrink-0">🔥</span>
                          <span>
                            <strong className="text-amber-300">
                              Generator ({tier.generatorKW} kW)
                            </strong>{" "}
                            adds resilience but no direct savings — it extends payback by est.{" "}
                            {Math.round(
                              ((tier.generatorKW * 700) / Math.max(1, tier.annualSavings)) * 10
                            ) / 10}{" "}
                            yrs. Remove in Step 3.5 to shorten payback.
                          </span>
                        </div>
                      )}
                      {tier.paybackYears > 10 && tier.solarKW < 50 && (
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <span className="text-yellow-400 mt-0.5 shrink-0">☀️</span>
                          <span>
                            <strong className="text-yellow-300">More solar</strong> = lower payback.
                            Try increasing solar in Step 3.5 to boost annual savings.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    10-Year ROI
                  </div>
                  <div
                    className={`mt-2 text-3xl font-black tabular-nums ${tier.roi10Year >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {tier.roi10Year.toFixed(0)}%
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Return relative to post-incentive project cost
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    25-Year NPV (Project)
                  </div>
                  <div
                    className={`mt-2 text-3xl font-black tabular-nums ${tier.npv >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {fmt$(tier.npv, countryCode)}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Unlevered · long-term value after discounting future savings
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
          FINANCING & FUNDING OPTIONS
      ================================================================ */}
      {(() => {
        const netCost = tier?.netCost ?? 0;
        if (netCost < 10000) return null;
        const options = getMatchedFinancingOptions({
          netCostDollars: netCost,
          stateCode: location?.state,
          industrySlug: industry ?? undefined,
        });
        if (options.length === 0) return null;

        return (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                  Financing &amp; Funding Options
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {options.length} programs matched to your{" "}
                  {location?.state ? `${location.state} ` : ""}project
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                  Net project cost
                </div>
                <div className="text-sm font-bold text-slate-300">{fmt$(netCost, countryCode)}</div>
              </div>
            </div>

            {/* Monthly payment context strip */}
            <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="text-slate-400 font-medium">If financed after ITC:</span>
              {[
                { label: "20yr @ 6.5%", rate: 6.5, term: 20 },
                { label: "15yr @ 7%", rate: 7, term: 15 },
                { label: "10yr @ 8%", rate: 8, term: 10 },
              ].map(({ label, rate, term }) => (
                <span key={label}>
                  <span className="text-slate-500">{label} → </span>
                  <span className="text-indigo-300 font-semibold tabular-nums">
                    {fmt$(calcMonthlyPayment(netCost, rate, term), countryCode)}/mo
                  </span>
                </span>
              ))}
            </div>

            {/* Program cards */}
            <div className="space-y-2">
              {options.slice(0, 8).map((opt: FinancingOption) => {
                const isExpanded = expandedFinancingId === opt.id;
                const monthlyPmt = opt.rateForCalc
                  ? calcMonthlyPayment(netCost, opt.rateForCalc, opt.termYearsForCalc)
                  : null;

                return (
                  <div
                    key={opt.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all"
                  >
                    {/* Card header row — always visible */}
                    <button
                      onClick={() => setExpandedFinancingId(isExpanded ? null : opt.id)}
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Type badge */}
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${opt.typeBadge}`}
                      >
                        {opt.typeLabel}
                      </span>

                      {/* Provider + program */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {opt.provider}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{opt.programName}</div>
                      </div>

                      {/* Quick stats */}
                      <div className="shrink-0 text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-300 tabular-nums">
                          {opt.rateDisplay}
                        </div>
                        <div className="text-[10px] text-slate-600">{opt.termDisplay}</div>
                      </div>

                      {/* Monthly est or $0 down */}
                      <div className="shrink-0 text-right ml-2">
                        {opt.fullyCovered ? (
                          <span className="text-xs font-bold text-teal-400">$0 down</span>
                        ) : monthlyPmt ? (
                          <span className="text-xs font-bold text-indigo-300 tabular-nums">
                            {fmt$(monthlyPmt, countryCode)}/mo
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">varies</span>
                        )}
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] space-y-3">
                        {/* Rate/term/size row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                            <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">
                              Rate
                            </div>
                            <div className="text-xs font-bold text-slate-200">
                              {opt.rateDisplay}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                            <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">
                              Term
                            </div>
                            <div className="text-xs font-bold text-slate-200">
                              {opt.termDisplay}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                            <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">
                              Min size
                            </div>
                            <div className="text-xs font-bold text-slate-200">
                              ${opt.minProjectSizeK}K
                            </div>
                          </div>
                        </div>

                        {/* Monthly payment detail */}
                        {monthlyPmt && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/[0.06] border border-indigo-500/15">
                            <span className="text-xs text-slate-400">
                              Est. monthly payment at {opt.rateForCalc}% / {opt.termYearsForCalc}{" "}
                              yrs
                            </span>
                            <span className="text-sm font-bold text-indigo-300 tabular-nums">
                              {fmt$(monthlyPmt, countryCode)}/mo
                            </span>
                          </div>
                        )}

                        {/* Requirements */}
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">
                            Requirements
                          </div>
                          <ul className="space-y-0.5">
                            {opt.requirements.map((req) => (
                              <li
                                key={req}
                                className="flex items-start gap-1.5 text-[11px] text-slate-400"
                              >
                                <span className="text-slate-600 mt-0.5 shrink-0">·</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Highlights */}
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">
                            Key benefits
                          </div>
                          <ul className="space-y-0.5">
                            {opt.highlights.map((h) => (
                              <li
                                key={h}
                                className="flex items-start gap-1.5 text-[11px] text-slate-300"
                              >
                                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Note */}
                        {opt.note && (
                          <p className="text-[10px] text-slate-600 italic">{opt.note}</p>
                        )}

                        {/* CTA */}
                        <a
                          href={opt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {opt.ctaLabel}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[10px] text-slate-700 leading-relaxed">
              Monthly payment estimates are illustrative. Actual terms vary by lender,
              creditworthiness, and project details. Programs subject to availability and
              eligibility. Consult a financial advisor before committing.
            </p>
          </div>
        );
      })()}

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
                Request Bids from {installers.length} Installer{installers.length !== 1 ? "s" : ""}
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

        {/* ── SAVE QUOTE ROW ── */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex-1 min-w-0">
                {quoteSaved ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                    <Check className="w-4 h-4" />
                    Quote saved to your account
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Save this quote to your account to access it anytime.
                  </p>
                )}
                {saveError && <p className="text-xs text-red-400 mt-1">{saveError}</p>}
              </div>
              {!quoteSaved && (
                <button
                  type="button"
                  onClick={saveQuoteToAccount}
                  disabled={savingQuote}
                  className="flex-shrink-0 flex items-center justify-center gap-2 h-10 px-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.06] hover:border-emerald-500/50 hover:bg-emerald-500/[0.10] transition-all disabled:opacity-50 text-emerald-400 font-semibold text-sm"
                >
                  {savingQuote ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      Save Quote
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                <span className="text-slate-300 font-medium">Sign up free</span> to save this quote
                and access it from your dashboard anytime.
              </p>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex-shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border border-[#3ECF8E]/30 bg-[#3ECF8E]/[0.06] hover:border-[#3ECF8E]/50 hover:bg-[#3ECF8E]/[0.10] transition-all text-[#3ECF8E] font-semibold text-sm"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save Quote →
              </button>
            </>
          )}
        </div>

        {/* ── BUILD AN RFP CTA ── */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/[0.12] border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 leading-snug">
                Turn this quote into a live RFP
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive competing bids from certified vendors — no upload needed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openRfpPage}
            className="flex-shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border border-amber-500/40 text-amber-400 hover:border-amber-400 hover:text-amber-300 transition-colors text-sm font-semibold"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Build RFP →
          </button>
        </div>

        {/* ── TECHNICAL SPECS TOGGLE ── */}
        <div className="pt-3 border-t border-white/[0.04]">
          <button
            type="button"
            onClick={() => setShowTechSpecs((v) => !v)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full py-1"
          >
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform"
              style={{ transform: showTechSpecs ? "rotate(180deg)" : "none" }}
            />
            {showTechSpecs ? "Hide" : "View"} Technical Specifications
          </button>
          {showTechSpecs && tier && (
            <div className="mt-3">
              <BessSpecSheet
                bessKW={tier.bessKW ?? 0}
                bessKWh={tier.bessKWh ?? 0}
                durationHours={tier.durationHours ?? 2}
                chemistry={tier.selectedBESS?.chemistry ?? "LFP"}
                manufacturer={tier.selectedBESS?.manufacturer}
                model={tier.selectedBESS?.model}
                moduleKwh={tier.selectedBESS?.capacityKwh}
                roundtripEfficiencyPct={tier.selectedBESS?.roundtripEfficiencyPct}
                warrantyYears={tier.selectedBESS?.warrantyYears}
                cycleLife={tier.selectedBESS?.cycleLife}
                solarKW={tier.solarKW ?? 0}
                generatorKW={tier.generatorKW ?? 0}
                baseLoadKW={state.baseLoadKW || undefined}
                peakLoadKW={state.peakLoadKW || undefined}
                compact
              />
            </div>
          )}
        </div>
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
        federalITC={tier.itcAmount}
        netInvestment={tier.grossCost - tier.itcAmount}
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
      {/* ================================================================
          AUTH MODAL — Sign up / Sign in to save quote
      ================================================================ */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="signup"
          onLoginSuccess={() => {
            setShowAuthModal(false);
            setIsAuthenticated(true);
            // After sign-in, proceed to save the quote
            setTimeout(() => saveQuoteToAccount(), 300);
          }}
        />
      )}

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

      {/* ── DATA SOURCES MODAL ───────────────────────────────────────────── */}
      {showDataSourcesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setShowDataSourcesModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowDataSourcesModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  TrueQuote™ Verified
                </p>
                <h3 className="text-base font-bold text-white">Pricing Data Sources</h3>
              </div>
            </div>

            {/* Sources */}
            <div className="space-y-3 mb-5">
              {[
                {
                  label: "Solar equipment costs",
                  source: "NREL ATB 2024",
                  url: "https://atb.nrel.gov",
                },
                {
                  label: "Battery storage pricing",
                  source: "BloombergNEF BNEF 2024",
                  url: "https://about.bnef.com",
                },
                {
                  label: "Electricity rates",
                  source: "U.S. EIA Form EIA-861",
                  url: "https://www.eia.gov",
                },
                {
                  label: "Equipment & installation",
                  source: "StoreFAST Supplier Index",
                  url: "https://storefast.energy",
                },
                {
                  label: "Federal ITC (30%)",
                  source: "IRS Section 48 / Inflation Reduction Act",
                  url: "https://www.irs.gov/credits-deductions/businesses/energy-incentives-for-businesses",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05]"
                >
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2 shrink-0"
                  >
                    {item.source}
                  </a>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pricing estimates reflect regional averages for similar facility profiles. Actual
              costs may vary based on site conditions, permitting, and final equipment selection.
              All incentives subject to eligibility verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
