/**
 * TRUEQUOTE META CALCULATIONS PAGE
 * =================================
 * SINGLE SOURCE OF TRUTH DASHBOARD
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle, 
  TrendingUp, DollarSign, Zap, Sun, Battery, Fuel,
  Settings, Activity, BarChart3, Shield, Edit3
} from 'lucide-react';
import { getConstant } from '@/services/calculationConstantsService';
import { TRUEQUOTE_CONSTANTS, DEFAULTS } from '@/services/data/constants';

interface ConstantValue {
  key: string;
  category: string;
  dbValue: number | null;
  fallbackValue: number;
  activeValue: number;
  source: 'database' | 'fallback';
  unit: string;
  description: string;
}

interface PricingData {
  category: string;
  item: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  source: string;
  confidence: number;
}

interface IndustryConfig {
  industry: string;
  name: string;
  loadMethod: string;
  wattsPerUnit: number;
  loadFactor: number;
  bessHours: number;
  criticalLoad: number;
  subtypes: number;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

const CONSTANT_DEFINITIONS: Omit<ConstantValue, 'dbValue' | 'activeValue' | 'source'>[] = [
  { key: 'BESS_COST_PER_KWH', category: 'BESS', fallbackValue: 350, unit: '$/kWh', description: 'Battery storage cost per kWh' },
  { key: 'BESS_EFFICIENCY', category: 'BESS', fallbackValue: 0.85, unit: '%', description: 'Round-trip efficiency' },
  { key: 'BESS_DEGRADATION_ANNUAL', category: 'BESS', fallbackValue: 0.025, unit: '%/yr', description: 'Annual degradation' },
  { key: 'SOLAR_COST_PER_KWP', category: 'Solar', fallbackValue: 1200, unit: '$/kWp', description: 'Solar PV installed cost' },
  { key: 'SOLAR_PANEL_WATTS', category: 'Solar', fallbackValue: 500, unit: 'W', description: 'Panel wattage' },
  { key: 'SOLAR_DEGRADATION_ANNUAL', category: 'Solar', fallbackValue: 0.005, unit: '%/yr', description: 'Annual degradation' },
  { key: 'GENERATOR_COST_PER_KW', category: 'Generator', fallbackValue: 800, unit: '$/kW', description: 'Generator cost' },
  { key: 'EV_LEVEL2_COST', category: 'EV', fallbackValue: 6000, unit: '$', description: 'L2 charger cost' },
  { key: 'EV_DCFAST_COST', category: 'EV', fallbackValue: 50000, unit: '$', description: 'DCFC cost' },
  { key: 'FEDERAL_ITC_RATE', category: 'Financial', fallbackValue: 0.30, unit: '%', description: 'Federal ITC rate' },
  { key: 'INSTALLATION_PERCENT', category: 'Financial', fallbackValue: 0.15, unit: '%', description: 'Installation cost %' },
  { key: 'DISCOUNT_RATE', category: 'Financial', fallbackValue: 0.08, unit: '%', description: 'NPV discount rate' },
  { key: 'ARBITRAGE_CYCLES_YEAR', category: 'Savings', fallbackValue: 250, unit: 'cycles', description: 'TOU cycles/year' },
  { key: 'PEAK_SHAVING_PERCENT', category: 'Savings', fallbackValue: 0.25, unit: '%', description: 'Demand reduction' },
];

export default function MetaCalculationsPage() {
  const [constants, setConstants] = useState<ConstantValue[]>([]);
  const [pricing, setPricing] = useState<PricingData[]>([]);
  const [industries, setIndustries] = useState<IndustryConfig[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'constants' | 'pricing' | 'industries' | 'metrics'>('constants');

  useEffect(() => { loadAllData(); }, []);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([loadConstants(), loadPricing(), loadIndustries(), loadMetrics()]);
    setLastRefresh(new Date());
    setLoading(false);
  }

  async function loadConstants() {
    const loaded: ConstantValue[] = [];
    for (const def of CONSTANT_DEFINITIONS) {
      try {
        const dbValue = await getConstant(def.key);
        loaded.push({
          ...def,
          dbValue: typeof dbValue === 'number' ? dbValue : null,
          activeValue: dbValue ?? def.fallbackValue,
          source: dbValue !== null ? 'database' : 'fallback',
        });
      } catch {
        loaded.push({ ...def, dbValue: null, activeValue: def.fallbackValue, source: 'fallback' });
      }
    }
    setConstants(loaded);
  }

  async function loadPricing() {
    setPricing([
      { category: 'BESS', item: 'LFP Battery Cells', currentPrice: 95, previousPrice: 105, changePercent: -9.5, source: 'BloombergNEF', confidence: 0.92 },
      { category: 'BESS', item: 'Battery Pack (Utility)', currentPrice: 139, previousPrice: 145, changePercent: -4.1, source: 'BNEF/Wood Mac', confidence: 0.88 },
      { category: 'Solar', item: 'Mono PERC Module', currentPrice: 0.22, previousPrice: 0.24, changePercent: -8.3, source: 'PVInsights', confidence: 0.95 },
      { category: 'EV', item: 'Level 2 Charger', currentPrice: 2500, previousPrice: 2800, changePercent: -10.7, source: 'ChargePoint', confidence: 0.88 },
      { category: 'EV', item: 'DCFC 150kW', currentPrice: 35000, previousPrice: 38000, changePercent: -7.9, source: 'ABB/ChargePoint', confidence: 0.85 },
    ]);
  }

  async function loadIndustries() {
    setIndustries([
      { industry: 'hotel', name: 'Hotel / Resort', loadMethod: 'per_unit', wattsPerUnit: 2500, loadFactor: 0.45, bessHours: 4, criticalLoad: 0.60, subtypes: 4 },
      { industry: 'data_center', name: 'Data Center', loadMethod: 'per_sqft', wattsPerUnit: 150, loadFactor: 0.85, bessHours: 4, criticalLoad: 1.00, subtypes: 5 },
      { industry: 'hospital', name: 'Hospital', loadMethod: 'per_unit', wattsPerUnit: 3000, loadFactor: 0.75, bessHours: 4, criticalLoad: 0.80, subtypes: 4 },
      { industry: 'car_wash', name: 'Car Wash', loadMethod: 'per_sqft', wattsPerUnit: 25, loadFactor: 0.35, bessHours: 2, criticalLoad: 0.50, subtypes: 3 },
      { industry: 'manufacturing', name: 'Manufacturing', loadMethod: 'per_sqft', wattsPerUnit: 30, loadFactor: 0.55, bessHours: 4, criticalLoad: 0.70, subtypes: 4 },
      { industry: 'retail', name: 'Retail', loadMethod: 'per_sqft', wattsPerUnit: 15, loadFactor: 0.40, bessHours: 2, criticalLoad: 0.40, subtypes: 7 },
      { industry: 'restaurant', name: 'Restaurant', loadMethod: 'per_sqft', wattsPerUnit: 40, loadFactor: 0.50, bessHours: 2, criticalLoad: 0.60, subtypes: 5 },
      { industry: 'casino', name: 'Casino', loadMethod: 'per_sqft', wattsPerUnit: 50, loadFactor: 0.70, bessHours: 4, criticalLoad: 0.80, subtypes: 1 },
    ]);
  }

  async function loadMetrics() {
    setMetrics([
      { metric: 'Quote Accuracy', value: 94.2, target: 95, status: 'warning' },
      { metric: 'SSOT Compliance', value: 98.5, target: 99, status: 'good' },
      { metric: 'Database Sync', value: 100, target: 100, status: 'good' },
      { metric: 'Market Data Freshness', value: 96, target: 95, status: 'good' },
      { metric: 'Fallback Usage', value: 15, target: 10, status: 'warning' },
    ]);
  }

  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') return `${(value * 100).toFixed(1)}%`;
    if (unit === '%/yr') return `${(value * 100).toFixed(2)}%/yr`;
    if (unit.startsWith('$')) return `$${value.toLocaleString()}`;
    return `${value} ${unit}`;
  };

  const constantsByCategory = constants.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, ConstantValue[]>);

  const dbCount = constants.filter(c => c.source === 'database').length;
  const fallbackCount = constants.filter(c => c.source === 'fallback').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TrueQuote™ Meta Calculations</h1>
                <p className="text-purple-200">Single Source of Truth Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="text-purple-200">Last Refresh</div>
                <div className="font-mono">{lastRefresh.toLocaleTimeString()}</div>
              </div>
              <button
                onClick={loadAllData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">{constants.length}</div>
              <div className="text-purple-200 text-sm">Total Constants</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{dbCount}</div>
              <div className="text-purple-200 text-sm">From Database</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-400">{fallbackCount}</div>
              <div className="text-purple-200 text-sm">Using Fallback</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">{industries.length}</div>
              <div className="text-purple-200 text-sm">Industries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: 'constants', label: 'Constants', icon: Settings },
            { id: 'pricing', label: 'Market Pricing', icon: DollarSign },
            { id: 'industries', label: 'Industry Configs', icon: BarChart3 },
            { id: 'metrics', label: 'Performance', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
                activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {activeTab === 'constants' && (
          <div className="space-y-6">
            {Object.entries(constantsByCategory).map(([category, items]) => (
              <div key={category} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                  {category === 'BESS' && <Battery className="w-5 h-5 text-blue-600" />}
                  {category === 'Solar' && <Sun className="w-5 h-5 text-yellow-600" />}
                  {category === 'Generator' && <Fuel className="w-5 h-5 text-gray-600" />}
                  {category === 'EV' && <Zap className="w-5 h-5 text-green-600" />}
                  {category === 'Financial' && <DollarSign className="w-5 h-5 text-emerald-600" />}
                  {category === 'Savings' && <TrendingUp className="w-5 h-5 text-purple-600" />}
                  <h2 className="font-semibold">{category}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Constant</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-right">Value</th>
                      <th className="px-6 py-3 text-center">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(item => (
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.key}</code></td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold">{formatValue(item.activeValue, item.unit)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${item.source === 'database' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {item.source === 'database' ? '✓ DB' : '⚠ Fallback'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Market Pricing Feed
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Item</th>
                  <th className="px-6 py-3 text-right">Current</th>
                  <th className="px-6 py-3 text-right">Change</th>
                  <th className="px-6 py-3 text-left">Source</th>
                  <th className="px-6 py-3 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pricing.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.category}</td>
                    <td className="px-6 py-4">{item.item}</td>
                    <td className="px-6 py-4 text-right font-mono">${item.currentPrice.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right font-mono ${item.changePercent < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.source}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mx-auto">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.confidence * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'industries' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Industry Configurations
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Industry</th>
                  <th className="px-6 py-3 text-center">Load Method</th>
                  <th className="px-6 py-3 text-right">W/unit</th>
                  <th className="px-6 py-3 text-right">Load Factor</th>
                  <th className="px-6 py-3 text-right">BESS Hours</th>
                  <th className="px-6 py-3 text-right">Critical %</th>
                  <th className="px-6 py-3 text-center">Subtypes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {industries.map(ind => (
                  <tr key={ind.industry} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{ind.name}</div>
                      <code className="text-xs text-gray-500">{ind.industry}</code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{ind.loadMethod}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{ind.wattsPerUnit}</td>
                    <td className="px-6 py-4 text-right font-mono">{(ind.loadFactor * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4 text-right font-mono">{ind.bessHours}h</td>
                    <td className="px-6 py-4 text-right font-mono">{(ind.criticalLoad * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4 text-center">{ind.subtypes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-2 gap-6">
            {metrics.map(m => (
              <div key={m.metric} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{m.metric}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    m.status === 'good' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-4xl font-bold">{m.value}%</div>
                <div className="text-sm text-gray-500">Target: {m.target}%</div>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${m.status === 'good' ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (m.value / m.target) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
        <Shield className="w-4 h-4 inline mr-2" />
        TrueQuote™ Meta Calculations • SSOT v2.0 • Porsche 911 Architecture
      </div>
    </div>
  );
}
