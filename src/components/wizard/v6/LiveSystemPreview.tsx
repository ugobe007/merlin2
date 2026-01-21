/**
 * LiveSystemPreview Component
 * ============================
 * Real-time BESS sizing recommendation that updates as the user
 * answers micro-prompts in Step 3.
 *
 * Shows:
 * - Recommended power (kW) with min/max bands
 * - Recommended energy (kWh) with min/max bands
 * - Duration (hours)
 * - Confidence indicator
 * - Notes from the sizing engine
 * - "Customize" button to open SystemSizingModal
 *
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

import React from "react";
import { Battery, Zap, Clock, Info, Sparkles, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrueQuoteSizing } from "@/services/truequote";
import { getSizingBandDescription, shouldShowEstimate } from "@/services/truequote";
import type { SizingOverrides } from "@/types/wizardState";

interface LiveSystemPreviewProps {
  sizing: TrueQuoteSizing | null;
  /** Current overrides if user has customized */
  overrides?: SizingOverrides;
  /** Callback when user wants to customize sizing */
  onCustomize?: () => void;
  /** Model confidence from TrueQuote (single source of truth) */
  modelConfidence?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Format number with k/M suffix for readability
 */
function formatValue(value: number, unit: string): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${unit}`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k ${unit}`;
  }
  return `${value.toFixed(0)} ${unit}`;
}

/**
 * Format range with uncertainty marker
 */
function formatRange(
  min: number,
  max: number,
  best: number,
  unit: string,
  showEstimate: boolean
): React.ReactNode {
  const prefix = showEstimate ? "≈ " : "";
  const suffix = showEstimate ? " est." : "";

  if (min === max || Math.abs(max - min) < min * 0.05) {
    // Range is too narrow, just show best
    return (
      <span>
        {prefix}
        {formatValue(best, unit)}
        {suffix}
      </span>
    );
  }

  return (
    <span className="flex flex-col">
      <span className="text-lg font-semibold">
        {prefix}
        {formatValue(best, unit)}
        {suffix}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatValue(min, "")} – {formatValue(max, unit)}
      </span>
    </span>
  );
}

export function LiveSystemPreview({
  sizing,
  overrides,
  onCustomize,
  modelConfidence,
  className,
  compact = false,
}: LiveSystemPreviewProps) {
  if (!sizing) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-muted-foreground/30 p-4",
          "flex items-center justify-center text-muted-foreground",
          className
        )}
      >
        <Info className="h-4 w-4 mr-2" />
        <span className="text-sm">Answer questions above to see sizing recommendations</span>
      </div>
    );
  }

  const { recommended, goalsBreakdown, constraints: _constraints, confidence: sizingConfidence, notes } = sizing;
  
  // Use modelConfidence (from TrueQuote SSOT) if provided, otherwise fallback to sizing confidence
  const confidence = modelConfidence ?? sizingConfidence;
  const showEstimate = shouldShowEstimate(confidence);
  const _bandDescription = getSizingBandDescription(confidence);

  // Check if user has overridden the Merlin recommendation
  const hasOverride = overrides && (overrides.batteryKW || overrides.backupHours);

  // Get effective values (override or Merlin)
  const effectivePowerKW = overrides?.batteryKW ?? recommended.powerKW.best;
  const effectiveHours = overrides?.backupHours ?? recommended.durationHours.best;
  const effectiveEnergyKWh = overrides?.batteryKWh ?? recommended.energyKWh.best;

  // Determine confidence color - subtle, not alarming
  const confidenceColor =
    confidence >= 75 ? "text-emerald-600" : confidence >= 60 ? "text-blue-600" : "text-muted-foreground";

  // All backgrounds are subtle - no warning colors
  const confidenceBg = "bg-muted/30 border-border";

  if (compact) {
    // Compact version for sidebar
    return (
      <div className={cn("rounded-lg border p-3", confidenceBg, className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Recommended System</span>
          <span className={cn("text-xs font-medium", confidenceColor)}>
            {confidence}% confident
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Power</div>
            <div className="text-sm font-semibold">
              {showEstimate && "≈"}
              {formatValue(recommended.powerKW.best, "kW")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Energy</div>
            <div className="text-sm font-semibold">
              {showEstimate && "≈"}
              {formatValue(recommended.energyKWh.best, "kWh")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-semibold">{recommended.durationHours.best}h</div>
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header - clean, no duplicate confidence (shown in Merlin panel) */}
      <div className={cn("px-4 py-3 border-b flex items-center justify-between", confidenceBg)}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {hasOverride ? "Your System" : "Recommended System"}
          </span>
          {hasOverride && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              Customized
            </span>
          )}
        </div>
        {onCustomize && (
          <button
            onClick={onCustomize}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Customize
          </button>
        )}
      </div>

      {/* Main metrics */}
      <div className="p-4 grid grid-cols-3 gap-4">
        {/* Power */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Power</span>
          </div>
          <div className="text-lg font-semibold">
            {hasOverride ? (
              <span>{formatValue(effectivePowerKW, "kW")}</span>
            ) : (
              formatRange(
                recommended.powerKW.min,
                recommended.powerKW.max,
                recommended.powerKW.best,
                "kW",
                showEstimate
              )
            )}
          </div>
        </div>

        {/* Energy */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Battery className="h-4 w-4" />
            <span className="text-sm">Energy</span>
          </div>
          <div className="text-lg font-semibold">
            {hasOverride ? (
              <span>{formatValue(effectiveEnergyKWh, "kWh")}</span>
            ) : (
              formatRange(
                recommended.energyKWh.min,
                recommended.energyKWh.max,
                recommended.energyKWh.best,
                "kWh",
                showEstimate
              )
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Duration</span>
          </div>
          <div className="text-lg font-semibold">
            {hasOverride ? `${effectiveHours} hours` : `${recommended.durationHours.best} hours`}
          </div>
        </div>
      </div>

      {/* Goals breakdown */}
      {(goalsBreakdown.peakShavingValue > 0 || goalsBreakdown.backupCoverageHours > 0) && (
        <div className="px-4 pb-3 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Goals Coverage</div>
          <div className="flex gap-4">
            {goalsBreakdown.peakShavingValue > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>
                  Peak shaving: {(goalsBreakdown.peakShavingValue * 100).toFixed(0)}% reduction
                </span>
              </div>
            )}
            {goalsBreakdown.backupCoverageHours > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Backup: {goalsBreakdown.backupCoverageHours}h coverage</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Constraints/notes */}
      {notes.length > 0 && (
        <div className="px-4 pb-3 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Merlin learned
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {notes.slice(0, 3).map((note, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-primary">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Low confidence tip - subtle guidance, not a warning */}
      {confidence < 60 && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
            <span>
              <span className="font-medium text-foreground/80">Tip:</span> Answer more questions to narrow these estimates.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveSystemPreview;
