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
    critical: { bg: 'bg-slate-700/60', fill: 'bg-gradient-to-r from-purple-500 to-indigo-400', text: 'text-purple-300', border: 'border-purple-400/50' },
    warning: { bg: 'bg-slate-700/60', fill: 'bg-gradient-to-r from-indigo-500 to-blue-400', text: 'text-indigo-300', border: 'border-indigo-400/50' },
    sufficient: { bg: 'bg-slate-700/60', fill: 'bg-gradient-to-r from-emerald-500 to-teal-400', text: 'text-emerald-300', border: 'border-emerald-400/50' },
    surplus: { bg: 'bg-slate-700/60', fill: 'bg-gradient-to-r from-cyan-500 to-blue-400', text: 'text-cyan-300', border: 'border-cyan-400/50' },
  };
  
  const colors = statusColors[status];
  
  return (
    <div className="w-full">
      {/* Gauge label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Power Gap</span>
        <span className={`text-sm font-bold ${colors.text}`}>
          {Math.round(coveragePercent)}%
        </span>
      </div>
      
      {/* Gauge bar */}
      <div className={`relative h-4 ${colors.bg} rounded-full overflow-hidden border ${colors.border}`}>
        {/* Target line at 100% */}
        <div className="absolute left-[66.67%] top-0 bottom-0 w-0.5 bg-white/40 z-10" />
        
        {/* Fill bar */}
        <div 
          className={`h-full ${colors.fill} rounded-full transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${(fillPercent / 150) * 100}%` }}
        />
      </div>
      
      {/* Scale markers */}
      <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-semibold">
        <span>0%</span>
        <span>50%</span>
        <span className="text-emerald-400 font-bold">100%</span>
        <span>150%</span>
      </div>
    </div>
  );
}

