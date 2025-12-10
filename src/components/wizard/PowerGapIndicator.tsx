/**
 * POWER GAP INDICATOR
 * ====================
 * 
 * Visual indicator showing the gap between power NEEDED vs power SELECTED.
 * 
 * Core concept:
 * - PowerProfile = Target power needs based on user inputs + template defaults
 * - PowerGap = Difference between needs and current selection
 * 
 * Visual states:
 * - 🔴 RED: Significant gap (needs > 20% more)
 * - 🟡 YELLOW: Small gap (needs 5-20% more)  
 * - 🟢 GREEN: Sufficient (within 5% or surplus)
 * 
 * User-friendly messaging (avoids technical jargon):
 * - "Your facility needs more power" vs "Power Gap: 150 kW"
 * - Shows resolution options: Solar, Generator, Upgrade Battery
 * 
 * Created: December 9, 2025
 */

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Sun,
  Fuel,
  Battery,
  Info,
  Sparkles
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface PowerGapIndicatorProps {
  // Current selection
  selectedPowerKW: number;
  selectedEnergyKWh: number;
  selectedDurationHours: number;
  
  // What they need
  neededPowerKW: number;
  neededEnergyKWh: number;
  neededDurationHours: number;
  
  // UI options
  showDetails?: boolean;
  showResolutionOptions?: boolean;
  compact?: boolean;
  useCaseName?: string;
  
  // Callbacks
  onAcceptRecommendation?: (type: 'add_solar' | 'add_generator' | 'upgrade_battery' | 'optimal_mix') => void;
  onShowExplainer?: () => void;
}

export type GapStatus = 'critical' | 'warning' | 'sufficient' | 'surplus';

