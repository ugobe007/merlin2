/**
 * MARKET INTELLIGENCE DASHBOARD — v3
 * Supabase-style dark theme. Dense, inline, no padding bloat.
 */
import React, { useState, useEffect, useCallback } from "react";
// Lightweight chart stubs for build compatibility
const AreaChart = ({ children }: any) => <div className="w-full h-full relative">{children}</div>;
const Area = (_props: any) => null;
const BarChart = ({ children }: any) => <div className="w-full h-full relative">{children}</div>;
const Bar = (_props: any) => null;
const RadarChart = ({ children }: any) => <div className="w-full h-full relative">{children}</div>;
const Radar = (_props: any) => null;
const PolarGrid = (_props: any) => null;
const PolarAngleAxis = (_props: any) => null;
const PolarRadiusAxis = (_props: any) => null;
const ResponsiveContainer = ({ children }: any) => <div className="w-full h-48 relative">{children}</div>;
const XAxis = (_props: any) => null;
const YAxis = (_props: any) => null;
const CartesianGrid = (_props: any) => null;
const Tooltip = (_props: any) => null;
const Cell = (_props: any) => null;
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle,
  Zap, Building2, DollarSign, Lightbulb, ArrowUpRight,
  Activity, Globe, Newspaper, BarChart3,
  ChevronRight, Clock, Shield, ExternalLink,
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

// ─── Supabase palette ─────────────────────────────────────────────────────────
const SB = {
  bg:      "#0f0f0f",
  surface: "#1c1c1c",
  border:  "#2e2e2e",
  text:    "#ededed",
  muted:   "#8c8c8c",
  dim:     "#606060",
  green:   "#3ecf8e",
  greenDim:"#1b9e6e",
  red:     "#f56565",
  amber:   "#f6ad55",
  blue:    "#63b3ed",
  violet:  "#b794f4",
};

const CHART_COLORS = [SB.green, SB.blue, SB.amber, SB.violet, "#fc8181", "#76e4f7", "#9ae6b4"];

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
  try {
    const r = await fetch("/api/market/news", { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const json = await r.json() as { headlines?: Headline[] };
    return json.headlines ?? [];
  } catch {
    return [];
  }
}

// ─── Tiny shared atoms ────────────────────────────────────────────────────────
const Dot = ({ color }: { color: string }) => (
  <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
);

const Tag = ({ children, color = SB.muted }: { children: React.ReactNode; color?: string }) => (
  <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded"
    style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
    {children}
  </span>
);

const DirChip = ({ d }: { d: string }) =>
  d === "increasing" ? <Tag color={SB.green}><TrendingUp className="w-2.5 h-2.5 mr-0.5" />Rising</Tag>
  : d === "decreasing" ? <Tag color={SB.red}><TrendingDown className="w-2.5 h-2.5 mr-0.5" />Falling</Tag>
  : d === "volatile" ? <Tag color={SB.amber}><Activity className="w-2.5 h-2.5 mr-0.5" />Volatile</Tag>
  : <Tag color={SB.muted}><Minus className="w-2.5 h-2.5 mr-0.5" />Stable</Tag>;

const ConfPct = ({ v }: { v: number }) => {
  const pct = Math.round(v * 100);
  const color = pct > 70 ? SB.green : pct > 40 ? SB.amber : SB.red;
  return <span className="text-xs font-mono tabular-nums" style={{ color }}>{pct}%</span>;
};

const Bar1D = ({ v, color = SB.green }: { v: number; color?: string }) => (
  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: SB.border }}>
    <div className="h-full rounded-full" style={{ width: `${Math.round(v * 100)}%`, background: color }} />
  </div>
);

const SizeTag = ({ s }: { s: string }) => {
  const c = s === "very-large" || s === "large" ? SB.green : s === "medium" ? SB.amber : SB.muted;
  return <Tag color={c}>{s}</Tag>;
};

