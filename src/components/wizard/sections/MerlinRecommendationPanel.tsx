/**
 * MERLIN'S RECOMMENDED CONFIGURATION PANEL
 * 
 * Replaces the "Power Gap Detected" panel with a comprehensive
 * recommendation showing:
 * 1. Energy Production (Solar, Wind, Generator)
 * 2. Storage (BESS capacity)
 * 3. Equipment (PCS, switches, panels)
 * 4. Total Profile (production + storage)
 * 5. Projected Savings
 * 
 * DYNAMIC UPDATES: Numbers change in real-time as user adjusts sliders.
 * Shows comparison between user selection and Merlin's recommendation.
 * 
 * Shows warning if user's selections negatively impact the recommendation.
 */

import React, { useMemo } from 'react';
import {
  Sparkles,
  Sun,
  Wind,
  Fuel,
  Battery,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ThumbsUp,
  ArrowDown,
} from 'lucide-react';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface MerlinRecommendation {
  // Energy Production
  solarKW: number;
  windKW: number;
  generatorKW: number;
  // Storage
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  // Equipment (simplified - full list in details)
  pcsKW: number;
  transformerKVA: number;
  // Totals
  totalProductionKW: number;
  totalStorageKWh: number;
  dailyProductionKWh: number;
  // Financials
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  // Currency
  currency: string;
}

interface UserSelection {
  solarKW: number;
  windKW: number;
  generatorKW: number;
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
}

interface MerlinRecommendationPanelProps {
  /** Merlin's calculated recommendation */
  recommendation: MerlinRecommendation;
  /** User's current selection */
  userSelection: UserSelection;
  /** Peak demand in kW */
  peakDemandKW: number;
  /** Industry name for context */
  industryName: string;
  /** Callback when user accepts recommendation */
  onAcceptRecommendation: () => void;
  /** Whether panel is expanded */
  expanded?: boolean;
  /** Toggle expanded state */
  onToggleExpanded?: () => void;
}

// Format currency
function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount >= 1000000) {
    return `${currency === 'USD' ? '$' : currency}${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${currency === 'USD' ? '$' : currency}${(amount / 1000).toFixed(0)}K`;
  }
  return `${currency === 'USD' ? '$' : currency}${amount.toLocaleString()}`;
}

// Format power
function formatPower(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${kw.toLocaleString()} kW`;
}

// Format energy
function formatEnergy(kwh: number): string {
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(1)} MWh`;
  }
  return `${kwh.toLocaleString()} kWh`;
}

// Dynamic Configuration Card - shows user vs recommended with visual comparison
interface ConfigCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: 'amber' | 'sky' | 'slate' | 'purple' | 'emerald';
  userValue: number;
  recValue: number;
  unit: string;
  subtext: string;
  hasChanges: boolean;
}