// Enhanced Resolution Option with trade-off indicators
function ResolutionOption({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  recommended = false,
  tradeoffs
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  onClick: () => void;
  recommended?: boolean;
  tradeoffs?: {
    upfrontCost: 'low' | 'medium' | 'high';
    ongoingCost: 'low' | 'medium' | 'high';
    reliability: 'good' | 'better' | 'best';
    environmental: 'good' | 'better' | 'best';
  };
}) {
  const costIndicator = (level: 'low' | 'medium' | 'high') => {
    const colors = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
    const dots = { low: 1, medium: 2, high: 3 };
    return (
      <span className={`font-mono ${colors[level]}`}>
        {'$'.repeat(dots[level])}
        <span className="text-gray-500">{'$'.repeat(3 - dots[level])}</span>
      </span>
    );
  };
  
  const qualityIndicator = (level: 'good' | 'better' | 'best') => {
    const colors = { good: 'text-amber-400', better: 'text-emerald-400', best: 'text-cyan-400' };
    const stars = { good: 1, better: 2, best: 3 };
    return (
      <span className={`${colors[level]}`}>
        {'★'.repeat(stars[level])}
        <span className="text-gray-500">{'★'.repeat(3 - stars[level])}</span>
      </span>
    );
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 p-4 rounded-xl transition-all text-left w-full ${
        recommended 
          ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 border-2 border-emerald-400 hover:border-emerald-500 shadow-lg shadow-emerald-200' 
          : 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300 hover:border-purple-400 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${recommended ? 'bg-emerald-500' : 'bg-purple-500'}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-bold ${recommended ? 'text-emerald-800' : 'text-purple-900'}`}>{title}</span>
            {recommended && (
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold tracking-wide">
                BEST VALUE
              </span>
            )}
          </div>
          <span className="text-sm text-gray-600 leading-relaxed">{description}</span>
        </div>
        <ArrowRight className={`w-5 h-5 mt-1 ${recommended ? 'text-emerald-600' : 'text-purple-500'}`} />
      </div>
      
      {/* Trade-off indicators */}
      {tradeoffs && (
        <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-purple-200">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Upfront</div>
            <div className="text-sm">{costIndicator(tradeoffs.upfrontCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ongoing</div>
            <div className="text-sm">{costIndicator(tradeoffs.ongoingCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Reliable</div>
            <div className="text-sm">{qualityIndicator(tradeoffs.reliability)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Green</div>
            <div className="text-sm">{qualityIndicator(tradeoffs.environmental)}</div>
          </div>
        </div>
      )}
    </button>
  );
}

// Enhanced Resolution Option with detailed trade-offs for decision making
function EnhancedResolutionOption({
  icon: Icon,
  title,
  description,
  pros,
  cons,
  upfrontCostStars,
  tenYearCostStars,
  carbonFootprint,
  bestFor,
  onClick,
  recommended = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  upfrontCostStars: number; // 1-5 (1 = cheap, 5 = expensive)
  tenYearCostStars: number; // 1-5 (1 = expensive long term, 5 = cheap long term)
  carbonFootprint: 'zero' | 'low' | 'medium' | 'high';
  bestFor: string;
  onClick: () => void;
  recommended?: boolean;
}) {
  const carbonConfig = {
    zero: { label: 'Zero', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '🌱' },
    low: { label: 'Low', color: 'text-lime-400', bg: 'bg-lime-500/20', icon: '🌿' },
    medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '🔥' },
    high: { label: 'High', color: 'text-red-400', bg: 'bg-red-500/20', icon: '💨' },
  };

  const renderCostStars = (count: number, inverse = false) => {
    // For upfront: fewer $ = better (green)
    // For 10-year: more stars = better value (green means cheap long-term)
    const dollarSigns = inverse ? count : count;
    const color = inverse 
      ? (count <= 2 ? 'text-emerald-400' : count <= 3 ? 'text-amber-400' : 'text-red-400')
      : (count >= 4 ? 'text-emerald-400' : count >= 3 ? 'text-amber-400' : 'text-red-400');
    
    return (
      <span className={`font-mono text-sm ${color}`}>
        {'$'.repeat(dollarSigns)}
        <span className="text-gray-500">{'$'.repeat(5 - dollarSigns)}</span>
      </span>
    );
  };

  const carbon = carbonConfig[carbonFootprint];

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col gap-3 p-4 rounded-xl transition-all text-left w-full group ${
        recommended
          ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 border-2 border-emerald-400 hover:border-emerald-500 shadow-lg shadow-emerald-200 ring-2 ring-emerald-300'
          : 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300 hover:border-purple-400 hover:shadow-md'
      }`}
    >
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> BEST VALUE
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${recommended ? 'bg-gradient-to-br from-emerald-500 to-cyan-500' : 'bg-purple-500'}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <span className={`font-bold ${recommended ? 'text-emerald-800' : 'text-purple-900'}`}>
            {title}
          </span>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        </div>
        <ArrowRight className={`w-5 h-5 mt-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${recommended ? 'text-emerald-600' : 'text-purple-500'}`} />
      </div>

      {/* Trade-off metrics */}
      <div className="grid grid-cols-3 gap-2 bg-white/60 rounded-lg p-2 border border-purple-100">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Upfront</div>
          {renderCostStars(upfrontCostStars, true)}
        </div>
        <div className="text-center border-x border-purple-200">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">10-Year</div>
          {renderCostStars(tenYearCostStars, false)}
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Carbon</div>
          <span className={`text-sm font-medium ${carbon.color}`}>
            {carbon.icon} {carbon.label}
          </span>
        </div>
      </div>

      {/* Pros/Cons in compact format */}
      <div className="flex gap-4 text-xs">
        <div className="flex-1">
          <span className="text-emerald-400 font-semibold">✓ </span>
          <span className="text-gray-300">{pros.slice(0, 2).join(' • ')}</span>
        </div>
        {cons.length > 0 && (
          <div className="flex-1">
            <span className="text-amber-400 font-semibold">⚠ </span>
            <span className="text-gray-400">{cons[0]}</span>
          </div>
        )}
      </div>

      {/* Best for */}
      <div className="text-xs text-purple-300 italic">
        Best for: {bestFor}
      </div>
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
      bgClass: 'bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-200',
      borderClass: 'border-purple-300',
      iconBg: 'bg-purple-500',
      iconColor: 'text-white',
      titleColor: 'text-purple-900',
      subtitleColor: 'text-purple-700',
    },
    warning: {
      icon: TrendingUp,
      title: 'Nearly There',
      bgClass: 'bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-200',
      borderClass: 'border-indigo-300',
      iconBg: 'bg-indigo-500',
      iconColor: 'text-white',
      titleColor: 'text-indigo-900',
      subtitleColor: 'text-indigo-700',
    },
    sufficient: {
      icon: CheckCircle,
      title: 'Power Needs Met',
      bgClass: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-200',
      borderClass: 'border-emerald-300',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      titleColor: 'text-emerald-900',
      subtitleColor: 'text-emerald-700',
    },
    surplus: {
      icon: Sparkles,
      title: 'Power Surplus',
      bgClass: 'bg-gradient-to-br from-cyan-100 via-blue-100 to-cyan-200',
      borderClass: 'border-cyan-300',
      iconBg: 'bg-cyan-500',
      iconColor: 'text-white',
      titleColor: 'text-cyan-900',
      subtitleColor: 'text-cyan-700',
    },
  };
  
  const config = statusConfig[gap.status];
  const StatusIcon = config.icon;
  
  // Compact view for inline display
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgClass} border ${config.borderClass}`}>
        <StatusIcon className={`w-4 h-4 ${config.titleColor}`} />
        <span className={`text-sm font-medium ${config.titleColor}`}>
          {gap.coveragePercent >= 100 
            ? 'Power needs met ✓' 
            : `${Math.round(100 - gap.coveragePercent)}% gap`
          }
        </span>
        {onShowExplainer && (
          <button onClick={onShowExplainer} className="ml-1">
            <Info className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`${config.bgClass} border-2 ${config.borderClass} rounded-2xl p-5 shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.iconBg} shadow-lg`}>
            <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${config.titleColor}`}>{config.title}</h3>
            <p className={`text-sm ${config.subtitleColor}`}>{gap.message}</p>
          </div>
        </div>
        {onShowExplainer && (
          <button 
            onClick={onShowExplainer}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="What is this?"
          >
            <Info className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
      
      {/* Power Gauge */}
      <GapGauge coveragePercent={gap.coveragePercent} status={gap.status} />
      
      {/* Details breakdown */}
      {showDetails && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border-2 border-indigo-200 shadow-md">
            <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-xs text-indigo-700 font-bold uppercase tracking-wide">Power</div>
            <div className="text-2xl font-black text-indigo-900">{formatPower(selectedPowerKW)}</div>
            <div className="text-xs text-gray-600 font-semibold">need {formatPower(neededPowerKW)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border-2 border-emerald-200 shadow-md">
            <Battery className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-xs text-emerald-700 font-bold uppercase tracking-wide">Storage</div>
            <div className="text-2xl font-black text-emerald-900">{formatEnergy(selectedEnergyKWh)}</div>
            <div className="text-xs text-gray-600 font-semibold">need {formatEnergy(neededEnergyKWh)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border-2 border-purple-200 shadow-md">
            <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-xs text-purple-700 font-bold uppercase tracking-wide">Duration</div>
            <div className="text-2xl font-black text-purple-900">{selectedDurationHours}hr</div>
            <div className="text-xs text-gray-600 font-semibold">need {neededDurationHours}hr</div>
          </div>
        </div>
      )}
      
      {/* Resolution options (only show if there's a gap) */}
      {showResolutionOptions && gap.coveragePercent < 100 && onAcceptRecommendation && (
        <div className="mt-5">
          {/* Merlin's Recommendation - Prominent Accept/Continue */}
          <div className="mb-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 border-2 border-purple-400 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">🧙‍♂️ Merlin's Recommendation</h4>
                <p className="text-purple-200 text-sm">Based on your {useCaseName || 'facility'} requirements</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-black text-white">{formatPower(neededPowerKW)}</div>
                  <div className="text-xs text-purple-200 font-medium">Battery Power</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{formatEnergy(neededEnergyKWh)}</div>
                  <div className="text-xs text-purple-200 font-medium">Storage</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{neededDurationHours}hr</div>
                  <div className="text-xs text-purple-200 font-medium">Duration</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onAcceptRecommendation('optimal_mix')}
                className="flex-1 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Accept Recommendation
              </button>
              <button
                onClick={() => {}}
                className="px-6 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-colors"
              >
                Keep My Settings
              </button>
            </div>
          </div>
          
          <h4 className="text-base font-bold text-purple-900 mb-3 flex items-center gap-2">
            🔧 Or Choose a Different Approach:
          </h4>
          
          {/* Quick comparison legend */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-3 mb-4 border border-indigo-400/30 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-white">💰 Cost:</span> 
                <span className="text-amber-300">$</span>=low 
                <span className="text-amber-300">$$$</span>=high
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-white">🌱 Carbon:</span> 
                <span className="text-emerald-300">Zero</span>/<span className="text-amber-300">Low</span>/<span className="text-red-300">High</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-white">⭐ Best:</span> = Recommended
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <EnhancedResolutionOption
              icon={Sparkles}
              title="Merlin Optimal Mix"
              description="AI-optimized blend of battery + solar for best ROI"
              pros={['Best 10-year economics', 'Balanced approach', '30% ITC tax credit']}
              cons={['May require some compromise']}
              upfrontCostStars={3}
              tenYearCostStars={5}
              carbonFootprint="zero"
              bestFor="Most commercial facilities"
              onClick={() => onAcceptRecommendation('optimal_mix')}
              recommended
            />
            
            <EnhancedResolutionOption
              icon={Battery}
              title="Larger Battery System"
              description={`Increase to ${formatEnergy(neededEnergyKWh)} - no generator needed`}
              pros={['Zero emissions', 'No fuel costs ever', 'Quietest operation', 'Full 30% tax credit']}
              cons={['Higher upfront cost', 'Limited to battery duration']}
              upfrontCostStars={4}
              tenYearCostStars={4}
              carbonFootprint="zero"
              bestFor="Sites prioritizing sustainability & simplicity"
              onClick={() => onAcceptRecommendation('upgrade_battery')}
            />
            
            <EnhancedResolutionOption
              icon={Sun}
              title="Add Solar Generation"
              description={`+${formatPower(Math.abs(gap.powerGapKW) * 1.2)} solar array`}
              pros={['Free energy during daylight', 'Reduces grid bills', 'Full 30% tax credit', 'Extends battery life']}
              cons={['Weather dependent', 'Needs roof/land space', 'No power at night without battery']}
              upfrontCostStars={3}
              tenYearCostStars={5}
              carbonFootprint="zero"
              bestFor="High-sun locations with available space"
              onClick={() => onAcceptRecommendation('add_solar')}
            />
            
            <EnhancedResolutionOption
              icon={Fuel}
              title="Backup Generator"
              description="Natural gas generator for extended outages"
              pros={['Lowest upfront cost', 'Unlimited runtime', 'Proven technology']}
              cons={['Ongoing fuel costs', 'Emissions & noise', 'No tax credit', 'Maintenance required']}
              upfrontCostStars={2}
              tenYearCostStars={2}
              carbonFootprint="high"
              bestFor="Budget-constrained or multi-day backup needs"
              onClick={() => onAcceptRecommendation('add_generator')}
            />
          </div>
          
          {/* Educational callout */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800">
              💡 <strong className="text-amber-900">Did you know?</strong> A slightly larger BESS often costs less over 10 years than BESS + generator 
              because there's no fuel expense, zero maintenance, and the full 30% federal tax credit applies.
            </p>
          </div>
        </div>
      )}
      
      {/* Success message when gap is filled */}
      {gap.status === 'sufficient' && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Your {useCaseName} power needs are fully covered!</span>
          </div>
          <p className="text-sm text-emerald-600 mt-1">
            Proceed to your quote to see pricing and savings.
          </p>
        </div>
      )}
      
      {/* Surplus message - explain options to reduce cost */}
      {gap.status === 'surplus' && (
        <div className="mt-4 bg-cyan-900/40 border border-cyan-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">System exceeds requirements by {Math.round(gap.coveragePercent - 100)}%</span>
          </div>
          <p className="text-sm text-gray-300 mt-2">
            <strong className="text-white">Two ways to think about this:</strong>
          </p>
          <ul className="text-sm text-gray-300 mt-1 ml-4 space-y-1">
            <li>✅ <strong className="text-white">Keep it:</strong> Extra capacity = room for growth, longer backup, and more grid independence</li>
            <li>💰 <strong className="text-white">Right-size:</strong> Reduce system size to lower upfront costs if budget is tight</li>
          </ul>
          {onAcceptRecommendation && (
            <button
              onClick={() => onAcceptRecommendation('optimal_mix')}
              className="mt-3 text-sm text-cyan-400 font-medium hover:text-cyan-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" /> Let Merlin right-size the system →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { analyzeGap, formatPower, formatEnergy };
