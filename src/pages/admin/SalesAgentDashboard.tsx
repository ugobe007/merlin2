/**
 * Sales Agent Dashboard — /admin/sales-agent
 *
 * Workflow:
 *   1. Discover leads (Google Places → Supabase)
 *   2. Click a lead → slide-out detail panel
 *   3. Review email preview (editable subject + body)
 *   4. Approve & send to sales@ / operations@ / cfo@ or custom list
 *   5. Bulk: select many leads → approve template → send all
 */
import { useState, useEffect, useCallback } from "react";

const API = "https://merlin2.fly.dev";

interface Lead {
  id: string;
  name: string;
  vertical: string;
  status: string;
  address: string;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_reviews: number | null;
  quote_url: string | null;
  email_sent_at: string | null;
  notes: string | null;
  created_at: string;
}

interface EmailPreview {
  subject: string;
  html: string;
  recipients: string[];
}

interface Stats {
  total: number;
  discovered: number;
  quoted: number;
  byVertical: Record<string, number>;
}

const VERTICAL_LABELS: Record<string, string> = {
  car_wash: "🚗 Car Wash",
  ev_charging: "⚡ EV Charging",
  truck_stop: "🚛 Truck Stop",
  hotel: "🏨 Hotel",
};

const STATUS_PILL: Record<string, string> = {
  discovered: "bg-slate-700/80 text-slate-300",
  quoted: "bg-yellow-900/50 text-yellow-300 border border-yellow-700/40",
  emailed: "bg-green-900/50 text-green-300 border border-green-700/40",
};

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );
}

