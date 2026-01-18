/**
 * GridStressIndicator Component
 *
 * Displays grid stress level for a location with confidence score.
 * Part of Vineet's "Site Intelligence Snapshot" automated outputs.
 *
 * Shows:
 * - Grid stress level: Low / Medium / High
 * - Confidence score: 0-100%
 * - Color-coded badge: green / yellow / red
 * - Brief explanation of what grid stress means
 *
 * Data source: Mock for now (TODO: integrate real grid API - EIA, FERC, ISO/RTO data)
 */

import React from "react";
import { Zap } from "lucide-react";

interface GridStressIndicatorProps {
  stressLevel: "low" | "medium" | "high";
  confidence: number; // 0-1 range
  className?: string;
}

export function GridStressIndicator({
  stressLevel,
  confidence,
  className = "",
}: GridStressIndicatorProps) {
  // Color and text mapping
  const stressConfig = {
    low: {
      color: "emerald",
      label: "Low Stress",
      description: "Grid is stable with minimal outage risk",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "border-emerald-400/30",
      textColor: "text-emerald-300",
      badgeBg: "bg-emerald-500/20",
      badgeBorder: "border-emerald-400/40",
      badgeText: "text-emerald-200",
      shadowColor: "shadow-emerald-500/15",
    },
    medium: {
      color: "amber",
      label: "Medium Stress",
      description: "Occasional outages during peak demand periods",
      bgGradient: "from-amber-500/10 to-amber-500/5",
      borderColor: "border-amber-400/30",
      textColor: "text-amber-300",
      badgeBg: "bg-amber-500/20",
      badgeBorder: "border-amber-400/40",
      badgeText: "text-amber-200",
      shadowColor: "shadow-amber-500/15",
    },
    high: {
      color: "red",
      label: "High Stress",
      description: "Frequent outages and congestion, BESS strongly recommended",
      bgGradient: "from-red-500/10 to-red-500/5",
      borderColor: "border-red-400/30",
      textColor: "text-red-300",
      badgeBg: "bg-red-500/20",
      badgeBorder: "border-red-400/40",
      badgeText: "text-red-200",
      shadowColor: "shadow-red-500/15",
    },
  };

  const config = stressConfig[stressLevel];
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div
      className={`mt-3 rounded-xl border ${config.borderColor} bg-gradient-to-br ${config.bgGradient} backdrop-blur-xl p-3.5 shadow-lg ${config.shadowColor} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`text-[11px] font-bold ${config.textColor} flex items-center gap-1.5`}>
          <Zap className="w-3.5 h-3.5" />
          <span>Grid Stress Index:</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Stress level badge */}
          <div
            className={`text-[9px] px-2 py-0.5 rounded ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} font-semibold`}
          >
            {config.label}
          </div>
          {/* Confidence score */}
          <div className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-200 border border-slate-400/20">
            {confidencePercent}% confidence
          </div>
        </div>
      </div>
      <div className={`text-[10px] ${config.textColor}/70 leading-relaxed`}>
        {config.description}
      </div>
    </div>
  );
}
