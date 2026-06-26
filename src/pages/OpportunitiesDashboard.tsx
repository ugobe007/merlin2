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
  Play,
  Sparkles,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { runOpportunityScraper } from "../api/opportunityScraper";
import { assessOpportunity, type OppAssessment } from "../services/opportunityAssessmentService";
import type {
  Opportunity,
  OpportunityFilter,
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

export function OpportunitiesDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [scraping, setScraping] = useState(false);

  // Filters
  const [filter, setFilter] = useState<OpportunityFilter>({
    status: ["new"],
    minConfidence: 30,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Load opportunities
  useEffect(() => {
    loadOpportunities();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...opportunities];

    // Status filter
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter((opp) => filter.status!.includes(opp.status));
    }

    // Confidence filter
    if (filter.minConfidence) {
      filtered = filtered.filter((opp) => opp.confidence_score >= filter.minConfidence!);
    }

    // Industry filter
    if (filter.industry && filter.industry.length > 0) {
      filtered = filtered.filter((opp) => opp.industry && filter.industry!.includes(opp.industry));
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.company_name.toLowerCase().includes(query) ||
          opp.description.toLowerCase().includes(query)
      );
    }

    setFilteredOpportunities(filtered);
  }, [opportunities, filter, searchQuery]);

  async function loadOpportunities() {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("confidence_score", { ascending: false });

      if (error) throw error;

      setOpportunities(data || []);
    } catch (error) {
      console.error("Error loading opportunities:", error);
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
          `✅ Scraper complete!\n\nFound: ${result.data?.total_found || 0} opportunities\nNew: ${result.data?.new_opportunities || 0}\nDuplicates: ${result.data?.duplicates_skipped || 0}`
        );
      } else {
        alert(`❌ Scraper failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Scraper error:", error);
      alert("❌ Failed to run scraper");
    } finally {
      setScraping(false);
    }
  }

  async function updateStatus(oppId: string, newStatus: OpportunityStatus) {
    try {
      const updates: Partial<Opportunity> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "contacted") {
        updates.contacted_at = new Date().toISOString();
      }

      const { error } = await supabase.from("opportunities").update(updates).eq("id", oppId);

      if (error) throw error;

      // Update local state
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === oppId ? { ...opp, ...updates } : opp))
      );

      if (selectedOpp?.id === oppId) {
        setSelectedOpp({ ...selectedOpp, ...updates });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  function getConfidenceColor(score: number) {
    if (score >= 70) return "text-emerald-400 bg-emerald-950/30 border-emerald-500/30";
    if (score >= 50) return "text-yellow-400 bg-yellow-950/30 border-yellow-500/30";
    return "text-slate-400 bg-slate-950/30 border-slate-500/30";
  }

  function getConfidenceLabel(score: number) {
    if (score >= 70) return "High";
    if (score >= 50) return "Medium";
    return "Low";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Loading opportunities...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Opportunity Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runScraper}
              disabled={scraping}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg transition-colors font-semibold"
            >
              <Play className="w-4 h-4" />
              {scraping ? "Scraping..." : "Run Scraper"}
            </button>
            <button
              onClick={loadOpportunities}
              className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        <p className="text-slate-400">
          Business leads discovered by Merlin&apos;s opportunity scraper
        </p>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{opportunities.length}</div>
          <div className="text-sm text-slate-400">Total Opportunities</div>
        </div>
        <div className="bg-emerald-900/30 backdrop-blur-sm border border-emerald-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">
            {opportunities.filter((o) => o.status === "new").length}
          </div>
          <div className="text-sm text-slate-400">New</div>
        </div>
        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">
            {opportunities.filter((o) => o.status === "contacted").length}
          </div>
          <div className="text-sm text-slate-400">Contacted</div>
        </div>
        <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">
            {opportunities.filter((o) => o.confidence_score >= 70).length}
          </div>
          <div className="text-sm text-slate-400">High Confidence</div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filter.status?.[0] || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value ? [e.target.value as OpportunityStatus] : undefined,
                })
              }
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Confidence filter */}
          <div>
            <select
              value={filter.minConfidence || 0}
              onChange={(e) => setFilter({ ...filter, minConfidence: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="0">All Confidence</option>
              <option value="70">High (70+)</option>
              <option value="50">Medium (50+)</option>
              <option value="30">Low (30+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="max-w-7xl mx-auto bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Confidence
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Industry
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Signals
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOpportunities.map((opp) => (
                <tr
                  key={opp.id}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedOpp(opp)}
                >
                  <td className="px-4 py-3">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${getConfidenceColor(opp.confidence_score)}`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {opp.confidence_score}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{opp.company_name}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{opp.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    {opp.industry && (
                      <div className="text-sm text-slate-300">{INDUSTRY_LABELS[opp.industry]}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {opp.signals.slice(0, 2).map((signal: string) => (
                        <span
                          key={signal}
                          className="text-xs px-2 py-0.5 bg-emerald-950/50 border border-emerald-800/30 rounded text-emerald-300"
                        >
                          {signalLabel(signal).split(" ")[0]}
                        </span>
                      ))}
                      {opp.signals.length > 2 && (
                        <span className="text-xs text-slate-400">+{opp.signals.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        opp.status === "new"
                          ? "bg-blue-950/50 text-blue-400 border border-blue-800/30"
                          : opp.status === "contacted"
                            ? "bg-yellow-950/50 text-yellow-400 border border-yellow-800/30"
                            : opp.status === "qualified"
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/30"
                              : "bg-slate-950/50 text-slate-400 border border-slate-800/30"
                      }`}
                    >
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(opp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(opp.source_url, "_blank");
                        }}
                        className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
                        title="View source"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOpportunities.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No opportunities found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOpp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedOpp(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedOpp.company_name}</h2>
                  <div className="flex items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${getConfidenceColor(selectedOpp.confidence_score)}`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {getConfidenceLabel(selectedOpp.confidence_score)} (
                      {selectedOpp.confidence_score})
                    </div>
                    {selectedOpp.industry && (
                      <span className="text-sm text-slate-300">
                        {INDUSTRY_LABELS[selectedOpp.industry]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Signals */}
              <div className="flex flex-wrap gap-2">
                {selectedOpp.signals.map((signal: string) => (
                  <span
                    key={signal}
                    className="text-sm px-3 py-1 bg-emerald-950/50 border border-emerald-800/30 rounded-full text-emerald-300"
                  >
                    {signalLabel(signal)}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-emerald-400 font-semibold mb-1">Description</div>
                <p className="text-slate-300">{selectedOpp.description}</p>
              </div>

              <div>
                <div className="text-sm text-emerald-400 font-semibold mb-1">Source</div>
                <a
                  href={selectedOpp.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {selectedOpp.source_name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* ── Opportunity Assessment ── */}
              <AssessmentPanel opp={selectedOpp} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-emerald-400 font-semibold mb-1">Status</div>
                  <div className="text-slate-300">{selectedOpp.status}</div>
                </div>
                <div>
                  <div className="text-sm text-emerald-400 font-semibold mb-1">Discovered</div>
                  <div className="text-slate-300">
                    {new Date(selectedOpp.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => updateStatus(selectedOpp.id, "contacted")}
                disabled={selectedOpp.status === "contacted"}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Contacted
              </button>
              <button
                onClick={() => updateStatus(selectedOpp.id, "qualified")}
                disabled={selectedOpp.status === "qualified"}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp className="w-4 h-4" />
                Mark Qualified
              </button>
              <button
                onClick={() => updateStatus(selectedOpp.id, "archived")}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
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
