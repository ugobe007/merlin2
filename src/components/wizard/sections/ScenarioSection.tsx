/**
 * SCENARIO SECTION (Section 4) - MAGIC FIT™
 * ==========================================
 * 
 * Shows 3 optimized savings options AFTER user preferences (Goals).
 * User sees personalized configurations based on what they told us.
 * 
 * Flow:
 * 1. Pop-up explains Magic Fit (on first visit)
 * 2. "We understood your situation" summary shows our analysis
 * 3. User sees 3 personalized savings options
 * 4. Pro users can escape to Advanced Quote Builder
 * 5. User selects and proceeds to final quote
 * 
 * Updated: Dec 15, 2025 - Added "Smart Sizing" and "Pro Mode" escape hatch
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Info, Battery, Sun, Wind, Zap, DollarSign, Clock, Shield, CheckCircle, Settings, ChevronRight, ChevronLeft, Home, Building } from 'lucide-react';
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
  /** Navigate to Advanced Quote Builder for pro users */
  onOpenAdvanced?: () => void;
  /** Dec 16, 2025: Callback when user selects a scenario - triggers AcceptCustomizeModal */
  onSelectScenario?: (scenario: ScenarioConfig) => void;
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
  onOpenAdvanced,
  onSelectScenario,
}: ScenarioSectionProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [hasSeenExplainer, setHasSeenExplainer] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(
    wizardState.selectedScenario?.type || null
  );
  
  // Track if scenarios have been generated for this session
  // This prevents re-generation when state changes (clicking a scenario card)
  const scenariosGeneratedRef = useRef(false);

  // Show explainer on first visit and auto-generate scenarios
  // ScenarioSection is now Section 4 - comes AFTER Goals
  useEffect(() => {
    if (currentSection === 4 && !hasSeenExplainer) {
      setShowExplainer(true);
    }
  }, [currentSection, hasSeenExplainer]);

  // Auto-generate scenarios when entering section (ONCE per session)
  // Dec 16, 2025 - Fixed: Used ref to prevent re-generation when wizardState changes
  useEffect(() => {
    // Only generate if:
    // 1. We're on section 4
    // 2. No scenarios exist yet
    // 3. Not currently generating
    // 4. Haven't already generated this session (ref check)
    if (currentSection === 4 && !scenarioResult && !isGenerating && !scenariosGeneratedRef.current) {
      scenariosGeneratedRef.current = true;
      onGenerateScenarios();
    }
  }, [currentSection, scenarioResult, isGenerating, onGenerateScenarios]);
  
  // Reset the ref when leaving section (so scenarios regenerate if user goes back)
  useEffect(() => {
    if (currentSection !== 4) {
      scenariosGeneratedRef.current = false;
    }
  }, [currentSection]);

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
      // Also store quoteResult from scenario for AcceptCustomizeModal
      quoteResult: scenario.quoteResult,
    }));
    
    // Dec 16, 2025: Call parent callback to trigger AcceptCustomizeModal
    if (onSelectScenario) {
      onSelectScenario(scenario);
    }
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

  // ScenarioSection is now Section 4 (after Goals)
  if (currentSection !== 4) return null;

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
          {/* Header with Back/Home */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={onBack} // Home goes back to hero
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg border border-slate-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
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
              <span className="text-purple-300 font-medium">Step 4 of 5</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Your Savings Options
            </h2>
            <p className="text-gray-400">
              Based on your {wizardState.industryName || 'facility'} and preferences, here are 3 ways to save
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SMART SIZING SUMMARY - "We Understand Your Situation"
              This shows users that Merlin KNOWS their specific scenario
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 rounded-2xl p-5 mb-6 border border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">We Sized This for YOUR {wizardState.industryName || 'Facility'}</h3>
                <p className="text-sm text-gray-400">Based on what you told us, here's what we calculated</p>
              </div>
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {/* Peak Demand */}
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <Zap className={`w-5 h-5 mx-auto mb-1 ${powerCoverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <p className="text-lg font-bold text-white">{formatPower(peakDemandKW)}</p>
                <p className="text-xs text-gray-500">Peak Demand</p>
              </div>
              
              {/* Coverage */}
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <Shield className={`w-5 h-5 mx-auto mb-1 ${powerCoverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <p className={`text-lg font-bold ${powerCoverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{powerCoverage}%</p>
                <p className="text-xs text-gray-500">Coverage</p>
              </div>
              
              {/* Location Rate */}
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold text-white">${wizardState.electricityRate?.toFixed(2) || '0.12'}</p>
                <p className="text-xs text-gray-500">{wizardState.state} Rate/kWh</p>
              </div>
              
              {/* Duration */}
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <p className="text-lg font-bold text-white">{wizardState.durationHours || 4}hr</p>
                <p className="text-xs text-gray-500">Backup Time</p>
              </div>
            </div>
            
            {/* Selected Add-ons Display */}
            {(wizardState.solarKW > 0 || wizardState.windTurbineKW > 0 || wizardState.generatorKW > 0) && (
              <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-gray-500 mb-2">Your Selected Add-ons:</p>
                <div className="flex flex-wrap gap-2">
                  {wizardState.solarKW > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">
                      <Sun className="w-4 h-4" />
                      {formatPower(wizardState.solarKW)} Solar
                    </span>
                  )}
                  {wizardState.windTurbineKW > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-sm">
                      <Wind className="w-4 h-4" />
                      {formatPower(wizardState.windTurbineKW)} Wind
                    </span>
                  )}
                  {wizardState.generatorKW > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/20 text-slate-300 rounded-full text-sm">
                      <Zap className="w-4 h-4" />
                      {formatPower(wizardState.generatorKW)} Generator
                    </span>
                  )}
                </div>
              </div>
            )}
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

              {/* Continue Button - Generate TrueQuote™ */}
              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={!wizardState.selectedScenario}
                  className={`
                    px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2
                    ${wizardState.selectedScenario
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {wizardState.selectedScenario ? (
                    <>
                      Generate TrueQuote™
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    'Select an Option to Continue'
                  )}
                </button>
              </div>

              {/* Help Text */}
              <p className="text-center text-sm text-gray-500 mt-4">
                Don't worry - you can adjust your configuration after selecting goals
              </p>
              
              {/* ════════════════════════════════════════════════════════════════
                  PRO MODE ESCAPE HATCH
                  For professional energy people who want full control
              ════════════════════════════════════════════════════════════════ */}
              {onOpenAdvanced && (
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">
                      Want more control? Our Advanced Quote Builder lets you customize every detail.
                    </p>
                    <button
                      onClick={onOpenAdvanced}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg font-medium transition-colors border border-slate-600"
                    >
                      <Settings className="w-4 h-4" />
                      Switch to Advanced Mode
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-600 mt-2">
                      Best for energy professionals and detailed customization
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ScenarioSection;
