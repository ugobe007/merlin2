/**
 * ENERGY METRICS HEADER - Persistent Location Intelligence
 * =========================================================
 * 
 * Displays key energy opportunity metrics throughout the wizard:
 * - Utility Rate ($/kWh)
 * - Demand Charge ($/kW)
 * - Solar Potential (rating + hrs/day)
 * - TOU Arbitrage availability
 * 
 * DESIGN: Compact horizontal bar that fits in expanded header
 * POSITION: Below main header, above wizard content
 * PERSISTENCE: Visible on all 6 steps after Step 1 completes
 */

import React from 'react';
import { Zap, DollarSign, Sun, TrendingUp } from 'lucide-react';

export interface EnergyMetrics {
  utilityRate: number;        // $/kWh
  demandCharge: number;        // $/kW
  solarRating: string;         // 'A', 'B', 'C', 'D', 'F'
  solarHours: number;          // hrs/day
  hasTOU: boolean;             // Time-of-use rates available
  utilityName?: string;        // Utility company name
  location: string;            // "San Francisco, CA"
}

interface EnergyMetricsHeaderProps {
  metrics: EnergyMetrics | null;
}

export function EnergyMetricsHeader({ metrics }: EnergyMetricsHeaderProps) {
  if (!metrics) return null;

  // Calculate opportunity scores
  const rateScore = metrics.utilityRate > 0.18 ? 'high' : metrics.utilityRate > 0.12 ? 'good' : 'moderate';
  const demandScore = metrics.demandCharge > 20 ? 'high' : metrics.demandCharge > 12 ? 'good' : 'moderate';
  const solarScore = metrics.solarRating === 'A' || metrics.solarRating === 'B' ? 'excellent' : 'good';

  return (
    <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* LEFT: Location Label */}
          <div className="text-sm text-slate-400 flex items-center gap-2 min-w-[140px]">
            <span className="font-semibold text-violet-400">⚡ Energy Profile:</span>
            <span className="text-white font-medium">{metrics.location}</span>
          </div>

          {/* CENTER: Metrics Grid */}
          <div className="flex items-center gap-3 flex-1 justify-center flex-wrap">
            {/* Utility Rate */}
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/40">
              <Zap className={`w-4 h-4 ${
                rateScore === 'high' ? 'text-violet-400' : 
                rateScore === 'good' ? 'text-blue-400' : 
                'text-slate-400'
              }`} />
              <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-sm">
                  ${metrics.utilityRate.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">/kWh</span>
              </div>
              {rateScore === 'high' && (
                <span className="text-xs text-violet-300 ml-1">⚡</span>
              )}
            </div>

            {/* Demand Charge */}
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/40">
              <DollarSign className={`w-4 h-4 ${
                demandScore === 'high' ? 'text-violet-400' : 
                demandScore === 'good' ? 'text-blue-400' : 
                'text-slate-400'
              }`} />
              <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-sm">
                  ${metrics.demandCharge}
                </span>
                <span className="text-xs text-slate-400">/kW</span>
              </div>
              {demandScore === 'high' && (
                <span className="text-xs text-violet-300 ml-1">⚡</span>
              )}
            </div>

            {/* Solar Potential */}
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/40">
              <Sun className={`w-4 h-4 ${
                solarScore === 'excellent' ? 'text-amber-400' : 'text-yellow-500'
              }`} />
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-sm">
                  {metrics.solarRating}
                </span>
                <span className="text-xs text-slate-400">
                  ({metrics.solarHours.toFixed(1)} hrs)
                </span>
              </div>
            </div>

            {/* TOU Arbitrage */}
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/40">
              <TrendingUp className={`w-4 h-4 ${
                metrics.hasTOU ? 'text-emerald-400' : 'text-slate-500'
              }`} />
              <span className={`text-sm font-medium ${
                metrics.hasTOU ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {metrics.hasTOU ? 'TOU Available' : 'No TOU'}
              </span>
            </div>
          </div>

          {/* RIGHT: Overall Indicator */}
          <div className="min-w-[100px] text-right">
            {(() => {
              const overallScore = 
                (rateScore === 'high' ? 3 : rateScore === 'good' ? 2 : 1) +
                (demandScore === 'high' ? 3 : demandScore === 'good' ? 2 : 1) +
                (solarScore === 'excellent' ? 3 : 2) +
                (metrics.hasTOU ? 2 : 0);
              
              const label = overallScore >= 9 ? 'Excellent' : overallScore >= 6 ? 'Good' : 'Fair';
              const color = overallScore >= 9 ? 'emerald' : overallScore >= 6 ? 'blue' : 'slate';
              
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs text-slate-400">Opportunity:</span>
                  <span className={`text-sm font-bold text-${color}-400`}>
                    {label}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
