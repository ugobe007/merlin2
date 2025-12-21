/**
 * STEP 1: LOCATION + GOALS
 * =============================================
 * 
 * Redesigned: Clean, Simple, Easy to Use - Matching Old Merlin Wizard
 * 
 * Core Value: Help companies save money on energy bills
 * 
 * Design Principles:
 * - Clean white cards on dark background
 * - Strong contrast for readability
 * - Simple, intuitive inputs
 * - Clear visual hierarchy
 * - Match old wizard's ease of use
 */

import React, { useState } from 'react';
import {
  MapPin, Target, ChevronDown,
  Globe, Building, TreeDeciduous, Building2,
  TrendingDown, Shield, Leaf, Gauge, Banknote, Check,
  Calculator, Zap
} from 'lucide-react';
import { US_STATES, INTERNATIONAL_REGIONS, REGION_GROUPS } from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';
import { MerlinGreeting, FloatingNavigationArrows } from '../shared';
import { STATE_UTILITY_DATA } from '@/data/utilityData';

// ============================================
// TYPES
// ============================================

interface Step1LocationGoalsProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  onZipChange: (zip: string) => Promise<void>;
  onStateSelect: (state: string) => void;
  onInternationalSelect: (regionCode: string) => void;
  onContinue: () => void;
  onBack?: () => void;
  onOpenProQuote?: () => void;
  onOpenTrueQuote?: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const STATE_DATA: Record<string, { rate: number; solar: number }> = {
  'California': { rate: 0.22, solar: 5.5 },
  'Texas': { rate: 0.12, solar: 5.0 },
  'Florida': { rate: 0.13, solar: 5.2 },
  'New York': { rate: 0.20, solar: 4.0 },
  'Arizona': { rate: 0.13, solar: 6.5 },
  'Nevada': { rate: 0.12, solar: 6.2 },
  'Hawaii': { rate: 0.35, solar: 5.8 },
  'Massachusetts': { rate: 0.24, solar: 4.2 },
  'Connecticut': { rate: 0.23, solar: 4.0 },
  'New Jersey': { rate: 0.17, solar: 4.3 },
};

const STATE_ENERGY_INSIGHTS: Record<string, { rate: string; solar: number; solarLabel: string; peak: string }> = {
  'Arizona': { rate: '$0.13', solar: 5, solarLabel: 'Excellent', peak: '3–8 PM' },
  'California': { rate: '$0.27', solar: 5, solarLabel: 'Excellent', peak: '4–9 PM' },
  'Colorado': { rate: '$0.14', solar: 4, solarLabel: 'Very Good', peak: '2–6 PM' },
  'Florida': { rate: '$0.13', solar: 4, solarLabel: 'Very Good', peak: '12–9 PM' },
  'Nevada': { rate: '$0.12', solar: 5, solarLabel: 'Excellent', peak: '1–7 PM' },
  'New York': { rate: '$0.21', solar: 3, solarLabel: 'Good', peak: '2–6 PM' },
  'Texas': { rate: '$0.12', solar: 4, solarLabel: 'Very Good', peak: '1–7 PM' },
};

const getStateData = (state: string) => {
  return STATE_DATA[state] || { rate: 0.14, solar: 4.5 };
};

