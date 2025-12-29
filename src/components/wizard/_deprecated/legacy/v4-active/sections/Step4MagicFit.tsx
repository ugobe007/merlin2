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
  CheckCircle, Sparkles, Lightbulb, Battery, Sun, Zap, Fuel, TrendingUp, Calculator, ArrowRight, ChevronDown
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { ScenarioConfig, ScenarioGeneratorResult } from '@/services/scenarioGenerator';
import { MerlinGreeting, FloatingNavigationArrows } from '../shared';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { ProQuoteModal } from '../modals/ProQuoteModal';

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
  
  // ProQuote Modal state
  const [showProQuoteModal, setShowProQuoteModal] = useState(false);

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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 pb-[120px] relative"
    >
      {/* ProQuote Badge - Light Theme */}
      {onOpenProQuote && (
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={() => setShowProQuoteModal(true)}
            className="group relative transition-all duration-300 hover:scale-105"
          >
            {/* Subtle shadow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            
            {/* Card background */}
            <div className="relative bg-white/95 backdrop-blur-xl border border-purple-200 rounded-2xl px-5 py-3.5 shadow-xl hover:border-purple-400 transition-all duration-300">
              {/* Content */}
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                    ProQuote™
                  </div>
                  <div className="text-[11px] text-gray-500 group-hover:text-gray-600 transition-colors">
                    Build your own
                  </div>
                </div>
                <div className="text-purple-500 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  →
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
      
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        
        {/* MerlinGreeting - Integrated with Recommendation */}
        <MerlinGreeting
          stepNumber={4}
          totalSteps={5}
          stepTitle="Choose Strategy"
          stepDescription={
            scenarioResult && scenarioResult.recommendedIndex !== undefined
              ? `💡 ${scenarioResult.recommendationReason} I've created 3 optimized energy configurations for your facility. Each shows exactly what you'll get and how much you'll save—pick the one that fits your goals!`
              : isComplete
              ? "Congratulations! Your energy system is now ready. I have configured 3 optimized energy solutions based on your inputs. Each shows exactly what you'll get and how much you'll save—pick the one that fits your goals!"
              : "I've created 3 optimized energy configurations for your facility. Each shows exactly what you'll get and how much you'll save. Pick the one that fits your goals!"
          }
          estimatedTime="1-2 min"
          actionInstructions={actionInstructions}
          nextStepPreview="Next, you'll see your complete TrueQuote™ with verified savings"
          isComplete={isComplete}
          onCompleteMessage={isComplete ? "Perfect! You've selected your energy strategy. I've calculated your exact savings and payback period. Use the right arrow to see your complete TrueQuote™ with all the details!" : "Great progress! I've analyzed your facility and created 3 optimized configurations. Select one to continue."}
        />

        {/* Loading State - Light Theme */}
        {isGenerating && (
          <div className="text-center py-16 bg-white/60 rounded-3xl border border-gray-100 shadow-lg">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
            <p className="text-lg text-gray-800 font-semibold">Generating optimized configurations...</p>
            <p className="text-sm text-gray-500 mt-1">Analyzing your facility data</p>
          </div>
        )}

        {/* Strategy Cards - Light Design */}
        {scenarioResult && !isGenerating && scenarioResult.scenarios && scenarioResult.scenarios.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                      relative bg-white rounded-3xl cursor-pointer
                      transition-all duration-300 overflow-hidden shadow-lg
                      ${isSelected 
                        ? 'ring-4 ring-emerald-500/50 shadow-2xl shadow-emerald-500/20 scale-[1.02]' 
                        : 'hover:shadow-xl hover:-translate-y-1 border border-gray-100'
                      }
                      ${isSuperSized ? 'ring-2 ring-amber-400/60' : ''}
                    `}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center z-10 shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white stroke-[3]" />
                      </div>
                    )}

                    {/* Card Header - Gradient based on type */}
                    <div className={`
                      px-6 pt-8 pb-6 text-center relative
                      ${strategyType === 'savings' 
                        ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600' 
                        : strategyType === 'balanced' 
                        ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600' 
                        : 'bg-gradient-to-br from-orange-500 via-red-500 to-rose-600'}
                    `}>
                      {/* Recommended Badge */}
                      {isRecommended && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white text-emerald-600 px-4 py-1.5 rounded-b-xl text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                          ✨ RECOMMENDED
                        </div>
                      )}

                      {/* Icon */}
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-[32px] mx-auto mb-3 mt-1 shadow-inner">
                        {displayScenario.icon}
                      </div>

                      {/* Title */}
                      <div className="text-2xl font-extrabold text-white mb-1">{strategyName}</div>
                      <div className="text-sm text-white/80">{displayScenario.tagline}</div>
                      {isSuperSized && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-400/90 px-3 py-1 rounded-full text-[11px] font-bold text-amber-900 shadow">
                          ⚡ SUPER SIZED +40%
                        </div>
                      )}
                    </div>

                    {/* Card Body - Light Background */}
                    <div className="p-6">
                      {/* Main Value - Annual Savings */}
                      <div className="text-center mb-5 pb-5 border-b border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Annual Savings</div>
                        <div className="text-4xl font-black text-emerald-600">{formatMoney(displayScenario.annualSavings)}</div>
                        <div className="text-xs text-gray-400 mt-1">projected yearly savings</div>
                      </div>

                      {/* ROI Row - Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-3 text-center border border-cyan-100">
                          <div className="text-2xl font-extrabold text-cyan-600">{displayScenario.paybackYears.toFixed(1)}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-semibold">Year Payback</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 text-center border border-purple-100">
                          <div className="text-2xl font-extrabold text-purple-600">{Math.round(displayScenario.roi25Year || 0)}%</div>
                          <div className="text-[10px] text-gray-500 uppercase font-semibold">25-Year ROI</div>
                        </div>
                      </div>

                      {/* System Specs - Cleaner List */}
                      <div className="space-y-2.5 mb-5">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Battery className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Battery</span>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {formatPower(displayScenario.batteryKW)} / {formatEnergy(displayScenario.batteryKWh)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Sun className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Solar</span>
                          </div>
                          <div className={`text-sm font-bold ${
                            displayScenario.solarKW > 0 ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            {displayScenario.solarKW > 0 ? formatPower(displayScenario.solarKW) : 'Not included'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Fuel className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Generator</span>
                          </div>
                          <div className={`text-sm font-bold ${
                            displayScenario.generatorKW > 0 ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            {displayScenario.generatorKW > 0 ? formatPower(displayScenario.generatorKW) : 'Not included'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Super Size Button - Purple CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card selection
                          const cardElement = e.currentTarget.closest('.relative') as HTMLElement;
                          handleSuperSize(scenario, cardElement || undefined);
                        }}
                        className="w-full py-3.5 px-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-xl text-sm font-bold text-white hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                      >
                        <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Super Size +40%
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Confirmation - Light Theme */}
            {isComplete && selectedStrategy && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-2xl px-6 py-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-700 mb-0.5">
                      {getStrategyName(selectedStrategy)} Selected!
                    </h3>
                    <p className="text-sm text-gray-600">Click to view your complete TrueQuote™ with verified savings</p>
                  </div>
                </div>
                <button
                  onClick={onContinue}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3.5 rounded-xl text-[15px] font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30 flex items-center gap-2 whitespace-nowrap"
                >
                  See My Results
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* No Scenarios State - Light Theme */}
        {!isGenerating && !scenarioResult && (
          <div className="text-center py-16 bg-white/60 rounded-3xl border border-gray-100 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-lg text-gray-800 font-semibold mb-2">Preparing your Magic Fit™ options...</p>
            <p className="text-sm text-gray-500 mb-4">This should only take a moment</p>
            <button
              onClick={onGenerateScenarios}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Generate Scenarios
            </button>
          </div>
        )}
        
        {/* Bottom spacing for floating nav */}
        <div className="h-8"></div>
      </div>
      
      {/* Floating Navigation Arrows */}
      <FloatingNavigationArrows
        canGoBack={true}
        canGoForward={!!selectedStrategy}
        onBack={onBack}
        onForward={onContinue}
        backLabel="Back to Configure"
        forwardLabel="See TrueQuote™"
      />

      {/* ProQuote Modal */}
      <ProQuoteModal
        show={showProQuoteModal}
        onClose={() => setShowProQuoteModal(false)}
        onContinue={() => {
          setShowProQuoteModal(false);
          if (onOpenProQuote) {
            onOpenProQuote();
          }
        }}
      />
    </div>
  );
}

export default Step4MagicFit;
