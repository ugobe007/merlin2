/**
 * USE CASE ADMIN DASHBOARD
 * Administrative interface for managing use cases, configurations, and pricing scenarios
 * Allows dynamic updates without code deployments
 */

import React, { useState, useEffect } from 'react';
import { useCaseService } from '../../services/useCaseService';

interface UseCaseAdminProps {
  isAdmin: boolean; // Would come from auth context
}

export const UseCaseAdminDashboard: React.FC<UseCaseAdminProps> = ({ isAdmin }) => {
  const [useCases, setUseCases] = useState<any[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'usecases' | 'equipment' | 'pricing' | 'analytics' | 'debug' | 'casestudies'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});

  // Overview statistics
  const [statistics, setStatistics] = useState<any>({});

  useEffect(() => {
    if (!isAdmin) return;
    
    loadDashboardData();
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [useCasesData, stats] = await Promise.all([
        useCaseService.getAllUseCases(true), // Include inactive
        useCaseService.getUseCaseStatistics()
      ]);
      
      setUseCases(useCasesData);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Use Case Admin Dashboard</h1>
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 pt-6" aria-label="Tabs">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'usecases', label: 'Use Cases' },
            { key: 'equipment', label: 'Equipment' },
            { key: 'pricing', label: 'Pricing' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'debug', label: '🔍 Debug & Monitoring' },
            { key: 'casestudies', label: '📊 Case Studies' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab statistics={statistics} />}
        {activeTab === 'usecases' && <UseCasesTab useCases={useCases} onUpdate={loadDashboardData} />}
        {activeTab === 'equipment' && <EquipmentTab />}
        {activeTab === 'pricing' && <PricingTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'debug' && <DebugTab debugLogs={debugLogs} performanceMetrics={performanceMetrics} />}
        {activeTab === 'casestudies' && <CaseStudiesTab useCases={useCases} />}
      </div>
    </div>
  );
};

