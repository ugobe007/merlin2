// ═══════════════════════════════════════════════════════════════════════════
// GOALS INFRASTRUCTURE - Extracted Dec 16, 2025
// Generator and Grid Connection components
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Fuel, Zap, Sparkles, Info, Minus, Plus } from 'lucide-react';
import { 
  GENERATOR_RESERVE_MARGIN,
  getCriticalLoadPercentage,
} from '../../constants/wizardConstants';
import type { SubComponentProps } from './GoalsSharedComponents';

// ═══════════════════════════════════════════════════════════════════════════
// GENERATOR TOGGLE
// ═══════════════════════════════════════════════════════════════════════════

export function GeneratorToggle({ wizardState, setWizardState, highlightForPower = false }: SubComponentProps) {
  // Highlight when user needs more power and hasn't selected generator yet
  const showHighlight = highlightForPower && !wizardState.wantsGenerator;
  
  return (
    <div className={`rounded-2xl p-6 border-2 mb-6 transition-all relative overflow-hidden ${
      showHighlight
        ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-500 shadow-xl shadow-blue-500/40 animate-pulse ring-2 ring-blue-400 ring-offset-2'
        : wizardState.wantsGenerator
          ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-400 shadow-lg shadow-slate-500/20'
          : 'bg-gradient-to-br from-slate-50/50 to-gray-50/50 border-slate-200'
    }`}>
      {/* Highlight banner when needs more power */}
      {showHighlight && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold py-1 px-3 text-center">
          ⚡ RECOMMENDED - Backup power for reliability!
        </div>
      )}
      
      <label className={`flex items-center gap-4 cursor-pointer ${showHighlight ? 'pt-6' : ''}`}>
        <input
          type="checkbox"
          checked={wizardState.wantsGenerator}
          onChange={(e) => {
            // Generator sizing v2.0: Critical Load × Reserve Margin (1.25)
            // Critical load depends on industry - get percentage from constants
            // Source: LADWP, NEC 700/701/702, WPP Sizing Guide
            const peakKW = wizardState.batteryKW || 500;
            const criticalLoadPct = getCriticalLoadPercentage(wizardState.selectedIndustry || 'default');
            const criticalLoadKW = peakKW * criticalLoadPct;
            const recommendedGeneratorKW = Math.round(criticalLoadKW * GENERATOR_RESERVE_MARGIN);
            
            setWizardState(prev => ({
              ...prev,
              wantsGenerator: e.target.checked,
              generatorKW: e.target.checked ? recommendedGeneratorKW : 0
            }));
          }}
          className="w-6 h-6 rounded accent-slate-500"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Fuel className={`w-5 h-5 ${showHighlight ? 'text-blue-600 animate-bounce' : 'text-slate-600'}`} />
            <span className={`font-bold ${showHighlight ? 'text-blue-800' : 'text-gray-800'}`}>Add Backup Generator</span>
            {showHighlight && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                +Power!
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Extended backup for critical operations</p>
        </div>
        {wizardState.wantsGenerator && (
          <select
            value={wizardState.generatorFuel}
            onChange={(e) => setWizardState(prev => ({ ...prev, generatorFuel: e.target.value as any }))}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-purple-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
          >
            <option value="natural-gas">Natural Gas</option>
            <option value="diesel">Diesel</option>
            <option value="propane">Propane</option>
          </select>
        )}
      </label>

      {wizardState.wantsGenerator && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          {/* Generator Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorType: 'traditional' }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                wizardState.generatorType !== 'linear' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚙️</span>
                <span className="font-bold text-sm text-gray-800">Traditional</span>
              </div>
              <p className="text-xs text-gray-500">Diesel/NG engines</p>
            </button>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorType: 'linear' }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                wizardState.generatorType === 'linear' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔋</span>
                <span className="font-bold text-sm text-gray-800">Linear Generator</span>
              </div>
              <p className="text-xs text-gray-500">Mainspring, Bloom Energy</p>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700 font-medium">Merlin recommends:</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold text-xs">
              {Math.round((wizardState.batteryKW || 500) * getCriticalLoadPercentage(wizardState.selectedIndustry || 'default') * GENERATOR_RESERVE_MARGIN)} kW
            </span>
            <span className="text-xs text-gray-400">
              ({Math.round(getCriticalLoadPercentage(wizardState.selectedIndustry || 'default') * 100)}% critical load × 1.25)
            </span>
          </div>

          {/* Generator Power Slider */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 w-24">Generator:</span>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorKW: Math.max(50, prev.generatorKW - 100) }))}
              className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
            ><Minus className="w-5 h-5" /></button>
            <div className="flex-1">
              <input
                type="range"
                min="50"
                max="20000"
                step="50"
                value={wizardState.generatorKW}
                onChange={(e) => setWizardState(prev => ({ ...prev, generatorKW: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
            </div>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, generatorKW: Math.min(20000, prev.generatorKW + 100) }))}
              className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
            ><Plus className="w-5 h-5" /></button>
            <div className="w-32 text-right">
              {wizardState.generatorKW >= 1000 ? (
                <><span className="text-2xl font-black text-slate-700">{(wizardState.generatorKW / 1000).toFixed(1)}</span><span className="text-sm text-gray-500 ml-1">MW</span></>
              ) : (
                <><span className="text-2xl font-black text-slate-700">{wizardState.generatorKW}</span><span className="text-sm text-gray-500 ml-1">kW</span></>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Fuel Type</div>
              <div className="font-bold text-slate-700 capitalize">{wizardState.generatorFuel.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Voltage</div>
              <div className="font-bold text-slate-700">480V 3Φ</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Amperage</div>
              <div className="font-bold text-slate-700">{Math.round(wizardState.generatorKW / 0.48 / 1.732)}A</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Cost</div>
              <div className="font-bold text-slate-700">${(wizardState.generatorKW * (wizardState.generatorType === 'linear' ? 2500 : 800)).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GRID CONNECTION SECTION
// ═══════════════════════════════════════════════════════════════════════════

export function GridConnectionSection({ wizardState, setWizardState }: SubComponentProps) {
  const options = [
    { id: 'on-grid' as const, label: 'Grid-Tied', description: 'Reliable connection', icon: '🔌' },
    { id: 'unreliable' as const, label: 'Unreliable Grid', description: 'Frequent outages', icon: '⚠️' },
    { id: 'expensive' as const, label: 'Grid Too Expensive', description: 'High rates', icon: '💰' },
    { id: 'limited' as const, label: 'Limited Grid', description: 'Constrained capacity', icon: '📉' },
    { id: 'off-grid' as const, label: 'Off-Grid', description: 'No utility', icon: '🏝️' },
  ];

  return (
    <div className="rounded-2xl p-6 border-2 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 mb-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gray-100">
          <Zap className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800">Grid Connection Status</h4>
          <p className="text-sm text-gray-500">How is your facility connected?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setWizardState(prev => ({ ...prev, gridConnection: option.id }))}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              wizardState.gridConnection === option.id
                ? 'border-purple-400 bg-purple-50 shadow-lg shadow-purple-500/20'
                : 'border-gray-200 bg-white hover:border-purple-400/50'
            }`}
          >
            <div className="text-2xl mb-2">{option.icon}</div>
            <div className={`font-bold text-sm ${wizardState.gridConnection === option.id ? 'text-purple-700' : 'text-gray-700'}`}>
              {option.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {wizardState.gridConnection !== 'on-grid' && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          wizardState.gridConnection === 'off-grid' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
          wizardState.gridConnection === 'expensive' ? 'bg-green-50 border border-green-200 text-green-700' :
          wizardState.gridConnection === 'unreliable' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              {wizardState.gridConnection === 'off-grid' && 'Off-grid systems require larger battery capacity and backup generation.'}
              {wizardState.gridConnection === 'expensive' && 'BESS + solar can dramatically reduce your energy costs.'}
              {wizardState.gridConnection === 'unreliable' && 'We\'ll recommend backup power and longer battery duration.'}
              {wizardState.gridConnection === 'limited' && 'Limited grid means we\'ll size for greater self-reliance.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
