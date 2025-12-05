/**
 * WIZARD POWER PROFILE - Shared Header Component
 * ===============================================
 * 
 * Displays real-time power profile metrics in wizard headers:
 * - Peak Demand (kW)
 * - Energy Storage (kWh → MWh → GWh auto-scale)
 * - Duration (hours)
 * - Monthly Usage (kWh)
 * 
 * THIS IS A SHARED COMPONENT - Used by ALL vertical wizards:
 * - CarWashWizard
 * - EVChargingWizard
 * - HotelWizard
 * - (Future: HospitalWizard, OfficeWizard, etc.)
 * 
 * ARCHITECTURE NOTES:
 * - Display only - no calculations here
 * - Data comes from parent wizard's state (calculated via unifiedQuoteCalculator)
 * - Compact mode for mobile, full mode for desktop
 * 
 * Version: 1.0.0
 * Date: December 2025
 */

import React from 'react';
import { Battery, Zap, Clock, Activity, TrendingUp, Sun, Wind, Fuel } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

export interface PowerProfileData {
  // Core power metrics
  peakDemandKW: number;
  totalStorageKWh: number;
  durationHours: number;
  monthlyUsageKWh?: number;
  
  // Optional renewable sources
  solarKW?: number;
  windKW?: number;
  generatorKW?: number;
  
  // Optional financial preview
  estimatedAnnualSavings?: number;
  estimatedPaybackYears?: number;
}

