/**
 * VendorLeadsMarketingPage — /vendor-leads
 *
 * Public marketing page for prospective vendors.
 * - Shows the top 10 real live leads with full detail
 * - Cards 11+ are blurred with a "Unlock all leads" CTA
 * - Inline signup form creates a pending vendor account (same flow as /vendor-portal)
 * - No login required to view the teaser cards
 */
import { useState, useEffect, useRef } from "react";
import {
  Battery,
  Sun,
  Cpu,
  TrendingUp,
  Lock,
  ChevronRight,
  CheckCircle,
  Zap,
  ExternalLink,
  Loader2,
  ArrowRight,
  Building2,
  Shield,
  Star,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { registerVendor } from "../services/vendorService";
import merlinIcon from "@/assets/images/new_small_profile_.png";

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
  created_at: string;
}

type Specialty = "battery" | "inverter" | "ems" | "bos" | "epc" | "integrator";

interface SignupForm {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  password: string;
  specialty: Specialty | "";
  website: string;
  description: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, string> = {
  bess_procurement: "BESS Procurement",
  solar_procurement: "Solar Procurement",
  generator_procurement: "Generator / Backup",
  energy_project: "Energy Project",
  microgrid_procurement: "Microgrid RFP",
  virtual_power_plant: "VPP / Demand Response",
  c_and_i_solar: "C&I Solar",
  rfq: "RFQ / RFP Issued",
  procurement_awarded: "Contract Awarded",
  interconnection_application: "Grid Interconnection",
  funding: "Funding Secured",
  permit_filed: "Permit Filed",
  construction: "Construction",
  expansion: "Expansion",
};

const INDUSTRY_LABELS: Record<string, string> = {
  data_center: "Data Center",
  manufacturing: "Manufacturing",
  logistics: "Logistics",
  hospitality: "Hospitality",
  healthcare: "Healthcare",
  hospital: "Hospital",
  retail: "Retail",
  education: "Education",
  automotive: "Automotive",
  cold_storage: "Cold Storage",
  car_wash: "Car Wash",
  truck_stop: "Truck Stop",
  energy: "Utility / Energy",
  government: "Government",
};

const SPECIALTY_OPTIONS: { value: Specialty; label: string; icon: string }[] = [
  { value: "battery", label: "Battery Storage / BESS", icon: "🔋" },
  { value: "integrator", label: "System Integrator", icon: "⚡" },
  { value: "epc", label: "EPC Contractor", icon: "🏗️" },
  { value: "inverter", label: "Inverter / Power Electronics", icon: "🔌" },
  { value: "ems", label: "Energy Management Systems", icon: "🧠" },
  { value: "bos", label: "Balance of System (BOS)", icon: "🔧" },
];

type OppCategory = "bess" | "solar" | "generator" | "other";

function classifyOpp(opp: Opportunity): OppCategory {
  const sigs = opp.signals as string[];
  const d = (opp.description ?? "").toLowerCase();
  if (
    sigs.some((s) =>
      [
        "bess_procurement",
        "energy_project",
        "microgrid_procurement",
        "virtual_power_plant",
      ].includes(s)
    ) ||
    /battery.storage|energy.storage|\bbess\b/i.test(d)
  )
    return "bess";
  if (
    sigs.some((s) => ["solar_procurement", "c_and_i_solar"].includes(s)) ||
    /\bsolar\b|\bpv\b/i.test(d)
  )
    return "solar";
  if (sigs.includes("generator_procurement") || /generator|backup.power/i.test(d))
    return "generator";
  return "other";
}

const CAT_STYLE: Record<OppCategory, { chip: string; icon: React.ReactNode; bar: string }> = {
  bess: {
    chip: "bg-blue-500/15 border-blue-500/30 text-blue-300",
    icon: <Battery className="w-3.5 h-3.5" />,
    bar: "bg-blue-500",
  },
  solar: {
    chip: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
    icon: <Sun className="w-3.5 h-3.5" />,
    bar: "bg-yellow-400",
  },
  generator: {
    chip: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    icon: <Cpu className="w-3.5 h-3.5" />,
    bar: "bg-purple-500",
  },
  other: {
    chip: "bg-slate-500/15 border-slate-500/30 text-slate-400",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    bar: "bg-emerald-500",
  },
};

function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-400";
  if (n >= 50) return "text-amber-400";
  return "text-slate-400";
}

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
  return "bg-white/[0.05] text-slate-400 border-white/[0.08]";
}

const PREVIEW_COUNT = 10; // free visible leads

// ─── Lead card (teaser) ───────────────────────────────────────────────────────

