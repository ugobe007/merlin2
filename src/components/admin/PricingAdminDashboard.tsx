/**
 * PricingAdminDashboard - Database-Driven SSOT Version
 * =====================================================
 * 
 * MIGRATED: December 28, 2025
 * - Reads from pricing_configurations table (Supabase)
 * - Displays TrueQuote™ attribution
 * - Supports inline editing with audit trail
 * - Clears pricing caches on save
 * 
 * Database Schema (pricing_configurations):
 * - id (uuid)
 * - config_key (varchar) - unique identifier
 * - config_category (varchar) - bess, solar, generator, etc.
 * - config_data (jsonb) - the actual pricing values
 * - data_source (varchar) - where the data came from
 * - confidence_level (varchar) - high/medium/low
 * - is_active (boolean)
 * - effective_date, expires_at (timestamptz)
 * - updated_at, created_at (timestamptz)
 * - updated_by (uuid)
 * - vendor_notes (text)
 * - size_min_kw, size_max_kw, size_min_mwh, size_max_mwh (numeric)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  DollarSign,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  Battery,
  Sun,
  Fuel,
  Zap,
  Wind,
  Cpu,
  Shield,
  Info,
  Edit2,
  X,
  Filter,
  Loader2
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { adminAuthService } from '@/services/adminAuthService';
import { clearAllPricingCaches } from '@/services/unifiedPricingService';

// ============================================================================
// TYPES
// ============================================================================

interface PricingConfiguration {
  id: string;
  config_key: string;
  config_category: string;
  config_data: Record<string, any>;
  description: string | null;
  version: string | null;
  is_active: boolean;
  effective_date: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  vendor_notes: string | null;
  data_source: string | null;
  confidence_level: string | null;
  size_min_kw: number | null;
  size_max_kw: number | null;
  size_min_mwh: number | null;
  size_max_mwh: number | null;
}

interface PricingAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  bess: { icon: <Battery className="w-5 h-5" />, label: 'Battery Storage (BESS)', color: 'cyan' },
  solar: { icon: <Sun className="w-5 h-5" />, label: 'Solar PV', color: 'yellow' },
  generator: { icon: <Fuel className="w-5 h-5" />, label: 'Generators', color: 'orange' },
  ev_charger: { icon: <Zap className="w-5 h-5" />, label: 'EV Chargers', color: 'green' },
  wind: { icon: <Wind className="w-5 h-5" />, label: 'Wind', color: 'blue' },
  fuel_cell: { icon: <Cpu className="w-5 h-5" />, label: 'Fuel Cells', color: 'purple' },
  power_electronics: { icon: <Cpu className="w-5 h-5" />, label: 'Power Electronics', color: 'indigo' },
  transformer: { icon: <Zap className="w-5 h-5" />, label: 'Transformers', color: 'slate' },
  switchgear: { icon: <Settings className="w-5 h-5" />, label: 'Switchgear', color: 'gray' },
  incentives: { icon: <DollarSign className="w-5 h-5" />, label: 'Incentives', color: 'emerald' },
  safety: { icon: <Shield className="w-5 h-5" />, label: 'Safety Systems', color: 'red' },
  hvac: { icon: <Wind className="w-5 h-5" />, label: 'HVAC / Thermal', color: 'teal' },
  controls: { icon: <Cpu className="w-5 h-5" />, label: 'Controls / BMS', color: 'violet' },
  ui_config: { icon: <Settings className="w-5 h-5" />, label: 'UI Configuration', color: 'pink' },
  electricity_rates: { icon: <Zap className="w-5 h-5" />, label: 'Electricity Rates', color: 'amber' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PricingAdminDashboard: React.FC<PricingAdminProps> = ({ isOpen, onClose }) => {
  // State
  const [configs, setConfigs] = useState<PricingConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set());
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Permissions
  const canEdit = adminAuthService.hasPermission('edit_pricing');
  const canSave = adminAuthService.hasPermission('save_pricing');

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadConfigurations();
    }
  }, [isOpen]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadConfigurations = async () => {
    setLoading(true);
    setError(null);
    setDbStatus('checking');

    try {
      const { data: configData, error: configError } = await supabase
        .from('pricing_configurations')
        .select('*')
        .eq('is_active', true)
        .order('config_category')
        .order('config_key');

      if (configError) {
        throw configError;
      }

      setConfigs(configData || []);
      setDbStatus('connected');
    } catch (err: any) {
      console.error('Failed to load pricing configurations:', err);
      setError(err.message || 'Failed to load configurations');
      setDbStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredConfigs = useMemo(() => {
    return configs.filter(config => {
      // Category filter
      if (selectedCategory !== 'all' && config.config_category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          config.config_key.toLowerCase().includes(searchLower) ||
          config.description?.toLowerCase().includes(searchLower) ||
          config.config_category.toLowerCase().includes(searchLower) ||
          JSON.stringify(config.config_data).toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [configs, selectedCategory, searchTerm]);

  // Get unique categories from data
  const categories = useMemo(() => {
    const cats = new Set(configs.map(c => c.config_category));
    return Array.from(cats).sort();
  }, [configs]);

  // ============================================================================
  // EDITING
  // ============================================================================

  const startEditing = (config: PricingConfiguration) => {
    if (!canEdit) return;
    setEditingConfig(config.id);
    setEditValues(config.config_data);
  };

  const cancelEditing = () => {
    setEditingConfig(null);
    setEditValues({});
  };

  const updateEditValue = (key: string, value: any) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async (configId: string) => {
    if (!canSave) {
      alert('You do not have permission to save pricing configurations.');
      return;
    }

    setSaveStatus('saving');

    try {
      const currentAdmin = adminAuthService.getCurrentAdmin();
      const adminEmail = currentAdmin?.email || null;

      const { error: updateError } = await supabase
        .from('pricing_configurations')
        .update({
          config_data: editValues,
          updated_at: new Date().toISOString(),
          updated_by: adminEmail
        })
        .eq('id', configId);

      if (updateError) throw updateError;

      // Log to audit trail (don't fail if audit log doesn't exist)
      try {
        await supabase.from('pricing_audit_log').insert({
          config_id: configId,
          action: 'update',
          old_value: configs.find(c => c.id === configId)?.config_data,
          new_value: editValues,
          updated_by: adminEmail || 'unknown',
          updated_at: new Date().toISOString()
        });
      } catch (auditError) {
        // Audit log is optional, don't fail if it doesn't exist
        console.warn('Failed to log to audit trail:', auditError);
      }

      // Clear caches
      await clearAllPricingCaches();

      // Reload data
      await loadConfigurations();

      setSaveStatus('saved');
      setEditingConfig(null);
      setEditValues({});

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error('Failed to save configuration:', err);
      setSaveStatus('error');
      alert(`Save failed: ${err.message}`);
    }
  };

  // ============================================================================
  // TOGGLE EXPAND
  // ============================================================================

  const toggleExpand = (configId: string) => {
    setExpandedConfigs(prev => {
      const next = new Set(prev);
      if (next.has(configId)) {
        next.delete(configId);
      } else {
        next.add(configId);
      }
      return next;
    });
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getConfidenceBadge = (level: string | null) => {
    switch (level) {
      case 'high':
        return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Low</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded-full">Unknown</span>;
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORY_CONFIG[category] || { 
      icon: <Database className="w-5 h-5" />, 
      label: category.replace(/_/g, ' ').toUpperCase(), 
      color: 'slate' 
    };
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      if (value < 1 && value > 0) return value.toFixed(4);
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pricing Configuration</h2>
              <p className="text-slate-400 text-sm">Database-driven pricing (SSOT)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* TrueQuote Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">TrueQuote™</span>
            </div>
            
            {/* DB Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              dbStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
              dbStatus === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              <Database className="w-4 h-4" />
              {dbStatus === 'connected' ? 'Connected' : dbStatus === 'error' ? 'Error' : 'Checking...'}
            </div>

            {/* Refresh */}
            <button
              onClick={loadConfigurations}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search configurations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryInfo(cat).label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="text-sm text-slate-400">
            Showing {filteredConfigs.length} of {configs.length} configurations
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
              <button
                onClick={loadConfigurations}
                className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Retry
              </button>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No configurations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConfigs.map(config => {
                const categoryInfo = getCategoryInfo(config.config_category);
                const isExpanded = expandedConfigs.has(config.id);
                const isEditing = editingConfig === config.id;

                return (
                  <div
                    key={config.id}
                    className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-all ${
                      isExpanded ? 'border-purple-500/50' : 'border-slate-700'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-700/30"
                      onClick={() => toggleExpand(config.id)}
                    >
                      {/* Category Icon */}
                      <div className={`p-2 bg-${categoryInfo.color}-500/20 rounded-lg text-${categoryInfo.color}-400`}>
                        {categoryInfo.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold truncate">
                            {config.config_key.replace(/_/g, ' ')}
                          </h3>
                          {getConfidenceBadge(config.confidence_level)}
                        </div>
                        <p className="text-slate-400 text-sm truncate">
                          {config.description || categoryInfo.label}
                        </p>
                      </div>

                      {/* Source */}
                      {config.data_source && (
                        <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
                          <Info className="w-3 h-3" />
                          {config.data_source}
                        </div>
                      )}

                      {/* Size Range */}
                      {(config.size_min_mwh || config.size_max_mwh) && (
                        <div className="hidden lg:block text-xs text-slate-500">
                          {config.size_min_mwh || 0} - {config.size_max_mwh || '∞'} MWh
                        </div>
                      )}

                      {/* Expand Icon */}
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-700">
                        {/* Metadata */}
                        <div className="py-3 flex flex-wrap gap-4 text-xs text-slate-500 border-b border-slate-700/50">
                          <span>Updated: {new Date(config.updated_at).toLocaleString()}</span>
                          {config.data_source && <span>Source: {config.data_source}</span>}
                          {config.version && <span>Version: {config.version}</span>}
                        </div>

                        {/* Config Data */}
                        <div className="py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Object.entries(config.config_data).map(([key, value]) => (
                            <div key={key} className="bg-slate-700/30 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">
                                {key.replace(/_/g, ' ')}
                              </div>
                              {isEditing ? (
                                <input
                                  type={typeof value === 'number' ? 'number' : 'text'}
                                  value={editValues[key] ?? value}
                                  onChange={(e) => updateEditValue(key, 
                                    typeof value === 'number' ? parseFloat(e.target.value) : e.target.value
                                  )}
                                  className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                />
                              ) : (
                                <div className="text-white font-medium">
                                  {formatValue(value)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Vendor Notes */}
                        {config.vendor_notes && (
                          <div className="py-3 border-t border-slate-700/50">
                            <div className="text-xs text-slate-500 mb-1">Vendor Notes</div>
                            <div className="text-slate-300 text-sm">{config.vendor_notes}</div>
                          </div>
                        )}

                        {/* Actions */}
                        {canEdit && (
                          <div className="pt-4 flex justify-end gap-2 border-t border-slate-700/50">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={cancelEditing}
                                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveConfig(config.id)}
                                  disabled={saveStatus === 'saving'}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                  {saveStatus === 'saving' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  Save
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditing(config)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>All pricing data sourced from NREL ATB 2024 &amp; verified vendor quotes</span>
          </div>
          <div>
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingAdminDashboard;
