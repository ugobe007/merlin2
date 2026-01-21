// src/components/wizard/v6/advisor/SolarOpportunityWidget.tsx

import React from 'react';
import { Sun } from 'lucide-react';

interface SolarOpportunityWidgetProps {
  /** State/location for solar irradiance data */
  state: string;
  /** Peak sun hours (from context) */
  sunHours?: number;
}

// Solar rating based on peak sun hours
function getSolarRating(sunHours: number): { 
  rating: 'Excellent' | 'Good' | 'Fair' | 'Moderate'; 
  color: string;
  stars: number;
} {
  if (sunHours >= 6.0) return { rating: 'Excellent', color: 'text-emerald-400', stars: 5 };
  if (sunHours >= 5.0) return { rating: 'Good', color: 'text-cyan-400', stars: 4 };
  if (sunHours >= 4.0) return { rating: 'Fair', color: 'text-amber-400', stars: 3 };
  return { rating: 'Moderate', color: 'text-orange-400', stars: 2 };
}

/**
 * Solar Opportunity Widget - Compact
 * Shows solar potential with sun icons based on location
 * Tooltip explains: "Your location receives X hrs/day peak sun - excellent for solar"
 */
export function SolarOpportunityWidget({ state, sunHours = 5.0 }: SolarOpportunityWidgetProps) {
  const { rating, color, stars } = getSolarRating(sunHours);
  
  return (
    <div className="group relative rounded-lg border border-amber-500/30 bg-gradient-to-br from-slate-800/70 to-amber-950/50 p-3 hover:border-amber-400/50 transition-all cursor-help">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-violet-300/70 font-semibold uppercase tracking-wide">Solar Opportunity</span>
        </div>
      </div>

      {/* Sun Icons Row */}
      <div className="flex items-center gap-1 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Sun 
            key={i} 
            className={`w-4 h-4 ${i < stars ? 'text-amber-400 fill-amber-400/30' : 'text-slate-600'}`}
          />
        ))}
      </div>

      {/* Rating */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${color}`}>{rating}</span>
        <span className="text-xs text-slate-400">{state}</span>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-slate-900 border border-amber-500/30 shadow-xl z-50">
        <div className="text-xs font-bold text-white mb-1">Solar Potential</div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong>{state}</strong> receives <strong>{sunHours.toFixed(1)} hrs/day</strong> peak sun. 
          {stars >= 4 ? ' Excellent location for solar PV systems.' : ' Good conditions for solar energy.'}
        </div>
        <div className="mt-2 text-[10px] text-amber-400">
          ℹ️ Based on annual average solar irradiance
        </div>
      </div>
    </div>
  );
}
