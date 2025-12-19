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
import { US_STATES, INTERNATIONAL_REGIONS, REGION_GROUPS } from '../constants/wizardConstants';
import { getStepColors } from '../constants/stepColors';
import { MerlinHat } from '../MerlinHat';
import type { WizardState } from '../types/wizardTypes';
import merlinImage from '@/assets/images/new_Merlin.png';

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

// State utility rates and solar data
const STATE_DATA: Record<string, { rate: number; solar: number; evOpp: string; bessValue: string }> = {
  'California': { rate: 0.22, solar: 5.5, evOpp: 'Very High', bessValue: 'Excellent' },
  'Texas': { rate: 0.12, solar: 5.0, evOpp: 'High', bessValue: 'High' },
  'Florida': { rate: 0.13, solar: 5.2, evOpp: 'High', bessValue: 'High' },
  'New York': { rate: 0.20, solar: 4.0, evOpp: 'Very High', bessValue: 'Excellent' },
  'Arizona': { rate: 0.13, solar: 6.5, evOpp: 'High', bessValue: 'Excellent' },
  'Nevada': { rate: 0.12, solar: 6.2, evOpp: 'High', bessValue: 'Very High' },
  'Hawaii': { rate: 0.35, solar: 5.8, evOpp: 'Very High', bessValue: 'Exceptional' },
  'Massachusetts': { rate: 0.24, solar: 4.2, evOpp: 'Very High', bessValue: 'Excellent' },
  'Connecticut': { rate: 0.23, solar: 4.0, evOpp: 'High', bessValue: 'Excellent' },
  'New Jersey': { rate: 0.17, solar: 4.3, evOpp: 'Very High', bessValue: 'High' },
  // Add more states as needed - defaults below for unlisted states
};

