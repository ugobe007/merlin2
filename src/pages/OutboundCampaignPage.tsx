/**
 * Outbound Campaign Page — /campaign
 * ====================================
 * Two discovery modes:
 *   A) Industry Sites — POST /api/sales-agent/discover  (Google Places)
 *   B) Energy Projects — POST /api/sales-agent/news-projects  (RSS scraper)
 *
 * Results table: name, location, industry, quote highlights, status,
 *               Send Email / Preview buttons, quote link.
 */
import { useState, useEffect, useCallback } from 'react';

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
  status: 'discovered' | 'quoted' | 'emailed';
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
const PLACES_VERTICALS = ['car_wash', 'ev_charging', 'truck_stop', 'hotel'];
const NEWS_INDUSTRIES = [
  { id: 'manufacturing',  label: 'Manufacturing' },
  { id: 'data_center',    label: 'Data Center' },
  { id: 'logistics',      label: 'Warehouse / Logistics' },
  { id: 'hotel',          label: 'Hotel / Hospitality' },
  { id: 'healthcare',     label: 'Healthcare' },
  { id: 'car_wash',       label: 'Car Wash' },
  { id: 'ev_charging',    label: 'EV Charging' },
  { id: 'energy_project', label: 'Energy Project (BESS/Solar)' },
  { id: 'casino',         label: 'Casino / Resort' },
  { id: 'airport',        label: 'Airport' },
];

const STATUS_COLORS: Record<string, string> = {
  discovered: 'bg-slate-700 text-slate-200',
  quoted:     'bg-blue-900 text-blue-200',
  emailed:    'bg-emerald-900 text-emerald-300',
};

