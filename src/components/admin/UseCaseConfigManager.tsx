/**
 * Use Case Configuration Manager
 *
 * Admin interface for managing baseline configurations in the database.
 * Allows updating typical_load_kw, preferred_duration_hours, and other
 * baseline parameters without code changes.
 */

import React, { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle, CheckCircle, Edit2, X, Plus } from "lucide-react";
import {
  useCaseService,
  type DetailedUseCase,
  type UseCaseConfigurationRow,
} from "../../services/useCaseService";
import { calculateDatabaseBaseline } from "../../services/baselineService";

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
      setError(err instanceof Error ? err.message : "Failed to load use cases");
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
      setTestResults((prev) => ({
        ...prev,
        [slug]: result,
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [slug]: { error: err instanceof Error ? err.message : "Test failed" },
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
        is_default: config.is_default ?? undefined,
      });

      setSuccess(`Configuration updated successfully`);
      setEditingId(null);

      // Reload data
      await loadUseCases();

      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(null);
    }
  };

  // Update local state
  const updateLocalConfig = (
    useCaseId: string,
    configId: string,
    field: keyof UseCaseConfigurationRow,
    value: any
  ) => {
    setUseCases((prev) =>
      prev.map((uc) => {
        if (uc.id === useCaseId) {
          return {
            ...uc,
            configurations: uc.configurations.map((config) =>
              config.id === configId ? { ...config, [field]: value } : config
            ),
          };
        }
        return uc;
      })
    );
  };

  if (loading) {
    return (
      <div className="admin-supabase flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--intel)]" />
        <span className="ml-3 admin-subtitle">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="admin-supabase max-w-7xl mx-auto space-y-4">
      <div className="admin-stroke admin-stroke-row">
        <div>
          <h1 className="admin-title text-xl">Use Case Configuration Manager</h1>
          <p className="admin-subtitle mt-1">
            Manage baseline calculations for all use cases. Changes affect SmartWizard and AI
            recommendations.
          </p>
        </div>
        <button type="button" onClick={loadUseCases} className="admin-btn-stroke admin-btn-primary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-stroke admin-health-fail admin-stroke-row">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="admin-btn-stroke">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-stroke admin-health-pass admin-stroke-row">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-0">
        {useCases.map((useCase) => {
          const testResult = testResults[useCase.slug];

          return (
            <div key={useCase.id} className="admin-stroke border-b-0">
              <div className="admin-stroke-row flex-col !items-start gap-2">
                <div className="flex items-start justify-between w-full gap-3">
                  <div>
                    <h2 className="font-semibold text-[var(--ink-primary)]">{useCase.name}</h2>
                    <p className="admin-subtitle">{useCase.description}</p>
                    <span className="admin-code mt-1 inline-block">{useCase.slug}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => testBaseline(useCase.slug)}
                    className="admin-btn-stroke admin-btn-primary shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Test Baseline
                  </button>
                </div>

                {testResult && (
                  <div className="admin-stroke w-full">
                    {testResult.error ? (
                      <div className="admin-stroke-row admin-health-fail">{testResult.error}</div>
                    ) : (
                      <div className="admin-kpi-grid !grid-cols-4">
                        <div className="admin-kpi-cell">
                          <div className="admin-kpi-value">{testResult.powerMW} MW</div>
                          <div className="admin-kpi-label">Power</div>
                        </div>
                        <div className="admin-kpi-cell">
                          <div className="admin-kpi-value">{testResult.durationHrs} hrs</div>
                          <div className="admin-kpi-label">Duration</div>
                        </div>
                        <div className="admin-kpi-cell">
                          <div className="admin-kpi-value">{testResult.solarMW} MW</div>
                          <div className="admin-kpi-label">Solar</div>
                        </div>
                        <div className="admin-kpi-cell">
                          <div className="admin-kpi-value text-[var(--intel)]">
                            {testResult.dataSource}
                          </div>
                          <div className="admin-kpi-label">Source</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                {useCase.configurations.length === 0 ? (
                  <div className="admin-stroke-row flex-col items-center text-center">
                    <AlertCircle className="w-8 h-8 text-[var(--ink-muted)] mb-2" />
                    <p className="admin-subtitle">
                      No configurations found. Add a default configuration to enable baseline
                      calculations.
                    </p>
                    <button type="button" className="admin-btn-stroke admin-btn-primary mt-2">
                      <Plus className="w-4 h-4" />
                      Add Configuration
                    </button>
                  </div>
                ) : (
                  useCase.configurations.map((config) => {
                    const isEditing = editingId === config.id;
                    const isSaving = saving === config.id;

                    return (
                      <div
                        key={config.id}
                        className={`border-t border-[var(--glass-border)] ${config.is_default ? "admin-health-pass" : ""}`}
                      >
                        <div className="admin-stroke-row">
                          <div className="flex items-center gap-2">
                            {config.is_default && (
                              <span className="admin-code text-emerald-400">DEFAULT</span>
                            )}
                            {config.config_name && (
                              <span className="text-[var(--ink-primary)]">
                                {config.config_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveConfig(config)}
                                  disabled={isSaving}
                                  className="admin-btn-stroke admin-btn-primary disabled:opacity-50"
                                >
                                  {isSaving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(null);
                                    loadUseCases();
                                  }}
                                  className="admin-btn-stroke"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingId(config.id)}
                                className="admin-btn-stroke admin-btn-primary"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="admin-kpi-grid !grid-cols-3 border-t-0 border-x-0">
                          <div className="admin-kpi-cell">
                            <div className="admin-section-label">Typical Load (kW)</div>
                            {isEditing ? (
                              <input
                                type="number"
                                value={config.typical_load_kw ?? 0}
                                onChange={(e) =>
                                  updateLocalConfig(
                                    useCase.id,
                                    config.id,
                                    "typical_load_kw",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="admin-input w-full mt-1"
                              />
                            ) : (
                              <div className="admin-kpi-value">
                                {(config.typical_load_kw ?? 0).toLocaleString()}
                              </div>
                            )}
                            <div className="admin-subtitle mt-1">Baseline power sizing</div>
                          </div>
                          <div className="admin-kpi-cell">
                            <div className="admin-section-label">Peak Load (kW)</div>
                            {isEditing ? (
                              <input
                                type="number"
                                value={config.peak_load_kw ?? 0}
                                onChange={(e) =>
                                  updateLocalConfig(
                                    useCase.id,
                                    config.id,
                                    "peak_load_kw",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="admin-input w-full mt-1"
                              />
                            ) : (
                              <div className="admin-kpi-value">
                                {(config.peak_load_kw ?? 0).toLocaleString()}
                              </div>
                            )}
                            <div className="admin-subtitle mt-1">Maximum power requirement</div>
                          </div>
                          <div className="admin-kpi-cell">
                            <div className="admin-section-label">Duration (hours)</div>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                value={config.preferred_duration_hours ?? 0}
                                onChange={(e) =>
                                  updateLocalConfig(
                                    useCase.id,
                                    config.id,
                                    "preferred_duration_hours",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="admin-input w-full mt-1"
                              />
                            ) : (
                              <div className="admin-kpi-value">
                                {config.preferred_duration_hours}
                              </div>
                            )}
                            <div className="admin-subtitle mt-1">Battery duration</div>
                          </div>
                        </div>

                        <div className="admin-kpi-grid !grid-cols-4 border-t-0 border-x-0">
                          <div className="admin-kpi-cell">
                            <div className="admin-kpi-label">Base Power (MW)</div>
                            <div className="text-[var(--intel)] font-semibold">
                              {((config.typical_load_kw ?? 0) / 1000).toFixed(2)}
                            </div>
                          </div>
                          <div className="admin-kpi-cell">
                            <div className="admin-kpi-label">Energy (MWh)</div>
                            <div className="text-[var(--magic)] font-semibold">
                              {(
                                ((config.typical_load_kw ?? 0) / 1000) *
                                (config.preferred_duration_hours ?? 0)
                              ).toFixed(2)}
                            </div>
                          </div>
                          <div className="admin-kpi-cell">
                            <div className="admin-kpi-label">Peak Factor</div>
                            <div className="text-amber-400 font-semibold">
                              {((config.peak_load_kw ?? 0) / (config.typical_load_kw || 1)).toFixed(
                                2
                              )}
                              x
                            </div>
                          </div>
                          <div className="admin-kpi-cell">
                            <div className="admin-kpi-label">Config ID</div>
                            <div className="admin-code">{config.id.substring(0, 8)}…</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-stroke admin-stroke-row flex-col !items-start gap-2">
        <h3 className="font-semibold text-[var(--ink-primary)]">How Baseline Calculations Work</h3>
        <ul className="admin-subtitle space-y-1 list-none">
          <li>Typical Load: base power requirement (kW) for the use case</li>
          <li>
            Scale Factor: multiplier based on size (e.g., 100 rooms = 2× for 50-room baseline)
          </li>
          <li>Formula: Power (MW) = (typical_load_kw / 1000) × scale_factor</li>
          <li>Duration: recommended battery storage hours</li>
          <li>Solar Ratio: currently hardcoded 1:1 (future: add to database)</li>
        </ul>
      </div>
    </div>
  );
}