export default function SalesAgentDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterV, setFilterV] = useState("all");
  const [filterS, setFilterS] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const [discLoc, setDiscLoc] = useState("Las Vegas, NV");
  const [discVerts, setDiscVerts] = useState(["car_wash", "ev_charging", "truck_stop"]);
  const [discMax, setDiscMax] = useState(20);
  const [autoQuote, setAutoQuote] = useState(true);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const [emailModal, setEmailModal] = useState<{
    mode: "single" | "bulk";
    leads: Lead[];
    preview: EmailPreview | null;
    customSubject: string;
    customBody: string;
    recipients: string;
    loading: boolean;
  } | null>(null);

  const addLog = (msg: string) =>
    setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 49)]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/sales-agent/leads`);
      const d = await r.json();
      const freshLeads: Lead[] = d.leads || [];
      setLeads(freshLeads);
      setStats(d.stats || null);
      // Sync activeLead if open so the panel reflects latest status
      setActiveLead((prev) => (prev ? (freshLeads.find((l) => l.id === prev.id) ?? prev) : null));
    } catch {
      addLog("❌ Failed to fetch leads");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    if (filterV !== "all" && l.vertical !== filterV) return false;
    if (filterS !== "all" && l.status !== filterS) return false;
    return true;
  });

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  const selectAll = () => setSelected(new Set(filtered.map((l) => l.id)));
  const clearSel = () => setSelected(new Set());

  const quoteLead = async (lead: Lead) => {
    addLog(`⏳ Quoting ${lead.name}…`);
    const r = await fetch(`${API}/api/sales-agent/quote/${lead.id}`, { method: "POST" });
    const d = await r.json();
    if (d.ok) {
      addLog(`✅ Quoted ${lead.name}`);
      await fetchLeads();
    } else addLog(`❌ Quote failed for ${lead.name}: ${String(d.error)}`);
    return d.ok;
  };

  const openEmailReview = async (leadsToEmail: Lead[]) => {
    const ref = leadsToEmail[0];
    const domain = ref.website ? domainFromUrl(ref.website) : null;
    const defaultRecipients = domain
      ? [`sales@${domain}`, `operations@${domain}`, `cfo@${domain}`]
      : [];
    setEmailModal({
      mode: leadsToEmail.length === 1 ? "single" : "bulk",
      leads: leadsToEmail,
      preview: null,
      customSubject: "",
      customBody: "",
      recipients: defaultRecipients.join(", "),
      loading: true,
    });
    if (ref.quote_url) {
      try {
        const r = await fetch(`${API}/api/sales-agent/email/${ref.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewOnly: true, recipients: defaultRecipients }),
        });
        const d = await r.json();
        setEmailModal((m) => (m ? { ...m, preview: d, loading: false } : null));
      } catch {
        setEmailModal((m) => (m ? { ...m, loading: false } : null));
      }
    } else {
      setEmailModal((m) => (m ? { ...m, loading: false } : null));
    }
  };

  const refreshPreview = async () => {
    if (!emailModal) return;
    const ref = emailModal.leads[0];
    if (!ref.quote_url) return;
    setEmailModal((m) => (m ? { ...m, loading: true } : null));
    try {
      const r = await fetch(`${API}/api/sales-agent/email/${ref.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewOnly: true,
          customSubject: emailModal.customSubject || undefined,
          customBody: emailModal.customBody || undefined,
          recipients: emailModal.recipients
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const d = await r.json();
      setEmailModal((m) => (m ? { ...m, preview: d, loading: false } : null));
    } catch {
      setEmailModal((m) => (m ? { ...m, loading: false } : null));
    }
  };

  const sendApproved = async () => {
    if (!emailModal) return;
    setRunning(true);
    const recipients = emailModal.recipients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const lead of emailModal.leads) {
      if (!lead.quote_url) {
        const ok = await quoteLead(lead);
        if (!ok) {
          addLog(`⏭ Skipped ${lead.name} (quote failed)`);
          continue;
        }
        await fetchLeads();
      }
      try {
        const r = await fetch(`${API}/api/sales-agent/email/${lead.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients,
            customSubject: emailModal.customSubject || undefined,
            customBody: emailModal.customBody || undefined,
          }),
        });
        const d = await r.json();
        if (d.ok) {
          addLog(`📧 Sent → ${lead.name} (${recipients.join(", ")})`);
          // Optimistically update local state so the UI reflects it immediately
          const sentAt = new Date().toISOString();
          const patch = (l: Lead) =>
            l.id === lead.id ? { ...l, email_sent_at: sentAt, status: "emailed" as const } : l;
          setLeads((prev) => prev.map(patch));
          setActiveLead((prev) => (prev?.id === lead.id ? patch(prev) : prev));
        } else {
          addLog(`❌ Failed → ${lead.name}: ${d.error ?? "unknown error"}`);
        }
      } catch {
        addLog(`❌ Error sending to ${lead.name}`);
      }
      await new Promise((res) => setTimeout(res, 400));
    }
    setEmailModal(null);
    setRunning(false);
    clearSel();
    await fetchLeads();
  };

  const runDiscovery = async () => {
    setRunning(true);
    addLog(`🔍 Discovering in ${discLoc}…`);
    try {
      const r = await fetch(`${API}/api/sales-agent/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: discLoc,
          verticals: discVerts,
          autoQuote,
          autoEmail: false,
          maxPerVertical: discMax,
        }),
      });
      const d = await r.json();
      addLog(
        `✅ Discovered: ${d.discovered} · Quoted: ${d.quoted}${d.errors?.length ? ` · ${d.errors.length} errors` : ""}`
      );
      void fetchLeads();
    } catch {
      addLog("❌ Discovery failed");
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#060D1F] text-white font-sans flex flex-col">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold">Sales Agent</h1>
          <p className="text-xs text-slate-400 mt-0.5">Discover · Quote · Review · Send</p>
        </div>
        <button
          onClick={() => void fetchLeads()}
          className="text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: "Total", value: stats.total },
                { label: "Discovered", value: stats.discovered },
                { label: "Quoted", value: stats.quoted },
                ...Object.entries(stats.byVertical).map(([k, v]) => ({
                  label: VERTICAL_LABELS[k] ?? k,
                  value: v,
                })),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/8 rounded-xl p-3 text-center"
                >
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Run New Discovery
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Location</label>
                <input
                  value={discLoc}
                  onChange={(e) => setDiscLoc(e.target.value)}
                  className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-48 focus:outline-none focus:border-yellow-500/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Max / vertical</label>
                <input
                  type="number"
                  value={discMax}
                  onChange={(e) => setDiscMax(Number(e.target.value))}
                  className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white w-20 focus:outline-none focus:border-yellow-500/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Verticals</label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(VERTICAL_LABELS).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() =>
                        setDiscVerts((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]))
                      }
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${discVerts.includes(k) ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300" : "bg-white/5 border-white/10 text-slate-400"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Auto-quote</label>
                <button
                  onClick={() => setAutoQuote((v) => !v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${autoQuote ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-white/5 border-white/10 text-slate-400"}`}
                >
                  {autoQuote ? "✓ ON" : "OFF"}
                </button>
              </div>
              <button
                onClick={() => void runDiscovery()}
                disabled={running || discVerts.length === 0}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-semibold text-sm px-5 py-1.5 rounded-lg transition-colors self-end"
              >
                {running ? "Running…" : "▶ Run"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <select
                value={filterV}
                onChange={(e) => setFilterV(e.target.value)}
                className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="all">All verticals</option>
                {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={filterS}
                onChange={(e) => setFilterS(e.target.value)}
                className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="discovered">Discovered</option>
                <option value="quoted">Quoted</option>
                <option value="emailed">Emailed</option>
              </select>
              <span className="text-xs text-slate-500">{filtered.length} leads</span>
            </div>
            <div className="flex gap-2 items-center">
              {selected.size === 0 ? (
                <button
                  onClick={selectAll}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Select all {filtered.length}
                </button>
              ) : (
                <>
                  <span className="text-xs text-yellow-400">{selected.size} selected</span>
                  <button
                    onClick={() => void openEmailReview(leads.filter((l) => selected.has(l.id)))}
                    disabled={running}
                    className="text-xs bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-3 py-1.5 rounded-lg hover:bg-yellow-500/30 disabled:opacity-40 transition-colors"
                  >
                    ✉ Review & Send ({selected.size})
                  </button>
                  <button
                    onClick={clearSel}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No leads. Run a discovery above.
              </div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-white/5">
                  {filtered.map((lead) => (
                    <div
                      key={lead.id}
                      className={`px-4 py-3 transition-colors ${selected.has(lead.id) ? "bg-yellow-500/5" : ""} ${activeLead?.id === lead.id ? "bg-sky-500/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="accent-yellow-500 mt-1 shrink-0"
                          checked={selected.has(lead.id)}
                          onChange={() => toggle(lead.id)}
                        />
                        <div className="flex-1 min-w-0" onClick={() => setActiveLead(lead)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm">{lead.name}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[lead.status] ?? STATUS_PILL.discovered}`}
                            >
                              {lead.status}
                              {lead.email_sent_at ? " ✓" : ""}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {lead.address}
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-slate-400">
                            <span>{VERTICAL_LABELS[lead.vertical] ?? lead.vertical}</span>
                            {lead.google_rating && <span>⭐ {lead.google_rating}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2.5 ml-7">
                        {!lead.quote_url && (
                          <button
                            onClick={() => void quoteLead(lead)}
                            disabled={running}
                            className="text-xs bg-slate-700/80 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-600 disabled:opacity-40 transition-colors"
                          >
                            📊 Quote
                          </button>
                        )}
                        {lead.quote_url && (
                          <a
                            href={lead.quote_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-lg"
                          >
                            View Quote →
                          </a>
                        )}
                        {!lead.email_sent_at && (
                          <button
                            onClick={() => void openEmailReview([lead])}
                            disabled={running}
                            className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-lg hover:bg-yellow-500/25 disabled:opacity-40 transition-colors"
                          >
                            ✉ Review
                          </button>
                        )}
                        {lead.email_sent_at && (
                          <span className="text-xs text-green-400">
                            ✓ Sent {new Date(lead.email_sent_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          className="accent-yellow-500"
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={() =>
                            selected.size === filtered.length ? clearSel() : selectAll()
                          }
                        />
                      </th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Business</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Vertical</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Rating</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Quote</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-white/4 transition-colors cursor-pointer ${selected.has(lead.id) ? "bg-yellow-500/5" : ""} ${activeLead?.id === lead.id ? "bg-sky-500/5" : ""}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-yellow-500"
                            checked={selected.has(lead.id)}
                            onChange={() => toggle(lead.id)}
                          />
                        </td>
                        <td className="px-4 py-3" onClick={() => setActiveLead(lead)}>
                          <div className="font-medium text-white hover:text-yellow-300 transition-colors">
                            {lead.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {lead.address}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-slate-400 text-xs"
                          onClick={() => setActiveLead(lead)}
                        >
                          {VERTICAL_LABELS[lead.vertical] ?? lead.vertical}
                        </td>
                        <td className="px-4 py-3" onClick={() => setActiveLead(lead)}>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[lead.status] ?? STATUS_PILL.discovered}`}
                          >
                            {lead.status}
                            {lead.email_sent_at ? " ✓" : ""}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-slate-400 text-xs"
                          onClick={() => setActiveLead(lead)}
                        >
                          {lead.google_rating ? `⭐ ${lead.google_rating}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {lead.quote_url ? (
                            <a
                              href={lead.quote_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-400 hover:text-yellow-300 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
                            </a>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {!lead.quote_url && (
                              <button
                                onClick={() => void quoteLead(lead)}
                                disabled={running}
                                className="text-xs bg-slate-700/80 border border-white/10 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 disabled:opacity-40 transition-colors"
                              >
                                Quote
                              </button>
                            )}
                            {!lead.email_sent_at && (
                              <button
                                onClick={() => void openEmailReview([lead])}
                                disabled={running}
                                className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 px-2 py-1 rounded hover:bg-yellow-500/25 disabled:opacity-40 transition-colors"
                              >
                                ✉ Review
                              </button>
                            )}
                            {lead.email_sent_at && (
                              <span className="text-xs text-slate-600">
                                Sent {new Date(lead.email_sent_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {log.length > 0 && (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Activity
                </span>
                <button
                  onClick={() => setLog([])}
                  className="text-xs text-slate-600 hover:text-slate-400"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-0.5 max-h-36 overflow-y-auto font-mono">
                {log.map((e, i) => (
                  <div key={i} className="text-xs text-slate-400">
                    {e}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeLead && (
          <div className="fixed inset-x-0 bottom-0 z-40 md:static md:inset-auto md:w-80 md:border-l border-white/10 bg-[#0a1020] md:bg-black/30 flex flex-col shrink-0 overflow-y-auto max-h-[70vh] md:max-h-none rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none border-t md:border-t-0">
            <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-white text-sm leading-tight">
                  {activeLead.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {VERTICAL_LABELS[activeLead.vertical]}
                </p>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="text-slate-500 hover:text-white text-lg leading-none mt-0.5"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm">
              <DetailRow label="Status">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_PILL[activeLead.status] ?? STATUS_PILL.discovered}`}
                >
                  {activeLead.status}
                </span>
              </DetailRow>
              {activeLead.address && (
                <DetailRow label="Address">
                  <span className="text-slate-300">{activeLead.address}</span>
                </DetailRow>
              )}
              {activeLead.phone && (
                <DetailRow label="Phone">
                  <span className="text-slate-300">{activeLead.phone}</span>
                </DetailRow>
              )}
              {activeLead.website && (
                <DetailRow label="Website">
                  <a
                    href={activeLead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 truncate block text-xs"
                  >
                    {domainFromUrl(activeLead.website) ?? activeLead.website}
                  </a>
                </DetailRow>
              )}
              {activeLead.google_rating != null && (
                <DetailRow label="Rating">
                  <span className="text-slate-300">
                    ⭐ {activeLead.google_rating} ({activeLead.google_reviews?.toLocaleString()}{" "}
                    reviews)
                  </span>
                </DetailRow>
              )}
              {activeLead.email_sent_at && (
                <DetailRow label="Emailed">
                  <span className="text-green-400 text-xs">
                    {new Date(activeLead.email_sent_at).toLocaleString()}
                  </span>
                </DetailRow>
              )}
              {activeLead.notes && (
                <DetailRow label="Notes">
                  <span className="text-slate-400 text-xs">{activeLead.notes}</span>
                </DetailRow>
              )}
              {activeLead.website &&
                (() => {
                  const domain = domainFromUrl(activeLead.website);
                  return domain ? (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                        Will send to
                      </p>
                      <div className="space-y-1">
                        {[`sales@${domain}`, `operations@${domain}`, `cfo@${domain}`].map((r) => (
                          <div
                            key={r}
                            className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300 font-mono"
                          >
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              <div className="pt-2 space-y-2">
                {!activeLead.quote_url && (
                  <button
                    onClick={() => void quoteLead(activeLead)}
                    disabled={running}
                    className="w-full text-sm bg-slate-700 hover:bg-slate-600 border border-white/10 text-white py-2 rounded-lg disabled:opacity-40 transition-colors"
                  >
                    📊 Generate Quote
                  </button>
                )}
                {activeLead.quote_url && (
                  <a
                    href={activeLead.quote_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-sm text-center bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 py-2 rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    View Quote →
                  </a>
                )}
                {!activeLead.email_sent_at && (
                  <button
                    onClick={() => void openEmailReview([activeLead])}
                    disabled={running}
                    className="w-full text-sm bg-green-500/20 border border-green-500/40 text-green-300 py-2 rounded-lg hover:bg-green-500/30 disabled:opacity-40 transition-colors"
                  >
                    ✉ Review & Send Email
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {emailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1628] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-white">
                  {emailModal.mode === "single"
                    ? `Review Email — ${emailModal.leads[0].name}`
                    : `Review Email — ${emailModal.leads.length} leads (bulk)`}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Edit the template, then approve to send
                </p>
              </div>
              <button
                onClick={() => setEmailModal(null)}
                className="text-slate-500 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <div className="md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0 overflow-y-auto p-4 md:p-5 space-y-4">
                {emailModal.mode === "bulk" && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Sending to {emailModal.leads.length} leads
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {emailModal.leads.map((l) => (
                        <div
                          key={l.id}
                          className="text-xs text-slate-300 bg-white/5 rounded px-2 py-1 flex items-center gap-2"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${l.quote_url ? "bg-yellow-400" : "bg-slate-600"}`}
                          />
                          {l.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">
                    Recipients
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Comma-separated — roles derived per lead domain
                  </p>
                  <textarea
                    value={emailModal.recipients}
                    onChange={(e) =>
                      setEmailModal((m) => (m ? { ...m, recipients: e.target.value } : null))
                    }
                    rows={3}
                    placeholder="sales@company.com, operations@company.com, cfo@company.com"
                    className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-xs text-white font-mono resize-none focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">
                    Subject line
                  </label>
                  <input
                    value={emailModal.customSubject}
                    onChange={(e) =>
                      setEmailModal((m) => (m ? { ...m, customSubject: e.target.value } : null))
                    }
                    placeholder={emailModal.preview?.subject ?? "Using vertical default…"}
                    className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">
                    Opening message
                  </label>
                  <textarea
                    value={emailModal.customBody}
                    onChange={(e) =>
                      setEmailModal((m) => (m ? { ...m, customBody: e.target.value } : null))
                    }
                    rows={5}
                    placeholder="Using vertical default hook…"
                    className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <button
                  onClick={() => void refreshPreview()}
                  className="text-xs text-slate-400 border border-white/10 rounded-lg px-3 py-2 hover:text-white hover:border-white/20 transition-colors"
                >
                  ↺ Refresh Preview
                </button>
                <button
                  onClick={() => void sendApproved()}
                  disabled={running || emailModal.loading}
                  className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {running
                    ? "Sending…"
                    : `✅ Approve & Send${emailModal.mode === "bulk" ? ` (${emailModal.leads.length})` : ""}`}
                </button>
              </div>
              <div className="hidden md:flex flex-1 overflow-hidden flex-col">
                <div className="px-4 py-3 border-b border-white/10 shrink-0">
                  <p className="text-xs text-slate-500">Email preview</p>
                  {emailModal.preview?.subject && (
                    <p className="text-sm text-white font-medium mt-0.5">
                      Subject: {emailModal.customSubject || emailModal.preview.subject}
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-auto bg-white rounded-b-2xl">
                  {emailModal.loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Loading preview…
                    </div>
                  ) : emailModal.preview?.html ? (
                    <iframe
                      srcDoc={emailModal.preview.html}
                      className="w-full h-full border-0"
                      title="Email preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm p-8 text-center">
                      {emailModal.leads[0].quote_url
                        ? "Preview unavailable"
                        : "Generate a quote first to preview the email"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