function fmt$k(n?: number) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtKW(n?: number) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)} MW`;
  return `${n} kW`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold text-emerald-400">{value}</span>
    </div>
  );
}

function LeadRow({ lead, onEmail, onPreview, emailingId }: {
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
          <a href={lead.articleUrl} target="_blank" rel="noreferrer"
             className="text-xs text-slate-400 hover:text-emerald-400 line-clamp-1 transition-colors">
            ↗ {lead.articleTitle}
          </a>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-slate-300">{lead.location || lead.address || '—'}</td>
      <td className="py-3 px-4">
        <span className="text-xs bg-slate-700 text-slate-300 rounded px-2 py-1">
          {lead.industry?.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-right text-emerald-400">{fmt$k(h.annualSavings)}</td>
      <td className="py-3 px-4 text-sm text-right text-slate-300">{h.payback ? `${h.payback.toFixed(1)} yr` : '—'}</td>
      <td className="py-3 px-4 text-sm text-right text-slate-300">{fmt$k(h.npv25)}</td>
      <td className="py-3 px-4 text-sm text-right text-slate-400">{fmtKW(h.bessKW)}</td>
      <td className="py-3 px-4">
        <span className={`text-xs rounded px-2 py-1 font-medium ${STATUS_COLORS[lead.status] || ''}`}>
          {lead.status}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          {lead.quoteUrl && (
            <a href={lead.quoteUrl} target="_blank" rel="noreferrer"
               className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors">
              Quote
            </a>
          )}
          <button
            onClick={() => onPreview(lead.id)}
            className="text-xs text-slate-400 hover:text-white border border-slate-600 rounded px-2 py-1 transition-colors"
          >
            Preview
          </button>
          {lead.status !== 'emailed' && (
            <button
              onClick={() => onEmail(lead.id)}
              disabled={emailingId === lead.id}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded px-2 py-1 transition-colors"
              title={lead.website
                ? `Targets: ${(lead.resolvedEmails || ['sales@', 'info@', 'facilities@', 'operations@']).slice(0, 4).join(', ')}`
                : 'No domain — add website to resolve email targets'}
            >
              {emailingId === lead.id ? 'Sending…' : 'Send'}
            </button>
          )}
          {lead.status === 'emailed' && (
            <span
              className="text-xs text-emerald-500"
              title={lead.emailedTo?.join(', ')}
            >
              ✓ Sent{lead.emailedTo?.length ? ` (${lead.emailedTo.length})` : ''}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Email Preview Modal ──────────────────────────────────────────────────────
function EmailPreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
          <span className="font-semibold text-slate-700 text-sm">Email Preview</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-auto">
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutboundCampaignPage() {
  const [mode, setMode] = useState<'places' | 'news'>('news');

  // Places form
  const [location, setLocation]     = useState('Las Vegas, NV');
  const [verticals, setVerticals]   = useState<string[]>(['car_wash', 'ev_charging']);
  const [maxPer, setMaxPer]         = useState(15);

  // News form
  const [industries, setIndustries] = useState<string[]>(['manufacturing', 'data_center', 'logistics', 'hotel', 'energy_project']);
  const [minConf, setMinConf]       = useState(40);
  const [autoQuote, setAutoQuote]   = useState(true);

  // Shared state
  const [running, setRunning]       = useState(false);
  const [leads, setLeads]           = useState<CampaignLead[]>([]);
  const [stats, setStats]           = useState<Omit<DiscoverResult, 'leads'> | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // Email state
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Load existing leads on mount
  useEffect(() => {
    fetch('/api/sales-agent/leads?limit=100')
      .then(r => r.json())
      .then(data => {
        if (!data.leads) return;
        // Eagerly resolve email targets for leads that have a website
        setLeads(data.leads);
        for (const lead of data.leads) {
          if (lead.website && !lead.resolvedEmails) {
            fetch(`/api/sales-agent/email-targets/${lead.id}`)
              .then(r => r.json())
              .then(t => {
                if (t.resolved) {
                  setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, resolvedEmails: t.resolved } : l));
                }
              })
              .catch(() => {});
          }
        }
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

      if (mode === 'places') {
        url = '/api/sales-agent/discover';
        body = { location, verticals, autoQuote, autoEmail: false, maxPerVertical: maxPer };
      } else {
        url = '/api/sales-agent/news-projects';
        body = { industries, autoQuote, autoEmail: false, minConfidence: minConf };
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: DiscoverResult = await resp.json();

      if (!data.ok) throw new Error(data.errors?.[0] || 'Campaign failed');

      const { leads: newLeads, ...rest } = data;
      setStats(rest);
      // Merge new leads (prepend)
      setLeads(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const fresh = newLeads.filter(l => !existingIds.has(l.id));
        return [...fresh, ...prev];
      });
      // Resolve email targets for new leads in the background
      for (const lead of newLeads) {
        if (lead.website) {
          fetch(`/api/sales-agent/email-targets/${lead.id}`)
            .then(r => r.json())
            .then(t => {
              if (t.resolved) {
                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, resolvedEmails: t.resolved } : l));
              }
            })
            .catch(() => {});
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunning(false);
    }
  }, [mode, location, verticals, autoQuote, maxPer, industries, minConf]);

  // ── Send single email ─────────────────────────────────────────────────────
  const handleEmail = useCallback(async (leadId: string) => {
    setEmailingId(leadId);
    try {
      const resp = await fetch(`/api/sales-agent/email/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewOnly: false }),
      });
      const data = await resp.json();
      if (data.ok || data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'emailed' } : l));
      }
    } catch (err) { console.warn('[Campaign] email error', err); }
    setEmailingId(null);
  }, []);

  // ── Preview email ─────────────────────────────────────────────────────────
  const handlePreview = useCallback(async (leadId: string) => {
    try {
      const resp = await fetch(`/api/sales-agent/email/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewOnly: true }),
      });
      const data = await resp.json();
      if (data.html) setPreviewHtml(data.html);
    } catch (err) { console.warn('[Campaign] preview error', err); }
  }, []);

  // ── Batch send all quoted leads ───────────────────────────────────────────
  const handleBatchSend = useCallback(async () => {
    const quotedLeads = leads.filter(l => l.status === 'quoted');
    for (const lead of quotedLeads) {
      await handleEmail(lead.id);
      await new Promise(r => setTimeout(r, 500));
    }
  }, [leads, handleEmail]);

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggleVertical = (v: string) =>
    setVerticals(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleIndustry = (id: string) =>
    setIndustries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Counts ────────────────────────────────────────────────────────────────
  const quotedCount   = leads.filter(l => l.status === 'quoted').length;
  const emailedCount  = leads.filter(l => l.status === 'emailed').length;
  const totalSavings  = leads.reduce((s, l) => s + (l.highlights?.annualSavings || 0), 0);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {previewHtml && <EmailPreviewModal html={previewHtml} onClose={() => setPreviewHtml(null)} />}

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Outbound Campaign</h1>
            <p className="text-sm text-slate-400 mt-0.5">Discover prospects → auto-quote → send StackQuote™ emails</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatBadge label="Total Leads" value={leads.length} />
            <StatBadge label="Quoted" value={quotedCount} />
            <StatBadge label="Emailed" value={emailedCount} />
            <StatBadge label="Pipeline Savings" value={fmt$k(totalSavings)} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Mode Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700 w-fit">
          {([['news', '📰 Energy Projects (News RSS)'], ['places', '📍 Industry Sites (Google Places)']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                mode === m ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Campaign Setup Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'news' ? 'Energy Project Discovery — News RSS' : 'Industry Site Discovery — Google Places'}
          </h2>

          {mode === 'places' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Las Vegas, NV"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Results per Vertical</label>
                <input
                  type="number"
                  value={maxPer}
                  onChange={e => setMaxPer(Number(e.target.value))}
                  min={1} max={50}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Verticals</label>
                <div className="flex flex-wrap gap-2">
                  {PLACES_VERTICALS.map(v => (
                    <button
                      key={v}
                      onClick={() => toggleVertical(v)}
                      className={`text-sm rounded-lg px-3 py-1.5 border transition-colors ${
                        verticals.includes(v)
                          ? 'bg-emerald-800 border-emerald-600 text-emerald-200'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {v.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Min Confidence Score (0–100)</label>
                <input
                  type="number"
                  value={minConf}
                  onChange={e => setMinConf(Number(e.target.value))}
                  min={0} max={100}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-slate-500">Higher = only confident extractions. Recommended: 40–60.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Options</label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={autoQuote} onChange={e => setAutoQuote(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4" />
                  <span className="text-sm text-slate-300">Auto-generate StackQuote™ for each prospect</span>
                </label>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Industries to Scan</label>
                <div className="flex flex-wrap gap-2">
                  {NEWS_INDUSTRIES.map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => toggleIndustry(ind.id)}
                      className={`text-sm rounded-lg px-3 py-1.5 border transition-colors ${
                        industries.includes(ind.id)
                          ? 'bg-emerald-800 border-emerald-600 text-emerald-200'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={runCampaign}
              disabled={running || (mode === 'places' ? !location.trim() : industries.length === 0)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center gap-2"
            >
              {running ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Running…
                </>
              ) : (
                <>⚡ Run Campaign</>
              )}
            </button>
            {quotedCount > 0 && (
              <button
                onClick={handleBatchSend}
                disabled={running}
                className="px-5 py-2.5 border border-emerald-700 hover:bg-emerald-900/40 rounded-lg text-sm font-medium text-emerald-400 transition-colors"
              >
                📤 Send All Quoted ({quotedCount})
              </button>
            )}
          </div>

          {/* Run stats */}
          {stats && (
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-slate-400">
              <span className="text-emerald-400 font-medium">✓ Run complete</span>
              <span>Discovered: <span className="text-white">{stats.discovered}</span></span>
              <span>Quoted: <span className="text-white">{stats.quoted}</span></span>
              <span>Skipped: <span className="text-white">{stats.skipped}</span></span>
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
              <h2 className="text-base font-semibold text-white">Prospects ({leads.length})</h2>
              <span className="text-xs text-slate-400">
                Click <span className="text-emerald-400">Send</span> to deliver StackQuote™ email · <span className="text-blue-400">Preview</span> to inspect first
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
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
                <tbody>
                  {leads.map(lead => (
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

        {leads.length === 0 && !running && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">⚡</div>
            <p className="text-lg">Run a campaign to discover prospects</p>
            <p className="text-sm mt-1">News RSS scans 10 industry feeds · Google Places searches your target market</p>
          </div>
        )}

      </div>
    </div>
  );
}
