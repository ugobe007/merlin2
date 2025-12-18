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
import { ArrowLeft, ArrowRight, Sparkles, Battery, Sun, Wind, Zap, DollarSign, Clock, Shield, CheckCircle, Settings, ChevronRight, ChevronLeft, Home, Building } from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { ScenarioConfig, ScenarioGeneratorResult } from '@/services/scenarioGenerator';

interface ScenarioSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onHome?: () => void; // Navigate to vertical landing page
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
  onHome,
  scenarioResult,
  isGenerating,
  onGenerateScenarios,
  peakDemandKW,
  powerCoverage,
  onOpenAdvanced,
  onSelectScenario,
}: ScenarioSectionProps) {
  // Removed popup modal - show cards directly (Dec 17, 2025)
  const [selectedType, setSelectedType] = useState<string | null>(
    wizardState.selectedScenario?.type || null
  );
  
  // Track if scenarios have been generated for this session
  // This prevents re-generation when state changes (clicking a scenario card)
  const scenariosGeneratedRef = useRef(false);

  // Auto-generate scenarios when entering section (ONCE per session)
  // Dec 16, 2025 - Fixed: Used ref to prevent re-generation when wizardState changes
  useEffect(() => {
    // Only generate if:
    // 1. We're on section 5 (Dec 17, 2025 - updated from section 4)
    // 2. No scenarios exist yet
    // 3. Not currently generating
    // 4. Haven't already generated this session (ref check)
    if (currentSection === 5 && !scenarioResult && !isGenerating && !scenariosGeneratedRef.current) {
      scenariosGeneratedRef.current = true;
      onGenerateScenarios();
    }
  }, [currentSection, scenarioResult, isGenerating, onGenerateScenarios]);
  
  // Reset the ref when leaving section (so scenarios regenerate if user goes back)
  useEffect(() => {
    if (currentSection !== 5) {
      scenariosGeneratedRef.current = false;
    }
  }, [currentSection]);

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

  // ScenarioSection is now Section 5 (after ConfigurationComparison) - Dec 17, 2025
  if (currentSection !== 5) return null;

  return (
    <div
      ref={sectionRef}
      className="min-h-[calc(100vh-120px)] p-4 md:p-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GUIDANCE BANNER - Consistent with ConfigurationComparison
            Using Merlin palette
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8 bg-gradient-to-br from-[#ffd689]/20 via-[#ffa600]/10 to-[#fc9420]/10 border-4 border-[#ffa600] rounded-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-5">
            {/* Merlin Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6700b6] to-[#060F76] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#ad42ff]">
                  <Sparkles className="w-8 h-8 text-[#ffa600]" />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">Explore Alternative Configurations</h2>
                <span className="px-3 py-1 bg-[#6700b6] text-white text-sm font-bold rounded-full">
                  Step 5 of 7
                </span>
                <span className="px-3 py-1 bg-[#ffa600]/30 text-[#ffd689] text-sm font-medium rounded-full border border-[#ffa600]">
                  Optional
                </span>
              </div>
              
              <p className="text-white/90 leading-relaxed">
                Based on your <strong className="text-[#ffd689]">{wizardState.industryName || 'facility'}</strong> profile, 
                I've created 3 optimized variations. You can explore these or keep your current configuration.
              </p>
            </div>
          </div>
        </div>
        
        {/* Header with Back/Home */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-[#060F76] hover:bg-[#0815a9] text-white font-medium rounded-lg transition-colors border-2 border-[#4b59f5]"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={onHome || onBack}
              className="flex items-center gap-2 px-4 py-2 bg-[#6700b6] hover:bg-[#7900d6] text-white rounded-lg border-2 border-[#ad42ff] transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
        
        {/* Skip Option - Users can continue without selecting a scenario */}
        <div className="bg-gradient-to-r from-[#8dcefb]/20 to-[#68BFFA]/10 border-4 border-[#68BFFA] rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#68BFFA] rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-white">Happy with your configuration?</p>
                <p className="text-[#8dcefb]">Skip this step and generate your TrueQuote™ with your current settings</p>
              </div>
            </div>
            <button
              onClick={onContinue}
              className="flex items-center gap-2 px-8 py-4 bg-[#68BFFA] hover:bg-[#48b1f8] text-white font-bold text-lg rounded-xl transition-colors whitespace-nowrap shadow-lg"
            >
              Keep My Configuration
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

          {/* ════════════════════════════════════════════════════════════════
              SMART SIZING SUMMARY - "We Understand Your Situation"
              This shows users that Merlin KNOWS their specific scenario
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#6700b6]/20 to-[#060F76]/20 rounded-2xl p-5 mb-6 border-2 border-[#ad42ff]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#6700b6] rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">We Sized This for YOUR {wizardState.industryName || 'Facility'}</h3>
                <p className="text-sm text-white/70">Based on what you told us, here's what we calculated</p>
              </div>
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {/* Peak Demand */}
              <div className="bg-[#060F76]/30 rounded-lg p-3 text-center border border-[#4b59f5]/30">
                <Zap className={`w-5 h-5 mx-auto mb-1 ${powerCoverage >= 100 ? 'text-[#68BFFA]' : 'text-[#ffa600]'}`} />
                <p className="text-lg font-bold text-white">{formatPower(peakDemandKW)}</p>
                <p className="text-xs text-gray-400">Peak Demand</p>
              </div>
              
              {/* Coverage */}
              <div className="bg-[#060F76]/30 rounded-lg p-3 text-center border border-[#4b59f5]/30">
                <Shield className={`w-5 h-5 mx-auto mb-1 ${powerCoverage >= 100 ? 'text-[#68BFFA]' : 'text-[#ffa600]'}`} />
                <p className={`text-lg font-bold ${powerCoverage >= 100 ? 'text-[#68BFFA]' : 'text-[#ffa600]'}`}>{powerCoverage}%</p>
                <p className="text-xs text-gray-400">Coverage</p>
              </div>
              
              {/* Location Rate */}
              <div className="bg-[#060F76]/30 rounded-lg p-3 text-center border border-[#4b59f5]/30">
                <DollarSign className="w-5 h-5 mx-auto mb-1 text-[#68BFFA]" />
                <p className="text-lg font-bold text-white">${wizardState.electricityRate?.toFixed(2) || '0.12'}</p>
                <p className="text-xs text-gray-400">{wizardState.state} Rate/kWh</p>
              </div>
              
              {/* Duration */}
              <div className="bg-[#060F76]/30 rounded-lg p-3 text-center border border-[#4b59f5]/30">
                <Clock className="w-5 h-5 mx-auto mb-1 text-[#ad42ff]" />
                <p className="text-lg font-bold text-white">{wizardState.durationHours || 4}hr</p>
                <p className="text-xs text-gray-400">Backup Time</p>
              </div>
            </div>
            
            {/* Selected Add-ons Display */}
            {(wizardState.solarKW > 0 || wizardState.windTurbineKW > 0 || wizardState.generatorKW > 0) && (
              <div className="bg-[#060F76]/20 rounded-lg p-3 border border-[#4b59f5]/40">
                <p className="text-xs text-gray-400 mb-2">Your Selected Add-ons:</p>
                <div className="flex flex-wrap gap-2">
                  {wizardState.solarKW > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffa600]/20 text-[#ffd689] rounded-full text-sm border border-[#ffa600]/40">
                      <Sun className="w-4 h-4" />
                      {formatPower(wizardState.solarKW)} Solar
                    </span>
                  )}
                  {wizardState.windTurbineKW > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#68BFFA]/20 text-[#8dcefb] rounded-full text-sm border border-[#68BFFA]/40">
                      <Wind className="w-4 h-4" />
                      {formatPower(wizardState.windTurbineKW)} Wind
                    </span>
                  )}
                  {wizardState.generatorKW > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#6700b6]/20 text-[#cc89ff] rounded-full text-sm border border-[#6700b6]/40">
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6700b6] border-t-transparent mb-4" />
              <p className="text-lg text-white font-medium">Generating optimized configurations...</p>
              <p className="text-sm text-gray-400 mt-1">Analyzing your facility data</p>
            </div>
          )}

          {/* Scenario Cards */}
          {scenarioResult && !isGenerating && (
            <>
              {/* Recommendation Banner */}
              <div className="bg-gradient-to-r from-[#6700b6]/20 to-[#ad42ff]/10 border-2 border-[#ad42ff] rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#6700b6] rounded-lg flex items-center justify-center">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#cc89ff]">Merlin's Recommendation</p>
                    <p className="text-white/80 text-sm">{scenarioResult.recommendationReason}</p>
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
                          ? 'border-[#ffa600] bg-[#ffa600]/10 ring-2 ring-[#ffa600] ring-offset-2 ring-offset-slate-900' 
                          : isRecommended 
                            ? 'border-[#6700b6] bg-[#6700b6]/10 hover:border-[#ad42ff]'
                            : 'border-slate-600 bg-slate-800/50 hover:border-[#68BFFA]'
                        }
                      `}
                    >
                      {/* Recommended Badge */}
                      {isRecommended && !isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-[#6700b6] text-white text-xs font-bold px-3 py-1 rounded-full">
                            RECOMMENDED
                          </span>
                        </div>
                      )}

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-[#ffa600] text-[#280047] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
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
                      ? 'bg-gradient-to-r from-[#6700b6] to-[#060F76] hover:from-[#7900d6] hover:to-[#0815a9] text-white shadow-lg hover:shadow-xl border-2 border-[#ad42ff]'
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
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#060F76] hover:bg-[#0815a9] text-white rounded-lg font-medium transition-colors border-2 border-[#4b59f5]"
                    >
                      <Settings className="w-4 h-4" />
                      Switch to Advanced Mode
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Best for energy professionals and detailed customization
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
}

export default ScenarioSection;
