/**
 * EquipmentPricingAdmin - Enhanced Equipment Pricing Dashboard
 * =============================================================
 * 
 * PURPOSE: Manage equipment_pricing_tiers table for all equipment types
 * 
 * EQUIPMENT TYPES:
 * - BESS, Solar, Inverter/PCS, Transformer, Switchgear
 * - Microgrid Controller, DC/AC Patch Panels, BMS, ESS Enclosure
 * - SCADA, EMS Software, EV Charger, Generator, Fuel Cell, Wind
 * 
 * FEATURES:
 * - View all equipment pricing by type and tier
 * - Edit prices with TrueQuote™ attribution
 * - Sync from market data sources
 * - Size-based tier management
 * - Manufacturer and model tracking
 * 
 * @created 2026-01-14
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
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
  Edit2,
  X,
  Loader2,
  ExternalLink,
  Download,
  Package,
  Server,
  Boxes,
  Monitor
} from 'lucide-react';
import { adminAuthService } from '@/services/adminAuthService';
import { clearAllPricingCaches } from '@/services/unifiedPricingService';
import equipmentPricingService, { 
  EQUIPMENT_TYPE_META,
  formatPriceForDisplay
} from '@/services/equipmentPricingTiersService';
import type { 
  EquipmentType, 
  PricingTier, 
  EquipmentPricingTier
} from '@/services/equipmentPricingTiersService';

// ============================================================================
// TYPES
// ============================================================================

interface EquipmentPricingAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// CATEGORY CONFIG - Maps to EQUIPMENT_TYPE_META with icons
// ============================================================================

const CATEGORY_ICONS: Record<EquipmentType, React.ReactNode> = {
  bess: <Battery className="w-5 h-5" />,
  solar: <Sun className="w-5 h-5" />,
  inverter_pcs: <Cpu className="w-5 h-5" />,
  transformer: <Zap className="w-5 h-5" />,
  switchgear: <Settings className="w-5 h-5" />,
  microgrid_controller: <Server className="w-5 h-5" />,
  dc_patch_panel: <Package className="w-5 h-5" />,
  ac_patch_panel: <Boxes className="w-5 h-5" />,
  bms: <Monitor className="w-5 h-5" />,
  ess_enclosure: <Package className="w-5 h-5" />,
  scada: <Server className="w-5 h-5" />,
  ems_software: <Monitor className="w-5 h-5" />,
  ev_charger: <Zap className="w-5 h-5" />,
  generator: <Fuel className="w-5 h-5" />,
  fuel_cell: <Cpu className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />
};

const TIER_COLORS: Record<PricingTier, string> = {
  economy: 'slate',
  standard: 'cyan',
  premium: 'purple',
  enterprise: 'amber'
};

// ============================================================================
// COMPONENT
// ============================================================================

export const EquipmentPricingAdmin: React.FC<EquipmentPricingAdminProps> = ({ isOpen, onClose }) => {
  // State
  const [pricingData, setPricingData] = useState<Record<EquipmentType, EquipmentPricingTier[]>>({} as any);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<EquipmentType | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<PricingTier | 'all'>('all');
  const [expandedTypes, setExpandedTypes] = useState<Set<EquipmentType>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EquipmentPricingTier>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAddModal, setShowAddModal] = useState(false);
  const [marketSyncStatus, setMarketSyncStatus] = useState<Record<EquipmentType, 'idle' | 'syncing' | 'done' | 'error'>>({} as any);

  // Permissions
  const canEdit = adminAuthService.hasPermission('edit_pricing');
  const canSave = adminAuthService.hasPermission('save_pricing');

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadPricingData();
    }
  }, [isOpen]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadPricingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await equipmentPricingService.getAllEquipmentPricing();
      setPricingData(data);
    } catch (err: any) {
      console.error('Failed to load equipment pricing:', err);
      setError(err.message || 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredData = useMemo(() => {
    const result: Record<EquipmentType, EquipmentPricingTier[]> = {} as any;

    for (const [type, tiers] of Object.entries(pricingData)) {
      // Type filter
      if (selectedType !== 'all' && type !== selectedType) continue;

      const filteredTiers = tiers.filter(tier => {
        // Tier filter
        if (selectedTier !== 'all' && tier.tier_name !== selectedTier) return false;

        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            tier.manufacturer?.toLowerCase().includes(search) ||
            tier.model?.toLowerCase().includes(search) ||
            tier.data_source?.toLowerCase().includes(search) ||
            type.includes(search)
          );
        }
        return true;
      });

      if (filteredTiers.length > 0) {
        result[type as EquipmentType] = filteredTiers;
      }
    }

    return result;
  }, [pricingData, selectedType, selectedTier, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    let totalTiers = 0;
    let highConfidence = 0;
    const types = Object.keys(pricingData).length;

    for (const tiers of Object.values(pricingData)) {
      totalTiers += tiers.length;
      highConfidence += tiers.filter(t => t.confidence_level === 'high').length;
    }

    return { types, totalTiers, highConfidence };
  }, [pricingData]);

  // ============================================================================
  // EDITING
  // ============================================================================

  const startEditing = (tier: EquipmentPricingTier) => {
    if (!canEdit) return;
    setEditingId(tier.id);
    setEditValues({
      base_price: tier.base_price,
      manufacturer: tier.manufacturer,
      model: tier.model,
      data_source: tier.data_source,
      source_url: tier.source_url,
      confidence_level: tier.confidence_level,
      notes: tier.notes
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdits = async () => {
    if (!editingId || !canSave) return;

    setSaveStatus('saving');

    try {
      const success = await equipmentPricingService.updateEquipmentPricing(editingId, {
        ...editValues,
        source_date: new Date().toISOString().split('T')[0]
      } as any);

      if (!success) throw new Error('Update failed');

      // Clear caches and reload
      await clearAllPricingCaches();
      await loadPricingData();

      setSaveStatus('saved');
      setEditingId(null);
      setEditValues({});

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error('Failed to save:', err);
      setSaveStatus('error');
    }
  };

  // ============================================================================
  // MARKET SYNC
  // ============================================================================

  const syncFromMarket = async (type: EquipmentType) => {
    setMarketSyncStatus(prev => ({ ...prev, [type]: 'syncing' }));

    try {
      const result = await equipmentPricingService.syncPricingFromMarketData(type);
      
      if (result.errors.length > 0) {
        console.warn(`Sync warnings for ${type}:`, result.errors);
      }

      await loadPricingData();
      setMarketSyncStatus(prev => ({ ...prev, [type]: 'done' }));
      
      setTimeout(() => {
        setMarketSyncStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error(`Failed to sync ${type}:`, err);
      setMarketSyncStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  // ============================================================================
  // TOGGLE EXPAND
  // ============================================================================

  const toggleExpand = (type: EquipmentType) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
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
        return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">✓ High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">~ Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">⚠ Low</span>;
      case 'estimate':
        return <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded-full">Est.</span>;
      default:
        return null;
    }
  };

  const getTierBadge = (tier: PricingTier) => {
    const colors = {
      economy: 'bg-slate-500/20 text-slate-400',
      standard: 'bg-cyan-500/20 text-cyan-400',
      premium: 'bg-purple-500/20 text-purple-400',
      enterprise: 'bg-amber-500/20 text-amber-400'
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[tier]}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-cyan-500/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Package className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Equipment Pricing Tiers</h2>
              <p className="text-slate-400 text-sm">
                {stats.types} equipment types • {stats.totalTiers} pricing tiers • {stats.highConfidence} high confidence
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* TrueQuote Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">TrueQuote™</span>
            </div>

            {/* Refresh */}
            <button
              onClick={loadPricingData}
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
        <div className="p-4 border-b border-slate-700 flex items-center gap-4 flex-wrap shrink-0">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by manufacturer, model, source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Equipment Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EquipmentType | 'all')}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Equipment Types</option>
            {Object.entries(EQUIPMENT_TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as PricingTier | 'all')}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Tiers</option>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
              <button
                onClick={loadPricingData}
                className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Retry
              </button>
            </div>
          ) : Object.keys(filteredData).length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No pricing data found</p>
              <p className="text-slate-500 text-sm mt-2">Run the migration to seed initial data</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredData).map(([type, tiers]) => {
                const meta = EQUIPMENT_TYPE_META[type as EquipmentType];
                const isExpanded = expandedTypes.has(type as EquipmentType);
                const syncStatus = marketSyncStatus[type as EquipmentType];

                return (
                  <div
                    key={type}
                    className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-all ${
                      isExpanded ? 'border-cyan-500/50' : 'border-slate-700'
                    }`}
                  >
                    {/* Equipment Type Header */}
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-700/30"
                      onClick={() => toggleExpand(type as EquipmentType)}
                    >
                      <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                        {CATEGORY_ICONS[type as EquipmentType]}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          {meta?.icon} {meta?.label || type}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {tiers.length} pricing tier{tiers.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Quick stats */}
                      <div className="hidden md:flex items-center gap-2">
                        {tiers.some(t => t.tier_name === 'standard') && (
                          <span className="text-xs text-slate-500">
                            Standard: {formatPriceForDisplay(
                              tiers.find(t => t.tier_name === 'standard')?.base_price || 0,
                              tiers.find(t => t.tier_name === 'standard')?.price_unit as any || 'per_unit'
                            )}
                          </span>
                        )}
                      </div>

                      {/* Market Sync Button */}
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            syncFromMarket(type as EquipmentType);
                          }}
                          disabled={syncStatus === 'syncing'}
                          className={`p-2 rounded-lg transition-colors ${
                            syncStatus === 'syncing' ? 'bg-amber-500/20 text-amber-400' :
                            syncStatus === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                            syncStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                          }`}
                          title="Sync from market data"
                        >
                          {syncStatus === 'syncing' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : syncStatus === 'done' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expanded Pricing Tiers */}
                    {isExpanded && (
                      <div className="border-t border-slate-700">
                        <table className="w-full">
                          <thead className="bg-slate-800/50">
                            <tr className="text-xs text-slate-500">
                              <th className="px-4 py-3 text-left">Tier</th>
                              <th className="px-4 py-3 text-left">Manufacturer / Model</th>
                              <th className="px-4 py-3 text-right">Price</th>
                              <th className="px-4 py-3 text-left">Size Range</th>
                              <th className="px-4 py-3 text-left">Source</th>
                              <th className="px-4 py-3 text-center">Confidence</th>
                              {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {tiers.map(tier => {
                              const isEditing = editingId === tier.id;

                              return (
                                <tr key={tier.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                                  <td className="px-4 py-3">
                                    {getTierBadge(tier.tier_name as PricingTier)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {isEditing ? (
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={editValues.manufacturer || ''}
                                          onChange={(e) => setEditValues(v => ({ ...v, manufacturer: e.target.value }))}
                                          placeholder="Manufacturer"
                                          className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                        />
                                        <input
                                          type="text"
                                          value={editValues.model || ''}
                                          onChange={(e) => setEditValues(v => ({ ...v, model: e.target.value }))}
                                          placeholder="Model"
                                          className="w-32 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                                        />
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="text-white font-medium">{tier.manufacturer || 'Generic'}</div>
                                        {tier.model && <div className="text-slate-400 text-sm">{tier.model}</div>}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        value={editValues.base_price || 0}
                                        onChange={(e) => setEditValues(v => ({ ...v, base_price: parseFloat(e.target.value) }))}
                                        className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white text-right"
                                      />
                                    ) : (
                                      <span className="text-cyan-400 font-mono font-semibold">
                                        {formatPriceForDisplay(tier.base_price, tier.price_unit as any)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 text-sm">
                                    {tier.size_min !== null || tier.size_max !== null ? (
                                      `${tier.size_min || 0} - ${tier.size_max || '∞'} ${tier.size_unit || ''}`
                                    ) : (
                                      <span className="text-slate-500">All sizes</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 text-sm truncate max-w-[150px]">
                                        {tier.data_source || 'Internal'}
                                      </span>
                                      {tier.source_url && (
                                        <a
                                          href={tier.source_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-cyan-400 hover:text-cyan-300"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {getConfidenceBadge(tier.confidence_level)}
                                  </td>
                                  {canEdit && (
                                    <td className="px-4 py-3 text-right">
                                      {isEditing ? (
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={cancelEditing}
                                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={saveEdits}
                                            disabled={saveStatus === 'saving'}
                                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded"
                                          >
                                            {saveStatus === 'saving' ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <Save className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => startEditing(tier)}
                                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between text-sm text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Pricing from NREL ATB 2024, vendor quotes, and verified market data</span>
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

export default EquipmentPricingAdmin;
