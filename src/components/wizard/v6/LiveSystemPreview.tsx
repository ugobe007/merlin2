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
 * 
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

import React from 'react';
import { Battery, Zap, Clock, Info, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrueQuoteSizing } from '@/services/truequote';
import { getSizingBandDescription, shouldShowEstimate } from '@/services/truequote';

interface LiveSystemPreviewProps {
  sizing: TrueQuoteSizing | null;
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
  const prefix = showEstimate ? '≈ ' : '';
  const suffix = showEstimate ? ' est.' : '';
  
  if (min === max || Math.abs(max - min) < min * 0.05) {
    // Range is too narrow, just show best
    return (
      <span>
        {prefix}{formatValue(best, unit)}{suffix}
      </span>
    );
  }
  
  return (
    <span className="flex flex-col">
      <span className="text-lg font-semibold">
        {prefix}{formatValue(best, unit)}{suffix}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatValue(min, '')} – {formatValue(max, unit)}
      </span>
    </span>
  );
}

export function LiveSystemPreview({ sizing, className, compact = false }: LiveSystemPreviewProps) {
  if (!sizing) {
    return (
      <div className={cn(
        'rounded-lg border border-dashed border-muted-foreground/30 p-4',
        'flex items-center justify-center text-muted-foreground',
        className
      )}>
        <Info className="h-4 w-4 mr-2" />
        <span className="text-sm">Answer questions above to see sizing recommendations</span>
      </div>
    );
  }
  
  const { recommended, goalsBreakdown, constraints, confidence, notes } = sizing;
  const showEstimate = shouldShowEstimate(confidence);
  const bandDescription = getSizingBandDescription(confidence);
  
  // Determine confidence color
  const confidenceColor = confidence >= 75 
    ? 'text-green-600' 
    : confidence >= 60 
      ? 'text-amber-600' 
      : 'text-orange-500';
  
  const confidenceBg = confidence >= 75 
    ? 'bg-green-50 border-green-200' 
    : confidence >= 60 
      ? 'bg-amber-50 border-amber-200' 
      : 'bg-orange-50 border-orange-200';
  
  if (compact) {
    // Compact version for sidebar
    return (
      <div className={cn('rounded-lg border p-3', confidenceBg, className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Recommended System
          </span>
          <span className={cn('text-xs font-medium', confidenceColor)}>
            {confidence}% confident
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Power</div>
            <div className="text-sm font-semibold">
              {showEstimate && '≈'}{formatValue(recommended.powerKW.best, 'kW')}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Energy</div>
            <div className="text-sm font-semibold">
              {showEstimate && '≈'}{formatValue(recommended.energyKWh.best, 'kWh')}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-semibold">
              {recommended.durationHours.best}h
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Full version
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className={cn('px-4 py-3 border-b flex items-center justify-between', confidenceBg)}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">Recommended System</span>
        </div>
        <div className={cn('text-sm font-medium', confidenceColor)}>
          {confidence}% confident • {bandDescription}
        </div>
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
            {formatRange(
              recommended.powerKW.min,
              recommended.powerKW.max,
              recommended.powerKW.best,
              'kW',
              showEstimate
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
            {formatRange(
              recommended.energyKWh.min,
              recommended.energyKWh.max,
              recommended.energyKWh.best,
              'kWh',
              showEstimate
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
            {recommended.durationHours.best} hours
          </div>
        </div>
      </div>
      
      {/* Goals breakdown */}
      {(goalsBreakdown.peakShavingValue > 0 || goalsBreakdown.backupCoverageHours > 0) && (
        <div className="px-4 pb-3 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Goals Coverage
          </div>
          <div className="flex gap-4">
            {goalsBreakdown.peakShavingValue > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Peak shaving: {(goalsBreakdown.peakShavingValue * 100).toFixed(0)}% reduction</span>
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
      
      {/* Low confidence warning */}
      {confidence < 60 && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-md p-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Answer more questions above to narrow these estimates. 
              Current range is ±{confidence < 45 ? '25' : '15'}% due to limited data.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveSystemPreview;
