/**
 * STEP 1: Location & Goals
 * ========================
 * 
 * Enhanced with:
 * - Gradient panel for goals section (cyan/violet to white)
 * - More visual POP on goal buttons
 * - Better visual hierarchy
 * 
 * Updated: December 28, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Sparkles, 
  Check, 
  Globe, 
  CheckCircle, 
  ChevronDown,
  DollarSign,
  Battery,
  Leaf,
  Zap,
  Sun,
  TrendingUp,
  Shield,
  Target
} from 'lucide-react';
import type { WizardState, EnergyGoal } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

interface GoalOption {
  id: EnergyGoal;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ============================================================================
// SOLAR DATA BY STATE
// ============================================================================

const STATE_SOLAR_DATA: Record<string, { sunHours: number; rating: string }> = {
  'AZ': { sunHours: 6.5, rating: 'Excellent' },
  'NV': { sunHours: 6.4, rating: 'Excellent' },
  'NM': { sunHours: 6.2, rating: 'Excellent' },
  'CA': { sunHours: 5.8, rating: 'Excellent' },
  'UT': { sunHours: 5.6, rating: 'Very Good' },
  'CO': { sunHours: 5.5, rating: 'Very Good' },
  'TX': { sunHours: 5.4, rating: 'Very Good' },
  'FL': { sunHours: 5.3, rating: 'Very Good' },
  'OK': { sunHours: 5.2, rating: 'Good' },
  'KS': { sunHours: 5.1, rating: 'Good' },
  'NC': { sunHours: 5.0, rating: 'Good' },
  'GA': { sunHours: 5.0, rating: 'Good' },
  'SC': { sunHours: 5.0, rating: 'Good' },
  'TN': { sunHours: 4.8, rating: 'Good' },
  'VA': { sunHours: 4.7, rating: 'Good' },
  'MD': { sunHours: 4.6, rating: 'Moderate' },
  'NJ': { sunHours: 4.5, rating: 'Moderate' },
  'PA': { sunHours: 4.4, rating: 'Moderate' },
  'NY': { sunHours: 4.3, rating: 'Moderate' },
  'MA': { sunHours: 4.2, rating: 'Moderate' },
  'IL': { sunHours: 4.2, rating: 'Moderate' },
  'OH': { sunHours: 4.1, rating: 'Moderate' },
  'MI': { sunHours: 4.0, rating: 'Moderate' },
  'WA': { sunHours: 3.8, rating: 'Fair' },
  'OR': { sunHours: 3.9, rating: 'Fair' },
  'MN': { sunHours: 4.0, rating: 'Moderate' },
  'WI': { sunHours: 4.0, rating: 'Moderate' },
};

const ZIP_TO_STATE: Record<string, string> = {
  '0': 'MA', '1': 'NY', '2': 'VA', '3': 'FL', '4': 'MI',
  '5': 'MN', '6': 'IL', '7': 'TX', '8': 'CO', '9': 'CA',
};

// More specific ZIP ranges
const getStateFromZip = (zip: string): string => {
  const prefix = zip.substring(0, 3);
  const prefixNum = parseInt(prefix);
  
  // Nevada
  if (prefixNum >= 889 && prefixNum <= 898) return 'NV';
  // Arizona
  if (prefixNum >= 850 && prefixNum <= 865) return 'AZ';
  // California
  if (prefixNum >= 900 && prefixNum <= 961) return 'CA';
  // Texas
  if (prefixNum >= 750 && prefixNum <= 799) return 'TX';
  // Florida
  if (prefixNum >= 320 && prefixNum <= 349) return 'FL';
  // New York
  if (prefixNum >= 100 && prefixNum <= 149) return 'NY';
  // Colorado
  if (prefixNum >= 800 && prefixNum <= 816) return 'CO';
  
  // Fallback to first digit
  return ZIP_TO_STATE[zip[0]] || 'CA';
};

// ============================================================================
// GOAL OPTIONS
// ============================================================================

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'reduce_costs',
    label: 'Reduce Energy Costs',
    description: 'Lower your electricity bills with smart energy management',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50'
  },
  {
    id: 'backup_power',
    label: 'Backup Power Protection',
    description: 'Keep operations running during outages',
    icon: <Battery className="w-6 h-6" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50'
  },
  {
    id: 'sustainability',
    label: 'Sustainability / Net Zero',
    description: 'Meet ESG goals and reduce carbon footprint',
    icon: <Leaf className="w-6 h-6" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50'
  },
  {
    id: 'ev_ready',
    label: 'Prepare for EV Charging',
    description: 'Future-proof your facility for electric vehicles',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50'
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

export function Step1Location({ state, updateState }: Props) {
  const [zipInput, setZipInput] = useState(state.zipCode);
  const [isValidZip, setIsValidZip] = useState(false);
  const [isUSA, setIsUSA] = useState(true);

  // Derive state from ZIP
  useEffect(() => {
    if (zipInput.length >= 5) {
      const derivedState = getStateFromZip(zipInput);
      const solarData = STATE_SOLAR_DATA[derivedState];
      
      setIsValidZip(true);
      updateState({
        zipCode: zipInput,
        state: derivedState,
        solarData: solarData || { sunHours: 4.5, rating: 'Moderate' }
      });
    } else {
      setIsValidZip(false);
    }
  }, [zipInput]);

  const toggleGoal = (goalId: EnergyGoal) => {
    const currentGoals = state.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(g => g !== goalId)
      : [...currentGoals, goalId];
    updateState({ goals: newGoals });
  };

  const isGoalSelected = (goalId: EnergyGoal) => state.goals?.includes(goalId) || false;

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4">
          <MapPin className="w-4 h-4" />
          Step 1: Your Location
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Let's Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Perfect Energy Solution</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Enter your ZIP code to see solar potential and energy savings for your area.
        </p>
      </div>

      {/* ZIP Code Input Section */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-white/10">

            {/* USA / International Toggle */}
            <div className="flex justify-center gap-3 mb-5">
              <button
                onClick={() => setIsUSA(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  isUSA
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg border-2 border-cyan-300"
                    : "bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 border border-slate-600"
                }`}
              >
                <span className="text-xl">🇺🇸</span>
                USA
              </button>
              <button
                onClick={() => setIsUSA(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  !isUSA
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg border-2 border-purple-400"
                    : "bg-slate-700/50 text-gray-400 hover:bg-slate-600/50 border border-slate-600"
                }`}
              >
                <span className="text-xl">🌍</span>
                International
              </button>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-4" />
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Business ZIP Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="Enter ZIP code"
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              {isValidZip && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Result Card */}
      {isValidZip && state.state && (
        <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative">
            {/* Gradient border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-2xl opacity-70" />
            <div className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-semibold text-lg">
                      {state.state === 'NV' ? 'Nevada' : 
                       state.state === 'CA' ? 'California' :
                       state.state === 'AZ' ? 'Arizona' :
                       state.state === 'TX' ? 'Texas' :
                       state.state === 'FL' ? 'Florida' :
                       state.state === 'NY' ? 'New York' :
                       state.state === 'CO' ? 'Colorado' :
                       state.state} ({zipInput})
                    </p>
                    <p className="text-slate-500 text-sm">Location confirmed</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="text-amber-600 font-semibold">{state.solarData?.sunHours} hrs/day</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    state.solarData?.rating === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                    state.solarData?.rating === 'Very Good' ? 'bg-green-100 text-green-700' :
                    state.solarData?.rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {state.solarData?.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll indicator */}
      {isValidZip && (
        <div className="text-center text-purple-400 animate-bounce">
          <p className="text-sm mb-1">Scroll for more</p>
          <ChevronDown className="w-5 h-5 mx-auto" />
        </div>
      )}

      {/* Goals Section - Enhanced Panel */}
      <div className="max-w-2xl mx-auto">
        {/* Gradient Panel Container */}
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-lg" />
          
          {/* Gradient border */}
          <div className="absolute -inset-[2px] bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 rounded-3xl opacity-60" />
          
          {/* Panel content */}
          <div className="relative bg-gradient-to-br from-white via-blue-50/80 to-purple-50/80 rounded-3xl p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full text-purple-700 text-xs font-semibold mb-3">
                <Target className="w-3 h-3" />
                SELECT YOUR PRIORITIES
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                What are your energy goals?
              </h2>
              <p className="text-slate-600">
                Select all that apply to customize your solution
              </p>
            </div>

            {/* Goal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOAL_OPTIONS.map((goal) => {
                const selected = isGoalSelected(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`relative group text-left p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                      selected
                        ? `bg-gradient-to-br from-purple-600 to-cyan-600 border-transparent text-white shadow-xl shadow-purple-500/30`
                        : `bg-gradient-to-b from-slate-600 to-slate-800 border-slate-500 shadow-lg shadow-slate-900/50 hover:from-slate-500 hover:to-slate-700 hover:-translate-y-1 hover:shadow-lg`
                    }`}
                  >
                    {/* Selection indicator */}
                    {selected && (
                      <div className="absolute top-3 right-3">
                        <div className="p-1 bg-white/20 rounded-full">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl mb-3 ${
                      selected 
                        ? 'bg-white/20' 
                        : goal.bgColor
                    }`}>
                      <span className={selected ? 'text-white' : goal.color}>
                        {goal.icon}
                      </span>
                    </div>
                    
                    {/* Text */}
                    <h3 className={`font-semibold text-lg mb-1 ${
                      selected ? 'text-white' : 'text-white'
                    }`}>
                      {goal.label}
                    </h3>
                    <p className={`text-sm ${
                      selected ? 'text-white/80' : 'text-purple-200'
                    }`}>
                      {goal.description}
                    </p>
                    
                    {/* Hover glow for unselected */}
                    {!selected && (
                      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                        goal.id === 'reduce_costs' ? 'shadow-lg shadow-amber-500/20' :
                        goal.id === 'backup_power' ? 'shadow-lg shadow-emerald-500/20' :
                        goal.id === 'sustainability' ? 'shadow-lg shadow-green-500/20' :
                        'shadow-lg shadow-cyan-500/20'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selection summary */}
            {state.goals && state.goals.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-center gap-2 text-purple-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">
                    {state.goals.length} goal{state.goals.length > 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick location tag */}
      {isValidZip && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-slate-300 text-sm">
            <MapPin className="w-4 h-4 text-purple-400" />
            {zipInput} – {state.state}
          </div>
        </div>
      )}
    </div>
  );
}

export default Step1Location;
