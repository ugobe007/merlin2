/**
 * Sales Agent Dashboard — /admin/sales-agent
 * View all discovered leads, run new discovery, send emails per-lead or in bulk.
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
  created_at: string;
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

const STATUS_COLORS: Record<string, string> = {
  discovered: "bg-slate-700 text-slate-300",
  quoted: "bg-yellow-900/50 text-yellow-400",
  emailed: "bg-green-900/50 text-green-400",
};

export default function SalesAgentDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterVertical, setFilterVertical] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  // Discovery form state
  const [discoverLocation, setDiscoverLocation] = useState("Las Vegas, NV");
  const [discoverVerticals, setDiscoverVerticals] = useState<string[]>([
    "car_wash",
    "ev_charging",
    "truck_stop",
  ]);
  const [discoverMax, setDiscoverMax] = useState(20);
  const [autoQuote, setAutoQuote] = useState(true);

  const log = (msg: string) =>
    setActionLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 49)]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/sales-agent/leads`);
      const d = await r.json();
      setLeads(d.leads || []);
      setStats(d.stats || null);
    } catch (_e) {
      log("❌ Failed to fetch leads");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    if (filterVertical !== "all" && l.vertical !== filterVertical) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((l) => l.id)));
  const clearSelect = () => setSelected(new Set());

  // Send email to a single lead
  const emailLead = async (lead: Lead) => {
    if (!lead.quote_url) {
      log(`⚠️ ${lead.name} has no quote — quoting first…`);
      const qr = await fetch(`${API}/api/sales-agent/quote/${lead.id}`, { method: "POST" });
      if (!qr.ok) {
        log(`❌ Quote failed for ${lead.name}`);
        return;
      }
      log(`✅ Quoted ${lead.name}`);
    }
    const er = await fetch(`${API}/api/sales-agent/email/${lead.id}`, { method: "POST" });
    const ed = await er.json();
    if (ed.ok) log(`📧 Email sent → ${lead.name}`);
    else log(`❌ Email failed for ${lead.name}: ${ed.error}`);
    fetchLeads();
  };

  // Quote a single lead
  const quoteLead = async (lead: Lead) => {
    log(`⏳ Quoting ${lead.name}…`);
    const r = await fetch(`${API}/api/sales-agent/quote/${lead.id}`, { method: "POST" });
    const d = await r.json();
    if (d.ok) log(`✅ Quoted ${lead.name} → ${d.quoteUrl}`);
    else log(`❌ Quote failed: ${d.error}`);
    fetchLeads();
  };

  // Bulk email selected leads
  const bulkEmail = async () => {
    setRunning(true);
    const toEmail = leads.filter((l) => selected.has(l.id));
    log(`📤 Sending ${toEmail.length} emails…`);
    for (const lead of toEmail) {
      await emailLead(lead);
      await new Promise((r) => setTimeout(r, 500)); // rate limit
    }
    log(`✅ Bulk email done`);
    setRunning(false);
    clearSelect();
  };

  // Bulk quote selected leads
  const bulkQuote = async () => {
    setRunning(true);
    const toQuote = leads.filter((l) => selected.has(l.id) && !l.quote_url);
    log(`📊 Quoting ${toQuote.length} leads…`);
    for (const lead of toQuote) {
      await quoteLead(lead);
    }
    setRunning(false);
  };

  // Run discovery
  const runDiscovery = async () => {
    setRunning(true);
    log(`🔍 Discovering ${discoverVerticals.join(", ")} in ${discoverLocation}…`);
    try {
      const r = await fetch(`${API}/api/sales-agent/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: discoverLocation,
          verticals: discoverVerticals,
          autoQuote,
          autoEmail: false,
          maxPerVertical: discoverMax,
        }),
      });
      const d = await r.json();
      log(
        `✅ Discovered: ${d.discovered} | Quoted: ${d.quoted} | Errors: ${d.errors?.length || 0}`
      );
      if (d.errors?.length) d.errors.slice(0, 5).forEach((e: string) => log(`⚠️ ${e}`));
      fetchLeads();
    } catch (_e) {
      log(`❌ Discovery failed`);
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#060D1F] text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales Agent Dashboard</h1>
          <p className="text-sm text-slate-400">Prospect discovery · Auto-quote · Outreach</p>
        </div>
        <button
          onClick={fetchLeads}
          className="text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Leads", value: stats.total },
              { label: "Discovered", value: stats.discovered },
              { label: "Quoted", value: stats.quoted },
              ...Object.entries(stats.byVertical).map(([k, v]) => ({
                label: VERTICAL_LABELS[k] || k,
                value: v,
              })),
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Discovery panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Run New Discovery
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Location</label>
              <input
                value={discoverLocation}
                onChange={(e) => setDiscoverLocation(e.target.value)}
                className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white w-52 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Max per vertical</label>
              <input
                type="number"
                value={discoverMax}
                onChange={(e) => setDiscoverMax(Number(e.target.value))}
                className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white w-24 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Verticals</label>
              <div className="flex gap-2">
                {Object.entries(VERTICAL_LABELS).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() =>
                      setDiscoverVerticals((v) =>
                        v.includes(k) ? v.filter((x) => x !== k) : [...v, k]
                      )
                    }
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      discoverVerticals.includes(k)
                        ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Auto-quote</label>
              <button
                onClick={() => setAutoQuote((v) => !v)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  autoQuote
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                {autoQuote ? "ON" : "OFF"}
              </button>
            </div>
            <button
              onClick={runDiscovery}
              disabled={running || discoverVerticals.length === 0}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {running ? "Running…" : "▶ Run Discovery"}
            </button>
          </div>
        </div>

        {/* Filters + bulk actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <select
              value={filterVertical}
              onChange={(e) => setFilterVertical(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="discovered">Discovered</option>
              <option value="quoted">Quoted</option>
              <option value="emailed">Emailed</option>
            </select>
            <span className="text-sm text-slate-400 self-center">{filtered.length} leads</span>
          </div>

          {selected.size > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-yellow-400">{selected.size} selected</span>
              <button
                onClick={bulkQuote}
                disabled={running}
                className="text-sm bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-3 py-1.5 rounded-lg hover:bg-yellow-500/30 disabled:opacity-40 transition-colors"
              >
                📊 Quote selected
              </button>
              <button
                onClick={bulkEmail}
                disabled={running}
                className="text-sm bg-green-500/20 border border-green-500/40 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 disabled:opacity-40 transition-colors"
              >
                📧 Email selected
              </button>
              <button onClick={clearSelect} className="text-sm text-slate-500 hover:text-slate-300">
                ✕ Clear
              </button>
            </div>
          )}

          {selected.size === 0 && (
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Select all {filtered.length}
              </button>
            </div>
          )}
        </div>

        {/* Leads table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading leads…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No leads found. Run a discovery above.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={() =>
                        selected.size === filtered.length ? clearSelect() : selectAll()
                      }
                      className="accent-yellow-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Business</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Vertical</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Rating</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Website</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Quote</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-white/5 transition-colors ${selected.has(lead.id) ? "bg-yellow-500/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="accent-yellow-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{lead.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                        {lead.address}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {VERTICAL_LABELS[lead.vertical] || lead.vertical}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || "bg-slate-700 text-slate-300"}`}
                      >
                        {lead.status}
                        {lead.email_sent_at && " ✓"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {lead.google_rating ? (
                        <span>
                          ⭐ {lead.google_rating}{" "}
                          <span className="text-slate-500">({lead.google_reviews})</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300 text-xs truncate block max-w-[140px]"
                        >
                          {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.quote_url ? (
                        <a
                          href={lead.quote_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:text-yellow-300 text-xs"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {!lead.quote_url && (
                          <button
                            onClick={() => quoteLead(lead)}
                            disabled={running}
                            title="Generate quote"
                            className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500/25 disabled:opacity-40 transition-colors"
                          >
                            Quote
                          </button>
                        )}
                        {!lead.email_sent_at && (
                          <button
                            onClick={() => emailLead(lead)}
                            disabled={running}
                            title="Send intro email"
                            className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-1 rounded hover:bg-green-500/25 disabled:opacity-40 transition-colors"
                          >
                            Email
                          </button>
                        )}
                        {lead.email_sent_at && (
                          <span className="text-xs text-slate-500">
                            Sent {new Date(lead.email_sent_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Action log */}
        {actionLog.length > 0 && (
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Activity Log
              </h3>
              <button
                onClick={() => setActionLog([])}
                className="text-xs text-slate-600 hover:text-slate-400"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto font-mono">
              {actionLog.map((entry, i) => (
                <div key={i} className="text-xs text-slate-400">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
