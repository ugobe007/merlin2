import React, { useState, useEffect } from 'react';
import { useCaseService } from '../../services/useCaseService';
import type { EquipmentTemplateRow } from '../../services/useCaseService';

interface FormulaDefinition {
  id: string;
  name: string;
  category: 'power_sizing' | 'financial' | 'equipment' | 'solar' | 'storage';
  formula: string;
  variables: { name: string; description: string; unit: string }[];
  description: string;
  dataSource: string;
  lastUpdated: Date;
}

const CalculationsAdmin: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'formulas' | 'use_cases' | 'equipment'>('formulas');
  const [formulas, setFormulas] = useState<FormulaDefinition[]>([]);
  const [useCases, setUseCases] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<EquipmentTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFormula, setEditingFormula] = useState<FormulaDefinition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load use cases with configurations
      const useCasesData = await useCaseService.getAllUseCases(true);
      setUseCases(useCasesData || []);

      // Load equipment templates (will be implemented in useCaseService later)
      // For now, equipment will show as empty until we add the method
      setEquipment([]);

      // Load formulas (mock for now - will be stored in DB)
      setFormulas(getBuiltInFormulas());
    } catch (error) {
      console.error('Error loading calculations data:', error);
      setError('Failed to load data. The database tables may not be set up yet. Showing formulas only.');
      // Still set formulas even if use cases fail
      setFormulas(getBuiltInFormulas());
      setUseCases([]);
    } finally {
      setLoading(false);
    }
  };

  const getBuiltInFormulas = (): FormulaDefinition[] => {
    return [
      {
        id: 'hotel_power',
        name: 'Hotel Power Sizing',
        category: 'power_sizing',
        formula: 'power_mw = num_rooms × 0.00293',
        variables: [
          { name: 'num_rooms', description: 'Number of guest rooms', unit: 'rooms' },
          { name: 'power_mw', description: 'Required BESS power', unit: 'MW' }
        ],
        description: 'CBECS 2018 hospitality baseline: 440kW/150 rooms = 2.93 kW per room',
        dataSource: 'CBECS 2018, ASHRAE 90.1',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'datacenter_power',
        name: 'Data Center Power Sizing',
        category: 'power_sizing',
        formula: 'power_mw = it_load_mw × 0.25',
        variables: [
          { name: 'it_load_mw', description: 'IT equipment load', unit: 'MW' },
          { name: 'power_mw', description: 'Required BESS power', unit: 'MW' }
        ],
        description: 'Uptime Institute Tier III: 25% of IT load for backup + demand management',
        dataSource: 'Uptime Institute, IEEE 2450',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'ev_charging_power',
        name: 'EV Charging Power Sizing',
        category: 'power_sizing',
        formula: 'power_mw = (level2_chargers × 0.011 + dcfast_chargers × 0.15) × concurrency × 0.7',
        variables: [
          { name: 'level2_chargers', description: 'Number of Level 2 chargers', unit: 'chargers' },
          { name: 'dcfast_chargers', description: 'Number of DC Fast chargers', unit: 'chargers' },
          { name: 'concurrency', description: 'Peak concurrency factor', unit: 'decimal' },
          { name: 'power_mw', description: 'Required BESS power', unit: 'MW' }
        ],
        description: 'Demand management sizing for mixed charging infrastructure',
        dataSource: 'SAE J2894, CCS standards',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'simple_payback',
        name: 'Simple Payback Period',
        category: 'financial',
        formula: 'payback_years = total_cost / annual_savings',
        variables: [
          { name: 'total_cost', description: 'Total system cost', unit: 'USD' },
          { name: 'annual_savings', description: 'Annual cost savings', unit: 'USD/year' },
          { name: 'payback_years', description: 'Years to recover investment', unit: 'years' }
        ],
        description: 'Simple payback calculation without discounting',
        dataSource: 'Standard financial calculation',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'roi_calculation',
        name: 'Return on Investment (ROI)',
        category: 'financial',
        formula: 'roi_percent = ((annual_savings × lifetime_years - total_cost) / total_cost) × 100',
        variables: [
          { name: 'annual_savings', description: 'Annual cost savings', unit: 'USD/year' },
          { name: 'lifetime_years', description: 'System lifetime', unit: 'years' },
          { name: 'total_cost', description: 'Total system cost', unit: 'USD' },
          { name: 'roi_percent', description: 'Return on investment', unit: 'percent' }
        ],
        description: 'Total return on investment over system lifetime',
        dataSource: 'Standard financial calculation',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'solar_sizing',
        name: 'Solar System Sizing',
        category: 'solar',
        formula: 'solar_mw = bess_power_mw × solar_ratio',
        variables: [
          { name: 'bess_power_mw', description: 'BESS power capacity', unit: 'MW' },
          { name: 'solar_ratio', description: 'Solar to BESS ratio', unit: 'ratio' },
          { name: 'solar_mw', description: 'Recommended solar capacity', unit: 'MW' }
        ],
        description: 'Solar sizing based on BESS capacity and use case energy profile',
        dataSource: 'NREL Commercial Reference Buildings',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'storage_duration',
        name: 'Storage Duration Calculation',
        category: 'storage',
        formula: 'energy_mwh = power_mw × duration_hours',
        variables: [
          { name: 'power_mw', description: 'BESS power capacity', unit: 'MW' },
          { name: 'duration_hours', description: 'Storage duration', unit: 'hours' },
          { name: 'energy_mwh', description: 'Total energy capacity', unit: 'MWh' }
        ],
        description: 'Energy capacity calculation from power and duration',
        dataSource: 'IEEE 2450 BESS Standards',
        lastUpdated: new Date('2025-11-09')
      },
      {
        id: 'equipment_load',
        name: 'Equipment Effective Load',
        category: 'equipment',
        formula: 'effective_load_kw = nameplate_power_kw × duty_cycle',
        variables: [
          { name: 'nameplate_power_kw', description: 'Equipment nameplate power', unit: 'kW' },
          { name: 'duty_cycle', description: 'Typical duty cycle', unit: 'decimal' },
          { name: 'effective_load_kw', description: 'Effective average load', unit: 'kW' }
        ],
        description: 'Calculate average equipment load from nameplate and duty cycle',
        dataSource: 'ASHRAE 90.1, Equipment specifications',
        lastUpdated: new Date('2025-11-09')
      }
    ];
  };

  const filteredFormulas = formulas.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.includes(searchTerm.toLowerCase())
  );

  const renderFormulasList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-lg">📐</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">System Formulas</h3>
            <p className="text-gray-500 text-xs">Core calculation formulas used across the platform</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg shadow-md shadow-emerald-500/20 transition-all">
          + Add Formula
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search formulas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-white/80 text-gray-800 px-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder-gray-400"
      />

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'power_sizing', 'financial', 'equipment', 'solar', 'storage'].map(cat => (
          <button
            key={cat}
            className="px-3 py-1.5 rounded-lg bg-white/80 text-gray-600 hover:bg-purple-100 hover:text-purple-700 border border-gray-200 hover:border-purple-300 transition-all text-xs font-medium"
          >
            {cat === 'all' ? '📋 All' : cat.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Formulas Grid */}
      <div className="grid gap-3">
        {filteredFormulas.map(formula => (
          <div
            key={formula.id}
            className="bg-white/80 backdrop-blur-md border border-purple-100/50 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-1">{formula.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  formula.category === 'power_sizing' ? 'bg-blue-100 text-blue-700' :
                  formula.category === 'financial' ? 'bg-emerald-100 text-emerald-700' :
                  formula.category === 'equipment' ? 'bg-orange-100 text-orange-700' :
                  formula.category === 'solar' ? 'bg-amber-100 text-amber-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {formula.category.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setEditingFormula(formula)}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-all"
              >
                ✏️ Edit
              </button>
            </div>

            {/* Formula */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 rounded-lg mb-3">
              <p className="text-xs text-gray-400 mb-1">FORMULA:</p>
              <code className="text-emerald-400 font-mono text-sm">{formula.formula}</code>
            </div>

            {/* Variables */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">VARIABLES:</p>
              <div className="grid md:grid-cols-2 gap-2">
                {formula.variables.map(v => (
                  <div key={v.name} className="bg-purple-50/50 p-2 rounded-lg text-sm border border-purple-100">
                    <span className="text-purple-700 font-mono font-medium">{v.name}</span>
                    <span className="text-gray-500"> ({v.unit})</span>
                    <p className="text-gray-400 text-xs mt-1">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description & Source */}
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">{formula.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>📚 Source: {formula.dataSource}</span>
                <span>🕒 Updated: {formula.lastUpdated.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUseCasesConfig = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-lg">🏢</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Use Case Configurations</h3>
            <p className="text-gray-500 text-xs">Power profiles and calculations for each use case</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-lg shadow-md shadow-emerald-500/20 transition-all">
          + Add Use Case
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading use cases...</div>
      ) : (
        <div className="grid gap-3">
          {useCases.map(useCase => (
            <div
              key={useCase.id}
              className="bg-white/80 backdrop-blur-md border border-purple-100/50 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{useCase.icon}</span>
                  <div>
                    <h4 className="text-base font-bold text-gray-800">{useCase.name}</h4>
                    <p className="text-gray-500 text-xs">{useCase.description}</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-all">
                  ✏️ Edit
                </button>
              </div>

              {/* Configurations */}
              {useCase.default_configuration && (
                <div className="bg-slate-900/50 p-4 rounded-lg mt-4">
                  <p className="text-xs text-gray-400 mb-3">DEFAULT CONFIGURATION:</p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Typical Load:</span>
                      <p className="text-white font-semibold">
                        {useCase.default_configuration.typical_load_kw?.toFixed(1)} kW
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Peak Load:</span>
                      <p className="text-white font-semibold">
                        {useCase.default_configuration.peak_load_kw?.toFixed(1)} kW
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <p className="text-white font-semibold">
                        {useCase.default_configuration.preferred_duration_hours} hrs
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Demand Sensitivity:</span>
                      <p className="text-white font-semibold">
                        {useCase.default_configuration.demand_charge_sensitivity}×
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Expected Savings:</span>
                      <p className="text-green-400 font-semibold">
                        {useCase.default_configuration.typical_savings_percent}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Operating Hours:</span>
                      <p className="text-white font-semibold">
                        {useCase.default_configuration.daily_operating_hours} hrs/day
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Industry Standards */}
              {useCase.industry_standards && (
                <div className="mt-4 text-xs text-gray-500">
                  📚 Validation Sources: {useCase.validation_sources?.join(', ') || 'CBECS, ASHRAE, NREL'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEquipmentTemplates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">⚙️ Equipment Templates</h3>
          <p className="text-gray-400 text-sm">Equipment specifications and power calculations</p>
        </div>
        <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all">
          + Add Equipment
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading equipment...</div>
      ) : equipment.length === 0 ? (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">No equipment templates in database yet</p>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all">
            Import Equipment Data
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {equipment.map(eq => (
            <div
              key={eq.id}
              className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white">{eq.equipment_name}</h4>
                  <p className="text-gray-400 text-sm">{eq.equipment_category}</p>
                </div>
                <button className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-3 py-1 rounded text-xs font-semibold transition-all">
                  ✏️ Edit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Power:</span>
                  <p className="text-white font-semibold">{eq.nameplate_power_kw} kW</p>
                </div>
                <div>
                  <span className="text-gray-400">Duty Cycle:</span>
                  <p className="text-white font-semibold">{((eq.duty_cycle_percent || 0) / 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-gray-400">Efficiency:</span>
                  <p className="text-green-400 font-semibold">{eq.efficiency_percent}%</p>
                </div>
                <div>
                  <span className="text-gray-400">Lifetime:</span>
                  <p className="text-white font-semibold">{eq.equipment_lifetime_years || 'N/A'} years</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Section Navigation */}
      <div className="flex gap-2">
        {[
          { key: 'formulas', label: '📐 Formulas', icon: '📐' },
          { key: 'use_cases', label: '🏢 Use Cases', icon: '🏢' },
          { key: 'equipment', label: '⚙️ Equipment', icon: '⚙️' }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => {
              if (import.meta.env.DEV) { console.log('Tab clicked:', section.key); }
              setActiveSection(section.key as typeof activeSection);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeSection === section.key
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/80 text-gray-600 hover:text-purple-700 hover:bg-purple-50 border border-gray-200'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-amber-700 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeSection === 'formulas' && renderFormulasList()}
        {activeSection === 'use_cases' && renderUseCasesConfig()}
        {activeSection === 'equipment' && renderEquipmentTemplates()}
      </div>

      {/* Edit Formula Modal */}
      {editingFormula && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-purple-200 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Edit Formula: {editingFormula.name}</h3>
                <button
                  onClick={() => setEditingFormula(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formula Name</label>
                  <input
                    type="text"
                    value={editingFormula.name}
                    className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formula Expression</label>
                  <input
                    type="text"
                    value={editingFormula.formula}
                    className="w-full bg-gray-800 text-emerald-400 font-mono px-4 py-2.5 rounded-xl border border-gray-700 focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingFormula.description}
                    rows={3}
                    className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                  <input
                    type="text"
                    value={editingFormula.dataSource}
                    className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md shadow-emerald-500/20 transition-all">
                    💾 Save Changes
                  </button>
                  <button
                    onClick={() => setEditingFormula(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationsAdmin;
