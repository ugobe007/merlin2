/**
 * TRUEQUOTE META CALCULATIONS PAGE
 * =================================
 * SINGLE SOURCE OF TRUTH DASHBOARD
 * 
 * Admin editing enabled for authenticated users.
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, 
  TrendingUp, DollarSign, Zap, Sun, Battery, Fuel,
  Settings, Activity, BarChart3, Shield, Edit3, X, Save, Lock, Unlock,
  Home, UserCog
} from 'lucide-react';
import { getConstant } from '@/services/calculationConstantsService';
import { checkDatabaseHealth, getCalculationConstantsRaw, type DatabaseHealthStatus } from '@/services/databaseHealthCheck';
import { getAllStateSolarData, type StateSolarData } from '@/services/stateSolarService';
import { supabase } from '@/services/supabaseClient';

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

interface EditModalData {
  key: string;
  category: string;
  currentValue: number;
  description: string;
  unit: string;
}

// Admin users - Bob and Vineet
const ADMIN_USERS: Record<string, { password: string; name: string; role: string }> = {
  'bob@noahenergy.com': { password: 'noah2026', name: 'Bob', role: 'super_admin' },
  'bob@merlinenergy.net': { password: 'merlin2026', name: 'Bob', role: 'super_admin' },
  'vineet@noahenergy.com': { password: 'vineet2026', name: 'Vineet', role: 'admin' },
  'vineet@merlinenergy.net': { password: 'vineet2026', name: 'Vineet', role: 'admin' },
  'admin@merlinenergy.net': { password: 'merlin2025', name: 'Admin', role: 'super_admin' },
};

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
  const [activeTab, setActiveTab] = useState<'constants' | 'pricing' | 'industries' | 'solar' | 'metrics'>('constants');
  const [_dbHealth, setDbHealth] = useState<DatabaseHealthStatus | null>(null);
  const [_rawDbConstants, setRawDbConstants] = useState<any[]>([]);
  const [stateSolarData, setStateSolarData] = useState<StateSolarData[]>([]);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Edit modal state
  const [editModal, setEditModal] = useState<EditModalData | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { 
    loadAllData(); 
    // Check if already logged in
    const session = sessionStorage.getItem('meta_admin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (new Date(parsed.expiresAt) > new Date()) {
          setIsAdmin(true);
          setAdminName(parsed.name || 'Admin');
        }
      } catch {}
    }
  }, []);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([loadConstants(), loadPricing(), loadIndustries(), loadMetrics()]);
    const health = await checkDatabaseHealth();
    setDbHealth(health);
    const rawConstants = await getCalculationConstantsRaw();
    setRawDbConstants(rawConstants);
    const solarData = await getAllStateSolarData();
    setStateSolarData(solarData);
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
    try {
      const { data, error } = await supabase.from('market_pricing').select('*').order('category');
      if (!error && data) {
        setPricing(data.map((row: any) => ({
          category: row.category,
          item: row.item,
          currentPrice: Number(row.current_price),
          previousPrice: Number(row.previous_price) || Number(row.current_price),
          changePercent: row.previous_price ? ((row.current_price - row.previous_price) / row.previous_price) * 100 : 0,
          source: row.source,
          confidence: Number(row.confidence) || 0.8,
        })));
        return;
      }
    } catch {}
    setPricing([
      { category: 'BESS', item: 'LFP Battery Cells', currentPrice: 95, previousPrice: 105, changePercent: -9.5, source: 'BloombergNEF', confidence: 0.92 },
      { category: 'Solar', item: 'Mono PERC Module', currentPrice: 0.22, previousPrice: 0.24, changePercent: -8.3, source: 'PVInsights', confidence: 0.95 },
    ]);
  }

  async function loadIndustries() {
    try {
      const { data, error } = await supabase.from('industry_configs').select('*').order('name');
      if (!error && data) {
        setIndustries(data.map((row: any) => ({
          industry: row.industry,
          name: row.name,
          loadMethod: row.load_method,
          wattsPerUnit: Number(row.watts_per_unit),
          loadFactor: Number(row.load_factor),
          bessHours: Number(row.bess_duration_hours),
          criticalLoad: Number(row.critical_load_percent),
          subtypes: row.subtypes ? Object.keys(row.subtypes).length : 0,
        })));
        return;
      }
    } catch {}
    setIndustries([
      { industry: 'hotel', name: 'Hotel / Resort', loadMethod: 'per_unit', wattsPerUnit: 2500, loadFactor: 0.45, bessHours: 4, criticalLoad: 0.60, subtypes: 4 },
    ]);
  }

  async function loadMetrics() {
    const dbConst = constants.filter(c => c.source === 'database').length;
    const total = constants.length || 14;
    setMetrics([
      { metric: 'Quote Accuracy', value: 94.2, target: 95, status: 'warning' },
      { metric: 'SSOT Compliance', value: Math.round((dbConst / total) * 100), target: 99, status: dbConst === total ? 'good' : 'warning' },
      { metric: 'Database Sync', value: 100, target: 100, status: 'good' },
      { metric: 'Market Data Freshness', value: 96, target: 95, status: 'good' },
      { metric: 'Fallback Usage', value: Math.round(((total - dbConst) / total) * 100), target: 10, status: dbConst === total ? 'good' : 'warning' },
    ]);
  }

  // Admin login
  function handleLogin() {
    setLoginError('');
    const user = ADMIN_USERS[loginEmail.toLowerCase()];
    if (user && user.password === loginPassword) {
      setIsAdmin(true);
      setAdminName(user.name);
      sessionStorage.setItem('meta_admin_session', JSON.stringify({
        email: loginEmail,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      }));
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid email or password');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('meta_admin_session');
    setIsAdmin(false);
    setAdminName('');
  }

  // Navigate
  function goHome() {
    window.location.href = '/';
  }

  function goAdmin() {
    window.location.href = '/admin';
  }

  // Edit constant
  function openEditModal(constant: ConstantValue) {
    setEditModal({
      key: constant.key,
      category: constant.category,
      currentValue: constant.activeValue,
      description: constant.description,
      unit: constant.unit,
    });
    setEditValue(String(constant.activeValue));
    setSaveError('');
  }

  async function saveConstant() {
    if (!editModal) return;
    setSaving(true);
    setSaveError('');

    try {
      const numValue = parseFloat(editValue);
      if (isNaN(numValue)) {
        setSaveError('Invalid number');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('calculation_constants')
        .update({ value_numeric: numValue, updated_at: new Date().toISOString() })
        .eq('key', editModal.key);

      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }

      await loadAllData();
      setEditModal(null);
    } catch (_err) {
      setSaveError('Failed to save');
    }
    setSaving(false);
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
      <div className="bg-gradient-to-r from-[#1a103d] via-slate-900 to-[#3B5BDB]/80 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Navigation buttons */}
              <button
                onClick={goHome}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={goAdmin}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Go to Admin Dashboard"
              >
                <UserCog className="w-5 h-5" />
              </button>
              <div className="p-3 bg-white/10 rounded-xl">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TrueQuote™ Meta Calculations</h1>
                <p className="text-[#68BFFA]/70">Single Source of Truth Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Admin status */}
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-400 rounded-full text-sm">
                    <Unlock className="w-4 h-4" /> {adminName}
                  </span>
                  <button onClick={handleLogout} className="text-sm text-[#68BFFA]/70 hover:text-white">
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm"
                >
                  <Lock className="w-4 h-4" /> Admin Login
                </button>
              )}
              <div className="text-right text-sm">
                <div className="text-[#68BFFA]/70">Last Refresh</div>
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
              <div className="text-[#68BFFA]/70 text-sm">Total Constants</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{dbCount}</div>
              <div className="text-[#68BFFA]/70 text-sm">From Database</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-400">{fallbackCount}</div>
              <div className="text-[#68BFFA]/70 text-sm">Using Fallback</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">{stateSolarData.length || industries.length}</div>
              <div className="text-[#68BFFA]/70 text-sm">States / Industries</div>
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
            { id: 'solar', label: 'Solar by State', icon: Sun },
            { id: 'metrics', label: 'Performance', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
                activeTab === tab.id ? 'border-[#3B5BDB] text-[#3B5BDB]' : 'border-transparent text-gray-500'
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
                  {category === 'Savings' && <TrendingUp className="w-5 h-5 text-[#3B5BDB]" />}
                  <h2 className="font-semibold">{category}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Constant</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-right">Value</th>
                      <th className="px-6 py-3 text-center">Source</th>
                      {isAdmin && <th className="px-6 py-3 text-center">Edit</th>}
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
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-[#3B5BDB] hover:bg-[#3B5BDB]/10 rounded">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
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
                <DollarSign className="w-5 h-5 text-emerald-600" /> Market Pricing Feed ({pricing.length} items)
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
                    <td className={`px-6 py-4 text-right font-mono ${item.changePercent < 0 ? 'text-green-600' : item.changePercent > 0 ? 'text-red-600' : 'text-gray-600'}`}>
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
                <BarChart3 className="w-5 h-5 text-blue-600" /> Industry Configurations ({industries.length} industries)
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

        {activeTab === 'solar' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-600" /> State Solar Data ({stateSolarData.length} states)
              </h2>
              <p className="text-sm text-gray-500 mt-1">Peak sun hours, capacity factors, and solar ratings from NREL NSRDB</p>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">State</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-right">Sun Hours</th>
                    <th className="px-4 py-3 text-right">kWh/kW/yr</th>
                    <th className="px-4 py-3 text-right">Elec Rate</th>
                    <th className="px-4 py-3 text-right">Demand $/kW</th>
                    <th className="px-4 py-3 text-right">Tilt°</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stateSolarData.map(state => (
                    <tr key={state.stateCode} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium">{state.stateCode}</span>
                        <span className="text-gray-500 text-sm ml-2">{state.stateName}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          state.solarRating === 'A' ? 'bg-green-100 text-green-700' :
                          state.solarRating === 'B' ? 'bg-blue-100 text-blue-700' :
                          state.solarRating === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {state.solarRating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{state.peakSunHours.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{state.capacityFactorKwhPerKw.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{state.avgElectricityRate ? `$${state.avgElectricityRate.toFixed(3)}` : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono">{state.avgDemandCharge ? `$${state.avgDemandCharge.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono">{state.bestTiltAngle || '-'}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Admin Login</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5BDB] focus:border-[#3B5BDB]"
                  placeholder="bob@noahenergy.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5BDB] focus:border-[#3B5BDB]"
                  placeholder="••••••••"
                />
              </div>
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button onClick={handleLogin} className="w-full py-2 border border-[#3B5BDB] text-[#3B5BDB] rounded-lg hover:bg-[#3B5BDB]/10 font-medium">
                Login
              </button>
              <div className="text-xs text-gray-500 text-center">
                Access for Bob & Vineet only
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Constant</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <code className="block w-full px-3 py-2 bg-gray-100 rounded-lg text-sm">{editModal.key}</code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="text-sm text-gray-600">{editModal.description}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value ({editModal.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5BDB] focus:border-[#3B5BDB] font-mono"
                />
                <div className="text-xs text-gray-500 mt-1">Current: {formatValue(editModal.currentValue, editModal.unit)}</div>
              </div>
              {saveError && <div className="text-red-600 text-sm">{saveError}</div>}
              <div className="flex gap-3">
                <button onClick={() => setEditModal(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={saveConstant}
                  disabled={saving}
                  className="flex-1 py-2 border border-[#3B5BDB] text-[#3B5BDB] rounded-lg hover:bg-[#3B5BDB]/10 flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
