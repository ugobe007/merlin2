// src/components/wizard/v6/advisor/PowerGaugeWidget.tsx

import React from 'react';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PowerGaugeWidgetProps {
  /** Battery power rating (kW) */
  batteryKW?: number;
  /** Peak load demand (kW) */
  peakLoadKW?: number;
  /** Compact mode (smaller) */
  compact?: boolean;
}

/**
 * Power Gauge Widget - Speedometer/Odometer Style
 * Visual gauge that fills from red (0%) → yellow (50%) → green (100%)
 * Shows how well BESS sizing meets facility power needs
 */
export function PowerGaugeWidget({ batteryKW = 0, peakLoadKW = 0, compact = false }: PowerGaugeWidgetProps) {
  // Placeholder mode: Show "Analyzing..." when no real data (Step 1-2)
  const isPlaceholder = batteryKW === 0 && peakLoadKW > 0;
  
  // Calculate coverage percentage (0-100)
  const coveragePercent = peakLoadKW > 0 ? Math.min((batteryKW / peakLoadKW) * 100, 100) : 0;
  
  // Determine status and color
  const getStatusConfig = (percent: number) => {
    if (isPlaceholder) return {
      status: 'Analyzing',
      color: '#6366f1',
      icon: Zap,
      textColor: 'text-indigo-400',
      message: 'Complete facility details to see coverage'
    };
    if (percent >= 90) return { 
      status: 'Optimal', 
      color: '#10b981', 
      icon: CheckCircle,
      textColor: 'text-emerald-400',
      message: 'Full coverage'
    };
    if (percent >= 70) return { 
      status: 'Adequate', 
      color: '#f59e0b', 
      icon: Zap,
      textColor: 'text-amber-400',
      message: 'Partial coverage'
    };
    return { 
      status: 'Undersized', 
      color: '#ef4444', 
      icon: AlertTriangle,
      textColor: 'text-red-400',
      message: 'Needs more power'
    };
  };

  const config = getStatusConfig(coveragePercent);
  const Icon = config.icon;

  // Gauge SVG parameters
  const size = compact ? 140 : 180;
  const strokeWidth = compact ? 16 : 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const dashArray = `${circumference} ${circumference}`;
  
  // Calculate fill offset (0% = all red, 100% = all green)
  const fillPercent = Math.max(0, Math.min(100, coveragePercent));
  const dashOffset = circumference - (fillPercent / 100) * circumference;

  // Color gradient based on percentage
  const getGaugeColor = (percent: number) => {
    if (isPlaceholder) return '#6366f1'; // Indigo for "Analyzing..."
    if (percent >= 90) return '#10b981'; // Green
    if (percent >= 70) return '#f59e0b'; // Amber
    if (percent >= 40) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  };

  const gaugeColor = getGaugeColor(fillPercent);

  return (
    <div className="group relative rounded-xl border border-indigo-500/30 bg-gradient-to-br from-slate-800/70 to-indigo-950/50 p-4 hover:border-indigo-400/50 transition-all cursor-help">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <span className="text-xs font-bold text-white uppercase tracking-wide">Power Gauge</span>
        </div>
      </div>

      {/* Speedometer Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          <svg 
            width={size} 
            height={size / 2 + 20} 
            viewBox={`0 0 ${size} ${size / 2 + 20}`}
            className="transform"
          >
            {/* Background track (gray) */}
            <path
              d={`M ${strokeWidth / 2},${size / 2} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${size / 2}`}
              fill="none"
              stroke="rgba(100, 116, 139, 0.3)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Filled progress (red → yellow → green) */}
            <path
              d={`M ${strokeWidth / 2},${size / 2} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${size / 2}`}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${gaugeColor})`,
              }}
            />

            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const angle = Math.PI * (tick / 100);
              const x1 = size / 2 - Math.cos(angle) * (radius - strokeWidth / 2 - 5);
              const y1 = size / 2 - Math.sin(angle) * (radius - strokeWidth / 2 - 5);
              const x2 = size / 2 - Math.cos(angle) * (radius - strokeWidth / 2 - 12);
              const y2 = size / 2 - Math.sin(angle) * (radius - strokeWidth / 2 - 12);
              
              return (
                <line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Center percentage text */}
            <text
              x={size / 2}
              y={size / 2 - 10}
              textAnchor="middle"
              fill="white"
              fontSize={compact ? "24" : "32"}
              fontWeight="bold"
              className="font-mono"
            >
              {isPlaceholder ? '—' : `${Math.round(fillPercent)}%`}
            </text>
            
            {/* Status label */}
            <text
              x={size / 2}
              y={size / 2 + 15}
              textAnchor="middle"
              fill={gaugeColor}
              fontSize={compact ? "10" : "12"}
              fontWeight="600"
              className="uppercase tracking-wider"
            >
              {config.status}
            </text>
          </svg>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between w-full mt-3 text-xs">
          <div className="text-slate-400">
            <div className="text-[10px] text-slate-500 uppercase">BESS</div>
            <div className="font-semibold">{batteryKW > 0 ? `${Math.round(batteryKW)} kW` : '—'}</div>
          </div>
          <div className="text-slate-400 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Peak Load</div>
            <div className="font-semibold">{peakLoadKW > 0 ? `${Math.round(peakLoadKW)} kW` : '—'}</div>
          </div>
        </div>

        {/* Message */}
        <div className={`mt-2 text-xs ${config.textColor} font-medium text-center`}>
          {config.message}
        </div>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
        <div className="text-xs font-bold text-white mb-1">Power Adequacy Gauge</div>
        <div className="text-xs text-slate-300 leading-relaxed">
          {isPlaceholder && (
            <>This gauge will show how well your BESS covers facility peak demand. Complete Step 3 (Facility Details) to see your power coverage analysis.</>
          )}
          {!isPlaceholder && coveragePercent >= 90 && (
            <>Your BESS ({Math.round(batteryKW)} kW) fully meets peak demand ({Math.round(peakLoadKW)} kW). System can handle peak loads during outages.</>
          )}
          {!isPlaceholder && coveragePercent >= 70 && coveragePercent < 90 && (
            <>Your BESS covers {Math.round(coveragePercent)}% of peak demand. Consider adding {Math.round(peakLoadKW - batteryKW)} kW for full coverage.</>
          )}
          {!isPlaceholder && coveragePercent < 70 && (
            <>Your BESS is undersized for peak demand. Add {Math.round(peakLoadKW - batteryKW)} kW to support critical loads during grid outages.</>
          )}
        </div>
        <div className="mt-2 text-[10px] text-indigo-400">
          ℹ️ Gauge shows BESS inverter power vs facility peak demand
        </div>
      </div>
    </div>
  );
}
