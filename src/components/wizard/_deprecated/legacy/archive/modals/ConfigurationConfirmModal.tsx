/**
 * CONFIGURATION CONFIRMATION MODAL
 * =================================
 * 
 * Pop-up shown before advancing to the final quote.
 * Summarizes user's selections (scenario + goals) and Merlin's adjusted configuration.
 * User can confirm to proceed or go back to make changes.
 * 
 * Created: Dec 2025
 */

import React from 'react';
import { X, CheckCircle, AlertTriangle, Battery, Sun, Zap, Wind, Fuel, DollarSign, Clock, Shield, ArrowRight, ArrowLeft, Settings } from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { ScenarioConfig } from '@/services/scenarioGenerator';

interface ConfigurationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAdjust: () => void;
  wizardState: WizardState;
  selectedScenario: ScenarioConfig | null | undefined;
  powerCoverage?: number;
  peakDemandKW?: number;
}

export function ConfigurationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onAdjust,
  wizardState,
  selectedScenario,
  powerCoverage: propPowerCoverage,
  peakDemandKW: propPeakDemandKW,
}: ConfigurationConfirmModalProps) {
  if (!isOpen) return null;

  // Format helpers
  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
    return `$${Math.round(amt).toLocaleString()}`;
  };

  const formatPower = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;

  // Calculate power coverage (use props if available, otherwise calculate)
  const peakDemand = propPeakDemandKW || wizardState.peakDemandKW || 500;
  const batteryKW = selectedScenario?.batteryKW || wizardState.batteryKW || 0;
  const solarKW = selectedScenario?.solarKW || wizardState.solarKW || 0;
  const generatorKW = selectedScenario?.generatorKW || wizardState.generatorKW || 0;
  const totalSupply = batteryKW + solarKW + generatorKW;
  const coveragePercent = propPowerCoverage || (peakDemand > 0 ? Math.round((totalSupply / peakDemand) * 100) : 0);
  const isCovered = coveragePercent >= 100;

  // Goal labels
  const goalLabels: Record<string, string> = {
    'cost-savings': 'Reduce Energy Costs',
    'demand-management': 'Demand Charge Management',
    'backup-power': 'Backup Power',
    'sustainability': 'Sustainability / Green Energy',
    'grid-independence': 'Grid Independence',
    'ev-charging': 'EV Charging Support',
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Confirm Your Configuration</h2>
                <p className="text-emerald-100">Review before generating your final quote</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Power Coverage Status */}
          <div className={`rounded-xl p-4 border-2 ${isCovered ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isCovered ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                )}
                <span className={`font-bold ${isCovered ? 'text-emerald-800' : 'text-amber-800'}`}>
                  Power Coverage: {coveragePercent}%
                </span>
              </div>
              <span className={`text-sm ${isCovered ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatPower(totalSupply)} / {formatPower(peakDemand)} peak demand
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isCovered ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, coveragePercent)}%` }}
              />
            </div>
          </div>

          {/* Selected Strategy */}
          {selectedScenario && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Selected Strategy
              </h4>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{selectedScenario.icon}</span>
                <div>
                  <p className="font-bold text-gray-900">{selectedScenario.name}</p>
                  <p className="text-sm text-gray-500">{selectedScenario.tagline}</p>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-800 mb-4">Your System Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Battery */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <Battery className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Battery Storage</p>
                  <p className="font-bold text-gray-900">{formatPower(batteryKW)}</p>
                  <p className="text-xs text-gray-400">{selectedScenario?.durationHours || wizardState.durationHours || 4}hr duration</p>
                </div>
              </div>

              {/* Solar */}
              {solarKW > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <Sun className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-500">Solar</p>
                    <p className="font-bold text-gray-900">{formatPower(solarKW)}</p>
                  </div>
                </div>
              )}

              {/* Generator */}
              {generatorKW > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <Fuel className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Generator</p>
                    <p className="font-bold text-gray-900">{formatPower(generatorKW)}</p>
                  </div>
                </div>
              )}

              {/* Wind */}
              {wizardState.windTurbineKW > 0 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <Wind className="w-8 h-8 text-cyan-500" />
                  <div>
                    <p className="text-sm text-gray-500">Wind</p>
                    <p className="font-bold text-gray-900">{formatPower(wizardState.windTurbineKW)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Goals */}
          {wizardState.goals.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-3">Your Goals</h4>
              <div className="flex flex-wrap gap-2">
                {wizardState.goals.map((goal) => (
                  <span
                    key={goal}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {goalLabels[goal] || goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {selectedScenario && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-700">{formatMoney(selectedScenario.netCost)}</p>
                <p className="text-xs text-emerald-600">Net Investment</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">{selectedScenario.paybackYears.toFixed(1)} yrs</p>
                <p className="text-xs text-blue-600">Payback</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Shield className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700">{selectedScenario.backupHours}+ hrs</p>
                <p className="text-xs text-purple-600">Backup</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-3xl">
          <div className="flex gap-3">
            <button
              onClick={onAdjust}
              className="flex-1 py-3 px-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Adjust Configuration
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              Generate My Quote
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationConfirmModal;