export interface WizardPowerProfileProps {
  data: PowerProfileData;
  compact?: boolean;
  showRenewables?: boolean;
  showFinancials?: boolean;
  colorScheme?: 'cyan' | 'purple' | 'emerald' | 'amber';
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format energy value with auto-scaling (kWh → MWh → GWh)
 */
function formatEnergy(kwh: number): { value: string; unit: string } {
  if (kwh >= 1_000_000) {
    return { value: (kwh / 1_000_000).toFixed(1), unit: 'GWh' };
  }
  if (kwh >= 1_000) {
    return { value: (kwh / 1_000).toFixed(1), unit: 'MWh' };
  }
  return { value: kwh.toLocaleString(), unit: 'kWh' };
}

/**
 * Format power value with auto-scaling (kW → MW → GW)
 */
function formatPower(kw: number): { value: string; unit: string } {
  if (kw >= 1_000_000) {
    return { value: (kw / 1_000_000).toFixed(1), unit: 'GW' };
  }
  if (kw >= 1_000) {
    return { value: (kw / 1_000).toFixed(1), unit: 'MW' };
  }
  return { value: kw.toLocaleString(), unit: 'kW' };
}

/**
 * Format currency with K/M suffix
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

// ============================================
// COLOR SCHEMES
// ============================================

const COLOR_SCHEMES = {
  cyan: {
    bg: 'from-cyan-500/20 to-teal-500/20',
    border: 'border-cyan-400/30',
    text: 'text-cyan-400',
    label: 'text-cyan-200/70',
    icon: 'text-cyan-400',
  },
  purple: {
    bg: 'from-purple-500/20 to-violet-500/20',
    border: 'border-purple-400/30',
    text: 'text-purple-400',
    label: 'text-purple-200/70',
    icon: 'text-purple-400',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-400/30',
    text: 'text-emerald-400',
    label: 'text-emerald-200/70',
    icon: 'text-emerald-400',
  },
  amber: {
    bg: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-400/30',
    text: 'text-amber-400',
    label: 'text-amber-200/70',
    icon: 'text-amber-400',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function WizardPowerProfile({
  data,
  compact = false,
  showRenewables = true,
  showFinancials = false,
  colorScheme = 'cyan',
  className = '',
}: WizardPowerProfileProps) {
  const colors = COLOR_SCHEMES[colorScheme];
  const storage = formatEnergy(data.totalStorageKWh);
  const peakDemand = formatPower(data.peakDemandKW);
  const monthlyUsage = data.monthlyUsageKWh ? formatEnergy(data.monthlyUsageKWh) : null;
  
  // Calculate if there are any renewable sources
  const hasRenewables = (data.solarKW && data.solarKW > 0) || 
                        (data.windKW && data.windKW > 0) || 
                        (data.generatorKW && data.generatorKW > 0);
  
  // ============================================
  // COMPACT MODE (Mobile / Narrow)
  // ============================================
  if (compact) {
    return (
      <div className={`bg-gradient-to-r ${colors.bg} rounded-lg px-3 py-2 border ${colors.border} ${className}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Peak Demand */}
          <div className="flex items-center gap-1.5">
            <Zap className={`w-4 h-4 ${colors.icon}`} />
            <span className={`text-sm font-bold ${colors.text}`}>
              {peakDemand.value} {peakDemand.unit}
            </span>
          </div>
          
          {/* Energy Storage - Main highlight */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">
              {storage.value} {storage.unit}
            </span>
            {data.durationHours > 0 && (
              <span className="text-xs text-white/60">
                ({data.durationHours}hr)
              </span>
            )}
          </div>
          
          {/* Monthly Usage (if available) */}
          {monthlyUsage && (
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300">
                {monthlyUsage.value} {monthlyUsage.unit}/mo
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // ============================================
  // FULL MODE (Desktop)
  // ============================================
  return (
    <div className={`bg-gradient-to-r ${colors.bg} rounded-xl p-4 border ${colors.border} ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Battery className={`w-5 h-5 ${colors.icon}`} />
        <span className="text-sm font-medium text-white">Your Power Profile</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Peak Demand */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className={`w-4 h-4 ${colors.icon}`} />
            <span className={`text-xs ${colors.label}`}>Peak Demand</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-white">{peakDemand.value}</span>
            <span className={`text-sm ${colors.text}`}>{peakDemand.unit}</span>
          </div>
        </div>
        
        {/* Energy Storage - Main highlight */}
        <div className="text-center bg-white/5 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-200/70">Energy Storage</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-emerald-400">{storage.value}</span>
            <span className="text-sm text-emerald-300">{storage.unit}</span>
          </div>
        </div>
        
        {/* Duration */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className={`w-4 h-4 ${colors.icon}`} />
            <span className={`text-xs ${colors.label}`}>Duration</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-white">{data.durationHours}</span>
            <span className={`text-sm ${colors.text}`}>hours</span>
          </div>
        </div>
        
        {/* Monthly Usage */}
        {monthlyUsage ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-200/70">Monthly Usage</span>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-purple-400">{monthlyUsage.value}</span>
              <span className="text-sm text-purple-300">{monthlyUsage.unit}</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-200/70">Capacity</span>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-amber-400">
                {(data.totalStorageKWh / data.durationHours).toFixed(0)}
              </span>
              <span className="text-sm text-amber-300">kW</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Renewable Sources (optional) */}
      {showRenewables && hasRenewables && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-4 flex-wrap">
            {data.solarKW && data.solarKW > 0 && (
              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white">{formatPower(data.solarKW).value}</span>
                <span className="text-xs text-amber-300">{formatPower(data.solarKW).unit} Solar</span>
              </div>
            )}
            {data.windKW && data.windKW > 0 && (
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-400" />
                <span className="text-sm text-white">{formatPower(data.windKW).value}</span>
                <span className="text-xs text-sky-300">{formatPower(data.windKW).unit} Wind</span>
              </div>
            )}
            {data.generatorKW && data.generatorKW > 0 && (
              <div className="flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-white">{formatPower(data.generatorKW).value}</span>
                <span className="text-xs text-orange-300">{formatPower(data.generatorKW).unit} Generator</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Financial Preview (optional) */}
      {showFinancials && (data.estimatedAnnualSavings || data.estimatedPaybackYears) && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-around">
          {data.estimatedAnnualSavings && (
            <div className="text-center">
              <span className="text-xs text-emerald-200/70 block">Est. Annual Savings</span>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(data.estimatedAnnualSavings)}
              </span>
            </div>
          )}
          {data.estimatedPaybackYears && (
            <div className="text-center">
              <span className="text-xs text-purple-200/70 block">Est. Payback</span>
              <span className="text-lg font-bold text-purple-400">
                {data.estimatedPaybackYears.toFixed(1)} years
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { formatEnergy, formatPower, formatCurrency };
