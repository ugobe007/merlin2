import React, { useState, useEffect } from 'react';
import { Home, Users, Settings, TrendingUp, Database, Zap, Shield, BarChart3, Server, Cpu, Activity, CheckCircle, AlertTriangle, Clock, DollarSign, FileText, Sparkles, RefreshCw, Star, Crown, Play, Pause, Eye, Brain, BarChart, Gauge, Wrench, Layers } from 'lucide-react';
import { PricingAdminDashboard } from './PricingAdminDashboard';
import CalculationsAdmin from './admin/CalculationsAdmin';
import UseCaseConfigManager from './admin/UseCaseConfigManager';
import CacheStatistics from './admin/CacheStatistics';
import AIDataCollectionAdmin from './admin/AIDataCollectionAdmin';
import PricingSystemHealthDashboard from './admin/PricingSystemHealthDashboard';
import SystemHealthDashboard from './admin/SystemHealthDashboard';
import MarketIntelligenceDashboard from './admin/MarketIntelligenceDashboard';
import { getUseCaseProfiles, getEquipmentCatalog, calculatePremiumComparison, type EquipmentTier } from '../services/premiumConfigurationService';
import merlinImage from '@/assets/images/new_profile_merlin.png';
// import MigrationManager from './admin/MigrationManager'; // Temporarily disabled

