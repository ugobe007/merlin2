/**
 * MERLIN INSIGHT MODAL v3
 * =======================
 * 
 * Merlin's Grand Entrance! Appears after Step 2 (Industry Selection)
 * 
 * Design:
 * - Two-column layout: Merlin image (left) + Opportunities list (right)
 * - Sparkles animation around Merlin
 * - Toggle switches for Solar/Generator/EV
 * - BESS always included (informational only)
 * - Location-specific insights (solar hours, EV adoption, grid reliability)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Sun, Battery, Zap, Sparkles, 
  ArrowRight, Flame
} from 'lucide-react';
import merlinImage from '@/assets/images/new_profile_merlin.png';

// ============================================================================
// TYPES
// ============================================================================

export interface OpportunityPreferences {
  wantsSolar: boolean;
  wantsGenerator: boolean;
  wantsEV: boolean;
}

interface OpportunityData {
  solar: { available: boolean; rating: string; description: string };
  generator: { available: boolean; rating: string; description: string };
  ev: { available: boolean; rating: string; description: string };
}

interface MerlinInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preferences: OpportunityPreferences) => void;
  state: string;
  industry: string;
  industryName: string;
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  opportunities?: OpportunityData; // Optional - component generates insights internally
}

// ============================================================================
// LOCATION DATA
// ============================================================================

const SOLAR_DATA: Record<string, { sunHours: number; rating: 'excellent' | 'good' | 'moderate' | 'limited' }> = {
  'AZ': { sunHours: 6.5, rating: 'excellent' },
  'CA': { sunHours: 5.8, rating: 'excellent' },
  'NV': { sunHours: 6.4, rating: 'excellent' },
  'NM': { sunHours: 6.2, rating: 'excellent' },
  'TX': { sunHours: 5.5, rating: 'excellent' },
  'FL': { sunHours: 5.4, rating: 'good' },
  'CO': { sunHours: 5.5, rating: 'good' },
  'UT': { sunHours: 5.6, rating: 'good' },
  'NC': { sunHours: 5.0, rating: 'good' },
  'GA': { sunHours: 5.1, rating: 'good' },
  'SC': { sunHours: 5.1, rating: 'good' },
  'TN': { sunHours: 4.8, rating: 'good' },
  'AL': { sunHours: 4.9, rating: 'good' },
  'LA': { sunHours: 4.8, rating: 'good' },
  'MS': { sunHours: 4.8, rating: 'good' },
  'OK': { sunHours: 5.2, rating: 'good' },
  'KS': { sunHours: 5.3, rating: 'good' },
  'NE': { sunHours: 5.0, rating: 'good' },
  'SD': { sunHours: 5.0, rating: 'good' },
  'ND': { sunHours: 4.8, rating: 'moderate' },
  'MT': { sunHours: 4.8, rating: 'moderate' },
  'WY': { sunHours: 5.2, rating: 'good' },
  'ID': { sunHours: 4.9, rating: 'moderate' },
  'OR': { sunHours: 4.2, rating: 'moderate' },
  'WA': { sunHours: 3.8, rating: 'limited' },
  'MN': { sunHours: 4.5, rating: 'moderate' },
  'WI': { sunHours: 4.3, rating: 'moderate' },
  'MI': { sunHours: 4.0, rating: 'limited' },
  'OH': { sunHours: 4.2, rating: 'moderate' },
  'IN': { sunHours: 4.4, rating: 'moderate' },
  'IL': { sunHours: 4.5, rating: 'moderate' },
  'IA': { sunHours: 4.6, rating: 'moderate' },
  'MO': { sunHours: 4.8, rating: 'good' },
  'AR': { sunHours: 4.9, rating: 'good' },
  'PA': { sunHours: 4.2, rating: 'moderate' },
  'NY': { sunHours: 4.0, rating: 'moderate' },
  'NJ': { sunHours: 4.4, rating: 'moderate' },
  'CT': { sunHours: 4.2, rating: 'moderate' },
  'MA': { sunHours: 4.2, rating: 'moderate' },
  'VT': { sunHours: 4.0, rating: 'limited' },
  'NH': { sunHours: 4.1, rating: 'moderate' },
  'ME': { sunHours: 4.0, rating: 'limited' },
  'RI': { sunHours: 4.3, rating: 'moderate' },
  'DE': { sunHours: 4.5, rating: 'moderate' },
  'MD': { sunHours: 4.5, rating: 'moderate' },
  'VA': { sunHours: 4.7, rating: 'good' },
  'WV': { sunHours: 4.3, rating: 'moderate' },
  'KY': { sunHours: 4.5, rating: 'moderate' },
  'HI': { sunHours: 5.5, rating: 'excellent' },
  'AK': { sunHours: 3.0, rating: 'limited' },
};

const EV_DATA: Record<string, { adoptionRate: number; rating: 'high' | 'growing' | 'emerging' }> = {
  'CA': { adoptionRate: 18.5, rating: 'high' },
  'WA': { adoptionRate: 12.2, rating: 'high' },
  'OR': { adoptionRate: 10.8, rating: 'high' },
  'CO': { adoptionRate: 9.5, rating: 'high' },
  'NV': { adoptionRate: 8.2, rating: 'growing' },
  'AZ': { adoptionRate: 7.8, rating: 'growing' },
  'FL': { adoptionRate: 6.5, rating: 'growing' },
  'TX': { adoptionRate: 5.8, rating: 'growing' },
  'NY': { adoptionRate: 7.2, rating: 'growing' },
  'NJ': { adoptionRate: 8.1, rating: 'growing' },
  'MA': { adoptionRate: 9.2, rating: 'high' },
  'CT': { adoptionRate: 7.5, rating: 'growing' },
  'VT': { adoptionRate: 8.8, rating: 'growing' },
  'HI': { adoptionRate: 10.5, rating: 'high' },
  'UT': { adoptionRate: 6.0, rating: 'growing' },
  'GA': { adoptionRate: 5.5, rating: 'growing' },
  'NC': { adoptionRate: 5.2, rating: 'growing' },
  'VA': { adoptionRate: 5.8, rating: 'growing' },
  'MD': { adoptionRate: 6.2, rating: 'growing' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MerlinInsightModal: React.FC<MerlinInsightModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  state,
  industry,
  industryName,
  gridConnection,
}) => {
  const [preferences, setPreferences] = useState<OpportunityPreferences>({
    wantsSolar: false,
    wantsGenerator: false,
    wantsEV: false,
  });

  if (!isOpen) return null;

  // Normalize state to state code (handle both full names and codes)
  const normalizeStateCode = (stateInput: string): string => {
    const stateUpper = stateInput.toUpperCase().trim();
    // If it's already a 2-letter code, return it
    if (stateUpper.length === 2 && /^[A-Z]{2}$/.test(stateUpper)) {
      return stateUpper;
    }
    // Map full state names to codes
    const stateNameToCode: Record<string, string> = {
      'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
      'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
      'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
      'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
      'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
      'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
      'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
      'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
      'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
      'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
      'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
      'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
      'WISCONSIN': 'WI', 'WYOMING': 'WY'
    };
    return stateNameToCode[stateUpper] || stateUpper;
  };

  const stateCode = normalizeStateCode(state);
  const solarData = SOLAR_DATA[stateCode] || { sunHours: 4.5, rating: 'moderate' as const };
  const evData = EV_DATA[stateCode] || { adoptionRate: 5.0, rating: 'emerging' as const };
  const needsBackup = gridConnection === 'unreliable' || gridConnection === 'limited' || gridConnection === 'off-grid';

  const handleToggle = (key: keyof OpportunityPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    console.log('🧙 MerlinInsightModal handleConfirm called');
    console.log('🧙 preferences:', preferences);
    onConfirm(preferences);
  };

  const getSolarRating = () => {
    switch (solarData.rating) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'moderate': return 'Moderate';
      default: return 'Limited';
    }
  };


  const getEVRating = () => {
    switch (evData.rating) {
      case 'high': return 'High';
      case 'growing': return 'Growing';
      default: return 'Emerging';
    }
  };

  const getMerlinMessage = () => {
    const messages = [];
    if (solarData.rating === 'excellent') {
      messages.push(`Great news! ${state} offers excellent solar opportunities with ${solarData.sunHours} peak sun hours per day.`);
    } else if (solarData.rating === 'good') {
      messages.push(`${state} has strong solar potential with ${solarData.sunHours} peak sun hours.`);
    }
    if (evData.rating === 'high') {
      messages.push(`EV adoption is high in ${state} at ${evData.adoptionRate}% — great opportunity for charging stations.`);
    }
    if (needsBackup) {
      messages.push(`Given your grid situation, backup power is recommended.`);
    }
    return messages.length > 0 
      ? messages.join(' ') 
      : `I've analyzed ${state}'s energy landscape for your ${industryName.toLowerCase()}. Select which opportunities interest you.`;
  };

  const selectedCount = Object.values(preferences).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md border-b border-purple-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Merlin's Magic</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col md:flex-row p-6 gap-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Left Column - Merlin Image */}
          <div className="md:w-1/3 flex-shrink-0 flex flex-col items-center justify-center relative">
            {/* Merlin Image with Sparkles */}
            <div className="relative">
              <img 
                src={merlinImage} 
                alt="Merlin" 
                className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shadow-xl"
              />
              {/* Animated Sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 right-2 w-4 h-4 text-purple-400 animate-pulse" />
                <Sparkles className="absolute bottom-4 left-4 w-3 h-3 text-amber-400 animate-pulse delay-300" />
                <Sparkles className="absolute top-1/2 right-1 w-2 h-2 text-cyan-400 animate-pulse delay-500" />
              </div>
            </div>
            
            {/* Merlin's Message */}
            <div className="mt-6 p-4 bg-purple-500/20 rounded-xl border border-purple-500/30 w-full">
              <div className="flex items-start gap-2">
                <span className="text-2xl">💬</span>
                <p className="text-white/90 text-sm leading-relaxed">
                  {getMerlinMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Opportunities */}
          <div className="md:w-2/3 flex-shrink-0 space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">Energy Opportunities</h2>
              <p className="text-purple-300 text-sm">{industryName} in {state}</p>
            </div>

            {/* Battery Storage - Always Included */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Battery className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Battery Storage</h3>
                    <p className="text-white/60 text-sm">Foundation of your energy system</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/50">
                  INCLUDED
                </span>
              </div>
            </div>

            {/* Solar Power */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-white/10 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-12 h-12 bg-gradient-to-br ${
                    solarData.rating === 'excellent' ? 'from-amber-500 to-orange-600' :
                    solarData.rating === 'good' ? 'from-blue-500 to-cyan-600' :
                    'from-amber-500 to-orange-600'
                  } rounded-xl flex items-center justify-center`}>
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Solar Power</h3>
                    <p className="text-white/60 text-sm">{solarData.sunHours} sun hours/day</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    solarData.rating === 'excellent' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : solarData.rating === 'good'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  }`}>
                    {getSolarRating()}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle('wantsSolar')}
                  className={`ml-4 flex-shrink-0 w-14 h-8 rounded-full flex items-center transition-all ${
                    preferences.wantsSolar 
                      ? 'bg-purple-500 justify-end' 
                      : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md mx-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Generator */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-white/10 hover:border-red-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Generator</h3>
                    <p className="text-white/60 text-sm">
                      {needsBackup ? 'Recommended for your grid situation' : 'Backup power optional'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-sm font-medium border border-slate-500/50">
                    {needsBackup ? 'Recommended' : 'Optional'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle('wantsGenerator')}
                  className={`ml-4 flex-shrink-0 w-14 h-8 rounded-full flex items-center transition-all ${
                    preferences.wantsGenerator 
                      ? 'bg-purple-500 justify-end' 
                      : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md mx-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* EV Charging */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">EV Charging</h3>
                    <p className="text-white/60 text-sm">{evData.adoptionRate}% EV adoption</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    evData.rating === 'high' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                  }`}>
                    {getEVRating()}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle('wantsEV')}
                  className={`ml-4 flex-shrink-0 w-14 h-8 rounded-full flex items-center transition-all ${
                    preferences.wantsEV 
                      ? 'bg-purple-500 justify-end' 
                      : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md mx-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="mt-4 p-3 bg-slate-800/40 rounded-lg border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-xs">✅ Your Selection:</span>
                <span className="text-white/70 text-xs font-medium">
                  BESS{preferences.wantsSolar ? ' + Solar' : ''}{preferences.wantsGenerator ? ' + Generator' : ''}{preferences.wantsEV ? ' + EV' : ''}
                  {selectedCount === 0 ? ' (BESS only)' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative border-t border-purple-500/20 px-6 py-4 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all text-sm"
          >
            Skip for now
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all text-sm flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            Continue with Merlin's Guidance
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Re-export for backwards compatibility
export { MerlinInsightModal as OpportunityDiscoveryModal };
export type { MerlinInsightModalProps as OpportunityDiscoveryModalProps };

export default MerlinInsightModal;
