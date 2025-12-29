/**
 * EnergyOpportunityBadge Component
 * 
 * Small badge indicators for various energy optimization opportunities.
 * Used in cards, lists, and inline contexts.
 */

import React from 'react';
import { 
  Zap, 
  Sun, 
  Wind, 
  Battery, 
  Leaf, 
  DollarSign, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

export type OpportunityType = 
  | 'peak-shaving'
  | 'solar-potential'
  | 'demand-response'
  | 'backup-power'
  | 'cost-savings'
  | 'green-energy'
  | 'grid-services'
  | 'ev-ready'
  | 'configured'
  | 'warning'
  | 'info';

export interface EnergyOpportunityBadgeProps {
  type: OpportunityType;
  /** Optional custom label (otherwise uses default) */
  label?: string;
  /** Value to display (e.g., "$5,000/yr", "25%") */
  value?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether badge is clickable */
  onClick?: () => void;
}

const BADGE_CONFIG: Record<OpportunityType, {
  icon: typeof Zap;
  defaultLabel: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  'peak-shaving': {
    icon: TrendingUp,
    defaultLabel: 'Peak Shaving',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  'solar-potential': {
    icon: Sun,
    defaultLabel: 'Solar Potential',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  'demand-response': {
    icon: Zap,
    defaultLabel: 'Demand Response',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  'backup-power': {
    icon: Battery,
    defaultLabel: 'Backup Ready',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  'cost-savings': {
    icon: DollarSign,
    defaultLabel: 'Cost Savings',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200'
  },
  'green-energy': {
    icon: Leaf,
    defaultLabel: 'Green Energy',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  'grid-services': {
    icon: Zap,
    defaultLabel: 'Grid Services',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200'
  },
  'ev-ready': {
    icon: Battery,
    defaultLabel: 'EV Ready',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200'
  },
  'configured': {
    icon: CheckCircle,
    defaultLabel: 'Configured',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  'warning': {
    icon: AlertCircle,
    defaultLabel: 'Attention',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  'info': {
    icon: Info,
    defaultLabel: 'Info',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  }
};

const SIZE_CLASSES = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3'
  },
  md: {
    container: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4'
  },
  lg: {
    container: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-5 h-5'
  }
};

export function EnergyOpportunityBadge({
  type,
  label,
  value,
  size = 'md',
  onClick
}: EnergyOpportunityBadgeProps) {
  const config = BADGE_CONFIG[type];
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;
  
  const baseClasses = `
    inline-flex items-center rounded-full border font-medium
    ${config.bgColor} ${config.textColor} ${config.borderColor}
    ${sizeClasses.container}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
  `;
  
  return (
    <span className={baseClasses} onClick={onClick}>
      <Icon className={sizeClasses.icon} />
      <span>{label || config.defaultLabel}</span>
      {value && (
        <span className="font-bold">{value}</span>
      )}
    </span>
  );
}

/**
 * Convenience components for common badge types
 */
export function PeakShavingBadge({ value, size }: { value?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <EnergyOpportunityBadge type="peak-shaving" value={value} size={size} />;
}

export function SolarPotentialBadge({ value, size }: { value?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <EnergyOpportunityBadge type="solar-potential" value={value} size={size} />;
}

export function CostSavingsBadge({ value, size }: { value?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <EnergyOpportunityBadge type="cost-savings" value={value} size={size} />;
}

export function BackupPowerBadge({ value, size }: { value?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <EnergyOpportunityBadge type="backup-power" value={value} size={size} />;
}

export function ConfiguredBadge({ label, size }: { label?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <EnergyOpportunityBadge type="configured" label={label} size={size} />;
}

export function WarningBadge({ label, size }: { label?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <EnergyOpportunityBadge type="warning" label={label} size={size} />;
}

export default EnergyOpportunityBadge;
