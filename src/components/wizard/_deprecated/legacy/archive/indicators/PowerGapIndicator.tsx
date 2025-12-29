/**
 * PowerGapIndicator Component
 * 
 * Displays the gap between peak demand and configured power sources.
 * Used in wizard header and configuration sections.
 * 
 * Data Flow:
 * - centralizedState.calculated.totalPeakDemandKW → Peak demand
 * - centralizedState.goals.desiredBatteryKW → Battery capacity
 * - centralizedState.goals.desiredSolarKW → Solar capacity
 * - centralizedState.goals.desiredGeneratorKW → Generator capacity
 */

import React from 'react';
import { Zap, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Info } from 'lucide-react';

export interface PowerGapIndicatorProps {
  /** Total peak demand in kW from facility calculations */
  peakDemandKW: number;
  /** Configured battery capacity in kW */
  batteryKW: number;
  /** Configured solar capacity in kW */
  solarKW: number;
  /** Configured generator capacity in kW */
  generatorKW: number;
  /** Grid connection status */
  gridConnection?: 'on-grid' | 'unreliable' | 'expensive' | 'limited' | 'off-grid';
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
  /** Compact mode for header display */
  compact?: boolean;
  /** Optional click handler to open configuration */
  onConfigureClick?: () => void;
}

interface PowerGapStatus {
  gap: number;
  percentage: number;
  status: 'covered' | 'partial' | 'uncovered' | 'excess';
  message: string;
  color: string;
  bgColor: string;
  icon: typeof Zap;
}

function calculatePowerGapStatus(
  peakDemandKW: number,
  batteryKW: number,
  solarKW: number,
  generatorKW: number,
  gridConnection: string
): PowerGapStatus {
  const totalConfigured = batteryKW + solarKW + generatorKW;
  const gap = peakDemandKW - totalConfigured;
  const percentage = peakDemandKW > 0 ? (totalConfigured / peakDemandKW) * 100 : 0;
  
  // For on-grid, the grid covers gaps
  const isOnGrid = gridConnection === 'on-grid';
  
  if (peakDemandKW === 0) {
    return {
      gap: 0,
      percentage: 0,
      status: 'uncovered',
      message: 'Enter facility details to calculate power needs',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      icon: Info
    };
  }
  
  if (gap <= 0) {
    return {
      gap: Math.abs(gap),
      percentage,
      status: 'excess',
      message: `Fully covered with ${Math.abs(gap).toFixed(0)} kW excess capacity`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    };
  }
  
  if (percentage >= 80) {
    return {
      gap,
      percentage,
      status: 'partial',
      message: isOnGrid 
        ? `${percentage.toFixed(0)}% covered, grid provides ${gap.toFixed(0)} kW`
        : `${percentage.toFixed(0)}% covered, need ${gap.toFixed(0)} kW more`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: TrendingUp
    };
  }
  
  if (percentage >= 50) {
    return {
      gap,
      percentage,
      status: 'partial',
      message: isOnGrid
        ? `${percentage.toFixed(0)}% covered, consider adding capacity`
        : `Only ${percentage.toFixed(0)}% covered! Add ${gap.toFixed(0)} kW`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: AlertTriangle
    };
  }
  
  return {
    gap,
    percentage,
    status: 'uncovered',
    message: isOnGrid
      ? `Only ${percentage.toFixed(0)}% configured - mostly grid dependent`
      : `Critical: Only ${percentage.toFixed(0)}% covered!`,
    color: percentage > 0 ? 'text-red-500' : 'text-gray-500',
    bgColor: percentage > 0 ? 'bg-red-100' : 'bg-gray-100',
    icon: percentage > 0 ? TrendingDown : Zap
  };
}

export function PowerGapIndicator({
  peakDemandKW,
  batteryKW,
  solarKW,
  generatorKW,
  gridConnection = 'on-grid',
  showDetails = false,
  compact = false,
  onConfigureClick
}: PowerGapIndicatorProps) {
  const status = calculatePowerGapStatus(peakDemandKW, batteryKW, solarKW, generatorKW, gridConnection);
  const Icon = status.icon;
  const totalConfigured = batteryKW + solarKW + generatorKW;
  
  // Compact mode for header
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={onConfigureClick}
        title={status.message}
      >
        <Icon className={`w-4 h-4 ${status.color}`} />
        <span className={`text-sm font-medium ${status.color}`}>
          {peakDemandKW > 0 ? (
            status.status === 'excess' || status.percentage >= 100 
              ? '✓ Covered' 
              : `${status.percentage.toFixed(0)}%`
          ) : (
            'Power Gap'
          )}
        </span>
      </div>
    );
  }
  
  // Full indicator with optional details
  return (
    <div className={`rounded-lg p-4 ${status.bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${status.color}`} />
          <span className={`font-semibold ${status.color}`}>
            Power Gap Status
          </span>
        </div>
        {onConfigureClick && (
          <button
            onClick={onConfigureClick}
            className={`text-sm ${status.color} hover:underline`}
          >
            Configure →
          </button>
        )}
      </div>
      
      {/* Message */}
      <p className={`text-sm ${status.color} mb-3`}>
        {status.message}
      </p>
      
      {/* Progress Bar */}
      <div className="h-3 bg-white/50 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-500 ${
            status.status === 'excess' ? 'bg-green-500' :
            status.status === 'partial' && status.percentage >= 80 ? 'bg-yellow-500' :
            status.status === 'partial' ? 'bg-orange-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, status.percentage)}%` }}
        />
      </div>
      
      {/* Stats Row */}
      <div className="flex justify-between text-xs text-gray-600">
        <span>Configured: {totalConfigured.toFixed(0)} kW</span>
        <span>Peak Demand: {peakDemandKW.toFixed(0)} kW</span>
      </div>
      
      {/* Detailed Breakdown */}
      {showDetails && totalConfigured > 0 && (
        <div className="mt-4 pt-4 border-t border-white/30 space-y-2">
          <p className="text-xs font-medium text-gray-700 mb-2">Power Source Breakdown:</p>
          
          {batteryKW > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded-sm" />
                Battery (BESS)
              </span>
              <span className="font-medium">{batteryKW.toFixed(0)} kW</span>
            </div>
          )}
          
          {solarKW > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-500 rounded-sm" />
                Solar PV
              </span>
              <span className="font-medium">{solarKW.toFixed(0)} kW</span>
            </div>
          )}
          
          {generatorKW > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-500 rounded-sm" />
                Generator
              </span>
              <span className="font-medium">{generatorKW.toFixed(0)} kW</span>
            </div>
          )}
          
          {status.gap > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-300 rounded-sm" />
                {gridConnection === 'on-grid' ? 'Grid (covers gap)' : 'Uncovered Gap'}
              </span>
              <span className="font-medium">{status.gap.toFixed(0)} kW</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PowerGapIndicator;