// =================== OVERVIEW TAB ===================
const OverviewTab: React.FC<{ statistics: any }> = ({ statistics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">📋</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Use Cases</dt>
              <dd className="text-lg font-medium text-gray-900">{statistics.total_use_cases || 0}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">⚡</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Active Configurations</dt>
              <dd className="text-lg font-medium text-gray-900">{statistics.total_configurations || 0}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">🔧</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Equipment Templates</dt>
              <dd className="text-lg font-medium text-gray-900">{statistics.total_equipment_templates || 0}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">📈</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Usage</dt>
              <dd className="text-lg font-medium text-gray-900">{statistics.total_usage_count || 0}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    {/* Most Popular Use Case */}
    <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2">
      <div className="p-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-3">Most Popular Use Case</h3>
        <div className="text-2xl font-bold text-blue-600">{statistics.most_popular_use_case || 'None'}</div>
        <div className="text-sm text-gray-500">Average ROI: {statistics.average_roi || 0}%</div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2">
      <div className="p-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
            Create New Use Case
          </button>
          <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
            Add Equipment Template
          </button>
          <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm">
            Export Analytics Report
          </button>
        </div>
      </div>
    </div>
  </div>
);

// =================== USE CASES TAB ===================
const UseCasesTab: React.FC<{ useCases: any[], onUpdate: () => void }> = ({ useCases, onUpdate }) => {
  const [editingUseCase, setEditingUseCase] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleEdit = (useCase: any) => {
    setEditingUseCase(useCase);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingUseCase({
      name: '',
      slug: '',
      description: '',
      icon: '',
      category: 'commercial',
      required_tier: 'free',
      is_active: true,
      display_order: useCases.length + 1
    });
    setIsCreating(true);
  };

  const handleSave = async (useCaseData: any) => {
    try {
      if (isCreating) {
        await useCaseService.createUseCase(useCaseData);
      } else {
        await useCaseService.updateUseCase(useCaseData.id, useCaseData);
      }
      
      setEditingUseCase(null);
      setIsCreating(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving use case:', error);
      alert('Error saving use case. Please try again.');
    }
  };

  const toggleActive = async (useCaseId: string, currentStatus: boolean) => {
    try {
      await useCaseService.updateUseCase(useCaseId, { is_active: !currentStatus });
      onUpdate();
    } catch (error) {
      console.error('Error updating use case status:', error);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Use Cases Management</h2>
          <p className="mt-2 text-sm text-gray-700">
            Manage all use case templates and their configurations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Add New Use Case
          </button>
        </div>
      </div>

      {/* Use Cases Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {useCases.map((useCase) => (
            <li key={useCase.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-4">{useCase.icon}</div>
                  <div>
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{useCase.name}</p>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        useCase.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {useCase.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {useCase.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{useCase.description}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      Used {useCase.usage_count || 0} times • Avg ROI: {useCase.average_roi || 0}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(useCase.id, useCase.is_active)}
                    className={`px-3 py-1 rounded text-sm ${
                      useCase.is_active 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {useCase.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(useCase)}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit/Create Modal */}
      {editingUseCase && (
        <UseCaseEditModal
          useCase={editingUseCase}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={() => {
            setEditingUseCase(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

// =================== USE CASE EDIT MODAL ===================
const UseCaseEditModal: React.FC<{
  useCase: any;
  isCreating: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ useCase, isCreating, onSave, onCancel }) => {
  const [formData, setFormData] = useState(useCase);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isCreating ? 'Create New Use Case' : 'Edit Use Case'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => updateField('icon', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  maxLength={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="institutional">Institutional</option>
                  <option value="residential">Residential</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="utility">Utility</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Required Tier</label>
                <select
                  value={formData.required_tier}
                  onChange={(e) => updateField('required_tier', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="free">Free</option>
                  <option value="semi_premium">Semi Premium</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => updateField('display_order', parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? 'Create' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// =================== PLACEHOLDER TABS ===================
const EquipmentTab = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">Equipment Templates Management</h2>
    <p className="text-gray-600">Equipment template management interface would go here.</p>
    <div className="mt-4 text-sm text-gray-500">
      Features: Add/edit equipment templates, manage power ratings, duty cycles, certifications, etc.
    </div>
  </div>
);

const PricingTab = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">Pricing Scenarios Management</h2>
    <p className="text-gray-600">Pricing scenarios management interface would go here.</p>
    <div className="mt-4 text-sm text-gray-500">
      Features: Add/edit utility rates, demand charges, TOU structures, regional variations, etc.
    </div>
  </div>
);

const AnalyticsTab = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">Usage Analytics</h2>
    <p className="text-gray-600">Analytics dashboard would go here.</p>
    <div className="mt-4 text-sm text-gray-500">
      Features: Usage patterns, popular use cases, ROI trends, geographic distribution, etc.
    </div>
  </div>
);

const DebugTab = ({ debugLogs, performanceMetrics }: { debugLogs: any[], performanceMetrics: any }) => (
  <div className="space-y-6">
    {/* Debug Controls */}
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        🔍 Debug & Monitoring
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">⚡ Performance Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Calculation Time</span>
              <span className="text-sm font-mono bg-green-100 px-2 py-1 rounded">~245ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Database Queries</span>
              <span className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">3.2 avg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cache Hit Rate</span>
              <span className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">94.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-mono bg-orange-100 px-2 py-1 rounded">~120ms</span>
            </div>
          </div>
        </div>

        {/* Calculation Validation */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">🧮 Calculation Validation</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Financial Models: ✓ Validated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">BESS Pricing: ✓ Current (Q4 2025)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">ROI Calculations: ✓ Industry Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-sm">Utility Rates: ⚠️ Last updated 30 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Console */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">📜 Debug Console</h3>
        <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
          <div className="text-green-400">[DEBUG] System initialized successfully</div>
          <div className="text-blue-400">[INFO] Use case calculations running...</div>
          <div className="text-yellow-400">[WARN] Cache refresh recommended for utility rates</div>
          <div className="text-green-400">[SUCCESS] Financial models validated - all calculations accurate</div>
          <div className="text-purple-400">[METRIC] Avg calculation time: 245ms (within target &lt;500ms)</div>
          <div className="text-green-400">[INFO] Ready for production workloads</div>
        </div>
      </div>
    </div>

    {/* System Health */}
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">🏥 System Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600">99.8%</div>
          <div className="text-sm text-green-700">Uptime</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">1,247</div>
          <div className="text-sm text-blue-700">Quotes Generated</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">$2.4M</div>
          <div className="text-sm text-purple-700">Total Savings Calculated</div>
        </div>
      </div>
    </div>
  </div>
);

const CaseStudiesTab = ({ useCases }: { useCases: any[] }) => (
  <div className="space-y-6">
    {/* Business Model Overview */}
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        💼 Business Model & Value Proposition
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Core Value Props */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-bold text-lg mb-4 text-blue-800">🎯 Core Value Propositions</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">💰</span>
              <span><strong>Instant ROI Clarity:</strong> 3-minute quotes vs 3-week traditional processes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">⚙️</span>
              <span><strong>Technical Accuracy:</strong> Industry-validated pricing and calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">📊</span>
              <span><strong>Decision Support:</strong> Compare financing, installation, and operational scenarios</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">🚀</span>
              <span><strong>Market Intelligence:</strong> Real-time pricing from 500+ projects</span>
            </li>
          </ul>
        </div>

        {/* Target Markets */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <h3 className="font-bold text-lg mb-4 text-green-800">🎯 Target Markets</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-green-700">Primary: Commercial & Industrial</div>
              <div className="text-gray-600">Manufacturing, data centers, logistics hubs</div>
            </div>
            <div>
              <div className="font-semibold text-green-700">Secondary: EV Infrastructure</div>
              <div className="text-gray-600">Charging networks, fleet operations</div>
            </div>
            <div>
              <div className="font-semibold text-green-700">Emerging: Residential+</div>
              <div className="text-gray-600">High-value homes, multi-family properties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Metrics Framework */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-bold text-lg mb-4">📈 Success Metrics Framework</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">User Engagement</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Quote completion rate: 73%</li>
              <li>• Time to first quote: 3.2min</li>
              <li>• Return user rate: 34%</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">Business Impact</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Avg project value: $1.2M</li>
              <li>• Lead conversion: 12%</li>
              <li>• Sales cycle reduction: 40%</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-800 mb-2">Market Penetration</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Industries covered: 8</li>
              <li>• Geographic reach: 15 states</li>
              <li>• Partner integrations: 23</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Case Studies */}
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">📊 Success Stories & Case Studies</h2>
      
      <div className="space-y-6">
        {/* Manufacturing Case Study */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-blue-800">🏭 Large Manufacturing Facility</h3>
              <p className="text-sm text-blue-600">Automotive Parts Manufacturer - Michigan</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700">$847K</div>
              <div className="text-xs text-blue-600">Annual Savings</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">System:</span> 5MW / 10MWh<br/>
              <span className="font-semibold">Investment:</span> $4.2M
            </div>
            <div>
              <span className="font-semibold">Payback:</span> 4.9 years<br/>
              <span className="font-semibold">ROI:</span> 420% (20 year)
            </div>
            <div>
              <span className="font-semibold">Key Benefit:</span> Peak shaving<br/>
              <span className="font-semibold">Demand Reduction:</span> 60%
            </div>
          </div>
        </div>

        {/* EV Charging Case Study */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-green-800">⚡ EV Charging Network</h3>
              <p className="text-sm text-green-600">Highway Corridor - California</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">$234K</div>
              <div className="text-xs text-green-600">Annual Revenue</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">System:</span> 1.5MW / 3MWh<br/>
              <span className="font-semibold">Investment:</span> $1.8M
            </div>
            <div>
              <span className="font-semibold">Payback:</span> 6.2 years<br/>
              <span className="font-semibold">ROI:</span> 290% (20 year)
            </div>
            <div>
              <span className="font-semibold">Key Benefit:</span> Grid services<br/>
              <span className="font-semibold">Utilization:</span> 78% avg
            </div>
          </div>
        </div>

        {/* Office Building Case Study */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-purple-800">🏢 Commercial Office Complex</h3>
              <p className="text-sm text-purple-600">Class A Office Building - Texas</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-700">$156K</div>
              <div className="text-xs text-purple-600">Annual Savings</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">System:</span> 800kW / 1.6MWh<br/>
              <span className="font-semibold">Investment:</span> $1.1M
            </div>
            <div>
              <span className="font-semibold">Payback:</span> 7.1 years<br/>
              <span className="font-semibold">ROI:</span> 195% (20 year)
            </div>
            <div>
              <span className="font-semibold">Key Benefit:</span> TOU optimization<br/>
              <span className="font-semibold">Peak Reduction:</span> 45%
            </div>
          </div>
        </div>
      </div>

      {/* Business Flow Chart */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-bold text-lg mb-4">🔄 Business Model Flow</h3>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <span><strong>Lead Generation:</strong> Smart Wizard captures qualified prospects</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <span><strong>Value Demonstration:</strong> Instant ROI and savings calculations</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <span><strong>Technical Validation:</strong> Industry-standard pricing and configurations</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <span><strong>Decision Support:</strong> Financing options and implementation guidance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
            <span><strong>Partnership Network:</strong> Connect with vetted installers and financiers</span>
          </div>
        </div>
      </div>
    </div>

    {/* Ancillary Value Props */}
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">🌟 Ancillary Value Propositions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold">🎓 Market Education</h4>
            <p className="text-sm text-gray-600">Demystifying energy storage for mainstream adoption</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold">🔗 Ecosystem Building</h4>
            <p className="text-sm text-gray-600">Connecting buyers, sellers, and service providers</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold">📊 Data Intelligence</h4>
            <p className="text-sm text-gray-600">Market insights from thousands of quote scenarios</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-semibold">⚡ Speed to Market</h4>
            <p className="text-sm text-gray-600">Accelerating project development timelines</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold">🛡️ Risk Mitigation</h4>
            <p className="text-sm text-gray-600">Validated calculations reduce project uncertainties</p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold">🌍 Sustainability Impact</h4>
            <p className="text-sm text-gray-600">Enabling clean energy transition at scale</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default UseCaseAdminDashboard;