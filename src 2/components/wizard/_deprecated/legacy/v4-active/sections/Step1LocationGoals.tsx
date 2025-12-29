/**
 * STEP 1: LOCATION + GOALS (Two-Column Layout)
 * =============================================
 * 
 * December 18, 2025 - Complete redesign per Vineet/Robert feedback
 * 
 * DESIGN PHILOSOPHY (Steve Jobs inspired):
 * - Self-evident UI - no help needed
 * - Two columns: Location (left) + Goals (right)
 * - Summary bar at TOP shows their choices + utility data
 * - Merlin guides them with clear, encouraging prompts
 * - ProQuote™ link for professionals who want advanced tools
 * 
 * CAPTURES:
 * - State + Zip (or Country for international)
 * - Location type (Urban/City/Suburban/Rural)
 * - Multi-location flag (for chains)
 * - Primary goals (drives wizard behavior)
 * 
 * DISPLAYS (Summary Bar):
 * - Utility rate for their area
 * - Solar opportunity rating
 * - EV charging opportunity
 * - BESS value indicator
 */

import React, { useState, useMemo } from 'react';
import {
  MapPin, Target, Sparkles, Sun, Battery, Zap, ChevronDown,
  Globe, Building, TreeDeciduous, Home as HomeIcon, Building2,
  TrendingDown, Shield, Leaf, Gauge, Banknote, Check, Plus,
  ArrowRight, Calculator, Wand2, CheckCircle, Info, Layers
} from 'lucide-react';
import { MerlinGreeting, FloatingNavigationArrows } from '../shared';
import { US_STATES, INTERNATIONAL_REGIONS, REGION_GROUPS } from '../constants/wizardConstants';
import { getStepColors } from '../constants/stepColors';
import { MerlinHat } from '../MerlinHat';
import type { WizardState } from '../types/wizardTypes';
import merlinImage from '@/assets/images/new_profile_merlin.png';
// SSOT: Use geographicIntelligenceService for state data instead of hardcoded values
import { getStateProfile, getRegionalElectricityRate } from '@/services/geographicIntelligenceService';

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
  onOpenProQuote?: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const LOCATION_TYPES = [
  { id: 'urban', label: 'Urban', icon: Building2, description: 'Downtown, high density' },
  { id: 'suburban', label: 'Suburban', icon: Building, description: 'Mixed residential/commercial' },
  { id: 'rural', label: 'Rural', icon: TreeDeciduous, description: 'Low density, open land' },
];

const GOAL_OPTIONS = [
  { 
    id: 'cost-savings', 
    label: 'Save Money First', 
    icon: TrendingDown, 
    description: 'Cut energy bills & demand charges',
    color: 'emerald',
    priority: 1,
  },
  { 
    id: 'sustainability', 
    label: 'Go Green', 
    icon: Leaf, 
    description: 'Reduce carbon, meet ESG goals',
    color: 'green',
    priority: 2,
  },
  { 
    id: 'backup-power', 
    label: 'Backup Power', 
    icon: Shield, 
    description: 'Keep running during outages',
    color: 'blue',
    priority: 3,
  },
  { 
    id: 'ev-ready', 
    label: 'EV Ready', 
    icon: Zap, 
    description: 'Prepare for electric vehicles',
    color: 'amber',
    priority: 4,
  },
  { 
    id: 'demand-management', 
    label: 'Peak Shaving', 
    icon: Gauge, 
    description: 'Flatten demand spikes',
    color: 'purple',
    priority: 5,
  },
  { 
    id: 'generate-revenue', 
    label: 'Generate Revenue', 
    icon: Banknote, 
    description: 'Sell energy back to grid',
    color: 'orange',
    priority: 6,
  },
];

// ============================================
// STATE DATA - Uses SSOT geographicIntelligenceService
// ============================================

interface StateDisplayData {
  rate: number;
  solar: number;
  evOpp: string;
  bessValue: string;
}

/**
 * Get state data from SSOT service for display in SummaryBar
 * Maps GeographicProfile to simpler display format
 */
