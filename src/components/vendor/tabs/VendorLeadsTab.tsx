import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  ExternalLink,
  CheckCircle,
  Archive,
  Loader2,
  RefreshCw,
  Phone,
  ChevronDown,
  ChevronUp,
  Zap,
  Sun,
  Cpu,
  TrendingUp,
} from "lucide-react";
// Use the base (un-schema-typed) client so new tables (vendor_leads,
// vendor_lead_events) work before the next `supabase gen types` run.
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorLeadRow {
  id: string;
  opportunity_id: string;
  vendor_id: string;
  bess_score: number;
  solar_score: number;
  generator_score: number;
  overall_score: number;
  lead_category: "bess" | "solar" | "generator" | "multi";
  signals: string[];
  industry: string | null;
  company_name: string | null;
  source_url: string | null;
  description: string | null;
  status: "new" | "sent" | "viewed" | "contacted" | "won" | "lost" | "archived";
  notified_at: string | null;
  viewed_at: string | null;
  contacted_at: string | null;
  vendor_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { id: VendorLeadRow["status"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "sent", label: "Sent" },
  { id: "viewed", label: "Viewed" },
  { id: "contacted", label: "Contacted" },
  { id: "won", label: "Won" },
  { id: "archived", label: "Archived" },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bess: <Zap className="w-3.5 h-3.5" />,
  solar: <Sun className="w-3.5 h-3.5" />,
  generator: <Cpu className="w-3.5 h-3.5" />,
  multi: <TrendingUp className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  bess: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  solar: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  generator: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  multi: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sent: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  viewed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  contacted: "bg-emerald-500/10 text-[#3ECF8E] border-emerald-500/20",
  won: "bg-green-500/15 text-green-300 border-green-500/25",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
  archived: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

// Format a raw signal key like "bess_procurement" → "BESS Procurement"
function formatSignal(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Score color: ≥80 green, ≥60 amber, else slate
function scoreColor(n: number): string {
  if (n >= 80) return "text-[#3ECF8E]";
  if (n >= 60) return "text-amber-400";
  return "text-slate-400";
}

function scoreBg(n: number): string {
  if (n >= 80) return "bg-[#3ECF8E]";
  if (n >= 60) return "bg-amber-400";
  return "bg-slate-500";
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: VendorLeadRow;
  onStatusChange: (id: string, status: VendorLeadRow["status"], notes?: string) => Promise<void>;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(lead.vendor_notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleMarkContacted = async () => {
    setSaving(true);
    await onStatusChange(lead.id, "contacted", notes || undefined);
    setSaving(false);
  };

  const handleArchive = async () => {
    setSaving(true);
    await onStatusChange(lead.id, "archived");
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    await onStatusChange(lead.id, lead.status, notes);
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)] overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          {/* Category badge */}
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[lead.lead_category] ?? ""}`}
          >
            {CATEGORY_ICONS[lead.lead_category]}
            {lead.lead_category.toUpperCase()}
          </span>

          {/* Status badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[lead.status] ?? ""}`}
          >
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>

          {/* Date */}
          <span className="text-xs text-slate-600">
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Overall score */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={`text-2xl font-black ${scoreColor(lead.overall_score)}`}>
              {lead.overall_score}
            </span>
            <span className="text-slate-600 text-xs">/100</span>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="p-5">
        {/* Company + industry */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {lead.company_name ?? "Unknown Company"}
            </h3>
            {lead.industry && (
              <p className="text-sm text-slate-400 mt-0.5">
                {lead.industry
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </p>
            )}
          </div>
          {lead.source_url && (
            <a
              href={lead.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Source
            </a>
          )}
        </div>

        {/* Description */}
        {lead.description && (
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4">
            {lead.description}
          </p>
        )}

        {/* Score bars */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "BESS", score: lead.bess_score },
            { label: "Solar", score: lead.solar_score },
            { label: "Generator", score: lead.generator_score },
          ].map(({ label, score }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className={`font-semibold ${scoreColor(score)}`}>{score}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreBg(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Signals */}
        {lead.signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {lead.signals.slice(0, 6).map((sig) => (
              <span
                key={sig}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]"
              >
                {formatSignal(sig)}
              </span>
            ))}
            {lead.signals.length > 6 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] text-slate-600">
                +{lead.signals.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {lead.status !== "archived" && (
          <div className="flex gap-2">
            {lead.status !== "contacted" && lead.status !== "won" && (
              <button
                onClick={handleMarkContacted}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/20 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Phone className="w-3.5 h-3.5" />
                )}
                Mark Contacted
              </button>
            )}
            {lead.status === "contacted" && (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold opacity-75 cursor-default"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Contacted
              </button>
            )}
            <button
              onClick={handleArchive}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-300 border border-white/[0.06] text-sm font-semibold transition-all disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded: notes + score detail ── */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/[0.04] pt-4 space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={3}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#3ECF8E]/50 resize-none"
          />
          <button
            onClick={handleSaveNotes}
            disabled={saving || notes === (lead.vendor_notes ?? "")}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] text-sm font-semibold transition-all disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Notes"}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const VendorLeadsTab: React.FC = () => {
  const [leads, setLeads] = useState<VendorLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VendorLeadRow["status"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "bess" | "solar" | "generator" | "multi"
  >("all");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("vendor_leads")
      .select("*")
      .order("overall_score", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setLeads((data as VendorLeadRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  // Mark a lead as viewed when first loaded (status = new → viewed)
  useEffect(() => {
    const newLeads = leads.filter((l) => l.status === "new");
    if (newLeads.length === 0) return;
    void Promise.all(
      newLeads.map((l) =>
        supabase
          .from("vendor_leads")
          .update({ status: "viewed", viewed_at: new Date().toISOString() })
          .eq("id", l.id)
      )
    ).then(() => {
      setLeads((prev) =>
        prev.map((l) =>
          l.status === "new" ? { ...l, status: "viewed", viewed_at: new Date().toISOString() } : l
        )
      );
    });
  }, [leads.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (
    id: string,
    status: VendorLeadRow["status"],
    notes?: string
  ) => {
    const patch: Record<string, string> = { status };
    if (status === "contacted") patch.contacted_at = new Date().toISOString();
    if (notes !== undefined) patch.vendor_notes = notes;
    const { error: err } = await supabase.from("vendor_leads").update(patch).eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    }
  };

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (categoryFilter !== "all" && l.lead_category !== categoryFilter) return false;
    return true;
  });

  // Count per status for badges
  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Matched Leads</h2>
          <p className="text-slate-400 mt-1">Procurement opportunities matched to your specialty</p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.06] text-sm font-semibold transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === "all" ? leads.length : (counts[tab.id] ?? 0);
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                statusFilter === tab.id
                  ? "border-[#3ECF8E]/40 text-[#3ECF8E] bg-[#3ECF8E]/10"
                  : "border-white/[0.06] text-slate-400 hover:text-white hover:border-white/[0.12] bg-white/[0.03]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id
                      ? "bg-[#3ECF8E]/20 text-[#3ECF8E]"
                      : "bg-white/[0.08] text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Category filter */}
        <div className="ml-auto flex gap-2">
          {(["all", "bess", "solar", "generator"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                categoryFilter === cat
                  ? "border-white/20 text-white bg-white/[0.08]"
                  : "border-white/[0.06] text-slate-500 hover:text-slate-300 bg-white/[0.02]"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl p-12 text-center border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
          <Loader2 className="w-10 h-10 mx-auto mb-3 text-slate-600 animate-spin" />
          <p className="text-slate-400">Loading your matched leads…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl p-12 text-center border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <h3 className="text-xl font-bold text-white mb-2">No Leads Yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            {leads.length === 0
              ? "The lead-matching engine runs nightly. Check back tomorrow — or ask your admin to run it manually."
              : "No leads match the selected filters."}
          </p>
        </div>
      )}

      {/* Lead cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorLeadsTab;
