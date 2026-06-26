/**
 * SharedLeadPage — /lead/:id
 *
 * Public (no login required) read-only view of a single opportunity.
 * The admin copies this URL from the opportunity dashboard and sends it to any
 * vendor or prospect. No admin or vendor portal access needed to view it.
 */
import { useState, useEffect } from "react";
import {
  Battery,
  Sun,
  Cpu,
  TrendingUp,
  ExternalLink,
  MapPin,
  Calendar,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import merlinIcon from "@/assets/images/new_small_profile_.png";
// Opportunity type defined locally (subset of full type)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  company_name: string;
  description: string;
  source_url: string;
  source_name: string | null;
  signals: string[];
  industry: string | null;
  confidence_score: number;
  status: string;
  location: string | null;
  created_at: string;
}

// ─── Display maps ─────────────────────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, string> = {
  construction: "🏗️ Construction",
  expansion: "📈 Expansion",
  new_opening: "🆕 New Opening",
  funding: "💰 Funding Secured",
  acquisition: "🤝 Acquisition",
  sustainability_initiative: "🌱 Sustainability Initiative",
  energy_upgrade: "⚡ Energy Upgrade",
  facility_upgrade: "🔧 Facility Upgrade",
  rfq: "📄 RFQ / RFP Issued",
  energy_project: "🔋 Energy Project",
  high_utility_exposure: "💸 High Utility Cost",
  bess_procurement: "🔋 BESS Procurement",
  solar_procurement: "☀️ Solar Procurement",
  generator_procurement: "⚙️ Generator Procurement",
  permit_filed: "📋 Permit Filed",
  interconnection_application: "🔌 Grid Interconnection App",
  microgrid_procurement: "⚡ Microgrid RFP",
  virtual_power_plant: "🌐 VPP / Demand Response",
  c_and_i_solar: "☀️ C&I Solar",
  procurement_awarded: "🏆 Contract Awarded",
};

const INDUSTRY_LABELS: Record<string, string> = {
  data_center: "Data Center",
  manufacturing: "Manufacturing",
  logistics: "Logistics / Warehouse",
  hospitality: "Hospitality",
  healthcare: "Healthcare",
  hospital: "Hospital",
  retail: "Retail",
  education: "Education",
  automotive: "Automotive",
  cold_storage: "Cold Storage",
  car_wash: "Car Wash",
  truck_stop: "Truck Stop",
  agricultural: "Agricultural",
  gym: "Gym / Fitness",
  energy: "Energy / Utility",
  government: "Government",
};

type OppCategory = "bess" | "solar" | "generator" | "other";

function classify(opp: Opportunity): OppCategory {
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
  if (isBESS) return "bess";
  if (isSolar) return "solar";
  if (isGen) return "generator";
  return "other";
}

const CATEGORY_CONFIG = {
  bess: {
    label: "Battery Storage (BESS)",
    icon: <Battery className="w-4 h-4" />,
    color: "text-blue-300",
    bg: "bg-blue-500/15 border-blue-500/30",
  },
  solar: {
    label: "Solar",
    icon: <Sun className="w-4 h-4" />,
    color: "text-yellow-300",
    bg: "bg-yellow-500/15 border-yellow-500/30",
  },
  generator: {
    label: "Generator / Backup Power",
    icon: <Cpu className="w-4 h-4" />,
    color: "text-purple-300",
    bg: "bg-purple-500/15 border-purple-500/30",
  },
  other: {
    label: "Energy Project",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-slate-300",
    bg: "bg-slate-500/15 border-slate-500/30",
  },
} as const;

function signalPillStyle(sig: string): string {
  if (
    ["bess_procurement", "energy_project", "microgrid_procurement", "virtual_power_plant"].includes(
      sig
    )
  )
    return "bg-blue-500/10 text-blue-300 border-blue-500/25";
  if (["solar_procurement", "c_and_i_solar"].includes(sig))
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/25";
  if (["generator_procurement"].includes(sig))
    return "bg-purple-500/10 text-purple-300 border-purple-500/25";
  if (["rfq", "interconnection_application", "permit_filed", "procurement_awarded"].includes(sig))
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/25";
  return "bg-white/[0.05] text-slate-400 border-white/[0.08]";
}