const getStateData = (stateName: string): StateDisplayData => {
  try {
    // Get full profile from SSOT
    const profile = getStateProfile(stateName);
    
    // Map profile to display format
    const evOpportunity = profile.averageCommercialRate >= 0.20 ? 'Very High' :
                          profile.averageCommercialRate >= 0.15 ? 'High' :
                          profile.averageCommercialRate >= 0.12 ? 'Moderate' : 'Fair';
    
    const bessValueRating = profile.demandChargeAvg >= 20 ? 'Exceptional' :
                            profile.demandChargeAvg >= 15 ? 'Excellent' :
                            profile.demandChargeAvg >= 10 ? 'Very High' :
                            profile.demandChargeAvg >= 5 ? 'High' : 'Good';
    
    return {
      rate: profile.averageCommercialRate,
      solar: profile.peakSunHours,
      evOpp: evOpportunity,
      bessValue: bessValueRating,
    };
  } catch {
    // Fallback for states not in service
    const fallbackRate = getRegionalElectricityRate(stateName);
    return { 
      rate: fallbackRate, 
      solar: 4.5, 
      evOpp: 'Moderate', 
      bessValue: 'Good' 
    };
  }
};

// ============================================
// SUMMARY BAR COMPONENT
// ============================================

interface SummaryBarProps {
  state: string;
  goals: string[];
  locationType: string;
}