// Custom dark tooltip for recharts
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-2 py-1.5 rounded" style={{ background: SB.surface, border: `1px solid ${SB.border}`, color: SB.text }}>
      {label && <div className="mb-1" style={{ color: SB.muted }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <Dot color={p.color ?? p.fill ?? SB.green} />
          <span style={{ color: SB.muted }}>{p.name}:</span>
          <span className="font-mono">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
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

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await runMarketInference(90);
      setInference(r);
      setLastRun(new Date().toISOString());
      const { data } = await supabase.from("pricing_update_approvals").select("*").eq("status", "pending").order("requested_at", { ascending: false });
      setPending(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (!data) {
        // Auto-run on first visit when no data exists
        await runAnalysis();
        return;
      }
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
  }, [runAnalysis]);

  useEffect(() => {
    loadInference();
    setHlLoading(true);
    fetchHeadlines().then(h => { setHeadlines(h); setHlLoading(false); });
    supabase.from("pricing_update_approvals").select("*").eq("status", "pending").then(({ data }) => setPending(data ?? []));
  }, [loadInference]);

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
    const { error: e } = await supabase.from("market_inferences").update({
      market_trends: u.marketTrends as unknown as Json,
      bess_configurations: u.bessConfigurations as unknown as Json,
      emerging_opportunities: u.emergingOpportunities as unknown as Json,
      industry_adoption: u.industryAdoption as unknown as Json,
      updated_at: new Date().toISOString(),
    }).eq("analysis_date", new Date(u.analysisDate).toISOString().split("T")[0]);
    if (e) return;
    setInference(u);
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!inference || !selectedItem) return;
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
    { key: "overview",       label: "Overview",       icon: BarChart3  },
    { key: "trends",         label: "Trends",         icon: TrendingUp },
    { key: "configs",        label: "BESS Configs",   icon: Zap        },
    { key: "opportunities",  label: "Opportunities",  icon: Lightbulb  },
    { key: "adoption",       label: "Adoption",       icon: Building2  },
    { key: "pricing",        label: "Pricing",        icon: DollarSign, badge: pending.length },
    { key: "news",           label: "News",           icon: Newspaper,  badge: headlines.length },
  ] as const;

  const sentColor = inference?.overallMarketSentiment === "bullish" ? SB.green
    : inference?.overallMarketSentiment === "bearish" ? SB.red : SB.muted;

  return (
    <div className="min-h-0 text-sm" style={{ color: SB.text }}>
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4" style={{ color: SB.green }} />
          <span className="font-semibold">Market Intelligence</span>
          {lastRun && (
            <span className="text-xs" style={{ color: SB.dim }}>
              · refreshed {timeAgo(lastRun)}
            </span>
          )}
          {loading && (
            <span className="flex items-center gap-1 text-xs" style={{ color: SB.muted }}>
              <RefreshCw className="w-3 h-3 animate-spin" /> analyzing…
            </span>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded disabled:opacity-40 transition-colors"
          style={{ background: SB.surface, border: `1px solid ${SB.border}`, color: SB.text }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Re-run
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded mb-4 text-xs" style={{ background: SB.red + "18", border: `1px solid ${SB.red}44`, color: SB.red }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded mb-4 text-xs" style={{ background: SB.amber + "18", border: `1px solid ${SB.amber}44`, color: SB.amber }}>
          <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{pending.length} pricing approval{pending.length > 1 ? "s" : ""} pending</span>
          <button onClick={() => setActiveTab("pricing")} className="underline underline-offset-2">Review</button>
        </div>
      )}

      {inference && (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-4 gap-px mb-4 rounded overflow-hidden" style={{ border: `1px solid ${SB.border}` }}>
            {[
              { label: "Sentiment",    value: inference.overallMarketSentiment.charAt(0).toUpperCase() + inference.overallMarketSentiment.slice(1), sub: `${(inference.confidence * 100).toFixed(0)}% conf`, color: sentColor },
              { label: "Data Points",  value: inference.dataPointsAnalyzed.toLocaleString(), sub: `${inference.sources.length} sources`, color: SB.text },
              { label: "Trends",       value: inference.marketTrends.length, sub: `${inference.marketTrends.filter(t => t.direction === "increasing").length} rising`, color: SB.text },
              { label: "Opportunities",value: inference.emergingOpportunities.length, sub: `${inference.emergingOpportunities.filter(o => o.marketSize === "large" || o.marketSize === "very-large").length} large`, color: SB.text },
            ].map((k, i) => (
              <div key={i} className="px-4 py-3" style={{ background: SB.surface }}>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: SB.dim }}>{k.label}</div>
                <div className="text-xl font-semibold tabular-nums" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[11px] mt-0.5" style={{ color: SB.muted }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Tab bar ── */}
          <div className="flex gap-0 mb-0 overflow-x-auto" style={{ borderBottom: `1px solid ${SB.border}` }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors relative"
                style={{
                  color: activeTab === tab.key ? SB.text : SB.muted,
                  borderBottom: activeTab === tab.key ? `2px solid ${SB.green}` : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {"badge" in tab && tab.badge > 0 && (
                  <span className="text-[10px] font-bold px-1 py-px rounded" style={{ background: SB.green, color: "#000" }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div className="pt-4">
            {activeTab === "overview"      && <OverviewTab inference={inference} onItemClick={handleItemClick} />}
            {activeTab === "trends"        && <TrendsTab trends={inference.marketTrends} onItemClick={handleItemClick} />}
            {activeTab === "configs"       && <ConfigsTab configs={inference.bessConfigurations} onItemClick={handleItemClick} />}
            {activeTab === "opportunities" && <OpportunitiesTab opportunities={inference.emergingOpportunities} onItemClick={handleItemClick} />}
            {activeTab === "adoption"      && <AdoptionTab adoption={inference.industryAdoption} onItemClick={handleItemClick} />}
            {activeTab === "pricing"       && <PricingTab recommendations={inference.pricingUpdateRecommendations ?? []} pendingApprovals={pending} onApprovalUpdate={() => supabase.from("pricing_update_approvals").select("*").eq("status", "pending").then(({ data }) => setPending(data ?? []))} onItemClick={handleItemClick} />}
            {activeTab === "news"          && <NewsTab headlines={headlines} loading={hlLoading} />}
          </div>
        </>
      )}

      {/* Always show News while loading or before first analysis */}
      {!inference && !loading && (
        <>
          <div className="flex gap-0 mb-0" style={{ borderBottom: `1px solid ${SB.border}` }}>
            <div className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium" style={{ color: SB.text, borderBottom: `2px solid ${SB.green}`, marginBottom: "-1px" }}>
              <Newspaper className="w-3.5 h-3.5" />News
            </div>
          </div>
          <div className="pt-4"><NewsTab headlines={headlines} loading={hlLoading} /></div>
        </>
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
    cat: t.category.slice(0, 8).charAt(0).toUpperCase() + t.category.slice(1, 8),
    conf: Math.round(t.confidence * 100),
    mag: Math.min(100, Math.abs(t.magnitude)),
  }));
  const adoptData = inference.industryAdoption.slice(0, 8).map(a => ({
    name: a.industry.length > 10 ? a.industry.slice(0, 9) + "…" : a.industry,
    pct: parseFloat(a.adoptionRate.toFixed(1)),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        {radarData.length > 2 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: SB.dim }}>Trend Confidence by Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke={SB.border} />
                <PolarAngleAxis dataKey="cat" tick={{ fontSize: 10, fill: SB.muted }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Confidence" dataKey="conf" stroke={SB.green} fill={SB.green} fillOpacity={0.15} />
                <Radar name="Magnitude" dataKey="mag" stroke={SB.blue} fill={SB.blue} fillOpacity={0.1} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
        {adoptData.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: SB.dim }}>Industry Adoption Rate (%)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={adoptData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={SB.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} formatter={(v: any) => `${v}%`} />
                <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
                  {adoptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Inline highlight rows */}
      <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
        {[
          inference.marketTrends[0] && {
            label: "Top Trend",
            title: inference.marketTrends[0].category.charAt(0).toUpperCase() + inference.marketTrends[0].category.slice(1),
            meta: <DirChip d={inference.marketTrends[0].direction} />,
            right: <ConfPct v={inference.marketTrends[0].confidence} />,
            sub: inference.marketTrends[0].evidence[0],
            onClick: () => onItemClick("trend", inference.marketTrends[0]),
            color: SB.blue,
          },
          inference.emergingOpportunities[0] && {
            label: "Top Opportunity",
            title: inference.emergingOpportunities[0].opportunity,
            meta: <SizeTag s={inference.emergingOpportunities[0].marketSize} />,
            right: <ConfPct v={inference.emergingOpportunities[0].confidence} />,
            sub: inference.emergingOpportunities[0].description,
            onClick: () => onItemClick("opportunity", inference.emergingOpportunities[0]),
            color: SB.amber,
          },
          inference.industryAdoption[0] && {
            label: "Fastest Adopter",
            title: inference.industryAdoption[0].industry.charAt(0).toUpperCase() + inference.industryAdoption[0].industry.slice(1),
            meta: <Tag color={SB.green}>{inference.industryAdoption[0].adoptionRate.toFixed(1)}% adoption</Tag>,
            right: <span className="text-xs font-mono" style={{ color: SB.green }}>+{inference.industryAdoption[0].growthRate.toFixed(1)}% YoY</span>,
            sub: `${inference.industryAdoption[0].avgSystemSize.power.toFixed(0)} kW · ${inference.industryAdoption[0].avgSystemSize.energy.toFixed(0)} kWh typical`,
            onClick: () => onItemClick("adoption", inference.industryAdoption[0]),
            color: SB.green,
          },
        ].filter(Boolean).map((row: any, i, arr) => (
          <button
            key={i}
            onClick={row.onClick}
            className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors group"
            style={{
              background: "transparent",
              borderBottom: i < arr.length - 1 ? `1px solid ${SB.border}` : "none",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div className="w-1 h-full self-stretch rounded-full flex-shrink-0" style={{ background: row.color, minHeight: 16 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: SB.dim }}>{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{row.title}</span>
                {row.meta}
              </div>
              {row.sub && <div className="text-xs mt-0.5 truncate" style={{ color: SB.muted }}>{row.sub}</div>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {row.right}
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: SB.muted }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRENDS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const TrendsTab: React.FC<{ trends: MarketTrend[]; onItemClick: (t: any, d: any) => void }> = ({ trends, onItemClick }) => {
  const areaData = trends.map(t => ({
    name: t.category.slice(0, 5),
    mag: parseFloat(Math.abs(t.magnitude).toFixed(1)),
    conf: Math.round(t.confidence * 100),
  }));
  return (
    <div className="space-y-4">
      {areaData.length > 1 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: SB.dim }}>Magnitude vs Confidence</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={areaData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SB.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={SB.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SB.green} stopOpacity={0.3} /><stop offset="95%" stopColor={SB.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={SB.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="mag" stroke={SB.blue} fill="url(#gM)" name="Magnitude %" strokeWidth={1.5} />
              <Area type="monotone" dataKey="conf" stroke={SB.green} fill="url(#gC)" name="Confidence %" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Table-style rows */}
      <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
        <div className="grid px-4 py-2 text-[10px] uppercase tracking-wider" style={{ gridTemplateColumns: "1fr auto auto auto", gap: "1rem", color: SB.dim, borderBottom: `1px solid ${SB.border}` }}>
          <span>Category</span><span>Timeframe</span><span>Confidence</span><span>Δ</span>
        </div>
        {trends.map((t, i) => (
          <button
            key={i}
            onClick={() => onItemClick("trend", t)}
            className="w-full text-left grid px-4 py-2.5 transition-colors group"
            style={{ gridTemplateColumns: "1fr auto auto auto", gap: "1rem", borderBottom: i < trends.length - 1 ? `1px solid ${SB.border}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div className="flex items-center gap-2 min-w-0">
              <DirChip d={t.direction} />
              <span className="font-medium capitalize truncate">{t.category}</span>
            </div>
            <span className="text-xs self-center" style={{ color: SB.muted }}>{t.timeframe}-term</span>
            <div className="flex items-center gap-2 self-center w-24">
              <Bar1D v={t.confidence} color={t.confidence > 0.7 ? SB.green : t.confidence > 0.4 ? SB.amber : SB.red} />
              <ConfPct v={t.confidence} />
            </div>
            <span className="text-xs font-mono self-center tabular-nums" style={{ color: t.direction === "increasing" ? SB.green : t.direction === "decreasing" ? SB.red : SB.muted }}>
              {t.direction === "increasing" ? "+" : t.direction === "decreasing" ? "-" : "±"}{Math.abs(t.magnitude).toFixed(1)}%
            </span>
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
    name: c.configuration.length > 10 ? c.configuration.slice(0, 9) + "…" : c.configuration,
    freq: c.frequency,
    avgK: Math.round(c.avgPrice / 1000),
  }));
  return (
    <div className="space-y-4">
      {barData.length > 1 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: SB.dim }}>Frequency vs Avg Price ($K)</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={SB.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9, fill: SB.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar yAxisId="l" dataKey="freq" fill={SB.violet} radius={[2, 2, 0, 0]} name="Frequency" />
              <Bar yAxisId="r" dataKey="avgK" fill={SB.blue} radius={[2, 2, 0, 0]} name="Avg $K" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
        <div className="grid px-4 py-2 text-[10px] uppercase tracking-wider" style={{ gridTemplateColumns: "1fr auto auto auto auto", gap: "1rem", color: SB.dim, borderBottom: `1px solid ${SB.border}` }}>
          <span>Config</span><span>Trend</span><span>Instances</span><span>Avg Price</span><span>Range</span>
        </div>
        {configs.slice(0, 12).map((c, i) => (
          <button
            key={i}
            onClick={() => onItemClick("config", c)}
            className="w-full text-left grid px-4 py-2.5 transition-colors group"
            style={{ gridTemplateColumns: "1fr auto auto auto auto", gap: "1rem", borderBottom: i < Math.min(configs.length, 12) - 1 ? `1px solid ${SB.border}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span className="font-mono text-xs font-semibold truncate">{c.configuration}</span>
            <span className="self-center"><DirChip d={c.trend} /></span>
            <span className="text-xs font-mono self-center tabular-nums" style={{ color: SB.muted }}>{c.frequency}</span>
            <span className="text-xs font-mono self-center tabular-nums">${c.avgPrice.toLocaleString()}</span>
            <span className="text-xs self-center" style={{ color: SB.muted }}>${(c.priceRange.min / 1000).toFixed(0)}K–${(c.priceRange.max / 1000).toFixed(0)}K</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPPORTUNITIES TAB
// ═══════════════════════════════════════════════════════════════════════════════
const sizeOrder: Record<string, number> = { "very-large": 4, large: 3, medium: 2, small: 1 };
const OpportunitiesTab: React.FC<{ opportunities: EmergingOpportunity[]; onItemClick: (t: any, d: any) => void }> = ({ opportunities, onItemClick }) => {
  const sorted = [...opportunities].sort((a, b) => (sizeOrder[b.marketSize] ?? 0) - (sizeOrder[a.marketSize] ?? 0));
  return (
    <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
      <div className="grid px-4 py-2 text-[10px] uppercase tracking-wider" style={{ gridTemplateColumns: "1fr auto auto auto", gap: "1rem", color: SB.dim, borderBottom: `1px solid ${SB.border}` }}>
        <span>Opportunity</span><span>Size</span><span>Growth</span><span>Conf</span>
      </div>
      {sorted.map((o, i) => (
        <button
          key={i}
          onClick={() => onItemClick("opportunity", o)}
          className="w-full text-left grid px-4 py-3 transition-colors group"
          style={{ gridTemplateColumns: "1fr auto auto auto", gap: "1rem", borderBottom: i < sorted.length - 1 ? `1px solid ${SB.border}` : "none" }}
          onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div className="min-w-0">
            <div className="font-medium truncate">{o.opportunity}</div>
            <div className="text-xs mt-0.5 truncate" style={{ color: SB.muted }}>{o.description}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {o.industries.slice(0, 4).map((ind, j) => (
                <span key={j} className="text-[10px] px-1 py-px rounded" style={{ background: SB.border, color: SB.muted }}>{ind}</span>
              ))}
            </div>
          </div>
          <span className="self-center"><SizeTag s={o.marketSize} /></span>
          <span className="text-xs font-mono self-center tabular-nums" style={{ color: SB.green }}>+{o.growthRate.toFixed(1)}%</span>
          <ConfPct v={o.confidence} />
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
    <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
      <div className="grid px-4 py-2 text-[10px] uppercase tracking-wider" style={{ gridTemplateColumns: "auto 1fr auto auto auto", gap: "1rem", color: SB.dim, borderBottom: `1px solid ${SB.border}` }}>
        <span>#</span><span>Industry</span><span className="w-32">Adoption</span><span>Rate</span><span>YoY</span>
      </div>
      {adoption.map((a, i) => (
        <button
          key={i}
          onClick={() => onItemClick("adoption", a)}
          className="w-full text-left grid px-4 py-2.5 items-center transition-colors"
          style={{ gridTemplateColumns: "auto 1fr auto auto auto", gap: "1rem", borderBottom: i < adoption.length - 1 ? `1px solid ${SB.border}` : "none" }}
          onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span className="text-xs font-mono w-4" style={{ color: SB.dim }}>{a.ranking}</span>
          <span className="font-medium capitalize text-sm">{a.industry}</span>
          <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-1 rounded-full" style={{ background: SB.border }}>
              <div className="h-full rounded-full" style={{ width: `${(a.adoptionRate / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums">{a.adoptionRate.toFixed(1)}%</span>
          <span className="text-xs font-mono tabular-nums" style={{ color: a.growthRate > 0 ? SB.green : SB.red }}>
            {a.growthRate > 0 ? "+" : ""}{a.growthRate.toFixed(1)}%
          </span>
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING TAB
// ═══════════════════════════════════════════════════════════════════════════════
const PricingTab: React.FC<{
  recommendations: any[]; pendingApprovals: any[];
  onApprovalUpdate: () => void; onItemClick: (t: any, d: any) => void;
}> = ({ recommendations, pendingApprovals, onApprovalUpdate, onItemClick }) => {
  const approve = async (id: string) => {
    await supabase.from("pricing_update_approvals").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    onApprovalUpdate();
  };
  const reject = async (id: string) => {
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    await supabase.from("pricing_update_approvals").update({ status: "rejected", rejection_reason: reason, approved_at: new Date().toISOString() }).eq("id", id);
    onApprovalUpdate();
  };
  if (recommendations.length === 0 && pendingApprovals.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-xs" style={{ color: SB.muted }}>
        <Shield className="w-4 h-4" />All prices are within acceptable market ranges.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {pendingApprovals.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: SB.dim }}>Pending Approval ({pendingApprovals.length})</div>
          <div style={{ border: `1px solid ${SB.amber}44`, borderRadius: 4, overflow: "hidden" }}>
            {pendingApprovals.map((a, i) => (
              <div key={a.id} className="flex items-start gap-4 px-4 py-3" style={{ borderBottom: i < pendingApprovals.length - 1 ? `1px solid ${SB.border}` : "none", background: SB.amber + "08" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">{a.component}</span>
                    <Tag color={SB.amber}>{a.urgency}</Tag>
                  </div>
                  <div className="text-xs font-mono">
                    <span style={{ color: SB.muted }}>${a.current_value?.toFixed(2)}</span>
                    <span className="mx-2" style={{ color: SB.dim }}>→</span>
                    <span style={{ color: SB.green }}>${a.recommended_value?.toFixed(2)}</span>
                    <span className="ml-2" style={{ color: a.change_percent > 0 ? SB.green : SB.red }}>({a.change_percent > 0 ? "+" : ""}{a.change_percent?.toFixed(1)}%)</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: SB.muted }}>{a.reasoning}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approve(a.id)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: SB.green + "22", color: SB.green, border: `1px solid ${SB.green}44` }}>Approve</button>
                  <button onClick={() => reject(a.id)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: SB.red + "22", color: SB.red, border: `1px solid ${SB.red}44` }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {recommendations.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: SB.dim }}>Recommendations ({recommendations.length})</div>
          <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
            {recommendations.map((r, i) => (
              <button key={i} onClick={() => onItemClick("pricing", r)}
                className="w-full text-left flex items-start gap-4 px-4 py-3 transition-colors group"
                style={{ borderBottom: i < recommendations.length - 1 ? `1px solid ${SB.border}` : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">{r.component}</span>
                    <Tag color={r.urgency === "critical" ? SB.red : r.urgency === "high" ? SB.amber : SB.muted}>{r.urgency}</Tag>
                  </div>
                  <div className="text-xs font-mono">
                    <span style={{ color: SB.muted }}>${r.currentValue?.toFixed(2)}</span>
                    <span className="mx-2" style={{ color: SB.dim }}>→</span>
                    <span>${r.recommendedValue?.toFixed(2)}</span>
                    <span className="ml-2" style={{ color: r.changePercent > 0 ? SB.green : SB.red }}>({r.changePercent > 0 ? "+" : ""}{r.changePercent?.toFixed(1)}%)</span>
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: SB.muted }}>{r.reasoning}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 self-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: SB.muted }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEWS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const SOURCE_COLOR: Record<string, string> = {
  "Electrek": SB.green,
  "Wood Mackenzie": SB.blue,
  "Politico Energy": SB.violet,
};

const NewsTab: React.FC<{ headlines: Headline[]; loading: boolean }> = ({ headlines, loading }) => {
  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-xs" style={{ color: SB.muted }}>
      <RefreshCw className="w-3.5 h-3.5 animate-spin" />Fetching energy news…
    </div>
  );
  if (!headlines.length) return (
    <div className="flex items-center gap-2 py-6 text-xs" style={{ color: SB.muted }}>
      <Newspaper className="w-4 h-4" />No headlines loaded. RSS feeds may be temporarily unavailable.
    </div>
  );
  const bySource = headlines.reduce<Record<string, Headline[]>>((acc, h) => {
    (acc[h.source] ??= []).push(h);
    return acc;
  }, {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: SB.dim }}>
        <Clock className="w-3 h-3" />Live · Electrek · Wood Mackenzie · Politico Energy
      </div>
      {Object.entries(bySource).map(([source, items]) => (
        <div key={source}>
          <div className="flex items-center gap-2 mb-2">
            <Dot color={SOURCE_COLOR[source] ?? SB.muted} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: SOURCE_COLOR[source] ?? SB.muted }}>{source}</span>
          </div>
          <div style={{ border: `1px solid ${SB.border}`, borderRadius: 4, overflow: "hidden" }}>
            {items.map((h, i) => (
              <a
                key={i}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-2.5 transition-colors group"
                style={{ borderBottom: i < items.length - 1 ? `1px solid ${SB.border}` : "none", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = SB.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug" style={{ color: SB.text }}>{h.title}</div>
                  {h.date && (
                    <div className="text-[11px] mt-0.5" style={{ color: SB.dim }}>
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
                <ExternalLink className="w-3 h-3 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: SB.muted }} />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketIntelligenceDashboard;