const colorClasses = {
  amber: { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-600', label: 'text-amber-700' },
  sky: { bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-600', label: 'text-sky-700' },
  slate: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-600', label: 'text-slate-700' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-600', label: 'text-purple-700' },
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-600', label: 'text-emerald-700' },
};

function ConfigCard({ icon: Icon, label, colorClass, userValue, recValue, unit, subtext, hasChanges }: ConfigCardProps) {
  const colors = colorClasses[colorClass];
  const displayValue = hasChanges ? userValue : recValue;
  const isLower = hasChanges && userValue < recValue;
  const isHigher = hasChanges && userValue > recValue;
  const diff = userValue - recValue;
  
  return (
    <div className={`bg-white rounded-xl p-3 border shadow-sm transition-all ${
      hasChanges 
        ? isLower 
          ? 'border-amber-300 ring-2 ring-amber-200' 
          : 'border-blue-300 ring-2 ring-blue-200'
        : colors.border
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <span className={`text-xs font-semibold ${colors.label}`}>{label}</span>
        {hasChanges && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isLower ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isLower ? '↓' : isHigher ? '↑' : '='}{Math.abs(diff)} {unit}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`text-lg font-bold ${hasChanges && isLower ? 'text-amber-600' : 'text-gray-800'}`}>
          {formatPower(displayValue)}
        </p>
      </div>
      <p className="text-xs text-gray-500">{subtext}</p>
      {hasChanges && (
        <p className="text-xs text-gray-400 mt-1">
          Rec: {formatPower(recValue)}
        </p>
      )}
    </div>
  );
}

// Calculate if user selection is worse than recommendation
function calculateSelectionImpact(
  recommendation: MerlinRecommendation,
  userSelection: UserSelection
): { 
  isWorse: boolean; 
  savingsLoss: number; 
  coveragePercent: number;
  userAnnualSavings: number;
  userPayback: number;
  userROI: number;
  userTotalProduction: number;
  userTotalStorage: number;
  userDailyKWh: number;
  isMatch: boolean;
} {
  const recTotal = recommendation.solarKW + recommendation.windKW + 
                   recommendation.generatorKW + recommendation.batteryKW;
  const userTotal = userSelection.solarKW + userSelection.windKW + 
                    userSelection.generatorKW + userSelection.batteryKW;
  
  const coveragePercent = recTotal > 0 ? Math.round((userTotal / recTotal) * 100) : 100;
  const isWorse = userTotal < recTotal * 0.9; // 10% tolerance
  
  // Calculate user's estimated metrics based on their selection
  const savingsRatio = Math.min(userTotal / Math.max(recTotal, 1), 1.2); // Cap at 120%
  const userAnnualSavings = Math.round(recommendation.annualSavings * savingsRatio);
  const savingsLoss = Math.max(0, recommendation.annualSavings - userAnnualSavings);
  
  // Adjust payback based on selection ratio (inverse relationship)
  const userPayback = savingsRatio > 0.1 
    ? Math.round((recommendation.paybackYears / savingsRatio) * 10) / 10
    : 99;
  
  // ROI scales with ratio
  const userROI = Math.round(recommendation.roi10Year * savingsRatio);
  
  // Calculate user's production totals
  const userTotalProduction = userSelection.solarKW + userSelection.windKW + userSelection.generatorKW;
  const userTotalStorage = userSelection.batteryKWh;
  const userDailyKWh = Math.round(
    (userSelection.solarKW * 4.5) + 
    (userSelection.windKW * 6) + 
    (userSelection.generatorKW * 0) // Generator is backup only
  );
  
  // Check if user matches recommendation
  const isMatch = 
    userSelection.solarKW === recommendation.solarKW &&
    userSelection.windKW === recommendation.windKW &&
    userSelection.generatorKW === recommendation.generatorKW &&
    userSelection.batteryKW === recommendation.batteryKW &&
    userSelection.batteryKWh === recommendation.batteryKWh;
  
  return { 
    isWorse, 
    savingsLoss, 
    coveragePercent,
    userAnnualSavings,
    userPayback,
    userROI,
    userTotalProduction,
    userTotalStorage,
    userDailyKWh,
    isMatch,
  };
}

export function MerlinRecommendationPanel({
  recommendation,
  userSelection,
  peakDemandKW,
  industryName,
  onAcceptRecommendation,
  expanded = false,
  onToggleExpanded,
}: MerlinRecommendationPanelProps) {
  // Calculate dynamic impact based on user selection
  const impact = useMemo(() => 
    calculateSelectionImpact(recommendation, userSelection),
    [recommendation, userSelection]
  );
  
  const currencySymbol = recommendation.currency === 'USD' ? '$' : recommendation.currency;
  
  // Check if user has made changes from recommendation
  const hasChanges = 
    userSelection.solarKW !== recommendation.solarKW ||
    userSelection.windKW !== recommendation.windKW ||
    userSelection.generatorKW !== recommendation.generatorKW ||
    userSelection.batteryKW !== recommendation.batteryKW;

  // Determine display mode: show user's numbers if they've made changes
  const displaySavings = hasChanges ? impact.userAnnualSavings : recommendation.annualSavings;
  const displayPayback = hasChanges ? impact.userPayback : recommendation.paybackYears;
  const displayROI = hasChanges ? impact.userROI : recommendation.roi10Year;

  // Status indicator
  const getStatusBadge = () => {
    if (impact.isMatch) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 rounded-full">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-bold">Optimal</span>
        </div>
      );
    }
    if (!hasChanges) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold">Review</span>
        </div>
      );
    }
    if (impact.isWorse) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 rounded-full animate-pulse">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-bold">−{formatCurrency(impact.savingsLoss, recommendation.currency)}/yr</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 rounded-full">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-bold">Modified</span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border-2 overflow-hidden transition-all border-purple-400 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 shadow-xl shadow-purple-300/40">
      {/* Header with Merlin - ALWAYS PURPLE */}
      <div className="p-4 text-white bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800">
        <div className="flex items-center gap-3">
          <img src={merlinImage} alt="Merlin" className="w-12 h-12 rounded-full border-2 border-white/30" />
          <div className="flex-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Merlin's Smart Recommendation
            </h3>
            <p className="text-sm text-purple-200">
              {impact.isMatch 
                ? '✓ Your configuration matches optimal settings' 
                : hasChanges 
                  ? 'Recommendations update as you adjust sliders below'
                  : `Based on your facility data and ${industryName} best practices`
              }
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {/* Energy Profile at Top - MOVED HERE for visibility */}
        <div className="rounded-xl p-4 mb-5 border transition-all bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  {hasChanges ? 'Your Energy Profile' : 'Total Energy Profile'}
                </p>
                <p className="text-xs text-indigo-600">
                  Production + Storage Capacity
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-700">
                {formatEnergy(hasChanges ? impact.userTotalStorage : recommendation.batteryKWh)}
              </p>
              <p className="text-xs text-indigo-500">
                storage capacity
              </p>
            </div>
          </div>
          
          {/* Visual breakdown bar - uses user values if changed */}
          {(() => {
            const displaySolar = hasChanges ? userSelection.solarKW : recommendation.solarKW;
            const displayWind = hasChanges ? userSelection.windKW : recommendation.windKW;
            const displayGen = hasChanges ? userSelection.generatorKW : recommendation.generatorKW;
            const displayBESS = hasChanges ? userSelection.batteryKW : recommendation.batteryKW;
            const totalProd = displaySolar + displayWind + displayGen;
            const totalAll = totalProd + displayBESS;
            
            return (
              <>
                <div className="mt-3 h-3 bg-white rounded-full overflow-hidden flex">
                  {displaySolar > 0 && (
                    <div 
                      className="h-full bg-amber-400 transition-all" 
                      style={{ width: `${(displaySolar / Math.max(totalAll, 1)) * 100}%` }}
                      title={`Solar: ${formatPower(displaySolar)}`}
                    />
                  )}
                  {displayWind > 0 && (
                    <div 
                      className="h-full bg-sky-400 transition-all" 
                      style={{ width: `${(displayWind / Math.max(totalAll, 1)) * 100}%` }}
                      title={`Wind: ${formatPower(displayWind)}`}
                    />
                  )}
                  {displayGen > 0 && (
                    <div 
                      className="h-full bg-slate-400 transition-all" 
                      style={{ width: `${(displayGen / Math.max(totalAll, 1)) * 100}%` }}
                      title={`Generator: ${formatPower(displayGen)}`}
                    />
                  )}
                  <div 
                    className="h-full bg-purple-500 transition-all" 
                    style={{ width: `${(displayBESS / Math.max(totalAll, 1)) * 100}%` }}
                    title={`BESS: ${formatEnergy(hasChanges ? userSelection.batteryKWh : recommendation.batteryKWh)}`}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Production ({totalAll > 0 ? Math.round((totalProd / totalAll) * 100) : 0}%)</span>
                  <span>Storage ({totalAll > 0 ? Math.round((displayBESS / totalAll) * 100) : 0}%)</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* MAIN ACCEPT BANNER - Shows key metrics and accept button */}
        {impact.isMatch ? (
          /* Success State - User has accepted - STILL CLICKABLE */
          <button
            onClick={onAcceptRecommendation}
            className="mb-4 p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl border-2 border-purple-400 shadow-2xl w-full text-left hover:scale-[1.02] hover:shadow-purple-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-10 h-10 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                    🧙‍♂️ MERLIN'S CONFIGURATION
                  </h4>
                  <p className="text-xl font-bold text-purple-100">
                    Click to accept or adjust your configuration below
                  </p>
                  <p className="text-sm text-white/90 mt-2">
                    Your current settings match Merlin's optimal recommendation
                  </p>
                </div>
              </div>
              
              {/* SAVINGS BADGE - Light Blue/Purple for visibility */}
              <div className="bg-gradient-to-br from-blue-400/90 to-purple-400/90 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border-2 border-blue-200/60 flex-shrink-0 shadow-xl">
                <p className="text-xs text-white font-bold uppercase mb-1">💰 Annual Savings</p>
                <p className="text-3xl font-black text-white drop-shadow-lg">
                  {formatCurrency(displaySavings, recommendation.currency)}
                </p>
                <p className="text-xs text-white/90 mt-1 font-semibold">
                  {displayPayback.toFixed(1)} yr payback
                </p>
              </div>
            </div>
          </button>
        ) : (
          /* Accept Button with Key Metrics - Before acceptance */
          <div className="mb-4">
            {/* TWO BUTTONS - Accept and Scroll to Configuration */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* ACCEPT BUTTON WITH SAVINGS */}
              <button
                type="button"
                onClick={() => {
                  console.log('🧙‍♂️ Accept button clicked!');
                  onAcceptRecommendation();
                }}
                className="py-4 px-3 rounded-xl font-bold shadow-lg hover:shadow-purple-500/40 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 hover:from-purple-500 hover:via-indigo-400 hover:to-cyan-400 text-white transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg font-black">🧙‍♂️ Accept</div>
                    <div className="text-xs font-normal text-white/80">Save {formatCurrency(displaySavings, recommendation.currency)}/yr</div>
                  </div>
                </div>
              </button>
              
              {/* CUSTOMIZE BUTTON */}
              <button
                type="button"
                onClick={() => {
                  const configSection = document.querySelector('[data-section="solar-config"], [data-section="wind-config"], [data-section="generator-config"], [data-section="bess-config"]');
                  if (configSection) {
                    configSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    window.scrollBy({ top: 800, behavior: 'smooth' });
                  }
                }}
                className="py-4 px-3 rounded-xl font-bold shadow-lg hover:shadow-amber-500/40 bg-gradient-to-r from-slate-400 via-amber-400 to-orange-400 hover:from-slate-300 hover:via-amber-300 hover:to-orange-300 text-gray-800 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-3">
                  <Settings className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg font-black">⚙️ Customize</div>
                    <div className="text-xs font-normal text-gray-700">Fine-tune settings</div>
                  </div>
                </div>
              </button>
            </div>

            {/* KEY METRICS BELOW BUTTON */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-300">
              {/* Annual Savings - PROMINENT */}
              <div className="bg-white rounded-xl p-4 mb-4 text-center shadow-md">
                <p className="text-sm text-purple-600 font-semibold uppercase mb-1">💰 Annual Savings</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                  {formatCurrency(displaySavings, recommendation.currency)}
                </p>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                  <span className="text-gray-600">Payback: <strong className="text-purple-700">{displayPayback.toFixed(1)} yrs</strong></span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">ROI: <strong className="text-purple-700">{displayROI}%</strong></span>
                </div>
              </div>

              {/* Battery & Energy Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Battery Storage */}
                <div className="bg-white rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Battery className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">Battery</span>
                  </div>
                  <p className="text-2xl font-black text-purple-600">
                    {formatEnergy(hasChanges ? userSelection.batteryKWh : recommendation.batteryKWh)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPower(hasChanges ? userSelection.batteryKW : recommendation.batteryKW)} × {hasChanges ? userSelection.durationHours : recommendation.durationHours}h
                  </p>
                </div>

                {/* Energy Production */}
                <div className="bg-white rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">Energy</span>
                  </div>
                  {(hasChanges ? userSelection.solarKW : recommendation.solarKW) > 0 && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-500" /> Solar
                      </span>
                      <span className="font-bold text-amber-600">
                        {formatPower(hasChanges ? userSelection.solarKW : recommendation.solarKW)}
                      </span>
                    </div>
                  )}
                  {(hasChanges ? userSelection.generatorKW : recommendation.generatorKW) > 0 && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-slate-500" /> Generator
                      </span>
                      <span className="font-bold text-slate-600">
                        {formatPower(hasChanges ? userSelection.generatorKW : recommendation.generatorKW)}
                      </span>
                    </div>
                  )}
                  {(hasChanges ? userSelection.windKW : recommendation.windKW) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Wind className="w-3 h-3 text-sky-500" /> Wind
                      </span>
                      <span className="font-bold text-sky-600">
                        {formatPower(hasChanges ? userSelection.windKW : recommendation.windKW)}
                      </span>
                    </div>
                  )}
                  {(hasChanges ? userSelection.solarKW : recommendation.solarKW) === 0 && 
                   (hasChanges ? userSelection.generatorKW : recommendation.generatorKW) === 0 && 
                   (hasChanges ? userSelection.windKW : recommendation.windKW) === 0 && (
                    <p className="text-sm text-gray-400">No renewable energy</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Note - if user has made changes */}
        {hasChanges && !impact.isMatch && (
          <div className="rounded-xl p-2.5 mb-3 text-white transition-all bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-600">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  {impact.isWorse 
                    ? `⚠️ ${formatCurrency(impact.savingsLoss, recommendation.currency)}/yr less savings`
                    : 'Modified'
                  }
                </span>
              </div>
              <button
                onClick={onAcceptRecommendation}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-white/90 text-amber-700 font-semibold rounded-md transition-colors shadow-sm text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* DYNAMIC Configuration Grid - Shows user selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {/* 1. Energy Production - Solar */}
          {(recommendation.solarKW > 0 || userSelection.solarKW > 0) && (
            <ConfigCard
              icon={Sun}
              label="SOLAR"
              colorClass="amber"
              userValue={userSelection.solarKW}
              recValue={recommendation.solarKW}
              unit="kW"
              subtext={`~${Math.round((hasChanges ? userSelection.solarKW : recommendation.solarKW) * 4.5)} kWh/day`}
              hasChanges={hasChanges && userSelection.solarKW !== recommendation.solarKW}
            />
          )}

          {/* 2. Energy Production - Wind */}
          {(recommendation.windKW > 0 || userSelection.windKW > 0) && (
            <ConfigCard
              icon={Wind}
              label="WIND"
              colorClass="sky"
              userValue={userSelection.windKW}
              recValue={recommendation.windKW}
              unit="kW"
              subtext={`~${Math.round((hasChanges ? userSelection.windKW : recommendation.windKW) * 6)} kWh/day`}
              hasChanges={hasChanges && userSelection.windKW !== recommendation.windKW}
            />
          )}

          {/* 3. Energy Production - Generator */}
          {(recommendation.generatorKW > 0 || userSelection.generatorKW > 0) && (
            <ConfigCard
              icon={Fuel}
              label="GENERATOR"
              colorClass="slate"
              userValue={userSelection.generatorKW}
              recValue={recommendation.generatorKW}
              unit="kW"
              subtext="Backup power"
              hasChanges={hasChanges && userSelection.generatorKW !== recommendation.generatorKW}
            />
          )}

          {/* 4. Storage - BESS */}
          <ConfigCard
            icon={Battery}
            label="BESS"
            colorClass="purple"
            userValue={userSelection.batteryKWh}
            recValue={recommendation.batteryKWh}
            unit="kWh"
            subtext={`${formatPower(hasChanges ? userSelection.batteryKW : recommendation.batteryKW)} × ${hasChanges ? userSelection.durationHours : recommendation.durationHours}h`}
            hasChanges={hasChanges && userSelection.batteryKWh !== recommendation.batteryKWh}
          />
        </div>

        {/* Equipment Summary (collapsed by default) */}
        {expanded && (
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Equipment Included
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Power Conversion (PCS)</span>
                <span className="font-medium">{formatPower(recommendation.pcsKW)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transformer</span>
                <span className="font-medium">{recommendation.transformerKVA} kVA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Switchgear</span>
                <span className="font-medium">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DC/AC Panels</span>
                <span className="font-medium">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BMS & Controls</span>
                <span className="font-medium">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monitoring</span>
                <span className="font-medium">Included</span>
              </div>
            </div>
          </div>
        )}

        {/* Details Toggle - Only when not accepted */}
        {onToggleExpanded && !impact.isMatch && (
          <div className="flex justify-center">
            <button
              onClick={onToggleExpanded}
              className="px-6 py-2 bg-white border-2 border-purple-200 hover:border-purple-400 rounded-xl font-medium text-purple-700 flex items-center gap-1 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expanded ? 'Hide Details' : 'Show Equipment Details'}
            </button>
          </div>
        )}

        {/* Status Message - Dynamic feedback (only when not accepted) */}
        {hasChanges && !impact.isMatch && (
          <div className="mt-4 p-3 rounded-lg flex items-center gap-3 bg-purple-100 border border-purple-300">
            {impact.isWorse ? (
              <>
                <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <p className="text-sm text-purple-700">
                  Your selections may reduce savings by <strong>{formatCurrency(impact.savingsLoss, recommendation.currency)}/year</strong>. 
                  Click "Accept Optimal Settings" above to maximize your returns.
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <p className="text-sm text-purple-700">
                  Your selections look good! Review sections below to fine-tune, or accept the configuration above.
                </p>
              </>
            )}
          </div>
        )}

        {/* Section Numbers Guide */}
        {!impact.isMatch && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Review and customize in the numbered sections below ↓
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MerlinRecommendationPanel;
