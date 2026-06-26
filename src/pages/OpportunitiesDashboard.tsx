/**
 * Opportunities Dashboard
 * View and manage business leads from the opportunity scraper
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  CheckCircle,
  Archive,
  TrendingUp,
  Sparkles,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Sun,
  Battery,
  Cpu,
  RefreshCw,
  Share2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { runOpportunityScraper } from "../api/opportunityScraper";
import { assessOpportunity, type OppAssessment } from "../services/opportunityAssessmentService";
import type {
  Opportunity,
  OpportunityStatus,
  OpportunitySignal,
  IndustryType,
} from "../types/opportunity";

// ─── Signal display labels ────────────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, string> = {
  // Original
  construction: "🏗️ Construction",
  expansion: "📈 Expansion",
  new_opening: "🆕 New Opening",
  funding: "💰 Funding",
  acquisition: "🤝 Acquisition",
  sustainability_initiative: "🌱 Sustainability",
  energy_upgrade: "⚡ Energy Upgrade",
  facility_upgrade: "🔧 Facility Upgrade",
  rfq: "📄 RFQ/RFP",
  energy_project: "🔋 Energy Project",
  high_utility_exposure: "💸 High Utility Cost",
  // Phase 2
  bess_procurement: "🔋 BESS Procurement",
  solar_procurement: "☀️ Solar Procurement",
  generator_procurement: "⚙️ Generator Procurement",
  // Phase 3
  permit_filed: "📋 Permit Filed",
  interconnection_application: "🔌 Grid Interconnection",
  // Phase 4
  microgrid_procurement: "⚡ Microgrid RFP",
  virtual_power_plant: "🌐 VPP/Demand Response",
  c_and_i_solar: "☀️ C&I Solar",
};

function signalLabel(signal: string): string {
  return SIGNAL_LABELS[signal] || signal.replace(/_/g, " ");
}

// ─── Industry display labels ──────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<string, string> = {
  data_center: "🖥️ Data Center",
  manufacturing: "🏭 Manufacturing",
  logistics: "📦 Logistics",
  hospitality: "🏨 Hospitality",
  healthcare: "🏥 Healthcare",
  hospital: "🏥 Hospital",
  retail: "🛍️ Retail",
  education: "🎓 Education",
  automotive: "🚗 Automotive",
  cold_storage: "🧊 Cold Storage",
  car_wash: "🚿 Car Wash",
  truck_stop: "🚛 Truck Stop",
  agricultural: "🌾 Agricultural",
  gym: "🏋️ Gym / Fitness",
  energy: "⚡ Energy / Utility",
  government: "🏛️ Government",
  other: "Other",
};

// ─── Assessment display helpers ───────────────────────────────────────────────

const BESS_TYPE_LABELS: Record<string, string> = {
  peak_shaving: "Peak Shaving",
  backup_power: "Backup / UPS",
  microgrid_anchor: "Microgrid Anchor",
  arbitrage: "Energy Arbitrage",
  demand_response: "VPP / Demand Response",
  solar_storage: "Solar + Storage",
  ev_load_management: "EV Load Management",
  unknown: "General BESS",
};

const GRID_DRIVER_LABELS: Record<string, string> = {
  high_demand_charges: "💸 High Demand Charges",
  unreliable_grid: "⚡ Unreliable Grid",
  grid_too_expensive: "💰 Grid Too Expensive",
  grid_expansion_needed: "🔌 Grid Expansion Needed",
  decarbonization_mandate: "🌱 Decarbonization Mandate",
  backup_resilience: "🛡️ Backup / Resilience",
  interconnection_constraint: "🔌 Interconnection Constraint",
  rate_arbitrage_opportunity: "📈 Rate Arbitrage Opportunity",
  unknown: "General Grid Driver",
};

const CO_EQUIP_LABELS: Record<string, string> = {
  solar_pv: "☀️ Solar PV",
  wind: "🌀 Wind",
  generator_backup: "⚙️ Generator",
  ev_chargers: "🔌 EV Chargers",
  ems_controls: "🧠 EMS / Controls",
  transformer_upgrade: "🔧 Transformer Upgrade",
  microgrid_controller: "⚡ Microgrid Controller",
  weather_monitoring: "🌤️ Weather Monitoring",
};

const ALT_POWER_LABELS: Record<string, string> = {
  solar: "☀️ Solar PV",
  wind: "🌀 Wind",
  generator: "⚙️ Generator",
  geothermal: "🌋 Geothermal",
  nuclear_smr: "⚛️ Nuclear SMR",
  fuel_cell: "💧 Fuel Cell",
  hydro: "💧 Hydro",
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hot: { label: "🔥 Hot Lead", color: "text-red-400", bg: "bg-red-950/40 border-red-700/40" },
  warm: {
    label: "🟡 Warm Lead",
    color: "text-yellow-400",
    bg: "bg-yellow-950/40 border-yellow-700/40",
  },
  cool: { label: "🔵 Cool Lead", color: "text-blue-400", bg: "bg-blue-950/40 border-blue-700/40" },
};

// ─── Assessment Panel component ───────────────────────────────────────────────

interface AssessmentPanelProps {
  opp: Opportunity;
}

function AssessmentPanel({ opp }: AssessmentPanelProps) {
  const [assessment, setAssessment] = useState<OppAssessment | null>(
    (opp.opportunity_assessment as OppAssessment | null) ?? null
  );
  const [loading, setLoading] = useState(false);
  const [useGPT, setUseGPT] = useState(false);
  const [expanded, setExpanded] = useState(!!assessment);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";

  async function generate() {
    setLoading(true);
    try {
      const result = await assessOpportunity({
        companyName: opp.company_name,
        description: opp.description,
        signals: opp.signals as OpportunitySignal[],
        industry: opp.industry as IndustryType | null,
        bessScore: 0,
        solarScore: 0,
        generatorScore: 0,
        useGPT: useGPT && !!apiKey,
        apiKey,
      });
      setAssessment(result);
      setExpanded(true);
      // Persist to DB
      await supabase
        .from("opportunities")
        .update({ opportunity_assessment: result })
        .eq("id", opp.id);
    } catch (e) {
      console.error("Assessment failed:", e);
    } finally {
      setLoading(false);
    }
  }

  if (!assessment) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Opportunity Assessment</span>
          </div>
          {apiKey && (
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useGPT}
                onChange={(e) => setUseGPT(e.target.checked)}
                className="rounded"
              />
              GPT-4 enrichment
            </label>
          )}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-semibold transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Analyzing..." : "Generate Assessment"}
        </button>
      </div>
    );
  }

  const urgency = URGENCY_CONFIG[assessment.urgency_tier];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Opportunity Assessment</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.bg} ${urgency.color}`}
          >
            {urgency.label}
          </span>
          {assessment.gpt_enriched && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-purple-700/40 bg-purple-950/40 text-purple-400">
              ✨ GPT-4
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              generate();
            }}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors"
          >
            {loading ? "..." : "Re-assess"}
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-700/50">
          {/* Size + BESS types */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-400 mb-1">BESS Application</div>
              <div className="flex flex-wrap gap-1">
                {assessment.bess_types.map((t) => (
                  <span
                    key={t}
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      t === assessment.primary_bess_type
                        ? "bg-emerald-950/50 border-emerald-700/50 text-emerald-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    {BESS_TYPE_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-400 mb-1">Est. System Size</div>
              <div className="text-white font-semibold text-sm">
                {assessment.size_estimate.minKwh.toLocaleString()}–
                {assessment.size_estimate.maxKwh.toLocaleString()} kWh
              </div>
              <div className="text-slate-400 text-xs">
                {assessment.size_estimate.minKw.toLocaleString()}–
                {assessment.size_estimate.maxKw.toLocaleString()} kW
                {" · "}
                <span
                  className={`${
                    assessment.size_estimate.confidence === "high"
                      ? "text-emerald-400"
                      : assessment.size_estimate.confidence === "medium"
                        ? "text-yellow-400"
                        : "text-slate-500"
                  }`}
                >
                  {assessment.size_estimate.confidence} confidence
                </span>
              </div>
              <div className="text-slate-500 text-[10px] mt-1 italic">
                {assessment.size_estimate.basis}
              </div>
            </div>
          </div>

          {/* Technology fit bar chart */}
          <div className="rounded-lg bg-slate-900/50 p-3">
            <div className="text-xs text-slate-400 mb-2">Technology Fit</div>
            <div className="space-y-1.5">
              {(
                [
                  {
                    label: "BESS",
                    value: assessment.technology_fit.bess,
                    icon: "🔋",
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Solar",
                    value: assessment.technology_fit.solar,
                    icon: "☀️",
                    color: "bg-yellow-500",
                  },
                  {
                    label: "Generator",
                    value: assessment.technology_fit.generator,
                    icon: "⚙️",
                    color: "bg-orange-500",
                  },
                  {
                    label: "Microgrid",
                    value: assessment.technology_fit.microgrid,
                    icon: "⚡",
                    color: "bg-blue-500",
                  },
                  {
                    label: "EV Charging",
                    value: assessment.technology_fit.ev_charging,
                    icon: "🔌",
                    color: "bg-purple-500",
                  },
                ] as const
              )
                .filter((t) => t.value > 15)
                .map(({ label, value, icon, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs w-20 text-slate-300">
                      {icon} {label}
                    </span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color} transition-all`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{value}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Grid drivers */}
          <div className="rounded-lg bg-slate-900/50 p-3">
            <div className="text-xs text-slate-400 mb-2">Grid & Economic Drivers</div>
            <div className="flex flex-wrap gap-1.5">
              {assessment.grid_drivers
                .filter((d) => d !== "unknown")
                .map((d) => (
                  <span
                    key={d}
                    className="text-xs px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    {GRID_DRIVER_LABELS[d] ?? d}
                  </span>
                ))}
            </div>
          </div>

          {/* Co-equipment + Alternative power side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-400 mb-2">Co-Equipment Needed</div>
              <div className="space-y-1">
                {assessment.co_equipment.map((e) => (
                  <div key={e} className="text-xs text-slate-300">
                    {CO_EQUIP_LABELS[e] ?? e}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-3">
              <div className="text-xs text-slate-400 mb-2">Alternative Power Sources</div>
              <div className="space-y-1">
                {assessment.alternative_power.map((p) => (
                  <div key={p} className="text-xs text-slate-300">
                    {ALT_POWER_LABELS[p] ?? p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Flags */}
          {(assessment.is_rfp_rfq ||
            assessment.is_federal ||
            assessment.is_funded ||
            assessment.has_interconnection) && (
            <div className="flex flex-wrap gap-2">
              {assessment.is_rfp_rfq && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-950/40 border border-red-700/40 text-red-300">
                  📄 Active RFP/RFQ
                </span>
              )}
              {assessment.is_federal && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-950/40 border border-blue-700/40 text-blue-300">
                  🏛️ Federal Contract
                </span>
              )}
              {assessment.is_funded && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-950/40 border border-emerald-700/40 text-emerald-300">
                  💰 Funding Confirmed
                </span>
              )}
              {assessment.has_interconnection && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-950/40 border border-purple-700/40 text-purple-300">
                  🔌 Interconnection Filed
                </span>
              )}
            </div>
          )}

          {/* GPT narrative fields */}
          {assessment.gpt_enriched && assessment.gpt_bess_narrative && (
            <div className="rounded-lg bg-purple-950/20 border border-purple-700/30 p-3 space-y-2">
              <div className="text-xs font-semibold text-purple-400">✨ AI Analysis</div>
              {assessment.gpt_bess_narrative && (
                <p className="text-xs text-slate-300">{assessment.gpt_bess_narrative}</p>
              )}
              {assessment.gpt_grid_situation && (
                <p className="text-xs text-slate-300">{assessment.gpt_grid_situation}</p>
              )}
              {assessment.gpt_urgency && (
                <p className="text-xs text-slate-400 italic">{assessment.gpt_urgency}</p>
              )}
              {assessment.gpt_red_flags && assessment.gpt_red_flags.length > 0 && (
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-yellow-300">
                    {assessment.gpt_red_flags.join(" · ")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Talking points */}
          <div className="rounded-lg bg-slate-900/50 p-3">
            <div className="text-xs text-slate-400 mb-2">Sales Talking Points</div>
            <ul className="space-y-2">
              {assessment.talking_points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-emerald-500 font-bold mt-0.5 shrink-0">→</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[10px] text-slate-600">
            Assessed {new Date(assessment.assessed_at).toLocaleString()} · v
            {assessment.assessment_version}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category helpers (mirrors vendorLeadMatchService logic) ──────────────────

type OppCategory = "bess" | "solar" | "generator" | "other";

function classifyOpp(opp: Opportunity): OppCategory {
  const sigs = opp.signals as string[];
  const d = (opp.description ?? "").toLowerCase();
  const isBESS =
    sigs.some((s) =>
      [
        "bess_procurement",
        "energy_project",
        "microgrid_procurement",
        "virtual_power_plant",
      ].includes(s)
    ) || /battery.storage|energy.storage|\bbess\b|megapack|peak.shav/i.test(d);
  const isSolar =
    sigs.some((s) => ["solar_procurement", "c_and_i_solar"].includes(s)) ||
    /\bsolar\b|photovoltaic|\bpv\b/i.test(d);
  const isGen =
    sigs.includes("generator_procurement") ||
    /\bgenerator\b|genset|backup.power|standby.power/i.test(d);
  if (isBESS && isSolar) return "bess"; // BESS takes priority
  if (isBESS) return "bess";
  if (isSolar) return "solar";
  if (isGen) return "generator";
  return "other";
}

const CATEGORY_CONFIG: Record<
  OppCategory,
  { label: string; icon: React.ReactNode; chipBg: string; chipText: string; tabActive: string }
> = {
  bess: {
    label: "BESS",
    icon: <Battery className="w-3.5 h-3.5" />,
    chipBg: "bg-blue-500/15 border-blue-500/30",
    chipText: "text-blue-300",
    tabActive: "border-blue-400 text-blue-300",
  },
  solar: {
    label: "Solar",
    icon: <Sun className="w-3.5 h-3.5" />,
    chipBg: "bg-yellow-500/15 border-yellow-500/30",
    chipText: "text-yellow-300",
    tabActive: "border-yellow-400 text-yellow-300",
  },
  generator: {
    label: "Generator",
    icon: <Cpu className="w-3.5 h-3.5" />,
    chipBg: "bg-purple-500/15 border-purple-500/30",
    chipText: "text-purple-300",
    tabActive: "border-purple-400 text-purple-300",
  },
  other: {
    label: "Other",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    chipBg: "bg-slate-500/15 border-slate-500/30",
    chipText: "text-slate-400",
    tabActive: "border-slate-400 text-slate-300",
  },
};

// Color for confidence score badge
function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-400 bg-emerald-950/50 border-emerald-700/40";
  if (n >= 50) return "text-amber-400 bg-amber-950/50 border-amber-700/40";
  return "text-slate-400 bg-slate-800/50 border-slate-700/40";
}

// Signal pill color by type
function signalPillStyle(sig: string): string {
  if (
    ["bess_procurement", "energy_project", "microgrid_procurement", "virtual_power_plant"].includes(
      sig
    )
  )
    return "bg-blue-500/10 text-blue-300 border-blue-500/20";
  if (["solar_procurement", "c_and_i_solar"].includes(sig))
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
  if (["generator_procurement"].includes(sig))
    return "bg-purple-500/10 text-purple-300 border-purple-500/20";
  if (["rfq", "interconnection_application", "permit_filed", "procurement_awarded"].includes(sig))
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (["funding", "construction", "expansion", "new_opening"].includes(sig))
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return "bg-slate-800/50 text-slate-400 border-slate-700/30";
}

const VENDOR_PORTAL_URL = "https://merlinenergy.net/vendor-portal";

export function OpportunitiesDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [scraping, setScraping] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{ newLeads: number; scanned: number } | null>(
    null
  );
  const [pushing, setPushing] = useState<string | null>(null); // opportunity id being pushed

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryTab, setCategoryTab] = useState<OppCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void loadOpportunities();
  }, []);

  async function loadOpportunities() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("confidence_score", { ascending: false });
      if (error) throw error;
      setOpportunities(data ?? []);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function runScraper() {
    setScraping(true);
    try {
      const result = await runOpportunityScraper();
      if (result.success) {
        await loadOpportunities();
        alert(
          `✅ Scraper complete!\n\nFound: ${result.data?.total_found ?? 0}\nNew: ${result.data?.new_opportunities ?? 0}\nDuplicates skipped: ${result.data?.duplicates_skipped ?? 0}`
        );
      } else {
        alert(`❌ Scraper failed: ${result.error}`);
      }
    } catch (_e) {
      alert("❌ Failed to run scraper");
    } finally {
      setScraping(false);
    }
  }

  async function routeToVendors() {
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await fetch("/api/leads/run-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rerun: false }),
      });
      const data = await res.json();
      if (data.success) {
        const s = data.summary;
        setMatchResult({ newLeads: s?.newLeads ?? 0, scanned: s?.scanned ?? 0 });
        alert(
          `✅ Lead routing complete!\n\nScanned: ${s?.scanned ?? "—"}\nQualified: ${s?.qualified ?? "—"}\nNew vendor leads: ${s?.newLeads ?? "—"}\n\nVendors see their leads at:\n${VENDOR_PORTAL_URL}`
        );
      } else {
        alert(`❌ Matcher failed: ${data.error ?? data.message}`);
      }
    } catch {
      alert("❌ Failed to run lead matcher");
    } finally {
      setMatching(false);
    }
  }

  // Manually push ONE opportunity to all matching vendors
  async function pushOneToVendors(opp: Opportunity, e: React.MouseEvent) {
    e.stopPropagation();
    setPushing(opp.id);
    try {
      const res = await fetch("/api/leads/run-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rerun: true, opportunityId: opp.id }),
      });
      const data = await res.json();
      const sent = data.summary?.newLeads ?? 0;
      alert(
        sent > 0
          ? `✅ Pushed "${opp.company_name}" to ${sent} vendor${sent !== 1 ? "s" : ""}.\n\nVendors see it at:\n${VENDOR_PORTAL_URL}`
          : `ℹ️ No vendors matched this lead (score below threshold or already routed).`
      );
    } catch {
      alert("❌ Push failed");
    } finally {
      setPushing(null);
    }
  }

  function copyPortalLink() {
    void navigator.clipboard.writeText(VENDOR_PORTAL_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateStatus(oppId: string, newStatus: OpportunityStatus) {
    const updates: Partial<Opportunity> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === "contacted" ? { contacted_at: new Date().toISOString() } : {}),
    };
    const { error } = await supabase.from("opportunities").update(updates).eq("id", oppId);
    if (!error) {
      setOpportunities((prev) => prev.map((o) => (o.id === oppId ? { ...o, ...updates } : o)));
      if (selectedOpp?.id === oppId) setSelectedOpp({ ...selectedOpp, ...updates });
    }
  }

  // ── Filter ──
  const filtered = opportunities.filter((opp) => {
    if (statusFilter && statusFilter !== "all" && opp.status !== statusFilter) return false;
    if (categoryTab !== "all" && classifyOpp(opp) !== categoryTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!opp.company_name.toLowerCase().includes(q) && !opp.description.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  // Category counts
  const counts: Record<OppCategory | "all", number> = {
    all: opportunities.length,
    bess: opportunities.filter((o) => classifyOpp(o) === "bess").length,
    solar: opportunities.filter((o) => classifyOpp(o) === "solar").length,
    generator: opportunities.filter((o) => classifyOpp(o) === "generator").length,
    other: opportunities.filter((o) => classifyOpp(o) === "other").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] bg-[#13151c] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Lead Opportunities</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {opportunities.length} scraped articles · {counts.bess} BESS · {counts.solar} Solar ·{" "}
              {counts.generator} Generator
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy vendor portal link */}
            <button
              onClick={copyPortalLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm font-medium transition-all"
              title={`Copy vendor portal link: ${VENDOR_PORTAL_URL}`}
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Vendor Portal Link"}
            </button>

            {/* Run scraper */}
            <button
              onClick={runScraper}
              disabled={scraping || matching}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm font-medium transition-all"
            >
              {scraping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {scraping ? "Scraping…" : "Run Scraper"}
            </button>

            {/* Route all to vendors */}
            <button
              onClick={routeToVendors}
              disabled={matching || scraping}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3ECF8E] hover:bg-emerald-400 disabled:opacity-40 text-black text-sm font-semibold transition-all"
              title="Score all unmatched opportunities and push qualified leads to vendor inboxes"
            >
              {matching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {matching
                ? "Routing…"
                : matchResult
                  ? `Route to Vendors (${matchResult.newLeads} sent)`
                  : "Route All to Vendors"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Category tab bar + filters ── */}
      <div className="border-b border-white/[0.06] bg-[#13151c] px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Category tabs */}
          <nav className="flex gap-1">
            {(["all", "bess", "solar", "generator", "other"] as const).map((cat) => {
              const isActive = categoryTab === cat;
              const cfg = cat === "all" ? null : CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryTab(cat)}
                  className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? cat === "all"
                        ? "border-[#3ECF8E] text-[#3ECF8E]"
                        : `${cfg!.tabActive} border-current`
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {cfg?.icon}
                  {cat === "all" ? "All" : cfg!.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/10" : "bg-white/[0.04]"}`}
                  >
                    {counts[cat]}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Search + status filter */}
          <div className="flex items-center gap-2 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-44 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            No opportunities match the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((opp) => {
              const cat = classifyOpp(opp);
              const cfg = CATEGORY_CONFIG[cat];
              const isPushing = pushing === opp.id;
              return (
                <div
                  key={opp.id}
                  className="group rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.025)] hover:bg-[rgba(255,255,255,0.04)] hover:border-white/[0.1] transition-all cursor-pointer"
                  onClick={() => setSelectedOpp(opp)}
                >
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Score badge */}
                    <div
                      className={`shrink-0 mt-0.5 px-2.5 py-1 rounded-lg border text-sm font-bold ${scoreColor(opp.confidence_score)}`}
                    >
                      {opp.confidence_score}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Category chip */}
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.chipBg} ${cfg.chipText}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>

                        {/* Company */}
                        <span className="text-white font-semibold text-sm truncate max-w-xs">
                          {opp.company_name}
                        </span>

                        {/* Industry */}
                        {opp.industry && (
                          <span className="text-xs text-slate-500">
                            {INDUSTRY_LABELS[opp.industry] ?? opp.industry}
                          </span>
                        )}

                        {/* Status pill */}
                        <span
                          className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${
                            opp.status === "new"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : opp.status === "contacted"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : opp.status === "qualified"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          {opp.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">{opp.description}</p>

                      {/* Signal pills */}
                      <div className="flex flex-wrap gap-1">
                        {(opp.signals as string[]).slice(0, 5).map((sig) => (
                          <span
                            key={sig}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${signalPillStyle(sig)}`}
                          >
                            {signalLabel(sig)}
                          </span>
                        ))}
                        {opp.signals.length > 5 && (
                          <span className="text-[11px] text-slate-600 px-1">
                            +{opp.signals.length - 5}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Push this lead to vendors */}
                      <button
                        onClick={(e) => void pushOneToVendors(opp, e)}
                        disabled={isPushing}
                        title="Push this lead to all matching vendors"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/20 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        {isPushing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Push to Vendors
                      </button>

                      {/* Open source */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(opp.source_url, "_blank");
                        }}
                        title="Open source article"
                        className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-500 hover:text-slate-300 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Archive */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void updateStatus(opp.id, "archived");
                        }}
                        title="Archive"
                        className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-600 hover:text-slate-400 transition-all"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-xs text-slate-600 mt-1">
                      {new Date(opp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail slide-over ── */}
      {selectedOpp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedOpp(null)}
        >
          <div
            className="bg-[#13151c] border border-white/[0.08] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {(() => {
                      const cat = classifyOpp(selectedOpp);
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.chipBg} ${cfg.chipText}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      );
                    })()}
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${scoreColor(selectedOpp.confidence_score)}`}
                    >
                      Score {selectedOpp.confidence_score}
                    </span>
                    {selectedOpp.industry && (
                      <span className="text-xs text-slate-500">
                        {INDUSTRY_LABELS[selectedOpp.industry] ?? selectedOpp.industry}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedOpp.company_name}</h2>
                </div>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="text-slate-500 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedOpp.signals as string[]).map((sig) => (
                  <span
                    key={sig}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium border ${signalPillStyle(sig)}`}
                  >
                    {signalLabel(sig)}
                  </span>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Description
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedOpp.description}</p>
              </div>

              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Source</div>
                <a
                  href={selectedOpp.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                >
                  {selectedOpp.source_name ?? "View Article"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <AssessmentPanel opp={selectedOpp} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</div>
                  <div className="text-slate-300 text-sm">{selectedOpp.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Discovered
                  </div>
                  <div className="text-slate-300 text-sm">
                    {new Date(selectedOpp.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="p-5 border-t border-white/[0.06] flex gap-2 flex-wrap">
              <button
                onClick={() =>
                  void pushOneToVendors(selectedOpp, {
                    stopPropagation: () => {},
                  } as React.MouseEvent)
                }
                disabled={pushing === selectedOpp.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/20 text-sm font-semibold transition-all"
              >
                {pushing === selectedOpp.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Push to Vendors
              </button>
              <button
                onClick={() => void updateStatus(selectedOpp.id, "contacted")}
                disabled={selectedOpp.status === "contacted"}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-sm font-semibold transition-all disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Contacted
              </button>
              <button
                onClick={() => void updateStatus(selectedOpp.id, "qualified")}
                disabled={selectedOpp.status === "qualified"}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-sm font-semibold transition-all disabled:opacity-40"
              >
                <TrendingUp className="w-4 h-4" />
                Mark Qualified
              </button>
              <button
                onClick={() => void updateStatus(selectedOpp.id, "archived")}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all ml-auto"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpportunitiesDashboard;
