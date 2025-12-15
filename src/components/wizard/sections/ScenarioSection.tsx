/**
 * SCENARIO SECTION (Section 3)
 * =============================
 * 
 * Shows 3 configuration scenarios BEFORE goals.
 * User selects their preferred optimization strategy, then moves to goals.
 * 
 * Flow:
 * 1. Pop-up explains scenarios (on first visit)
 * 2. User sees Merlin's initial recommendation
 * 3. User can select one of 3 scenario cards
 * 4. User proceeds to Goals section
 * 
 * Created: Dec 2025
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Info, Battery, Sun, Zap, DollarSign, Clock, Shield, CheckCircle } from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { ScenarioConfig, ScenarioGeneratorResult } from '@/services/scenarioGenerator';
import { ScenarioExplainerModal } from '../modals/ScenarioExplainerModal';

interface ScenarioSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  scenarioResult: ScenarioGeneratorResult | null;
  isGenerating: boolean;
  onGenerateScenarios: () => Promise<void>;
  /** Peak demand from centralized calculations */
  peakDemandKW: number;
  /** Power coverage percentage */
  powerCoverage: number;
}

export function ScenarioSection({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  scenarioResult,
  isGenerating,
  onGenerateScenarios,
  peakDemandKW,
  powerCoverage,
}: ScenarioSectionProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [hasSeenExplainer, setHasSeenExplainer] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(
    wizardState.selectedScenario?.type || null
  );

  // Show explainer on first visit and auto-generate scenarios
  useEffect(() => {
    if (currentSection === 3 && !hasSeenExplainer) {
      setShowExplainer(true);
    }
  }, [currentSection, hasSeenExplainer]);

  // Auto-generate scenarios when entering section
  useEffect(() => {
    if (currentSection === 3 && !scenarioResult && !isGenerating) {
      onGenerateScenarios();
    }
  }, [currentSection, scenarioResult, isGenerating, onGenerateScenarios]);

  const handleExplainerContinue = () => {
    setShowExplainer(false);
    setHasSeenExplainer(true);
  };

  const handleSelectScenario = (scenario: ScenarioConfig) => {
    setSelectedType(scenario.type);
    setWizardState(prev => ({
      ...prev,
      selectedScenario: scenario,
      batteryKW: scenario.batteryKW,
      batteryKWh: scenario.batteryKWh,
      durationHours: scenario.durationHours,
      solarKW: scenario.solarKW,
      generatorKW: scenario.generatorKW,
    }));
  };

  const handleContinue = () => {
    if (wizardState.selectedScenario) {
      onContinue();
    }
  };

  // Format helpers
  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
    return `$${Math.round(amt).toLocaleString()}`;
  };
  const formatPower = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatEnergy = (kwh: number) => kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;

  if (currentSection !== 3) return null;

  return (
    <>
      {/* Explainer Modal */}
      <ScenarioExplainerModal
        isOpen={showExplainer}
        onClose={() => { setShowExplainer(false); setHasSeenExplainer(true); }}
        onContinue={handleExplainerContinue}
      />

      <div
        ref={sectionRef}
        className="min-h-[calc(100vh-120px)] p-4 md:p-8"
      >
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Facility Details
            </button>
            <button
              onClick={() => setShowExplainer(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              What are these options?
            </button>
          </div>

          {/* Section Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Step 3 of 5</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Choose Your Optimization Strategy
            </h2>
            <p className="text-gray-400">
              Merlin has calculated 3 configurations based on your {wizardState.industryName || 'facility'}
            </p>
          </div>

          {/* Power Profile Summary */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={`w-6 h-6 ${powerCoverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <div>
                  <p className="text-white font-medium">Your Peak Demand: {formatPower(peakDemandKW)}</p>
                  <p className="text-sm text-gray-400">Based on your facility details</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${powerCoverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {powerCoverage}% Coverage
                </p>
                <p className="text-xs text-gray-500">Current configuration</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
              <p className="text-lg text-white font-medium">Generating optimized configurations...</p>
              <p className="text-sm text-gray-400 mt-1">Analyzing your facility data</p>
            </div>
          )}

          {/* Scenario Cards */}
          {scenarioResult && !isGenerating && (
            <>
              {/* Recommendation Banner */}
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-semibold text-blue-300">Merlin's Recommendation</p>
                    <p className="text-blue-200/80 text-sm">{scenarioResult.recommendationReason}</p>
                  </div>
                </div>
              </div>

              {/* 3 Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {scenarioResult.scenarios.map((scenario, index) => {
                  const isSelected = selectedType === scenario.type;
                  const isRecommended = index === scenarioResult.recommendedIndex;
                  
                  return (
                    <div
                      key={scenario.type}
                      onClick={() => handleSelectScenario(scenario)}
                      className={`
                        relative rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer
                        ${isSelected 
                          ? 'border-purple-400 bg-purple-900/30 ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' 
                          : isRecommended 
                            ? 'border-blue-400/60 bg-slate-800/80 hover:border-blue-400'
                            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                        }
                      `}
                    >
                      {/* Recommended Badge */}
                      {isRecommended && !isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            RECOMMENDED
                          </span>
                        </div>
                      )}

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            SELECTED
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="text-center mb-4 mt-2">
                        <span className="text-4xl mb-2 block">{scenario.icon}</span>
                        <h4 className="text-lg font-bold text-white">{scenario.name}</h4>
                        <p className="text-sm text-gray-400">{scenario.tagline}</p>
                      </div>

                      {/* Primary Metric */}
                      <div className="text-center py-4 border-t border-b border-slate-600/50">
                        <p className="text-sm text-gray-400 mb-1">Net Investment</p>
                        <p className="text-3xl font-bold text-white">{formatMoney(scenario.netCost)}</p>
                        <p className="text-xs text-gray-500">after incentives</p>
                      </div>

                      {/* Key Metrics */}
                      <div className="py-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Payback
                          </span>
                          <span className="font-semibold text-white">{scenario.paybackYears.toFixed(1)} years</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Annual Savings
                          </span>
                          <span className="font-semibold text-emerald-400">{formatMoney(scenario.annualSavings)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Backup Duration
                          </span>
                          <span className="font-semibold text-white">{scenario.backupHours}+ hours</span>
                        </div>
                      </div>

                      {/* Equipment Summary */}
                      <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-500 mb-2">System Includes:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Battery className="w-4 h-4 text-blue-400" />
                            <span>{formatPower(scenario.batteryKW)} / {formatEnergy(scenario.batteryKWh)}</span>
                          </div>
                          {scenario.solarKW > 0 && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Sun className="w-4 h-4 text-amber-400" />
                              <span>{formatPower(scenario.solarKW)} Solar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-1">
                        {scenario.highlights.slice(0, 2).map((highlight, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-gray-300">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={!wizardState.selectedScenario}
                  className={`
                    px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2
                    ${wizardState.selectedScenario
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {wizardState.selectedScenario ? (
                    <>
                      Continue to Goals
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    'Select a Strategy to Continue'
                  )}
                </button>
              </div>

              {/* Help Text */}
              <p className="text-center text-sm text-gray-500 mt-4">
                Don't worry - you can adjust your configuration after selecting goals
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ScenarioSection;
