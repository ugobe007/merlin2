/**
 * Use Case Configuration Manager
 * 
 * Admin interface for managing baseline configurations in the database.
 * Allows updating typical_load_kw, preferred_duration_hours, and other
 * baseline parameters without code changes.
 */

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle, Edit2, X, Plus } from 'lucide-react';
import { useCaseService, type DetailedUseCase, type UseCaseConfigurationRow } from '../../services/useCaseService';
import { calculateDatabaseBaseline } from '../../services/baselineService';

export default function UseCaseConfigManager() {
  const [useCases, setUseCases] = useState<DetailedUseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load all use cases with configurations
  const loadUseCases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all use cases with full configurations
      const allUseCases = await useCaseService.getAllUseCasesWithConfigurations();
      setUseCases(allUseCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load use cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUseCases();
  }, []);

  // Test baseline calculation
  const testBaseline = async (slug: string) => {
    try {
      const result = await calculateDatabaseBaseline(slug, 1.0);
      setTestResults(prev => ({
        ...prev,
        [slug]: result
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [slug]: { error: err instanceof Error ? err.message : 'Test failed' }
      }));
    }
  };

  // Save configuration
  const saveConfig = async (config: UseCaseConfigurationRow) => {
    setSaving(config.id);
    setError(null);
    setSuccess(null);

    try {
      await useCaseService.updateUseCaseConfiguration(config.id, {
        typical_load_kw: config.typical_load_kw ?? undefined,
        peak_load_kw: config.peak_load_kw ?? undefined,
        preferred_duration_hours: config.preferred_duration_hours ?? undefined,
        is_default: config.is_default ?? undefined
      });

      setSuccess(`Configuration updated successfully`);
      setEditingId(null);
      
      // Reload data
      await loadUseCases();
      
      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(null);
    }
  };

  // Update local state
  const updateLocalConfig = (useCaseId: string, configId: string, field: keyof UseCaseConfigurationRow, value: any) => {
    setUseCases(prev => prev.map(uc => {
      if (uc.id === useCaseId) {
        return {
          ...uc,
          configurations: uc.configurations.map(config => 
            config.id === configId 
              ? { ...config, [field]: value }
              : config
          )
        };
      }
      return uc;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Use Case Configuration Manager
            </h1>
            <p className="text-gray-600">
              Manage baseline calculations for all use cases. Changes affect SmartWizard and AI recommendations.
            </p>
          </div>
          <button
            onClick={loadUseCases}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Use Cases List */}
      <div className="space-y-6">
        {useCases.map(useCase => {
          const defaultConfig = useCase.configurations.find(c => c.is_default);
          const testResult = testResults[useCase.slug];

          return (
            <div key={useCase.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Use Case Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {useCase.name}
                    </h2>
                    <p className="text-gray-600 mb-2">{useCase.description}</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {useCase.slug}
                    </span>
                  </div>
                  <button
                    onClick={() => testBaseline(useCase.slug)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Test Baseline
                  </button>
                </div>

                {/* Test Results */}
                {testResult && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    {testResult.error ? (
                      <div className="text-red-600">❌ {testResult.error}</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Power</div>
                          <div className="font-bold text-lg">{testResult.powerMW} MW</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Duration</div>
                          <div className="font-bold text-lg">{testResult.durationHrs} hrs</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Solar</div>
                          <div className="font-bold text-lg">{testResult.solarMW} MW</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Source</div>
                          <div className="font-bold text-lg text-blue-600">{testResult.dataSource}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Configurations */}
              <div className="p-6">
                {useCase.configurations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No configurations found. Add a default configuration to enable baseline calculations.</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      Add Configuration
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {useCase.configurations.map(config => {
                      const isEditing = editingId === config.id;
                      const isSaving = saving === config.id;

                      return (
                        <div
                          key={config.id}
                          className={`border rounded-lg p-5 transition-all ${
                            config.is_default 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {config.is_default && (
                                <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                                  DEFAULT
                                </span>
                              )}
                              {config.config_name && (
                                <span className="text-gray-700 font-medium">{config.config_name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveConfig(config)}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {isSaving ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      loadUseCases(); // Revert changes
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setEditingId(config.id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-6">
                            {/* Typical Load */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Typical Load (kW)
                              </label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={config.typical_load_kw ?? 0}
                                  onChange={(e) => updateLocalConfig(useCase.id, config.id, 'typical_load_kw', parseInt(e.target.value) || 0)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <div className="text-2xl font-bold text-gray-900">
                                  {(config.typical_load_kw ?? 0).toLocaleString()}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Used for baseline power sizing
                              </div>
                            </div>

                            {/* Peak Load */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Peak Load (kW)
                              </label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={config.peak_load_kw ?? 0}
                                  onChange={(e) => updateLocalConfig(useCase.id, config.id, 'peak_load_kw', parseInt(e.target.value) || 0)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <div className="text-2xl font-bold text-gray-900">
                                  {(config.peak_load_kw ?? 0).toLocaleString()}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Maximum power requirement
                              </div>
                            </div>

                            {/* Duration */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration (hours)
                              </label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={config.preferred_duration_hours ?? 0}
                                  onChange={(e) => updateLocalConfig(useCase.id, config.id, 'preferred_duration_hours', parseFloat(e.target.value) || 0)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <div className="text-2xl font-bold text-gray-900">
                                  {config.preferred_duration_hours}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Recommended battery duration
                              </div>
                            </div>
                          </div>

                          {/* Calculated Values */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600">Base Power (MW)</div>
                                <div className="font-bold text-blue-600">
                                  {((config.typical_load_kw ?? 0) / 1000).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Energy (MWh)</div>
                                <div className="font-bold text-purple-600">
                                  {(((config.typical_load_kw ?? 0) / 1000) * (config.preferred_duration_hours ?? 0)).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Peak Factor</div>
                                <div className="font-bold text-orange-600">
                                  {((config.peak_load_kw ?? 0) / (config.typical_load_kw || 1)).toFixed(2)}x
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Config ID</div>
                                <div className="font-mono text-xs text-gray-500">
                                  {config.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ How Baseline Calculations Work</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <strong>Typical Load</strong>: Base power requirement (kW) for the use case</li>
          <li>• <strong>Scale Factor</strong>: Multiplier based on size (e.g., 100 rooms = 2x for 50-room baseline)</li>
          <li>• <strong>Formula</strong>: Power (MW) = (typical_load_kw / 1000) × scale_factor</li>
          <li>• <strong>Duration</strong>: Recommended battery storage hours for the use case</li>
          <li>• <strong>Solar Ratio</strong>: Currently hardcoded 1:1 (future: add to database)</li>
        </ul>
      </div>
    </div>
  );
}
