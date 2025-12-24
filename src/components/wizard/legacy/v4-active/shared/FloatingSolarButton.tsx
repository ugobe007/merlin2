/**
 * FLOATING SOLAR BUTTON - Lights up when solar opportunity detected
 * ===============================================================
 * 
 * December 16, 2025
 * 
 * A floating button that appears on the side of input fields and lights up
 * when there's a solar opportunity based on location/state.
 * 
 * Features:
 * - Only shows when solar opportunity exists (peak sun hours > 4.0)
 * - Glowing/pulsing animation when active
 * - Opens SolarOpportunityModal on click
 * - Positioned to the side of input fields
 */

import React, { useMemo } from 'react';
import { SunMedium, Sparkles } from 'lucide-react';
import { getPeakSunHours } from '@/services/solarSizingService';
import type { WizardState } from '../types/wizardTypes';

export interface FloatingSolarButtonProps {
  wizardState: WizardState;
  onOpen: () => void;
  position?: 'left' | 'right';
}

export function FloatingSolarButton({
  wizardState,
  onOpen,
  position = 'right',
}: FloatingSolarButtonProps) {
  // Calculate solar opportunity
  const solarOpportunity = useMemo(() => {
    const location = wizardState.state || wizardState.zipCode || '';
    // Show button whenever location is set (solar is always worth exploring)
    const hasOpportunity = !!(wizardState.state || wizardState.zipCode);
    const peakSunHours = hasOpportunity ? getPeakSunHours(location) : 0;
    
    let rating: 'Excellent' | 'Very Good' | 'Good' | 'Moderate' = 'Moderate';
    let glowIntensity = 'opacity-70';
    
    if (peakSunHours >= 5.5) {
      rating = 'Excellent';
      glowIntensity = 'opacity-100';
    } else if (peakSunHours >= 4.5) {
      rating = 'Very Good';
      glowIntensity = 'opacity-90';
    } else if (peakSunHours >= 4.0) {
      rating = 'Good';
      glowIntensity = 'opacity-80';
    }
    
    return {
      hasOpportunity,
      peakSunHours,
      rating,
      glowIntensity,
      location,
    };
  }, [wizardState.state, wizardState.zipCode]);
  
  // Don't show if no opportunity
  if (!solarOpportunity.hasOpportunity) {
    return null;
  }
  
  // Calculate estimated savings potential (rough estimate: 1kW solar ≈ $200/year savings)
  const estimatedAnnualSavings = Math.round((solarOpportunity.peakSunHours / 4.5) * 200); // Scale based on peak sun hours
  
  // Generate Merlin suggestion based on rating
  const merlinSuggestion = useMemo(() => {
    if (solarOpportunity.peakSunHours >= 5.5) {
      return {
        message: "Excellent solar potential! Consider 100-200kW system for maximum savings.",
        icon: Sparkles,
        urgency: "high"
      };
    } else if (solarOpportunity.peakSunHours >= 4.5) {
      return {
        message: "Very good solar opportunity. A 50-100kW system could reduce your energy costs significantly.",
        icon: Sparkles,
        urgency: "medium"
      };
    } else if (solarOpportunity.peakSunHours >= 3.5) {
      return {
        message: "Good solar potential. Consider a smaller system (25-50kW) to offset peak demand charges.",
        icon: Sparkles,
        urgency: "medium"
      };
    } else {
      return {
        message: "Moderate solar potential. Still worth exploring for backup power and partial offset.",
        icon: Sparkles,
        urgency: "low"
      };
    }
  }, [solarOpportunity.peakSunHours]);
  
  const SuggestionIcon = merlinSuggestion.icon;
  
  return (
    <button
      onClick={onOpen}
      className="fixed left-6 top-[calc(50%-120px)] z-[60] group transition-all duration-300 hover:scale-105 active:scale-95"
      aria-label={`Solar tool - ${solarOpportunity.rating} potential, ${solarOpportunity.peakSunHours.toFixed(1)} peak sun hours`}
    >
      {/* Glowing yellow ring */}
      <div 
        className={`absolute bg-yellow-400 rounded-full blur-md ${solarOpportunity.glowIntensity} animate-pulse`}
        style={{ 
          width: '56px', 
          height: '56px', 
          top: '-4px',
          left: '-4px'
        }} 
      />
      
      {/* Solar tool button with icon */}
      <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-600 rounded-full shadow-lg border-2 border-yellow-300/60 backdrop-blur-sm transition-all duration-300 group-hover:border-yellow-200 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.8)] flex items-center justify-center">
        <SunMedium className="w-6 h-6 text-yellow-900 drop-shadow-sm" strokeWidth={2.5} style={{ animation: 'spin 20s linear infinite' }} />
      </div>
      
      {/* Enhanced Tooltip with Merlin suggestions and actionable info */}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-[280px] z-50">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border-2 border-yellow-400/30 backdrop-blur-lg">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-400/20">
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <SunMedium className="w-3 h-3 text-yellow-900" />
            </div>
            <div className="font-bold text-yellow-300">Solar Opportunity Tool</div>
          </div>
          
          {/* Stats */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Rating:</span>
              <span className="font-semibold text-yellow-300">{solarOpportunity.rating}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Peak Sun Hours:</span>
              <span className="font-semibold text-white">{solarOpportunity.peakSunHours.toFixed(1)}h/day</span>
            </div>
            {estimatedAnnualSavings > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Est. Savings:</span>
                <span className="font-semibold text-emerald-400">~${estimatedAnnualSavings.toLocaleString()}/year</span>
              </div>
            )}
          </div>
          
          {/* Merlin's Suggestion */}
          <div className="mt-2 pt-2 border-t border-yellow-400/20">
            <div className="flex items-start gap-2">
              <SuggestionIcon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-yellow-400/80 font-semibold mb-0.5">Merlin Suggests:</div>
                <div className="text-[11px] text-slate-200 leading-relaxed">
                  {merlinSuggestion.message}
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="mt-2 pt-2 border-t border-yellow-400/20">
            <div className="text-[11px] text-yellow-300 font-semibold text-center">
              Click to use sizing tools →
            </div>
          </div>
          
          {/* Arrow pointing left */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-full">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-slate-800" />
          </div>
        </div>
      </div>
    </button>
  );
}