const calculateSavings = (state: string): { min: number; max: number; rate: number } => {
  const utilityData = STATE_UTILITY_DATA[state];
  const rate = utilityData?.electricityRate || getStateData(state).rate;
  const baseSavings = rate * 50000;
  return {
    min: Math.round(baseSavings * 0.3),
    max: Math.round(baseSavings * 1.6),
    rate: rate
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

export function Step1LocationGoals({
  wizardState,
  setWizardState,
  onZipChange,
  onStateSelect,
  onInternationalSelect,
  onContinue,
  onBack,
  onOpenProQuote,
  onOpenTrueQuote,
  sectionRef,
  isHidden = false,
}: Step1LocationGoalsProps) {
  const [showInternational, setShowInternational] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  
  // Require zip code OR state (zip code preferred for accuracy)
  const canContinue = Boolean((wizardState.zipCode && wizardState.zipCode.length === 5) || wizardState.state) && wizardState.goals.length > 0;
  const savings = wizardState.state ? calculateSavings(wizardState.state) : null;
  
  const toggleGoal = (goalId: string) => {
    setWizardState(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };
  
  if (isHidden) return null;

  const isComplete = canContinue;
  const actionInstructions = [
    'Select your state or country location',
    'Choose at least one energy goal that matters to you',
    'The right arrow will light up when you\'re ready to continue'
  ];
  
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] relative font-['Inter',-apple-system,BlinkMacSystemFont,'sans-serif']"
    >
      {/* Floating Navigation Arrows */}
      <FloatingNavigationArrows
        canGoBack={!!onBack}
        canGoForward={Boolean(canContinue)}
        onBack={onBack || (() => {})}
        onForward={onContinue}
        forwardLabel="Continue to Industry Selection"
      />

      <div className="max-w-[1000px] mx-auto px-6 py-8">
        
        {/* Merlin Greeting - Condensed Format */}
        <MerlinGreeting
          stepNumber={1}
          totalSteps={5}
          stepTitle="Location & Goals"
          stepDescription="Tell me where your project is located and what matters most to you. I'll use this to show you the best energy solutions for your area."
          estimatedTime="2-3 min"
          actionInstructions={actionInstructions}
          nextStepPreview="Next, I'll ask about your industry and facility size"
          isComplete={Boolean(isComplete)}
          onCompleteMessage={isComplete ? "Perfect! You've selected your location and goals. Use the right arrow to continue to industry selection." : undefined}
          state={wizardState.state} 
          utilityRate={savings?.rate}
          solarOpportunity={wizardState.state ? {
            rating: getStateData(wizardState.state).solar >= 6 ? 'Excellent' : getStateData(wizardState.state).solar >= 5 ? 'Good' : 'Fair',
            hours: getStateData(wizardState.state).solar
          } : undefined}
          savings={savings || undefined}
          onOpenTrueQuote={onOpenTrueQuote}
        />
        
        {/* Configuration Summary - Show what's been selected */}
        {(wizardState.state || wizardState.goals.length > 0) && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 mb-6 border-2 border-purple-300/50 shadow-lg">
            <h3 className="text-gray-800 font-bold text-base mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-purple-600" />
              Configuration Summary
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {wizardState.state && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
                  <div className="text-xs text-gray-600 font-semibold mb-1">Location</div>
                  <div className="text-gray-900 font-bold">{wizardState.state} {wizardState.zipCode && `(${wizardState.zipCode})`}</div>
                  {savings && (
                    <div className="text-xs text-gray-600 mt-1">Rate: ${savings.rate.toFixed(2)}/kWh</div>
                  )}
                </div>
              )}
              {wizardState.goals.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200">
                  <div className="text-xs text-gray-600 font-semibold mb-1">Goals Selected</div>
                  <div className="text-gray-900 font-bold">{wizardState.goals.length} goal{wizardState.goals.length > 1 ? 's' : ''}</div>
                  <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-1">
                    {wizardState.goals.map(goal => {
                      const labels: Record<string, string> = {
                        'cost-savings': 'Save Money',
                        'sustainability': 'Sustainability',
                        'backup-power': 'Backup Power',
                        'ev-ready': 'Grid Independence',
                        'demand-management': 'Peak Shaving',
                        'generate-revenue': 'Generate Revenue'
                      };
                      return (
                        <span key={goal} className="bg-white px-2 py-0.5 rounded text-xs font-medium">
                          {labels[goal] || goal}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Energy Insights Prompt - Clean with Proper Contrast */}
        {!wizardState.zipCode && !wizardState.state ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center mb-6">
            <span className="text-white text-base font-medium flex items-center justify-center gap-2">
              <span className="text-xl">✨</span>
              <span>Enter your zip code to see accurate utility rates and energy insights for your area</span>
            </span>
          </div>
        ) : (() => {
          const solarOpp = wizardState.state ? {
            rating: getStateData(wizardState.state).solar >= 6 ? 'Excellent' : getStateData(wizardState.state).solar >= 5 ? 'Good' : 'Fair',
            hours: getStateData(wizardState.state).solar
          } : undefined;
          const insights = STATE_ENERGY_INSIGHTS[wizardState.state] || {
            rate: savings?.rate ? `$${savings.rate.toFixed(2)}` : '$0.12',
            solar: solarOpp?.hours ? Math.round(solarOpp.hours) : 4,
            solarLabel: solarOpp?.rating || 'Good',
            peak: '1–7 PM'
          };
          
          return (
            <div className="bg-white border-2 border-emerald-400 rounded-xl px-6 py-4 mb-6 shadow-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-emerald-900 font-bold text-lg block">
                      Energy insights for <span className="text-emerald-700">{wizardState.state}</span>
                    </span>
                    {wizardState.zipCode && (
                      <span className="text-emerald-700 text-sm font-medium">
                        ZIP: {wizardState.zipCode}
                        {wizardState.utilityName && ` • ${wizardState.utilityName}`}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-emerald-700 font-semibold">Utility Rate:</span>
                    <span className="text-emerald-900 font-bold ml-1.5">{insights.rate}/kWh</span>
                    {wizardState.zipCode && (
                      <span className="text-emerald-600 text-xs block mt-0.5">(Zip-specific rate)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-emerald-700 font-semibold">Solar:</span>
                    <span className="text-emerald-900 font-bold ml-1.5">{insights.solarLabel}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-semibold">Peak Hours:</span>
                    <span className="text-emerald-900 font-bold ml-1.5">{insights.peak}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Main Form Card - Matching FacilityDetailsSectionV2 Style */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-purple-200/50 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* LEFT: LOCATION - Using FacilityDetailsSectionV2 Design */}
            <div>
              <label className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-3">
                <MapPin className="w-5 h-5 text-purple-500" />
                Location
              </label>
              
              {/* USA / International Toggle */}
              <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setShowInternational(false)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                    !showInternational 
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇺🇸 USA
                </button>
                <button
                  onClick={() => setShowInternational(true)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                    showInternational 
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🌐 International
                </button>
              </div>
              
              {!showInternational ? (
                <>
                  {/* Zip Code Input - PRIMARY (Required for accurate utility rates) */}
                  <div className="mb-4">
                    <label className="block text-gray-800 font-bold text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Zip Code <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 font-normal">(Required for accurate utility rates)</span>
                    </label>
                    <input
                      type="text"
                      value={wizardState.zipCode}
                      onChange={(e) => {
                        const zip = e.target.value.replace(/\D/g, '').slice(0, 5);
                        onZipChange(zip);
                      }}
                      placeholder="Enter 5-digit zip code (e.g., 89052)"
                      className="w-full px-5 py-4 bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-full text-emerald-800 text-lg font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-200/50 placeholder:text-emerald-400"
                      maxLength={5}
                      pattern="[0-9]{5}"
                    />
                    {wizardState.zipCode && wizardState.zipCode.length === 5 && (
                      <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                        <Check className="w-4 h-4" />
                        Zip code entered - utility rate will be calculated
                      </p>
                    )}
                  </div>
                  
                  {/* State Dropdown - Secondary (Auto-filled from zip, but can override) */}
                  <div className="relative mb-3">
                    <label className="block text-gray-800 font-bold text-sm mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      State <span className="text-xs text-gray-500 font-normal">(or select manually)</span>
                    </label>
                    <select
                      value={wizardState.state || ''}
                      onChange={(e) => onStateSelect(e.target.value)}
                      className="w-full px-5 py-4 bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-full text-purple-900 text-lg font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer appearance-none pr-12 shadow-lg hover:shadow-purple-200/50"
                    >
                      <option value="" disabled>Select your state...</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 pointer-events-none" />
                  </div>
                  
                  {/* Green Checkmark Confirmation */}
                  {wizardState.state && (
                    <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                      <Check className="w-4 h-4" />
                      {wizardState.state} {wizardState.zipCode && `(${wizardState.zipCode})`} electricity rates applied
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {Object.entries(REGION_GROUPS).filter(([name]) => name !== 'North America').map(([groupName, regions]) => (
                    <div key={groupName} className="bg-gray-50 rounded-xl border-2 border-gray-200">
                      <button
                        onClick={() => setExpandedRegion(expandedRegion === groupName ? null : groupName)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors rounded-xl"
                      >
                        <span className="font-bold text-gray-900">{groupName}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${expandedRegion === groupName ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedRegion === groupName && (
                        <div className="p-3 grid grid-cols-2 gap-2">
                          {(regions as typeof INTERNATIONAL_REGIONS).map((region) => (
                            <button
                              key={region.code}
                              onClick={() => {
                                onInternationalSelect(region.code);
                                setExpandedRegion(null);
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                wizardState.state === region.name
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-purple-300'
                              }`}
                            >
                              <span>{region.flag}</span> {region.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* RIGHT: GOALS - Matching FacilityDetailsSectionV2 Style */}
            <div>
              <label className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-3">
                <Target className="w-5 h-5 text-purple-500" />
                Your Goals
              </label>
              <p className="text-sm text-gray-500 mb-4">Select all that apply - this helps optimize your system</p>
              
              {/* Goals List - Pill Style Buttons */}
              <div className="space-y-3">
                {/* Save Money First */}
                <button
                  onClick={() => toggleGoal('cost-savings')}
                  className={`w-full px-5 py-4 rounded-full border-2 font-bold text-lg transition-all flex items-center justify-between ${
                    wizardState.goals.includes('cost-savings')
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300 text-emerald-800 hover:shadow-md hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5" />
                    <span>Cut Energy Costs</span>
                  </div>
                  {wizardState.goals.includes('cost-savings') && (
                    <Check className="w-5 h-5" />
                  )}
                </button>

                {/* Backup Power */}
                <button
                  onClick={() => toggleGoal('backup-power')}
                  className={`w-full px-5 py-4 rounded-full border-2 font-bold text-lg transition-all flex items-center justify-between ${
                    wizardState.goals.includes('backup-power')
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 border-purple-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-300 text-purple-800 hover:shadow-md hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span>Backup Power</span>
                  </div>
                  {wizardState.goals.includes('backup-power') && (
                    <Check className="w-5 h-5" />
                  )}
                </button>

                {/* Sustainability */}
                <button
                  onClick={() => toggleGoal('sustainability')}
                  className={`w-full px-5 py-4 rounded-full border-2 font-bold text-lg transition-all flex items-center justify-between ${
                    wizardState.goals.includes('sustainability')
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 text-green-800 hover:shadow-md hover:border-green-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5" />
                    <span>Sustainability</span>
                  </div>
                  {wizardState.goals.includes('sustainability') && (
                    <Check className="w-5 h-5" />
                  )}
                </button>

                {/* Grid Independence */}
                <button
                  onClick={() => toggleGoal('ev-ready')}
                  className={`w-full px-5 py-4 rounded-full border-2 font-bold text-lg transition-all flex items-center justify-between ${
                    wizardState.goals.includes('ev-ready')
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-300 text-amber-800 hover:shadow-md hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5" />
                    <span>Grid Independence</span>
                  </div>
                  {wizardState.goals.includes('ev-ready') && (
                    <Check className="w-5 h-5" />
                  )}
                </button>

                {/* Peak Shaving */}
                <button
                  onClick={() => toggleGoal('demand-management')}
                  className={`w-full px-5 py-4 rounded-full border-2 font-bold text-lg transition-all flex items-center justify-between ${
                    wizardState.goals.includes('demand-management')
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300 text-blue-800 hover:shadow-md hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5" />
                    <span>Peak Shaving</span>
                  </div>
                  {wizardState.goals.includes('demand-management') && (
                    <Check className="w-5 h-5" />
                  )}
                </button>

                {/* Generate Revenue */}
                <button
                  onClick={() => toggleGoal('generate-revenue')}
                  className={`w-full px-5 py-4 rounded-full border-2 font-bold text-lg transition-all flex items-center justify-between ${
                    wizardState.goals.includes('generate-revenue')
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 border-teal-600 text-white shadow-lg'
                      : 'bg-gradient-to-br from-teal-100 to-cyan-100 border-teal-300 text-teal-800 hover:shadow-md hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5" />
                    <span>Generate Revenue</span>
                  </div>
                  {wizardState.goals.includes('generate-revenue') && (
                    <Check className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Warning messages */}
              {!wizardState.zipCode && !wizardState.state && (
                <div className="mt-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-center gap-2">
                  <span className="text-orange-600 text-lg">⚠️</span>
                  <span className="text-orange-900 font-semibold text-sm">Please enter your zip code (or select state) to continue</span>
                </div>
              )}
              {wizardState.goals.length === 0 && (wizardState.zipCode || wizardState.state) && (
                <div className="mt-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-center gap-2">
                  <span className="text-orange-600 text-lg">⚠️</span>
                  <span className="text-orange-900 font-semibold text-sm">Please select at least one goal to continue</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ProQuote Link - Lower right, green to blue gradient */}
        {onOpenProQuote && (
          <div className="fixed bottom-6 right-6 z-10">
            <button
              onClick={onOpenProQuote}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-[#3B5BDB] hover:from-emerald-600 hover:via-teal-600 hover:to-[#4A90E2] rounded-xl transition-all shadow-xl shadow-emerald-500/30 border-2 border-white/40 hover:scale-105"
            >
              <Calculator className="w-5 h-5" />
              <span>ProQuote™</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step1LocationGoals;
