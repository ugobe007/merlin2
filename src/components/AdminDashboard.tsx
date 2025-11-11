import React, { useState } from 'react';
import { PricingAdminDashboard } from './PricingAdminDashboard';
import CalculationsAdmin from './admin/CalculationsAdmin';
import UseCaseConfigManager from './admin/UseCaseConfigManager';
import CacheStatistics from './admin/CacheStatistics';

/**
 * System Administrator Dashboard
 * 
 * Access: Currently accessible to anyone (will be protected by Supabase Auth later)
 * Features: User management, use case manager, system settings, analytics
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workflows' | 'health' | 'users' | 'analytics' | 'settings' | 'useCases' | 'pricing' | 'calculations' | 'cache'>('dashboard');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 shadow-2xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🧙‍♂️</div>
            <div>
              <h1 className="text-3xl font-bold text-white">Merlin Admin Panel</h1>
              <p className="text-purple-200">System Administration & Control</p>
            </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-all">
            Exit Admin
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/50 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 p-2 overflow-x-auto">
            {[
              { key: 'dashboard', label: '📊 Dashboard' },
              { key: 'workflows', label: '⚡ Workflows' },
              { key: 'health', label: '🏥 System Health' },
              { key: 'users', label: '👥 Users' },
              { key: 'analytics', label: '📈 Analytics' },
              { key: 'calculations', label: '🧮 Calculations' },
              { key: 'pricing', label: '💰 Pricing Config' },
              { key: 'cache', label: '⚡ Cache Performance' },
              { key: 'settings', label: '⚙️ Settings' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">📊 System Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/30 shadow-xl">
                <p className="text-blue-300 text-sm font-semibold mb-2">TOTAL USERS</p>
                <p className="text-white font-bold text-4xl">{stats.totalUsers.toLocaleString()}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-blue-200">Free: {stats.freeUsers} ({((stats.freeUsers/stats.totalUsers)*100).toFixed(1)}%)</p>
                  <p className="text-blue-200">Semi-Premium: {stats.semiPremiumUsers} ({((stats.semiPremiumUsers/stats.totalUsers)*100).toFixed(1)}%)</p>
                  <p className="text-blue-200">Premium: {stats.premiumUsers} ({((stats.premiumUsers/stats.totalUsers)*100).toFixed(1)}%)</p>
                </div>
              </div>

              {/* Activity */}
              <div className="bg-gradient-to-br from-green-600/30 to-green-800/30 p-6 rounded-xl border border-green-500/30 shadow-xl">
                <p className="text-green-300 text-sm font-semibold mb-2">TODAY'S ACTIVITY</p>
                <p className="text-white font-bold text-4xl">{stats.quotesGeneratedToday}</p>
                <p className="text-green-200 text-sm mt-2">Quotes Generated</p>
                <div className="mt-4">
                  <p className="text-green-200 text-sm">Active Sessions: {stats.activeSessions}</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/30 shadow-xl">
                <p className="text-purple-300 text-sm font-semibold mb-2">MONTHLY REVENUE (MRR)</p>
                <p className="text-white font-bold text-4xl">${stats.monthlyRevenue.toLocaleString()}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-purple-200">Semi-Premium: ${(stats.semiPremiumUsers * 19).toLocaleString()}</p>
                  <p className="text-purple-200">Premium: ${(stats.premiumUsers * 49).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('useCases')}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-lg text-white font-semibold transition-all shadow-lg"
                >
                  <div className="text-2xl mb-2">📋</div>
                  Create Use Case
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 p-4 rounded-lg text-white font-semibold transition-all shadow-lg"
                >
                  <div className="text-2xl mb-2">👥</div>
                  Manage Users
                </button>
                <button className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 p-4 rounded-lg text-white font-semibold transition-all shadow-lg">
                  <div className="text-2xl mb-2">📊</div>
                  View Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 p-4 rounded-lg text-white font-semibold transition-all shadow-lg"
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  System Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">⚡ Active Workflows</h2>
              <div className="flex gap-3">
                <select className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-purple-500/30">
                  <option>All Workflows</option>
                  <option>Running</option>
                  <option>Completed</option>
                  <option>Failed</option>
                </select>
                <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* Workflow Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm mb-1">ACTIVE</p>
                <p className="text-white text-2xl font-bold">{stats.activeWorkflows}</p>
              </div>
              <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-300 text-sm mb-1">COMPLETED</p>
                <p className="text-white text-2xl font-bold">{stats.completedWorkflows}</p>
              </div>
              <div className="bg-red-600/20 p-4 rounded-lg border border-red-500/30">
                <p className="text-red-300 text-sm mb-1">FAILED</p>
                <p className="text-white text-2xl font-bold">{stats.failedWorkflows}</p>
              </div>
              <div className="bg-purple-600/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-purple-300 text-sm mb-1">SUCCESS RATE</p>
                <p className="text-white text-2xl font-bold">{(((stats.completedWorkflows) / (stats.completedWorkflows + stats.failedWorkflows)) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Active Workflows List */}
            <div className="bg-slate-800/50 rounded-lg border border-purple-500/30">
              <div className="p-4 border-b border-purple-500/30">
                <h3 className="text-lg font-semibold text-white">🔄 Currently Running</h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { id: 'wf-001', name: 'Quote Generation Pipeline', user: 'user@example.com', started: '2 min ago', status: 'processing' },
                  { id: 'wf-002', name: 'ML Analytics Processing', user: 'admin@merlin.com', started: '5 min ago', status: 'running' },
                  { id: 'wf-003', name: 'Data Export Job', user: 'system', started: '12 min ago', status: 'finalizing' },
                ].map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-white font-medium">{workflow.name}</p>
                        <p className="text-gray-400 text-sm">ID: {workflow.id} • User: {workflow.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">{workflow.started}</span>
                      <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-all">
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">🏥 System Health Monitor</h2>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stats.systemHealth === 'operational' ? 'bg-green-400' : stats.systemHealth === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                <span className="text-white font-medium capitalize">{stats.systemHealth}</span>
              </div>
            </div>

            {/* Health Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-300 text-sm mb-1">UPTIME</p>
                <p className="text-white text-2xl font-bold">{stats.uptime}%</p>
                <p className="text-green-200 text-xs mt-1">Last 30 days</p>
              </div>
              <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm mb-1">API RESPONSE</p>
                <p className="text-white text-2xl font-bold">{stats.apiResponseTime}ms</p>
                <p className="text-blue-200 text-xs mt-1">Average</p>
              </div>
              <div className="bg-purple-600/20 p-4 rounded-lg border border-purple-500/30">
                <p className="text-purple-300 text-sm mb-1">ERROR RATE</p>
                <p className="text-white text-2xl font-bold">{stats.errorRate}%</p>
                <p className="text-purple-200 text-xs mt-1">Last 24 hours</p>
              </div>
              <div className="bg-orange-600/20 p-4 rounded-lg border border-orange-500/30">
                <p className="text-orange-300 text-sm mb-1">ACTIVE SESSIONS</p>
                <p className="text-white text-2xl font-bold">{stats.activeSessions}</p>
                <p className="text-orange-200 text-xs mt-1">Current</p>
              </div>
            </div>

            {/* System Components Health */}
            <div className="bg-slate-800/50 rounded-lg border border-purple-500/30">
              <div className="p-4 border-b border-purple-500/30">
                <h3 className="text-lg font-semibold text-white">🔧 Component Status</h3>
              </div>
              <div className="p-4 grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Database', status: 'healthy', latency: '12ms', last_check: '30s ago' },
                  { name: 'API Gateway', status: 'healthy', latency: '45ms', last_check: '15s ago' },
                  { name: 'Authentication', status: 'healthy', latency: '89ms', last_check: '1m ago' },
                  { name: 'File Storage', status: 'warning', latency: '234ms', last_check: '2m ago' },
                  { name: 'ML Analytics Engine', status: 'healthy', latency: '156ms', last_check: '45s ago' },
                  { name: 'Email Service', status: 'healthy', latency: '67ms', last_check: '1m ago' },
                ].map((component) => (
                  <div key={component.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${component.status === 'healthy' ? 'bg-green-400' : component.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                      <div>
                        <p className="text-white font-medium">{component.name}</p>
                        <p className="text-gray-400 text-sm">Latency: {component.latency}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-300">{component.last_check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📈 Site Analytics</h2>
            
            {/* Performance Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">📊 User Engagement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Daily Active Users</span>
                    <span className="text-white font-semibold">342</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg. Session Duration</span>
                    <span className="text-white font-semibold">12m 34s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Bounce Rate</span>
                    <span className="text-white font-semibold">23.5%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">💰 Revenue Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Conversion Rate</span>
                    <span className="text-white font-semibold">8.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg. Quote Value</span>
                    <span className="text-white font-semibold">$847K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Customer LTV</span>
                    <span className="text-white font-semibold">$1,240</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">⚡ Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Page Load Time</span>
                    <span className="text-white font-semibold">1.2s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Core Web Vitals</span>
                    <span className="text-green-400 font-semibold">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Error Rate</span>
                    <span className="text-white font-semibold">0.08%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">👥 User Management</h2>
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all">
                + Add User
              </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  className="flex-1 bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
                <select className="bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white">
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
                <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className={`px-2 py-1 rounded ${
                          user.tier === 'premium' ? 'bg-purple-600/30 text-purple-300' :
                          user.tier === 'semi_premium' ? 'bg-blue-600/30 text-blue-300' :
                          'bg-gray-600/30 text-gray-300'
                        }`}>
                          {user.tier === 'semi_premium' ? 'Semi-Premium' : user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                        </span>
                        <span className="text-gray-400">Joined: {user.joined}</span>
                        <span className="text-gray-400">Quotes: {user.quotesUsed}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition-all">
                        Change Tier
                      </button>
                      <button className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm transition-all">
                        View Activity
                      </button>
                      <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-all">
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-blue-600/20 border border-blue-500/50 p-4 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 <strong>Coming Soon:</strong> Full user management with Supabase integration. You'll be able to change tiers, reset quote limits, view detailed activity, and manage subscriptions.
              </p>
            </div>
          </div>
        )}

        {/* Use Cases Tab */}
        {activeTab === 'useCases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">📋 Use Case Manager</h2>
              <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all">
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
                <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{useCase.icon}</span>
                      <div>
                        <p className="text-white font-semibold text-lg">{useCase.name}</p>
                        <div className="flex gap-3 mt-2 text-sm">
                          <span className={`px-2 py-1 rounded ${
                            useCase.tier === 'premium' ? 'bg-purple-600/30 text-purple-300' :
                            useCase.tier === 'semi_premium' ? 'bg-blue-600/30 text-blue-300' :
                            'bg-green-600/30 text-green-300'
                          }`}>
                            {useCase.tier === 'semi_premium' ? 'Semi-Premium' : useCase.tier.charAt(0).toUpperCase() + useCase.tier.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            useCase.active ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                          }`}>
                            {useCase.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-gray-400">{useCase.quotesGenerated} quotes generated</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition-all">
                        Edit
                      </button>
                      <button className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm transition-all">
                        Test
                      </button>
                      <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Notice */}
            <div className="bg-purple-600/20 border border-purple-500/50 p-4 rounded-lg">
              <p className="text-purple-300 text-sm">
                📚 <strong>Current Templates:</strong> These use cases are defined in <code className="bg-black/30 px-2 py-1 rounded">src/data/useCaseTemplates.ts</code>. 
                After Supabase integration, you'll create and edit them directly in this interface!
              </p>
            </div>
          </div>
        )}

        {/* Pricing Configuration Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">💰 Pricing Configuration</h2>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Equipment Pricing Management</h3>
                  <p className="text-gray-400">Manage all equipment pricing assumptions based on real vendor quotes</p>
                </div>
                <button
                  onClick={() => setShowPricingAdmin(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Open Pricing Dashboard
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">🔋 BESS Systems</h4>
                  <p className="text-gray-400 text-sm">Cabinet (&lt;1MW): $439/kWh</p>
                  <p className="text-gray-400 text-sm">Mid-size (1-3MW): $378/kWh</p>
                  <p className="text-gray-400 text-sm">Container (3+MW): $104/kWh</p>
                  <p className="text-orange-300 text-xs mt-2">Dynapower/Sinexcel/Great Power quotes</p>
                </div>
                
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">⚡ Generators</h4>
                  <p className="text-gray-400 text-sm">Natural Gas: $321/kW</p>
                  <p className="text-gray-400 text-sm">Diesel: $280/kW</p>
                  <p className="text-orange-300 text-xs mt-2">Based on Eaton/Cummins quote</p>
                </div>
                
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">🚗 EV Charging</h4>
                  <p className="text-gray-400 text-sm">Level 2: $8k/unit</p>
                  <p className="text-gray-400 text-sm">DC Fast: $45k/unit</p>
                  <p className="text-orange-300 text-xs mt-2">Market-verified pricing</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">
                  ⚠️ <strong>Important:</strong> Balance of Plant configured under 15% guideline: 
                  12% BOP + 8% EPC + 5% Contingency = 25% total installation costs. Daily pricing validation active.
                </p>
              </div>
            </div>

            {/* Real-time Pricing Status */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">📊 Pricing Data Sources</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Vendor Quotes</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>✅ Great Power (BESS) - Confidential NDA pricing</li>
                    <li>✅ Eaton Power Equipment - $64.2k/200kW generator</li>
                    <li>✅ Market-verified EV charger pricing</li>
                    <li>✅ Panasonic/Mitsubishi Chemical experience</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Market Intelligence</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
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

        {/* Calculations & Formulas Tab */}
        {activeTab === 'calculations' && (
          <CalculationsAdmin />
        )}

        {/* Use Case Configurations Tab */}
        {activeTab === 'useCases' && (
          <UseCaseConfigManager />
        )}

        {/* Cache Performance Tab */}
        {activeTab === 'cache' && (
          <CacheStatistics />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">⚙️ System Settings</h2>

            {/* Access Control */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">🔐 Access Control</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <div>
                    <span className="text-white font-semibold">Require Login</span>
                    <p className="text-gray-400 text-sm">Make the app private - users must create an account</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <div>
                    <span className="text-white font-semibold">Maintenance Mode</span>
                    <p className="text-gray-400 text-sm">Temporarily disable public access for maintenance</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Tier Limits */}
            <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">🎭 Tier Limits</h3>
              
              <div className="space-y-6">
                {/* Free Tier */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Free Tier</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-300 text-sm">Quotes per user</label>
                      <input type="number" defaultValue={3} className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm">Quote validity (days)</label>
                      <input type="number" defaultValue={30} className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white mt-1" />
                    </div>
                  </div>
                </div>

                {/* Semi-Premium Tier */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Semi-Premium Tier</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-gray-300 text-sm">Monthly quotes</label>
                      <input type="number" defaultValue={25} className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm">Saved quotes</label>
                      <input type="number" defaultValue={5} className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm">Price (USD/month)</label>
                      <input type="number" defaultValue={19} className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white mt-1" />
                    </div>
                  </div>
                </div>

                {/* Premium Tier */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Premium Tier</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-gray-300 text-sm">Monthly quotes</label>
                      <input type="text" defaultValue="Unlimited" disabled className="w-full bg-slate-900/30 border border-purple-500/30 rounded-lg px-4 py-2 text-gray-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm">Saved quotes</label>
                      <input type="text" defaultValue="Unlimited" disabled className="w-full bg-slate-900/30 border border-purple-500/30 rounded-lg px-4 py-2 text-gray-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm">Price (USD/month)</label>
                      <input type="number" defaultValue={49} className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="mt-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all">
                Save Changes
              </button>
            </div>

            {/* Info Notice */}
            <div className="bg-orange-600/20 border border-orange-500/50 p-4 rounded-lg">
              <p className="text-orange-300 text-sm">
                🔧 <strong>Configuration:</strong> These settings will be stored in the <code className="bg-black/30 px-2 py-1 rounded">system_settings</code> table once Supabase is connected.
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
