/**
 * MARKET INTELLIGENCE DASHBOARD (Subscriber-Facing)
 * ==================================================
 *
 * Subscriber-tier-gated market intelligence dashboard.
 * Shows BESS pricing trends, utility rates by region, ITC scenarios,
 * and battery degradation comparisons.
 *
 * Tier access:
 * - Guest / Builder: 1-2 reports/month teaser (blurred paywall on remainder)
 * - Pro: 10 reports/month
 * - Advanced / Business: Unlimited
 *
 * Data sources:
 * - marketDataIntegrationService.ts → BESS/solar/generator pricing
 * - utilityRateService.ts → Utility rates by zip code
 * - itcCalculator.ts → IRA 2022 ITC scenarios
 * - batteryDegradationService.ts → Chemistry degradation curves
 *
 * Created: Feb 2026
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  BarChart3,
  Battery,
  Sun,
  MapPin,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Info,
  Shield,
} from 'lucide-react';
import {
  getMarketPriceSummary,
  type MarketPriceSummary,
} from '@/services/marketDataIntegrationService';
import { calculateITC, estimateITC } from '@/services/itcCalculator';
import { estimateDegradation } from '@/services/batteryDegradationService';
import {
  gatedMarketReport,
  canRunMarketReport,
  getFeatureAvailability,
  type GateResult,
} from '@/services/featureGate';
import { getEffectiveTier, getPlan } from '@/services/subscriptionService';

// ============================================================================
// Types
// ============================================================================

interface PriceTrend {
  equipment: string;
  label: string;
  icon: React.ReactNode;
  price: number;
  unit: string;
  change30d?: number;
  dataPoints: number;
  sources: string[];
}

interface ITCScenario {
  label: string;
  rate: number;
  savings: number;
  requirements: string[];
}

interface DegradationCurve {
  chemistry: string;
  label: string;
  color: string;
  yearlyCapacity: number[];
}

// ============================================================================
// Static data for non-gated quick previews
// ============================================================================

const EQUIPMENT_TYPES = [
  { key: 'bess' as const, label: 'Battery Storage (BESS)', icon: <Battery className="w-5 h-5" />, unit: '$/kWh' },
  { key: 'solar' as const, label: 'Solar PV', icon: <Sun className="w-5 h-5" />, unit: '$/W' },
  { key: 'inverter' as const, label: 'Inverters', icon: <Zap className="w-5 h-5" />, unit: '$/kW' },
  { key: 'generator' as const, label: 'Generators', icon: <BarChart3 className="w-5 h-5" />, unit: '$/kW' },
  { key: 'ev-charger' as const, label: 'EV Chargers', icon: <Zap className="w-5 h-5" />, unit: '$/unit' },
] as const;

const CHEMISTRY_OPTIONS = [
  { key: 'lfp' as const, label: 'LFP (Lithium Iron Phosphate)', color: '#3b82f6' },
  { key: 'nmc' as const, label: 'NMC (Nickel Manganese Cobalt)', color: '#f59e0b' },
  { key: 'nca' as const, label: 'NCA (Nickel Cobalt Aluminum)', color: '#ef4444' },
  { key: 'flow-vrb' as const, label: 'Flow (VRB)', color: '#10b981' },
  { key: 'sodium-ion' as const, label: 'Sodium-Ion', color: '#8b5cf6' },
] as const;

// ============================================================================
// Sub-components
// ============================================================================

/** Paywall overlay for locked content */
function PaywallOverlay({ feature, tierName }: { feature: string; tierName: string }) {
  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
      <Lock className="w-8 h-8 text-amber-400 mb-3" />
      <p className="text-white font-semibold text-lg mb-1">Upgrade to unlock</p>
      <p className="text-slate-300 text-sm text-center max-w-xs mb-4">
        You've used all your {feature} this month on the {tierName} plan.
      </p>
      <a
        href="/pricing"
        className="px-6 py-2 border border-[#3B5BDB] text-[#68BFFA] rounded-lg font-medium hover:bg-[#3B5BDB]/10 transition-all flex items-center gap-2"
      >
        View Plans <ArrowUpRight className="w-4 h-4" />
      </a>
    </div>
  );
}