/**
 * System Administrator Dashboard
 * 
 * Access: Currently accessible to anyone (will be protected by Supabase Auth later)
 * Features: User management, use case manager, system settings, analytics
 * 
 * DESIGN: Matches Merlin Wizard aesthetic - light purple theme, rounded cards
 */

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  semiPremiumUsers: number;
  premiumUsers: number;
  quotesGeneratedToday: number;
  activeSessions: number;
  monthlyRevenue: number;
  systemHealth: 'operational' | 'degraded' | 'down';
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketIntelligence' | 'systemHealth' | 'godSettings' | 'matching' | 'premium' | 'realtime' | 'workflows' | 'health' | 'users' | 'analytics' | 'settings' | 'useCases' | 'pricing' | 'pricingHealth' | 'calculations' | 'cache' | 'migration' | 'aiData'>('dashboard');
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const [showPricingAdmin, setShowPricingAdmin] = useState(false);
  
  // Enhanced mock data (will be replaced with Supabase queries and real-time APIs)
  const stats: AdminStats = {
    totalUsers: 1247,
    freeUsers: 1100,
    semiPremiumUsers: 120,
    premiumUsers: 27,
    quotesGeneratedToday: 145,
    activeSessions: 23,
    monthlyRevenue: 3613,
    systemHealth: 'operational',
    uptime: 99.97,
    apiResponseTime: 142,
    errorRate: 0.08,
    activeWorkflows: 8,
    completedWorkflows: 1247,
    failedWorkflows: 3
  };

  // Navigation panels - organized by category
  const navigationPanels = [
    {
      title: 'Overview & Analytics',
      icon: BarChart3,
      items: [
        { key: 'dashboard', label: 'System Dashboard', icon: BarChart3, description: 'System overview and statistics' },
        { key: 'marketIntelligence', label: 'Market Intelligence', icon: Brain, description: 'AI-powered market analysis and trends', highlight: true },
        { key: 'analytics', label: 'Analytics', icon: TrendingUp, description: 'Business analytics and reports' },
      ]
    },
    {
      title: 'System Health & Monitoring',
      icon: Activity,
      items: [
        { key: 'systemHealth', label: 'System Health', icon: Activity, description: 'Comprehensive system health checks' },
        { key: 'pricingHealth', label: 'Pricing Health', icon: Gauge, description: 'Pricing system status and validation' },
      ]
    },
    {
      title: 'Configuration & Management',
      icon: Settings,
      items: [
        { key: 'pricing', label: 'Pricing Admin', icon: DollarSign, description: 'Manage pricing configurations' },
        { key: 'calculations', label: 'Calculations', icon: Cpu, description: 'Calculation engine management' },
        { key: 'useCases', label: 'Use Cases', icon: Layers, description: 'Use case configuration' },
        { key: 'aiData', label: 'AI Data Collection', icon: Database, description: 'AI training data management' },
        { key: 'cache', label: 'Cache Statistics', icon: Database, description: 'Cache performance metrics' },
      ]
    },
    {
      title: 'Advanced Features',
      icon: Sparkles,
      items: [
        { key: 'matching', label: 'Matching Engine', icon: Sparkles, description: 'Live matching engine' },
        { key: 'premium', label: 'MERLIN Premium', icon: Crown, description: 'Premium configuration management' },
        { key: 'realtime', label: 'Real-Time Monitor', icon: Activity, description: 'Real-time system monitoring' },
        { key: 'workflows', label: 'Workflows', icon: Zap, description: 'Workflow management' },
      ]
    },
    {
      title: 'Administration',
      icon: Shield,
      items: [
        { key: 'godSettings', label: 'GOD Settings', icon: Shield, description: 'System-level settings' },
        { key: 'settings', label: 'Settings', icon: Settings, description: 'General settings' },
      ]
    },
  ];
  
  // Live Matching Engine State
  const [matchingLive, setMatchingLive] = useState(true);
  const [liveMatches, setLiveMatches] = useState<Array<{
    id: string;
    time: string;
    quoteId: string;
    useCase: string;
    vendor: string;
    score: number;
    equipment: string;
    powerMW: number;
    tier: EquipmentTier;
  }>>([]);
  
  // Premium Configuration State
  const [selectedPremiumUseCase, setSelectedPremiumUseCase] = useState<string>('hotel');
  const [premiumComparison, setPremiumComparison] = useState<any>(null);
  
  // Simulated live matching feed
  useEffect(() => {
    if (!matchingLive) return;
    
    const vendors = ['Tesla', 'BYD', 'CATL', 'Fluence', 'SMA Solar', 'Dynapower', 'Eaton', 'Schneider'];
    const useCases = ['hotel', 'car-wash', 'ev-charging', 'hospital', 'data-center', 'manufacturing', 'office'];
    const equipmentTypes = ['BESS Module', 'PCS Inverter', 'Transformer', 'Switchgear', 'Solar Array', 'Microgrid Controller'];
    
    const interval = setInterval(() => {
      const newMatch = {
        id: `match-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        quoteId: `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        useCase: useCases[Math.floor(Math.random() * useCases.length)],
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        score: Math.floor(75 + Math.random() * 25),
        equipment: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
        powerMW: Math.round((0.1 + Math.random() * 4.9) * 10) / 10,
        tier: ['standard', 'premium', 'enterprise'][Math.floor(Math.random() * 3)] as EquipmentTier
      };
      
      setLiveMatches(prev => [newMatch, ...prev].slice(0, 20));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [matchingLive]);
  
  // Load premium comparison when use case changes
  useEffect(() => {
    const comparison = calculatePremiumComparison(selectedPremiumUseCase, 1, 4, 0.5);
    setPremiumComparison(comparison);
  }, [selectedPremiumUseCase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background with deeper purple, light blue, and slate blue */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-slate-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-10 right-10 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Header - Wizard-like styling */}
      <div className="relative bg-white/70 backdrop-blur-md border-b border-purple-300/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={merlinImage} 
                  alt="Merlin" 
                  className="w-14 h-14 object-contain drop-shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-700 to-slate-600 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-800 via-slate-600 to-purple-800">
                  Merlin Admin Panel
                </h1>
                <p className="text-sm text-gray-500">System Administration & Control</p>
              </div>
            </div>
            
            {/* Exit to Home Button - Smaller, professional */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-700 to-slate-600 hover:from-purple-800 hover:to-slate-700 text-white text-sm rounded-lg font-medium shadow-md shadow-purple-700/30 hover:shadow-lg hover:shadow-purple-800/40 transition-all duration-200"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Panels - Organized by category */}
      {activeTab === 'dashboard' && (
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 border-b border-blue-200/50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navigationPanels.map((panel, panelIndex) => {
                const PanelIcon = panel.icon;
                return (
                  <div key={panelIndex} className="bg-white/80 backdrop-blur-md rounded-xl border border-purple-200/50 shadow-lg shadow-purple-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <PanelIcon className="w-5 h-5 text-purple-700" />
                      <h3 className="font-semibold text-gray-900 text-sm">{panel.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {panel.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key as typeof activeTab)}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                              activeTab === item.key
                                ? 'bg-gradient-to-r from-purple-700 to-slate-600 text-white shadow-md'
                                : item.highlight
                                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 hover:border-purple-300 hover:shadow-md'
                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                            }`}
                          >
                            <ItemIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              activeTab === item.key ? 'text-white' : item.highlight ? 'text-purple-700' : 'text-gray-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${
                                activeTab === item.key ? 'text-white' : 'text-gray-900'
                              }`}>
                                {item.label}
                                {item.highlight && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full font-semibold">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs mt-0.5 ${
                                activeTab === item.key ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                {item.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Back to Dashboard Button - Show when not on dashboard */}
      {activeTab !== 'dashboard' && (
        <div className="relative bg-white/50 backdrop-blur-md border-b border-blue-200/50">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-700 to-slate-600 text-white rounded-lg hover:from-purple-800 hover:to-slate-700 shadow-md transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        
        {/* Market Intelligence Tab */}
        {activeTab === 'marketIntelligence' && (
          <MarketIntelligenceDashboard />
        )}

        {/* System Health Tab */}
        {activeTab === 'systemHealth' && (
          <SystemHealthDashboard />
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-700 to-slate-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-700/30">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">System Overview</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>
            
            {/* Stats Grid - Compact cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-purple-200/50 shadow-lg shadow-purple-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-400 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">+12%</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
                {/* Mini chart placeholder */}
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[40, 65, 45, 70, 55, 80, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-400/50 to-blue-300/20 rounded-sm" style={{height: `${h}%`}}></div>
                  ))}
                </div>
              </div>

              {/* Quotes Today */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-emerald-100/50 shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+8%</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.quotesGeneratedToday}</p>
                <p className="text-xs text-gray-500 mt-0.5">Quotes Today</p>
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[30, 50, 40, 75, 60, 85, 70].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-500/10 rounded-sm" style={{height: `${h}%`}}></div>
                  ))}
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-purple-200/50 shadow-lg shadow-purple-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-700 to-slate-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">+15%</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Monthly Revenue</p>
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[45, 55, 50, 65, 70, 80, 90].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-purple-600/50 to-purple-500/20 rounded-sm" style={{height: `${h}%`}}></div>
                  ))}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-orange-100/50 shadow-lg shadow-orange-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.activeSessions}</p>
                <p className="text-xs text-gray-500 mt-0.5">Active Sessions</p>
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[60, 45, 70, 55, 80, 65, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-orange-500/40 to-orange-500/10 rounded-sm" style={{height: `${h}%`}}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions - Compact professional buttons */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-purple-100/50 shadow-lg shadow-purple-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-md flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setActiveTab('useCases')}
                  className="group flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-200/50 hover:border-blue-300 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Use Cases</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('users')}
                  className="group flex items-center gap-2 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/50 hover:border-emerald-300 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Users</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="group flex items-center gap-2 p-3 bg-gradient-to-br from-purple-100 to-slate-100 hover:from-purple-200 hover:to-slate-200 border border-purple-300/50 hover:border-purple-400 rounded-xl transition-all duration-200 hover:shadow-md"
                  >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-700 to-slate-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Analytics</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="group flex items-center gap-2 p-3 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/50 hover:border-orange-300 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Settings</span>
                </button>
              </div>
            </div>

            {/* System Status Banner - Compact */}
            <div className={`rounded-xl p-3 flex items-center justify-between ${
              stats.systemHealth === 'operational' 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50' 
                : stats.systemHealth === 'degraded'
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  stats.systemHealth === 'operational' ? 'bg-emerald-500' : 
                  stats.systemHealth === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">All systems {stats.systemHealth}</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>Uptime: <span className="font-semibold text-emerald-600">{stats.uptime}%</span></span>
                <span>API: <span className="font-semibold text-blue-600">{stats.apiResponseTime}ms</span></span>
                <span>Errors: <span className="font-semibold text-gray-700">{stats.errorRate}%</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Active Workflows</h2>
              </div>
              <div className="flex gap-3">
                <select className="bg-white border border-purple-200 text-gray-700 px-4 py-2 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all">
                  <option>All Workflows</option>
                  <option>Running</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
                <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                  <Activity className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Workflow Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-blue-300 shadow-lg">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Active</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">{stats.activeWorkflows}</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-emerald-200 shadow-lg">
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">Completed</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{stats.completedWorkflows}</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-red-200 shadow-lg">
                <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-1">Failed</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">{stats.failedWorkflows}</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-purple-200 shadow-lg">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-slate-600">{(((stats.completedWorkflows) / (stats.completedWorkflows + stats.failedWorkflows)) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Active Workflows List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-slate-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-700" />
                  Currently Running
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { id: 'wf-001', name: 'Quote Generation Pipeline', user: 'user@example.com', started: '2 min ago', status: 'processing' },
                  { id: 'wf-002', name: 'ML Analytics Processing', user: 'admin@merlin.com', started: '5 min ago', status: 'running' },
                  { id: 'wf-003', name: 'Data Export Job', user: 'system', started: '12 min ago', status: 'finalizing' },
                ].map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100/50 to-slate-100/50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-gray-800 font-semibold">{workflow.name}</p>
                        <p className="text-gray-500 text-sm">ID: {workflow.id} • User: {workflow.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workflow.started}
                      </span>
                      <button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all hover:scale-105">
                        Stop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">System Health Monitor</h2>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                stats.systemHealth === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                stats.systemHealth === 'degraded' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  stats.systemHealth === 'operational' ? 'bg-emerald-500' :
                  stats.systemHealth === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
                <span className="font-semibold capitalize">{stats.systemHealth}</span>
              </div>
            </div>

            {/* Health Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-emerald-200 shadow-lg">
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">Uptime</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{stats.uptime}%</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-blue-300 shadow-lg">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">API Response</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">{stats.apiResponseTime}ms</p>
                <p className="text-xs text-gray-500 mt-1">Average</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-purple-200 shadow-lg">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">Error Rate</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-slate-600">{stats.errorRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-orange-200 shadow-lg">
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-1">Active Sessions</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">{stats.activeSessions}</p>
                <p className="text-xs text-gray-500 mt-1">Current</p>
              </div>
            </div>

            {/* System Components Health */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-slate-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-700" />
                  Component Status
                </h3>
              </div>
              <div className="p-4 grid md:grid-cols-2 gap-3">
                {[
                  { name: 'Database', status: 'healthy', latency: '12ms', last_check: '30s ago' },
                  { name: 'API Gateway', status: 'healthy', latency: '45ms', last_check: '15s ago' },
                  { name: 'Authentication', status: 'healthy', latency: '89ms', last_check: '1m ago' },
                  { name: 'File Storage', status: 'warning', latency: '234ms', last_check: '2m ago' },
                  { name: 'ML Analytics Engine', status: 'healthy', latency: '156ms', last_check: '45s ago' },
                  { name: 'Email Service', status: 'healthy', latency: '67ms', last_check: '1m ago' },
                ].map((component) => (
                  <div key={component.name} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                    component.status === 'healthy' ? 'bg-emerald-50/50 border-emerald-200' :
                    component.status === 'warning' ? 'bg-amber-50/50 border-amber-200' :
                    'bg-red-50/50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {component.status === 'healthy' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : component.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-gray-800 font-semibold">{component.name}</p>
                        <p className="text-gray-500 text-sm">Latency: {component.latency}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{component.last_check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Site Analytics</h2>
            </div>
            
            {/* Performance Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-blue-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  User Engagement
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Active Users</span>
                    <span className="text-gray-900 font-bold">342</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Session Duration</span>
                    <span className="text-gray-900 font-bold">12m 34s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bounce Rate</span>
                    <span className="text-gray-900 font-bold">23.5%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Revenue Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="text-gray-900 font-bold">8.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Quote Value</span>
                    <span className="text-gray-900 font-bold">$847K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer LTV</span>
                    <span className="text-gray-900 font-bold">$1,240</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Page Load Time</span>
                    <span className="text-gray-900 font-bold">1.2s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Core Web Vitals</span>
                    <span className="text-emerald-600 font-bold">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Rate</span>
                    <span className="text-gray-900 font-bold">0.08%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
              </div>
              <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                + Add User
              </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-purple-200 shadow-lg">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
                <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all">
                  <option>All Tiers</option>
                  <option>Free</option>
                  <option>Semi-Premium</option>
                  <option>Premium</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-4">
              {/* Example Users */}
              {[
                { email: 'john@example.com', tier: 'free', quotesUsed: 2, joined: 'Jan 15, 2025' },
                { email: 'sarah@company.com', tier: 'premium', quotesUsed: 47, joined: 'Dec 3, 2024' },
                { email: 'mike@business.com', tier: 'semi_premium', quotesUsed: 18, joined: 'Feb 1, 2025' }
              ].map((user, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-800 font-semibold">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className={`px-2 py-1 rounded-lg ${
                          user.tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                          user.tier === 'semi_premium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.tier === 'semi_premium' ? 'Semi-Premium' : user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                        </span>
                        <span className="text-gray-500">Joined: {user.joined}</span>
                        <span className="text-gray-500">Quotes: {user.quotesUsed}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
                        Change Tier
                      </button>
                      <button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-purple-500/25 transition-all hover:scale-105">
                        View Activity
                      </button>
                      <button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all hover:scale-105">
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
              <p className="text-blue-700 text-sm">
                💡 <strong>Coming Soon:</strong> Full user management with Supabase integration. You'll be able to change tiers, reset quote limits, view detailed activity, and manage subscriptions.
              </p>
            </div>
          </div>
        )}


        {/* Use Cases Tab */}
        {activeTab === 'useCases' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Use Case Manager</h2>
              </div>
              <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                + Create New Use Case
              </button>
            </div>

            {/* Use Case List */}
            <div className="space-y-4">
              {[
                { name: 'Car Wash', icon: '🚗', tier: 'free', active: true, quotesGenerated: 89 },
                { name: 'Indoor Farm', icon: '🌱', tier: 'semi_premium', active: true, quotesGenerated: 34 },
                { name: 'Hotel', icon: '🏨', tier: 'free', active: true, quotesGenerated: 67 },
                { name: 'Airport', icon: '✈️', tier: 'premium', active: true, quotesGenerated: 12 },
                { name: 'College/University', icon: '🎓', tier: 'semi_premium', active: true, quotesGenerated: 45 }
              ].map((useCase, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{useCase.icon}</span>
                      <div>
                        <p className="text-gray-800 font-semibold text-lg">{useCase.name}</p>
                        <div className="flex gap-3 mt-2 text-sm">
                          <span className={`px-2 py-1 rounded-lg ${
                            useCase.tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                            useCase.tier === 'semi_premium' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {useCase.tier === 'semi_premium' ? 'Semi-Premium' : useCase.tier.charAt(0).toUpperCase() + useCase.tier.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-lg ${
                            useCase.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {useCase.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-gray-500">{useCase.quotesGenerated} quotes generated</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
                        Edit
                      </button>
                      <button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-purple-500/25 transition-all hover:scale-105">
                        Test
                      </button>
                      <button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all hover:scale-105">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Notice */}
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
              <p className="text-purple-700 text-sm">
                📚 <strong>Current Templates:</strong> These use cases are defined in <code className="bg-purple-100 px-2 py-1 rounded">src/data/useCaseTemplates.ts</code>. 
                After Supabase integration, you'll create and edit them directly in this interface!
              </p>
            </div>
          </div>
        )}

        {/* Pricing Configuration Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Pricing Configuration</h2>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Equipment Pricing Management</h3>
                  <p className="text-gray-500">Manage all equipment pricing assumptions based on real vendor quotes</p>
                </div>
                <button
                  onClick={() => setShowPricingAdmin(true)}
                  className="bg-gradient-to-r from-blue-400 to-sky-400 hover:from-blue-500 hover:to-sky-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                >
                  Open Pricing Dashboard
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-gray-800 mb-2">🔋 BESS Systems</h4>
                  <p className="text-gray-600 text-sm">Small (&lt;1MWh): ~$200/kWh</p>
                  <p className="text-gray-600 text-sm">Medium (1-10MWh): ~$155/kWh</p>
                  <p className="text-gray-600 text-sm">Utility (10+MWh): ~$140/kWh</p>
                  <p className="text-blue-600 text-xs mt-2">NREL ATB 2024 via unifiedPricingService</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="font-semibold text-gray-800 mb-2">⚡ Generators</h4>
                  <p className="text-gray-600 text-sm">Natural Gas: ~$700/kW</p>
                  <p className="text-gray-600 text-sm">Diesel: ~$500/kW</p>
                  <p className="text-blue-600 text-xs mt-2">NREL ATB 2024 via unifiedPricingService</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                  <h4 className="font-semibold text-gray-800 mb-2">🚗 EV Charging</h4>
                  <p className="text-gray-600 text-sm">Level 2: $2-8k/unit</p>
                  <p className="text-gray-600 text-sm">DCFC: $35-85k/unit</p>
                  <p className="text-blue-600 text-xs mt-2">evChargingCalculations.ts SSOT</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">
                  ⚠️ <strong>Important:</strong> Balance of Plant configured under 15% guideline: 
                  12% BOP + 8% EPC + 5% Contingency = 25% total installation costs. Daily pricing validation active.
                </p>
              </div>
            </div>

            {/* Real-time Pricing Status */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Pricing Data Sources
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Vendor Quotes</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>✅ Great Power (BESS) - Confidential NDA pricing</li>
                    <li>✅ Eaton Power Equipment - $64.2k/200kW generator</li>
                    <li>✅ Market-verified EV charger pricing</li>
                    <li>✅ Panasonic/Mitsubishi Chemical experience</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Market Intelligence</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>✅ NREL ATB 2024 integration</li>
                    <li>✅ GridStatus.io real-time data</li>
                    <li>✅ Industry-standard BOP guidelines</li>
                    <li>✅ Regional cost adjustments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GOD Settings Tab - Master Control Panel */}
        {activeTab === 'godSettings' && (
          <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">GOD Settings</h2>
                  <p className="text-xs text-red-500 font-medium">⚠️ Master Control - Changes affect entire system</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Last modified: 2 hours ago</span>
                <button className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-all">
                  View Audit Log
                </button>
              </div>
            </div>

            {/* Master Switches */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 backdrop-blur-md rounded-xl p-5 border border-red-200/50 shadow-lg">
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Master System Switches
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'quoteGeneration', label: 'Quote Generation', desc: 'Enable/disable all quote generation', enabled: true, critical: true },
                  { id: 'aiRecommendations', label: 'AI Recommendations', desc: 'ML-powered sizing suggestions', enabled: true, critical: false },
                  { id: 'realTimePricing', label: 'Real-Time Pricing', desc: 'Live market price updates', enabled: true, critical: false },
                  { id: 'vendorMatching', label: 'Vendor Matching', desc: 'Auto-match quotes to vendors', enabled: false, critical: false },
                  { id: 'emailNotifications', label: 'Email Notifications', desc: 'System email alerts', enabled: true, critical: false },
                  { id: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Show maintenance page to users', enabled: false, critical: true },
                ].map((sw) => (
                  <div key={sw.id} className={`flex items-center justify-between p-3 rounded-lg ${sw.critical ? 'bg-red-100/50 border border-red-200' : 'bg-white/80 border border-gray-200'}`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        {sw.label}
                        {sw.critical && <span className="text-red-500 text-xs">●</span>}
                      </p>
                      <p className="text-xs text-gray-500">{sw.desc}</p>
                    </div>
                    <button className={`relative w-12 h-6 rounded-full transition-all ${sw.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${sw.enabled ? 'left-6' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Multipliers */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-purple-100/50 shadow-lg">
              <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Global Pricing Multipliers
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { id: 'marginMultiplier', label: 'Margin Multiplier', value: 1.15, unit: 'x', desc: 'Applied to all equipment costs' },
                  { id: 'contingencyRate', label: 'Contingency Rate', value: 5.0, unit: '%', desc: 'Project contingency buffer' },
                  { id: 'taxCreditRate', label: 'ITC Rate', value: 30.0, unit: '%', desc: 'Federal Investment Tax Credit' },
                  { id: 'discountRate', label: 'Discount Rate', value: 8.0, unit: '%', desc: 'NPV/IRR calculations' },
                  { id: 'escalationRate', label: 'Escalation Rate', value: 2.5, unit: '%', desc: 'Annual cost escalation' },
                  { id: 'degradationRate', label: 'Battery Degradation', value: 2.0, unit: '%/yr', desc: 'Annual capacity loss' },
                ].map((param) => (
                  <div key={param.id} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200/50">
                    <label className="text-xs font-medium text-gray-600 block mb-1">{param.label}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        defaultValue={param.value}
                        step={param.unit === 'x' ? 0.01 : 0.1}
                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm font-semibold focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none"
                      />
                      <span className="text-xs text-gray-500 w-10">{param.unit}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{param.desc}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-md shadow-purple-500/20 hover:shadow-lg transition-all">
                Save Multipliers
              </button>
            </div>

            {/* Activity Log */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-gray-200/50 shadow-lg">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent GOD Activities
              </h3>
              <div className="space-y-2">
                {[
                  { time: '2 hours ago', user: 'admin@merlin.com', action: 'Changed margin multiplier from 1.12 to 1.15', type: 'pricing' },
                  { time: '1 day ago', user: 'admin@merlin.com', action: 'Enabled AI Recommendations', type: 'feature' },
                  { time: '3 days ago', user: 'system', action: 'Auto-updated ITC rate to 30%', type: 'system' },
                  { time: '1 week ago', user: 'admin@merlin.com', action: 'Disabled maintenance mode', type: 'critical' },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        log.type === 'critical' ? 'bg-red-500' : 
                        log.type === 'pricing' ? 'bg-purple-500' : 
                        log.type === 'feature' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></span>
                      <span className="text-gray-700">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{log.user}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Matching Engine Tab */}
        {activeTab === 'matching' && (
          <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Matching Engine</h2>
                  <p className="text-xs text-purple-600 font-medium">AI-powered vendor & equipment matching</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Engine Active
                </div>
                <button className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 transition-all">
                  Run Manual Match
                </button>
              </div>
            </div>

            {/* Matching Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Active Vendors', value: '24', change: '+3', color: 'blue' },
                { label: 'Match Rate', value: '94.2%', change: '+2.1%', color: 'emerald' },
                { label: 'Avg Match Time', value: '1.2s', change: '-0.3s', color: 'purple' },
                { label: 'Pending Matches', value: '7', change: '', color: 'orange' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-white/80 backdrop-blur-md rounded-xl p-4 border border-${stat.color}-100/50 shadow-lg`}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    {stat.change && (
                      <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Match Rules */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-purple-100/50 shadow-lg">
              <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Matching Rules Configuration
              </h3>
              <div className="space-y-3">
                {[
                  { rule: 'Price Priority', weight: 35, desc: 'Prefer lower cost vendors' },
                  { rule: 'Lead Time', weight: 25, desc: 'Faster delivery = higher score' },
                  { rule: 'Quality Rating', weight: 20, desc: 'Vendor quality history' },
                  { rule: 'Regional Preference', weight: 15, desc: 'Local vendors preferred' },
                  { rule: 'Past Performance', weight: 5, desc: 'Previous project success' },
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{rule.rule}</p>
                      <p className="text-xs text-gray-500">{rule.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 w-48">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        defaultValue={rule.weight}
                        className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <span className="text-sm font-bold text-purple-700 w-12 text-right">{rule.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Matches - NOW LIVE */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Live Match Feed
                </h3>
                <button
                  onClick={() => setMatchingLive(!matchingLive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    matchingLive 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {matchingLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {matchingLive ? 'Pause' : 'Resume'}
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {liveMatches.length > 0 ? liveMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all cursor-pointer animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                        match.score >= 95 ? 'bg-emerald-500' : match.score >= 90 ? 'bg-blue-500' : 'bg-orange-500'
                      }`}>
                        {match.score}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">{match.quoteId}</p>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            match.tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                            match.tier === 'enterprise' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {match.tier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{match.equipment} • {match.powerMW} MW</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-purple-700">{match.vendor}</p>
                      <p className="text-xs text-gray-400">{match.useCase} • {match.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Waiting for matches...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MERLIN Premium Tab - NEW */}
        {activeTab === 'premium' && (
          <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">MERLIN Premium Benchmarks</h2>
                  <p className="text-xs text-amber-600 font-medium">Premium equipment configurations for each use case</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedPremiumUseCase}
                  onChange={(e) => setSelectedPremiumUseCase(e.target.value)}
                  className="text-sm bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-gray-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                >
                  {Object.keys(getUseCaseProfiles()).map(uc => (
                    <option key={uc} value={uc}>{uc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Premium vs Standard Comparison */}
            {premiumComparison && (
              <div className="grid md:grid-cols-2 gap-5">
                {/* Standard */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-gray-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Standard Quote</h3>
                      <p className="text-xs text-gray-400">Basic equipment tier</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-4">
                    ${Math.round(premiumComparison.standard.totalCost).toLocaleString()}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Batteries</span><span className="text-gray-700">${Math.round(premiumComparison.standard.breakdown.batteries).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Inverters</span><span className="text-gray-700">${Math.round(premiumComparison.standard.breakdown.inverters).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Transformer</span><span className="text-gray-700">${Math.round(premiumComparison.standard.breakdown.transformer).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Controller</span><span className="text-gray-700">${Math.round(premiumComparison.standard.breakdown.microgridController).toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Premium */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-300 shadow-lg relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">RECOMMENDED</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 uppercase">MERLIN Premium</h3>
                      <p className="text-xs text-amber-600">Optimized for {selectedPremiumUseCase}</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-amber-800 mb-4">
                    ${Math.round(premiumComparison.premium.totalCost).toLocaleString()}
                    <span className="text-sm font-normal text-amber-600 ml-2">
                      (+{premiumComparison.delta.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-amber-700">Premium Batteries</span><span className="text-amber-800 font-medium">${Math.round(premiumComparison.premium.breakdown.batteries).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-amber-700">Advanced Inverters</span><span className="text-amber-800 font-medium">${Math.round(premiumComparison.premium.breakdown.inverters).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-amber-700">Smart Transformer</span><span className="text-amber-800 font-medium">${Math.round(premiumComparison.premium.breakdown.transformer).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-amber-700">AI Controller</span><span className="text-amber-800 font-medium">${Math.round(premiumComparison.premium.breakdown.microgridController).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Value Proposition */}
            {premiumComparison && (
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-emerald-200 shadow-lg">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Premium Value Proposition
                </h3>
                <div className="grid md:grid-cols-5 gap-3">
                  {premiumComparison.valueProposition.map((value: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-emerald-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Catalog */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-purple-100/50 shadow-lg">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                Premium Equipment Catalog
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Batteries */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-800 mb-2">🔋 Premium Batteries</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Tesla Megapack 2XL</p>
                    <p>• 7,500 cycle life</p>
                    <p>• 15-year warranty</p>
                    <p>• 92% round-trip efficiency</p>
                    <p className="font-bold mt-2">$295/kWh</p>
                  </div>
                </div>

                {/* Inverters */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-800 mb-2">⚡ Premium Inverters</h4>
                  <div className="text-xs text-purple-700 space-y-1">
                    <p>• SMA Sunny Central Storage UP</p>
                    <p>• Grid-forming capable</p>
                    <p>• 4-quadrant operation</p>
                    <p>• Virtual inertia support</p>
                    <p className="font-bold mt-2">$145/kW</p>
                  </div>
                </div>

                {/* Controllers */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <h4 className="text-sm font-bold text-amber-800 mb-2">🎛️ Microgrid Controllers</h4>
                  <div className="text-xs text-amber-700 space-y-1">
                    <p>• Schneider EcoStruxure Advisor</p>
                    <p>• AI-based optimization</p>
                    <p>• Weather-aware forecasting</p>
                    <p>• Automatic islanding</p>
                    <p className="font-bold mt-2">$45,000</p>
                  </div>
                </div>

                {/* AC Patch Panels */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <h4 className="text-sm font-bold text-emerald-800 mb-2">🔌 AC Patch Panels</h4>
                  <div className="text-xs text-emerald-700 space-y-1">
                    <p>• Schneider Galaxy VM</p>
                    <p>• 48 circuits</p>
                    <p>• Hot-swappable breakers</p>
                    <p>• Power monitoring per circuit</p>
                    <p className="font-bold mt-2">$8,500</p>
                  </div>
                </div>

                {/* DC Patch Panels */}
                <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200">
                  <h4 className="text-sm font-bold text-rose-800 mb-2">🔋 DC Patch Panels</h4>
                  <div className="text-xs text-rose-700 space-y-1">
                    <p>• OutBack FLEXware 500</p>
                    <p>• 1000VDC rating</p>
                    <p>• String-level monitoring</p>
                    <p>• Rapid shutdown compliant</p>
                    <p className="font-bold mt-2">$5,500</p>
                  </div>
                </div>

                {/* Transformers */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg border border-indigo-200">
                  <h4 className="text-sm font-bold text-indigo-800 mb-2">⚙️ Smart Transformers</h4>
                  <div className="text-xs text-indigo-700 space-y-1">
                    <p>• Siemens Digital</p>
                    <p>• 98.5% efficiency</p>
                    <p>• Real-time monitoring</p>
                    <p>• Predictive maintenance</p>
                    <p className="font-bold mt-2">$95/kVA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Monitoring Tab */}
        {activeTab === 'realtime' && (
          <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Real-Time Monitoring</h2>
                  <p className="text-xs text-emerald-600 font-medium">Live system metrics & user activity</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-700">
                  <option>Last 1 hour</option>
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                </select>
                <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 transition-all flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid md:grid-cols-5 gap-3">
              {[
                { label: 'Active Users', value: '23', icon: Users, color: 'blue', live: true },
                { label: 'Quotes/Min', value: '4.2', icon: FileText, color: 'purple', live: true },
                { label: 'API Latency', value: '142ms', icon: Zap, color: 'emerald', live: true },
                { label: 'Error Rate', value: '0.08%', icon: AlertTriangle, color: 'orange', live: false },
                { label: 'CPU Usage', value: '34%', icon: Cpu, color: 'gray', live: true },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div key={idx} className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-gray-100/50 shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 text-${metric.color}-500`} />
                      {metric.live && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>}
                    </div>
                    <p className="text-xl font-bold text-gray-800">{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Live Activity Feed */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* User Activity */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-blue-100/50 shadow-lg">
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Live User Activity
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[
                    { user: 'john@company.com', action: 'Generated quote for Hotel', time: 'just now', type: 'quote' },
                    { user: 'sarah@business.com', action: 'Viewed EV Charging wizard', time: '30s ago', type: 'view' },
                    { user: 'mike@enterprise.com', action: 'Exported PDF report', time: '1m ago', type: 'export' },
                    { user: 'anna@startup.com', action: 'Saved quote Q-2024-1248', time: '2m ago', type: 'save' },
                    { user: 'guest-4521', action: 'Started Car Wash wizard', time: '3m ago', type: 'start' },
                    { user: 'david@corp.com', action: 'Updated account settings', time: '5m ago', type: 'settings' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'quote' ? 'bg-purple-500' :
                          activity.type === 'export' ? 'bg-emerald-500' :
                          activity.type === 'save' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-gray-800 font-medium">{activity.user}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600">{activity.action}</span>
                        <span className="text-gray-400">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Events */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-emerald-100/50 shadow-lg">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  System Events
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[
                    { event: 'NREL API sync completed', status: 'success', time: 'just now' },
                    { event: 'Cache refreshed (pricing)', status: 'success', time: '2m ago' },
                    { event: 'ML model prediction batch', status: 'success', time: '5m ago' },
                    { event: 'Database backup completed', status: 'success', time: '15m ago' },
                    { event: 'RSS feed update (12 articles)', status: 'success', time: '30m ago' },
                    { event: 'Vendor API rate limit warning', status: 'warning', time: '1h ago' },
                  ].map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        {event.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-gray-800">{event.event}</span>
                      </div>
                      <span className="text-xs text-gray-400">{event.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Graph Placeholder */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-purple-100/50 shadow-lg">
              <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-4">📈 Request Volume (Last Hour)</h3>
              <div className="h-32 flex items-end gap-1">
                {Array.from({ length: 60 }, (_, i) => {
                  const height = Math.random() * 60 + 20;
                  return (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-purple-500/60 to-purple-500/20 rounded-t-sm hover:from-purple-500 hover:to-purple-400 transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${Math.floor(height / 10)} requests`}
                    ></div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>60 min ago</span>
                <span>30 min ago</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        )}

        {/* Calculations & Formulas Tab */}
        {activeTab === 'calculations' && (
          <CalculationsAdmin />
        )}

        {/* Pricing System Health Tab */}
        {activeTab === 'pricingHealth' && (
          <PricingSystemHealthDashboard />
        )}

        {/* Use Case Configurations Tab */}
        {activeTab === 'useCases' && (
          <UseCaseConfigManager />
        )}
        {/* Cache Performance Tab */}
        {activeTab === 'cache' && (
          <CacheStatistics />
        )}

        {/* AI Data Collection Tab */}
        {activeTab === 'aiData' && (
          <AIDataCollectionAdmin />
        )}

        {/* Migration Tab */}
        {activeTab === 'migration' && (
          <div className="bg-white/90 backdrop-blur-sm border border-purple-200 rounded-2xl p-8 shadow-xl">
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Migration Manager</h3>
              <p className="text-gray-500 mb-4">
                MigrationManager component is temporarily disabled.
              </p>
              <p className="text-sm text-gray-400">
                To enable: Create /src/components/admin/MigrationManager.tsx
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-500 rounded-xl flex items-center justify-center shadow-lg shadow-gray-500/25">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">System Settings</h2>
            </div>

            {/* Access Control */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Access Control
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <div>
                    <span className="text-gray-800 font-semibold">Require Login</span>
                    <p className="text-gray-500 text-sm">Make the app private - users must create an account</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <div>
                    <span className="text-gray-800 font-semibold">Maintenance Mode</span>
                    <p className="text-gray-500 text-sm">Temporarily disable public access for maintenance</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Tier Limits */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Tier Limits
              </h3>
              
              <div className="space-y-6">
                {/* Free Tier */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-gray-800 font-semibold mb-3">Free Tier</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-600 text-sm">Quotes per user</label>
                      <input type="number" defaultValue={3} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-800 mt-1 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm">Quote validity (days)</label>
                      <input type="number" defaultValue={30} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-800 mt-1 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Semi-Premium Tier */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-gray-800 font-semibold mb-3">Semi-Premium Tier</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-gray-600 text-sm">Monthly quotes</label>
                      <input type="number" defaultValue={25} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-800 mt-1 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm">Saved quotes</label>
                      <input type="number" defaultValue={5} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-800 mt-1 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm">Price (USD/month)</label>
                      <input type="number" defaultValue={19} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-800 mt-1 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Premium Tier */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="text-gray-800 font-semibold mb-3">Premium Tier</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-gray-600 text-sm">Monthly quotes</label>
                      <input type="text" defaultValue="Unlimited" disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-gray-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm">Saved quotes</label>
                      <input type="text" defaultValue="Unlimited" disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-gray-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm">Price (USD/month)</label>
                      <input type="number" defaultValue={49} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-800 mt-1 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                Save Changes
              </button>
            </div>

            {/* Info Notice */}
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
              <p className="text-orange-700 text-sm">
                🔧 <strong>Configuration:</strong> These settings will be stored in the <code className="bg-orange-100 px-2 py-1 rounded">system_settings</code> table once Supabase is connected.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Pricing Admin Dashboard Modal */}
      <PricingAdminDashboard 
        isOpen={showPricingAdmin} 
        onClose={() => setShowPricingAdmin(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