function LeadCard({ opp, index, locked }: { opp: Opportunity; index: number; locked: boolean }) {
  const cat = classifyOpp(opp);
  const style = CAT_STYLE[cat];

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all ${
        locked
          ? "border-white/[0.04] bg-[rgba(255,255,255,0.015)]"
          : "border-white/[0.08] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)]"
      }`}
    >
      {/* Category top-bar */}
      <div className={`h-0.5 w-full ${style.bar}`} />

      <div className={`p-5 ${locked ? "blur-sm select-none pointer-events-none" : ""}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${style.chip}`}
            >
              {style.icon}
              {cat === "bess"
                ? "Battery Storage"
                : cat === "solar"
                  ? "Solar"
                  : cat === "generator"
                    ? "Generator"
                    : "Energy"}
            </span>
            {opp.industry && (
              <span className="text-xs text-slate-500">
                {INDUSTRY_LABELS[opp.industry] ?? opp.industry}
              </span>
            )}
          </div>
          <div className={`text-lg font-bold shrink-0 ${scoreColor(opp.confidence_score)}`}>
            {opp.confidence_score}
            <span className="text-xs font-normal text-slate-600 ml-0.5">pts</span>
          </div>
        </div>

        {/* Company + description */}
        <h3 className="text-base font-semibold text-white mb-1 truncate">{opp.company_name}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{opp.description}</p>

        {/* Signals */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(opp.signals as string[]).slice(0, 4).map((sig) => (
            <span
              key={sig}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${signalPillStyle(sig)}`}
            >
              {SIGNAL_LABELS[sig] ?? sig.replace(/_/g, " ")}
            </span>
          ))}
          {opp.signals.length > 4 && (
            <span className="text-[11px] text-slate-600">+{opp.signals.length - 4}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">
            {new Date(opp.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <a
            href={`/lead/${opp.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View full lead <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Lock overlay for blurred cards */}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f1117]/60 backdrop-blur-[2px]">
          <Lock className="w-5 h-5 text-slate-500 mb-1" />
          <span className="text-xs text-slate-500 font-medium">Unlocks with free account</span>
        </div>
      )}

      {/* Lead number badge */}
      <div
        className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
          locked ? "bg-slate-800 text-slate-600" : "bg-white/[0.06] text-slate-500"
        }`}
      >
        {index + 1}
      </div>
    </div>
  );
}

// ─── Signup form ──────────────────────────────────────────────────────────────

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<SignupForm>({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "",
    website: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof SignupForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.specialty) {
      setError("Please select your specialty.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await registerVendor({
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      specialty: form.specialty as Specialty,
      website: form.website || undefined,
      description: form.description || undefined,
    });
    setLoading(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(
        (result as unknown as { error?: string }).error ?? "Registration failed. Please try again."
      );
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-[#3ECF8E]/60 focus:bg-white/[0.07] transition-all";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Company Name *</label>
          <input
            required
            className={inputClass}
            placeholder="Acme Energy LLC"
            value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Your Name *</label>
          <input
            required
            className={inputClass}
            placeholder="Jane Smith"
            value={form.contact_name}
            onChange={(e) => set("contact_name", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Work Email *</label>
          <input
            required
            type="email"
            className={inputClass}
            placeholder="jane@acmeenergy.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Phone</label>
          <input
            type="tel"
            className={inputClass}
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Your Specialty *</label>
        <div className="grid grid-cols-2 gap-2">
          {SPECIALTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("specialty", opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                form.specialty === opt.value
                  ? "border-[#3ECF8E]/60 bg-[#3ECF8E]/10 text-[#3ECF8E]"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15] hover:text-slate-300"
              }`}
            >
              <span className="text-base leading-none">{opt.icon}</span>
              <span className="text-xs leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password *</label>
          <input
            required
            type="password"
            minLength={8}
            className={inputClass}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Website</label>
          <input
            type="url"
            className={inputClass}
            placeholder="https://acmeenergy.com"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5 font-medium">
          Brief Company Description <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="What equipment do you supply and where do you operate?"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#3ECF8E] hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
        {loading ? "Creating your account…" : "Get Free Access to All Leads"}
      </button>

      <p className="text-center text-xs text-slate-600">
        Your account is reviewed and approved within 24 hours. No credit card required.
      </p>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VendorLeadsMarketingPage() {
  const [leads, setLeads] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [signupDone, setSignupDone] = useState(false);
  const signupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("opportunities")
        .select(
          "id,company_name,description,source_url,source_name,signals,industry,confidence_score,created_at"
        )
        .order("confidence_score", { ascending: false })
        .limit(25); // fetch 25; show 10 free + rest blurred
      setLeads((data as Opportunity[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const visibleLeads = leads.slice(0, PREVIEW_COUNT);
  const lockedLeads = leads.slice(PREVIEW_COUNT);

  // Category counts for social proof
  const bessCount = leads.filter((o) => classifyOpp(o) === "bess").length;
  const solarCount = leads.filter((o) => classifyOpp(o) === "solar").length;
  const genCount = leads.filter((o) => classifyOpp(o) === "generator").length;

  function scrollToSignup() {
    signupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* ── Nav ── */}
      <div className="border-b border-white/[0.06] bg-[#13151c]/90 backdrop-blur-sm sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="https://merlinenergy.net" className="flex items-center gap-2.5">
            <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold text-white">
              Merlin<span className="text-[#3ECF8E]">Energy</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/vendor-portal"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Already a vendor? Sign in
            </a>
            <button
              onClick={scrollToSignup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3ECF8E] hover:bg-emerald-400 text-black text-sm font-bold transition-all"
            >
              Get Free Access <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3ECF8E]/25 bg-[#3ECF8E]/[0.07] text-[#3ECF8E] text-sm font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          Live procurement leads — updated daily
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-4">
          Real leads for energy
          <br />
          <span className="text-[#3ECF8E]">storage & solar vendors</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Merlin's AI scrapes 43 news sources and government procurement feeds daily to surface
          companies actively seeking BESS, solar, and generator equipment — before they post on your
          radar.
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mb-10 flex-wrap">
          {[
            {
              icon: <Battery className="w-4 h-4 text-blue-400" />,
              value: `${bessCount}+`,
              label: "BESS leads",
            },
            {
              icon: <Sun className="w-4 h-4 text-yellow-400" />,
              value: `${solarCount}+`,
              label: "Solar leads",
            },
            {
              icon: <Cpu className="w-4 h-4 text-purple-400" />,
              value: `${genCount}+`,
              label: "Generator leads",
            },
            {
              icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
              value: "Daily",
              label: "New leads",
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              {s.icon}
              <span className="text-white font-bold">{s.value}</span>
              <span className="text-slate-500 text-sm">{s.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={scrollToSignup}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#3ECF8E] hover:bg-emerald-400 text-black text-base font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          Unlock All Leads Free <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-slate-600 mt-3">No credit card · Approved within 24 hours</p>
      </div>

      {/* ── Lead cards ── */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            Latest Procurement Leads
            <span className="ml-2 text-sm font-normal text-slate-500">
              — showing {visibleLeads.length} of {leads.length}+
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Updated today
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Free cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {visibleLeads.map((opp, i) => (
                <LeadCard key={opp.id} opp={opp} index={i} locked={false} />
              ))}
            </div>

            {/* Locked cards (blurred) + inline unlock CTA */}
            {lockedLeads.length > 0 && (
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lockedLeads.map((opp, i) => (
                    <LeadCard key={opp.id} opp={opp} index={PREVIEW_COUNT + i} locked={true} />
                  ))}
                </div>

                {/* Gradient fade + unlock message */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1117]/60 to-[#0f1117] flex flex-col items-center justify-end pb-8 pointer-events-none">
                  <div className="pointer-events-auto text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <Lock className="w-5 h-5 text-slate-400" />
                      <span className="text-white font-semibold text-lg">
                        {lockedLeads.length} more leads locked
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 max-w-sm">
                      Create a free vendor account to unlock all leads, get email alerts when new
                      ones match your specialty, and submit quotes directly.
                    </p>
                    <button
                      onClick={scrollToSignup}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3ECF8E] hover:bg-emerald-400 text-black font-bold text-sm transition-all"
                    >
                      Unlock All Leads Free <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Value props ── */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6 text-blue-400" />,
              title: "First-mover advantage",
              desc: "Leads are sourced from government procurement feeds and industry news the day they publish — before they hit your competitors.",
            },
            {
              icon: <Shield className="w-6 h-6 text-emerald-400" />,
              title: "Pre-qualified intent",
              desc: "Every lead is scored by Merlin's NLP engine across 5 dimensions — only genuine procurement intent makes the cut. No noise.",
            },
            {
              icon: <Building2 className="w-6 h-6 text-purple-400" />,
              title: "Matched to your specialty",
              desc: "Tell us what you sell and where. You only receive leads that match — BESS, solar, generator, EPC, or full system integration.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/[0.07] bg-[rgba(255,255,255,0.025)] p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4">
                {p.icon}
              </div>
              <h3 className="text-white font-bold mb-2">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Signup section ── */}
      <div ref={signupRef} className="max-w-2xl mx-auto px-6 pb-20" id="signup">
        {signupDone ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-10 text-center">
            <CheckCircle className="w-14 h-14 text-[#3ECF8E] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">You're in the queue!</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              Your vendor account is pending approval. We'll email you within 24 hours once you're
              approved, and then you'll have full access to all leads in your specialty.
            </p>
            <a
              href="/vendor-portal"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3ECF8E] hover:bg-emerald-400 text-black font-bold text-sm transition-all"
            >
              Go to Vendor Portal <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#13151c] p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-[#3ECF8E]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Get free access to all leads</h2>
                <p className="text-sm text-slate-500">
                  Create your vendor account — approved in 24 hours
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 py-4 mb-6 border-y border-white/[0.06] flex-wrap">
              {["✓ No credit card", "✓ Free account", "✓ Email alerts", "✓ Quote submission"].map(
                (b) => (
                  <span key={b} className="text-xs text-slate-400 font-medium">
                    {b}
                  </span>
                )
              )}
            </div>

            <SignupForm onSuccess={() => setSignupDone(true)} />
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-600">
        <a href="https://merlinenergy.net" className="hover:text-slate-400 transition-colors">
          Merlin Energy
        </a>
        {" · "}
        <a href="/vendor-portal" className="hover:text-slate-400 transition-colors">
          Vendor Portal
        </a>
        {" · "}
        <a href="/privacy" className="hover:text-slate-400 transition-colors">
          Privacy
        </a>
      </div>
    </div>
  );
}