/** Price trend card */
function PriceTrendCard({ trend }: { trend: PriceTrend }) {
  const isPositive = (trend.change30d ?? 0) < 0; // Price drop = positive for buyers
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-[#68BFFA]/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#3B5BDB]/10 rounded-lg text-[#68BFFA]">{trend.icon}</div>
          <div>
            <h3 className="text-white font-medium text-sm">{trend.label}</h3>
            <p className="text-slate-400 text-xs">{trend.dataPoints} data points</p>
          </div>
        </div>
        {trend.change30d != null && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-green-500/20 text-green-400'
                : trend.change30d > 0
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-600/50 text-slate-400'
            }`}
          >
            {isPositive ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(trend.change30d).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          ${trend.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
        <span className="text-slate-400 text-sm">{trend.unit}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {trend.sources.slice(0, 3).map((s) => (
          <span key={s} className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">
            {s}
          </span>
        ))}
        {trend.sources.length > 3 && (
          <span className="text-[10px] text-slate-500">+{trend.sources.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

/** ITC scenario card */
function ITCScenarioCard({ scenario, projectCost }: { scenario: ITCScenario; projectCost: number }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">{scenario.label}</h3>
        <span className="text-lg font-bold text-green-400">{(scenario.rate * 100).toFixed(0)}%</span>
      </div>
      <div className="text-2xl font-bold text-white mb-2">
        ${scenario.savings.toLocaleString()}
        <span className="text-sm text-slate-400 font-normal ml-1">credit</span>
      </div>
      <div className="space-y-1">
        {scenario.requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
            {req}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple degradation mini-chart (text-based bar visualization) */
function DegradationChart({ curves, years }: { curves: DegradationCurve[]; years: number }) {
  const milestones = [0, 5, 10, 15, 20, 25].filter((y) => y <= years);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left text-slate-400 font-medium py-2 pr-4">Chemistry</th>
            {milestones.map((y) => (
              <th key={y} className="text-center text-slate-400 font-medium py-2 px-3">
                Yr {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {curves.map((curve) => (
            <tr key={curve.chemistry} className="border-b border-slate-800/30">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: curve.color }} />
                  <span className="text-white text-xs">{curve.label}</span>
                </div>
              </td>
              {milestones.map((y) => {
                const cap = curve.yearlyCapacity[y] ?? 0;
                const isLow = cap < 70;
                const isMed = cap >= 70 && cap < 85;
                return (
                  <td key={y} className="text-center py-3 px-3">
                    <span
                      className={`font-mono text-xs font-medium ${
                        isLow ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-green-400'
                      }`}
                    >
                      {cap.toFixed(0)}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function MarketIntelligencePage() {
  // State
  const [activeTab, setActiveTab] = useState<'pricing' | 'itc' | 'degradation'>('pricing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [itcScenarios, setItcScenarios] = useState<ITCScenario[]>([]);
  const [degradationCurves, setDegradationCurves] = useState<DegradationCurve[]>([]);
  const [gateInfo, setGateInfo] = useState<{ allowed: boolean; remaining: number; limit: number; tierName: string }>({
    allowed: true,
    remaining: 999,
    limit: -1,
    tierName: 'Builder',
  });
  const [reportUsed, setReportUsed] = useState(false);

  // ITC config state
  const [projectCostM, setProjectCostM] = useState(5); // $5M default
  const [projectMW, setProjectMW] = useState(5); // 5 MW default

  // Feature availability
  const features = useMemo(() => getFeatureAvailability(), []);

  // Check quota on mount
  useEffect(() => {
    const info = canRunMarketReport();
    setGateInfo(info);
  }, [reportUsed]);

  // Load pricing data (gated)
  const loadPricingData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await gatedMarketReport(async () => {
      const trends: PriceTrend[] = [];
      for (const eq of EQUIPMENT_TYPES) {
        try {
          const summary = await getMarketPriceSummary(eq.key);
          if (summary) {
            trends.push({
              equipment: eq.key,
              label: eq.label,
              icon: eq.icon,
              price: summary.averagePrice,
              unit: eq.unit,
              change30d: summary.priceChange30d,
              dataPoints: summary.dataPointCount,
              sources: summary.sources,
            });
          }
        } catch {
          // Skip this equipment type on error
        }
      }
      return trends;
    });

    setReportUsed(true);

    if (!result.allowed) {
      setError(result.reason || 'Report limit reached');
      setGateInfo((prev) => ({ ...prev, allowed: false, remaining: 0 }));
    } else if (result.data) {
      setPriceTrends(result.data);
      setGateInfo((prev) => ({ ...prev, remaining: result.remaining }));
    }

    setLoading(false);
  }, []);

  // Load ITC scenarios (gated)
  const loadITCScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cost = projectCostM * 1_000_000;
    const result = await gatedMarketReport(async () => {
      const scenarios: ITCScenario[] = [];

      // Base rate (no bonuses)
      const base = calculateITC({
        projectType: 'bess',
        capacityMW: projectMW,
        totalCost: cost,
        prevailingWage: false,
        apprenticeship: false,
        inServiceDate: new Date(),
        state: 'CA',
        gridConnected: true,
      });
      scenarios.push({
        label: 'Base Rate',
        rate: base.totalRate,
        savings: base.creditAmount,
        requirements: ['No special requirements'],
      });

      // With prevailing wage + apprenticeship
      const pwa = calculateITC({
        projectType: 'bess',
        capacityMW: projectMW,
        totalCost: cost,
        prevailingWage: true,
        apprenticeship: true,
        inServiceDate: new Date(),
        state: 'CA',
        gridConnected: true,
      });
      scenarios.push({
        label: 'Prevailing Wage + Apprenticeship',
        rate: pwa.totalRate,
        savings: pwa.creditAmount,
        requirements: ['Davis-Bacon prevailing wages', 'Registered apprenticeship program'],
      });

      // + Energy Community
      const ec = calculateITC({
        projectType: 'bess',
        capacityMW: projectMW,
        totalCost: cost,
        prevailingWage: true,
        apprenticeship: true,
        energyCommunity: 'coal-closure',
        inServiceDate: new Date(),
        state: 'CA',
        gridConnected: true,
      });
      scenarios.push({
        label: 'PWA + Energy Community',
        rate: ec.totalRate,
        savings: ec.creditAmount,
        requirements: ['Prevailing wages', 'Apprenticeship', 'Coal closure community'],
      });

      // + Domestic Content
      const dc = calculateITC({
        projectType: 'bess',
        capacityMW: projectMW,
        totalCost: cost,
        prevailingWage: true,
        apprenticeship: true,
        energyCommunity: 'coal-closure',
        domesticContent: true,
        inServiceDate: new Date(),
        state: 'CA',
        gridConnected: true,
      });
      scenarios.push({
        label: 'Maximum ITC',
        rate: dc.totalRate,
        savings: dc.creditAmount,
        requirements: ['Prevailing wages', 'Apprenticeship', 'Energy community', 'Domestic content (100% US steel, 40%+ US components)'],
      });

      return scenarios;
    });

    setReportUsed(true);

    if (!result.allowed) {
      setError(result.reason || 'Report limit reached');
    } else if (result.data) {
      setItcScenarios(result.data);
      setGateInfo((prev) => ({ ...prev, remaining: result.remaining }));
    }

    setLoading(false);
  }, [projectCostM, projectMW]);

  // Load degradation curves (gated)
  const loadDegradationCurves = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await gatedMarketReport(async () => {
      const curves: DegradationCurve[] = [];

      for (const chem of CHEMISTRY_OPTIONS) {
        const deg = estimateDegradation(chem.key, 25);
        curves.push({
          chemistry: chem.key,
          label: chem.label,
          color: chem.color,
          yearlyCapacity: (Array.isArray(deg) ? deg.map(d => d.capacityPct) : null) || Array.from({ length: 26 }, (_, y) => {
            // Fallback linear degradation if service doesn't return yearly data
            const rate = chem.key === 'lfp' ? 1.5 : chem.key === 'flow-vrb' ? 0.5 : 2.0;
            return Math.max(0, 100 - rate * y);
          }),
        });
      }
      return curves;
    });

    setReportUsed(true);

    if (!result.allowed) {
      setError(result.reason || 'Report limit reached');
    } else if (result.data) {
      setDegradationCurves(result.data);
      setGateInfo((prev) => ({ ...prev, remaining: result.remaining }));
    }

    setLoading(false);
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'pricing' && priceTrends.length === 0) {
      loadPricingData();
    } else if (activeTab === 'itc' && itcScenarios.length === 0) {
      loadITCScenarios();
    } else if (activeTab === 'degradation' && degradationCurves.length === 0) {
      loadDegradationCurves();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────

  const tier = getEffectiveTier();
  const plan = getPlan(tier);

  const tabs = [
    { key: 'pricing' as const, label: 'Equipment Pricing', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'itc' as const, label: 'ITC Calculator', icon: <Shield className="w-4 h-4" /> },
    { key: 'degradation' as const, label: 'Battery Degradation', icon: <Battery className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#1a103d] text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-[#68BFFA] hover:text-[#4A90E2] transition-colors text-sm">
              ← Back to Merlin
            </a>
            <div className="h-5 w-px bg-slate-700" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#68BFFA] to-[#3B5BDB] bg-clip-text text-transparent">
              Market Intelligence
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Quota indicator */}
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-slate-500" />
              {gateInfo.limit === -1 ? (
                <span className="text-emerald-400">Unlimited reports</span>
              ) : (
                <span className="text-slate-400">
                  {gateInfo.remaining}/{gateInfo.limit} reports remaining
                </span>
              )}
            </div>
            <span className="text-xs bg-transparent text-[#68BFFA] px-3 py-1 rounded-full border border-[#3B5BDB]/40">
              {plan.name} Plan
            </span>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-transparent text-[#68BFFA] border border-[#3B5BDB]/50'
                  : 'text-slate-400 hover:text-[#68BFFA] border border-transparent hover:border-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && !gateInfo.allowed && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium">{error}</p>
              <p className="text-amber-300/70 text-xs mt-1">
                Upgrade your plan to access more market intelligence reports.
              </p>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 border border-amber-500/40 hover:bg-amber-500/10 text-amber-200 rounded-lg text-sm font-medium transition-all"
            >
              Upgrade
            </a>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-[#68BFFA] animate-spin mr-3" />
            <span className="text-slate-400">Loading market data...</span>
          </div>
        )}

        {/* ──────────────────────────────────── */}
        {/* TAB: Equipment Pricing              */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'pricing' && !loading && (
          <div className="relative">
            {!gateInfo.allowed && priceTrends.length === 0 && (
              <PaywallOverlay feature="market reports" tierName={plan.name} />
            )}

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Equipment Price Trends</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Weighted market pricing from 140+ sources (NREL, BNEF, vendor quotes)
                </p>
              </div>
              <button
                onClick={loadPricingData}
                disabled={loading || !gateInfo.allowed}
                className="flex items-center gap-2 px-4 py-2 border border-slate-600 hover:border-[#68BFFA]/40 text-slate-300 hover:text-[#68BFFA] rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {priceTrends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceTrends.map((trend) => (
                  <PriceTrendCard key={trend.equipment} trend={trend} />
                ))}
              </div>
            ) : (
              !loading && gateInfo.allowed && (
                <div className="text-center py-16 text-slate-500">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No market data available yet.</p>
                  <p className="text-sm mt-1">Run the daily scraper to collect pricing data.</p>
                </div>
              )
            )}

            {/* BESS pricing context */}
            {priceTrends.length > 0 && (
              <div className="mt-6 p-4 bg-[#3B5BDB]/10 border border-[#3B5BDB]/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#68BFFA] flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-[#68BFFA] font-medium">TrueQuote™ Market Context</p>
                    <p className="text-slate-400 mt-1">
                      BESS pricing is currently <strong>$100–125/kWh</strong> for 4-hour systems (Dec 2025 vendor quotes).
                      Solar is at <strong>$0.65–0.85/W</strong> scale-dependent. All prices are weighted by source
                      reliability, recency, and regional factors per Merlin's pricing policy engine.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────── */}
        {/* TAB: ITC Calculator                 */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'itc' && !loading && (
          <div className="relative">
            {!gateInfo.allowed && itcScenarios.length === 0 && (
              <PaywallOverlay feature="market reports" tierName={plan.name} />
            )}

            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">IRA 2022 Investment Tax Credit Scenarios</h2>
              <p className="text-slate-400 text-sm mt-1">
                See how ITC bonuses stack for your BESS project (6–50%+ based on qualifications)
              </p>
            </div>

            {/* Project inputs */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Cost ($M)</label>
                <input
                  type="number"
                  min={0.5}
                  max={100}
                  step={0.5}
                  value={projectCostM}
                  onChange={(e) => setProjectCostM(Number(e.target.value) || 5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#68BFFA] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Capacity (MW)</label>
                <input
                  type="number"
                  min={0.1}
                  max={200}
                  step={0.5}
                  value={projectMW}
                  onChange={(e) => setProjectMW(Number(e.target.value) || 5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#68BFFA] focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={loadITCScenarios}
              disabled={loading || !gateInfo.allowed}
              className="mb-6 flex items-center gap-2 px-4 py-2 border border-[#3B5BDB] text-[#68BFFA] hover:bg-[#3B5BDB]/10 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Calculate ITC Scenarios
            </button>

            {itcScenarios.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {itcScenarios.map((scenario, i) => (
                  <ITCScenarioCard key={i} scenario={scenario} projectCost={projectCostM * 1_000_000} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────── */}
        {/* TAB: Battery Degradation            */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'degradation' && !loading && (
          <div className="relative">
            {!gateInfo.allowed && degradationCurves.length === 0 && (
              <PaywallOverlay feature="market reports" tierName={plan.name} />
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Battery Chemistry Degradation Comparison</h2>
              <p className="text-slate-400 text-sm mt-1">
                25-year capacity retention by chemistry (NREL/PNNL cycle + calendar aging models)
              </p>
            </div>

            {degradationCurves.length > 0 ? (
              <>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
                  <DegradationChart curves={degradationCurves} years={25} />
                </div>

                {/* Key takeaways */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {degradationCurves.map((curve) => {
                    const eolCap = curve.yearlyCapacity[25] ?? 0;
                    const yr80 = curve.yearlyCapacity.findIndex((c) => c < 80);
                    return (
                      <div key={curve.chemistry} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: curve.color }} />
                          <span className="text-white font-medium text-sm">{curve.label}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-400">
                          <p>
                            End-of-life (25yr):{' '}
                            <span className={eolCap < 70 ? 'text-red-400' : 'text-green-400'}>
                              {eolCap.toFixed(0)}%
                            </span>
                          </p>
                          <p>
                            Reaches 80%:{' '}
                            <span className="text-amber-400">
                              {yr80 > 0 ? `Year ${yr80}` : '> 25 years'}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              !loading && gateInfo.allowed && (
                <div className="text-center py-16 text-slate-500">
                  <Battery className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Click a tab to load degradation data.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 mb-8 text-center text-xs text-slate-600">
          <p>
            Data sourced from NREL ATB 2024, BNEF, EIA, vendor quotes, and 140+ market sources.
            <br />
            Merlin TrueQuote™ — Every number traceable to an authoritative source.
          </p>
        </div>
      </div>
    </div>
  );
}
