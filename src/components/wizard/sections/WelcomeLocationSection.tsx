/**
 * WELCOME & LOCATION SECTION (Section 0)
 * =======================================
 * 
 * Combined welcome hero, location selection, and goals.
 * Manual "Next" button advancement (no auto-advance).
 * 
 * December 2025 Update:
 * - Added international country support (UK, Europe, Australia, NZ, Japan, India, etc.)
 * - Moved Goals selection into this section
 * - Added explicit "Continue" button (no auto-advance)
 */

import React, { useState } from 'react';
import {
  Sparkles, MapPin, CheckCircle, Sun, Battery, Zap,
  AlertTriangle, ChevronDown, Wand2, ArrowRight,
  Globe, ChevronRight
} from 'lucide-react';
import { US_STATES, INTERNATIONAL_REGIONS, REGION_GROUPS, GOAL_OPTIONS } from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';

interface WelcomeLocationSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  onZipChange: (zip: string) => Promise<void>;
  onStateSelect: (state: string) => void;
  onInternationalSelect: (regionCode: string) => void;
  onContinue: () => void;
  onOpenAdvanced?: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

export function WelcomeLocationSection({
  wizardState,
  setWizardState,
  onZipChange,
  onStateSelect,
  onInternationalSelect,
  onContinue,
  onOpenAdvanced,
  sectionRef,
  isHidden = false,
}: WelcomeLocationSectionProps) {
  const [showInternational, setShowInternational] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  
  // Check if user has completed location and at least one goal
  const canContinue = wizardState.state && wizardState.goals.length > 0;
  
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-120px)] p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Welcome Hero - SIMPLIFIED per Vineet feedback */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-5 py-2 mb-6">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-purple-700 text-sm font-semibold">AI-Powered Quote Builder</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Start Saving on Energy
          </h1>
          
          <p className="text-xl text-purple-200 mb-2">
            Get a custom energy storage quote in minutes
          </p>
        </div>
        
        {/* USA / INTERNATIONAL TOGGLE - PROMINENT (Vineet feedback) */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setShowInternational(false)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
              !showInternational 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
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
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-gray-600'
            }`}
          >
            <Globe className="w-6 h-6" />
            International
          </button>
        </div>
        
        {/* Location Input Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-purple-200 shadow-xl mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {showInternational ? 'Select your country' : "Where's your project?"}
              </h2>
              <p className="text-sm text-gray-500">We'll customize recommendations for your area</p>
            </div>
            
            {/* Selected Location Display - PROMINENT (Vineet feedback) */}
            {wizardState.state && (
              <div className="ml-auto px-4 py-2 bg-emerald-100 border-2 border-emerald-400 rounded-xl">
                <p className="text-emerald-800 font-bold text-lg">{wizardState.state}</p>
              </div>
            )}
          </div>
          
          {!showInternational ? (
            /* US Location Selection */
            <div className="grid md:grid-cols-2 gap-6">
              {/* Zip Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  📮 Zip Code (fastest)
                </label>
                <input
                  type="text"
                  value={wizardState.zipCode}
                  onChange={(e) => onZipChange(e.target.value)}
                  placeholder="Enter 5-digit zip"
                  className="w-full px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-gray-800 text-center text-2xl font-mono placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  maxLength={5}
                />
              </div>
              
              {/* State Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  🏛️ Or select state
                </label>
                <select
                  value={wizardState.state}
                  onChange={(e) => onStateSelect(e.target.value)}
                  className="w-full px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-gray-800 text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-white">Select your state...</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state} className="bg-white">{state}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* International Location Selection */
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Select your country or region for localized pricing and solar data</p>
              
              {Object.entries(REGION_GROUPS).filter(([name]) => name !== 'North America').map(([groupName, regions]) => (
                <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRegion(expandedRegion === groupName ? null : groupName)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{groupName}</span>
                    <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${expandedRegion === groupName ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {expandedRegion === groupName && (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2 bg-white">
                      {(regions as typeof INTERNATIONAL_REGIONS).map((region) => (
                        <button
                          key={region.code}
                          onClick={() => onInternationalSelect(region.code)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                            wizardState.state === region.name
                              ? 'bg-purple-100 border-2 border-purple-500 text-purple-700'
                              : 'bg-gray-50 border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                          }`}
                        >
                          <span className="text-xl">{region.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{region.name}</div>
                            <div className="text-xs text-gray-500">{region.avgSolarHours}h sun</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Location Confirmed */}
          {wizardState.state && (
            <div className="mt-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              <div>
                <span className="text-emerald-700 font-medium">{wizardState.state}</span>
                {wizardState.zipCode && (
                  <span className="text-gray-500 ml-2">({wizardState.zipCode})</span>
                )}
              </div>
              {wizardState.electricityRate > 0 && (
                <span className="ml-auto text-sm text-gray-600">
                  ~${wizardState.electricityRate.toFixed(2)}/kWh
                </span>
              )}
            </div>
          )}
          
          {/* Geographic Insights */}
          {wizardState.geoRecommendations && (
            <GeographicInsights 
              geoRecommendations={wizardState.geoRecommendations}
              state={wizardState.state}
              electricityRate={wizardState.electricityRate}
            />
          )}
        </div>
        
        {/* GOALS SECTION - Moved here from Section 3 */}
        {wizardState.state && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200 shadow-xl mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">What are your goals?</h2>
                <p className="text-sm text-gray-500">Select all that apply - this helps optimize your system</p>
              </div>
            </div>
            
            {/* Goals Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = wizardState.goals.includes(goal.id);
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setWizardState(prev => ({
                        ...prev,
                        goals: isSelected
                          ? prev.goals.filter(g => g !== goal.id)
                          : [...prev.goals, goal.id]
                      }));
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50 shadow-md shadow-amber-500/20'
                        : 'border-gray-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500' : 'bg-purple-100'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>
                          {goal.label}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-amber-400 bg-amber-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Selection hint */}
            {wizardState.goals.length === 0 && (
              <p className="mt-4 text-center text-amber-600 text-sm flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Please select at least one goal to continue
              </p>
            )}
          </div>
        )}
        
        {/* CONTINUE BUTTON - Only show when both location and goals are selected */}
        {wizardState.state && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className={`px-10 py-4 rounded-2xl text-lg font-bold transition-all flex items-center gap-3 ${
                canContinue
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to Industry Selection
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {/* Optional: Advanced Mode shortcut */}
            {onOpenAdvanced && canContinue && (
              <button
                onClick={onOpenAdvanced}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Or skip to Pro Mode for full configuration
              </button>
            )}
          </div>
        )}
        
        {/* Scroll hint when no location */}
        {!wizardState.state && (
          <div className="text-center mt-12 animate-bounce">
            <div className="inline-flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl border border-purple-400/30">
              <ChevronDown className="w-10 h-10 text-purple-400" />
              <span className="text-purple-300 font-medium">Enter your location to continue</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface GeographicInsightsProps {
  geoRecommendations: NonNullable<WizardState['geoRecommendations']>;
  state: string;
  electricityRate: number;
}

function GeographicInsights({ geoRecommendations, state, electricityRate }: GeographicInsightsProps) {
  return (
    <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-2xl">
      <h3 className="text-base font-bold text-purple-700 mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-purple-500" />
        Smart Recommendations for {state}
      </h3>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center border border-amber-200">
          <Sun className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-600">
            {geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-500">Sun Hours/Day</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-purple-200">
          <Battery className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <div className="text-xl font-black text-purple-600">
            {geoRecommendations.recommendations.batteryStorage.recommended ? '✓ Yes' : 'Optional'}
          </div>
          <div className="text-xs text-gray-500">Battery Rec'd</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-blue-200">
          <Zap className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <div className="text-xl font-black text-blue-600">
            {geoRecommendations.profile.gridReliabilityScore}/100
          </div>
          <div className="text-xs text-gray-500">Grid Reliability</div>
        </div>
      </div>
      
      {/* Why These Recommendations - Compact */}
      <div className="bg-white rounded-xl p-3 border border-purple-100">
        <h4 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          Key Insights
        </h4>
        <div className="flex flex-wrap gap-2">
          {geoRecommendations.profile.avgSolarHoursPerDay >= 5 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" /> Great solar potential
            </span>
          )}
          {geoRecommendations.recommendations.batteryStorage.recommended && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" /> Battery recommended
            </span>
          )}
          {electricityRate > 0.12 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" /> High rates (${electricityRate.toFixed(2)}/kWh)
            </span>
          )}
          {geoRecommendations.profile.gridReliabilityScore < 85 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" /> Backup power advised
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default WelcomeLocationSection;
