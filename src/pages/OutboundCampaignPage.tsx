/**
 * Outbound Campaign Page — /campaign & /outbound
 * ===============================================
 * Three discovery & outreach modes:
 *   1) 🎯 Target Accounts Matrix — 78 High-Load NV & AZ Commercial/Industrial Leads
 *   2) 📰 Energy Projects — POST /api/sales-agent/news-projects (RSS scraper)
 *   3) 📍 Industry Sites — POST /api/sales-agent/discover (Google Places)
 *
 * Includes Interactive AI Email Drafter & AI Agent Trainer!
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { OUTBOUND_TARGET_LEADS } from "@/data/outboundLeadsData";
import type { OutboundTargetLead } from "@/data/outboundLeadsData";
import {
  generateAIOutreachPitch,
  getTrainedAIRules,
  saveTrainedAIRules,
  getSavedLeadDrafts,
  saveLeadDraft,
  SavedLeadDraft,
} from "@/services/aiOutreachTrainerService";
import type { GeneratedEmailPitch } from "@/services/aiOutreachTrainerService";
import {
  Search,
  ExternalLink,
  Sparkles,
  Check,
  Copy,
  Brain,
  X,
  Plus,
  Trash2,
  FileText,
  Filter,
  MapPin,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuoteHighlights {
  annualSavings?: number;
  payback?: number;
  npv25?: number;
  bessKW?: number;
  solarKW?: number;
  netInvestment?: number;
}

interface CampaignLead {
  id: string;
  name: string;
  industry: string;
  location?: string;
  address?: string;
  confidence?: number;
  articleTitle?: string;
  articleUrl?: string;
  source?: string;
  status: "discovered" | "quoted" | "emailed";
  quoteUrl?: string;
  highlights?: QuoteHighlights;
  emailedTo?: string[];
  website?: string;
  resolvedEmails?: string[];
}

interface DiscoverResult {
  ok: boolean;
  discovered: number;
  quoted: number;
  emailed: number;
  skipped: number;
  errors: string[];
  leads: CampaignLead[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PLACES_VERTICALS = ["car_wash", "ev_charging", "truck_stop", "hotel"];
const NEWS_INDUSTRIES = [
  { id: "manufacturing", label: "Manufacturing" },
  { id: "data_center", label: "Data Center" },
  { id: "logistics", label: "Warehouse / Logistics" },
  { id: "hotel", label: "Hotel / Hospitality" },
  { id: "healthcare", label: "Healthcare" },
  { id: "car_wash", label: "Car Wash" },
  { id: "ev_charging", label: "EV Charging" },
  { id: "energy_project", label: "Energy Project (BESS/Solar)" },
  { id: "casino", label: "Casino / Resort" },
  { id: "airport", label: "Airport" },
];

const STATUS_COLORS: Record<string, string> = {
  discovered: "bg-slate-700 text-slate-200",
  quoted: "bg-blue-900 text-blue-200",
  emailed: "bg-emerald-900 text-emerald-300",
};

function fmt$k(n?: number) {
  if (!n && n !== 0) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtKW(n?: number) {
  if (!n && n !== 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)} MW`;
  return `${n} kW`;
}

// ─── Stat Badge ──────────────────────────────────────────────────────────────
function StatBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center px-4 py-2 rounded-xl border ${
        highlight ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800/80 border-slate-700/60"
      }`}
    >
      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
        {label}
      </span>
      <span
        className={`text-lg font-extrabold ${highlight ? "text-amber-400" : "text-emerald-400"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Scraped Lead Row ────────────────────────────────────────────────────────
function LeadRow({
  lead,
  onEmail,
  onPreview,
  emailingId,
}: {
  lead: CampaignLead;
  onEmail: (id: string) => void;
  onPreview: (id: string) => void;
  emailingId: string | null;
}) {
  const h = lead.highlights || {};
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-semibold text-white text-sm">{lead.name}</div>
        {lead.articleTitle && (
          <a
            href={lead.articleUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-emerald-400 line-clamp-1 transition-colors"
          >
            ↗ {lead.articleTitle}
          </a>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-slate-300">{lead.location || lead.address || "—"}</td>
      <td className="py-3 px-4">
        <span className="text-xs bg-slate-700 text-slate-300 rounded px-2 py-1">
          {lead.industry?.replace(/_/g, " ")}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-right text-emerald-400">{fmt$k(h.annualSavings)}</td>
      <td className="py-3 px-4 text-sm text-right text-slate-300">
        {h.payback ? `${h.payback.toFixed(1)} yr` : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-right text-slate-300">{fmt$k(h.npv25)}</td>
      <td className="py-3 px-4 text-sm text-right text-slate-400">{fmtKW(h.bessKW)}</td>
      <td className="py-3 px-4">
        <span
          className={`text-xs rounded px-2 py-1 font-medium ${STATUS_COLORS[lead.status] || ""}`}
        >
          {lead.status}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          {lead.quoteUrl && (
            <a
              href={lead.quoteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Quote
            </a>
          )}
          <button
            onClick={() => onPreview(lead.id)}
            className="text-xs text-slate-400 hover:text-white border border-slate-600 rounded px-2 py-1 transition-colors"
          >
            Preview
          </button>
          {lead.status !== "emailed" && (
            <button
              onClick={() => onEmail(lead.id)}
              disabled={emailingId === lead.id}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded px-2 py-1 transition-colors"
            >
              {emailingId === lead.id ? "Sending…" : "Send"}
            </button>
          )}
          {lead.status === "emailed" && (
            <span className="text-xs text-emerald-500 font-semibold">✓ Sent</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Email Preview Modal (Scraped Leads) ──────────────────────────────────────
function EmailPreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <span className="font-bold text-white text-sm">Email Preview</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-white">
          <iframe
            srcDoc={html}
            className="w-full h-full min-h-[600px] border-0"
            title="Email preview"
          />
        </div>
      </div>
    </div>
  );
}

// ─── AI Email Drafter & Trainer Modal ─────────────────────────────────────────
function AiEmailDrafterModal({ lead, onClose }: { lead: OutboundTargetLead; onClose: () => void }) {
  type AngleType =
    | "peak_shaving"
    | "demand_insurance"
    | "solar_bess_itc"
    | "industrial_resilience"
    | "tariff_optimization";
  type ToneType = "executive" | "engineering" | "consultative";

  const defaultAngle: AngleType = lead.vertical.includes("Car Wash")
    ? "peak_shaving"
    : lead.vertical.includes("Cold Storage") || lead.vertical.includes("Food")
      ? "demand_insurance"
      : lead.vertical.includes("Manufacturing")
        ? "industrial_resilience"
        : "solar_bess_itc";

  const [angle, setAngle] = useState<AngleType>(defaultAngle);
  const [tone, setTone] = useState<ToneType>("executive");
  const [customNotes, setCustomNotes] = useState("");
  const [pitch, setPitch] = useState<GeneratedEmailPitch | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTrainer, setShowTrainer] = useState(false);
  const [rules, setRules] = useState<string[]>(getTrainedAIRules());
  const [newRule, setNewRule] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);

  // Auto-generate initial draft on open
  useEffect(() => {
    const generated = generateAIOutreachPitch({
      lead,
      angle,
      tone,
      customNotes,
      customTrainingRules: rules,
    });
    setPitch(generated);
    setDraftSaved(false);
  }, [lead, angle, tone, customNotes, rules]);

  const handleCopy = () => {
    if (!pitch) return;
    const textToCopy = `Subject: ${pitch.subject}\n\n${pitch.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    if (!pitch) return;
    saveLeadDraft({
      leadId: lead.id,
      company: lead.company,
      subject: pitch.subject,
      body: pitch.body,
      updatedAt: new Date().toISOString(),
    });
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    const updated = [...rules, newRule.trim()];
    setRules(updated);
    saveTrainedAIRules(updated);
    setNewRule("");
  };

  const handleRemoveRule = (idx: number) => {
    const updated = rules.filter((_, i) => i !== idx);
    setRules(updated);
    saveTrainedAIRules(updated);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{lead.company}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {lead.priority}
                </span>
                <span className="text-xs text-slate-400">
                  {lead.city}, {lead.state}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <span className="text-emerald-400 font-semibold">{lead.decisionMaker}</span>{" "}
                ({lead.title})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Qualification Trigger Banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-semibold tracking-wider">
                Qualification Trigger:{" "}
              </span>
              <span className="text-slate-200 font-medium">{lead.qualificationTrigger}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold tracking-wider">
                Merlin Angle:{" "}
              </span>
              <span className="text-emerald-400 font-medium">{lead.merlinAngle}</span>
            </div>
          </div>

          {/* AI Drafter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Outreach Angle & Hook
              </label>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value as AngleType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="peak_shaving">⚡ Motor Peak Shaving (Car Wash / Heavy)</option>
                <option value="demand_insurance">
                  ❄️ 24/7 Refrigeration Clamping (Cold Storage)
                </option>
                <option value="solar_bess_itc">
                  ☀️ 30-50% IRA Tax Credit (Hospitality/Retail)
                </option>
                <option value="industrial_resilience">
                  🏭 Process Power Resilience (Mfg/Tech)
                </option>
                <option value="tariff_optimization">📊 Utility Tariff Shifting (Multi-Site)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Persona / Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="executive">👔 Executive Concise (C-Suite Direct)</option>
                <option value="engineering">⚙️ Engineering Technical (NREL-grade)</option>
                <option value="consultative">🤝 Consultative Strategic (Partner Advisory)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Custom Angle / Notes
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Reference recent expansion, rooftop solar..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Generated Pitch Box */}
          {pitch && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Personalized Pitch Draft
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTrainer(!showTrainer)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    {showTrainer ? "Hide AI Trainer" : "🎓 Train AI Rules"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy Draft"}
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    {draftSaved ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    {draftSaved ? "Saved!" : "Save Lead Draft"}
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Subject Line:
                </span>
                <span className="text-sm font-semibold text-white">{pitch.subject}</span>
              </div>

              {/* Body */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                  {pitch.body}
                </pre>
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 pt-1">
                {pitch.keyHighlights.map((h, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Trainer Panel */}
          {showTrainer && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                <Brain className="w-4 h-4 text-purple-400" />
                Train Merlin AI Agent — Custom Outreach Directives
              </div>
              <p className="text-xs text-purple-200/70">
                Add rules and guidelines below. The AI Outreach Agent will strictly obey these
                directives when generating pitches for all future commercial targets.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
                  placeholder="e.g. Always mention 30% IRA bonus depreciation for manufacturing facilities..."
                  className="flex-1 bg-slate-900 border border-purple-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={handleAddRule}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
                  >
                    <span>• {rule}</span>
                    <button
                      onClick={() => handleRemoveRule(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutboundCampaignPage() {
  const [mode, setMode] = useState<"targets" | "news" | "places">("targets");

  // Target Accounts State
  const [cityFilter, setCityFilter] = useState<"all" | "Las Vegas" | "Phoenix">("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTargetLead, setSelectedTargetLead] = useState<OutboundTargetLead | null>(null);

  // Saved Drafts map
  const [savedDrafts, setSavedDrafts] = useState<Record<string, SavedLeadDraft>>({});

  useEffect(() => {
    setSavedDrafts(getSavedLeadDrafts());
  }, [selectedTargetLead]);

  // Scraped Places form
  const [location, setLocation] = useState("Las Vegas, NV");
  const [verticals, setVerticals] = useState<string[]>(["car_wash", "ev_charging"]);
  const [maxPer, setMaxPer] = useState(15);

  // Scraped News form
  const [industries, setIndustries] = useState<string[]>([
    "manufacturing",
    "data_center",
    "logistics",
    "hotel",
    "energy_project",
  ]);
  const [minConf, setMinConf] = useState(40);
  const [autoQuote, setAutoQuote] = useState(true);

  // Shared state for scraped leads
  const [running, setRunning] = useState(false);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [stats, setStats] = useState<Omit<DiscoverResult, "leads"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email state
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Filter Target Leads
  const filteredTargetLeads = useMemo(() => {
    return OUTBOUND_TARGET_LEADS.filter((lead) => {
      if (cityFilter !== "all" && lead.city !== cityFilter) return false;
      if (
        verticalFilter !== "all" &&
        !lead.vertical.toLowerCase().includes(verticalFilter.toLowerCase())
      )
        return false;
      if (priorityFilter !== "all" && lead.priority !== priorityFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesCompany = lead.company.toLowerCase().includes(q);
        const matchesContact = lead.decisionMaker.toLowerCase().includes(q);
        const matchesTitle = lead.title.toLowerCase().includes(q);
        const matchesTrigger = lead.qualificationTrigger.toLowerCase().includes(q);
        if (!matchesCompany && !matchesContact && !matchesTitle && !matchesTrigger) return false;
      }
      return true;
    });
  }, [cityFilter, verticalFilter, priorityFilter, searchTerm]);

  // Load existing scraped leads on mount
  useEffect(() => {
    fetch("/api/sales-agent/leads?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (!data.leads) return;
        setLeads(data.leads);
      })
      .catch(() => {});
  }, []);

  // ── Run Campaign ─────────────────────────────────────────────────────────
  const runCampaign = useCallback(async () => {
    setRunning(true);
    setError(null);

    try {
      let url: string;
      let body: Record<string, unknown>;

      if (mode === "places") {
        url = "/api/sales-agent/discover";
        body = { location, verticals, autoQuote, autoEmail: false, maxPerVertical: maxPer };
      } else {
        url = "/api/sales-agent/news-projects";
        body = { industries, autoQuote, autoEmail: false, minConfidence: minConf };
      }

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: DiscoverResult = await resp.json();

      if (!data.ok) throw new Error(data.errors?.[0] || "Campaign failed");

      const { leads: newLeads, ...rest } = data;
      setStats(rest);
      setLeads((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const fresh = newLeads.filter((l) => !existingIds.has(l.id));
        return [...fresh, ...prev];
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }, [mode, location, verticals, autoQuote, maxPer, industries, minConf]);

  // ── Send single email ─────────────────────────────────────────────────────
  const handleEmail = useCallback(async (leadId: string) => {
    setEmailingId(leadId);
    try {
      const resp = await fetch(`/api/sales-agent/email/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewOnly: false }),
      });
      const data = await resp.json();
      if (data.ok || data.success) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: "emailed" } : l)));
      }
    } catch (err) {
      console.warn("[Campaign] email error", err);
    }
    setEmailingId(null);
  }, []);

  // ── Preview email ─────────────────────────────────────────────────────────
  const handlePreview = useCallback(async (leadId: string) => {
    try {
      const resp = await fetch(`/api/sales-agent/email/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewOnly: true }),
      });
      const data = await resp.json();
      if (data.html) setPreviewHtml(data.html);
    } catch (err) {
      console.warn("[Campaign] preview error", err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {previewHtml && <EmailPreviewModal html={previewHtml} onClose={() => setPreviewHtml(null)} />}
      {selectedTargetLead && (
        <AiEmailDrafterModal
          lead={selectedTargetLead}
          onClose={() => setSelectedTargetLead(null)}
        />
      )}

      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Outreach Sales Panel
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                Merlin AI Engine
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              High-value C&I lead matrix · AI email pitch generator · Outreach AI agent training
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatBadge
              label="NV & AZ Target Accounts"
              value={OUTBOUND_TARGET_LEADS.length}
              highlight
            />
            <StatBadge
              label="Tier A High Priority"
              value={OUTBOUND_TARGET_LEADS.filter((l) => l.priority === "Tier A").length}
            />
            <StatBadge
              label="Verified Contacts"
              value={
                OUTBOUND_TARGET_LEADS.filter(
                  (l) => l.contactVerification === "Named/source verified"
                ).length
              }
            />
            <StatBadge label="Drafts Saved" value={Object.keys(savedDrafts).length} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Main Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-xl overflow-hidden border border-slate-800 bg-slate-900 p-1">
            {(
              [
                ["targets", "🎯 NV & AZ Target Matrix (78)"],
                ["news", "📰 Energy Projects (News Scraper)"],
                ["places", "📍 Industry Sites (Google Places)"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "targets" && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Showing <span className="text-white font-bold">
                {filteredTargetLeads.length}
              </span> of {OUTBOUND_TARGET_LEADS.length} target accounts
            </div>
          )}
        </div>

        {/* ── MODE 1: TARGET ACCOUNTS MATRIX ───────────────────────────────────── */}
        {mode === "targets" && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-400" /> Filter & Search Target Accounts
                </span>
                <button
                  onClick={() => {
                    setCityFilter("all");
                    setVerticalFilter("all");
                    setPriorityFilter("all");
                    setSearchTerm("");
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 underline"
                >
                  Reset Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search company, contact..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* City Filter */}
                <div>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">📍 All Cities (Las Vegas & Phoenix)</option>
                    <option value="Las Vegas">🎲 Las Vegas, NV (48)</option>
                    <option value="Phoenix">🌵 Phoenix, AZ (30)</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">⭐ All Priorities</option>
                    <option value="Tier A">🔥 Tier A (High Priority - 41)</option>
                    <option value="Tier B">🏢 Tier B (Portfolio / Fleet - 37)</option>
                  </select>
                </div>

                {/* Vertical Filter */}
                <div>
                  <select
                    value={verticalFilter}
                    onChange={(e) => setVerticalFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">🏭 All Industry Verticals</option>
                    <option value="Car Wash">🚗 Car Wash (11)</option>
                    <option value="Manufacturing">🏭 Manufacturing (19)</option>
                    <option value="Food">❄️ Food Distribution & Cold Storage (13)</option>
                    <option value="Hospitality">🏨 Hospitality & Resorts (20)</option>
                    <option value="Logistics">🚛 Logistics, Fleet & Waste (9)</option>
                    <option value="Entertainment">🏟️ Venues & Stadiums (6)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Matrix High-Density Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider bg-slate-900/90">
                      <th className="py-3.5 px-4 font-bold">Company</th>
                      <th className="py-3.5 px-4 font-bold">Location</th>
                      <th className="py-3.5 px-4 font-bold">Vertical</th>
                      <th className="py-3.5 px-4 font-bold">Target Contact</th>
                      <th className="py-3.5 px-4 font-bold">Qualification Trigger & Angle</th>
                      <th className="py-3.5 px-4 font-bold text-center">Priority</th>
                      <th className="py-3.5 px-4 font-bold text-right">Outreach Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTargetLeads.map((lead) => {
                      const hasDraft = !!savedDrafts[lead.id];
                      return (
                        <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* Company */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{lead.company}</span>
                              {lead.sourceUrl && (
                                <a
                                  href={lead.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Verified Source Link"
                                  className="text-amber-400/80 hover:text-amber-300 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            {hasDraft && (
                              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                                <FileText className="w-3 h-3" /> AI Draft Saved
                              </span>
                            )}
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4 text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {lead.city}, {lead.state}
                            </span>
                          </td>

                          {/* Vertical */}
                          <td className="py-3.5 px-4 text-xs text-slate-300">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 font-medium">
                              {lead.vertical}
                            </span>
                          </td>

                          {/* Target Contact */}
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-bold text-emerald-300">{lead.decisionMaker}</div>
                            <div className="text-[11px] text-slate-400">{lead.title}</div>
                          </td>

                          {/* Qualification Trigger & Angle */}
                          <td className="py-3.5 px-4 text-xs max-w-sm">
                            <div className="text-slate-200 line-clamp-1 font-medium">
                              {lead.qualificationTrigger}
                            </div>
                            <div className="text-amber-400/90 text-[11px] line-clamp-1 mt-0.5">
                              {lead.merlinAngle}
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                lead.priority === "Tier A"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedTargetLead(lead)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md transition-all group-hover:scale-105"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Draft & Train AI
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 2 & 3: SCRAPED PLACES / NEWS LEADS ───────────────────────────── */}
        {mode !== "targets" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">
                {mode === "news"
                  ? "Energy Project Discovery — News RSS"
                  : "Industry Site Discovery — Google Places"}
              </h2>

              {mode === "places" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Las Vegas, NV"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Max Results per Vertical
                    </label>
                    <input
                      type="number"
                      value={maxPer}
                      onChange={(e) => setMaxPer(Number(e.target.value))}
                      min={1}
                      max={50}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Verticals
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PLACES_VERTICALS.map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setVerticals((prev) =>
                              prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                            )
                          }
                          className={`text-sm rounded-lg px-3 py-1.5 border transition-colors ${
                            verticals.includes(v)
                              ? "bg-emerald-800 border-emerald-600 text-emerald-200"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {v.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Min Confidence Score (0–100)
                    </label>
                    <input
                      type="number"
                      value={minConf}
                      onChange={(e) => setMinConf(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-xs text-slate-500">
                      Higher = only confident extractions. Recommended: 40–60.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Options
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoQuote}
                        onChange={(e) => setAutoQuote(e.target.checked)}
                        className="accent-emerald-500 w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">
                        Auto-generate StackQuote™ for each prospect
                      </span>
                    </label>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Industries to Scan
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NEWS_INDUSTRIES.map((ind) => (
                        <button
                          key={ind.id}
                          onClick={() =>
                            setIndustries((prev) =>
                              prev.includes(ind.id)
                                ? prev.filter((x) => x !== ind.id)
                                : [...prev, ind.id]
                            )
                          }
                          className={`text-sm rounded-lg px-3 py-1.5 border transition-colors ${
                            industries.includes(ind.id)
                              ? "bg-emerald-800 border-emerald-600 text-emerald-200"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {ind.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={runCampaign}
                  disabled={
                    running || (mode === "places" ? !location.trim() : industries.length === 0)
                  }
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center gap-2"
                >
                  {running ? "Running…" : "⚡ Run Campaign Scraper"}
                </button>
              </div>

              {stats && (
                <div className="flex flex-wrap gap-3 pt-2 text-sm text-slate-400">
                  <span className="text-emerald-400 font-medium">✓ Run complete</span>
                  <span>
                    Discovered: <span className="text-white">{stats.discovered}</span>
                  </span>
                  <span>
                    Quoted: <span className="text-white">{stats.quoted}</span>
                  </span>
                  <span>
                    Skipped: <span className="text-white">{stats.skipped}</span>
                  </span>
                  {stats.errors?.length > 0 && (
                    <span className="text-amber-400">{stats.errors.length} warnings</span>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Results Table */}
            {leads.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white font-bold">
                    Scraped Prospects ({leads.length})
                  </h2>
                  <span className="text-xs text-slate-400">
                    Click <span className="text-emerald-400 font-semibold">Send</span> to deliver
                    StackQuote™ email · <span className="text-blue-400 font-semibold">Preview</span>{" "}
                    to inspect first
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider bg-slate-900/90">
                        <th className="py-3 px-4 font-medium">Company</th>
                        <th className="py-3 px-4 font-medium">Location</th>
                        <th className="py-3 px-4 font-medium">Industry</th>
                        <th className="py-3 px-4 font-medium text-right">Savings/yr</th>
                        <th className="py-3 px-4 font-medium text-right">Payback</th>
                        <th className="py-3 px-4 font-medium text-right">25yr NPV</th>
                        <th className="py-3 px-4 font-medium text-right">BESS</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {leads.map((lead) => (
                        <LeadRow
                          key={lead.id}
                          lead={lead}
                          onEmail={handleEmail}
                          onPreview={handlePreview}
                          emailingId={emailingId}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
