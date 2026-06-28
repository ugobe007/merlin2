/**
 * MARKET INTELLIGENCE DASHBOARD — v2
 * Professional B2B energy market analysis panel.
 * Charts powered by Recharts. Live energy headlines from RSS.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle,
  Zap, Building2, DollarSign, Lightbulb, ArrowUpRight,
  ArrowDownRight, Activity, Globe, Newspaper, BarChart3,
  ChevronRight, Clock, Shield,
} from "lucide-react";
import {
  runMarketInference,
  type MarketInference,
  type MarketTrend,
  type BESSConfigurationPattern,
  type EmergingOpportunity,
  type IndustryAdoptionRate,
} from "@/services/marketInferenceEngine";
import { supabase } from "@/services/supabaseClient";
import MarketIntelligenceDetailModal from "./MarketIntelligenceDetailModal";
import type { Json } from "@/types/database.types";

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  slate: "#64748b",
};
const INDUSTRY_COLORS = [C.indigo, C.emerald, C.amber, C.sky, C.violet, C.rose, C.slate];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function jsonArray<T>(v: Json | null | undefined): T[] {
  if (Array.isArray(v)) return v as unknown as T[];
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? (p as T[]) : []; }
    catch { return []; }
  }
  return [];
}

function asSentiment(v: string | null | undefined): "bullish" | "bearish" | "neutral" {
  if (v === "bullish" || v === "bearish" || v === "neutral") return v;
  return "neutral";
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface Headline { title: string; source: string; url: string; date: string; }

async function fetchHeadlines(): Promise<Headline[]> {
  const feeds = [
    { url: "https://electrek.co/feed", source: "Electrek" },
    { url: "https://www.greentechmedia.com/rss/all", source: "Wood Mackenzie" },
    { url: "https://rss.politico.com/energy.xml", source: "Politico Energy" },
  ];
  const items: Headline[] = [];
  await Promise.all(
    feeds.map(async ({ url, source }) => {
      try {
        const r = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!r.ok) return;
        const xml = await r.text();
        const titles = [...xml.matchAll(/<item[^>]*>[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([^\]<]{15,120})(?:\]\]>)?<\/title>/g)].slice(0, 4);
        const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)];
        const dates = [...xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)];
        titles.forEach((m, i) =>
          items.push({ title: m[1].trim(), source, url: links[i + 1]?.[1] ?? "#", date: dates[i]?.[1] ?? "" })
        );
      } catch { /* ignore feed errors */ }
    })
  );
  return items.slice(0, 12);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const SentimentPill = ({ s }: { s: string }) => {
  const cfg =
    s === "bullish" ? { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <TrendingUp className="w-3 h-3" /> }
    : s === "bearish" ? { bg: "bg-red-100 text-red-700 border-red-200", icon: <TrendingDown className="w-3 h-3" /> }
    : { bg: "bg-slate-100 text-slate-600 border-slate-200", icon: <Minus className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
      {cfg.icon}{s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const KpiCard = ({
  label, value, sub, delta, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string; delta?: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
    </div>
    <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
    {delta !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(delta).toFixed(1)}% vs last period
      </div>
    )}
  </div>
);

const DirBadge = ({ d }: { d: string }) =>
  d === "increasing" ? (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <TrendingUp className="w-3 h-3" />Rising
    </span>
  ) : d === "decreasing" ? (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <TrendingDown className="w-3 h-3" />Falling
    </span>
  ) : d === "volatile" ? (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      <Activity className="w-3 h-3" />Volatile
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
      <Minus className="w-3 h-3" />Stable
    </span>
  );

const ConfBar = ({ v, color = C.indigo }: { v: number; color?: string }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(v * 100)}%`, background: color }} />
    </div>
    <span className="text-xs text-slate-500 w-8">{Math.round(v * 100)}%</span>
  </div>
);

const PriorityBadge = ({ s }: { s: string }) =>
  s === "critical" ? (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Critical</span>
  ) : s === "high" ? (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">High</span>
  ) : (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{s}</span>
  );

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const MarketIntelligenceDashboard: React.FC = () => {
  const [inference, setInference] = useState<MarketInference | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [hlLoading, setHlLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "configs" | "opportunities" | "adoption" | "pricing" | "news">("overview");
  const [pending, setPending] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: any; data: any } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const loadInference = useCallback(async () => {
    try {
      const { data, error: fe } = await supabase
        .from("market_inferences")
        .select("*")
        .order("analysis_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fe?.code === "42P01") {
        setError("Run migration: database/migrations/20250103_market_inference_tables.sql");
        return;
      }
      if (!data) return;
      const mt = jsonArray<MarketTrend>(data.market_trends);
      const bc = jsonArray<BESSConfigurationPattern>(data.bess_configurations);
      const eo = jsonArray<EmergingOpportunity>(data.emerging_opportunities);
      const ia = jsonArray<IndustryAdoptionRate>(data.industry_adoption);
      if (mt.length || bc.length || ia.length) {
        setInference({
          analysisDate: data.analysis_date,
          marketTrends: mt,
          bessConfigurations: bc,
          decisionIndicators: jsonArray(data.decision_indicators),
          emergingOpportunities: eo,
          industryAdoption: ia,
          overallMarketSentiment: asSentiment(data.overall_sentiment),
          confidence: data.confidence ?? 0,
          dataPointsAnalyzed: data.data_points_analyzed ?? 0,
          sources: jsonArray(data.sources),
          requiresPricingUpdate: data.requires_pricing_update ?? false,
          pricingUpdateRecommendations: jsonArray(data.pricing_update_recommendations),
        });
        setLastRun(data.analysis_date);
      }
    } catch (e) { console.error(e); }
  }, []);

  const loadPending = async () => {
    try {
      const { data } = await supabase
        .from("pricing_update_approvals")
        .select("*")
        .eq("status", "pending")
        .order("requested_at", { ascending: false });
      setPending(data ?? []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadInference();
    loadPending();
    setHlLoading(true);
    fetchHeadlines().then(h => { setHeadlines(h); setHlLoading(false); });
  }, [loadInference]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await runMarketInference(90);
      setInference(r);
      setLastRun(new Date().toISOString());
      await loadPending();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (type: any, data: any) => {
    if (!data) return;
    setSelectedItem({ type, data });
    setIsModalOpen(true);
  };

  const handleEdit = async (upd: any) => {
    if (!inference || !selectedItem) return;
    const u = { ...inference };
    const up = (arr: any[]) => arr.map(x => x === selectedItem.data ? upd : x);
    switch (selectedItem.type) {
      case "trend": u.marketTrends = up(inference.marketTrends); break;
      case "config": u.bessConfigurations = up(inference.bessConfigurations); break;
      case "opportunity": u.emergingOpportunities = up(inference.emergingOpportunities); break;
      case "adoption": u.industryAdoption = up(inference.industryAdoption); break;
    }
    const { error: e } = await supabase
      .from("market_inferences")
      .update({
        market_trends: u.marketTrends as unknown as Json,
        bess_configurations: u.bessConfigurations as unknown as Json,
        emerging_opportunities: u.emergingOpportunities as unknown as Json,
        industry_adoption: u.industryAdoption as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("analysis_date", new Date(u.analysisDate).toISOString().split("T")[0]);
    if (e) { alert("Save failed"); return; }
    setInference(u);
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!inference || !selectedItem || !confirm("Delete this item?")) return;
    const u = { ...inference };
    const dl = (arr: any[]) => arr.filter(x => x !== selectedItem.data);
    switch (selectedItem.type) {
      case "trend": u.marketTrends = dl(inference.marketTrends); break;
      case "config": u.bessConfigurations = dl(inference.bessConfigurations); break;
      case "opportunity": u.emergingOpportunities = dl(inference.emergingOpportunities); break;
      case "adoption": u.industryAdoption = dl(inference.industryAdoption); break;
    }
    await supabase.from("market_inferences").update({
      market_trends: u.marketTrends as unknown as Json,
      bess_configurations: u.bessConfigurations as unknown as Json,
      emerging_opportunities: u.emergingOpportunities as unknown as Json,
      industry_adoption: u.industryAdoption as unknown as Json,
      updated_at: new Date().toISOString(),
    }).eq("analysis_date", new Date(u.analysisDate).toISOString().split("T")[0]);
    setInference(u);
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const TABS = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "trends", label: "Market Trends", icon: TrendingUp },
    { key: "configs", label: "BESS Configs", icon: Zap },
    { key: "opportunities", label: "Opportunities", icon: Lightbulb },
    { key: "adoption", label: "Adoption", icon: Building2 },
    { key: "pricing", label: "Pricing", icon: DollarSign, badge: pending.length },
    { key: "news", label: "Energy News", icon: Newspaper, badge: headlines.length },
  ] as const;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500" />
            Market Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            BESS/solar market signals, price trends, and adoption analytics
            {lastRun && <span className="ml-2 text-slate-400">· last run {timeAgo(lastRun)}</span>}
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing…" : "Run Analysis"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            {pending.length} pricing update{pending.length > 1 ? "s" : ""} pending approval
          </div>
          <button onClick={() => setActiveTab("pricing")} className="text-amber-700 hover:text-amber-900 text-sm font-semibold">
            Review →
          </button>
        </div>
      )}

      {!inference && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No analysis yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm">
            Run your first market analysis to see BESS price trends, industry adoption rates, and emerging opportunities.
          </p>
          <button onClick={runAnalysis} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow">
            <RefreshCw className="w-4 h-4" />Run Analysis
          </button>
        </div>
      )}

      {inference && (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Market Sentiment"
              value={inference.overallMarketSentiment.charAt(0).toUpperCase() + inference.overallMarketSentiment.slice(1)}
              sub={`${(inference.confidence * 100).toFixed(0)}% confidence`}
              icon={Activity}
              color={inference.overallMarketSentiment === "bullish" ? C.emerald : inference.overallMarketSentiment === "bearish" ? C.rose : C.slate}
            />
            <KpiCard
              label="Data Points"
              value={inference.dataPointsAnalyzed.toLocaleString()}
              sub={`${inference.sources.length} sources`}
              icon={BarChart3}
              color={C.indigo}
            />
            <KpiCard
              label="Active Trends"
              value={inference.marketTrends.length}
              sub={`${inference.marketTrends.filter(t => t.direction === "increasing").length} rising`}
              icon={TrendingUp}
              color={C.sky}
            />
            <KpiCard
              label="Opportunities"
              value={inference.emergingOpportunities.length}
              sub={`${inference.emergingOpportunities.filter(o => o.marketSize === "large" || o.marketSize === "very-large").length} large markets`}
              icon={Lightbulb}
              color={C.amber}
            />
          </div>

          {/* Tab Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {"badge" in tab && tab.badge > 0 && (
                    <span className="ml-1 bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === "overview" && <OverviewTab inference={inference} onItemClick={handleItemClick} />}
              {activeTab === "trends" && <TrendsTab trends={inference.marketTrends} onItemClick={handleItemClick} />}
              {activeTab === "configs" && <ConfigsTab configs={inference.bessConfigurations} onItemClick={handleItemClick} />}
              {activeTab === "opportunities" && <OpportunitiesTab opportunities={inference.emergingOpportunities} onItemClick={handleItemClick} />}
              {activeTab === "adoption" && <AdoptionTab adoption={inference.industryAdoption} onItemClick={handleItemClick} />}
              {activeTab === "pricing" && (
                <PricingTab
                  recommendations={inference.pricingUpdateRecommendations ?? []}
                  pendingApprovals={pending}
                  onApprovalUpdate={loadPending}
                  onItemClick={handleItemClick}
                />
              )}
              {activeTab === "news" && <NewsTab headlines={headlines} loading={hlLoading} />}
            </div>
          </div>
        </>
      )}

      {/* Always show Energy News if no inference yet */}
      {!inference && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600 bg-white">
              <Newspaper className="w-4 h-4" />Energy News
              {headlines.length > 0 && (
                <span className="ml-1 bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{headlines.length}</span>
              )}
            </div>
          </div>
          <div className="p-6"><NewsTab headlines={headlines} loading={hlLoading} /></div>
        </div>
      )}

      {selectedItem && (
        <MarketIntelligenceDetailModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
          type={selectedItem.type}
          data={selectedItem.data}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════════
const OverviewTab: React.FC<{ inference: MarketInference; onItemClick: (t: any, d: any) => void }> = ({ inference, onItemClick }) => {
  const radarData = inference.marketTrends.slice(0, 6).map(t => ({
    category: t.category.charAt(0).toUpperCase() + t.category.slice(1),
    confidence: Math.round(t.confidence * 100),
    magnitude: Math.min(100, Math.abs(t.magnitude)),
  }));
  const adoptionData = inference.industryAdoption.slice(0, 7).map(a => ({
    name: a.industry.length > 12 ? a.industry.slice(0, 10) + "…" : a.industry,
    adoption: parseFloat(a.adoptionRate.toFixed(1)),
    growth: parseFloat(a.growthRate.toFixed(1)),
  }));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {radarData.length > 2 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />Trend Confidence by Category
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Confidence" dataKey="confidence" stroke={C.indigo} fill={C.indigo} fillOpacity={0.25} />
                <Radar name="Magnitude" dataKey="magnitude" stroke={C.emerald} fill={C.emerald} fillOpacity={0.15} />
                <Tooltip formatter={(v: any) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
        {adoptionData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />Adoption Rate by Industry (%)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adoptionData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="adoption" radius={[4, 4, 0, 0]}>
                  {adoptionData.map((_, i) => <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inference.marketTrends[0] && (
          <button
            onClick={() => onItemClick("trend", inference.marketTrends[0])}
            className="text-left p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Top Trend</span>
            </div>
            <div className="font-bold text-slate-900 capitalize mb-1">{inference.marketTrends[0].category}</div>
            <DirBadge d={inference.marketTrends[0].direction} />
            <div className="mt-2"><ConfBar v={inference.marketTrends[0].confidence} color={C.indigo} /></div>
            <div className="mt-2 text-xs text-slate-400 line-clamp-2">{inference.marketTrends[0].evidence[0]}</div>
            <div className="flex items-center justify-end mt-3 text-xs text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Details</span><ChevronRight className="w-3 h-3" />
            </div>
          </button>
        )}
        {inference.emergingOpportunities[0] && (
          <button
            onClick={() => onItemClick("opportunity", inference.emergingOpportunities[0])}
            className="text-left p-4 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Top Opportunity</span>
            </div>
            <div className="font-bold text-slate-900 mb-1 line-clamp-1">{inference.emergingOpportunities[0].opportunity}</div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              inference.emergingOpportunities[0].marketSize === "large" || inference.emergingOpportunities[0].marketSize === "very-large"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}>
              {inference.emergingOpportunities[0].marketSize} market
            </span>
            <div className="mt-2 text-xs text-slate-400 line-clamp-2">{inference.emergingOpportunities[0].description}</div>
            <div className="flex items-center justify-end mt-3 text-xs text-amber-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Details</span><ChevronRight className="w-3 h-3" />
            </div>
          </button>
        )}
        {inference.industryAdoption[0] && (
          <button
            onClick={() => onItemClick("adoption", inference.industryAdoption[0])}
            className="text-left p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Fastest Adopter</span>
            </div>
            <div className="font-bold text-slate-900 capitalize mb-1">{inference.industryAdoption[0].industry}</div>
            <div className="text-2xl font-bold text-emerald-600">{inference.industryAdoption[0].adoptionRate.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">+{inference.industryAdoption[0].growthRate.toFixed(1)}% YoY growth</div>
            <div className="flex items-center justify-end mt-3 text-xs text-emerald-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Details</span><ChevronRight className="w-3 h-3" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRENDS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const TrendsTab: React.FC<{ trends: MarketTrend[]; onItemClick: (t: any, d: any) => void }> = ({ trends, onItemClick }) => {
  const areaData = trends.map(t => ({
    name: t.category.slice(0, 6),
    magnitude: Math.abs(t.magnitude),
    confidence: Math.round(t.confidence * 100),
  }));
  return (
    <div className="space-y-6">
      {areaData.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />Magnitude vs Confidence
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gMag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.indigo} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gConf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.emerald} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip />
              <Area type="monotone" dataKey="magnitude" stroke={C.indigo} fill="url(#gMag)" name="Magnitude %" />
              <Area type="monotone" dataKey="confidence" stroke={C.emerald} fill="url(#gConf)" name="Confidence %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="grid gap-3">
        {trends.map((t, i) => (
          <button
            key={i}
            onClick={() => onItemClick("trend", t)}
            className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  t.direction === "increasing" ? "bg-emerald-50" : t.direction === "decreasing" ? "bg-red-50" : "bg-slate-100"
                }`}>
                  {t.direction === "increasing"
                    ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                    : t.direction === "decreasing"
                    ? <TrendingDown className="w-4 h-4 text-red-500" />
                    : <Minus className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900 capitalize">{t.category}</span>
                    <DirBadge d={t.direction} />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t.timeframe}-term</span>
                  </div>
                  <ConfBar v={t.confidence} />
                  <div className="mt-2 text-xs text-slate-500 line-clamp-2">{t.evidence.join(" · ")}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-xl font-bold ${
                  t.direction === "increasing" ? "text-emerald-600" : t.direction === "decreasing" ? "text-red-500" : "text-slate-500"
                }`}>
                  {t.direction === "increasing" ? "+" : t.direction === "decreasing" ? "-" : ""}
                  {Math.abs(t.magnitude).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">magnitude</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BESS CONFIGS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const ConfigsTab: React.FC<{ configs: BESSConfigurationPattern[]; onItemClick: (t: any, d: any) => void }> = ({ configs, onItemClick }) => {
  const barData = configs.slice(0, 8).map(c => ({
    name: c.configuration.length > 12 ? c.configuration.slice(0, 10) + "…" : c.configuration,
    freq: c.frequency,
    avgPrice: Math.round(c.avgPrice / 1000),
  }));
  return (
    <div className="space-y-6">
      {barData.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500" />Frequency vs Avg Price ($K)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="freq" fill={C.violet} radius={[4, 4, 0, 0]} name="Frequency" />
              <Bar yAxisId="right" dataKey="avgPrice" fill={C.sky} radius={[4, 4, 0, 0]} name="Avg $K" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="grid gap-3">
        {configs.slice(0, 10).map((c, i) => (
          <button
            key={i}
            onClick={() => onItemClick("config", c)}
            className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm bg-white transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-slate-900 font-mono">{c.configuration}</span>
                  <DirBadge d={c.trend} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 mb-2">
                  <div>
                    <span className="text-slate-400">Avg price</span>
                    <div className="font-semibold text-slate-700">${c.avgPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Range</span>
                    <div className="font-semibold text-slate-700">
                      ${(c.priceRange.min / 1000).toFixed(0)}K–${(c.priceRange.max / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Instances</span>
                    <div className="font-semibold text-slate-700">{c.frequency}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">{c.industries.slice(0, 4).join(" · ")}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPPORTUNITIES TAB
// ═══════════════════════════════════════════════════════════════════════════════
const SIZE_ORDER: Record<string, number> = { "very-large": 4, large: 3, medium: 2, small: 1 };
const SIZE_COLOR: Record<string, string> = {
  "very-large": "bg-emerald-100 text-emerald-700 border-emerald-200",
  large: "bg-sky-100 text-sky-700 border-sky-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  small: "bg-slate-100 text-slate-500 border-slate-200",
};

const OpportunitiesTab: React.FC<{ opportunities: EmergingOpportunity[]; onItemClick: (t: any, d: any) => void }> = ({ opportunities, onItemClick }) => {
  const sorted = [...opportunities].sort((a, b) => (SIZE_ORDER[b.marketSize] ?? 0) - (SIZE_ORDER[a.marketSize] ?? 0));
  return (
    <div className="grid gap-4">
      {sorted.map((o, i) => (
        <button
          key={i}
          onClick={() => onItemClick("opportunity", o)}
          className="w-full text-left p-5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md bg-white transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SIZE_COLOR[o.marketSize] ?? SIZE_COLOR.small}`}>
                  {o.marketSize} market
                </span>
                <span className="text-xs text-slate-400">{o.growthRate.toFixed(1)}% growth</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-1">{o.opportunity}</h4>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{o.description}</p>
              <div className="flex flex-wrap gap-1">
                {o.industries.slice(0, 5).map((ind, j) => (
                  <span key={j} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{ind}</span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-amber-600">{(o.confidence * 100).toFixed(0)}%</div>
              <div className="text-xs text-slate-400">confidence</div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors mt-2 ml-auto" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADOPTION TAB
// ═══════════════════════════════════════════════════════════════════════════════
const AdoptionTab: React.FC<{ adoption: IndustryAdoptionRate[]; onItemClick: (t: any, d: any) => void }> = ({ adoption, onItemClick }) => {
  const max = Math.max(...adoption.map(a => a.adoptionRate), 1);
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-500" />Adoption Rate Ranking
        </h3>
        {adoption.map((a, i) => (
          <button key={i} onClick={() => onItemClick("adoption", a)} className="w-full text-left group">
            <div className="flex items-center gap-3 py-1">
              <span className="w-5 text-xs font-bold text-slate-400 text-right">#{a.ranking}</span>
              <span className="text-sm font-medium text-slate-700 capitalize w-28 truncate">{a.industry}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all"
                  style={{ width: `${(a.adoptionRate / max) * 100}%`, background: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }}
                />
              </div>
              <span className="text-sm font-bold text-slate-700 w-12 text-right">{a.adoptionRate.toFixed(1)}%</span>
              <span className={`text-xs font-semibold w-16 text-right ${a.growthRate > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {a.growthRate > 0 ? "+" : ""}{a.growthRate.toFixed(1)}% YoY
              </span>
            </div>
          </button>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-500" />Typical System Sizes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {adoption.map((a, i) => (
            <button
              key={i}
              onClick={() => onItemClick("adoption", a)}
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white text-left transition-all"
            >
              <div className="text-xs font-semibold text-slate-500 capitalize mb-1">{a.industry}</div>
              <div className="font-bold text-slate-900">{a.avgSystemSize.power.toFixed(0)} kW</div>
              <div className="text-xs text-slate-500">{a.avgSystemSize.energy.toFixed(0)} kWh</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING TAB
// ═══════════════════════════════════════════════════════════════════════════════
const PricingTab: React.FC<{
  recommendations: any[];
  pendingApprovals: any[];
  onApprovalUpdate: () => void;
  onItemClick: (t: any, d: any) => void;
}> = ({ recommendations, pendingApprovals, onApprovalUpdate, onItemClick }) => {
  const approve = async (id: string) => {
    await supabase
      .from("pricing_update_approvals")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    onApprovalUpdate();
  };
  const reject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    await supabase
      .from("pricing_update_approvals")
      .update({ status: "rejected", rejection_reason: reason, approved_at: new Date().toISOString() })
      .eq("id", id);
    onApprovalUpdate();
  };
  return (
    <div className="space-y-6">
      {pendingApprovals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />Pending Approvals ({pendingApprovals.length})
          </h3>
          <div className="grid gap-3">
            {pendingApprovals.map(a => (
              <div key={a.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">{a.component}</span>
                      <PriorityBadge s={a.urgency} />
                    </div>
                    <div className="text-sm text-slate-600 mb-1">
                      <span className="font-mono">${a.current_value?.toFixed(2)}</span>
                      <span className="text-slate-400 mx-2">→</span>
                      <span className="font-mono font-bold text-emerald-700">${a.recommended_value?.toFixed(2)}</span>
                      <span className={`ml-2 text-xs font-semibold ${a.change_percent > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        ({a.change_percent > 0 ? "+" : ""}{a.change_percent?.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{a.reasoning}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => approve(a.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg">
                      Approve
                    </button>
                    <button onClick={() => reject(a.id)} className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-500" />Pricing Recommendations
          </h3>
          <div className="grid gap-3">
            {recommendations.map((r, i) => (
              <button
                key={i}
                onClick={() => onItemClick("pricing", r)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">{r.component}</span>
                      <PriorityBadge s={r.urgency} />
                    </div>
                    <div className="text-sm text-slate-600 mb-1">
                      <span className="font-mono">${r.currentValue?.toFixed(2)}</span>
                      <span className="text-slate-400 mx-2">→</span>
                      <span className="font-mono font-bold">${r.recommendedValue?.toFixed(2)}</span>
                      <span className={`ml-2 text-xs font-semibold ${r.changePercent > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        ({r.changePercent > 0 ? "+" : ""}{r.changePercent?.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{r.reasoning}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {recommendations.length === 0 && pendingApprovals.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No pricing updates needed</p>
          <p className="text-sm mt-1">All prices are within acceptable market ranges.</p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEWS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const SOURCE_COLOR: Record<string, string> = {
  "Electrek": "bg-emerald-100 text-emerald-700",
  "Wood Mackenzie": "bg-blue-100 text-blue-700",
  "Politico Energy": "bg-slate-100 text-slate-600",
};

const NewsTab: React.FC<{ headlines: Headline[]; loading: boolean }> = ({ headlines, loading }) => {
  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" />Fetching live energy news…
    </div>
  );
  if (!headlines.length) return (
    <div className="text-center py-12 text-slate-400">
      <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">No headlines loaded</p>
      <p className="text-sm mt-1">RSS feeds may be temporarily unavailable.</p>
    </div>
  );
  const bySource = headlines.reduce<Record<string, Headline[]>>((acc, h) => {
    (acc[h.source] ??= []).push(h);
    return acc;
  }, {});
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5" />Live from Electrek, Wood Mackenzie, Politico Energy
      </div>
      {Object.entries(bySource).map(([source, items]) => (
        <div key={source}>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-indigo-400" />
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SOURCE_COLOR[source] ?? "bg-slate-100 text-slate-600"}`}>
              {source}
            </span>
          </h3>
          <div className="grid gap-2">
            {items.map((h, i) => (
              <a
                key={i}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium group-hover:text-indigo-700 line-clamp-2 transition-colors">{h.title}</p>
                  {h.date && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketIntelligenceDashboard;