const getStateData = (state: string) => {
  return STATE_DATA[state] || { rate: 0.14, solar: 4.5, evOpp: 'Moderate', bessValue: 'Good' };
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
            MERLIN GUIDANCE PANEL - Comprehensive template (Dec 19, 2025)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 mb-6 shadow-xl border border-indigo-400/30">
          {/* Top Row: Avatar + Welcome */}
          <div className="flex items-start gap-5 mb-5">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center overflow-hidden">
                <img src={merlinImage} alt="Merlin" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="flex-1">
              {/* Welcome Message */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {wizardState.goals.length > 0 ? "Great choices!" : "Hi! I'm Merlin, your energy advisor"}
                </h1>
                {/* TrueQuote Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 backdrop-blur-sm rounded-full px-4 py-1.5 border-2 border-amber-400/60 shadow-lg shadow-amber-500/20">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L4 6v6c0 5.5 3.84 10.66 8 12 4.16-1.34 8-6.5 8-12V6l-8-4z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-amber-200 font-bold text-sm">TrueQuote™</span>
                </div>
              </div>
              <p 
                className="text-white/90 text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: merlinMessage.main }}
              />
            </div>
          </div>
          
          {/* 1-2-3 STEP INSTRUCTIONS */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Here's what to do on this page:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <span className="text-white/90 text-sm">Select your <strong>state/location</strong></span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <span className="text-white/90 text-sm">Choose your <strong>energy goals</strong></span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <span className="text-white/90 text-sm">Click <strong>Continue</strong> when done</span>
              </div>
            </div>
          </div>
          
          {/* RECOMMENDATION */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 mb-5 border border-emerald-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Battery className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-emerald-300 font-bold mb-1">💡 Merlin's Insight</h4>
                <p className="text-white/90 text-sm">
                  {wizardState.state 
                    ? `${wizardState.state} has excellent potential for energy savings! I'll customize your quote based on local utility rates and solar conditions.`
                    : "Tell me where you are and I'll analyze your local utility rates, solar potential, and incentive programs to maximize your savings!"}
                </p>
              </div>
            </div>
          </div>
          
          {/* PRO TIP: NAV BAR */}
          <div className="bg-amber-500/20 rounded-2xl p-4 border border-amber-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-amber-300 font-bold text-sm mb-1">👆 Pro Tip: Watch the Top Navigation Bar</h4>
                <p className="text-white/80 text-sm">
                  As you progress, the <strong>Solar Opportunity</strong> and <strong>Power Profile</strong> indicators will update based on your location and choices!
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
              <span className="text-amber-300 font-bold text-sm">Step 1 of 4</span>
              <span className="text-white/50">•</span>
              <span className="text-white/80 text-sm">Location & Goals</span>
            </div>
            <span className="text-white/60 text-sm">⏱️ Takes about 5 minutes total</span>
          </div>
        </div>
        
        {/* SUMMARY BAR */}
        <SummaryBar 
          state={wizardState.state} 
          goals={wizardState.goals}
          locationType={locationType}
        />
        
        {/* TWO-COLUMN LAYOUT - Match Merlin panel width */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          
          {/* ======================================== */}
          {/* LEFT COLUMN: LOCATION */}
          {/* ======================================== */}
          <div className={`${stepColors.panelBgGradient} backdrop-blur-sm rounded-2xl p-5 border ${stepColors.panelBorder} shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-[#68BFFA] to-[#060F76] rounded-2xl flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Location</h2>
                <p className="text-sm text-gray-500">Where is your project?</p>
              </div>
            </div>
            
            {/* USA / International Toggle */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setShowInternational(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  !showInternational 
                    ? 'bg-gradient-to-r from-[#68BFFA] to-[#060F76] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">🇺🇸</span>
                USA
              </button>
              <button
                onClick={() => setShowInternational(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  showInternational 
                    ? 'bg-gradient-to-r from-[#6700b6] to-[#060F76] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Globe className="w-5 h-5" />
                International
              </button>
            </div>
            
            {!showInternational ? (
              <>
                {/* State Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    State
                  </label>
                  <select
                    value={wizardState.state}
                    onChange={(e) => onStateSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 text-lg 
                               focus:border-[#6700b6] focus:ring-2 focus:ring-[#6700b6]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select your state...</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                {/* Zip Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Zip Code <span className="text-gray-400">(optional, for precise rates)</span>
                  </label>
                  <input
                    type="text"
                    value={wizardState.zipCode}
                    onChange={(e) => onZipChange(e.target.value)}
                    placeholder="Enter zip code"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 
                               focus:border-[#6700b6] focus:ring-2 focus:ring-[#6700b6]/20 transition-all"
                    maxLength={5}
                  />
                </div>
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
            
            {/* Location Type (Urban/Suburban/Rural) */}
            {wizardState.state && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-600 mb-3">
                  Location Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LOCATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = locationType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setLocationType(type.id)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-[#6700b6] text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Multi-Location Toggle */}
            {wizardState.state && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsMultiLocation(!isMultiLocation)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isMultiLocation
                      ? 'bg-[#ffa600]/20 border-2 border-[#ffa600]'
                      : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className={`w-5 h-5 ${isMultiLocation ? 'text-[#ffa600]' : 'text-gray-500'}`} />
                    <span className={`font-medium ${isMultiLocation ? 'text-[#9d6200]' : 'text-gray-700'}`}>
                      Multiple Locations (Chain)
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isMultiLocation ? 'border-[#ffa600] bg-[#ffa600]' : 'border-gray-300'
                  }`}>
                    {isMultiLocation && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
                {isMultiLocation && (
                  <p className="mt-2 text-sm text-gray-500 px-2">
                    <Info className="w-4 h-4 inline mr-1" />
                    We'll help you analyze your portfolio of locations
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* ======================================== */}
          {/* RIGHT COLUMN: GOALS */}
          {/* ======================================== */}
          <div className={`${stepColors.panelBgGradient} backdrop-blur-sm rounded-2xl p-5 border ${stepColors.panelBorder} shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ffa600] to-[#fc9420] rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Your Goals</h2>
                <p className="text-sm text-gray-500">What matters most to you?</p>
              </div>
            </div>
            
            {/* Goals List */}
            <div className="space-y-3">
              {GOAL_OPTIONS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = wizardState.goals.includes(goal.id);
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#ffa600] bg-[#ffa600]/10 shadow-md'
                        : 'border-gray-200 bg-white hover:border-[#ffa600]/50 hover:bg-[#ffa600]/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-[#ffa600] shadow-lg' 
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#6700b6]'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-bold ${isSelected ? 'text-[#9d6200]' : 'text-gray-800'}`}>
                        {goal.label}
                      </h4>
                      <p className="text-sm text-gray-500">{goal.description}</p>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected 
                        ? 'border-[#ffa600] bg-[#ffa600]' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Selection hint */}
            {wizardState.goals.length === 0 && (
              <div className="mt-4 p-3 bg-[#ffa600]/10 rounded-xl border border-[#ffa600]/30">
                <p className="text-sm text-[#9d6200] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ffa600]" />
                  Select at least one goal so Merlin can customize your system
                </p>
              </div>
            )}
            
            {/* Selected goals count */}
            {wizardState.goals.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[#6700b6]">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {wizardState.goals.length} goal{wizardState.goals.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* PROQUOTE LINK - For Professionals */}
        {onOpenProQuote && (
          <div className="flex justify-center mb-6">
            <button
              onClick={onOpenProQuote}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-2 border-purple-400/50 rounded-xl text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105"
            >
              <Calculator className="w-5 h-5" />
              <span className="font-bold">ProQuote™</span>
              <span className="text-white/70 text-sm">— Advanced configurator</span>
            </button>
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
      </div>
    </div>
  );
}

export default Step1LocationGoals;
