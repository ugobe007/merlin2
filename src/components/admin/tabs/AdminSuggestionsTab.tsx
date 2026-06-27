import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb, Code2, Palette, Workflow, Zap, Type,
  CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SuggestionStatus = 'pending' | 'approved' | 'applied' | 'rejected';
type SuggestionType   = 'copy' | 'code' | 'design' | 'ui' | 'workflow' | 'optimization';

interface Suggestion {
  id:            string;
  type:          SuggestionType;
  title:         string;
  description:   string;
  rationale:     string;
  priority:      'high' | 'medium' | 'low';
  status:        SuggestionStatus;
  copy_key?:     string | null;
  copy_value?:   string | null;
  reviewed_at?:  string | null;
  reviewed_note?:string | null;
  created_at:    string;
  report_id?:    string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TYPE_META: Record<SuggestionType, { label: string; Icon: React.FC<{ className?: string }>; color: string }> = {
  copy:         { label: 'Copy Change',  Icon: Type,     color: 'bg-violet-100 text-violet-700 border-violet-200' },
  code:         { label: 'Code',         Icon: Code2,    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  design:       { label: 'Design',       Icon: Palette,  color: 'bg-pink-100 text-pink-700 border-pink-200' },
  ui:           { label: 'UI',           Icon: Palette,  color: 'bg-rose-100 text-rose-700 border-rose-200' },
  workflow:     { label: 'Workflow',     Icon: Workflow,  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  optimization: { label: 'Optimization', Icon: Zap,      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const PRIORITY_BADGE: Record<string, string> = {
  high:   '🔴 High',
  medium: '🟡 Medium',
  low:    '⚪ Low',
};

const STATUS_BADGE: Record<SuggestionStatus, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-800 border-green-200' },
  applied:  { label: 'Applied',  cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-200' },
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ─── Single Suggestion Card ───────────────────────────────────────────────────
function SuggestionCard({
  s,
  onApprove,
  onReject,
}: {
  s: Suggestion;
  onApprove: (id: string) => Promise<void>;
  onReject:  (id: string) => Promise<void>;
}) {
  const [busy,     setBusy]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[s.type] ?? TYPE_META.optimization;

  const handle = async (fn: (id: string) => Promise<void>) => {
    setBusy(true);
    await fn(s.id).catch(() => {});
    setBusy(false);
  };

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${s.status !== 'pending' ? 'opacity-70' : ''}`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 mt-0.5 rounded-lg p-1.5 border ${meta.color}`}>
          <meta.Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 items-center mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-xs text-slate-500">{PRIORITY_BADGE[s.priority]}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[s.status].cls}`}>
              {STATUS_BADGE[s.status].label}
            </span>
            <span className="text-xs text-slate-400 ml-auto">{timeAgo(s.created_at)}</span>
          </div>

          <p className="font-semibold text-slate-900 text-sm">{s.title}</p>

          {s.type === 'copy' && s.copy_key && (
            <p className="text-xs text-slate-500 font-mono mt-0.5">key: {s.copy_key}</p>
          )}

          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{s.description}</p>
        </div>
      </div>

      {/* Expandable rationale */}
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex items-center gap-1 px-4 pb-2 text-xs text-slate-400 hover:text-slate-600"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'Show'} rationale
      </button>

      {expanded && (
        <div className="mx-4 mb-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
          <p className="font-medium text-slate-500 mb-1">Why this matters:</p>
          <p>{s.rationale}</p>
          {s.type === 'copy' && s.copy_value && (
            <>
              <p className="font-medium text-slate-500 mt-2 mb-1">Proposed value:</p>
              <p className="font-mono bg-white border border-slate-200 rounded p-2 whitespace-pre-wrap break-words">{s.copy_value}</p>
            </>
          )}
          {s.reviewed_note && (
            <>
              <p className="font-medium text-slate-500 mt-2 mb-1">Review note:</p>
              <p className="italic">{s.reviewed_note}</p>
            </>
          )}
        </div>
      )}

      {/* Action buttons (only for pending) */}
      {s.status === 'pending' && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            disabled={busy}
            onClick={() => handle(onApprove)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {s.type === 'copy' ? 'Approve & Apply' : 'Approve'}
          </button>
          <button
            disabled={busy}
            onClick={() => handle(onReject)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export default function AdminSuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [toast,       setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/growth-suggestions?status=${statusFilter}&limit=100`);
      const j = await r.json();
      if (!j.success) throw new Error(j.error ?? 'Failed to load');
      setSuggestions(j.suggestions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    const r  = await fetch('/api/admin/approve-suggestion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const j = await r.json();
    if (!j.success) { showToast(`Error: ${j.error}`); return; }
    showToast(j.applied ? '✅ Approved & applied to live site!' : '✅ Suggestion approved!');
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: (s.type === 'copy' ? 'applied' : 'approved') as SuggestionStatus } : s
    ));
  };

  const reject = async (id: string) => {
    const r = await fetch('/api/admin/reject-suggestion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const j = await r.json();
    if (!j.success) { showToast(`Error: ${j.error}`); return; }
    showToast('Suggestion rejected.');
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' as SuggestionStatus } : s
    ));
  };

  // Group by type for display
  const typeOrder: SuggestionType[] = ['copy', 'code', 'design', 'ui', 'workflow', 'optimization'];
  const byType: Record<string, Suggestion[]> = {};
  for (const s of suggestions) {
    (byType[s.type] ??= []).push(s);
  }

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            AI Growth Suggestions
            {pendingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Review AI-generated suggestions. None are applied until you approve them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'pending' | 'all')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="pending">Pending only</option>
            <option value="all">All suggestions</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl z-50 animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Loading / error / empty states */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading suggestions…
        </div>
      )}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>
      )}
      {!loading && !error && suggestions.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No suggestions yet</p>
          <p className="text-sm mt-1">The growth loop runs daily at 3am PT and will generate suggestions.</p>
        </div>
      )}

      {/* Grouped cards */}
      {!loading && !error && typeOrder.map(type => {
        const items = byType[type];
        if (!items?.length) return null;
        const meta = TYPE_META[type];
        return (
          <section key={type}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              <meta.Icon className="w-4 h-4" />
              {meta.label}s
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-normal">
                {items.length}
              </span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(s => (
                <SuggestionCard key={s.id} s={s} onApprove={approve} onReject={reject} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
