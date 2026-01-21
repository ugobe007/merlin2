/**
 * TelemetryChip - Capital-Grade Instrument Panel Component
 * 
 * Unified chip system for displaying real-time metrics in a Bloomberg Terminal style.
 * All chips share: consistent height (32px), radius (8px), glow language, hover behavior.
 * 
 * Part of Merlin's "financial instrument" brand identity (Jan 20, 2026).
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TelemetryChipProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Primary value to display (e.g., "$0.12" or "5.3") */
  value: string;
  /** Unit label (e.g., "/kWh" or "hrs/day") */
  unit?: string;
  /** Optional label before value (e.g., "Storage:") */
  label?: string;
  /** Optional badge (e.g., "est." or "LIVE") */
  badge?: {
    text: string;
    variant: 'estimate' | 'live' | 'warning';
  };
  /** Icon color theme */
  iconColor?: 'cyan' | 'amber' | 'violet' | 'emerald' | 'indigo' | 'slate';
  /** Visual hierarchy: primary (brightest), secondary (dimmed), tertiary (most subdued) */
  hierarchy?: 'primary' | 'secondary' | 'tertiary';
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const iconColorClasses: Record<string, string> = {
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  indigo: 'text-indigo-400',
  slate: 'text-slate-400',
};

const badgeVariantClasses: Record<string, string> = {
  estimate: 'bg-indigo-500/20 text-indigo-300',
  live: 'bg-emerald-500/20 text-emerald-300',
  warning: 'bg-amber-500/20 text-amber-300',
};

/**
 * TelemetryChip - Unified metric display component
 * 
 * @example
 * ```tsx
 * <TelemetryChip
 *   icon={Zap}
 *   value="$0.12"
 *   unit="/kWh"
 *   iconColor="cyan"
 * />
 * 
 * <TelemetryChip
 *   icon={Sun}
 *   value="5.3"
 *   unit="hrs/day"
 *   iconColor="amber"
 * />
 * ```
 */
export const TelemetryChip: React.FC<TelemetryChipProps> = ({
  icon: Icon,
  value,
  unit,
  label,
  badge,
  iconColor = 'slate',
  hierarchy = 'primary',
  onClick,
  className = '',
}) => {
  const isClickable = !!onClick;
  
  // Visual hierarchy: primary = brightest, secondary = dimmed, tertiary = subdued
  const hierarchyStyles = {
    primary: 'bg-slate-800/50 border-indigo-500/25',
    secondary: 'bg-slate-800/35 border-indigo-500/15',
    tertiary: 'bg-slate-800/25 border-indigo-500/10',
  };
  
  const baseClasses = `
    inline-flex items-center gap-1.5 h-8 px-3 rounded-lg
    ${hierarchyStyles[hierarchy]}
    backdrop-blur-sm
    transition-all duration-200
    ${isClickable ? 'cursor-pointer hover:bg-slate-800/60 hover:border-indigo-500/30 hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]' : ''}
    ${className}
  `;

  return (
    <div
      className={baseClasses.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Icon - standardized 16px with cyan glow */}
      <Icon 
        className={`w-4 h-4 flex-shrink-0 ${iconColorClasses[iconColor]}`}
        style={iconColor === 'cyan' ? { filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' } : undefined}
      />

      {/* Label (optional) */}
      {label && (
        <span className="text-[11px] text-slate-400 font-medium">
          {label}
        </span>
      )}

      {/* Value - standardized 12px */}
      <span className="text-white font-semibold text-xs tabular-nums">
        {value}
      </span>

      {/* Unit (optional) */}
      {unit && (
        <span className="text-slate-400 text-[11px] font-medium">
          {unit}
        </span>
      )}

      {/* Badge (optional) */}
      {badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${badgeVariantClasses[badge.variant]}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
};

export default TelemetryChip;