function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-400";
  if (n >= 50) return "text-amber-400";
  return "text-slate-400";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SharedLeadPage() {
  const id = window.location.pathname.replace(/^\/lead\//, "").split("?")[0];

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    void (async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id,company_name,description,source_url,source_name,signals,industry,confidence_score,status,location,created_at"
        )
        .eq("id", id)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setOpp(data as Opportunity);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !opp) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="text-4xl">🔍</div>
        <h1 className="text-xl font-bold text-white">Lead not found</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          This lead may have been archived or the link is invalid.
        </p>
        <a
          href="https://merlinenergy.net"
          className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
        >
          Go to Merlin Energy <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  const cat = classify(opp);
  const cfg = CATEGORY_CONFIG[cat];

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Nav bar */}
      <div className="border-b border-white/[0.06] bg-[#13151c] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="https://merlinenergy.net" className="flex items-center gap-2.5">
            <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold text-white">
              Merlin<span className="text-[#3ECF8E]">Energy</span>
            </span>
          </a>
          <a
            href="/vendor-portal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3ECF8E]/30 text-[#3ECF8E] hover:bg-[#3ECF8E]/10 text-sm font-medium transition-all"
          >
            Vendor Portal <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] overflow-hidden">
          {/* Top accent bar by category */}
          <div
            className={`h-1 w-full ${
              cat === "bess"
                ? "bg-blue-500"
                : cat === "solar"
                  ? "bg-yellow-400"
                  : cat === "generator"
                    ? "bg-purple-500"
                    : "bg-emerald-500"
            }`}
          />

          <div className="p-6">
            {/* Category + score */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <span
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.color}`}
              >
                {cfg.icon}
                {cfg.label}
              </span>
              <div className={`text-right ${scoreColor(opp.confidence_score)}`}>
                <div className="text-2xl font-bold">{opp.confidence_score}</div>
                <div className="text-xs text-slate-500">Relevance Score</div>
              </div>
            </div>

            {/* Company name */}
            <h1 className="text-2xl font-bold text-white mb-1">{opp.company_name}</h1>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-5 flex-wrap">
              {opp.industry && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {INDUSTRY_LABELS[opp.industry] ?? opp.industry}
                </span>
              )}
              {opp.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {opp.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(opp.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed">{opp.description}</p>
          </div>
        </div>

        {/* Signals */}
        {opp.signals.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Procurement Signals Detected
            </h2>
            <div className="flex flex-wrap gap-2">
              {opp.signals.map((sig) => (
                <span
                  key={sig}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${signalPillStyle(sig)}`}
                >
                  {SIGNAL_LABELS[sig] ?? sig.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source + CTA */}
        <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Source</h2>
          <a
            href={opp.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {opp.source_name ?? opp.source_url}
          </a>
        </div>

        {/* Vendor CTA */}
        <div className="rounded-2xl border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04] p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#3ECF8E]" />
            <span className="text-[#3ECF8E] font-semibold">Interested in this lead?</span>
          </div>
          <p className="text-slate-400 text-sm">
            Create a free vendor account to unlock all active leads, get matched to new ones daily,
            and submit pricing directly to buyers.
          </p>
          <a
            href="/vendor-leads"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3ECF8E] hover:bg-emerald-400 text-black font-semibold text-sm transition-all"
          >
            Get more leads like this
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 pb-4">
          Lead intelligence powered by{" "}
          <a href="https://merlinenergy.net" className="text-slate-500 hover:text-slate-400">
            Merlin Energy
          </a>
          . This link was shared with you directly.
        </div>
      </div>
    </div>
  );
}
