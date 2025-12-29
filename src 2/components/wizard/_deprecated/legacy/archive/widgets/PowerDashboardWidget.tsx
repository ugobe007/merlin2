/**
 * POWER DASHBOARD WIDGET
 * ======================
 * 
 * Compact expandable widget for wizard navigation bar.
 * Shows key power metrics at a glance with expansion for details.
 * 
 * Displays:
 * - Current utility rate ($/kWh)
 * - Peak power requirements (kW)
 * - Storage capacity (kWh/MWh)
 * - Duration (hours of backup)
 * - Monthly usage estimate
 * - Demand charge impact
 * 
 * Purpose: Virtual "shopping list" showing power/storage needs
 * as user advances through wizard.
 * 
 * Position: Wizard nav bar (expandable button to not block navigation)
 */

import React, { useState } from 'react';
import { 
  Battery, 
  Zap, 
  DollarSign, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  Gauge,
  Sun,
  Wind,
  Activity
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface PowerDashboardData {
  // Utility/Location
  utilityRate: number;           // $/kWh
  demandCharge: number;          // $/kW
  state?: string;
  
  // Power Requirements
  peakDemandKW: number;          // Peak power needed
  monthlyUsageKWh?: number;      // Estimated monthly usage
  
  // Storage Configuration
  storageKWh: number;            // Total battery storage
  durationHours: number;         // Hours of backup
  
  // Optional Renewables
  solarKW?: number;
  windKW?: number;
  generatorKW?: number;
  
  // Calculated values (optional - can be computed)
  estimatedSavings?: number;     // Annual savings estimate
  paybackYears?: number;
}

export interface PowerDashboardWidgetProps {
  data: PowerDashboardData;
  compact?: boolean;
  defaultExpanded?: boolean;
  colorScheme?: 'purple' | 'cyan' | 'emerald' | 'amber';
  className?: string;
  onDetailsClick?: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPower(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${kw.toLocaleString()} kW`;
}

function formatEnergy(kwh: number): string {
  if (kwh >= 1_000_000) {
    return `${(kwh / 1_000_000).toFixed(1)} GWh`;
  }
  if (kwh >= 1_000) {
    return `${(kwh / 1_000).toFixed(1)} MWh`;
  }
  return `${kwh.toLocaleString()} kWh`;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value.toLocaleString()}`;
}

// Color schemes for different contexts
const COLOR_SCHEMES = {
  purple: {
    bg: 'from-purple-900/80 to-purple-950/80',
    border: 'border-purple-500/40',
    accent: 'text-purple-400',
    badge: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    icon: 'text-purple-400',
    hover: 'hover:bg-purple-800/40',
  },
  cyan: {
    bg: 'from-cyan-900/80 to-blue-950/80',
    border: 'border-cyan-500/40',
    accent: 'text-cyan-400',
    badge: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    icon: 'text-cyan-400',
    hover: 'hover:bg-cyan-800/40',
  },
  emerald: {
    bg: 'from-emerald-900/80 to-teal-950/80',
    border: 'border-emerald-500/40',
    accent: 'text-emerald-400',
    badge: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    icon: 'text-emerald-400',
    hover: 'hover:bg-emerald-800/40',
  },
  amber: {
    bg: 'from-amber-900/80 to-orange-950/80',
    border: 'border-amber-500/40',
    accent: 'text-amber-400',
    badge: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    icon: 'text-amber-400',
    hover: 'hover:bg-amber-800/40',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PowerDashboardWidget: React.FC<PowerDashboardWidgetProps> = ({
  data,
  compact = true,
  defaultExpanded = false,
  colorScheme = 'purple',
  className = '',
  onDetailsClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = COLOR_SCHEMES[colorScheme];
  
  // Calculate demand charge impact
  const demandChargeImpact = data.peakDemandKW * data.demandCharge * 12; // Annual
  
  // Calculate if system meets requirements
  const powerRatio = data.storageKWh > 0 ? (data.storageKWh / data.durationHours) / data.peakDemandKW : 0;
  const isSufficient = powerRatio >= 0.8;
  
  // Compact collapsed view - just key metrics in pill format
  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${colors.bg} ${colors.border} border backdrop-blur-sm ${colors.hover} transition-all group ${className}`}
      >
        {/* Power indicator */}
        <div className="flex items-center gap-1">
          <Gauge className={`w-3.5 h-3.5 ${colors.icon}`} />
          <span className="text-xs font-bold text-white">{formatPower(data.peakDemandKW)}</span>
        </div>
        
        {/* Divider */}
        <div className="w-px h-3 bg-white/20" />
        
        {/* Storage indicator */}
        <div className="flex items-center gap-1">
          <Battery className={`w-3.5 h-3.5 ${isSufficient ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-xs font-bold text-white">{formatEnergy(data.storageKWh)}</span>
        </div>
        
        {/* Rate indicator */}
        <div className="flex items-center gap-1">
          <DollarSign className={`w-3.5 h-3.5 ${colors.icon}`} />
          <span className="text-xs font-medium text-white/80">{data.utilityRate.toFixed(2)}/kWh</span>
        </div>
        
        {/* Expand icon */}
        <ChevronDown className={`w-3.5 h-3.5 ${colors.icon} group-hover:translate-y-0.5 transition-transform`} />
      </button>
    );
  }
  
  // Expanded view - full dashboard
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border backdrop-blur-sm shadow-xl ${className}`}>
      {/* Header with collapse button */}
      <button 
        onClick={() => setIsExpanded(false)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border-b border-white/10 ${colors.hover} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-sm font-bold text-white">Power Dashboard</span>
          {data.state && (
            <span className={`text-xs ${colors.badgeText} px-2 py-0.5 ${colors.badge} rounded-full`}>
              {data.state}
            </span>
          )}
        </div>
        <ChevronUp className={`w-4 h-4 ${colors.icon}`} />
      </button>
      
      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Utility Rate */}
          <div className={`${colors.badge} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${colors.icon}`} />
              <span className="text-xs font-medium text-white/70">Utility Rate</span>
            </div>
            <div className="text-lg font-bold text-white">
              ${data.utilityRate.toFixed(2)}<span className="text-xs text-white/60">/kWh</span>
            </div>
          </div>
          
          {/* Demand Charge */}
          <div className={`${colors.badge} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-4 h-4 ${colors.icon}`} />
              <span className="text-xs font-medium text-white/70">Demand Charge</span>
            </div>
            <div className="text-lg font-bold text-white">
              ${data.demandCharge}<span className="text-xs text-white/60">/kW</span>
            </div>
          </div>
          
          {/* Peak Power */}
          <div className={`${colors.badge} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className={`w-4 h-4 ${colors.icon}`} />
              <span className="text-xs font-medium text-white/70">Peak Demand</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatPower(data.peakDemandKW)}
            </div>
          </div>
          
          {/* Storage */}
          <div className={`${isSufficient ? 'bg-emerald-500/20' : 'bg-amber-500/20'} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <Battery className={`w-4 h-4 ${isSufficient ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-xs font-medium text-white/70">Storage</span>
            </div>
            <div className={`text-lg font-bold ${isSufficient ? 'text-emerald-400' : 'text-amber-400'}`}>
              {formatEnergy(data.storageKWh)}
            </div>
          </div>
        </div>
        
        {/* Duration & Renewables Row */}
        <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
          <div className="flex items-center gap-4">
            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${colors.icon}`} />
              <span className="text-white/70">{data.durationHours}hr backup</span>
            </div>
            
            {/* Renewables if present */}
            {data.solarKW && data.solarKW > 0 && (
              <div className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300/80">{formatPower(data.solarKW)}</span>
              </div>
            )}
            {data.windKW && data.windKW > 0 && (
              <div className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-300/80">{formatPower(data.windKW)}</span>
              </div>
            )}
          </div>
          
          {/* Annual Demand Impact */}
          <div className={`${colors.badgeText} font-semibold`}>
            {formatCurrency(demandChargeImpact)}/yr demand
          </div>
        </div>
        
        {/* Optional: Details button */}
        {onDetailsClick && (
          <button
            onClick={onDetailsClick}
            className={`w-full mt-3 py-2 rounded-lg ${colors.badge} ${colors.hover} ${colors.badgeText} text-xs font-semibold transition-colors`}
          >
            View Full Power Analysis →
          </button>
        )}
      </div>
    </div>
  );
};

export default PowerDashboardWidget;
