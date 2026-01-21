// src/components/wizard/v6/advisor/PowerCoverageWidget.tsx

import React from 'react';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PowerCoverageWidgetProps {
  /** Battery power rating (kW) */
  batteryKW?: number;
  /** Peak load demand (kW) */
  peakLoadKW?: number;
}

/**
 * Power Coverage Widget
 * Shows how well the BESS sizing meets power needs
 * Red (undersized) → Yellow (adequate) → Green (optimal)
 * Tooltip explains: "Your BESS covers 87% of peak demand - add 150 kW for full coverage"
 */
export function PowerCoverageWidget({ batteryKW = 0, peakLoadKW = 0 }: PowerCoverageWidgetProps) {
  // Calculate coverage percentage
  const coveragePercent = peakLoadKW > 0 ? Math.min((batteryKW / peakLoadKW) * 100, 100) : 0;
  
  // Determine status
  const status = coveragePercent >= 90 ? 'optimal' : coveragePercent >= 70 ? 'adequate' : 'undersized';
  
  // Color coding
  const colors = {
    optimal: {
      bg: 'from-emerald-500/20 to-emerald-600/10',
      bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      text: 'text-emerald-400',
      icon: CheckCircle,
      border: 'border-emerald-500/30'
    },
    adequate: {
      bg: 'from-amber-500/20 to-amber-600/10',
      bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
      text: 'text-amber-400',
      icon: Zap,
      border: 'border-amber-500/30'
    },
    undersized: {
      bg: 'from-red-500/20 to-red-600/10',
      bar: 'bg-gradient-to-r from-red-500 to-red-400',
      text: 'text-red-400',
      icon: AlertTriangle,
      border: 'border-red-500/30'
    }
  };
  
  const config = colors[status];
  const Icon = config.icon;
  
  // Calculate shortfall
  const shortfallKW = peakLoadKW > batteryKW ? peakLoadKW - batteryKW : 0;
  
  return (
    <div className={`group relative rounded-lg border ${config.border} bg-gradient-to-br ${config.bg} p-3 hover:border-opacity-70 transition-all cursor-help`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${config.text}`} />
          <span className="text-[10px] text-violet-300/70 font-semibold uppercase tracking-wide">Power Coverage</span>
        </div>
        <span className={`text-xs font-bold ${config.text}`}>{Math.round(coveragePercent)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800/60 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full ${config.bar} transition-all duration-700 ease-out`}
          style={{ width: `${coveragePercent}%` }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {batteryKW > 0 ? `${Math.round(batteryKW)} kW BESS` : 'Not configured'}
        </span>
        <span className="text-slate-500">
          {peakLoadKW > 0 ? `${Math.round(peakLoadKW)} kW peak` : '—'}
        </span>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 p-3 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
        <div className="text-xs font-bold text-white mb-1">
          {status === 'optimal' ? '✓ Optimal Coverage' : status === 'adequate' ? '⚠️ Adequate Coverage' : '❌ Undersized'}
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          {status === 'optimal' && (
            <>Your BESS ({Math.round(batteryKW)} kW) fully covers peak demand ({Math.round(peakLoadKW)} kW). You can handle peak loads during outages or peak shaving.</>
          )}
          {status === 'adequate' && (
            <>Your BESS covers <strong>{Math.round(coveragePercent)}%</strong> of peak demand. Consider adding <strong>{Math.round(shortfallKW)} kW</strong> for full coverage during outages.</>
          )}
          {status === 'undersized' && (
            <>Your BESS is undersized for peak demand. Add <strong>{Math.round(shortfallKW)} kW</strong> to support critical loads during grid outages.</>
          )}
        </div>
        <div className="mt-2 text-[10px] text-violet-400">
          ℹ️ Based on BESS inverter power vs facility peak demand
        </div>
      </div>
    </div>
  );
}