export interface GapAnalysis {
  status: GapStatus;
  powerGapKW: number;
  energyGapKWh: number;
  durationGapHours: number;
  coveragePercent: number;
  message: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function analyzeGap(
  selectedKW: number,
  selectedKWh: number,
  selectedHours: number,
  neededKW: number,
  neededKWh: number,
  neededHours: number
): GapAnalysis {
  const powerGapKW = selectedKW - neededKW;
  const energyGapKWh = selectedKWh - neededKWh;
  const durationGapHours = selectedHours - neededHours;
  
  // Coverage is the minimum of all three dimensions
  const powerCoverage = neededKW > 0 ? (selectedKW / neededKW) * 100 : 100;
  const energyCoverage = neededKWh > 0 ? (selectedKWh / neededKWh) * 100 : 100;
  const durationCoverage = neededHours > 0 ? (selectedHours / neededHours) * 100 : 100;
  
  const coveragePercent = Math.min(powerCoverage, energyCoverage, durationCoverage);
  
  let status: GapStatus;
  let message: string;
  
  if (coveragePercent >= 100) {
    status = coveragePercent > 110 ? 'surplus' : 'sufficient';
    message = coveragePercent > 110 
      ? `Your system has ${Math.round(coveragePercent - 100)}% more capacity than needed`
      : 'Your system meets all power requirements';
  } else if (coveragePercent >= 80) {
    status = 'warning';
    message = `Your system covers ${Math.round(coveragePercent)}% of your needs`;
  } else {
    status = 'critical';
    message = `Your system only covers ${Math.round(coveragePercent)}% of your needs`;
  }
  
  return {
    status,
    powerGapKW,
    energyGapKWh,
    durationGapHours,
    coveragePercent,
    message,
  };
}

function formatPower(kw: number): string {
  if (Math.abs(kw) >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${Math.round(kw)} kW`;
}

function formatEnergy(kwh: number): string {
  if (Math.abs(kwh) >= 1000000) {
    return `${(kwh / 1000000).toFixed(1)} GWh`;
  }
  if (Math.abs(kwh) >= 1000) {
    return `${(kwh / 1000).toFixed(1)} MWh`;
  }
  return `${Math.round(kwh)} kWh`;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function GapGauge({ coveragePercent, status }: { coveragePercent: number; status: GapStatus }) {
  const clampedPercent = Math.min(150, Math.max(0, coveragePercent));
  const fillPercent = Math.min(100, clampedPercent);
  
  const statusColors = {
    critical: { bg: 'bg-red-500/20', fill: 'bg-gradient-to-r from-red-500 to-red-600', text: 'text-red-500', border: 'border-red-500/30' },
    warning: { bg: 'bg-yellow-500/20', fill: 'bg-gradient-to-r from-yellow-500 to-amber-500', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    sufficient: { bg: 'bg-emerald-500/20', fill: 'bg-gradient-to-r from-emerald-500 to-green-500', text: 'text-emerald-500', border: 'border-emerald-500/30' },
    surplus: { bg: 'bg-blue-500/20', fill: 'bg-gradient-to-r from-emerald-500 to-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500/30' },
  };
  
  const colors = statusColors[status];
  
  return (
    <div className="w-full">
      {/* Gauge label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Power Gap</span>
        <span className={`text-sm font-bold ${colors.text}`}>
          {Math.round(coveragePercent)}%
        </span>
      </div>
      
      {/* Gauge bar */}
      <div className={`relative h-3 ${colors.bg} rounded-full overflow-hidden border ${colors.border}`}>
        {/* Target line at 100% */}
        <div className="absolute left-[66.67%] top-0 bottom-0 w-0.5 bg-white/30 z-10" />
        
        {/* Fill bar */}
        <div 
          className={`h-full ${colors.fill} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${(fillPercent / 150) * 100}%` }}
        />
      </div>
      
      {/* Scale markers */}
      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
        <span>0%</span>
        <span>50%</span>
        <span className="text-emerald-400">100%</span>
        <span>150%</span>
      </div>
    </div>
  );
}

function ResolutionOption({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  recommended = false
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
        recommended 
          ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/50 hover:border-emerald-400' 
          : 'bg-gray-800/50 border border-gray-700/50 hover:border-gray-600'
      }`}
    >
      <div className={`p-2 rounded-lg ${recommended ? 'bg-emerald-500/30' : 'bg-gray-700/50'}`}>
        <Icon className={`w-4 h-4 ${recommended ? 'text-emerald-400' : 'text-gray-400'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${recommended ? 'text-emerald-400' : 'text-gray-200'}`}>{title}</span>
          {recommended && (
            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
              RECOMMENDED
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{description}</span>
      </div>
      <ArrowRight className={`w-4 h-4 mt-2 ${recommended ? 'text-emerald-400' : 'text-gray-500'}`} />
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PowerGapIndicator({
  selectedPowerKW,
  selectedEnergyKWh,
  selectedDurationHours,
  neededPowerKW,
  neededEnergyKWh,
  neededDurationHours,
  showDetails = true,
  showResolutionOptions = true,
  compact = false,
  useCaseName = 'your facility',
  onAcceptRecommendation,
  onShowExplainer,
}: PowerGapIndicatorProps) {
  
  const gap = analyzeGap(
    selectedPowerKW,
    selectedEnergyKWh,
    selectedDurationHours,
    neededPowerKW,
    neededEnergyKWh,
    neededDurationHours
  );
  
  const statusConfig = {
    critical: {
      icon: AlertTriangle,
      title: 'Power Gap Detected',
      bgClass: 'bg-gradient-to-br from-red-950/50 to-red-900/30',
      borderClass: 'border-red-500/40',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: TrendingUp,
      title: 'Nearly There',
      bgClass: 'bg-gradient-to-br from-yellow-950/50 to-amber-900/30',
      borderClass: 'border-yellow-500/40',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    sufficient: {
      icon: CheckCircle,
      title: 'Power Needs Met',
      bgClass: 'bg-gradient-to-br from-emerald-950/50 to-green-900/30',
      borderClass: 'border-emerald-500/40',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    surplus: {
      icon: Sparkles,
      title: 'Power Surplus',
      bgClass: 'bg-gradient-to-br from-blue-950/50 to-cyan-900/30',
      borderClass: 'border-cyan-500/40',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
  };
  
  const config = statusConfig[gap.status];
  const StatusIcon = config.icon;
  
  // Compact view for inline display
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgClass} border ${config.borderClass}`}>
        <StatusIcon className={`w-4 h-4 ${config.iconColor}`} />
        <span className={`text-sm ${config.iconColor}`}>
          {gap.coveragePercent >= 100 
            ? 'Power needs met ✓' 
            : `${Math.round(100 - gap.coveragePercent)}% gap`
          }
        </span>
        {onShowExplainer && (
          <button onClick={onShowExplainer} className="ml-1">
            <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-300" />
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`${config.bgClass} border ${config.borderClass} rounded-2xl p-5`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.iconBg}`}>
            <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{config.title}</h3>
            <p className="text-sm text-gray-400">{gap.message}</p>
          </div>
        </div>
        {onShowExplainer && (
          <button 
            onClick={onShowExplainer}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="What is this?"
          >
            <Info className="w-5 h-5 text-gray-400 hover:text-gray-300" />
          </button>
        )}
      </div>
      
      {/* Power Gauge */}
      <GapGauge coveragePercent={gap.coveragePercent} status={gap.status} />
      
      {/* Details breakdown */}
      {showDetails && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400">Power</div>
            <div className="text-sm font-bold text-white">{formatPower(selectedPowerKW)}</div>
            <div className="text-[10px] text-gray-500">need {formatPower(neededPowerKW)}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <Battery className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400">Storage</div>
            <div className="text-sm font-bold text-white">{formatEnergy(selectedEnergyKWh)}</div>
            <div className="text-[10px] text-gray-500">need {formatEnergy(neededEnergyKWh)}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400">Duration</div>
            <div className="text-sm font-bold text-white">{selectedDurationHours}hr</div>
            <div className="text-[10px] text-gray-500">need {neededDurationHours}hr</div>
          </div>
        </div>
      )}
      
      {/* Resolution options (only show if there's a gap) */}
      {showResolutionOptions && gap.coveragePercent < 100 && onAcceptRecommendation && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Fill Your Power Gap
          </h4>
          <div className="space-y-2">
            <ResolutionOption
              icon={Sparkles}
              title="Merlin Optimal Mix"
              description="AI-optimized blend of battery + solar for best ROI"
              onClick={() => onAcceptRecommendation('optimal_mix')}
              recommended
            />
            <ResolutionOption
              icon={Sun}
              title="Add Solar"
              description={`+${formatPower(Math.abs(gap.powerGapKW) * 1.2)} solar to cover daytime demand`}
              onClick={() => onAcceptRecommendation('add_solar')}
            />
            <ResolutionOption
              icon={Battery}
              title="Upgrade Battery"
              description={`Increase to ${formatEnergy(neededEnergyKWh)} storage capacity`}
              onClick={() => onAcceptRecommendation('upgrade_battery')}
            />
            <ResolutionOption
              icon={Fuel}
              title="Add Generator"
              description="Natural gas backup for extended outages"
              onClick={() => onAcceptRecommendation('add_generator')}
            />
          </div>
        </div>
      )}
      
      {/* Success message when gap is filled */}
      {gap.status === 'sufficient' && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Your {useCaseName} power needs are fully covered!</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Proceed to your quote to see pricing and savings.
          </p>
        </div>
      )}
      
      {/* Surplus message */}
      {gap.status === 'surplus' && (
        <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">System exceeds requirements</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Extra capacity provides room for growth and additional resilience. 
            You could also reduce system size to lower costs.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { analyzeGap, formatPower, formatEnergy };
