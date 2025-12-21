/**
 * STEP 4: MAGIC FIT™ - REDESIGNED
 * =================================
 * 
 * Updated: December 2025 - New design matching HTML reference
 * 
 * Features:
 * - Purple Merlin header
 * - Instruction bar
 * - Recommendation label
 * - 3 strategy cards with colored headers
 * - Selection confirmation bar
 * - Clean, minimal design
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Sparkles, Lightbulb, Battery, Sun, Zap, Fuel, TrendingUp, Calculator
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { ScenarioConfig, ScenarioGeneratorResult } from '@/services/scenarioGenerator';
import { MerlinGreeting } from '../shared';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';

interface Step4MagicFitProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onOpenProQuote?: () => void;
  scenarioResult: ScenarioGeneratorResult | null;
  isGenerating: boolean;
  onGenerateScenarios: () => Promise<void>;
  peakDemandKW: number;
  powerCoverage: number;
  onSelectScenario?: (scenario: ScenarioConfig) => void;
}

export function Step4MagicFit({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  onOpenProQuote,
  scenarioResult,
  isGenerating,
  onGenerateScenarios,
  peakDemandKW,
  powerCoverage,
  onSelectScenario,
}: Step4MagicFitProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ScenarioConfig | null>(
    wizardState.selectedScenario || null
  );
  
  // Track modified scenarios (for Super Size)
  const [modifiedScenarios, setModifiedScenarios] = useState<Map<string, ScenarioConfig>>(new Map());

  const scenariosGeneratedRef = React.useRef(false);

  // Auto-generate scenarios when entering section
  useEffect(() => {
    if (currentSection === 3 && !scenarioResult && !isGenerating && !scenariosGeneratedRef.current) {
      scenariosGeneratedRef.current = true;
      onGenerateScenarios();
    }
  }, [currentSection, scenarioResult, isGenerating, onGenerateScenarios]);

  useEffect(() => {
    if (currentSection !== 3) {
      scenariosGeneratedRef.current = false;
    }
  }, [currentSection]);

  const handleSelectStrategy = (scenario: ScenarioConfig) => {
    setSelectedStrategy(scenario);
    setWizardState(prev => ({
      ...prev,
      selectedScenario: scenario,
      batteryKW: scenario.batteryKW,
      batteryKWh: scenario.batteryKWh,
      durationHours: scenario.durationHours || 4,
      solarKW: scenario.solarKW,
      generatorKW: scenario.generatorKW,
    }));
    
    if (onSelectScenario) {
      onSelectScenario(scenario);
    }
  };
  
  // Handle Super Size - regenerate quote with increased specs
  const handleSuperSize = async (scenario: ScenarioConfig, cardElement?: HTMLElement) => {
    console.log('🚀 [Super Size] Increasing configuration by 40%...');
    
    // Increase specs by 40%
    const superSizedKW = Math.round(scenario.batteryKW * 1.4);
    const superSizedKWh = Math.round(scenario.batteryKWh * 1.4);
    const superSizedSolarKW = scenario.solarKW > 0 ? Math.round(scenario.solarKW * 1.4) : 0;
    const superSizedGeneratorKW = scenario.generatorKW > 0 ? Math.round(scenario.generatorKW * 1.4) : 0;
    
    // IMMEDIATE UI UPDATE: Update the modified scenarios map first for instant visual feedback
    const immediateScenario: ScenarioConfig = {
      ...scenario,
      batteryKW: superSizedKW,
      batteryKWh: superSizedKWh,
      solarKW: superSizedSolarKW,
      generatorKW: superSizedGeneratorKW,
      // Estimate financials temporarily (will be replaced with real calculations)
      annualSavings: Math.round(scenario.annualSavings * 1.3), // Rough estimate
      paybackYears: scenario.paybackYears,
      roi25Year: Math.round((scenario.roi25Year || 0) * 0.9), // Slight decrease due to higher cost
    };
    
    // Update state immediately for instant visual feedback
    setModifiedScenarios(prev => new Map(prev).set(scenario.type, immediateScenario));
    setSelectedStrategy(immediateScenario);
    
    // Scroll card into view if not already visible
    if (cardElement) {
      setTimeout(() => {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    
    try {
      // Regenerate quote with new sizes using SSOT (async, updates after)
      const updatedQuote = await calculateQuote({
        storageSizeMW: superSizedKW / 1000,
        durationHours: scenario.durationHours || 4,
        location: wizardState.state || 'California',
        electricityRate: wizardState.electricityRate || 0.12,
        useCase: wizardState.selectedIndustry || 'commercial',
        solarMW: superSizedSolarKW / 1000,
        generatorMW: superSizedGeneratorKW / 1000,
        generatorFuelType: 'natural-gas',
        gridConnection: wizardState.gridConnection === 'off-grid' ? 'off-grid' : 'on-grid',
      });
      
      // Create updated scenario with accurate financials from quote
      const superSizedScenario: ScenarioConfig = {
        ...scenario,
        batteryKW: superSizedKW,
        batteryKWh: superSizedKWh,
        solarKW: superSizedSolarKW,
        generatorKW: superSizedGeneratorKW,
        quoteResult: updatedQuote,
        // Update financials from new quote
        totalCost: updatedQuote.costs.totalProjectCost,
        netCost: updatedQuote.costs.netCost || updatedQuote.costs.totalProjectCost * 0.7,
        annualSavings: updatedQuote.financials.annualSavings || 0,
        paybackYears: updatedQuote.financials.paybackYears || 0,
        roi25Year: updatedQuote.financials.roi25Year || 0,
      };
      
      // Update with accurate financials
      setModifiedScenarios(prev => new Map(prev).set(scenario.type, superSizedScenario));
      setSelectedStrategy(superSizedScenario);
      
      // Update wizard state
      setWizardState(prev => ({
        ...prev,
        selectedScenario: superSizedScenario,
        batteryKW: superSizedScenario.batteryKW,
        batteryKWh: superSizedScenario.batteryKWh,
        solarKW: superSizedScenario.solarKW,
        generatorKW: superSizedScenario.generatorKW,
      }));
      
      if (onSelectScenario) {
        onSelectScenario(superSizedScenario);
      }
      
      console.log('✅ [Super Size] Configuration updated:', {
        batteryKW: superSizedKW,
        batteryKWh: superSizedKWh,
        annualSavings: superSizedScenario.annualSavings,
      });
    } catch (error) {
      console.error('❌ [Super Size] Failed to regenerate quote:', error);
      // Keep the immediate update, just log the error
    }
  };

  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(1)}M`;
    if (amt >= 1000) return `$${(amt / 1000).toFixed(0)}K`;
    return `$${Math.round(amt)}`;
  };

  const formatPower = (kw: number) => {
    if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
    return `${Math.round(kw)} kW`;
  };

  const formatEnergy = (kwh: number) => {
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
    return `${Math.round(kwh)} kWh`;
  };

  const getStrategyType = (scenario: ScenarioConfig): 'savings' | 'balanced' | 'resilience' => {
    if (scenario.type === 'savings') return 'savings';
    if (scenario.type === 'balanced') return 'balanced';
    return 'resilience';
  };

  const getStrategyName = (scenario: ScenarioConfig): string => {
    if (scenario.type === 'savings') return 'Savings Optimized';
    if (scenario.type === 'balanced') return 'Balanced';
    return 'Maximum Resilience';
  };

  const isComplete = !!selectedStrategy;
  
  // Action instructions for Step 4
  const actionInstructions = [
    'Review the 3 optimized configurations below',
    'Select the one that best matches your goals',
    'Use "Super Size" button if you want a larger system'
  ];

  return (
    <div
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] pb-[120px] relative"
    >
      {/* ProQuote Translucent Badge with Neon Glow - Fixed Top Right */}
      {onOpenProQuote && (
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={onOpenProQuote}
            className="group relative transition-all duration-300 hover:scale-105"
          >
            {/* Neon glow ring - always visible */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-60 animate-pulse" />
            
            {/* Translucent background with stronger blur */}
            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-cyan-500/15 via-purple-500/20 to-pink-500/15 border-2 border-cyan-400/50 rounded-2xl px-5 py-3.5 shadow-2xl hover:border-purple-400/70 transition-all duration-300">
              {/* Inner glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ring-2 ring-cyan-300/50">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-bold text-white drop-shadow-lg group-hover:text-cyan-200 transition-colors">
                    ProQuote™
                  </div>
                  <div className="text-[11px] text-white/80 group-hover:text-white transition-colors">
                    Build your own
                  </div>
                </div>
                <div className="text-cyan-300 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 drop-shadow-lg">
                  →
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
      
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        
        {/* MerlinGreeting - Condensed Format */}
        <MerlinGreeting
          stepNumber={4}
          totalSteps={5}
          stepTitle="Choose Strategy"
          stepDescription={isComplete ? "Congratulations! Your energy system is now ready. I have configured 3 optimized energy solutions based on your inputs. Each shows exactly what you'll get and how much you'll save—pick the one that fits your goals!" : "I've created 3 optimized energy configurations for your facility. Each shows exactly what you'll get and how much you'll save. Pick the one that fits your goals!"}
          estimatedTime="1-2 min"
          actionInstructions={actionInstructions}
          nextStepPreview="Next, you'll see your complete TrueQuote™ with verified savings"
          isComplete={isComplete}
          onCompleteMessage={isComplete ? "Perfect! You've selected your energy strategy. I've calculated your exact savings and payback period. Use the right arrow to see your complete TrueQuote™ with all the details!" : "Great progress! I've analyzed your facility and created 3 optimized configurations. Select one to continue."}
        />

        {/* Recommendation Label */}
        {scenarioResult && scenarioResult.recommendedIndex !== undefined && (
          <div className="flex items-center gap-3 mb-5 px-5 py-3.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl">
            <div className="w-11 h-11 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-xl flex items-center justify-center text-xl">
              💡
            </div>
            <div>
              <h3 className="text-base font-bold text-[#A78BFA] mb-0.5">Merlin's Recommendation</h3>
              <p className="text-[13px] text-white/60">{scenarioResult.recommendationReason}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#68BFFA] border-t-transparent mb-4" />
            <p className="text-lg text-white font-medium">Generating optimized configurations...</p>
            <p className="text-sm text-white/60 mt-1">Analyzing your facility data</p>
          </div>
        )}

        {/* Strategy Cards */}
        {scenarioResult && !isGenerating && scenarioResult.scenarios && scenarioResult.scenarios.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {scenarioResult.scenarios.map((scenario, index) => {
                // Use modified scenario if available (from Super Size)
                const displayScenario = modifiedScenarios.get(scenario.type) || scenario;
                const isSelected = selectedStrategy?.type === displayScenario.type;
                const isRecommended = index === scenarioResult.recommendedIndex;
                const strategyType = getStrategyType(displayScenario);
                const strategyName = getStrategyName(displayScenario);
                const isSuperSized = modifiedScenarios.has(scenario.type);

                return (
                  <div
                    key={displayScenario.type}
                    onClick={() => !isSelected && handleSelectStrategy(displayScenario)}
                    className={`
                      relative bg-gradient-to-b from-[#252547] to-[#1a1a2e] border-2 rounded-[20px] cursor-pointer
                      transition-all duration-300 overflow-hidden
                      ${isSelected 
                        ? 'border-[#4ADE80] shadow-[0_0_0_2px_rgba(74,222,128,0.3),0_16px_48px_rgba(74,222,128,0.25)]' 
                        : 'border-white/10 hover:border-[#8B5CF6]/50 hover:shadow-[0_12px_40px_rgba(139,92,246,0.2)] hover:-translate-y-1'
                      }
                      ${isSuperSized ? 'ring-2 ring-[#FDE047]/50' : ''}
                    `}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-[#4ADE80] rounded-full flex items-center justify-center z-10">
                        <CheckCircle className="w-[18px] h-[18px] text-[#052e16] stroke-[3]" />
                      </div>
                    )}

                    {/* Card Header - Colored */}
                    <div className={`
                      px-5 pt-6 pb-5 text-center relative
                      ${strategyType === 'savings' ? 'bg-gradient-to-b from-[#166534] to-[#14532d]' :
                        strategyType === 'balanced' ? 'bg-gradient-to-b from-[#1e40af] to-[#1e3a8a]' :
                        'bg-gradient-to-b from-[#9a3412] to-[#7c2d12]'}
                    `}>
                      {/* Recommended Badge */}
                      {isRecommended && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-[#052e16] px-4 py-1.5 rounded-b-xl text-[11px] font-extrabold uppercase tracking-wide">
                          RECOMMENDED
                        </div>
                      )}

                      {/* Icon */}
                      <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-[28px] mx-auto mb-3">
                        {displayScenario.icon}
                      </div>

                      {/* Title */}
                      <div className="text-xl font-extrabold text-white mb-1">{strategyName}</div>
                      <div className="text-[13px] text-white/70">{displayScenario.tagline}</div>
                      {isSuperSized && (
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-[#FDE047]/20 border border-[#FDE047]/40 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#FDE047]">
                          ⚡ SUPER SIZED
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 bg-black/20">
                      {/* Main Value - Annual Savings */}
                      <div className="text-center mb-4 pb-4 border-b border-white/10">
                        <div className="text-[11px] text-white/50 uppercase tracking-wide mb-1">Annual Savings</div>
                        <div className="text-[36px] font-black text-[#4ADE80]">{formatMoney(displayScenario.annualSavings)}</div>
                        <div className="text-xs text-white/50">per year</div>
                      </div>

                      {/* ROI Row */}
                      <div className="flex justify-between mb-4 pb-4 border-b border-white/10">
                        <div className="text-center flex-1">
                          <div className="text-xl font-extrabold text-[#22D3EE]">{displayScenario.paybackYears.toFixed(1)} yrs</div>
                          <div className="text-[11px] text-white/50">Payback</div>
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-xl font-extrabold text-[#22D3EE]">{Math.round(displayScenario.roi25Year || 0)}%</div>
                          <div className="text-[11px] text-white/50">25-Yr ROI</div>
                        </div>
                      </div>

                      {/* System Specs */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 text-[13px] text-white/70">
                            <span className="text-base">🔋</span> BESS
                          </div>
                          <div className="text-[13px] font-bold text-white">
                            {formatPower(displayScenario.batteryKW)} / {formatEnergy(displayScenario.batteryKWh)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 text-[13px] text-white/70">
                            <span className="text-base">☀️</span> Solar
                          </div>
                          <div className={`text-[13px] font-bold ${
                            displayScenario.solarKW > 0 ? 'text-[#4ADE80]' : 'text-white/30'
                          }`}>
                            {displayScenario.solarKW > 0 ? `${formatPower(displayScenario.solarKW)} rooftop` : 'Not included'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 text-[13px] text-white/70">
                            <span className="text-base">⚡</span> EV Charging
                          </div>
                          <div className="text-[13px] font-bold text-white/30">Not included</div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 text-[13px] text-white/70">
                            <span className="text-base">🔌</span> Generator
                          </div>
                          <div className={`text-[13px] font-bold ${
                            displayScenario.generatorKW > 0 ? 'text-[#4ADE80]' : 'text-white/30'
                          }`}>
                            {displayScenario.generatorKW > 0 ? `${formatPower(displayScenario.generatorKW)} backup` : 'Not included'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Super Size Button - More Prominent */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card selection
                          // Get the card element for scrolling
                          const cardElement = e.currentTarget.closest('.relative') as HTMLElement;
                          handleSuperSize(scenario, cardElement || undefined);
                        }}
                        className="w-full py-3.5 px-5 bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A855F7] border-2 border-[#8B5CF6] rounded-xl text-[14px] font-bold text-white hover:from-[#7C3AED] hover:via-[#9333EA] hover:to-[#C084FC] hover:border-[#A855F7] hover:shadow-[0_4px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 group"
                      >
                        <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Super Size Configuration
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Confirmation */}
            {isComplete && selectedStrategy && (
              <div className="bg-gradient-to-r from-[#4ADE80]/15 to-[#22D3EE]/10 border-2 border-[#4ADE80]/40 rounded-2xl px-6 py-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-[#4ADE80] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-[22px] h-[22px] text-[#052e16] stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#4ADE80] mb-0.5">
                      {getStrategyName(selectedStrategy)} Selected!
                    </h3>
                    <p className="text-sm text-white/70">Click "See My Results" to view your complete TrueQuote™</p>
                  </div>
                </div>
                <button
                  onClick={onContinue}
                  className="bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-[#052e16] px-8 py-3.5 rounded-xl text-[15px] font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(74,222,128,0.4)] flex items-center gap-2"
                >
                  See My Results →
                </button>
              </div>
            )}
          </>
        )}

        {/* No Scenarios State */}
        {!isGenerating && !scenarioResult && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#68BFFA]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#3B5BDB]" />
            </div>
            <p className="text-lg text-white font-medium mb-2">Preparing your Magic Fit™ options...</p>
            <p className="text-sm text-white/60">This should only take a moment</p>
            <button
              onClick={onGenerateScenarios}
              className="mt-4 px-6 py-2 bg-[#3B5BDB] text-white rounded-lg hover:bg-[#4A90E2] transition-colors"
            >
              Generate Scenarios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step4MagicFit;
