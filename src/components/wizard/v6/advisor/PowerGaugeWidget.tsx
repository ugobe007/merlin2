// src/components/wizard/v6/advisor/PowerGaugeWidget.tsx

import React from "react";
import { Zap } from "lucide-react";

interface PowerGaugeWidgetProps {
  /** Battery power rating (kW) */
  batteryKW?: number;
  /** Peak load demand (kW) */
  peakLoadKW?: number;
  /** Compact mode (smaller) */
  compact?: boolean;
}

/**
 * Power Gauge Widget - Shows Total Facility Energy Needs
 * Displays peak demand (kW) as the primary metric
 * Visual gauge fills as model confidence improves
 */
export function PowerGaugeWidget({
  batteryKW = 0,
  peakLoadKW = 0,
  compact = false,
}: PowerGaugeWidgetProps) {
  // Placeholder mode: Show "Analyzing..." when no real data (Step 1-2)
  const isPlaceholder = peakLoadKW === 0 || peakLoadKW < 10;

  // Use peak load as the primary value to display (guard against NaN/undefined)
  const displayValue = Number.isFinite(peakLoadKW) ? peakLoadKW : 0;

  // Gauge fill based on peak load magnitude (visual feedback)
  // Small facilities: 0-100 kW, Medium: 100-500 kW, Large: 500+ kW
  const getFillPercent = (peakKW: number) => {
    if (!Number.isFinite(peakKW) || peakKW === 0) return 0;
    if (peakKW < 100) return 30 + (peakKW / 100) * 30; // 30-60%
    if (peakKW < 500) return 60 + ((peakKW - 100) / 400) * 30; // 60-90%
    return 90 + Math.min(((peakKW - 500) / 500) * 10, 10); // 90-100%
  };

  const fillPercent = getFillPercent(displayValue) || 0; // Ensure never NaN

  // Determine status and color based on facility size
  const getStatusConfig = (peakKW: number) => {
    if (isPlaceholder)
      return {
        status: "Analyzing",
        color: "#6366f1",
        icon: Zap,
        textColor: "text-indigo-400",
        message: "Complete facility details",
      };
    if (peakKW >= 500)
      return {
        status: "Large",
        color: "#ef4444",
        icon: Zap,
        textColor: "text-red-400",
        message: "Industrial scale",
      };
    if (peakKW >= 100)
      return {
        status: "Medium",
        color: "#f59e0b",
        icon: Zap,
        textColor: "text-amber-400",
        message: "Commercial scale",
      };
    return {
      status: "Small",
      color: "#10b981",
      icon: Zap,
      textColor: "text-emerald-400",
      message: "Small commercial",
    };
  };

  const config = getStatusConfig(displayValue);
  const Icon = config.icon;

  // Gauge SVG parameters
  const size = compact ? 140 : 180;
  const strokeWidth = compact ? 16 : 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const dashArray = `${circumference} ${circumference}`;

  // Calculate fill offset using fillPercent from earlier
  const dashOffset = circumference - (fillPercent / 100) * circumference;

  // Color gradient based on facility size
  const getGaugeColor = (peakKW: number) => {
    if (isPlaceholder) return "#6366f1"; // Indigo for "Analyzing..."
    if (peakKW >= 500) return "#ef4444"; // Red - Large
    if (peakKW >= 100) return "#f59e0b"; // Amber - Medium
    return "#10b981"; // Green - Small
  };

  const gaugeColor = getGaugeColor(displayValue);

  // COMPACT MODE: Inline mini gauge for header
  if (compact) {
    return (
      <div className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-slate-800/50 hover:border-indigo-400/50 transition-all cursor-help">
        {/* Mini semicircle gauge */}
        <div className="relative" style={{ width: 48, height: 28 }}>
          <svg width={48} height={28} viewBox="0 0 48 28">
            {/* Background track */}
            <path
              d="M 4,24 A 20,20 0 0,1 44,24"
              fill="none"
              stroke="rgba(100, 116, 139, 0.3)"
              strokeWidth={6}
              strokeLinecap="round"
            />
            {/* Filled progress */}
            <path
              d="M 4,24 A 20,20 0 0,1 44,24"
              fill="none"
              stroke={gaugeColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={`${Math.PI * 20} ${Math.PI * 20}`}
              strokeDashoffset={Math.PI * 20 - (fillPercent / 100) * Math.PI * 20}
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 4px ${gaugeColor})` }}
            />
          </svg>
        </div>

        {/* Peak Load Value + Status */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white leading-none">
            {isPlaceholder ? "—" : `${Math.round(displayValue)}`}
          </span>
          <span className={`text-[9px] font-semibold uppercase ${config.textColor} leading-tight`}>
            {isPlaceholder ? "kW" : config.status}
          </span>
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2.5 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
          <div className="text-[10px] font-bold text-white mb-1">Peak Demand</div>
          <div className="text-[10px] text-slate-300">
            {isPlaceholder ? (
              <>Complete facility details to calculate peak demand.</>
            ) : (
              <>
                Your facility's peak demand: {Math.round(peakLoadKW)} kW. BESS recommended:{" "}
                {Math.round(batteryKW)} kW.
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // FULL MODE: Large gauge for panels
  return (
    <div className="group relative rounded-xl border border-indigo-500/30 bg-gradient-to-br from-slate-800/70 to-indigo-950/50 p-4 hover:border-indigo-400/50 transition-all cursor-help">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <span className="text-xs font-bold text-white uppercase tracking-wide">Peak Demand</span>
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

            {/* Center value - Peak Load in kW */}
            <text
              x={size / 2}
              y={size / 2 - 10}
              textAnchor="middle"
              fill="white"
              fontSize={compact ? "24" : "32"}
              fontWeight="bold"
              className="font-mono"
            >
              {isPlaceholder ? "—" : `${Math.round(displayValue)}`}
            </text>

            {/* Units label */}
            <text
              x={size / 2}
              y={size / 2 + 15}
              textAnchor="middle"
              fill={gaugeColor}
              fontSize={compact ? "10" : "12"}
              fontWeight="600"
              className="uppercase tracking-wider"
            >
              {isPlaceholder ? "kW" : "kW Peak"}
            </text>
          </svg>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between w-full mt-3 text-xs">
          <div className="text-slate-400">
            <div className="text-[10px] text-slate-500 uppercase">Facility Size</div>
            <div className="font-semibold">{config.status}</div>
          </div>
          <div className="text-slate-400 text-right">
            <div className="text-[10px] text-slate-500 uppercase">BESS Rec.</div>
            <div className="font-semibold">
              {batteryKW > 0 ? `${Math.round(batteryKW)} kW` : "—"}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className={`mt-2 text-xs ${config.textColor} font-medium text-center`}>
          {isPlaceholder ? "Complete Step 3" : `${config.message} facility`}
        </div>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
        <div className="text-xs font-bold text-white mb-1">Peak Demand Meter</div>
        <div className="text-xs text-slate-300 leading-relaxed">
          {isPlaceholder && (
            <>
              This shows your facility's total energy needs. Complete Step 3 (Facility Details) to
              calculate peak demand.
            </>
          )}
          {!isPlaceholder && (
            <>
              Your facility's peak demand is {Math.round(peakLoadKW)} kW. We recommend{" "}
              {Math.round(batteryKW)} kW BESS capacity (40% of peak for optimal peak shaving).
            </>
          )}
        </div>
        <div className="mt-2 text-[10px] text-indigo-400">
          ℹ️ Gauge shows total facility power needs, not just battery size
        </div>
      </div>
    </div>
  );
}