const SummaryBar: React.FC<SummaryBarProps> = ({ state, goals, locationType }) => {
  const data = state ? getStateData(state) : null;
  
  if (!state) {
    return (
      <div className="bg-gradient-to-r from-[#6700b6]/20 to-[#060F76]/20 rounded-2xl p-4 border border-[#6700b6]/30 mb-6">
        <div className="flex items-center justify-center gap-3 text-white/60">
          <Sparkles className="w-5 h-5 text-[#ffa600]" />
          <span className="text-sm">Select your location to see energy insights for your area</span>
        </div>
      </div>
    );
  }
  
  // Solar rating (1-5 suns)
  const solarRating = Math.min(5, Math.max(1, Math.round(data!.solar - 1.5)));
  
  return (
    <div className="bg-gradient-to-r from-[#6700b6]/30 via-[#060F76]/30 to-[#68BFFA]/30 rounded-2xl p-4 border border-[#68BFFA]/50 mb-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#68BFFA]" />
          <span className="text-white font-semibold">{state}</span>
          {locationType && (
            <span className="text-white/60 text-sm">({locationType})</span>
          )}
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/20" />
        
        {/* Utility Rate */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-white font-semibold">${data!.rate.toFixed(2)}/kWh</span>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/20" />
        
        {/* Solar */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Sun 
              key={i}
              className={`w-5 h-5 ${
                i <= solarRating 
                  ? 'text-amber-400 fill-amber-400' 
                  : 'text-white/20'
              }`}
            />
          ))}
          <span className="text-white/60 text-sm ml-1">{data!.solar.toFixed(1)}h</span>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/20" />
        
        {/* BESS Value */}
        <div className="flex items-center gap-2">
          <Battery className="w-5 h-5 text-emerald-400" />
          <span className={`font-semibold ${
            data!.bessValue === 'Exceptional' ? 'text-emerald-300' :
            data!.bessValue === 'Excellent' ? 'text-emerald-400' :
            data!.bessValue === 'Very High' ? 'text-green-400' :
            'text-white'
          }`}>
            {data!.bessValue}
          </span>
        </div>
      </div>
      
      {/* Goals indicator */}
      {goals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
          <Target className="w-4 h-4 text-[#ffa600]" />
          <span className="text-white/60 text-sm">
            Goals: {goals.map(g => GOAL_OPTIONS.find(o => o.id === g)?.label).filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
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
  onOpenProQuote,
  sectionRef,
  isHidden = false,
}: Step1LocationGoalsProps) {
  const [showInternational, setShowInternational] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<string>('');
  const [isMultiLocation, setIsMultiLocation] = useState(false);
  
  // Get step colors for visual progression (Step 0 = light cyan-blue)
  const stepColors = getStepColors(0);
  
  // Check if user can continue
  const canContinue = wizardState.state && wizardState.goals.length > 0;
  
  // Toggle goal selection
  const toggleGoal = (goalId: string) => {
    setWizardState(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };
  
  // Generate dynamic Merlin message based on selected goals
  const getMerlinMessage = () => {
    const goals = wizardState.goals;
    const state = wizardState.state;
    const stateData = state ? getStateData(state) : null;
    
    if (goals.length === 0) {
      return {
        main: "I'll help you discover the <span class='text-amber-300 font-semibold'>best energy storage solution</span> for your business. Answer a few quick questions, and I'll show you <span class='text-emerald-300 font-semibold'>3 ways to save</span> — with real numbers you can trust.",
        solar: null
      };
    }
    
    // Build goal-specific message
    const goalPhrases: string[] = [];
    if (goals.includes('cost-savings')) goalPhrases.push('cut your energy costs');
    if (goals.includes('demand-management')) goalPhrases.push('reduce peak demand charges');
    if (goals.includes('backup-power')) goalPhrases.push('keep you running during outages');
    if (goals.includes('sustainability')) goalPhrases.push('reduce your carbon footprint');
    if (goals.includes('ev-ready')) goalPhrases.push('power your EV charging');
    if (goals.includes('grid-revenue')) goalPhrases.push('earn grid services revenue');
    
    const goalText = goalPhrases.length > 0 
      ? goalPhrases.slice(0, 2).join(' and ')
      : 'optimize your energy';
    
    // Solar opportunity based on location
    let solarHint = null;
    if (stateData && stateData.solar >= 5.0) {
      solarHint = `☀️ ${state} gets excellent sun — solar + storage could maximize your savings!`;
    } else if (stateData && stateData.solar >= 4.0) {
      solarHint = `☀️ ${state} has good solar potential — consider adding solar to your system.`;
    }
    
    return {
      main: `Perfect! You want to <span class='text-amber-300 font-semibold'>${goalText}</span>. I'll build you a custom energy system that delivers exactly that — with <span class='text-emerald-300 font-semibold'>real numbers</span> you can take to the bank.`,
      solar: solarHint
    };
  };
  
  const merlinMessage = getMerlinMessage();
  
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-80px)] p-6 md:p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GREETING (Dec 21, 2025 - Unified component)
        ═══════════════════════════════════════════════════════════════ */}
        <MerlinGreeting
          stepNumber={1}
          totalSteps={5}
          stepTitle="Location & Goals"
          stepDescription={wizardState.goals.length > 0 
            ? "Great choices! Now I can calculate savings based on your location." 
            : "Hi! I'm Merlin, your energy advisor. Tell me where you are and what you want to achieve!"}
          estimatedTime="1-2 min"
          showMerlinAvatar={true}
          instructions={[
            { text: "Select your state/location", highlight: "state/location" },
            { text: "Choose your energy goals", highlight: "energy goals" },
            { text: "Click Continue when done", highlight: "Continue" },
          ]}
          recommendation={{
            title: "💡 Merlin's Insight",
            content: wizardState.state 
              ? `${wizardState.state} has excellent potential for energy savings! I'll customize your quote based on local utility rates and solar conditions.`
              : "Tell me where you are and I'll analyze your local utility rates, solar potential, and incentive programs to maximize your savings!"
          }}
          proTip={{
            title: "👆 Pro Tip: Watch the Top Navigation Bar",
            content: "As you progress, the <strong>Solar Opportunity</strong> and <strong>Power Profile</strong> indicators will update based on your location and choices!"
          }}
          isComplete={!!wizardState.state && wizardState.goals.length > 0}
          onCompleteMessage={wizardState.state && wizardState.goals.length > 0 ? "Ready to continue! Click 'Continue' to select your industry." : undefined}
        />
        
        {/* SUMMARY BAR */}
        <SummaryBar 
          state={wizardState.state} 
          goals={wizardState.goals}
          locationType={locationType}
        />
        
        {/* ════════════════════════════════════════════════════════════════
            USA / INTERNATIONAL TOGGLE - PREMIUM (Late Nov 2025 Design)
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setShowInternational(false)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
              !showInternational 
                ? 'bg-gradient-to-r from-[#68BFFA] to-[#060F76] text-white shadow-xl scale-105 border-2 border-[#8dcefb]'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-gray-600'
            }`}
          >
            <span className="text-2xl">🇺🇸</span>
            United States
          </button>
          <button
            onClick={() => setShowInternational(true)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
              showInternational 
                ? 'bg-gradient-to-r from-[#6700b6] to-[#060F76] text-white shadow-xl scale-105 border-2 border-[#ad42ff]'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-gray-600'
            }`}
          >
            <Globe className="w-6 h-6" />
            International
          </button>
        </div>
        
        {/* ════════════════════════════════════════════════════════════════
            LOCATION CARD - PREMIUM WHITE (Late Nov 2025 Design)
        ════════════════════════════════════════════════════════════════ */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border-2 border-[#68BFFA] shadow-xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#6700b6] to-[#060F76] rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {showInternational ? 'Select your country' : "Where's your project?"}
              </h2>
              <p className="text-gray-500">We'll customize recommendations for your area</p>
            </div>
            
            {/* Selected Location Display - PROMINENT */}
            {wizardState.state && (
              <div className="ml-auto px-5 py-2 bg-[#68BFFA]/20 border-2 border-[#68BFFA] rounded-xl">
                <p className="text-[#060F76] font-bold text-lg">{wizardState.state}</p>
              </div>
            )}
          </div>
          
          {!showInternational ? (
            <>
              {/* Side-by-side: Zip Code + State Dropdown - PREMIUM */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Zip Code - Primary input (fastest) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-3">
                    📮 Zip Code <span className="text-[#6700b6]">(fastest)</span>
                  </label>
                  <input
                    type="text"
                    value={wizardState.zipCode}
                    onChange={(e) => onZipChange(e.target.value)}
                    placeholder="Enter 5-digit zip"
                    className="w-full px-5 py-5 bg-[#6700b6]/5 border-2 border-[#6700b6]/30 rounded-xl text-gray-800 text-center text-3xl font-mono placeholder-gray-400 
                               focus:border-[#6700b6] focus:ring-4 focus:ring-[#6700b6]/20 transition-all"
                    maxLength={5}
                  />
                </div>
                
                {/* State Dropdown - Secondary */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-3">
                    🏛️ Or select state
                  </label>
                  <select
                    value={wizardState.state}
                    onChange={(e) => onStateSelect(e.target.value)}
                    className="w-full px-5 py-5 bg-[#6700b6]/5 border-2 border-[#6700b6]/30 rounded-xl text-gray-800 text-lg 
                               focus:border-[#6700b6] focus:ring-4 focus:ring-[#6700b6]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select your state...</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Location Confirmed - Show electricity rate */}
              {wizardState.state && (
                <div className="mt-6 flex items-center gap-3 bg-[#68BFFA]/10 border-2 border-[#68BFFA] rounded-xl px-5 py-4">
                  <CheckCircle className="w-6 h-6 text-[#68BFFA]" />
                  <div>
                    <span className="text-[#060F76] font-semibold text-lg">{wizardState.state}</span>
                    {wizardState.zipCode && (
                      <span className="text-gray-500 ml-2">({wizardState.zipCode})</span>
                    )}
                  </div>
                  {wizardState.electricityRate > 0 && (
                    <span className="ml-auto text-sm font-medium text-gray-600">
                      ~${wizardState.electricityRate.toFixed(2)}/kWh
                    </span>
                  )}
                </div>
              )}
              
              {/* PROQUOTE BUTTON - Dec 21, 2025 - Below location inputs */}
              {onOpenProQuote && (
                <div className="mt-6 pt-5 border-t-2 border-gray-100">
                  <button
                    onClick={onOpenProQuote}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 border-2 border-purple-400/50 rounded-2xl text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]"
                  >
                    <Calculator className="w-6 h-6" />
                    <span className="font-bold text-lg">ProQuote™</span>
                    <span className="text-white/70">— Advanced configurator for pros</span>
                  </button>
                </div>
              )}
            </>
          ) : (
              /* International Selection */
              <div className="space-y-3">
                {Object.entries(REGION_GROUPS).filter(([name]) => name !== 'North America').map(([groupName, regions]) => (
                  <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedRegion(expandedRegion === groupName ? null : groupName)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-semibold text-gray-800">{groupName}</span>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedRegion === groupName ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedRegion === groupName && (
                      <div className="p-3 grid grid-cols-2 gap-2 bg-white">
                        {(regions as typeof INTERNATIONAL_REGIONS).map((region) => (
                          <button
                            key={region.code}
                            onClick={() => onInternationalSelect(region.code)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                              wizardState.state === region.name
                                ? 'bg-[#6700b6]/10 border-2 border-[#6700b6]'
                                : 'bg-gray-50 border border-gray-200 hover:border-[#68BFFA]'
                            }`}
                          >
                            <span>{region.flag}</span>
                            <span className="truncate">{region.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Location Type (Urban/Suburban/Rural) - Inside location card */}
            {wizardState.state && (
              <div className="mt-6 pt-5 border-t-2 border-gray-100">
                <label className="block text-sm font-semibold text-gray-600 mb-3">
                  Location Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {LOCATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = locationType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setLocationType(type.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#6700b6] to-[#060F76] text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="font-semibold">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Multi-Location Toggle */}
            {wizardState.state && (
              <div className="mt-4 pt-4 border-t-2 border-gray-100">
                <button
                  onClick={() => setIsMultiLocation(!isMultiLocation)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all ${
                    isMultiLocation
                      ? 'bg-[#ffa600]/20 border-2 border-[#ffa600] shadow-md'
                      : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className={`w-6 h-6 ${isMultiLocation ? 'text-[#ffa600]' : 'text-gray-500'}`} />
                    <span className={`font-semibold text-lg ${isMultiLocation ? 'text-[#9d6200]' : 'text-gray-700'}`}>
                      Multiple Locations (Chain)
                    </span>
                  </div>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                    isMultiLocation ? 'border-[#ffa600] bg-[#ffa600]' : 'border-gray-300'
                  }`}>
                    {isMultiLocation && <Check className="w-5 h-5 text-white" />}
                  </div>
                </button>
                {isMultiLocation && (
                  <p className="mt-3 text-sm text-gray-500 px-2">
                    <Info className="w-4 h-4 inline mr-1" />
                    We'll help you analyze your portfolio of locations
                  </p>
                )}
              </div>
            )}
          </div>
          
        {/* ════════════════════════════════════════════════════════════════
            GOALS CARD - PREMIUM WHITE WITH ORANGE (Late Nov 2025 Design)
        ════════════════════════════════════════════════════════════════ */}
        {wizardState.state && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 border-2 border-[#ffa600] shadow-xl mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#ffa600] to-[#fc9420] rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">What are your goals?</h2>
                <p className="text-gray-500">Select all that apply - this helps optimize your system</p>
              </div>
            </div>
            
            {/* Goals Grid - Late Nov Design: 2-3 columns */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GOAL_OPTIONS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = wizardState.goals.includes(goal.id);
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#ffa600] bg-[#ffa600]/10 shadow-lg shadow-[#ffa600]/20 scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-[#ffa600]/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isSelected ? 'bg-[#ffa600]' : 'bg-[#6700b6]/10'}`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-[#6700b6]'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg ${isSelected ? 'text-[#9d6200]' : 'text-gray-800'}`}>
                          {goal.label}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                      </div>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-[#ffa600] bg-[#ffa600]' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Selection hint */}
            {wizardState.goals.length === 0 && (
              <p className="mt-5 text-center text-[#ffa600] text-sm flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Please select at least one goal to continue
              </p>
            )}
            
            {/* Selected goals count */}
            {wizardState.goals.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-2 text-[#6700b6]">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold text-lg">
                  {wizardState.goals.length} goal{wizardState.goals.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* SCROLL INDICATOR - Dec 21, 2025 - Pulsing arrow when goals not visible */}
        {!wizardState.goals.length && wizardState.state && (
          <div className="flex flex-col items-center gap-2 mb-6 animate-bounce">
            <span className="text-white/60 text-sm">Scroll down to select your goals</span>
            <ChevronDown className="w-8 h-8 text-[#ffa600]" />
          </div>
        )}
        
        {/* NAVIGATION BUTTONS - CONSISTENT DESIGN */}
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              canContinue
                ? 'bg-gradient-to-r from-[#6700b6] via-[#060F76] to-[#6700b6] border-2 border-[#ad42ff] text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105'
                : 'bg-gray-600 border-2 border-gray-500 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Wand2 className="w-5 h-5" />
            Next Step
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {!canContinue && (
          <p className="text-center text-white/60 text-sm mt-3">
            {!wizardState.state && !wizardState.goals.length 
              ? 'Select your location and at least one goal'
              : !wizardState.state 
                ? 'Select your location to continue'
                : 'Select at least one goal to continue'
            }
          </p>
        )}
        
        {/* Merlin encouragement */}
        {canContinue && (
          <div className="mt-6 text-center">
            <p className="text-[#cc89ff] text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffa600]" />
              Great! Next, tell me about your business
            </p>
          </div>
        )}
        
        {/* Bottom teaser - dynamic savings estimate */}
        {wizardState.state && (
          <div className="mt-8 p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl border border-emerald-400/30">
            <p className="text-center text-white">
              <span className="text-emerald-300">💡</span>{' '}
              Based on <span className="font-bold text-emerald-300">{wizardState.state}</span> rates, 
              businesses save <span className="font-bold text-emerald-300">$15,000 - $80,000/year</span> with 
              the right energy system. Let's find yours!
            </p>
          </div>
        )}
        
        {/* Bottom padding for floating nav */}
        <div className="h-20" />
      </div>
      
      {/* Floating Navigation Arrows - Universal */}
      <FloatingNavigationArrows
        canGoBack={false}
        canGoForward={!!canContinue}
        onBack={() => {}}
        onForward={onContinue}
        forwardLabel="Select Industry"
      />
    </div>
  );
}

export default Step1LocationGoals;
